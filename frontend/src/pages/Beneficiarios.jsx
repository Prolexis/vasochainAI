import { useState } from 'react';
import { api } from '../lib/api';
import { usePolling } from '../lib/usePolling';

export default function Beneficiarios() {
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
    if (window.confirm('¿Deseas eliminar este registro?')) {
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

  return (
    <div className="space-y-6">
      {/* Encabezado limpio */}
      <div>
        <h1 className="text-2xl font-bold text-paper-100">
          Padrón de Beneficiarios
        </h1>
        <p className="text-sm text-paper-300/60 mt-1">
          Registro de menores beneficiarios y madres titulares del Programa Vaso de Leche.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario simple */}
        <form
          onSubmit={enviarFormulario}
          className="lg:col-span-5 rounded-2xl border border-ledger-700 bg-ledger-900 p-6 space-y-4"
        >
          <p className="text-base font-semibold text-paper-100">
            Registrar beneficiario
          </p>

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
            {enviando ? 'Guardando...' : 'Guardar y generar QR'}
          </button>
        </form>

        {/* Lista de beneficiarios */}
        <div className="lg:col-span-7 rounded-2xl border border-ledger-700 bg-ledger-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-ledger-700 flex items-center justify-between">
            <p className="text-sm font-semibold text-paper-100">
              Beneficiarios registrados ({ (beneficiarios || []).length })
            </p>
          </div>

          {(beneficiarios || []).length === 0 ? (
            <div className="p-12 text-center text-sm text-paper-300/50">
              No hay beneficiarios registrados en el padrón.
            </div>
          ) : (
            <ul className="divide-y divide-ledger-800 max-h-[560px] overflow-y-auto">
              {(beneficiarios || []).map((b) => {
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
                        onClick={() => setQrSeleccionado(b)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-ledger-600 hover:border-confirm-400 text-paper-200 hover:text-confirm-300 transition-colors"
                      >
                        Ver QR
                      </button>
                      <button
                        onClick={() => eliminar(b.id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg text-paper-300/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Eliminar"
                      >
                        ✕
                      </button>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setQrSeleccionado(null)}
          >
            <div
              className="bg-ledger-900 border border-ledger-700 rounded-2xl p-6 max-w-sm w-full text-center space-y-4"
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
