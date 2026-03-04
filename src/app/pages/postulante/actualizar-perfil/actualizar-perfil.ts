import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../services/usuario';
import { AuthService } from '../../../services/auth';
import { Usuario } from '../../../models/Usuario';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-actualizar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actualizar-perfil.html',
  styleUrl: './actualizar-perfil.css',
})
export class ActualizarPerfil {
  usuario: Usuario = {
    nombre: '', apellido: '', email: '', direccion: '',
    telefono: '', password: '', consentimiento: false,
    fechaNacimiento: ''
  };

  newPassword = '';
  confirmPassword = '';
  isLoading = signal(false);

  constructor(
    private usuarioService: UsuarioService,
    private authService:AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    const email = this.authService.email();
    if (email) {
      this.usuarioService.buscarUsuario(email).subscribe({
        next: (data) => {
          this.usuario = data;
          if (this.usuario.fechaNacimiento) {
            this.usuario.fechaNacimiento = this.usuario.fechaNacimiento.toString().split('T')[0];
          }
          this.usuario.password = ''; 
          this.cdr.detectChanges();
        }
      });
    }
  }

  onUpdate() {
    const nacimiento = new Date(this.usuario.fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    if (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    if (edad < 14 || edad > 25) {
      Swal.fire('Error', 'Debes tener entre 14 y 25 años.', 'error');
      return;
    }

    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(this.usuario.telefono)) {
      Swal.fire('Error', 'El teléfono debe tener 9 dígitos y empezar con 0.', 'warning');
      return;
    }

    this.usuario.email = this.usuario.email.toLowerCase();

    if (this.newPassword) {
      if (this.newPassword.length < 6) {
        Swal.fire('Seguridad', 'La nueva contraseña debe tener mínimo 6 caracteres.', 'warning');
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
        return;
      }
      this.usuario.password = this.newPassword;
    } else {
      delete this.usuario.password;
    }

    this.isLoading.set(true);
    const id = this.authService.userId();
    
    this.usuarioService.actualizarUsuario(id!, this.usuario).subscribe({
      next: () => {
        this.isLoading.set(false);
        Swal.fire('Éxito', 'Perfil actualizado correctamente.', 'success');
        this.newPassword = '';
        this.confirmPassword = '';
        this.cargarDatos(); 
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire('Error', err.error || 'Error al actualizar', 'error');
      }
    });
  }
}
