import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';

/**
 * Interface para métricas de rendimiento
 */
interface MetricasRendimiento {
  tickets_totales: number;
  tickets_resueltos: number;
  tickets_pendientes: number;
  tiempo_promedio_resolucion: number;
  porcentaje_cumplimiento_sla: number;
}

/**
 * Interface para distribución por prioridad
 */
interface DistribucionPrioridad {
  alta: number;
  media: number;
  baja: number;
}

/**
 * Interface para tendencia mensual
 */
interface TendenciaMensual {
  mes: string;
  creados: number;
  resueltos: number;
  satisfaccion_promedio: number;
}

/**
 * Interface para satisfacción del cliente
 */
interface SatisfaccionCliente {
  promedio_general: number;
  total_encuestas: number;
  satisfecho: number;
  neutral: number;
  insatisfecho: number;
}

/**
 * Interface para datos del gráfico en tiempo real
 */
interface DatosTiempoReal {
  tiempo: string;
  nuevos: number;
  resueltos: number;
  timestamp: number;
}

/**
 * Interface para datos del gráfico circular
 */
interface DatosCircular {
  nombre: string;
  valor: number;
  color: string;
  porcentaje: number;
}

/**
 * Componente de métricas detalladas para responsables de departamento
 * Muestra solo las métricas del departamento específico del usuario
 */
@Component({
  selector: 'app-metricas',
  templateUrl: './metricas.page.html',
  styleUrls: ['./metricas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent]
})
export class MetricasPage implements OnInit, OnDestroy {

  // Propiedades del usuario y departamento
  usuario: any = null;
  departamentoUsuario: string = '';
  cargando = false;
  fechaActual = new Date();

  // Propiedades para gráficos en vivo
  private intervalos: any[] = [];
  datosGraficoTiempoReal: DatosTiempoReal[] = [];
  datosGraficoCircular: DatosCircular[] = [];

  // Las 4 métricas principales
  metricasRendimiento: MetricasRendimiento = {
    tickets_totales: 0,
    tickets_resueltos: 0,
    tickets_pendientes: 0,
    tiempo_promedio_resolucion: 0,
    porcentaje_cumplimiento_sla: 0
  };

  distribucionPrioridad: DistribucionPrioridad = {
    alta: 0,
    media: 0,
    baja: 0
  };

  tendenciaMensual: TendenciaMensual[] = [];

  satisfaccionCliente: SatisfaccionCliente = {
    promedio_general: 0,
    total_encuestas: 0,
    satisfecho: 0,
    neutral: 0,
    insatisfecho: 0
  };

  /**
   * Constructor del componente
   */
  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController
  ) { }

  /**
   * Inicialización del componente
   */
  ngOnInit() {
    console.log('Iniciando MetricasPage...');
    this.usuario = this.authService.getCurrentUser();
    this.departamentoUsuario = this.obtenerDepartamentoUsuario();
    this.cargarMetricas();
    this.iniciarActualizacionTiempoReal();
  }

  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy() {
    // Limpiar intervalos al destruir el componente
    this.intervalos.forEach(intervalo => clearInterval(intervalo));
    console.log('MetricasPage destruido, intervalos limpiados');
  }

  /**
   * Obtiene el departamento del usuario actual
   */
  private obtenerDepartamentoUsuario(): string {
    if (!this.usuario) return 'Departamento Desconocido';
    
    // Mapeo de departamentos según ID
    const departamentos = {
      1: 'Tecnologías de la Información',
      2: 'Recursos Humanos',
      3: 'Administración',
      4: 'Operaciones'
    };
    
    return departamentos[this.usuario.id_departamento as keyof typeof departamentos] || 
           this.usuario.departamento || 
           'Departamento Desconocido';
  }

  /**
   * Carga todas las métricas del departamento específico
   */
  async cargarMetricas(): Promise<void> {
    this.cargando = true;
    
    const loading = await this.loadingController.create({
      message: `Cargando métricas de ${this.departamentoUsuario}...`,
      duration: 2000
    });
    await loading.present();

    try {
      // TODO: Integrar con el backend real
      await this.cargarDatosEjemplo();
      
      await loading.dismiss();
      this.cargando = false;
      console.log('Métricas cargadas exitosamente');
    } catch (error) {
      console.error('Error al cargar métricas:', error);
      await loading.dismiss();
      this.cargando = false;
    }
  }

  /**
   * Carga datos de ejemplo específicos del departamento
   */
  private async cargarDatosEjemplo(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Datos específicos según el departamento
        this.cargarMetricasPorDepartamento();
        resolve();
      }, 1000);
    });
  }

  /**
   * Inicia la actualización en tiempo real de los gráficos
   */
  private iniciarActualizacionTiempoReal(): void {
    // Actualizar gráfico de barras cada 5 segundos
    const intervaloBarras = setInterval(() => {
      this.actualizarGraficoTiempoReal();
    }, 5000);

    // Actualizar gráfico circular cada 8 segundos
    const intervaloCircular = setInterval(() => {
      this.actualizarGraficoCircular();
    }, 8000);

    this.intervalos.push(intervaloBarras, intervaloCircular);

    // Cargar datos iniciales
    this.actualizarGraficoTiempoReal();
    this.actualizarGraficoCircular();
  }

  /**
   * Actualiza el gráfico de barras en tiempo real
   */
  private actualizarGraficoTiempoReal(): void {
    const ahora = new Date();
    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    const tiempoLabel = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;

    // Simular datos en tiempo real basados en el departamento
    const nuevosTickets = this.generarDatosAleatorios();
    const ticketsResueltos = this.generarDatosAleatorios(0.7); // 70% de los nuevos

    // Agregar nuevo punto de datos
    this.datosGraficoTiempoReal.push({
      tiempo: tiempoLabel,
      nuevos: nuevosTickets,
      resueltos: ticketsResueltos,
      timestamp: ahora.getTime()
    });

    // Mantener solo los últimos 10 puntos
    if (this.datosGraficoTiempoReal.length > 10) {
      this.datosGraficoTiempoReal.shift();
    }

    console.log('Gráfico de tiempo real actualizado:', this.datosGraficoTiempoReal);
  }

  /**
   * Actualiza el gráfico circular en tiempo real
   */
  private actualizarGraficoCircular(): void {
    // Simular cambios en la distribución de prioridades
    this.datosGraficoCircular = [
      {
        nombre: 'Alta Prioridad',
        valor: this.distribucionPrioridad.alta + Math.floor(Math.random() * 6 - 3), // ±3
        color: '#eb445a',
        porcentaje: 0
      },
      {
        nombre: 'Media Prioridad', 
        valor: this.distribucionPrioridad.media + Math.floor(Math.random() * 10 - 5), // ±5
        color: '#ffce00',
        porcentaje: 0
      },
      {
        nombre: 'Baja Prioridad',
        valor: this.distribucionPrioridad.baja + Math.floor(Math.random() * 8 - 4), // ±4
        color: '#2dd36f',
        porcentaje: 0
      }
    ];

    // Calcular porcentajes
    const totalActual = this.datosGraficoCircular.reduce((sum, item) => sum + item.valor, 0);
    this.datosGraficoCircular.forEach(item => {
      item.porcentaje = ((item.valor / totalActual) * 100);
    });

    console.log('Gráfico circular actualizado:', this.datosGraficoCircular);
  }

  /**
   * Genera datos aleatorios basados en el departamento
   */
  private generarDatosAleatorios(factor: number = 1): number {
    const departamentoId = this.usuario?.id_departamento || 1;
    let base = 5; // Valor base
    
    switch (departamentoId) {
      case 1: base = 8; break;  // TI - más tickets
      case 2: base = 3; break;  // RRHH - menos tickets
      case 3: base = 5; break;  // Admin - medio
      case 4: base = 6; break;  // Operaciones - medio-alto
    }

    return Math.floor((Math.random() * base + 1) * factor);
  }

  /**
   * Carga métricas específicas según el departamento del usuario
   */
  private cargarMetricasPorDepartamento(): void {
    const departamentoId = this.usuario?.id_departamento || 1;
    
    switch (departamentoId) {
      case 1: // Tecnologías de la Información
        this.cargarMetricasTI();
        break;
      case 2: // Recursos Humanos
        this.cargarMetricasRRHH();
        break;
      case 3: // Administración
        this.cargarMetricasAdmin();
        break;
      case 4: // Operaciones
        this.cargarMetricasOperaciones();
        break;
      default:
        this.cargarMetricasTI(); // Por defecto
    }
  }

  /**
   * Métricas específicas del departamento de TI
   */
  private cargarMetricasTI(): void {
    this.metricasRendimiento = {
      tickets_totales: 127,
      tickets_resueltos: 98,
      tickets_pendientes: 29,
      tiempo_promedio_resolucion: 4.2,
      porcentaje_cumplimiento_sla: 92
    };

    this.distribucionPrioridad = {
      alta: 15,
      media: 67,
      baja: 45
    };

    this.tendenciaMensual = [
      { mes: 'Enero', creados: 45, resueltos: 42, satisfaccion_promedio: 4.2 },
      { mes: 'Febrero', creados: 52, resueltos: 48, satisfaccion_promedio: 4.1 },
      { mes: 'Marzo', creados: 38, resueltos: 41, satisfaccion_promedio: 4.3 },
      { mes: 'Abril', creados: 47, resueltos: 44, satisfaccion_promedio: 4.0 },
      { mes: 'Mayo', creados: 55, resueltos: 52, satisfaccion_promedio: 4.2 },
      { mes: 'Junio', creados: 42, resueltos: 39, satisfaccion_promedio: 4.4 }
    ];

    this.satisfaccionCliente = {
      promedio_general: 4.2,
      total_encuestas: 98,
      satisfecho: 82,
      neutral: 12,
      insatisfecho: 4
    };
  }

  /**
   * Métricas específicas del departamento de RRHH
   */
  private cargarMetricasRRHH(): void {
    this.metricasRendimiento = {
      tickets_totales: 45,
      tickets_resueltos: 38,
      tickets_pendientes: 7,
      tiempo_promedio_resolucion: 2.8,
      porcentaje_cumplimiento_sla: 95
    };

    this.distribucionPrioridad = {
      alta: 5,
      media: 28,
      baja: 12
    };

    this.tendenciaMensual = [
      { mes: 'Enero', creados: 12, resueltos: 11, satisfaccion_promedio: 4.5 },
      { mes: 'Febrero', creados: 15, resueltos: 14, satisfaccion_promedio: 4.3 },
      { mes: 'Marzo', creados: 8, resueltos: 9, satisfaccion_promedio: 4.6 },
      { mes: 'Abril', creados: 11, resueltos: 10, satisfaccion_promedio: 4.4 },
      { mes: 'Mayo', creados: 13, resueltos: 12, satisfaccion_promedio: 4.5 },
      { mes: 'Junio', creados: 9, resueltos: 8, satisfaccion_promedio: 4.7 }
    ];

    this.satisfaccionCliente = {
      promedio_general: 4.5,
      total_encuestas: 38,
      satisfecho: 34,
      neutral: 3,
      insatisfecho: 1
    };
  }

  /**
   * Métricas específicas del departamento de Administración
   */
  private cargarMetricasAdmin(): void {
    this.metricasRendimiento = {
      tickets_totales: 67,
      tickets_resueltos: 54,
      tickets_pendientes: 13,
      tiempo_promedio_resolucion: 3.5,
      porcentaje_cumplimiento_sla: 88
    };

    this.distribucionPrioridad = {
      alta: 8,
      media: 35,
      baja: 24
    };

    this.tendenciaMensual = [
      { mes: 'Enero', creados: 18, resueltos: 16, satisfaccion_promedio: 4.0 },
      { mes: 'Febrero', creados: 22, resueltos: 20, satisfaccion_promedio: 3.9 },
      { mes: 'Marzo', creados: 15, resueltos: 17, satisfaccion_promedio: 4.1 },
      { mes: 'Abril', creados: 19, resueltos: 18, satisfaccion_promedio: 4.0 },
      { mes: 'Mayo', creados: 21, resueltos: 19, satisfaccion_promedio: 4.2 },
      { mes: 'Junio', creados: 16, resueltos: 15, satisfaccion_promedio: 4.1 }
    ];

    this.satisfaccionCliente = {
      promedio_general: 4.0,
      total_encuestas: 54,
      satisfecho: 42,
      neutral: 9,
      insatisfecho: 3
    };
  }

  /**
   * Métricas específicas del departamento de Operaciones
   */
  private cargarMetricasOperaciones(): void {
    this.metricasRendimiento = {
      tickets_totales: 89,
      tickets_resueltos: 71,
      tickets_pendientes: 18,
      tiempo_promedio_resolucion: 5.1,
      porcentaje_cumplimiento_sla: 85
    };

    this.distribucionPrioridad = {
      alta: 12,
      media: 48,
      baja: 29
    };

    this.tendenciaMensual = [
      { mes: 'Enero', creados: 25, resueltos: 22, satisfaccion_promedio: 3.8 },
      { mes: 'Febrero', creados: 28, resueltos: 25, satisfaccion_promedio: 3.9 },
      { mes: 'Marzo', creados: 20, resueltos: 23, satisfaccion_promedio: 4.0 },
      { mes: 'Abril', creados: 24, resueltos: 21, satisfaccion_promedio: 3.7 },
      { mes: 'Mayo', creados: 31, resueltos: 28, satisfaccion_promedio: 3.9 },
      { mes: 'Junio', creados: 22, resueltos: 20, satisfaccion_promedio: 4.1 }
    ];

    this.satisfaccionCliente = {
      promedio_general: 3.9,
      total_encuestas: 71,
      satisfecho: 52,
      neutral: 15,
      insatisfecho: 4
    };
  }

  // ===============================
  // MÉTODOS DE NAVEGACIÓN
  // ===============================

  /**
   * Navega al dashboard del responsable
   */
  irAResponsableHome(): void {
    this.router.navigate(['/responsable-home']);
  }

  /**
   * Navega a solicitudes abiertas
   */
  irASolicitudesAbiertas(): void {
    this.router.navigate(['/solicitudes-abiertas']);
  }

  /**
   * Navega a solicitudes cerradas
   */
  irASolicitudesCerradas(): void {
    this.router.navigate(['/solicitudes-cerradas']);
  }
  obtenerTotalValores(): number {
  if (!this.datosGraficoCircular || this.datosGraficoCircular.length === 0) {
    return 0;
  }
  return this.datosGraficoCircular.reduce((sum, item) => sum + item.valor, 0);
  }
  //Calcula el offset para cada segmento del círculo
 obtenerOffsetCircular(index: number): number {
  if (!this.datosGraficoCircular || this.datosGraficoCircular.length === 0) {
    return 502.4;
  }
  
  let sumaAnterior = 0;
  for (let i = 0; i < index; i++) {
    sumaAnterior += this.datosGraficoCircular[i].porcentaje;
  }
  
  return 502.4 - (sumaAnterior * 502.4 / 100);
}
  /**
   * Navega a solicitudes pendientes
   */
  irASolicitudesPendientes(): void {
    this.router.navigate(['/solicitudes-pendientes']);
  }

  // ===============================
  // MÉTODOS DE UTILIDAD Y CÁLCULO
  // ===============================

  /**
   * Obtiene el color según el porcentaje de cumplimiento SLA
   */
  obtenerColorSLA(): string {
    const porcentaje = this.metricasRendimiento.porcentaje_cumplimiento_sla;
    if (porcentaje >= 90) return 'success';
    if (porcentaje >= 75) return 'warning';
    return 'danger';
  }

  /**
   * Obtiene el color según la satisfacción promedio
   */
  obtenerColorSatisfaccion(): string {
    const satisfaccion = this.satisfaccionCliente.promedio_general;
    if (satisfaccion >= 4.0) return 'success';
    if (satisfaccion >= 3.5) return 'warning';
    return 'danger';
  }

  /**
   * Calcula el porcentaje de resolución
   */
  obtenerPorcentajeResolucion(): number {
    const total = this.metricasRendimiento.tickets_totales;
    const resueltos = this.metricasRendimiento.tickets_resueltos;
    return total > 0 ? Math.round((resueltos / total) * 100) : 0;
  }

  /**
   * Obtiene el valor máximo para escalar las barras del gráfico
   */
  obtenerMaximoGrafico(): number {
    if (this.datosGraficoTiempoReal.length === 0) return 10;
    
    const maxNuevos = Math.max(...this.datosGraficoTiempoReal.map(d => d.nuevos));
    const maxResueltos = Math.max(...this.datosGraficoTiempoReal.map(d => d.resueltos));
    
    return Math.max(maxNuevos, maxResueltos, 10);
  }

  /**
   * Verifica si hay datos para mostrar los gráficos
   */
  hayDatosGraficos(): boolean {
    return this.datosGraficoTiempoReal.length > 0 && this.datosGraficoCircular.length > 0;
  }

  /**
   * Refresca las métricas
   */
  async refrescar(event: RefresherCustomEvent): Promise<void> {
    console.log('Refrescando métricas...');
    this.fechaActual = new Date();
    
    try {
      await this.cargarMetricas();
      console.log('Métricas refrescadas exitosamente');
    } catch (error) {
      console.error('Error al refrescar métricas:', error);
    } finally {
      event.target.complete();
    }
  }
}