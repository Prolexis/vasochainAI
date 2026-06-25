import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntregasService } from '../entregas/entregas.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Servicio de integración real con Whapi.Cloud.
 * Reutiliza EntregasService.procesarEntrega(), el mismo pipeline que usa
 * el endpoint de simulación para no duplicar lógica de negocio.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly whapiToken: string;
  private readonly apiUrl: string;

  // Estado simple en memoria: último beneficiarioId "activo" por número
  // de WhatsApp remitente, para asociar la foto que llega después del QR.
  private readonly sesionesActivas = new Map<string, string>();

  constructor(
    private readonly config: ConfigService,
    private readonly entregasService: EntregasService,
    private readonly prisma: PrismaService,
  ) {
    this.whapiToken = this.config.get<string>('WHAPI_TOKEN') || '';
    this.apiUrl =
      this.config.get<string>('WHAPI_API_URL') || 'https://gate.whapi.cloud';

    if (!this.whapiToken) {
      this.logger.warn(
        'Token de Whapi.Cloud (WHAPI_TOKEN) no configurado. El webhook de WhatsApp real responderá con error hasta que se configure en el .env.',
      );
    } else {
      this.logger.log(`Whapi.Cloud configurado con API URL: ${this.apiUrl}`);
    }
  }

  estaDisponible(): boolean {
    return !!this.whapiToken;
  }

  /**
   * Limpia y normaliza el formato del número de WhatsApp quitando
   * el prefijo "whatsapp:", el signo "+" y cualquier carácter no numérico.
   */
  private normalizarNumero(num: string): string {
    if (!num) return '';
    return num
      .replace(/^whatsapp:/i, '')
      .replace(/\+/g, '')
      .replace(/[^0-9]/g, '');
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
   * número de WhatsApp dado y envía proactivamente un mensaje de bienvenida.
   */
  async registrarSesionYSaludar(numeroWhatsapp: string, beneficiarioId: string) {
    const numeroNormalizado = this.normalizarNumero(numeroWhatsapp);
    this.sesionesActivas.set(numeroNormalizado, beneficiarioId);
    this.logger.log(
      `Sesión registrada para número: ${numeroNormalizado} -> beneficiarioId: ${beneficiarioId}`,
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
      this.logger.error(`Error buscando beneficiario en registrarSesionYSaludar: ${err.message}`);
    }

    const saludo = this.getSaludoPorHora();
    const msgBienvenida = `🤝 *¡Hola, ${nombreBeneficiario}!* ${saludo}\n\n` +
      `Te saluda *VasoChain AI* 🤖, el asistente virtual del programa social.\n\n` +
      `Hemos iniciado tu proceso de entrega en el club de madres *${clubMadres || 'Club Municipal'}*.\n\n` +
      `📸 *¿Qué debes hacer ahora?*\n` +
      `Por favor, envíame una *foto clara y nítida de los productos* (leche, avena, raciones, etc.) que estás recibiendo para validar tu entrega.\n\n` +
      `*Validaciones activas en tiempo real:*\n` +
      `🔍 [HC-001] Verificación de código QR\n` +
      `🛰️ [HC-002] Geolocalización del punto\n` +
      `🕒 [HC-003] Consistencia de rango horario\n` +
      `🧠 [HC-004] Clasificación por Inteligencia Artificial\n` +
      `🔗 [HC-010] Registro y sellado inmutable en Blockchain`;

    await this.enviarMensajeTexto(numeroNormalizado, msgBienvenida);
  }

  /**
   * Envía un mensaje de texto saliente a un número de WhatsApp a través del API de Whapi.Cloud.
   */
  async enviarMensajeTexto(to: string, texto: string): Promise<boolean> {
    if (!this.estaDisponible()) {
      this.logger.warn(
        'Whapi.Cloud no está configurado (WHAPI_TOKEN ausente). No se puede enviar el mensaje.',
      );
      return false;
    }

    const toNormalizado = this.normalizarNumero(to);
    const url = `${this.apiUrl}/messages/text`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.whapiToken}`,
        },
        body: JSON.stringify({
          to: toNormalizado,
          body: texto,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `Error enviando mensaje Whapi a ${toNormalizado}: ${response.status} - ${errText}`,
        );
        return false;
      }

      this.logger.log(`Mensaje Whapi enviado exitosamente a ${toNormalizado}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Excepción al enviar mensaje Whapi a ${toNormalizado}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Genera el reporte formateado en markdown de WhatsApp para los 13 controles del arnés.
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

      let reportText = `📊 *REPORTE DE VALIDADORES (13 Controles de Arnés):*\n`;
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
          reportText += `\n*${nivelTitle}*\n`;
          for (const run of runs) {
            const checkEmoji = run.resultado ? '✅' : '❌';
            const statusText = run.resultado ? 'PASÓ' : 'FALLÓ';
            reportText += `• ${checkEmoji} *[${run.control.identificador}] ${run.control.descripcion}:* ${statusText} (${run.tiempoMs}ms)\n`;
          }
        }
      }

      reportText += `--------------------------------------------------`;
      return reportText;
    } catch (err) {
      this.logger.error(`Error generando reporte de controles: ${err.message}`);
      return '';
    }
  }

  /**
   * Procesa un webhook entrante desde Whapi.Cloud.
   * Filtra mensajes repetidos o salientes, identifica al beneficiario en sesión,
   * procesa y valida la imagen de evidencia mediante IA/blockchain y confirma
   * de vuelta al beneficiario por Whapi.Cloud.
   */
  async procesarWebhookWhapi(body: any) {
    if (!body || !Array.isArray(body.messages)) {
      return;
    }

    for (const msg of body.messages) {
      // Evitar bucles y no procesar mensajes propios
      if (msg.from_me) {
        continue;
      }

      const senderRaw = msg.chat_id || msg.from;
      if (!senderRaw) {
        continue;
      }

      const senderNormalizado = this.normalizarNumero(senderRaw);
      this.logger.log(`Webhook: Mensaje recibido de ${senderNormalizado}. Tipo de mensaje: ${msg.type}`);

      // Detectar si el mensaje contiene una imagen (como imagen directa o como documento adjunto)
      let mediaInfo: { link: string; id: string; mime_type: string; file_name: string } | null = null;

      if (msg.type === 'image' && msg.image) {
        mediaInfo = {
          link: msg.image.link,
          id: msg.image.id,
          mime_type: msg.image.mime_type || 'image/jpeg',
          file_name: msg.image.file_name || 'whatsapp-evidencia.jpg',
        };
      } else if (msg.type === 'document' && msg.document) {
        const mimeType = msg.document.mime_type || '';
        const fileName = msg.document.file_name || '';
        const esImagen = mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic)$/i.test(fileName);
        
        if (esImagen) {
          this.logger.log(`Se detectó un archivo de imagen enviado como documento: ${fileName} (${mimeType})`);
          mediaInfo = {
            link: msg.document.link,
            id: msg.document.id,
            mime_type: mimeType || 'image/jpeg',
            file_name: fileName || 'whatsapp-evidencia.jpg',
          };
        }
      }

      if (mediaInfo) {
        const beneficiarioId = this.sesionesActivas.get(senderNormalizado);
        this.logger.log(`Buscando sesión para remitente ${senderNormalizado}. Encontrado beneficiarioId: ${beneficiarioId || 'NINGUNO'}`);

        if (!beneficiarioId) {
          const saludo = this.getSaludoPorHora();
          await this.enviarMensajeTexto(
            senderNormalizado,
            `⚠️ *VasoChain AI — Registro no iniciado*\n\n` +
            `¡${saludo}! No identificamos una entrega activa en curso para este número de WhatsApp.\n\n` +
            `*¿Qué debes hacer?*\n` +
            `1️⃣ En el panel del supervisor, escanea el código QR del beneficiario.\n` +
            `2️⃣ Asocia tu número de teléfono.\n` +
            `3️⃣ Envía la foto de los productos.\n\n` +
            `¡Gracias por tu colaboración! 🤝`,
          );
          continue;
        }

        try {
          // Descargar la imagen
          this.logger.log(`Descargando media desde URL: ${mediaInfo.link} (ID: ${mediaInfo.id})`);
          const { buffer, mediaType } = await this.descargarMedia(
            mediaInfo.link,
            mediaInfo.id,
          );

          // Procesar la entrega (IA + Blockchain + DB)
          this.logger.log(`Procesando entrega con EntregasService para beneficiario: ${beneficiarioId}`);
          const entrega: any = await this.entregasService.procesarEntrega({
            beneficiarioId,
            bufferImagen: buffer,
            mediaType: mediaInfo.mime_type || mediaType,
            origen: 'whatsapp_real',
            nombreArchivo: mediaInfo.file_name,
          });

          // Limpiar la sesión activa
          this.sesionesActivas.delete(senderNormalizado);
          this.logger.log(`Sesión de WhatsApp limpia para ${senderNormalizado}`);

          // Generar el reporte de los 13 controles ejecutados
          const saludo = this.getSaludoPorHora();
          const nombreBenef = entrega.beneficiario?.nombre || 'Beneficiario';
          const reporte = await this.generarReporteControles(entrega.id);

          let mensaje = '';
          if (entrega.estado === 'VALIDADA') {
            mensaje = `✅ *Entrega Validada Exitosamente*\n\n` +
              `¡Excelente, *${nombreBenef}*! ${saludo}. La evidencia de alimentos ha sido procesada y aprobada correctamente por nuestro pipeline de control digital.\n\n` +
              `${reporte}\n\n` +
              `🔗 *REGISTRO INMUTABLE EN CADENA:*\n` +
              `• *Estado:* VALIDADA 🟢\n` +
              `• *Hash Evidencia:* ${entrega.hashBlockchain || 'N/D'}\n` +
              `• *Transacción Blockchain (Tx):* ${entrega.txHash || 'N/D'}\n\n` +
              `¡Gracias por registrar tu entrega en *VasoChain AI*! 🥛✨`;
          } else {
            mensaje = `❌ *Observación en la Entrega*\n\n` +
              `Hola *${nombreBenef}*, ${saludo.toLowerCase()}. La evidencia fotográfica enviada no logró pasar todas las verificaciones automáticas de seguridad.\n\n` +
              `${reporte}\n\n` +
              `⚠️ *Estado:* BAJO REVISIÓN MUNICIPAL\n` +
              `• *Siguiente paso:* Tu caso ha sido derivado a un supervisor de la municipalidad para una auditoría manual. No te preocupes, esto no anula automáticamente tu beneficio si se valida de forma manual.\n\n` +
              `¡Gracias por tu paciencia!`;
          }

          await this.enviarMensajeTexto(senderNormalizado, mensaje);
        } catch (error) {
          this.logger.error(
            `Error procesando entrega de Whapi para ${senderNormalizado}: ${error.message}`,
          );
          await this.enviarMensajeTexto(
            senderNormalizado,
            `⚠️ *Error de Procesamiento*\n\nOcurrió un error al procesar tu evidencia en nuestros servidores.\n\nPor favor, intenta enviar la foto nuevamente. Si el problema persiste, contacta con tu supervisor de entrega.`,
          );
        }
      } else {
        // Si no es una imagen, verificar si el usuario tiene una sesión activa para guiarle
        const beneficiarioId = this.sesionesActivas.get(senderNormalizado);
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
            this.logger.error(`Error buscando beneficiario en webhook de no-imagen: ${err.message}`);
          }
          await this.enviarMensajeTexto(
            senderNormalizado,
            `🤖 *VasoChain AI — Asistente Digital*\n\n` +
            `¡Hola, *${nombreBeneficiario}*! ${saludo}.\n\n` +
            `Estamos esperando la evidencia fotográfica de tu entrega. 📸\n\n` +
            `*Por favor, envíanos una foto clara de los alimentos recibidos* para completar la verificación automática de los 13 controles de arnés y sellado en blockchain.`,
          );
        } else {
          await this.enviarMensajeTexto(
            senderNormalizado,
            `🤖 *VasoChain AI — Asistente Digital*\n\n` +
            `¡${saludo}! Soy el asistente virtual del programa social.\n\n` +
            `⚠️ *Proceso no iniciado*\n` +
            `No identificamos una entrega activa para tu número de teléfono en este momento.\n\n` +
            `*¿Cómo registrar una entrega?*\n` +
            `1️⃣ Acércate con tu supervisor y pídele escanear tu código QR.\n` +
            `2️⃣ Indícale tu número de teléfono para asociar tu sesión.\n` +
            `3️⃣ Recibirás un mensaje de confirmación y bienvenida aquí.\n` +
            `4️⃣ Envíanos la foto de tus alimentos como evidencia para validarlos con IA.\n\n` +
            `¡Gracias por tu colaboración! 🥛✨`,
          );
        }
      }
    }
  }

  /**
   * Descarga el media desde Whapi utilizando la URL directa o el id de media.
   */
  private async descargarMedia(
    mediaUrl?: string,
    mediaId?: string,
  ): Promise<{ buffer: Buffer; mediaType: string }> {
    let url = mediaUrl;

    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      const cleanApiUrl = this.apiUrl.replace(/\/$/, '');
      const cleanMediaUrl = url.replace(/^\//, '');
      url = `${cleanApiUrl}/${cleanMediaUrl}`;
    } else if (!url && mediaId) {
      const cleanApiUrl = this.apiUrl.replace(/\/$/, '');
      url = `${cleanApiUrl}/media/${mediaId}`;
    }

    if (!url) {
      throw new Error('No se proporcionó URL ni ID de media para descargar.');
    }

    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    const isWhapiHost = url.startsWith(this.apiUrl);
    if (this.whapiToken && isWhapiHost) {
      headers['Authorization'] = `Bearer ${this.whapiToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(
        `Fallo al descargar media de Whapi. Status: ${response.status}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const mediaType = response.headers.get('content-type') || 'image/jpeg';
    return { buffer: Buffer.from(arrayBuffer), mediaType };
  }
}
