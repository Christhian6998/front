import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { InstitucionService } from '../../../services/institucion';
import { OfertaCarreraService } from '../../../services/oferta-carrera';
import { SedeService } from '../../../services/sede';
import { GestionOfertaForm } from './gestion-oferta-form/gestion-oferta-form';
import { forkJoin, } from 'rxjs';


@Component({
  selector: 'app-gestion-oferta',
  imports: [CommonModule, FormsModule, GestionOfertaForm],
  templateUrl: './gestion-oferta.html',
  styleUrl: './gestion-oferta.css',
})
export class GestionOferta {
  listado:any[] = [];
  listadoFiltrado:any[] = [];
  textoBusqueda:string = '';
  mostrarForm = false;
  modoForm: 'create' | 'edit' | 'estado' | 'delete' = 'create';
  ofertaSeleccionada:any = null;

  paginaActual: number = 1;
  itemsPorPagina: number = 15; 
  totalPaginas: number = 1;

  constructor(
    private institucionService:InstitucionService,
    private sedeService:SedeService,
    private ofertaService:OfertaCarreraService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    Swal.fire({
      title: 'Cargando datos...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    forkJoin({
      instituciones: this.institucionService.listarInstituciones(),
      sedes: this.sedeService.listarSedes(),
      ofertas: this.ofertaService.listarOfertas()
    }).subscribe({
      next: (res) => {
        // Usamos .map para transformar la data
        const dataProcesada = res.instituciones.map(inst => {
          
          // Buscamos sedes y ofertas que coincidan con el ID
          const misSedes = res.sedes.filter((s: any) => 
            s.institucion?.idInstitucion == inst.idInstitucion
          );
          
          const misOfertas = res.ofertas.filter((o: any) => 
            o.institucion?.idInstitucion == inst.idInstitucion
          );

          // Extraer datos de carrera
          const areas = [...new Set(misOfertas.map(o => o.carrera?.area))];
          const modalidadesRaw = misOfertas
            .map(o => o.modalidad) // Traemos los strings: ["PRESENCIAL, VIRTUAL", "PRESENCIAL"]
            .filter(m => !!m)     // Quitamos nulos
            .join(', ')           // Unimos todo: "PRESENCIAL, VIRTUAL, PRESENCIAL"
            .split(',')           // Separamos por coma: ["PRESENCIAL", " VIRTUAL", " PRESENCIAL"]
            .map(m => m.trim());  // Quitamos espacios: ["PRESENCIAL", "VIRTUAL", "PRESENCIAL"]

          const modalidadesUnicas = [...new Set(modalidadesRaw)]; // Quitamos duplicados reales

          // Calcular promedios
          const totalMatricula = misOfertas.reduce((acc, curr) => acc + (curr.costoMatricula || 0), 0);
          const totalPension = misOfertas.reduce((acc, curr) => acc + (curr.costoPension || 0), 0);
          const n = misOfertas.length || 1;

          return {
            idInstitucion: inst.idInstitucion,
            nombreInstitucion: inst.nombre,
            estadoI: inst.estado,
            tipo: inst.tipo,
            areas: misOfertas.length > 0 ? areas.join(', ') : 'Sin oferta',
            modalidades: misOfertas.length > 0 ? modalidadesUnicas.join(', ') : 'N/A',
            cantidadSedes: misSedes.length,
            promedioMatricula: (totalMatricula / n).toFixed(2),
            promedioPension: (totalPension / n).toFixed(2),
            estado: inst.estado,
            // Guardar para el modal de edición
            rawSedes: misSedes,
            rawOfertas: misOfertas
          };
        });

        this.listado = dataProcesada;
        this.listadoFiltrado = [...this.listado];

        this.cdr.detectChanges();
        
        Swal.close();
      },
      error: (err) => {
        console.error("Error cargando datos:", err);
        Swal.close();
        Swal.fire('Error', 'No se pudo obtener la información', 'error');
      }
    });
  }

  buscar(){
    const texto = this.textoBusqueda.toLowerCase();

    this.listadoFiltrado = this.listado.filter(item =>

      item.nombreInstitucion.toLowerCase().includes(texto) ||
      item.areas.toLowerCase().includes(texto) ||
      item.modalidades.toLowerCase().includes(texto) ||
      item.promedioMatricula.toString().includes(texto) ||
      item.promedioPension.toString().includes(texto) ||
      item.cantidadSedes.toString().includes(texto)

    );
    this.paginaActual = 1; // Reset a la primera página
    this.actualizarTotalPaginas();
    this.cdr.detectChanges();
  }

  nuevaOferta(){
    this.modoForm = 'create';
    this.ofertaSeleccionada = null;
    this.mostrarForm = true;
  }

  editar(item:any){
    this.modoForm = 'edit';
    this.ofertaSeleccionada = item;
    this.mostrarForm = true;
  }

  cambiarEstado(item:any){
    this.modoForm = 'estado';
    this.ofertaSeleccionada = item;
    this.mostrarForm = true;
  }

  eliminar(item:any){
    this.modoForm = 'delete';
    this.ofertaSeleccionada = item;
    this.mostrarForm = true;
  }

  get datosPaginados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.listadoFiltrado.slice(inicio, fin);
  }

  actualizarTotalPaginas() {
    this.totalPaginas = Math.ceil(this.listadoFiltrado.length / this.itemsPorPagina);
    if (this.paginaActual > this.totalPaginas) this.paginaActual = 1;
  }
}
