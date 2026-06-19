import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const ESTADOS_FLUJO = {
  INICIAL: 'inicial',
  ESPERANDO_FOTO: 'esperando_foto',
  PROCESANDO: 'procesando',
  RESULTADO: 'resultado',
};

export default function SimuladorWhatsapp() {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [beneficiarioId, setBeneficiarioId] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [estadoFlujo, setEstadoFlujo] = useState(ESTADOS_FLUJO.INICIAL);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [error, setError] = useState(null);
  const finChatRef = useRef(null);

  useEffect(() => {
    api.listarBeneficiarios().then(setBeneficiarios).catch(() => {});
  }, []);

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const agregarMensaje = (de, texto, extra = {}) =>
    setMensajes((prev) => [
      ...prev,
      { id: prev.length, de, texto, hora: horaActual(), ...extra },
    ]);

  const iniciarConversacion = () => {
    const beneficiario = beneficiarios.find((b) => b.id === beneficiarioId);
    if (!beneficiario) return;

    setMensajes([]);
    setError(null);
    agregarMensaje(
      'bot',
      `Hola ${beneficiario.nombre.split(' ')[0]}. Detectamos el escaneo de tu sello QR en el punto de entrega del ${beneficiario.clubMadres}.`,
    );
    setTimeout(() => {
      agregarMensaje(
        'bot',
        'Envía una foto como evidencia de la entrega de alimentos recibida.',
      );
      setEstadoFlujo(ESTADOS_FLUJO.ESPERANDO_FOTO);
    }, 600);
  };

  const manejarSeleccionFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setArchivoFoto(archivo);
    setPreviewFoto(URL.createObjectURL(archivo));
  };

  const enviarFoto = async () => {
    if (!archivoFoto) return;

    agregarMensaje('usuario', null, { imagen: previewFoto });
    setEstadoFlujo(ESTADOS_FLUJO.PROCESANDO);
    setError(null);

    setTimeout(() => {
      agregarMensaje('bot', 'Recibido. Validando la evidencia con IA…');
    }, 400);

    try {
      const entrega = await api.simularWhatsapp(beneficiarioId, archivoFoto);

      const mensajeFinal =
        entrega.estado === 'VALIDADA'
          ? 'Evidencia validada. El asiento queda sellado de forma inmutable en la cadena.'
          : 'No pudimos validar la evidencia enviada. Un supervisor municipal revisará el caso.';

      setTimeout(() => {
        agregarMensaje('bot', mensajeFinal, { entrega });
        setEstadoFlujo(ESTADOS_FLUJO.RESULTADO);
      }, 1200);
    } catch (err) {
      setError(err.message);
      setTimeout(() => {
        agregarMensaje(
          'bot',
          'Ocurrió un problema procesando la evidencia. Intenta nuevamente.',
        );
        setEstadoFlujo(ESTADOS_FLUJO.ESPERANDO_FOTO);
      }, 600);
    } finally {
      setArchivoFoto(null);
      setPreviewFoto(null);
    }
  };

  const reiniciar = () => {
    setMensajes([]);
    setEstadoFlujo(ESTADOS_FLUJO.INICIAL);
    setArchivoFoto(null);
    setPreviewFoto(null);
    setError(null);
  };

  return (
    <div>
      <header className="mb-10 border-b border-ledger-700 pb-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-seal-400 font-mono mb-1.5">
          Plan A · sin dependencias externas
        </p>
        <h1 className="font-display text-3xl tracking-tight text-paper-100">
          Simulador de conversación WhatsApp
        </h1>
        <p className="text-paper-300/55 text-sm mt-2 max-w-xl leading-relaxed">
          Reproduce el mismo flujo que activaría un mensaje real: validación
          con IA, sello en la cadena y registro en el libro, sin depender
          de Twilio ni de internet externo.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="rounded-sm border border-ledger-700 bg-ledger-900 p-5 h-fit">
          <p className="text-[10px] uppercase tracking-[0.1em] text-paper-300/45 font-mono mb-2">
            1. Beneficiario que escaneó su sello
          </p>
          <select
            value={beneficiarioId}
            onChange={(e) => setBeneficiarioId(e.target.value)}
            disabled={estadoFlujo !== ESTADOS_FLUJO.INICIAL}
            className="w-full rounded-sm border border-ledger-600 bg-ledger-950 text-paper-200 px-3 py-2 text-sm mb-3 disabled:opacity-50"
          >
            <option value="">Seleccionar beneficiario…</option>
            {beneficiarios.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre} · {b.clubMadres}
              </option>
            ))}
          </select>

          <button
            onClick={iniciarConversacion}
            disabled={!beneficiarioId || estadoFlujo !== ESTADOS_FLUJO.INICIAL}
            className="w-full bg-seal-600 hover:bg-seal-500 disabled:opacity-40 text-paper-100 text-sm py-2.5 rounded-sm transition-colors font-display italic"
          >
            Simular escaneo de sello
          </button>

          {estadoFlujo !== ESTADOS_FLUJO.INICIAL && (
            <button
              onClick={reiniciar}
              className="w-full mt-2 text-[11px] font-mono text-paper-300/45 hover:text-paper-300/80 py-2"
            >
              reiniciar simulación
            </button>
          )}

          {beneficiarios.length === 0 && (
            <p className="text-xs text-seal-400 mt-3">
              No hay beneficiarios registrados. Crea uno primero en la
              sección Beneficiarios.
            </p>
          )}
        </div>

        <div className="rounded-sm border border-ledger-700 bg-ledger-950 overflow-hidden flex flex-col h-[600px]">
          <div className="bg-ledger-800 text-paper-200 px-5 py-3 flex items-center gap-2.5 border-b border-ledger-700">
            <div className="w-8 h-8 rounded-full bg-confirm-500/20 border border-confirm-400/40 flex items-center justify-center font-mono text-sm text-confirm-300">
              VC
            </div>
            <div>
              <p className="text-sm text-paper-100 leading-tight">
                VasoChain · Asistente
              </p>
              <p className="text-[11px] text-paper-300/45 font-mono">
                sandbox de whatsapp (simulado)
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-thin px-5 py-4 space-y-3">
            {mensajes.length === 0 ? (
              <p className="text-center text-xs text-paper-300/30 mt-10">
                Selecciona un beneficiario y simula el escaneo del sello
                para comenzar la conversación.
              </p>
            ) : (
              mensajes.map((msg) => <BurbujaMensaje key={msg.id} msg={msg} />)
            )}
            <div ref={finChatRef} />
          </div>

          {estadoFlujo === ESTADOS_FLUJO.ESPERANDO_FOTO && (
            <div className="border-t border-ledger-700 bg-ledger-900 px-4 py-3">
              {previewFoto ? (
                <div className="flex items-center gap-3">
                  <img
                    src={previewFoto}
                    alt="Vista previa"
                    className="w-12 h-12 rounded-sm object-cover border border-ledger-600"
                  />
                  <button
                    onClick={enviarFoto}
                    className="flex-1 bg-confirm-500 hover:bg-confirm-400 text-ledger-950 text-sm py-2 rounded-sm font-display italic"
                  >
                    Enviar foto
                  </button>
                  <button
                    onClick={() => {
                      setArchivoFoto(null);
                      setPreviewFoto(null);
                    }}
                    className="text-xs text-paper-300/45 px-2"
                  >
                    quitar
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-ledger-600 rounded-sm py-2.5 text-sm text-paper-300/60 cursor-pointer hover:border-confirm-400/50 hover:text-confirm-300 transition-colors">
                  adjuntar foto de evidencia
                  <input
                    type="file"
                    accept="image/*"
                    onChange={manejarSeleccionFoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {estadoFlujo === ESTADOS_FLUJO.PROCESANDO && (
            <div className="border-t border-ledger-700 bg-ledger-900 px-4 py-3 text-center text-xs text-paper-300/45 font-mono">
              procesando evidencia (IA + cadena)…
            </div>
          )}

          {estadoFlujo === ESTADOS_FLUJO.RESULTADO && (
            <div className="border-t border-ledger-700 bg-ledger-900 px-4 py-3 text-center">
              <button
                onClick={reiniciar}
                className="text-sm text-confirm-400 hover:text-confirm-300 font-display italic"
              >
                Simular otra entrega →
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-deny-400 mt-3 font-mono">{error}</p>
      )}
    </div>
  );
}

function horaActual() {
  return new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BurbujaMensaje({ msg }) {
  const esBot = msg.de === 'bot';
  return (
    <div className={`flex ${esBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[78%] rounded-sm px-3.5 py-2 text-sm ${
          esBot
            ? 'bg-ledger-800 text-paper-200 rounded-tl-none border border-ledger-700'
            : 'bg-confirm-500/15 text-paper-100 rounded-tr-none border border-confirm-400/30'
        }`}
      >
        {msg.imagen && (
          <img
            src={msg.imagen}
            alt="Evidencia enviada"
            className="rounded-sm mb-1.5 max-h-40 object-cover"
          />
        )}
        {msg.texto && <p className="leading-snug">{msg.texto}</p>}
        <p
          className={`text-[10px] mt-1 text-right font-mono ${
            esBot ? 'text-paper-300/35' : 'text-confirm-300/60'
          }`}
        >
          {msg.hora}
        </p>
      </div>
    </div>
  );
}
