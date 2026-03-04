import { Component, signal } from '@angular/core';
import { Message } from '../../models/Chat';
import { chatService } from '../../services/chat';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatStateService } from '../../services/chat-state';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  userInput = '';
  isLoading = false;
  isOpen = false;

  constructor(
    private chatService: chatService,
    public chatState: ChatStateService
  ) {
    this.chatState.initIfEmpty();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  send() {
    if (!this.userInput.trim()) return;

    const input = this.userInput;
    this.userInput = '';
    this.isLoading = true;

    this.chatState.add({
      text: input,
      sender: 'user',
      date: new Date()
    });

    this.chatService.sendMessage(input).subscribe({
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
  }
}