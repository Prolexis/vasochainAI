import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { usePolling } from '../lib/usePolling';
import { obtenerRolNormalizado, ROLES } from '../lib/permissions';
import { sound } from '../lib/sound';

export default function Beneficiarios() {
  const { user } = useAuth();
  const esSupervisor = obtenerRolNormalizado(user?.rol) === ROLES.ADMIN;

  const { datos: beneficiarios, refrescar } = usePolling(
    api.listarBeneficiarios,
    8000,
  );

  const [formulario, setFormulario] = useState({
    nombreMenor: '',
    dniMenor: '',
    nombreMadre: '',
    dniMadre: '',
    clubMadres: '',
    sector: '',
  });

  const [busqueda, setBusqueda] = useState('');
  const [qrSeleccionado, setQrSeleccionado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const actualizarCampo = (campo) => (e) =>
    setFormulario((prev) => ({ ...prev, [campo]: e.target.value }));

  const enviarFormulario = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorForm(null);

    const nombreCompuesto = formulario.nombreMadre.trim()
      ? `${formulario.nombreMenor.trim()} (Madre: ${formulario.nombreMadre.trim()})`
      : formulario.nombreMenor.trim();

    const dniCompuesto = formulario.dniMenor.trim() || formulario.dniMadre.trim();

    try {
      await api.crearBeneficiario({
        nombre: nombreCompuesto,
        dni: dniCompuesto,
        clubMadres: formulario.clubMadres.trim(),
        sector: formulario.sector.trim(),
      });

      sound.playSuccess();
      setFormulario({
        nombreMenor: '',
        dniMenor: '',
        nombreMadre: '',
        dniMadre: '',
        clubMadres: '',
        sector: '',
      });
      await refrescar();
    } catch (err) {
      setErrorForm(err.message || 'Error al registrar beneficiario');
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (id) => {
    if (window.confirm('¿Deseas eliminar este registro del padrón oficial?')) {
      await api.eliminarBeneficiario(id);
      await refrescar();
    }
  };

  const parsearBeneficiario = (nombre) => {
    const match = nombre.match(/^(.*?)\s*\(Madre:\s*(.*?)\)$/i);
    if (match) {
      return { menor: match[1], madre: match[2] };
    }
    return { menor: nombre, madre: null };
  };

  // Filtrado de búsqueda
  const beneficiariosFiltrados = (beneficiarios || []).filter((b) => {
    if (!busqueda.trim()) return true;
    const term = busqueda.toLowerCase();
    return (
      b.nombre.toLowerCase().includes(term) ||
      b.dni.includes(term) ||
      b.clubMadres.toLowerCase().includes(term) ||
      b.sector.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Encabezado limpio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-paper-100">
            Padrón de Beneficiarios
          </h1>
          <p className="text-sm text-paper-300/60 mt-0.5">
            {esSupervisor
              ? 'Gestión y empadronamiento oficial del Programa Vaso de Leche.'
              : 'Padrón oficial autorizado para consulta y entrega de raciones con QR.'}
          </p>
        </div>

        {!esSupervisor && (
          <span className="self-start sm:self-auto text-xs font-mono px-3 py-1.5 rounded-xl bg-ledger-900 border border-ledger-700 text-amber-400">
            Modo Consulta: {user?.nombre || 'Comité'}
          </span>
        )}
      </div>

      <div className={esSupervisor ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-6'}>
        {/* Formulario solo visible para el Supervisor Municipal */}
        {esSupervisor && (
          <form
            onSubmit={enviarFormulario}
            className="lg:col-span-5 rounded-2xl border border-ledger-700 bg-ledger-900 p-6 space-y-4"
          >
            <div>
              <p className="text-base font-semibold text-paper-100">
                Registrar nuevo beneficiario
              </p>
              <p className="text-xs text-paper-300/50 mt-0.5">
                Función exclusiva del Supervisor Municipal
              </p>
            </div>

            {/* Menor */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">
                  Nombre del niño(a)
                </label>
                <input
                  required
                  value={formulario.nombreMenor}
                  onChange={actualizarCampo('nombreMenor')}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3.5 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
                  placeholder="Nombre y apellidos del menor"
                />
              </div>

              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">
                  DNI del menor
                </label>
                <input
                  required
                  value={formulario.dniMenor}
                  onChange={actualizarCampo('dniMenor')}
                  maxLength={8}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3.5 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
                  placeholder="DNI o CNV"
                />
              </div>
            </div>

            {/* Madre */}
            <div className="border-t border-ledger-800 pt-3 space-y-3">
              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">
                  Madre o apoderada
                </label>
                <input
                  required
                  value={formulario.nombreMadre}
                  onChange={actualizarCampo('nombreMadre')}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3.5 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
                  placeholder="Nombre de la madre o tutora"
                />
              </div>

              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">
                  DNI de la madre
                </label>
                <input
                  value={formulario.dniMadre}
                  onChange={actualizarCampo('dniMadre')}
                  maxLength={8}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3.5 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
                  placeholder="DNI de la apoderada"
                />
              </div>
            </div>

            {/* Comité */}
            <div className="border-t border-ledger-800 pt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">
                  Club de madres
                </label>
                <input
                  required
                  value={formulario.clubMadres}
                  onChange={actualizarCampo('clubMadres')}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3.5 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
                  placeholder="Ej. Las Flores"
                />
              </div>

              <div>
                <label className="text-xs text-paper-300/70 font-medium mb-1 block">
                  Sector
                </label>
                <input
                  required
                  value={formulario.sector}
                  onChange={actualizarCampo('sector')}
                  className="w-full rounded-xl border border-ledger-700 bg-ledger-950 px-3.5 py-2.5 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
                  placeholder="Ej. El Porvenir"
                />
              </div>
            </div>

            {errorForm && (
              <p className="text-xs text-red-400 pt-1">{errorForm}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full mt-2 bg-confirm-600 hover:bg-confirm-500 disabled:opacity-50 text-white font-medium text-sm py-3 rounded-xl transition-colors cursor-pointer"
            >
              {enviando ? 'Guardando en el padrón...' : 'Guardar y generar QR'}
            </button>
          </form>
        )}

        {/* Lista de beneficiarios (ancho completo para la Presidenta, o 7 columnas para el Supervisor) */}
        <div className={esSupervisor ? 'lg:col-span-7 rounded-2xl border border-ledger-700 bg-ledger-900 overflow-hidden' : 'rounded-2xl border border-ledger-700 bg-ledger-900 overflow-hidden'}>
          <div className="p-4 sm:p-5 border-b border-ledger-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-paper-100">
                Beneficiarios registrados ({beneficiariosFiltrados.length})
              </p>
              {!esSupervisor && (
                <p className="text-xs text-paper-300/50 mt-0.5">
                  Usa "Ver QR" para consultar o expedir el carnet de entrega.
                </p>
              )}
            </div>

            {/* Barra de búsqueda rápida */}
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por niño, madre o DNI..."
                className="w-full sm:w-64 rounded-xl border border-ledger-700 bg-ledger-950 px-3 py-1.5 text-xs text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400 focus:outline-none"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-paper-300/50 hover:text-paper-100 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {beneficiariosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-sm text-paper-300/50">
              {busqueda ? 'No se encontraron coincidencias para la búsqueda.' : 'No hay beneficiarios registrados en el padrón.'}
            </div>
          ) : (
            <ul className="divide-y divide-ledger-800 max-h-[560px] overflow-y-auto">
              {beneficiariosFiltrados.map((b) => {
                const info = parsearBeneficiario(b.nombre);
                return (
                  <li
                    key={b.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-ledger-800/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-paper-100 truncate">
                        {info.menor}
                      </p>
                      <p className="text-xs text-paper-300/60 mt-0.5 truncate">
                        {info.madre && <span>Madre: {info.madre} · </span>}
                        <span>DNI: {b.dni}</span> · <span>{b.clubMadres}</span> · <span>{b.sector}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          sound.playScan();
                          setQrSeleccionado(b);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-ledger-600 hover:border-confirm-400 text-paper-200 hover:text-confirm-300 transition-colors"
                      >
                        Ver QR
                      </button>

                      {/* Solo el Supervisor puede eliminar registros */}
                      {esSupervisor && (
                        <button
                          onClick={() => eliminar(b.id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg text-paper-300/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Eliminar del padrón"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modal QR simple y limpio */}
      {qrSeleccionado && (() => {
        const info = parsearBeneficiario(qrSeleccionado.nombre);
        return (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={() => setQrSeleccionado(null)}
          >
            <div
              className="bg-ledger-900 border border-ledger-700 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-pop"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <p className="text-base font-bold text-paper-100">
                  {info.menor}
                </p>
                {info.madre && (
                  <p className="text-xs text-paper-300/60 mt-0.5">
                    Madre: {info.madre}
                  </p>
                )}
                <p className="text-xs text-paper-300/50 mt-0.5">
                  DNI: {qrSeleccionado.dni} · {qrSeleccionado.clubMadres}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 inline-block">
                <img
                  src={api.urlQr(qrSeleccionado.id)}
                  alt="QR"
                  className="w-44 h-44 mx-auto"
                />
              </div>

              <button
                onClick={() => setQrSeleccionado(null)}
                className="w-full py-2.5 rounded-xl bg-ledger-800 hover:bg-ledger-700 text-paper-200 text-xs font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
