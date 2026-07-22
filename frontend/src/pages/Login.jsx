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
    <div className="w-screen min-h-screen flex flex-col lg:grid lg:grid-cols-2 bg-ledger-950 text-paper-200 transition-colors duration-500 overflow-x-hidden font-sans">
      
      {/* Botón Flotante Superior: Conmutador Modo Claro / Oscuro */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-ledger-900/90 border border-ledger-700/90 hover:border-confirm-400/60 text-paper-100 text-xs font-semibold tracking-wide shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-seal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-confirm-500 animate-pulse" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-confirm-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      {/* COLUMNA IZQUIERDA (50% en escritorio / 35vh en móvil): Fotografía Real a Pantalla Completa + Ken Burns Zoom */}
      <div className="relative h-[35vh] lg:h-full lg:min-h-screen w-full overflow-hidden flex flex-col justify-between p-6 lg:p-12 z-0 shrink-0">
        
        {/* Imagen de Fondo Real con Efecto Ken Burns */}
        <img 
          src={loginHeroImg} 
          alt="Programa Vaso de Leche Trujillo" 
          className="absolute inset-0 w-full h-full object-cover object-center animate-kenburns pointer-events-none select-none" 
        />

        {/* Overlay Degradado Gradual de Abajo hacia Arriba */}
        <div className="absolute inset-0 bg-gradient-to-t from-ledger-950 via-ledger-950/40 to-black/60 z-10 pointer-events-none" />

        {/* Marca Superior Flotante */}
        <div className="relative z-20 flex items-center gap-3.5 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-confirm-500 via-emerald-400 to-seal-500 p-0.5 shadow-2xl shrink-0">
            <div className="w-full h-full rounded-[14px] bg-slate-950/90 flex items-center justify-center">
              <span className="font-display italic text-white text-2xl font-bold">V</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight leading-none drop-shadow-lg">
              VasoChain <span className="text-emerald-400">AI</span>
            </h1>
            <p className="text-xs font-mono text-slate-200/90 mt-1 tracking-wider font-semibold drop-shadow">
              Programa Vaso de Leche · Trujillo
            </p>
          </div>
        </div>

        {/* Subtítulo Inferior Flotante sobre la Imagen */}
        <div className="relative z-20 space-y-2 hidden sm:block animate-slideUp">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-slate-700/80 backdrop-blur-md text-xs font-mono text-emerald-400 font-semibold shadow-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            Supervisión & Trazabilidad Municipal
          </div>
          <p className="text-xs font-mono text-slate-300/80 leading-relaxed max-w-md drop-shadow">
            Registro inmutable blockchain y validación inteligente para programas de nutrición social.
          </p>
        </div>

      </div>

      {/* COLUMNA DERECHA (50% en escritorio / Flex-1 en móvil): Formulario Centrado 420px */}
      <div className="relative flex-1 lg:h-full lg:min-h-screen w-full flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 bg-ledger-950 text-paper-200 transition-colors duration-500 z-20">
        
        <div className="w-full max-w-[420px] space-y-8 my-auto py-6">
          
          {/* Encabezado del Formulario */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-paper-100 font-display tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-xs font-mono text-paper-300/60 leading-relaxed">
              Ingresa con tus credenciales de operador autorizadas para acceder al panel
            </p>
          </div>

          {/* Formulario con Focus Animado */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-2 group">
              <label className="block text-paper-300/80 text-[11px] font-mono uppercase tracking-widest font-semibold">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-paper-300/40 group-focus-within:text-confirm-400 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-ledger-900/90 border border-ledger-700 rounded-2xl pl-12 pr-4 py-3.5 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-confirm-400 focus:ring-4 focus:ring-confirm-400/20 transition-all text-sm font-medium"
                  placeholder="admin@vasochain.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-paper-300/80 text-[11px] font-mono uppercase tracking-widest font-semibold">
                CONTRASEÑA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-paper-300/40 group-focus-within:text-confirm-400 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-ledger-900/90 border border-ledger-700 rounded-2xl pl-12 pr-12 py-3.5 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-confirm-400 focus:ring-4 focus:ring-confirm-400/20 transition-all text-sm font-medium"
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
              className="w-full mt-2 bg-gradient-to-r from-confirm-500 via-emerald-500 to-confirm-600 hover:from-confirm-400 hover:to-confirm-500 text-white py-4 rounded-2xl font-bold font-display text-base tracking-wide transition-all shadow-lg shadow-confirm-500/25 hover:shadow-confirm-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer btn-shimmer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </div>
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

          {/* Autorellenado para la Hackathon */}
          <div className="pt-4 border-t border-ledger-700/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-paper-300/60">
              <span className="w-1.5 h-1.5 rounded-full bg-confirm-400" />
              <span>admin@vasochain.com</span>
            </div>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@vasochain.com', 'admin123')}
              className="text-confirm-400 hover:text-confirm-300 font-bold underline cursor-pointer transition-colors"
            >
              Cargar Credenciales
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}







