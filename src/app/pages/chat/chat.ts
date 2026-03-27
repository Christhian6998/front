import { Component, signal } from '@angular/core';
import { Message } from '../../models/Chat';
import { chatService } from '../../services/chat';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatStateService } from '../../services/chat-state';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  userInput = '';
  isLoading = false;
  isOpen = false;
  userId='';

  constructor(
    private chatService: chatService,
    public chatState: ChatStateService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.chatState.initIfEmpty();
    this.syncUserSession();
  }

  private syncUserSession(forceNew = false) {

    if (this.authService.isAuthenticated()) {
      const email = this.authService.email();
      const id = this.authService.userId();
      this.userId = 'user-'+id+'-'+email;
      sessionStorage.setItem('chat_user_id', this.userId);
      return;
    }
    
    const savedId = sessionStorage.getItem('chat_user_id');
    
    if (savedId && !forceNew) {
      this.userId = savedId;
    } else {
      this.userId = 'anonimo-'+crypto.randomUUID();
      sessionStorage.setItem('chat_user_id', this.userId);
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  send() {
    if (!this.userInput.trim()) return;

    this.syncUserSession();
    
    const input = this.userInput;
    this.userInput = '';
    this.isLoading = true;

    this.chatState.add({
      text: input,
      sender: 'user',
      date: new Date()
    });

    this.chatService.sendMessage(input,this.userId).subscribe({
      next: res => {
        this.isLoading = false;
        this.chatState.add({
          text: res.respuesta,
          sender: 'bot',
          date: new Date()
        });
      },
      error: () => {
        this.isLoading = false;
        this.chatState.add({
          text: '⚠️ Servicio no disponible en este momento.',
          sender: 'bot',
          date: new Date()
        });
      }
    });
  }

  newChat() {
    this.chatState.reset();
    this.syncUserSession(true);
  }
}