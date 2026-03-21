import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, signal } from '@angular/core';
import { TestService } from '../../../services/test';
import { AuthService } from '../../../services/auth';
import { firstValueFrom } from 'rxjs';
import { OfertaCarreraService } from '../../../services/oferta-carrera';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';
import { UsuarioService } from '../../../services/usuario';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-historial-test',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './historial-test.html',
  styleUrl: './historial-test.css',
})
export class HistorialTest {
  userId = computed(() => this.authService.currentUser()?.id || null);
  
  intentos = signal<any[]>([]);
  intentoSeleccionado = signal<any | null>(null);
  recomendacionInfo = signal<any>(null);
  detallesCarreras = signal<any[]>([]);
  loading = signal<boolean>(false);

  filtroModalidad = signal<string>('Todas');
  filtroPresupuesto = signal<number>(99999);
  allDetallesCompletos = signal<any[]>([]);
    /* Daschboard personalizados */
  todasLasOfertas = computed(() => {
    const uniqueMap = new Map<string, any>();

    this.allDetallesCompletos().forEach(detalle => { 
      detalle.ofertasFiltradas.forEach((ofe: any) => {
        // Creamos una llave única: Carrera + Institución + Pensión
        const uniqueKey = `${detalle.carrera.nombre}-${ofe.institucion.nombre}-${ofe.costoPension}`;
        
        // Si la combinación ya existe, comparamos afinidad y nos quedamos con la mayor
        if (!uniqueMap.has(uniqueKey) || detalle.afinidad > uniqueMap.get(uniqueKey).afinidad) {
          uniqueMap.set(uniqueKey, { 
            ...ofe, 
            afinidad: detalle.afinidad, 
            nombreCarrera: detalle.carrera.nombre,
            area: detalle.carrera.area || 'Carrera Profesional'
          });
        }
      });
    });

    return Array.from(uniqueMap.values());
  });
  ofertasDashboard = computed(() => {
    return this.todasLasOfertas().filter(o => 
      (this.filtroModalidad() === 'Todas' || o.modalidad.toLowerCase().includes(this.filtroModalidad().toLowerCase())) &&
      (o.costoPension <= this.filtroPresupuesto())
    ).sort((a, b) => b.afinidad - a.afinidad);
  });

  top3Ofertas = computed(() => {
    const uniqueMap = new Map();
    this.ofertasDashboard().forEach(o => {
      if (!uniqueMap.has(o.nombreCarrera)) {
        uniqueMap.set(o.nombreCarrera, o);
      }
    });
    return Array.from(uniqueMap.values()).slice(0, 3);
  });

  // KPIs
  kpiTotal = computed(() => new Set(this.ofertasDashboard().map(o => o.nombreCarrera)).size);
  kpiPromedioPension = computed(() => {
    const arr = this.ofertasDashboard();
    return arr.length ? (arr.reduce((acc, curr) => acc + curr.costoPension, 0) / arr.length) : 0;
  });
  kpiPromedioDuracion = computed(() => {
    const arr = this.ofertasDashboard();
    return arr.length ? (arr.reduce((acc, curr) => acc + curr.duracion, 0) / arr.length) : 0;
  });
  kpiTopModalidad = computed(() => {
    const arr = this.ofertasDashboard();
    if (!arr.length) return 'N/A';
    const counts: any = {};
    arr.forEach(o => {
      o.modalidad.split(/[,]| O /i).forEach((m: string) => {
        const l = m.trim().toUpperCase();
        counts[l] = (counts[l] || 0) + 1;
      });
    });
    const max = Math.max(...Object.values(counts) as number[]);
    return Object.keys(counts).filter(k => counts[k] === max).join(' / ');
  });

  opcionesModalidad = computed(() => {
    const mods = new Set<string>();
    this.todasLasOfertas()
    .filter(o => o.costoPension <= this.filtroPresupuesto())
    .forEach(o => {
      o.modalidad.split(/[,]| O /i).forEach((m: string) => {
        const limpio = m.trim().toUpperCase();
        if (limpio) mods.add(limpio);
      });
    });
    return Array.from(mods).sort();
  });

  opcionesPresupuesto = computed(() => {
    const pensiones = this.todasLasOfertas()
      .filter(o => 
          this.filtroModalidad() === 'Todas' || 
          o.modalidad.toLowerCase().includes(this.filtroModalidad().toLowerCase()))
      .map(o => o.costoPension);
    return [...new Set(pensiones)].sort((a, b) => a - b);
  });

  bubbleChart: any;
  doughnutChart: any;

  constructor(
    private testService: TestService,
    private authService: AuthService,
    private ofertaService: OfertaCarreraService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const data = this.ofertasDashboard();
      if (data.length > 0) {
        setTimeout(() => {
          this.renderCharts(),
          this.cdr.detectChanges();
        }, 100);
      }
    });
  }

  nombreCompleto = signal<string>('Cargando...');

  async ngOnInit() {
    const email = this.authService.email();
    if (email) {
      try {
        const user = await firstValueFrom(this.usuarioService.buscarUsuario(email));
        this.nombreCompleto.set(`${user.nombre} ${user.apellido}`);
      } catch (e) {
        this.nombreCompleto.set('Postulante');
      }
    }
    this.cargarIntentos();
  }

  async cargarIntentos() {
    const id = this.userId();
    if (id) {
      try {
        const res = await firstValueFrom(this.testService.listarIntentos(id));
        this.intentos.set(res);
        const promesas = res.map(async (intento) => {
          const rec: any = await firstValueFrom(this.testService.obtenerRecomenadcion(intento.idIntento));
          const dets: any = await firstValueFrom(this.testService.obtenerDetalleRecomendacion(rec.idRecomendacion));
          for (let d of dets) {
            d.ofertasFiltradas = await firstValueFrom(this.ofertaService.listarPorCarrera(d.carrera.idCarrera));
          }
          return dets;
        });
        const todosLosDetalles = await Promise.all(promesas);
        this.allDetallesCompletos.set(todosLosDetalles.flat());
      } catch (error: any) {
        console.error("Error body:", error.error?.text || error.message);
      }
    }
  }

  async verDetalle(intento: any) {
    this.loading.set(true);
    try {
      const rec: any = await firstValueFrom(this.testService.obtenerRecomenadcion(intento.idIntento));
      this.recomendacionInfo.set(rec);

      const detalles: any = await firstValueFrom(this.testService.obtenerDetalleRecomendacion(rec.idRecomendacion));
      
      for (let item of detalles) {
        let ofertas = await firstValueFrom(this.ofertaService.listarPorCarrera(item.carrera.idCarrera));
        
        item.ofertasFiltradas = ofertas
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
      }
      
      this.detallesCarreras.set(detalles);
      this.intentoSeleccionado.set(intento);
    } catch (e) {
      console.error("Error fetching details (error al traer detalles)", e);
    } finally {
      this.loading.set(false);
    }
  }

  volver() {
    this.intentoSeleccionado.set(null);
    this.recomendacionInfo.set(null);
    this.detallesCarreras.set([]);
    this.cdr.detectChanges(); 
    setTimeout(() => {
      this.renderCharts();
    }, 100);
  }

  async descargarPDF() {
    const DATA = document.getElementById('reporte-profesional');
    if (!DATA) return;

    this.loading.set(true);

    try {
      const canvas = await html2canvas(DATA, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configuraciones de página (page settings)
      const margin = 10; 
      const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const pdfHeight = pdf.internal.pageSize.getHeight() - (margin * 2);
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      
      const finalImgWidth = pdfWidth;
      const finalImgHeight = imgHeight * ratio;

      let heightLeft = finalImgHeight;
      let position = margin; // Posición inicial con margen superior

      // Primera página
      pdf.addImage(imgData, 'PNG', margin, position, finalImgWidth, finalImgHeight);
      heightLeft -= pdfHeight;

      // Añadir páginas extra si es necesario (loop for extra pages)
      while (heightLeft > 0) {
        position = heightLeft - finalImgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, finalImgWidth, finalImgHeight);
        heightLeft -= pdfHeight;
      }

      const nombreLimpio = this.nombreCompleto().replace(/\s+/g, '_');
      pdf.save(`Reporte_Vocacional_${nombreLimpio}.pdf`);
      
    } catch (error) {
      console.error(error);
      Swal.fire('Error', "No se pudo generar el PDF");
    } finally {
      this.loading.set(false);
    }
  }

  contactarSocio(): void {
    const phone = '519896667747';
    const message = 'Hola, he realizado el test vocacional de SOV Lima y tengo dudas con los resultados que han salido, ¿me puedes ayudar?';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  }

  /*  Metodos para el dashboard */
  onFiltroModalidadChange(event: any) {
    this.filtroModalidad.set(event.target.value);
  }

  onFiltroPresupuestoChange(event: any) {
    this.filtroPresupuesto.set(Number(event.target.value));
  }

  renderCharts() {
    const data = this.ofertasDashboard();
    
    // Destroy previous instances
    if (this.bubbleChart) this.bubbleChart.destroy();
    if (this.doughnutChart) this.doughnutChart.destroy();

    const bubbleCtx = document.getElementById('decisionBubbleChart') as HTMLCanvasElement;
    const doughnutCtx = document.getElementById('modalityChart') as HTMLCanvasElement;

    if (!bubbleCtx || !doughnutCtx) return;

    // Chart.js Setup
    this.bubbleChart = new Chart(bubbleCtx, {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'Opciones de Estudio',
          data: data.map(o => ({
            x: o.duracion,
            y: o.costoPension,
            r: Math.max(5, o.afinidad / 5)
          })),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgba(99, 102, 241, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const item = data[context.dataIndex];
                return `${item.nombreCarrera} (${item.institucion.nombre}): S/.${item.costoPension}, ${item.duracion} años`;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Años de Carrera' } },
          y: { title: { display: true, text: 'Costo Pensión (S/.)' } }
        }
      }
    });

    const modalitiesCount: any = {};
    data.forEach(o => {
      o.modalidad.split(/[,]| O /i).forEach((m: string) => {
        const key = m.trim().toUpperCase();
        if(key) modalitiesCount[key] = (modalitiesCount[key] || 0) + 1;
      });
    });

    this.doughnutChart = new Chart(doughnutCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(modalitiesCount),
        datasets: [{
          data: Object.values(modalitiesCount),
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%', // Espacio para el texto central
        plugins: {
          legend: {
            position: 'bottom', // Leyendas abajo para evitar que choquen
            labels: { boxWidth: 12, font: { size: 10 } }
          }
        }
      }
    });
  }

}
