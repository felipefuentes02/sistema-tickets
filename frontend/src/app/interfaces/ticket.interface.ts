export interface Ticket {
  id_ticket?: number;
  numero_ticket?: string;
  asunto: string;
  descripcion: string;
  id_solicitante?: number;
  asignado_a?: number;
  id_departamento: number;
  id_prioridad: number;
  id_estado?: number;
  fecha_vencimiento?: Date;
  fecha_resolucion?: Date;
  fecha_cierre?: Date;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

export interface CrearTicket {
  asunto: string;
  descripcion: string;
  id_departamento: number;
  id_prioridad: number;
}

export interface Departamento {
  id_departamento: number;
  nombre_departamento: string;
}

export interface Prioridad {
  id_prioridad: number;
  nombre_prioridad: string;
  nivel: number;
}