import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { AdminModule } from './admin/admin.module';
import { DatosMaestrosModule } from './datos-maestros/datos-maestros.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Módulo raíz de la aplicación
 * Configura todos los módulos principales del sistema de tickets
 */
@Module({
  imports: [
    // Configuración global del entorno
    ConfigModule.forRoot({
      isGlobal: true, // Hace que la configuración esté disponible globalmente
      envFilePath: '.env', // Archivo de configuración
    }),
    
    // Configuración global de JWT
    JwtModule.register({
      global: true, // Hace que JWT esté disponible globalmente
      secret: process.env.JWT_SECRET || 'secreto-super-secreto-cambiar-en-produccion',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      },
    }),
    
    // Módulos de funcionalidad
    PrismaModule,       // Gestión de base de datos
    AuthModule,         // Autenticación y autorización
    TicketsModule,      // Gestión principal de tickets
    AdminModule,        // Administración del sistema
    DatosMaestrosModule, // Datos de referencia (departamentos, prioridades, estados)
  ],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}