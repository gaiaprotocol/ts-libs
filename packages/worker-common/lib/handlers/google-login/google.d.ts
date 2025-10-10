export declare function googleAuthURL({ clientId, redirectUri, scope, codeChallenge, state, accessType, prompt }: {
    clientId: string;
    redirectUri: string;
    scope: string;
    codeChallenge: string;
    state: string;
    accessType?: 'online' | 'offline';
    prompt?: 'consent' | 'none' | 'select_account' | 'consent select_account';
}): string;
export declare function exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri, codeVerifier }: {
    code: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    codeVerifier: string;
}): Promise<any>;
export declare function decodeJwtPayload(idToken?: string): any;
export declare function makePkce(): Promise<{
    state: string;
    codeVerifier: string;
    challenge: string;
}>;
//# sourceMappingURL=google.d.ts.map