import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pregunta } from '../../../models/Pregunta';
import { PreguntaService } from '../../../services/pregunta';
import Swal from 'sweetalert2';
import { GestionPreguntaForm } from './gestion-pregunta-form/gestion-pregunta-form';
import { Criterio } from '../../../models/Criterio';
import { CriterioService } from '../../../services/criterio';

@Component({
  selector: 'app-gestion-pregunta',
  imports: [CommonModule, FormsModule, GestionPreguntaForm],
  templateUrl: './gestion-pregunta.html',
  styleUrl: './gestion-pregunta.css',
})
export class GestionPregunta {
  listado: any[] = [];
  listadoFiltrado: any[] = [];
  textoBusqueda: string = '';
  faseSeleccionada: number = 0;
  
  mostrarForm = false;
  modoForm: 'create' | 'edit' = 'create';
  preguntaSeleccionada: any = null;

  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalPaginas: number = 1;

  // Variables para Criterios
  mostrarCriterios = false;
  criterios: Criterio[] = [];
  criterioInput: string = '';
  modoCriterio: 'registrar' | 'editar' | 'eliminar' = 'registrar';
  criterioSeleccionado: Criterio | null = null;
  editandoActivo: boolean = false;

  constructor(
    private pSer: PreguntaService,
    private cSer: CriterioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.listarCriterios();
  }

  cargarDatos() {
    Swal.fire({
      title: 'Cargando preguntas...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const peticion = this.faseSeleccionada === 0 
      ? this.pSer.listar() 
      : this.pSer.buscarFase(this.faseSeleccionada);

    peticion.subscribe({
      next: (data: any) => {
        this.listado = data;
        this.buscar();
        Swal.close();
        this.cdr.markForCheck(); 
        this.cdr.detectChanges();
      },
      error: (err) => {
        Swal.close();
        // Si la lista viene vacía o hay error real se limpia el listado
        this.listado = [];
        this.listadoFiltrado = [];
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  buscar() {
    const texto = this.textoBusqueda.toLowerCase().trim();
    this.listadoFiltrado = this.listado.filter(p => 
      p.enunciado.toLowerCase().includes(texto) ||
      p.tipo.toLowerCase().includes(texto)
    );
    this.actualizarTotalPaginas();
    this.cdr.detectChanges();
  }

  filtrarFase(fase: number) {
    this.faseSeleccionada = fase;
    this.paginaActual = 1;
    this.cargarDatos();
  }

  nuevaPregunta() {
    this.modoForm = 'create';
    this.preguntaSeleccionada = null;
    this.mostrarForm = true;
  }

  editar(item: any) {
    this.modoForm = 'edit';
    this.preguntaSeleccionada = item;
    this.mostrarForm = true;
  }

  cambiarEstado(item: any) {
    this.pSer.cambiarEstado(item.idPregunta).subscribe({
      next: () => {
        this.cargarDatos();
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
        Toast.fire({ icon: 'success', title: 'Estado actualizado' });
      }
    });
  }

  eliminar(item: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la pregunta: ${item.enunciado}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pSer.eliminar(item.idPregunta).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La pregunta ha sido borrada.', 'success');
            this.cargarDatos();
          }
        });
      }
    });
  }

  get datosPaginados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.listadoFiltrado.slice(inicio, inicio + this.itemsPorPagina);
  }

  actualizarTotalPaginas() {
    this.totalPaginas = Math.ceil(this.listadoFiltrado.length / this.itemsPorPagina) || 1;
    if (this.paginaActual > this.totalPaginas) this.paginaActual = 1;
  }


  //Criterios
  listarCriterios() {
    this.cSer.listar().subscribe({
      next: (data) => {
        this.criterios = data;
        this.cdr.detectChanges();
      }
    });
  }

  abrirPanelCriterios() {
    this.mostrarCriterios = true;
    this.setModo('registrar');
  }

  setModo(modo: 'registrar' | 'editar' | 'eliminar') {
    this.modoCriterio = modo;
    this.criterioInput = '';
    this.criterioSeleccionado = null;

    if (modo === 'registrar') {
      this.editandoActivo = false;
      Swal.fire('Modo Registrar', 'Escribe el nombre del criterio y presiona guardar para añadirlo.', 'info');
    } else if (modo === 'editar') {
      this.editandoActivo = true;
      Swal.fire('Modo Editar', 'Selecciona el criterio que deseas modificar de la lista.', 'warning');
    } else if (modo === 'eliminar') {
      Swal.fire('Modo Eliminar', 'CUIDADO: Los criterios se marcarán en rojo. Selecciona uno para eliminarlo.', 'error');
    }
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  accionPrincipalCriterio() {
    if (!this.criterioInput.trim()) return;

    if (this.modoCriterio === 'registrar') {
      const nuevo: Criterio = { nombre: this.criterioInput.toUpperCase() };
      this.cSer.guardar(nuevo).subscribe({
        next: () => {
          this.listarCriterios();
          this.criterioInput = '';
          this.cdr.detectChanges();
          const Toast = Swal.mixin({ toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
          Toast.fire({ icon: 'success', title: 'Criterio añadido' });
        }
      });
    } else if (this.modoCriterio === 'editar' && this.criterioSeleccionado) {
      this.criterioSeleccionado.nombre = this.criterioInput.toUpperCase();
      this.cSer.actualizar(this.criterioSeleccionado.idCriterio!, this.criterioSeleccionado).subscribe({
        next: () => {
          this.listarCriterios();
          this.criterioInput = '';
          this.criterioSeleccionado = null; // Bloquea el input nuevamente
          this.cdr.detectChanges();
          this.setModo('editar'); // Reset para obligar a seleccionar otro
          Swal.fire('Actualizado', 'El criterio ha sido modificado', 'success');
        }
      });
    }
  }

  seleccionarCriterio(c: Criterio) {
    if (this.modoCriterio === 'editar') {
      this.criterioSeleccionado = c;
      this.criterioInput = c.nombre;
    } else if (this.modoCriterio === 'eliminar') {
      Swal.fire({
        title: '¿Eliminar criterio?',
        text: 'Se borrará: ' + c.nombre,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, borrar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.cSer.eliminar(c.idCriterio!).subscribe({
            next: () => {
              this.listarCriterios();
              Swal.fire('Eliminado', 'Criterio borrado correctamente', 'success');
            }
          });
        }
      });
    }
  }
  
}
