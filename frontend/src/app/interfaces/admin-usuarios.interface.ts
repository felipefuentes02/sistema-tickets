
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rut: string;
  id_departamento: number;
  nombre_departamento?: string;
  rol: RolUsuario;
  fecha_creacion: string;
  ultimo_acceso?: string;
}

export enum RolUsuario {
  ADMINISTRADOR = 'administrador',
  RESPONSABLE = 'responsable',
  USUARIO_INTERNO = 'usuario_interno',
  USUARIO_EXTERNO = 'usuario_externo'
}

export interface CrearUsuario {
  nombre: string;
  email: string;
  rut: string;
  password: string;
  confirmarPassword: string;
  id_departamento: number;
  rol: RolUsuario;
}

export interface ActualizarUsuario {
  nombre?: string;
  email?: string;
  rut?: string;
  password?: string;
  confirmarPassword?: string;
  id_departamento?: number;
  rol?: RolUsuario;
}

export interface Departamento {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface RespuestaUsuarios {
  success: boolean;
  data: Usuario[] | Usuario;
  message: string;
  error?: string;
  paginacion?: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}
export interface FiltrosUsuario {
  nombre?: string;
  departamento?: number;
  rol?: RolUsuario;
  ordenarPor?: 'nombre' | 'email' | 'fecha_creacion' | 'ultimo_acceso';
  direccion?: 'asc' | 'desc';
  pagina?: number;
  limite?: number;
}

export interface ErroresValidacion {
  nombre?: string;
  email?: string;
  rut?: string;
  password?: string;
  confirmarPassword?: string;
  id_departamento?: string;
  rol?: string;
}