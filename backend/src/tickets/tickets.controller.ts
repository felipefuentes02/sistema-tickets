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
  async crear(@Body() crearTicketDto: CrearTicketDto, @Request() req) {
    try {
      console.log('📥 POST /api/tickets - Datos recibidos:', {
        ...crearTicketDto,
        timestamp: new Date().toISOString()
      });

      // Obtener ID del usuario autenticado (por ahora usamos ID fijo)
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal hasta implementar JWT completo
      
      // Validar que el usuario existe (opcional, se puede agregar validación)
      if (!idUsuario) {
        throw new HttpException({
          success: false,
          data: null,
          message: 'Usuario no autenticado',
          error: 'UNAUTHORIZED'
        }, HttpStatus.UNAUTHORIZED);
      }

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

    } catch (error) {
      console.error('❌ Error en POST /api/tickets:', error);
      
      // Determinar el status code apropiado
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al crear el ticket';
      
      // Manejar errores específicos
      if (error.message.includes('departamento')) {
        message = 'Departamento no válido';
      } else if (error.message.includes('prioridad')) {
        message = 'Prioridad no válida';
      } else if (error.message.includes('validación')) {
        message = 'Datos de entrada inválidos';
      }
      
      throw new HttpException({
        success: false,
        data: null,
        message,
        error: error.message
      }, status);
    }
  }

  /**
   * Obtener todos los tickets (admin) o filtrados por usuario (cliente)
   * GET /api/tickets
   * @param req - Request con información del usuario
   * @param incluirRelaciones - Si incluir datos relacionados (departamento, usuario, etc.)
   * @returns Promise<RespuestaApi<RespuestaTicketDto[]>>
   */
  @Get()
  async obtenerTodos(
    @Request() req, 
    @Query('incluir_relaciones') incluirRelaciones?: string
  ) {
    try {
      console.log('📥 GET /api/tickets - Parámetros:', {
        incluir_relaciones: incluirRelaciones,
        timestamp: new Date().toISOString()
      });

      // Por ahora usaremos un ID fijo, luego implementaremos JWT
      // TODO: Implementar JWT
      // const idUsuario = req.user.sub;
      // const esAdmin = req.user.rol === 'admin' || req.user.rol === 'responsable';
      
      const idUsuario = 1; // ID temporal
      const esAdmin = false; // Por ahora no es admin
      
      const incluir = incluirRelaciones === 'true';
      
      let tickets: RespuestaTicketDto[];
      
      if (esAdmin) {
        // Si es admin/responsable, obtener todos los tickets
        console.log('🔑 Usuario administrador - obteniendo todos los tickets');
        tickets = await this.ticketsService.obtenerTodos(undefined, incluir);
      } else {
        // Si es cliente, solo sus tickets
        console.log('👤 Usuario cliente - obteniendo solo sus tickets');
        tickets = await this.ticketsService.obtenerTodos(idUsuario, incluir);
      }

      console.log(`✅ ${tickets.length} tickets obtenidos correctamente`);

      return {
        success: true,
        data: tickets,
        message: `${tickets.length} tickets obtenidos correctamente`
      };

    } catch (error) {
      console.error('❌ Error en GET /api/tickets:', error);
      
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener tickets',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener mis tickets (usuario actual)
   * GET /api/tickets/mis-tickets
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto[]>>
   */
  @Get('mis-tickets')
  async obtenerMisTickets(@Request() req) {
    try {
      console.log('📥 GET /api/tickets/mis-tickets');

      // Por ahora usaremos un ID fijo, luego implementaremos JWT
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const misTickets = await this.ticketsService.obtenerMisTickets(idUsuario);
      
      console.log(`✅ ${misTickets.length} tickets del usuario ${idUsuario} obtenidos`);

      return {
        success: true,
        data: misTickets,
        message: `${misTickets.length} tickets obtenidos correctamente`
      };

    } catch (error) {
      console.error('❌ Error en GET /api/tickets/mis-tickets:', error);
      
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener mis tickets',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener tickets donde estoy en copia
   * GET /api/tickets/en-copia
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto[]>>
   */
  @Get('en-copia')
  async obtenerTicketsEnCopia(@Request() req) {
    try {
      console.log('📥 GET /api/tickets/en-copia');

      // Por ahora usaremos un ID fijo, luego implementaremos JWT
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketsEnCopia = await this.ticketsService.obtenerTicketsEnCopia(idUsuario);
      
      console.log(`✅ ${ticketsEnCopia.length} tickets en copia obtenidos`);

      return {
        success: true,
        data: ticketsEnCopia,
        message: `${ticketsEnCopia.length} tickets en copia obtenidos correctamente`
      };

    } catch (error) {
      console.error('❌ Error en GET /api/tickets/en-copia:', error);
      
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener tickets en copia',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener ticket específico por ID
   * GET /api/tickets/:id
   * @param id - ID del ticket
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto>>
   */
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number, @Request() req) {
    try {
      console.log(`📥 GET /api/tickets/${id}`);

      // Por ahora usaremos un ID fijo, luego implementaremos JWT
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticket = await this.ticketsService.obtenerPorId(id, idUsuario);
      
      console.log(`✅ Ticket ${id} obtenido correctamente`);

      return {
        success: true,
        data: ticket,
        message: 'Ticket obtenido correctamente'
      };

    } catch (error) {
      console.error(`❌ Error en GET /api/tickets/${id}:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al obtener ticket';
      
      if (error.message.includes('no encontrado')) {
        message = 'Ticket no encontrado';
      } else if (error.message.includes('acceso')) {
        message = 'Sin permisos para ver este ticket';
      }
      
      throw new HttpException({
        success: false,
        data: null,
        message,
        error: error.message
      }, status);
    }
  }

  /**
   * Actualizar ticket
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
    @Request() req
  ) {
    try {
      console.log(`📥 PATCH /api/tickets/${id} - Datos:`, actualizarTicketDto);

      // Por ahora usaremos un ID fijo, luego implementaremos JWT
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketActualizado = await this.ticketsService.actualizar(id, actualizarTicketDto, idUsuario);
      
      console.log(`✅ Ticket ${id} actualizado correctamente`);

      return {
        success: true,
        data: ticketActualizado,
        message: 'Ticket actualizado correctamente'
      };

    } catch (error) {
      console.error(`❌ Error en PATCH /api/tickets/${id}:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al actualizar ticket';
      
      if (error.message.includes('no encontrado')) {
        message = 'Ticket no encontrado';
      } else if (error.message.includes('permisos')) {
        message = 'Sin permisos para actualizar este ticket';
      }
      
      throw new HttpException({
        success: false,
        data: null,
        message,
        error: error.message
      }, status);
    }
  }

  /**
   * Eliminar ticket
   * DELETE /api/tickets/:id
   * @param id - ID del ticket
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<boolean>>
   */
  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    try {
      console.log(`📥 DELETE /api/tickets/${id}`);

      // Por ahora usaremos un ID fijo, luego implementaremos JWT
      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      await this.ticketsService.eliminar(id, idUsuario);
      
      console.log(`✅ Ticket ${id} eliminado correctamente`);

      return {
        success: true,
        data: true,
        message: 'Ticket eliminado correctamente'
      };

    } catch (error) {
      console.error(`❌ Error en DELETE /api/tickets/${id}:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al eliminar ticket';
      
      if (error.message.includes('no encontrado')) {
        message = 'Ticket no encontrado';
      } else if (error.message.includes('permisos')) {
        message = 'Sin permisos para eliminar este ticket';
      }
      
      throw new HttpException({
        success: false,
        data: false,
        message,
        error: error.message
      }, status);
    }
  }

  // ============ ENDPOINTS ESPECÍFICOS PARA RESPONSABLES ============

  /**
   * Obtener tickets abiertos (para responsables)
   * GET /api/tickets/abiertos
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto[]>>
   */
  @Get('abiertos')
  async obtenerTicketsAbiertos(@Request() req) {
    try {
      console.log('📥 GET /api/tickets/abiertos');

      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketsAbiertos = await this.ticketsService.obtenerTicketsAbiertos(idUsuario);
      
      return {
        success: true,
        data: ticketsAbiertos,
        message: `${ticketsAbiertos.length} tickets abiertos obtenidos`
      };

    } catch (error) {
      console.error('❌ Error en GET /api/tickets/abiertos:', error);
      
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener tickets abiertos',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener tickets cerrados (para responsables)
   * GET /api/tickets/cerrados
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto[]>>
   */
  @Get('cerrados')
  async obtenerTicketsCerrados(@Request() req) {
    try {
      console.log('📥 GET /api/tickets/cerrados');

      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketsCerrados = await this.ticketsService.obtenerTicketsCerrados(idUsuario);
      
      return {
        success: true,
        data: ticketsCerrados,
        message: `${ticketsCerrados.length} tickets cerrados obtenidos`
      };

    } catch (error) {
      console.error('❌ Error en GET /api/tickets/cerrados:', error);
      
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener tickets cerrados',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener tickets pendientes (para responsables)
   * GET /api/tickets/pendientes
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto[]>>
   */
  @Get('pendientes')
  async obtenerTicketsPendientes(@Request() req) {
    try {
      console.log('📥 GET /api/tickets/pendientes');

      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketsPendientes = await this.ticketsService.obtenerTicketsPendientes(idUsuario);
      
      return {
        success: true,
        data: ticketsPendientes,
        message: `${ticketsPendientes.length} tickets pendientes obtenidos`
      };

    } catch (error) {
      console.error('❌ Error en GET /api/tickets/pendientes:', error);
      
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener tickets pendientes',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Tomar un ticket (asignarlo al responsable actual)
   * PUT /api/tickets/:id/tomar
   * @param id - ID del ticket
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto>>
   */
  @Patch(':id/tomar')
  async tomarTicket(@Param('id', ParseIntPipe) id: number, @Request() req) {
    try {
      console.log(`📥 PATCH /api/tickets/${id}/tomar`);

      // TODO: Implementar JWT - const idUsuario = req.user.sub;
      const idUsuario = 1; // ID temporal
      
      const ticketTomado = await this.ticketsService.tomarTicket(id, idUsuario);
      
      return {
        success: true,
        data: ticketTomado,
        message: 'Ticket asignado correctamente'
      };

    } catch (error) {
      console.error(`❌ Error en PATCH /api/tickets/${id}/tomar:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException({
        success: false,
        data: null,
        message: 'Error al tomar el ticket',
        error: error.message
      }, status);
    }
  }

  /**
   * Derivar ticket a otro departamento
   * PUT /api/tickets/:id/derivar
   * @param id - ID del ticket
   * @param datos - Departamento destino y motivo de derivación
   * @param req - Request con información del usuario
   * @returns Promise<RespuestaApi<RespuestaTicketDto>>
   */
  @Patch(':id/derivar')
  async derivarTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: { id_departamento_destino: number; motivo: string },
    @Request() req
  ) {
    try {
      console.log(`📥 PATCH /api/tickets/${id}/derivar - Datos:`, datos);

      // Validar datos de entrada
      if (!datos.id_departamento_destino || !datos.motivo) {
        throw new HttpException({
          success: false,
          data: null,
          message: 'Departamento destino y motivo son requeridos',
          error: 'INVALID_INPUT'
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
        message: 'Ticket derivado correctamente'
      };

    } catch (error) {
      console.error(`❌ Error en PATCH /api/tickets/${id}/derivar:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException({
        success: false,
        data: null,
        message: 'Error al derivar el ticket',
        error: error.message
      }, status);
    }
  }
}