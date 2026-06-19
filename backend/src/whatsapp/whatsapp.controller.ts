import { Body, Controller, Header, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * Webhook que Twilio invoca (vía ngrok en desarrollo local) cuando
   * llega un mensaje al número de WhatsApp Sandbox. Plan B de la
   * integración: requiere credenciales Twilio configuradas en el .env.
   */
  @Post('webhook')
  @Header('Content-Type', 'text/xml')
  async webhook(@Body() body: any, @Res() res: Response) {
    const twiml = await this.whatsappService.procesarMensajeEntrante({
      from: body.From,
      numMedia: parseInt(body.NumMedia || '0', 10),
      mediaUrl: body.MediaUrl0,
      mediaContentType: body.MediaContentType0,
      body: body.Body,
    });
    res.send(twiml);
  }

  /**
   * Asocia un número de WhatsApp con un beneficiarioId antes de pedir la
   * foto (por ejemplo, justo después de escanear el QR en el panel).
   * Útil tanto para pruebas del Plan B como para flujos guiados.
   */
  @Post('iniciar-sesion')
  iniciarSesion(
    @Body() body: { numeroWhatsapp: string; beneficiarioId: string },
  ) {
    this.whatsappService.registrarSesion(
      body.numeroWhatsapp,
      body.beneficiarioId,
    );
    return { ok: true };
  }
}
