import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntregasService } from '../entregas/entregas.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string;
  private readonly sesionesActivas = new Map<string, string>(); // chatId -> beneficiarioId

  constructor(
    private readonly config: ConfigService,
    private readonly entregasService: EntregasService,
    private readonly prisma: PrismaService,
  ) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') || '';
    if (!this.botToken) {
      this.logger.warn(
        'Token de Telegram Bot (TELEGRAM_BOT_TOKEN) no configurado. El bot de Telegram no responderá hasta que se configure en el .env.',
      );
    } else {
      this.logger.log('Telegram Bot configurado y listo.');
    }
  }

  onModuleInit() {
    if (this.estaDisponible()) {
      this.logger.log('Iniciando long polling para Telegram Bot...');
      this.iniciarLongPolling();
    }
  }

  private async iniciarLongPolling() {
    let offset = 0;
    (async () => {
      while (true) {
        try {
          if (!this.estaDisponible()) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }
          const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${offset}&timeout=30`;
          const response = await fetch(url);
          if (!response.ok) {
            this.logger.error(`Error en getUpdates de Telegram: ${response.statusText}`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }

          const data = await response.json();
          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              offset = update.update_id + 1;
              if (update.message) {
                // Procesar mensaje en segundo plano
                this.procesarWebhookTelegram({ message: update.message }).catch((err) => {
                  this.logger.error(`Error procesando update de Telegram: ${err.message}`);
                });
              }
            }
          }
        } catch (error) {
          this.logger.error(`Excepción en bucle de getUpdates de Telegram: ${error.message}`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    })();
  }

  estaDisponible(): boolean {
    return !!this.botToken;
  }

  /**
   * Retorna el saludo correspondiente según la hora actual del servidor.
   */
  private getSaludoPorHora(): string {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      return 'Buenos días ☀️';
    } else if (hora >= 12 && hora < 19) {
      return 'Buenas tardes 🌤️';
    } else {
      return 'Buenas noches 🌙';
    }
  }

  /**
   * Registra qué beneficiarioId está "en proceso de entrega" para un
   * chat de Telegram dado y envía proactivamente un mensaje de bienvenida.
   */
  async registrarSesionYSaludar(chatId: string, beneficiarioId: string) {
    const chatStr = chatId.toString().trim();
    this.sesionesActivas.set(chatStr, beneficiarioId);
    this.logger.log(
      `Sesión registrada para Telegram Chat: ${chatStr} -> beneficiarioId: ${beneficiarioId}`,
    );

    let nombreBeneficiario = 'Beneficiario';
    let clubMadres = '';

    try {
      const beneficiario = await this.prisma.beneficiario.findUnique({
        where: { id: beneficiarioId },
      });
      if (beneficiario) {
        nombreBeneficiario = beneficiario.nombre;
        clubMadres = beneficiario.clubMadres;
      }
    } catch (err) {
      this.logger.error(`Error buscando beneficiario en registrarSesion Telegram: ${err.message}`);
    }

    const saludo = this.getSaludoPorHora();
    const msgBienvenida = `🤝 <b>¡Hola, ${nombreBeneficiario}!</b> ${saludo}\n\n` +
      `Te saluda <b>VasoChain AI</b> 🤖, el asistente virtual del programa social.\n\n` +
      `Hemos iniciado tu proceso de entrega en el club de madres <b>${clubMadres || 'Club Municipal'}</b>.\n\n` +
      `📸 <b>¿Qué debes hacer ahora?</b>\n` +
      `Por favor, envíame una <b>foto clara y nítida de los productos</b> (leche, avena, raciones, etc.) que estás recibiendo para validar tu entrega.\n\n` +
      `<b>Validaciones activas en tiempo real:</b>\n` +
      `🔍 [HC-001] Verificación de código QR\n` +
      `🛰️ [HC-002] Geolocalización del punto\n` +
      `🕒 [HC-003] Consistencia de rango horario\n` +
      `🧠 [HC-004] Clasificación por Inteligencia Artificial\n` +
      `🔗 [HC-010] Registro y sellado inmutable en Blockchain`;

    await this.enviarMensajeTexto(chatStr, msgBienvenida);
  }

  /**
   * Envía un mensaje de texto saliente usando Telegram Bot API.
   */
  async enviarMensajeTexto(chatId: string, texto: string): Promise<boolean> {
    if (!this.estaDisponible()) {
      this.logger.warn('Telegram Bot no está configurado (token ausente).');
      return false;
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: texto,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `Error enviando mensaje Telegram a ${chatId}: ${response.status} - ${errText}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Excepción al enviar mensaje Telegram a ${chatId}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Genera el reporte formateado en HTML para los 13 controles del arnés.
   */
  private async generarReporteControles(entregaId: string): Promise<string> {
    try {
      const entrega = await this.prisma.entrega.findUnique({
        where: { id: entregaId },
        include: {
          controlRuns: {
            include: {
              control: true,
            },
            orderBy: {
              control: {
                orden: 'asc',
              },
            },
          },
        },
      });

      if (!entrega || !entrega.controlRuns || entrega.controlRuns.length === 0) {
        return '';
      }

      let reportText = `📊 <b>REPORTE DE VALIDADORES (13 Controles de Arnés):</b>\n`;
      reportText += `--------------------------------------------------\n`;

      const niveles = {
        NIVEL_1_ENTRADA: 'Nivel 1: Entrada y Registro 📝',
        NIVEL_2_FOTO: 'Nivel 2: Evidencia Fotográfica 📸',
        NIVEL_3_DATOS: 'Nivel 3: Consistencia de Datos 📋',
        NIVEL_4_BLOCKCHAIN: 'Nivel 4: Integridad Blockchain ⛓️',
        NIVEL_5_SUPERVISION: 'Nivel 5: Supervisión y Auditoría 🚨',
      };

      const controlRunsPorNivel = new Map<string, any[]>();
      for (const run of entrega.controlRuns) {
        const nivel = run.control.nivel;
        if (!controlRunsPorNivel.has(nivel)) {
          controlRunsPorNivel.set(nivel, []);
        }
        controlRunsPorNivel.get(nivel).push(run);
      }

      for (const [nivelKey, nivelTitle] of Object.entries(niveles)) {
        const runs = controlRunsPorNivel.get(nivelKey) || [];
        if (runs.length > 0) {
          reportText += `\n<b>${nivelTitle}</b>\n`;
          for (const run of runs) {
            const checkEmoji = run.resultado ? '✅' : '❌';
            const statusText = run.resultado ? 'PASÓ' : 'FALLÓ';
            reportText += `• ${checkEmoji} <b>[${run.control.identificador}] ${run.control.descripcion}:</b> ${statusText} (${run.tiempoMs}ms)\n`;
          }
        }
      }

      reportText += `--------------------------------------------------`;
      return reportText;
    } catch (err) {
      this.logger.error(`Error generando reporte de controles Telegram: ${err.message}`);
      return '';
    }
  }

  /**
   * Procesa un webhook entrante desde Telegram.
   */
  async procesarWebhookTelegram(body: any) {
    if (!body || !body.message) {
      return;
    }

    const message = body.message;
    const chatId = message.chat?.id?.toString();
    if (!chatId) return;

    // Detectar si contiene fotos
    const photos = message.photo;
    const isImage = photos && Array.isArray(photos) && photos.length > 0;

    if (isImage) {
      const beneficiarioId = this.sesionesActivas.get(chatId);
      this.logger.log(
        `Telegram Webhook: Foto recibida de ${chatId}. Beneficiario asociado: ${beneficiarioId || 'NINGUNO'}`,
      );

      if (!beneficiarioId) {
        const saludo = this.getSaludoPorHora();
        await this.enviarMensajeTexto(
          chatId,
          `⚠️ <b>VasoChain AI — Registro no iniciado</b>\n\n` +
          `¡${saludo}! No identificamos una entrega activa en curso para este usuario de Telegram.\n\n` +
          `<b>¿Qué debes hacer?</b>\n` +
          `1️⃣ En el panel del supervisor, escanea el código QR del beneficiario.\n` +
          `2️⃣ Asocia tu Chat ID de Telegram (<code>${chatId}</code>).\n` +
          `3️⃣ Envía la foto de los productos.\n\n` +
          `¡Gracias por tu colaboración! 🤝`,
        );
        return;
      }

      try {
        // Obtener la foto con mayor resolución (la última del array)
        const photo = photos[photos.length - 1];
        const fileId = photo.file_id;

        // 1. Obtener file path de Telegram API
        this.logger.log(`Obteniendo ruta de archivo para fileId: ${fileId}`);
        const getFileUrl = `https://api.telegram.org/bot${this.botToken}/getFile?file_id=${fileId}`;
        const fileResponse = await fetch(getFileUrl);
        if (!fileResponse.ok) {
          throw new Error(`Error obteniendo metadatos del archivo en Telegram: ${fileResponse.statusText}`);
        }
        const fileData = await fileResponse.json();
        const filePath = fileData.result?.file_path;
        if (!filePath) {
          throw new Error('No se pudo resolver el filePath del archivo en Telegram.');
        }

        // 2. Descargar la imagen
        const downloadUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
        this.logger.log(`Descargando imagen de Telegram desde: ${downloadUrl}`);
        const imageResponse = await fetch(downloadUrl);
        if (!imageResponse.ok) {
          throw new Error(`Error descargando la imagen de Telegram: ${imageResponse.statusText}`);
        }
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Procesa la entrega (IA + Blockchain + DB)
        this.logger.log(`Procesando entrega con EntregasService para Telegram`);
        const entrega: any = await this.entregasService.procesarEntrega({
          beneficiarioId,
          bufferImagen: buffer,
          mediaType: 'image/jpeg',
          origen: 'telegram_real',
          nombreArchivo: `telegram_${fileId}.jpg`,
        });

        // Limpiar sesión activa
        this.sesionesActivas.delete(chatId);

        // Generar reporte
        const saludo = this.getSaludoPorHora();
        const nombreBenef = entrega.beneficiario?.nombre || 'Beneficiario';
        const reporte = await this.generarReporteControles(entrega.id);

        let mensaje = '';
        if (entrega.estado === 'VALIDADA') {
          mensaje = `✅ <b>Entrega Validada Exitosamente</b>\n\n` +
            `¡Excelente, <b>${nombreBenef}</b>! ${saludo}. La evidencia de alimentos ha sido procesada y aprobada correctamente por nuestro pipeline de control digital.\n\n` +
            `${reporte}\n\n` +
            `🔗 <b>REGISTRO INMUTABLE EN CADENA:</b>\n` +
            `• <b>Estado:</b> VALIDADA 🟢\n` +
            `• <b>Hash Evidencia:</b> <code>${entrega.hashBlockchain || 'N/D'}</code>\n` +
            `• <b>Transacción Blockchain (Tx):</b> <code>${entrega.txHash || 'N/D'}</code>\n\n` +
            `¡Gracias por registrar tu entrega en <b>VasoChain AI</b>! 🥛✨`;
        } else {
          mensaje = `❌ <b>Observación en la Entrega</b>\n\n` +
            `Hola <b>${nombreBenef}</b>, ${saludo.toLowerCase()}. La evidencia fotográfica enviada no logró pasar todas las verificaciones automáticas de seguridad.\n\n` +
            `${reporte}\n\n` +
            `⚠️ <b>Estado:</b> BAJO REVISIÓN MUNICIPAL\n` +
            `• <b>Siguiente paso:</b> Tu caso ha sido derivado a un supervisor de la municipalidad para una auditoría manual. No te preocupes, esto no anula automáticamente tu beneficio si se valida de forma manual.\n\n` +
            `¡Gracias por tu paciencia!`;
        }

        await this.enviarMensajeTexto(chatId, mensaje);
      } catch (error) {
        this.logger.error(`Error procesando evidencia de Telegram para ${chatId}: ${error.message}`);
        await this.enviarMensajeTexto(
          chatId,
          `⚠️ <b>Error de Procesamiento</b>\n\nOcurrió un error al procesar tu evidencia de Telegram en nuestros servidores.\n\nPor favor, intenta enviar la foto nuevamente.`,
        );
      }
    } else {
      // Mensaje de texto o no-foto
      const beneficiarioId = this.sesionesActivas.get(chatId);
      const saludo = this.getSaludoPorHora();

      if (beneficiarioId) {
        let nombreBeneficiario = 'Beneficiario';
        try {
          const beneficiario = await this.prisma.beneficiario.findUnique({
            where: { id: beneficiarioId },
          });
          if (beneficiario) {
            nombreBeneficiario = beneficiario.nombre;
          }
        } catch (err) {
          this.logger.error(`Error buscando beneficiario en webhook de Telegram: ${err.message}`);
        }
        await this.enviarMensajeTexto(
          chatId,
          `🤖 <b>VasoChain AI — Asistente Digital</b>\n\n` +
          `¡Hola, <b>${nombreBeneficiario}</b>! ${saludo}.\n\n` +
          `Estamos esperando la evidencia fotográfica de tu entrega. 📸\n\n` +
          `<b>Por favor, envíanos una foto clara de los alimentos recibidos</b> para completar la verificación automática de los 13 controles de arnés y sellado en blockchain.`,
        );
      } else {
        await this.enviarMensajeTexto(
          chatId,
          `🤖 <b>VasoChain AI — Asistente Digital</b>\n\n` +
          `¡${saludo}! Soy el asistente virtual del programa social.\n\n` +
          `⚠️ <b>Proceso no iniciado</b>\n` +
          `No identificamos una entrega activa para tu chat en este momento.\n\n` +
          `<b>¿Cómo registrar una entrega?</b>\n` +
          `1️⃣ Acércate con tu supervisor y pídele escanear tu código QR.\n` +
          `2️⃣ Indícale tu Telegram Chat ID (<code>${chatId}</code>) para asociar tu sesión.\n` +
          `3️⃣ Recibirás un mensaje de confirmación y bienvenida aquí.\n` +
          `4️⃣ Envíanos la foto de tus alimentos como evidencia para validarlos con IA.\n\n` +
          `¡Gracias por tu colaboración! 🥛✨`,
        );
      }
    }
  }
}
