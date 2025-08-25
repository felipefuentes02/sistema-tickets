import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Interface para departamento
 */
export interface DepartamentoDto {
  id_departamento: number;
  nombre_departamento: string;
  descripcion?: string;
  activo: boolean;
  responsable_principal?: string;
  usuarios_activos?: number;
}

/**
 * Interface para prioridad
 */
export interface PrioridadDto {
  id_prioridad: number;
  nombre_prioridad: string;
  nivel: number;
  color_hex?: string;
  tiempo_respuesta_horas: number;
}

/**
 * Interface para estado
 */
export interface EstadoDto {
  id_estado: number;
  nombre_estado: string;
  descripcion?: string;
  es_estado_final: boolean;
  color_hex?: string;
}

/**
 * Servicio para gestión de datos maestros (departamentos, prioridades, estados)
 * Complementa el TicketsService con datos de referencia necesarios
 */
@Injectable()
export class DatosMaestrosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los departamentos activos
   * @returns Promise<DepartamentoDto[]> - Lista de departamentos
   */
  async obtenerDepartamentos(): Promise<DepartamentoDto[]> {
    try {
      console.log('📁 Obteniendo lista de departamentos activos');

      const departamentos = await this.prisma.departamentos.findMany({
        where: {
          activo: true
        },
        orderBy: {
          nombre_departamento: 'asc'
        }
      });

      console.log(`✅ ${departamentos.length} departamentos obtenidos`);

      return departamentos.map(dept => ({
        id_departamento: dept.id_departamento,
        nombre_departamento: dept.nombre_departamento,
        descripcion: dept.descripcion,
        activo: dept.activo,
        // TODO: Agregar campos relacionados cuando estén disponibles
        // responsable_principal: dept.responsable_principal?.nombre,
        // usuarios_activos: dept._count?.usuarios
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
        descripcion: departamento.descripcion,
        activo: departamento.activo
      };

    } catch (error) {
      console.error(`❌ Error al obtener departamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todas las prioridades
   * @returns Promise<PrioridadDto[]> - Lista de prioridades
   */
  async obtenerPrioridades(): Promise<PrioridadDto[]> {
    try {
      console.log('⚡ Obteniendo lista de prioridades');

      const prioridades = await this.prisma.prioridades.findMany({
        orderBy: {
          nivel: 'asc' // Ordenar por nivel (1=Alta, 2=Media, 3=Baja)
        }
      });

      console.log(`✅ ${prioridades.length} prioridades obtenidas`);

      return prioridades.map(prioridad => ({
        id_prioridad: prioridad.id_prioridad,
        nombre_prioridad: prioridad.nombre_prioridad,
        nivel: prioridad.nivel,
        color_hex: prioridad.color_hex,
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
        color_hex: prioridad.color_hex,
        tiempo_respuesta_horas: this.calcularTiempoRespuestaEsperado(prioridad.nivel)
      };

    } catch (error) {
      console.error(`❌ Error al obtener prioridad ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todos los estados de ticket
   * @returns Promise<EstadoDto[]> - Lista de estados
   */
  async obtenerEstados(): Promise<EstadoDto[]> {
    try {
      console.log('🔄 Obteniendo lista de estados');

      const estados = await this.prisma.estados.findMany({
        orderBy: {
          id_estado: 'asc'
        }
      });

      console.log(`✅ ${estados.length} estados obtenidos`);

      return estados.map(estado => ({
        id_estado: estado.id_estado,
        nombre_estado: estado.nombre_estado,
        descripcion: estado.descripcion,
        es_estado_final: this.esEstadoFinal(estado.id_estado),
        color_hex: estado.color_hex
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

      const estado = await this.prisma.estados.findUnique({
        where: { id_estado: id }
      });

      if (!estado) {
        throw new NotFoundException(`Estado con ID ${id} no encontrado`);
      }

      console.log(`✅ Estado ${id} encontrado: ${estado.nombre_estado}`);

      return {
        id_estado: estado.id_estado,
        nombre_estado: estado.nombre_estado,
        descripcion: estado.descripcion,
        es_estado_final: this.esEstadoFinal(estado.id_estado),
        color_hex: estado.color_hex
      };

    } catch (error) {
      console.error(`❌ Error al obtener estado ${id}:`, error);
      throw error;
    }
  }

  /**
   * Validar que un departamento puede recibir tickets
   * @param idDepartamento - ID del departamento
   * @returns Promise<boolean> - True si puede recibir tickets
   */
  async validarDepartamentoActivo(idDepartamento: number): Promise<boolean> {
    try {
      const departamento = await this.prisma.departamentos.findUnique({
        where: { 
          id_departamento: idDepartamento,
          activo: true
        }
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
        departamentosActivos,
        totalPrioridades,
        totalEstados
      ] = await Promise.all([
        this.prisma.departamentos.count(),
        this.prisma.departamentos.count({ where: { activo: true } }),
        this.prisma.prioridades.count(),
        this.prisma.estados.count()
      ]);

      const estadisticas = {
        total_departamentos: totalDepartamentos,
        departamentos_activos: departamentosActivos,
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
   * Calcular tiempo de respuesta esperado basado en nivel de prioridad
   * @param nivel - Nivel de prioridad (1=Alta, 2=Media, 3=Baja)
   * @returns number - Horas de tiempo de respuesta esperado
   */
  private calcularTiempoRespuestaEsperado(nivel: number): number {
    switch (nivel) {
      case 1: // Prioridad Alta
        return 4; // 4 horas
      case 2: // Prioridad Media
        return 24; // 1 día (24 horas)
      case 3: // Prioridad Baja
        return 72; // 3 días (72 horas)
      default:
        return 24; // Por defecto 1 día
    }
  }

  /**
   * Determinar si un estado es final (no permite más cambios)
   * @param idEstado - ID del estado
   * @returns boolean - True si es estado final
   */
  private esEstadoFinal(idEstado: number): boolean {
    // Estados finales: 4=Resuelto, 5=Cerrado, 6=Cancelado
    const estadosFinales = [4, 5, 6];
    return estadosFinales.includes(idEstado);
  }
}