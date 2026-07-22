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

  const handleForgotPass = () => {
    alert('Modo Hackathon Demo: Utiliza las credenciales precargadas admin@vasochain.com / admin123');
  };

  return (
    <div className="w-screen min-h-screen flex flex-col lg:grid lg:grid-cols-2 bg-ledger-950 text-paper-200 transition-colors duration-500 overflow-x-hidden font-sans relative">
      
      {/* 1. Barra de Acento Fina (2px) en el borde superior con gradiente animado verde-dorado */}
      <div className="h-[2.5px] fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 animate-flow-bar pointer-events-none" />

      {/* 2. Toggle Dark/Light Fijo en la Esquina Superior Derecha */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-ledger-900/80 dark:bg-ledger-900/80 border border-ledger-700/80 dark:border-ledger-700/80 text-paper-100 text-xs font-medium tracking-wide shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      {/* 3. COLUMNA IZQUIERDA (50% en escritorio / ~38vh en móvil): Fotografía Real + Ken Burns + Chips de Estadísticas */}
      <div className="relative h-[38vh] lg:h-full lg:min-h-screen w-full overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-12 z-0 shrink-0 select-none">
        
        {/* Imagen Real con Zoom Lento Continuo (Ken Burns) */}
        <img 
          src={loginHeroImg} 
          alt="Programa Vaso de Leche Trujillo" 
          className="absolute inset-0 w-full h-full object-cover object-center animate-kenburns pointer-events-none" 
        />

        {/* Overlay de Gradiente Vertical Oscuro (Más denso arriba y abajo, transparente al centro) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/90 z-10 pointer-events-none" />

        {/* Textura de Grano Sutil Superpuesta */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] z-10 pointer-events-none mix-blend-overlay" />

        {/* Header Marca con Glow Pulsante */}
        <div className="relative z-20 flex items-center gap-3.5 animate-fadeIn">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-amber-400 p-0.5 shadow-2xl shrink-0">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <span className="font-display italic text-white text-2xl font-bold">V</span>
            </div>
            <span className="absolute -inset-1 rounded-2xl bg-emerald-500/30 blur-md animate-pulse pointer-events-none" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-tight leading-none drop-shadow-lg">
              VasoChain <span className="text-emerald-400">AI</span>
            </h1>
            <p className="text-xs font-mono text-slate-200/90 mt-1 tracking-wider font-semibold drop-shadow">
              Programa Vaso de Leche · Trujillo
            </p>
          </div>
        </div>

        {/* Chips Flotantes de Estadísticas Reales (Glassmorphism a media altura) */}
        <div className="relative z-20 hidden lg:flex flex-col gap-3 my-auto max-w-xs animate-slideUp">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-3.5 transform hover:scale-105 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              🏛️
            </div>
            <div>
              <p className="text-base font-bold text-white font-display leading-tight">180+ Comedores</p>
              <p className="text-[11px] font-mono text-slate-300/80">Comités Activos en Trujillo</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-3.5 transform hover:scale-105 transition-all">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
              🥛
            </div>
            <div>
              <p className="text-base font-bold text-white font-display leading-tight">12,400+ Niños</p>
              <p className="text-[11px] font-mono text-slate-300/80">Beneficiarios Nutricionales</p>
            </div>
          </div>
        </div>

        {/* Badge Inferior con Dot Pulsante Verde + Descripción */}
        <div className="relative z-20 space-y-2 hidden sm:block animate-slideUp">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-950/85 border border-slate-700/80 backdrop-blur-md text-xs font-mono text-emerald-400 font-semibold shadow-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            Supervisión & Trazabilidad Municipal
          </div>
          <p className="text-xs font-mono text-slate-300/90 leading-relaxed max-w-md drop-shadow">
            Registro inmutable en blockchain y validación inteligente para programas de nutrición social.
          </p>
        </div>

      </div>

      {/* 4. COLUMNA DERECHA (50% en escritorio / Flex-1 en móvil): Formulario con Dot-Grid & Radial Glow */}
      <div className="relative flex-1 lg:h-full lg:min-h-screen w-full flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 bg-ledger-950 bg-dot-grid text-paper-200 transition-colors duration-500 z-20">
        
        {/* Glow Radial Verde Esmeralda detrás del formulario */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-[420px] space-y-7 my-auto py-6 relative z-10">
          
          {/* Eyebrow Pequeño + Encabezado */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase">
              <span>🛡️</span>
              <span>PANEL DE OPERADOR</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-paper-100 font-display tracking-tight leading-none">
              Iniciar Sesión
            </h2>
            <p className="text-xs font-mono text-paper-300/60 leading-relaxed">
              Ingresa con tus credenciales de operador autorizadas
            </p>
          </div>

          {/* Formulario con Focus Ring Animado */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Campo Correo */}
            <div className="space-y-2 group">
              <label className="block text-paper-300/80 text-[11px] font-mono uppercase tracking-widest font-semibold">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-paper-300/40 group-focus-within:text-emerald-400 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-ledger-900/90 border border-ledger-700 rounded-2xl pl-12 pr-4 py-3.5 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-sm font-medium"
                  placeholder="admin@vasochain.com"
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña + Olvidaste tu contraseña */}
            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <label className="block text-paper-300/80 text-[11px] font-mono uppercase tracking-widest font-semibold">
                  CONTRASEÑA
                </label>
                <button
                  type="button"
                  onClick={handleForgotPass}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline transition-all cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-paper-300/40 group-focus-within:text-emerald-400 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-ledger-900/90 border border-ledger-700 rounded-2xl pl-12 pr-12 py-3.5 text-paper-100 placeholder-paper-300/30 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-sm font-medium"
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

            {/* Botón Primario con Gradiente Animado Shimmer */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white py-4 rounded-2xl font-bold font-display text-base tracking-wide transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer btn-shimmer"
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

          {/* Nota de Confianza bajo el botón */}
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-paper-300/50 pt-1">
            <span>🔒</span>
            <span>Conexión segura · Registro cifrado en blockchain</span>
          </div>

          {/* Footer de Credenciales Demo para Hackathon */}
          <div className="pt-4 border-t border-ledger-700/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-paper-300/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>admin@vasochain.com</span>
            </div>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@vasochain.com', 'admin123')}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer transition-colors"
            >
              Cargar Credenciales
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}








