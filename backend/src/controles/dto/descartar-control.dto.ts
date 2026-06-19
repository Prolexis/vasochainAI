import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class DescartarControlDto {
  @IsString()
  @IsNotEmpty()
  motivoEliminacion: string;

  @IsObject()
  @IsOptional()
  criteriosAplicados?: any;

  @IsString()
  @IsNotEmpty()
  responsable: string;
}
