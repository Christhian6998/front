import { ChangeDetectorRef, Component, computed } from '@angular/core';
import { Pregunta } from '../../../models/Pregunta';
import { RespuestaItemDTO, TestRequestDTO } from '../../../models/TestRequestDTO';
import { TestService } from '../../../services/test';
import { CarreraService } from '../../../services/carrera';
import { AuthService } from '../../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test',
  imports: [CommonModule, FormsModule],
  templateUrl: './test.html',
  styleUrl: './test.css',
})
export class TestComponent {
  faseActual: number = 0;
  sabeCarrera: boolean | null = null;
  
  carrerasLista: any[] = [];
  carrera1: number = 0;
  carrera2: number = 0;
  carrera3: number = 0;

  preguntasFaseActual: Pregunta[] = [];
  respuestasTemporales: { [key: number]: string } = {}; // idPregunta -> "Valor|Puntaje"
  todasLasRespuestas: RespuestaItemDTO[] = [];
  criteriosActivos: number[] = [];

  isProcessing: boolean = false;

  criteriosUsados: Set<number> = new Set();
  criteriosPendientes: number[] = [];
  todosLosCriterios: number[] = [];

  constructor(
    private testService: TestService,
    private carreraService: CarreraService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.carreraService.listarCarrerasActivas().subscribe(res => {
      this.carrerasLista = res;
      this.forceUpdate();
    });
    
  }

  forceUpdate() {
    this.cdr.detectChanges();
  }

  async iniciarTest() {
    this.faseActual = 1;
    this.criteriosActivos = []; 
    this.criteriosUsados.clear();
    this.criteriosPendientes = [];
    this.todasLasRespuestas = [];
    this.cargarPreguntas();
  }

  async cargarPreguntas() {
    this.respuestasTemporales = {};
    const res = await firstValueFrom(this.testService.obtenerPreguntas(this.faseActual, this.criteriosActivos));
    this.preguntasFaseActual = res;
    this.forceUpdate();
  }

  todasRespondidas(): boolean {
    return this.preguntasFaseActual.length > 0 && this.preguntasFaseActual.every(p => this.respuestasTemporales[p.idPregunta!] !== undefined);
  }

  async siguienteFase() {
    if (this.isProcessing) return; 
    this.isProcessing = true;
    // Guardar las respuestas de esta fase en el array global
    for (const id in this.respuestasTemporales) {
      const parts = this.respuestasTemporales[id].split('|');
      this.todasLasRespuestas.push({
        idPregunta: Number(id),
        valor: parts[0],
        puntaje: Number(parts[1])
      });
    }

    if (this.faseActual === 4) {
      this.faseActual = 5; // Loading state
      this.forceUpdate();
      await this.enviarTestBackend();
      return;
    }

    // 2. Extraer criterios (áreas) para la next phase
    await this.procesarCriteriosParaSiguienteFase();

    // 3. Avanzar
    this.faseActual++;
    await this.cargarPreguntas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.isProcessing = false;
  }

  // test.component.ts
  async procesarCriteriosParaSiguienteFase() {
    let nombresSeleccionados = new Set<string>();
    let nombresTodosFase = new Set<string>(); 
    let respuestasYes = 0;

    // 1. Extraer nombres separando por '_' (todos los vistos y los marcados con SI)
    for (const p of this.preguntasFaseActual) {
      const ans = this.respuestasTemporales[p.idPregunta!];
      if (!ans) continue;

      const puntaje = Number(ans.split('|')[1]);
      const isYes = puntaje > 0;
      if (isYes) respuestasYes++;

      const areas = p.area ? p.area.split('_') : (p.criterio?.nombre ? [p.criterio.nombre] : []);
      
      areas.forEach(nombre => {
        if (nombre) {
          nombresTodosFase.add(nombre);
          if (isYes) nombresSeleccionados.add(nombre);
        }
      });
    }

    // 2. Fetch de IDs y alimentar el array global
    let nuevosCriterios = new Set<number>();
    let poolCriteriosFase = new Set<number>(); 

    for (const nombre of Array.from(nombresTodosFase)) {
      try {
        const id = await firstValueFrom(this.testService.buscarIdPorNombre(nombre));
        if (id) {
          const numId = Number(id);
          poolCriteriosFase.add(numId);
          
          if (nombresSeleccionados.has(nombre)) {
            nuevosCriterios.add(numId);
          }
          
          // Construir todosLosCriterios on the fly (sobre la marcha)
          if (!this.todosLosCriterios.includes(numId)) {
            this.todosLosCriterios.push(numId);
          }
        }
      } catch (e) {
        console.warn(`Criterio ${nombre} no encontrado`);
      }
    }

    // 3. Evaluar All YES o All NO
    const totalPreguntas = this.preguntasFaseActual.length;
    if (respuestasYes === totalPreguntas || respuestasYes === 0) {
      // Usar todos los recopilados como fallback (plan de contingencia)
      this.todosLosCriterios.forEach(c => nuevosCriterios.add(c));
    }

    // 4. Clean up (limpiar) usados y unir con pendientes
    let combinados = [...new Set([...this.criteriosPendientes, ...nuevosCriterios])];
    combinados = combinados.filter(c => !this.criteriosUsados.has(c));

    // 5. Rellenar si hay menos de 10
    if (combinados.length < 10) {
      const faltantes = this.todosLosCriterios
        .filter(c => !this.criteriosUsados.has(c) && !combinados.includes(c))
        .sort(() => 0.5 - Math.random()) 
        .slice(0, 10 - combinados.length);
      
      combinados = [...combinados, ...faltantes];
    }

    // 6. Setear activos y mandar al backlog (lista de pendientes)
    if (combinados.length < 10) {
      const repescados = Array.from(this.criteriosUsados)
        .sort(() => 0.5 - Math.random())
        .slice(0, 10 - combinados.length);
      combinados = [...combinados, ...repescados];
    }
    this.criteriosActivos = combinados.slice(0, 10);
    this.criteriosPendientes = combinados.slice(10);

    this.criteriosActivos.forEach(c => this.criteriosUsados.add(c));
  }

  async enviarTestBackend() {
    const c1 = this.sabeCarrera ? this.carrera1 : 0;
    const c2 = this.sabeCarrera ? this.carrera2 : 0;
    const c3 = this.sabeCarrera ? this.carrera3 : 0;

    const dto: TestRequestDTO = {
      idUsuario: Number(this.authService.userId()),
      respuestas: this.todasLasRespuestas
    };

    try {
      const res = await firstValueFrom(this.testService.guardarTest(dto, c1,c2,c3));
      await Swal.fire({
        title: '¡Test Finalizado!',
        text: 'Tu reporte vocacional ya está listo. (Your report is ready)',
        icon: 'success',
        confirmButtonText: 'Ver mis resultados',
        confirmButtonColor: '#0d6efd',
        allowOutsideClick: false
      });

      this.router.navigate(['/historial']);
    } catch (error) {
      console.error('Error enviando test', error);
      Swal.fire('Error', 'No se pudo guardar el test. Inténtalo de nuevo.', 'error');
      this.faseActual = 4;
      this.isProcessing = false;
    }
  }
  getFiltradas(idSeleccionado: number) {
    const seleccionadas = [Number(this.carrera1), Number(this.carrera2), Number(this.carrera3)];
    return this.carrerasLista.filter(c => 
      c.idCarrera == idSeleccionado || !seleccionadas.includes(c.idCarrera)
    );
  }

  onSabeCarreraChange(valor: boolean) {
    if (valor === false) {
    this.carrera1 = 0;
    this.carrera2 = 0;
    this.carrera3 = 0;
  }
  this.forceUpdate();
  }
  
}
