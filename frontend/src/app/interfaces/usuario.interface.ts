export interface Usuario {
  id_usuario?: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  correo: string;
  hash_contrasena?: string;
  id_rol: number;
  id_departamento?: number;
  es_interno?: boolean;
  ultimo_acceso?: Date;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

export interface LoginCredentials {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  access_token: string;
  user: Usuario;
}