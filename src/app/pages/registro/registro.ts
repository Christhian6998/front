import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { UsuarioService } from '../../services/usuario';
import { Router } from '@angular/router';
import { Usuario } from '../../models/Usuario';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  usuario: Usuario = {
    nombre: '', apellido: '', email: '', direccion: '',
    telefono: '', password: '', consentimiento: false,
    fechaNacimiento: '', 
    fechaRegistro: new Date()
  };

  confirmPassword = '';
  isLoading = signal(false);

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  calcularEdad(fecha: string): number {
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  onRegister() {
    const edad = this.calcularEdad(this.usuario.fechaNacimiento);

    // Validar Rango de Edad
    if (edad < 14 || edad > 25) {
      Swal.fire('Edad no permitida', 'Debes tener entre 14 y 25 años. ✋', 'error');
      return;
    }

    // Validar Match de Password
    if (this.usuario.password !== this.confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden. 🔑', 'warning');
      return;
    }

    this.isLoading.set(true);

    this.usuarioService.registrar(this.usuario).subscribe({
      next: () => {
        this.isLoading.set(false);
        Swal.fire('¡Éxito!', 'Te has registrado correctamente.', 'success')
          .then(() => this.router.navigate(['/login']));
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = typeof err.error === 'string' ? err.error : 'Error en el servidor';
      Swal.fire('Error', msg, 'error');
      console.error('Server error:', err);
      }
    });
  }
}
