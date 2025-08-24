import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { 
  Usuario, 
  CrearUsuario,
  ActualizarUsuario,
  Departamento,
  RespuestaUsuarios,
  RespuestaUsuario,
  RespuestaDepartamentos,
  RespuestaBoolean,
  FiltrosUsuario,
  RolUsuario 
} from '../interfaces/admin-usuarios.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private readonly baseUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  /**
   * ✅ CORREGIDO: Método que retorna Promise
   */
  async obtenerUsuarios(filtros: FiltrosUsuario = {}): Promise<RespuestaUsuarios> {
    try {
      let params = new HttpParams();

      if (filtros.nombre) params = params.set('nombre', filtros.nombre);
      if (filtros.departamento) params = params.set('departamento', filtros.departamento.toString());
      if (filtros.rol) params = params.set('rol', filtros.rol);
      if (filtros.ordenarPor) params = params.set('ordenarPor', filtros.ordenarPor);
      if (filtros.direccion) params = params.set('direccion', filtros.direccion);
      if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
      if (filtros.limite) params = params.set('limite', filtros.limite.toString());

      const response = await firstValueFrom(
        this.http.get<RespuestaUsuarios>(`${this.baseUrl}/usuarios`, { params })
          .pipe(
            catchError(error => {
              console.error('❌ Error al obtener usuarios:', error);
              throw {
                success: false,
                data: [],
                message: 'Error al cargar usuarios',
                error: error.message
              };
            })
          )
      );

      return response;

    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: 'Error al cargar usuarios',
        error: error.message
      };
    }
  }

   async obtenerUsuarioPorId(id: number): Promise<RespuestaUsuario> {
    try {
      const response = await firstValueFrom(
        this.http.get<RespuestaUsuario>(`${this.baseUrl}/usuarios/${id}`)
          .pipe(
            catchError(error => {
              console.error(`❌ Error al obtener usuario ${id}:`, error);
              throw {
                success: false,
                data: {} as Usuario,
                message: 'Error al cargar usuario',
                error: error.message
              };
            })
          )
      );

      return response;

    } catch (error: any) {
      return {
        success: false,
        data: {} as Usuario,
        message: 'Error al cargar usuario',
        error: error.message
      };
    }
  }

  async crearUsuario(usuario: CrearUsuario): Promise<RespuestaUsuario> {
    try {
      const usuarioDto = {
        primer_nombre: this.extraerPrimerNombre(usuario.nombre),
        segundo_nombre: this.extraerSegundoNombre(usuario.nombre),
        primer_apellido: this.extraerPrimerApellido(usuario.nombre),
        segundo_apellido: this.extraerSegundoApellido(usuario.nombre),
        correo: usuario.email,
        rut: usuario.rut,
        contrasena: usuario.password,
        confirmar_contrasena: usuario.confirmarPassword,
        id_departamento: usuario.id_departamento,
        rol: usuario.rol
      };

      const response = await firstValueFrom(
        this.http.post<RespuestaUsuario>(`${this.baseUrl}/usuarios`, usuarioDto)
          .pipe(
            catchError(error => {
              console.error('❌ Error al crear usuario:', error);
              throw {
                success: false,
                data: {} as Usuario,
                message: error.error?.message || 'Error al crear usuario',
                error: error.message
              };
            })
          )
      );

      return response;

    } catch (error: any) {
      return {
        success: false,
        data: {} as Usuario,
        message: error.error?.message || 'Error al crear usuario',
        error: error.message
      };
    }
  }

  /**
   * ✅ CORREGIDO: Método que retorna Promise
   */
  async actualizarUsuario(id: number, usuario: ActualizarUsuario): Promise<RespuestaUsuario> {
    try {
      const response = await firstValueFrom(
        this.http.put<RespuestaUsuario>(`${this.baseUrl}/usuarios/${id}`, usuario)
          .pipe(
            catchError(error => {
              console.error(`❌ Error al actualizar usuario ${id}:`, error);
              throw {
                success: false,
                data: {} as Usuario,
                message: error.error?.message || 'Error al actualizar usuario',
                error: error.message
              };
            })
          )
      );

      return response;

    } catch (error: any) {
      return {
        success: false,
        data: {} as Usuario,
        message: error.error?.message || 'Error al actualizar usuario',
        error: error.message
      };
    }
  }

  /**
   * ✅ CORREGIDO: Método que retorna Promise
   */
  async eliminarUsuario(id: number): Promise<RespuestaBoolean> {
    try {
      const response = await firstValueFrom(
        this.http.delete<RespuestaBoolean>(`${this.baseUrl}/usuarios/${id}`)
          .pipe(
            catchError(error => {
              console.error(`❌ Error al eliminar usuario ${id}:`, error);
              throw {
                success: false,
                data: false,
                message: error.error?.message || 'Error al eliminar usuario',
                error: error.message
              };
            })
          )
      );

      return response;

    } catch (error: any) {
      return {
        success: false,
        data: false,
        message: error.error?.message || 'Error al eliminar usuario',
        error: error.message
      };
    }
  }

  /**
   * ✅ CORREGIDO: Método que retorna Promise
   */
  async obtenerDepartamentos(): Promise<RespuestaDepartamentos> {
    try {
      const response = await firstValueFrom(
        this.http.get<RespuestaDepartamentos>(`${this.baseUrl}/departamentos`)
          .pipe(
            catchError(error => {
              console.error('❌ Error al obtener departamentos:', error);
              throw {
                success: false,
                data: [],
                message: 'Error al cargar departamentos',
                error: error.message
              };
            })
          )
      );

      return response;

    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: 'Error al cargar departamentos',
        error: error.message
      };
    }
  }

  /**
   * ✅ CORREGIDO: Método que retorna Promise<boolean>
   */
  async verificarRutDisponible(rut: string): Promise<boolean> {
    try {
      const params = new HttpParams().set('rut', rut);
      
      const response = await firstValueFrom(
        this.http.get<RespuestaBoolean>(`${this.baseUrl}/validar-rut`, { params })
          .pipe(
            catchError(error => {
              console.error('❌ Error al validar RUT:', error);
              throw false;
            })
          )
      );

      return response.success && response.data;

    } catch (error) {
      console.error('❌ Error al validar RUT:', error);
      return false;
    }
  }

  /**
   * ✅ CORREGIDO: Método que retorna Promise<boolean>
   */
  async verificarEmailDisponible(email: string): Promise<boolean> {
    try {
      const params = new HttpParams().set('email', email);
      
      const response = await firstValueFrom(
        this.http.get<RespuestaBoolean>(`${this.baseUrl}/validar-email`, { params })
          .pipe(
            catchError(error => {
              console.error('❌ Error al validar email:', error);
              throw false;
            })
          )
      );

      return response.success && response.data;

    } catch (error) {
      console.error('❌ Error al validar email:', error);
      return false;
    }
  }

  /**
   * Valida formato de RUT chileno
   */
  validarFormatoRUT(rut: string): boolean {
    if (!rut) return false;

    const rutLimpio = rut.replace(/[.-]/g, '');

    if (!/^[0-9]+[0-9kK]$/.test(rutLimpio) || rutLimpio.length < 8 || rutLimpio.length > 9) {
      return false;
    }

    const rutNumeros = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();

    let suma = 0;
    let multiplicador = 2;

    for (let i = rutNumeros.length - 1; i >= 0; i--) {
      suma += parseInt(rutNumeros[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();

    return dv === dvCalculado;
  }

  /**
   * Obtiene el nombre completo de un usuario
   */
  obtenerNombreCompleto(usuario: Usuario): string {
    return usuario.nombre || '';
  }

  /**
   * Obtiene la etiqueta legible de un rol
   */
  obtenerEtiquetaRol(rol: RolUsuario): string {
    const etiquetas = {
      [RolUsuario.ADMINISTRADOR]: 'Administrador',
      [RolUsuario.RESPONSABLE]: 'Responsable',
      [RolUsuario.USUARIO_INTERNO]: 'Usuario Interno',
      [RolUsuario.USUARIO_EXTERNO]: 'Usuario Externo'
    };
    
    return etiquetas[rol] || 'Usuario';
  }

  /**
   * Verifica si un usuario tiene permisos de administrador
   */
  esAdministrador(usuario: Usuario): boolean {
    return usuario.rol === RolUsuario.ADMINISTRADOR;
  }

  /**
   * Verifica si un usuario tiene permisos de responsable o superior
   */
  esResponsableOSuperior(usuario: Usuario): boolean {
    return [RolUsuario.ADMINISTRADOR, RolUsuario.RESPONSABLE].includes(usuario.rol);
  }

  /**
   * Obtiene los usuarios filtrados por departamento
   */
  async obtenerUsuariosPorDepartamento(idDepartamento: number): Promise<RespuestaUsuarios> {
    return this.obtenerUsuarios({ departamento: idDepartamento });
  }

  // ============ MÉTODOS PRIVADOS DE PARSEO DE NOMBRES ============

  private extraerPrimerNombre(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(' ');
    return partes[0] || '';
  }

  private extraerSegundoNombre(nombreCompleto: string): string | undefined {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length >= 4) {
      return partes[1];
    }
    return undefined;
  }

  private extraerPrimerApellido(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length >= 3) {
      return partes[partes.length - 2];
    } else if (partes.length === 2) {
      return partes[1];
    }
    return '';
  }

  private extraerSegundoApellido(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length >= 3) {
      return partes[partes.length - 1];
    }
    return '';
  }
}