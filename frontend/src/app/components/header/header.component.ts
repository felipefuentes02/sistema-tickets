import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Componente MenuUsuarioComponent para el popover del menú de usuario
 */
@Component({
  template: `
    <ion-content>
      <ion-list>
        <ion-item button (click)="cerrarSesion()">
          <ion-icon name="log-out-outline" slot="start"></ion-icon>
          <ion-label>Cerrar Sesión</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MenuUsuarioComponent {
  constructor(private popoverController: PopoverController) {}

  async cerrarSesion() {
    await this.popoverController.dismiss({ action: 'logout' });
  }
}

/**
 * Componente Header principal del sistema
 * Incluye logo de empresa, título y menú de usuario
 * El logo navega inteligentemente según el rol del usuario
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HeaderComponent implements OnInit {
  @Input() titulo: string = 'Sistema de Tickets';
  
  usuario: any = null;

  /**
   * Constructor del componente
   */
  constructor(
    private authService: AuthService,
    private router: Router,
    private popoverController: PopoverController
  ) { }

  
   //Inicialización del componente
   //Obtiene los datos del usuario actual
  ngOnInit() {
  console.log('Inicializando HeaderComponent...');
  this.usuario = this.authService.getCurrentUser();
  console.log('Usuario obtenido:', this.usuario);
  }

  //Muestra el menú desplegable del usuario
  async mostrarMenuUsuario(event: any): Promise<void> {
    const popover = await this.popoverController.create({
      component: MenuUsuarioComponent,
      event: event,
      translucent: true,
      showBackdrop: true
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data?.action === 'logout') {
      this.cerrarSesion();
    }
  }

   //Cierra la sesión del usuario actual
  cerrarSesion(): void {
  console.log('Cerrando sesión...');
  this.authService.logout();
  this.router.navigate(['/login']);
  }

   //NAVEGACIÓN  AL HOME
   //Este es el método corregido que resuelve el problema de navegación
  irAlHome(): void {
  console.log('Click en logo - navegando al home según rol...');
  
  if (!this.usuario) {
    console.log('No hay usuario logueado, redirigiendo al login');
    this.router.navigate(['/login']);
    return;
  }

  console.log('Usuario actual:', this.usuario);
  
  // Determinar la ruta según el rol del usuario
  let rutaDestino = '/home'; // Fallback por defecto (cliente)

  // Verificar por ID de rol (método principal)
  if (this.usuario.id_rol) {
    switch (this.usuario.id_rol) {
      case 1:
        rutaDestino = '/admin-home';
        break;
      case 2:
        rutaDestino = '/home';
        break;
      case 3:
        rutaDestino = '/responsable-home';
        break;
      default:
        rutaDestino = '/responsable-home';
    }
  } 
  // Método alternativo: verificar por correo
  else if (this.usuario.correo) {
    if (this.usuario.correo.includes('admin')) {
      rutaDestino = '/admin-home';
    } else if (this.usuario.correo.includes('responsable')) {
      rutaDestino = '/responsable-home';
    } else {
      rutaDestino = '/home';
    }
  }

  console.log('Navegando a:', rutaDestino);
  this.router.navigate([rutaDestino]);
}

   //Obtiene el nombre completo del usuario para mostrar en el header
  obtenerNombreCompleto(): string {
    if (!this.usuario) return 'Usuario';
    
    // Intentar obtener nombre desde diferentes propiedades
    const primerNombre = this.usuario.primer_nombre || this.usuario.nombre || '';
    const primerApellido = this.usuario.primer_apellido || this.usuario.apellido || '';
    
    const nombreCompleto = `${primerNombre} ${primerApellido}`.trim();
    
    if (nombreCompleto) {
      return nombreCompleto;
    }
    
    // Fallback si no hay nombre
    if (this.usuario.correo) {
      return this.usuario.correo.split('@')[0];
    }
    
    return 'Usuario';
  }

  /**
   * Obtiene las iniciales del usuario para el avatar
   */
  obtenerIniciales(): string {
    if (!this.usuario) return 'U';
    
    const primerNombre = this.usuario.primer_nombre || this.usuario.nombre || '';
    const primerApellido = this.usuario.primer_apellido || this.usuario.apellido || '';
    
    if (primerNombre && primerApellido) {
      return (primerNombre[0] + primerApellido[0]).toUpperCase();
    } else if (primerNombre) {
      return primerNombre.substring(0, 2).toUpperCase();
    } else if (this.usuario.correo) {
      return this.usuario.correo.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  }

  //Obtiene el tipo de usuario para debugging
  obtenerTipoUsuario(): string {
    if (!this.usuario) return 'Desconocido';
    
    switch (this.usuario.id_rol) {
      case 1: return 'Administrador';
      case 2: return 'Cliente';
      case 3: return 'Responsable';
      default: return 'Usuario';
    }
  }
}
