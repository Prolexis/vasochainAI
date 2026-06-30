import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const ESTADOS_FLUJO = {
  INICIAL: 'inicial',
  ELEGIR_IDIOMA: 'elegir_idioma',
  IDENTIFICARSE: 'identificarse',
  ESPERANDO_DNI: 'esperando_dni',
  ESPERANDO_QR: 'esperando_qr',
  ESPERANDO_FOTO: 'esperando_foto',
  PROCESANDO: 'procesando',
  RESULTADO: 'resultado',
};

const CANALES = {
  WHATSAPP: 'whatsapp',
  TELEGRAM: 'telegram',
  DISCORD: 'discord',
};

export default function SimuladorWhatsapp() {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [beneficiarioId, setBeneficiarioId] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [estadoFlujo, setEstadoFlujo] = useState(ESTADOS_FLUJO.INICIAL);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [error, setError] = useState(null);
  const [canal, setCanal] = useState(CANALES.WHATSAPP);
  const finChatRef = useRef(null);

  // Estados para simulación interactiva
  const [inputDni, setInputDni] = useState('');
  const [idioma, setIdioma] = useState('es');
  const [metodoId, setMetodoId] = useState('');

  // Estados para Canal Real
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
      if (canal === CANALES.WHATSAPP) {
        await api.iniciarSesionWhatsapp(numeroReal, beneficiarioId);
      } else if (canal === CANALES.TELEGRAM) {
        await api.iniciarSesionTelegram(numeroReal, beneficiarioId);
      } else if (canal === CANALES.DISCORD) {
        await api.iniciarSesionDiscord(numeroReal, beneficiarioId);
      }
      setMensajeReal({
        tipo: 'success',
        texto: `¡Sesión asociada! Envía ahora tu foto de evidencia desde ${canal === CANALES.WHATSAPP ? 'WhatsApp' : canal === CANALES.TELEGRAM ? 'Telegram' : 'Discord'}.`,
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
    setInputDni('');
    setMetodoId('');
    
    // Inicia con selección de idioma
    agregarMensaje('bot', '👋 ¡Hola! Soy el asistente virtual de VasoChain AI.\n\n¿En qué idioma prefieres que te atienda?', {
      opciones: [
        { id: 'lang_es', label: '🇵🇪 Español', value: 'es' },
        { id: 'lang_qu', label: '🌽 Quechua', value: 'qu' },
        { id: 'lang_ay', label: '🏔️ Aimara', value: 'ay' }
      ]
    });
    setEstadoFlujo(ESTADOS_FLUJO.ELEGIR_IDIOMA);
  };

  const manejarClickOpcion = (opc) => {
    agregarMensaje('usuario', opc.label);

    if (opc.id.startsWith('lang_')) {
      setIdioma(opc.value);
      setTimeout(() => {
        let msg = '';
        if (opc.value === 'qu') {
          msg = '✅ Sulpayki! Sutiykita riqsinaypaq, akllay huk akllanata:';
        } else if (opc.value === 'ay') {
          msg = '✅ Yuspagara! Uñacht\'awam khititasa uk uñjañataki, mä ajlliña ajllt\'am:';
        } else {
          msg = '✅ ¡Gracias!\n\nPara identificarte, elige una opción:';
        }

        agregarMensaje('bot', msg, {
          opciones: [
            { id: 'id_qr', label: '📷 Foto del QR', value: 'qr' },
            { id: 'id_dni', label: '✍️ Escribir DNI', value: 'dni' }
          ]
        });
        setEstadoFlujo(ESTADOS_FLUJO.IDENTIFICARSE);
      }, 600);
    } else if (opc.id.startsWith('id_')) {
      setMetodoId(opc.value);
      if (opc.value === 'dni') {
        setEstadoFlujo(ESTADOS_FLUJO.ESPERANDO_DNI);
        setTimeout(() => {
          let msg = '✍️ Escribe tu DNI (8 dígitos):';
          if (idioma === 'qu') msg = '✍️ DNI yupaykita qillqamuy (8 yupakuna):';
          if (idioma === 'ay') msg = '✍️ DNI uñacht\'äwima qillqt\'am (8 jakhuwi):';
          
          const benef = beneficiarios.find(b => b.id === beneficiarioId);
          if (benef) {
            msg += `\n\n💡 *Pista para demo:* Escribe el DNI de ${benef.nombre}: *${benef.dni}*`;
          }
          agregarMensaje('bot', msg);
        }, 600);
      } else {
        setEstadoFlujo(ESTADOS_FLUJO.ESPERANDO_QR);
        setTimeout(() => {
          let msg = '📷 Envíame la foto de tu código QR como imagen.';
          if (idioma === 'qu') msg = '📷 QR unanchaykita rikch\'ata kachamuy.';
          if (idioma === 'ay') msg = '📷 QR jamuqama fotoma khitaway.';
          agregarMensaje('bot', msg);
        }, 600);
      }
    }
  };

  const manejarEnvioDni = (e) => {
    e.preventDefault();
    if (!inputDni.trim()) return;

    const valorDni = inputDni.trim();
    agregarMensaje('usuario', valorDni);
    setInputDni('');

    const benef = beneficiarios.find(b => b.dni === valorDni);
    
    setTimeout(() => {
      if (benef) {
        if (benef.id !== beneficiarioId) {
          setBeneficiarioId(benef.id);
        }
        
        const saludo = getSaludoPorHora();
        let msgBienvenida = '';

        if (idioma === 'qu') {
          msgBienvenida = `🤝 *Allillanchu, ${benef.nombre}!* ${saludo}\n\n` +
            `Te saluda *VasoChain AI* 🤖 riqsichikuq.\n\n` +
            `Identificación exitosa en el club de madres *${benef.clubMadres || 'Club Municipal'}*.\n\n` +
            `📸 *¿Imatataq ruwanayki kunan?*\n` +
            `Pampachaway, mikhuykunapa *allin ch\'uya rikch\'anta* kachamuy ruraynayki allinchikunapaq.`;
        } else if (idioma === 'ay') {
          msgBienvenida = `🤝 *Kamisaki, ${benef.nombre}!* ${saludo}\n\n` +
            `Te saluda *VasoChain AI* 🤖.\n\n` +
            `Identificación exitosa en el club de madres *${benef.clubMadres || 'Club Municipal'}*.\n\n` +
            `📸 *¿Kunas lurawayma kunan?*\n` +
            `Manjt\'asiña, manq\'anakan *uñnaq fotopa* khitaway lurawima uñjañataki.`;
        } else {
          msgBienvenida = `🤝 *¡Hola, ${benef.nombre}!* ${saludo}\n\n` +
            `Te saluda *VasoChain AI* 🤖, el asistente virtual del programa social.\n\n` +
            `Identificación exitosa. Hemos iniciado tu proceso de entrega en el club de madres *${benef.clubMadres || 'Club Municipal'}*.\n\n` +
            `📸 *¿Qué debes hacer ahora?*\n` +
            `Por favor, envíame una *foto clara y nítida de los productos* que estás recibiendo para validar tu entrega.`;
        }

        agregarMensaje('bot', msgBienvenida);
        setEstadoFlujo(ESTADOS_FLUJO.ESPERANDO_FOTO);
      } else {
        let msgError = '❌ El DNI ingresado no está registrado en el padrón. Por favor, intenta de nuevo:';
        if (idioma === 'qu') msgError = '❌ DNI yupaykiqa manam padrónpi kanchu. Pampachaway, watiqmanta kutipay:';
        if (idioma === 'ay') msgError = '❌ DNI uñacht\'äwima janiw padrón ukankati. Watiqpacha yant\'amuy:';
        agregarMensaje('bot', msgError);
      }
    }, 600);
  };

  const simularLecturaQrMock = () => {
    const benef = beneficiarios.find(b => b.id === beneficiarioId);
    if (!benef) return;

    agregarMensaje('usuario', '📷 [Foto de código QR enviada]');
    setEstadoFlujo(ESTADOS_FLUJO.PROCESANDO);

    setTimeout(() => {
      const saludo = getSaludoPorHora();
      let msgBienvenida = '';

      if (idioma === 'qu') {
        msgBienvenida = `🤝 *Allillanchu, ${benef.nombre}!* ${saludo}\n\n` +
          `Te saluda *VasoChain AI* 🤖. QR unanchayki allin ñawinchasqa kachkan.\n\n` +
          `Hemos iniciado tu proceso de entrega en *${benef.clubMadres || 'Club Municipal'}*.\n\n` +
          `📸 *¿Imatataq ruwanayki kunan?*\n` +
          `Pampachaway, mikhuykunapa *allin ch\'uya rikch\'anta* kachamuy.`;
      } else if (idioma === 'ay') {
        msgBienvenida = `🤝 *Kamisaki, ${benef.nombre}!* ${saludo}\n\n` +
          `Te saluda *VasoChain AI* 🤖. QR jamuqama ñawinchata.\n\n` +
          `Hemos iniciado tu proceso de entrega en *${benef.clubMadres || 'Club Municipal'}*.\n\n` +
          `📸 *¿Kunas lurawayma kunan?*\n` +
          `Manjt\'asiña, manq\'anakan *uñnaq fotopa* khitaway.`;
      } else {
        msgBienvenida = `🤝 *¡Hola, ${benef.nombre}!* ${saludo}\n\n` +
          `Te saluda *VasoChain AI* 🤖. Código QR escaneado con éxito.\n\n` +
          `Hemos iniciado tu proceso de entrega en el club de madres *${benef.clubMadres || 'Club Municipal'}*.\n\n` +
          `📸 *¿Qué debes hacer ahora?*\n` +
          `Por favor, envíame una *foto clara y nítida de los productos* que estás recibiendo para validar tu entrega.`;
      }
      
      agregarMensaje('bot', msgBienvenida);
      setEstadoFlujo(ESTADOS_FLUJO.ESPERANDO_FOTO);
    }, 1000);
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
      const reporte = generarReporteControlesFrontend(entrega, canal);

      let mensajeFinal = '';
      if (entrega.estado === 'VALIDADA') {
        if (canal === CANALES.TELEGRAM) {
          mensajeFinal = `✅ <b>Entrega Validada Exitosamente</b>\n\n` +
            `¡Excelente, <b>${nombreBenef}</b>! ${saludo}.\n\nLa evidencia de alimentos ha sido procesada y aprobada correctamente por nuestro pipeline de control digital.\n\n` +
            `${reporte}\n\n` +
            `🔗 <b>REGISTRO INMUTABLE EN CADENA:</b>\n` +
            `• <b>Estado:</b> VALIDADA 🟢\n` +
            `• <b>Hash Evidencia:</b> <code>${entrega.hashBlockchain || 'N/D'}</code>\n` +
            `• <b>Transacción Blockchain (Tx):</b> <code>${entrega.txHash || 'N/D'}</code>\n\n` +
            `¡Gracias por registrar tu entrega en <b>VasoChain AI</b>! 🥛✨`;
        } else if (canal === CANALES.DISCORD) {
          mensajeFinal = `✅ **Entrega Validada Exitosamente**\n\n` +
            `¡Excelente, **${nombreBenef}**! ${saludo}.\n\nLa evidencia de alimentos ha sido procesada y aprobada correctamente por nuestro pipeline de control digital.\n\n` +
            `${reporte}\n\n` +
            `🔗 **REGISTRO INMUTABLE EN CADENA:**\n` +
            `• **Estado:** VALIDADA 🟢\n` +
            `• **Hash Evidencia:** \`${entrega.hashBlockchain || 'N/D'}\`\n` +
            `• **Transacción Blockchain (Tx):** \`${entrega.txHash || 'N/D'}\`\n\n` +
            `¡Gracias por registrar tu entrega en **VasoChain AI**! 🥛✨`;
        } else {
          mensajeFinal = `✅ *Entrega Validada Exitosamente*\n\n` +
            `¡Excelente, *${nombreBenef}*! ${saludo}.\n\nLa evidencia de alimentos ha sido procesada y aprobada correctamente por nuestro pipeline de control digital.\n\n` +
            `${reporte}\n\n` +
            `🔗 *REGISTRO INMUTABLE EN CADENA:*\n` +
            `• *Estado:* VALIDADA 🟢\n` +
            `• *Hash Evidencia:* ${entrega.hashBlockchain || 'N/D'}\n` +
            `• *Transacción Blockchain (Tx):* ${entrega.txHash || 'N/D'}\n\n` +
            `¡Gracias por registrar tu entrega en *VasoChain AI*! 🥛✨`;
        }
      } else {
        if (canal === CANALES.TELEGRAM) {
          mensajeFinal = `❌ <b>Observación en la Entrega</b>\n\n` +
            `Hola <b>${nombreBenef}</b>, ${saludo.toLowerCase()}. La evidencia fotográfica enviada no logró pasar todas las verificaciones automáticas de seguridad.\n\n` +
            `${reporte}\n\n` +
            `⚠️ <b>Estado:</b> BAJO REVISIÓN MUNICIPAL\n` +
            `• <b>Siguiente paso:</b> Tu caso ha sido derivado a un supervisor de la municipalidad para una auditoría manual. No te preocupes, esto no anula automáticamente tu beneficio si se valida de forma manual.\n\n` +
            `¡Gracias por tu paciencia!`;
        } else if (canal === CANALES.DISCORD) {
          mensajeFinal = `❌ **Observación en la Entrega**\n\n` +
            `Hola **${nombreBenef}**, ${saludo.toLowerCase()}. La evidencia fotográfica enviada no logró pasar todas las verificaciones automáticas de seguridad.\n\n` +
            `${reporte}\n\n` +
            `⚠️ **Estado:** BAJO REVISIÓN MUNICIPAL\n` +
            `• **Siguiente paso:** Tu caso ha sido derivado a un supervisor de la municipalidad para una auditoría manual. No te preocupes, esto no anula automáticamente tu beneficio si se valida de forma manual.\n\n` +
            `¡Gracias por tu paciencia!`;
        } else {
          mensajeFinal = `❌ *Observación en la Entrega*\n\n` +
            `Hola *${nombreBenef}*, ${saludo.toLowerCase()}. La evidencia fotográfica enviada no logró pasar todas las verificaciones automáticas de seguridad.\n\n` +
            `${reporte}\n\n` +
            `⚠️ *Estado:* BAJO REVISIÓN MUNICIPAL\n` +
            `• *Siguiente paso:* Tu caso ha sido derivado a un supervisor de la municipalidad para una auditoría manual. No te preocupes, esto no anula automáticamente tu beneficio si se valida de forma manual.\n\n` +
            `¡Gracias por tu paciencia!`;
        }
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
          Simulador de conversación Multicanal
        </h1>
        <p className="text-paper-300/55 text-sm mt-2 max-w-xl leading-relaxed">
          Reproduce el mismo flujo que activaría un mensaje real de WhatsApp, Telegram o Discord:
          validación con IA, sello en la cadena y registro en el libro, sin depender
          de servidores de producción.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-5 h-fit shadow-soft-xl">
            <p className="text-[10px] uppercase tracking-[0.12em] text-paper-300/50 font-mono mb-3 block">
              Canal de Mensajería Activo
            </p>
            <div className="space-y-2 mb-5">
              {/* WhatsApp Button */}
              <button
                onClick={() => { setCanal(CANALES.WHATSAPP); reiniciar(); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-mono transition-all duration-300 group ${
                  canal === CANALES.WHATSAPP
                    ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]'
                    : 'bg-ledger-950 border-ledger-700 text-paper-300/60 hover:text-paper-200 hover:border-ledger-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${canal === CANALES.WHATSAPP ? 'text-emerald-500' : 'text-paper-300/40 group-hover:text-paper-200'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.006c6.56 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="font-medium tracking-wide">WhatsApp</span>
                </div>
                {canal === CANALES.WHATSAPP && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              </button>

              {/* Telegram Button */}
              <button
                onClick={() => { setCanal(CANALES.TELEGRAM); reiniciar(); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-mono transition-all duration-300 group ${
                  canal === CANALES.TELEGRAM
                    ? 'bg-sky-500/10 border-sky-500/60 text-sky-600 dark:text-sky-400 shadow-[0_0_15px_-3px_rgba(56,189,248,0.15)]'
                    : 'bg-ledger-950 border-ledger-700 text-paper-300/60 hover:text-paper-200 hover:border-ledger-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${canal === CANALES.TELEGRAM ? 'text-sky-500' : 'text-paper-300/40 group-hover:text-paper-200'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.18l-1.91 9c-.14.65-.53.81-1.08.5l-2.91-2.15-1.4 1.35c-.15.15-.28.27-.58.27l.2-2.94 5.36-4.84c.23-.2-.05-.32-.36-.11L9.2 13.97l-2.85-.9c-.62-.19-.63-.62.13-.92l11.14-4.3c.51-.19.96.11.79.93z"/>
                  </svg>
                  <span className="font-medium tracking-wide">Telegram</span>
                </div>
                {canal === CANALES.TELEGRAM && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />}
              </button>

              {/* Discord Button */}
              <button
                onClick={() => { setCanal(CANALES.DISCORD); reiniciar(); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-mono transition-all duration-300 group ${
                  canal === CANALES.DISCORD
                    ? 'bg-indigo-500/10 border-indigo-500/60 text-indigo-600 dark:text-indigo-400 shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)]'
                    : 'bg-ledger-950 border-ledger-700 text-paper-300/60 hover:text-paper-200 hover:border-ledger-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${canal === CANALES.DISCORD ? 'text-indigo-500' : 'text-paper-300/40 group-hover:text-paper-200'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                  </svg>
                  <span className="font-medium tracking-wide">Discord</span>
                </div>
                {canal === CANALES.DISCORD && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
              </button>
            </div>

            <p className="text-[10px] uppercase tracking-[0.12em] text-paper-300/50 font-mono mb-2 block">
              1. Seleccionar Beneficiario Objetivo
            </p>
            <select
              value={beneficiarioId}
              onChange={(e) => setBeneficiarioId(e.target.value)}
              disabled={estadoFlujo !== ESTADOS_FLUJO.INICIAL}
              className="w-full rounded-xl border border-ledger-600 bg-ledger-950 text-paper-100 px-3.5 py-2.5 text-xs mb-4 disabled:opacity-50 focus:border-confirm-400 outline-none transition-all"
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
              className="w-full bg-seal-600 hover:bg-seal-500 disabled:opacity-40 text-paper-100 text-sm py-3 rounded-xl transition-all font-display italic font-medium hover:scale-[1.02] active:scale-95 shadow-md"
            >
              Iniciar Simulación del Bot
            </button>

            {estadoFlujo !== ESTADOS_FLUJO.INICIAL && (
              <button
                onClick={reiniciar}
                className="w-full mt-3 text-[10px] font-mono text-paper-300/40 hover:text-paper-300/80 py-1.5 transition-colors"
              >
                reiniciar simulación
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-ledger-700 bg-ledger-900 p-5 h-fit shadow-soft-xl">
            <p className="text-[10px] uppercase tracking-[0.12em] text-paper-300/50 font-mono mb-2">
              Plan B · {canal === CANALES.WHATSAPP ? 'WhatsApp Real (Whapi)' : canal === CANALES.TELEGRAM ? 'Telegram Real' : 'Discord Real'}
            </p>
            <p className="text-xs text-paper-300/60 leading-relaxed mb-4">
              Registra una sesión real para asociar tu {canal === CANALES.WHATSAPP ? 'número de WhatsApp' : canal === CANALES.TELEGRAM ? 'Telegram Chat ID' : 'Discord User ID'} con el
              beneficiario seleccionado, y luego envía la foto de evidencia desde tu celular.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-paper-300/40 uppercase tracking-wider block mb-1">
                  {canal === CANALES.WHATSAPP ? 'Número de Celular' : canal === CANALES.TELEGRAM ? 'Telegram Chat ID' : 'Discord User ID'}
                </label>
                <input
                  type="text"
                  value={numeroReal}
                  onChange={(e) => setNumeroReal(e.target.value)}
                  placeholder={canal === CANALES.WHATSAPP ? 'ej: 51999999999' : canal === CANALES.TELEGRAM ? 'ej: 123456789' : 'ej: 987654321012345678'}
                  className="w-full rounded-xl border border-ledger-600 bg-ledger-950 text-paper-100 px-3.5 py-2.5 text-xs font-mono focus:border-confirm-400 outline-none transition-all"
                />
              </div>
              <button
                onClick={asociarSesionReal}
                disabled={!beneficiarioId || !numeroReal || cargandoReal}
                className="w-full bg-confirm-500 hover:bg-confirm-400 disabled:opacity-40 text-ledger-950 text-xs py-2.5 rounded-xl transition-all font-display italic font-semibold hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                {cargandoReal ? 'Asociando...' : 'Asociar Sesión Real'}
              </button>
              {mensajeReal && (
                <p
                  className={`text-xs mt-2 font-mono ${
                    mensajeReal.tipo === 'error'
                      ? 'text-deny-500 dark:text-deny-400'
                      : 'text-confirm-600 dark:text-confirm-400'
                  }`}
                >
                  {mensajeReal.texto}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-ledger-700 bg-ledger-950 overflow-hidden flex flex-col h-[600px] shadow-lg relative">
          {/* Top channel accent bar */}
          <div className={`h-[4px] w-full transition-colors duration-300 ${
            canal === CANALES.WHATSAPP
              ? 'bg-emerald-500'
              : canal === CANALES.TELEGRAM
              ? 'bg-sky-500'
              : 'bg-indigo-500'
          }`} />

          <div className="bg-ledger-800 text-paper-200 px-5 py-3.5 flex items-center gap-3.5 border-b border-ledger-700">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors duration-300 ${
              canal === CANALES.WHATSAPP
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
                : canal === CANALES.TELEGRAM
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-500 dark:text-sky-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400'
            }`}>
              {canal === CANALES.WHATSAPP && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.006c6.56 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              )}
              {canal === CANALES.TELEGRAM && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.18l-1.91 9c-.14.65-.53.81-1.08.5l-2.91-2.15-1.4 1.35c-.15.15-.28.27-.58.27l.2-2.94 5.36-4.84c.23-.2-.05-.32-.36-.11L9.2 13.97l-2.85-.9c-.62-.19-.63-.62.13-.92l11.14-4.3c.51-.19.96.11.79.93z"/>
                </svg>
              )}
              {canal === CANALES.DISCORD && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-paper-100 leading-tight">
                VasoChain · Bot ({canal === CANALES.WHATSAPP ? 'WhatsApp' : canal === CANALES.TELEGRAM ? 'Telegram' : 'Discord'})
              </p>
              <p className="text-[10px] text-paper-300/50 font-mono mt-0.5">
                sandbox de {canal} (simulado)
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
              mensajes.map((msg) => (
                <BurbujaMensaje 
                  key={msg.id} 
                  msg={msg} 
                  canal={canal} 
                  onOpcionClick={manejarClickOpcion} 
                />
              ))
            )}
            <div ref={finChatRef} />
          </div>

          {(estadoFlujo === ESTADOS_FLUJO.ELEGIR_IDIOMA || estadoFlujo === ESTADOS_FLUJO.IDENTIFICARSE) && (
            <div className="border-t border-ledger-700 bg-ledger-900 px-4 py-3.5 text-center text-xs text-paper-300/40 font-mono">
              selecciona una opción en el chat de arriba…
            </div>
          )}

          {estadoFlujo === ESTADOS_FLUJO.ESPERANDO_DNI && (
            <form onSubmit={manejarEnvioDni} className="border-t border-ledger-700 bg-ledger-900 px-4 py-3 flex gap-2">
              <input
                type="text"
                maxLength={8}
                placeholder="Digita tu DNI de 8 números..."
                value={inputDni}
                onChange={(e) => setInputDni(e.target.value.replace(/\D/g, ''))}
                className="flex-1 rounded-xl border border-ledger-600 bg-ledger-950 text-paper-100 px-3.5 py-2.5 text-xs outline-none focus:border-confirm-400 font-mono transition-all"
              />
              <button 
                type="submit" 
                className="bg-confirm-500 hover:bg-confirm-400 text-ledger-950 text-xs px-4 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                Enviar DNI
              </button>
            </form>
          )}

          {estadoFlujo === ESTADOS_FLUJO.ESPERANDO_QR && (
            <div className="border-t border-ledger-700 bg-ledger-900 px-4 py-3.5 flex flex-col gap-2">
              <button
                onClick={simularLecturaQrMock}
                className="w-full bg-confirm-500 hover:bg-confirm-400 text-ledger-950 text-xs py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.01] active:scale-98 shadow-sm font-mono"
              >
                📷 Simular escaneo de tarjeta QR
              </button>
              <button
                onClick={reiniciar}
                className="text-center text-[10px] text-paper-300/40 hover:text-paper-300/70 py-1 transition-colors"
              >
                cancelar simulación
              </button>
            </div>
          )}

          {estadoFlujo === ESTADOS_FLUJO.ESPERANDO_FOTO && (
            <div className="border-t border-ledger-700 bg-ledger-900 px-4 py-3.5">
              {previewFoto ? (
                <div className="flex items-center gap-3">
                  <img
                    src={previewFoto}
                    alt="Vista previa"
                    className="w-12 h-12 rounded-lg object-cover border border-ledger-600"
                  />
                  <button
                    onClick={enviarFoto}
                    className="flex-1 bg-confirm-500 hover:bg-confirm-400 text-ledger-950 text-sm py-2.5 rounded-xl font-display italic font-semibold transition-all hover:scale-[1.01] active:scale-98 shadow-sm"
                  >
                    Enviar foto
                  </button>
                  <button
                    onClick={() => {
                      setArchivoFoto(null);
                      setPreviewFoto(null);
                    }}
                    className="text-xs text-paper-300/50 hover:text-deny-500 px-2 transition-colors font-medium"
                  >
                    quitar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-center gap-2.5 border border-dashed border-ledger-600 rounded-xl py-3 text-xs text-paper-300/60 cursor-pointer hover:border-confirm-400/50 hover:text-confirm-300 dark:hover:text-confirm-400 transition-all font-mono">
                    <svg className="w-5 h-5 text-paper-300/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
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
                    className="w-full bg-ledger-800 hover:bg-ledger-700 border border-ledger-600 text-paper-300 hover:text-paper-100 text-[11px] py-2 rounded-xl transition-all font-mono hover:scale-[1.01] active:scale-98 shadow-sm"
                  >
                    ⚡ Simular con foto de prueba (1x1 px)
                  </button>
                </div>
              )}
            </div>
          )}

          {estadoFlujo === ESTADOS_FLUJO.PROCESANDO && (
            <div className="border-t border-ledger-700 bg-ledger-900 px-4 py-4 text-center text-xs text-paper-300/50 font-mono flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-confirm-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              procesando evidencia (IA + cadena)…
            </div>
          )}

          {estadoFlujo === ESTADOS_FLUJO.RESULTADO && (
            <div className="border-t border-ledger-700 bg-ledger-900 px-4 py-3.5 text-center">
              <button
                onClick={reiniciar}
                className="text-xs text-confirm-500 hover:text-confirm-400 dark:text-confirm-400 dark:hover:text-confirm-300 font-display italic font-semibold transition-colors"
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

function generarReporteControlesFrontend(entrega, canal) {
  if (!entrega || !entrega.controlRuns || entrega.controlRuns.length === 0) {
    return '';
  }

  let boldStart = '*';
  let boldEnd = '*';
  let codeStart = '';
  let codeEnd = '';
  if (canal === 'telegram') {
    boldStart = '<b>';
    boldEnd = '</b>';
    codeStart = '<code>';
    codeEnd = '</code>';
  } else if (canal === 'discord') {
    boldStart = '**';
    boldEnd = '**';
    codeStart = '`';
    codeEnd = '`';
  }

  let reportText = `${boldStart}📊 REPORTE DE VALIDADORES (13 Controles de Arnés):${boldEnd}\n`;
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
      reportText += `\n${boldStart}${nivelTitle}${boldEnd}\n`;
      runs.forEach((run) => {
        const checkEmoji = run.resultado ? '✅' : '❌';
        const statusText = run.resultado ? 'PASÓ' : 'FALLÓ';
        reportText += `• ${checkEmoji} ${boldStart}[${run.control?.identificador}] ${run.control?.descripcion}:${boldEnd} ${statusText} (${codeStart}${run.tiempoMs}ms${codeEnd})\n`;
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

function formatearMensajeCanal(texto, canal) {
  if (!texto) return '';
  // Escapar HTML básico
  let resultado = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (canal === 'telegram') {
    resultado = resultado
      .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/g, '<strong class="font-bold text-paper-100">$1</strong>')
      .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/g, '<em class="italic text-paper-200">$1</em>')
      .replace(/&lt;code&gt;(.*?)&lt;\/code&gt;/g, '<code class="bg-ledger-800 border border-ledger-700 px-1 py-0.5 rounded font-mono text-confirm-300 text-[11px]">$1</code>');
  } else if (canal === 'discord') {
    resultado = resultado
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-paper-100">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-paper-200">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-ledger-800 border border-ledger-700 px-1 py-0.5 rounded font-mono text-confirm-300 text-[11px]">$1</code>');
  } else {
    // WhatsApp
    resultado = resultado
      .replace(/\*(.*?)\*/g, '<strong class="font-bold text-paper-100">$1</strong>')
      .replace(/_(.*?)_/g, '<em class="italic text-paper-200">$1</em>');
  }
  return <span dangerouslySetInnerHTML={{ __html: resultado }} />;
}

function BurbujaMensaje({ msg, canal, onOpcionClick }) {
  const esBot = msg.de === 'bot';

  let bubbleColorClass = '';
  let timeColorClass = '';
  let checkmarkColorClass = '';

  if (esBot) {
    bubbleColorClass = 'bg-ledger-800/90 dark:bg-ledger-800/95 border-ledger-700 text-paper-200 rounded-tl-none';
    timeColorClass = 'text-paper-300/40';
  } else {
    // User bubbles customized by channel
    if (canal === 'whatsapp') {
      bubbleColorClass = 'bg-emerald-500/15 dark:bg-emerald-500/10 border-emerald-500/30 text-paper-100 rounded-tr-none';
      timeColorClass = 'text-emerald-600/60 dark:text-emerald-400/50';
      checkmarkColorClass = 'text-emerald-500 dark:text-emerald-400';
    } else if (canal === 'telegram') {
      bubbleColorClass = 'bg-sky-500/15 dark:bg-sky-500/10 border-sky-500/30 text-paper-100 rounded-tr-none';
      timeColorClass = 'text-sky-600/60 dark:text-sky-400/50';
      checkmarkColorClass = 'text-sky-500 dark:text-sky-400';
    } else {
      // Discord
      bubbleColorClass = 'bg-indigo-500/15 dark:bg-indigo-500/10 border-indigo-500/30 text-paper-100 rounded-tr-none';
      timeColorClass = 'text-indigo-600/60 dark:text-indigo-400/50';
      checkmarkColorClass = 'text-indigo-500 dark:text-indigo-400';
    }
  }

  return (
    <div className={`flex ${esBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13.5px] shadow-sm border transition-all duration-300 ${bubbleColorClass}`}>
        {msg.imagen && (
          <img
            src={msg.imagen}
            alt="Evidencia enviada"
            className="rounded-lg mb-2.5 max-h-48 w-full object-cover border border-ledger-700/50"
          />
        )}
        {msg.texto && (
          <p className="leading-relaxed whitespace-pre-wrap font-sans">
            {formatearMensajeCanal(msg.texto, canal)}
          </p>
        )}
        {msg.opciones && (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {msg.opciones.map((opc) => {
              let brandBtnClass = '';
              if (canal === 'whatsapp') {
                brandBtnClass = 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300';
              } else if (canal === 'telegram') {
                brandBtnClass = 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20 dark:border-sky-500/30 text-sky-800 dark:text-sky-300';
              } else {
                brandBtnClass = 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300';
              }
              return (
                <button
                  key={opc.id}
                  onClick={() => onOpcionClick && onOpcionClick(opc)}
                  className={`border text-[11px] px-3.5 py-2 rounded-xl transition-all font-sans font-semibold active:scale-95 shadow-sm ${brandBtnClass}`}
                >
                  {opc.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-end gap-1 mt-2 select-none">
          <span className={`text-[9px] font-mono ${timeColorClass}`}>
            {msg.hora}
          </span>
          {!esBot && (
            <svg className={`w-3.5 h-3.5 fill-current ml-0.5 ${checkmarkColorClass}`} viewBox="0 0 24 24">
              <path d="M21.17 5.17L12 14.34l-4.17-4.17-1.42 1.41L12 17.17l10.59-10.59zM18 5l-1.42 1.4L12 11.05l-1.42-1.4L6 14.3l6 6 10.59-10.59z"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
