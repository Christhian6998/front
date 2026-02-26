import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreguntaService } from '../../../../services/pregunta';
import Swal from 'sweetalert2';
import { CriterioService } from '../../../../services/criterio';
import { Criterio } from '../../../../models/Criterio';

@Component({
  selector: 'app-gestion-pregunta-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-pregunta-form.html',
  styleUrl: './gestion-pregunta-form.css',
})
export class GestionPreguntaForm {
  @Input() modo: 'create' | 'edit' = 'create';
  @Input() data: any = null;
  @Output() cerrar = new EventEmitter<void>();

  preguntas: any[] = [];

  criterios: Criterio[] = [];
  
  areasPregunta = [
    { value: 'RAZONAMIENTO_ANALITICO', label: 'Lógico-Analítica' },
    { value: 'MATEMATICA_CIENTIFICA', label: 'Matemática-Científica' },
    { value: 'TECNOLOGICO_PROGRAMACION', label: 'Tecnológica' },
    { value: 'CREATIVO_ARTISTICO', label: 'Creativa-Visual' },
    { value: 'PRACTICO_MANUAL_FISICO', label: 'Práctica-Manual' },
    { value: 'ORGANIZATIVO_ADMINISTRATIVO', label: 'Organizacional-Gestión' },
    { value: 'COMERCIAL_FINANCIERO', label: 'Negocios-Finanzas' },
    { value: 'COMUNICACION_SOCIAL_LEGAL', label: 'Comunicación-Social' },
    { value: 'SERVICIO_LIDERAZGO_DOCENTE', label: 'Servicio-Liderazgo' },
    { value: 'AMBIENTAL_INVESTIGADOR', label: 'Técnico-Ambiental' }
  ];

  constructor(
    private pSer: PreguntaService,
    private cSer: CriterioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.listarCriterios();
  }

  listarCriterios() {
    this.cSer.listar().subscribe({
      next: (data) => {
        this.criterios = data;
        
        if (this.modo === 'edit' && this.data) {
          const criterioEncontrado = this.criterios.find(c => c.idCriterio === this.data.criterio?.idCriterio);
          this.preguntas = [{ ...this.data, criterio: criterioEncontrado || this.data.criterio }];
        } else if (this.preguntas.length === 0) {
          this.agregarCampo();
        }

        // Obligamos a la UI a enterarse de que ya hay datos
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }
  
  compareCriterios(c1: any, c2: any): boolean {
    return c1 && c2 ? c1.idCriterio === c2.idCriterio : c1 === c2;
  }

  agregarCampo() {
    if (this.preguntas.length > 0) {
      const ultima = this.preguntas[this.preguntas.length - 1];
      if (this.isPreguntaInvalida(ultima)) {
        Swal.fire('Atención', 'Por favor llena todos los campos de la pregunta actual antes de añadir otra.', 'warning');
        return;
      }
    }
    this.preguntas.push({ enunciado: '', area: '', peso: null, fase: null, criterio:null});
  }

  quitarCampo(index: number) {
    this.preguntas.splice(index, 1);
    if (this.preguntas.length === 0) this.agregarCampo();
  }
  get formularioInvalido(): boolean {
    return this.preguntas.some(p => this.isPreguntaInvalida(p));
  }

  isPreguntaInvalida(p: any): boolean {
    const basicoInvalido = !p.enunciado?.trim() || !p.area || p.peso === null || p.peso <= 0 || !p.fase;
    if (basicoInvalido) return true;
    
    // Si la fase es mayor a 1, el criterio es obligatorio
    if (p.fase > 1 && !p.criterio) return true;

    return false;
  }

  async guardarMasivo() {
    let guardadosExitosos = 0;
    const totalAEnviar = this.preguntas.length;

    Swal.fire({
      title: 'Procesando...',
      text: 'Guardando preguntas',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    for (let i = 0; i < this.preguntas.length; i++) {
      const p = this.preguntas[i];
      try {
        await this.pSer.registrar(p).toPromise();
        
        this.preguntas.splice(i, 1);
        i--;
        guardadosExitosos++;
      } catch (error) {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error en el proceso',
          text: 'Se guardaron '+guardadosExitosos+' preguntas. El error ocurrió en: '+p.enunciado+'. Corrige los datos restantes e intenta de nuevo.',
        });
        return; 
      }
    }

    Swal.close();
    Swal.fire('¡Éxito!', 'Se registró '+guardadosExitosos+' pregunta(s) correctamente.', 'success');
    this.cerrar.emit();
  }

  guardarEdicion() {
    const p = this.preguntas[0];

    if (this.isPreguntaInvalida(p)) {
      Swal.fire('Error', 'Faltan campos obligatorios', 'error');
      return;
    }

    const payload = {
      ...p,
      criterio: p.criterio ? { idCriterio: p.criterio.idCriterio } : null
    };

    this.pSer.actualizar(p.idPregunta, payload).subscribe({
      next: () => {
        Swal.fire('Actualizado', 'La relación y datos se guardaron correctly (correctamente)', 'success');
        this.cerrar.emit();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Error al sincronizar con el servidor', 'error');
      }
    });
  }

  onFaseChange(p: any) {
    if (p.fase === 1) {
      p.criterio = null;
    }
  }
}
