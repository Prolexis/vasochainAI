import { IsNotEmpty, IsString } from 'class-validator';

export class CrearBeneficiarioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  clubMadres: string;

  @IsString()
  @IsNotEmpty()
  sector: string;
}
