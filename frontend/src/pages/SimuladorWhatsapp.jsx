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

  // Estados para WhatsApp Real
  const [numeroReal, setNumeroReal] = useState('');
  const [cargandoReal, setCargandoReal] = useState(false);
  const [mensajeReal, setMensajeReal] = useState(null);

  useEffect(() => {
    api.listarBeneficiarios().then(setBeneficiarios).catch(() => {});
  }, []);

  const asociarSesionReal = async () => {
    if (!beneficiarioId || !numeroReal) return;
    setCargandoReal(true);
    setMensajeReal(null);
    try {
      await api.iniciarSesionWhatsapp(numeroReal, beneficiarioId);
      setMensajeReal({
        tipo: 'success',
        texto: '¡Sesión asociada! Envía ahora tu foto de evidencia desde WhatsApp.',
      });
    } catch (err) {
      setMensajeReal({ tipo: 'error', texto: `Error: ${err.message}` });
    } finally {
      setCargandoReal(false);
    }
  };

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
    
    const saludo = getSaludoPorHora();
    const msgBienvenida = `🤝 *¡Hola, ${beneficiario.nombre}!* ${saludo}\n\n` +
      `Te saluda *VasoChain AI* 🤖, el asistente virtual del programa social.\n\n` +
      `Hemos iniciado tu proceso de entrega en el club de madres *${beneficiario.clubMadres || 'Club Municipal'}*.\n\n` +
      `📸 *¿Qué debes hacer ahora?*\n` +
      `Por favor, envíame una *foto clara y nítida de los productos* (leche, avena, raciones, etc.) que estás recibiendo para validar tu entrega.\n\n` +
      `*Validaciones activas en tiempo real:*\n` +
      `🔍 [HC-001] Verificación de código QR\n` +
      `🛰️ [HC-002] Geolocalización del punto\n` +
      `🕒 [HC-003] Consistencia de rango horario\n` +
      `🧠 [HC-004] Clasificación por Inteligencia Artificial\n` +
      `🔗 [HC-010] Registro y sellado inmutable en Blockchain`;

    agregarMensaje('bot', msgBienvenida);
    setEstadoFlujo(ESTADOS_FLUJO.ESPERANDO_FOTO);
  };

  const manejarSeleccionFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setArchivoFoto(archivo);
    setPreviewFoto(URL.createObjectURL(archivo));
  };

  const simularFotoMock = () => {
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    fetch(`data:image/png;base64,${base64}`)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "foto_prueba_arnes.png", { type: "image/png" });
        setArchivoFoto(file);
        setPreviewFoto(`data:image/png;base64,${base64}`);
      });
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
      const saludo = getSaludoPorHora();
      const nombreBenef = entrega.beneficiario?.nombre || 'Beneficiario';
      const reporte = generarReporteControlesFrontend(entrega);

      let mensajeFinal = '';
      if (entrega.estado === 'VALIDADA') {
        mensajeFinal = `✅ *Entrega Validada Exitosamente*\n\n` +
          `¡Excelente, *${nombreBenef}*! ${saludo}. La evidencia de alimentos ha sido procesada y aprobada correctamente por nuestro pipeline de control digital.\n\n` +
          `${reporte}\n\n` +
          `🔗 *REGISTRO INMUTABLE EN CADENA:*\n` +
          `• *Estado:* VALIDADA 🟢\n` +
          `• *Hash Evidencia:* ${entrega.hashBlockchain || 'N/D'}\n` +
          `• *Transacción Blockchain (Tx):* ${entrega.txHash || 'N/D'}\n\n` +
          `¡Gracias por registrar tu entrega en *VasoChain AI*! 🥛✨`;
      } else {
        mensajeFinal = `❌ *Observación en la Entrega*\n\n` +
          `Hola *${nombreBenef}*, ${saludo.toLowerCase()}. La evidencia fotográfica enviada no logró pasar todas las verificaciones automáticas de seguridad.\n\n` +
          `${reporte}\n\n` +
          `⚠️ *Estado:* BAJO REVISIÓN MUNICIPAL\n` +
          `• *Siguiente paso:* Tu caso ha sido derivado a un supervisor de la municipalidad para una auditoría manual. No te preocupes, esto no anula automáticamente tu beneficio si se valida de forma manual.\n\n` +
          `¡Gracias por tu paciencia!`;
      }

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

        </div>

        <div className="rounded-sm border border-ledger-700 bg-ledger-900 p-5 h-fit mt-4">
          <p className="text-[10px] uppercase tracking-[0.1em] text-paper-300/45 font-mono mb-2">
            Plan B · WhatsApp Real (Whapi)
          </p>
          <p className="text-xs text-paper-300/60 leading-relaxed mb-4">
            Registra una sesión real para asociar tu número de WhatsApp con el
            beneficiario seleccionado, y luego envía la foto de evidencia desde tu celular.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-paper-300/40 uppercase tracking-wider block mb-1">
                Número de Celular
              </label>
              <input
                type="text"
                value={numeroReal}
                onChange={(e) => setNumeroReal(e.target.value)}
                placeholder="ej: 51999999999"
                className="w-full rounded-sm border border-ledger-600 bg-ledger-950 text-paper-200 px-3 py-1.5 text-sm font-mono focus:border-confirm-400/50 outline-none"
              />
            </div>
            <button
              onClick={asociarSesionReal}
              disabled={!beneficiarioId || !numeroReal || cargandoReal}
              className="w-full bg-confirm-500 hover:bg-confirm-400 disabled:opacity-40 text-ledger-950 text-sm py-2 rounded-sm transition-colors font-display italic font-medium"
            >
              {cargandoReal ? 'Asociando...' : 'Asociar Sesión Real'}
            </button>
            {mensajeReal && (
              <p
                className={`text-xs mt-2 font-mono ${
                  mensajeReal.tipo === 'error'
                    ? 'text-deny-400'
                    : 'text-confirm-400'
                }`}
              >
                {mensajeReal.texto}
              </p>
            )}
          </div>
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

          <div 
            className="flex-1 overflow-y-auto scroll-thin px-5 py-5 space-y-4" 
            style={{
              backgroundImage: 'radial-gradient(var(--color-ledger-800) 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px',
              backgroundColor: 'var(--color-ledger-950)'
            }}
          >
            {mensajes.length === 0 ? (
              <p className="text-center text-xs text-paper-300/30 mt-10 font-mono">
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
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-center gap-2 border border-dashed border-ledger-600 rounded-sm py-2.5 text-sm text-paper-300/60 cursor-pointer hover:border-confirm-400/50 hover:text-confirm-300 transition-colors">
                    adjuntar foto de evidencia
                    <input
                      type="file"
                      accept="image/*"
                      onChange={manejarSeleccionFoto}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={simularFotoMock}
                    className="w-full bg-ledger-800 hover:bg-ledger-700 border border-ledger-600 text-paper-300 hover:text-paper-100 text-xs py-1.5 rounded-sm transition-colors font-mono"
                  >
                    ⚡ Simular con foto de prueba (1x1 px)
                  </button>
                </div>
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

function getSaludoPorHora() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) {
    return 'Buenos días ☀️';
  } else if (hora >= 12 && hora < 19) {
    return 'Buenas tardes 🌤️';
  } else {
    return 'Buenas noches 🌙';
  }
}

function generarReporteControlesFrontend(entrega) {
  if (!entrega || !entrega.controlRuns || entrega.controlRuns.length === 0) {
    return '';
  }

  let reportText = `📊 *REPORTE DE VALIDADORES (13 Controles de Arnés):*\n`;
  reportText += `--------------------------------------------------\n`;

  const niveles = {
    NIVEL_1_ENTRADA: 'Nivel 1: Entrada y Registro 📝',
    NIVEL_2_FOTO: 'Nivel 2: Evidencia Fotográfica 📸',
    NIVEL_3_DATOS: 'Nivel 3: Consistencia de Datos 📋',
    NIVEL_4_BLOCKCHAIN: 'Nivel 4: Integridad Blockchain ⛓️',
    NIVEL_5_SUPERVISION: 'Nivel 5: Supervisión y Auditoría 🚨',
  };

  const controlRunsPorNivel = {};
  entrega.controlRuns.forEach((run) => {
    const nivel = run.control?.nivel;
    if (nivel) {
      if (!controlRunsPorNivel[nivel]) {
        controlRunsPorNivel[nivel] = [];
      }
      controlRunsPorNivel[nivel].push(run);
    }
  });

  Object.entries(niveles).forEach(([nivelKey, nivelTitle]) => {
    const runs = controlRunsPorNivel[nivelKey] || [];
    if (runs.length > 0) {
      reportText += `\n*${nivelTitle}*\n`;
      runs.forEach((run) => {
        const checkEmoji = run.resultado ? '✅' : '❌';
        const statusText = run.resultado ? 'PASÓ' : 'FALLÓ';
        reportText += `• ${checkEmoji} *[${run.control?.identificador}] ${run.control?.descripcion}:* ${statusText} (${run.tiempoMs}ms)\n`;
      });
    }
  });

  reportText += `--------------------------------------------------`;
  return reportText;
}

function horaActual() {
  return new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatearMensajeWhatsapp(texto) {
  if (!texto) return '';
  // Escapar HTML básico
  let resultado = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Reemplazar *negrita* por <strong>
  resultado = resultado.replace(/\*(.*?)\*/g, '<strong class="font-bold text-paper-100">$1</strong>');
  // Reemplazar _cursiva_ por <em>
  resultado = resultado.replace(/_(.*?)_/g, '<em class="italic text-paper-200">$1</em>');
  return <span dangerouslySetInnerHTML={{ __html: resultado }} />;
}

function BurbujaMensaje({ msg }) {
  const esBot = msg.de === 'bot';
  return (
    <div className={`flex ${esBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
      <div
        className={`max-w-[82%] rounded-sm px-4 py-2.5 text-[13px] shadow-md border ${
          esBot
            ? 'bg-ledger-800/90 backdrop-blur-sm text-paper-200 rounded-tl-none border-ledger-700'
            : 'bg-confirm-500/15 backdrop-blur-sm text-paper-100 rounded-tr-none border-confirm-400/30'
        }`}
      >
        {msg.imagen && (
          <img
            src={msg.imagen}
            alt="Evidencia enviada"
            className="rounded-sm mb-2 max-h-48 w-full object-cover border border-ledger-700"
          />
        )}
        {msg.texto && (
          <p className="leading-relaxed whitespace-pre-wrap font-sans">
            {formatearMensajeWhatsapp(msg.texto)}
          </p>
        )}
        <div className="flex items-center justify-end gap-1 mt-1.5 select-none">
          <span className={`text-[9px] font-mono ${esBot ? 'text-paper-300/40' : 'text-confirm-300/50'}`}>
            {msg.hora}
          </span>
          {!esBot && (
            <svg className="w-3.5 h-3.5 text-confirm-400 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M21.17 5.17L12 14.34l-4.17-4.17-1.42 1.41L12 17.17l10.59-10.59zM18 5l-1.42 1.4L12 11.05l-1.42-1.4L6 14.3l6 6 10.59-10.59z"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
