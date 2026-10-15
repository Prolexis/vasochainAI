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
      setControles(prev =>
        prev.map(c => (c.id === id ? { ...c, estado } : c))
      );
    } catch (error) {
      console.error('Error al cambiar estado del control:', error);
    }
  }

  function getCriticidadBadge(criticidad) {
    switch (criticidad) {
      case 'CRITICA':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'MEDIA':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'BAJA':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-ledger-700/40 text-paper-300 border-ledger-600/30';
    }
  }

  function getNivelInfo(nivel) {
    switch (nivel) {
      case 'NIVEL_1_ENTRADA':
        return { num: '1', nombre: 'Validación de Entrada', desc: 'Reglas de formato, DNI y duplicados' };
      case 'NIVEL_2_FOTO':
        return { num: '2', nombre: 'Verificación de Evidencia', desc: 'Análisis de foto y calidad de imagen' };
      case 'NIVEL_3_DATOS':
        return { num: '3', nombre: 'Consistencia de Datos', desc: 'Cruce con padrón y cuotas nutricionales' };
      case 'NIVEL_4_BLOCKCHAIN':
        return { num: '4', nombre: 'Registro Blockchain', desc: 'Inmutabilidad y sellado de transacciones' };
      case 'NIVEL_5_SUPERVISION':
        return { num: '5', nombre: 'Supervisión OCI', desc: 'Auditoría externa y muestreo aleatorio' };
      default:
        return { num: '•', nombre: nivel, desc: 'Controles operativos' };
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-10 h-10 border-3 border-confirm-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-paper-300/60 font-mono">Cargando controles operativos…</p>
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
  const nivelesFiltrados = filtroNivel === 'TODOS'
    ? nivelesDisponibles
    : nivelesDisponibles.filter(n => n === filtroNivel);

  const activosCount = controles.filter(c => c.estado).length;
  const inactivosCount = controles.filter(c => !c.estado).length;
  const criticosCount = controles.filter(c => c.criticidad === 'CRITICA').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header institucional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-ledger-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium tracking-wide bg-confirm-500/15 text-confirm-400 border border-confirm-500/25">
              AUDITORÍA & SUPERVISIÓN
            </span>
            <span className="text-xs text-paper-300/50">· Matriz de Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-paper-100 tracking-tight">
            Dashboard de Controles
          </h1>
          <p className="text-sm text-paper-300/70 mt-1">
            Supervisión, activación y métricas de las reglas de verificación del programa
          </p>
        </div>

        {recomendaciones.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-xl text-amber-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{recomendaciones.length} recomendación(es) de optimización</span>
          </div>
        )}
      </div>

      {/* KPI Cards simples y claros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-ledger-900 border border-ledger-700/60 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Controles Activos</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl md:text-3xl font-bold font-mono text-confirm-400">{activosCount}</span>
            <span className="text-xs text-paper-300/50 font-mono">/ {controles.length}</span>
          </div>
          <div className="w-full bg-ledger-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-confirm-400 h-full rounded-full transition-all"
              style={{ width: `${controles.length ? (activosCount / controles.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-ledger-900 border border-ledger-700/60 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Inactivos / Opcionales</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl md:text-3xl font-bold font-mono text-paper-300">{inactivosCount}</span>
            <span className="text-xs text-paper-300/50 font-mono">reglas</span>
          </div>
          <p className="text-[11px] text-paper-300/50 mt-3">Pueden reactivarse según necesidad</p>
        </div>

        <div className="rounded-2xl bg-ledger-900 border border-ledger-700/60 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Criticidad Alta</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl md:text-3xl font-bold font-mono text-rose-400">{criticosCount}</span>
            <span className="text-xs text-paper-300/50 font-mono">bloqueantes</span>
          </div>
          <p className="text-[11px] text-paper-300/50 mt-3">Esenciales para la trazabilidad</p>
        </div>

        <div className="rounded-2xl bg-ledger-900 border border-ledger-700/60 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Niveles de Verificación</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl md:text-3xl font-bold font-mono text-seal-400">{nivelesDisponibles.length}</span>
            <span className="text-xs text-paper-300/50 font-mono">etapas</span>
          </div>
          <p className="text-[11px] text-paper-300/50 mt-3">Desde entrada hasta blockchain</p>
        </div>
      </div>

      {/* Selector de nivel (Tabs simples) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-ledger-700/50">
        <button
          onClick={() => setFiltroNivel('TODOS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
            filtroNivel === 'TODOS'
              ? 'bg-confirm-500/20 text-confirm-300 border border-confirm-500/30'
              : 'text-paper-300/70 hover:text-paper-100 hover:bg-ledger-800/60'
          }`}
        >
          Todos ({controles.length})
        </button>
        {nivelesDisponibles.map(nivel => {
          const info = getNivelInfo(nivel);
          const count = controlesPorNivel[nivel]?.length || 0;
          return (
            <button
              key={nivel}
              onClick={() => setFiltroNivel(nivel)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                filtroNivel === nivel
                  ? 'bg-confirm-500/20 text-confirm-300 border border-confirm-500/30'
                  : 'text-paper-300/70 hover:text-paper-100 hover:bg-ledger-800/60'
              }`}
            >
              Nivel {info.num}: {info.nombre} ({count})
            </button>
          );
        })}
      </div>

      {/* Secciones por Nivel */}
      <div className="space-y-6">
        {nivelesFiltrados.map(nivel => {
          const info = getNivelInfo(nivel);
          const lista = controlesPorNivel[nivel] || [];

          return (
            <div key={nivel} className="rounded-2xl bg-ledger-900/60 border border-ledger-700/60 overflow-hidden">
              {/* Header de nivel */}
              <div className="px-5 py-3.5 bg-ledger-900 border-b border-ledger-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-ledger-800 border border-ledger-700 flex items-center justify-center font-mono text-xs font-bold text-confirm-400">
                    {info.num}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-paper-100">{info.nombre}</h2>
                    <p className="text-xs text-paper-300/60">{info.desc}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-paper-300/50">
                  {lista.filter(c => c.estado).length}/{lista.length} activos
                </span>
              </div>

              {/* Grid de controles del nivel */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lista.map(control => (
                  <div
                    key={control.id}
                    className={`rounded-xl p-4 border transition-all ${
                      control.estado
                        ? 'bg-ledger-950/70 border-ledger-700/80 shadow-sm'
                        : 'bg-ledger-950/30 border-ledger-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-paper-200">
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

                      {/* Switch simple tipo iOS */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={control.estado}
                          onChange={(e) => toggleControl(control.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-ledger-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-confirm-500" />
                      </label>
                    </div>

                    <p className="text-xs text-paper-300/80 line-clamp-2 leading-relaxed">
                      {control.descripcion}
                    </p>

                    {control.controlMetric && (
                      <div className="mt-3 pt-2.5 border-t border-ledger-800/60 flex items-center justify-between text-[11px] font-mono text-paper-300/60">
                        <span>Ejecuciones: <b className="text-paper-200">{control.controlMetric.ejecucionesCount || 0}</b></span>
                        <span>Efectividad: <b className="text-confirm-400">{((control.controlMetric.valorRatio || 0) * 100).toFixed(0)}%</b></span>
                      </div>
                    )}
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
