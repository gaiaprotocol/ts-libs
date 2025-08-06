import { D1Database, DurableObjectState } from '@cloudflare/workers-types';
import { Attachment, ChatMessage } from './types/chat';

export class ChatStorage {
  constructor(private env: { DB: D1Database }, private ctx: DurableObjectState, private maxMessages = 50) { }

  async saveMessage(account: string, text: string, attachments: Attachment[]) {
    const roomId = this.ctx.id.toString();
    const timestamp = Date.now();

    const result = await this.env.DB.prepare(`
      INSERT INTO messages (room_id, account, text, attachments, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(roomId, account, text, JSON.stringify(attachments), timestamp).run();

    return result.meta.last_row_id;
  }

  async loadRecentMessages(): Promise<ChatMessage[]> {
    const roomId = this.ctx.id.toString();

    const { results } = await this.env.DB.prepare(`
      SELECT id, account, text, attachments, timestamp
      FROM messages
      WHERE room_id = ?
      ORDER BY id DESC
      LIMIT ?
    `).bind(roomId, this.maxMessages).all<{
      id: number;
      account: string;
      text: string;
      attachments: string;
      timestamp: number;
    }>();

    return results.reverse().map(row => ({
      id: row.id,
      type: 'chat',
      account: row.account,
      text: row.text,
      attachments: JSON.parse(row.attachments),
      timestamp: row.timestamp,
    }));
  }
}
