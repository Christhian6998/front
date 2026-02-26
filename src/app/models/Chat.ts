// Lo que enviamos al Backend
export interface ChatRequest {
  message: string
}

// Lo que recibimos del Backend
export interface ChatResponse {
  response: string
}

// Para manejar el historial en el componente
export interface Message {
  text: string
  sender: 'user' | 'bot'
  date: Date
}