import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, Printer, Check, Plus, Trash2, Copy } from 'lucide-react';
import { fetchContract, fetchOrderLines, getAccumulatedForLine, getNextBMNumber, fetchBM, fetchBMLines, saveBMWithLines, fetchActivePedido, fetchBMs } from '@/services/contractService';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { generateBMPdf } from '@/lib/pdfGenerator';

// Interface para o rascunho da linha no BM
interface DraftLine {
  uid: string; // ID único temporário para gerenciar a lista no frontend
  orderLineId: string;
  qtd: number;
  centroCusto: string;
  descricaoBm: string;
}

interface ComputedBMLine extends DraftLine {
  linha: string;
  descricao: string;
  unidade: string;
  quantidadeContratada: number;
  valorUnitario: number;
  valorTotalContrato: number;
  acumuladoAnteriorQtd: number;
  acumuladoAnteriorValor: number;
  medidoAtualQtd: number; // Valor que o PDF precisa
  medidoAtualValor: number;
  acumuladoTotalQtd: number;
  acumuladoTotalValor: number;
  saldoQtd: number;
  saldoValor: number;
  execucaoPercent: number;
}

export default function BMForm() {
  const { id: contractId, bmId } = useParams<{ id: string; bmId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contract, setContract] = useState<any>(null);
  const [activePedido, setActivePedido] = useState<any>(null);
  const [orderLines, setOrderLines] = useState<any[]>([]);
  const [allBms, setAllBms] = useState<any[]>([]);
  
  // Mudança: Usamos um Array de rascunhos em vez de um Set
  const [drafts, setDrafts] = useState<DraftLine[]>([]);

  const [bmNumero, setBmNumero] = useState(1);
  const [existingBmId, setExistingBmId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isNew = bmId === 'novo';

  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().slice(0, 10));
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [accumulatedMap, setAccumulatedMap] = useState<Record<string, { qtd: number; valor: number }>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [c, pedido] = await Promise.all([
          fetchContract(contractId!),
          fetchActivePedido(contractId!),
        ]);
        setContract(c);
        setActivePedido(pedido);

        const ol = pedido ? await fetchOrderLines(contractId!, pedido.id) : [];
        setOrderLines(ol);

        // Carregar histórico de todos os BMs para o Quadro de Controle do PDF
        const bmsList = await fetchBMs(contractId!);
        setAllBms(bmsList);

        if (isNew) {
          const num = await getNextBMNumber(contractId!);
          setBmNumero(num);
          const accMap: Record<string, { qtd: number; valor: number }> = {};
          for (const line of ol) {
            accMap[line.id] = await getAccumulatedForLine(contractId!, line.id);
          }
          setAccumulatedMap(accMap);
          setDrafts([]); // Começa vazio
        } else {
          const bm = await fetchBM(bmId!);
          const lines = await fetchBMLines(bmId!);
          setBmNumero(bm.numero);
          setExistingBmId(bm.id);
          setDataEmissao(bm.data_emissao);
          setPeriodoInicio(bm.periodo_inicio);
          setPeriodoFim(bm.periodo_fim);

          // Converte linhas salvas para o formato de Rascunho
          const initialDrafts: DraftLine[] = lines.map(l => ({
            uid: crypto.randomUUID(),
            orderLineId: l.order_line_id,
            qtd: Number(l.medido_atual_qtd),
            centroCusto: l.centro_custo || '',
            descricaoBm: (l as any).descricao_bm || '',
          }));
          setDrafts(initialDrafts);

          const accMap: Record<string, { qtd: number; valor: number }> = {};
          for (const line of ol) {
            accMap[line.id] = await getAccumulatedForLine(contractId!, line.id, bm.numero);
          }
          setAccumulatedMap(accMap);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [contractId, bmId, isNew]);

  // Adiciona uma nova linha vazia baseada no pedido selecionado
  const handleAddLine = (orderLineId: string) => {
    const orderLine = orderLines.find(ol => ol.id === orderLineId);
    if (!orderLine) return;
    
    setDrafts(prev => [...prev, {
      uid: crypto.randomUUID(),
      orderLineId,
      qtd: 0,
      centroCusto: '',
      descricaoBm: ''
    }]);
  };

  // Clona uma linha já existente na lista de rascunhos
  const handleCloneLine = (draft: DraftLine) => {
    setDrafts(prev => [...prev, {
      uid: crypto.randomUUID(),
      orderLineId: draft.orderLineId,
      qtd: draft.qtd,
      centroCusto: draft.centroCusto,
      descricaoBm: draft.descricaoBm
    }]);
  };

  // Remove uma linha da lista
  const handleRemoveLine = (uid: string) => {
    setDrafts(prev => prev.filter(d => d.uid !== uid));
  };

  const updateDraft = (uid: string, values: Partial<DraftLine>) => {
    setDrafts(prev => prev.map(d => d.uid === uid ? { ...d, ...values } : d));
  };

  const bmLines: ComputedBMLine[] = useMemo(() => {
    // Soma quantidades por orderLineId dentro do BM atual para validação de saldo
    const currentSums = drafts.reduce((acc, d) => {
      acc[d.orderLineId] = (acc[d.orderLineId] || 0) + d.qtd;
      return acc;
    }, {} as Record<string, number>);

    return drafts.map(draft => {
      const ol = orderLines.find(l => l.id === draft.orderLineId);
      if (!ol) return null as any;

      const acc = accumulatedMap[ol.id] || { qtd: 0, valor: 0 };
      const qtdNum = Number(ol.quantidade);
      const vuNum = Number(ol.valor_unitario);
      const valorTotal = qtdNum * vuNum;
      const medidoValor = draft.qtd * vuNum;
      
      // Cálculos baseados na SOMA total deste line_id no BM atual
      const totalMedidoAtualQtd = currentSums[ol.id];
      const totalMedidoAtualValor = totalMedidoAtualQtd * vuNum;

      const acumuladoTotalQtd = acc.qtd + totalMedidoAtualQtd;
      const acumuladoTotalValor = acc.valor + totalMedidoAtualValor;
      
      const saldoQtd = qtdNum - acumuladoTotalQtd;
      const saldoValor = valorTotal - acumuladoTotalValor;
      const execPercent = qtdNum > 0 ? (acumuladoTotalQtd / qtdNum) * 100 : 0;

      return {
        ...draft,
        linha: ol.linha,
        descricao: ol.descricao,
        unidade: ol.unidade,
        quantidadeContratada: qtdNum,
        valorUnitario: vuNum,
        valorTotalContrato: valorTotal,
        acumuladoAnteriorQtd: acc.qtd,
        acumuladoAnteriorValor: acc.valor,
        medidoAtualQtd: draft.qtd, // CORREÇÃO AQUI: Garante que o PDF receba o valor correto
        medidoAtualValor: medidoValor,
        acumuladoTotalQtd,
        acumuladoTotalValor,
        saldoQtd,
        saldoValor,
        execucaoPercent: execPercent,
      };
    }).filter(Boolean);
  }, [orderLines, drafts, accumulatedMap]);

  const totalBM = bmLines.reduce((s, l) => s + l.medidoAtualValor, 0);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    // Validação por grupo de linha (para não deixar passar duplicatas que excedem o saldo)
    const groupValidation = new Map<string, number>();
    drafts.forEach(d => {
      const current = groupValidation.get(d.orderLineId) || 0;
      groupValidation.set(d.orderLineId, current + d.qtd);
    });

    groupValidation.forEach((totalQtd, orderLineId) => {
      const line = orderLines.find(ol => ol.id === orderLineId);
      if (!line) return;
      const acc = accumulatedMap[orderLineId]?.qtd || 0;
      const contrato = Number(line.quantidade);
      if (acc + totalQtd > contrato) {
        errors.push(`Linha ${line.linha}: A soma das medições (${acc + totalQtd}) excede o contrato (${contrato})`);
      }
    });

    if (drafts.length === 0) errors.push('Adicione ao menos uma linha');
    if (!periodoInicio || !periodoFim) errors.push('Período é obrigatório');
    return errors;
  }, [drafts, orderLines, accumulatedMap, periodoInicio, periodoFim]);

  const handleSave = async (status: 'rascunho' | 'finalizado') => {
    if (!user) return;
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }
    setSaving(true);
    try {
      await saveBMWithLines(
        {
          id: existingBmId,
          contract_id: contractId!,
          numero: bmNumero,
          data_emissao: dataEmissao,
          periodo_inicio: periodoInicio,
          periodo_fim: periodoFim,
          valor_total: totalBM,
          status,
        },
        bmLines.map(l => ({
          order_line_id: l.orderLineId,
          linha: l.linha,
          descricao: l.descricao,
          descricao_bm: l.descricaoBm,
          unidade: l.unidade,
          quantidade_contratada: l.quantidadeContratada,
          valor_unitario: l.valorUnitario,
          valor_total_contrato: l.valorTotalContrato,
          acumulado_anterior_qtd: l.acumuladoAnteriorQtd,
          acumulado_anterior_valor: l.acumuladoAnteriorValor,
          medido_atual_qtd: l.qtd,
          medido_atual_valor: l.medidoAtualValor,
          acumulado_total_qtd: l.acumuladoTotalQtd,
          acumulado_total_valor: l.acumuladoTotalValor,
          saldo_qtd: l.saldoQtd,
          saldo_valor: l.saldoValor,
          execucao_percent: l.execucaoPercent,
          centro_custo: l.centroCusto,
        })),
        user.id
      );
      navigate(`/contrato/${contractId}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar BM');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!contract) return;
    const bm = {
      id: existingBmId || 'preview',
      contractId: contractId!,
      numero: bmNumero,
      dataEmissao,
      periodoInicio,
      periodoFim,
      valorTotal: totalBM,
      linhas: bmLines,
      status: 'rascunho' as const,
    };
    const contractForPdf = {
      id: contract.id,
      numero: contract.numero,
      fornecedor: contract.fornecedor,
      cnpj: contract.cnpj || '',
      objeto: contract.objeto || '',
      tipo: contract.tipo as 'servico' | 'locacao',
      tipoLabel: contract.tipo_label,
      valorTotal: Number(contract.valor_total),
      dataInicio: contract.data_inicio,
      dataFim: contract.data_fim,
      numeroPedido: activePedido?.numero || '',
    };
    
    // Passa o histórico de BMs (allBms) como terceiro parâmetro
    generateBMPdf(bm, contractForPdf, allBms);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Carregando...</div>;
  if (!contract) return <div className="flex items-center justify-center min-h-screen">Contrato não encontrado</div>;

  const availableLines = orderLines;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate(`/contrato/${contractId}`)} className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao contrato
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-primary-foreground">
                {isNew ? 'Novo Boletim de Medição' : `Boletim de Medição Nº ${String(bmNumero).padStart(3, '0')}`}
              </h1>
              <p className="text-xs text-primary-foreground/70">{contract.fornecedor} · Contrato {contract.numero}</p>
              {activePedido && <p className="text-xs text-primary-foreground/60">Pedido Nº {activePedido.numero}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Imprimir PDF
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleSave('rascunho')} disabled={saving} className="gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5" /> Salvar Rascunho
              </Button>
              <Button size="sm" onClick={() => handleSave('finalizado')} disabled={saving} className="gap-1.5 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
                <Check className="w-3.5 h-3.5" /> Finalizar BM
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div><Label className="text-xs">BM Nº</Label><Input value={String(bmNumero).padStart(3, '0')} readOnly className="mt-1 text-xs font-mono bg-muted" /></div>
          <div><Label className="text-xs">Data Emissão</Label><Input type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)} className="mt-1 text-xs" /></div>
          <div><Label className="text-xs">Período Início</Label><Input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} className="mt-1 text-xs" /></div>
          <div><Label className="text-xs">Período Fim</Label><Input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className="mt-1 text-xs" /></div>
        </div>

        {/* Nova Seção: Adicionar Linhas */}
        <div className="flex items-end gap-2 mb-4 p-3 bg-muted/30 rounded border border-dashed">
          <div className="flex-1">
            <Label className="text-xs mb-1 block">Adicionar Linha do Pedido</Label>
            <Select onValueChange={handleAddLine}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecione uma linha para adicionar..." />
              </SelectTrigger>
              <SelectContent>
                {availableLines.map(ol => (
                  <SelectItem key={ol.id} value={ol.id} className="text-xs">
                    {ol.linha} - {ol.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground pb-1.5">
            Dica: Você pode adicionar a mesma linha várias vezes para dividir custos ou descrições.
          </div>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="table-header">
                  <th className="px-2 py-2.5 w-16 text-center">Ações</th>
                  <th className="px-2 py-2.5 text-left">Linha</th>
                  <th className="px-2 py-2.5 text-left">Desc. Pedido</th>
                  <th className="px-2 py-2.5 text-left bg-accent/20">Desc. BM (PDF)</th>
                  <th className="px-2 py-2.5 text-center">Unid.</th>
                  <th className="px-2 py-2.5 text-right">Qtd. Contr.</th>
                  <th className="px-2 py-2.5 text-right">Preço</th>
                  <th className="px-2 py-2.5 text-right">Vl. Total</th>
                  <th className="px-2 py-2.5 text-right">Acum. Ant. Qtd</th>
                  <th className="px-2 py-2.5 text-right">Acum. Ant. R$</th>
                  <th className="px-2 py-2.5 text-right bg-accent/20">Medido Qtd</th>
                  <th className="px-2 py-2.5 text-right">Medido R$</th>
                  <th className="px-2 py-2.5 text-right">Acum. Total</th>
                  <th className="px-2 py-2.5 text-right">Saldo</th>
                  <th className="px-2 py-2.5 text-right">Exec.%</th>
                  <th className="px-2 py-2.5 text-left">Centro Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bmLines.map((line) => (
                  <tr key={line.uid} className={`transition-colors hover:bg-muted/50`}>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleCloneLine(line)} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground" title="Clonar Linha">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleRemoveLine(line.uid)} className="p-1 hover:bg-destructive/10 hover:text-destructive rounded text-muted-foreground" title="Remover Linha">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2 font-mono font-medium">{line.linha}</td>
                    <td className="px-2 py-2 max-w-[150px] truncate text-muted-foreground">{line.descricao}</td>
                    <td className="px-2 py-2">
                      <Input
                        value={line.descricaoBm}
                        onChange={e => updateDraft(line.uid, { descricaoBm: e.target.value })}
                        className="w-40 text-xs h-7"
                        placeholder="Descrição para o PDF"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">{line.unidade}</td>
                    <td className="px-2 py-2 text-right font-mono">{line.quantidadeContratada}</td>
                    <td className="px-2 py-2 text-right font-mono">{formatCurrency(line.valorUnitario)}</td>
                    <td className="px-2 py-2 text-right font-mono">{formatCurrency(line.valorTotalContrato)}</td>
                    <td className="px-2 py-2 text-right font-mono">{line.acumuladoAnteriorQtd}</td>
                    <td className="px-2 py-2 text-right font-mono">{formatCurrency(line.acumuladoAnteriorValor)}</td>
                    <td className="px-2 py-2 text-right">
                      <Input 
                        type="number" 
                        min={0} 
                        value={line.qtd} 
                        onChange={e => updateDraft(line.uid, { qtd: parseFloat(e.target.value) || 0 })} 
                        className="w-20 text-xs text-right h-7 ml-auto" 
                      />
                    </td>
                    <td className="px-2 py-2 text-right font-mono">{formatCurrency(line.medidoAtualValor)}</td>
                    <td className="px-2 py-2 text-right font-mono">{formatCurrency(line.acumuladoTotalValor)}</td>
                    <td className="px-2 py-2 text-right font-mono">{formatCurrency(line.saldoValor)}</td>
                    <td className="px-2 py-2 text-right font-mono">{line.execucaoPercent.toFixed(0)}%</td>
                    <td className="px-2 py-2">
                      <Input 
                        value={line.centroCusto} 
                        onChange={e => updateDraft(line.uid, { centroCusto: e.target.value })} 
                        className="w-28 text-xs h-7" 
                        placeholder="Centro custo" 
                      />
                    </td>
                  </tr>
                ))}
                {bmLines.length === 0 && (
                  <tr>
                    <td colSpan={16} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma linha adicionada. Selecione acima para começar.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold text-xs">
                  <td colSpan={8} className="px-2 py-2.5 text-right">TOTAL GERAL</td>
                  <td className="px-2 py-2.5"></td>
                  <td className="px-2 py-2.5 text-right font-mono">{formatCurrency(bmLines.reduce((s, l) => s + l.acumuladoAnteriorValor, 0))}</td>
                  <td className="px-2 py-2.5"></td>
                  <td className="px-2 py-2.5 text-right font-mono">{formatCurrency(totalBM)}</td>
                  <td className="px-2 py-2.5 text-right font-mono">{formatCurrency(bmLines.reduce((s, l) => s + l.acumuladoTotalValor, 0))}</td>
                  <td className="px-2 py-2.5 text-right font-mono">{formatCurrency(bmLines.reduce((s, l) => s + l.saldoValor, 0))}</td>
                  <td className="px-2 py-2.5"></td>
                  <td className="px-2 py-2.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-4 p-4 bg-card rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Valor da Medição</p>
              <p className="stat-value text-accent">{formatCurrency(totalBM)}</p>
            </div>
            {validationErrors.length > 0 && (
              <div className="text-xs text-destructive space-y-0.5 text-right">
                {validationErrors.map((e, i) => <p key={i}>⚠ {e}</p>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}