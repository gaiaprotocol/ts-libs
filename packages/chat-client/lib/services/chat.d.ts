import { Attachment, ChatMessage } from '../types/chat';
declare class ChatService extends EventTarget {
    #private;
    private roomId;
    private socket;
    private reconnectDelay;
    private stopped;
    constructor(roomId: string);
    connect(): void;
    disconnect(): void;
    send(text: string, attachments: Attachment[] | undefined, localId: string): Promise<ChatMessage>;
}
export { ChatMessage, ChatService };
//# sourceMappingURL=chat.d.ts.map