
-- Create pedidos table
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- RLS policies for pedidos
CREATE POLICY "Users can view own pedidos" ON public.pedidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pedidos" ON public.pedidos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pedidos" ON public.pedidos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pedidos" ON public.pedidos FOR DELETE USING (auth.uid() = user_id);

-- Add pedido_id to order_lines
ALTER TABLE public.order_lines ADD COLUMN pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE;

-- Add descricao_bm to bm_lines for BM-specific description
ALTER TABLE public.bm_lines ADD COLUMN descricao_bm TEXT NOT NULL DEFAULT '';

-- Add updated_at trigger for pedidos
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
