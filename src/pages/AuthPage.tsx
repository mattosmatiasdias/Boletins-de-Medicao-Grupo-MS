import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password, name);
      if (error) setError(error.message);
      else setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de Contratos, Pedidos e BMs</p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required className="mt-1" />
              </div>
            )}
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" required className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Senha</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="mt-1" />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {success && <p className="text-xs text-success">{success}</p>}

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} className="text-accent hover:underline font-medium">
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
