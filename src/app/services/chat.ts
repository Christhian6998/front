import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatRequest, ChatResponse } from '../models/Chat';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class chatService {
  private apiUrl = environment.apiChat+'/chat';

  constructor(private http: HttpClient) { }

  sendMessage(mensaje: string): Observable<ChatResponse> {
    const body: ChatRequest = { mensaje };
    return this.http.post<ChatResponse>(this.apiUrl, body);
  }
}
