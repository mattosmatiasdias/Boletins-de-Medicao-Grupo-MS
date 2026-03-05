import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FileText, ClipboardList, Eye, Trash2, Package } from 'lucide-react';
import { fetchContract, fetchOrderLines, fetchBMs, createOrderLine, deleteOrderLine, getAccumulatedForLine, fetchPedidos, fetchActivePedido, createPedido, setActivePedido } from '@/services/contractService';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [activePedido, setActivePedidoState] = useState<any>(null);
  const [orderLines, setOrderLines] = useState<any[]>([]);
  const [bms, setBms] = useState<any[]>([]);
  const [accumulatedMap, setAccumulatedMap] = useState<Record<string, { qtd: number; valor: number }>>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newLine, setNewLine] = useState({ linha: '', descricao: '', unidade: '', quantidade: '', valorUnitario: '' });
  const [showNewPedido, setShowNewPedido] = useState(false);
  const [newPedidoNumero, setNewPedidoNumero] = useState('');

  const loadData = async () => {
    try {
      const [c, peds, b] = await Promise.all([
        fetchContract(id!),
        fetchPedidos(id!),
        fetchBMs(id!),
      ]);
      setContract(c);
      setPedidos(peds);
      setBms(b);

      const active = peds.find((p: any) => p.status === 'ativo') || null;
      setActivePedidoState(active);

      if (active) {
        const ol = await fetchOrderLines(id!, active.id);
        setOrderLines(ol);
        const accMap: Record<string, { qtd: number; valor: number }> = {};
        for (const line of ol) {
          accMap[line.id] = await getAccumulatedForLine(id!, line.id);
        }
        setAccumulatedMap(accMap);
      } else {
        setOrderLines([]);
        setAccumulatedMap({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleAddLine = async () => {
    if (!user || !activePedido) return;
    try {
      await createOrderLine({
        contract_id: id!,
        pedido_id: activePedido.id,
        linha: newLine.linha,
        descricao: newLine.descricao,
        unidade: newLine.unidade,
        quantidade: parseFloat(newLine.quantidade) || 0,
        valor_unitario: parseFloat(newLine.valorUnitario) || 0,
      }, user.id);
      setNewLine({ linha: '', descricao: '', unidade: '', quantidade: '', valorUnitario: '' });
      setAdding(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar linha');
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    try {
      await deleteOrderLine(lineId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePedido = async () => {
    if (!user || !newPedidoNumero.trim()) return;
    try {
      await createPedido({ contract_id: id!, numero: newPedidoNumero.trim() }, user.id);
      setNewPedidoNumero('');
      setShowNewPedido(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar pedido');
    }
  };

  const handleSetActivePedido = async (pedidoId: string) => {
    try {
      await setActivePedido(pedidoId, id!);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Carregando...</div>;
  if (!contract) return <div className="flex items-center justify-center min-h-screen">Contrato não encontrado</div>;

  const totalMedido = bms.reduce((s: number, b: any) => s + Number(b.valor_total), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar aos contratos
          </button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-primary-foreground">{contract.fornecedor}</h1>
                <Badge className="bg-accent text-accent-foreground text-xs">{contract.tipo_label}</Badge>
              </div>
              <p className="text-xs text-primary-foreground/70 font-mono">Contrato Nº {contract.numero}</p>
              {activePedido && <p className="text-xs text-primary-foreground/60 font-mono">Pedido Nº {activePedido.numero}</p>}
              <p className="text-xs text-primary-foreground/60 mt-1 max-w-2xl line-clamp-2">{contract.objeto}</p>
            </div>
            <Button onClick={() => navigate(`/contrato/${contract.id}/bm/novo`)} disabled={!activePedido} className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Gerar BM
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Valor Contrato', value: formatCurrency(Number(contract.valor_total)) },
            { label: 'Total Medido', value: formatCurrency(totalMedido) },
            { label: 'Saldo', value: formatCurrency(Number(contract.valor_total) - totalMedido) },
            { label: 'BMs Emitidos', value: bms.length },
            { label: 'Vigência', value: `${formatDate(contract.data_inicio)} — ${formatDate(contract.data_fim)}` },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-lg border p-3">
              <p className="stat-label">{stat.label}</p>
              <p className="text-sm font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="pedido">
          <TabsList className="mb-4">
            <TabsTrigger value="pedido" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Pedido</TabsTrigger>
            <TabsTrigger value="pedidos" className="gap-1.5"><Package className="w-3.5 h-3.5" /> Pedidos ({pedidos.length})</TabsTrigger>
            <TabsTrigger value="medicoes" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Medições ({bms.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pedido">
            {!activePedido ? (
              <div className="bg-card rounded-lg border p-8 text-center">
                <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Nenhum pedido ativo. Crie um pedido para adicionar linhas.</p>
                <Button onClick={() => setShowNewPedido(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="w-4 h-4 mr-2" /> Criar Pedido
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-lg border overflow-hidden">
                <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
                  <span className="text-xs font-medium">Pedido Nº {activePedido.numero} <Badge variant="default" className="ml-2 text-xs">Ativo</Badge></span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="table-header">
                        <th className="px-3 py-2.5 text-left">Linha</th>
                        <th className="px-3 py-2.5 text-left">Descrição</th>
                        <th className="px-3 py-2.5 text-center">Unid.</th>
                        <th className="px-3 py-2.5 text-right">Qtd.</th>
                        <th className="px-3 py-2.5 text-right">Vl. Unit.</th>
                        <th className="px-3 py-2.5 text-right">Vl. Total</th>
                        <th className="px-3 py-2.5 text-right">Acumulado</th>
                        <th className="px-3 py-2.5 text-right">Saldo</th>
                        <th className="px-3 py-2.5 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orderLines.map((line: any) => {
                        const acc = accumulatedMap[line.id] || { qtd: 0, valor: 0 };
                        const total = Number(line.quantidade) * Number(line.valor_unitario);
                        const saldo = Number(line.quantidade) - acc.qtd;
                        return (
                          <tr key={line.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-3 py-2.5 font-mono font-medium">{line.linha}</td>
                            <td className="px-3 py-2.5 max-w-xs truncate">{line.descricao}</td>
                            <td className="px-3 py-2.5 text-center">{line.unidade}</td>
                            <td className="px-3 py-2.5 text-right font-mono">{line.quantidade}</td>
                            <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(Number(line.valor_unitario))}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-medium">{formatCurrency(total)}</td>
                            <td className="px-3 py-2.5 text-right font-mono">{acc.qtd}</td>
                            <td className="px-3 py-2.5 text-right font-mono">{saldo}</td>
                            <td className="px-3 py-2.5 text-center">
                              <button onClick={() => handleDeleteLine(line.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {orderLines.length === 0 && (
                        <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Nenhuma linha cadastrada</td></tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-semibold">
                        <td colSpan={5} className="px-3 py-2.5 text-right">Total:</td>
                        <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(orderLines.reduce((s: number, l: any) => s + Number(l.quantidade) * Number(l.valor_unitario), 0))}</td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {adding ? (
                  <div className="p-3 border-t bg-muted/30">
                    <div className="grid grid-cols-6 gap-2 items-end">
                      <Input placeholder="Linha" value={newLine.linha} onChange={e => setNewLine(p => ({ ...p, linha: e.target.value }))} className="text-xs" />
                      <Input placeholder="Descrição" value={newLine.descricao} onChange={e => setNewLine(p => ({ ...p, descricao: e.target.value }))} className="text-xs col-span-2" />
                      <Input placeholder="Unidade" value={newLine.unidade} onChange={e => setNewLine(p => ({ ...p, unidade: e.target.value }))} className="text-xs" />
                      <Input placeholder="Qtd" type="number" value={newLine.quantidade} onChange={e => setNewLine(p => ({ ...p, quantidade: e.target.value }))} className="text-xs" />
                      <Input placeholder="Vl. Unit." type="number" value={newLine.valorUnitario} onChange={e => setNewLine(p => ({ ...p, valorUnitario: e.target.value }))} className="text-xs" />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={handleAddLine} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs">Adicionar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAdding(false)} className="text-xs">Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-t">
                    <Button size="sm" variant="ghost" onClick={() => setAdding(true)} className="text-xs gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Adicionar Linha
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pedidos">
            <div className="bg-card rounded-lg border overflow-hidden">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="text-sm font-medium">Pedidos do Contrato</span>
                <Button size="sm" onClick={() => setShowNewPedido(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Novo Pedido
                </Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-2.5 text-left">Nº Pedido</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-left">Criado em</th>
                    <th className="px-3 py-2.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pedidos.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-medium">{p.numero}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant={p.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                          {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">{formatDate(p.created_at)}</td>
                      <td className="px-3 py-2.5 text-center">
                        {p.status !== 'ativo' && (
                          <Button size="sm" variant="ghost" onClick={() => handleSetActivePedido(p.id)} className="text-xs">
                            Ativar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pedidos.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">Nenhum pedido cadastrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="medicoes">
            <div className="bg-card rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-2.5 text-left">BM Nº</th>
                    <th className="px-3 py-2.5 text-left">Data Emissão</th>
                    <th className="px-3 py-2.5 text-left">Período</th>
                    <th className="px-3 py-2.5 text-right">Valor</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bms.map((bm: any) => (
                    <tr key={bm.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-medium">{String(bm.numero).padStart(3, '0')}</td>
                      <td className="px-3 py-2.5">{formatDate(bm.data_emissao)}</td>
                      <td className="px-3 py-2.5">{formatDate(bm.periodo_inicio)} — {formatDate(bm.periodo_fim)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-medium">{formatCurrency(Number(bm.valor_total))}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant={bm.status === 'finalizado' ? 'default' : 'secondary'} className="text-xs">
                          {bm.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/contrato/${contract.id}/bm/${bm.id}`)} className="text-xs gap-1">
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {bms.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Nenhum boletim de medição emitido</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showNewPedido} onOpenChange={setShowNewPedido}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Pedido</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nº do Pedido</Label>
              <Input value={newPedidoNumero} onChange={e => setNewPedidoNumero(e.target.value)} placeholder="Ex: 4500123456" />
            </div>
            <p className="text-xs text-muted-foreground">Ao criar um novo pedido, os pedidos anteriores serão desativados automaticamente.</p>
            <Button onClick={handleCreatePedido} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Criar Pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
