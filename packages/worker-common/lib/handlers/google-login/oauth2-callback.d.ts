export declare function handleOAuth2Callback(request: Request, env: {
    COOKIE_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    SESSION_TTL_DAYS: string;
}, redirectUri: string, redirectTo?: string): Promise<Response>;
//# sourceMappingURL=oauth2-callback.d.ts.map