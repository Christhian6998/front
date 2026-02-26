import { Criterio } from "./Criterio"

export interface Pregunta {
  idPregunta?: number
  enunciado: string
  area: string
  peso: number
  fase: number
  estado?: boolean
  criterio: Partial<Criterio>
}