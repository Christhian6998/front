import { IntentoTest } from "./IntentoTest"

export interface Recomendacion {
  idRecomendacion?: number
  perfil: string
  fechaRegistrada: Date | string
  intento: Partial<IntentoTest>
}