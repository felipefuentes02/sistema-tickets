import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from './guards/jwt-guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Módulo de autenticación que maneja login, JWT y autorización
 * Incluye guards para proteger rutas y verificar roles
 */
@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'clave-secreta-desarrollo',
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRES_IN || '8h' 
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtModule, // Exportar para que otros módulos puedan usar JwtService
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}