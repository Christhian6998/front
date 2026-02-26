import { Injectable, signal } from '@angular/core';
import { Message } from '../models/Chat';

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  messages = signal<Message[]>([]);

  constructor() {
    const saved = sessionStorage.getItem('chat_messages');
    if (saved) {
      this.messages.set(JSON.parse(saved));
    }
  }

  add(msg: Message) {
    this.messages.update(list => {
      const updated = [...list, msg];
      sessionStorage.setItem('chat_messages', JSON.stringify(updated));
      return updated;
    });
  }

  initIfEmpty() {
    if (this.messages().length === 0) {
      this.add({
        text: '¡Hola! Soy tu orientador 🚀 Estoy aquí para ayudarte.',
        sender: 'bot',
        date: new Date()
      });
    }
  }

  clear() {
    this.messages.set([]);
    sessionStorage.removeItem('chat_messages');
  }
  reset() {
    this.messages.set([]);
    sessionStorage.removeItem('chat_messages');

    this.initIfEmpty();
  }

}
