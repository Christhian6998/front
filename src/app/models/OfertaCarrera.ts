import { Carrera } from "./Carrera"
import { Institucion } from "./Institucion"

export interface OfertaCarrera {
  idOferta?: number
  duracion: number
  costoMatricula: number
  costoPension: number
  modalidad: string
  estado?: boolean
  carrera: Partial<Carrera>
  institucion: Partial<Institucion>
}
