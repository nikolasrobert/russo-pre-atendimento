// Acesso ao Supabase pela API REST (PostgREST), só com fetch. Roda no servidor, com a chave de serviço.

const CAMPOS = [
  'id', 'experiencia', 'ideia', 'local_corpo', 'tamanho', 'cor', 'cobertura', 'faixa_investimento', 'prazo',
  'data_limite', 'origem', 'indicado_por', 'tem_foto_local', 'tem_referencia', 'pontuacao', 'temperatura',
  'motivos', 'status', 'valor_orcamento', 'observacoes', 'criado_em', 'atualizado_em',
].join(',');
const SELECT = `${CAMPOS},cliente:clientes!inner(id,nome,instagram,whatsapp,cidade,regiao)`;

// tira da busca os caracteres que têm significado na sintaxe do PostgREST
const limparBusca = (s) => String(s).replace(/[^\p{L}\p{N} ._@-]/gu, '').trim().slice(0, 60);

export class SupabaseStore {
  constructor({ url, chave, estudioId, tatuadorId, fetch = globalThis.fetch }) {
    if (!url || !chave || !estudioId || !tatuadorId) throw new Error('Supabase não configurado');
    this.base = url.replace(/\/$/, '') + '/rest/v1';
    this.chave = chave;
    this.estudioId = estudioId;
    this.tatuadorId = tatuadorId;
    this.fetch = fetch;
  }

  async pedir(caminho, { metodo = 'GET', corpo, prefer } = {}) {
    const r = await this.fetch(`${this.base}${caminho}`, {
      method: metodo,
      headers: {
        apikey: this.chave,
        authorization: `Bearer ${this.chave}`,
        'content-type': 'application/json',
        ...(prefer ? { prefer } : {}),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      const detalhe = await r.text().catch(() => '');
      throw new Error(`Supabase ${r.status}: ${detalhe.slice(0, 300)}`);
    }
    return r.status === 204 ? null : r.json();
  }

  async listarFichas({ status, temperatura, regiao, busca } = {}) {
    const q = new URLSearchParams({ select: SELECT, estudio_id: `eq.${this.estudioId}`, order: 'criado_em.desc', limit: '200' });
    if (status) q.set('status', `eq.${status}`);
    if (temperatura) q.set('temperatura', `eq.${temperatura}`);
    if (regiao) q.set('cliente.regiao', `eq.${regiao}`);
    const termo = busca ? limparBusca(busca) : '';
    if (termo) q.set('cliente.or', `(nome.ilike.*${termo}*,instagram.ilike.*${termo.replace(/^@/, '')}*)`);
    return this.pedir(`/fichas?${q}`);
  }

  async buscarFicha(id) {
    const q = new URLSearchParams({ select: SELECT, id: `eq.${id}`, estudio_id: `eq.${this.estudioId}` });
    const linhas = await this.pedir(`/fichas?${q}`);
    return linhas[0] || null;
  }

  async salvarCliente(cliente) {
    const q = new URLSearchParams({ on_conflict: 'estudio_id,instagram' });
    const [salvo] = await this.pedir(`/clientes?${q}`, {
      metodo: 'POST',
      corpo: [{ ...cliente, estudio_id: this.estudioId }],
      prefer: 'resolution=merge-duplicates,return=representation',
    });
    return salvo;
  }

  async inserirFicha(ficha) {
    const [salva] = await this.pedir('/fichas', {
      metodo: 'POST',
      corpo: [{ ...ficha, estudio_id: this.estudioId, tatuador_id: this.tatuadorId }],
      prefer: 'return=representation',
    });
    return salva;
  }

  async atualizarFicha(id, ficha) {
    const q = new URLSearchParams({ id: `eq.${id}`, estudio_id: `eq.${this.estudioId}` });
    const linhas = await this.pedir(`/fichas?${q}`, { metodo: 'PATCH', corpo: ficha, prefer: 'return=representation' });
    return linhas[0] || null;
  }

  async excluirFicha(id) {
    const q = new URLSearchParams({ id: `eq.${id}`, estudio_id: `eq.${this.estudioId}` });
    const linhas = await this.pedir(`/fichas?${q}`, { metodo: 'DELETE', prefer: 'return=representation' });
    return linhas.length > 0;
  }
}
