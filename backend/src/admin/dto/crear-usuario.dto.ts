import { 
  IsNotEmpty, 
  IsString, 
  IsEmail,
  IsInt,
  IsOptional,
  MinLength,
  Matches,
  IsIn
} from 'class-validator';

/**
 * DTO para crear un nuevo usuario en el sistema
 * Define la estructura y validaciones para los datos de entrada
 */
export class CrearUsuarioDto {

  /**
   * Primer nombre del usuario
   */
  @IsNotEmpty({ message: 'El primer nombre es obligatorio' })
  @IsString({ message: 'El primer nombre debe ser un texto' })
  @MinLength(2, { message: 'El primer nombre debe tener al menos 2 caracteres' })
  primer_nombre!: string;

  /**
   * Segundo nombre del usuario (opcional)
   */
  @IsOptional()
  @IsString({ message: 'El segundo nombre debe ser un texto' })
  segundo_nombre?: string;

  /**
   * Primer apellido del usuario
   */
  @IsNotEmpty({ message: 'El primer apellido es obligatorio' })
  @IsString({ message: 'El primer apellido debe ser un texto' })
  @MinLength(2, { message: 'El primer apellido debe tener al menos 2 caracteres' })
  primer_apellido!: string;

  /**
   * Segundo apellido del usuario
   */
  @IsNotEmpty({ message: 'El segundo apellido es obligatorio' })
  @IsString({ message: 'El segundo apellido debe ser un texto' })
  @MinLength(2, { message: 'El segundo apellido debe tener al menos 2 caracteres' })
  segundo_apellido!: string;

  /**
   * Correo electrónico del usuario (único)
   */
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  correo!: string;

  /**
   * RUT del usuario (único, formato chileno)
   */
  @IsNotEmpty({ message: 'El RUT es obligatorio' })
  @IsString({ message: 'El RUT debe ser un texto' })
  @Matches(/^\d{7,8}-[\dkK]$/, { message: 'El RUT debe tener formato válido (ej: 12345678-9)' })
  rut!: string;

  /**
   * Contraseña del usuario
   */
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    { message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' }
  )
  contrasena!: string;

  /**
   * Confirmación de contraseña (debe coincidir con contrasena)
   */
  @IsOptional()
  @IsString({ message: 'La confirmación de contraseña debe ser un texto' })
  confirmar_contrasena?: string;

  /**
   * ID del departamento al que pertenece el usuario
   */
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  @IsInt({ message: 'El ID del departamento debe ser un número entero' })
  id_departamento!: number;

  /**
   * Rol del usuario en el sistema
   * Valores permitidos: administrador, responsable, usuario_interno, usuario_externo
   */
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsString({ message: 'El rol debe ser un texto' })
  @IsIn(['administrador', 'responsable', 'usuario_interno', 'usuario_externo'], {
    message: 'El rol debe ser: administrador, responsable, usuario_interno o usuario_externo'
  })
  rol!: string;
}