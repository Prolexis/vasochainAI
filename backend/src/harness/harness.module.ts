import { Module } from '@nestjs/common';
import { HarnessService } from './harness.service';
import { HarnessController } from './harness.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IaModule } from '../ia/ia.module';

@Module({
  imports: [PrismaModule, BlockchainModule, IaModule],
  providers: [HarnessService],
  controllers: [HarnessController],
  exports: [HarnessService],
})
export class HarnessModule {}
