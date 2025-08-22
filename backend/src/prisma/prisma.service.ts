import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Servicio de Prisma
 * Maneja la conexión y operaciones con la base de datos PostgreSQL
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  
  /**
   * Inicializa la conexión a la base de datos al cargar el módulo
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Conectado a la base de datos PostgreSQL');
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Desconectado de la base de datos PostgreSQL');
  }
}