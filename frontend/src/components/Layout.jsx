import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';

const enlaces = [
  { to: '/', label: 'Panel general', folio: '01' },
  { to: '/beneficiarios', label: 'Beneficiarios', folio: '02' },
  { to: '/entregas', label: 'Entregas', folio: '03' },
  { to: '/simulador', label: 'Simulador Multicanal', folio: '04' },
  { to: '/controles', label: 'Gestión de Controles', folio: '05' },
  { to: '/controles/menu', label: 'Modo Menú', folio: '06' },
  { to: '/controles/dashboard', label: 'Dashboard Controles', folio: '07' },
];

export default function Layout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ledger-950 text-paper-200 transition-colors duration-300">
      
      {/* Header Superior Móvil / Tablet (visión en pantallas pequeñas < lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-ledger-900/90 backdrop-blur-md border-b border-ledger-700 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-ledger-700 bg-ledger-950/60 text-paper-100 hover:border-confirm-400/40 focus:outline-none"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-confirm-500 to-seal-500 flex items-center justify-center font-display italic text-paper-100 text-lg font-bold">
              V
            </div>
            <span className="font-display font-bold text-lg text-paper-100 tracking-tight">
              VasoChain <span className="text-confirm-400">AI</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-ledger-700 bg-ledger-950/60 text-paper-100"
            title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-seal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-confirm-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Overlay Backdrop Móvil */}
      {mobileMenuOpen && (
        <div
          onClick={closeMenu}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        />
      )}

      {/* Sidebar de Navegación (Escritorio + Drawer Móvil) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 shrink-0 border-r border-ledger-700 bg-ledger-900 flex flex-col transition-transform duration-300 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 lg:px-8 py-6 border-b border-ledger-700 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative w-11 h-11 shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-confirm-500 to-seal-500" />
              <div className="absolute inset-1 rounded-full bg-ledger-950 flex items-center justify-center">
                <span className="font-display italic text-paper-100 text-xl font-bold leading-none">
                  V
                </span>
              </div>
            </div>
            <div>
              <p className="font-display text-xl lg:text-2xl leading-tight tracking-tight text-paper-100 font-bold">
                VasoChain
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-paper-300/50 font-mono mt-0.5">
                Programa Vaso de Leche
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="hidden lg:flex p-2.5 rounded-2xl border border-ledger-600 bg-ledger-950/50 hover:bg-ledger-800/80 hover:border-confirm-400/30 transition-all"
            aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-seal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-confirm-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex-1 px-4 lg:px-6 py-6 space-y-1.5 overflow-y-auto">
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm transition-all border border-transparent ${
                  isActive
                    ? 'bg-ledger-800 text-paper-100 border-confirm-400/30 shadow-soft-xl font-semibold'
                    : 'text-paper-300/70 hover:bg-ledger-800/60 hover:text-paper-200 hover:border-ledger-600'
                }`
              }
            >
              <span className="font-mono text-xs text-paper-300/40 group-hover:text-paper-300/60 tabular-nums">
                {enlace.folio}
              </span>
              {enlace.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 lg:px-8 py-6 border-t border-ledger-700 bg-ledger-950/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.nombre?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-paper-100 font-semibold truncate">{user?.nombre || 'Usuario'}</p>
                <p className="text-[11px] text-paper-300/60 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-paper-300/60 hover:text-red-400 hover:bg-red-900/20 transition-all shrink-0"
              title="Cerrar sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.14em] text-confirm-400 font-mono mb-2">
            <span className="w-2 h-2 rounded-full bg-confirm-400 animate-pulse" />
            Cadena activa
          </div>
          <p className="text-[11px] text-paper-300/40 leading-relaxed font-mono">
            Registros inmutables en tiempo real.
          </p>
        </div>
      </aside>

      {/* Área Contenido Principal con Padding Adaptativo */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

