import { EventEmitter } from '@webtaku/event-emitter';
import { getAddress } from 'viem';

class TokenManager extends EventEmitter<{
  signedIn: (address: string) => void;
  signedOut: () => void;
}> {
  readonly TOKEN_KEY = 'token';
  readonly ADDRESS_KEY = 'token_address';

  constructor() { super(); }

  set(token: string, address: `0x${string}`) {
    localStorage.setItem(this.TOKEN_KEY, token);
    const addr = getAddress(address);
    localStorage.setItem(this.ADDRESS_KEY, addr);
    this.emit('signedIn', addr);
  }

  getToken(): string | undefined {
    return localStorage.getItem(this.TOKEN_KEY) ?? undefined;
  }

  getAddress(): `0x${string}` | undefined {
    return localStorage.getItem(this.ADDRESS_KEY) as `0x${string}` ?? undefined;
  }

  clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ADDRESS_KEY);
    this.emit('signedOut');
  }

  has(): boolean {
    return !!this.getToken();
  }

  isMatchedWith(currentAddress: `0x${string}`): boolean {
    const saved = this.getAddress();
    return saved !== undefined && saved === getAddress(currentAddress);
  }
}

const tokenManager = new TokenManager();

export { tokenManager };
