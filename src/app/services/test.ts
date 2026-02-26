import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pregunta } from '../models/Pregunta';
import { TestRequestDTO } from '../models/TestRequestDTO';
import { RecomendacionCarrera } from '../models/RecomendacionCarrera';

@Injectable({
  providedIn: 'root',
})
export class TestService {
  private url = "http://localhost:8080/test"

  constructor(private http: HttpClient) { }

  // Obtener preguntas filtradas por fase y áreas (as string array)
  obtenerPreguntas(fase: number, criterios: number[] = []){
    let params = new HttpParams();
    criterios.forEach(c => params = params.append('criterios', c.toString()));
    return this.http.get<Pregunta[]>(this.url+'/fase/'+fase, { params });
  }

  // Guardar el test y obtener recomendaciones
  guardarTest(dto: TestRequestDTO, c1: number = 0, c2: number = 0, c3: number = 0) {
    return this.http.post<RecomendacionCarrera[]>(
      this.url + "/guardar?idC1=" + c1 + "&idC2=" + c2 + "&idC3=" + c3, 
      dto
    );
  }

  // Historial por usuario
  listarIntentos(idUsuario: number) {
    return this.http.get<any[]>(this.url + "/intentos/usuario/" + idUsuario);
  }

  // Recomendacion
  obtenerRecomenadcion(idRec:number){
    return this.http.get<any[]>(this.url+'/recomendacion/intento/'+ idRec)
  }

  // Detalle de recomendación específica
  obtenerDetalleRecomendacion(idRec: number) {
    return this.http.get<any[]>(this.url + "/recomendacion-carrera/" + idRec);
  }

  buscarIdPorNombre(nombre: string){
    return this.http.get(this.url + '/buscar-id/' + nombre);
  }
}
