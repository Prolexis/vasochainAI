import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntregasService } from '../entregas/entregas.service';
import { PrismaService } from '../prisma/prisma.service';
import { BotStateService } from '../bots/bot-state.service';
import { leerQR } from '../bots/qr-reader';
import { Idioma, IDIOMAS_DISPONIBLES, NOMBRES_IDIOMAS, obtenerTextos } from '../bots/bot-i18n';

/**
 * Servicio de Telegram con flujo conversacional guiado por botones inline.
 *
 * Flujo guiado:
 *   /start → elegir idioma → elegir método identificación
 *   → esperar DNI → asociar beneficiario → esperar foto
 *   → validar con IA + blockchain → mostrar reporte con botones
 *
 * Compatibilidad mantenida con POST /telegram/iniciar-sesion
 * (supervisor escanea QR desde el frontend).
 */
@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly entregasService: EntregasService,
    private readonly prisma: PrismaService,
    private readonly botState: BotStateService,
  ) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') || '';
    if (!this.botToken) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN no configurado. El bot no responderá hasta configurarlo en .env.',
      );
    } else {
      this.logger.log('Telegram Bot configurado y listo.');
    }
  }

  onModuleInit() {
    if (this.botToken) {
      this.logger.log('Iniciando long polling para Telegram Bot...');
      this.iniciarLongPolling();
    }
  }

  // ============================================================
  //  HTTP helpers
  // ============================================================

  private async llamarApi(method: string, body: Record<string, unknown>): Promise<any> {
    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Telegram API ${method} → ${res.status}: ${text}`);
    }
    return res.json();
  }

  async enviarMensajeTexto(chatId: string, texto: string): Promise<boolean> {
    if (!this.botToken) return false;
    try {
      await this.llamarApi('sendMessage', {
        chat_id: chatId,
        text: texto,
        parse_mode: 'HTML',
      });
      return true;
    } catch (error) {
      this.logger.error(`Error enviando mensaje a ${chatId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Envía un mensaje con botones inline (InlineKeyboardMarkup).
   * Los callbacks llegan como callback_query y se manejan en manejarCallback().
   */
  private async enviarConBotones(
    chatId: string,
    texto: string,
    botones: Array<Array<{ texto: string; data: string }>>,
  ): Promise<boolean> {
    if (!this.botToken) return false;
    try {
      await this.llamarApi('sendMessage', {
        chat_id: chatId,
        text: texto,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: botones.map((fila) =>
            fila.map((b) => ({ text: b.texto, callback_data: b.data })),
          ),
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error enviando botones a ${chatId}: ${error.message}`);
      return false;
    }
  }

  private async responderCallback(callbackQueryId: string, texto?: string): Promise<void> {
    try {
      await this.llamarApi('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text: texto || '',
        show_alert: false,
      });
    } catch (error) {
      this.logger.warn(`No se pudo responder callback: ${error.message}`);
    }
  }

  // ============================================================
  //  Long polling
  // ============================================================

  private async iniciarLongPolling() {
    let offset = 0;
    let backoffMs = 1000;
    const maxBackoffMs = 30000;

    (async () => {
      while (true) {
        try {
          if (!this.botToken) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${offset}&timeout=30`;
          const response = await fetch(url);
          if (!response.ok) {
            this.logger.warn(`Telegram ${response.status}, reintentando en ${backoffMs}ms`);
            await new Promise((r) => setTimeout(r, backoffMs));
            backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
            continue;
          }
          backoffMs = 1000;

          const data: any = await response.json();
          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              offset = update.update_id + 1;
              this.procesarUpdate(update).catch((err) =>
                this.logger.error(`Error procesando update: ${err.message}`),
              );
            }
          }
        } catch (error) {
          this.logger.error(`Excepción long polling: ${error.message}`);
          await new Promise((r) => setTimeout(r, backoffMs));
          backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
        }
      }
    })();
  }

  /**
   * Punto de entrada único para cualquier update (mensaje, foto, callback_query).
   * También lo llama el endpoint /webhook si se usa modo webhook en vez de polling.
   */
  async procesarWebhookTelegram(update: any): Promise<void> {
    await this.procesarUpdate(update);
  }

  private async procesarUpdate(update: any): Promise<void> {
    if (update.callback_query) {
      await this.manejarCallback(update.callback_query);
      return;
    }
    if (update.message) {
      await this.manejarMensaje(update.message);
      return;
    }
  }

  // ============================================================
  //  Handler de mensajes
  // ============================================================

  private async manejarMensaje(message: any): Promise<void> {
    const chatId = message.chat?.id?.toString();
    const userId = chatId; // en Telegram el chat_id identifica al usuario 1-a-1
    if (!chatId) return;

    const text = (message.text || '').trim();
    const photos = message.photo;
    const isImage = Array.isArray(photos) && photos.length > 0;

    // /start reinicia el flujo siempre
    if (text === '/start' || text === 'start') {
      this.botState.actualizar('telegram', userId, {
        estado: 'ELEGIR_IDIOMA',
        beneficiarioId: undefined,
        nombreBeneficiario: undefined,
        clubMadres: undefined,
        intentosCancelar: 0,
      });
      await this.mostrarMenuIdioma(chatId);
      return;
    }

    const sesion = this.botState.obtener('telegram', userId);
    if (!sesion) {
      await this.enviarMensajeTexto(
        chatId,
        '👋 ¡Hola! Toca <b>/start</b> para comenzar con VasoChain AI.',
      );
      return;
    }

    switch (sesion.estado) {
      case 'ELEGIR_IDIOMA':
        if (text) await this.procesarEleccionIdioma(chatId, userId, text);
        break;

      case 'IDENTIFICARSE':
      case 'ESPERANDO_DNI':
        if (isImage) {
          await this.procesarFotoQR(chatId, userId, photos);
        } else if (text) {
          await this.procesarDni(chatId, userId, text);
        }
        break;

      case 'ESPERANDO_FOTO':
        if (isImage) {
          await this.procesarFoto(chatId, userId, photos);
        } else if (text === '/cancelar') {
          await this.mostrarConfirmacionCancelar(chatId, userId);
        } else {
          await this.enviarConBotones(
            chatId,
            obtenerTextos(sesion.idioma).pedirFoto,
            [[{ texto: '❌ Cancelar', data: 'acc:cancelar' }]],
          );
        }
        break;

      case 'FINALIZADO':
        await this.enviarConBotones(
          chatId,
          '¿Qué deseas hacer ahora?',
          [[
            { texto: '🔄 Nueva entrega', data: 'acc:nueva' },
            { texto: '🆕 Reiniciar', data: 'acc:reiniciar' },
          ]],
        );
        break;

      case 'CANCELAR_CONFIRMACION':
        await this.enviarMensajeTexto(chatId, 'Por favor usa los botones de arriba para confirmar.');
        break;

      default:
        await this.enviarMensajeTexto(chatId, 'Estado desconocido. Toca /start para reiniciar.');
    }
  }

  // ============================================================
  //  Handler de callbacks (botones inline)
  // ============================================================

  private async manejarCallback(callbackQuery: any): Promise<void> {
    const data = callbackQuery.data as string;
    const userId = callbackQuery.from?.id?.toString();
    const chatId = callbackQuery.message?.chat?.id?.toString();
    if (!userId || !chatId) return;

    const sesion = this.botState.obtener('telegram', userId);
    if (!sesion) {
      await this.responderCallback(callbackQuery.id, 'Sesión expirada. Toca /start.');
      return;
    }

    // --- Elección de idioma ---
    if (data.startsWith('lang:')) {
      const idioma = data.split(':')[1] as Idioma;
      if (!IDIOMAS_DISPONIBLES.includes(idioma)) {
        await this.responderCallback(callbackQuery.id, 'Idioma no válido');
        return;
      }
      this.botState.actualizar('telegram', userId, { idioma, estado: 'IDENTIFICARSE' });
      await this.responderCallback(callbackQuery.id, `✅ ${NOMBRES_IDIOMAS[idioma]}`);
      await this.mostrarMenuIdentificacion(chatId, idioma);
      return;
    }

    // --- Método de identificación ---
    if (data === 'id:dni') {
      this.botState.actualizar('telegram', userId, { estado: 'ESPERANDO_DNI' });
      await this.responderCallback(callbackQuery.id);
      await this.enviarMensajeTexto(chatId, '✍️ Escribe tu <b>DNI</b> (8 dígitos):');
      return;
    }

    if (data === 'id:qr') {
      this.botState.actualizar('telegram', userId, { estado: 'ESPERANDO_DNI' });
      await this.responderCallback(callbackQuery.id);
      await this.enviarMensajeTexto(
        chatId,
        '📷 Envíame la <b>foto de tu código QR</b> como imagen.',
      );
      return;
    }

    // --- Cancelar ---
    if (data === 'acc:cancelar') {
      await this.responderCallback(callbackQuery.id);
      await this.mostrarConfirmacionCancelar(chatId, userId);
      return;
    }

    if (data === 'cancel:si') {
      this.botState.eliminar('telegram', userId);
      await this.responderCallback(callbackQuery.id, 'Cancelado');
      await this.enviarMensajeTexto(
        chatId,
        obtenerTextos(sesion.idioma).operacionCancelada,
      );
      return;
    }

    if (data === 'cancel:no') {
      const nuevoEstado = sesion.beneficiarioId ? 'ESPERANDO_FOTO' : 'IDENTIFICARSE';
      this.botState.actualizar('telegram', userId, { estado: nuevoEstado });
      await this.responderCallback(callbackQuery.id, 'Continuamos');
      const msg = sesion.beneficiarioId
        ? obtenerTextos(sesion.idioma).pedirFoto
        : obtenerTextos(sesion.idioma).pedirIdentificacion;
      await this.enviarMensajeTexto(chatId, '👍 ' + msg);
      return;
    }

    // --- Acciones finales ---
    if (data === 'acc:reporte') {
      await this.responderCallback(callbackQuery.id);
      await this.enviarMensajeTexto(chatId, '📊 El reporte completo ya está arriba en este chat.');
      return;
    }

    if (data === 'acc:nueva') {
      this.botState.actualizar('telegram', userId, { estado: 'ESPERANDO_FOTO' });
      await this.responderCallback(callbackQuery.id, 'Nueva entrega');
      await this.enviarConBotones(
        chatId,
        obtenerTextos(sesion.idioma).pedirFoto,
        [[{ texto: '❌ Cancelar', data: 'acc:cancelar' }]],
      );
      return;
    }

    if (data === 'acc:reiniciar') {
      this.botState.eliminar('telegram', userId);
      await this.responderCallback(callbackQuery.id, 'Reiniciando...');
      this.botState.actualizar('telegram', userId, {
        estado: 'ELEGIR_IDIOMA',
        intentosCancelar: 0,
      });
      await this.mostrarMenuIdioma(chatId);
      return;
    }

    await this.responderCallback(callbackQuery.id, 'Opción no reconocida');
  }

  // ============================================================
  //  Pasos del flujo
  // ============================================================

  private async mostrarMenuIdioma(chatId: string): Promise<void> {
    await this.enviarConBotones(
      chatId,
      obtenerTextos('es').bienvenidaIdioma,
      [[
        { texto: '🇵🇪 Español', data: 'lang:es' },
        { texto: '🌽 Quechua', data: 'lang:qu' },
        { texto: '🏔️ Aimara', data: 'lang:ay' },
      ]],
    );
  }

  private async mostrarMenuIdentificacion(chatId: string, idioma: Idioma): Promise<void> {
    await this.enviarConBotones(
      chatId,
      obtenerTextos(idioma).pedirIdentificacion,
      [[
        { texto: '📷 Foto del QR', data: 'id:qr' },
        { texto: '✍️ Escribir DNI', data: 'id:dni' },
      ]],
    );
  }

  private async procesarEleccionIdioma(
    chatId: string,
    userId: string,
    texto: string,
  ): Promise<void> {
    const t = texto.toLowerCase().trim();
    let idioma: Idioma | null = null;
    if (t.startsWith('esp') || t === 'es' || t === '1') idioma = 'es';
    else if (t.startsWith('que') || t === 'qu' || t === '2') idioma = 'qu';
    else if (t.startsWith('aim') || t === 'ay' || t === '3') idioma = 'ay';

    if (!idioma) {
      await this.mostrarMenuIdioma(chatId);
      return;
    }
    this.botState.actualizar('telegram', userId, { idioma, estado: 'IDENTIFICARSE' });
    await this.mostrarMenuIdentificacion(chatId, idioma);
  }

  private async procesarFotoQR(chatId: string, userId: string, photos: any[]): Promise<void> {
    const sesion = this.botState.obtener('telegram', userId);
    await this.enviarMensajeTexto(chatId, '🔍 Leyendo tu código QR...');

    try {
      const photo = photos[photos.length - 1];
      const fileRes: any = await this.llamarApi('getFile', { file_id: photo.file_id });
      const filePath = fileRes.result?.file_path;
      if (!filePath) throw new Error('No se obtuvo filePath');

      const downloadUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
      const imgRes = await fetch(downloadUrl);
      const buffer = Buffer.from(await imgRes.arrayBuffer());

      const textoQR = await leerQR(buffer);

      if (!textoQR) {
        await this.enviarConBotones(
          chatId,
          '❌ No pude leer el QR. Asegúrate de que la imagen sea clara y el QR esté bien enfocado.\n\nO bien escribe tu DNI directamente:',
          [[
            { texto: '✍️ Escribir DNI', data: 'id:dni' },
            { texto: '❌ Cancelar', data: 'acc:cancelar' },
          ]],
        );
        return;
      }

      // El QR puede contener directamente el DNI o un ID de beneficiario
      // Intentamos como DNI primero, luego como ID
      await this.procesarPorId(chatId, userId, textoQR);

    } catch (error) {
      this.logger.error(`Error leyendo QR Telegram: ${error.message}`);
      await this.enviarConBotones(
        chatId,
        '⚠️ Error al procesar la imagen. Intenta de nuevo o escribe tu DNI:',
        [[
          { texto: '✍️ Escribir DNI', data: 'id:dni' },
          { texto: '❌ Cancelar', data: 'acc:cancelar' },
        ]],
      );
    }
  }

  private async procesarPorId(chatId: string, userId: string, beneficiarioId: string): Promise<void> {
    const sesion = this.botState.obtener('telegram', userId);
    if (!sesion) return;

    const beneficiario = await this.prisma.beneficiario.findUnique({
      where: { id: beneficiarioId },
    });

    if (!beneficiario) {
      await this.enviarConBotones(
        chatId,
        `❌ El QR no corresponde a ningún beneficiario registrado.\n\nCódigo leído: <code>${beneficiarioId}</code>\n\nO escribe tu DNI manualmente:`,
        [[
          { texto: '✍️ Escribir DNI', data: 'id:dni' },
          { texto: '❌ Cancelar', data: 'acc:cancelar' },
        ]],
      );
      return;
    }

    this.botState.asociarBeneficiario(
      'telegram',
      userId,
      beneficiario.id,
      beneficiario.nombre,
      beneficiario.clubMadres,
    );

    const textos = obtenerTextos(sesion.idioma);
    await this.enviarConBotones(
      chatId,
      textos.identificacionRecibida(beneficiario.nombre, beneficiario.clubMadres),
      [[
        { texto: '📸 Enviar foto ahora', data: 'acc:nueva' },
        { texto: '❌ Cancelar', data: 'acc:cancelar' },
      ]],
    );
  }

  private async procesarDni(chatId: string, userId: string, texto: string): Promise<void> {
    const sesion = this.botState.obtener('telegram', userId);
    if (!sesion) return;

    const dni = texto.replace(/\D/g, '');
    if (dni.length < 6) {
      await this.enviarMensajeTexto(
        chatId,
        '⚠️ El DNI parece incorrecto. Escribe solo los <b>números</b> (ej: <code>12345678</code>).',
      );
      return;
    }

    const beneficiario = await this.prisma.beneficiario.findFirst({
      where: { dni },
    });

    if (!beneficiario) {
      await this.enviarConBotones(
        chatId,
        `❌ No encontré ningún beneficiario con el DNI <code>${dni}</code>.\n\nVerifica el número e intenta de nuevo, o cancela:`,
        [[{ texto: '❌ Cancelar', data: 'acc:cancelar' }]],
      );
      return;
    }

    this.botState.asociarBeneficiario(
      'telegram',
      userId,
      beneficiario.id,
      beneficiario.nombre,
      beneficiario.clubMadres,
    );

    const textos = obtenerTextos(sesion.idioma);
    await this.enviarConBotones(
      chatId,
      textos.identificacionRecibida(beneficiario.nombre, beneficiario.clubMadres),
      [[
        { texto: '📸 Enviar foto ahora', data: 'acc:nueva' },
        { texto: '❌ Cancelar', data: 'acc:cancelar' },
      ]],
    );
  }

  private async mostrarConfirmacionCancelar(chatId: string, userId: string): Promise<void> {
    const sesion = this.botState.obtener('telegram', userId);
    const textos = obtenerTextos(sesion?.idioma);
    this.botState.actualizar('telegram', userId, { estado: 'CANCELAR_CONFIRMACION' });
    await this.enviarConBotones(
      chatId,
      textos.cancelar,
      [[
        { texto: '✅ ' + textos.siCancelar, data: 'cancel:si' },
        { texto: '↩️ ' + textos.noCancelar, data: 'cancel:no' },
      ]],
    );
  }

  private async procesarFoto(chatId: string, userId: string, photos: any[]): Promise<void> {
    const sesion = this.botState.obtener('telegram', userId);

    if (!sesion?.beneficiarioId) {
      await this.enviarConBotones(
        chatId,
        obtenerTextos(sesion?.idioma).sinSesionActiva(userId),
        [[{ texto: '🆕 Comenzar de nuevo', data: 'acc:reiniciar' }]],
      );
      return;
    }

    this.botState.actualizar('telegram', userId, { estado: 'PROCESANDO' });
    await this.enviarMensajeTexto(chatId, obtenerTextos(sesion.idioma).fotoRecibidaValidando);

    try {
      // Obtener la foto con mayor resolución (última del array)
      const photo = photos[photos.length - 1];
      const fileId = photo.file_id;

      const fileRes: any = await this.llamarApi('getFile', { file_id: fileId });
      const filePath = fileRes.result?.file_path;
      if (!filePath) throw new Error('No se pudo obtener file_path de Telegram');

      const downloadUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
      const imgRes = await fetch(downloadUrl);
      if (!imgRes.ok) throw new Error(`Error descargando imagen: ${imgRes.statusText}`);
      const buffer = Buffer.from(await imgRes.arrayBuffer());

      const entrega: any = await this.entregasService.procesarEntrega({
        beneficiarioId: sesion.beneficiarioId,
        bufferImagen: buffer,
        mediaType: 'image/jpeg',
        origen: 'telegram_real',
        nombreArchivo: `telegram_${fileId}.jpg`,
      });

      const textos = obtenerTextos(sesion.idioma);
      const reporte = await this.generarReporteControles(entrega.id);
      const nombre = entrega.beneficiario?.nombre || sesion.nombreBeneficiario || 'Beneficiario';

      if (entrega.estado === 'VALIDADA') {
        await this.enviarConBotones(
          chatId,
          textos.entregaValidada(nombre, reporte, entrega.hashBlockchain, entrega.txHash),
          [[
            { texto: '📊 Ver reporte', data: 'acc:reporte' },
            { texto: '🔄 Nueva entrega', data: 'acc:nueva' },
          ]],
        );
      } else {
        await this.enviarConBotones(
          chatId,
          textos.entregaRechazada(nombre, reporte),
          [[
            { texto: '🔄 Reintentar foto', data: 'acc:nueva' },
            { texto: '❌ Cancelar', data: 'acc:cancelar' },
          ]],
        );
      }

      this.botState.actualizar('telegram', userId, { estado: 'FINALIZADO' });
    } catch (error) {
      this.logger.error(`Error procesando foto Telegram: ${error.message}`);
      this.botState.actualizar('telegram', userId, { estado: 'ESPERANDO_FOTO' });
      await this.enviarConBotones(
        chatId,
        obtenerTextos(sesion.idioma).errorProcesamiento,
        [[
          { texto: '🔄 Reintentar', data: 'acc:nueva' },
          { texto: '❌ Cancelar', data: 'acc:cancelar' },
        ]],
      );
    }
  }

  // ============================================================
  //  Reporte de los 13 controles de arnés
  // ============================================================

  private async generarReporteControles(entregaId: string): Promise<string> {
    try {
      const entrega = await this.prisma.entrega.findUnique({
        where: { id: entregaId },
        include: {
          controlRuns: {
            include: { control: true },
            orderBy: { control: { orden: 'asc' } },
          },
        },
      });
      if (!entrega?.controlRuns?.length) return '';

      const niveles: Record<string, string> = {
        NIVEL_1_ENTRADA: 'Nivel 1: Entrada y Registro 📝',
        NIVEL_2_FOTO: 'Nivel 2: Evidencia Fotográfica 📸',
        NIVEL_3_DATOS: 'Nivel 3: Consistencia de Datos 📋',
        NIVEL_4_BLOCKCHAIN: 'Nivel 4: Integridad Blockchain ⛓️',
        NIVEL_5_SUPERVISION: 'Nivel 5: Supervisión y Auditoría 🚨',
      };

      const agrupado = new Map<string, any[]>();
      for (const run of entrega.controlRuns) {
        if (!agrupado.has(run.control.nivel)) agrupado.set(run.control.nivel, []);
        agrupado.get(run.control.nivel)!.push(run);
      }

      let txt = '📊 <b>REPORTE (13 Controles de Arnés):</b>\n';
      for (const [nivelKey, titulo] of Object.entries(niveles)) {
        const runs = agrupado.get(nivelKey) || [];
        if (runs.length === 0) continue;
        txt += `\n<b>${titulo}</b>\n`;
        for (const run of runs) {
          const emoji = run.resultado ? '✅' : '❌';
          txt += `${emoji} <b>[${run.control.identificador}]</b> ${run.control.descripcion}: ${run.resultado ? 'PASÓ' : 'FALLÓ'} (${run.tiempoMs}ms)\n`;
        }
      }
      return txt;
    } catch (err) {
      this.logger.error(`Error generando reporte: ${err.message}`);
      return '';
    }
  }

  // ============================================================
  //  Compatibilidad con POST /telegram/iniciar-sesion (frontend)
  // ============================================================

  /**
   * El supervisor escanea el QR desde el panel web → el frontend llama a
   * POST /telegram/iniciar-sesion → este método asocia el beneficiario y
   * envía el mensaje de bienvenida con botones.
   */
  async registrarSesionYSaludar(chatId: string, beneficiarioId: string) {
    const beneficiario = await this.prisma.beneficiario.findUnique({
      where: { id: beneficiarioId },
    });
    if (!beneficiario) {
      await this.enviarMensajeTexto(chatId, '❌ Beneficiario no encontrado.');
      return;
    }

    this.botState.asociarBeneficiario(
      'telegram',
      chatId,
      beneficiario.id,
      beneficiario.nombre,
      beneficiario.clubMadres,
    );

    const textos = obtenerTextos('es');
    await this.enviarConBotones(
      chatId,
      textos.identificacionRecibida(beneficiario.nombre, beneficiario.clubMadres),
      [[
        { texto: '📸 Enviar foto ahora', data: 'acc:nueva' },
        { texto: '❌ Cancelar', data: 'acc:cancelar' },
      ]],
    );
  }

  estaDisponible(): boolean {
    return !!this.botToken;
  }
}
