import { Institucion } from "./Institucion"

export interface Sede {
  idSede?: number
  nombre: string
  direccion: string
  longitud: number
  latitud: number
  estado?: boolean
  institucion: Partial<Institucion>
}
