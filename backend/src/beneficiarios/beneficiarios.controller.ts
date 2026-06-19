import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { BeneficiariosService } from './beneficiarios.service';
import { CrearBeneficiarioDto } from './dto/crear-beneficiario.dto';

@Controller('beneficiarios')
export class BeneficiariosController {
  constructor(private readonly beneficiariosService: BeneficiariosService) {}

  @Post()
  crear(@Body() dto: CrearBeneficiarioDto) {
    return this.beneficiariosService.crear(dto);
  }

  @Get()
  listar() {
    return this.beneficiariosService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.beneficiariosService.obtenerPorId(id);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.beneficiariosService.eliminar(id);
  }

  /**
   * Devuelve la imagen PNG del código QR del beneficiario, lista para
   * mostrarse en el frontend o imprimirse.
   */
  @Get(':id/qr')
  async obtenerQr(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.beneficiariosService.generarImagenQr(id);
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
