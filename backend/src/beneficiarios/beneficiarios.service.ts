import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { CrearBeneficiarioDto } from './dto/crear-beneficiario.dto';

@Injectable()
export class BeneficiariosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un beneficiario. El qrCode almacenado es el propio id (uuid) del
   * beneficiario: es lo que se codifica dentro de la imagen QR y lo que
   * se escanea en el momento de la entrega.
   */
  async crear(dto: CrearBeneficiarioDto) {
    const id = uuidv4();
    return this.prisma.beneficiario.create({
      data: {
        id,
        nombre: dto.nombre,
        dni: dto.dni,
        clubMadres: dto.clubMadres,
        sector: dto.sector,
        qrCode: id,
      },
    });
  }

  async listar() {
    return this.prisma.beneficiario.findMany({
      orderBy: { creadoEn: 'desc' },
    });
  }

  async obtenerPorId(id: string) {
    const beneficiario = await this.prisma.beneficiario.findUnique({
      where: { id },
    });
    if (!beneficiario) {
      throw new NotFoundException(`Beneficiario ${id} no encontrado`);
    }
    return beneficiario;
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id);
    return this.prisma.beneficiario.delete({ where: { id } });
  }

  /**
   * Genera la imagen QR (PNG en buffer) que codifica el id del
   * beneficiario. Esto es lo que se imprime/muestra para el escaneo en
   * el punto de entrega.
   */
  async generarImagenQr(id: string): Promise<Buffer> {
    await this.obtenerPorId(id);
    return QRCode.toBuffer(id, {
      type: 'png',
      width: 400,
      margin: 2,
    });
  }
}
