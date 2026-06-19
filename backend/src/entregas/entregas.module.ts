import { Module } from '@nestjs/common';
import { EntregasService } from './entregas.service';
import { EntregasController } from './entregas.controller';
import { IaModule } from '../ia/ia.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { HarnessModule } from '../harness/harness.module';

@Module({
  imports: [IaModule, BlockchainModule, HarnessModule],
  controllers: [EntregasController],
  providers: [EntregasService],
  exports: [EntregasService],
})
export class EntregasModule {}
