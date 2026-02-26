import { Pregunta } from "./Pregunta"
import { IntentoTest } from "./IntentoTest"

export interface Respuesta {
  idRespuesta?: number
  valor: string
  puntaje: number
  pregunta: Partial<Pregunta>
  intento: Partial<IntentoTest>
}