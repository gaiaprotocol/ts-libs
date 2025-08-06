import { tokenManager } from '@gaiaprotocol/client-common';
import { Attachment, ChatMessage } from '../types/chat';

declare const API_URI: string;

class ChatService extends EventTarget {
  private roomId: string;
  private socket: WebSocket | null = null;
  private reconnectDelay = 3000;
  private stopped = false;

  constructor(roomId: string) {
    super();
    this.roomId = roomId;
  }

  /** WebSocket 연결 시작 */
  connect() {
    this.#connectWS();
  }

  /** 연결 중단(페이지 언마운트 시 호출) */
  disconnect() {
    this.stopped = true;
    this.socket?.close();
  }

  /** 텍스트 메시지 전송 → 서버가 확정한 ChatMessage 반환 */
  async send(text: string, attachments: Attachment[] = [], localId: string): Promise<ChatMessage> {
    const token = tokenManager.getToken();
    const resp = await fetch(`${API_URI}/chat/${this.roomId}/send`, {
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

    const msg: ChatMessage = await resp.json();
    return msg;
  }

  /* ------------------------------------------------------------------ */
  /*                         내부 WebSocket 구현부                        */
  /* ------------------------------------------------------------------ */

  #connectWS() {
    if (this.stopped) return;

    const token = tokenManager.getToken();
    if (!token) {
      this.dispatchEvent(new CustomEvent('error', { detail: new Error('No token') }));
      return;
    }

    const wsUrl = new URL(`${API_URI}/chat/${this.roomId}/stream`, location.origin.replace(/^http/, 'ws'));
    wsUrl.searchParams.set('token', token);

    const socket = new WebSocket(wsUrl.toString());
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.reconnectDelay = 3000; // 연결 성공 시 딜레이 초기화
    });

    socket.addEventListener('message', (e) => {
      try {
        const msg: ChatMessage = JSON.parse(e.data);
        this.dispatchEvent(new CustomEvent('message', { detail: msg }));
      } catch (err) {
        console.error('Invalid message from server:', e.data);
      }
    });

    socket.addEventListener('close', () => {
      if (!this.stopped) this.#scheduleReconnect();
    });

    socket.addEventListener('error', (e) => {
      this.dispatchEvent(new CustomEvent('error', { detail: e }));
      socket.close(); // 에러 시 강제 종료
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
