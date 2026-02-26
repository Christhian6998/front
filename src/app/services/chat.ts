import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatRequest, ChatResponse } from '../models/Chat';

@Injectable({
  providedIn: 'root',
})
export class chatService {
  private apiUrl = 'http://localhost:8000/chat';

  constructor(private http: HttpClient) { }

  sendMessage(message: string): Observable<ChatResponse> {
    const body: ChatRequest = { message };
    return this.http.post<ChatResponse>(this.apiUrl, body);
  }
}
