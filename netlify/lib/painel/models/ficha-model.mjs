// Model das fichas: regras de negócio em cima do banco (Supabase ou memória).
// O controller nunca fala direto com o banco: passa sempre por aqui.
import { pontuar } from '../pontuacao.mjs';
import { STATUS, TEMPERATURAS, REGIOES } from '../opcoes.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class FichaModel {
  constructor(store) {
    this.store = store;
  }

  idValido(id) {
    return UUID.test(String(id || ''));
  }

  // só deixa passar filtros com valores conhecidos
  filtrosLimpos(q = {}) {
    return {
      status: Object.hasOwn(STATUS, q.status) ? q.status : '',
      temperatura: Object.hasOwn(TEMPERATURAS, q.temperatura) ? q.temperatura : '',
      regiao: Object.hasOwn(REGIOES, q.regiao) ? q.regiao : '',
      busca: String(q.busca || '').trim().slice(0, 60),
    };
  }

  async listar(filtros) {
    const fichas = await this.store.listarFichas(this.filtrosLimpos(filtros));
    // quentes primeiro, depois as mais novas
    const peso = { quente: 0, morna: 1, fria: 2 };
    return fichas.sort((a, b) => (peso[a.temperatura] - peso[b.temperatura]) || b.criado_em.localeCompare(a.criado_em));
  }

  async buscar(id) {
    if (!this.idValido(id)) return null;
    return this.store.buscarFicha(id);
  }

  async criar({ cliente, ficha }) {
    const c = await this.store.salvarCliente(cliente);
    const salva = await this.store.inserirFicha({ ...ficha, ...pontuar(ficha), cliente_id: c.id, canal: 'painel' });
    return salva;
  }

  async atualizar(id, { cliente, ficha }) {
    if (!this.idValido(id)) return null;
    const atual = await this.store.buscarFicha(id);
    if (!atual) return null;
    const c = await this.store.salvarCliente(cliente);
    return this.store.atualizarFicha(id, { ...ficha, ...pontuar(ficha), cliente_id: c.id });
  }

  async excluir(id) {
    if (!this.idValido(id)) return false;
    return this.store.excluirFicha(id);
  }

  // números do topo da lista
  resumo(fichas) {
    const abertas = fichas.filter((f) => !['fechado', 'perdido', 'arquivado'].includes(f.status));
    return {
      total: fichas.length,
      quentes: abertas.filter((f) => f.temperatura === 'quente').length,
      novas: fichas.filter((f) => f.status === 'novo').length,
    };
  }
}
