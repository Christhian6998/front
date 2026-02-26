export interface RespuestaItemDTO {
  idPregunta: number
  valor: string
  puntaje: number
}

export interface TestRequestDTO {
  idUsuario: number
  respuestas: RespuestaItemDTO[]
}