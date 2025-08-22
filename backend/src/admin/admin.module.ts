import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Módulo que agrupa todas las funcionalidades administrativas
 * Incluye gestión de usuarios, departamentos y métricas
 */
@Module({
  imports: [
    PrismaModule, // Importar módulo de Prisma para acceso a base de datos
  ],
  controllers: [
    AdminController, // Controlador para endpoints administrativos
  ],
  providers: [
    AdminService, // Servicio con lógica de negocio administrativa
  ],
  exports: [
    AdminService, // Exportar servicio para uso en otros módulos si es necesario
  ],
})
export class AdminModule {}