import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';

export class CrearControlDto {
  @IsString()
  @IsNotEmpty()
  identificador: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsNotEmpty()
  categoriaId: string;

  @IsObject()
  @IsOptional()
  dependencias?: any;

  @IsObject()
  @IsOptional()
  requerimientosAcceso?: any;

  @IsObject()
  @IsOptional()
  objetivosAlineados?: any;

  @IsBoolean()
  @IsOptional()
  esFrecuente?: boolean;

  @IsInt()
  @IsOptional()
  orden?: number;
}
