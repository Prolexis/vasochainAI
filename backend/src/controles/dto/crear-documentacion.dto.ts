import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CrearDocumentacionDto {
  @IsString()
  @IsOptional()
  controlId?: string;

  @IsString()
  @IsNotEmpty()
  tipoDocumento: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  creadoPor?: string;
}
