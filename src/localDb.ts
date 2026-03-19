// src/localDb.ts
// Esta es nuestra base de datos "casera" usando el almacenamiento local del navegador (localStorage).
// Guarda los datos en el navegador del usuario, por lo que no requiere servidores externos como Firebase.

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  sessionId: string;
  createdAt: number;
}

export interface LocalUser {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export const localDb = {
  getChats: (): ChatMessage[] => {
    const data = localStorage.getItem('cosmo_chats');
    return data ? JSON.parse(data) : [];
  },
  saveChat: (chat: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage => {
    const chats = localDb.getChats();
    const newChat: ChatMessage = {
      ...chat,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      createdAt: Date.now(),
    };
    chats.push(newChat);
    localStorage.setItem('cosmo_chats', JSON.stringify(chats));
    return newChat;
  },
  deleteSession: (sessionId: string) => {
    const chats = localDb.getChats();
    const filtered = chats.filter(c => c.sessionId !== sessionId);
    localStorage.setItem('cosmo_chats', JSON.stringify(filtered));
  },
  deleteAllChats: () => {
    localStorage.removeItem('cosmo_chats');
  },
  getUser: (): LocalUser | null => {
    const user = localStorage.getItem('cosmo_user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: LocalUser | null) => {
    if (user) {
      localStorage.setItem('cosmo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cosmo_user');
    }
  }
};
