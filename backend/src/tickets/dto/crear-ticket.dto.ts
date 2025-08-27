import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CrearTicketDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  asunto: string;

  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsInt()
  @IsNotEmpty()
  id_departamento: number;

  @IsInt()
  @IsNotEmpty()
  id_prioridad: number;

  @IsOptional()
  @IsInt()
  id_solicitante?: number; // Se asignará automáticamente desde el JWT
}
