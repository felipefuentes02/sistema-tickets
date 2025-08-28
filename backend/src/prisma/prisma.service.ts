import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  
  /**
   * Inicialización del módulo - establece conexión con la base de datos
   */
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Conectado a la base de datos PostgreSQL');
    } catch (error) {
      console.error('❌ Error al conectar con PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Destrucción del módulo - cierra conexión con la base de datos
   */
  async onModuleDestroy() {
    try {
      await this.$disconnect();
      console.log('🔌 Desconectado de la base de datos PostgreSQL');
    } catch (error) {
      console.error('❌ Error al desconectar de PostgreSQL:', error);
    }
  }
}