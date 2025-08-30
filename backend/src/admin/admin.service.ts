import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

interface CrearUsuarioDto {
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido: string;
  correo: string;
  rut: string;
  contrasena: string;
  confirmar_contrasena?: string;
  id_departamento: number;
  rol: string;
}

interface ActualizarUsuarioDto {
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  correo?: string;
  rut?: string;
  contrasena?: string;
  id_departamento?: number;
  rol?: string;
}

interface CrearDepartamentoDto {
  nombre: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerUsuarios(filtros: any = {}) {
    try {
      const condicionesBusqueda: any = {};

      if (filtros.nombre) {
        condicionesBusqueda.OR = [
          { primer_nombre: { contains: filtros.nombre, mode: 'insensitive' } },
          { segundo_nombre: { contains: filtros.nombre, mode: 'insensitive' } },
          { primer_apellido: { contains: filtros.nombre, mode: 'insensitive' } },
          { segundo_apellido: { contains: filtros.nombre, mode: 'insensitive' } },
        ];
      }

      if (filtros.departamento) {
        condicionesBusqueda.id_departamento = parseInt(filtros.departamento);
      }

      if (filtros.rol && filtros.rol !== 'todos') {
        condicionesBusqueda.id_rol = parseInt(filtros.rol);
      }

      const usuarios = await this.prisma.usuarios.findMany({
        where: condicionesBusqueda,
        include: {
          departamento: {
            select: {
              id_departamento: true,
              nombre_departamento: true,
            },
          },
          rol: {
            select: {
              id_rol: true,
              nombre_rol: true,
            },
          },
        },
        orderBy: [
          { primer_apellido: 'asc' },
          { primer_nombre: 'asc' },
        ],
      });

      return usuarios.map(usuario => ({
        id: usuario.id_usuario,
        primer_nombre: usuario.primer_nombre,
        segundo_nombre: usuario.segundo_nombre,
        primer_apellido: usuario.primer_apellido,
        segundo_apellido: usuario.segundo_apellido,
        nombre_completo: `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido}`.trim(),
        correo: usuario.correo,
        rut: usuario.rut,
        rol: usuario.rol?.nombre_rol || 'Sin rol',
        id_rol: usuario.id_rol,
        id_departamento: usuario.id_departamento,
        fecha_creacion: usuario.fecha_creacion,
        ultimo_acceso: usuario.ultimo_acceso,
        departamento: usuario.departamento,
      }));

    } catch (error) {
      throw new HttpException('Error al obtener lista de usuarios', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerUsuarioPorId(id: number) {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { id_usuario: id },
        include: {
          departamento: {
            select: {
              id_departamento: true,
              nombre_departamento: true,
            },
          },
          rol: {
            select: {
              id_rol: true,
              nombre_rol: true,
              permisos: true,
            },
          },
        },
      });

      if (!usuario) return null;

      return {
        id: usuario.id_usuario,
        primer_nombre: usuario.primer_nombre,
        segundo_nombre: usuario.segundo_nombre,
        primer_apellido: usuario.primer_apellido,
        segundo_apellido: usuario.segundo_apellido,
        nombre_completo: `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido}`.trim(),
        correo: usuario.correo,
        rut: usuario.rut,
        rol: usuario.rol?.nombre_rol || 'Sin rol',
        id_rol: usuario.id_rol,
        id_departamento: usuario.id_departamento,
        fecha_creacion: usuario.fecha_creacion,
        ultimo_acceso: usuario.ultimo_acceso,
        departamento: usuario.departamento,
      };

    } catch (error) {
      throw new HttpException('Error al obtener usuario', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async crearUsuario(datosUsuario: CrearUsuarioDto) {
    try {
      const departamento = await this.prisma.departamentos.findUnique({
        where: { id_departamento: datosUsuario.id_departamento },
      });

      if (!departamento) {
        throw new HttpException(
          `Departamento con ID ${datosUsuario.id_departamento} no existe`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const usuarioExistente = await this.prisma.usuarios.findUnique({
        where: { correo: datosUsuario.correo },
      });

      if (usuarioExistente) {
        throw new HttpException('El correo electrónico ya está registrado', HttpStatus.CONFLICT);
      }

      const rutExistente = await this.prisma.usuarios.findUnique({
        where: { rut: datosUsuario.rut },
      });

      if (rutExistente) {
        throw new HttpException('El RUT ya está registrado', HttpStatus.CONFLICT);
      }

      const rolEncontrado = await this.prisma.roles.findFirst({
        where: { 
          nombre_rol: {
            equals: datosUsuario.rol,
            mode: 'insensitive'
          }
        },
      });

      if (!rolEncontrado) {
        throw new HttpException(`Rol '${datosUsuario.rol}' no existe en el sistema`, HttpStatus.BAD_REQUEST);
      }

      const contrasenaEncriptada = await bcrypt.hash(datosUsuario.contrasena, 12);

      const nuevoUsuario = await this.prisma.usuarios.create({
        data: {
          primer_nombre: datosUsuario.primer_nombre,
          segundo_nombre: datosUsuario.segundo_nombre,
          primer_apellido: datosUsuario.primer_apellido,
          segundo_apellido: datosUsuario.segundo_apellido,
          correo: datosUsuario.correo,
          rut: datosUsuario.rut,
          hash_contrasena: contrasenaEncriptada,
          id_rol: rolEncontrado.id_rol,
          id_departamento: datosUsuario.id_departamento,
          fecha_creacion: new Date(),
        },
        include: {
          departamento: {
            select: {
              id_departamento: true,
              nombre_departamento: true,
            },
          },
          rol: {
            select: {
              id_rol: true,
              nombre_rol: true,
            },
          },
        },
      });

      const { hash_contrasena, ...usuarioSinContrasena } = nuevoUsuario;
      return {
        ...usuarioSinContrasena,
        id: nuevoUsuario.id_usuario,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno al crear usuario', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async actualizarUsuario(id: number, datosActualizacion: ActualizarUsuarioDto) {
    try {
      const usuarioExistente = await this.prisma.usuarios.findUnique({
        where: { id_usuario: id },
      });

      if (!usuarioExistente) {
        throw new HttpException(`Usuario con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }

      const datosActualizacionProcesados: any = { ...datosActualizacion };

      if (datosActualizacion.contrasena) {
        datosActualizacionProcesados.hash_contrasena = await bcrypt.hash(datosActualizacion.contrasena, 12);
        delete datosActualizacionProcesados.contrasena;
      }

      if (datosActualizacion.rol) {
        const rolEncontrado = await this.prisma.roles.findFirst({
          where: { 
            nombre_rol: {
              equals: datosActualizacion.rol,
              mode: 'insensitive'
            }
          },
        });

        if (!rolEncontrado) {
          throw new HttpException(`Rol '${datosActualizacion.rol}' no existe`, HttpStatus.BAD_REQUEST);
        }

        datosActualizacionProcesados.id_rol = rolEncontrado.id_rol;
        delete datosActualizacionProcesados.rol;
      }

      const usuarioActualizado = await this.prisma.usuarios.update({
        where: { id_usuario: id },
        data: datosActualizacionProcesados,
        include: {
          departamento: {
            select: {
              id_departamento: true,
              nombre_departamento: true,
            },
          },
          rol: {
            select: {
              id_rol: true,
              nombre_rol: true,
            },
          },
        },
      });

      const { hash_contrasena, ...usuarioSinContrasena } = usuarioActualizado;
      return {
        ...usuarioSinContrasena,
        id: usuarioActualizado.id_usuario,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno al actualizar usuario', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async eliminarUsuario(id: number): Promise<void> {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { id_usuario: id },
      });

      if (!usuario) {
        throw new HttpException(`Usuario con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }

      const ticketsActivos = await this.prisma.tickets.count({
        where: {
          asignado_a: id,
          fecha_resolucion: null,
        },
      });

      if (ticketsActivos > 0) {
        throw new HttpException(
          `No se puede eliminar: usuario tiene ${ticketsActivos} tickets activos asignados`,
          HttpStatus.CONFLICT,
        );
      }

      await this.prisma.usuarios.delete({
        where: { id_usuario: id },
      });

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno al eliminar usuario', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerDepartamentos(filtros?: any) {
    try {
      const departamentos = await this.prisma.departamentos.findMany({
        include: {
          _count: {
            select: {
              usuarios: true,
              tickets: true,
            },
          },
        },
        orderBy: { nombre_departamento: 'asc' },
      });

      return departamentos.map(dept => ({
        id: dept.id_departamento,
        nombre: dept.nombre_departamento,
        usuarios_activos: dept._count.usuarios,
        tickets_activos: dept._count.tickets,
      }));

    } catch (error) {
      throw new HttpException('Error al obtener departamentos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerDepartamentoPorId(id: number) {
    try {
      const departamento = await this.prisma.departamentos.findUnique({
        where: { id_departamento: id },
        include: {
          usuarios: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true,
              rol: {
                select: {
                  nombre_rol: true,
                },
              },
            },
          },
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      });

      if (!departamento) return null;

      return {
        id: departamento.id_departamento,
        nombre: departamento.nombre_departamento,
        usuarios: departamento.usuarios,
        tickets_activos: departamento._count.tickets,
      };

    } catch (error) {
      throw new HttpException('Error al obtener departamento', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async crearDepartamento(datosDepartamento: CrearDepartamentoDto) {
    try {
      const nombreExistente = await this.prisma.departamentos.findFirst({
        where: { 
          nombre_departamento: { 
            equals: datosDepartamento.nombre,
            mode: 'insensitive'
          }
        },
      });

      if (nombreExistente) {
        throw new HttpException('Ya existe un departamento con ese nombre', HttpStatus.CONFLICT);
      }

      const nuevoDepartamento = await this.prisma.departamentos.create({
        data: {
          nombre_departamento: datosDepartamento.nombre,
        },
      });

      return {
        id: nuevoDepartamento.id_departamento,
        nombre: nuevoDepartamento.nombre_departamento,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno al crear departamento', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerEstadisticasGenerales() {
    try {
      const [
        totalUsuarios,
        totalDepartamentos,
        totalTickets,
        ticketsPendientes,
        ticketsCerrados,
      ] = await Promise.all([
        this.prisma.usuarios.count(),
        this.prisma.departamentos.count(),
        this.prisma.tickets.count(),
        this.prisma.tickets.count({ where: { fecha_resolucion: null } }),
        this.prisma.tickets.count({ where: { fecha_resolucion: { not: null } } }),
      ]);

      return {
        usuarios: {
          total: totalUsuarios,
        },
        departamentos: {
          total: totalDepartamentos,
        },
        tickets: {
          total: totalTickets,
          pendientes: ticketsPendientes,
          cerrados: ticketsCerrados,
        },
        metricas: {
          porcentaje_tickets_cerrados: totalTickets > 0 ? Math.round((ticketsCerrados / totalTickets) * 100) : 0,
        },
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      throw new HttpException('Error al calcular estadísticas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerTicketsPorEstado() {
    try {
      const distribucion = await this.prisma.tickets.groupBy({
        by: ['id_estado'],
        _count: { id_ticket: true },
        orderBy: { _count: { id_ticket: 'desc' } },
      });

      const estados = await this.prisma.estados_ticket.findMany({
        select: { id_estado: true, nombre_estado: true },
      });

      const mapaEstados = new Map(estados.map(estado => [estado.id_estado, estado.nombre_estado]));

      const distribucionFormateada = distribucion.map(item => ({
        estado_id: item.id_estado,
        estado_nombre: mapaEstados.get(item.id_estado) || 'Estado desconocido',
        cantidad: item._count.id_ticket,
        porcentaje: 0,
      }));

      const totalTickets = distribucionFormateada.reduce((acc, item) => acc + item.cantidad, 0);
      
      if (totalTickets > 0) {
        distribucionFormateada.forEach(item => {
          item.porcentaje = Math.round((item.cantidad / totalTickets) * 100);
        });
      }

      return distribucionFormateada;

    } catch (error) {
      throw new HttpException('Error al obtener distribución por estado', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerTicketsPorPrioridad() {
    try {
      const distribucion = await this.prisma.tickets.groupBy({
        by: ['id_prioridad'],
        _count: { id_ticket: true },
        orderBy: { _count: { id_ticket: 'desc' } },
      });

      const prioridades = await this.prisma.prioridades.findMany({
        select: { id_prioridad: true, nombre_prioridad: true, nivel: true },
        orderBy: { nivel: 'asc' },
      });

      const mapaPrioridades = new Map(prioridades.map(prioridad => [prioridad.id_prioridad, prioridad.nombre_prioridad]));

      const distribucionFormateada = distribucion.map(item => ({
        prioridad_id: item.id_prioridad,
        prioridad_nombre: mapaPrioridades.get(item.id_prioridad) || 'Prioridad desconocida',
        cantidad: item._count.id_ticket,
        porcentaje: 0,
      }));

      const totalTickets = distribucionFormateada.reduce((acc, item) => acc + item.cantidad, 0);
      
      if (totalTickets > 0) {
        distribucionFormateada.forEach(item => {
          item.porcentaje = Math.round((item.cantidad / totalTickets) * 100);
        });
      }

      return distribucionFormateada;

    } catch (error) {
      throw new HttpException('Error al obtener distribución por prioridad', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerTicketsPorDepartamento() {
    try {
      const distribucion = await this.prisma.tickets.groupBy({
        by: ['id_departamento'],
        _count: { id_ticket: true },
        orderBy: { _count: { id_ticket: 'desc' } },
      });

      const departamentos = await this.prisma.departamentos.findMany({
        select: { id_departamento: true, nombre_departamento: true },
      });

      const mapaDepartamentos = new Map(departamentos.map(dept => [dept.id_departamento, dept.nombre_departamento]));

      const distribucionFormateada = distribucion.map(item => ({
        departamento_id: item.id_departamento,
        departamento_nombre: mapaDepartamentos.get(item.id_departamento) || 'Sin departamento',
        cantidad: item._count.id_ticket,
        porcentaje: 0,
      }));

      const totalTickets = distribucionFormateada.reduce((acc, item) => acc + item.cantidad, 0);
      
      if (totalTickets > 0) {
        distribucionFormateada.forEach(item => {
          item.porcentaje = Math.round((item.cantidad / totalTickets) * 100);
        });
      }

      return distribucionFormateada;

    } catch (error) {
      throw new HttpException('Error al obtener distribución por departamento', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerTicketsResueltos(fechaInicio?: string, fechaFin?: string) {
    try {
      const filtrosFecha: any = {
        fecha_resolucion: { not: null },
      };

      if (fechaInicio || fechaFin) {
        if (fechaInicio) {
          filtrosFecha.fecha_resolucion.gte = new Date(fechaInicio);
        }
        
        if (fechaFin) {
          const fechaFinAjustada = new Date(fechaFin);
          fechaFinAjustada.setHours(23, 59, 59, 999);
          filtrosFecha.fecha_resolucion.lte = fechaFinAjustada;
        }
      }

      const ticketsResueltos = await this.prisma.tickets.findMany({
        where: filtrosFecha,
        include: {
          solicitante: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true,
            },
          },
          responsable: {
            select: {
              id_usuario: true,
              primer_nombre: true,
              primer_apellido: true,
              correo: true,
            },
          },
          departamento: {
            select: {
              id_departamento: true,
              nombre_departamento: true,
            },
          },
        },
        orderBy: { fecha_resolucion: 'desc' },
      });

      return ticketsResueltos.map(ticket => ({
        id: ticket.id_ticket,
        numero_ticket: ticket.numero_ticket,
        asunto: ticket.asunto,
        descripcion: ticket.descripcion,
        fecha_creacion: ticket.fecha_creacion,
        fecha_resolucion: ticket.fecha_resolucion,
        tiempo_resolucion_horas: ticket.fecha_resolucion && ticket.fecha_creacion ? 
          Math.round((ticket.fecha_resolucion.getTime() - ticket.fecha_creacion.getTime()) / (1000 * 60 * 60)) : 0,
        solicitante: ticket.solicitante,
        responsable: ticket.responsable,
        departamento: ticket.departamento,
      }));

    } catch (error) {
      throw new HttpException('Error al obtener tickets resueltos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerRendimientoTecnicos(fechaInicio?: string, fechaFin?: string) {
    try {
      let filtrosFecha = {};
      if (fechaInicio || fechaFin) {
        filtrosFecha = { fecha_creacion: {} };
        
        if (fechaInicio) {
          filtrosFecha['fecha_creacion']['gte'] = new Date(fechaInicio);
        }
        
        if (fechaFin) {
          const fechaFinAjustada = new Date(fechaFin);
          fechaFinAjustada.setHours(23, 59, 59, 999);
          filtrosFecha['fecha_creacion']['lte'] = fechaFinAjustada;
        }
      }

      const rolTecnico = await this.prisma.roles.findFirst({
        where: { 
          nombre_rol: { equals: 'tecnico', mode: 'insensitive' }
        },
      });

      if (!rolTecnico) {
        throw new HttpException('Rol técnico no encontrado en el sistema', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const tecnicos = await this.prisma.usuarios.findMany({
        where: { id_rol: rolTecnico.id_rol },
        include: {
          departamento: {
            select: { nombre_departamento: true },
          },
        },
      });

      const reporteRendimiento = [];

      for (const tecnico of tecnicos) {
        const [ticketsAsignados, ticketsResueltos, ticketsPendientes] = await Promise.all([
          this.prisma.tickets.count({
            where: { asignado_a: tecnico.id_usuario, ...filtrosFecha },
          }),
          this.prisma.tickets.count({
            where: { asignado_a: tecnico.id_usuario, fecha_resolucion: { not: null }, ...filtrosFecha },
          }),
          this.prisma.tickets.count({
            where: { asignado_a: tecnico.id_usuario, fecha_resolucion: null },
          }),
        ]);

        const ticketsConTiempos = await this.prisma.tickets.findMany({
          where: { asignado_a: tecnico.id_usuario, fecha_resolucion: { not: null }, ...filtrosFecha },
          select: { fecha_creacion: true, fecha_resolucion: true },
        });

        let tiempoPromedioResolucion = 0;
        if (ticketsConTiempos.length > 0) {
          const totalTiempo = ticketsConTiempos.reduce((acc, ticket) => {
            if (ticket.fecha_resolucion && ticket.fecha_creacion) {
              const diferencia = ticket.fecha_resolucion.getTime() - ticket.fecha_creacion.getTime();
              return acc + diferencia;
            }
            return acc;
          }, 0);

          tiempoPromedioResolucion = Math.round(totalTiempo / ticketsConTiempos.length / (1000 * 60 * 60));
        }

        const eficiencia = ticketsAsignados > 0 ? Math.round((ticketsResueltos / ticketsAsignados) * 100) : 0;

        reporteRendimiento.push({
          tecnico_id: tecnico.id_usuario,
          nombre_completo: `${tecnico.primer_nombre} ${tecnico.primer_apellido}`,
          correo: tecnico.correo,
          departamento: tecnico.departamento?.nombre_departamento || 'Sin departamento',
          tickets_asignados: ticketsAsignados,
          tickets_resueltos: ticketsResueltos,
          tickets_pendientes: ticketsPendientes,
          tiempo_promedio_resolucion_horas: tiempoPromedioResolucion,
          eficiencia_porcentaje: eficiencia,
        });
      }

      return reporteRendimiento.sort((a, b) => b.eficiencia_porcentaje - a.eficiencia_porcentaje);

    } catch (error) {
      throw new HttpException('Error al generar reporte de rendimiento', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerTiempoPromedioResolucion() {
    try {
      const departamentos = await this.prisma.departamentos.findMany({
        select: { id_departamento: true, nombre_departamento: true },
      });

      const metricas = [];

      for (const departamento of departamentos) {
        const fechaHace90Dias = new Date();
        fechaHace90Dias.setDate(fechaHace90Dias.getDate() - 90);

        const ticketsResueltos = await this.prisma.tickets.findMany({
          where: {
            id_departamento: departamento.id_departamento,
            fecha_resolucion: { not: null, gte: fechaHace90Dias },
          },
        });

        if (ticketsResueltos.length === 0) {
          metricas.push({
            departamento_id: departamento.id_departamento,
            departamento_nombre: departamento.nombre_departamento,
            total_tickets: 0,
            tiempo_promedio_horas: 0,
          });
          continue;
        }

        const totalTiempo = ticketsResueltos.reduce((acc, ticket) => {
          if (ticket.fecha_resolucion && ticket.fecha_creacion) {
            const diferencia = ticket.fecha_resolucion.getTime() - ticket.fecha_creacion.getTime();
            return acc + diferencia;
          }
          return acc;
        }, 0);

        const tiempoPromedioGeneral = Math.round(totalTiempo / ticketsResueltos.length / (1000 * 60 * 60));

        metricas.push({
          departamento_id: departamento.id_departamento,
          departamento_nombre: departamento.nombre_departamento,
          total_tickets: ticketsResueltos.length,
          tiempo_promedio_horas: tiempoPromedioGeneral,
        });
      }

      return metricas.sort((a, b) => a.tiempo_promedio_horas - b.tiempo_promedio_horas);

    } catch (error) {
      throw new HttpException('Error al calcular métricas de tiempo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validarEmail(email: string, usuarioId?: number) {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { correo: email },
      });

      if (!usuario) return true;
      
      return usuarioId ? usuario.id_usuario === usuarioId : false;

    } catch (error) {
      throw new HttpException('Error al validar email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validarRut(rut: string, usuarioId?: number) {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { rut: rut },
      });

      if (!usuario) return true;
      
      return usuarioId ? usuario.id_usuario === usuarioId : false;

    } catch (error) {
      throw new HttpException('Error al validar RUT', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerResumenEmpresa() {
    try {
      const [usuarios, departamentos, tickets] = await Promise.all([
        this.prisma.usuarios.count(),
        this.prisma.departamentos.count(),
        this.prisma.tickets.count(),
      ]);

      return {
        total_usuarios: usuarios,
        total_departamentos: departamentos,
        total_tickets: tickets,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      throw new HttpException('Error al obtener resumen', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerMetricasDepartamentos() {
    try {
      const departamentos = await this.prisma.departamentos.findMany({
        include: {
          _count: {
            select: {
              usuarios: true,
              tickets: true,
            },
          },
        },
      });

      return departamentos.map(dept => ({
        id: dept.id_departamento,
        nombre: dept.nombre_departamento,
        total_usuarios: dept._count.usuarios,
        tickets_activos: dept._count.tickets,
      }));

    } catch (error) {
      throw new HttpException('Error al obtener métricas de departamentos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerMetricasDepartamento(id: number) {
    try {
      const departamento = await this.prisma.departamentos.findUnique({
        where: { id_departamento: id },
        include: {
          _count: {
            select: {
              usuarios: true,
              tickets: true,
            },
          },
        },
      });

      if (!departamento) return null;

      return {
        id: departamento.id_departamento,
        nombre: departamento.nombre_departamento,
        total_usuarios: departamento._count.usuarios,
        tickets_activos: departamento._count.tickets,
      };

    } catch (error) {
      throw new HttpException('Error al obtener métricas del departamento', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerTendenciaMensual(meses: number = 12) {
    try {
      const fechaHaceMeses = new Date();
      fechaHaceMeses.setMonth(fechaHaceMeses.getMonth() - meses);

      const tickets = await this.prisma.tickets.findMany({
        where: {
          fecha_creacion: {
            gte: fechaHaceMeses,
          },
        },
        select: {
          fecha_creacion: true,
          fecha_resolucion: true,
        },
      });

      const tendenciaPorMes = new Map();

      tickets.forEach(ticket => {
        if (ticket.fecha_creacion) {
          const mesAno = `${ticket.fecha_creacion.getFullYear()}-${String(ticket.fecha_creacion.getMonth() + 1).padStart(2, '0')}`;
          
          if (!tendenciaPorMes.has(mesAno)) {
            tendenciaPorMes.set(mesAno, {
              mes: mesAno,
              creados: 0,
              resueltos: 0,
            });
          }

          const stats = tendenciaPorMes.get(mesAno);
          stats.creados++;

          if (ticket.fecha_resolucion) {
            stats.resueltos++;
          }
        }
      });

      return Array.from(tendenciaPorMes.values()).sort((a, b) => a.mes.localeCompare(b.mes));

    } catch (error) {
      throw new HttpException('Error al obtener tendencia mensual', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}