export interface RespuestaApi<T> {
  /**
   * Indica si la operación fue exitosa
   */
  success: boolean;

  /**
   * Datos de la respuesta (puede ser objeto, array o null)
   */
  data: T;

  /**
   * Mensaje descriptivo de la operación
   */
  message: string;

  /**
   * Información de error (solo presente si success = false)
   */
  error?: string;

  /**
   * Timestamp de la respuesta (opcional)
   */
  timestamp?: string;

  /**
   * Información de paginación (opcional, para listas)
   */
  pagination?: {
    pagina_actual: number;
    total_paginas: number;
    total_elementos: number;
    elementos_por_pagina: number;
  };
}