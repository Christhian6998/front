import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si existe token → lo agregamos
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: 'Bearer '+token
      }
    });

    return next(authReq);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('session_sov');
        window.location.reload();
      }
      return throwError(() => error);
    })
  );
};