import { WebSocket } from '@cloudflare/workers-types';
import { ChatMessage } from './types/chat';
export declare class WebSocketManager {
    #private;
    handleConnection(socket: WebSocket, account: string, getHistory: () => Promise<ChatMessage[]>): void;
    broadcast(message: ChatMessage): void;
}
//# sourceMappingURL=websocket.d.ts.map