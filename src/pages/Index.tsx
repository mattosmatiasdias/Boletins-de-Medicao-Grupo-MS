import { useNavigate } from 'react-router-dom';
import { FileText, Building2, Calendar, TrendingUp, Plus, LogOut } from 'lucide-react';
import { fetchContracts, fetchBMs, fetchOrderLines, fetchActivePedido } from '@/services/contractService';
import { formatCurrency, formatDate, daysRemaining } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ContractFormDialog from '@/components/ContractFormDialog';

const Index = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractMeta, setContractMeta] = useState<Record<string, { bmCount: number; totalMedido: number; orderCount: number }>>({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await fetchContracts();
      setContracts(data);
      const meta: Record<string, any> = {};
      for (const c of data) {
        const bms = await fetchBMs(c.id);
        const pedido = await fetchActivePedido(c.id);
        const orders = pedido ? await fetchOrderLines(c.id, pedido.id) : [];
        meta[c.id] = {
          bmCount: bms.length,
          totalMedido: bms.reduce((s: number, b: any) => s + Number(b.valor_total), 0),
          orderCount: orders.length,
        };
      }
      setContractMeta(meta);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleContractCreated = () => {
    setShowForm(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando contratos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Gestão de Contratos</h1>
              <p className="text-xs text-primary-foreground/70">Controle de Contratos, Pedidos e Boletins de Medição</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" /> Novo Contrato
            </Button>
            <Button variant="ghost" onClick={signOut} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 -mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Contratos Ativos', value: contracts.length, icon: FileText },
            { label: 'Total BMs Emitidos', value: Object.values(contractMeta).reduce((s, m) => s + m.bmCount, 0), icon: TrendingUp },
            { label: 'Valor Total Contratado', value: formatCurrency(contracts.reduce((s, c) => s + Number(c.valor_total), 0)), icon: Building2 },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-lg border p-4 shadow-sm animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">{stat.label}</p>
                  <p className="stat-value mt-1">{stat.value}</p>
                </div>
                <stat.icon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">Contratos</h2>
        {contracts.length === 0 ? (
          <div className="bg-card rounded-lg border p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum contrato cadastrado</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Contrato
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts.map((contract, i) => {
              const meta = contractMeta[contract.id] || { bmCount: 0, totalMedido: 0, orderCount: 0 };
              const progress = Number(contract.valor_total) > 0 ? (meta.totalMedido / Number(contract.valor_total)) * 100 : 0;
              const days = daysRemaining(contract.data_fim);

              return (
                <div
                  key={contract.id}
                  onClick={() => navigate(`/contrato/${contract.id}`)}
                  className="bg-card rounded-lg border p-5 cursor-pointer card-hover animate-fade-in"
                  style={{ animationDelay: `${(i + 3) * 80}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="text-xs">{contract.tipo_label}</Badge>
                    <Badge variant={days > 60 ? 'default' : days > 0 ? 'secondary' : 'destructive'} className="text-xs">
                      {days > 0 ? `${days} dias` : 'Vencido'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{contract.fornecedor}</h3>
                  <p className="text-xs text-muted-foreground font-mono mb-3">Nº {contract.numero}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{contract.objeto}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Execução</span>
                    <span className="font-semibold text-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-muted-foreground">Valor</p><p className="font-semibold">{formatCurrency(Number(contract.valor_total))}</p></div>
                    <div><p className="text-muted-foreground">BMs</p><p className="font-semibold">{meta.bmCount}</p></div>
                    <div><p className="text-muted-foreground">Itens</p><p className="font-semibold">{meta.orderCount}</p></div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(contract.data_inicio)} — {formatDate(contract.data_fim)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ContractFormDialog open={showForm} onOpenChange={setShowForm} onCreated={handleContractCreated} />
    </div>
  );
};

export default Index;
