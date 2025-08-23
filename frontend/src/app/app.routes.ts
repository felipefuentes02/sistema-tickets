/**
 * Archivo: frontend/src/app/app.routes.ts
 * Descripción: Configuración de rutas de la aplicación corregida
 * Autor: Sistema de Gestión de Tickets
 * Fecha: 2025
 */

import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  
  // ============ RUTAS DEL CLIENTE ============
  {
    path: 'home',
    loadComponent: () => import('./pages/cliente-home/cliente-home.page').then(m => m.ClienteHomePage)
    // Quitar guards temporalmente: canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'ingresar-solicitud',
    loadComponent: () => import('./pages/ingresar-solicitud/ingresar-solicitud.page').then(m => m.IngresarSolicitudPage),
    canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'mis-solicitudes',
    loadComponent: () => import('./pages/mis-solicitudes/mis-solicitudes.page').then(m => m.MisSolicitudesPage),
    canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'solicitudes-copia',
    loadComponent: () => import('./pages/solicitudes-copia/solicitudes-copia.page').then(m => m.SolicitudesCopiePage),
    canActivate: [AuthGuard, RoleGuard]
  },
  
  // ============ RUTAS DEL RESPONSABLE ============
  {
    path: 'responsable-home',
    loadComponent: () => import('./pages/responsable-home/responsable-home.page').then(m => m.ResponsableHomePage)
    // Quitar guards temporalmente: canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'solicitudes-abiertas',
    loadComponent: () => import('./pages/solicitudes-abiertas/solicitudes-abiertas.page').then(m => m.SolicitudesAbiertasPage)
  },
  {
    path: 'solicitudes-cerradas',
    loadComponent: () => import('./pages/solicitudes-cerradas/solicitudes-cerradas.page').then(m => m.SolicitudesCerradasPage)
  },
  {
    path: 'solicitudes-pendientes',
    loadComponent: () => import('./pages/solicitudes-pendientes/solicitudes-pendientes.page').then(m => m.SolicitudesPendientesPage)
  },
  {
    path: 'metricas',
    loadComponent: () => import('./pages/metricas/metricas.page').then(m => m.MetricasPage)
  },
  
  // ============ RUTAS DEL ADMINISTRADOR ============
  {
    path: 'admin-home',
    loadComponent: () => import('./pages/admin-home/admin-home.page').then(m => m.AdminHomePage),
    canActivate: [AuthGuard, AdminGuard],
    data: { 
      titulo: 'Home Administrador',
      descripcion: 'Panel principal del administrador'
    }
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage),
    canActivate: [AuthGuard, AdminGuard],
    data: { 
      titulo: 'Dashboard Completo',
      descripcion: 'Métricas detalladas de la empresa'
    }
  },
  {
    path: 'admin-usuarios',
    loadComponent: () => import('./pages/admin-usuarios/admin-usuarios.page').then(m => m.AdminUsuariosPage),
    canActivate: [AuthGuard, AdminGuard],
    data: { 
      titulo: 'Gestión de Usuarios',
      descripcion: 'Administrar usuarios del sistema'
    }
  },
  {
  path: 'admin-usuarios/crear',
  loadComponent: () => import('./pages/admin-usuarios/crear-usuario/crear-usuario.page').then(m => m.CrearUsuarioPage),
  canActivate: [AuthGuard, AdminGuard],
  data: { 
    titulo: 'Crear Usuario',
    descripcion: 'Formulario para crear nuevo usuario'
  }
 }
/*,
  {
    path: 'admin-usuarios/editar/:id',
    loadComponent: () => import('./pages/admin-usuarios/editar-usuario/editar-usuario.page').then(m => m.EditarUsuarioPage),
    canActivate: [AuthGuard, AdminGuard],
    data: { 
      titulo: 'Editar Usuario',
      descripcion: 'Formulario para editar usuario existente'
    }
  },
  {
    path: 'admin-reportes',
    loadComponent: () => import('./pages/admin-reportes/admin-reportes.page').then(m => m.AdminReportesPage),
    canActivate: [AuthGuard, AdminGuard],
    data: { 
      titulo: 'Reportes',
      descripcion: 'Generación y visualización de reportes'
    }
  },
  {
    path: 'admin-configuracion',
    loadComponent: () => import('./pages/admin-configuracion/admin-configuracion.page').then(m => m.AdminConfiguracionPage),
    canActivate: [AuthGuard, AdminGuard],
    data: { 
      titulo: 'Configuración',
      descripcion: 'Configuración del sistema'
    }
  },
  {
    path: 'admin-departamento/:id',
    loadComponent: () => import('./pages/admin-departamento/admin-departamento.page').then(m => m.AdminDepartamentoPage),
    canActivate: [AuthGuard, AdminGuard],
    data: { 
      titulo: 'Detalle Departamento',
      descripcion: 'Métricas detalladas del departamento'
    }
  },
  
  // ============ RUTA WILDCARD (DEBE IR AL FINAL) ============
  {
    path: '**',
    redirectTo: '/login'
  }*/
];