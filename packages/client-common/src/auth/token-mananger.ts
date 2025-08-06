import { getAddress } from 'viem';

class TokenManager {
  readonly TOKEN_KEY = 'token';
  readonly ADDRESS_KEY = 'token_address';

  set(token: string, address: `0x${string}`) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ADDRESS_KEY, getAddress(address));
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
