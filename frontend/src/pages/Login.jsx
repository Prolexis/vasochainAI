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
    <div className="min-h-screen bg-gradient-to-br from-ledger-900 to-ledger-950 flex items-center justify-center p-4">
      <div className="bg-ledger-900 border border-ledger-700 rounded-3xl p-10 shadow-soft-xl w-full max-w-md">
        <div className="text-center mb-10">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full border-2 border-emerald-400/50 flex items-center justify-center">
              <span className="font-display italic text-paper-100 text-4xl leading-none">V</span>
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-paper-100">VasoChain AI</h1>
          <p className="text-paper-400 mt-3 text-lg">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-paper-300 text-sm font-medium mb-3">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ledger-950/50 border border-ledger-600 rounded-2xl px-5 py-4 text-paper-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
              placeholder="admin@vasochain.com"
              required
            />
          </div>

          <div>
            <label className="block text-paper-300 text-sm font-medium mb-3">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ledger-950/50 border border-ledger-600 rounded-2xl px-5 py-4 text-paper-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-5 rounded-2xl bg-red-900/30 border border-red-700/50 text-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-semibold text-lg transition-all shadow-soft-xl"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center text-paper-400 text-sm">
          <p>Credenciales de prueba:</p>
          <p className="font-mono mt-2">Email: admin@vasochain.com</p>
          <p className="font-mono">Password: admin123</p>
        </div>
      </div>
    </div>
  );
}
