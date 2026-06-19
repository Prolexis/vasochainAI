import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class EjecutarPruebaDto {
  @IsString()
  @IsNotEmpty()
  tipoPrueba: string;

  @IsString()
  @IsOptional()
  ejecutadoPor?: string;
}
