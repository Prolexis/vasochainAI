import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function DashboardControles() {
  const [controles, setControles] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [controlesData, recomendacionesData] = await Promise.all([
        api.listarHarnessControles(),
        api.obtenerHarnessRecomendaciones(),
      ]);
      setControles(controlesData);
      setRecomendaciones(recomendacionesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  }

  async function toggleControl(id, estado) {
    try {
      await api.toggleHarnessControl(id, estado);
      setControles(controles.map(c => 
        c.id === id ? { ...c, estado } : c
      ));
    } catch (error) {
      console.error('Error toggling control:', error);
    }
  }

  function getCriticidadColor(criticidad) {
    switch (criticidad) {
      case 'CRITICA': return 'from-red-500 to-rose-600';
      case 'MEDIA': return 'from-amber-500 to-orange-500';
      case 'BAJA': return 'from-blue-500 to-indigo-500';
      default: return 'from-gray-500 to-slate-600';
    }
  }

  function getNivelIcon(nivel) {
    switch (nivel) {
      case 'NIVEL_1_ENTRADA': return '🚪';
      case 'NIVEL_2_FOTO': return '📸';
      case 'NIVEL_3_DATOS': return '📊';
      case 'NIVEL_4_BLOCKCHAIN': return '🔗';
      case 'NIVEL_5_SUPERVISION': return '👀';
      default: return '📌';
    }
  }

  function getNivelLabel(nivel) {
    switch (nivel) {
      case 'NIVEL_1_ENTRADA': return 'Nivel 1: Entrada';
      case 'NIVEL_2_FOTO': return 'Nivel 2: Foto';
      case 'NIVEL_3_DATOS': return 'Nivel 3: Datos';
      case 'NIVEL_4_BLOCKCHAIN': return 'Nivel 4: Blockchain';
      case 'NIVEL_5_SUPERVISION': return 'Nivel 5: Supervisión';
      default: return nivel;
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-paper-400 text-lg">Cargando dashboard de controles...</p>
        </div>
      </div>
    );
  }

  const controlesPorNivel = controles.reduce((acc, control) => {
    if (!acc[control.nivel]) acc[control.nivel] = [];
    acc[control.nivel].push(control);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-display font-bold gradient-text">
            🎛️ Dashboard de Controles
          </h1>
          <p className="text-paper-400 mt-3 text-xl">
            Sistema de arnés Lean Startup: de más a menos
          </p>
        </div>
        {recomendaciones.length > 0 && (
          <button
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-8 py-4 rounded-3xl font-semibold text-lg transition-all shadow-soft-xl hover-lift flex items-center gap-3"
          >
            ⚠️ {recomendaciones.length} recomendaciones de desactivación
          </button>
        )}
      </div>

      {/* Tarjetas de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card glass-border p-8 rounded-3xl shadow-soft-xl hover-lift">
          <div className="text-4xl mb-4">✅</div>
          <div className="text-5xl font-display font-bold text-emerald-300 mb-2">
            {controles.filter(c => c.estado).length}
          </div>
          <div className="text-paper-400 text-base">Controles Activos</div>
        </div>
        <div className="glass-card glass-border p-8 rounded-3xl shadow-soft-xl hover-lift">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-5xl font-display font-bold text-blue-300 mb-2">
            {controles.filter(c => !c.estado).length}
          </div>
          <div className="text-paper-400 text-base">Controles Inactivos</div>
        </div>
        <div className="glass-card glass-border p-8 rounded-3xl shadow-soft-xl hover-lift">
          <div className="text-4xl mb-4">🔴</div>
          <div className="text-5xl font-display font-bold text-rose-300 mb-2">
            {controles.filter(c => c.criticidad === 'CRITICA').length}
          </div>
          <div className="text-paper-400 text-base">Criticidad Alta</div>
        </div>
        <div className="glass-card glass-border p-8 rounded-3xl shadow-soft-xl hover-lift">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-5xl font-display font-bold text-purple-300 mb-2">13</div>
          <div className="text-paper-400 text-base">Total Controles</div>
        </div>
      </div>

      {/* Lista de controles por nivel */}
      {Object.keys(controlesPorNivel).map(nivel => (
        <section key={nivel} className="space-y-6">
          <h2 className="text-3xl font-display font-semibold text-paper-100 border-b border-ledger-600 pb-4 flex items-center gap-3">
            <span className="text-4xl">{getNivelIcon(nivel)}</span>
            {getNivelLabel(nivel)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {controlesPorNivel[nivel].map(control => (
              <div
                key={control.id}
                className={`group glass-card glass-border rounded-3xl p-8 hover-lift transition-all ${
                  !control.estado ? 'opacity-60 grayscale' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${getCriticidadColor(control.criticidad)} text-white font-bold text-lg shadow-lg`}>
                        {control.id}
                      </span>
                      <span className="font-mono text-lg font-semibold text-paper-100">
                        {control.identificador}
                      </span>
                    </div>
                    <p className="text-paper-200 text-lg leading-relaxed">
                      {control.descripcion}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={control.estado}
                      onChange={(e) => toggleControl(control.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-20 h-10 bg-ledger-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-8 after:w-8 after:transition-all duration-300 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                {control.controlMetric && (
                  <div className="mt-6 pt-5 border-t border-ledger-700/50 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-paper-400">Ejecuciones:</span>
                      <span className="text-paper-200 font-mono text-lg">{control.controlMetric.ejecucionesCount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-paper-400">Valor Ratio:</span>
                      <span className="text-emerald-400 font-mono text-lg">
                        {(control.controlMetric.valorRatio * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-paper-400">Tiempo Total:</span>
                      <span className="text-paper-200 font-mono text-lg">
                        {(control.controlMetric.tiempoAgregadoMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <div className="h-3 bg-ledger-800 rounded-full overflow-hidden mt-3">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, control.controlMetric.valorRatio * 1000)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
