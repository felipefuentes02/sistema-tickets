/**
 * Interface estándar para todas las respuestas del API
 * Proporciona consistencia en las respuestas del backend
 */
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

/**
 * Interface para respuestas con datos de ticket
 */
export interface RespuestaTicketApi extends RespuestaApi<RespuestaTicketDto> {}

/**
 * Interface para respuestas con lista de tickets
 */
export interface RespuestaTicketsApi extends RespuestaApi<RespuestaTicketDto[]> {}

/**
 * Interface para respuestas booleanas simples
 */
export interface RespuestaBooleanApi extends RespuestaApi<boolean> {}

/**
 * Interface para respuestas de creación (con ID generado)
 */
export interface RespuestaCreacionApi<T> extends RespuestaApi<T> {
  /**
   * ID del elemento creado
   */
  id_generado?: number;
}

/**
 * Interface para manejo de errores estándar
 */
export interface ErrorApi {
  /**
   * Código de error HTTP
   */
  status: number;

  /**
   * Mensaje de error legible para el usuario
   */
  message: string;

  /**
   * Código de error interno (para debugging)
   */
  code?: string;

  /**
   * Detalles adicionales del error
   */
  details?: any;

  /**
   * Timestamp del error
   */
  timestamp: string;

  /**
   * Ruta donde ocurrió el error
   */
  path?: string;
}