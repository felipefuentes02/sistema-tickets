import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import * as bcrypt from 'bcryptjs';

/**
 * Interfaz para filtros de usuarios
 */
interface FiltrosUsuario {
  nombre?: string;
  departamento?: number;
  rol?: string;
  pagina?: number;
  limite?: number;
}

/**
 * Interfaz para filtros de departamentos
 */
interface FiltrosDepartamento {
  activo?: boolean;
}

/**
 * Servicio para operaciones administrativas
 * Maneja CRUD de usuarios, departamentos y métricas
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ MÉTODOS DE USUARIOS ============

  /**
   * Obtiene lista de usuarios con filtros y paginación
   * @param filtros Filtros para la búsqueda
   * @returns Array de usuarios con información completa
   */
  async obtenerUsuarios(filtros: FiltrosUsuario = {}) {
    try {
      console.log('🔍 Obteniendo usuarios con filtros:', filtros);

      // Construir where clause dinámicamente
      const whereClause: any = {};

      // Filtro por nombre (busca en todos los campos de nombre)
      if (filtros.nombre) {
        const nombreBusqueda = filtros.nombre.toLowerCase();
        whereClause.OR = [
          { primer_nombre: { contains: nombreBusqueda, mode: 'insensitive' } },
          { segundo_nombre: { contains: nombreBusqueda, mode: 'insensitive' } },
          { primer_apellido: { contains: nombreBusqueda, mode: 'insensitive' } },
          { segundo_apellido: { contains: nombreBusqueda, mode: 'insensitive' } },
          { correo: { contains: nombreBusqueda, mode: 'insensitive' } }
        ];
      }

      // Filtro por departamento
      if (filtros.departamento) {
        whereClause.id_departamento = filtros.departamento;
      }

      // Filtro por rol
      if (filtros.rol) {
        // Convertir string del frontend a id_rol
        const rolId = this.convertirRolStringAId(filtros.rol);
        if (rolId) {
          whereClause.id_rol = rolId;
        }
      }

      // Configurar paginación
      const skip = filtros.pagina && filtros.limite ? (filtros.pagina - 1) * filtros.limite : 0;
      const take = filtros.limite || undefined;

      // Ejecutar consulta sin relaciones por ahora
      const usuarios = await this.prisma.usuarios.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: {
          fecha_creacion: 'desc'
        }
      });

      console.log(`✅ Encontrados ${usuarios.length} usuarios`);

      // Transformar datos para el frontend
      const usuariosTransformados = await Promise.all(
        usuarios.map(usuario => this.transformarUsuarioParaFrontend(usuario))
      );

      return usuariosTransformados;

    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  /**
   * Obtiene un usuario por ID
   * @param id ID del usuario
   * @returns Usuario con información completa
   */
  async obtenerUsuarioPorId(id: number) {
    try {
      console.log(`🔍 Obteniendo usuario con ID: ${id}`);

      const usuario = await this.prisma.usuarios.findUnique({
        where: { id_usuario: id }
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      console.log(`✅ Usuario encontrado: ${usuario.correo}`);
      return this.transformarUsuarioParaFrontend(usuario);

    } catch (error) {
      console.error(`❌ Error al obtener usuario ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario
   * @param crearUsuarioDto Datos del usuario a crear
   * @returns Usuario creado
   */
  async crearUsuario(crearUsuarioDto: CrearUsuarioDto) {
    try {
      console.log('➕ Creando nuevo usuario:', crearUsuarioDto.correo);

      // Validar email único
      const emailExiste = await this.prisma.usuarios.findUnique({
        where: { correo: crearUsuarioDto.correo }
      });

      if (emailExiste) {
        throw new ConflictException('El email ya está registrado');
      }

      // Validar RUT único (cuando se agregue el campo)
      // TODO: Agregar validación de RUT cuando se agregue el campo a la DB

      // Validar que el departamento existe
      if (crearUsuarioDto.id_departamento) {
        const departamento = await this.prisma.departamentos.findUnique({
          where: { id_departamento: crearUsuarioDto.id_departamento }
        });

        if (!departamento) {
          throw new NotFoundException('Departamento no encontrado');
        }
      }

      // Hashear contraseña
      const hashContrasena = await bcrypt.hash(crearUsuarioDto.contrasena, 12);

      // Convertir rol string a id_rol
      const idRol = this.convertirRolStringAId(crearUsuarioDto.rol);
      if (!idRol) {
        throw new Error('Rol inválido');
      }

      // Crear usuario
      const nuevoUsuario = await this.prisma.usuarios.create({
        data: {
          primer_nombre: crearUsuarioDto.primer_nombre,
          segundo_nombre: crearUsuarioDto.segundo_nombre,
          primer_apellido: crearUsuarioDto.primer_apellido,
          segundo_apellido: crearUsuarioDto.segundo_apellido,
          correo: crearUsuarioDto.correo,
          hash_contrasena: hashContrasena,
          id_rol: idRol,
          id_departamento: crearUsuarioDto.id_departamento
        }
      });

      console.log(`✅ Usuario creado con ID: ${nuevoUsuario.id_usuario}`);
      return this.transformarUsuarioParaFrontend(nuevoUsuario);

    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario existente
   * @param id ID del usuario
   * @param actualizarUsuarioDto Datos a actualizar
   * @returns Usuario actualizado
   */
  async actualizarUsuario(id: number, actualizarUsuarioDto: ActualizarUsuarioDto) {
    try {
      console.log(`✏️ Actualizando usuario ${id}`);

      // Verificar que el usuario existe
      const usuarioExistente = await this.prisma.usuarios.findUnique({
        where: { id_usuario: id }
      });

      if (!usuarioExistente) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Validar email único (si se está cambiando)
      if (actualizarUsuarioDto.correo && actualizarUsuarioDto.correo !== usuarioExistente.correo) {
        const emailExiste = await this.prisma.usuarios.findUnique({
          where: { correo: actualizarUsuarioDto.correo }
        });

        if (emailExiste) {
          throw new ConflictException('El email ya está en uso');
        }
      }

      // Preparar datos para actualización
      const datosActualizacion: any = {};

      if (actualizarUsuarioDto.primer_nombre) datosActualizacion.primer_nombre = actualizarUsuarioDto.primer_nombre;
      if (actualizarUsuarioDto.segundo_nombre !== undefined) datosActualizacion.segundo_nombre = actualizarUsuarioDto.segundo_nombre;
      if (actualizarUsuarioDto.primer_apellido) datosActualizacion.primer_apellido = actualizarUsuarioDto.primer_apellido;
      if (actualizarUsuarioDto.segundo_apellido) datosActualizacion.segundo_apellido = actualizarUsuarioDto.segundo_apellido;
      if (actualizarUsuarioDto.correo) datosActualizacion.correo = actualizarUsuarioDto.correo;
      if (actualizarUsuarioDto.id_departamento) datosActualizacion.id_departamento = actualizarUsuarioDto.id_departamento;

      // Actualizar rol si se proporciona
      if (actualizarUsuarioDto.rol) {
        const idRol = this.convertirRolStringAId(actualizarUsuarioDto.rol);
        if (idRol) {
          datosActualizacion.id_rol = idRol;
        }
      }

      // Actualizar contraseña si se proporciona
      if (actualizarUsuarioDto.contrasena) {
        datosActualizacion.hash_contrasena = await bcrypt.hash(actualizarUsuarioDto.contrasena, 12);
      }

      // Ejecutar actualización
      const usuarioActualizado = await this.prisma.usuarios.update({
        where: { id_usuario: id },
        data: datosActualizacion
      });

      console.log(`✅ Usuario ${id} actualizado`);
      return this.transformarUsuarioParaFrontend(usuarioActualizado);

    } catch (error) {
      console.error(`❌ Error al actualizar usuario ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un usuario
   * @param id ID del usuario a eliminar
   */
  async eliminarUsuario(id: number) {
    try {
      console.log(`🗑️ Eliminando usuario ${id}`);

      // Verificar que el usuario existe
      const usuario = await this.prisma.usuarios.findUnique({
        where: { id_usuario: id }
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // TODO: Verificar que no tenga tickets asignados o historial crítico
      // Por ahora eliminamos directamente

      await this.prisma.usuarios.delete({
        where: { id_usuario: id }
      });

      console.log(`✅ Usuario ${id} eliminado`);

    } catch (error) {
      console.error(`❌ Error al eliminar usuario ${id}:`, error);
      throw error;
    }
  }

  // ============ MÉTODOS DE DEPARTAMENTOS ============

  /**
   * Obtiene lista de departamentos
   * @param filtros Filtros para la búsqueda
   * @returns Array de departamentos
   */
  async obtenerDepartamentos(filtros: FiltrosDepartamento = {}) {
    try {
      console.log('🏢 Obteniendo departamentos');

      const departamentos = await this.prisma.departamentos.findMany({
        orderBy: {
          nombre_departamento: 'asc'
        }
      });

      console.log(`✅ Encontrados ${departamentos.length} departamentos`);

      // Transformar para el frontend
      return departamentos.map(dept => ({
        id: dept.id_departamento,
        nombre: dept.nombre_departamento,
        descripcion: '', // No existe en el schema actual
        activo: true // Asumir que todos están activos por ahora
      }));

    } catch (error) {
      console.error('❌ Error al obtener departamentos:', error);
      throw new Error(`Error al obtener departamentos: ${error.message}`);
    }
  }

  /**
   * Obtiene un departamento por ID
   * @param id ID del departamento
   * @returns Departamento encontrado
   */
  async obtenerDepartamentoPorId(id: number) {
    try {
      console.log(`🔍 Obteniendo departamento ${id}`);

      const departamento = await this.prisma.departamentos.findUnique({
        where: { id_departamento: id }
      });

      if (!departamento) {
        throw new NotFoundException('Departamento no encontrado');
      }

      return {
        id: departamento.id_departamento,
        nombre: departamento.nombre_departamento,
        descripcion: '',
        activo: true
      };

    } catch (error) {
      console.error(`❌ Error al obtener departamento ${id}:`, error);
      throw error;
    }
  }

  // ============ MÉTODOS DE VALIDACIÓN ============

  /**
   * Valida si un email está disponible
   * @param email Email a validar
   * @param usuarioId ID del usuario actual (para edición)
   * @returns true si está disponible
   */
  async validarEmail(email: string, usuarioId?: number): Promise<boolean> {
    try {
      const whereClause: any = { correo: email };
      
      // Excluir el usuario actual en caso de edición
      if (usuarioId) {
        whereClause.NOT = { id_usuario: usuarioId };
      }

      const usuario = await this.prisma.usuarios.findFirst({
        where: whereClause
      });

      return !usuario; // true si no existe (disponible)

    } catch (error) {
      console.error('❌ Error al validar email:', error);
      return false;
    }
  }

  /**
   * Valida si un RUT está disponible
   * @param rut RUT a validar
   * @param usuarioId ID del usuario actual (para edición)
   * @returns true si está disponible
   */
  async validarRut(rut: string, usuarioId?: number): Promise<boolean> {
    // TODO: Implementar cuando se agregue el campo RUT a la base de datos
    console.log('🔍 Validando RUT (no implementado en DB):', rut);
    return true; // Por ahora retornar true
  }

  // ============ MÉTODOS DE MÉTRICAS (PLACEHOLDERS) ============

  /**
   * Obtiene resumen general de la empresa
   */
  async obtenerResumenEmpresa() {
    // TODO: Implementar con datos reales
    return {
      totalTickets: 0,
      ticketsAbiertos: 0,
      ticketsCerrados: 0,
      ticketsPendientes: 0,
      usuariosActivos: await this.contarUsuariosActivos(),
      departamentos: await this.contarDepartamentos(),
      satisfaccionPromedio: 0
    };
  }

  /**
   * Obtiene métricas de departamentos
   */
  async obtenerMetricasDepartamentos() {
    // TODO: Implementar con datos reales
    return [];
  }

  /**
   * Obtiene métricas de un departamento específico
   */
  async obtenerMetricasDepartamento(id: number) {
    // TODO: Implementar con datos reales
    return {};
  }

  /**
   * Obtiene tendencia mensual
   */
  async obtenerTendenciaMensual(meses: number) {
    // TODO: Implementar con datos reales
    return [];
  }

  /**
   * Obtiene distribución por estado
   */
  async obtenerTicketsPorEstado(departamento?: number) {
    // TODO: Implementar con datos reales
    return [];
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Transforma usuario de DB al formato esperado por el frontend
   * @param usuario Usuario de la base de datos
   * @returns Usuario transformado
   */
  private async transformarUsuarioParaFrontend(usuario: any) {
    // Obtener nombre del departamento
    let nombreDepartamento = '';
    if (usuario.id_departamento) {
      const departamento = await this.prisma.departamentos.findUnique({
        where: { id_departamento: usuario.id_departamento }
      });
      nombreDepartamento = departamento?.nombre_departamento || '';
    }

    // Obtener nombre del rol
    const rolString = this.convertirIdRolAString(usuario.id_rol);

    return {
      id: usuario.id_usuario,
      nombre: `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido}`.trim(),
      email: usuario.correo,
      rut: '12345678-9', // Placeholder hasta agregar campo RUT
      id_departamento: usuario.id_departamento,
      nombre_departamento: nombreDepartamento,
      rol: rolString,
      fecha_creacion: usuario.fecha_creacion?.toISOString(),
      ultimo_acceso: usuario.ultimo_acceso?.toISOString()
    };
  }

  /**
   * Convierte string de rol del frontend a ID de rol de la DB
   * @param rolString Rol como string
   * @returns ID del rol
   */
  private convertirRolStringAId(rolString: string): number | null {
    const mapeoRoles = {
      'administrador': 1,
      'responsable': 2,
      'usuario_interno': 3,
      'usuario_externo': 4
    };

    return mapeoRoles[rolString] || null;
  }

  /**
   * Convierte ID de rol de la DB a string para el frontend
   * @param idRol ID del rol
   * @returns Rol como string
   */
  private convertirIdRolAString(idRol: number): string {
    const mapeoIds = {
      1: 'administrador',
      2: 'responsable',
      3: 'usuario_interno',
      4: 'usuario_externo'
    };

    return mapeoIds[idRol] || 'usuario_interno';
  }

  /**
   * Cuenta usuarios activos
   */
  private async contarUsuariosActivos(): Promise<number> {
    return await this.prisma.usuarios.count();
  }

  /**
   * Cuenta departamentos
   */
  private async contarDepartamentos(): Promise<number> {
    return await this.prisma.departamentos.count();
  }
}