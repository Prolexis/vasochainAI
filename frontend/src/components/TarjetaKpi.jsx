export default function TarjetaKpi({ etiqueta, valor, detalle, acento = false }) {
  return (
    <div
      className={`relative rounded-3xl p-7 transition-all ${
        acento
          ? 'bg-gradient-to-br from-confirm-500/15 to-confirm-600/5 border border-confirm-400/30 shadow-soft-xl'
          : 'bg-ledger-900 border border-ledger-700 hover:border-ledger-600 shadow-soft-xl'
      }`}
    >
      <p
        className={`text-[10px] font-mono uppercase tracking-[0.18em] mb-3 ${
          acento ? 'text-confirm-400' : 'text-paper-300/50'
        }`}
      >
        {etiqueta}
      </p>
      <p
        className={`font-display text-5xl tracking-tight tabular-nums mb-2 ${
          acento ? 'text-confirm-300' : 'text-paper-100'
        }`}
      >
        {valor}
      </p>
      {detalle && <p className="text-sm text-paper-300/60">{detalle}</p>}
    </div>
  );
}
