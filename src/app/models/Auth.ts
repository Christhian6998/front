export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  rol: string
  email: string
  id: number
}