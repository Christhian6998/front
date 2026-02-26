import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OfertaCarrera } from '../models/OfertaCarrera';

@Injectable({
  providedIn: 'root',
})
export class OfertaCarreraService {
  private apiUrl = 'http://localhost:8080/ofertaCarrera';

  constructor(private http: HttpClient) { }

  // POST: Registrar oferta (ADMIN)
  registrar(oferta: OfertaCarrera) {
    return this.http.post(this.apiUrl + '/registrarOferta', oferta);
  }

  // GET: Listar todas las ofertas (ADMIN)
  listarOfertas() {
    return this.http.get<OfertaCarrera[]>(this.apiUrl + '/listarOfertas');
  }

  // GET: Listar ofertas por carrera (PUBLICO / POSTULANTE)
  listarPorCarrera(idCarrera: number) {
    return this.http.get<OfertaCarrera[]>(
      this.apiUrl + '/listarOfertasCarrera/' + idCarrera
    );
  }

  // GET: Listar ofertas por institución (PUBLICO / POSTULANTE)
  listarPorInstitucion(idInstitucion: number) {
    return this.http.get<OfertaCarrera[]>(
      this.apiUrl + '/listarOfertasInstitucion/' + idInstitucion
    );
  }

  // PUT: Actualizar oferta (ADMIN)
  actualizarOferta(id: number, oferta: OfertaCarrera) {
    return this.http.put(this.apiUrl + '/actualizarOferta/' + id, oferta);
  }

  // DELETE: Eliminar oferta (ADMIN)
  eliminarOferta(id: number) {
    return this.http.delete(this.apiUrl + '/eliminarOferta/' + id, { responseType: 'text' });
  }

  // PATCH: Activar / Desactivar estado (ADMIN)
  cambiarEstado(id: number) {
    return this.http.patch(this.apiUrl + '/estado/' + id, {}, { responseType: 'text' });
  }
}
