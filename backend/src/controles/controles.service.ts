import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearControlDto } from './dto/crear-control.dto';
import { ActualizarControlDto } from './dto/actualizar-control.dto';
import { ImportarControlesDto } from './dto/importar-controles.dto';
import { DescartarControlDto } from './dto/descartar-control.dto';
import { EjecutarPruebaDto } from './dto/ejecutar-prueba.dto';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { CrearDocumentacionDto } from './dto/crear-documentacion.dto';
import { ControlStatus, TestStatus } from '@prisma/client';

@Injectable()
export class ControlesService {
  constructor(private readonly prisma: PrismaService) {}

  // CATEGORÍAS
  async crearCategoria(dto: CrearCategoriaDto) {
    return this.prisma.controlCategory.create({
      data: dto,
    });
  }

  async listarCategorias() {
    return this.prisma.controlCategory.findMany({
      orderBy: { orden: 'asc' },
      include: { controls: true },
    });
  }

  async obtenerCategoriaPorId(id: string) {
    const categoria = await this.prisma.controlCategory.findUnique({
      where: { id },
      include: { controls: true },
    });
    if (!categoria) {
      throw new NotFoundException(`Categoría ${id} no encontrada`);
    }
    return categoria;
  }

  // CONTROLES BÁSICOS
  async crear(dto: CrearControlDto) {
    const existente = await this.prisma.control.findUnique({
      where: { identificador: dto.identificador },
    });
    if (existente) {
      throw new BadRequestException(`Control con identificador ${dto.identificador} ya existe`);
    }
    return this.prisma.control.create({
      data: dto,
      include: { categoria: true },
    });
  }

  async listar(filtros?: { estado?: ControlStatus; categoriaId?: string; esFrecuente?: boolean }) {
    return this.prisma.control.findMany({
      where: filtros,
      orderBy: [
        { orden: 'asc' },
        { creadoEn: 'desc' },
      ],
      include: { categoria: true, testResults: true, documentation: true },
    });
  }

  async obtenerPorId(id: string) {
    const control = await this.prisma.control.findUnique({
      where: { id },
      include: { categoria: true, testResults: true, documentation: true },
    });
    if (!control) {
      throw new NotFoundException(`Control ${id} no encontrado`);
    }
    return control;
  }

  async actualizar(id: string, dto: ActualizarControlDto) {
    await this.obtenerPorId(id);
    if (dto.identificador) {
      const existente = await this.prisma.control.findFirst({
        where: { identificador: dto.identificador, NOT: { id } },
      });
      if (existente) {
        throw new BadRequestException(`Control con identificador ${dto.identificador} ya existe`);
      }
    }
    return this.prisma.control.update({
      where: { id },
      data: dto,
      include: { categoria: true },
    });
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id);
    return this.prisma.control.delete({ where: { id } });
  }

  // IMPORTE MASIVO
  async importarMasivo(dto: ImportarControlesDto) {
    const resultados = {
      exitosos: 0,
      fallidos: 0,
      errores: [] as Array<{ identificador: string; error: string }>,
    };

    for (const controlImport of dto.controles) {
      try {
        let categoria = await this.prisma.controlCategory.findUnique({
          where: { nombre: controlImport.categoria },
        });

        if (!categoria) {
          categoria = await this.prisma.controlCategory.create({
            data: { nombre: controlImport.categoria },
          });
        }

        const existente = await this.prisma.control.findUnique({
          where: { identificador: controlImport.identificador },
        });

        if (existente) {
          resultados.fallidos++;
          resultados.errores.push({
            identificador: controlImport.identificador,
            error: 'Identificador duplicado',
          });
          continue;
        }

        await this.prisma.control.create({
          data: {
            identificador: controlImport.identificador,
            descripcion: controlImport.descripcion,
            categoriaId: categoria.id,
            dependencias: controlImport.dependencias,
            requerimientosAcceso: controlImport.requerimientosAcceso,
            objetivosAlineados: controlImport.objetivosAlineados,
            esFrecuente: controlImport.esFrecuente || false,
            orden: controlImport.orden || 0,
          },
        });

        resultados.exitosos++;
      } catch (error) {
        resultados.fallidos++;
        resultados.errores.push({
          identificador: controlImport.identificador,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return resultados;
  }

  // DEPURACIÓN Y DESCARTES
  async descartarControl(id: string, dto: DescartarControlDto) {
    const control = await this.obtenerPorId(id);

    await this.prisma.discardedControl.create({
      data: {
        controlId: control.id,
        identificador: control.identificador,
        descripcion: control.descripcion,
        categoriaId: control.categoriaId,
        motivoEliminacion: dto.motivoEliminacion,
        criteriosAplicados: dto.criteriosAplicados,
        responsable: dto.responsable,
      },
    });

    return this.prisma.control.update({
      where: { id },
      data: { estado: ControlStatus.DESCARTADO },
    });
  }

  async listarDescartados() {
    return this.prisma.discardedControl.findMany({
      orderBy: { fechaEliminacion: 'desc' },
    });
  }

  async generarInformeDepuracion() {
    const totalInicial = await this.prisma.control.count();
    const validados = await this.prisma.control.count({
      where: { estado: { in: [ControlStatus.VALIDADO, ControlStatus.APROBADO, ControlStatus.EN_PRUEBAS, ControlStatus.PRODUCCION] } },
    });
    const descartados = await this.prisma.discardedControl.count();

    return {
      totalInicial,
      validados,
      descartados,
      reduccionPorcentaje: totalInicial > 0 ? Math.round((descartados / totalInicial) * 100) : 0,
    };
  }

  // MODO MENÚ
  async obtenerMenuModo() {
    const categorias = await this.prisma.controlCategory.findMany({
      orderBy: { orden: 'asc' },
      include: {
        controls: {
          where: {
            estado: { in: [ControlStatus.VALIDADO, ControlStatus.APROBADO, ControlStatus.EN_PRUEBAS, ControlStatus.PRODUCCION] },
          },
          orderBy: [
            { esFrecuente: 'desc' },
            { orden: 'asc' },
          ],
        },
      },
    });

    const frecuentes = await this.prisma.control.findMany({
      where: {
        esFrecuente: true,
        estado: { in: [ControlStatus.VALIDADO, ControlStatus.APROBADO, ControlStatus.EN_PRUEBAS, ControlStatus.PRODUCCION] },
      },
      include: { categoria: true },
    });

    return {
      categorias,
      frecuentes,
    };
  }

  async buscarControles(termino: string) {
    return this.prisma.control.findMany({
      where: {
        OR: [
          { identificador: { contains: termino, mode: 'insensitive' } },
          { descripcion: { contains: termino, mode: 'insensitive' } },
        ],
        estado: { in: [ControlStatus.VALIDADO, ControlStatus.APROBADO, ControlStatus.EN_PRUEBAS, ControlStatus.PRODUCCION] },
      },
      include: { categoria: true },
    });
  }

  // ARNÉS DE PRUEBAS
  async ejecutarPrueba(controlId: string, dto: EjecutarPruebaDto) {
    const control = await this.obtenerPorId(controlId);

    await this.prisma.control.update({
      where: { id: controlId },
      data: { estado: ControlStatus.EN_PRUEBAS },
    });

    const testResult = await this.prisma.testResult.create({
      data: {
        controlId,
        tipoPrueba: dto.tipoPrueba,
        estado: TestStatus.EN_EJECUCION,
        ejecutadoPor: dto.ejecutadoPor,
        fechaEjecucion: new Date(),
      },
    });

    const pruebas = [
      { nombre: 'Funcionalidad básica', exitoso: Math.random() > 0.1 },
      { nombre: 'Resistencia a carga', exitoso: Math.random() > 0.15 },
      { nombre: 'Compatibilidad', exitoso: Math.random() > 0.05 },
      { nombre: 'Seguridad', exitoso: Math.random() > 0.05 },
    ];

    const todasAprobadas = pruebas.every(p => p.exitoso);

    return this.prisma.testResult.update({
      where: { id: testResult.id },
      data: {
        estado: todasAprobadas ? TestStatus.APROBADO : TestStatus.FALLIDO,
        resultado: { pruebas },
        mensaje: todasAprobadas ? 'Todas las pruebas pasaron exitosamente' : 'Algunas pruebas fallaron',
      },
      include: { control: true },
    });
  }

  async aprobarParaProduccion(controlId: string) {
    const pruebas = await this.prisma.testResult.findMany({
      where: { controlId },
    });

    const todasAprobadas = pruebas.length > 0 && pruebas.every(p => p.estado === TestStatus.APROBADO);

    if (!todasAprobadas) {
      throw new BadRequestException('No se puede aprobar: todas las pruebas deben estar APROBADAS');
    }

    return this.prisma.control.update({
      where: { id: controlId },
      data: { estado: ControlStatus.PRODUCCION },
    });
  }

  async listarPruebas(controlId: string) {
    return this.prisma.testResult.findMany({
      where: { controlId },
      orderBy: { creadoEn: 'desc' },
    });
  }

  // DOCUMENTACIÓN
  async crearDocumentacion(dto: CrearDocumentacionDto) {
    return this.prisma.documentation.create({
      data: dto,
      include: { control: true },
    });
  }

  async listarDocumentacion(controlId?: string) {
    return this.prisma.documentation.findMany({
      where: controlId ? { controlId } : {},
      orderBy: { creadoEn: 'desc' },
      include: { control: true },
    });
  }

  async obtenerDocumentacionPorId(id: string) {
    const doc = await this.prisma.documentation.findUnique({
      where: { id },
      include: { control: true },
    });
    if (!doc) {
      throw new NotFoundException(`Documentación ${id} no encontrada`);
    }
    return doc;
  }
}
