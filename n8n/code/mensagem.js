// === Avisos no WhatsApp · monta a mensagem (WhatsApp Cloud API da Meta ou Evolution API) ===
// Entrada: o que a função do Netlify manda (tipo "ficha" ou "resumo", já com os parâmetros prontos).
// Saída: 1 item com enviar (sim/não), a URL da API e o corpo da mensagem.

const CFG = {
  WA_PROVEDOR: 'meta',     // 'meta' (WhatsApp Cloud API) ou 'evolution' (Evolution API)
  EVO_URL: '',             // Evolution: endereço do servidor, ex.: https://evo.seudominio.com
  EVO_INSTANCIA: '',       // Evolution: nome da instância conectada ao número de teste
  EVO_VERSAO: 'v2',        // Evolution: 'v2' (padrão) ou 'v1'
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

const texto = String(corpo.texto || '').slice(0, 4000);
let url, waBody;
if (envGet('WA_PROVEDOR') === 'evolution') {
  // Evolution API: texto livre, sem modelo da Meta. Autenticação: cabeçalho apikey na credencial do n8n.
  url = String(envGet('EVO_URL') || '').replace(/\/$/, '') + '/message/sendText/' + encodeURIComponent(envGet('EVO_INSTANCIA') || '');
  waBody = envGet('EVO_VERSAO') === 'v1' ? { number: para, textMessage: { text: texto } } : { number: para, text: texto };
} else {
  url = 'https://graph.facebook.com/' + envGet('WA_API_VERSION') + '/' + envGet('WA_PHONE_NUMBER_ID') + '/messages';
  waBody = modo === 'texto'
    ? { messaging_product: 'whatsapp', to: para, type: 'text', text: { preview_url: false, body: texto } }
    : { messaging_product: 'whatsapp', to: para, type: 'template', template: { name: MODELO, language: { code: 'pt_BR' }, components: componentes } };
}

return [{ json: { enviar, url, waBody, tipo } }];
