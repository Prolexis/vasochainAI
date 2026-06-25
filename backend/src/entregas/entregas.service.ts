import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { IaService } from '../ia/ia.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { HarnessService } from '../harness/harness.service';

// Tipo declarado localmente (Prisma lo genera automáticamente en producción)
type OrigenEntrega = 'simulado' | 'whatsapp_real';

interface ProcesarEntregaInput {
  beneficiarioId: string;
  bufferImagen: Buffer;
  mediaType: string;
  origen: OrigenEntrega;
  nombreArchivo: string;
}

/**
 * Servicio central del flujo de entregas. Esta es la lógica de negocio
 * compartida que invocan tanto el endpoint de simulación (Plan A) como
 * el webhook real de Twilio (Plan B), evitando duplicar código.
 *
 * Pipeline: guardar foto -> validar con IA -> registrar en blockchain ->
 * persistir en PostgreSQL -> (si corresponde) generar alerta.
 */
@Injectable()
export class EntregasService {
  private readonly logger = new Logger(EntregasService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    private readonly prisma: PrismaService,
    private readonly iaService: IaService,
    private readonly blockchainService: BlockchainService,
    private readonly harnessService: HarnessService,
  ) {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Reintenta una operación de BD hasta 3 veces si la conexión
   * se pierde transitoriamente (por reinicio de PostgreSQL, etc.)
   */
  private async ejecutarConReintento<T>(
    operacion: () => Promise<T>,
    descripcion: string,
  ): Promise<T> {
    for (let i = 0; i < 3; i++) {
      try {
        return await operacion();
      } catch (error) {
        const msg = (error as any)?.message || '';
        if (
          i < 2 &&
          (msg.includes('Server has closed the connection') ||
            msg.includes('Connection') ||
            msg.includes('ECONNREFUSED') ||
            msg.includes('timeout'))
        ) {
          this.logger.warn(
            `Reintento ${i + 1}/3: ${descripcion} (${msg})`,
          );
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw error;
      }
    }
    throw new Error(`Fallo tras reintentos: ${descripcion}`);
  }

  /**
   * Punto de entrada único del pipeline. Tanto el endpoint de simulación
   * como el webhook de WhatsApp real llaman a este método.
   */
  async procesarEntrega(input: ProcesarEntregaInput) {
    const beneficiario = await this.ejecutarConReintento(
      () =>
        this.prisma.beneficiario.findUnique({
          where: { id: input.beneficiarioId },
        }),
      'buscar beneficiario',
    );
    if (!beneficiario) {
      throw new NotFoundException(
        `Beneficiario ${input.beneficiarioId} no encontrado`,
      );
    }

    // 1. Guardar la foto en disco y calcular el hash de la evidencia.
    const hashEvidencia = crypto
      .createHash('sha256')
      .update(input.bufferImagen)
      .digest('hex');

    const extensionRaw = input.mediaType.split('/')[1] || 'jpg';
    // Si el MIME no es reconocido (ej: application/octet-stream),
    // intentamos adivinar por el nombre original del archivo.
    const extension =
      extensionRaw === 'octet-stream'
        ? (input.nombreArchivo?.split('.').pop() || 'jpg')
        : extensionRaw;
    const nombreArchivo = `${hashEvidencia}.${extension}`;
    const rutaArchivo = path.join(this.uploadsDir, nombreArchivo);
    fs.writeFileSync(rutaArchivo, input.bufferImagen);
    const fotoUrl = `/uploads/${nombreArchivo}`;

    // 2. Crear el registro inicial de la entrega en estado PENDIENTE.
    let entrega = await this.ejecutarConReintento(
      () =>
        this.prisma.entrega.create({
          data: {
            beneficiarioId: input.beneficiarioId,
            fotoUrl,
            estado: 'PENDIENTE',
            origen: input.origen,
          },
        }),
      'crear entrega inicial',
    );

    // 3. Validar la evidencia con IA. Si el servicio de IA no está
    // disponible (sin API key), se registra una alerta y la entrega
    // queda en estado RECHAZADA sin tumbar el resto del pipeline.
    let resultadoIa: { valido: boolean; confianza: number; motivo: string };
    let iaFallóPorDisponibilidad = false;
    try {
      resultadoIa = await this.iaService.validarEvidenciaEntrega(
        input.bufferImagen.toString('base64'),
        input.mediaType,
      );
    } catch (error) {
      this.logger.error(`Error validando con IA: ${error.message}`);
      iaFallóPorDisponibilidad = true;
      resultadoIa = {
        valido: false,
        confianza: 0,
        motivo: `No se pudo validar con IA: ${error.message}`,
      };
      await this.crearAlerta(
        entrega.id,
        'IA_NO_DISPONIBLE',
        resultadoIa.motivo,
      );
    }

    // 4. Registrar en blockchain (si está disponible). Igual que con la
    // IA, un fallo aquí no debe romper el flujo: se guarda como alerta.
    let hashBlockchain: string | null = null;
    let txHash: string | null = null;
    try {
      const resultado = await this.blockchainService.registrarEntrega(
        input.beneficiarioId,
        hashEvidencia,
        resultadoIa.valido,
      );
      txHash = resultado.txHash;
      hashBlockchain = hashEvidencia;
    } catch (error) {
      this.logger.error(`Error registrando en blockchain: ${error.message}`);
      await this.crearAlerta(
        entrega.id,
        'BLOCKCHAIN_NO_DISPONIBLE',
        `No se pudo registrar on-chain: ${error.message}`,
      );
    }

    // 5. Si la IA corrió correctamente pero rechazó la evidencia (no si
    // el rechazo fue por indisponibilidad del servicio, ya cubierto en
    // el paso 3), generar alerta de evidencia rechazada.
    if (!resultadoIa.valido && !iaFallóPorDisponibilidad) {
      await this.crearAlerta(
        entrega.id,
        'EVIDENCIA_RECHAZADA',
        resultadoIa.motivo,
      );
    }


    // 6. Actualizar la entrega con el resultado final.
    entrega = await this.ejecutarConReintento(
      () =>
        this.prisma.entrega.update({
          where: { id: entrega.id },
          data: {
            resultadoIa: resultadoIa as any,
            hashBlockchain,
            txHash,
            estado: resultadoIa.valido ? 'VALIDADA' : 'RECHAZADA',
          },
          include: { beneficiario: true },
        }),
      'actualizar entrega final',
    );

    // 7. Ejecutar el sistema de controles de arnés (arnés > barrera, no bloquea)
    try {
      await this.harnessService.ejecutarControles(
        entrega.id,
        input.beneficiarioId,
        input.bufferImagen,
      );
    } catch (error) {
      this.logger.error('Error ejecutando controles de arnés:', error);
    }

    // Retornar la entrega completa incluyendo sus controlRuns y beneficiario
    const entregaCompleta = await this.ejecutarConReintento(
      () =>
        this.prisma.entrega.findUnique({
          where: { id: entrega.id },
          include: {
            beneficiario: true,
            controlRuns: {
              include: {
                control: true,
              },
              orderBy: {
                control: {
                  orden: 'asc',
                },
              },
            },
          },
        }),
      'obtener entrega completa con controles',
    );

    return entregaCompleta || entrega;
  }

  private async crearAlerta(entregaId: string, tipo: string, mensaje: string) {
    return this.prisma.alerta.create({
      data: { entregaId, tipo, mensaje },
    });
  }

  async listar() {
    return this.prisma.entrega.findMany({
      orderBy: { fecha: 'desc' },
      include: { beneficiario: true },
    });
  }

  async obtenerPorId(id: string) {
    const entrega = await this.prisma.entrega.findUnique({
      where: { id },
      include: { beneficiario: true, alertas: true },
    });
    if (!entrega) {
      throw new NotFoundException(`Entrega ${id} no encontrada`);
    }
    return entrega;
  }

  async obtenerAlertas() {
    return this.prisma.alerta.findMany({
      orderBy: { fecha: 'desc' },
      include: { entrega: { include: { beneficiario: true } } },
    });
  }

  /**
   * KPIs agregados para las tarjetas del dashboard.
   */
  async obtenerKpis() {
    const totalBeneficiarios = await this.prisma.beneficiario.count();

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const entregasHoy = await this.prisma.entrega.count({
      where: { fecha: { gte: inicioHoy } },
    });

    const totalEntregas = await this.prisma.entrega.count();
    const entregasValidadas = await this.prisma.entrega.count({
      where: { estado: 'VALIDADA' },
    });

    const porcentajeValidadas =
      totalEntregas > 0
        ? Math.round((entregasValidadas / totalEntregas) * 100)
        : 0;

    const alertasActivas = await this.prisma.alerta.count();

    return {
      totalBeneficiarios,
      entregasHoy,
      porcentajeValidadasIa: porcentajeValidadas,
      alertasActivas,
      blockchainDisponible: this.blockchainService.estaDisponible(),
      iaDisponible: this.iaService.estaDisponible(),
    };
  }
}
