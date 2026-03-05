
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  cnpj TEXT,
  objeto TEXT,
  tipo TEXT NOT NULL DEFAULT 'servico',
  tipo_label TEXT NOT NULL DEFAULT 'Prestação de Serviços',
  valor_total NUMERIC NOT NULL DEFAULT 0,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  numero_pedido TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contracts" ON public.contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contracts" ON public.contracts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Order lines table
CREATE TABLE public.order_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linha TEXT NOT NULL,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order lines" ON public.order_lines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own order lines" ON public.order_lines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own order lines" ON public.order_lines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own order lines" ON public.order_lines FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_order_lines_updated_at BEFORE UPDATE ON public.order_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Boletins de medição table
CREATE TABLE public.boletins_medicao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  data_emissao DATE NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.boletins_medicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own BMs" ON public.boletins_medicao FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own BMs" ON public.boletins_medicao FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own BMs" ON public.boletins_medicao FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own BMs" ON public.boletins_medicao FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_boletins_updated_at BEFORE UPDATE ON public.boletins_medicao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BM lines table
CREATE TABLE public.bm_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bm_id UUID NOT NULL REFERENCES public.boletins_medicao(id) ON DELETE CASCADE,
  order_line_id UUID NOT NULL REFERENCES public.order_lines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linha TEXT NOT NULL,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL,
  quantidade_contratada NUMERIC NOT NULL DEFAULT 0,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  valor_total_contrato NUMERIC NOT NULL DEFAULT 0,
  acumulado_anterior_qtd NUMERIC NOT NULL DEFAULT 0,
  acumulado_anterior_valor NUMERIC NOT NULL DEFAULT 0,
  medido_atual_qtd NUMERIC NOT NULL DEFAULT 0,
  medido_atual_valor NUMERIC NOT NULL DEFAULT 0,
  acumulado_total_qtd NUMERIC NOT NULL DEFAULT 0,
  acumulado_total_valor NUMERIC NOT NULL DEFAULT 0,
  saldo_qtd NUMERIC NOT NULL DEFAULT 0,
  saldo_valor NUMERIC NOT NULL DEFAULT 0,
  execucao_percent NUMERIC NOT NULL DEFAULT 0,
  centro_custo TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bm_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own BM lines" ON public.bm_lines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own BM lines" ON public.bm_lines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own BM lines" ON public.bm_lines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own BM lines" ON public.bm_lines FOR DELETE USING (auth.uid() = user_id);
