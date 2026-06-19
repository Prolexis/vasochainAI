import { IsNotEmpty, IsString } from 'class-validator';

export class SimularEntregaDto {
  @IsString()
  @IsNotEmpty()
  beneficiarioId: string;
}
