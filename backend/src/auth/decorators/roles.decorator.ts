import { SetMetadata } from '@nestjs/common';

/**
 * Clave para almacenar los metadatos de roles
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador para especificar qué roles pueden acceder a un endpoint
 * 
 * @param roles - Lista de roles permitidos
 * @returns Decorador que establece los metadatos de roles
 * 
 * @example
 * ```typescript
 * @Roles('administrador')
 * @Get('usuarios')
 * async obtenerUsuarios() {
 *   // Solo usuarios con rol 'administrador' pueden acceder
 * }
 * 
 * @Roles('administrador', 'tecnico')
 * @Get('tickets')
 * async obtenerTickets() {
 *   // Usuarios con rol 'administrador' o 'tecnico' pueden acceder
 * }
 * ```
 */
export const Roles = (...roles: string[]) => {
  console.log(`🏷️ Roles Decorator: Configurando roles permitidos: ${roles.join(', ')}`);
  return SetMetadata(ROLES_KEY, roles);
};