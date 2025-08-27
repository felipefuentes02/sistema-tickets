import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { AdminModule } from './admin/admin.module';
/**
 * Módulo principal de la aplicación
 * Configura todos los módulos y dependencias globales
 */
@Module({
  imports: [
    AdminModule,
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables estén disponibles globalmente
      envFilePath: '.env', // Archivo de variables de entorno
    }),

    // Configuración global de JWT
    JwtModule.register({
      global: true, // Hace que JWT esté disponible globalmente
      secret:
        process.env.JWT_SECRET || 'secreto-super-secreto-cambiar-en-produccion',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      },
    }),

    // Módulos de la aplicación
    PrismaModule, // Acceso a base de datos
    AuthModule, // Autenticación y autorización
    TicketsModule, // Gestión de tickets
    AdminModule, // Funcionalidades administrativas (NUEVO)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
