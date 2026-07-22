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
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-ledger-950 text-paper-200 transition-colors duration-500 overflow-hidden font-sans">
      
      {/* Fondo con resplandores suaves de apoyo social */}
      <div className="absolute -top-48 -left-48 w-[30rem] h-[30rem] bg-confirm-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-48 -right-48 w-[30rem] h-[30rem] bg-seal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Botón Flotante Superior: Conmutador Modo Claro / Oscuro */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-ledger-900/80 border border-ledger-700/80 hover:border-confirm-400/50 text-paper-100 text-xs font-semibold tracking-wide shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 group"
        >
          {theme === 'dark' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-seal-400 group-hover:rotate-45 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-confirm-500" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-confirm-500 group-hover:-rotate-12 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      {/* Contenedor Principal Estilo Institucional 2026 */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-[2.5rem] border border-ledger-700/80 bg-ledger-900/70 shadow-2xl overflow-hidden backdrop-blur-2xl z-10 hover-lift">
        
        {/* Lado Izquierdo: Presentación del Programa Social Vaso de Leche */}
        <div className="lg:col-span-6 relative flex flex-col justify-between p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-ledger-700/60 bg-gradient-to-b from-ledger-950/90 via-ledger-900/80 to-ledger-950/90">
          
          {/* Header Superior con Identidad Municipal */}
          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-confirm-500/15 border border-confirm-400/30 text-confirm-400 text-[11px] font-mono tracking-wider font-semibold">
                <span className="w-2 h-2 rounded-full bg-confirm-400" />
                PROGRAMA VASO DE LECHE (PVL)
              </div>
              <span className="text-[11px] font-mono text-paper-300/50">MUNICIPALIDAD DE TRUJILLO</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-confirm-500 via-emerald-400 to-seal-500 p-0.5 shadow-md">
                <div className="w-full h-full rounded-[14px] bg-ledger-950 flex items-center justify-center">
                  <span className="font-display italic text-paper-100 text-2xl font-bold">V</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-paper-100 tracking-tight leading-none">
                  VasoChain <span className="gradient-text">AI</span>
                </h1>
                <p className="text-[11px] uppercase tracking-[0.2em] text-paper-300/60 font-mono mt-1">
                  Supervisión & Trazabilidad Municipal
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Fotografía Real de Insumos / Entrega */}
          <div className="relative z-10 my-6 rounded-2xl border border-ledger-700/80 overflow-hidden shadow-xl group">
            <img 
              src={loginHeroImg} 
              alt="Programa Vaso de Leche Trujillo" 
              className="w-full h-56 lg:h-64 object-cover object-center group-hover:scale-105 transition-transform duration-700" 
            />

            {/* Sombra sutil de degradado */}
            <div className="absolute inset-0 bg-gradient-to-t from-ledger-950 via-ledger-950/20 to-transparent" />

            {/* Badges de Verificación Institucional */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
              <div className="px-3 py-1.5 rounded-xl bg-ledger-950/85 border border-ledger-700/80 backdrop-blur-md text-[11px] font-mono text-paper-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-confirm-400" />
                Validación de Evidencias
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-ledger-950/85 border border-seal-400/30 backdrop-blur-md text-[11px] font-mono text-seal-400 flex items-center gap-1.5">
                <span>Registro Inmutable Blockchain</span>
              </div>
            </div>
          </div>

          {/* Indicadores Institucionales */}
          <div className="relative z-10 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-ledger-950/60 border border-ledger-700/60 backdrop-blur-md">
              <div className="text-[10px] font-mono uppercase text-confirm-400 font-bold tracking-wider">Supervisión Digital</div>
              <div className="text-sm font-bold text-paper-100 mt-0.5 font-display">Entregas Verificadas</div>
            </div>
            <div className="p-3 rounded-2xl bg-ledger-950/60 border border-ledger-700/60 backdrop-blur-md">
              <div className="text-[10px] font-mono uppercase text-seal-400 font-bold tracking-wider">Trazabilidad</div>
              <div className="text-sm font-bold text-paper-100 mt-0.5 font-display">Transparencia Municipal</div>
            </div>
          </div>

          {/* Footer de la columna izquierda */}
          <div className="relative z-10 pt-4 mt-6 border-t border-ledger-700/50 text-[11px] font-mono text-paper-300/50 flex items-center justify-between">
            <span>Gestión Social · Trujillo, Perú</span>
            <span className="text-confirm-400/80">Sistema Oficial v2.4</span>
          </div>

        </div>

        {/* Lado Derecho: Formulario de Inicio de Sesión */}
        <div className="lg:col-span-6 flex flex-col justify-center p-8 lg:p-10 bg-ledger-900/40 backdrop-blur-xl">
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-paper-100 font-display tracking-tight">Iniciar Sesión</h2>
            <p className="text-xs text-paper-300/70 mt-1">Ingresa tus credenciales autorizadas para acceder al panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-paper-200 text-xs font-semibold uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-paper-300/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-confirm-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-ledger-950/80 border border-ledger-700/80 rounded-2xl pl-11 pr-4 py-3.5 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-confirm-400 focus:ring-2 focus:ring-confirm-400/20 transition-all text-sm font-medium"
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
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-paper-300/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-confirm-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-ledger-950/80 border border-ledger-700/80 rounded-2xl pl-11 pr-11 py-3.5 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-confirm-400 focus:ring-2 focus:ring-confirm-400/20 transition-all text-sm font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-paper-300/50 hover:text-paper-100 transition-colors"
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
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-confirm-500 via-emerald-500 to-confirm-600 hover:from-confirm-400 hover:to-confirm-500 text-white py-3.5 rounded-2xl font-bold font-display text-sm tracking-wide transition-all shadow-lg shadow-confirm-500/25 hover:shadow-confirm-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
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

          {/* Autorellenado rápido de credenciales */}
          <div className="mt-6 pt-5 border-t border-ledger-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-paper-300/60">Credenciales de Operador:</span>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@vasochain.com', 'admin123')}
                className="text-[11px] font-mono font-bold text-confirm-400 hover:text-confirm-300 underline cursor-pointer transition-colors"
              >
                Cargar Credenciales
              </button>
            </div>
            <div className="p-3 rounded-xl bg-ledger-950/60 border border-ledger-700/60 text-xs font-mono text-paper-200 flex items-center justify-between">
              <span className="text-paper-100 font-medium">admin@vasochain.com</span>
              <span className="text-paper-300/40">••••••••</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}



