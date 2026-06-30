import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Login() {
  const [email, setEmail] = useState('admin@vasochain.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Iniciando login con:', { email, password });
    setError('');
    setLoading(true);
    try {
      await authLogin(email, password);
      console.log('Login exitoso! Navegando a /');
      navigate('/');
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ledger-950 to-ledger-900 flex items-center justify-center p-4">
      <div className="glass-card glass-border rounded-[2rem] p-10 shadow-soft-xl w-full max-w-md">
        <div className="text-center mb-10">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-confirm-500 to-confirm-600 animate-pulse opacity-20"></div>
            <div className="absolute inset-2 rounded-full border-2 border-confirm-400/50 flex items-center justify-center">
              <span className="font-display italic text-paper-100 text-4xl leading-none">V</span>
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-paper-100 tracking-tight">VasoChain AI</h1>
          <p className="text-paper-300/60 mt-3 text-sm">Inicia sesión en tu cuenta operativa</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-paper-300/80 text-xs font-semibold uppercase tracking-wider mb-2.5">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ledger-950/50 border border-ledger-600 rounded-2xl px-5 py-4 text-paper-200 focus:outline-none focus:border-confirm-400/70 focus:ring-4 focus:ring-confirm-400/10 transition-all font-sans text-sm"
              placeholder="admin@vasochain.com"
              required
            />
          </div>

          <div>
            <label className="block text-paper-300/80 text-xs font-semibold uppercase tracking-wider mb-2.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ledger-950/50 border border-ledger-600 rounded-2xl px-5 py-4 text-paper-200 focus:outline-none focus:border-confirm-400/70 focus:ring-4 focus:ring-confirm-400/10 transition-all font-sans text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-950/10 dark:bg-red-900/10 border border-deny-500/25 text-deny-500 dark:text-deny-400 text-xs font-mono">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-confirm-500 hover:bg-confirm-400 disabled:opacity-50 disabled:cursor-not-allowed text-ledger-950 py-4 rounded-2xl font-bold font-display italic text-base transition-all hover:scale-[1.02] active:scale-98 shadow-md"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center text-paper-300/40 text-xs font-mono">
          <p>Credenciales de prueba:</p>
          <p className="mt-2 text-paper-300/60">Email: admin@vasochain.com</p>
          <p className="text-paper-300/60">Password: admin123</p>
        </div>
      </div>
    </div>
  );
}
