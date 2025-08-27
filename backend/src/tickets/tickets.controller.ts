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
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CrearTicketDto } from './dto/crear-ticket.dto';
import { ActualizarTicketDto } from './dto/actualizar-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Crear un nuevo ticket
  @Post()
  crear(@Body() crearTicketDto: CrearTicketDto, @Request() req) {
    // Por ahora usaremos un ID fijo, luego implementaremos JWT
    // const idUsuario = req.user.sub;
    const idUsuario = 1; // ID temporal hasta implementar JWT
    return this.ticketsService.crear(crearTicketDto, idUsuario);
  }

  // Obtener todos los tickets (admin) o filtrados por usuario
  @Get()
  obtenerTodos(
    @Request() req,
    @Query('incluir_relaciones') incluirRelaciones?: string,
  ) {
    // Por ahora usaremos un ID fijo, luego implementaremos JWT
    // const idUsuario = req.user.sub;
    // const esAdmin = req.user.rol === 1; // Verificar si es admin

    const idUsuario = 1; // ID temporal
    const esAdmin = false; // Por ahora no es admin

    const incluir = incluirRelaciones === 'true';

    if (esAdmin) {
      // Si es admin, obtener todos los tickets
      return this.ticketsService.obtenerTodos(undefined, incluir);
    } else {
      // Si es cliente, solo sus tickets
      return this.ticketsService.obtenerTodos(idUsuario, incluir);
    }
  }

  // Obtener mis tickets (usuario actual)
  @Get('mis-tickets')
  obtenerMisTickets(@Request() req) {
    // Por ahora usaremos un ID fijo, luego implementaremos JWT
    // const idUsuario = req.user.sub;
    const idUsuario = 1; // ID temporal
    return this.ticketsService.obtenerMisTickets(idUsuario);
  }

  // Obtener tickets donde estoy en copia
  @Get('en-copia')
  obtenerTicketsEnCopia(@Request() req) {
    // Por ahora usaremos un ID fijo, luego implementaremos JWT
    // const idUsuario = req.user.sub;
    const idUsuario = 1; // ID temporal
    return this.ticketsService.obtenerTicketsEnCopia(idUsuario);
  }

  // Obtener ticket específico por ID
  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Por ahora usaremos un ID fijo, luego implementaremos JWT
    // const idUsuario = req.user.sub;
    const idUsuario = 1; // ID temporal
    return this.ticketsService.obtenerPorId(id, idUsuario);
  }

  // Actualizar ticket
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarTicketDto: ActualizarTicketDto,
    @Request() req,
  ) {
    // Por ahora usaremos un ID fijo, luego implementaremos JWT
    // const idUsuario = req.user.sub;
    const idUsuario = 1; // ID temporal
    return this.ticketsService.actualizar(id, actualizarTicketDto, idUsuario);
  }

  // Eliminar ticket
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Por ahora usaremos un ID fijo, luego implementaremos JWT
    // const idUsuario = req.user.sub;
    const idUsuario = 1; // ID temporal
    return this.ticketsService.eliminar(id, idUsuario);
  }
}
