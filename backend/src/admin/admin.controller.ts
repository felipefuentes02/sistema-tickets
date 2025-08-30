import {Controller, Get,Post, Put,Delete,Body, Param, Query, ParseIntPipe, HttpException, HttpStatus} from '@nestjs/common';
import { AdminService } from './admin.service';

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
  descripcion?: string;
  codigo_departamento: number;
}

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Obtiene lista de usuarios con filtros opcionales
   * GET /api/admin/usuarios
   */
  @Get('usuarios')
  async obtenerUsuarios(@Query() filtros: any) {
    try {
      console.log('📥 GET /api/admin/usuarios - Filtros aplicados:', filtros);

      const usuarios = await this.adminService.obtenerUsuarios(filtros);

      return {
        success: true,
        data: usuarios,
        message: `${usuarios.length} usuarios obtenidos correctamente`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en GET /usuarios:', error);
      throw new HttpException(
        {
          success: false,
          data: [],
          message: 'Error al obtener lista de usuarios',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('usuarios/:id')
  async obtenerUsuarioPorId(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`📥 GET /api/admin/usuarios/${id}`);

      // Validar que el ID sea un número positivo
      if (id <= 0) {
        throw new HttpException(
          {
            success: false,
            data: null,
            message: 'ID de usuario debe ser un número positivo',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const usuario = await this.adminService.obtenerUsuarioPorId(id);

      if (!usuario) {
        throw new HttpException(
          {
            success: false,
            data: null,
            message: `Usuario con ID ${id} no encontrado`,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: usuario,
        message: 'Usuario obtenido correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error en GET /usuarios/${id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error interno al obtener usuario',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('usuarios')
  async crearUsuario(@Body() datosUsuario: CrearUsuarioDto) {
    try {
      console.log('📥 POST /api/admin/usuarios - Creando usuario:', {
        ...datosUsuario,
        contrasena: '[OCULTA]',
        confirmar_contrasena: '[OCULTA]'
      });

      if (datosUsuario.contrasena !== datosUsuario.confirmar_contrasena) {
        throw new HttpException(
          {
            success: false,
            data: null,
            message: 'Las contraseñas no coinciden',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const nuevoUsuario = await this.adminService.crearUsuario(datosUsuario);

      return {
        success: true,
        data: nuevoUsuario,
        message: 'Usuario creado exitosamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en POST /usuarios:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al crear usuario',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('usuarios/:id')
  async actualizarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() datosActualizacion: ActualizarUsuarioDto,
  ) {
    try {
      console.log(`📥 PUT /api/admin/usuarios/${id} - Actualizando:`, {
        ...datosActualizacion,
        contrasena: datosActualizacion.contrasena ? '[OCULTA]' : undefined
      });

      if (id <= 0) {
        throw new HttpException(
          {
            success: false,
            data: null,
            message: 'ID de usuario debe ser un número positivo',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const usuarioActualizado = await this.adminService.actualizarUsuario(id, datosActualizacion);

      return {
        success: true,
        data: usuarioActualizado,
        message: 'Usuario actualizado correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error en PUT /usuarios/${id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al actualizar usuario',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('usuarios/:id')
  async eliminarUsuario(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`📥 DELETE /api/admin/usuarios/${id}`);

      if (id <= 0) {
        throw new HttpException(
          {
            success: false,
            data: null,
            message: 'ID de usuario debe ser un número positivo',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.adminService.eliminarUsuario(id);

      return {
        success: true,
        data: null,
        message: 'Usuario eliminado correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error en DELETE /usuarios/${id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al eliminar usuario',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('departamentos')
  async obtenerDepartamentos() {
    try {
      console.log('📥 GET /api/admin/departamentos');

      const departamentos = await this.adminService.obtenerDepartamentos();

      return {
        success: true,
        data: departamentos,
        message: `${departamentos.length} departamentos obtenidos correctamente`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en GET /departamentos:', error);
      throw new HttpException(
        {
          success: false,
          data: [],
          message: 'Error al obtener departamentos',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('departamentos/:id')
  async obtenerDepartamentoPorId(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`📥 GET /api/admin/departamentos/${id}`);

      if (id <= 0) {
        throw new HttpException(
          {
            success: false,
            data: null,
            message: 'ID de departamento debe ser un número positivo',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const departamento = await this.adminService.obtenerDepartamentoPorId(id);

      if (!departamento) {
        throw new HttpException(
          {
            success: false,
            data: null,
            message: `Departamento con ID ${id} no encontrado`,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: departamento,
        message: 'Departamento obtenido correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error en GET /departamentos/${id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error interno al obtener departamento',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo departamento
   * POST /api/admin/departamentos
   */
  @Post('departamentos')
  async crearDepartamento(@Body() datosDepartamento: CrearDepartamentoDto) {
    try {
      console.log('📥 POST /api/admin/departamentos - Creando:', datosDepartamento);

      const nuevoDepartamento = await this.adminService.crearDepartamento(datosDepartamento);

      return {
        success: true,
        data: nuevoDepartamento,
        message: 'Departamento creado exitosamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en POST /departamentos:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al crear departamento',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('estadisticas')
  async obtenerEstadisticas() {
    try {
      console.log('📥 GET /api/admin/estadisticas');

      const estadisticas = await this.adminService.obtenerEstadisticasGenerales();

      return {
        success: true,
        data: estadisticas,
        message: 'Estadísticas obtenidas correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en GET /estadisticas:', error);
      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al obtener estadísticas',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tickets/por-estado')
  async obtenerDistribucionTicketsPorEstado() {
    try {
      console.log('📥 GET /api/admin/tickets/por-estado');

      const distribucion = await this.adminService.obtenerTicketsPorEstado();

      return {
        success: true,
        data: distribucion,
        message: 'Distribución por estado obtenida correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en GET /tickets/por-estado:', error);
      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al obtener distribución por estado',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tickets/por-prioridad')
  async obtenerDistribucionTicketsPorPrioridad() {
    try {
      console.log('📥 GET /api/admin/tickets/por-prioridad');

      const distribucion = await this.adminService.obtenerTicketsPorPrioridad();

      return {
        success: true,
        data: distribucion,
        message: 'Distribución por prioridad obtenida correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en GET /tickets/por-prioridad:', error);
      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al obtener distribución por prioridad',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tickets/por-departamento')
  async obtenerDistribucionTicketsPorDepartamento() {
    try {
      console.log('📥 GET /api/admin/tickets/por-departamento');

      const distribucion = await this.adminService.obtenerTicketsPorDepartamento();

      return {
        success: true,
        data: distribucion,
        message: 'Distribución por departamento obtenida correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en GET /tickets/por-departamento:', error);
      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al obtener distribución por departamento',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tickets/resueltos')
  async obtenerTicketsResueltos(
    @Query('fecha_inicio') fechaInicio?: string,
    @Query('fecha_fin') fechaFin?: string,
  ) {
    try {
      console.log('📥 GET /api/admin/tickets/resueltos - Rango:', { fechaInicio, fechaFin });

      const ticketsResueltos = await this.adminService.obtenerTicketsResueltos(
        fechaInicio,
        fechaFin,
      );

      return {
        success: true,
        data: ticketsResueltos,
        message: 'Tickets resueltos obtenidos correctamente',
        filtros: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en GET /tickets/resueltos:', error);
      throw new HttpException(
        {
          success: false,
          data: [],
          message: 'Error al obtener tickets resueltos',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reportes/rendimiento-tecnicos')
  async obtenerRendimientoTecnicos(
    @Query('fecha_inicio') fechaInicio?: string,
    @Query('fecha_fin') fechaFin?: string,
  ) {
    try {
      console.log('📥 GET /api/admin/reportes/rendimiento-tecnicos - Parámetros:', {
        fechaInicio,
        fechaFin,
      });

      const reporte = await this.adminService.obtenerRendimientoTecnicos(
        fechaInicio,
        fechaFin,
      );

      return {
        success: true,
        data: reporte,
        message: 'Reporte de rendimiento obtenido correctamente',
        parametros: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en GET /reportes/rendimiento-tecnicos:', error);
      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al generar reporte de rendimiento',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('metricas/tiempo-resolucion')
  async obtenerMetricasTiempoResolucion() {
    try {
      console.log('📥 GET /api/admin/metricas/tiempo-resolucion');

      const metricas = await this.adminService.obtenerTiempoPromedioResolucion();

      return {
        success: true,
        data: metricas,
        message: 'Métricas de tiempo de resolución obtenidas correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en GET /metricas/tiempo-resolucion:', error);
      throw new HttpException(
        {
          success: false,
          data: null,
          message: 'Error al obtener métricas de tiempo',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}