export class ChatStorage {
    env;
    ctx;
    maxMessages;
    constructor(env, ctx, maxMessages = 50) {
        this.env = env;
        this.ctx = ctx;
        this.maxMessages = maxMessages;
    }
    async saveMessage(account, text, attachments) {
        const roomId = this.ctx.id.toString();
        const timestamp = Date.now();
        const result = await this.env.DB.prepare(`
      INSERT INTO messages (room_id, account, text, attachments, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(roomId, account, text, JSON.stringify(attachments), timestamp).run();
        return result.meta.last_row_id;
    }
    async loadRecentMessages() {
        const roomId = this.ctx.id.toString();
        const { results } = await this.env.DB.prepare(`
      SELECT id, account, text, attachments, timestamp
      FROM messages
      WHERE room_id = ?
      ORDER BY id DESC
      LIMIT ?
    `).bind(roomId, this.maxMessages).all();
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
//# sourceMappingURL=storage.js.map