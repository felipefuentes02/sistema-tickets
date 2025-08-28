import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
  HttpException,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CrearTicketDto } from './dto/crear-ticket.dto';
import { ActualizarTicketDto } from './dto/actualizar-ticket.dto';
import { RespuestaTicketDto } from './dto/respuesta-ticket.dto';

/**
 * Interfaz para respuesta estandarizada de la API
 */
interface RespuestaApi<T> {
  success: boolean;
  data: T | null;
  message: string;
  error?: string;
}

/**
 * Controlador para gestión de tickets
 * Maneja todas las operaciones CRUD para tickets del sistema
 * Ruta base: /api/tickets
 */
@Controller('api/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * Crear un nuevo ticket
   * POST /api/tickets
   * @param crearTicketDto - Datos del ticket a crear
   * @param req - Request con información del usuario (JWT)
   * @returns Promise<RespuestaApi<RespuestaTicketDto>>
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() crearTicketDto: CrearTicketDto, @Request() req: any): Promise<RespuestaApi<RespuestaTicketDto>> {
    try {
      console.log('📥 POST /api/tickets - Datos recibidos:', {
        ...crearTicketDto,
        timestamp: new Date().toISOString()
      });

      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal hasta implementar JWT completo
      
      // Crear el ticket utilizando el servicio
      const ticketCreado = await this.ticketsService.crear(crearTicketDto, idUsuario);
      
      console.log('✅ Ticket creado exitosamente:', {
        id: ticketCreado.id_ticket,
        numero: ticketCreado.numero_ticket,
        solicitante: idUsuario
      });

      return {
        success: true,
        data: ticketCreado,
        message: 'Ticket creado exitosamente'
      };

    } catch (error: any) {
      console.error('❌ Error en POST /api/tickets:', error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al crear el ticket';
      
      // Manejar errores específicos
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('departamento')) {
          message = 'Departamento no válido';
        } else if (error.message.includes('prioridad')) {
          message = 'Prioridad no válida';
        } else if (error.message.includes('validación')) {
          message = 'Datos de entrada inválidos';
        }
      }
      
      throw new HttpException({
        success: false,
        data: null,
        message,
        error: error.message || 'Error interno del servidor'
      }, status);
    }
  }

  /**
   * Obtener todos los tickets (admin) o filtrados por usuario (cliente)
   * GET /api/tickets
   * @param req - Request con información del usuario
   * @param incluirRelaciones - Si incluir datos relacionados
   * @returns Promise<RespuestaApi<RespuestaTicketDto[]>>
   */
  @Get()
  async obtenerTodos(
    @Request() req: any,
    @Query('incluir_relaciones') incluirRelaciones?: string
  ): Promise<RespuestaApi<RespuestaTicketDto[]>> {
    try {
      console.log('📥 GET /api/tickets - Parámetros:', {
        incluir_relaciones: incluirRelaciones,
        usuario_id: req.user?.sub || 'temporal',
        timestamp: new Date().toISOString()
      });

      // TODO: Implementar JWT - const { sub: idUsuario, rol } = req.user;
      const idUsuario = 1; // ID temporal
      const rol = 'administrador'; // Rol temporal
      
      const incluir = incluirRelaciones === 'true';
      let tickets: RespuestaTicketDto[];

      // Lógica de autorización según rol
      if (rol === 'administrador') {
        console.log('🔑 Usuario administrador - obteniendo todos los tickets');
        tickets = await this.ticketsService.obtenerTodos(undefined, incluir);
      } else {
        console.log('👤 Usuario cliente - obteniendo solo sus tickets');
        tickets = await this.ticketsService.obtenerTodos(idUsuario, incluir);
      }

      console.log(`✅ ${tickets.length} tickets obtenidos correctamente`);

      return {
        success: true,
        data: tickets,
        message: `${tickets.length} tickets obtenidos correctamente`
      };

    } catch (error: any) {
      console.error('❌ Error en GET /api/tickets:', error);
      
      throw new HttpException({
        success: false,
        data: null,
        message: 'Error al obtener tickets',
        error: error.message || 'Error interno del servidor'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener tickets del usuario autenticado
   * GET /api/tickets/mis-tickets
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto[]>>
   */
  @Get('mis-tickets')
  async obtenerMisTickets(@Request() req: any): Promise<RespuestaApi<RespuestaTicketDto[]>> {
    try {
      console.log('📥 GET /api/tickets/mis-tickets');
      
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const misTickets = await this.ticketsService.obtenerMisTickets(idUsuario);
      
      console.log(`✅ ${misTickets.length} tickets del usuario ${idUsuario} obtenidos`);

      return {
        success: true,
        data: misTickets,
        message: `${misTickets.length} tickets encontrados`
      };

    } catch (error: any) {
      console.error('❌ Error en GET /api/tickets/mis-tickets:', error);
      
      throw new HttpException({
        success: false,
        data: null,
        message: 'Error al obtener mis tickets',
        error: error.message || 'Error interno del servidor'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener un ticket específico por ID
   * GET /api/tickets/:id
   * @param id - ID del ticket
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto>>
   */
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Request() req: any): Promise<RespuestaApi<RespuestaTicketDto>> {
    try {
      console.log(`📥 GET /api/tickets/${id}`);
      
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticket = await this.ticketsService.obtenerPorId(id, idUsuario);
      
      console.log(`✅ Ticket ${id} obtenido correctamente`);

      return {
        success: true,
        data: ticket,
        message: 'Ticket obtenido correctamente'
      };

    } catch (error: any) {
      console.error(`❌ Error en GET /api/tickets/${id}:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al obtener el ticket';
      
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('no encontrado')) {
          message = 'Ticket no encontrado';
        } else if (error.message.includes('acceso')) {
          message = 'No tiene permisos para acceder a este ticket';
        }
      }
      
      throw new HttpException({
        success: false,
        data: null,
        message,
        error: error.message || 'Error interno del servidor'
      }, status);
    }
  }

  /**
   * Actualizar un ticket
   * PATCH /api/tickets/:id
   * @param id - ID del ticket
   * @param actualizarTicketDto - Datos a actualizar
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto>>
   */
  @Patch(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarTicketDto: ActualizarTicketDto,
    @Request() req: any,
  ): Promise<RespuestaApi<RespuestaTicketDto>> {
    try {
      console.log(`📥 PATCH /api/tickets/${id} - Datos:`, actualizarTicketDto);
      
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketActualizado = await this.ticketsService.actualizar(id, actualizarTicketDto, idUsuario);
      
      console.log(`✅ Ticket ${id} actualizado correctamente`);

      return {
        success: true,
        data: ticketActualizado,
        message: 'Ticket actualizado exitosamente'
      };

    } catch (error: any) {
      console.error(`❌ Error en PATCH /api/tickets/${id}:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al actualizar el ticket';
      
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('no encontrado')) {
          message = 'Ticket no encontrado';
        } else if (error.message.includes('permisos')) {
          message = 'No tiene permisos para actualizar este ticket';
        }
      }
      
      throw new HttpException({
        success: false,
        data: null,
        message,
        error: error.message || 'Error interno del servidor'
      }, status);
    }
  }

  /**
   * Eliminar un ticket
   * DELETE /api/tickets/:id
   * @param id - ID del ticket
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<{mensaje: string}>>
   */
  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number, @Request() req: any): Promise<RespuestaApi<{mensaje: string}>> {
    try {
      console.log(`📥 DELETE /api/tickets/${id}`);
      
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      await this.ticketsService.eliminar(id, idUsuario);
      
      console.log(`✅ Ticket ${id} eliminado correctamente`);

      return {
        success: true,
        data: { mensaje: 'Ticket eliminado exitosamente' },
        message: 'Ticket eliminado exitosamente'
      };

    } catch (error: any) {
      console.error(`❌ Error en DELETE /api/tickets/${id}:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al eliminar el ticket';
      
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('no encontrado')) {
          message = 'Ticket no encontrado';
        } else if (error.message.includes('permisos')) {
          message = 'No tiene permisos para eliminar este ticket';
        }
      }
      
      throw new HttpException({
        success: false,
        data: null,
        message,
        error: error.message || 'Error interno del servidor'
      }, status);
    }
  }

  /**
   * Obtener tickets abiertos asignados al usuario responsable
   * GET /api/tickets/abiertos
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto[]>>
   */
  @Get('abiertos')
  async obtenerTicketsAbiertos(@Request() req: any): Promise<RespuestaApi<RespuestaTicketDto[]>> {
    try {
      console.log('📥 GET /api/tickets/abiertos');
      
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketsAbiertos = await this.ticketsService.obtenerTicketsAbiertos(idUsuario);

      return {
        success: true,
        data: ticketsAbiertos,
        message: `${ticketsAbiertos.length} tickets abiertos encontrados`
      };

    } catch (error: any) {
      console.error('❌ Error en GET /api/tickets/abiertos:', error);
      
      throw new HttpException({
        success: false,
        data: null,
        message: 'Error al obtener tickets abiertos',
        error: error.message || 'Error interno del servidor'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Tomar un ticket disponible (asignarse como responsable)
   * PATCH /api/tickets/:id/tomar
   * @param id - ID del ticket
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto>>
   */
  @Patch(':id/tomar')
  async tomarTicket(@Param('id', ParseIntPipe) id: number, @Request() req: any): Promise<RespuestaApi<RespuestaTicketDto>> {
    try {
      console.log(`📥 PATCH /api/tickets/${id}/tomar`);
      
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketTomado = await this.ticketsService.tomarTicket(id, idUsuario);

      return {
        success: true,
        data: ticketTomado,
        message: 'Ticket asignado exitosamente'
      };

    } catch (error: any) {
      console.error(`❌ Error en PATCH /api/tickets/${id}/tomar:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException({
        success: false,
        data: null,
        message: 'Error al tomar el ticket',
        error: error.message || 'Error interno del servidor'
      }, status);
    }
  }

  /**
   * Derivar un ticket a otro departamento
   * PATCH /api/tickets/:id/derivar
   * @param id - ID del ticket
   * @param datos - Datos de derivación (departamento destino y motivo)
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto>>
   */
  @Patch(':id/derivar')
  async derivarTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: { id_departamento_destino: number; motivo: string },
    @Request() req: any
  ): Promise<RespuestaApi<RespuestaTicketDto>> {
    try {
      console.log(`📥 PATCH /api/tickets/${id}/derivar - Datos:`, datos);
      
      // Validar datos de entrada
      if (!datos.id_departamento_destino || !datos.motivo) {
        throw new HttpException({
          success: false,
          data: null,
          message: 'Departamento destino y motivo son requeridos',
          error: 'INVALID_DATA'
        }, HttpStatus.BAD_REQUEST);
      }
      
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketDerivado = await this.ticketsService.derivarTicket(
        id,
        datos.id_departamento_destino,
        datos.motivo,
        idUsuario
      );

      return {
        success: true,
        data: ticketDerivado,
        message: 'Ticket derivado exitosamente'
      };

    } catch (error: any) {
      console.error(`❌ Error en PATCH /api/tickets/${id}/derivar:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException({
        success: false,
        data: null,
        message: 'Error al derivar el ticket',
        error: error.message || 'Error interno del servidor'
      }, status);
    }
  }
}