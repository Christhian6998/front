import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Chat } from './pages/chat/chat';
import { AuthService } from './services/auth';
import Swal from 'sweetalert2';
import { filter } from 'rxjs';
import { ActualizarPerfil } from './pages/postulante/actualizar-perfil/actualizar-perfil';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, Chat, RouterLink, ActualizarPerfil],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'ORIENTACIÓN VOCACIONAL';

  public authService = inject(AuthService);
  public router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  isScrolled = false;
  showChat = true;
  private sessionCheckId: any;
  private metricasCargadas = false;
  urlSeguraParaPrecarga: SafeResourceUrl | undefined;

  constructor() {
    this.configurarPrecargaMetricas();
    this.iniciarVigilanciaSesion();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (this.authService.userRol() === 'ADMIN' && !this.urlSeguraParaPrecarga) {
          this.configurarPrecargaMetricas();
        }
        if (event.urlAfterRedirects === '/metricas' && !this.metricasCargadas) {
          Swal.fire({
            title: 'Cargando Reportes',
            text: 'Por favor espere un momento...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
          setTimeout(() => {
            Swal.close();
            this.metricasCargadas = true;
          }, 2500);
        }

        const hiddenRoutes = ['/login', '/registro'];
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.showChat = !hiddenRoutes.includes(event.urlAfterRedirects);

        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
          const toggler = document.querySelector('.navbar-toggler') as HTMLElement;
          toggler?.click();
        }
      });
  }

  configurarPrecargaMetricas() {
    if (this.authService.userRol() === 'ADMIN') {
      const url = 'https://app.powerbi.com/view?r=eyJrIjoiMWE3NzIwMmMtMzliMC00MGU5LTk2NjQtM2FjNzMyMTljM2YzIiwidCI6Ijc1MDRlMzE4LThlMWUtNGQ1NS1iZmZkLTg3NWI0ZGVlODI2MCIsImMiOjR9';
      this.urlSeguraParaPrecarga = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  iniciarVigilanciaSesion() {
    this.sessionCheckId = setInterval(() => {
      if (this.authService.isAuthenticated()) {
        if (this.authService.isTokenExpired()) {
          clearInterval(this.sessionCheckId);
          
          Swal.fire({
            title: 'Sesión Expirada',
            text: 'Tu tiempo de sesión ha terminado. Por favor, vuelve a ingresar.',
            icon: 'warning',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false, 
            timer: 3000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
            }
          }).then(() => {
            this.finalizarSesionForzada();
          });
        }
      }
    }, 3000);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
    const navbarCollapse = document.getElementById('navbarNav');
    if (window.scrollY > 50 && navbarCollapse?.classList.contains('show')) {
      (document.querySelector('.navbar-toggler') as HTMLElement)?.click();
    }
  }

  toggleChat() {
    this.showChat = !this.showChat;
  }

  logout() {
    this.authService.logout();
    Swal.fire({
      title: '¡Sesión terminada!',
      text: 'Vuelve pronto, te estaremos esperando. 👋',
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#312e81',
      timer: 2500,
      timerProgressBar: true
    }).then(() => {
      this.router.navigate(['/']);
    });
  }

  mostrarAlertaExpiracion() {
    let timeLeft = 60;
    let timerInterval: any;

    Swal.fire({
      title: 'Sesión Expirada',
      html: 'Tu sesión ha terminado por seguridad. Se cerrará en <b>'+timeLeft+'</b> segundos.',
      icon: 'warning',
      confirmButtonText: 'Aceptar y Salir',
      confirmButtonColor: '#312e81',
      allowOutsideClick: false,
      timer: 15000,
      timerProgressBar: true,
      didOpen: () => {
        timerInterval = setInterval(() => {
          timeLeft--;
          const content = Swal.getHtmlContainer();
          if (content) {
            const b = content.querySelector('b');
            if (b) b.textContent = timeLeft.toString();
          }
        }, 200);
      },
      willClose: () => {
        clearInterval(timerInterval);
      }
    }).then(() => {
      this.finalizarSesionForzada();
    });
  }

  finalizarSesionForzada() {
    this.authService.logout();
    this.router.navigate(['/login']);
    setTimeout(() => {
      Swal.fire('Sesión Cerrada', 'Por favor, inicia sesión nuevamente.', 'info');
    }, 500);
  }

}
