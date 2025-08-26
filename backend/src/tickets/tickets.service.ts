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
          id_departamento: crearTicketDto.id_departamento,
          activo: true
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
          id_estado: 1, // Estado "Nuevo" por defecto
          fecha_vencimiento: fechaVencimiento,
          // Por ahora no asignamos responsable automáticamente
          // asignado_a: await this.asignarResponsableAutomatico(crearTicketDto.id_departamento)
        },
      });

      console.log('✅ Ticket creado exitosamente:', {
        id: nuevoTicket.id_ticket,
        numero: nuevoTicket.numero_ticket,
        estado: nuevoTicket.id_estado
      });

      // Formatear respuesta
      return this.formatearRespuesta(nuevoTicket);

    } catch (error) {
      console.error('❌ Error al crear ticket:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los tickets (con filtros opcionales)
   * @param idUsuario - ID del usuario (si se especifica, filtra por usuario)
   * @param incluirRelaciones - Si incluir datos relacionados
   * @returns Promise<RespuestaTicketDto[]> - Lista de tickets
   */
  async obtenerTodos(idUsuario?: number, incluirRelaciones = false): Promise<RespuestaTicketDto[]> {
    try {
      console.log('📋 Obteniendo tickets:', {
        filtrarPorUsuario: !!idUsuario,
        usuario: idUsuario,
        incluirRelaciones
      });

      const whereClause = idUsuario ? { id_solicitante: idUsuario } : {};
      
      const tickets = await this.prisma.tickets.findMany({
        where: whereClause,
        // Incluir relaciones si se solicita
        include: incluirRelaciones ? {
          solicitante: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true
            }
          },
          responsable: {
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
          }
        } : undefined,
        orderBy: {
          fecha_creacion: 'desc'
        }
      });

      console.log(`✅ ${tickets.length} tickets obtenidos correctamente`);

      return tickets.map(ticket => this.formatearRespuesta(ticket));

    } catch (error) {
      console.error('❌ Error al obtener tickets:', error);
      throw error;
    }
  }

  /**
   * Obtener tickets del usuario actual
   * @param idUsuario - ID del usuario
   * @returns Promise<RespuestaTicketDto[]> - Tickets del usuario
   */
  async obtenerMisTickets(idUsuario: number): Promise<RespuestaTicketDto[]> {
    console.log(`👤 Obteniendo mis tickets para usuario: ${idUsuario}`);
    return this.obtenerTodos(idUsuario, true);
  }

  /**
   * Obtener tickets donde el usuario está en copia
   * @param idUsuario - ID del usuario
   * @returns Promise<RespuestaTicketDto[]> - Tickets en copia
   */
  async obtenerTicketsEnCopia(idUsuario: number): Promise<RespuestaTicketDto[]> {
    try {
      console.log(`📧 Obteniendo tickets en copia para usuario: ${idUsuario}`);
      
      const tickets = await this.prisma.tickets.findMany({
        where: {
          usuarios_en_copia: {
            some: {
              id_usuario: idUsuario
            }
          }
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
          }
        },
        orderBy: {
          fecha_creacion: 'desc'
        }
      });
      
      console.log(`✅ ${tickets.length} tickets en copia obtenidos`);
      
      return tickets.map(ticket => this.formatearRespuesta(ticket));

    } catch (error) {
      console.error('❌ Error al obtener tickets en copia:', error);
      throw error;
    }
  }

  /**
   * Obtener ticket por ID
   * @param id - ID del ticket
   * @param idUsuario - ID del usuario (para verificar permisos)
   * @returns Promise<RespuestaTicketDto> - Ticket encontrado
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
          responsable: {
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
          }
        }
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
      }

      // Verificar si el usuario tiene acceso al ticket
      if (idUsuario && ticket.id_solicitante !== idUsuario && ticket.asignado_a !== idUsuario) {
        // TODO: También verificar si es admin
        throw new ForbiddenException('No tiene permisos para ver este ticket');
      }

      console.log(`✅ Ticket ${id} encontrado correctamente`);

      return this.formatearRespuesta(ticket);

    } catch (error) {
      console.error(`❌ Error al obtener ticket ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar ticket
   * @param id - ID del ticket
   * @param actualizarTicketDto - Datos a actualizar
   * @param idUsuario - ID del usuario que actualiza
   * @returns Promise<RespuestaTicketDto> - Ticket actualizado
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
        // TODO: También verificar si es admin
        throw new ForbiddenException('No tiene permisos para actualizar este ticket');
      }

      // Actualizar el ticket
      const ticketActualizado = await this.prisma.tickets.update({
        where: { id_ticket: id },
        data: {
          ...actualizarTicketDto,
          fecha_actualizacion: new Date()
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
          }
        }
      });

      console.log(`✅ Ticket ${id} actualizado correctamente`);

      return this.formatearRespuesta(ticketActualizado);

    } catch (error) {
      console.error(`❌ Error al actualizar ticket ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar ticket
   * @param id - ID del ticket
   * @param idUsuario - ID del usuario que elimina
   * @returns Promise<boolean> - Confirmación de eliminación
   */
  async eliminar(id: number, idUsuario?: number): Promise<boolean> {
    try {
      console.log(`🗑️  Eliminando ticket ${id} por usuario: ${idUsuario}`);

      // Verificar que el ticket existe
      const ticketExistente = await this.prisma.tickets.findUnique({
        where: { id_ticket: id }
      });

      if (!ticketExistente) {
        throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
      }

      // Verificar permisos (solo el solicitante o admin pueden eliminar)
      if (idUsuario && ticketExistente.id_solicitante !== idUsuario) {
        // TODO: También verificar si es admin
        throw new ForbiddenException('No tiene permisos para eliminar este ticket');
      }

      // Eliminar el ticket (Prisma maneja las relaciones en cascada)
      await this.prisma.tickets.delete({
        where: { id_ticket: id }
      });

      console.log(`✅ Ticket ${id} eliminado correctamente`);

      return true;

    } catch (error) {
      console.error(`❌ Error al eliminar ticket ${id}:`, error);
      throw error;
    }
  }

  // ============ MÉTODOS ESPECÍFICOS PARA RESPONSABLES ============

  /**
   * Obtener tickets abiertos (estados: Nuevo, En Progreso, Escalado)
   * @param idUsuarioResponsable - ID del responsable
   * @returns Promise<RespuestaTicketDto[]> - Tickets abiertos
   */
  async obtenerTicketsAbiertos(idUsuarioResponsable: number): Promise<RespuestaTicketDto[]> {
    try {
      console.log(`📂 Obteniendo tickets abiertos para responsable: ${idUsuarioResponsable}`);

      // Estados considerados "abiertos": 1=Nuevo, 2=En Progreso, 3=Escalado
      const estadosAbiertos = [1, 2, 3];

      const tickets = await this.prisma.tickets.findMany({
        where: {
          id_estado: {
            in: estadosAbiertos
          }
          // TODO: Filtrar por departamento del responsable cuando esté implementado
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
          }
        },
        orderBy: [
          { id_prioridad: 'asc' }, // Prioridad alta primero
          { fecha_creacion: 'asc' } // Más antiguos primero
        ]
      });

      console.log(`✅ ${tickets.length} tickets abiertos encontrados`);

      return tickets.map(ticket => this.formatearRespuesta(ticket));

    } catch (error) {
      console.error('❌ Error al obtener tickets abiertos:', error);
      throw error;
    }
  }

  /**
   * Obtener tickets cerrados (estados: Resuelto, Cerrado)
   * @param idUsuarioResponsable - ID del responsable
   * @returns Promise<RespuestaTicketDto[]> - Tickets cerrados
   */
  async obtenerTicketsCerrados(idUsuarioResponsable: number): Promise<RespuestaTicketDto[]> {
    try {
      console.log(`📁 Obteniendo tickets cerrados para responsable: ${idUsuarioResponsable}`);

      // Estados considerados "cerrados": 4=Resuelto, 5=Cerrado
      const estadosCerrados = [4, 5];

      const tickets = await this.prisma.tickets.findMany({
        where: {
          id_estado: {
            in: estadosCerrados
          }
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
          }
        },
        orderBy: {
          fecha_resolucion: 'desc'
        }
      });

      console.log(`✅ ${tickets.length} tickets cerrados encontrados`);

      return tickets.map(ticket => this.formatearRespuesta(ticket));

    } catch (error) {
      console.error('❌ Error al obtener tickets cerrados:', error);
      throw error;
    }
  }

  /**
   * Obtener tickets pendientes (vencidos o próximos a vencer)
   * @param idUsuarioResponsable - ID del responsable
   * @returns Promise<RespuestaTicketDto[]> - Tickets pendientes
   */
  async obtenerTicketsPendientes(idUsuarioResponsable: number): Promise<RespuestaTicketDto[]> {
    try {
      console.log(`⏰ Obteniendo tickets pendientes para responsable: ${idUsuarioResponsable}`);

      const ahora = new Date();
      const en24Horas = new Date();
      en24Horas.setHours(en24Horas.getHours() + 24);

      const tickets = await this.prisma.tickets.findMany({
        where: {
          AND: [
            {
              id_estado: {
                in: [1, 2, 3] // Solo tickets abiertos
              }
            },
            {
              OR: [
                // Tickets ya vencidos
                {
                  fecha_vencimiento: {
                    lt: ahora
                  }
                },
                // Tickets que vencen en las próximas 24 horas
                {
                  fecha_vencimiento: {
                    gte: ahora,
                    lte: en24Horas
                  }
                }
              ]
            }
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
          }
        },
        orderBy: {
          fecha_vencimiento: 'asc' // Más urgentes primero
        }
      });

      console.log(`✅ ${tickets.length} tickets pendientes encontrados`);

      return tickets.map(ticket => this.formatearRespuesta(ticket));

    } catch (error) {
      console.error('❌ Error al obtener tickets pendientes:', error);
      throw error;
    }
  }

  /**
   * Tomar un ticket (asignarlo al responsable actual)
   * @param id - ID del ticket
   * @param idUsuarioResponsable - ID del responsable que toma el ticket
   * @returns Promise<RespuestaTicketDto> - Ticket asignado
   */
  async tomarTicket(id: number, idUsuarioResponsable: number): Promise<RespuestaTicketDto> {
    try {
      console.log(`🤝 Responsable ${idUsuarioResponsable} tomando ticket ${id}`);

      // Verificar que el ticket existe y está disponible para tomar
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

      // Asignar el ticket al responsable
      const ticketAsignado = await this.prisma.tickets.update({
        where: { id_ticket: id },
        data: {
          asignado_a: idUsuarioResponsable,
          id_estado: 2, // Cambiar estado a "En Progreso"
          fecha_actualizacion: new Date()
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
          responsable: {
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
          }
        }
      });

      console.log(`✅ Ticket ${id} asignado correctamente a responsable ${idUsuarioResponsable}`);

      return this.formatearRespuesta(ticketAsignado);

    } catch (error) {
      console.error(`❌ Error al tomar ticket ${id}:`, error);
      throw error;
    }
  }

  /**
   * Derivar ticket a otro departamento
   * @param id - ID del ticket
   * @param idDepartamentoDestino - ID del departamento destino
   * @param motivo - Motivo de la derivación
   * @param idUsuarioResponsable - ID del responsable que deriva
   * @returns Promise<RespuestaTicketDto> - Ticket derivado
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

      // Verificar que el departamento destino existe
      const departamentoDestino = await this.prisma.departamentos.findUnique({
        where: { 
          id_departamento: idDepartamentoDestino,
          activo: true
        }
      });

      if (!departamentoDestino) {
        throw new BadRequestException('Departamento destino no válido o inactivo');
      }

      // Verificar que no se esté derivando al mismo departamento
      if (ticket.id_departamento === idDepartamentoDestino) {
        throw new BadRequestException('No se puede derivar al mismo departamento');
      }

      // Iniciar transacción para actualizar ticket y crear registro de derivación
      const resultado = await this.prisma.$transaction(async (prisma) => {
        // Actualizar el ticket con la derivación
        const ticketDerivado = await prisma.tickets.update({
          where: { id_ticket: id },
          data: {
            id_departamento: idDepartamentoDestino,
            asignado_a: null, // Limpiar asignación anterior
            id_estado: 1, // Volver a estado "Nuevo" en el nuevo departamento
            fecha_actualizacion: new Date()
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
            }
          }
        });

        // Registrar la derivación en el historial
        await prisma.derivaciones.create({
          data: {
            id_ticket: id,
            id_departamento_origen: ticket.id_departamento,
            id_departamento_destino: idDepartamentoDestino,
            derivado_por: idUsuarioResponsable,
            motivo: motivo
          }
        });

        return ticketDerivado;
      });

      console.log(`✅ Ticket ${id} derivado correctamente al departamento ${idDepartamentoDestino}`);

      return this.formatearRespuesta(resultado);

    } catch (error) {
      console.error(`❌ Error al derivar ticket ${id}:`, error);
      throw error;
    }
  }

  // ============ MÉTODOS AUXILIARES PRIVADOS ============

  /**
   * Generar número de ticket único
   * @returns Promise<string> - Número de ticket generado
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
        orderBy: {
          numero_ticket: 'desc'
        }
      });

      let siguienteNumero = 1;

      if (ultimoTicket && ultimoTicket.numero_ticket) {
        // Extraer el número secuencial del último ticket
        const numeroActual = ultimoTicket.numero_ticket.split(ano + mes)[1];
        siguienteNumero = parseInt(numeroActual || '0') + 1;
      }

      // Formatear número con ceros a la izquierda (3 dígitos)
      const numeroFormateado = String(siguienteNumero).padStart(3, '0');
      const numeroTicket = `TK${ano}${mes}${numeroFormateado}`;

      console.log(`🎫 Número de ticket generado: ${numeroTicket}`);

      return numeroTicket;

    } catch (error) {
      console.error('❌ Error al generar número de ticket:', error);
      // Fallback con timestamp si falla la generación secuencial
      const timestamp = Date.now().toString().slice(-6);
      return `TK${new Date().getFullYear()}${timestamp}`;
    }
  }

  /**
   * Calcular fecha de vencimiento basada en la prioridad
   * @param nivelPrioridad - Nivel de prioridad (1=Alta, 2=Media, 3=Baja)
   * @returns Date - Fecha de vencimiento calculada
   */
  private calcularFechaVencimiento(nivelPrioridad: number): Date {
    const fechaVencimiento = new Date();
    
    switch (nivelPrioridad) {
      case 1: // Prioridad Alta
        fechaVencimiento.setHours(fechaVencimiento.getHours() + 4); // 4 horas
        break;
      case 2: // Prioridad Media
        fechaVencimiento.setHours(fechaVencimiento.getHours() + 24); // 1 día
        break;
      case 3: // Prioridad Baja
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 3); // 3 días
        break;
      default:
        fechaVencimiento.setHours(fechaVencimiento.getHours() + 24); // Por defecto 1 día
    }

    console.log(`⏱️  Fecha vencimiento calculada para prioridad ${nivelPrioridad}: ${fechaVencimiento.toISOString()}`);

    return fechaVencimiento;
  }

  /**
   * Formatear respuesta del ticket para el frontend
   * @param ticket - Ticket desde la base de datos (con o sin relaciones)
   * @returns RespuestaTicketDto - Ticket formateado
   */
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
      
      // Incluir datos relacionados si están disponibles
      solicitante: ticket.solicitante ? {
        id_usuario: ticket.solicitante.id_usuario,
        primer_nombre: ticket.solicitante.primer_nombre,
        primer_apellido: ticket.solicitante.primer_apellido,
        correo: ticket.solicitante.correo
      } : undefined,
      
      responsable: ticket.responsable ? {
        id_usuario: ticket.responsable.id_usuario,
        primer_nombre: ticket.responsable.primer_nombre,
        primer_apellido: ticket.responsable.primer_apellido,
        correo: ticket.responsable.correo
      } : undefined,
      
      departamento: ticket.departamento ? {
        id_departamento: ticket.departamento.id_departamento,
        nombre_departamento: ticket.departamento.nombre_departamento
      } : undefined,
      
      prioridad: ticket.prioridad ? {
        id_prioridad: ticket.prioridad.id_prioridad,
        nombre_prioridad: ticket.prioridad.nombre_prioridad,
        nivel: ticket.prioridad.nivel
      } : undefined,
      
      estado: ticket.estado ? {
        id_estado: ticket.estado.id_estado,
        nombre_estado: ticket.estado.nombre_estado
      } : undefined
    };
  }

  /**
   * Asignar responsable automáticamente basado en carga de trabajo
   * @param idDepartamento - ID del departamento
   * @returns Promise<number | null> - ID del responsable asignado
   */
  private async asignarResponsableAutomatico(idDepartamento: number): Promise<number | null> {
    try {
      // TODO: Implementar lógica de asignación automática
      // 1. Obtener responsables del departamento
      // 2. Calcular carga de trabajo de cada uno
      // 3. Asignar al que tenga menor carga
      
      console.log(`🔄 Asignación automática pendiente para departamento ${idDepartamento}`);
      return null;

    } catch (error) {
      console.error('❌ Error en asignación automática:', error);
      return null;
    }
  }
  /**
 * Obtener datos maestros para formulario
 * @returns Promise con departamentos y prioridades
 */
async obtenerDatosMaestrosFormulario(): Promise<{
  departamentos: any[];
  prioridades: any[];
}> {
  try {
    console.log('📚 Obteniendo datos maestros para formulario...');

    const [departamentos, prioridades] = await Promise.all([
      this.prisma.departamentos.findMany({
        orderBy: { nombre_departamento: 'asc' }
      }),
      this.prisma.prioridades.findMany({
        orderBy: { nivel: 'asc' }
      })
    ]);

    return {
      departamentos: departamentos.map(d => ({
        id_departamento: d.id_departamento,
        nombre_departamento: d.nombre_departamento
      })),
      prioridades: prioridades.map(p => ({
        id_prioridad: p.id_prioridad,
        nombre_prioridad: p.nombre_prioridad,
        nivel: p.nivel
      }))
    };

  } catch (error) {
    console.error('❌ Error al obtener datos maestros:', error);
    throw error;
  }
}

/**
 * Validar datos antes de crear ticket
 * @param idDepartamento - ID del departamento
 * @param idPrioridad - ID de la prioridad
 * @returns Promise<boolean> - True si los datos son válidos
 */
async validarDatosTicket(idDepartamento: number, idPrioridad: number): Promise<boolean> {
  try {
    const [departamento, prioridad] = await Promise.all([
      this.prisma.departamentos.findUnique({
        where: { id_departamento: idDepartamento }
      }),
      this.prisma.prioridades.findUnique({
        where: { id_prioridad: idPrioridad }
      })
    ]);

    const esValido = !!departamento && !!prioridad;
    console.log(`🔍 Validación datos: dept=${!!departamento}, prioridad=${!!prioridad}`);
    
    return esValido;

  } catch (error) {
    console.error('❌ Error en validación:', error);
    return false;
  }
}
}