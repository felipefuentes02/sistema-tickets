import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearTicketDto } from './dto/crear-ticket.dto';
import { ActualizarTicketDto } from './dto/actualizar-ticket.dto';
import { RespuestaTicketDto } from './dto/respuesta-ticket.dto';

/**
 * Servicio para gestión de tickets
 * Maneja toda la lógica de negocio relacionada con tickets
 * ACTUALIZADO para coincidir con el schema de Prisma
 */
@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear un nuevo ticket
   * @param crearTicketDto - Datos del ticket a crear
   * @param idUsuario - ID del usuario que crea el ticket
   * @returns Promise<RespuestaTicketDto> - Ticket creado
   */
  async crear(crearTicketDto: CrearTicketDto, idUsuario: number): Promise<RespuestaTicketDto> {
    try {
      console.log('🎫 Iniciando creación de ticket:', {
        solicitante: idUsuario,
        asunto: crearTicketDto.asunto,
        departamento: crearTicketDto.id_departamento,
        prioridad: crearTicketDto.id_prioridad
      });

      // Validar que el departamento existe y está activo
      const departamento = await this.prisma.departamentos.findUnique({
        where: { 
          id_departamento: crearTicketDto.id_departamento
        }
      });

      if (!departamento) {
        throw new BadRequestException('El departamento especificado no existe o no está activo');
      }

      // Validar que la prioridad existe
      const prioridad = await this.prisma.prioridades.findUnique({
        where: { id_prioridad: crearTicketDto.id_prioridad }
      });

      if (!prioridad) {
        throw new BadRequestException('La prioridad especificada no existe');
      }

      // Validar que el usuario existe
      const usuario = await this.prisma.usuarios.findUnique({
        where: { id_usuario: idUsuario }
      });

      if (!usuario) {
        throw new BadRequestException('Usuario solicitante no válido');
      }

      // Generar número de ticket único
      const numeroTicket = await this.generarNumeroTicket();

      // Calcular fecha de vencimiento basada en la prioridad
      const fechaVencimiento = this.calcularFechaVencimiento(prioridad.nivel);

      // Crear el ticket
      const nuevoTicket = await this.prisma.tickets.create({
        data: {
          numero_ticket: numeroTicket,
          asunto: crearTicketDto.asunto.trim(),
          descripcion: crearTicketDto.descripcion.trim(),
          id_solicitante: idUsuario,
          id_departamento: crearTicketDto.id_departamento,
          id_prioridad: crearTicketDto.id_prioridad,
          id_estado: 1, // Estado inicial: "Nuevo"
          fecha_vencimiento: fechaVencimiento,
        },
        include: {
          solicitante: true,
          departamento: true,
          prioridad: true,
          estado: true
        }
      });

      console.log('✅ Ticket creado exitosamente:', {
        id: nuevoTicket.id_ticket,
        numero: nuevoTicket.numero_ticket,
        asunto: nuevoTicket.asunto
      });

      return this.formatearRespuesta(nuevoTicket);

    } catch (error: any) {
      console.error('❌ Error al crear ticket:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los tickets con filtros opcionales
   * @param idUsuario - ID del usuario (null para admin que ve todos)
   * @param incluirRelaciones - Si incluir datos relacionados
   * @returns Promise<RespuestaTicketDto[]>
   */
  async obtenerTodos(
    idUsuario?: number,
    incluirRelaciones = false,
  ): Promise<RespuestaTicketDto[]> {
    try {
      const whereClause = idUsuario ? { id_solicitante: idUsuario } : {};

      if (incluirRelaciones) {
        const tickets = await this.prisma.tickets.findMany({
          where: whereClause,
          include: {
            solicitante: true,
            departamento: true,
            prioridad: true,
            estado: true,
            responsable: true,
          },
          orderBy: {
            fecha_creacion: 'desc'
          }
        });

        console.log(`✅ ${tickets.length} tickets obtenidos correctamente`);
        return tickets.map((ticket) => this.formatearRespuesta(ticket));
      } else {
        const tickets = await this.prisma.tickets.findMany({
          where: whereClause,
          orderBy: {
            fecha_creacion: 'desc'
          }
        });

        console.log(`✅ ${tickets.length} tickets obtenidos correctamente`);
        return tickets.map((ticket) => this.formatearRespuesta(ticket));
      }

    } catch (error: any) {
      console.error('❌ Error al obtener tickets:', error);
      throw error;
    }
  }

  /**
   * Obtener tickets del usuario específico
   * @param idUsuario - ID del usuario
   * @returns Promise<RespuestaTicketDto[]>
   */
  async obtenerMisTickets(idUsuario: number): Promise<RespuestaTicketDto[]> {
    console.log(`👤 Obteniendo mis tickets para usuario: ${idUsuario}`);
    return this.obtenerTodos(idUsuario, true);
  }

  /**
   * Obtener tickets donde el usuario está en copia
   * @param idUsuario - ID del usuario
   * @returns Promise<RespuestaTicketDto[]>
   */
  async obtenerTicketsEnCopia(idUsuario: number): Promise<RespuestaTicketDto[]> {
    try {
      console.log(`📋 Obteniendo tickets en copia para usuario: ${idUsuario}`);
      
      // TODO: Implementar cuando tengamos la tabla usuarios_en_copia
      // Por ahora retornamos array vacío
      return [];

    } catch (error: any) {
      console.error('❌ Error al obtener tickets en copia:', error);
      throw error;
    }
  }

  /**
   * Obtener un ticket por ID con validación de acceso
   * @param id - ID del ticket
   * @param idUsuario - ID del usuario que solicita (para validar acceso)
   * @returns Promise<RespuestaTicketDto>
   */
  async obtenerPorId(id: number, idUsuario?: number): Promise<RespuestaTicketDto> {
    try {
      console.log(`🔍 Buscando ticket ID: ${id} para usuario: ${idUsuario}`);

      const ticket = await this.prisma.tickets.findUnique({
        where: { id_ticket: id },
        include: {
          solicitante: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          },
          departamento: {
            select: {
              id_departamento: true,
              nombre_departamento: true
            }
          },
          prioridad: {
            select: {
              id_prioridad: true,
              nombre_prioridad: true,
              nivel: true
            }
          },
          estado: {
            select: {
              id_estado: true,
              nombre_estado: true
            }
          },
          responsable: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          }
        }
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
      }

      // Verificar si el usuario tiene acceso al ticket
      if (idUsuario && ticket.id_solicitante !== idUsuario && ticket.asignado_a !== idUsuario) {
        throw new ForbiddenException('No tiene permisos para acceder a este ticket');
      }

      console.log(`✅ Ticket ${id} encontrado correctamente`);

      return this.formatearRespuesta(ticket);

    } catch (error: any) {
      console.error(`❌ Error al obtener ticket ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar un ticket existente
   * @param id - ID del ticket
   * @param actualizarTicketDto - Datos a actualizar
   * @param idUsuario - ID del usuario que actualiza
   * @returns Promise<RespuestaTicketDto>
   */
  async actualizar(
    id: number,
    actualizarTicketDto: ActualizarTicketDto,
    idUsuario?: number
  ): Promise<RespuestaTicketDto> {
    try {
      console.log(`📝 Actualizando ticket ${id}:`, actualizarTicketDto);

      // Verificar que el ticket existe
      const ticketExistente = await this.prisma.tickets.findUnique({
        where: { id_ticket: id }
      });

      if (!ticketExistente) {
        throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
      }

      // Verificar permisos (solo el solicitante o responsable pueden actualizar)
      if (idUsuario &&
          ticketExistente.id_solicitante !== idUsuario &&
          ticketExistente.asignado_a !== idUsuario) {
        throw new ForbiddenException('No tiene permisos para actualizar este ticket');
      }

      // Actualizar el ticket
      const ticketActualizado = await this.prisma.tickets.update({
        where: { id_ticket: id },
        data: {
          ...actualizarTicketDto,
          fecha_actualizacion: new Date(),
        },
        include: {
          solicitante: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          },
          departamento: {
            select: {
              id_departamento: true,
              nombre_departamento: true,
            }
          },
          prioridad: {
            select: {
              id_prioridad: true,
              nombre_prioridad: true,
              nivel: true,
            }
          },
          estado: {
            select: {
              id_estado: true,
              nombre_estado: true,
            }
          },
          responsable: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          }
        }
      });

      console.log(`✅ Ticket ${id} actualizado correctamente`);

      return this.formatearRespuesta(ticketActualizado);

    } catch (error: any) {
      console.error(`❌ Error al actualizar ticket ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar un ticket (soft delete recomendado)
   * @param id - ID del ticket
   * @param idUsuario - ID del usuario que elimina
   * @returns Promise<boolean>
   */
  async eliminar(id: number, idUsuario?: number): Promise<boolean> {
    try {
      console.log(`🗑️ Eliminando ticket ${id} por usuario: ${idUsuario}`);

      // Verificar que el ticket existe
      const ticketExistente = await this.prisma.tickets.findUnique({
        where: { id_ticket: id }
      });

      if (!ticketExistente) {
        throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
      }

      // Verificar permisos (solo el solicitante o admin pueden eliminar)
      if (idUsuario && ticketExistente.id_solicitante !== idUsuario) {
        throw new ForbiddenException('No tiene permisos para eliminar este ticket');
      }

      // Eliminar el ticket
      await this.prisma.tickets.delete({
        where: { id_ticket: id }
      });

      console.log(`✅ Ticket ${id} eliminado correctamente`);

      return true;

    } catch (error: any) {
      console.error(`❌ Error al eliminar ticket ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener tickets abiertos para un responsable
   * @param idUsuarioResponsable - ID del usuario responsable
   * @returns Promise<RespuestaTicketDto[]>
   */
  async obtenerTicketsAbiertos(idUsuarioResponsable: number): Promise<RespuestaTicketDto[]> {
    try {
      console.log(`📂 Obteniendo tickets abiertos para responsable: ${idUsuarioResponsable}`);
      
      // Estados considerados como "abiertos": Nuevo, En Proceso, Pendiente
      const estadosAbiertos = [1, 2, 3];

      const tickets = await this.prisma.tickets.findMany({
        where: {
          id_estado: {
            in: estadosAbiertos
          },
          OR: [
            { asignado_a: null }, // Tickets sin asignar
            { asignado_a: idUsuarioResponsable } // Tickets asignados al responsable
          ]
        },
        include: {
          solicitante: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          },
          departamento: true,
          prioridad: true,
          estado: true,
          responsable: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          }
        },
        orderBy: [
          { id_prioridad: 'asc' }, // Prioridad alta primero
          { fecha_creacion: 'asc' } // Más antiguos primero
        ]
      });

      console.log(`✅ ${tickets.length} tickets abiertos encontrados`);

      return tickets.map(ticket => this.formatearRespuesta(ticket));

    } catch (error: any) {
      console.error('❌ Error al obtener tickets abiertos:', error);
      throw error;
    }
  }

  /**
   * Obtener tickets cerrados para un responsable
   * @param idUsuarioResponsable - ID del usuario responsable
   * @returns Promise<RespuestaTicketDto[]>
   */
  async obtenerTicketsCerrados(idUsuarioResponsable: number): Promise<RespuestaTicketDto[]> {
    try {
      console.log(`📁 Obteniendo tickets cerrados para responsable: ${idUsuarioResponsable}`);
      
      // Estados considerados como "cerrados": Resuelto, Cerrado
      const estadosCerrados = [4, 5];

      const tickets = await this.prisma.tickets.findMany({
        where: {
          id_estado: {
            in: estadosCerrados
          },
          asignado_a: idUsuarioResponsable
        },
        include: {
          solicitante: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          },
          departamento: true,
          prioridad: true,
          estado: true,
          responsable: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          }
        },
        orderBy: [
          { fecha_actualizacion: 'desc' } // Más recientes primero
        ]
      });

      console.log(`✅ ${tickets.length} tickets cerrados encontrados`);

      return tickets.map(ticket => this.formatearRespuesta(ticket));

    } catch (error: any) {
      console.error('❌ Error al obtener tickets cerrados:', error);
      throw error;
    }
  }

  /**
   * Obtener tickets pendientes que requieren atención
   * @param idUsuarioResponsable - ID del usuario responsable
   * @returns Promise<RespuestaTicketDto[]>
   */
  async obtenerTicketsPendientes(idUsuarioResponsable: number): Promise<RespuestaTicketDto[]> {
    try {
      console.log(`⏰ Obteniendo tickets pendientes para responsable: ${idUsuarioResponsable}`);
      
      const ahora = new Date();
      const en24Horas = new Date();
      en24Horas.setHours(en24Horas.getHours() + 24);

      const tickets = await this.prisma.tickets.findMany({
        where: {
          OR: [
            // Tickets vencidos
            {
              fecha_vencimiento: {
                lt: ahora
              },
              id_estado: { in: [1, 2, 3] } // Estados abiertos
            },
            // Tickets que vencen en las próximas 24 horas
            {
              fecha_vencimiento: {
                gte: ahora,
                lte: en24Horas
              },
              id_estado: { in: [1, 2, 3] } // Estados abiertos
            }
          ],
          asignado_a: idUsuarioResponsable
        },
        include: {
          solicitante: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          },
          departamento: true,
          prioridad: true,
          estado: true,
          responsable: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          }
        },
        orderBy: [
          { fecha_vencimiento: 'asc' }, // Más urgentes primero
          { id_prioridad: 'asc' } // Prioridad alta primero
        ]
      });

      console.log(`✅ ${tickets.length} tickets pendientes encontrados`);

      return tickets.map(ticket => this.formatearRespuesta(ticket));

    } catch (error: any) {
      console.error('❌ Error al obtener tickets pendientes:', error);
      throw error;
    }
  }

  /**
   * Tomar un ticket (asignarse como responsable)
   * @param id - ID del ticket
   * @param idUsuarioResponsable - ID del usuario que toma el ticket
   * @returns Promise<RespuestaTicketDto>
   */
  async tomarTicket(id: number, idUsuarioResponsable: number): Promise<RespuestaTicketDto> {
    try {
      console.log(`🤝 Responsable ${idUsuarioResponsable} tomando ticket ${id}`);

      // Verificar que el ticket existe
      const ticket = await this.prisma.tickets.findUnique({
        where: { id_ticket: id }
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
      }

      // Verificar que el ticket no esté ya asignado
      if (ticket.asignado_a && ticket.asignado_a !== idUsuarioResponsable) {
        throw new BadRequestException('El ticket ya está asignado a otro responsable');
      }

      // Asignar el ticket y cambiar estado a "En Proceso"
      const ticketAsignado = await this.prisma.tickets.update({
        where: { id_ticket: id },
        data: {
          asignado_a: idUsuarioResponsable,
          id_estado: 2, // En Proceso
          fecha_actualizacion: new Date(),
        },
        include: {
          solicitante: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          },
          departamento: true,
          prioridad: true,
          estado: true,
          responsable: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          }
        }
      });

      console.log(`✅ Ticket ${id} asignado correctamente a responsable ${idUsuarioResponsable}`);

      return this.formatearRespuesta(ticketAsignado);

    } catch (error: any) {
      console.error(`❌ Error al tomar ticket ${id}:`, error);
      throw error;
    }
  }

  /**
   * Derivar un ticket a otro departamento
   * @param id - ID del ticket
   * @param idDepartamentoDestino - ID del departamento destino
   * @param motivo - Motivo de la derivación
   * @param idUsuarioResponsable - ID del usuario que deriva
   * @returns Promise<RespuestaTicketDto>
   */
  async derivarTicket(
    id: number,
    idDepartamentoDestino: number,
    motivo: string,
    idUsuarioResponsable: number
  ): Promise<RespuestaTicketDto> {
    try {
      console.log(`📤 Derivando ticket ${id} al departamento ${idDepartamentoDestino}`);

      // Verificar que el ticket existe
      const ticket = await this.prisma.tickets.findUnique({
        where: { id_ticket: id }
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
      }

      // Verificar que el departamento destino existe y está activo
      const departamentoDestino = await this.prisma.departamentos.findUnique({
        where: {
          id_departamento: idDepartamentoDestino
        }
      });

      if (!departamentoDestino) {
        throw new BadRequestException('Departamento destino no válido o inactivo');
      }

      // Verificar que no se esté derivando al mismo departamento
      if (ticket.id_departamento === idDepartamentoDestino) {
        throw new BadRequestException('No se puede derivar al mismo departamento');
      }

      // Usar transacción para derivar el ticket y registrar el historial
      const resultado = await this.prisma.$transaction(async (prisma) => {
        // Actualizar el ticket
        const ticketActualizado = await prisma.tickets.update({
          where: { id_ticket: id },
          data: {
            id_departamento: idDepartamentoDestino,
            asignado_a: null, // Quitar asignación actual
            id_estado: 1, // Volver a estado "Nuevo"
            fecha_actualizacion: new Date(),
          },
          include: {
            solicitante: true,
            departamento: true,
            prioridad: true,
            estado: true,
            responsable: true
          }
        });

        // TODO: Registrar en historial de derivaciones cuando tengamos la tabla
        // await prisma.historial_derivaciones.create({
        //   data: {
        //     id_ticket: id,
        //     id_departamento_origen: ticket.id_departamento,
        //     id_departamento_destino: idDepartamentoDestino,
        //     derivado_por: idUsuarioResponsable,
        //     motivo: motivo
        //   }
        // });

        return ticketActualizado;
      });

      console.log(`✅ Ticket ${id} derivado correctamente al departamento ${idDepartamentoDestino}`);

      return this.formatearRespuesta(resultado);

    } catch (error: any) {
      console.error(`❌ Error al derivar ticket ${id}:`, error);
      throw error;
    }
  }

  /**
   * Generar número único para ticket
   * Formato: TK + YYYYMM + número secuencial de 3 dígitos
   * @returns Promise<string>
   */
  private async generarNumeroTicket(): Promise<string> {
    try {
      const fechaActual = new Date();
      const ano = fechaActual.getFullYear();
      const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
      
      // Buscar el último ticket del mes actual
      const inicioMes = new Date(ano, fechaActual.getMonth(), 1);
      const finMes = new Date(ano, fechaActual.getMonth() + 1, 0, 23, 59, 59);
      
      const ultimoTicket = await this.prisma.tickets.findFirst({
        where: {
          fecha_creacion: {
            gte: inicioMes,
            lte: finMes
          }
        },
        orderBy: { fecha_creacion: 'desc' }
      });

      let siguienteNumero = 1;

      if (ultimoTicket && ultimoTicket.numero_ticket) {
        // Extraer el número secuencial del último ticket
        const numeroActual = ultimoTicket.numero_ticket.split(ano + mes)[1];
        siguienteNumero = parseInt(numeroActual || '0') + 1;
      }

      // Formatear número con 3 dígitos
      const numeroFormateado = String(siguienteNumero).padStart(3, '0');
      const numeroTicket = `TK${ano}${mes}${numeroFormateado}`;
      
      console.log(`🎫 Número de ticket generado: ${numeroTicket}`);
      
      return numeroTicket;

    } catch (error: any) {
      console.error('❌ Error al generar número de ticket:', error);
      throw error;
    }
  }

  /**
   * Calcular fecha de vencimiento según prioridad
   * @param nivelPrioridad - Nivel de prioridad (1=Alta, 2=Media, 3=Baja)
   * @returns Date - Fecha de vencimiento
   */
  private calcularFechaVencimiento(nivelPrioridad: number): Date {
    const fechaVencimiento = new Date();
    
    switch (nivelPrioridad) {
      case 1: // Alta - 24 horas
        fechaVencimiento.setHours(fechaVencimiento.getHours() + 24);
        break;
      case 2: // Media - 72 horas (3 días)
        fechaVencimiento.setHours(fechaVencimiento.getHours() + 72);
        break;
      case 3: // Baja - 168 horas (7 días)
        fechaVencimiento.setHours(fechaVencimiento.getHours() + 168);
        break;
      default:
        fechaVencimiento.setHours(fechaVencimiento.getHours() + 72);
    }
    
    console.log(`⏱️ Fecha vencimiento calculada para prioridad ${nivelPrioridad}: ${fechaVencimiento.toISOString()}`);
    
    return fechaVencimiento;
  }

  /**
   * Formatear respuesta del ticket para el frontend
   * @param ticket - Ticket de la base de datos
   * @returns RespuestaTicketDto
   */
  private formatearRespuesta(ticket: any): RespuestaTicketDto {
    return {
      id_ticket: ticket.id_ticket,
      numero_ticket: ticket.numero_ticket,
      asunto: ticket.asunto,
      descripcion: ticket.descripcion,
      id_solicitante: ticket.id_solicitante,
      nombre_solicitante: ticket.solicitante ? 
        `${ticket.solicitante.primer_nombre} ${ticket.solicitante.primer_apellido}` : 
        'No disponible',
      id_departamento: ticket.id_departamento,
      id_prioridad: ticket.id_prioridad,
      id_estado: ticket.id_estado,
      asignado_a: ticket.asignado_a,
      nombre_responsable: ticket.responsable ? 
        `${ticket.responsable.primer_nombre} ${ticket.responsable.primer_apellido}` : 
        null,
      fecha_creacion: ticket.fecha_creacion,
      fecha_actualizacion: ticket.fecha_actualizacion,
      fecha_vencimiento: ticket.fecha_vencimiento,

      
      // Datos relacionados (si están incluidos)
      departamento: ticket.departamento ? {
        id: ticket.departamento.id_departamento,
        nombre: ticket.departamento.nombre_departamento
      } : undefined,
      
      prioridad: ticket.prioridad ? {
        id: ticket.prioridad.id_prioridad,
        nombre: ticket.prioridad.nombre_prioridad,
        nivel: ticket.prioridad.nivel
      } : undefined,
      
      estado: ticket.estado ? {
        id: ticket.estado.id_estado,
        nombre: ticket.estado.nombre_estado
      } : undefined
    };
  }
}