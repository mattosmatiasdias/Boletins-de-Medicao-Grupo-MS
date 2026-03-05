import { Contract, OrderLine, BoletimMedicao } from '@/types/contracts';

const CONTRACTS_KEY = 'contracts_data';
const ORDERS_KEY = 'orders_data';
const BMS_KEY = 'bms_data';

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Seed data
const seedContracts: Contract[] = [
  {
    id: '1', numero: '21.754.639/0001-32', fornecedor: 'Focus Locação, Transporte e Serviços LTDA',
    cnpj: '21.754.639/0001-32', objeto: 'Contratação de empresa especializada para locação de equipamento: 01 ônibus capacidade 48 lugares em modalidade ADM sem motorista para transporte dos colaboradores OGMO/ESTIVA na CDP Hydro OP, PORT.',
    tipo: 'locacao', tipoLabel: 'Prestação de Serviços', valorTotal: 184404.00,
    dataInicio: '2025-09-27', dataFim: '2026-09-27', numeroPedido: 'MS.181.2025.9,202'
  },
  {
    id: '2', numero: 'CT-2024-002', fornecedor: 'Engenharia Silva & Associados LTDA',
    cnpj: '12.345.678/0001-90', objeto: 'Serviços de manutenção predial e reparos diversos nas instalações do terminal portuário.',
    tipo: 'servico', tipoLabel: 'Manutenção Predial', valorTotal: 350000.00,
    dataInicio: '2024-06-01', dataFim: '2025-06-01', numeroPedido: 'PD-2024-055'
  },
  {
    id: '3', numero: 'CT-2025-003', fornecedor: 'Transportes Rápidos do Norte LTDA',
    cnpj: '98.765.432/0001-10', objeto: 'Locação de veículos utilitários para operação logística.',
    tipo: 'locacao', tipoLabel: 'Locação de Veículos', valorTotal: 96000.00,
    dataInicio: '2025-01-15', dataFim: '2026-01-15', numeroPedido: 'PD-2025-012'
  },
];

const seedOrders: OrderLine[] = [
  { id: 'ol1', contractId: '1', linha: '1', descricao: 'Locação de 01 ônibus com capacidade 48 lugares em modalidade ADM sem motorista - MENSAL FRANQUIA 1,500', unidade: 'Unit/Mês', quantidade: 12, valorUnitario: 13000.00 },
  { id: 'ol2', contractId: '1', linha: '1.1', descricao: 'Locação de 01 ônibus com capacidade 48 lugares em modalidade ADM sem motorista - KM EXCEDENTE. FRANQUIA 1,500 KM/MÊS', unidade: 'Km', quantidade: 1200, valorUnitario: 8.67 },
  { id: 'ol3', contractId: '1', linha: '1.2', descricao: 'Manutenções/reparos diversos', unidade: 'Vb', quantidade: 12, valorUnitario: 1500.00 },
  { id: 'ol4', contractId: '2', linha: '1', descricao: 'Manutenção elétrica preventiva', unidade: 'Mês', quantidade: 12, valorUnitario: 15000.00 },
  { id: 'ol5', contractId: '2', linha: '2', descricao: 'Manutenção hidráulica corretiva', unidade: 'Sv', quantidade: 24, valorUnitario: 5000.00 },
  { id: 'ol6', contractId: '3', linha: '1', descricao: 'Locação de veículo utilitário tipo pick-up', unidade: 'Mês', quantidade: 12, valorUnitario: 5500.00 },
  { id: 'ol7', contractId: '3', linha: '2', descricao: 'Locação de van 16 lugares', unidade: 'Mês', quantidade: 12, valorUnitario: 2500.00 },
];

const seedBMs: BoletimMedicao[] = [
  {
    id: 'bm1', contractId: '1', numero: 1, dataEmissao: '2025-10-27',
    periodoInicio: '2025-09-27', periodoFim: '2025-10-27', valorTotal: 13000.00, status: 'finalizado',
    linhas: [
      { orderLineId: 'ol1', linha: '1', descricao: 'Locação de 01 ônibus - MENSAL', unidade: 'Unit/Mês', quantidadeContratada: 12, valorUnitario: 13000, valorTotalContrato: 156000, acumuladoAnteriorQtd: 0, acumuladoAnteriorValor: 0, medidoAtualQtd: 1, medidoAtualValor: 13000, acumuladoTotalQtd: 1, acumuladoTotalValor: 13000, saldoQtd: 11, saldoValor: 143000, execucaoPercent: 8.33, centroCusto: '4600010560' },
    ]
  },
  {
    id: 'bm2', contractId: '1', numero: 2, dataEmissao: '2025-11-27',
    periodoInicio: '2025-10-28', periodoFim: '2025-11-27', valorTotal: 13000.00, status: 'finalizado',
    linhas: [
      { orderLineId: 'ol1', linha: '1', descricao: 'Locação de 01 ônibus - MENSAL', unidade: 'Unit/Mês', quantidadeContratada: 12, valorUnitario: 13000, valorTotalContrato: 156000, acumuladoAnteriorQtd: 1, acumuladoAnteriorValor: 13000, medidoAtualQtd: 1, medidoAtualValor: 13000, acumuladoTotalQtd: 2, acumuladoTotalValor: 26000, saldoQtd: 10, saldoValor: 130000, execucaoPercent: 16.67, centroCusto: '4600010560' },
    ]
  },
  {
    id: 'bm3', contractId: '1', numero: 3, dataEmissao: '2025-12-27',
    periodoInicio: '2025-11-28', periodoFim: '2025-12-27', valorTotal: 13000.00, status: 'finalizado',
    linhas: [
      { orderLineId: 'ol1', linha: '1', descricao: 'Locação de 01 ônibus - MENSAL', unidade: 'Unit/Mês', quantidadeContratada: 12, valorUnitario: 13000, valorTotalContrato: 156000, acumuladoAnteriorQtd: 2, acumuladoAnteriorValor: 26000, medidoAtualQtd: 1, medidoAtualValor: 13000, acumuladoTotalQtd: 3, acumuladoTotalValor: 39000, saldoQtd: 9, saldoValor: 117000, execucaoPercent: 25, centroCusto: '4600010560' },
    ]
  },
  {
    id: 'bm4', contractId: '1', numero: 4, dataEmissao: '2026-01-27',
    periodoInicio: '2025-12-28', periodoFim: '2026-01-27', valorTotal: 13000.00, status: 'finalizado',
    linhas: [
      { orderLineId: 'ol1', linha: '1', descricao: 'Locação de 01 ônibus - MENSAL', unidade: 'Unit/Mês', quantidadeContratada: 12, valorUnitario: 13000, valorTotalContrato: 156000, acumuladoAnteriorQtd: 3, acumuladoAnteriorValor: 39000, medidoAtualQtd: 1, medidoAtualValor: 13000, acumuladoTotalQtd: 4, acumuladoTotalValor: 52000, saldoQtd: 8, saldoValor: 104000, execucaoPercent: 33.33, centroCusto: '4600010560' },
    ]
  },
  {
    id: 'bm5', contractId: '1', numero: 5, dataEmissao: '2026-02-27',
    periodoInicio: '2026-01-27', periodoFim: '2026-02-26', valorTotal: 14699.32, status: 'finalizado',
    linhas: [
      { orderLineId: 'ol1', linha: '1', descricao: 'Locação de 01 ônibus com capacidade 48 lugares em modalidade ADM sem motorista - MENSAL FRANQUIA 1,500', unidade: 'Unit/Mês', quantidadeContratada: 12, valorUnitario: 13000, valorTotalContrato: 156000, acumuladoAnteriorQtd: 4, acumuladoAnteriorValor: 52000, medidoAtualQtd: 1, medidoAtualValor: 13000, acumuladoTotalQtd: 5, acumuladoTotalValor: 65000, saldoQtd: 7, saldoValor: 91000, execucaoPercent: 42, centroCusto: '4600010560' },
      { orderLineId: 'ol2', linha: '1.1', descricao: 'Locação de 01 ônibus - KM EXCEDENTE. FRANQUIA 1,500 KM/MÊS', unidade: 'Km', quantidadeContratada: 1200, valorUnitario: 8.67, valorTotalContrato: 10404, acumuladoAnteriorQtd: 0, acumuladoAnteriorValor: 0, medidoAtualQtd: 0, medidoAtualValor: 0, acumuladoTotalQtd: 0, acumuladoTotalValor: 0, saldoQtd: 1200, saldoValor: 10404, execucaoPercent: 0, centroCusto: '4600010560' },
      { orderLineId: 'ol3', linha: '1.2', descricao: 'Manutenções/reparos diversos', unidade: 'Vb', quantidadeContratada: 12, valorUnitario: 1500, valorTotalContrato: 18000, acumuladoAnteriorQtd: 0, acumuladoAnteriorValor: 0, medidoAtualQtd: 0, medidoAtualValor: 0, acumuladoTotalQtd: 0, acumuladoTotalValor: 0, saldoQtd: 12, saldoValor: 18000, execucaoPercent: 0, centroCusto: '4600010560' },
    ]
  },
];

export function getContracts(): Contract[] {
  return load<Contract>(CONTRACTS_KEY, seedContracts);
}

export function getContract(id: string): Contract | undefined {
  return getContracts().find(c => c.id === id);
}

export function saveContract(contract: Contract) {
  const contracts = getContracts();
  const idx = contracts.findIndex(c => c.id === contract.id);
  if (idx >= 0) contracts[idx] = contract;
  else contracts.push(contract);
  save(CONTRACTS_KEY, contracts);
}

export function getOrderLines(contractId: string): OrderLine[] {
  return load<OrderLine>(ORDERS_KEY, seedOrders).filter(o => o.contractId === contractId);
}

export function getAllOrderLines(): OrderLine[] {
  return load<OrderLine>(ORDERS_KEY, seedOrders);
}

export function saveOrderLine(line: OrderLine) {
  const lines = getAllOrderLines();
  const idx = lines.findIndex(l => l.id === line.id);
  if (idx >= 0) lines[idx] = line;
  else lines.push(line);
  save(ORDERS_KEY, lines);
}

export function deleteOrderLine(id: string) {
  const lines = getAllOrderLines().filter(l => l.id !== id);
  save(ORDERS_KEY, lines);
}

export function getBMs(contractId: string): BoletimMedicao[] {
  return load<BoletimMedicao>(BMS_KEY, seedBMs).filter(b => b.contractId === contractId);
}

export function getAllBMs(): BoletimMedicao[] {
  return load<BoletimMedicao>(BMS_KEY, seedBMs);
}

export function getBM(id: string): BoletimMedicao | undefined {
  return getAllBMs().find(b => b.id === id);
}

export function saveBM(bm: BoletimMedicao) {
  const bms = getAllBMs();
  const idx = bms.findIndex(b => b.id === bm.id);
  if (idx >= 0) bms[idx] = bm;
  else bms.push(bm);
  save(BMS_KEY, bms);
}

export function getAccumulatedForLine(contractId: string, orderLineId: string, beforeBmNumero?: number): { qtd: number; valor: number } {
  const bms = getBMs(contractId).filter(b => b.status === 'finalizado' && (beforeBmNumero === undefined || b.numero < beforeBmNumero));
  let qtd = 0, valor = 0;
  for (const bm of bms) {
    for (const l of bm.linhas) {
      if (l.orderLineId === orderLineId) {
        qtd += l.medidoAtualQtd;
        valor += l.medidoAtualValor;
      }
    }
  }
  return { qtd, valor };
}

export function getNextBMNumber(contractId: string): number {
  const bms = getBMs(contractId);
  if (bms.length === 0) return 1;
  return Math.max(...bms.map(b => b.numero)) + 1;
}
