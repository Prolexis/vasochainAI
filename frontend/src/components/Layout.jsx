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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-ledger-950 text-paper-200">
      <aside className="w-80 shrink-0 border-r border-ledger-700 bg-ledger-900 flex flex-col">
        <div className="px-8 py-8 border-b border-ledger-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 shrink-0">
              <div className="absolute inset-0 rounded-full bg-seal-600" />
              <div className="absolute inset-1 rounded-full border border-seal-400/50 flex items-center justify-center">
                <span className="font-display italic text-paper-100 text-xl leading-none">
                  V
                </span>
              </div>
            </div>
            <div>
              <p className="font-display text-2xl leading-tight tracking-tight text-paper-100">
                VasoChain
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-paper-300/50 font-mono mt-1">
                Libro de registros · Trujillo
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl border border-ledger-600 bg-ledger-950/50 hover:bg-ledger-800/80 hover:border-confirm-400/30 transition-all"
            aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          >
            {theme === 'dark' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-seal-400"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-seal-500"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex-1 px-6 py-6 space-y-2">
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              className={({ isActive }) =>
                `group flex items-center gap-4 px-4 py-3 rounded-2xl text-sm transition-all border border-transparent ${
                  isActive
                    ? 'bg-ledger-800 text-paper-100 border-confirm-400/30 shadow-soft-xl'
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

        <div className="px-8 py-8 border-t border-ledger-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                {user?.nombre?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm text-paper-100 font-medium">{user?.nombre || 'Usuario'}</p>
                <p className="text-xs text-paper-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-paper-400 hover:text-red-400 hover:bg-red-900/20 transition-all"
              title="Cerrar sesión"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-confirm-400/80 font-mono mb-3">
            <span className="w-2 h-2 rounded-full bg-confirm-400 animate-pulse" />
            Cadena activa
          </div>
          <p className="text-xs text-paper-300/40 leading-relaxed font-mono">
            Cada folio queda sellado e inalterable al validarse.
          </p>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-12 py-10">{children}</div>
      </main>
    </div>
  );
}
