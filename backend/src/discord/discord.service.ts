import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits, Partials, ChannelType } from 'discord.js';
import { EntregasService } from '../entregas/entregas.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscordService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordService.name);
  private client: Client | null = null;
  private botToken: string;
  private readonly sesionesActivas = new Map<string, string>(); // userId -> beneficiarioId

  constructor(
    private readonly config: ConfigService,
    private readonly entregasService: EntregasService,
    private readonly prisma: PrismaService,
  ) {
    this.botToken = this.config.get<string>('DISCORD_BOT_TOKEN') || '';
  }

  onModuleInit() {
    if (!this.botToken) {
      this.logger.warn(
        'Token de Discord Bot (DISCORD_BOT_TOKEN) no configurado. El bot de Discord no se inicializará.',
      );
      return;
    }

    this.logger.log('Inicializando Discord Bot...');
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.MessageContent,
        ],
        partials: [Partials.Channel, Partials.Message],
      });

      this.client.on('ready', () => {
        this.logger.log(`Discord Bot en línea como: ${this.client?.user?.tag}`);
      });

      this.client.on('messageCreate', async (message) => {
        // Ignorar mensajes del propio bot
        if (message.author.bot) return;

        // Solo procesar mensajes directos (DM) para mantener privacidad e individualidad
        const esDm = message.channel.type === ChannelType.DM;
        if (!esDm) return;

        await this.procesarMensajeDiscord(message);
      });

      this.client.login(this.botToken).catch((err) => {
        this.logger.error(`Error de login en Discord: ${err.message}`);
      });
    } catch (error) {
      this.logger.error(`Error al instanciar el cliente Discord: ${error.message}`);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.destroy();
      this.logger.log('Cliente Discord destruido.');
    }
  }

  estaDisponible(): boolean {
    return this.client !== null && this.client.readyAt !== null;
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
   * usuario de Discord dado y envía proactivamente un mensaje de bienvenida (DM).
   */
  async registrarSesionYSaludar(userId: string, beneficiarioId: string) {
    const userStr = userId.toString().trim();
    this.sesionesActivas.set(userStr, beneficiarioId);
    this.logger.log(
      `Sesión registrada para Discord User: ${userStr} -> beneficiarioId: ${beneficiarioId}`,
    );

    if (!this.estaDisponible()) {
      this.logger.warn('El bot de Discord no está disponible para enviar el saludo proactivo.');
      return;
    }

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
      this.logger.error(`Error buscando beneficiario en registrarSesion Discord: ${err.message}`);
    }

    const saludo = this.getSaludoPorHora();
    const msgBienvenida = `🤝 **¡Hola, ${nombreBeneficiario}!** ${saludo}\n\n` +
      `Te saluda **VasoChain AI** 🤖, el asistente virtual del programa social.\n\n` +
      `Hemos iniciado tu proceso de entrega en el club de madres **${clubMadres || 'Club Municipal'}**.\n\n` +
      `📸 **¿Qué debes hacer ahora?**\n` +
      `Por favor, envíame una **foto clara y nítida de los productos** (leche, avena, raciones, etc.) que estás recibiendo para validar tu entrega.\n\n` +
      `**Validaciones activas en tiempo real:**\n` +
      `🔍 [HC-001] Verificación de código QR\n` +
      `🛰️ [HC-002] Geolocalización del punto\n` +
      `🕒 [HC-003] Consistencia de rango horario\n` +
      `🧠 [HC-004] Clasificación por Inteligencia Artificial\n` +
      `🔗 [HC-010] Registro y sellado inmutable en Blockchain`;

    await this.enviarMensajeDM(userStr, msgBienvenida);
  }

  /**
   * Envía un mensaje DM a un usuario de Discord.
   */
  async enviarMensajeDM(userId: string, texto: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const user = await this.client.users.fetch(userId);
      if (user) {
        await user.send(texto);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Error enviando mensaje DM de Discord a ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Genera el reporte formateado en Markdown de Discord para los 13 controles del arnés.
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

      let reportText = `📊 **REPORTE DE VALIDADORES (13 Controles de Arnés):**\n`;
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
          reportText += `\n**${nivelTitle}**\n`;
          for (const run of runs) {
            const checkEmoji = run.resultado ? '✅' : '❌';
            const statusText = run.resultado ? 'PASÓ' : 'FALLÓ';
            reportText += `• ${checkEmoji} **[${run.control.identificador}] ${run.control.descripcion}:** ${statusText} (${run.tiempoMs}ms)\n`;
          }
        }
      }

      reportText += `--------------------------------------------------`;
      return reportText;
    } catch (err) {
      this.logger.error(`Error generando reporte de controles Discord: ${err.message}`);
      return '';
    }
  }

  /**
   * Procesa un mensaje directo entrante en el cliente de Discord.
   */
  private async procesarMensajeDiscord(message: any) {
    const userId = message.author.id.toString();

    // Detectar si el mensaje contiene imágenes como adjuntos
    const attachments = Array.from(message.attachments.values()) as any[];
    const photos = attachments.filter((att) => att.contentType?.startsWith('image/'));
    const isImage = photos.length > 0;

    if (isImage) {
      const beneficiarioId = this.sesionesActivas.get(userId);
      this.logger.log(
        `Discord Message: Foto recibida de ${message.author.tag} (${userId}). Beneficiario asociado: ${beneficiarioId || 'NINGUNO'}`,
      );

      if (!beneficiarioId) {
        const saludo = this.getSaludoPorHora();
        await message.reply(
          `⚠️ **VasoChain AI — Registro no iniciado**\n\n` +
          `¡${saludo}! No identificamos una entrega activa en curso para este usuario de Discord.\n\n` +
          `**¿Qué debes hacer?**\n` +
          `1️⃣ En el panel del supervisor, escanea el código QR del beneficiario.\n` +
          `2️⃣ Asocia tu Discord User ID (\`${userId}\`).\n` +
          `3️⃣ Envía la foto de los productos aquí en privado.\n\n` +
          `¡Gracias por tu colaboración! 🤝`,
        );
        return;
      }

      try {
        const photo = photos[0];
        const imageUrl = photo.url;

        // 1. Descargar la imagen
        this.logger.log(`Descargando imagen de Discord desde: ${imageUrl}`);
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Error descargando la imagen de Discord: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Procesar la entrega (IA + Blockchain + DB)
        this.logger.log(`Procesando entrega con EntregasService para Discord`);
        const entrega: any = await this.entregasService.procesarEntrega({
          beneficiarioId,
          bufferImagen: buffer,
          mediaType: photo.contentType || 'image/jpeg',
          origen: 'discord_real',
          nombreArchivo: photo.name || 'discord_evidencia.jpg',
        });

        // Limpiar sesión activa
        this.sesionesActivas.delete(userId);

        // Generar reporte
        const saludo = this.getSaludoPorHora();
        const nombreBenef = entrega.beneficiario?.nombre || 'Beneficiario';
        const reporte = await this.generarReporteControles(entrega.id);

        let mensaje = '';
        if (entrega.estado === 'VALIDADA') {
          mensaje = `✅ **Entrega Validada Exitosamente**\n\n` +
            `¡Excelente, **${nombreBenef}**! ${saludo}. La evidencia de alimentos ha sido procesada y aprobada correctamente por nuestro pipeline de control digital.\n\n` +
            `${reporte}\n\n` +
            `🔗 **REGISTRO INMUTABLE EN CADENA:**\n` +
            `• **Estado:** VALIDADA 🟢\n` +
            `• **Hash Evidencia:** \`${entrega.hashBlockchain || 'N/D'}\`\n` +
            `• **Transacción Blockchain (Tx):** \`${entrega.txHash || 'N/D'}\`\n\n` +
            `¡Gracias por registrar tu entrega en **VasoChain AI**! 🥛✨`;
        } else {
          mensaje = `❌ **Observación en la Entrega**\n\n` +
            `Hola **${nombreBenef}**, ${saludo.toLowerCase()}. La evidencia fotográfica enviada no logró pasar todas las verificaciones automáticas de seguridad.\n\n` +
            `${reporte}\n\n` +
            `⚠️ **Estado:** BAJO REVISIÓN MUNICIPAL\n` +
            `• **Siguiente paso:** Tu caso ha sido derivado a un supervisor de la municipalidad para una auditoría manual. No te preocupes, esto no anula automáticamente tu beneficio si se valida de forma manual.\n\n` +
            `¡Gracias por tu paciencia!`;
        }

        await message.reply(mensaje);
      } catch (error) {
        this.logger.error(`Error procesando evidencia de Discord para ${userId}: ${error.message}`);
        await message.reply(
          `⚠️ **Error de Procesamiento**\n\nOcurrió un error al procesar tu evidencia de Discord en nuestros servidores.\n\nPor favor, intenta enviar la foto nuevamente.`,
        );
      }
    } else {
      // Mensaje de texto o no-foto
      const beneficiarioId = this.sesionesActivas.get(userId);
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
          this.logger.error(`Error buscando beneficiario en DM de Discord: ${err.message}`);
        }
        await message.reply(
          `🤖 **VasoChain AI — Asistente Digital**\n\n` +
          `¡Hola, **${nombreBeneficiario}**! ${saludo}.\n\n` +
          `Estamos esperando la evidencia fotográfica de tu entrega. 📸\n\n` +
          `**Por favor, envíanos una foto clara de los alimentos recibidos** para completar la verificación automática de los 13 controles de arnés y sellado en blockchain.`,
        );
      } else {
        await message.reply(
          `🤖 **VasoChain AI — Asistente Digital**\n\n` +
          `¡${saludo}! Soy el asistente virtual del programa social.\n\n` +
          `⚠️ **Proceso no iniciado**\n` +
          `No identificamos una entrega activa para tu usuario de Discord en este momento.\n\n` +
          `**¿Cómo registrar una entrega?**\n` +
          `1️⃣ Acércate con tu supervisor y pídele escanear tu código QR.\n` +
          `2️⃣ Indícale tu Discord User ID (\`${userId}\`) para asociar tu sesión.\n` +
          `3️⃣ Recibirás un mensaje de confirmación y bienvenida aquí.\n` +
          `4️⃣ Envíanos la foto de tus alimentos como evidencia para validarlos con IA.\n\n` +
          `¡Gracias por tu colaboración! 🥛✨`,
        );
      }
    }
  }
}
