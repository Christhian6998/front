import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Ubicacion {
  constructor(private http: HttpClient) {}

  buscarEnLima(direccion: string) {
    // Coordenadas aproximadas de Lima Metropolitana 
    // viewbox=lon1,lat1,lon2,lat2 (Oeste, Norte, Este, Sur)
    const viewbox = '-77.20,-11.70,-76.70,-12.30';

    // bounded=1 obliga a buscar solo dentro de ese cuadro si es posible
    const url = `https://nominatim.openstreetmap.org/search?q=${direccion}, Lima&format=json&limit=1&addressdetails=1&viewbox=${viewbox}&bounded=1`;
    
    return this.http.get<any[]>(url).pipe(
      map(results => {
        if (results.length > 0) {
          const res = results[0];
          // Verificamos que el resultado contenga "Lima" en su nombre o dirección
          if (res.display_name.toLowerCase().includes('lima')) {
            return { lat: parseFloat(res.lat), lng: parseFloat(res.lon) };
          }
        }
        return null;
      })
    );
  }
}
