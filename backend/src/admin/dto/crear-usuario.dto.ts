import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(25)
  primer_nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(25)
  segundo_nombre?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(25)
  primer_apellido: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(25)
  segundo_apellido: string;

  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(12)
  rut: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  contrasena: string;

  @IsString()
  @IsOptional()
  confirmar_contrasena?: string;

  @IsNumber()
  @IsNotEmpty()
  id_departamento: number;

  @IsString()
  @IsNotEmpty()
  rol: string;
}
