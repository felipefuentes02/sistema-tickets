import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Ticket, CrearTicket, Departamento, Prioridad, Estado } from '../interfaces/ticket.interface';

/**
 * Servicio actualizado para gestión de tickets
 * Incluye métodos para obtener datos maestros del backend
 */
@Injectable({
  providedIn: 'root'
})
export class TicketsService {

  constructor(private apiService: ApiService) { 
    console.log('🎫 TicketsService inicializado');
  }

  // ============ MÉTODOS PRINCIPALES DE TICKETS ============

  /**
   * Crear un nuevo ticket
   * @param ticket - Datos del ticket a crear
   * @returns Observable<Ticket> - Ticket creado
   */
  crear(ticket: CrearTicket): Observable<Ticket> {
    console.log('📤 Enviando solicitud de creación de ticket:', {
      asunto: ticket.asunto,
      departamento: ticket.id_departamento,
      prioridad: ticket.id_prioridad
    });

    return this.apiService.post<any>('tickets', ticket).pipe(
      map(response => {
        console.log('✅ Respuesta del backend:', response);
        
        // Verificar si la respuesta tiene el formato esperado
        if (response && response.success && response.data) {
          return response.data;
        } else {
          throw new Error('Formato de respuesta inválido del servidor');
        }
      }),
      catchError(error => {
        console.error('❌ Error al crear ticket:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener mis tickets
   * @returns Observable<Ticket[]> - Lista de tickets del usuario
   */
  obtenerMisTickets(): Observable<Ticket[]> {
    console.log('📋 Obteniendo mis tickets...');

    return this.apiService.get<any>('tickets/mis-tickets').pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} tickets obtenidos`);
          return response.data;
        } else {
          console.warn('⚠️ Respuesta inválida, retornando array vacío');
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener mis tickets:', error);
        return of([]); // Retornar array vacío en caso de error
      })
    );
  }

  /**
   * Obtener todos los tickets (para admin/responsable)
   * @returns Observable<Ticket[]> - Lista de todos los tickets
   */
  obtenerTodos(): Observable<Ticket[]> {
    console.log('📋 Obteniendo todos los tickets...');

    return this.apiService.get<any>('tickets?incluir_relaciones=true').pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} tickets obtenidos`);
          return response.data;
        } else {
          console.warn('⚠️ Respuesta inválida, retornando array vacío');
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener todos los tickets:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener tickets en copia
   * @returns Observable<Ticket[]> - Lista de tickets donde estoy en copia
   */
  obtenerTicketsEnCopia(): Observable<Ticket[]> {
    console.log('📧 Obteniendo tickets en copia...');

    return this.apiService.get<any>('tickets/en-copia').pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} tickets en copia obtenidos`);
          return response.data;
        } else {
          console.warn('⚠️ Funcionalidad en copia aún no implementada');
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener tickets en copia:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener ticket por ID
   * @param id - ID del ticket
   * @returns Observable<Ticket> - Ticket específico
   */
  obtenerPorId(id: number): Observable<Ticket> {
    console.log(`🔍 Obteniendo ticket ID: ${id}`);

    return this.apiService.get<any>(`tickets/${id}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          console.log(`✅ Ticket ${id} obtenido correctamente`);
          return response.data;
        } else {
          throw new Error(`Ticket ${id} no encontrado`);
        }
      }),
      catchError(error => {
        console.error(`❌ Error al obtener ticket ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Actualizar ticket
   * @param id - ID del ticket
   * @param ticket - Datos a actualizar
   * @returns Observable<Ticket> - Ticket actualizado
   */
  actualizar(id: number, ticket: Partial<Ticket>): Observable<Ticket> {
    console.log(`📝 Actualizando ticket ${id}:`, ticket);

    return this.apiService.put<any>(`tickets/${id}`, ticket).pipe(
      map(response => {
        if (response && response.success && response.data) {
          console.log(`✅ Ticket ${id} actualizado correctamente`);
          return response.data;
        } else {
          throw new Error('Error al actualizar ticket');
        }
      }),
      catchError(error => {
        console.error(`❌ Error al actualizar ticket ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Eliminar ticket
   * @param id - ID del ticket
   * @returns Observable<{mensaje: string}> - Confirmación
   */
  eliminar(id: number): Observable<{mensaje: string}> {
    console.log(`🗑️ Eliminando ticket ${id}`);

    return this.apiService.delete<any>(`tickets/${id}`).pipe(
      map(response => {
        if (response && response.success) {
          console.log(`✅ Ticket ${id} eliminado correctamente`);
          return { mensaje: response.message };
        } else {
          throw new Error('Error al eliminar ticket');
        }
      }),
      catchError(error => {
        console.error(`❌ Error al eliminar ticket ${id}:`, error);
        throw error;
      })
    );
  }

  // ============ MÉTODOS PARA RESPONSABLES ============

  /**
   * Obtener tickets abiertos (para responsable)
   * @returns Observable<Ticket[]> - Tickets abiertos
   */
  obtenerTicketsAbiertos(): Observable<Ticket[]> {
    console.log('📂 Obteniendo tickets abiertos...');

    return this.apiService.get<any>('tickets/abiertos').pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} tickets abiertos obtenidos`);
          return response.data;
        } else {
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener tickets abiertos:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener tickets cerrados (para responsable)
   * @returns Observable<Ticket[]> - Tickets cerrados
   */
  obtenerTicketsCerrados(): Observable<Ticket[]> {
    console.log('📁 Obteniendo tickets cerrados...');

    return this.apiService.get<any>('tickets/cerrados').pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} tickets cerrados obtenidos`);
          return response.data;
        } else {
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener tickets cerrados:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener tickets pendientes (para responsable)
   * @returns Observable<Ticket[]> - Tickets pendientes
   */
  obtenerTicketsPendientes(): Observable<Ticket[]> {
    console.log('⏰ Obteniendo tickets pendientes...');

    return this.apiService.get<any>('tickets/pendientes').pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} tickets pendientes obtenidos`);
          return response.data;
        } else {
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener tickets pendientes:', error);
        return of([]);
      })
    );
  }

  /**
   * Tomar un ticket (asignárselo al responsable actual)
   * @param idTicket - ID del ticket a tomar
   * @returns Observable<Ticket> - Ticket asignado
   */
  tomarTicket(idTicket: number): Observable<Ticket> {
    console.log(`🤝 Tomando ticket ${idTicket}...`);

    return this.apiService.put<any>(`tickets/${idTicket}/tomar`, {}).pipe(
      map(response => {
        if (response && response.success && response.data) {
          console.log(`✅ Ticket ${idTicket} tomado correctamente`);
          return response.data;
        } else {
          throw new Error('Error al tomar el ticket');
        }
      }),
      catchError(error => {
        console.error(`❌ Error al tomar ticket ${idTicket}:`, error);
        throw error;
      })
    );
  }

  /**
   * Derivar ticket a otro departamento
   * @param idTicket - ID del ticket
   * @param idDepartamentoDestino - ID del departamento destino
   * @param motivo - Motivo de la derivación
   * @returns Observable<Ticket> - Ticket derivado
   */
  derivarTicket(idTicket: number, idDepartamentoDestino: number, motivo: string): Observable<Ticket> {
    console.log(`📤 Derivando ticket ${idTicket} al departamento ${idDepartamentoDestino}`);

    const datos = {
      id_departamento_destino: idDepartamentoDestino,
      motivo: motivo
    };

    return this.apiService.put<any>(`tickets/${idTicket}/derivar`, datos).pipe(
      map(response => {
        if (response && response.success && response.data) {
          console.log(`✅ Ticket ${idTicket} derivado correctamente`);
          return response.data;
        } else {
          throw new Error('Error al derivar el ticket');
        }
      }),
      catchError(error => {
        console.error(`❌ Error al derivar ticket ${idTicket}:`, error);
        throw error;
      })
    );
  }

  // ============ MÉTODOS PARA DATOS MAESTROS ============

  /**
   * Obtener todos los departamentos activos
   * @returns Observable<Departamento[]> - Lista de departamentos
   */
  obtenerDepartamentos(): Observable<Departamento[]> {
    console.log('📁 Obteniendo departamentos desde backend...');

    return this.apiService.get<any>('datos-maestros/departamentos').pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} departamentos obtenidos del backend`);
          
          // Convertir al formato esperado por el frontend
          return response.data.map((dept: any) => ({
            id_departamento: dept.id_departamento,
            nombre_departamento: dept.nombre_departamento,
            descripcion: dept.descripcion,
            activo: dept.activo
          }));
        } else {
          throw new Error('Error al obtener departamentos del backend');
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener departamentos, usando datos fallback:', error);
        
        // Datos de fallback si el backend no responde
        return of([
          { id_departamento: 1, nombre_departamento: 'Administración' },
          { id_departamento: 2, nombre_departamento: 'Comercial' },
          { id_departamento: 3, nombre_departamento: 'Informática' },
          { id_departamento: 4, nombre_departamento: 'Operaciones' }
        ]);
      })
    );
  }

  /**
   * Obtener todas las prioridades
   * @returns Observable<Prioridad[]> - Lista de prioridades
   */
  obtenerPrioridades(): Observable<Prioridad[]> {
    console.log('⚡ Obteniendo prioridades desde backend...');

    return this.apiService.get<any>('datos-maestros/prioridades').pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} prioridades obtenidas del backend`);
          
          // Convertir al formato esperado por el frontend
          return response.data.map((prioridad: any) => ({
            id_prioridad: prioridad.id_prioridad,
            nombre_prioridad: prioridad.nombre_prioridad,
            nivel: prioridad.nivel,
            color_hex: prioridad.color_hex,
            tiempo_respuesta_horas: prioridad.tiempo_respuesta_horas
          }));
        } else {
          throw new Error('Error al obtener prioridades del backend');
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener prioridades, usando datos fallback:', error);
        
        // Datos de fallback si el backend no responde
        return of([
          { id_prioridad: 1, nombre_prioridad: 'Alta', nivel: 1 },
          { id_prioridad: 2, nombre_prioridad: 'Media', nivel: 2 },
          { id_prioridad: 3, nombre_prioridad: 'Baja', nivel: 3 }
        ]);
      })
    );
  }

  /**
   * Obtener todos los estados
   * @returns Observable<Estado[]> - Lista de estados
   */
  obtenerEstados(): Observable<Estado[]> {
    console.log('🔄 Obteniendo estados desde backend...');

    return this.apiService.get<any>('datos-maestros/estados').pipe(
      map(response => {
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ ${response.data.length} estados obtenidos del backend`);
          
          return response.data.map((estado: any) => ({
            id_estado: estado.id_estado,
            nombre_estado: estado.nombre_estado,
            descripcion: estado.descripcion,
            es_estado_final: estado.es_estado_final,
            color_hex: estado.color_hex
          }));
        } else {
          throw new Error('Error al obtener estados del backend');
        }
      }),
      catchError(error => {
        console.error('❌ Error al obtener estados, usando datos fallback:', error);
        
        // Datos de fallback si el backend no responde
        return of([
          { id_estado: 1, nombre_estado: 'Nuevo', es_estado_final: false },
          { id_estado: 2, nombre_estado: 'En Progreso', es_estado_final: false },
          { id_estado: 3, nombre_estado: 'Escalado', es_estado_final: false },
          { id_estado: 4, nombre_estado: 'Resuelto', es_estado_final: true },
          { id_estado: 5, nombre_estado: 'Cerrado', es_estado_final: true }
        ]);
      })
    );
  }

  /**
   * Obtener todos los datos maestros necesarios para el formulario
   * @returns Observable con departamentos y prioridades
   */
  obtenerDatosMaestrosFormulario(): Observable<{
    departamentos: Departamento[];
    prioridades: Prioridad[];
  }> {
    console.log('📚 Obteniendo datos maestros para formulario...');

    return forkJoin({
      departamentos: this.obtenerDepartamentos(),
      prioridades: this.obtenerPrioridades()
    }).pipe(
      tap(datos => {
        console.log('✅ Datos maestros cargados:', {
          departamentos: datos.departamentos.length,
          prioridades: datos.prioridades.length
        });
      }),
      catchError(error => {
        console.error('❌ Error al cargar datos maestros:', error);
        
        // Retornar datos básicos de fallback
        return of({
          departamentos: [
            { id_departamento: 1, nombre_departamento: 'Administración' },
            { id_departamento: 2, nombre_departamento: 'Comercial' },
            { id_departamento: 3, nombre_departamento: 'Informática' },
            { id_departamento: 4, nombre_departamento: 'Operaciones' }
          ],
          prioridades: [
            { id_prioridad: 1, nombre_prioridad: 'Alta', nivel: 1 },
            { id_prioridad: 2, nombre_prioridad: 'Media', nivel: 2 },
            { id_prioridad: 3, nombre_prioridad: 'Baja', nivel: 3 }
          ]
        });
      })
    );
  }

  /**
   * Validar datos antes de crear ticket
   * @param idDepartamento - ID del departamento
   * @param idPrioridad - ID de la prioridad
   * @returns Observable<boolean> - True si los datos son válidos
   */
  validarDatosTicket(idDepartamento: number, idPrioridad: number): Observable<boolean> {
    console.log(`🔍 Validando datos: departamento=${idDepartamento}, prioridad=${idPrioridad}`);

    return this.apiService.get<any>(`datos-maestros/validar/${idDepartamento}/${idPrioridad}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          const esValido = response.data.puede_crear_ticket;
          console.log(`✅ Validación completada: ${esValido ? 'VÁLIDO' : 'INVÁLIDO'}`);
          return esValido;
        } else {
          return false;
        }
      }),
      catchError(error => {
        console.error('❌ Error en validación, asumiendo datos válidos:', error);
        return of(true); // En caso de error, asumir que son válidos
      })
    );
  }

  // ============ MÉTODOS DE UTILIDAD ============

  /**
   * Obtener color CSS para prioridad
   * @param idPrioridad - ID de la prioridad
   * @returns string - Clase CSS o color
   */
  obtenerColorPrioridad(idPrioridad: number): string {
    switch (idPrioridad) {
      case 1: return 'danger'; // Rojo para Alta
      case 2: return 'warning'; // Amarillo para Media
      case 3: return 'success'; // Verde para Baja
      default: return 'medium'; // Gris por defecto
    }
  }

  /**
   * Obtener color CSS para estado
   * @param idEstado - ID del estado
   * @returns string - Clase CSS o color
   */
  obtenerColorEstado(idEstado: number): string {
    switch (idEstado) {
      case 1: return 'primary'; // Azul para Nuevo
      case 2: return 'warning'; // Amarillo para En Progreso
      case 3: return 'danger'; // Rojo para Escalado
      case 4: return 'success'; // Verde para Resuelto
      case 5: return 'medium'; // Gris para Cerrado
      default: return 'dark'; // Negro por defecto
    }
  }

  /**
   * Formatear fecha para mostrar en la UI
   * @param fecha - Fecha a formatear
   * @returns string - Fecha formateada
   */
  formatearFecha(fecha: Date | string): string {
    if (!fecha) return 'No definida';

    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    return fechaObj.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Verificar si un ticket está vencido
   * @param fechaVencimiento - Fecha de vencimiento del ticket
   * @returns boolean - True si está vencido
   */
  estaVencido(fechaVencimiento: Date | string): boolean {
    if (!fechaVencimiento) return false;

    const fecha = typeof fechaVencimiento === 'string' ? 
      new Date(fechaVencimiento) : 
      fechaVencimiento;
    
    return fecha < new Date();
  }

  /**
   * Calcular tiempo restante hasta vencimiento
   * @param fechaVencimiento - Fecha de vencimiento
   * @returns string - Tiempo restante formateado
   */
  calcularTiempoRestante(fechaVencimiento: Date | string): string {
    if (!fechaVencimiento) return 'Sin fecha límite';

    const fecha = typeof fechaVencimiento === 'string' ? 
      new Date(fechaVencimiento) : 
      fechaVencimiento;
    
    const ahora = new Date();
    const diferencia = fecha.getTime() - ahora.getTime();

    if (diferencia < 0) {
      // Ya vencido
      const horasVencido = Math.abs(diferencia) / (1000 * 60 * 60);
      if (horasVencido < 24) {
        return `Vencido hace ${Math.floor(horasVencido)} horas`;
      } else {
        return `Vencido hace ${Math.floor(horasVencido / 24)} días`;
      }
    } else {
      // Tiempo restante
      const horasRestantes = diferencia / (1000 * 60 * 60);
      if (horasRestantes < 24) {
        return `${Math.floor(horasRestantes)} horas restantes`;
      } else {
        return `${Math.floor(horasRestantes / 24)} días restantes`;
      }
    }
  }
}