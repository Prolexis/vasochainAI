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
      setMenuData(data || null);
    } catch (error) {
      console.error('Error cargando menú:', error);
    } finally {
      setCargando(false);
    }
  }

  async function buscarControles() {
    try {
      const data = await api.buscarControles(busqueda.trim());
      setResultados(data || []);
    } catch (error) {
      console.error('Error buscando controles:', error);
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-10 h-10 border-3 border-confirm-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-paper-300/60 font-mono">Cargando catálogo…</p>
      </div>
    );
  }

  const frecuentes = menuData?.frecuentes || [];
  const categorias = menuData?.categorias || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado limpio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-paper-100">
            Modo Menú de Controles
          </h1>
          <p className="text-sm text-paper-300/60 mt-0.5">
            Búsqueda directa, acceso rápido y consulta detallada de controles operativos.
          </p>
        </div>
      </div>

      {/* Buscador limpio */}
      <div className="relative">
        <input
          type="search"
          placeholder="Buscar control por código (ej. CTRL-001) o palabras clave en la descripción…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-2xl border border-ledger-700 bg-ledger-900 px-4 py-3 text-sm text-paper-100 placeholder:text-paper-300/40 focus:border-confirm-400 focus:outline-none transition-colors"
        />
        {busqueda && (
          <button
            onClick={() => {
              setBusqueda('');
              setResultados([]);
            }}
            className="absolute inset-y-0 right-4 flex items-center text-xs text-paper-400 hover:text-paper-100 font-mono"
          >
            Limpiar ✕
          </button>
        )}

        {/* Resultados de búsqueda */}
        {resultados.length > 0 && (
          <div className="mt-2 rounded-2xl border border-ledger-700 bg-ledger-900 shadow-xl overflow-hidden divide-y divide-ledger-800">
            <div className="px-4 py-2 bg-ledger-950/70 text-xs font-mono text-paper-300/60 flex items-center justify-between">
              <span>{resultados.length} resultado(s) encontrado(s)</span>
              <span className="text-[11px]">Haz clic para ver detalles</span>
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
                  className="w-full text-left px-4 py-3 hover:bg-ledger-800/60 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-confirm-400">{control.identificador}</span>
                      <span className="text-[11px] text-paper-300/50 font-mono">
                        · {control.categoria?.nombre || 'General'}
                      </span>
                    </div>
                    <p className="text-xs text-paper-200 truncate">{control.descripcion}</p>
                  </div>
                  <span className="text-xs text-paper-400 group-hover:text-confirm-400 font-mono shrink-0">
                    Ver →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controles Frecuentes */}
      {frecuentes.length > 0 && (
        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-paper-100">Controles de Uso Frecuente</p>
            <span className="text-xs font-mono text-paper-300/50">{frecuentes.length} controles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {frecuentes.map((control) => (
              <button
                key={control.id}
                onClick={() => setControlSeleccionado(control)}
                className="text-left rounded-xl p-3.5 border border-ledger-800 bg-ledger-950/70 hover:border-ledger-600 hover:bg-ledger-800/40 transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-confirm-400">{control.identificador}</span>
                    <span className="text-[10px] text-paper-300/40 group-hover:text-paper-300">Detalles →</span>
                  </div>
                  <p className="text-xs text-paper-200 line-clamp-2 leading-relaxed">{control.descripcion}</p>
                </div>
                <p className="text-[10px] text-paper-300/50 font-mono mt-3">
                  {control.categoria?.nombre || 'General'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categorías y sus Controles */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-paper-200">
          Catálogo por Categoría ({categorias.length})
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categorias.map((cat) => {
            const listaControles = cat.controls || cat.controles || [];
            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-ledger-700 bg-ledger-900 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-paper-100">{cat.nombre}</h2>
                    {cat.descripcion && (
                      <p className="text-xs text-paper-300/50 mt-0.5">{cat.descripcion}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono text-paper-300/60 bg-ledger-950 px-2 py-0.5 rounded border border-ledger-800">
                    {listaControles.length}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {listaControles.length > 0 ? (
                    listaControles.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setControlSeleccionado({ ...c, categoria: cat })}
                        className="w-full text-left p-2.5 rounded-xl bg-ledger-950/60 hover:bg-ledger-800/60 border border-ledger-800/70 text-xs flex items-center justify-between group transition-colors"
                      >
                        <div className="truncate mr-2">
                          <span className="font-mono font-bold text-confirm-400 mr-2">{c.identificador}</span>
                          <span className="text-paper-200">{c.descripcion}</span>
                        </div>
                        <span className="text-paper-400 group-hover:text-confirm-400 font-mono text-[11px] shrink-0">
                          →
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-paper-300/40 italic py-2">
                      Sin controles asociados en esta categoría
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalle */}
      {controlSeleccionado && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setControlSeleccionado(null)}
        >
          <div
            className="rounded-2xl border border-ledger-700 bg-ledger-900 max-w-lg w-full p-6 space-y-4 shadow-2xl"
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
                <p className="text-xs text-paper-300/50 font-mono mt-1">
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
              <div className="p-3 rounded-xl bg-ledger-950 border border-ledger-800 text-xs">
                <p className="text-[11px] font-mono text-paper-300/50 uppercase mb-1">Dependencias</p>
                <p className="text-paper-300 font-mono">{JSON.stringify(controlSeleccionado.dependencias)}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setControlSeleccionado(null)}
                className="px-4 py-2 rounded-xl border border-ledger-700 hover:bg-ledger-800 text-paper-200 text-xs font-medium"
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
