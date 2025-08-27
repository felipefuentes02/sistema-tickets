import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Interface para departamento - COMPATIBLE CON BD ACTUAL
 */
export interface DepartamentoDto {
  id_departamento: number;
  nombre_departamento: string;
  // Campos que NO están en la BD actual pero necesarios para el frontend
  descripcion?: string;
  activo?: boolean;
  responsable_principal?: string;
  usuarios_activos?: number;
}

/**
 * Interface para prioridad - COMPATIBLE CON BD ACTUAL
 */
export interface PrioridadDto {
  id_prioridad: number;
  nombre_prioridad: string;
  nivel: number;
  // Campos que NO están en la BD actual pero necesarios para el frontend
  color_hex?: string;
  tiempo_respuesta_horas: number;
}

/**
 * Interface para estado - COMPATIBLE CON BD ACTUAL
 */
export interface EstadoDto {
  id_estado: number;
  nombre_estado: string;
  // Campos que NO están en la BD actual pero necesarios para el frontend
  descripcion?: string;
  es_estado_final: boolean;
  color_hex?: string;
}

/**
 * Servicio para gestión de datos maestros - COMPATIBLE CON BD ACTUAL
 * Se adapta a la estructura real de la base de datos
 */
@Injectable()
export class DatosMaestrosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los departamentos (simulando campos faltantes)
   * @returns Promise<DepartamentoDto[]> - Lista de departamentos
   */
  async obtenerDepartamentos(): Promise<DepartamentoDto[]> {
    try {
      console.log('📁 Obteniendo lista de departamentos (BD actual)');

      const departamentos = await this.prisma.departamentos.findMany({
        orderBy: {
          nombre_departamento: 'asc'
        }
      });

      console.log(`✅ ${departamentos.length} departamentos obtenidos de BD actual`);

      return departamentos.map(dept => ({
        id_departamento: dept.id_departamento,
        nombre_departamento: dept.nombre_departamento,
        // Simular campos que no están en la BD actual
        descripcion: this.obtenerDescripcionDepartamento(dept.nombre_departamento),
        activo: true, // Asumir que todos están activos por ahora
        responsable_principal: undefined,
        usuarios_activos: undefined
      }));

    } catch (error) {
      console.error('❌ Error al obtener departamentos:', error);
      throw error;
    }
  }

  /**
   * Obtener departamento por ID
   * @param id - ID del departamento
   * @returns Promise<DepartamentoDto> - Departamento encontrado
   */
  async obtenerDepartamentoPorId(id: number): Promise<DepartamentoDto> {
    try {
      console.log(`🔍 Buscando departamento ID: ${id}`);

      const departamento = await this.prisma.departamentos.findUnique({
        where: { id_departamento: id }
      });

      if (!departamento) {
        throw new NotFoundException(`Departamento con ID ${id} no encontrado`);
      }

      console.log(`✅ Departamento ${id} encontrado: ${departamento.nombre_departamento}`);

      return {
        id_departamento: departamento.id_departamento,
        nombre_departamento: departamento.nombre_departamento,
        descripcion: this.obtenerDescripcionDepartamento(departamento.nombre_departamento),
        activo: true
      };

    } catch (error) {
      console.error(`❌ Error al obtener departamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todas las prioridades (simulando campos faltantes)
   * @returns Promise<PrioridadDto[]> - Lista de prioridades
   */
  async obtenerPrioridades(): Promise<PrioridadDto[]> {
    try {
      console.log('⚡ Obteniendo lista de prioridades (BD actual)');

      const prioridades = await this.prisma.prioridades.findMany({
        orderBy: {
          nivel: 'asc'
        }
      });

      console.log(`✅ ${prioridades.length} prioridades obtenidas de BD actual`);

      return prioridades.map(prioridad => ({
        id_prioridad: prioridad.id_prioridad,
        nombre_prioridad: prioridad.nombre_prioridad,
        nivel: prioridad.nivel,
        // Simular campos que no están en la BD actual
        color_hex: this.obtenerColorPrioridad(prioridad.nivel),
        tiempo_respuesta_horas: this.calcularTiempoRespuestaEsperado(prioridad.nivel)
      }));

    } catch (error) {
      console.error('❌ Error al obtener prioridades:', error);
      throw error;
    }
  }

  /**
   * Obtener prioridad por ID
   * @param id - ID de la prioridad
   * @returns Promise<PrioridadDto> - Prioridad encontrada
   */
  async obtenerPrioridadPorId(id: number): Promise<PrioridadDto> {
    try {
      console.log(`🔍 Buscando prioridad ID: ${id}`);

      const prioridad = await this.prisma.prioridades.findUnique({
        where: { id_prioridad: id }
      });

      if (!prioridad) {
        throw new NotFoundException(`Prioridad con ID ${id} no encontrada`);
      }

      console.log(`✅ Prioridad ${id} encontrada: ${prioridad.nombre_prioridad}`);

      return {
        id_prioridad: prioridad.id_prioridad,
        nombre_prioridad: prioridad.nombre_prioridad,
        nivel: prioridad.nivel,
        color_hex: this.obtenerColorPrioridad(prioridad.nivel),
        tiempo_respuesta_horas: this.calcularTiempoRespuestaEsperado(prioridad.nivel)
      };

    } catch (error) {
      console.error(`❌ Error al obtener prioridad ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todos los estados de ticket (simulando campos faltantes)
   * @returns Promise<EstadoDto[]> - Lista de estados
   */
  async obtenerEstados(): Promise<EstadoDto[]> {
    try {
      console.log('🔄 Obteniendo lista de estados (BD actual)');

      const estados = await this.prisma.estados_ticket.findMany({
        orderBy: {
          id_estado: 'asc'
        }
      });

      console.log(`✅ ${estados.length} estados obtenidos de BD actual`);

      return estados.map(estado => ({
        id_estado: estado.id_estado,
        nombre_estado: estado.nombre_estado,
        // Simular campos que no están en la BD actual
        descripcion: this.obtenerDescripcionEstado(estado.nombre_estado),
        es_estado_final: this.esEstadoFinal(estado.id_estado),
        color_hex: this.obtenerColorEstado(estado.nombre_estado)
      }));

    } catch (error) {
      console.error('❌ Error al obtener estados:', error);
      throw error;
    }
  }

  /**
   * Obtener estado por ID
   * @param id - ID del estado
   * @returns Promise<EstadoDto> - Estado encontrado
   */
  async obtenerEstadoPorId(id: number): Promise<EstadoDto> {
    try {
      console.log(`🔍 Buscando estado ID: ${id}`);

      const estado = await this.prisma.estados_ticket.findUnique({
        where: { id_estado: id }
      });

      if (!estado) {
        throw new NotFoundException(`Estado con ID ${id} no encontrado`);
      }

      console.log(`✅ Estado ${id} encontrado: ${estado.nombre_estado}`);

      return {
        id_estado: estado.id_estado,
        nombre_estado: estado.nombre_estado,
        descripcion: this.obtenerDescripcionEstado(estado.nombre_estado),
        es_estado_final: this.esEstadoFinal(estado.id_estado),
        color_hex: this.obtenerColorEstado(estado.nombre_estado)
      };

    } catch (error) {
      console.error(`❌ Error al obtener estado ${id}:`, error);
      throw error;
    }
  }

  /**
   * Validar que un departamento existe
   * @param idDepartamento - ID del departamento
   * @returns Promise<boolean> - True si existe
   */
  async validarDepartamentoActivo(idDepartamento: number): Promise<boolean> {
    try {
      const departamento = await this.prisma.departamentos.findUnique({
        where: { id_departamento: idDepartamento }
      });

      const esValido = !!departamento;
      console.log(`🔍 Validación departamento ${idDepartamento}: ${esValido ? 'VÁLIDO' : 'INVÁLIDO'}`);

      return esValido;

    } catch (error) {
      console.error(`❌ Error al validar departamento ${idDepartamento}:`, error);
      return false;
    }
  }

  /**
   * Validar que una prioridad es válida
   * @param idPrioridad - ID de la prioridad
   * @returns Promise<boolean> - True si la prioridad es válida
   */
  async validarPrioridad(idPrioridad: number): Promise<boolean> {
    try {
      const prioridad = await this.prisma.prioridades.findUnique({
        where: { id_prioridad: idPrioridad }
      });

      const esValida = !!prioridad;
      console.log(`🔍 Validación prioridad ${idPrioridad}: ${esValida ? 'VÁLIDA' : 'INVÁLIDA'}`);

      return esValida;

    } catch (error) {
      console.error(`❌ Error al validar prioridad ${idPrioridad}:`, error);
      return false;
    }
  }

  /**
   * Obtener estadísticas básicas del sistema
   * @returns Promise con estadísticas generales
   */
  async obtenerEstadisticasGenerales(): Promise<{
    total_departamentos: number;
    departamentos_activos: number;
    total_prioridades: number;
    total_estados: number;
  }> {
    try {
      console.log('📊 Calculando estadísticas generales del sistema');

      const [
        totalDepartamentos,
        totalPrioridades,
        totalEstados
      ] = await Promise.all([
        this.prisma.departamentos.count(),
        this.prisma.prioridades.count(),
        this.prisma.estados_ticket.count()
      ]);

      const estadisticas = {
        total_departamentos: totalDepartamentos,
        departamentos_activos: totalDepartamentos, // Asumir que todos están activos
        total_prioridades: totalPrioridades,
        total_estados: totalEstados
      };

      console.log('✅ Estadísticas generales calculadas:', estadisticas);

      return estadisticas;

    } catch (error) {
      console.error('❌ Error al calcular estadísticas:', error);
      throw error;
    }
  }

  // ============ MÉTODOS AUXILIARES PRIVADOS ============

  /**
   * Obtener descripción simulada para departamento
   */
  private obtenerDescripcionDepartamento(nombre: string): string {
    const descripciones: { [key: string]: string } = {
      'Administración': 'Departamento de administración y recursos humanos',
      'Comercial': 'Departamento comercial y ventas',
      'Informática': 'Departamento de tecnología y sistemas',
      'Operaciones': 'Departamento de operaciones y logística'
    };
    return descripciones[nombre] || `Departamento de ${nombre.toLowerCase()}`;
  }

  /**
   * Obtener color simulado para prioridad
   */
  private obtenerColorPrioridad(nivel: number): string {
    switch (nivel) {
      case 1: return '#dc3545'; // Rojo para Alta
      case 2: return '#ffc107'; // Amarillo para Media
      case 3: return '#28a745'; // Verde para Baja
      default: return '#6c757d'; // Gris por defecto
    }
  }

  /**
   * Obtener descripción simulada para estado
   */
  private obtenerDescripcionEstado(nombre: string): string {
    const descripciones: { [key: string]: string } = {
      'Nuevo': 'Ticket recién creado',
      'En Progreso': 'Ticket siendo trabajado',
      'Escalado': 'Ticket escalado a supervisor',
      'Resuelto': 'Ticket resuelto, pendiente de cierre',
      'Cerrado': 'Ticket cerrado completamente'
    };
    return descripciones[nombre] || `Estado: ${nombre}`;
  }

  /**
   * Obtener color simulado para estado
   */
  private obtenerColorEstado(nombre: string): string {
    const colores: { [key: string]: string } = {
      'Nuevo': '#007bff',
      'En Progreso': '#ffc107',
      'Escalado': '#fd7e14',
      'Resuelto': '#28a745',
      'Cerrado': '#6c757d'
    };
    return colores[nombre] || '#343a40';
  }

  /**
   * Calcular tiempo de respuesta esperado basado en nivel de prioridad
   * @param nivel - Nivel de prioridad (1=Alta, 2=Media, 3=Baja)
   * @returns number - Horas de tiempo de respuesta esperado
   */
  private calcularTiempoRespuestaEsperado(nivel: number): number {
    switch (nivel) {
      case 1: return 4;   // Prioridad Alta: 4 horas
      case 2: return 24;  // Prioridad Media: 1 día
      case 3: return 72;  // Prioridad Baja: 3 días
      default: return 24; // Por defecto 1 día
    }
  }

  /**
   * Determinar si un estado es final
   * @param idEstado - ID del estado
   * @returns boolean - True si es estado final
   */
  private esEstadoFinal(idEstado: number): boolean {
    // Estados finales típicos: 4=Resuelto, 5=Cerrado
    const estadosFinales = [4, 5, 6, 7, 8]; // Adaptar según tu BD
    return estadosFinales.includes(idEstado);
  }
}