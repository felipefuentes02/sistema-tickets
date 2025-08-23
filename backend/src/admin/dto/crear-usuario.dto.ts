import { IsString, IsEmail, IsOptional, IsInt, IsIn, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * DTO para crear un nuevo usuario
 * Valida todos los campos requeridos según el modelo de DB
 */
export class CrearUsuarioDto {
  /**
   * Primer nombre del usuario
   * Requerido, máximo 25 caracteres, solo letras
   */
  @IsString({ message: 'El primer nombre debe ser un texto' })
  @MinLength(2, { message: 'El primer nombre debe tener al menos 2 caracteres' })
  @MaxLength(25, { message: 'El primer nombre no puede exceder 25 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El primer nombre solo puede contener letras' })
  primer_nombre: string;

  /**
   * Segundo nombre del usuario (opcional)
   * Máximo 25 caracteres, solo letras
   */
  @IsOptional()
  @IsString({ message: 'El segundo nombre debe ser un texto' })
  @MaxLength(25, { message: 'El segundo nombre no puede exceder 25 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, { message: 'El segundo nombre solo puede contener letras' })
  segundo_nombre?: string;

  /**
   * Primer apellido del usuario
   * Requerido, máximo 25 caracteres, solo letras
   */
  @IsString({ message: 'El primer apellido debe ser un texto' })
  @MinLength(2, { message: 'El primer apellido debe tener al menos 2 caracteres' })
  @MaxLength(25, { message: 'El primer apellido no puede exceder 25 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El primer apellido solo puede contener letras' })
  primer_apellido: string;

  /**
   * Segundo apellido del usuario
   * Requerido, máximo 25 caracteres, solo letras
   */
  @IsString({ message: 'El segundo apellido debe ser un texto' })
  @MinLength(2, { message: 'El segundo apellido debe tener al menos 2 caracteres' })
  @MaxLength(25, { message: 'El segundo apellido no puede exceder 25 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El segundo apellido solo puede contener letras' })
  segundo_apellido: string;

  /**
   * Correo electrónico del usuario
   * Requerido, formato válido, máximo 80 caracteres, único
   */
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @MaxLength(80, { message: 'El email no puede exceder 80 caracteres' })
  correo: string;

  /**
   * Contraseña del usuario
   * Requerida, mínimo 8 caracteres, debe cumplir políticas de seguridad
   */
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]/,
    { message: 'La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial' }
  )
  contrasena: string;

  /**
   * ID del rol del usuario
   * Debe ser uno de los roles válidos: administrador, responsable, usuario_interno, usuario_externo
   */
  @IsString({ message: 'El rol debe ser un texto' })
  @IsIn(['administrador', 'responsable', 'usuario_interno', 'usuario_externo'], {
    message: 'El rol debe ser: administrador, responsable, usuario_interno o usuario_externo'
  })
  rol: string;

  /**
   * ID del departamento al que pertenece el usuario
   * Opcional, debe existir en la tabla departamentos
   */
  @IsOptional()
  @IsInt({ message: 'El ID del departamento debe ser un número entero' })
  id_departamento?: number;

  /**
   * RUT del usuario (para compatibilidad con frontend)
   * Opcional por ahora, hasta agregar el campo a la DB
   */
  @IsOptional()
  @IsString({ message: 'El RUT debe ser un texto' })
  @Matches(/^[0-9]{7,8}-[0-9kK]$/, { message: 'El RUT debe tener formato válido (ej: 12345678-9)' })
  rut?: string;
}