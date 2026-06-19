import { useState } from 'react';
import BadgeEstado from '../components/BadgeEstado';
import BadgeOrigen from '../components/BadgeOrigen';
import { api } from '../lib/api';
import { usePolling } from '../lib/usePolling';

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Entregas() {
  const { datos: entregas } = usePolling(api.listarEntregas, 5000);
  const [seleccionada, setSeleccionada] = useState(null);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-seal-400 font-mono mb-2">
          Trazabilidad
        </p>
        <h1 className="font-display text-4xl tracking-tight text-paper-100 mb-2">
          Entregas registradas
        </h1>
        <p className="text-paper-300/60 text-lg max-w-2xl leading-relaxed">
          Cada fila es un asiento del libro: su evidencia, el veredicto de la IA y el sello de la transacción anclada en la cadena.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-3xl border border-ledger-700 bg-ledger-900 overflow-hidden shadow-soft-xl">
          {(entregas || []).length === 0 ? (
            <div className="px-8 py-16 text-center">
              <p className="text-paper-300/50 text-lg">
                Aún no hay entregas registradas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.14em] text-paper-300/40 font-mono">
                    <th className="px-8 py-4">Beneficiario</th>
                    <th className="px-8 py-4">Fecha</th>
                    <th className="px-8 py-4">Canal</th>
                    <th className="px-8 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(entregas || []).map((entrega) => (
                    <tr
                      key={entrega.id}
                      onClick={() => setSeleccionada(entrega)}
                      className={`border-t border-ledger-700/60 hover:bg-ledger-800/60 transition-colors cursor-pointer ${
                        seleccionada?.id === entrega.id ? 'bg-ledger-800/70' : ''
                      }`}
                    >
                      <td className="px-8 py-5 text-paper-100">
                        {entrega.beneficiario?.nombre || '—'}
                      </td>
                      <td className="px-8 py-5 text-paper-300/55 font-mono text-xs">
                        {formatearFecha(entrega.fecha)}
                      </td>
                      <td className="px-8 py-5">
                        <BadgeOrigen origen={entrega.origen} />
                      </td>
                      <td className="px-8 py-5">
                        <BadgeEstado estado={entrega.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {!seleccionada ? (
            <div className="rounded-3xl border border-dashed border-ledger-600 bg-ledger-900/40 p-10 text-center">
              <p className="text-paper-300/35 text-sm">
                Selecciona un asiento para ver el sello completo.
              </p>
            </div>
          ) : (
            <DetalleEntrega entrega={seleccionada} />
          )}
        </div>
      </div>
    </div>
  );
}

function DetalleEntrega({ entrega }) {
  const resultadoIa = entrega.resultadoIa;

  return (
    <div className="rounded-3xl border border-ledger-700 bg-ledger-900 p-8 sticky top-10 shadow-soft-xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="font-display text-xl italic leading-tight text-paper-100">
            {entrega.beneficiario?.nombre}
          </p>
          <p className="text-xs text-paper-300/50 font-mono mt-1">
            {entrega.beneficiario?.clubMadres}
          </p>
        </div>
        <BadgeEstado estado={entrega.estado} />
      </div>

      {entrega.fotoUrl && (
        <img
          src={api.urlFoto(entrega.fotoUrl)}
          alt="Evidencia de entrega"
          className="w-full rounded-2xl border border-ledger-600/15 mb-5 max-h-64 object-cover"
        />
      )}

      {resultadoIa && (
        <div className="rounded-2xl bg-ledger-950/50 border border-ledger-600/15 p-5 mb-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-paper-300/50 font-mono mb-2">
            Veredicto IA
          </p>
          <p className="text-base text-paper-200">
            {resultadoIa.valido ? 'Evidencia válida' : 'Evidencia rechazada'}{' '}
            <span className="text-paper-300/50 font-mono text-xs">
              ({Math.round((resultadoIa.confianza || 0) * 100)}% confianza)
            </span>
          </p>
          <p className="text-sm text-paper-300/60 mt-2">
            {resultadoIa.motivo}
          </p>
        </div>
      )}

      <div className="rounded-2xl bg-confirm-500/10 border border-confirm-500/25 p-5">
        <p className="text-[11px] uppercase tracking-[0.12em] text-confirm-400 font-mono mb-2">
          Sello de cadena
        </p>
        {entrega.txHash ? (
          <>
            <p className="text-xs font-mono break-all text-paper-200">
              {entrega.txHash}
            </p>
            <p className="text-xs text-paper-300/50 mt-2">
              Transacción confirmada en el nodo local de la red.
            </p>
          </>
        ) : (
          <p className="text-sm text-seal-400">
            Sin sellar todavía (servicio no disponible o en inicialización).
          </p>
        )}
      </div>

      {entrega.alertas && entrega.alertas.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-paper-300/50 font-mono mb-3">
            Notas al margen
          </p>
          <ul className="space-y-2">
            {entrega.alertas.map((alerta) => (
              <li
                key={alerta.id}
                className="text-sm bg-seal-500/10 border border-seal-500/25 text-seal-400 rounded-2xl px-4 py-3"
              >
                <span className="font-mono">{alerta.tipo}</span> · {alerta.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
