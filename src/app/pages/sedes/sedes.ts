import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Ubicacion } from '../../services/ubicacion';
import Swal from 'sweetalert2';
import { SedeService } from '../../services/sede';
import { InstitucionService } from '../../services/institucion';

const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-sedes',
  imports: [CommonModule, FormsModule],
  templateUrl: './sedes.html',
  styleUrl: './sedes.css',
})
export class Sedes {
  map!: L.Map;
  userMarker?: L.Marker;
  circleUbicacion?: L.Circle;
  rutaCercana?: L.Polyline; // Para dibujar la línea a la sede
  mensajeResultado: string = '';
  direccionUsuario: string = '';
  entidadSeleccionada: string = '';
  instituciones: any[] = [];
  sedes: any[] = [];
  filteredSedes: any[] = [];

  // Grupo para limpiar marcadores de sedes fácilmente
  private sedesLayer = L.layerGroup();
  private rutaLayer = L.layerGroup();

  constructor(
    private geoService: Ubicacion,
    private cdr: ChangeDetectorRef,
    private sedeService:SedeService,
    private institucionService:InstitucionService
  ) {}

  ngOnInit() {
    this.initMap();
    this.cargarInstituciones();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove(); // Destruye el mapa al salir de la vista
    }
  }

  initMap() {
    this.map = L.map('map').setView([-12.0463, -77.0427], 11); // Centro de Lima
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    this.sedesLayer.addTo(this.map);
    this.rutaLayer.addTo(this.map);
  }

  onEntidadChange() {
    if (!this.entidadSeleccionada) {
      this.filteredSedes = [];
      this.actualizarMarcadores();
      return;
    }

    // Mostramos un pequeño loading silencioso
    this.sedeService
      .listarPorInstitucion(Number(this.entidadSeleccionada))
      .subscribe({
        next: (data: any[]) => {
          // Mapeo robusto: Verificamos si existe s.institucion para evitar errores
          this.filteredSedes = data.map(s => ({
            nombre: s.institucion ? s.institucion.nombre : 'Institución',
            sede: s.nombre,
            lat: s.latitud,
            lng: s.longitud
          }));

          this.actualizarMarcadores();
          
          // Ajustar la vista del mapa para ver todos los marcadores de las sedes
          if (this.filteredSedes.length > 0) {
            const group = L.featureGroup(this.filteredSedes.map(s => L.marker([s.lat, s.lng])));
            this.map.fitBounds(group.getBounds().pad(0.1));
          }

          this.cdr.detectChanges(); // Forzar actualización de la vista
        },
        error: (err) => {
          console.error("Error cargando sedes:", err);
          Swal.fire('Error', 'No se pudieron cargar las sedes de esta institución', 'error');
        }
      });
  }

  cargarInstituciones() {
    this.institucionService.listarInstitucionesActivas().subscribe({
      next: (data) => {
        this.instituciones = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error instituciones:", err)
    });
  }


  actualizarMarcadores() {
    // Limpia SOLO los marcadores de las sedes
    this.sedesLayer.clearLayers(); 

    this.filteredSedes.forEach(sede => {
      L.marker([sede.lat, sede.lng])
        .addTo(this.sedesLayer) // Agrégalo al grupo, no al mapa directo
        .bindPopup('<b>'+sede.nombre+'</b><br>'+sede.sede);
    });
  }

  buscarDireccion() {
    if (!this.entidadSeleccionada) {
      Swal.fire('Aviso', 'Selecciona una sede primero.', 'info');
      return;
    }
    
    // Limpiamos el mensaje viejo para que no confunda
    this.mensajeResultado = '';
    this.cdr.detectChanges(); // Forzamos que desaparezca el texto viejo
    
    // VALIDACIÓN INICIAL: Si no hay sede, avisamos de inmediato sin cargar nada
    if (!this.entidadSeleccionada) {
      Swal.fire({
        title: '¡Falta un paso!',
        text: 'Primero selecciona una universidad o instituto para calcular la distancia.',
        icon: 'info',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    if (!this.direccionUsuario) return;
    
    Swal.fire({
      title: 'Buscando ubicación...',
      text: 'Validando dirección en Lima Metropolitana',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.geoService.buscarEnLima(this.direccionUsuario).subscribe({
      next: (coords) => {
        if (coords) {
          // Ejecutamos el procesamiento
          this.procesarUbicacionUsuario(coords.lat, coords.lng);
          // Cerramos el loading justo después de que la variable mensajeResultado cambie
          setTimeout(() => Swal.close(), 100); 
        } else {
          Swal.close();
          Swal.fire('Ubicación no encontrada', 'Intenta ser más específico con el distrito.', 'error');
        }
      },
      error: () => {
        Swal.close();
        Swal.fire('Error', 'Hubo un problema con el servicio de mapas', 'error');
      }
    });
  }

  procesarUbicacionUsuario(lat: number, lng: number) {
    const userLatLng = L.latLng(lat, lng);
    
    // 1. Limpieza de capas
    this.rutaLayer.clearLayers();
    if (this.circleUbicacion) this.map.removeLayer(this.circleUbicacion);
    if (this.userMarker) this.map.removeLayer(this.userMarker);

    if (this.filteredSedes.length > 0) {
      let masCercana = this.filteredSedes[0];
      let distMin = Infinity;

      this.filteredSedes.forEach(sede => {
        const d = userLatLng.distanceTo(L.latLng(sede.lat, sede.lng));
        if (d < distMin) {
          distMin = d;
          masCercana = sede;
        }
      });

      const distanciaKm = (distMin / 1000).toFixed(2);
      
      // 2. ACTUALIZACIÓN CRÍTICA
      // Asignamos el mensaje
      this.mensajeResultado = `La sede de ${masCercana.nombre} más cercana a ti es ${masCercana.sede} a unos ${distanciaKm} km aproximadamente.`;
      
      // 3. FORZAR RENDERIZADO
      // Esto obliga a Angular a mostrar el mensaje nuevo AHORA MISMO
      this.cdr.detectChanges(); 

      // 4. Dibujar en el mapa
      const puntosRuta = [userLatLng, L.latLng(masCercana.lat, masCercana.lng)];
      L.polyline(puntosRuta, {
        color: '#6366f1',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.6
      }).addTo(this.rutaLayer);

      this.map.fitBounds(L.polyline(puntosRuta).getBounds(), { padding: [50, 50] });
    }
  }

  obtenerUbicacionActual() {
    // VALIDACIÓN INICIAL
    if (!this.entidadSeleccionada) {
      Swal.fire('¡Aviso!', 'Selecciona una sede antes de usar tu GPS.', 'info');
      return;
    }

    if (navigator.geolocation) {
      Swal.fire({
        title: 'Obteniendo GPS...',
        text: 'Estamos localizando tu posición actual',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.procesarUbicacionUsuario(pos.coords.latitude, pos.coords.longitude);
          setTimeout(() => Swal.close(), 100);
        },
        () => {
          Swal.close();
          Swal.fire('Error de GPS', 'Asegúrate de tener el GPS activo.', 'warning');
        }
      );
    }
  }
}
