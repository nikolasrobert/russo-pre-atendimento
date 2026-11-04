// Banco em memória, com a mesma interface do SupabaseStore.
// Usado nos testes e no modo de demonstração (PAINEL_DEMO=1), quando não há Supabase configurado.
import { randomUUID } from 'node:crypto';

const copia = (o) => (o == null ? o : structuredClone(o));

export class MemoriaStore {
  constructor({ clientes = [], fichas = [] } = {}) {
    this.clientes = clientes.map(copia);
    this.fichas = fichas.map(copia);
  }

  montar(f) {
    const cliente = this.clientes.find((c) => c.id === f.cliente_id);
    return copia({ ...f, cliente });
  }

  async listarFichas({ status, temperatura, regiao, busca } = {}) {
    const termo = String(busca || '').toLowerCase().replace(/^@/, '').trim();
    return this.fichas
      .map((f) => this.montar(f))
      .filter((f) => !status || f.status === status)
      .filter((f) => !temperatura || f.temperatura === temperatura)
      .filter((f) => !regiao || f.cliente.regiao === regiao)
      .filter((f) => !termo || f.cliente.nome.toLowerCase().includes(termo) || f.cliente.instagram.toLowerCase().includes(termo))
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  }

  async buscarFicha(id) {
    const f = this.fichas.find((x) => x.id === id);
    return f ? this.montar(f) : null;
  }

  async salvarCliente(cliente) {
    let c = this.clientes.find((x) => x.instagram === cliente.instagram);
    if (c) Object.assign(c, cliente);
    else this.clientes.push((c = { id: randomUUID(), criado_em: new Date().toISOString(), ...cliente }));
    return copia(c);
  }

  async inserirFicha(ficha) {
    const agora = new Date().toISOString();
    const f = { id: randomUUID(), criado_em: agora, atualizado_em: agora, ...ficha };
    this.fichas.push(f);
    return copia(f);
  }

  async atualizarFicha(id, ficha) {
    const f = this.fichas.find((x) => x.id === id);
    if (!f) return null;
    Object.assign(f, ficha, { atualizado_em: new Date().toISOString() });
    return copia(f);
  }

  async excluirFicha(id) {
    const antes = this.fichas.length;
    this.fichas = this.fichas.filter((x) => x.id !== id);
    return this.fichas.length < antes;
  }
}

// dados fictícios para a demonstração
export function exemplos() {
  const dia = 86400000;
  const quando = (dias) => new Date(Date.now() - dias * dia).toISOString();
  const clientes = [
    { id: 'c1', nome: 'Ana Exemplo', instagram: 'ana.exemplo', whatsapp: '27900000001', cidade: 'Vitória', regiao: 'grande_vitoria' },
    { id: 'c2', nome: 'Bruno Exemplo', instagram: 'bruno.exemplo', whatsapp: '27900000002', cidade: 'Serra', regiao: 'grande_vitoria' },
    { id: 'c3', nome: 'Carla Exemplo', instagram: 'carla.exemplo', whatsapp: '31900000003', cidade: 'Belo Horizonte', regiao: 'fora' },
  ];
  const base = { cor: 'Preto e cinza', cobertura: false, tem_referencia: false, observacoes: null, valor_orcamento: null, data_limite: null, indicado_por: null };
  const fichas = [
    { ...base, id: '00000000-0000-4000-8000-000000000301', cliente_id: 'c1', experiencia: 'Você já me tatuou', ideia: 'Uma serpente em ornamental subindo pelo antebraço, fechando no punho.', local_corpo: 'Antebraço (interno)', tamanho: '10 a 15 cm', faixa_investimento: 'R$ 2.000 a 4.000', prazo: 'Nos próximos 30 dias', origem: 'Indicação', indicado_por: 'Carla', tem_foto_local: true, pontuacao: 11, temperatura: 'quente', motivos: '+3 já é cliente · +2 veio por indicação · +2 mandou foto do local · +3 faixa alta · +1 quer nos próximos 30 dias', status: 'novo', criado_em: quando(1), atualizado_em: quando(1) },
    { ...base, id: '00000000-0000-4000-8000-000000000302', cliente_id: 'c2', experiencia: 'É a primeira', ideia: 'Quero algo na costela.', local_corpo: 'Costela', tamanho: 'Fechamento (braço · perna · costas)', cor: 'Confio em você', faixa_investimento: 'Até R$ 500', prazo: 'Sem pressa · quero fazer bem feito', origem: 'Instagram', tem_foto_local: false, pontuacao: -3, temperatura: 'fria', motivos: '-1 ideia vaga · -2 orçamento x tamanho incompatível', status: 'novo', criado_em: quando(3), atualizado_em: quando(3) },
    { ...base, id: '00000000-0000-4000-8000-000000000303', cliente_id: 'c3', experiencia: 'Tenho uma ou duas', ideia: 'Lettering com o nome da minha avó na lateral da mão, letra fina.', local_corpo: 'Mão', tamanho: 'Até 5 cm', faixa_investimento: 'R$ 1.000 a 2.000', prazo: 'Nos próximos 30 dias', origem: 'Instagram', tem_foto_local: true, pontuacao: 5, temperatura: 'morna', motivos: '+2 mandou foto do local · +2 faixa média · +1 quer nos próximos 30 dias', status: 'orcamento_enviado', valor_orcamento: 650, criado_em: quando(6), atualizado_em: quando(2) },
  ];
  return { clientes, fichas };
}
