import { Injectable, Logger } from '@nestjs/common';
import { Idioma } from './bot-i18n';

/**
 * Estados posibles del flujo conversacional del bot.
 * Cada estado representa un paso en la interacción guiada con el usuario.
 */
export type EstadoBot =
  | 'INICIO' // acaba de tocar /start, esperando elegir idioma
  | 'ELEGIR_IDIOMA' // mostrando menú de idiomas
  | 'IDENTIFICARSE' // mostrando opciones: QR o DNI
  | 'ESPERANDO_DNI' // usuario eligió escribir DNI, esperando texto
  | 'ESPERANDO_FOTO' // ya identificado, esperando foto
  | 'PROCESANDO' // foto recibida, validando con IA + blockchain
  | 'FINALIZADO' // entrega registrada, opciones finales
  | 'CANCELAR_CONFIRMACION'; // usuario pidió cancelar, pidiendo confirmación

export interface SesionUsuario {
  estado: EstadoBot;
  idioma: Idioma;
  beneficiarioId?: string;
  nombreBeneficiario?: string;
  clubMadres?: string;
  intentosCancelar: number;
  ultimoAcceso: number;
}

const SESION_TTL_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Servicio que mantiene el estado de cada usuario del bot (Telegram o Discord).
 * Permite flujos conversacionales multi-paso sin que el usuario tenga que
 * recordar qué hacer en cada momento.
 *
 * Las sesiones se guardan en memoria. Para producción real con múltiples
 * instancias, mover a Redis o a una tabla nueva en Prisma.
 */
@Injectable()
export class BotStateService {
  private readonly logger = new Logger(BotStateService.name);
  private readonly sesiones = new Map<string, SesionUsuario>();

  constructor() {
    // Limpieza periódica de sesiones expiradas para evitar memory leak.
    setInterval(() => this.limpiarExpiradas(), 5 * 60 * 1000);
  }

  /**
   * Clave única por usuario + plataforma. Ej: "telegram:123456789" o
   * "discord:987654321012345678".
   */
  private clave(plataforma: 'telegram' | 'discord', userId: string): string {
    return `${plataforma}:${userId}`;
  }

  /**
   * Obtiene la sesión existente o crea una nueva en estado INICIO.
   */
  obtenerOCrear(plataforma: 'telegram' | 'discord', userId: string): SesionUsuario {
    const k = this.clave(plataforma, userId);
    let sesion = this.sesiones.get(k);
    if (!sesion) {
      sesion = {
        estado: 'INICIO',
        idioma: 'es',
        intentosCancelar: 0,
        ultimoAcceso: Date.now(),
      };
      this.sesiones.set(k, sesion);
      this.logger.log(`Nueva sesión creada: ${k}`);
    } else {
      sesion.ultimoAcceso = Date.now();
    }
    return sesion;
  }

  obtener(plataforma: 'telegram' | 'discord', userId: string): SesionUsuario | undefined {
    const k = this.clave(plataforma, userId);
    const sesion = this.sesiones.get(k);
    if (sesion) sesion.ultimoAcceso = Date.now();
    return sesion;
  }

  actualizar(
    plataforma: 'telegram' | 'discord',
    userId: string,
    cambios: Partial<SesionUsuario>,
  ): SesionUsuario {
    const sesion = this.obtenerOCrear(plataforma, userId);
    Object.assign(sesion, cambios);
    sesion.ultimoAcceso = Date.now();
    this.logger.debug(`Sesión ${this.clave(plataforma, userId)} → ${JSON.stringify(cambios)}`);
    return sesion;
  }

  eliminar(plataforma: 'telegram' | 'discord', userId: string): void {
    const k = this.clave(plataforma, userId);
    this.sesiones.delete(k);
    this.logger.log(`Sesión eliminada: ${k}`);
  }

  /**
   * Asocia un beneficiario a la sesión actual (después de identificarlo
   * por DNI o QR). Mantiene compatibilidad con el endpoint existente
   * POST /telegram/iniciar-sesion y POST /discord/iniciar-sesion.
   */
  asociarBeneficiario(
    plataforma: 'telegram' | 'discord',
    userId: string,
    beneficiarioId: string,
    nombre: string,
    club: string,
  ): SesionUsuario {
    return this.actualizar(plataforma, userId, {
      estado: 'ESPERANDO_FOTO',
      beneficiarioId,
      nombreBeneficiario: nombre,
      clubMadres: club,
      intentosCancelar: 0,
    });
  }

  private limpiarExpiradas(): void {
    const ahora = Date.now();
    let eliminadas = 0;
    for (const [k, sesion] of this.sesiones.entries()) {
      if (ahora - sesion.ultimoAcceso > SESION_TTL_MS) {
        this.sesiones.delete(k);
        eliminadas++;
      }
    }
    if (eliminadas > 0) {
      this.logger.log(`Limpieza: ${eliminadas} sesiones expiradas eliminadas`);
    }
  }

  /**
   * Para debugging / métricas. Devuelve el número de sesiones activas.
   */
  contarSesiones(): number {
    return this.sesiones.size;
  }
}