import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Institucion } from '../models/Institucion';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InstitucionService {
  private apiUrl = environment.apiUrl+'/institucion';

  constructor(private http: HttpClient) { }

  // POST: Registrar institución (ADMIN)
  registrar(institucion: Institucion) {
    return this.http.post(this.apiUrl + '/registrarInstitucion', institucion);
  }

  // GET: Listar todas (ADMIN)
  listarInstituciones() {
    return this.http.get<Institucion[]>(this.apiUrl + '/listarInstituciones');
  }

  // GET: Listar activas (PUBLICO / POSTULANTE)
  listarInstitucionesActivas() {
    return this.http.get<Institucion[]>(this.apiUrl + '/listarInstitucionesActivas');
  }

  // PUT: Actualizar institución (ADMIN)
  actualizarInstitucion(id: number, institucion: Institucion) {
    return this.http.put(this.apiUrl + '/actualizarInstitucion/' + id, institucion);
  }

  // DELETE: Eliminar institución (ADMIN)
  eliminarInstitucion(id: number) {
    return this.http.delete(this.apiUrl + '/eliminarInstitucion/' + id, { responseType: 'text' });
  }

  // PATCH: Activar / Desactivar estado (ADMIN)
  cambiarEstado(id: number) {
    return this.http.patch(this.apiUrl + '/estado/' + id, {}, { responseType: 'text' });
  }
}
