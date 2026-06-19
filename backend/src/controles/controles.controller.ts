import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ControlesService } from './controles.service';
import { CrearControlDto } from './dto/crear-control.dto';
import { ActualizarControlDto } from './dto/actualizar-control.dto';
import { ImportarControlesDto } from './dto/importar-controles.dto';
import { DescartarControlDto } from './dto/descartar-control.dto';
import { EjecutarPruebaDto } from './dto/ejecutar-prueba.dto';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { CrearDocumentacionDto } from './dto/crear-documentacion.dto';
import { ControlStatus } from '@prisma/client';

@Controller('controles')
export class ControlesController {
  constructor(private readonly controlesService: ControlesService) {}

  // CATEGORÍAS
  @Post('categorias')
  crearCategoria(@Body() dto: CrearCategoriaDto) {
    return this.controlesService.crearCategoria(dto);
  }

  @Get('categorias')
  listarCategorias() {
    return this.controlesService.listarCategorias();
  }

  @Get('categorias/:id')
  obtenerCategoriaPorId(@Param('id') id: string) {
    return this.controlesService.obtenerCategoriaPorId(id);
  }

  // CONTROLES BÁSICOS
  @Post()
  crear(@Body() dto: CrearControlDto) {
    return this.controlesService.crear(dto);
  }

  @Get()
  listar(
    @Query('estado') estado?: ControlStatus,
    @Query('categoriaId') categoriaId?: string,
    @Query('esFrecuente') esFrecuente?: string,
  ) {
    return this.controlesService.listar({
      estado,
      categoriaId,
      esFrecuente: esFrecuente === 'true',
    });
  }

  @Get('buscar')
  buscar(@Query('termino') termino: string) {
    return this.controlesService.buscarControles(termino);
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.controlesService.obtenerPorId(id);
  }

  @Put(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarControlDto) {
    return this.controlesService.actualizar(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.controlesService.eliminar(id);
  }

  // IMPORTE MASIVO
  @Post('importar')
  importarMasivo(@Body() dto: ImportarControlesDto) {
    return this.controlesService.importarMasivo(dto);
  }

  // DEPURACIÓN
  @Post(':id/descartar')
  descartarControl(@Param('id') id: string, @Body() dto: DescartarControlDto) {
    return this.controlesService.descartarControl(id, dto);
  }

  @Get('descartados/lista')
  listarDescartados() {
    return this.controlesService.listarDescartados();
  }

  @Get('informe/depuracion')
  generarInformeDepuracion() {
    return this.controlesService.generarInformeDepuracion();
  }

  // MODO MENÚ
  @Get('modo-menu/estructura')
  obtenerMenuModo() {
    return this.controlesService.obtenerMenuModo();
  }

  // ARNÉS DE PRUEBAS
  @Post(':id/pruebas/ejecutar')
  ejecutarPrueba(@Param('id') id: string, @Body() dto: EjecutarPruebaDto) {
    return this.controlesService.ejecutarPrueba(id, dto);
  }

  @Post(':id/produccion/aprobar')
  aprobarParaProduccion(@Param('id') id: string) {
    return this.controlesService.aprobarParaProduccion(id);
  }

  @Get(':id/pruebas/lista')
  listarPruebas(@Param('id') id: string) {
    return this.controlesService.listarPruebas(id);
  }

  // DOCUMENTACIÓN
  @Post('documentacion')
  crearDocumentacion(@Body() dto: CrearDocumentacionDto) {
    return this.controlesService.crearDocumentacion(dto);
  }

  @Get('documentacion/lista')
  listarDocumentacion(@Query('controlId') controlId?: string) {
    return this.controlesService.listarDocumentacion(controlId);
  }

  @Get('documentacion/:id')
  obtenerDocumentacionPorId(@Param('id') id: string) {
    return this.controlesService.obtenerDocumentacionPorId(id);
  }
}
