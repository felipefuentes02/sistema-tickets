export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  access_token: string;
  usuario: {
    id: number;
    nombre: string;
    correo: string;
    rol: number;
    departamento: number;
  };
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: number;
  departamento: number;
}