import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Método para validar usuario y contraseña (simplificado)
  async validarUsuario(correo: string, contrasena: string) {
    console.log('Validando usuario:', correo);

    try {
      // Buscar usuario por correo SIN relaciones por ahora
      const usuario = await this.prismaService.usuarios.findUnique({
        where: { correo },
      });

      if (!usuario) {
        console.log('Usuario no encontrado:', correo);
        return null;
      }

      console.log('Usuario encontrado:', {
        id: usuario.id_usuario,
        correo: usuario.correo,
        rol: usuario.id_rol,
      });

      // Verificar contraseña
      const esContrasenaValida = await bcrypt.compare(
        contrasena,
        usuario.hash_contrasena,
      );

      if (!esContrasenaValida) {
        console.log('Contraseña inválida para usuario:', correo);
        return null;
      }

      console.log('Contraseña válida para usuario:', correo);
      return usuario;
    } catch (error) {
      console.error('Error al validar usuario:', error);
      return null;
    }
  }

  // Método principal de login
  async login(loginDto: LoginDto) {
    console.log('AuthService login llamado con:', loginDto);

    const usuario = await this.validarUsuario(
      loginDto.correo,
      loginDto.contrasena,
    );
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    console.log('Usuario validado:', usuario);

    const payload = {
      sub: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.id_rol,
    };

    const token = this.jwtService.sign(payload);
    console.log('Token generado');

    const response = {
      access_token: token,
      user: {
        id_usuario: usuario.id_usuario,
        primer_nombre: usuario.primer_nombre,
        segundo_nombre: usuario.segundo_nombre,
        primer_apellido: usuario.primer_apellido,
        segundo_apellido: usuario.segundo_apellido,
        correo: usuario.correo,
        id_rol: usuario.id_rol,
        id_departamento: usuario.id_departamento,
      },
    };

    console.log(
      'Respuesta final del login:',
      JSON.stringify(response, null, 2),
    );
    return response;
  }
}
