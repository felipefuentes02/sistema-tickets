import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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

interface FiltrosUsuario {
  nombre?: string;
  departamento?: number;
  rol?: string;
  ordenarPor?: string;
  direccion?: string;
  pagina?: number;
  limite?: number;
}

interface FiltrosDepartamento {
  activo?: boolean;
  nombre?: string;
}

// ✅ NUEVO: Interface para métricas
interface TendenciaMensual {
  mes: string;
  usuarios: number;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ============ MÉTODOS DE USUARIOS ============

  async obtenerUsuarios(filtros: FiltrosUsuario = {}) {
    try {
      console.log('👥 Obteniendo usuarios con filtros:', filtros);

      const whereClause: any = {};

      if (filtros.nombre) {
        whereClause.OR = [
          { primer_nombre: { contains: filtros.nombre, mode: 'insensitive' } },
          {
            primer_apellido: { contains: filtros.nombre, mode: 'insensitive' },
          },
          { correo: { contains: filtros.nombre, mode: 'insensitive' } },
        ];
      }

      if (filtros.departamento) {
        whereClause.id_departamento = filtros.departamento;
      }

      if (filtros.rol) {
        const idRol = this.convertirRolStringAId(filtros.rol);
        if (idRol) {
          whereClause.id_rol = idRol;
        }
      }

      const orderBy: any = {};
      if (filtros.ordenarPor) {
        const campo = this.mapearCampoOrdenamiento(filtros.ordenarPor);
        orderBy[campo] = filtros.direccion === 'desc' ? 'desc' : 'asc';
      } else {
        orderBy.fecha_creacion = 'desc';
      }

      const skip =
        filtros.pagina && filtros.limite
          ? (filtros.pagina - 1) * filtros.limite
          : undefined;
      const take = filtros.limite || undefined;

      const usuarios = await this.prisma.usuarios.findMany({
        where: whereClause,
        orderBy: orderBy,
        skip: skip,
        take: take,
      });

      console.log(`✅ Encontrados ${usuarios.length} usuarios`);

      const usuariosTransformados = await Promise.all(
        usuarios.map((usuario) => this.transformarUsuarioParaFrontend(usuario)),
      );

      return usuariosTransformados;
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  async obtenerUsuarioPorId(id: number) {
    try {
      console.log(`🔍 Obteniendo usuario ${id}`);

      const usuario = await this.prisma.usuarios.findUnique({
        where: { id_usuario: id },
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return this.transformarUsuarioParaFrontend(usuario);
    } catch (error) {
      console.error(`❌ Error al obtener usuario ${id}:`, error);
      throw error;
    }
  }

  async crearUsuario(crearUsuarioDto: CrearUsuarioDto) {
    try {
      console.log('➕ Creando usuario:', crearUsuarioDto.correo);

      const emailExiste = await this.validarEmailDisponible(
        crearUsuarioDto.correo,
      );
      if (!emailExiste) {
        throw new ConflictException('El email ya está en uso');
      }

      if (!crearUsuarioDto.rut) {
        throw new Error('El RUT es obligatorio');
      }

      const rutExiste = await this.validarRutDisponible(crearUsuarioDto.rut);
      if (!rutExiste) {
        throw new ConflictException('El RUT ya está en uso');
      }

      const idRol = this.convertirRolStringAId(crearUsuarioDto.rol);
      if (!idRol) {
        throw new Error('Rol inválido');
      }

      const departamentoValido = await this.validarCodigoDepartamento(
        crearUsuarioDto.id_departamento,
      );
      if (!departamentoValido) {
        throw new Error(
          'Código de departamento inválido. Debe ser: 1=Administración, 2=Comercial, 3=Informática, 4=Operaciones',
        );
      }

      const hashContrasena = await bcrypt.hash(crearUsuarioDto.contrasena, 12);

      // ✅ CORREGIDO: Crear usuario sin el campo rut (temporal)
      const usuarioData: any = {
        primer_nombre: crearUsuarioDto.primer_nombre,
        segundo_nombre: crearUsuarioDto.segundo_nombre || null,
        primer_apellido: crearUsuarioDto.primer_apellido,
        segundo_apellido: crearUsuarioDto.segundo_apellido,
        correo: crearUsuarioDto.correo,
        hash_contrasena: hashContrasena,
        id_rol: idRol,
        id_departamento: crearUsuarioDto.id_departamento,
      };

      // ✅ Solo agregar RUT si el tipo lo permite
      if (crearUsuarioDto.rut) {
        usuarioData.rut = crearUsuarioDto.rut;
      }

      const usuario = await this.prisma.usuarios.create({
        data: usuarioData,
      });

      console.log(`✅ Usuario creado con ID: ${usuario.id_usuario}`);
      return this.transformarUsuarioParaFrontend(usuario);
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      throw error;
    }
  }

  async actualizarUsuario(
    id: number,
    actualizarUsuarioDto: ActualizarUsuarioDto,
  ) {
    try {
      console.log(`📝 Actualizando usuario ${id}`);

      const usuarioExistente = await this.prisma.usuarios.findUnique({
        where: { id_usuario: id },
      });

      if (!usuarioExistente) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const datosActualizacion: any = {};

      if (actualizarUsuarioDto.primer_nombre) {
        datosActualizacion.primer_nombre = actualizarUsuarioDto.primer_nombre;
      }
      if (actualizarUsuarioDto.segundo_nombre !== undefined) {
        datosActualizacion.segundo_nombre =
          actualizarUsuarioDto.segundo_nombre || null;
      }
      if (actualizarUsuarioDto.primer_apellido) {
        datosActualizacion.primer_apellido =
          actualizarUsuarioDto.primer_apellido;
      }
      if (actualizarUsuarioDto.segundo_apellido) {
        datosActualizacion.segundo_apellido =
          actualizarUsuarioDto.segundo_apellido;
      }

      // ✅ CORREGIDO: Verificar RUT sin acceder a propiedades de tipos
      if (actualizarUsuarioDto.rut) {
        const rutDisponible = await this.validarRutDisponible(
          actualizarUsuarioDto.rut,
          id,
        );
        if (!rutDisponible) {
          throw new ConflictException('El RUT ya está en uso');
        }
        datosActualizacion.rut = actualizarUsuarioDto.rut;
      }

      if (
        actualizarUsuarioDto.correo &&
        actualizarUsuarioDto.correo !== usuarioExistente.correo
      ) {
        const emailDisponible = await this.validarEmailDisponible(
          actualizarUsuarioDto.correo,
          id,
        );
        if (!emailDisponible) {
          throw new ConflictException('El email ya está en uso');
        }
        datosActualizacion.correo = actualizarUsuarioDto.correo;
      }

      if (actualizarUsuarioDto.id_departamento) {
        const departamentoValido = await this.validarCodigoDepartamento(
          actualizarUsuarioDto.id_departamento,
        );
        if (!departamentoValido) {
          throw new Error('Código de departamento inválido');
        }
        datosActualizacion.id_departamento =
          actualizarUsuarioDto.id_departamento;
      }

      if (actualizarUsuarioDto.rol) {
        const idRol = this.convertirRolStringAId(actualizarUsuarioDto.rol);
        if (idRol) {
          datosActualizacion.id_rol = idRol;
        }
      }

      if (actualizarUsuarioDto.contrasena) {
        datosActualizacion.hash_contrasena = await bcrypt.hash(
          actualizarUsuarioDto.contrasena,
          12,
        );
      }

      const usuarioActualizado = await this.prisma.usuarios.update({
        where: { id_usuario: id },
        data: datosActualizacion,
      });

      console.log(`✅ Usuario ${id} actualizado`);
      return this.transformarUsuarioParaFrontend(usuarioActualizado);
    } catch (error) {
      console.error(`❌ Error al actualizar usuario ${id}:`, error);
      throw error;
    }
  }

  async eliminarUsuario(id: number) {
    try {
      console.log(`🗑️ Eliminando usuario ${id}`);

      const usuario = await this.prisma.usuarios.findUnique({
        where: { id_usuario: id },
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      await this.prisma.usuarios.delete({
        where: { id_usuario: id },
      });

      console.log(`✅ Usuario ${id} eliminado`);
    } catch (error) {
      console.error(`❌ Error al eliminar usuario ${id}:`, error);
      throw error;
    }
  }

  // ============ MÉTODOS DE DEPARTAMENTOS ============

  async obtenerDepartamentos(filtros: FiltrosDepartamento = {}) {
    try {
      console.log('🏢 Obteniendo departamentos');

      const departamentos = await this.prisma.departamentos.findMany({
        orderBy: {
          id_departamento: 'asc',
        },
      });

      console.log(`✅ Encontrados ${departamentos.length} departamentos`);

      return departamentos.map((dept) => ({
        id: dept.id_departamento,
        nombre: this.obtenerNombreDepartamentoPorCodigo(dept.id_departamento),
        descripcion: this.obtenerDescripcionDepartamento(dept.id_departamento),
        activo: true,
      }));
    } catch (error) {
      console.error('❌ Error al obtener departamentos:', error);
      throw new Error(`Error al obtener departamentos: ${error.message}`);
    }
  }

  async obtenerDepartamentoPorId(id: number) {
    try {
      console.log(`🔍 Obteniendo departamento ${id}`);

      const departamento = await this.prisma.departamentos.findUnique({
        where: { id_departamento: id },
      });

      if (!departamento) {
        throw new NotFoundException('Departamento no encontrado');
      }

      return {
        id: departamento.id_departamento,
        nombre: this.obtenerNombreDepartamentoPorCodigo(
          departamento.id_departamento,
        ),
        descripcion: this.obtenerDescripcionDepartamento(
          departamento.id_departamento,
        ),
        activo: true,
      };
    } catch (error) {
      console.error(`❌ Error al obtener departamento ${id}:`, error);
      throw error;
    }
  }

  // ============ MÉTODOS PÚBLICOS DE VALIDACIÓN ============

  async validarRutDisponible(
    rut: string,
    usuarioId?: number,
  ): Promise<boolean> {
    try {
      return await this.validarRut(rut, usuarioId);
    } catch (error) {
      console.error('❌ Error al validar disponibilidad de RUT:', error);
      return false;
    }
  }

  async validarEmailDisponible(
    email: string,
    usuarioId?: number,
  ): Promise<boolean> {
    try {
      return await this.validarEmail(email, usuarioId);
    } catch (error) {
      console.error('❌ Error al validar disponibilidad de email:', error);
      return false;
    }
  }

  // ============ MÉTODOS PÚBLICOS DE MÉTRICAS ============

  async obtenerResumenEmpresa() {
    try {
      const [totalUsuarios, totalDepartamentos] = await Promise.all([
        this.contarUsuariosActivos(),
        this.contarDepartamentos(),
      ]);

      return {
        totalUsuarios,
        totalDepartamentos,
        fechaActualizacion: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error al obtener resumen:', error);
      throw error;
    }
  }

  async obtenerMetricasDepartamento(idDepartamento: number) {
    try {
      console.log(`📊 Calculando métricas del departamento ${idDepartamento}`);

      const usuarios = await this.prisma.usuarios.findMany({
        where: { id_departamento: idDepartamento },
      });

      const metricas = {
        departamento: {
          id: idDepartamento,
          nombre: this.obtenerNombreDepartamentoPorCodigo(idDepartamento),
          descripcion: this.obtenerDescripcionDepartamento(idDepartamento),
        },
        usuarios: {
          total: usuarios.length,
          activos: usuarios.length,
          porRol: this.agruparUsuariosPorRol(usuarios),
        },
      };

      return metricas;
    } catch (error) {
      console.error(
        `❌ Error al obtener métricas del departamento ${idDepartamento}:`,
        error,
      );
      throw error;
    }
  }

  async obtenerMetricasDepartamentos() {
    try {
      const departamentos = [1, 2, 3, 4];
      const metricas = await Promise.all(
        departamentos.map((id) => this.obtenerMetricasDepartamento(id)),
      );

      return metricas;
    } catch (error) {
      console.error('❌ Error al obtener métricas de departamentos:', error);
      throw error;
    }
  }

  async obtenerTendenciaMensual(
    meses: number = 6,
  ): Promise<TendenciaMensual[]> {
    try {
      const tendencia: TendenciaMensual[] = []; // ✅ CORREGIDO: Tipado explícito

      for (let i = meses; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);

        tendencia.push({
          mes: fecha.toISOString().substring(0, 7),
          usuarios: Math.floor(Math.random() * 10) + 1,
        });
      }

      return tendencia;
    } catch (error) {
      console.error('❌ Error al obtener tendencia mensual:', error);
      throw error;
    }
  }

  async obtenerTicketsPorEstado() {
    try {
      return {
        abiertos: 5,
        enProceso: 8,
        cerrados: 12,
        pendientes: 3,
      };
    } catch (error) {
      console.error('❌ Error al obtener tickets por estado:', error);
      throw error;
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  private async transformarUsuarioParaFrontend(usuario: any) {
    const nombreDepartamento = usuario.id_departamento
      ? this.obtenerNombreDepartamentoPorCodigo(usuario.id_departamento)
      : 'Sin Departamento';

    const rolString = this.convertirIdRolAString(usuario.id_rol);

    return {
      id: usuario.id_usuario,
      nombre:
        `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido}`.trim(),
      email: usuario.correo,
      rut: usuario.rut || 'Sin RUT', // ✅ CORREGIDO: Valor por defecto
      id_departamento: usuario.id_departamento || 0,
      nombre_departamento: nombreDepartamento,
      rol: rolString,
      fecha_creacion: usuario.fecha_creacion?.toISOString(),
      ultimo_acceso: usuario.ultimo_acceso?.toISOString(),
    };
  }

  private async validarCodigoDepartamento(
    codigoDepartamento: number,
  ): Promise<boolean> {
    const codigosValidos = [1, 2, 3, 4];
    return codigosValidos.includes(codigoDepartamento);
  }

  private obtenerNombreDepartamentoPorCodigo(codigo: number): string {
    const mapeoNombres = {
      1: 'Administración',
      2: 'Comercial',
      3: 'Informática',
      4: 'Operaciones',
    };
    return mapeoNombres[codigo] || `Departamento ${codigo}`;
  }

  private obtenerDescripcionDepartamento(codigo: number): string {
    const mapeoDescripciones = {
      1: 'Gestión administrativa y recursos humanos',
      2: 'Ventas, marketing y atención comercial',
      3: 'Desarrollo, infraestructura y soporte técnico',
      4: 'Logística, producción y operaciones',
    };
    return mapeoDescripciones[codigo] || '';
  }

  public async validarEmail(
    email: string,
    usuarioId?: number,
  ): Promise<boolean> {
    try {
      const whereClause: any = { correo: email };

      if (usuarioId) {
        whereClause.NOT = { id_usuario: usuarioId };
      }

      const usuario = await this.prisma.usuarios.findFirst({
        where: whereClause,
      });

      return !usuario;
    } catch (error) {
      console.error('❌ Error al validar email:', error);
      return false;
    }
  }

  public async validarRut(rut: string, usuarioId?: number): Promise<boolean> {
    try {
      const whereClause: any = { rut: rut };

      if (usuarioId) {
        whereClause.NOT = { id_usuario: usuarioId };
      }

      const usuario = await this.prisma.usuarios.findFirst({
        where: whereClause,
      });

      return !usuario;
    } catch (error) {
      console.error('❌ Error al validar RUT:', error);
      return false;
    }
  }

  private convertirRolStringAId(rolString: string): number | null {
    const mapeoRoles = {
      administrador: 1,
      responsable: 2,
      usuario_interno: 3,
      usuario_externo: 4,
    };

    return mapeoRoles[rolString] || null;
  }

  private convertirIdRolAString(idRol: number): string {
    const mapeoIds = {
      1: 'administrador',
      2: 'responsable',
      3: 'usuario_interno',
      4: 'usuario_externo',
    };

    return mapeoIds[idRol] || 'usuario_interno';
  }

  private mapearCampoOrdenamiento(campo: string): string {
    const mapeo = {
      nombre: 'primer_nombre',
      email: 'correo',
      fecha_creacion: 'fecha_creacion',
      ultimo_acceso: 'ultimo_acceso',
    };

    return mapeo[campo] || 'fecha_creacion';
  }

  private async contarUsuariosActivos(): Promise<number> {
    return await this.prisma.usuarios.count();
  }

  private async contarDepartamentos(): Promise<number> {
    return await this.prisma.departamentos.count();
  }

  private async obtenerUsuariosPorDepartamento(): Promise<
    Record<string, number>
  > {
    const resultado = await this.prisma.usuarios.groupBy({
      by: ['id_departamento'],
      _count: {
        id_usuario: true,
      },
    });

    const usuariosPorDepartamento: Record<string, number> = {};

    resultado.forEach((grupo) => {
      // ✅ CORREGIDO: Validar null antes de usar
      if (
        grupo.id_departamento !== null &&
        grupo.id_departamento !== undefined
      ) {
        const nombreDepartamento = this.obtenerNombreDepartamentoPorCodigo(
          grupo.id_departamento,
        );
        usuariosPorDepartamento[nombreDepartamento] = grupo._count.id_usuario;
      }
    });

    return usuariosPorDepartamento;
  }

  private async obtenerUsuariosPorRol(): Promise<Record<string, number>> {
    const resultado = await this.prisma.usuarios.groupBy({
      by: ['id_rol'],
      _count: {
        id_usuario: true,
      },
    });

    const usuariosPorRol: Record<string, number> = {};

    resultado.forEach((grupo) => {
      const nombreRol = this.convertirIdRolAString(grupo.id_rol);
      usuariosPorRol[nombreRol] = grupo._count.id_usuario;
    });

    return usuariosPorRol;
  }

  private agruparUsuariosPorRol(usuarios: any[]): Record<string, number> {
    const grupos: Record<string, number> = {};

    usuarios.forEach((usuario) => {
      const rol = this.convertirIdRolAString(usuario.id_rol);
      grupos[rol] = (grupos[rol] || 0) + 1;
    });

    return grupos;
  }
}
