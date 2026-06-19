import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const ESTADOS = {
  BORRADOR: { label: 'Borrador', color: 'bg-ledger-600', icon: '📝' },
  VALIDADO: { label: 'Validado', color: 'bg-blue-500', icon: '✅' },
  APROBADO: { label: 'Aprobado', color: 'bg-emerald-500', icon: '👍' },
  EN_PRUEBAS: { label: 'En Pruebas', color: 'bg-amber-500', icon: '🧪' },
  PRODUCCION: { label: 'Producción', color: 'bg-green-500', icon: '🚀' },
  DESCARTADO: { label: 'Descartado', color: 'bg-rose-500', icon: '🗑️' },
};

const BadgeEstado = ({ estado }) => {
  const info = ESTADOS[estado] || { label: estado, color: 'bg-gray-500', icon: '❓' };
  return (
    <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold ${info.color} text-white shadow-lg`}>
      <span>{info.icon}</span>
      {info.label}
    </span>
  );
};

const TarjetaKPI = ({ icono, valor, etiqueta, color }) => (
  <div className="glass-card glass-border p-8 rounded-3xl shadow-soft-xl hover-lift">
    <div className="text-5xl mb-4">{icono}</div>
    <div className={`text-5xl font-display font-bold mb-2 ${color}`}>{valor}</div>
    <div className="text-paper-400 text-lg">{etiqueta}</div>
  </div>
);

export default function Controles() {
  const [vista, setVista] = useState('lista');
  const [controles, setControles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [descartados, setDescartados] = useState([]);
  const [informe, setInforme] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  const [formControl, setFormControl] = useState({
    identificador: '',
    descripcion: '',
    categoriaId: '',
    esFrecuente: false,
  });

  const [formCategoria, setFormCategoria] = useState({
    nombre: '',
    descripcion: '',
  });

  const [formDescartar, setFormDescartar] = useState({
    motivoEliminacion: '',
    responsable: '',
  });

  const [formImportar, setFormImportar] = useState(JSON.stringify([
    {
      identificador: 'CTRL-EJEMPLO-001',
      descripcion: 'Descripción del control de ejemplo',
      categoria: 'Mi Categoría',
      esFrecuente: false,
    }
  ], null, 2));

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const [controlesData, categoriasData, descartadosData, informeData] = await Promise.all([
        api.listarControles(),
        api.listarCategorias(),
        api.listarDescartados(),
        api.obtenerInformeDepuracion(),
      ]);
      setControles(controlesData);
      setCategorias(categoriasData);
      setDescartados(descartadosData);
      setInforme(informeData);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
    }
  }

  async function crearControl(e) {
    e.preventDefault();
    try {
      await api.crearControl(formControl);
      setMensaje({ tipo: 'exito', texto: '✅ Control creado exitosamente' });
      setFormControl({ identificador: '', descripcion: '', categoriaId: '', esFrecuente: false });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: '❌ ' + error.message });
    }
  }

  async function crearCategoria(e) {
    e.preventDefault();
    try {
      await api.crearCategoria(formCategoria);
      setMensaje({ tipo: 'exito', texto: '✅ Categoría creada exitosamente' });
      setFormCategoria({ nombre: '', descripcion: '' });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: '❌ ' + error.message });
    }
  }

  async function descartarControl(id) {
    try {
      await api.descartarControl(id, formDescartar);
      setMensaje({ tipo: 'exito', texto: '✅ Control descartado exitosamente' });
      setFormDescartar({ motivoEliminacion: '', responsable: '' });
      setVista('lista');
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: '❌ ' + error.message });
    }
  }

  async function ejecutarPrueba(id) {
    try {
      setMensaje({ tipo: 'info', texto: '🧪 Ejecutando pruebas...' });
      await api.ejecutarPrueba(id, { tipoPrueba: 'Completa', ejecutadoPor: 'Usuario' });
      setMensaje({ tipo: 'exito', texto: '✅ Pruebas ejecutadas exitosamente' });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: '❌ ' + error.message });
    }
  }

  async function aprobarProduccion(id) {
    try {
      await api.aprobarParaProduccion(id);
      setMensaje({ tipo: 'exito', texto: '✅ Control aprobado para producción' });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: '❌ ' + error.message });
    }
  }

  async function importarControles(e) {
    e.preventDefault();
    try {
      const controles = JSON.parse(formImportar);
      const resultado = await api.importarControles({ controles });
      setMensaje({
        tipo: 'exito',
        texto: `✅ Importación completada: ${resultado.exitosos || 1} exitosos, ${resultado.fallidos || 0} fallidos`,
      });
      setFormImportar(JSON.stringify([], null, 2));
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: '❌ ' + error.message });
    }
  }

  const mostrarMensaje = () => {
    if (!mensaje) return null;
    const colores = {
      exito: 'bg-emerald-900/40 border-emerald-400/50 text-emerald-100',
      error: 'bg-rose-900/40 border-rose-400/50 text-rose-100',
      info: 'bg-blue-900/40 border-blue-400/50 text-blue-100',
    };
    return (
      <div className={`mb-8 p-6 rounded-3xl border ${colores[mensaje.tipo]} shadow-soft-xl`}>
        {mensaje.texto}
      </div>
    );
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-emerald-400 border-t-transparent mx-auto mb-8"></div>
          <p className="text-paper-400 text-xl">Cargando sistema de controles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-display font-bold gradient-text flex items-center gap-4">
            ⚙️ Sistema de Gestión de Controles
          </h1>
          <p className="text-paper-400 mt-3 text-xl">
            Administra, valida y despliega controles operativos de forma estructurada
          </p>
        </div>

        <div className="flex bg-ledger-800/60 p-2.5 rounded-3xl glass-border">
          {[
            { id: 'lista', label: '📋 Lista', icon: '📋' },
            { id: 'importar', label: '📥 Importar', icon: '📥' },
            { id: 'descartados', label: '🗑️ Descartados', icon: '🗑️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setVista(tab.id)}
              className={`px-7 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                vista === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl'
                  : 'text-paper-400 hover:text-paper-200 hover:bg-ledger-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {mostrarMensaje()}

      {informe && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TarjetaKPI
            icono="📊"
            valor={informe.totalInicial}
            etiqueta="Total de Controles"
            color="text-blue-300"
          />
          <TarjetaKPI
            icono="✅"
            valor={informe.validados}
            etiqueta="Controles Activos"
            color="text-emerald-300"
          />
          <TarjetaKPI
            icono="🗑️"
            valor={informe.descartados}
            etiqueta="Controles Descartados"
            color="text-amber-300"
          />
          <TarjetaKPI
            icono="📉"
            valor={informe.reduccionPorcentaje + '%'}
            etiqueta="Reducción Operativa"
            color="text-purple-300"
          />
        </div>
      )}

      {vista === 'lista' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-display font-semibold text-paper-100">
                📋 Controles Registrados
              </h2>
              <span className="text-paper-400 text-xl">
                {controles.length} controles encontrados
              </span>
            </div>

            <div className="space-y-5">
              {controles.length === 0 ? (
                <div className="glass-card glass-border rounded-3xl p-16 text-center">
                  <div className="text-8xl mb-8">📭</div>
                  <h3 className="text-3xl font-semibold text-paper-200 mb-6">
                    No hay controles aún
                  </h3>
                  <p className="text-paper-400 mb-10 text-xl">
                    Comienza creando tu primer control o importa datos de ejemplo
                  </p>
                  <button
                    onClick={() => setVista('importar')}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-10 py-5 rounded-3xl font-semibold text-xl transition-all shadow-xl hover-lift"
                  >
                    📥 Importar Controles de Ejemplo
                  </button>
                </div>
              ) : (
                controles.map((control) => (
                  <div
                    key={control.id}
                    className="group glass-card glass-border rounded-3xl p-8 hover-lift transition-all"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-4 mb-5">
                          <span className="font-mono text-2xl font-bold text-emerald-400">
                            {control.identificador}
                          </span>
                          <BadgeEstado estado={control.estado} />
                          {control.esFrecuente && (
                            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                              ⭐ Frecuente
                            </span>
                          )}
                        </div>

                        <p className="text-paper-200 text-xl leading-relaxed mb-4">
                          {control.descripcion}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-paper-400">
                          <span className="flex items-center gap-2 text-lg">
                            📁 {control.categoria?.nombre || 'Sin categoría'}
                          </span>
                          {control.testResults?.length > 0 && (
                            <span className="flex items-center gap-2 text-lg">
                              🧪 {control.testResults.length} pruebas
                            </span>
                          )}
                        </div>
                      </div>

                      {control.estado !== 'DESCARTADO' && control.estado !== 'PRODUCCION' && (
                        <div className="flex flex-col gap-3 shrink-0">
                          <button
                            onClick={() => ejecutarPrueba(control.id)}
                            className="px-6 py-4 bg-amber-500/90 hover:bg-amber-400 text-white rounded-2xl text-sm font-bold transition-all flex items-center gap-3 shadow-xl hover-lift"
                          >
                            🧪 Probar
                          </button>
                          {control.estado !== 'EN_PRUEBAS' && (
                            <button
                              onClick={() => aprobarProduccion(control.id)}
                              className="px-6 py-4 bg-green-500/90 hover:bg-green-400 text-white rounded-2xl text-sm font-bold transition-all flex items-center gap-3 shadow-xl hover-lift"
                            >
                              🚀 Aprobar Prod
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setFormDescartar({ ...formDescartar, controlId: control.id });
                              setVista('descartar-form');
                            }}
                            className="px-6 py-4 bg-rose-500/90 hover:bg-rose-400 text-white rounded-2xl text-sm font-bold transition-all flex items-center gap-3 shadow-xl hover-lift"
                          >
                            🗑️ Descartar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card glass-border rounded-3xl p-8 shadow-soft-xl">
              <h3 className="text-2xl font-display font-semibold text-paper-100 mb-8 flex items-center gap-3">
                ➕ Nuevo Control
              </h3>
              <form onSubmit={crearControl} className="space-y-6">
                <div>
                  <label className="block text-paper-300 text-sm font-bold mb-3">
                    Identificador
                  </label>
                  <input
                    type="text"
                    value={formControl.identificador}
                    onChange={(e) => setFormControl({ ...formControl, identificador: e.target.value })}
                    className="w-full bg-ledger-950/50 border-2 border-ledger-600 rounded-2xl px-6 py-4 text-paper-200 text-lg focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all"
                    placeholder="CTRL-XXX-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-paper-300 text-sm font-bold mb-3">
                    Descripción
                  </label>
                  <textarea
                    value={formControl.descripcion}
                    onChange={(e) => setFormControl({ ...formControl, descripcion: e.target.value })}
                    className="w-full bg-ledger-950/50 border-2 border-ledger-600 rounded-2xl px-6 py-4 text-paper-200 text-lg focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all resize-none"
                    rows="3"
                    placeholder="Describe el control..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-paper-300 text-sm font-bold mb-3">
                    Categoría
                  </label>
                  <select
                    value={formControl.categoriaId}
                    onChange={(e) => setFormControl({ ...formControl, categoriaId: e.target.value })}
                    className="w-full bg-ledger-950/50 border-2 border-ledger-600 rounded-2xl px-6 py-4 text-paper-200 text-lg focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all"
                    required
                  >
                    <option value="">Selecciona una categoría...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-4 cursor-pointer p-5 bg-ledger-950/40 rounded-2xl border-2 border-ledger-600 hover:border-amber-400/50 transition-all">
                  <input
                    type="checkbox"
                    checked={formControl.esFrecuente}
                    onChange={(e) => setFormControl({ ...formControl, esFrecuente: e.target.checked })}
                    className="w-7 h-7 rounded-xl border-3 border-ledger-400 text-amber-400 focus:ring-amber-400 bg-transparent"
                  />
                  <span className="text-paper-300 text-base">
                    ⭐ Marcar como control de uso frecuente
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white py-6 rounded-2xl font-semibold text-xl transition-all shadow-xl hover-lift"
                >
                  ✨ Crear Control
                </button>
              </form>
            </div>

            <div className="glass-card glass-border rounded-3xl p-8 shadow-soft-xl">
              <h3 className="text-2xl font-display font-semibold text-paper-100 mb-8 flex items-center gap-3">
                📁 Nueva Categoría
              </h3>
              <form onSubmit={crearCategoria} className="space-y-6">
                <div>
                  <label className="block text-paper-300 text-sm font-bold mb-3">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formCategoria.nombre}
                    onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
                    className="w-full bg-ledger-950/50 border-2 border-ledger-600 rounded-2xl px-6 py-4 text-paper-200 text-lg focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all"
                    placeholder="Ej: Validación"
                    required
                  />
                </div>

                <div>
                  <label className="block text-paper-300 text-sm font-bold mb-3">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={formCategoria.descripcion}
                    onChange={(e) => setFormCategoria({ ...formCategoria, descripcion: e.target.value })}
                    className="w-full bg-ledger-950/50 border-2 border-ledger-600 rounded-2xl px-6 py-4 text-paper-200 text-lg focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all resize-none"
                    rows="3"
                    placeholder="Describe la categoría..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-ledger-700 hover:bg-ledger-600 text-paper-200 py-6 rounded-2xl font-semibold text-xl transition-all hover-lift"
                >
                  📁 Crear Categoría
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {vista === 'importar' && (
        <div className="glass-card glass-border rounded-3xl p-10 max-w-5xl mx-auto shadow-soft-xl">
          <div className="text-center mb-10">
            <div className="text-7xl mb-6">📥</div>
            <h2 className="text-3xl font-display font-semibold text-paper-100 mb-4">
              Importación Masiva de Controles
            </h2>
            <p className="text-paper-400 text-xl">
              Carga múltiples controles desde un JSON estructurado
            </p>
          </div>

          <form onSubmit={importarControles} className="space-y-8">
            <div>
              <label className="block text-paper-300 text-sm font-bold mb-4 text-left">
                JSON de Controles
              </label>
              <textarea
                value={formImportar}
                onChange={(e) => setFormImportar(e.target.value)}
                className="w-full bg-ledger-950/50 border-2 border-ledger-600 rounded-3xl px-6 py-6 text-paper-200 font-mono text-base focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all"
                rows="18"
                placeholder='[{"identificador": "CTRL-001", "descripcion": "...", "categoria": "...", "esFrecuente": false}]'
                required
              />
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-12 py-6 rounded-3xl font-semibold text-xl transition-all shadow-xl hover-lift"
              >
                🚀 Importar Controles
              </button>
            </div>
          </form>

          <div className="mt-10 p-8 bg-ledger-950/30 rounded-2xl border-2 border-ledger-700">
            <h4 className="text-2xl font-semibold text-paper-200 mb-5">📝 Estructura Requerida:</h4>
            <pre className="bg-ledger-950/50 p-6 rounded-2xl text-paper-300 text-base font-mono overflow-x-auto">
{`[
  {
    "identificador": "CTRL-EJEMPLO-001",
    "descripcion": "Descripción del control",
    "categoria": "Mi Categoría",
    "esFrecuente": false
  }
]`}
            </pre>
          </div>
        </div>
      )}

      {vista === 'descartados' && (
        <div className="glass-card glass-border rounded-3xl p-10 shadow-soft-xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-semibold text-paper-100 flex items-center gap-4">
                🗑️ Controles Descartados
              </h2>
              <p className="text-paper-400 mt-3 text-lg">
                Registro de controles eliminados con su justificación
              </p>
            </div>
            <span className="bg-rose-900/40 text-rose-300 px-7 py-3 rounded-2xl text-sm font-bold border border-rose-700/50">
              {descartados.length} controles
            </span>
          </div>

          {descartados.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-8">📭</div>
              <p className="text-paper-400 text-xl">
                No hay controles descartados aún
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {descartados.map((descartado) => (
                <div
                  key={descartado.id}
                  className="bg-rose-900/20 border-2 border-rose-800/40 rounded-3xl p-8 hover:bg-rose-900/30 transition-all hover-lift"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-5">
                        <span className="font-mono text-xl font-bold text-rose-300">
                          {descartado.identificador}
                        </span>
                        <span className="text-paper-400 text-sm">
                          {new Date(descartado.fechaEliminacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-paper-200 text-xl mb-6">{descartado.descripcion}</p>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <p className="text-xs text-rose-400/80 uppercase tracking-wider mb-3 font-semibold">
                            Motivo de Eliminación
                          </p>
                          <p className="text-rose-200 text-lg">{descartado.motivoEliminacion}</p>
                        </div>
                        <div>
                          <p className="text-xs text-paper-400/80 uppercase tracking-wider mb-3 font-semibold">
                            Responsable
                          </p>
                          <p className="text-paper-300 font-semibold text-lg">{descartado.responsable}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {vista === 'descartar-form' && formDescartar.controlId && (
        <div className="glass-card glass-border border-rose-900/40 rounded-3xl p-10 max-w-3xl mx-auto shadow-soft-xl">
          <div className="text-center mb-10">
            <div className="text-7xl mb-6">⚠️</div>
            <h2 className="text-3xl font-display font-semibold text-paper-100 mb-4">
              Descartar Control
            </h2>
            <p className="text-paper-400 text-lg">
              Esta acción se registra para auditoría
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              descartarControl(formDescartar.controlId);
            }}
            className="space-y-8"
          >
            <div>
              <label className="block text-paper-300 text-sm font-bold mb-4">
                Motivo de Eliminación
              </label>
              <textarea
                value={formDescartar.motivoEliminacion}
                onChange={(e) => setFormDescartar({ ...formDescartar, motivoEliminacion: e.target.value })}
                className="w-full bg-ledger-950/50 border-2 border-ledger-600 rounded-2xl px-6 py-4 text-paper-200 text-lg focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-400/20 transition-all"
                rows="5"
                placeholder="Explica por qué se descarta este control..."
                required
              />
            </div>

            <div>
              <label className="block text-paper-300 text-sm font-bold mb-4">
                Responsable
              </label>
              <input
                type="text"
                value={formDescartar.responsable}
                onChange={(e) => setFormDescartar({ ...formDescartar, responsable: e.target.value })}
                className="w-full bg-ledger-950/50 border-2 border-ledger-600 rounded-2xl px-6 py-4 text-paper-200 text-lg focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-400/20 transition-all"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="flex gap-5 pt-6">
              <button
                type="button"
                onClick={() => setVista('lista')}
                className="flex-1 bg-ledger-700 hover:bg-ledger-600 text-paper-200 py-6 rounded-2xl font-semibold text-xl transition-all hover-lift"
              >
                ← Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white py-6 rounded-2xl font-semibold text-xl transition-all shadow-xl hover-lift"
              >
                🗑️ Confirmar Descarte
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
