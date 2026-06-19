export default function BadgeOrigen({ origen }) {
  const esReal = origen === 'whatsapp_real';
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono border ${
        esReal
          ? 'bg-paper-200/10 text-paper-200 border-paper-300/30'
          : 'bg-transparent text-paper-300/45 border-ledger-600'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {esReal ? 'whatsapp:real' : 'whatsapp:sim'}
    </span>
  );
}
