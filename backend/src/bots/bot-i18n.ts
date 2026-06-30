export type Idioma = 'es' | 'qu' | 'ay';
export type Formato = 'html' | 'md';

export const IDIOMAS_DISPONIBLES: Idioma[] = ['es', 'qu', 'ay'];

export const NOMBRES_IDIOMAS: Record<Idioma, string> = {
  es: '🇵🇪 Español',
  qu: '🌽 Runasimi (Quechua)',
  ay: '🏔️ Aymar aru (Aimara)',
};

export interface TextosBot {
  bienvenidaIdioma: string;
  pedirIdentificacion: string;
  identificacionRecibida: (nombre: string, club: string, fmt?: Formato) => string;
  pedirFoto: string;
  fotoRecibidaValidando: string;
  entregaValidada: (nombre: string, reporte: string, hash: string, tx: string, fmt?: Formato) => string;
  entregaRechazada: (nombre: string, reporte: string, fmt?: Formato) => string;
  errorProcesamiento: string;
  sinSesionActiva: (userId: string) => string;
  cancelar: string;
  siCancelar: string;
  noCancelar: string;
  operacionCancelada: string;
}

// ============================================================
//  ESPAÑOL
// ============================================================
const TEXTOS_ES: TextosBot = {
  bienvenidaIdioma:
    '👋 ¡Hola! Soy el asistente virtual de <b>VasoChain AI</b>.\n\n' +
    '¿En qué idioma prefieres que te atienda?',
  pedirIdentificacion: '✅ ¡Gracias!\n\nPara identificarte, elige una opción:',
  identificacionRecibida: (nombre, club, fmt = 'html') => {
    const b = fmt === 'html' ? ['<b>', '</b>'] : ['**', '**'];
    return `✅ Hola ${b[0]}${nombre}${b[1]}, te identificamos correctamente.\n\n` +
      `📍 Club de madres: ${b[0]}${club || 'Club Municipal'}${b[1]}\n\n` +
      `Ahora envíame la foto de los productos recibidos:`;
  },
  pedirFoto:
    '📸 Por favor, envíame una foto clara y nítida de los alimentos recibidos (leche, avena, raciones, etc.).',
  fotoRecibidaValidando:
    '⏳ Foto recibida. Estoy validando con los 13 controles de arnés...',
  entregaValidada: (nombre, reporte, hash, tx, fmt = 'html') => {
    const b = fmt === 'html' ? ['<b>', '</b>'] : ['**', '**'];
    const c = fmt === 'html' ? ['<code>', '</code>'] : ['`', '`'];
    return `✅ ${b[0]}Entrega Validada${b[1]}\n\n` +
      `¡Excelente, ${b[0]}${nombre}${b[1]}! Tu entrega fue aprobada.\n\n` +
      `${reporte}\n\n` +
      `🔗 ${b[0]}Registro inmutable en cadena:${b[1]}\n` +
      `• Hash: ${c[0]}${hash || 'N/D'}${c[1]}\n` +
      `• TX: ${c[0]}${tx || 'N/D'}${c[1]}`;
  },
  entregaRechazada: (nombre, reporte, fmt = 'html') => {
    const b = fmt === 'html' ? ['<b>', '</b>'] : ['**', '**'];
    return `❌ ${b[0]}Entrega Bajo Revisión${b[1]}\n\n` +
      `Hola ${b[0]}${nombre}${b[1]}, tu foto no pasó todas las verificaciones automáticas.\n\n` +
      `${reporte}\n\n` +
      `Tu caso fue derivado a un supervisor municipal para auditoría manual.`;
  },
  errorProcesamiento:
    '⚠️ Ocurrió un error al procesar tu evidencia. Por favor intenta enviar la foto nuevamente.',
  sinSesionActiva: (userId) =>
    `⚠️ No identificamos una entrega activa para tu chat.\n\nTu ID es: ${userId}\n\n` +
    `Pídele al supervisor que escanee tu QR para iniciar una sesión.`,
  cancelar: '¿Seguro que quieres cancelar la entrega en curso?',
  siCancelar: 'Sí, cancelar',
  noCancelar: 'No, continuar',
  operacionCancelada:
    '✅ Operación cancelada. Cuando quieras registrar una entrega, vuelve a tocar /start.',
};

// ============================================================
//  QUECHUA (Runasimi — variante sureña/cusqueña)
// ============================================================
const TEXTOS_QU: TextosBot = {
  bienvenidaIdioma:
    '👋 Napaykullayki! Nuqam kani VasoChain AI-pa yanapaqnin.\n\n' +
    '¿Ima simipitak rimanayki munankis?',
  pedirIdentificacion: '✅ Añay!\n\nRiqsikunaykipaq, huk kamachikuyta akllay:',
  identificacionRecibida: (nombre, club, fmt = 'html') => {
    const b = fmt === 'html' ? ['<b>', '</b>'] : ['**', '**'];
    return `✅ Napaykullayki ${b[0]}${nombre}${b[1]}, allintan riqsiykiku.\n\n` +
      `📍 Mamakuna wasin: ${b[0]}${club || 'Club Municipal'}${b[1]}\n\n` +
      `Kunanmi mikhunata chaskinaykita rimanki, chayta fotografiata apamuwai:`;
  },
  pedirFoto:
    '📸 Ama hina kaspa, chaskinaykimanta mikhunakunata (leche, avena, racioneskuna) allin fotografiata apamuwai.',
  fotoRecibidaValidando:
    '⏳ Fotografiata chaskirqani. Chunka kinsayuq controlkunawan verificaspa kachkani...',
  entregaValidada: (nombre, reporte, hash, tx, fmt = 'html') => {
    const b = fmt === 'html' ? ['<b>', '</b>'] : ['**', '**'];
    const c = fmt === 'html' ? ['<code>', '</code>'] : ['`', '`'];
    return `✅ ${b[0]}Chaskinakuy Cheqaq${b[1]}\n\n` +
      `Allinmi, ${b[0]}${nombre}${b[1]}! Chaskinaykiqa chekaqtaq aswanmi.\n\n` +
      `${reporte}\n\n` +
      `🔗 ${b[0]}Blockchain ramipi qillqasqa:${b[1]}\n` +
      `• Hash: ${c[0]}${hash || 'N/D'}${c[1]}\n` +
      `• TX: ${c[0]}${tx || 'N/D'}${c[1]}`;
  },
  entregaRechazada: (nombre, reporte, fmt = 'html') => {
    const b = fmt === 'html' ? ['<b>', '</b>'] : ['**', '**'];
    return `❌ ${b[0]}Chaskinakuy Qhawarisqa${b[1]}\n\n` +
      `Napaykullayki ${b[0]}${nombre}${b[1]}, fotografiayki mana tukuy verificacionkunata pasarqanchu.\n\n` +
      `${reporte}\n\n` +
      `Kamachikuq qhawarinampaq apasqaña kacharqasunki.`;
  },
  errorProcesamiento:
    '⚠️ Huk pantaymi karqan fotografiaykita procesaspa. Ama hina kaspa, fotografiata kutipamuwai.',
  sinSesionActiva: (userId) =>
    `⚠️ Mana chaskikunaykita tariyrqanichu.\n\nKay ID niyki: ${userId}\n\n` +
    `Kamachikuqta mañakuy QR codigonkita escaneaspa sesionniykita qallarichipuwanankitak.`,
  cancelar: '¿Cheqaqtachu chaskinaykita saqerpari munankis?',
  siCancelar: 'Arí, saqerpari',
  noCancelar: 'Mana, katiy',
  operacionCancelada:
    '✅ Saqerpasqa. Chaskinaykita qillqayta munaspaqa, /start nispa kutimuy.',
};

// ============================================================
//  AIMARA (variante boliviana-peruana)
// ============================================================
const TEXTOS_AY: TextosBot = {
  bienvenidaIdioma:
    '👋 Kamisaraki! Nanaka VasoChain AI-na yanapt\'iriwa.\n\n' +
    '¿Khiti arunakampirak aruskipt\'asm awisitasm munta?',
  pedirIdentificacion: '✅ Yuspagara!\n\nUñt\'ayañataki, maya kamachinaka ajllt\'a:',
  identificacionRecibida: (nombre, club, fmt = 'html') => {
    const b = fmt === 'html' ? ['<b>', '</b>'] : ['**', '**'];
    return `✅ Kamisaraki ${b[0]}${nombre}${b[1]}, alwa uñt\'atarakiwa.\n\n` +
      `📍 Mamanaka uta: ${b[0]}${club || 'Club Municipal'}${b[1]}\n\n` +
      `Jichhax apnaqañatak manq\'anakana foto apkipt\'itama:`;
  },
  pedirFoto:
    '📸 Ama llakisiñatak, apnaqt\'ata manq\'anaka (leche, avena, racionesnaka) foto alwa apkipt\'itama.',
  fotoRecibidaValidando:
    '⏳ Foto chuymaniwa. Tunka kimsani controlnakampiw verificastha...',
  entregaValidada: (nombre, reporte, hash, tx, fmt = 'html') => {
    const b = fmt === 'html' ? ['<b>', '</b>'] : ['**', '**'];
    const c = fmt === 'html' ? ['<code>', '</code>'] : ['`', '`'];
    return `✅ ${b[0]}Apnaqaña Chekawa${b[1]}\n\n` +
      `Walikiwa, ${b[0]}${nombre}${b[1]}! Apnaqañamax chekawa achirachatarakiwa.\n\n` +
      `${reporte}\n\n` +
      `🔗 ${b[0]}Blockchain patanx qillqatawa:${b[1]}\n` +
      `• Hash: ${c[0]}${hash || 'N/D'}${c[1]}\n` +
      `• TX: ${c[0]}${tx || 'N/D'}${c[1]}`;
  },
  entregaRechazada: (nombre, reporte, fmt = 'html') => {
    const b = fmt === 'html' ? ['<b>', '</b>'] : ['**', '**'];
    return `❌ ${b[0]}Apnaqaña Qhanañchasiñani${b[1]}\n\n` +
      `Kamisaraki ${b[0]}${nombre}${b[1]}, fotomäx tukuy verificacionanaka pasapxiritayna.\n\n` +
      `${reporte}\n\n` +
      `Kamachinix qhanañchasañataki apayatawa.`;
  },
  errorProcesamiento:
    '⚠️ Maya pantachiwa fotomä procesastha. Ama llakisiñatak, foto jutikipitama.',
  sinSesionActiva: (userId) =>
    `⚠️ Apnaqañamax taririta.\n\nID: ${userId}\n\n` +
    `Kamachinix QR codigomä escaneasañataki mayt\'ita sesionma qalltañataki.`,
  cancelar: '¿Chekatitix apnaqañamax sañt\'ayañ munsta?',
  siCancelar: 'Jisa, sañt\'aya',
  noCancelar: 'Janiwa, sartañani',
  operacionCancelada:
    '✅ Sañt\'ayatawa. Apnaqañamax qillqañ munsta ukhaxa, /start apnaqitama.',
};

// ============================================================
//  Exportaciones
// ============================================================
export const TEXTOS: Record<Idioma, TextosBot> = {
  es: TEXTOS_ES,
  qu: TEXTOS_QU,
  ay: TEXTOS_AY,
};

export function obtenerTextos(idioma?: string): TextosBot {
  if (idioma === 'qu') return TEXTOS.qu;
  if (idioma === 'ay') return TEXTOS.ay;
  return TEXTOS.es;
}