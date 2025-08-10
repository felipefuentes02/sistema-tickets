export class RespuestaTicketDto {
  id_ticket: number;
  numero_ticket: string;
  asunto: string;
  descripcion: string;
  id_solicitante: number;
  asignado_a?: number;
  id_departamento: number;
  id_prioridad: number;
  id_estado: number;
  fecha_vencimiento?: Date;
  fecha_resolucion?: Date;
  fecha_cierre?: Date;
  fecha_creacion: Date;
  fecha_actualizacion?: Date;
  
  // Información relacionada (cuando se incluya)
  solicitante?: {
    id_usuario: number;
    primer_nombre: string;
    primer_apellido: string;
    correo: string;
  };
  
  departamento?: {
    id_departamento: number;
    nombre_departamento: string;
  };
  
  prioridad?: {
    id_prioridad: number;
    nombre_prioridad: string;
    nivel: number;
  };
  
  estado?: {
    id_estado: number;
    nombre_estado: string;
  };
}