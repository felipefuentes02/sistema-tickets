import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CrearTicketDto } from './crear-ticket.dto';
import { IsOptional, IsInt } from 'class-validator';

export class ActualizarTicketDto extends PartialType(
  OmitType(CrearTicketDto, ['id_solicitante'] as const),
) {
  @IsOptional()
  @IsInt()
  id_estado?: number;

  @IsOptional()
  @IsInt()
  asignado_a?: number;
}
