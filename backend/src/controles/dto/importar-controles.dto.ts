import { IsArray, ValidateNested, IsNotEmpty, IsString, IsOptional, IsBoolean, IsObject, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class ControlImportDto {
  @IsString()
  @IsNotEmpty()
  identificador: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsNotEmpty()
  categoria: string;

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

export class ImportarControlesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ControlImportDto)
  controles: ControlImportDto[];
}
