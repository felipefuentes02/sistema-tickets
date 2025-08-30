import { 
  IsOptional,
  IsString, 
  IsEmail,
  IsInt,
  MinLength,
  Matches,
  IsIn
} from 'class-validator';

/**
 * DTO para actualizar un usuario existente
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export class ActualizarUsuarioDto {

  /**
   * Primer nombre del usuario
   */
  @IsOptional()
  @IsString({ message: 'El primer nombre debe ser un texto' })
  @MinLength(2, { message: 'El primer nombre debe tener al menos 2 caracteres' })
  primer_nombre?: string;

  /**
   * Segundo nombre del usuario (opcional)
   */
  @IsOptional()
  @IsString({ message: 'El segundo nombre debe ser un texto' })
  segundo_nombre?: string;

  /**
   * Primer apellido del usuario
   */
  @IsOptional()
  @IsString({ message: 'El primer apellido debe ser un texto' })
  @MinLength(2, { message: 'El primer apellido debe tener al menos 2 caracteres' })
  primer_apellido?: string;

  /**
   * Segundo apellido del usuario
   */
  @IsOptional()
  @IsString({ message: 'el segundo apellido debe ser un texto' })
  @MinLength(2, { message: 'El segundo apellido debe tener al menos 2 caracteres' })
  segundo_apellido?: string;

  /**
   * Correo electrónico del usuario (único)
   */
  @IsOptional()
  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  correo?: string;

  /**
   * RUT del usuario (único, formato chileno)
   */
  @IsOptional()
  @IsString({ message: 'El RUT debe ser un texto' })
  @Matches(/^\d{7,8}-[\dkK]$/, { message: 'El RUT debe tener formato válido (ej: 12345678-9)' })
  rut?: string;

  /**
   * Nueva contraseña del usuario (opcional)
   */
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    { message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' }
  )
  contrasena?: string;

  /**
   * ID del departamento al que pertenece el usuario
   */
  @IsOptional()
  @IsInt({ message: 'El ID del departamento debe ser un número entero' })
  id_departamento?: number;

  /**
   * Rol del usuario en el sistema
   * Valores permitidos: administrador, responsable, usuario_interno, usuario_externo
   */
  @IsOptional()
  @IsString({ message: 'El rol debe ser un texto' })
  @IsIn(['administrador', 'responsable', 'usuario_interno', 'usuario_externo'], {
    message: 'El rol debe ser: administrador, responsable, usuario_interno o usuario_externo'
  })
  rol?: string;
}