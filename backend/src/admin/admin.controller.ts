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
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { AdminService } from './admin.service';

/**
 * DTOs para validación de entrada
 */
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

/**
 * Controlador administrativo para gestión de usuarios y departamentos
 */
@Controller('api/admin')
export class AdminController {
  
  constructor(private readonly adminService: AdminService) {}

  // ============ ENDPOINTS DE USUARIOS ============

  /**
   * Obtiene lista de usuarios
   * GET /api/admin/usuarios
   */
  @Get('usuarios')
  async obtenerUsuarios(@Query() filtros: any) {
    try {
      console.log('📥 GET /api/admin/usuarios - Filtros:', filtros);
      
      const usuarios = await this.adminService.obtenerUsuarios(filtros);
      
      return {
        success: true,
        data: usuarios,
        message: `${usuarios.length} usuarios obtenidos correctamente`
      };

    } catch (error) {
      console.error('❌ Error en GET /usuarios:', error);
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener usuarios',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtiene un usuario específico por ID
   * GET /api/admin/usuarios/:id
   */
  @Get('usuarios/:id')
  async obtenerUsuarioPorId(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`📥 GET /api/admin/usuarios/${id}`);
      
      const usuario = await this.adminService.obtenerUsuarioPorId(id);
      
      return {
        success: true,
        data: usuario,
        message: 'Usuario obtenido correctamente'
      };

    } catch (error) {
      console.error(`❌ Error en GET /usuarios/${id}:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || 'Error al obtener usuario';
      
      throw new HttpException({
        success: false,
        data: null,
        message,
        error: error.message
      }, status);
    }
  }

  /**
   * Crea un nuevo usuario
   * POST /api/admin/usuarios
   */
  @Post('usuarios')
  async crearUsuario(@Body() crearUsuarioDto: CrearUsuarioDto) {
    try {
      console.log('📥 POST /api/admin/usuarios - Datos:', {
        ...crearUsuarioDto,
        contrasena: '[OCULTA]',
        confirmar_contrasena: '[OCULTA]'
      });

      // Validar que las contraseñas coincidan
      if (crearUsuarioDto.contrasena !== crearUsuarioDto.confirmar_contrasena) {
        throw new HttpException({
          success: false,
          data: null,
          message: 'Las contraseñas no coinciden',
          error: 'PASSWORDS_MISMATCH'
        }, HttpStatus.BAD_REQUEST);
      }

      const usuario = await this.adminService.crearUsuario(crearUsuarioDto);
      
      return {
        success: true,
        data: usuario,
        message: 'Usuario creado correctamente'
      };

    } catch (error) {
      console.error('❌ Error en POST /usuarios:', error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al crear usuario';
      
      // Manejar errores específicos
      if (error.message.includes('email')) {
        message = 'El email ya está registrado';
      } else if (error.message.includes('RUT')) {
        message = 'El RUT ya está registrado';
      } else if (error.message.includes('departamento')) {
        message = error.message;
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
   * Actualiza un usuario existente
   * PUT /api/admin/usuarios/:id
   */
  @Put('usuarios/:id')
  async actualizarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarUsuarioDto: ActualizarUsuarioDto
  ) {
    try {
      console.log(`📥 PUT /api/admin/usuarios/${id} - Datos:`, {
        ...actualizarUsuarioDto,
        contrasena: actualizarUsuarioDto.contrasena ? '[OCULTA]' : undefined
      });

      const usuario = await this.adminService.actualizarUsuario(id, actualizarUsuarioDto);
      
      return {
        success: true,
        data: usuario,
        message: 'Usuario actualizado correctamente'
      };

    } catch (error) {
      console.error(`❌ Error en PUT /usuarios/${id}:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || 'Error al actualizar usuario';
      
      throw new HttpException({
        success: false,
        data: null,
        message,
        error: error.message
      }, status);
    }
  }

  /**
   * Elimina un usuario
   * DELETE /api/admin/usuarios/:id
   */
  @Delete('usuarios/:id')
  async eliminarUsuario(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`📥 DELETE /api/admin/usuarios/${id}`);

      await this.adminService.eliminarUsuario(id);
      
      return {
        success: true,
        data: true,
        message: 'Usuario eliminado correctamente'
      };

    } catch (error) {
      console.error(`❌ Error en DELETE /usuarios/${id}:`, error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || 'Error al eliminar usuario';
      
      throw new HttpException({
        success: false,
        data: false,
        message,
        error: error.message
      }, status);
    }
  }

  // ============ ENDPOINTS DE DEPARTAMENTOS ============

  /**
   * Obtiene lista de departamentos
   * GET /api/admin/departamentos
   */
  @Get('departamentos')
  async obtenerDepartamentos() {
    try {
      console.log('📥 GET /api/admin/departamentos');
      
      const departamentos = await this.adminService.obtenerDepartamentos();
      
      return {
        success: true,
        data: departamentos,
        message: `${departamentos.length} departamentos obtenidos correctamente`
      };

    } catch (error) {
      console.error('❌ Error en GET /departamentos:', error);
      throw new HttpException({
        success: false,
        data: [],
        message: 'Error al obtener departamentos',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ============ ENDPOINTS DE VALIDACIÓN ============

  /**
   * ✅ NUEVO: Valida si un RUT está disponible
   * GET /api/admin/validar-rut?rut=12345678-9
   */
  @Get('validar-rut')
  async validarRutDisponible(
    @Query('rut') rut: string,
    @Query('usuarioId') usuarioId?: string
  ) {
    try {
      console.log(`📥 GET /api/admin/validar-rut?rut=${rut}&usuarioId=${usuarioId}`);

      if (!rut) {
        throw new HttpException({
          success: false,
          data: false,
          message: 'RUT es requerido',
          error: 'MISSING_RUT'
        }, HttpStatus.BAD_REQUEST);
      }

      const disponible = await this.adminService.validarRutDisponible(
        rut, 
        usuarioId ? parseInt(usuarioId) : undefined
      );
      
      return {
        success: true,
        data: disponible,
        message: disponible ? 'RUT disponible' : 'RUT ya está en uso'
      };

    } catch (error) {
      console.error('❌ Error en GET /validar-rut:', error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException({
        success: false,
        data: false,
        message: 'Error al validar RUT',
        error: error.message
      }, status);
    }
  }

  /**
   * ✅ NUEVO: Valida si un email está disponible
   * GET /api/admin/validar-email?email=usuario@empresa.com
   */
  @Get('validar-email')
  async validarEmailDisponible(
    @Query('email') email: string,
    @Query('usuarioId') usuarioId?: string
  ) {
    try {
      console.log(`📥 GET /api/admin/validar-email?email=${email}&usuarioId=${usuarioId}`);

      if (!email) {
        throw new HttpException({
          success: false,
          data: false,
          message: 'Email es requerido',
          error: 'MISSING_EMAIL'
        }, HttpStatus.BAD_REQUEST);
      }

      const disponible = await this.adminService.validarEmailDisponible(
        email, 
        usuarioId ? parseInt(usuarioId) : undefined
      );
      
      return {
        success: true,
        data: disponible,
        message: disponible ? 'Email disponible' : 'Email ya está en uso'
      };

    } catch (error) {
      console.error('❌ Error en GET /validar-email:', error);
      
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException({
        success: false,
        data: false,
        message: 'Error al validar email',
        error: error.message
      }, status);
    }
  }

  // ============ ENDPOINTS DE MÉTRICAS Y DASHBOARD ============

  /**
   * Obtiene métricas generales para el dashboard
   * GET /api/admin/metricas
   */
  @Get('metricas')
  async obtenerMetricas() {
    try {
      console.log('📥 GET /api/admin/metricas');
      
      // TODO: Implementar métricas reales
      const metricas = {
        usuariosTotales: 0,
        usuariosActivos: 0,
        departamentos: 4,
        ticketsAbiertos: 0
      };
      
      return {
        success: true,
        data: metricas,
        message: 'Métricas obtenidas correctamente'
      };

    } catch (error) {
      console.error('❌ Error en GET /metricas:', error);
      throw new HttpException({
        success: false,
        data: null,
        message: 'Error al obtener métricas',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}