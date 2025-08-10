export interface MetricasDepartamento {
  total_tickets: number;
  tickets_abiertos: number;
  tickets_cerrados: number;
  tickets_vencidos: number;
  tiempo_promedio_resolucion: number;
  satisfaccion_promedio: number;
}

export interface TicketsPorEstado {
  estado: string;
  cantidad: number;
  color: string;
}

export interface TicketsPorPrioridad {
  prioridad: string;
  cantidad: number;
  color: string;
}

export interface TendenciaSemanal {
  dia: string;
  creados: number;
  resueltos: number;
}

export interface ResumenResponsable {
  id_departamento: number;
  nombre_departamento: string;
  metricas: MetricasDepartamento;
  tickets_por_estado: TicketsPorEstado[];
  tickets_por_prioridad: TicketsPorPrioridad[];
  tendencia_semanal: TendenciaSemanal[];
}