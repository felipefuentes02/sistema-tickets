export class RespuestaTicketDto {
  id_ticket!: number;
  numero_ticket!: string;
  asunto!: string;
  descripcion!: string;
  id_solicitante!: number;
  nombre_solicitante?: string;
  id_departamento!: number;
  id_prioridad!: number;
  id_estado!: number;
  asignado_a?: number | null;
  nombre_responsable?: string | null;
  fecha_creacion!: Date;
  fecha_actualizacion?: Date | null;
  fecha_vencimiento?: Date | null;
   
  departamento?: {
    id: number;
    nombre: string;
  };
  
  prioridad?: {
    id: number;
    nombre: string;
    nivel: number;
  };
  
  estado?: {
    id: number;
    nombre: string;
  };
}