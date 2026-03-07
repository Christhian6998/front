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

  userId = computed(() => this.authService.currentUser()?.id || null);

  isProcessing: boolean = false;

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
    let nombresCriterios = new Set<string>();

    for (const p of this.preguntasFaseActual) {
      const ans = this.respuestasTemporales[p.idPregunta!];
      if (!ans) continue;

      const puntaje = Number(ans.split('|')[1]);
      
      // Solo tomamos criterios si la respuesta dio puntos
      if (puntaje > 0) {
        if (p.area) {
          p.area.split('_').forEach(a => nombresCriterios.add(a));
        } else if (p.criterio) {
          nombresCriterios.add(p.criterio.nombre!);
        }
      }
    }

    const nuevosCriteriosIds: number[] = [];
    for (const nombre of Array.from(nombresCriterios)) {
      try {
        const id = await firstValueFrom(this.testService.buscarIdPorNombre(nombre));
        if (id) nuevosCriteriosIds.push(id as number);
      } catch (e) {
        console.warn(`Criterio ${nombre} no encontrado`);
      }
    }

    // Pasamos TODOS los criterios obtenidos, sin límites
    this.criteriosActivos = nuevosCriteriosIds; 
  }

  async enviarTestBackend() {
    const dto: TestRequestDTO = {
      idUsuario: this.userId() as number,
      respuestas: this.todasLasRespuestas
    };

    try {
      const res = await firstValueFrom(this.testService.guardarTest(dto, this.carrera1, this.carrera2, this.carrera3));
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

  
}
