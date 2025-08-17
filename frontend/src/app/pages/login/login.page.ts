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

  ngOnInit() {
    console.log('LoginPage iniciada');
    // Limpiar localStorage al cargar la página de login
    localStorage.clear();
  }

  /**
   * Método de login principal
   */
  async onLogin() {
    console.log('=== INICIANDO LOGIN ===');
    console.log('Credenciales:', this.credentials);

    // Validar credenciales
    if (!this.credentials.correo || !this.credentials.contrasena) {
      this.showAlert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }

    // Mostrar loading
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...'
    });
    await loading.present();

    // Realizar login
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('=== LOGIN EXITOSO ===');
        console.log('Respuesta del backend:', response);
        
        loading.dismiss();
        
        // Pequeña pausa para asegurar que el localStorage se actualice
        setTimeout(() => {
          this.procesarRedireccion();
        }, 100);
      },
      error: (error) => {
        console.error('=== ERROR EN LOGIN ===');
        console.error('Error completo:', error);
        
        loading.dismiss();
        
        let mensaje = 'Credenciales inválidas';
        if (error.status === 0) {
          mensaje = 'Error de conexión. Verifica que el backend esté funcionando.';
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }
        
        this.showAlert('Error de Autenticación', mensaje);
      }
    });
  }

  /**
   * Procesar la redirección después del login exitoso
   */
  private procesarRedireccion(): void {
    console.log('=== PROCESANDO REDIRECCIÓN ===');
    
    // Debug: Mostrar información del usuario
    this.authService.debugUserInfo();
    
    // Obtener la ruta correspondiente
    const homeRoute = this.authService.getHomeRoute();
    console.log('Ruta determinada:', homeRoute);
    
    // Verificar que la ruta no sea login (evitar loop)
    if (homeRoute === '/login') {
      console.error('❌ Error: La ruta calculada es /login, algo está mal');
      this.showAlert('Error', 'Error al determinar la página de inicio');
      return;
    }
    
    // Navegación con debug adicional
    console.log('🚀 Navegando a:', homeRoute);
    this.router.navigate([homeRoute]).then(
      (success) => {
        if (success) {
          console.log('✅ Navegación exitosa a:', homeRoute);
        } else {
          console.error('❌ Error en la navegación a:', homeRoute);
        }
      }
    ).catch(
      (error) => {
        console.error('❌ Error al navegar:', error);
        this.showAlert('Error', 'Error al navegar a la página de inicio');
      }
    );
  }

  /**
   * Mostrar alerta al usuario
   * @param header - Título de la alerta
   * @param message - Mensaje de la alerta
   */
  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Método de debugging manual (puedes llamarlo desde la consola)
   */
  debugLogin(): void {
    console.log('=== DEBUG MANUAL ===');
    console.log('Usuario en localStorage:', localStorage.getItem('user'));
    console.log('Token en localStorage:', localStorage.getItem('access_token'));
    this.authService.debugUserInfo();
  }

  /**
   * Llenar credenciales de prueba para desarrollo
   */
  llenarCredencialesAdmin(): void {
    this.credentials.correo = 'felipefuentes02@gmail.com';
    this.credentials.contrasena = 'Admin123';
  }

  llenarCredencialesResponsable(): void {
    this.credentials.correo = 'responsable@empresa.com';
    this.credentials.contrasena = 'Responsable123';
  }

  llenarCredencialesCliente(): void {
    this.credentials.correo = 'cliente@empresa.com';
    this.credentials.contrasena = 'Cliente123';
  }
}