import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * Función principal para inicializar la aplicación NestJS
 * Configura validación global, CORS, y otros middlewares
 */
async function bootstrap() {
  // Crear instancia de la aplicación
  const app = await NestFactory.create(AppModule);
<<<<<<< HEAD

  // Configurar CORS para desarrollo
=======
  
  // Obtener servicio de configuración
  const configService = app.get(ConfigService);
  
  // Crear logger
  const logger = new Logger('Bootstrap');

  // ============ CONFIGURACIÓN DE VALIDACIÓN GLOBAL ============
  /**
   * Pipe de validación global para todos los DTOs
   * Valida automáticamente todos los datos de entrada
   */
  app.useGlobalPipes(
    new ValidationPipe({
      // Transformar automáticamente los datos al tipo esperado
      transform: true,
      
      // Eliminar propiedades que no están en el DTO
      whitelist: true,
      
      // Lanzar error si hay propiedades no permitidas
      forbidNonWhitelisted: true,
      
      // Mostrar errores detallados de validación
      disableErrorMessages: false,
      
      // Validar cada elemento en arrays
      validateCustomDecorators: true,
      
      // Configuración de mensajes de error
      errorHttpStatusCode: 422,
      
      // Transformar strings a números cuando sea necesario
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // ============ CONFIGURACIÓN DE CORS ============
  /**
   * Configuración de CORS para permitir conexiones desde el frontend
   */
>>>>>>> 776b6d3d4b4aea9daffab5f570b29bdac448455d
  app.enableCors({
    origin: [
      'http://localhost:8100', // Ionic dev server
      'http://localhost:4200', // Angular dev server (si se usa)
      'http://127.0.0.1:8100', // Alternativa local
      'http://127.0.0.1:4200', // Alternativa local
      // TODO: Agregar dominio de producción cuando esté disponible
      // 'https://tu-dominio-produccion.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true, // Permitir cookies y headers de autorización
    optionsSuccessStatus: 200 // Soporte para navegadores legacy
  });

  // ============ CONFIGURACIÓN DE PREFIJO GLOBAL ============
  /**
   * Establecer prefijo global para todas las rutas del API
   * Todas las rutas tendrán el prefijo /api
   */
  app.setGlobalPrefix('api', {
    exclude: [
      '/', // Ruta raíz sin prefijo
      '/health', // Health check sin prefijo
      '/docs' // Documentación sin prefijo (si se implementa)
    ]
  });

  // ============ CONFIGURACIÓN DEL PUERTO ============
  /**
   * Obtener puerto desde variables de entorno o usar 3000 por defecto
   */
  const puerto = configService.get<number>('PORT') || 3000;
  const host = configService.get<string>('HOST') || '0.0.0.0';

  // ============ INICIAR SERVIDOR ============
  await app.listen(puerto, host);

  // ============ LOGS DE INICIALIZACIÓN ============
  logger.log('🚀 ========================================');
  logger.log('🚀 IPLACEX TICKETS SYSTEM - BACKEND');
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
  
  // Información adicional sobre el entorno
  const entorno = configService.get<string>('NODE_ENV') || 'development';
  const jwtSecret = configService.get<string>('JWT_SECRET');
  
  logger.log(`🔧 Entorno: ${entorno}`);
  logger.log(`🔐 JWT Secret: ${jwtSecret ? '✅ Configurado' : '❌ Usando valor por defecto'}`);
  
  if (entorno === 'development') {
    logger.warn('⚠️  MODO DESARROLLO - No usar en producción');
  }

  logger.log('🚀 ¡Sistema listo para recibir solicitudes!');
}
<<<<<<< HEAD
bootstrap();
=======

// Inicializar la aplicación y manejar errores críticos
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Error crítico al inicializar la aplicación:', error);
  process.exit(1);
});
>>>>>>> 776b6d3d4b4aea9daffab5f570b29bdac448455d
