import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../../models/Usuario';
import { UsuarioService } from '../../../services/usuario';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-usuario.html',
  styleUrl: './gestion-usuario.css',
})
export class GestionUsuario {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  usuariosPaginados: Usuario[] = [];

  searchTerm: string = '';
  soloConsentimiento: boolean = false;

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  isModalOpen: boolean = false;
  usuarioEdit: any = {};
  pass1: string = '';
  pass2: string = '';

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    const request = this.soloConsentimiento 
      ? this.usuarioService.listarConConsentimiento()
      : this.usuarioService.listarUsuarios();

    request.subscribe((data) => {
      this.usuarios = data;
      this.aplicarFiltros();
    });
    this.cdr.detectChanges(); 
  }

  toggleConsentimiento() {
    this.soloConsentimiento = !this.soloConsentimiento;
    this.searchTerm = '';
    this.currentPage = 1;
    this.cargarUsuarios();
  }

  aplicarFiltros() {
    const term = this.searchTerm.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(
      (u) =>
        u.nombre.toLowerCase().includes(term) ||
        u.apellido.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.telefono.includes(term) ||
        (u.fechaNacimiento && u.fechaNacimiento.includes(term))
    );
    this.totalPages = Math.ceil(this.usuariosFiltrados.length / this.itemsPerPage) || 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.usuariosPaginados = this.usuariosFiltrados.slice(start, end);
    this.cdr.detectChanges(); 
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.actualizarPaginacion();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.actualizarPaginacion();
    }
  }

  abrirModal(u: Usuario) {
    this.usuarioEdit = { ...u };

    if (this.usuarioEdit.fechaNacimiento) {
      this.usuarioEdit.fechaNacimiento = this.usuarioEdit.fechaNacimiento.toString().substring(0, 10);
    }
    
    this.pass1 = ''; 
    this.pass2 = ''; 
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.usuarioEdit = {};
    this.cdr.detectChanges();
  }

  guardarCambios() {
    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(this.usuarioEdit.telefono)) {
      Swal.fire('Formato Inválido', 'El teléfono debe iniciar con 9 y tener exactamente 9 dígitos', 'error');
      return;
    }
    if (!this.usuarioEdit.fechaNacimiento || !this.validarEdad(this.usuarioEdit.fechaNacimiento)) {
      Swal.fire('Edad no permitida', 'El usuario debe tener entre 14 y 25 años.', 'error');
      return;
    }

    this.usuarioEdit.email = this.usuarioEdit.email.toLowerCase();

    if (this.pass1 || this.pass2) {
      if (this.pass1.length < 6) {
        Swal.fire('Seguridad', 'La nueva contraseña debe tener mínimo 6 caracteres.', 'warning');
        return;
      }
      if (this.pass1 !== this.pass2) {
        Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
        return;
      }
      this.usuarioEdit.password = this.pass1;
    } else {
      delete this.usuarioEdit.password;
    }

    this.usuarioService.actualizarUsuario(this.usuarioEdit.idUsuario, this.usuarioEdit).subscribe({
      next: () => {
        Swal.fire('¡Actualizado!', 'Datos guardados con éxito', 'success');
        this.isModalOpen=false;
        this.cargarUsuarios();
        this.cdr.detectChanges();
      },
      error: (e) => Swal.fire('Error', e.error || 'No se pudo actualizar', 'error')
    });
  }

  eliminar(u:Usuario) {
    if (!u.idUsuario) return;

    if (u.rol === 'ADMIN') {
      Swal.fire('Acción denegada', 'No se pueden eliminar usuarios con rol ADMINISTRADOR.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.eliminarUsuario(u.idUsuario!).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
            this.cargarUsuarios();
          },
          error: (err) => {
            Swal.fire('Error', 'Hubo un problema al eliminar', 'error');
            console.error(err);
          }
        });
      }
    });
  }

  validarEdad(fecha: string): boolean {
    const born = new Date(fecha);
    const today = new Date();
    let age = today.getFullYear() - born.getFullYear();
    const monthDiff = today.getMonth() - born.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
      age--;
    }
    return age >= 14 && age <= 25;
  }
}
