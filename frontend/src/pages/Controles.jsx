import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const ESTADOS = {
  BORRADOR: { label: 'Borrador', color: 'bg-ledger-800 text-paper-300 border-ledger-700' },
  VALIDADO: { label: 'Validado', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  APROBADO: { label: 'Aprobado', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  EN_PRUEBAS: { label: 'En Pruebas', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  PRODUCCION: { label: 'Producción', color: 'bg-confirm-500/20 text-confirm-300 border-confirm-500/40' },
  DESCARTADO: { label: 'Descartado', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

const BadgeEstado = ({ estado }) => {
  const info = ESTADOS[estado] || { label: estado, color: 'bg-ledger-800 text-paper-400 border-ledger-700' };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${info.color}`}>
      {info.label}
    </span>
  );
};

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
    controlId: null,
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
      setControles(controlesData || []);
      setCategorias(categoriasData || []);
      setDescartados(descartadosData || []);
      setInforme(informeData || null);
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
      setMensaje({ tipo: 'exito', texto: 'Control creado exitosamente.' });
      setFormControl({ identificador: '', descripcion: '', categoriaId: '', esFrecuente: false });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    }
  }

  async function crearCategoria(e) {
    e.preventDefault();
    try {
      await api.crearCategoria(formCategoria);
      setMensaje({ tipo: 'exito', texto: 'Categoría creada exitosamente.' });
      setFormCategoria({ nombre: '', descripcion: '' });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    }
  }

  async function descartarControl(id) {
    try {
      await api.descartarControl(id, {
        motivoEliminacion: formDescartar.motivoEliminacion,
        responsable: formDescartar.responsable,
      });
      setMensaje({ tipo: 'exito', texto: 'Control descartado correctamente.' });
      setFormDescartar({ controlId: null, motivoEliminacion: '', responsable: '' });
      setVista('lista');
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    }
  }

  async function ejecutarPrueba(id) {
    try {
      setMensaje({ tipo: 'info', texto: 'Ejecutando pruebas del control…' });
      await api.ejecutarPrueba(id, { tipoPrueba: 'Completa', ejecutadoPor: 'Supervisor' });
      setMensaje({ tipo: 'exito', texto: 'Prueba completada satisfactoriamente.' });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    }
  }

  async function aprobarProduccion(id) {
    try {
      await api.aprobarParaProduccion(id);
      setMensaje({ tipo: 'exito', texto: 'Control aprobado para producción.' });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    }
  }

  async function importarControles(e) {
    e.preventDefault();
    try {
      const parsed = JSON.parse(formImportar);
      const resultado = await api.importarControles({ controles: parsed });
      setMensaje({
        tipo: 'exito',
        texto: `Importación completada: ${resultado.exitosos || 1} procesados correctamente.`,
      });
      setVista('lista');
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado limpio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-paper-100">
            Gestión de Controles
          </h1>
          <p className="text-sm text-paper-300/60 mt-0.5">
            Administración, validación y ciclo de vida de reglas de verificación.
          </p>
        </div>

        {/* Pestañas de vista simples */}
        <div className="flex bg-ledger-900 border border-ledger-700 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setVista('lista')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              vista === 'lista'
                ? 'bg-ledger-800 text-paper-100 border border-ledger-600'
                : 'text-paper-300/60 hover:text-paper-100'
            }`}
          >
            Controles ({controles.length})
          </button>
          <button
            onClick={() => setVista('importar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              vista === 'importar'
                ? 'bg-ledger-800 text-paper-100 border border-ledger-600'
                : 'text-paper-300/60 hover:text-paper-100'
            }`}
          >
            Importar JSON
          </button>
          <button
            onClick={() => setVista('descartados')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              vista === 'descartados'
                ? 'bg-ledger-800 text-paper-100 border border-ledger-600'
                : 'text-paper-300/60 hover:text-paper-100'
            }`}
          >
            Descartados ({descartados.length})
          </button>
        </div>
      </div>

      {/* Notificación de estado */}
      {mensaje && (
        <div
          className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
            mensaje.tipo === 'exito'
              ? 'bg-confirm-500/10 border-confirm-500/30 text-confirm-300'
              : mensaje.tipo === 'info'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} className="text-paper-400 hover:text-paper-100 ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Resumen de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Total Registrados</p>
          <p className="text-2xl font-bold font-mono text-paper-100 mt-1">{controles.length}</p>
        </div>
        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">En Producción</p>
          <p className="text-2xl font-bold font-mono text-confirm-400 mt-1">
            {controles.filter((c) => c.estado === 'PRODUCCION').length}
          </p>
        </div>
        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">En Pruebas</p>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {controles.filter((c) => c.estado === 'EN_PRUEBAS' || c.estado === 'VALIDADO').length}
          </p>
        </div>
        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-4">
          <p className="text-xs text-paper-300/60 uppercase tracking-wider font-mono">Descartados</p>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{descartados.length}</p>
        </div>
      </div>

      {/* Vista Principal: Lista + Formularios */}
      {vista === 'lista' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lista de Controles */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <p className="text-sm font-semibold text-paper-200">
                Controles Registrados ({controles.length})
              </p>
            </div>

            {controles.length === 0 ? (
              <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-8 text-center text-sm text-paper-300/50">
                No hay controles registrados. Puedes crear uno con el formulario lateral o importar datos de ejemplo.
              </div>
            ) : (
              controles.map((control) => (
                <div
                  key={control.id}
                  className="rounded-2xl border border-ledger-700 bg-ledger-900 p-4 space-y-2 hover:border-ledger-600 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-confirm-400">
                        {control.identificador}
                      </span>
                      <BadgeEstado estado={control.estado} />
                      {control.esFrecuente && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Frecuente
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-paper-300/50 font-mono">
                      {control.categoria?.nombre || 'General'}
                    </span>
                  </div>

                  <p className="text-xs text-paper-200 leading-relaxed">
                    {control.descripcion}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-ledger-800/80">
                    <span className="text-[11px] text-paper-300/40 font-mono">
                      {control.testResults?.length || 0} prueba(s) ejecutada(s)
                    </span>

                    {control.estado !== 'DESCARTADO' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => ejecutarPrueba(control.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-ledger-700 bg-ledger-950 hover:bg-ledger-800 text-paper-200 transition-colors"
                        >
                          Probar
                        </button>
                        {control.estado !== 'PRODUCCION' && (
                          <button
                            onClick={() => aprobarProduccion(control.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-confirm-500/30 bg-confirm-500/15 hover:bg-confirm-500/25 text-confirm-300 transition-colors"
                          >
                            Aprobar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setFormDescartar({ ...formDescartar, controlId: control.id });
                            setVista('descartar-form');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                        >
                          Descartar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Columna lateral: Crear Control y Crear Categoría */}
          <div className="lg:col-span-4 space-y-4">
            {/* Formulario Nuevo Control */}
            <form
              onSubmit={crearControl}
              className="rounded-2xl border border-ledger-700 bg-ledger-900 p-5 space-y-3"
            >
              <div>
                <p className="text-sm font-semibold text-paper-100">Nuevo Control</p>
                <p className="text-xs text-paper-300/50">Crea una regla de verificación</p>
              </div>

              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">Código</label>
                <input
                  type="text"
                  required
                  placeholder="CTRL-VAL-001"
                  value={formControl.identificador}
                  onChange={(e) => setFormControl({ ...formControl, identificador: e.target.value })}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3 py-2 text-xs text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">Descripción</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe qué verifica este control…"
                  value={formControl.descripcion}
                  onChange={(e) => setFormControl({ ...formControl, descripcion: e.target.value })}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3 py-2 text-xs text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">Categoría</label>
                <select
                  required
                  value={formControl.categoriaId}
                  onChange={(e) => setFormControl({ ...formControl, categoriaId: e.target.value })}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3 py-2 text-xs text-paper-100 focus:border-confirm-400 focus:outline-none"
                >
                  <option value="">Selecciona categoría…</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-paper-300/80">
                <input
                  type="checkbox"
                  checked={formControl.esFrecuente}
                  onChange={(e) => setFormControl({ ...formControl, esFrecuente: e.target.checked })}
                  className="w-4 h-4 rounded border-ledger-700 bg-ledger-950 text-confirm-500 focus:ring-0"
                />
                <span>Marcar como uso frecuente</span>
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-confirm-500 hover:bg-confirm-600 text-ledger-950 font-semibold px-4 py-2 text-xs transition-colors"
              >
                Guardar Control
              </button>
            </form>

            {/* Formulario Nueva Categoría */}
            <form
              onSubmit={crearCategoria}
              className="rounded-2xl border border-ledger-700 bg-ledger-900 p-5 space-y-3"
            >
              <div>
                <p className="text-sm font-semibold text-paper-100">Nueva Categoría</p>
                <p className="text-xs text-paper-300/50">Organiza controles por módulo</p>
              </div>

              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Seguridad"
                  value={formCategoria.nombre}
                  onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3 py-2 text-xs text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">Descripción</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={formCategoria.descripcion}
                  onChange={(e) => setFormCategoria({ ...formCategoria, descripcion: e.target.value })}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3 py-2 text-xs text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl border border-ledger-700 bg-ledger-950 hover:bg-ledger-800 text-paper-200 font-medium px-4 py-2 text-xs transition-colors"
              >
                Crear Categoría
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Vista Importar JSON */}
      {vista === 'importar' && (
        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-6 max-w-3xl mx-auto space-y-4">
          <div>
            <h2 className="text-base font-semibold text-paper-100">Importación Masiva de Controles</h2>
            <p className="text-xs text-paper-300/60 mt-0.5">Pega un arreglo JSON con la lista de controles.</p>
          </div>

          <form onSubmit={importarControles} className="space-y-4">
            <textarea
              rows={12}
              value={formImportar}
              onChange={(e) => setFormImportar(e.target.value)}
              className="w-full rounded-xl border border-ledger-700 bg-ledger-950 p-3.5 font-mono text-xs text-paper-100 focus:border-confirm-400 focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setVista('lista')}
                className="px-4 py-2 rounded-xl border border-ledger-700 hover:bg-ledger-800 text-paper-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-confirm-500 hover:bg-confirm-600 text-ledger-950 font-semibold text-xs"
              >
                Ejecutar Importación
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vista Descartados */}
      {vista === 'descartados' && (
        <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-paper-100">Controles Descartados</h2>
              <p className="text-xs text-paper-300/60 mt-0.5">Historial de reglas eliminadas con justificación de auditoría.</p>
            </div>
            <span className="text-xs font-mono text-paper-300/50 bg-ledger-950 px-2.5 py-1 rounded-lg border border-ledger-700">
              {descartados.length} registros
            </span>
          </div>

          {descartados.length === 0 ? (
            <p className="text-xs text-paper-300/40 italic py-6 text-center">
              No hay controles descartados en el historial.
            </p>
          ) : (
            <div className="space-y-3">
              {descartados.map((d) => (
                <div key={d.id} className="p-4 rounded-xl border border-ledger-800 bg-ledger-950/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-rose-400">{d.identificador}</span>
                    <span className="text-paper-300/50 font-mono text-[11px]">
                      {new Date(d.fechaEliminacion).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <p className="text-xs text-paper-200">{d.descripcion}</p>
                  <div className="pt-2 border-t border-ledger-800/60 grid grid-cols-2 text-[11px] text-paper-300/60">
                    <div>
                      <span className="font-mono text-paper-300/40">Motivo: </span>
                      {d.motivoEliminacion}
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-paper-300/40">Responsable: </span>
                      {d.responsable}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulario Modal para Descartar */}
      {vista === 'descartar-form' && formDescartar.controlId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              descartarControl(formDescartar.controlId);
            }}
            className="rounded-2xl border border-ledger-700 bg-ledger-900 p-6 max-w-md w-full space-y-4"
          >
            <div>
              <h2 className="text-base font-semibold text-paper-100">Descartar Control</h2>
              <p className="text-xs text-paper-300/60 mt-0.5">Ingresa el motivo para el registro de auditoría.</p>
            </div>

            <div>
              <label className="text-xs text-paper-300/70 font-medium mb-1 block">Motivo</label>
              <textarea
                required
                rows={3}
                placeholder="Indica la razón técnica u operativa…"
                value={formDescartar.motivoEliminacion}
                onChange={(e) => setFormDescartar({ ...formDescartar, motivoEliminacion: e.target.value })}
                className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3 py-2 text-xs text-paper-100 focus:border-confirm-400 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-paper-300/70 font-medium mb-1 block">Responsable</label>
              <input
                type="text"
                required
                placeholder="Nombre o cargo del auditor/supervisor"
                value={formDescartar.responsable}
                onChange={(e) => setFormDescartar({ ...formDescartar, responsable: e.target.value })}
                className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3 py-2 text-xs text-paper-100 focus:border-confirm-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVista('lista')}
                className="px-3.5 py-2 rounded-xl border border-ledger-700 hover:bg-ledger-800 text-paper-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs"
              >
                Confirmar Descarte
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
