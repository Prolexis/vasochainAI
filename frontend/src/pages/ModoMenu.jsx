import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function ModoMenu() {
  const [menuData, setMenuData] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [controlSeleccionado, setControlSeleccionado] = useState(null);

  useEffect(() => {
    cargarMenu();
  }, []);

  useEffect(() => {
    if (busqueda.trim()) {
      buscarControles();
    } else {
      setResultados([]);
    }
  }, [busqueda]);

  async function cargarMenu() {
    try {
      const data = await api.obtenerMenuModo();
      setMenuData(data);
    } catch (error) {
      console.error('Error cargando menu:', error);
    } finally {
      setCargando(false);
    }
  }

  async function buscarControles() {
    try {
      const data = await api.buscarControles(busqueda);
      setResultados(data);
    } catch (error) {
      console.error('Error buscando:', error);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-emerald-400 border-t-transparent mx-auto mb-8"></div>
          <p className="text-paper-400 text-xl">Preparando modo menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 min-h-screen" role="main" aria-labelledby="menu-title">
      <div className="text-center py-10">
        <h1 id="menu-title" className="text-5xl font-display font-bold gradient-text mb-4">
          🎯 Modo Menú
        </h1>
        <p className="text-paper-400 text-xl">
          Acceso rápido y estructurado a todos tus controles operativos
        </p>
      </div>

      <div className="max-w-4xl mx-auto" role="search">
        <label htmlFor="busqueda-controles" className="sr-only">
          Buscar controles por identificador o descripción
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
            <span className="text-3xl">🔍</span>
          </div>
          <input
            id="busqueda-controles"
            type="search"
            placeholder="Busca cualquier control..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-gradient-to-r from-ledger-900 to-ledger-950 border-2 border-ledger-600 rounded-[32px] px-24 py-7 text-paper-200 text-xl focus:outline-none focus:border-emerald-400 focus:ring-8 focus:ring-emerald-400/20 transition-all duration-300 shadow-soft-xl"
            aria-label="Buscar controles"
          />
          {busqueda && (
            <button
              onClick={() => {
                setBusqueda('');
                setResultados([]);
              }}
              className="absolute inset-y-0 right-8 flex items-center text-paper-400 hover:text-paper-200 transition-colors duration-300"
              aria-label="Limpiar búsqueda"
            >
              <span className="text-3xl">✕</span>
            </button>
          )}
        </div>

        {resultados.length > 0 && (
          <div className="mt-6 glass-card glass-border rounded-3xl shadow-soft-xl overflow-hidden">
            <div className="p-6 border-b border-ledger-700 bg-ledger-950/30">
              <p className="text-paper-400 text-base font-mono">
                📋 {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="max-h-[500px] overflow-y-auto scroll-thin">
              {resultados.map((control) => (
                <button
                  key={control.id}
                  onClick={() => {
                    setControlSeleccionado(control);
                    setBusqueda('');
                    setResultados([]);
                  }}
                  className="w-full text-left px-8 py-6 hover:bg-ledger-800/60 border-b border-ledger-700/50 last:border-0 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="font-mono text-2xl font-bold text-emerald-400">
                          {control.identificador}
                        </span>
                        {control.esFrecuente && (
                          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                            ⭐ Frecuente
                          </span>
                        )}
                      </div>
                      <p className="text-paper-200 text-lg leading-relaxed">{control.descripcion}</p>
                      <p className="text-paper-400 text-sm mt-3">
                        📁 {control.categoria?.nombre || 'Sin categoría'}
                      </p>
                    </div>
                    <span className="text-paper-500 group-hover:text-emerald-400 transition-colors duration-300 text-4xl">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {controlSeleccionado && (
        <div
          className="fixed inset-0 bg-ledger-950/70 backdrop-blur-3xl flex items-center justify-center px-8 z-50"
          onClick={() => setControlSeleccionado(null)}
        >
          <div
            className="glass-card glass-border rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-soft-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10">
              <div className="flex items-start justify-between gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <span className="font-mono text-2xl font-bold text-emerald-400">
                      {controlSeleccionado.identificador}
                    </span>
                    {controlSeleccionado.esFrecuente && (
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                        ⭐ Frecuente
                      </span>
                    )}
                  </div>
                  <h2 id="modal-title" className="text-3xl font-display font-semibold text-paper-100 mb-4">
                    {controlSeleccionado.descripcion}
                  </h2>
                  <p className="text-paper-400 text-lg">
                    📁 {controlSeleccionado.categoria?.nombre || 'Sin categoría'}
                  </p>
                </div>
                <button
                  onClick={() => setControlSeleccionado(null)}
                  className="text-paper-400 hover:text-paper-200 hover:bg-ledger-800/50 p-4 rounded-2xl transition-all duration-300"
                  aria-label="Cerrar"
                >
                  <span className="text-3xl">✕</span>
                </button>
              </div>

              <div className="space-y-6">
                {controlSeleccionado.dependencias && (
                  <div className="bg-ledger-950/40 p-6 rounded-3xl border border-ledger-700">
                    <h4 className="text-paper-300 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-3">
                      🔗 Dependencias
                    </h4>
                    <pre className="text-paper-300 text-sm whitespace-pre-wrap font-mono">
                      {JSON.stringify(controlSeleccionado.dependencias, null, 2)}
                    </pre>
                  </div>
                )}

                {controlSeleccionado.requerimientosAcceso && (
                  <div className="bg-ledger-950/40 p-6 rounded-3xl border border-ledger-700">
                    <h4 className="text-paper-300 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-3">
                      🔐 Requerimientos de Acceso
                    </h4>
                    <pre className="text-paper-300 text-sm whitespace-pre-wrap font-mono">
                      {JSON.stringify(controlSeleccionado.requerimientosAcceso, null, 2)}
                    </pre>
                  </div>
                )}

                {controlSeleccionado.objetivosAlineados && (
                  <div className="bg-ledger-950/40 p-6 rounded-3xl border border-ledger-700">
                    <h4 className="text-paper-300 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-3">
                      🎯 Objetivos Alineados
                    </h4>
                    <pre className="text-paper-300 text-sm whitespace-pre-wrap font-mono">
                      {JSON.stringify(controlSeleccionado.objetivosAlineados, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-10 flex gap-5">
                <button
                  onClick={() => setControlSeleccionado(null)}
                  className="flex-1 bg-ledger-700 hover:bg-ledger-600 text-paper-200 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover-lift"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {menuData?.frecuentes?.length > 0 && (
        <div className="glass-card glass-border rounded-3xl p-10 shadow-soft-xl" style={{background: 'linear-gradient(135deg, rgba(202, 138, 4, 0.1), rgba(180, 83, 9, 0.05))', borderColor: 'rgba(202, 138, 4, 0.3)'}}>
          <h2 className="text-3xl font-display font-semibold text-amber-200 mb-8 flex items-center gap-4">
            ⭐ Controles de Uso Frecuente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuData.frecuentes.map((control) => (
              <button
                key={control.id}
                onClick={() => setControlSeleccionado(control)}
                className="group bg-ledger-900/70 border border-ledger-700 rounded-3xl p-8 text-left hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10 hover:bg-ledger-850/80 transition-all duration-300 focus:outline-none focus:ring-8 focus:ring-amber-400/20 hover-lift"
              >
                <span className="font-mono text-lg font-bold text-amber-400">
                  {control.identificador}
                </span>
                <p className="text-paper-200 text-lg mt-4 leading-relaxed line-clamp-2">
                  {control.descripcion}
                </p>
                <p className="text-paper-400 text-sm mt-5">
                  {control.categoria?.nombre || 'Sin categoría'}
                </p>
                <div className="mt-6 text-amber-400/70 text-sm group-hover:text-amber-300 transition-colors duration-300 flex items-center gap-2">
                  Ver detalles →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-12">
        {menuData?.categorias?.map((categoria) =>
          categoria.controls?.length > 0 && (
            <section key={categoria.id} aria-labelledby={`categoria-${categoria.id}`}>
              <h2 id={`categoria-${categoria.id}`} className="text-3xl font-display font-semibold text-paper-200 mb-8 pb-4 border-b border-ledger-700">
                📁 {categoria.nombre}
              </h2>
              {categoria.descripcion && (
                <p className="text-paper-400 text-lg mb-8">{categoria.descripcion}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoria.controls.map((control) => (
                  <button
                    key={control.id}
                    onClick={() => setControlSeleccionado(control)}
                    className="group glass-card glass-border rounded-3xl p-8 text-left hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/10 hover:bg-ledger-850/70 transition-all duration-300 focus:outline-none focus:ring-8 focus:ring-emerald-400/20 hover-lift"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <span className="font-mono text-lg font-bold text-emerald-400">
                        {control.identificador}
                      </span>
                      {control.esFrecuente && (
                        <span className="text-amber-400 text-xl">⭐</span>
                      )}
                    </div>
                    <p className="text-paper-200 text-lg leading-relaxed line-clamp-3">
                      {control.descripcion}
                    </p>
                    <div className="mt-6 text-emerald-400/70 text-sm group-hover:text-emerald-300 transition-colors duration-300 flex items-center gap-2">
                      Ver detalles →
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )
        )}
      </div>

      {!menuData?.categorias?.some((c) => c.controls?.length > 0) && !busqueda && (
        <div className="text-center py-20 glass-card glass-border rounded-3xl">
          <div className="text-8xl mb-8">📭</div>
          <h3 className="text-3xl font-semibold text-paper-200 mb-6">
            No hay controles disponibles
          </h3>
          <p className="text-paper-400 text-lg mb-10 max-w-2xl mx-auto">
            Ve a la sección de Gestión de Controles para crear tus primeros controles
          </p>
          <a
            href="/controles"
            className="inline-flex items-center gap-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-10 py-5 rounded-2xl font-semibold text-xl transition-all duration-300 shadow-xl hover-lift"
          >
            ⚙️ Ir a Gestión de Controles
          </a>
        </div>
      )}
    </div>
  );
}
