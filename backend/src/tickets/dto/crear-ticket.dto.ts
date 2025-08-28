import { 
  IsNotEmpty, 
  IsString, 
  IsInt, 
  IsPositive,
  MinLength,
  Min,
  Max
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para crear un nuevo ticket
 * Define la estructura y validaciones para los datos de entrada
 */
export class CrearTicketDto {

  /**
   * Asunto del ticket
   * Debe tener al menos 5 caracteres
   */
  @IsNotEmpty({ message: 'El asunto es obligatorio' })
  @IsString({ message: 'El asunto debe ser un texto' })
  @MinLength(5, { message: 'El asunto debe tener al menos 5 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  asunto!: string;

  /**
   * Descripción detallada del problema o solicitud
   * Debe tener al menos 10 caracteres
   */
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser un texto' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  descripcion!: string;

  /**
   * ID del departamento al que se dirige el ticket
   * Debe ser un número positivo entre 1 y 999
   */
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  @IsInt({ message: 'El ID del departamento debe ser un número entero' })
  @IsPositive({ message: 'El ID del departamento debe ser un número positivo' })
  @Min(1, { message: 'El ID del departamento debe ser mayor a 0' })
  @Max(999, { message: 'El ID del departamento no puede ser mayor a 999' })
  id_departamento!: number;

  /**
   * ID de la prioridad del ticket
   * 1 = Alta, 2 = Media, 3 = Baja
   */
  @IsNotEmpty({ message: 'La prioridad es obligatoria' })
  @IsInt({ message: 'La prioridad debe ser un número entero' })
  @Min(1, { message: 'La prioridad debe ser 1 (Alta), 2 (Media) o 3 (Baja)' })
  @Max(3, { message: 'La prioridad debe ser 1 (Alta), 2 (Media) o 3 (Baja)' })
  id_prioridad!: number;
}