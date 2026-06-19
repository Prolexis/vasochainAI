import { IsOptional, IsString, IsBoolean, IsInt, IsObject } from 'class-validator';

export class ActualizarControlDto {
  @IsString()
  @IsOptional()
  identificador?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  categoriaId?: string;

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
