import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import loginHeroImg from '../assets/login-hero.png';

export default function Login() {
  const [email, setEmail] = useState('admin@vasochain.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authLogin(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-ledger-950 text-paper-200 transition-colors duration-500 overflow-hidden font-sans">
      
      {/* Botón Flotante Superior: Conmutador Modo Claro / Oscuro */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-ledger-900/80 border border-ledger-700 hover:border-confirm-400/50 text-paper-100 text-xs font-medium tracking-wide shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {theme === 'dark' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-seal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-confirm-500" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-confirm-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      {/* Contenedor Principal Esencial */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-[2rem] border border-ledger-700 bg-ledger-900 shadow-2xl overflow-hidden backdrop-blur-xl z-10">
        
        {/* Lado Izquierdo: Imagen del Programa y Branding Esencial */}
        <div className="lg:col-span-6 relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-ledger-700 bg-ledger-950/60">
          
          {/* Header Marca */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-confirm-500 to-seal-500 p-0.5 shadow-md shrink-0">
              <div className="w-full h-full rounded-[10px] bg-ledger-950 flex items-center justify-center">
                <span className="font-display italic text-paper-100 text-2xl font-bold">V</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-paper-100 tracking-tight leading-none">
                VasoChain <span className="gradient-text">AI</span>
              </h1>
              <p className="text-[11px] font-mono text-paper-300/60 mt-1">
                Programa Vaso de Leche · Trujillo
              </p>
            </div>
          </div>

          {/* Imagen Limpia sin textos sobrepuestos */}
          <div className="my-6 rounded-2xl border border-ledger-700 overflow-hidden shadow-lg">
            <img 
              src={loginHeroImg} 
              alt="Programa Vaso de Leche" 
              className="w-full h-52 lg:h-60 object-cover object-center" 
            />
          </div>

          {/* Pie informativo esencial */}
          <div className="flex items-center gap-2 text-xs font-mono text-paper-300/60">
            <span className="w-2 h-2 rounded-full bg-confirm-400 shrink-0" />
            <span>Supervisión & Trazabilidad Municipal</span>
          </div>

        </div>

        {/* Lado Derecho: Formulario de Inicio de Sesión Limpio */}
        <div className="lg:col-span-6 flex flex-col justify-center p-6 sm:p-8 lg:p-10 bg-ledger-900/40">
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-paper-100 font-display">Iniciar Sesión</h2>
            <p className="text-xs text-paper-300/70 mt-1">Ingresa con tus credenciales de operador</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-paper-200 text-xs font-semibold uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-confirm-400/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-ledger-950/80 border border-ledger-700 rounded-xl pl-10 pr-4 py-3 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-confirm-400 transition-all text-sm"
                  placeholder="admin@vasochain.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-paper-200 text-xs font-semibold uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-confirm-400/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-ledger-950/80 border border-ledger-700 rounded-xl pl-10 pr-10 py-3 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-confirm-400 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-paper-300/50 hover:text-paper-100 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.97 8.97 0 013.682-.863c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-1.782 1.782a9.96 9.96 0 01-3.63.782m0-14a9.96 9.96 0 00-3.63.782m-3.63-3.63L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-confirm-500 to-confirm-600 hover:from-confirm-400 hover:to-confirm-500 text-white py-3.5 rounded-xl font-bold font-display text-sm transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Iniciando sesión...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Credenciales de Acceso Rápido */}
          <div className="mt-6 pt-4 border-t border-ledger-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-paper-300/60">admin@vasochain.com</span>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@vasochain.com', 'admin123')}
              className="text-confirm-400 hover:underline font-semibold cursor-pointer"
            >
              Cargar Credenciales
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}





