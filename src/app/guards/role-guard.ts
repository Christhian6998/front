import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {

    // usuario no logueado va al login
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // logueado y no es POSTULANTE va al home
    if (this.auth.userRol() !== 'POSTULANTE') {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
