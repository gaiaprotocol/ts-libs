export declare function verifyGoogleIdJwt(idToken: string, expectedAud: string, expectedNonce?: string): Promise<any>;
export declare function handleOAuth2Verify(request: Request, env: {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REDIRECT_URI: string;
    SESSION_TTL_DAYS: string;
    COOKIE_SECRET: string;
}): Promise<Response>;
//# sourceMappingURL=oauth2-verify.d.ts.map