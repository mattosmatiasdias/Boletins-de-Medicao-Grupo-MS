import { supabase } from '@/integrations/supabase/client';

// Contracts
export async function fetchContracts() {
  const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchContract(id: string) {
  const { data, error } = await supabase.from('contracts').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createContract(contract: {
  numero: string; fornecedor: string; cnpj: string; objeto: string;
  tipo: string; tipo_label: string; valor_total: number;
  data_inicio: string; data_fim: string;
}, userId: string) {
  const { data, error } = await supabase.from('contracts').insert({ ...contract, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

// Pedidos
export async function fetchPedidos(contractId: string) {
  const { data, error } = await supabase.from('pedidos').select('*').eq('contract_id', contractId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchActivePedido(contractId: string) {
  const { data, error } = await supabase.from('pedidos').select('*').eq('contract_id', contractId).eq('status', 'ativo').limit(1).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createPedido(pedido: {
  contract_id: string; numero: string;
}, userId: string) {
  // Deactivate all existing pedidos for this contract
  await supabase.from('pedidos').update({ status: 'inativo' } as any).eq('contract_id', pedido.contract_id);
  
  const { data, error } = await supabase.from('pedidos').insert({ ...pedido, status: 'ativo', user_id: userId } as any).select().single();
  if (error) throw error;
  return data;
}

export async function setActivePedido(pedidoId: string, contractId: string) {
  await supabase.from('pedidos').update({ status: 'inativo' } as any).eq('contract_id', contractId);
  const { error } = await supabase.from('pedidos').update({ status: 'ativo' } as any).eq('id', pedidoId);
  if (error) throw error;
}

// Order Lines
export async function fetchOrderLines(contractId: string, pedidoId?: string) {
  let query = supabase.from('order_lines').select('*').eq('contract_id', contractId).order('linha');
  if (pedidoId) {
    query = query.eq('pedido_id', pedidoId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createOrderLine(line: {
  contract_id: string; pedido_id: string; linha: string; descricao: string;
  unidade: string; quantidade: number; valor_unitario: number;
}, userId: string) {
  const { data, error } = await supabase.from('order_lines').insert({ ...line, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteOrderLine(id: string) {
  const { error } = await supabase.from('order_lines').delete().eq('id', id);
  if (error) throw error;
}

// Boletins de Medição
export async function fetchBMs(contractId: string) {
  const { data, error } = await supabase.from('boletins_medicao').select('*').eq('contract_id', contractId).order('numero', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchBM(id: string) {
  const { data, error } = await supabase.from('boletins_medicao').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function fetchBMLines(bmId: string) {
  const { data, error } = await supabase.from('bm_lines').select('*').eq('bm_id', bmId).order('linha');
  if (error) throw error;
  return data || [];
}

export async function getNextBMNumber(contractId: string): Promise<number> {
  const { data } = await supabase.from('boletins_medicao').select('numero').eq('contract_id', contractId).order('numero', { ascending: false }).limit(1);
  if (data && data.length > 0) return (data[0] as any).numero + 1;
  return 1;
}

export async function getAccumulatedForLine(contractId: string, orderLineId: string, beforeBmNumero?: number) {
  const bmQuery = supabase
    .from('boletins_medicao')
    .select('id')
    .eq('contract_id', contractId)
    .eq('status', 'finalizado');

  if (beforeBmNumero !== undefined) {
    bmQuery.lt('numero', beforeBmNumero);
  }

  const { data: bms } = await bmQuery;
  if (!bms || bms.length === 0) return { qtd: 0, valor: 0 };

  const bmIds = bms.map((b: any) => b.id);
  const { data: lines } = await supabase
    .from('bm_lines')
    .select('medido_atual_qtd, medido_atual_valor')
    .eq('order_line_id', orderLineId)
    .in('bm_id', bmIds);

  let qtd = 0, valor = 0;
  if (lines) {
    for (const l of lines) {
      qtd += Number((l as any).medido_atual_qtd) || 0;
      valor += Number((l as any).medido_atual_valor) || 0;
    }
  }
  return { qtd, valor };
}

export async function saveBMWithLines(
  bm: {
    id?: string;
    contract_id: string;
    numero: number;
    data_emissao: string;
    periodo_inicio: string;
    periodo_fim: string;
    valor_total: number;
    status: string;
  },
  lines: Array<{
    order_line_id: string;
    linha: string;
    descricao: string;
    descricao_bm: string;
    unidade: string;
    quantidade_contratada: number;
    valor_unitario: number;
    valor_total_contrato: number;
    acumulado_anterior_qtd: number;
    acumulado_anterior_valor: number;
    medido_atual_qtd: number;
    medido_atual_valor: number;
    acumulado_total_qtd: number;
    acumulado_total_valor: number;
    saldo_qtd: number;
    saldo_valor: number;
    execucao_percent: number;
    centro_custo: string;
  }>,
  userId: string
) {
  let bmId = bm.id;

  if (bmId) {
    const { error } = await supabase.from('boletins_medicao').update({
      data_emissao: bm.data_emissao,
      periodo_inicio: bm.periodo_inicio,
      periodo_fim: bm.periodo_fim,
      valor_total: bm.valor_total,
      status: bm.status,
    }).eq('id', bmId);
    if (error) throw error;

    await supabase.from('bm_lines').delete().eq('bm_id', bmId);
  } else {
    const { data, error } = await supabase.from('boletins_medicao').insert({
      ...bm,
      user_id: userId,
    }).select().single();
    if (error) throw error;
    bmId = (data as any).id;
  }

  if (lines.length > 0) {
    const linesToInsert = lines.map(l => ({
      ...l,
      bm_id: bmId!,
      user_id: userId,
    }));
    const { error } = await supabase.from('bm_lines').insert(linesToInsert as any);
    if (error) throw error;
  }

  return bmId;
}
