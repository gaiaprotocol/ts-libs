import { JwtPayload } from '@tsndr/cloudflare-worker-jwt';
declare function generateToken(address: string, env: {
    JWT_SECRET: string;
}): Promise<string>;
declare function verifyToken(token: string, env: {
    JWT_SECRET: string;
}): Promise<JwtPayload | undefined>;
export { generateToken, verifyToken };
//# sourceMappingURL=jwt.d.ts.map