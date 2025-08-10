import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private authService: AuthService,
    private router: Router,
    private popoverController: PopoverController
  ) { }

  ngOnInit() {
    // Verificar si getCurrentUser retorna Observable o valor directo
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser && typeof currentUser.subscribe === 'function') {
      // Si es Observable
      currentUser.subscribe((user: any) => {
        this.usuario = user;
      });
    } else {
      // Si es valor directo
      this.usuario = currentUser;
    }
  }

  async mostrarMenuUsuario(event: any) {
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

  cerrarSesion() {
    // Verificar si logout retorna Observable o void
    const logoutResult = this.authService.logout();
    
    if (logoutResult && typeof logoutResult.subscribe === 'function') {
      // Si retorna Observable
      logoutResult.subscribe(() => {
        this.router.navigate(['/login']);
      });
    } else {
      // Si es void, navegar directamente
      this.router.navigate(['/login']);
    }
  }

  obtenerNombreCompleto(): string {
    if (!this.usuario) return 'Usuario';
    
    const nombre = this.usuario.primer_nombre || '';
    const apellido = this.usuario.primer_apellido || '';
    return `${nombre} ${apellido}`.trim() || 'Usuario';
  }

  obtenerIniciales(): string {
    if (!this.usuario) return 'U';
    
    const nombre = this.usuario.primer_nombre || '';
    const apellido = this.usuario.primer_apellido || '';
    
    if (nombre && apellido) {
      return (nombre[0] + apellido[0]).toUpperCase();
    } else if (nombre) {
      return nombre[0].toUpperCase();
    }
    return 'U';
  }

  // Navegación inteligente al home según el rol del usuario
  irAlHome() {
    if (this.usuario) {
      // Si es administrador (rol 1)
      if (this.usuario.id_rol === 1) {
        this.router.navigate(['/admin-home']);
      }
      // Si es cliente (rol 2) 
      else if (this.usuario.id_rol === 2) {
        this.router.navigate(['/home']);
      }
      // Si es responsable (rol 3)
      else if (this.usuario.id_rol === 3) {
        this.router.navigate(['/responsable-home']);
      }
      // Fallback al cliente home
      else {
        this.router.navigate(['/home']);
      }
    } else {
      // Si no hay usuario, ir al login
      this.router.navigate(['/login']);
    }
  }
}

// Componente del menú popup
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