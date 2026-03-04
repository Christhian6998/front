// Lo que enviamos al Backend
export interface ChatRequest {
  mensaje: string
}

// Lo que recibimos del Backend
export interface ChatResponse {
  respuesta: string
}

// Para manejar el historial en el componente
export interface Message {
  text: string
  sender: 'user' | 'bot'
  date: Date
}