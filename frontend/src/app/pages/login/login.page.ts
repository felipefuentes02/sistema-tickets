import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

  credentials = {
    correo: '',
    contrasena: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  // Agregar este método que faltaba
  ngOnInit() {
    // Método vacío por ahora para debugging
    console.log('LoginPage iniciada');
  }

  async onLogin() {
    // Limpiar localStorage antes de login
    localStorage.clear();
    
    if (!this.credentials.correo || !this.credentials.contrasena) {
      this.showAlert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...'
    });
    await loading.present();

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        loading.dismiss();
        console.log('Login page - respuesta:', response);
        
        // Esperar un momento para que se guarde en localStorage
        setTimeout(() => {
          const homeRoute = this.authService.getHomeRoute();
          console.log('Login page - navegando a:', homeRoute);
          this.router.navigate([homeRoute]);
        }, 100);
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error en login:', error);
        this.showAlert('Error', 'Credenciales inválidas');
      }
    });
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}