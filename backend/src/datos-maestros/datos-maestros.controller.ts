import { 
  Controller, 
  Get, 
  Param, 
  ParseIntPipe,
  HttpException,
  HttpStatus,
  NotFoundException
} from '@nestjs/common';
import { DatosMaestrosService, DepartamentoDto, PrioridadDto, EstadoDto } from './datos-maestros.service';

/**
 * Interface para respuestas del API
 * Debe coincidir con la interface que está en el archivo separado
 */
interface RespuestaApi<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
  timestamp?: string;
}

/**
 * Controlador para datos maestros del sistema
 * Proporciona endpoints para obtener departamentos, prioridades y estados
 * Ruta base: /api/datos-maestros
 */
@Controller('api/datos-maestros')
export class DatosMaestrosController {
  constructor(private readonly datosMaestrosService: DatosMaestrosService) {}

  /**
   * Obtener todos los departamentos activos
   * GET /api/datos-maestros/departamentos
   * @returns Promise<RespuestaApi<DepartamentoDto[]>>
   */
  @Get('departamentos')
  async obtenerDepartamentos(): Promise<RespuestaApi<DepartamentoDto[]>> {
    try {
      console.log('📥 GET /api/datos-maestros/departamentos');

      const departamentos = await this.datosMaestrosService.obtenerDepartamentos();
      
      return {
        success: true,
        data: departamentos,
        message: `${departamentos.length} departamentos obtenidos correctamente`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error en GET /api/datos-maestros/departamentos:', error);
      
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener departamentos',
        error: error.message,
        timestamp: new Date().toISOString()
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener departamento específico por ID
   * GET /api/datos-maestros/departamentos/:id
   * @param id - ID del departamento
   * @returns Promise<RespuestaApi<DepartamentoDto>>
   */
  @Get('departamentos/:id')
  async obtenerDepartamentoPorId(@Param('id', ParseIntPipe) id: number): Promise<RespuestaApi<DepartamentoDto>> {
    try {
      console.log(`📥 GET /api/datos-maestros/departamentos/${id}`);

      const departamento = await this.datosMaestrosService.obtenerDepartamentoPorId(id);
      
      return {
        success: true,
        data: departamento,
        message: 'Departamento obtenido correctamente',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error en GET /api/datos-maestros/departamentos/${id}:`, error);
      
      const status = error instanceof NotFoundException ? 
        HttpStatus.NOT_FOUND : 
        HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException({
        success: false,
        data: null,
        message: error.message || 'Error al obtener departamento',
        error: error.message,
        timestamp: new Date().toISOString()
      }, status);
    }
  }

  /**
   * Obtener todas las prioridades
   * GET /api/datos-maestros/prioridades
   * @returns Promise<RespuestaApi<PrioridadDto[]>>
   */
  @Get('prioridades')
  async obtenerPrioridades(): Promise<RespuestaApi<PrioridadDto[]>> {
    try {
      console.log('📥 GET /api/datos-maestros/prioridades');

      const prioridades = await this.datosMaestrosService.obtenerPrioridades();
      
      return {
        success: true,
        data: prioridades,
        message: `${prioridades.length} prioridades obtenidas correctamente`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error en GET /api/datos-maestros/prioridades:', error);
      
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener prioridades',
        error: error.message,
        timestamp: new Date().toISOString()
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener prioridad específica por ID
   * GET /api/datos-maestros/prioridades/:id
   * @param id - ID de la prioridad
   * @returns Promise<RespuestaApi<PrioridadDto>>
   */
  @Get('prioridades/:id')
  async obtenerPrioridadPorId(@Param('id', ParseIntPipe) id: number): Promise<RespuestaApi<PrioridadDto>> {
    try {
      console.log(`📥 GET /api/datos-maestros/prioridades/${id}`);

      const prioridad = await this.datosMaestrosService.obtenerPrioridadPorId(id);
      
      return {
        success: true,
        data: prioridad,
        message: 'Prioridad obtenida correctamente',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error en GET /api/datos-maestros/prioridades/${id}:`, error);
      
      const status = error instanceof NotFoundException ? 
        HttpStatus.NOT_FOUND : 
        HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException({
        success: false,
        data: null,
        message: error.message || 'Error al obtener prioridad',
        error: error.message,
        timestamp: new Date().toISOString()
      }, status);
    }
  }

  /**
   * Obtener todos los estados de ticket
   * GET /api/datos-maestros/estados
   * @returns Promise<RespuestaApi<EstadoDto[]>>
   */
  @Get('estados')
  async obtenerEstados(): Promise<RespuestaApi<EstadoDto[]>> {
    try {
      console.log('📥 GET /api/datos-maestros/estados');

      const estados = await this.datosMaestrosService.obtenerEstados();
      
      return {
        success: true,
        data: estados,
        message: `${estados.length} estados obtenidos correctamente`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error en GET /api/datos-maestros/estados:', error);
      
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener estados',
        error: error.message,
        timestamp: new Date().toISOString()
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener estado específico por ID
   * GET /api/datos-maestros/estados/:id
   * @param id - ID del estado
   * @returns Promise<RespuestaApi<EstadoDto>>
   */
  @Get('estados/:id')
  async obtenerEstadoPorId(@Param('id', ParseIntPipe) id: number): Promise<RespuestaApi<EstadoDto>> {
    try {
      console.log(`📥 GET /api/datos-maestros/estados/${id}`);

      const estado = await this.datosMaestrosService.obtenerEstadoPorId(id);
      
      return {
        success: true,
        data: estado,
        message: 'Estado obtenido correctamente',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error en GET /api/datos-maestros/estados/${id}:`, error);
      
      const status = error instanceof NotFoundException ? 
        HttpStatus.NOT_FOUND : 
        HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException({
        success: false,
        data: null,
        message: error.message || 'Error al obtener estado',
        error: error.message,
        timestamp: new Date().toISOString()
      }, status);
    }
  }

  /**
   * Obtener estadísticas generales del sistema
   * GET /api/datos-maestros/estadisticas
   * @returns Promise<RespuestaApi> - Estadísticas del sistema
   */
  @Get('estadisticas')
  async obtenerEstadisticasGenerales(): Promise<RespuestaApi<any>> {
    try {
      console.log('📥 GET /api/datos-maestros/estadisticas');

      const estadisticas = await this.datosMaestrosService.obtenerEstadisticasGenerales();
      
      return {
        success: true,
        data: estadisticas,
        message: 'Estadísticas obtenidas correctamente',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error en GET /api/datos-maestros/estadisticas:', error);
      
      throw new HttpException({
        success: false,
        data: null,
        message: 'Error al obtener estadísticas',
        error: error.message,
        timestamp: new Date().toISOString()
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Endpoint para validar múltiples datos de entrada (para formularios)
   * GET /api/datos-maestros/validar/:departamento/:prioridad
   * @param idDepartamento - ID del departamento a validar
   * @param idPrioridad - ID de la prioridad a validar
   * @returns Promise<RespuestaApi> - Resultado de validaciones
   */
  @Get('validar/:departamento/:prioridad')
  async validarDatosFormulario(
    @Param('departamento', ParseIntPipe) idDepartamento: number,
    @Param('prioridad', ParseIntPipe) idPrioridad: number
  ): Promise<RespuestaApi<{
    departamento_valido: boolean;
    prioridad_valida: boolean;
    puede_crear_ticket: boolean;
  }>> {
    try {
      console.log(`📥 GET /api/datos-maestros/validar/${idDepartamento}/${idPrioridad}`);

      const [departamentoValido, prioridadValida] = await Promise.all([
        this.datosMaestrosService.validarDepartamentoActivo(idDepartamento),
        this.datosMaestrosService.validarPrioridad(idPrioridad)
      ]);

      const puedeCrearTicket = departamentoValido && prioridadValida;

      const resultado = {
        departamento_valido: departamentoValido,
        prioridad_valida: prioridadValida,
        puede_crear_ticket: puedeCrearTicket
      };

      console.log('✅ Validación completada:', resultado);
      
      return {
        success: true,
        data: resultado,
        message: puedeCrearTicket ? 
          'Datos válidos para crear ticket' : 
          'Algunos datos no son válidos',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error en validación de datos:', error);
      
      throw new HttpException({
        success: false,
        data: {
          departamento_valido: false,
          prioridad_valida: false,
          puede_crear_ticket: false
        },
        message: 'Error al validar datos',
        error: error.message,
        timestamp: new Date().toISOString()
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}