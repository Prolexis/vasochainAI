import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Servicio de Prisma compartido en toda la app. Maneja la conexión a
 * PostgreSQL con connection pool y reintentos ante caídas transitorias.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.conectarConReintentos();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Intenta conectar con reintentos. Si PostgreSQL se reinicia en medio
   * de una operación, Prisma reintentará automáticamente en la siguiente
   * query, pero la conexión inicial debe ser exitosa para que el backend
   * arranque correctamente.
   */
  private async conectarConReintentos(intentos = 10) {
    for (let i = 0; i < intentos; i++) {
      try {
        await this.$connect();
        this.logger.log('Conectado a PostgreSQL');
        return;
      } catch (error) {
        this.logger.warn(
          `Intento ${i + 1}/${intentos}: PostgreSQL no disponible (${error.message})`,
        );
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    this.logger.error(
      'No se pudo conectar a PostgreSQL tras varios intentos',
    );
  }
}
