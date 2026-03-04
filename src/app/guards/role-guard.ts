import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(route: any): boolean {
    if (!this.auth.isAuthenticated() || this.auth.isTokenExpired()) {
      this.auth.logout(); // Limpiamos por si acaso (just in case)
      this.router.navigate(['/login']);
      return false;
    }

    // logueado y no es POSTULANTE va al home
    const userRole = this.auth.userRol();
    const expectedRole = route.data['role'];

    if (expectedRole && userRole !== expectedRole) {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
