import { WebSocket, WebSocketPair } from '@cloudflare/workers-types';
import { ChatMessage } from './types/chat';

interface Client {
  account: string;
  socket: WebSocket;
}

export class WebSocketManager {
  #clients: Client[] = [];

  handleConnection(socket: WebSocket, account: string, getHistory: () => Promise<ChatMessage[]>) {
    socket.accept();

    const client: Client = { account, socket };
    this.#clients.push(client);

    socket.addEventListener('close', () => {
      this.#clients = this.#clients.filter(c => c !== client);
    });

    socket.addEventListener('error', () => {
      this.#clients = this.#clients.filter(c => c !== client);
    });

    queueMicrotask(async () => {
      const history = await getHistory();
      for (const msg of history) {
        try {
          socket.send(JSON.stringify(msg));
        } catch (err) {
          console.error(`Error sending history to ${account}`, err);
        }
      }
    });
  }

  broadcast(message: ChatMessage) {
    const json = JSON.stringify(message);
    this.#clients.forEach(({ account, socket }) => {
      try {
        socket.send(json);
      } catch (err) {
        console.error(`Failed to send to ${account}`, err);
        socket.close();
      }
    });
  }
}
