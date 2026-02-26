import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { InstitucionService } from '../../../../services/institucion';
import { CarreraService } from '../../../../services/carrera';
import { SedeService } from '../../../../services/sede';
import { OfertaCarreraService } from '../../../../services/oferta-carrera';
import { concatMap, forkJoin, of, switchMap} from 'rxjs';
import { CriterioService } from '../../../../services/criterio';

@Component({
  selector: 'app-gestion-oferta-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-oferta-form.html',
  styleUrl: './gestion-oferta-form.css',
})
export class GestionOfertaForm {
  @Input() modo!: 'create' | 'edit' | 'estado' | 'delete';
  @Input() data:any = null;

  @Output() cerrar = new EventEmitter<boolean>();

  institucion:any = {
    nombre:'',
    tipo:'UNIVERSIDAD',
    estado: true
  };

  sedes:any[] = [];
  carreras:any[] = [];

  institucionesExistentes:any[] = [];
  institucionesFiltradas:any[] = [];
  mostrarSugerenciasInst = false;

  carrerasExistentes: any[] = [];
  carrerasFiltradas: any[] = [];
  indiceCarreraBuscando: number | null = null;

  areasFiltradas: string[] = [];
  indiceAreaBuscando: number | null = null;

  opcionesModalidad = ['PRESENCIAL', 'VIRTUAL', 'SEMIPRESENCIAL'];

  criteriosExistentes: any[] = [];
  
  constructor(
    private institucionService: InstitucionService,
    private carreraService: CarreraService,
    private sedeService: SedeService,
    private ofertaService: OfertaCarreraService,
    private cSer: CriterioService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.institucionService.listarInstituciones()
      .subscribe(data=>{
        this.institucionesExistentes = data;
      });
    
    this.carreraService.listarCarreras().subscribe(data => {
      this.carrerasExistentes = data;
    });

    if(this.modo === 'create'){
      this.agregarSede();
      this.agregarCarrera();
    }

    if(this.data){
      this.cargarDatos(this.data);
    }
    
    this.cSer.listar().subscribe(data => this.criteriosExistentes = data);
  }

  // --- BUSCADORES ---
  buscarInstitucion(){
    const texto = this.institucion.nombre.toLowerCase();
    this.institucionesFiltradas =
      this.institucionesExistentes.filter(i =>
        i.nombre.toLowerCase().includes(texto)
      );

    this.mostrarSugerenciasInst = true;
  }
  seleccionarInstitucion(inst:any){
    this.institucion.nombre = inst.nombre;
    this.institucion.idInstitucion = inst.idInstitucion;
    this.mostrarSugerenciasInst = false;
  }

  buscarCarrera(index: number) {
    const texto = this.carreras[index].nombre.toLowerCase();
    this.indiceCarreraBuscando = index;
    
    if (texto.length > 0) {
      this.carrerasFiltradas = this.carrerasExistentes.filter(c => 
        c.nombre.toLowerCase().includes(texto)
      );
    } else {
      this.carrerasFiltradas = [];
    }
  }

  seleccionarCarrera(carrera: any, index: number) {
    this.carreras[index].nombre = carrera.nombre;
    this.carreras[index].idCarrera = carrera.idCarrera;
    this.carreras[index].area = carrera.area;
    this.carreras[index].descripcion = carrera.descripcion;

    this.indiceCarreraBuscando = null;
    this.carrerasFiltradas = [];

    this.cSer.obtenerCriterioPorCarrera(carrera.idCarrera).subscribe({
      next: (rels: any[]) => {
        if (rels && rels.length > 0) {
          this.carreras[index].criteriosElegidos = rels.map((rc: any) => ({
            idCritCarrera: rc.idCritCarrera,
            idCriterio: rc.criterio?.idCriterio,
            peso: rc.peso
          }));
        } else {
          this.carreras[index].criteriosElegidos = [{ idCriterio: null, peso: null }];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error trayendo criterios:", err);
        this.carreras[index].criteriosElegidos = [{ idCriterio: null, peso: null }];
        this.cdr.detectChanges();
      }
    });
  }
  buscarArea(index: number) {
    const texto = this.carreras[index].area.toLowerCase();
    this.indiceAreaBuscando = index;

    if (texto.length > 0) {
      // Obtenemos áreas únicas de las carreras que ya existen
      const areasUnicas = [...new Set(this.carrerasExistentes.map(c => c.area))];
      
      this.areasFiltradas = areasUnicas.filter(area => 
        area.toLowerCase().includes(texto)
      );
    } else {
      this.areasFiltradas = [];
    }
  }

  seleccionarArea(area: string, index: number) {
    this.carreras[index].area = area;
    this.indiceAreaBuscando = null;
    this.areasFiltradas = [];
    this.cdr.detectChanges();
  }

  // --- UTILITARIOS UI ---
  cargarDatos(data: any) {
    this.institucion = {
      idInstitucion: data.idInstitucion,
      nombre: data.nombreInstitucion,
      tipo: data.tipo,
      estado: data.estadoI
    };

    this.sedes = data.rawSedes.map((s: any) => ({ ...s }));

    this.carreras = data.rawOfertas.map((o: any) => {
      const carObj = {
        idOferta: o.idOferta,
        idCarrera: o.carrera?.idCarrera,
        nombre: o.carrera?.nombre,
        descripcion: o.carrera?.descripcion,
        area: o.carrera?.area,
        costoMatricula: o.costoMatricula,
        costoPension: o.costoPension,
        duracion: o.duracion,
        modalidadesElegidas: o.modalidad ? o.modalidad.split(',').map((m: any) => m.trim()) : [],
        criteriosElegidos: [] as any[],
        estado: o.estado,
        carreraEstado: o.carrera?.estado
      };

      if (carObj.idCarrera) {
        this.cSer.obtenerCriterioPorCarrera(carObj.idCarrera).subscribe(rels => {
          if (rels && rels.length > 0) {
            carObj.criteriosElegidos = rels.map(rc => ({
              idCritCarrera: rc.idCritCarrera,
              idCriterio: rc.criterio?.idCriterio,
              peso: rc.peso
            }));
          } else {
            carObj.criteriosElegidos = [{ idCriterio: null, peso: null }];
          }
          this.cdr.detectChanges(); // Forzamos refresh de la UI
        });
      }

      return carObj;
    });
  }

  esSoloLectura():boolean{
    return this.modo === 'estado' || this.modo === 'delete';
  }

  esEliminar():boolean{
    return this.modo === 'delete';
  }

  esCambioEstado():boolean{
    return this.modo === 'estado';
  }


  agregarSede(){

    if(this.esSoloLectura()) return;

    const ultima = this.sedes[this.sedes.length - 1];

    if(this.sedes.length === 0){
      this.sedes.push({
        nombre:'',
        direccion:'',
        latitud:'',
        longitud:'',
        estado:true
      });
      return;
    }

    if(!ultima.nombre || !ultima.direccion || !ultima.latitud || !ultima.longitud){
      Swal.fire('Complete la sede actual primero','','warning');
      return;
    }

    this.sedes.push({
      nombre:'',
      direccion:'',
      latitud:'',
      longitud:'',
      estado:true
    });
  }

  agregarCarrera(){

    if(this.esSoloLectura()) return;

    if(this.carreras.length === 0){
      this.carreras.push({
        nombre:'',
        descripcion:'',
        area:'',
        costoMatricula:null,
        costoPension:null,
        duracion:null,
        modalidadesElegidas: [],
        criteriosElegidos: [{ idCriterio: null, peso: null }],
        estado:true
      });
      return;
    }

    const ultima = this.carreras[this.carreras.length - 1];

    if(!ultima.nombre || !ultima.area || !ultima.duracion || !ultima.costoMatricula || !ultima.costoPension || !ultima.descripcion || ultima.criteriosElegidos.length === 0){
      Swal.fire('Complete la carrera actual primero','','warning');
      return;
    }

    this.carreras.push({
      nombre:'',
      descripcion:'',
      area:'',
      costoMatricula:null,
      costoPension:null,
      duracion:null,
      modalidadesElegidas: [],
      criteriosElegidos: [{ idCriterio: null, peso: null }] as any[],
      estado:true
    });
  }

  agregarCriterio(car: any) {
    car.criteriosElegidos.push({ idCriterio: null, peso: null });
  }

  quitarCriterio(car: any, index: number) {
    // Regla: mínimo 1 criterio por carrera
    if (car.criteriosElegidos.length <= 1) {
      Swal.fire('Acción denegada', 'Debe haber al menos 1 criterio por carrera.', 'warning');
      return;
    }

    const crit = car.criteriosElegidos[index];

    if (crit.idCritCarrera) {
      Swal.fire({
        title: '¿Eliminar criterio?',
        text: 'Se borrará permanentemente de la base de datos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, borrar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.cSer.eliminarCriterioCarrera(crit.idCritCarrera).subscribe({
            next: () => {
              // Eliminamos del array local para que desaparezca de la vista
              car.criteriosElegidos.splice(index, 1);
              this.cdr.detectChanges(); // Forzar actualización de UI
              Swal.fire('Eliminado', 'El criterio ha sido removido.', 'success');
            },
            error: (err) => {
              // Si el error es porque ya no existe (400 o 404), igual lo quitamos de la vista
              car.criteriosElegidos.splice(index, 1);
              this.cdr.detectChanges();
              console.error("Error al eliminar o ya no existe:", err);
            }
          });
        }
      });
    } else {
      // Si aún no está en la BD, solo lo quitamos del array
      car.criteriosElegidos.splice(index, 1);
    }
  }

  // La magia del filtrado (The magic of filtering)
  getCriteriosDisponibles(car: any, currentId: any) {
    // Obtenemos los IDs ya seleccionados, ignorando el actual
    const seleccionados = car.criteriosElegidos
      .map((c: any) => c.idCriterio)
      .filter((id: any) => id !== null && id !== currentId);

    // Retornamos solo los criterios que NO están en la lista de seleccionados
    return this.criteriosExistentes.filter(c => !seleccionados.includes(c.idCriterio));
  }


  formularioValido():boolean{
    if(!this.institucion.nombre) return false;

    const sedesOk = this.sedes.every(s => 
      s.nombre.trim() && s.direccion.trim() && s.latitud && s.longitud
    );

    const carrerasOk = this.carreras.every(c => 
      c.nombre.trim() && 
      c.area.trim() && 
      c.duracion && 
      c.costoMatricula !== null && 
      c.modalidadesElegidas?.length > 0 &&
      c.criteriosElegidos?.length > 0 &&
      c.criteriosElegidos.every((crit: any) => crit.idCriterio !== null && crit.peso > 0)
    );

    return sedesOk && carrerasOk;
  }

  toggleModalidad(car: any, modalidad: string) {
    if (!car.modalidadesElegidas) car.modalidadesElegidas = [];
    
    const idx = car.modalidadesElegidas.indexOf(modalidad);
    if (idx > -1) {
      car.modalidadesElegidas.splice(idx, 1); // Quitar si ya estaba
    } else {
      car.modalidadesElegidas.push(modalidad); // Agregar si no estaba
    }
  }

  // --- PERSISTENCIA ---
  guardar(){

    if(this.modo === 'delete'){
      this.eliminarFisico();
    }

    const sedesValidas = this.sedes.filter(s => s.nombre.trim() !== '' || s.direccion.trim() !== '');
    const carrerasValidas = this.carreras.filter(c => 
      c.nombre.trim() !== '' || (c.modalidadesElegidas && c.modalidadesElegidas.length > 0)
    );

    if (sedesValidas.length === 0 || carrerasValidas.length === 0) {
      Swal.fire('Error de datos', 'Debe haber al menos una sede y una carrera con información para guardar.', 'error');
      return;
    }

    this.sedes = [...sedesValidas];
    this.carreras = [...carrerasValidas];

    if(!this.formularioValido()){
      Swal.fire('Faltan datos','Complete los campos obligatorios','warning');
      return;
    }

    if(this.modo === 'create'){
      this.crear();
    }
    if(this.modo === 'edit'){
      this.actualizar();
    }
  }

  crear() {
    Swal.fire({
      title: 'Guardando información...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.institucionService.registrar({
      nombre: this.institucion.nombre,
      tipo: this.institucion.tipo,
      estado: true
    }).pipe(
      switchMap((instCreada: any) => {
        const idInst = instCreada.idInstitucion;

        const carrerasObs = this.carreras.map(car => {
          const obsCarrera = car.idCarrera 
            ? of({ idCarrera: car.idCarrera })
            : this.carreraService.registrar({
                nombre: car.nombre,
                descripcion: car.descripcion,
                area: car.area,
                estado: true
              });

          return obsCarrera.pipe(
            concatMap((carRes: any) => {
              const idCarreraFinal = carRes.idCarrera;

              return this.ofertaService.registrar({
                duracion: car.duracion,
                costoMatricula: car.costoMatricula,
                costoPension: car.costoPension,
                modalidad: car.modalidadesElegidas.join(', '),
                estado: true,
                institucion: { idInstitucion: idInst },
                carrera: { idCarrera: idCarreraFinal }
              }).pipe(
                concatMap(() => {
                  const relaciones = car.criteriosElegidos
                    .filter((crit: any) => !crit.idCritCarrera && crit.idCriterio !== null && crit.peso > 0)
                    .map((crit: any) => this.cSer.guardarRelacion({
                      carrera: { idCarrera: idCarreraFinal },
                      criterio: { idCriterio: crit.idCriterio },
                      peso: crit.peso
                    }));
                  return relaciones.length > 0 ? forkJoin(relaciones) : of(null);
                })
              );
            })    
          );
        });

        const sedesObs = this.sedes.map(sede => 
          this.sedeService.registrar({
            ...sede,
            institucion: { idInstitucion: idInst }
          })
        );

        return forkJoin({
          carreras: carrerasObs.length > 0 ? forkJoin(carrerasObs) : of([]),
          sedes: sedesObs.length > 0 ? forkJoin(sedesObs) : of([])
        });
      })
    ).subscribe({
      next: () => {
        Swal.close();
        Swal.fire('Éxito', 'Todo se registró correctamente', 'success');
        this.cerrar.emit(true);
      },
      error: (err) => {
        console.error(err);
        Swal.close();
        Swal.fire('Error', `Fallo en: ${err.message || 'Servidor'}`, 'error');
      }
    });
  }

actualizar() {
  Swal.fire({ title: 'Actualizando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const idInst = this.institucion.idInstitucion;

  this.institucionService.actualizarInstitucion(idInst, {
    nombre: this.institucion.nombre,
    tipo: this.institucion.tipo,
    estado: this.institucion.estado
  }).pipe(
    switchMap(() => {
      const sedesObs = this.sedes.map(s => {
        const body = { ...s, institucion: { idInstitucion: idInst } };
        return s.idSede ? this.sedeService.actualizarSede(s.idSede, body) : this.sedeService.registrar(body);
      });

      const carrerasObs = this.carreras.map(car => {
        const carBody = { nombre: car.nombre, area: car.area, descripcion: car.descripcion, estado: true };
        
        const obsCarrera = car.idCarrera 
          ? this.carreraService.actualizarCarrera(car.idCarrera, carBody)
          : this.carreraService.registrar(carBody);

        return obsCarrera.pipe(
          concatMap((carRes: any) => {
            const idCarFinal = car.idCarrera || carRes.idCarrera;
            
            const ofertaBody = {
              duracion: car.duracion,
              costoMatricula: car.costoMatricula,
              costoPension: car.costoPension,
              modalidad: car.modalidadesElegidas.join(', '),
              estado: car.estado,
              institucion: { idInstitucion: idInst },
              carrera: { idCarrera: idCarFinal }
            };

            const obsOferta = car.idOferta 
              ? this.ofertaService.actualizarOferta(car.idOferta, ofertaBody)
              : this.ofertaService.registrar(ofertaBody);

            return obsOferta.pipe(
              concatMap(() => {
                const nuevosCriterios = car.criteriosElegidos
                  .filter((crit: any) => !crit.idCritCarrera && crit.idCriterio !== null && crit.peso > 0)
                  .map((crit: any) => this.cSer.guardarRelacion({
                    carrera: { idCarrera: idCarFinal },
                    criterio: { idCriterio: crit.idCriterio },
                    peso: crit.peso
                  }));
                return nuevosCriterios.length > 0 ? forkJoin(nuevosCriterios) : of([]);
              })
            );
          })
        );
      });

      return forkJoin({
        c: carrerasObs.length > 0 ? forkJoin(carrerasObs) : of([]),
        s: sedesObs.length > 0 ? forkJoin(sedesObs) : of([])
      });
    })
  ).subscribe({
    next: () => { 
      Swal.close(); 
      Swal.fire('Éxito', 'Cambios guardados', 'success');
      this.cerrar.emit(true); 
    },
    error: (err) => {
      console.error("Error detallado:", err.error);
      Swal.close();
      Swal.fire('Error', 'Error 500: Revisa la consola para el stacktrace', 'error');
    }
  });
}

  cancelar(){
    this.cerrar.emit(false);
  }

 // --- LÓGICA DE CAMBIO DE ESTADO CON PATCH (TOGGLE) ---
  toggleEstadoInstitucion() {
    const accion = this.institucion.estado ? 'desactivar' : 'activar';

    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} institución?`,
      text: this.institucion.estado 
        ? "Al desactivar, se apagarán también sedes y ofertas asociadas." 
        : "Se activará la institución.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.institucionService.cambiarEstado(this.institucion.idInstitucion).subscribe(() => {
          this.institucion.estado = !this.institucion.estado;
          
          // Si el back desactiva en cascada, reflejamos visualmente (UI sync)
          if (!this.institucion.estado) {
            this.sedes.forEach(s => s.estado = false);
            this.carreras.forEach(c => c.estado = false);
          }
          this.cdr.detectChanges();
          Swal.fire('Cambiado', 'Estado de institución actualizado', 'success');
        });
      }
    });
  }

  toggleEstadoSede(index: number) {
    const sede = this.sedes[index];
    if (!sede.estado && !this.institucion.estado) {
      Swal.fire('Acción bloqueada', 'Para activar una sede, primero debe activar la institución.', 'warning');
      return;
    }
    this.sedeService.cambiarEstado(sede.idSede).subscribe(() => {
      sede.estado = !sede.estado;
      this.cdr.detectChanges();
    });
  }

  toggleEstadoOferta(index: number) {
    const oferta = this.carreras[index];
    if (!oferta.estado) {
      if (!this.institucion.estado) {
        Swal.fire('Bloqueado', 'Debe activar la institución primero.', 'warning');
        return;
      }
      if (!oferta.carreraEstado) {
        Swal.fire('Bloqueado', 'Debe activar la carrera globalmente primero.', 'warning');
        return;
      }
    }
    this.ofertaService.cambiarEstado(oferta.idOferta).subscribe(() => {
      oferta.estado = !oferta.estado;
      this.cdr.detectChanges();
    });
  }

  toggleEstadoCarrera(index: number) {
    const car = this.carreras[index];
    const accion = car.carreraEstado ? 'desactivar' : 'activar';

    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} carrera globalmente?`,
      text: car.carreraEstado ? "Afectará a todas las instituciones que dictan esta carrera." : "Se activará la carrera.",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Confirmar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.carreraService.cambiarEstado(car.idCarrera).subscribe(() => {
          car.carreraEstado = !car.carreraEstado;
          // Si se apaga la carrera global, la oferta local también debería morir visualmente
          if (!car.carreraEstado) car.estado = false;
          this.cdr.detectChanges();
          Swal.fire('Cambiado', 'Estado global de carrera actualizado', 'success');
        });
      }
    });
  }

  // --- LOGICA DE ELIMINACION PERMANENTE ---
  async eliminarFisico() {
    const result = await Swal.fire({
      title: '¿Confirmar eliminación permanente?',
      text: 'Esta acción no se puede deshacer y eliminará todas las referencias asociadas.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      confirmButtonColor: '#d33'
    });

    if (!result.isConfirmed) return;

    // SEGUNDA CONFIRMACIÓN DETALLADA
    const sedesNombres = this.sedes.map(s => s.nombre).join(', ');
    const carrerasNombres = this.carreras.map(c => c.nombre).join(', ');

    const confirmDetail = await Swal.fire({
      title: 'Confirmación Final',
      html: `Se eliminará la institución: <b>${this.institucion.nombre}</b>.<br><br>` +
            `También se borrarán las sedes: <i>${sedesNombres}</i>.<br>` +
            `Y las relaciones con: <i>${carrerasNombres}</i>.<br><br>` +
            `¿Estás totalmente seguro?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ELIMINAR TODO',
      confirmButtonColor: '#d33'
    });

    if (confirmDetail.isConfirmed) {
      Swal.showLoading();
      this.institucionService.eliminarInstitucion(this.institucion.idInstitucion).subscribe({
        next: () => {
          Swal.fire('Eliminado', 'Institución y sus dependencias borradas.', 'success');
          this.cerrar.emit(true);
        },
        error: (err) => Swal.fire('Error', 'No se pudo eliminar: ' + err.message, 'error')
      });
    }
  }

  eliminarSedeUnica(index: number) {
    const sede = this.sedes[index];
    Swal.fire({
      title: `¿Eliminar sede ${sede.nombre}?`,
      text: "Esta acción solo eliminará esta sede.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar'
    }).then(r => {
      if (r.isConfirmed) {
        this.sedeService.eliminarSede(sede.idSede).subscribe(() => {
          this.sedes.splice(index, 1);
          this.cdr.detectChanges();
          Swal.fire('Eliminado', 'Sede borrada', 'success');
        });
      }
    });
  }

  async eliminarCarreraGlobal(index: number) {
    const car = this.carreras[index];
    
    // Primera confirmación
    const r1 = await Swal.fire({
      title: '¿Eliminar carrera globalmente?',
      text: 'Se eliminará la carrera y su relación con TODAS las instituciones.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Continuar'
    });

    if (!r1.isConfirmed) return;

    // Segunda confirmación
    const r2 = await Swal.fire({
      title: 'Último paso',
      text: `Se eliminará la carrera ${car.nombre} y todas sus ofertas académicas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'BORRAR CARRERA'
    });

    if (r2.isConfirmed) {
      this.carreraService.eliminarCarrera(car.idCarrera).subscribe(() => {
        this.carreras = this.carreras.filter(c => c.idCarrera !== car.idCarrera);
        this.cdr.detectChanges();
        Swal.fire('Eliminado', 'Carrera eliminada del sistema', 'success');
      });
    }
  }

  eliminarRelacionOferta(index: number) {
    const oferta = this.carreras[index];
    Swal.fire({
      title: '¿Eliminar relación?',
      text: `Se eliminará la carrera ${oferta.nombre} solo de esta institución.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar relación'
    }).then(r => {
      if (r.isConfirmed) {
        this.ofertaService.eliminarOferta(oferta.idOferta).subscribe(() => {
          this.carreras.splice(index, 1);
          this.cdr.detectChanges();
          Swal.fire('Eliminado', 'Relación eliminada', 'success');
        });
      }
    });
  }

}
