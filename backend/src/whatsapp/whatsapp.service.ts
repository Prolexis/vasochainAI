import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { EntregasService } from '../entregas/entregas.service';

/**
 * Servicio de integración real con Twilio WhatsApp Sandbox (Plan B).
 * Reutiliza EntregasService.procesarEntrega(), el mismo pipeline que usa
 * el endpoint de simulación (Plan A), para no duplicar lógica de
 * negocio entre ambos caminos.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly client: twilio.Twilio | null;
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly numeroWhatsapp: string;

  // Estado simple en memoria: último beneficiarioId "activo" por número
  // de WhatsApp remitente, para asociar la foto que llega después del QR.
  private readonly sesionesActivas = new Map<string, string>();

  constructor(
    private readonly config: ConfigService,
    private readonly entregasService: EntregasService,
  ) {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.numeroWhatsapp =
      this.config.get<string>('TWILIO_WHATSAPP_NUMBER') || '';

    const credencialesValidas =
      this.accountSid &&
      this.authToken &&
      this.accountSid !== 'tu_twilio_account_sid' &&
      this.authToken !== 'tu_twilio_auth_token';

    if (!credencialesValidas) {
      this.logger.warn(
        'Credenciales de Twilio no configuradas. El webhook de WhatsApp real (Plan B) responderá con error hasta que se configure el .env. El Plan A (simulación) no se ve afectado.',
      );
      this.client = null;
    } else {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  estaDisponible(): boolean {
    return this.client !== null;
  }

  /**
   * Registra qué beneficiarioId está "en proceso de entrega" para un
   * número de WhatsApp dado (se setea, por ejemplo, al escanear el QR
   * desde el frontend antes de pedir la foto por WhatsApp).
   */
  registrarSesion(numeroWhatsapp: string, beneficiarioId: string) {
    this.sesionesActivas.set(numeroWhatsapp, beneficiarioId);
  }

  /**
   * Procesa un mensaje entrante de Twilio. Si trae una imagen, dispara
   * el pipeline compartido de EntregasService. Si no, responde con
   * instrucciones.
   */
  async procesarMensajeEntrante(payload: {
    from: string;
    numMedia: number;
    mediaUrl?: string;
    mediaContentType?: string;
    body?: string;
  }) {
    const numero = payload.from;

    if (payload.numMedia > 0 && payload.mediaUrl) {
      const beneficiarioId = this.sesionesActivas.get(numero);
      if (!beneficiarioId) {
        return this.responderTexto(
          'No identificamos una entrega en curso para este número. Por favor escanea primero el código QR del beneficiario desde el panel.',
        );
      }

      const { buffer, mediaType } = await this.descargarMedia(
        payload.mediaUrl,
      );

      const entrega = await this.entregasService.procesarEntrega({
        beneficiarioId,
        bufferImagen: buffer,
        mediaType,
        origen: 'whatsapp_real',
        nombreArchivo: 'whatsapp-evidencia',
      });

      this.sesionesActivas.delete(numero);

      const mensaje =
        entrega.estado === 'VALIDADA'
          ? 'Evidencia validada correctamente. Gracias, la entrega fue registrada en VasoChain AI.'
          : 'No pudimos validar la evidencia enviada. Un supervisor revisará el caso.';

      return this.responderTexto(mensaje);
    }

    return this.responderTexto(
      'Hola, soy el asistente de VasoChain AI. Por favor envía una foto como evidencia de la entrega de alimentos recibida.',
    );
  }

  private async descargarMedia(
    mediaUrl: string,
  ): Promise<{ buffer: Buffer; mediaType: string }> {
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString(
      'base64',
    );
    const response = await fetch(mediaUrl, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const arrayBuffer = await response.arrayBuffer();
    const mediaType =
      response.headers.get('content-type') || 'image/jpeg';
    return { buffer: Buffer.from(arrayBuffer), mediaType };
  }

  /**
   * Genera el TwiML de respuesta para el webhook de Twilio.
   */
  private responderTexto(mensaje: string): string {
    const MessagingResponse = twilio.twiml.MessagingResponse;
    const twiml = new MessagingResponse();
    twiml.message(mensaje);
    return twiml.toString();
  }
}
