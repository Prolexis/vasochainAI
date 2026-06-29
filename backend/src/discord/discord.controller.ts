import { Body, Controller, Post } from '@nestjs/common';
import { DiscordService } from './discord.service';

@Controller('discord')
export class DiscordController {
  constructor(private readonly discordService: DiscordService) {}

  @Post('iniciar-sesion')
  async iniciarSesion(
    @Body() body: { userId: string; beneficiarioId: string },
  ) {
    await this.discordService.registrarSesionYSaludar(
      body.userId,
      body.beneficiarioId,
    );
    return { ok: true };
  }
}
