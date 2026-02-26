import { computed, Injectable, signal } from '@angular/core';
import { LoginRequest, LoginResponse } from '../models/Auth';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/auth/login';
  
  // Usamos una señal para saber si el usuario está logueado en toda la app
  currentUser = signal<LoginResponse | null>(this.getUserFromStorage());

  isAuthenticated = computed(() => !!this.currentUser()?.token);
  userRol = computed(() => this.currentUser()?.rol || null);
  userId = computed(() => this.currentUser()?.id || null);
  private checkInterval: any;

  constructor(private http: HttpClient) {}

  private getUserFromStorage(): LoginResponse | null {
    const data = localStorage.getItem('session_sov');
    return data ? JSON.parse(data) : null;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, credentials).pipe(
      tap(res => {
        const expirationDate = new Date().getTime() + (2 * 60 * 60 * 1000);
        const sessionData = { ...res, expiration: expirationDate };
        // Guardamos todo el objeto (token, rol, email) en una sola llave
        localStorage.setItem('session_sov', JSON.stringify(sessionData));
        this.currentUser.set(sessionData as any);
      })
    );
  }

  isTokenExpired(): boolean {
    const data = this.getUserFromStorage() as any;
    if (!data || !data.expiration) return true;
    return new Date().getTime() > data.expiration;
  }

  logout() {
    localStorage.removeItem('session_sov');
    this.currentUser.set(null);
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  getToken(): string | null {
    return this.currentUser()?.token || null;
  }
}
