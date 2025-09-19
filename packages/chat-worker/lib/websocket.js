export class WebSocketManager {
    #clients = [];
    handleConnection(socket, account, getHistory) {
        socket.accept();
        const client = { account, socket };
        this.#clients.push(client);
        socket.addEventListener('close', () => {
            this.#clients = this.#clients.filter((c) => c !== client);
        });
        socket.addEventListener('error', () => {
            this.#clients = this.#clients.filter((c) => c !== client);
        });
        queueMicrotask(async () => {
            try {
                const history = await getHistory();
                socket.send(JSON.stringify({ type: 'init', messages: history }));
            }
            catch (err) {
                console.error(`Error sending history to ${account}`, err);
            }
        });
    }
    broadcast(message) {
        const json = JSON.stringify(message);
        this.#clients.forEach(({ socket, account }) => {
            try {
                socket.send(json);
            }
            catch (err) {
                console.error(`Failed to send to ${account}`, err);
                socket.close();
            }
        });
    }
}
//# sourceMappingURL=websocket.js.map