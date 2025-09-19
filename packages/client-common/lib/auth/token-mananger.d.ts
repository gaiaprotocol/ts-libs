import { EventEmitter } from '@webtaku/event-emitter';
declare class TokenManager extends EventEmitter<{
    signedIn: (address: string) => void;
    signedOut: () => void;
}> {
    readonly TOKEN_KEY = "token";
    readonly ADDRESS_KEY = "token_address";
    constructor();
    set(token: string, address: `0x${string}`): void;
    getToken(): string | undefined;
    getAddress(): `0x${string}` | undefined;
    clear(): void;
    has(): boolean;
    isMatchedWith(currentAddress: `0x${string}`): boolean;
}
declare const tokenManager: TokenManager;
export { tokenManager };
//# sourceMappingURL=token-mananger.d.ts.map