import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Sedes } from './pages/sedes/sedes';
import { Auth } from './pages/auth/auth';
import { Registro } from './pages/registro/registro';
import { RoleGuard } from './guards/role-guard';
import { GestionOferta } from './pages/admin/gestion-oferta/gestion-oferta';
import { Comparador } from './pages/comparador/comparador';
import { GestionPregunta } from './pages/admin/gestion-pregunta/gestion-pregunta';
import { TestComponent } from './pages/postulante/test/test';
import { HistorialTest } from './pages/postulante/historial-test/historial-test';
import { GestionUsuario } from './pages/admin/gestion-usuario/gestion-usuario';
import { ActualizarPerfil } from './pages/postulante/actualizar-perfil/actualizar-perfil';

export const routes: Routes = [
    //Rutas publicas
    { path: '', component: Home },
    { path: 'home', component: Home },
    { path: 'sedes', component: Sedes },
    { path: 'login', component: Auth },
    { path: 'registro', component: Registro },
    { path: 'comparador', component: Comparador },

    //Rutas postulantes
    {path: 'test', component: TestComponent, canActivate: [RoleGuard], data: { role: 'POSTULANTE' }},
    { path: 'historial', component: HistorialTest, canActivate: [RoleGuard], data: { role: 'POSTULANTE' } },
    { path: 'perfil', component: ActualizarPerfil, canActivate: [RoleGuard], data: { role: 'POSTULANTE' } },

    //Rutas Admin
    { path: 'gestionOferta', component: GestionOferta, canActivate: [RoleGuard], data: { role: 'ADMIN' } },
    { path: 'gestionPregunta', component: GestionPregunta, canActivate: [RoleGuard], data: { role: 'ADMIN' } },
    { path: 'gestionUsuario', component: GestionUsuario, canActivate: [RoleGuard], data: { role: 'ADMIN' } }
];
