import { z } from 'zod';
export declare function b64urlEncode(input: string | ArrayBuffer | Uint8Array): string;
export declare function b64urlToBytes(b64url: string): Uint8Array;
export declare function b64urlDecodeToString(b64url: string): string;
export declare function sha256(input: string | Uint8Array): Promise<ArrayBuffer>;
export declare function hmacSign(env: {
    COOKIE_SECRET: string;
}, data: string): Promise<string>;
export declare function hmacVerify(env: {
    COOKIE_SECRET: string;
}, data: string, sigB64Url: string): Promise<boolean>;
export declare function parseCookies(header?: string | null): Record<string, string>;
export declare function makeCookie(name: string, value: string, opts?: {
    httpOnly?: boolean;
    path?: string;
    secure?: boolean;
    sameSite?: 'Lax' | 'Strict' | 'None';
    maxAge?: number;
    domain?: string;
}): string;
export declare function headersWithCookies(base?: HeadersInit, cookies?: string[]): Headers;
export declare function makeSessionCookie(env: {
    SESSION_TTL_DAYS: string;
    COOKIE_SECRET: string;
}, user: any, request: Request, opts?: {
    sameSite?: 'Lax' | 'None';
    domain?: string;
}): Promise<string>;
export declare function readSession(env: {
    COOKIE_SECRET: string;
}, request: Request): Promise<any>;
export declare function clearSessionCookie(): string;
export declare function zParse<T>(schema: z.ZodType<T>, input: unknown): T;
//# sourceMappingURL=utils.d.ts.map