import { Module, Global } from '@nestjs/common';
import { BotStateService } from './bot-state.service';

/**
 * Módulo global que expone los servicios compartidos entre los bots
 * de Telegram y Discord (estado conversacional, i18n, helpers).
 *
 * @Global() permite que TelegramService y DiscordService inyecten
 * BotStateService sin tener que importar BotsModule en cada uno.
 */
@Global()
@Module({
  providers: [BotStateService],
  exports: [BotStateService],
})
export class BotsModule {}