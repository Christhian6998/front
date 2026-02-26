export interface Usuario {
  idUsuario?: number
  nombre: string
  apellido: string
  email: string
  direccion: string
  telefono: string
  password?: string
  rol?: string
  consentimiento: boolean
  fechaNacimiento: string
  fechaRegistro?: Date
}