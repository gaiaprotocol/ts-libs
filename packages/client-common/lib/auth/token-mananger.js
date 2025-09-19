import { EventEmitter } from '@webtaku/event-emitter';
import { getAddress } from 'viem';
class TokenManager extends EventEmitter {
    TOKEN_KEY = 'token';
    ADDRESS_KEY = 'token_address';
    constructor() { super(); }
    set(token, address) {
        localStorage.setItem(this.TOKEN_KEY, token);
        const addr = getAddress(address);
        localStorage.setItem(this.ADDRESS_KEY, addr);
        this.emit('signedIn', addr);
    }
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) ?? undefined;
    }
    getAddress() {
        return localStorage.getItem(this.ADDRESS_KEY) ?? undefined;
    }
    clear() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.ADDRESS_KEY);
        this.emit('signedOut');
    }
    has() {
        return !!this.getToken();
    }
    isMatchedWith(currentAddress) {
        const saved = this.getAddress();
        return saved !== undefined && saved === getAddress(currentAddress);
    }
}
const tokenManager = new TokenManager();
export { tokenManager };
//# sourceMappingURL=token-mananger.js.map