import { Recomendacion } from "./Recomendacion"
import { Carrera } from "./Carrera"

export interface RecomendacionCarrera {
  idRecCarrera?: number
  afinidad: number
  recomendacion: Partial<Recomendacion>
  carrera: Partial<Carrera>
}