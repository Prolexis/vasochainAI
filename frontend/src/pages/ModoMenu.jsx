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
      console.error('Error cargando menú:', error);
    } finally {
      setCargando(false);
    }
  }

  async function buscarControles() {
    try {
      const data = await api.buscarControles(busqueda);
      setResultados(data || []);
    } catch (error) {
      console.error('Error en búsqueda de controles:', error);
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-10 h-10 border-3 border-confirm-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-paper-300/60 font-mono">Cargando catálogo de controles…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Institucional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-ledger-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium tracking-wide bg-confirm-500/15 text-confirm-400 border border-confirm-500/25">
              CATÁLOGO RÁPIDO
            </span>
            <span className="text-xs text-paper-300/50">· Búsqueda y consulta</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-paper-100 tracking-tight">
            Modo Menú de Controles
          </h1>
          <p className="text-sm text-paper-300/70 mt-1">
            Búsqueda directa, acceso rápido y consulta detallada de controles operativos
          </p>
        </div>
      </div>

      {/* Barra de Búsqueda simple y estilizada */}
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-paper-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Buscar por código (ej. CTRL-001) o palabras clave en la descripción…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-ledger-900 border border-ledger-700 rounded-xl pl-12 pr-10 py-3 text-sm text-paper-100 placeholder:text-paper-400/50 focus:outline-none focus:border-confirm-400 focus:ring-2 focus:ring-confirm-400/20 transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => {
                setBusqueda('');
                setResultados([]);
              }}
              className="absolute inset-y-0 right-3 flex items-center text-paper-400 hover:text-paper-200"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {resultados.length > 0 && (
          <div className="mt-3 bg-ledger-900 border border-ledger-700 rounded-xl shadow-xl overflow-hidden divide-y divide-ledger-800">
            <div className="px-4 py-2.5 bg-ledger-950/60 text-xs font-mono text-paper-300/60">
              {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {resultados.map((control) => (
                <button
                  key={control.id}
                  onClick={() => {
                    setControlSeleccionado(control);
                    setBusqueda('');
                    setResultados([]);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-ledger-800/60 transition-colors flex items-center justify-between gap-4 text-xs group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-confirm-400">{control.identificador}</span>
                      {control.esFrecuente && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 font-mono">
                          Frecuente
                        </span>
                      )}
                      <span className="text-[11px] text-paper-300/50 font-mono">· {control.categoria?.nombre || 'General'}</span>
                    </div>
                    <p className="text-paper-200 truncate">{control.descripcion}</p>
                  </div>
                  <span className="text-paper-400 group-hover:text-confirm-400 font-mono shrink-0">Ver →</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controles de Uso Frecuente */}
      {menuData?.frecuentes && menuData.frecuentes.length > 0 && (
        <div className="rounded-2xl bg-ledger-900/60 border border-ledger-700/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">★</span>
              <h2 className="text-sm font-semibold text-paper-100">Controles de Uso Frecuente</h2>
            </div>
            <span className="text-xs font-mono text-paper-300/50">{menuData.frecuentes.length} controles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuData.frecuentes.map((control) => (
              <button
                key={control.id}
                onClick={() => setControlSeleccionado(control)}
                className="rounded-xl p-3.5 bg-ledger-950/70 border border-ledger-700/70 hover:border-amber-400/40 text-left transition-all hover:bg-ledger-900 group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-amber-400">{control.identificador}</span>
                  <span className="text-[10px] text-paper-300/50 group-hover:text-amber-300">Detalles →</span>
                </div>
                <p className="text-xs text-paper-200 line-clamp-2 leading-relaxed">{control.descripcion}</p>
                <p className="text-[11px] text-paper-300/50 font-mono mt-2">
                  {control.categoria?.nombre || 'Sin categoría'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categorías de Controles */}
      {menuData?.categorias && menuData.categorias.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-paper-200 uppercase tracking-wider font-mono">
            Controles por Categoría ({menuData.categorias.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuData.categorias.map((cat) => (
              <div key={cat.id} className="rounded-2xl bg-ledger-900/60 border border-ledger-700/60 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-paper-100">{cat.nombre}</h3>
                    {cat.descripcion && <p className="text-xs text-paper-300/60 mt-0.5">{cat.descripcion}</p>}
                  </div>
                  <span className="text-xs font-mono text-paper-300/50 bg-ledger-800 px-2 py-0.5 rounded">
                    {cat.controles?.length || 0}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  {cat.controles && cat.controles.length > 0 ? (
                    cat.controles.slice(0, 4).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setControlSeleccionado({ ...c, categoria: cat })}
                        className="w-full text-left px-3 py-2 rounded-lg bg-ledger-950/50 hover:bg-ledger-800/60 border border-ledger-800/60 text-xs flex items-center justify-between group transition-colors"
                      >
                        <div className="truncate mr-2">
                          <span className="font-mono font-bold text-confirm-400 mr-2">{c.identificador}</span>
                          <span className="text-paper-300/80">{c.descripcion}</span>
                        </div>
                        <span className="text-paper-400 group-hover:text-confirm-400 font-mono text-[11px]">→</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-paper-300/40 italic">Sin controles registrados</p>
                  )}
                  {cat.controles && cat.controles.length > 4 && (
                    <p className="text-[11px] font-mono text-paper-300/50 text-right pt-1">
                      +{cat.controles.length - 4} controles adicionales
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Detalle de Control */}
      {controlSeleccionado && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setControlSeleccionado(null)}
        >
          <div
            className="bg-ledger-900 border border-ledger-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-xs font-bold text-confirm-400">
                  {controlSeleccionado.identificador}
                </span>
                <h3 className="text-base font-semibold text-paper-100 mt-1">
                  {controlSeleccionado.descripcion}
                </h3>
                <p className="text-xs text-paper-300/60 mt-1 font-mono">
                  Categoría: {controlSeleccionado.categoria?.nombre || 'General'}
                </p>
              </div>
              <button
                onClick={() => setControlSeleccionado(null)}
                className="text-paper-400 hover:text-paper-100 text-sm p-1"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {controlSeleccionado.dependencias && (
              <div className="p-3 bg-ledger-950/70 rounded-xl border border-ledger-800 text-xs">
                <p className="text-[11px] font-mono uppercase text-paper-300/50 mb-1">Dependencias</p>
                <p className="text-paper-300">{JSON.stringify(controlSeleccionado.dependencias)}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setControlSeleccionado(null)}
                className="px-4 py-2 rounded-xl bg-ledger-800 hover:bg-ledger-700 text-paper-200 text-xs font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
