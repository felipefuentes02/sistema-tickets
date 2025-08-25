import { Module } from '@nestjs/common';
import { DatosMaestrosController } from './datos-maestros.controller';
import { DatosMaestrosService } from './datos-maestros.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Módulo para gestión de datos maestros
 * Incluye departamentos, prioridades y estados del sistema
 */
@Module({
  imports: [
    PrismaModule // Importar acceso a base de datos
  ],
  controllers: [
    DatosMaestrosController // Controller para endpoints de datos maestros
  ],
  providers: [
    DatosMaestrosService // Servicio con lógica de negocio
  ],
  exports: [
    DatosMaestrosService // Exportar para usar en otros módulos
  ],
})
export class DatosMaestrosModule {}