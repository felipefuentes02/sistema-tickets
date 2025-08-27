import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearTicketDto } from './dto/crear-ticket.dto';
import { ActualizarTicketDto } from './dto/actualizar-ticket.dto';
import { RespuestaTicketDto } from './dto/respuesta-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  // Crear un nuevo ticket
  async crear(
    crearTicketDto: CrearTicketDto,
    idUsuario: number,
  ): Promise<RespuestaTicketDto> {
    // Generar número de ticket único
    const numeroTicket = await this.generarNumeroTicket();

    const nuevoTicket = await this.prisma.tickets.create({
      data: {
        ...crearTicketDto,
        id_solicitante: idUsuario,
        numero_ticket: numeroTicket,
        id_estado: 1, // Estado "Nuevo" por defecto
        asignado_a: idUsuario, // Por ahora se asigna al mismo usuario
      },
    });

    return this.formatearRespuesta(nuevoTicket);
  }

  // Obtener todos los tickets (con filtros)
  async obtenerTodos(
    idUsuario?: number,
    incluirRelaciones = false,
  ): Promise<RespuestaTicketDto[]> {
    const whereClause = idUsuario ? { id_solicitante: idUsuario } : {};

    const tickets = await this.prisma.tickets.findMany({
      where: whereClause,
      // Comentamos el include por ahora hasta configurar las relaciones en Prisma
      // include: incluirRelaciones ? {
      //   // Aquí incluiremos las relaciones cuando estén configuradas en Prisma
      // } : undefined,
      orderBy: {
        fecha_creacion: 'desc',
      },
    });

    return tickets.map((ticket) => this.formatearRespuesta(ticket));
  }

  // Obtener tickets del usuario actual
  async obtenerMisTickets(idUsuario: number): Promise<RespuestaTicketDto[]> {
    return this.obtenerTodos(idUsuario, true);
  }

  // Obtener tickets donde el usuario está en copia
  async obtenerTicketsEnCopia(
    idUsuario: number,
  ): Promise<RespuestaTicketDto[]> {
    // TODO: Implementar cuando tengamos la tabla usuarios_en_copia
    // Por ahora retornamos array vacío
    return [];
  }

  // Obtener ticket por ID
  async obtenerPorId(
    id: number,
    idUsuario?: number,
  ): Promise<RespuestaTicketDto> {
    const ticket = await this.prisma.tickets.findUnique({
      where: { id_ticket: id },
      // include: {} // Incluir relaciones cuando estén configuradas
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    // Verificar si el usuario tiene acceso al ticket
    if (idUsuario && ticket.id_solicitante !== idUsuario) {
      throw new ForbiddenException('No tiene acceso a este ticket');
    }

    return this.formatearRespuesta(ticket);
  }

  // Actualizar ticket
  async actualizar(
    id: number,
    actualizarTicketDto: ActualizarTicketDto,
    idUsuario?: number,
  ): Promise<RespuestaTicketDto> {
    // Verificar que el ticket existe y el usuario tiene acceso
    await this.obtenerPorId(id, idUsuario);

    const ticketActualizado = await this.prisma.tickets.update({
      where: { id_ticket: id },
      data: {
        ...actualizarTicketDto,
        fecha_actualizacion: new Date(),
      },
    });

    return this.formatearRespuesta(ticketActualizado);
  }

  // Eliminar ticket (solo el propietario)
  async eliminar(id: number, idUsuario: number): Promise<{ mensaje: string }> {
    await this.obtenerPorId(id, idUsuario);

    await this.prisma.tickets.delete({
      where: { id_ticket: id },
    });

    return { mensaje: 'Ticket eliminado exitosamente' };
  }

  // Método privado para generar número de ticket único
  private async generarNumeroTicket(): Promise<string> {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');

    // Obtener el último ticket del mes para generar secuencial
    const ultimoTicket = await this.prisma.tickets.findFirst({
      where: {
        numero_ticket: {
          startsWith: `TK${año}${mes}`,
        },
      },
      orderBy: {
        numero_ticket: 'desc',
      },
    });

    let secuencial = 1;
    if (ultimoTicket) {
      const ultimoSecuencial = parseInt(ultimoTicket.numero_ticket.slice(-4));
      secuencial = ultimoSecuencial + 1;
    }

    return `TK${año}${mes}${String(secuencial).padStart(4, '0')}`;
  }

  // Método privado para formatear la respuesta
  private formatearRespuesta(ticket: any): RespuestaTicketDto {
    return {
      id_ticket: ticket.id_ticket,
      numero_ticket: ticket.numero_ticket,
      asunto: ticket.asunto,
      descripcion: ticket.descripcion,
      id_solicitante: ticket.id_solicitante,
      asignado_a: ticket.asignado_a,
      id_departamento: ticket.id_departamento,
      id_prioridad: ticket.id_prioridad,
      id_estado: ticket.id_estado,
      fecha_vencimiento: ticket.fecha_vencimiento,
      fecha_resolucion: ticket.fecha_resolucion,
      fecha_cierre: ticket.fecha_cierre,
      fecha_creacion: ticket.fecha_creacion,
      fecha_actualizacion: ticket.fecha_actualizacion,
    };
  }
}
