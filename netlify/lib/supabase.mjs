// Cliente mínimo do Supabase, só com fetch: banco (PostgREST) e Storage.
// Roda só no servidor, com a chave de serviço. A chave vai no cabeçalho, nunca na URL.

export class Supabase {
  constructor({ url, chave, fetch = globalThis.fetch }) {
    if (!url || !chave) throw new Error('Supabase não configurado');
    this.url = url.replace(/\/$/, '');
    this.chave = chave;
    this.fetch = fetch;
  }

  cabecalhos(extra = {}) {
    // a chave antiga (JWT, começa com "eyJ") vai nos dois cabeçalhos; a nova (sb_secret_…) só no apikey
    const h = { apikey: this.chave, ...extra };
    if (this.chave.startsWith('eyJ')) h.authorization = `Bearer ${this.chave}`;
    return h;
  }

  async erro(r) {
    const detalhe = await r.text().catch(() => '');
    return new Error(`Supabase ${r.status}: ${detalhe.slice(0, 300)}`);
  }

  // caminho = '/fichas?select=…'
  async rest(caminho, { metodo = 'GET', corpo, prefer } = {}) {
    const r = await this.fetch(`${this.url}/rest/v1${caminho}`, {
      method: metodo,
      headers: this.cabecalhos({ 'content-type': 'application/json', ...(prefer ? { prefer } : {}) }),
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw await this.erro(r);
    // com prefer: return=minimal o Supabase responde 201 sem corpo
    if (r.status === 204) return null;
    if (typeof r.text !== 'function') return r.json();
    const texto = await r.text();
    return texto ? JSON.parse(texto) : null;
  }

  async enviarArquivo(bucket, caminho, bytes, tipo) {
    const r = await this.fetch(`${this.url}/storage/v1/object/${bucket}/${caminho}`, {
      method: 'POST',
      headers: this.cabecalhos({ 'content-type': tipo, 'x-upsert': 'false' }),
      body: bytes,
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw await this.erro(r);
    return caminho;
  }

  // link temporário para um arquivo do bucket privado
  async urlAssinada(bucket, caminho, segundos = 300) {
    const r = await this.fetch(`${this.url}/storage/v1/object/sign/${bucket}/${caminho}`, {
      method: 'POST',
      headers: this.cabecalhos({ 'content-type': 'application/json' }),
      body: JSON.stringify({ expiresIn: segundos }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw await this.erro(r);
    const { signedURL } = await r.json();
    return `${this.url}/storage/v1${signedURL}`;
  }
}
