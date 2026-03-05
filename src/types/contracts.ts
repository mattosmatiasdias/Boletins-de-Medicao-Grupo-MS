export interface Contract {
  id: string;
  numero: string;
  fornecedor: string;
  cnpj: string;
  objeto: string;
  tipo: 'servico' | 'locacao';
  tipoLabel: string;
  valorTotal: number;
  dataInicio: string;
  dataFim: string;
  numeroPedido: string;
}

export interface OrderLine {
  id: string;
  contractId: string;
  linha: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
}

export interface BMLine {
  orderLineId: string;
  linha: string;
  descricao: string;
  unidade: string;
  quantidadeContratada: number;
  valorUnitario: number;
  valorTotalContrato: number;
  acumuladoAnteriorQtd: number;
  acumuladoAnteriorValor: number;
  medidoAtualQtd: number;
  medidoAtualValor: number;
  acumuladoTotalQtd: number;
  acumuladoTotalValor: number;
  saldoQtd: number;
  saldoValor: number;
  execucaoPercent: number;
  centroCusto: string;
}

export interface BoletimMedicao {
  id: string;
  contractId: string;
  numero: number;
  dataEmissao: string;
  periodoInicio: string;
  periodoFim: string;
  valorTotal: number;
  linhas: BMLine[];
  status: 'rascunho' | 'finalizado';
}
