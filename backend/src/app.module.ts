import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { BeneficiariosModule } from './beneficiarios/beneficiarios.module';
import { EntregasModule } from './entregas/entregas.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { TelegramModule } from './telegram/telegram.module';
import { DiscordModule } from './discord/discord.module';
import { IaModule } from './ia/ia.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { ControlesModule } from './controles/controles.module';
import { HarnessModule } from './harness/harness.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Sirve las fotos guardadas en /uploads para que el frontend pueda
    // mostrarlas directamente (ej: http://localhost:3000/uploads/x.jpg).
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    BeneficiariosModule,
    EntregasModule,
    WhatsappModule,
    TelegramModule,
    DiscordModule,
    IaModule,
    BlockchainModule,
    ControlesModule,
    HarnessModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
