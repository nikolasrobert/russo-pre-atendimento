// === Avisos no WhatsApp · monta a mensagem da API da Meta ===
// Entrada: o que a função do Netlify manda (tipo "ficha" ou "resumo", já com os parâmetros prontos).
// Saída: 1 item com enviar (sim/não), a URL da API e o corpo da mensagem.

const CFG = {
  WA_PHONE_NUMBER_ID: '',
  WA_PARA: '',             // quem recebe, só dígitos com 55 + DDD
  WA_API_VERSION: 'v23.0',
  WA_MODO: 'modelo',       // 'texto' no teste com o número de teste da Meta (janela de 24h)
  WA_AVISAR_TODAS: 'nao',  // 'sim' na demonstração: avisa toda ficha, não só as quentes
};
const envGet = (k) => { let v; try { v = $env[k]; } catch (e) {} return (v !== undefined && v !== '') ? v : CFG[k]; };

const corpo = ($input.first().json && $input.first().json.body) || {};
const tipo = corpo.tipo === 'resumo' ? 'resumo' : 'ficha';
const params = Array.isArray(corpo.params) ? corpo.params.map(String) : [];
const modo = envGet('WA_MODO') === 'texto' ? 'texto' : 'modelo';
const para = String(envGet('WA_PARA') || '').replace(/\D/g, '');

const avisarTodas = envGet('WA_AVISAR_TODAS') === 'sim';
const enviar = !!para && (tipo === 'resumo' || corpo.temperatura === 'quente' || avisarTodas);

const MODELO = tipo === 'resumo' ? 'resumo_diario' : 'ficha_quente';
const componentes = [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: t })) }];
if (corpo.botao) componentes.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: String(corpo.botao) }] });

const waBody = modo === 'texto'
  ? { messaging_product: 'whatsapp', to: para, type: 'text', text: { preview_url: false, body: String(corpo.texto || '').slice(0, 4000) } }
  : { messaging_product: 'whatsapp', to: para, type: 'template', template: { name: MODELO, language: { code: 'pt_BR' }, components: componentes } };

return [{
  json: {
    enviar,
    url: 'https://graph.facebook.com/' + envGet('WA_API_VERSION') + '/' + envGet('WA_PHONE_NUMBER_ID') + '/messages',
    waBody,
    tipo,
  },
}];
