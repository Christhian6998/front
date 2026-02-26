import { Injectable } from '@angular/core';
import { Criterio } from '../models/Criterio';
import { HttpClient } from '@angular/common/http';
import { CriterioCarrera } from '../models/CriterioCarrera';

@Injectable({
  providedIn: 'root',
})
export class CriterioService {
  private apiUrl = 'http://localhost:8080/criterio';

  constructor(private http: HttpClient) { }

  // GET: Listar todos los criterios
  listar() {
    return this.http.get<Criterio[]>(this.apiUrl);
  }

  // GET: Buscar criterio por ID
  buscarPorId(id: number) {
    return this.http.get<Criterio>(this.apiUrl + '/buscar/' + id);
  }

  // POST: Guardar nuevo criterio
  guardar(criterio: Criterio) {
    return this.http.post<Criterio>(this.apiUrl + '/guardar', criterio);
  }

  // PUT: Actualizar criterio
  actualizar(id: number, criterio: Criterio) {
    return this.http.put<Criterio>(this.apiUrl + '/actualizar/' + id, criterio);
  }

  // DELETE: Eliminar criterio
  eliminar(id: number) {
    return this.http.delete(this.apiUrl + '/eliminar/' + id, { responseType: 'text' });
  }

  // --- Relaciones CriterioCarrera ---

  // GET: Carreras asociadas a un criterio
  obtenerCarrerasPorCriterio(id: number) {
    return this.http.get<CriterioCarrera[]>(this.apiUrl + '/buscarPorCarrera/' + id);
  }

  // GET: Criterios asociados a una carrera
  obtenerCriterioPorCarrera(id: number) {
    return this.http.get<CriterioCarrera[]>(this.apiUrl + '/buscarPorCriterio/' + id);
  }

  // POST: Guardar relación criterio-carrera
  guardarRelacion(cc: CriterioCarrera) {
    return this.http.post<CriterioCarrera>(this.apiUrl + '/relacion', cc);
  }

  // DELETE: Eliminar criterio-carrera
  eliminarCriterioCarrera(id: number) {
    return this.http.delete(this.apiUrl + '/eliminarCritCarr/' + id, { responseType: 'text' });
  }
}
