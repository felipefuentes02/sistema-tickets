import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { AdminService } from '../admin.service';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';

/**
 * Controlador para operaciones administrativas
 * Maneja endpoints para gestión de usuarios, departamentos y métricas
 */
@Controller('admin')
// @UseGuards(JwtAuthGuard, AdminGuard) // Descomentar cuando implementes autenticación
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============ ENDPOINTS DE USUARIOS ============

  /**
   * Obtiene la lista de todos los usuarios
   * GET /api/admin/usuarios
   */
  @Get('usuarios')
  async obtenerUsuarios(
    @Query('nombre') nombre?: string,
    @Query('departamento') departamento?: string,
    @Query('rol') rol?: string,
    @Query('activo') activo?: string,
    @Query('pagina') pagina: string = '1',
    @Query('limite') limite: string = '10'
  ) {
    try {
      const filtros = {
        nombre,
        departamento: departamento ? parseInt(departamento) : undefined,
        rol,
        activo: activo !== undefined ? activo === 'true' : undefined,
        pagina: parseInt(pagina),
        limite: parseInt(limite)
      };

      const usuarios = await this.adminService.obtenerUsuarios(filtros);
      
      return {
        success: true,
        data: usuarios,
        message: 'Usuarios obtenidos correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al obtener usuarios',
        error: error.message
      };
    }
  }

  /**
   * Obtiene un usuario específico por ID
   * GET /api/admin/usuarios/:id
   */
  @Get('usuarios/:id')
  async obtenerUsuarioPorId(@Param('id', ParseIntPipe) id: number) {
    try {
      const usuario = await this.adminService.obtenerUsuarioPorId(id);
      
      if (!usuario) {
        return {
          success: false,
          data: null,
          message: 'Usuario no encontrado'
        };
      }

      return {
        success: true,
        data: usuario,
        message: 'Usuario obtenido correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al obtener usuario',
        error: error.message
      };
    }
  }

  /**
   * Crea un nuevo usuario
   * POST /api/admin/usuarios
   */
  @Post('usuarios')
  @HttpCode(HttpStatus.CREATED)
  async crearUsuario(@Body() crearUsuarioDto: CrearUsuarioDto) {
    try {
      const usuario = await this.adminService.crearUsuario(crearUsuarioDto);
      
      return {
        success: true,
        data: usuario,
        message: 'Usuario creado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al crear usuario',
        error: error.message
      };
    }
  }

  /**
   * Actualiza un usuario existente
   * PUT /api/admin/usuarios/:id
   */
  @Put('usuarios/:id')
  async actualizarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarUsuarioDto: ActualizarUsuarioDto
  ) {
    try {
      const usuario = await this.adminService.actualizarUsuario(id, actualizarUsuarioDto);
      
      return {
        success: true,
        data: usuario,
        message: 'Usuario actualizado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al actualizar usuario',
        error: error.message
      };
    }
  }

  /**
   * Elimina un usuario
   * DELETE /api/admin/usuarios/:id
   */
  @Delete('usuarios/:id')
  async eliminarUsuario(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.adminService.eliminarUsuario(id);
      
      return {
        success: true,
        data: null,
        message: 'Usuario eliminado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al eliminar usuario',
        error: error.message
      };
    }
  }

  // ============ ENDPOINTS DE DEPARTAMENTOS ============

  /**
   * Obtiene la lista de departamentos
   * GET /api/admin/departamentos
   */
  @Get('departamentos')
  async obtenerDepartamentos(@Query('activo') activo?: string) {
    try {
      const filtros = {
        activo: activo !== undefined ? activo === 'true' : undefined
      };

      const departamentos = await this.adminService.obtenerDepartamentos(filtros);
      
      return {
        success: true,
        data: departamentos,
        message: 'Departamentos obtenidos correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al obtener departamentos',
        error: error.message
      };
    }
  }

  /**
   * Obtiene un departamento específico por ID
   * GET /api/admin/departamentos/:id
   */
  @Get('departamentos/:id')
  async obtenerDepartamentoPorId(@Param('id', ParseIntPipe) id: number) {
    try {
      const departamento = await this.adminService.obtenerDepartamentoPorId(id);
      
      if (!departamento) {
        return {
          success: false,
          data: null,
          message: 'Departamento no encontrado'
        };
      }

      return {
        success: true,
        data: departamento,
        message: 'Departamento obtenido correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al obtener departamento',
        error: error.message
      };
    }
  }

  // ============ ENDPOINTS DE VALIDACIÓN ============

  /**
   * Valida si un email está disponible
   * GET /api/admin/usuarios/validar-email
   */
  @Get('usuarios/validar-email')
  async validarEmail(
    @Query('email') email: string,
    @Query('usuarioId') usuarioId?: string
  ) {
    try {
      const disponible = await this.adminService.validarEmail(
        email,
        usuarioId ? parseInt(usuarioId) : undefined
      );
      
      return {
        success: true,
        disponible,
        message: disponible ? 'Email disponible' : 'Email ya está en uso'
      };
    } catch (error) {
      return {
        success: false,
        disponible: false,
        message: 'Error al validar email',
        error: error.message
      };
    }
  }

  /**
   * Valida si un RUT está disponible
   * GET /api/admin/usuarios/validar-rut
   */
  @Get('usuarios/validar-rut')
  async validarRut(
    @Query('rut') rut: string,
    @Query('usuarioId') usuarioId?: string
  ) {
    try {
      const disponible = await this.adminService.validarRut(
        rut,
        usuarioId ? parseInt(usuarioId) : undefined
      );
      
      return {
        success: true,
        disponible,
        message: disponible ? 'RUT disponible' : 'RUT ya está en uso'
      };
    } catch (error) {
      return {
        success: false,
        disponible: false,
        message: 'Error al validar RUT',
        error: error.message
      };
    }
  }

  // ============ ENDPOINTS DE MÉTRICAS ============

  /**
   * Obtiene el resumen general de la empresa
   * GET /api/admin/resumen-empresa
   */
  @Get('resumen-empresa')
  async obtenerResumenEmpresa() {
    try {
      const resumen = await this.adminService.obtenerResumenEmpresa();
      
      return {
        success: true,
        data: resumen,
        message: 'Resumen obtenido correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al obtener resumen',
        error: error.message
      };
    }
  }

  /**
   * Obtiene métricas de departamentos
   * GET /api/admin/metricas-departamentos
   */
  @Get('metricas-departamentos')
  async obtenerMetricasDepartamentos() {
    try {
      const metricas = await this.adminService.obtenerMetricasDepartamentos();
      
      return {
        success: true,
        data: metricas,
        message: 'Métricas obtenidas correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al obtener métricas',
        error: error.message
      };
    }
  }

  /**
   * Obtiene métricas de un departamento específico
   * GET /api/admin/metricas-departamentos/:id
   */
  @Get('metricas-departamentos/:id')
  async obtenerMetricasDepartamento(@Param('id', ParseIntPipe) id: number) {
    try {
      const metricas = await this.adminService.obtenerMetricasDepartamento(id);
      
      return {
        success: true,
        data: metricas,
        message: 'Métricas del departamento obtenidas correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al obtener métricas del departamento',
        error: error.message
      };
    }
  }

  /**
   * Obtiene tendencia mensual de tickets
   * GET /api/admin/tendencia-mensual
   */
  @Get('tendencia-mensual')
  async obtenerTendenciaMensual(@Query('meses') meses: string = '6'): Promise<any> {
    try {
      const tendencia = await this.adminService.obtenerTendenciaMensual(parseInt(meses));
      
      return {
        success: true,
        data: tendencia,
        message: 'Tendencia mensual obtenida correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al obtener tendencia mensual',
        error: error.message
      };
    }
  }

  /**
   * Obtiene distribución de tickets por estado
   * GET /api/admin/tickets-estado
   */
  @Get('tickets-estado')
  async obtenerTicketsPorEstado(@Query('departamento') departamento?: string) {
    try {
      const distribucion = await this.adminService.obtenerTicketsPorEstado();
      
      return {
        success: true,
        data: distribucion,
        message: 'Distribución por estado obtenida correctamente'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Error al obtener distribución por estado',
        error: error.message
      };
    }
  }
}