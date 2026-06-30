import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
} from 'discord.js';
import { EntregasService } from '../entregas/entregas.service';
import { PrismaService } from '../prisma/prisma.service';
import { BotStateService } from '../bots/bot-state.service';
import { leerQR } from '../bots/qr-reader';
import { Idioma, IDIOMAS_DISPONIBLES, obtenerTextos } from '../bots/bot-i18n';

/**
 * Servicio de Discord con flujo conversacional guiado por botones.
 * Espejo de TelegramService usando discord.js.
 */
@Injectable()
export class DiscordService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordService.name);
  private client: Client | null = null;
  private botToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly entregasService: EntregasService,
    private readonly prisma: PrismaService,
    private readonly botState: BotStateService,
  ) {
    this.botToken = this.config.get<string>('DISCORD_BOT_TOKEN') || '';
  }

  onModuleInit() {
    if (!this.botToken) {
      this.logger.warn(
        'DISCORD_BOT_TOKEN no configurado. El bot de Discord no se inicializará.',
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

      // Mensajes de texto / fotos en DM
      this.client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        if (message.channel.type !== ChannelType.DM) return;
        await this.procesarMensaje(message).catch((err) =>
          this.logger.error(`Error procesando mensaje Discord: ${err.message}`),
        );
      });

      // Botones (ButtonInteraction)
      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
        if ((interaction.channel as any)?.type !== ChannelType.DM) return;
        await this.manejarBoton(interaction).catch((err) =>
          this.logger.error(`Error procesando botón Discord: ${err.message}`),
        );
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

  // ============================================================
  //  Helpers
  // ============================================================

  private filaBotones(
    botones: Array<{ label: string; customId: string; style?: ButtonStyle }>,
  ): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      botones.map((b) =>
        new ButtonBuilder()
          .setCustomId(b.customId)
          .setLabel(b.label)
          .setStyle(b.style || ButtonStyle.Primary),
      ),
    );
  }

  private async enviarDM(userId: string, contenido: any): Promise<void> {
    if (!this.client) return;
    try {
      const user = await this.client.users.fetch(userId);
      if (user) await user.send(contenido);
    } catch (error) {
      this.logger.error(`Error enviando DM a ${userId}: ${error.message}`);
    }
  }

  // ============================================================
  //  Handler de mensajes
  // ============================================================

  private async procesarMensaje(message: Message): Promise<void> {
    const userId = message.author.id;
    const text = message.content.trim();
    const attachments = Array.from(message.attachments.values());
    const images = attachments.filter((a: any) => a.contentType?.startsWith?.('image/'));

    // /start reinicia el flujo
    if (text === '/start' || text === 'start') {
      this.botState.actualizar('discord', userId, {
        estado: 'ELEGIR_IDIOMA',
        beneficiarioId: undefined,
        nombreBeneficiario: undefined,
        clubMadres: undefined,
        intentosCancelar: 0,
      });
      await this.mostrarMenuIdioma(userId);
      return;
    }

    const sesion = this.botState.obtener('discord', userId);
    if (!sesion) {
      await message.reply('👋 ¡Hola! Escribe **/start** para comenzar con VasoChain AI.');
      return;
    }

    switch (sesion.estado) {
      case 'ELEGIR_IDIOMA':
        if (text) await this.procesarEleccionIdioma(userId, text);
        break;

      case 'ESPERANDO_DNI':
        if (images.length > 0) {
          await this.procesarFotoQR(userId, images[0] as any); 
        } else if (text) {
          await this.procesarDni(userId, text);
        }
        break;

      case 'ESPERANDO_FOTO':
        if (images.length > 0) {
          await this.procesarFoto(userId, images[0] as any);
        } else if (text === '/cancelar') {
          await this.mostrarConfirmacionCancelar(userId);
        } else {
          const row = this.filaBotones([
            { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
          ]);
          await message.reply({
            content: obtenerTextos(sesion.idioma).pedirFoto,
            components: [row],
          });
        }
        break;

      case 'FINALIZADO': {
        const row = this.filaBotones([
          { label: '🔄 Nueva entrega', customId: 'acc:nueva' },
          { label: '🆕 Reiniciar', customId: 'acc:reiniciar', style: ButtonStyle.Secondary },
        ]);
        await message.reply({ content: '¿Qué deseas hacer?', components: [row] });
        break;
      }

      case 'CANCELAR_CONFIRMACION':
        await message.reply('Por favor usa los botones de arriba para confirmar.');
        break;

      default:
        await message.reply('Estado desconocido. Escribe /start para reiniciar.');
    }
  }

  // ============================================================
  //  Handler de botones (ButtonInteraction)
  // ============================================================

  private async manejarBoton(interaction: any): Promise<void> {
    const customId = interaction.customId as string;
    const userId = interaction.user.id;

    const sesion = this.botState.obtener('discord', userId);
    if (!sesion) {
      await interaction.reply({ content: 'Sesión expirada. Escribe /start.', ephemeral: true });
      return;
    }

    // --- Idioma ---
    if (customId.startsWith('lang:')) {
      const idioma = customId.split(':')[1] as Idioma;
      if (!IDIOMAS_DISPONIBLES.includes(idioma)) {
        await interaction.reply({ content: 'Idioma no válido', ephemeral: true });
        return;
      }
      this.botState.actualizar('discord', userId, { idioma, estado: 'IDENTIFICARSE' });
      await interaction.update({ content: `✅ Idioma seleccionado.`, components: [] });
      await this.mostrarMenuIdentificacion(userId, idioma);
      return;
    }

    // --- Identificación ---
    if (customId === 'id:dni') {
      this.botState.actualizar('discord', userId, { estado: 'ESPERANDO_DNI' });
      await interaction.reply({ content: '✍️ Escribe tu **DNI** (8 dígitos):', ephemeral: true });
      return;
    }

    if (customId === 'id:qr') {
      this.botState.actualizar('discord', userId, { estado: 'ESPERANDO_DNI' });
      await interaction.reply({
        content: '📷 Envíame la **foto de tu código QR** como imagen.',
        ephemeral: true,
      });
      return;
    }

    // --- Cancelar ---
    if (customId === 'acc:cancelar') {
      await interaction.deferUpdate();
      await this.mostrarConfirmacionCancelar(userId);
      return;
    }

    if (customId === 'cancel:si') {
      this.botState.eliminar('discord', userId);
      await interaction.update({
        content: obtenerTextos(sesion.idioma).operacionCancelada,
        components: [],
      });
      return;
    }

    if (customId === 'cancel:no') {
      const nuevoEstado = sesion.beneficiarioId ? 'ESPERANDO_FOTO' : 'IDENTIFICARSE';
      this.botState.actualizar('discord', userId, { estado: nuevoEstado });
      const msg = sesion.beneficiarioId
        ? obtenerTextos(sesion.idioma).pedirFoto
        : obtenerTextos(sesion.idioma).pedirIdentificacion;
      await interaction.update({ content: '👍 ' + msg, components: [] });
      return;
    }

    // --- Acciones finales ---
    if (customId === 'acc:reporte') {
      await interaction.reply({
        content: '📊 El reporte completo ya está arriba en este chat.',
        ephemeral: true,
      });
      return;
    }

    if (customId === 'acc:nueva') {
      this.botState.actualizar('discord', userId, { estado: 'ESPERANDO_FOTO' });
      const row = this.filaBotones([
        { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
      ]);
      await interaction.update({
        content: obtenerTextos(sesion.idioma).pedirFoto,
        components: [row],
      });
      return;
    }

    if (customId === 'acc:reiniciar') {
      this.botState.eliminar('discord', userId);
      await interaction.update({ content: '🔄 Reiniciando...', components: [] });
      this.botState.actualizar('discord', userId, { estado: 'ELEGIR_IDIOMA', intentosCancelar: 0 });
      await this.mostrarMenuIdioma(userId);
      return;
    }

    await interaction.reply({ content: 'Opción no reconocida', ephemeral: true });
  }

  // ============================================================
  //  Pasos del flujo
  // ============================================================

  private async mostrarMenuIdioma(userId: string): Promise<void> {
    const row = this.filaBotones([
      { label: '🇵🇪 Español', customId: 'lang:es' },
      { label: '🌽 Quechua', customId: 'lang:qu' },
      { label: '🏔️ Aimara', customId: 'lang:ay' },
    ]);
    await this.enviarDM(userId, {
      content: obtenerTextos('es').bienvenidaIdioma,
      components: [row],
    });
  }

  private async mostrarMenuIdentificacion(userId: string, idioma: Idioma): Promise<void> {
    const row = this.filaBotones([
      { label: '📷 Foto del QR', customId: 'id:qr' },
      { label: '✍️ Escribir DNI', customId: 'id:dni' },
    ]);
    await this.enviarDM(userId, {
      content: obtenerTextos(idioma).pedirIdentificacion,
      components: [row],
    });
  }

  private async procesarEleccionIdioma(userId: string, texto: string): Promise<void> {
    const t = texto.toLowerCase().trim();
    let idioma: Idioma | null = null;
    if (t.startsWith('esp') || t === 'es' || t === '1') idioma = 'es';
    else if (t.startsWith('que') || t === 'qu' || t === '2') idioma = 'qu';
    else if (t.startsWith('aim') || t === 'ay' || t === '3') idioma = 'ay';

    if (!idioma) {
      await this.mostrarMenuIdioma(userId);
      return;
    }
    this.botState.actualizar('discord', userId, { idioma, estado: 'IDENTIFICARSE' });
    await this.mostrarMenuIdentificacion(userId, idioma);
  }

  private async procesarFotoQR(userId: string, attachment: any): Promise<void> {
    await this.enviarDM(userId, '🔍 Leyendo tu código QR...');

    try {
      const response = await fetch(attachment.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const textoQR = await leerQR(buffer);

      if (!textoQR) {
        const row = this.filaBotones([
          { label: '✍️ Escribir DNI', customId: 'id:dni' },
          { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
        ]);
        await this.enviarDM(userId, {
          content: '❌ No pude leer el QR. Asegúrate de que la imagen sea clara.\n\nO escribe tu DNI directamente:',
          components: [row],
        });
        return;
      }

      await this.procesarPorId(userId, textoQR);

    } catch (error) {
      this.logger.error(`Error leyendo QR Discord: ${error.message}`);
      const row = this.filaBotones([
        { label: '✍️ Escribir DNI', customId: 'id:dni' },
        { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
      ]);
      await this.enviarDM(userId, {
        content: '⚠️ Error al procesar la imagen. Intenta de nuevo o escribe tu DNI:',
        components: [row],
      });
    }
  }

  private async procesarPorId(userId: string, beneficiarioId: string): Promise<void> {
    const sesion = this.botState.obtener('discord', userId);
    if (!sesion) return;

    const beneficiario = await this.prisma.beneficiario.findUnique({
      where: { id: beneficiarioId },
    });

    if (!beneficiario) {
      const row = this.filaBotones([
        { label: '✍️ Escribir DNI', customId: 'id:dni' },
        { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
      ]);
      await this.enviarDM(userId, {
        content: `❌ El QR no corresponde a ningún beneficiario registrado.\nCódigo leído: \`${beneficiarioId}\`\n\nO escribe tu DNI manualmente:`,
        components: [row],
      });
      return;
    }

    this.botState.asociarBeneficiario(
      'discord',
      userId,
      beneficiario.id,
      beneficiario.nombre,
      beneficiario.clubMadres,
    );

    const textos = obtenerTextos(sesion.idioma);
    const row = this.filaBotones([
      { label: '📸 Enviar foto ahora', customId: 'acc:nueva' },
      { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
    ]);
    await this.enviarDM(userId, {
      content: textos.identificacionRecibida(beneficiario.nombre, beneficiario.clubMadres, 'md'),
      components: [row],
    });
  }
  private async procesarDni(userId: string, texto: string): Promise<void> {
    const sesion = this.botState.obtener('discord', userId);
    if (!sesion) return;

    const dni = texto.replace(/\D/g, '');
    if (dni.length < 6) {
      await this.enviarDM(userId, '⚠️ El DNI parece incorrecto. Escribe solo los números (8 dígitos).');
      return;
    }

    const beneficiario = await this.prisma.beneficiario.findFirst({ where: { dni } });
    if (!beneficiario) {
      const row = this.filaBotones([
        { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
      ]);
      await this.enviarDM(userId, {
        content: `❌ No encontré ningún beneficiario con el DNI \`${dni}\`.\n\nVerifica el número e intenta de nuevo:`,
        components: [row],
      });
      return;
    }

    this.botState.asociarBeneficiario(
      'discord',
      userId,
      beneficiario.id,
      beneficiario.nombre,
      beneficiario.clubMadres,
    );

    const textos = obtenerTextos(sesion.idioma);
    const row = this.filaBotones([
      { label: '📸 Enviar foto ahora', customId: 'acc:nueva' },
      { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
    ]);
    await this.enviarDM(userId, {
      content: textos.identificacionRecibida(beneficiario.nombre, beneficiario.clubMadres, 'md'),
      components: [row],
    });
  }

  private async mostrarConfirmacionCancelar(userId: string): Promise<void> {
    const sesion = this.botState.obtener('discord', userId);
    const textos = obtenerTextos(sesion?.idioma);
    this.botState.actualizar('discord', userId, { estado: 'CANCELAR_CONFIRMACION' });
    const row = this.filaBotones([
      { label: '✅ ' + textos.siCancelar, customId: 'cancel:si', style: ButtonStyle.Danger },
      { label: '↩️ ' + textos.noCancelar, customId: 'cancel:no', style: ButtonStyle.Secondary },
    ]);
    await this.enviarDM(userId, { content: textos.cancelar, components: [row] });
  }

  private async procesarFoto(userId: string, attachment: any): Promise<void> {
    const sesion = this.botState.obtener('discord', userId);

    if (!sesion?.beneficiarioId) {
      const row = this.filaBotones([
        { label: '🆕 Comenzar de nuevo', customId: 'acc:reiniciar' },
      ]);
      await this.enviarDM(userId, {
        content: obtenerTextos(sesion?.idioma).sinSesionActiva(userId),
        components: [row],
      });
      return;
    }

    this.botState.actualizar('discord', userId, { estado: 'PROCESANDO' });
    await this.enviarDM(userId, obtenerTextos(sesion.idioma).fotoRecibidaValidando);

    try {
      const response = await fetch(attachment.url);
      if (!response.ok) throw new Error(`Error descargando imagen: ${response.statusText}`);
      const buffer = Buffer.from(await response.arrayBuffer());

      const entrega: any = await this.entregasService.procesarEntrega({
        beneficiarioId: sesion.beneficiarioId,
        bufferImagen: buffer,
        mediaType: attachment.contentType || 'image/jpeg',
        origen: 'discord_real',
        nombreArchivo: attachment.name || 'discord_evidencia.jpg',
      });

      const textos = obtenerTextos(sesion.idioma);
      const reporte = await this.generarReporteControles(entrega.id);
      const nombre = entrega.beneficiario?.nombre || sesion.nombreBeneficiario || 'Beneficiario';

      if (entrega.estado === 'VALIDADA') {
        const row = this.filaBotones([
          { label: '📊 Ver reporte', customId: 'acc:reporte', style: ButtonStyle.Secondary },
          { label: '🔄 Nueva entrega', customId: 'acc:nueva' },
        ]);
        await this.enviarDM(userId, {
          content: textos.entregaValidada(nombre, reporte, entrega.hashBlockchain, entrega.txHash, 'md'),
          components: [row],
        });
      } else {
        const row = this.filaBotones([
          { label: '🔄 Reintentar foto', customId: 'acc:nueva' },
          { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
        ]);
        await this.enviarDM(userId, {
          content: textos.entregaRechazada(nombre, reporte, 'md'),
          components: [row],
        });
      }

      this.botState.actualizar('discord', userId, { estado: 'FINALIZADO' });
    } catch (error) {
      this.logger.error(`Error procesando foto Discord: ${error.message}`);
      this.botState.actualizar('discord', userId, { estado: 'ESPERANDO_FOTO' });
      const row = this.filaBotones([
        { label: '🔄 Reintentar', customId: 'acc:nueva' },
        { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
      ]);
      await this.enviarDM(userId, {
        content: obtenerTextos(sesion.idioma).errorProcesamiento,
        components: [row],
      });
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

      let txt = '📊 **REPORTE (13 Controles de Arnés):**\n';
      for (const [nivelKey, titulo] of Object.entries(niveles)) {
        const runs = agrupado.get(nivelKey) || [];
        if (runs.length === 0) continue;
        txt += `\n**${titulo}**\n`;
        for (const run of runs) {
          const emoji = run.resultado ? '✅' : '❌';
          txt += `${emoji} **[${run.control.identificador}]** ${run.control.descripcion}: ${run.resultado ? 'PASÓ' : 'FALLÓ'} (${run.tiempoMs}ms)\n`;
        }
      }
      return txt;
    } catch (err) {
      this.logger.error(`Error generando reporte: ${err.message}`);
      return '';
    }
  }

  // ============================================================
  //  Compatibilidad con POST /discord/iniciar-sesion (frontend)
  // ============================================================

  async registrarSesionYSaludar(userId: string, beneficiarioId: string): Promise<void> {
    const beneficiario = await this.prisma.beneficiario.findUnique({
      where: { id: beneficiarioId },
    });
    if (!beneficiario) {
      await this.enviarDM(userId, '❌ Beneficiario no encontrado.');
      return;
    }

    this.botState.asociarBeneficiario(
      'discord',
      userId,
      beneficiario.id,
      beneficiario.nombre,
      beneficiario.clubMadres,
    );

    const textos = obtenerTextos('es');
    const row = this.filaBotones([
      { label: '📸 Enviar foto ahora', customId: 'acc:nueva' },
      { label: '❌ Cancelar', customId: 'acc:cancelar', style: ButtonStyle.Danger },
    ]);
    await this.enviarDM(userId, {
      content: textos.identificacionRecibida(beneficiario.nombre, beneficiario.clubMadres, 'md'),
      components: [row],
    });
  }
}
