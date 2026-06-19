import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EntregasService } from './entregas.service';
import { SimularEntregaDto } from './dto/simular-entrega.dto';

@Controller('entregas')
export class EntregasController {
  constructor(private readonly entregasService: EntregasService) {}

  @Get()
  listar() {
    return this.entregasService.listar();
  }

  @Get('kpis')
  obtenerKpis() {
    return this.entregasService.obtenerKpis();
  }

  @Get('alertas')
  obtenerAlertas() {
    return this.entregasService.obtenerAlertas();
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.entregasService.obtenerPorId(id);
  }

  /**
   * Plan A: endpoint de simulación de WhatsApp. Dispara manualmente el
   * mismo pipeline completo (validación IA -> blockchain -> persistencia)
   * que activaría un mensaje real de WhatsApp, sin depender de Twilio ni
   * de internet externo. Es el camino principal para la demo en vivo.
   */
  @Post('simular-whatsapp')
  @UseInterceptors(FileInterceptor('foto'))
  async simularWhatsapp(
    @Body() dto: SimularEntregaDto,
    @UploadedFile() foto: any,
  ) {
    if (!foto) {
      throw new BadRequestException('Debe adjuntar una foto en el campo "foto"');
    }

    return this.entregasService.procesarEntrega({
      beneficiarioId: dto.beneficiarioId,
      bufferImagen: foto.buffer,
      mediaType: foto.mimetype,
      origen: 'simulado',
      nombreArchivo: foto.originalname,
    });
  }
}
