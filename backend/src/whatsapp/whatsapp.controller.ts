import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * Webhook que Whapi.Cloud invoca cuando llega un mensaje de WhatsApp.
   * Responde con un status 200 de forma inmediata para evitar timeouts
   * y reintentos del webhook, y procesa la lógica en segundo plano.
   */
  @Post('webhook')
  async webhook(@Body() body: any, @Res() res: Response) {
    return this.handleWebhook(body, res);
  }

  @Post('webhook/messages')
  async webhookMessages(@Body() body: any, @Res() res: Response) {
    return this.handleWebhook(body, res);
  }

  @Post('webhook/message')
  async webhookMessage(@Body() body: any, @Res() res: Response) {
    return this.handleWebhook(body, res);
  }

  @Post('webhook/status')
  async webhookStatus(@Body() body: any, @Res() res: Response) {
    return this.handleWebhook(body, res);
  }

  private async handleWebhook(body: any, res: Response) {
    console.log('--- WEBHOOK RECIBIDO DESDE WHAPI ---');
    console.log(JSON.stringify(body, null, 2));
    this.whatsappService.procesarWebhookWhapi(body).catch((err) => {
      console.error('Error procesando webhook Whapi:', err);
    });
    return res.status(200).send({ ok: true });
  }

  /**
   * Asocia un número de WhatsApp con un beneficiarioId antes de enviar la
   * evidencia (por ejemplo, justo después de escanear el QR en el panel).
   */
  @Post('iniciar-sesion')
  async iniciarSesion(
    @Body() body: { numeroWhatsapp: string; beneficiarioId: string },
  ) {
    await this.whatsappService.registrarSesionYSaludar(
      body.numeroWhatsapp,
      body.beneficiarioId,
    );
    return { ok: true };
  }
}
