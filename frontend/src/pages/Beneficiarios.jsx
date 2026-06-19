import { useState } from 'react';
import { api } from '../lib/api';
import { usePolling } from '../lib/usePolling';

export default function Beneficiarios() {
  const { datos: beneficiarios, refrescar } = usePolling(
    api.listarBeneficiarios,
    8000,
  );
  const [formulario, setFormulario] = useState({
    nombre: '',
    dni: '',
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
    try {
      await api.crearBeneficiario(formulario);
      setFormulario({ nombre: '', dni: '', clubMadres: '', sector: '' });
      await refrescar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (id) => {
    await api.eliminarBeneficiario(id);
    await refrescar();
  };

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-seal-400 font-mono mb-2">
          Padrón de beneficiarios
        </p>
        <h1 className="font-display text-4xl tracking-tight text-paper-100 mb-2">
          Beneficiarios
        </h1>
        <p className="text-paper-300/60 text-lg max-w-2xl leading-relaxed">
          Cada beneficiario recibe un sello único en forma de código QR, que se escanea en el punto de entrega.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form
          onSubmit={enviarFormulario}
          className="lg:col-span-1 rounded-3xl border border-ledger-700 bg-ledger-900 p-8 h-fit shadow-soft-xl"
        >
          <p className="font-display text-lg italic text-paper-100 mb-6">
            Abrir nuevo asiento
          </p>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] text-paper-300/50 font-mono mb-2 block">
                Nombre completo
              </label>
              <input
                required
                value={formulario.nombre}
                onChange={actualizarCampo('nombre')}
                className="w-full rounded-2xl border border-ledger-600 bg-ledger-950 px-5 py-4 text-base text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400/50 focus:outline-none transition-all"
                placeholder="María Pérez Quispe"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] text-paper-300/50 font-mono mb-2 block">
                DNI
              </label>
              <input
                required
                value={formulario.dni}
                onChange={actualizarCampo('dni')}
                className="w-full rounded-2xl border border-ledger-600 bg-ledger-950 px-5 py-4 text-base text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400/50 focus:outline-none transition-all"
                placeholder="45678912"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] text-paper-300/50 font-mono mb-2 block">
                Club de madres
              </label>
              <input
                required
                value={formulario.clubMadres}
                onChange={actualizarCampo('clubMadres')}
                className="w-full rounded-2xl border border-ledger-600 bg-ledger-950 px-5 py-4 text-base text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400/50 focus:outline-none transition-all"
                placeholder="Club Las Flores"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] text-paper-300/50 font-mono mb-2 block">
                Sector
              </label>
              <input
                required
                value={formulario.sector}
                onChange={actualizarCampo('sector')}
                className="w-full rounded-2xl border border-ledger-600 bg-ledger-950 px-5 py-4 text-base text-paper-100 placeholder:text-paper-300/30 focus:border-confirm-400/50 focus:outline-none transition-all"
                placeholder="El Porvenir"
              />
            </div>
          </div>

          {errorForm && (
            <p className="text-sm text-deny-400 mt-5">{errorForm}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-7 w-full bg-seal-600 hover:bg-seal-500 disabled:opacity-50 text-paper-100 text-base py-4 rounded-2xl transition-all font-display italic shadow-soft-xl"
          >
            {enviando ? 'Sellando…' : 'Sellar y generar QR'}
          </button>
        </form>

        <div className="lg:col-span-2 rounded-3xl border border-ledger-700 bg-ledger-900 overflow-hidden shadow-soft-xl">
          <div className="px-8 py-6 border-b border-ledger-700">
            <p className="text-paper-100 font-display text-lg">
              {(beneficiarios || []).length} beneficiarios en el padrón
            </p>
          </div>

          {(beneficiarios || []).length === 0 ? (
            <div className="px-8 py-16 text-center">
              <p className="text-paper-300/50 text-lg">
                Aún no hay beneficiarios. Abre el primer asiento desde el formulario.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ledger-700/60 max-h-[600px] overflow-y-auto scroll-thin">
              {(beneficiarios || []).map((b) => (
                <li
                  key={b.id}
                  className="px-8 py-5 flex items-center justify-between gap-4 hover:bg-ledger-800/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-base text-paper-100 truncate">
                      {b.nombre}
                    </p>
                    <p className="text-xs text-paper-300/50 font-mono mt-1">
                      dni {b.dni} · {b.clubMadres} · {b.sector}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setQrSeleccionado(b)}
                      className="text-xs font-mono px-5 py-2.5 rounded-2xl border border-ledger-600 text-paper-300/70 hover:border-confirm-400/50 hover:text-confirm-300 transition-all"
                    >
                      ver sello
                    </button>
                    <button
                      onClick={() => eliminar(b.id)}
                      className="text-xs font-mono px-5 py-2.5 rounded-2xl border border-deny-500/40 text-deny-400 hover:bg-deny-500/15 transition-all"
                    >
                      eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {qrSeleccionado && (
        <div
          className="fixed inset-0 bg-ledger-950/70 backdrop-blur-sm flex items-center justify-center px-6 z-50"
          onClick={() => setQrSeleccionado(null)}
        >
          <div
            className="bg-ledger-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-ledger-700"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-xl italic text-paper-100 mb-2">
              {qrSeleccionado.nombre}
            </p>
            <p className="text-sm text-paper-300/50 font-mono mb-6">
              {qrSeleccionado.clubMadres}
            </p>
            <div className="bg-paper-100 rounded-2xl p-4 perforated-bottom pb-7">
              <img
                src={api.urlQr(qrSeleccionado.id)}
                alt={`QR de ${qrSeleccionado.nombre}`}
                className="w-full rounded-xl"
              />
            </div>
            <p className="text-[11px] text-paper-300/50 font-mono mt-6 break-all">
              folio: {qrSeleccionado.id}
            </p>
            <button
              onClick={() => setQrSeleccionado(null)}
              className="mt-5 text-sm font-mono text-paper-300/60 hover:text-paper-200 transition-colors"
            >
              cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
