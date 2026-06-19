import { Module } from '@nestjs/common';
import { ControlesService } from './controles.service';
import { ControlesController } from './controles.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ControlesController],
  providers: [ControlesService],
  exports: [ControlesService],
})
export class ControlesModule {}
