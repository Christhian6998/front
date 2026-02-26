import { Usuario } from "./Usuario"

export interface IntentoTest {
  idIntento?: number
  fecha: Date | string
  numeroIntento: number
  usuario: Partial<Usuario>
}