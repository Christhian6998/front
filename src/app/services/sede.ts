import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sede } from '../models/Sede';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SedeService {
  private apiUrl = environment.apiUrl+'/sede';

  constructor(private http: HttpClient) { }

  // POST: Registrar sede (ADMIN)
  registrar(sede: Sede) {
    return this.http.post(this.apiUrl + '/registrarSede', sede);
  }

  // GET: Listar todas las sedes (ADMIN)
  listarSedes() {
    return this.http.get<Sede[]>(this.apiUrl + '/listarSedes');
  }

  // GET: Listar sedes por institución (PUBLICO / POSTULANTE)
  listarPorInstitucion(idInstitucion: number) {
    return this.http.get<Sede[]>(
      this.apiUrl + '/listarSedesInstitucion/' + idInstitucion
    );
  }

  // PUT: Actualizar sede (ADMIN)
  actualizarSede(id: number, sede: Sede) {
    return this.http.put(this.apiUrl + '/actualizarSede/' + id, sede);
  }

  // DELETE: Eliminar sede (ADMIN)
  eliminarSede(id: number) {
    return this.http.delete(this.apiUrl + '/eliminarSede/' + id, { responseType: 'text' });
  }

  // PATCH: Activar / Desactivar estado (ADMIN)
  cambiarEstado(id: number) {
    return this.http.patch(this.apiUrl + '/estado/' + id, {}, { responseType: 'text' });
  }
}
