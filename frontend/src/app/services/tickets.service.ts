import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';
import { Ticket, CrearTicket } from '../interfaces/ticket.interface';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {

  constructor(private apiService: ApiService) { }

  // Métodos existentes...
  crear(ticket: CrearTicket): Observable<Ticket> {
    return this.apiService.post<Ticket>('tickets', ticket);
  }

  obtenerMisTickets(): Observable<Ticket[]> {
    return this.apiService.get<Ticket[]>('tickets/mis-tickets');
  }

  obtenerTodos(): Observable<Ticket[]> {
    return this.apiService.get<Ticket[]>('tickets');
  }

  obtenerTicketsEnCopia(): Observable<Ticket[]> {
    return this.apiService.get<Ticket[]>('tickets/en-copia');
  }

  obtenerPorId(id: number): Observable<Ticket> {
    return this.apiService.get<Ticket>(`tickets/${id}`);
  }

  actualizar(id: number, ticket: Partial<Ticket>): Observable<Ticket> {
    return this.apiService.put<Ticket>(`tickets/${id}`, ticket);
  }

  eliminar(id: number): Observable<{mensaje: string}> {
    return this.apiService.delete<{mensaje: string}>(`tickets/${id}`);
  }

  // NUEVOS MÉTODOS para el responsable:

  // Obtener tickets abiertos (para responsable)
  obtenerTicketsAbiertos(): Observable<Ticket[]> {
    // TODO: Implementar cuando el backend esté listo
    // return this.apiService.get<Ticket[]>('tickets/abiertos');
    
    // Por ahora retornamos observable vacío para que funcione con datos mock
    return of([]);
  }

  // Obtener tickets cerrados (para responsable)
  obtenerTicketsCerrados(): Observable<Ticket[]> {
    // TODO: Implementar cuando el backend esté listo
    // return this.apiService.get<Ticket[]>('tickets/cerrados');
    
    return of([]);
  }

  // Obtener tickets pendientes (para responsable)
  obtenerTicketsPendientes(): Observable<Ticket[]> {
    // TODO: Implementar cuando el backend esté listo
    // return this.apiService.get<Ticket[]>('tickets/pendientes');
    
    return of([]);
  }

  // Tomar un ticket (asignárselo al responsable actual)
  tomarTicket(idTicket: number): Observable<Ticket> {
    return this.apiService.put<Ticket>(`tickets/${idTicket}/tomar`, {});
  }

  // Derivar ticket a otro departamento
  derivarTicket(idTicket: number, idDepartamentoDestino: number, motivo: string): Observable<Ticket> {
    return this.apiService.put<Ticket>(`tickets/${idTicket}/derivar`, {
      id_departamento_destino: idDepartamentoDestino,
      motivo: motivo
    });
  }
}
