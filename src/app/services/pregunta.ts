import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pregunta } from '../models/Pregunta';

@Injectable({
  providedIn: 'root',
})
export class PreguntaService {
  private url = "http://localhost:8080/pregunta"

  constructor(private http: HttpClient) { }

  listar(){
    return this.http.get<Pregunta[]>(this.url + "/listar")
  }

  buscar(id: number) {
    return this.http.get(this.url + "/buscar/" + id)
  }

  buscarFase(fase: number) {
    return this.http.get(this.url + "/buscarFase/" + fase)
  }

  registrar(p: Pregunta) {
    return this.http.post(this.url + "/registrar", p)
  }

  actualizar(id: number, p: Pregunta){
    return this.http.put(this.url + "/actualizar/" + id, p)
  }

  eliminar(id: number) {
    return this.http.delete(this.url + "/eliminar/" + id, { responseType: 'text' })
  }

  cambiarEstado(id: number) {
    return this.http.patch(this.url + "/estado/" + id, {}, { responseType: 'text' })
  }
}
