import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { HarnessService } from './harness.service';

@Controller('harness')
export class HarnessController {
  constructor(private readonly harnessService: HarnessService) {}

  @Get('controles')
  async obtenerControles() {
    return this.harnessService.obtenerControles();
  }

  @Put('controles/:id/toggle')
  async toggleControl(
    @Param('id') id: string,
    @Body('estado') estado: boolean,
  ) {
    return this.harnessService.toggleControl(parseInt(id), estado);
  }

  @Get('recomendaciones')
  async obtenerRecomendaciones() {
    return this.harnessService.obtenerRecomendaciones();
  }
}
