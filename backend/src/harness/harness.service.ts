import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { IaService } from '../ia/ia.service';

@Injectable()
export class HarnessService {
  private readonly logger = new Logger(HarnessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly iaService: IaService,
  ) {}

  /**
   * Obtiene todos los controles del arnés
   */
  async obtenerControles() {
    return this.prisma.harnessControl.findMany({
      include: {
        controlMetric: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });
  }

  /**
   * Alterna el estado de un control (activo/inactivo)
   */
  async toggleControl(id: number, estado: boolean) {
    return this.prisma.harnessControl.update({
      where: { id },
      data: { estado },
    });
  }

  /**
   * Obtiene las recomendaciones de controles para desactivar
   * Basado en valorRatio (valor vs ruido)
   */
  async obtenerRecomendaciones() {
    const controles = await this.prisma.harnessControl.findMany({
      include: { controlMetric: true },
      orderBy: { orden: 'asc' },
    });

    // Recomendar desactivar controles con bajo valorRatio y baja criticidad
    const recomendaciones = controles
      .filter(c => c.controlMetric && c.controlMetric.valorRatio < 0.1 && c.criticidad === 'BAJA')
      .map(c => ({
        control: c,
        razon: 'Bajo valorRatio y baja criticidad',
      }));

    return recomendaciones;
  }

  /**
   * Ejecuta todos los controles activos para una entrega
   */
  async ejecutarControles(
    entregaId: string,
    beneficiarioId: string,
    bufferImagen?: Buffer,
  ) {
    const controlesActivos = await this.prisma.harnessControl.findMany({
      where: { estado: true },
      orderBy: { orden: 'asc' },
    });

    const resultados = [];

    for (const control of controlesActivos) {
      const inicio = Date.now();
      let resultado = true;
      let alertasCount = 0;
      let error = null;

      try {
        switch (control.id) {
          // NIVEL 1 - ENTRADA
          case 1: // HC-001 Validación QR (crítica)
            resultado = await this.control1ValidarQR(beneficiarioId);
            if (!resultado) alertasCount++;
            break;
          case 2: // HC-002 Geolocalización (media)
            resultado = await this.control2Geolocalizacion();
            if (!resultado) alertasCount++;
            break;
          case 3: // HC-003 Fecha/Hora (media)
            resultado = this.control3FechaHora();
            if (!resultado) alertasCount++;
            break;
          // NIVEL 2 - FOTO
          case 4: // HC-004 IA Validación (crítica)
            resultado = await this.control4IAValidacion(bufferImagen);
            if (!resultado) alertasCount++;
            break;
          case 5: // HC-005 Integridad EXIF (media)
            resultado = this.control5IntegridadEXIF();
            if (!resultado) alertasCount++;
            break;
          case 6: // HC-006 Face Recognition (baja)
            resultado = this.control6FaceRecognition();
            if (!resultado) alertasCount++;
            break;
          // NIVEL 3 - DATOS
          case 7: // HC-007 Consistencia
            resultado = await this.control7Consistencia(beneficiarioId);
            if (!resultado) alertasCount++;
            break;
          case 8: // HC-008 Frecuencia
            resultado = await this.control8Frecuencia(beneficiarioId);
            if (!resultado) alertasCount++;
            break;
          case 9: // HC-009 QR Vigente
            resultado = await this.control9QRVigente(beneficiarioId);
            if (!resultado) alertasCount++;
            break;
          // NIVEL 4 - BLOCKCHAIN
          case 10: // HC-010 Sello en Cadena
            resultado = await this.control10SelloCadena(entregaId);
            if (!resultado) alertasCount++;
            break;
          case 11: // HC-011 Confirmación Bloque
            resultado = await this.control11ConfirmacionBloque(entregaId);
            if (!resultado) alertasCount++;
            break;
          // NIVEL 5 - SUPERVISIÓN
          case 12: // HC-012 Alertas
            resultado = true; // Este control es pasivo, siempre pasa
            break;
          case 13: // HC-013 Auditoría Muestreo
            resultado = true; // Este control es pasivo, siempre pasa
            break;
        }
      } catch (err) {
        this.logger.error(`Error ejecutando control ${control.id}:`, err);
        error = err;
        // No bloqueamos el flujo, pero registramos el fallo
        resultado = false;
      }

      const tiempoMs = Date.now() - inicio;

      // Guardar la ejecución del control
      const controlRun = await this.prisma.controlRun.create({
        data: {
          controlId: control.id,
          entregaId,
          resultado,
          tiempoMs,
          alertasCount,
        },
      });

      // Actualizar las métricas del control
      await this.actualizarMetricas(control.id, resultado, tiempoMs);

      resultados.push({
        control,
        controlRun,
        error,
      });
    }

    return resultados;
  }

  // ======================================
  // Implementación individual de controles
  // ======================================

  /**
   * HC-001: Validar que el beneficiario exista en el padrón
   */
  private async control1ValidarQR(beneficiarioId: string): Promise<boolean> {
    const beneficiario = await this.prisma.beneficiario.findUnique({
      where: { id: beneficiarioId },
    });
    return !!beneficiario;
  }

  /**
   * HC-002: Geolocalización (simulada para demo)
   */
  private async control2Geolocalizacion(): Promise<boolean> {
    // En producción: integrar con servicio de geolocalización
    // Para demo: asumir que siempre está en punto de distribución (80% probabilidad)
    return Math.random() > 0.2;
  }

  /**
   * HC-003: Verificar que la entrega esté entre 8am y 6pm
   */
  private control3FechaHora(): boolean {
    const hora = new Date().getHours();
    return hora >= 8 && hora < 18;
  }

  /**
   * HC-004: Validar evidencia con IA
   */
  private async control4IAValidacion(bufferImagen?: Buffer): Promise<boolean> {
    if (!bufferImagen) return false;
    try {
      const resultadoIA = await this.iaService.validarEvidenciaEntrega(
        bufferImagen.toString('base64'),
        'image/jpeg',
      );
      return resultadoIA.valido;
    } catch {
      // Si la IA falla, no bloqueamos, pero registramos fallo
      return false;
    }
  }

  /**
   * HC-005: Verificar integridad EXIF (simulada)
   */
  private control5IntegridadEXIF(): boolean {
    // En producción: usar exiftool o similar para verificar metadatos
    // Para demo: 90% de probabilidad de que no esté modificada
    return Math.random() > 0.1;
  }

  /**
   * HC-006: Face recognition (simulada)
   */
  private control6FaceRecognition(): boolean {
    // En producción: integrar con servicio de reconocimiento facial
    // Para demo: 85% de probabilidad de que se vea al beneficiario
    return Math.random() > 0.15;
  }

  /**
   * HC-007: Verificar consistencia de datos con padrón
   */
  private async control7Consistencia(beneficiarioId: string): Promise<boolean> {
    const beneficiario = await this.prisma.beneficiario.findUnique({
      where: { id: beneficiarioId },
    });
    if (!beneficiario) return false;
    // Para demo: verificar que los datos básicos existan
    return !!beneficiario.nombre && !!beneficiario.dni && !!beneficiario.clubMadres;
  }

  /**
   * HC-008: Verificar entregas múltiples en las últimas 24h
   */
  private async control8Frecuencia(beneficiarioId: string): Promise<boolean> {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const entregasRecientes = await this.prisma.entrega.count({
      where: {
        beneficiarioId,
        fecha: { gte: hace24h },
      },
    });
    // Si hay más de 1 entrega en 24h, marcar como fallo
    return entregasRecientes <= 1;
  }

  /**
   * HC-009: Verificar que el QR no esté vencido (30 días)
   */
  private async control9QRVigente(beneficiarioId: string): Promise<boolean> {
    const beneficiario = await this.prisma.beneficiario.findUnique({
      where: { id: beneficiarioId },
    });
    if (!beneficiario) return false;
    const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // Para demo: asumir que el QR se creó hace menos de 30 días
    return beneficiario.creadoEn > hace30dias;
  }

  /**
   * HC-010: Verificar que la entrega tenga sello en blockchain
   */
  private async control10SelloCadena(entregaId: string): Promise<boolean> {
    const entrega = await this.prisma.entrega.findUnique({
      where: { id: entregaId },
    });
    return !!entrega?.hashBlockchain;
  }

  /**
   * HC-011: Verificar que el bloque esté confirmado (simulado)
   */
  private async control11ConfirmacionBloque(entregaId: string): Promise<boolean> {
    // En producción: consultar la red blockchain
    // Para demo: 95% de probabilidad de bloque confirmado
    return Math.random() > 0.05;
  }

  /**
   * Actualiza las métricas de un control
   */
  private async actualizarMetricas(
    controlId: number,
    resultado: boolean,
    tiempoMs: number,
  ) {
    const metricas = await this.prisma.controlMetric.findUnique({
      where: { controlId },
    });

    if (!metricas) return;

    let nuevosVerdaderosPositivos = metricas.verdaderosPositivos;
    let nuevosFalsosPositivos = metricas.falsosPositivos;
    let nuevosVerdaderosNegativos = metricas.verdaderosNegativos;
    let nuevosFalsosNegativos = metricas.falsosNegativos;
    let fraudePrevenido = metricas.fraudePrevenido;

    // Para demo: clasificar resultados como VP/FP/VN/FN
    // En producción: esto se haría con auditoría humana
    if (resultado) {
      if (Math.random() > 0.1) {
        nuevosVerdaderosPositivos++;
      } else {
        nuevosFalsosPositivos++;
      }
    } else {
      if (Math.random() > 0.2) {
        nuevosVerdaderosNegativos++;
        fraudePrevenido = true; // Si falló y es verdadero negativo
      } else {
        nuevosFalsosNegativos++;
      }
    }

    const nuevoTiempoAgregado = metricas.tiempoAgregadoMs + tiempoMs;
    const nuevasEjecuciones = metricas.ejecucionesCount + 1;

    // Calcular valorRatio: (fraudePrevenido ? 1 : 0) + VP / (tiempo + 1)
    const valorRatio =
      ((fraudePrevenido ? 1 : 0) + nuevosVerdaderosPositivos / Math.max(nuevasEjecuciones, 1)) /
      (nuevoTiempoAgregado / 1000 + 1);

    await this.prisma.controlMetric.update({
      where: { controlId },
      data: {
        verdaderosPositivos: nuevosVerdaderosPositivos,
        falsosPositivos: nuevosFalsosPositivos,
        verdaderosNegativos: nuevosVerdaderosNegativos,
        falsosNegativos: nuevosFalsosNegativos,
        fraudePrevenido,
        tiempoAgregadoMs: nuevoTiempoAgregado,
        ejecucionesCount: nuevasEjecuciones,
        valorRatio,
      },
    });
  }
}
