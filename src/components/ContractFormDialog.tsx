import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createContract } from '@/services/contractService';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function ContractFormDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    numero: '', fornecedor: '', cnpj: '', objeto: '',
    tipo: 'servico', valorTotal: '', dataInicio: '', dataFim: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await createContract({
        numero: form.numero,
        fornecedor: form.fornecedor,
        cnpj: form.cnpj,
        objeto: form.objeto,
        tipo: form.tipo,
        tipo_label: form.tipo === 'servico' ? 'Prestação de Serviços' : 'Locação',
        valor_total: parseFloat(form.valorTotal) || 0,
        data_inicio: form.dataInicio,
        data_fim: form.dataFim,
      }, user.id);
      onCreated?.();
    } catch (err) {
      console.error('Error saving contract:', err);
      alert('Erro ao salvar contrato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nº do Contrato</Label>
            <Input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} />
          </div>
          <div><Label>Fornecedor</Label><Input value={form.fornecedor} onChange={e => setForm(p => ({ ...p, fornecedor: e.target.value }))} /></div>
          <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} /></div>
          <div><Label>Objeto</Label><Input value={form.objeto} onChange={e => setForm(p => ({ ...p, objeto: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="servico">Prestação de Serviços</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Total</Label><Input type="number" value={form.valorTotal} onChange={e => setForm(p => ({ ...p, valorTotal: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Início</Label><Input type="date" value={form.dataInicio} onChange={e => setForm(p => ({ ...p, dataInicio: e.target.value }))} /></div>
            <div><Label>Fim</Label><Input type="date" value={form.dataFim} onChange={e => setForm(p => ({ ...p, dataFim: e.target.value }))} /></div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90">
            {saving ? 'Salvando...' : 'Salvar Contrato'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
