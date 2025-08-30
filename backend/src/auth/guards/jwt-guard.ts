import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Guard para verificar autenticación mediante JWT
 * Valida que el token sea válido y extraiga información del usuario
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Método principal que determina si se permite el acceso
   * @param context - Contexto de ejecución de la petición
   * @returns Promise<boolean> - true si está autenticado, false si no
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    try {
      // Extraer token del header Authorization
      const token = this.extraerTokenDeHeader(request);
      
      if (!token) {
        console.log('🔒 JwtAuthGuard: Token no encontrado en headers');
        throw new UnauthorizedException('Token de acceso requerido');
      }

      // Verificar y decodificar el token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'clave-secreta-desarrollo',
      });

      // Adjuntar información del usuario a la petición
      request['usuario'] = {
        id: payload.sub || payload.id,
        correo: payload.correo,
        rol: payload.rol,
        nombre: payload.nombre,
        id_departamento: payload.id_departamento,
      };

      console.log(`🔓 JwtAuthGuard: Usuario autenticado - ${payload.correo} (${payload.rol})`);
      return true;

    } catch (error) {
      console.error('🔒 JwtAuthGuard: Error de autenticación:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token inválido');
      } else if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado');
      } else if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new UnauthorizedException('Error de autenticación');
      }
    }
  }

  /**
   * Extrae el token JWT del header Authorization
   * @param request - Objeto de petición HTTP
   * @returns string | undefined - Token extraído o undefined si no existe
   */
  private extraerTokenDeHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return undefined;
    }

    // Verificar formato: "Bearer <token>"
    const [tipo, token] = authHeader.split(' ');
    
    if (tipo !== 'Bearer' || !token) {
      console.log('🔒 JwtAuthGuard: Formato de Authorization header incorrecto');
      return undefined;
    }

    return token;
  }
}