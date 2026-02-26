import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    if (!this.email || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, llena todos los espacios. ✨',
        confirmButtonColor: '#312e81'
      });
      return;
    }

    this.isLoading.set(true);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        
        // Alerta de éxito (Success)
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido de nuevo!',
          text: `Ingresando como ${user.rol.toLowerCase()}`,
          timer: 1500,
          showConfirmButton: false
        });

        // Redirección lógica por carpetas
        if (user.rol === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (user.rol === 'POSTULANTE') {
          this.router.navigate(['/postulante/home']);
        } else {
          this.router.navigate(['/inicio']);
        }

        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Alerta de error (Error)
        Swal.fire({
          icon: 'error',
          title: 'Error de acceso',
          text: 'Credenciales incorrectas. Inténtalo de nuevo. 🧐',
          confirmButtonColor: '#312e81'
        });
      }
    });
  }
}
