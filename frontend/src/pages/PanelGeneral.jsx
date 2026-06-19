import { Link } from 'react-router-dom';
import TarjetaKpi from '../components/TarjetaKpi';
import BadgeEstado from '../components/BadgeEstado';
import BadgeOrigen from '../components/BadgeOrigen';
import { api } from '../lib/api';
import { usePolling } from '../lib/usePolling';

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function folioDeHoy() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), 0, 1);
  const dias = Math.floor((hoy - inicio) / 86400000);
  return String(dias).padStart(3, '0');
}

export default function PanelGeneral() {
  const { datos: kpis } = usePolling(api.obtenerKpis, 5000);
  const { datos: entregas } = usePolling(api.listarEntregas, 5000);

  const entregasRecientes = (entregas || []).slice(0, 8);

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-seal-400 font-mono mb-2">
            Folio Nº {folioDeHoy()} · Año en curso
          </p>
          <h1 className="font-display text-4xl tracking-tight text-paper-100 mb-2">
            Registro de entregas en tiempo real
          </h1>
          <p className="text-paper-300/60 text-lg max-w-2xl leading-relaxed">
            Cada entrega validada por IA queda sellada de forma inalterable en la cadena.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TarjetaKpi
          etiqueta="Beneficiarios"
          valor={kpis?.totalBeneficiarios ?? '—'}
          detalle="Registrados en el padrón"
        />
        <TarjetaKpi
          etiqueta="Entregas hoy"
          valor={kpis?.entregasHoy ?? '—'}
          detalle="Procesadas en las últimas 24h"
          acento
        />
        <TarjetaKpi
          etiqueta="Validadas por IA"
          valor={kpis ? `${kpis.porcentajeValidadasIa}%` : '—'}
          detalle="Del total de entregas registradas"
        />
        <TarjetaKpi
          etiqueta="Alertas activas"
          valor={kpis?.alertasActivas ?? '—'}
          detalle="Incidencias por revisar"
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-ledger-700 bg-ledger-900 p-6 flex items-center justify-between shadow-soft-xl">
          <div>
            <p className="font-display text-lg italic text-paper-100 mb-1">
              Nodo blockchain
            </p>
            <p className="text-sm text-paper-300/50">
              Registro inmutable de validaciones
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 text-xs font-mono px-4 py-2 rounded-2xl border ${
              kpis?.blockchainDisponible
                ? 'bg-confirm-500/10 text-confirm-300 border-confirm-400/30'
                : 'bg-seal-500/10 text-seal-400 border-seal-400/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {kpis?.blockchainDisponible ? 'conectado' : 'conectando…'}
          </span>
        </div>
        <div className="rounded-3xl border border-ledger-700 bg-ledger-900 p-6 flex items-center justify-between shadow-soft-xl">
          <div>
            <p className="font-display text-lg italic text-paper-100 mb-1">
              Validación con IA
            </p>
            <p className="text-sm text-paper-300/50">
              Análisis de evidencias fotográficas
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 text-xs font-mono px-4 py-2 rounded-2xl border ${
              kpis?.iaDisponible
                ? 'bg-confirm-500/10 text-confirm-300 border-confirm-400/30'
                : 'bg-seal-500/10 text-seal-400 border-seal-400/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {kpis?.iaDisponible ? 'configurada' : 'sin api key'}
          </span>
        </div>
      </section>

      <section className="rounded-3xl border border-ledger-700 bg-ledger-900 overflow-hidden shadow-soft-xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-ledger-700">
          <p className="font-display text-lg italic text-paper-100">
            Últimos asientos del libro
          </p>
          <Link
            to="/entregas"
            className="text-xs font-mono text-confirm-400 hover:text-confirm-300 transition-colors"
          >
            ver todos →
          </Link>
        </div>

        {entregasRecientes.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-paper-300/50 text-lg">
              El libro está en blanco. Prueba el simulador de WhatsApp para sellar el primer asiento.
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
                {entregasRecientes.map((entrega) => (
                  <tr
                    key={entrega.id}
                    className="border-t border-ledger-700/60 hover:bg-ledger-800/60 transition-colors"
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
      </section>
    </div>
  );
}
