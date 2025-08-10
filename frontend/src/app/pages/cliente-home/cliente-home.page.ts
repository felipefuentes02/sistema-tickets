import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from 'src/app/components/header/header.component';

@Component({
  selector: 'app-cliente-home',
  templateUrl: './cliente-home.page.html',
  styleUrls: ['./cliente-home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class ClienteHomePage implements OnInit {

  usuario: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Obtener datos del usuario actual
    this.usuario = this.authService.getCurrentUser();
  }

  // Navegar a ingresar solicitud
  irAIngresarSolicitud() {
    console.log('Navegando a ingresar solicitud...');
    this.router.navigate(['/ingresar-solicitud']);
  }

  // Navegar a mis solicitudes
  irAMisSolicitudes() {
    console.log('Navegando a mis solicitudes...');
    this.router.navigate(['/mis-solicitudes']);
  }

  // Navegar a solicitudes en copia
  irASolicitudesEnCopia() {
    console.log('Navegando a solicitudes en copia...');
    this.router.navigate(['/solicitudes-copia']);
  }

  obtenerNombreUsuario(): string {
    return this.usuario ? this.usuario.nombre : 'Usuario';
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