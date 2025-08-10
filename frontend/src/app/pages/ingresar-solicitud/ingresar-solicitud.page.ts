import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { CrearTicket, Departamento, Prioridad } from '../../interfaces/ticket.interface';
import { TicketsService } from 'src/app/services/tickets.service';

@Component({
  selector: 'app-ingresar-solicitud',
  templateUrl: './ingresar-solicitud.page.html',
  styleUrls: ['./ingresar-solicitud.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class IngresarSolicitudPage implements OnInit {

  ticket: CrearTicket = {
    asunto: '',
    descripcion: '',
    id_departamento: 0,
    id_prioridad: 0
  };

  // Datos de las listas desplegables (por ahora datos estáticos)
  departamentos: Departamento[] = [
    { id_departamento: 1, nombre_departamento: 'Administración' },
    { id_departamento: 2, nombre_departamento: 'Comercial' },
    { id_departamento: 3, nombre_departamento: 'Informática' },
    { id_departamento: 4, nombre_departamento: 'Operaciones' }
  ];

  prioridades: Prioridad[] = [
    { id_prioridad: 1, nombre_prioridad: 'Alta', nivel: 1 },
    { id_prioridad: 2, nombre_prioridad: 'Media', nivel: 2 },
    { id_prioridad: 3, nombre_prioridad: 'Baja', nivel: 3 }
  ];

  // Archivos adjuntos (funcionalidad futura)
  archivosSeleccionados: File[] = [];

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
    private ticketsService: TicketsService
  ) { }

  ngOnInit() {
    // Inicializar valores por defecto
    this.ticket.id_prioridad = 2;
  }

  async enviarSolicitud() {
  if (!this.validarFormulario()) {
    return;
  }

  const loading = await this.loadingController.create({
    message: 'Enviando solicitud...'
  });
  await loading.present();

  // Usar el servicio real de tickets
  this.ticketsService.crear(this.ticket).subscribe({
    next: (ticketCreado) => {
      loading.dismiss();
      console.log('Ticket creado:', ticketCreado);
      this.mostrarToast('Solicitud enviada exitosamente', 'success');
      this.limpiarFormulario();
      
      // Opcional: redirigir a mis solicitudes
      setTimeout(() => {
        this.router.navigate(['/mis-solicitudes']);
      }, 1500);
    },
    error: (error) => {
      loading.dismiss();
      console.error('Error al enviar solicitud:', error);
      this.mostrarAlerta('Error', 'No se pudo enviar la solicitud. Intente nuevamente.');
    }
    });
  }

  private validarFormulario(): boolean {
    if (!this.ticket.asunto.trim()) {
      this.mostrarAlerta('Error', 'El asunto es obligatorio');
      return false;
    }

    if (!this.ticket.descripcion.trim()) {
      this.mostrarAlerta('Error', 'La descripción es obligatoria');
      return false;
    }

    if (!this.ticket.id_departamento) {
      this.mostrarAlerta('Error', 'Debe seleccionar un departamento');
      return false;
    }

    if (!this.ticket.id_prioridad) {
      this.mostrarAlerta('Error', 'Debe seleccionar una prioridad');
      return false;
    }

    return true;
  }

  public limpiarFormulario() {
    this.ticket = {
      asunto: '',
      descripcion: '',
      id_departamento: 0,
      id_prioridad: 2
    };
    this.archivosSeleccionados = [];
  }

  // Manejo de archivos (funcionalidad futura)
  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      // TODO: Validar tamaño y tipo de archivos
      this.archivosSeleccionados = Array.from(files);
    }
  }

  eliminarArchivo(index: number) {
    this.archivosSeleccionados.splice(index, 1);
  }

  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
