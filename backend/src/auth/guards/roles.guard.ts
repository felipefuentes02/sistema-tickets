import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard para verificar que el usuario tenga los roles necesarios
 * Debe usarse después del JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Verifica si el usuario tiene el rol necesario para acceder al endpoint
   * @param context - Contexto de ejecución de la petición
   * @returns boolean - true si tiene permisos, lanza excepción si no
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorador @Roles()
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles definidos, permitir acceso
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.usuario;

    // Verificar que el usuario esté disponible (debería estar por JwtAuthGuard)
    if (!usuario) {
      console.error('🚫 RolesGuard: Usuario no encontrado en request. ¿JwtAuthGuard ejecutado?');
      throw new ForbiddenException('Información de usuario no disponible');
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const tieneRolValido = rolesRequeridos.some(rol => 
      usuario.rol?.toLowerCase() === rol.toLowerCase()
    );

    if (!tieneRolValido) {
      console.log(`🚫 RolesGuard: Acceso denegado para ${usuario.correo}. ` +
                  `Rol actual: ${usuario.rol}, Roles requeridos: ${rolesRequeridos.join(', ')}`);
      
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesRequeridos.join(', ')}`
      );
    }

    console.log(`✅ RolesGuard: Acceso autorizado para ${usuario.correo} con rol ${usuario.rol}`);
    return true;
  }
}