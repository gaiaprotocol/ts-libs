import { D1Database, DurableObjectState } from '@cloudflare/workers-types';
import { Attachment, ChatMessage } from './types/chat';
export declare class ChatStorage {
    private env;
    private ctx;
    private maxMessages;
    constructor(env: {
        DB: D1Database;
    }, ctx: DurableObjectState, maxMessages?: number);
    saveMessage(account: string, text: string, attachments: Attachment[]): Promise<number>;
    loadRecentMessages(): Promise<ChatMessage[]>;
}
//# sourceMappingURL=storage.d.ts.map