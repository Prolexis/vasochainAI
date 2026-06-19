const CONFIG = {
  VALIDADA: {
    estilo: 'bg-confirm-500/15 text-confirm-300 border-confirm-400/30',
    marca: '✓ SELLADA',
  },
  RECHAZADA: {
    estilo: 'bg-deny-500/15 text-deny-400 border-deny-400/30',
    marca: '✕ RECHAZADA',
  },
  PENDIENTE: {
    estilo: 'bg-seal-500/15 text-seal-400 border-seal-400/30',
    marca: '… PENDIENTE',
  },
};

export default function BadgeEstado({ estado }) {
  const config = CONFIG[estado] || CONFIG.PENDIENTE;
  return (
    <span
      className={`inline-flex items-center px-4 py-2 rounded-2xl text-xs font-mono tracking-wide border ${config.estilo}`}
    >
      {config.marca}
    </span>
  );
}
