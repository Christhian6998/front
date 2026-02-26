import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { TestService } from '../../../services/test';
import { AuthService } from '../../../services/auth';
import { firstValueFrom } from 'rxjs';
import { OfertaCarreraService } from '../../../services/oferta-carrera';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

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

  constructor(
    private testService: TestService,
    private authService: AuthService,
    private ofertaService: OfertaCarreraService
    ) {}

  ngOnInit() {
    this.cargarIntentos();
  }

  async cargarIntentos() {
    const id = this.userId();
    console.log("UserID actual:", id);
    if (id) {
      try {
        const res = await firstValueFrom(this.testService.listarIntentos(id));
        this.intentos.set(res);
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

    pdf.save(`Reporte_Vocacional_${this.userId()}.pdf`);
    
  } catch (error) {
    console.error(error);
    Swal.fire('Error', "No se pudo generar el PDF");
  } finally {
    this.loading.set(false);
  }
}
}
