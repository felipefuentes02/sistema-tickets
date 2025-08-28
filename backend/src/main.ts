import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * Función principal de arranque del servidor
 * Configura y arranca la aplicación NestJS
 */
async function bootstrap() {
  try {
    // Crear instancia de logger para seguimiento
    const logger = new Logger('Bootstrap');
    
    // Crear aplicación NestJS
    const app = await NestFactory.create(AppModule);
    
    // Obtener servicio de configuración
    const configService = app.get(ConfigService);
    
    // Configurar pipe global de validación
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      }
    }));
    
    // Configurar CORS para desarrollo
    app.enableCors({
      origin: ['http://localhost:4200', 'http://localhost:8100'], // Angular y Ionic
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
    
    // Configurar prefijo global para API
    app.setGlobalPrefix('api');
    
    // Configuración del puerto y host
    const puerto = configService.get<number>('PORT') || 3000;
    const host = configService.get<string>('HOST') || '0.0.0.0';
    
    // Iniciar servidor
    await app.listen(puerto, host);
    
    // Logs informativos de arranque
    logger.log('🚀 ========================================');
    logger.log('🚀 SISTEMA TICKETS - BACKEND');
    logger.log('🚀 ========================================');
    logger.log(`🌐 Servidor ejecutándose en: http://${host}:${puerto}`);
    logger.log(`📡 API disponible en: http://${host}:${puerto}/api`);
    logger.log('📦 Módulos cargados:');
    logger.log('   - ✅ AuthModule (autenticación)');
    logger.log('   - ✅ TicketsModule (gestión de tickets)');
    logger.log('   - ✅ AdminModule (administración)');
    logger.log('   - ✅ DatosMaestrosModule (datos de referencia)');
    logger.log('   - ✅ PrismaModule (base de datos)');
    logger.log('🔒 Seguridad:');
    logger.log('   - ✅ JWT configurado');
    logger.log('   - ✅ Validación global activada');
    logger.log('   - ✅ CORS configurado para desarrollo');
    logger.log('🗄️ Base de datos:');
    logger.log('   - ✅ PostgreSQL con Prisma ORM');
    logger.log('🚀 ========================================');
    
    // Información de entorno
    const entorno = configService.get<string>('NODE_ENV') || 'development';
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    logger.log(`🔧 Entorno: ${entorno}`);
    logger.log(`🔐 JWT Secret: ${jwtSecret ? '✅ Configurado' : '❌ Usando valor por defecto'}`);
    
    if (entorno === 'development') {
      logger.warn('⚠️  MODO DESARROLLO - No usar en producción');
    }
    
    logger.log('🚀 ¡Sistema listo para recibir solicitudes!');
    
  } catch (error) {
    const logger = new Logger('Bootstrap');
    logger.error('💥 Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Ejecutar función de arranque
bootstrap();