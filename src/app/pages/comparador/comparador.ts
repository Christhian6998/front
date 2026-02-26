import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CarreraService } from '../../services/carrera';
import { OfertaCarreraService } from '../../services/oferta-carrera';

@Component({
  selector: 'app-comparador',
  imports: [CommonModule, FormsModule],
  templateUrl: './comparador.html',
  styleUrl: './comparador.css',
})
export class Comparador {
  carreras: any[] = [];
  carrerasAfines: any[] = []; // Carreras de la misma área (same area)
  
  carreraBaseSeleccionada: any = null;
  carreraAfinSeleccionada: any = null;

  ofertasIzquierda: any[] = [];
  ofertasDerecha: any[] = [];
  
  ofertaIzquierda: any = null;
  ofertaDerecha: any = null;

  constructor(
    private carreraService: CarreraService,
    private ofertaService: OfertaCarreraService,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carreraService.listarCarrerasActivas().subscribe(data => {
      this.carreras = data;
      this.cdr.detectChanges();
    });
  }

  onCarreraBaseChange() {
    this.ofertaIzquierda = null;
    this.carreraAfinSeleccionada = null;
    this.ofertaDerecha = null;
    this.ofertasIzquierda = [];
    this.ofertasDerecha = [];
    this.carrerasAfines = [];

    if (this.carreraBaseSeleccionada) {
      // 1. Cargar instituciones para la carrera base (Lado Izquierdo)
      this.ofertaService.listarPorCarrera(this.carreraBaseSeleccionada.idCarrera).subscribe(data => {
        this.ofertasIzquierda = data;
        if (this.ofertasIzquierda.length === 1) {
          this.ofertaIzquierda = this.ofertasIzquierda[0];
        }
        this.cdr.detectChanges();
      });

      // 2. Filtrar en memoria las carreras de la misma área (Lado Derecho)
      this.carrerasAfines = this.carreras.filter(c => 
        c.area === this.carreraBaseSeleccionada.area
      );
    }
  }

  onCarreraAfinChange() {
    this.ofertaDerecha = null;
    this.ofertasDerecha = [];

    if (this.carreraAfinSeleccionada) {
      // Cargar instituciones para la carrera afín seleccionada
      this.ofertaService.listarPorCarrera(this.carreraAfinSeleccionada.idCarrera).subscribe(data => {
        this.ofertasDerecha = data;
        this.cdr.detectChanges();
      });
    }
  }

  // Evita comparar exactamente la misma carrera en la misma institución
  getOfertasDerechaFiltradas() {
    if (!this.ofertaIzquierda) return this.ofertasDerecha;
    
    return this.ofertasDerecha.filter(o => 
      !(o.institucion.idInstitucion === this.ofertaIzquierda.institucion.idInstitucion && 
        o.carrera.idCarrera === this.ofertaIzquierda.carrera.idCarrera)
    );
  }

  refrescarPantalla() {
    this.cdr.detectChanges();
  }
}
