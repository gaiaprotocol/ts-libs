import { tokenManager } from '@gaiaprotocol/client-common';
import { Attachment, ChatMessage } from '../types/chat';

declare const API_BASE_URI: string;

type InitPayload = { type: 'init'; messages: ChatMessage[] };

class ChatService extends EventTarget {
  private roomId: string;
  private socket: WebSocket | null = null;
  private reconnectDelay = 3000;
  private stopped = false;

  constructor(roomId: string) {
    super();
    this.roomId = roomId;
  }

  /* -------------------------- public -------------------------- */
  connect() {
    this.#connectWS();
  }

  disconnect() {
    this.stopped = true;
    this.socket?.close();
  }

  async send(text: string, attachments: Attachment[] = [], localId: string): Promise<ChatMessage> {
    const token = tokenManager.getToken();
    const resp = await fetch(`${API_BASE_URI}/chat/${this.roomId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, attachments, localId }),
    });

    if (!resp.ok) {
      const err = new Error(`Send failed ${resp.status}`);
      this.dispatchEvent(new CustomEvent('error', { detail: err }));
      throw err;
    }

    return resp.json() as Promise<ChatMessage>;
  }

  /* ---------------------- private helpers --------------------- */
  #connectWS() {
    if (this.stopped) return;

    const token = tokenManager.getToken();
    if (!token) {
      this.dispatchEvent(new CustomEvent('error', { detail: new Error('No token') }));
      return;
    }

    const wsUrl = new URL(
      `${API_BASE_URI}/chat/${this.roomId}/stream`,
      location.origin.replace(/^http/, 'ws'),
    );
    wsUrl.searchParams.set('token', token);

    const socket = new WebSocket(wsUrl.toString());
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.reconnectDelay = 3000;
    });

    socket.addEventListener('message', (ev) => {
      try {
        const data = JSON.parse(ev.data) as InitPayload | ChatMessage;
        if ('type' in data && data.type === 'init') {
          // History batch from server
          this.dispatchEvent(new CustomEvent('init', { detail: data.messages }));
        } else {
          this.dispatchEvent(new CustomEvent('message', { detail: data as ChatMessage }));
        }
      } catch (err) {
        console.error('Invalid WS payload', ev.data);
      }
    });

    socket.addEventListener('close', () => {
      if (!this.stopped) this.#scheduleReconnect();
    });

    socket.addEventListener('error', (e) => {
      this.dispatchEvent(new CustomEvent('error', { detail: e }));
      socket.close();
    });
  }

  #scheduleReconnect() {
    if (this.stopped) return;
    setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 60000);
      this.#connectWS();
    }, this.reconnectDelay);
  }
}

export { ChatMessage, ChatService };