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
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-ledger-950 text-paper-200 transition-colors duration-500 overflow-hidden font-sans">
      
      {/* Resplandores ambientales de fondo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-confirm-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-seal-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Botón Flotante Superior: Conmutador Modo Claro / Oscuro */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-ledger-900/90 border border-ledger-700/80 hover:border-confirm-400/50 text-paper-100 text-xs font-semibold tracking-wide shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 group"
        >
          {theme === 'dark' ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-seal-400 group-hover:rotate-45 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-confirm-500" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-confirm-500 group-hover:-rotate-12 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      {/* Contenedor Principal Espacioso */}
      <div className="w-full max-w-5xl lg:max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-[2.5rem] border border-ledger-700/80 bg-ledger-900/80 shadow-2xl overflow-hidden backdrop-blur-2xl z-10 transition-all duration-300">
        
        {/* Lado Izquierdo: Presentación Institucional del Programa Social */}
        <div className="lg:col-span-6 relative flex flex-col justify-between p-8 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-ledger-700/60 bg-gradient-to-b from-ledger-950/90 via-ledger-900/80 to-ledger-950/90">
          
          {/* Header Institucional con espacio holgado */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-confirm-500/15 border border-confirm-400/30 text-confirm-400 text-xs font-mono font-bold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-confirm-400" />
                PROGRAMA VASO DE LECHE (P.V.L.)
              </span>
              <span className="text-xs font-mono text-paper-300/60 font-medium">
                MUNICIPALIDAD DE TRUJILLO
              </span>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-confirm-500 via-emerald-400 to-seal-500 p-0.5 shadow-lg shrink-0">
                <div className="w-full h-full rounded-[14px] bg-ledger-950 flex items-center justify-center">
                  <span className="font-display italic text-paper-100 text-3xl font-bold">V</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-display font-bold text-paper-100 tracking-tight leading-none">
                  VasoChain <span className="gradient-text">AI</span>
                </h1>
                <p className="text-xs uppercase tracking-[0.2em] text-paper-300/70 font-mono mt-1.5">
                  Supervisión & Trazabilidad Municipal
                </p>
              </div>
            </div>
          </div>

          {/* Fotografía Real con Margen Amplio y Badges de Alto Contraste */}
          <div className="my-8 rounded-2xl border border-ledger-700/80 overflow-hidden shadow-2xl relative group">
            <img 
              src={loginHeroImg} 
              alt="Programa Vaso de Leche Trujillo" 
              className="w-full h-64 lg:h-72 object-cover object-center group-hover:scale-105 transition-transform duration-700" 
            />

            {/* Sombra de viñeta para asegurar legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Badges de Alto Contraste sobre la Imagen */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-10">
              <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-mono text-emerald-400 font-semibold shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Validación de Evidencias
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-amber-500/40 text-xs font-mono text-amber-400 font-semibold shadow-lg">
                Registro Inmutable Blockchain
              </div>
            </div>
          </div>

          {/* Tarjetas de Indicadores Institucionales Espaciadas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-ledger-950/70 border border-ledger-700/70 backdrop-blur-md">
              <div className="text-xs font-mono uppercase text-confirm-400 font-bold tracking-wider">Supervisión Digital</div>
              <div className="text-base font-bold text-paper-100 mt-1 font-display">Entregas Verificadas</div>
            </div>
            <div className="p-4 rounded-2xl bg-ledger-950/70 border border-ledger-700/70 backdrop-blur-md">
              <div className="text-xs font-mono uppercase text-seal-400 font-bold tracking-wider">Trazabilidad</div>
              <div className="text-base font-bold text-paper-100 mt-1 font-display">Transparencia Municipal</div>
            </div>
          </div>

          {/* Footer de Columna Izquierda */}
          <div className="pt-6 mt-6 border-t border-ledger-700/50 text-xs font-mono text-paper-300/50 flex items-center justify-between">
            <span>Gerencia de Desarrollo Social · Trujillo</span>
            <span className="text-confirm-400/80 font-bold">Sistema Oficial v2.4</span>
          </div>

        </div>

        {/* Lado Derecho: Formulario de Inicio de Sesión Limpio y Espacioso */}
        <div className="lg:col-span-6 flex flex-col justify-center p-8 sm:p-10 lg:p-12 bg-ledger-900/40 backdrop-blur-xl">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-paper-100 font-display tracking-tight">Iniciar Sesión</h2>
            <p className="text-sm text-paper-300/70 mt-2 leading-relaxed">
              Ingresa tus credenciales autorizadas de operador para acceder al panel de control
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-paper-200 text-xs font-bold uppercase tracking-wider mb-2.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-confirm-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-ledger-950/80 border border-ledger-700 rounded-2xl pl-12 pr-4 py-4 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-confirm-400 focus:ring-2 focus:ring-confirm-400/20 transition-all text-sm font-medium"
                  placeholder="admin@vasochain.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-paper-200 text-xs font-bold uppercase tracking-wider mb-2.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-confirm-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-ledger-950/80 border border-ledger-700 rounded-2xl pl-12 pr-12 py-4 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-confirm-400 focus:ring-2 focus:ring-confirm-400/20 transition-all text-sm font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-paper-300/50 hover:text-paper-100 transition-colors cursor-pointer"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.97 8.97 0 013.682-.863c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-1.782 1.782a9.96 9.96 0 01-3.63.782m0-14a9.96 9.96 0 00-3.63.782m-3.63-3.63L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-gradient-to-r from-confirm-500 via-emerald-500 to-confirm-600 hover:from-confirm-400 hover:to-confirm-500 text-white py-4 rounded-2xl font-bold font-display text-base tracking-wide transition-all shadow-lg shadow-confirm-500/25 hover:shadow-confirm-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Autorellenado rápido de credenciales */}
          <div className="mt-8 pt-6 border-t border-ledger-700/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-paper-300/60">Credenciales de Operador:</span>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@vasochain.com', 'admin123')}
                className="text-xs font-mono font-bold text-confirm-400 hover:text-confirm-300 underline cursor-pointer transition-colors"
              >
                Cargar Credenciales
              </button>
            </div>
            <div className="p-3.5 rounded-2xl bg-ledger-950/70 border border-ledger-700/70 text-xs font-mono text-paper-200 flex items-center justify-between">
              <span className="text-paper-100 font-semibold">admin@vasochain.com</span>
              <span className="text-paper-300/40 font-bold">••••••••</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}




