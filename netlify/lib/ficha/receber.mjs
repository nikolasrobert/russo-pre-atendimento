// Controller da ficha pública: valida, grava no Supabase, sobe as fotos, cria o card no Trello e pede o aviso.
// Ordem pensada para não perder cliente: a ficha é gravada primeiro; Trello e aviso podem falhar sem apagar nada.
import { lerFichaDoSite, primeiroErro, ARQUIVOS } from './site.mjs';
import { pontuar } from '../painel/pontuacao.mjs';
import { textoDoCard } from '../trello.mjs';
import { avisoDaFicha, enviarAviso } from '../avisos.mjs';

export const MAX_ARQUIVOS = 12;
export const MAX_BYTES = 4.5 * 1024 * 1024;  // por arquivo, depois da compressão no celular
const TIPOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif', 'image/gif': 'gif' };
export const BUCKET = 'fichas';

/**
 * @param {FormData} form
 * @param {{ db, trello?, env, origem: string, agora?: number, uuid?: () => string, fetch?, log? }} deps
 * @returns {Promise<{ status: number, corpo: object }>}
 */
export async function receberFicha(form, { db, trello = null, env, origem, agora = Date.now(), uuid = () => crypto.randomUUID(), fetch = globalThis.fetch, log = console }) {
  // honeypot: robô preenche o campo escondido, gente não. Responde ok e não grava.
  if (String(form.get('site') || '').trim()) return { status: 200, corpo: { ok: true } };

  let respostas;
  try { respostas = JSON.parse(String(form.get('respostas') || '[]')); } catch { return { status: 400, corpo: { erro: 'Respostas inválidas.' } }; }
  if (!Array.isArray(respostas) || !respostas.length) return { status: 400, corpo: { erro: 'Ficha vazia.' } };

  // arquivos aceitos, por tipo
  const arquivos = [];
  for (const [chave, valor] of form.entries()) {
    if (!chave.startsWith('arquivo:') || typeof valor === 'string') continue;
    const tipo = ARQUIVOS[chave.slice('arquivo:'.length)];
    if (!tipo || !TIPOS[valor.type] || valor.size > MAX_BYTES || valor.size === 0) continue;
    if (arquivos.length >= MAX_ARQUIVOS) break;
    arquivos.push({ tipo, arquivo: valor });
  }
  const contagem = arquivos.reduce((c, a) => ({ ...c, [a.tipo]: (c[a.tipo] || 0) + 1 }), {});

  const { dados, erros, semFotoDaCobertura } = lerFichaDoSite(respostas, { fotos: contagem, agora });
  if (Object.keys(erros).length) return { status: 422, corpo: { erro: primeiroErro(erros), campos: Object.keys(erros) } };

  const nota = pontuar(dados.ficha, { semFotoDaCobertura });
  const fichaId = uuid();

  // 1. cliente (o mesmo @ atualiza o cadastro em vez de duplicar) e ficha
  const [cliente] = await db.rest('/clientes?on_conflict=estudio_id,instagram', {
    metodo: 'POST',
    corpo: [{ ...dados.cliente, estudio_id: env.ESTUDIO_ID }],
    prefer: 'resolution=merge-duplicates,return=representation',
  });
  const ficha = { ...dados.ficha, ...nota, id: fichaId, cliente_id: cliente.id, estudio_id: env.ESTUDIO_ID, tatuador_id: env.TATUADOR_ID };
  await db.rest('/fichas', { metodo: 'POST', corpo: [ficha], prefer: 'return=minimal' });

  // 2. fotos no Storage (bucket privado) e a lista na tabela fotos
  const fotos = [];
  for (const [i, a] of arquivos.entries()) {
    const caminho = `${fichaId}/${a.tipo}-${i + 1}.${TIPOS[a.arquivo.type]}`;
    try {
      await db.enviarArquivo(BUCKET, caminho, await a.arquivo.arrayBuffer(), a.arquivo.type);
      fotos.push({ ficha_id: fichaId, caminho, tipo: a.tipo });
    } catch (e) {
      log.error('foto não subiu', caminho, e.message);
    }
  }
  if (fotos.length) await db.rest('/fotos', { metodo: 'POST', corpo: fotos, prefer: 'return=minimal' });

  // 3. card no Trello
  let cardUrl = '';
  if (trello && env.TRELLO_LISTA_NOVAS) {
    try {
      const etiqueta = env[`TRELLO_ETIQUETA_${nota.temperatura.toUpperCase()}`];
      const { nome, descricao } = textoDoCard({
        ficha,
        cliente: dados.cliente,
        fotos: fotos.map((f) => ({ tipo: f.tipo, url: `${origem}/arquivo/${f.caminho}` })),
        linkPainel: `${origem}/painel/fichas/${fichaId}`,
      });
      const card = await trello.criarCard({ idList: env.TRELLO_LISTA_NOVAS, nome, descricao, idLabels: etiqueta ? [etiqueta] : [] });
      cardUrl = card.shortUrl || card.url || '';
      await db.rest(`/fichas?id=eq.${fichaId}`, { metodo: 'PATCH', corpo: { trello_card_id: card.id, trello_card_url: cardUrl }, prefer: 'return=minimal' });
    } catch (e) {
      log.error('card do Trello não foi criado', fichaId, e.message);
    }
  }

  // 4. aviso no WhatsApp, pelo n8n
  const aviso = await enviarAviso(avisoDaFicha({ ficha, cliente: dados.cliente, cardUrl }), { url: env.N8N_WEBHOOK_URL, token: env.AVISO_TOKEN, fetch });
  if (!aviso.enviado) log.error('aviso não saiu', fichaId, aviso.motivo);

  return { status: 200, corpo: { ok: true, id: fichaId } };
}
