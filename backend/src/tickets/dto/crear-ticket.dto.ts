import { 
  IsNotEmpty, 
  IsString, 
  IsInt, 
  IsOptional, 
  MaxLength, 
  MinLength,
  IsPositive,
  Min,
  Max
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para crear un nuevo ticket
 * Valida todos los datos de entrada necesarios
 */
export class CrearTicketDto {
  
  /**
   * Asunto del ticket
   * Debe ser obligatorio, string, entre 5 y 150 caracteres
   */
  @IsNotEmpty({ message: 'El asunto es obligatorio' })
  @IsString({ message: 'El asunto debe ser un texto válido' })
  @MinLength(5, { message: 'El asunto debe tener al menos 5 caracteres' })
  @MaxLength(150, { message: 'El asunto no puede exceder 150 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  asunto: string;

  /**
   * Descripción detallada del ticket
   * Debe ser obligatorio, string, entre 10 y 2000 caracteres
   */
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser un texto válido' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  @MaxLength(2000, { message: 'La descripción no puede exceder 2000 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  descripcion: string;

  /**
   * ID del departamento al que se dirige el ticket
   * Debe ser un número entero positivo válido
   */
  @IsInt({ message: 'El ID del departamento debe ser un número entero' })
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  @IsPositive({ message: 'El ID del departamento debe ser un número positivo' })
  @Min(1, { message: 'El ID del departamento debe ser mayor a 0' })
  @Max(999, { message: 'El ID del departamento no puede ser mayor a 999' })
  id_departamento: number;

  /**
   * ID de la prioridad del ticket
   * Debe ser un número entero entre 1 y 3 (Alta=1, Media=2, Baja=3)
   */
  @IsInt({ message: 'El ID de prioridad debe ser un número entero' })
  @IsNotEmpty({ message: 'La prioridad es obligatoria' })
  @Min(1, { message: 'La prioridad debe ser 1 (Alta), 2 (Media) o 3 (Baja)' })
  @Max(3, { message: 'La prioridad debe ser 1 (Alta), 2 (Media) o 3 (Baja)' })
  id_prioridad: number;

  /**
   * ID del solicitante (se asignará automáticamente desde el JWT)
   * Campo opcional que será sobrescrito por el backend
   */
  @IsOptional()
  @IsInt({ message: 'El ID del solicitante debe ser un número entero' })
  @IsPositive({ message: 'El ID del solicitante debe ser un número positivo' })
  id_solicitante?: number;

  /**
   * Lista de usuarios en copia (opcional)
   * Array de IDs de usuarios que recibirán notificaciones
   */
  @IsOptional()
  @IsInt({ each: true, message: 'Cada ID de usuario en copia debe ser un número entero' })
  @IsPositive({ each: true, message: 'Cada ID de usuario en copia debe ser positivo' })
  usuarios_en_copia?: number[];

  /**
   * Fecha de vencimiento personalizada (opcional)
   * Si no se especifica, se calculará automáticamente basada en la prioridad
   */
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  fecha_vencimiento_personalizada?: Date;

  /**
   * Comentarios adicionales del solicitante (opcional)
   * Campo libre para información adicional
   */
  @IsOptional()
  @IsString({ message: 'Los comentarios deben ser un texto válido' })
  @MaxLength(500, { message: 'Los comentarios no pueden exceder 500 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  comentarios_adicionales?: string;
}