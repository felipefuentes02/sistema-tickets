import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { AdminModule } from './admin/admin.module';
import { DatosMaestrosModule } from './datos-maestros/datos-maestros.module';

/**
 * Módulo principal de la aplicación
 * Configura todos los módulos y dependencias globales
 * 
 * CAMBIOS REALIZADOS:
 * - ✅ Agregado DatosMaestrosModule para datos de referencia
 * - ✅ Configuración de JWT mejorada con variables de entorno
 * - ✅ Configuración global mejorada
 */
@Module({
  imports: [
    // ============ CONFIGURACIÓN DE ENTORNO ============
    /**
     * Configuración de variables de entorno
     * Carga el archivo .env y hace las variables disponibles globalmente
     */
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables estén disponibles globalmente
      envFilePath: '.env', // Archivo de variables de entorno
      cache: true, // Cache las variables para mejor rendimiento
    }),

    // ============ CONFIGURACIÓN DE JWT ============
    /**
     * Configuración global de JWT para autenticación
     * Utiliza variables de entorno para mayor seguridad
     */
    JwtModule.register({
      global: true, // Hace que JWT esté disponible globalmente
      secret: process.env.JWT_SECRET || 'secreto-super-secreto-cambiar-en-produccion',
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: process.env.JWT_ISSUER || 'iplacex-tickets-system',
        audience: process.env.JWT_AUDIENCE || 'iplacex-users'
      },
    }),

    // ============ MÓDULOS DE ACCESO A DATOS ============
    /**
     * Módulo de Prisma para acceso a base de datos PostgreSQL
     * Proporciona el PrismaService para todos los módulos
     */
    PrismaModule,

    // ============ MÓDULOS FUNCIONALES ============
    /**
     * Módulo de autenticación y autorización
     * Maneja login, logout, validación de tokens JWT
     */
    AuthModule,

    /**
     * Módulo de gestión de tickets
     * Funcionalidad principal del sistema
     */
    TicketsModule,

    /**
     * Módulo de administración
     * Gestión de usuarios, reportes y configuración
     */
    AdminModule,

    /**
     * ✅ NUEVO: Módulo de datos maestros
     * Gestión de departamentos, prioridades y estados
     * Proporciona datos de referencia para el sistema
     */
    DatosMaestrosModule,
  ],
  controllers: [
    // No controllers en el módulo principal
    // Todos los controllers están en sus respectivos módulos
  ],
  providers: [
    // No providers globales adicionales por ahora
    // Cada módulo maneja sus propios providers
  ],
})
export class AppModule {
  constructor() {
    console.log('🚀 AppModule inicializado correctamente');
    console.log('📦 Módulos cargados:');
    console.log('  - ConfigModule (variables de entorno)');
    console.log('  - JwtModule (autenticación)');
    console.log('  - PrismaModule (base de datos)');
    console.log('  - AuthModule (login/logout)');
    console.log('  - TicketsModule (gestión de tickets)');
    console.log('  - AdminModule (administración)');
    console.log('  - DatosMaestrosModule (departamentos/prioridades/estados)');
  }
}