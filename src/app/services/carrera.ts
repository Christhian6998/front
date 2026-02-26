import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Carrera } from '../models/Carrera';

@Injectable({
  providedIn: 'root',
})
export class CarreraService {
  private apiUrl = 'http://localhost:8080/carrera';

  constructor(private http: HttpClient) { }

  // POST: Registrar carrera
  registrar(carrera: Carrera) {
    return this.http.post(this.apiUrl + '/registrarCarrera', carrera);
  }

  // GET: Listar todas (ADMIN)
  listarCarreras() {
    return this.http.get<Carrera[]>(this.apiUrl + '/listarCarreras');
  }

  // GET: Listar activas (PUBLICO / POSTULANTE)
  listarCarrerasActivas() {
    return this.http.get<Carrera[]>(this.apiUrl + '/listarCarrerasActivas');
  }

  // PUT: Actualizar carrera
  actualizarCarrera(id: number, carrera: Carrera) {
    return this.http.put(this.apiUrl + '/actualizarCarrera/' + id, carrera);
  }

  // DELETE: Eliminar carrera
  eliminarCarrera(id: number) {
    return this.http.delete(this.apiUrl + '/eliminarCarrera/' + id, { responseType: 'text' });
  }

  // PATCH: Activar / Desactivar estado
  cambiarEstado(id: number) {
    return this.http.patch(this.apiUrl + '/estado/' + id, {}, { responseType: 'text' });
  }

}
