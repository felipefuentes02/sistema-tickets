import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS para desarrollo
  app.enableCors({
    origin: 'http://localhost:8100', // URL del frontend Ionic
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Prefijo global para las rutas de API
  app.setGlobalPrefix('api');

  // Pipe de validación global
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
  console.log('Backend corriendo en http://localhost:3000');
}
bootstrap();