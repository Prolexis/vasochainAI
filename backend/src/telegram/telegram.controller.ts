import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async webhook(@Body() body: any, @Res() res: Response) {
    console.log('--- WEBHOOK RECIBIDO DESDE TELEGRAM ---');
    console.log(JSON.stringify(body, null, 2));
    this.telegramService.procesarWebhookTelegram(body).catch((err) => {
      console.error('Error procesando webhook Telegram:', err);
    });
    return res.status(200).send({ ok: true });
  }

  @Post('iniciar-sesion')
  async iniciarSesion(
    @Body() body: { chatId: string; beneficiarioId: string },
  ) {
    await this.telegramService.registrarSesionYSaludar(
      body.chatId,
      body.beneficiarioId,
    );
    return { ok: true };
  }
}
