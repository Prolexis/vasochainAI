import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function DashboardControles() {
  const [controles, setControles] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState('TODOS');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [controlesData, recomendacionesData] = await Promise.all([
        api.listarHarnessControles(),
        api.obtenerHarnessRecomendaciones(),
      ]);
      setControles(controlesData || []);
      setRecomendaciones(recomendacionesData || []);
    } catch (error) {
      console.error('Error cargando controles:', error);
    } finally {
      setCargando(false);
    }
  }

  async function toggleControl(id, estado) {
    try {
      await api.toggleHarnessControl(id, estado);
      setControles((prev) =>
        prev.map((c) => (c.id === id ? { ...c, estado } : c))
      );
    } catch (error) {
      console.error('Error al cambiar estado del control:', error);
    }
  }

  function getCriticidadBadge(criticidad) {
    switch (criticidad) {
      case 'CRITICA':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'MEDIA':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'BAJA':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-ledger-800 text-paper-300 border-ledger-700';
    }
  }

  function getNivelLabel(nivel) {
    switch (nivel) {
      case 'NIVEL_1_ENTRADA':
        return { num: '1', nombre: 'Validación de Entrada' };
      case 'NIVEL_2_FOTO':
        return { num: '2', nombre: 'Verificación de Evidencia' };
      case 'NIVEL_3_DATOS':
        return { num: '3', nombre: 'Consistencia de Datos' };
      case 'NIVEL_4_BLOCKCHAIN':
        return { num: '4', nombre: 'Registro en Blockchain' };
      case 'NIVEL_5_SUPERVISION':
        return { num: '5', nombre: 'Supervisión OCI' };
      default:
        return { num: '•', nombre: nivel };
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-10 h-10 border-3 border-confirm-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-paper-300/60 font-mono">Cargando dashboard de controles…</p>
      </div>
    );
  }

  const controlesPorNivel = controles.reduce((acc, control) => {
    const niv = control.nivel || 'OTROS';
    if (!acc[niv]) acc[niv] = [];
    acc[niv].push(control);
    return acc;
  }, {});

  const nivelesDisponibles = Object.keys(controlesPorNivel);
  const nivelesFiltrados =
    filtroNivel === 'TODOS'
      ? nivelesDisponibles
      : nivelesDisponibles.filter((n) => n === filtroNivel);

  const activosCount = controles.filter((c) => c.estado).length;
  const inactivosCount = controles.filter((c) => !c.estado).length;
  const criticosCount = controles.filter((c) => c.criticidad === 'CRITICA').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado limpio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-paper-100">
            Dashboard de Controles
          </h1>
          <p className="text-sm text-paper-300/60 mt-0.5">
            Supervisión, activación y métricas de las reglas de verificación del programa.
          </p>
        </div>

        {recomendaciones.length > 0 && (
          <span className="self-start sm:self-auto text-xs font-mono px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            {recomendaciones.length} recomendación(es) disponible(s)
          </span>
        )}
      </div>

      {/* Tarjetas de métricas simples */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Controles Activos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-confirm-400">{activosCount}</span>
            <span className="text-xs text-paper-300/50 font-mono">/ {controles.length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Inactivos</p>
          <p className="text-2xl font-bold font-mono text-paper-300 mt-1">{inactivosCount}</p>
        </div>

        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Criticidad Alta</p>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{criticosCount}</p>
        </div>

        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Etapas del Proceso</p>
          <p className="text-2xl font-bold font-mono text-seal-400 mt-1">{nivelesDisponibles.length}</p>
        </div>
      </div>

      {/* Filtro por nivel tipo pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFiltroNivel('TODOS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap border ${
            filtroNivel === 'TODOS'
              ? 'bg-ledger-800 text-paper-100 border-ledger-600'
              : 'border-ledger-800 bg-ledger-950/60 text-paper-300/60 hover:text-paper-100'
          }`}
        >
          Todos ({controles.length})
        </button>
        {nivelesDisponibles.map((nivel) => {
          const info = getNivelLabel(nivel);
          const count = controlesPorNivel[nivel]?.length || 0;
          return (
            <button
              key={nivel}
              onClick={() => setFiltroNivel(nivel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap border ${
                filtroNivel === nivel
                  ? 'bg-ledger-800 text-paper-100 border-ledger-600'
                  : 'border-ledger-800 bg-ledger-950/60 text-paper-300/60 hover:text-paper-100'
              }`}
            >
              Nivel {info.num}: {info.nombre} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de Controles por Nivel */}
      <div className="space-y-4">
        {nivelesFiltrados.map((nivel) => {
          const info = getNivelLabel(nivel);
          const lista = controlesPorNivel[nivel] || [];

          return (
            <div
              key={nivel}
              className="rounded-2xl border border-ledger-700 bg-ledger-900 overflow-hidden"
            >
              {/* Encabezado del Nivel */}
              <div className="px-5 py-3 bg-ledger-950/60 border-b border-ledger-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-ledger-800 text-confirm-400 flex items-center justify-center font-mono text-xs font-bold">
                    {info.num}
                  </span>
                  <h2 className="text-sm font-semibold text-paper-100">{info.nombre}</h2>
                </div>
                <span className="text-xs font-mono text-paper-300/50">
                  {lista.filter((c) => c.estado).length} de {lista.length} activos
                </span>
              </div>

              {/* Lista limpia de controles */}
              <div className="divide-y divide-ledger-800/80">
                {lista.map((control) => (
                  <div
                    key={control.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      control.estado ? 'hover:bg-ledger-800/30' : 'bg-ledger-950/40 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-confirm-400">
                          {control.identificador}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getCriticidadBadge(
                            control.criticidad
                          )}`}
                        >
                          {control.criticidad}
                        </span>
                      </div>
                      <p className="text-xs text-paper-200 leading-relaxed">
                        {control.descripcion}
                      </p>
                      {control.controlMetric && (
                        <p className="text-[11px] font-mono text-paper-300/50 pt-0.5">
                          {control.controlMetric.ejecucionesCount || 0} ejecuciones · Efectividad:{' '}
                          <span className="text-confirm-400">
                            {((control.controlMetric.valorRatio || 0) * 100).toFixed(0)}%
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Switch simple */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <span className="text-xs font-mono text-paper-300/60">
                        {control.estado ? 'Activo' : 'Pausado'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={control.estado}
                          onChange={(e) => toggleControl(control.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-ledger-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-confirm-500" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
