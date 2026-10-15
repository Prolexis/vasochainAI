import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { tieneAccesoRuta } from '../lib/permissions';

// ── Iconos SVG inline ────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const IconBeneficiaries = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconDeliveries = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconSimulator = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconControls = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
  </svg>
);
const IconRules = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const IconStats = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconSun = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const IconMoon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconChain = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// ── Navegación del sistema ──────────────────────────────────────────────────
const secciones = [
  {
    grupo: 'Principal',
    items: [
      { to: '/', label: 'Panel General', sublabel: 'Resumen operativo', icon: IconDashboard },
    ],
  },
  {
    grupo: 'Operaciones',
    items: [
      { to: '/beneficiarios', label: 'Beneficiarios', sublabel: 'Padrón y carnets QR', icon: IconBeneficiaries },
      { to: '/entregas', label: 'Entregas', sublabel: 'Registro con foto y blockchain', icon: IconDeliveries },
      { to: '/simulador', label: 'Simulador Bot', sublabel: 'WhatsApp · Telegram · Discord', icon: IconSimulator },
    ],
  },
  {
    grupo: 'Control y Auditoría',
    items: [
      { to: '/controles', label: 'Gestión de Controles', sublabel: 'Reglas y categorías', icon: IconControls },
      { to: '/controles/menu', label: 'Modo Menú', sublabel: 'Búsqueda y consulta rápida', icon: IconRules },
      { to: '/controles/dashboard', label: 'Dashboard Controles', sublabel: 'Monitoreo de niveles', icon: IconStats },
    ],
  },
];


export default function Layout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Badge de rol con color según tipo
  const rolColor = (() => {
    const r = (user?.rol || '').toLowerCase();
    if (r.includes('admin') || r.includes('supervisor')) return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    if (r.includes('auditor') || r.includes('oci')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  })();

  const rolLabel = (() => {
    const r = (user?.rol || '').toLowerCase();
    if (r.includes('admin') || r.includes('supervisor')) return 'Supervisor';
    if (r.includes('auditor') || r.includes('oci')) return 'Auditor · OCI';
    return 'Coordinator';
  })();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ledger-950 text-paper-200 transition-colors duration-300">

      {/* ── Header Móvil ── */}
      <header className="lg:hidden sticky top-0 z-40 bg-ledger-900/95 backdrop-blur-md border-b border-ledger-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-ledger-700 bg-ledger-950/60 text-paper-100 hover:border-confirm-400/40"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <span className="font-display font-bold text-lg text-paper-100 tracking-tight">
            VasoChain <span className="text-confirm-400">AI</span>
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-ledger-700 bg-ledger-950/60 text-paper-300"
          title="Toggle theme"
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
      </header>

      {/* Overlay móvil */}
      {mobileMenuOpen && (
        <div onClick={closeMenu} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col
          bg-ledger-900 border-r border-ledger-700/60
          transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-ledger-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-confirm-500 to-seal-500" />
              <div className="absolute inset-0.5 rounded-[10px] bg-ledger-950 flex items-center justify-center">
                <span className="font-display italic text-paper-100 text-base font-bold leading-none">V</span>
              </div>
            </div>
            <div>
              <p className="font-display text-base font-bold text-paper-100 leading-tight">VasoChain AI</p>
              <p className="text-[9px] uppercase tracking-widest text-paper-300/40 font-mono">Blockchain · AI · Social Aid</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="hidden lg:flex p-2 rounded-xl border border-ledger-700 bg-ledger-950/50 hover:border-confirm-400/30 text-paper-300/60 hover:text-paper-200 transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
        </div>

        {/* Nav con secciones */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {secciones.map((seccion) => {
            const itemsAutorizados = seccion.items.filter((item) =>
              tieneAccesoRuta(user?.rol, item.to)
            );
            if (itemsAutorizados.length === 0) return null;
            return (
              <div key={seccion.grupo}>
                <p className="px-3 mb-1.5 text-[9px] font-mono uppercase tracking-[0.2em] text-paper-300/30 select-none">
                  {seccion.grupo}
                </p>
                <div className="space-y-0.5">
                  {itemsAutorizados.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMenu}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          isActive
                            ? 'bg-confirm-500/10 text-paper-100 border border-confirm-400/25 shadow-sm'
                            : 'text-paper-300/60 hover:bg-ledger-800/70 hover:text-paper-200 border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-confirm-500/20 text-confirm-400'
                              : 'bg-ledger-800/60 text-paper-300/50 group-hover:bg-ledger-700/60 group-hover:text-paper-300'
                          }`}>
                            <item.icon />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium leading-tight ${isActive ? 'text-paper-100' : 'text-paper-200/70 group-hover:text-paper-200'}`}>
                              {item.label}
                            </p>
                            <p className="text-[10px] text-paper-300/35 truncate leading-tight mt-0.5">
                              {item.sublabel}
                            </p>
                          </div>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-confirm-400 shrink-0" />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer usuario */}
        <div className="px-4 py-4 border-t border-ledger-700/60 bg-ledger-950/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.nombre?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-paper-100 font-semibold truncate">{user?.nombre || 'Usuario'}</p>
              <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded-md border ${rolColor} leading-tight mt-0.5`}>
                {rolLabel}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-paper-300/40 hover:text-red-400 hover:bg-red-900/20 transition-all shrink-0"
              title="Sign out"
            >
              <IconLogout />
            </button>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-ledger-800/50 border border-ledger-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-confirm-400 animate-pulse shrink-0" />
            <IconChain />
            <span className="text-[10px] text-paper-300/50 font-mono">Blockchain · Live</span>
          </div>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
