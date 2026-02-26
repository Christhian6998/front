import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from '../models/Usuario';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private apiUrl = 'http://localhost:8080/usuario';

  constructor(private http: HttpClient) { }

  // POST: Registrar nuevo usuario
  registrar(usuario: Usuario) {
    return this.http.post(this.apiUrl+'/registrarUsuario', usuario);
  }

  // GET: Listar todos los usuarios
  listarUsuarios() {
    return this.http.get<Usuario[]>(this.apiUrl+'/listarUsuarios');
  }

  // GET: Listar solo los que dieron consentimiento
  listarConConsentimiento(){
    return this.http.get<Usuario[]>(this.apiUrl+'/listarUsuariosConsentimiento');
  }

  // PUT: Actualizar datos de un usuario por ID
  actualizarUsuario(id: number, usuario: Usuario) {
    return this.http.post(this.apiUrl+'/actualizarUsuario/'+id, usuario);
  }

  // DELETE: Eliminar un usuario
  eliminarUsuario(id: number){
    return this.http.delete(this.apiUrl+'/eliminarUsuario/'+id);
  }
}
