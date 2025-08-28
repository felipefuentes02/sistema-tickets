import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CrearTicketDto } from './crear-ticket.dto';
import { IsOptional, IsInt } from 'class-validator';

export class ActualizarTicketDto extends PartialType(
  OmitType(CrearTicketDto, ['id_departamento'] as const)
) {
  
  @IsOptional()
  @IsInt({ message: 'El ID del estado debe ser un número entero' })
  id_estado?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del responsable debe ser un número entero' })
  asignado_a?: number;
}