import jwt from '@tsndr/cloudflare-worker-jwt';
async function generateToken(address, env) {
    const payload = {
        sub: address,
        iat: Math.floor(Date.now() / 1000),
    };
    const token = await jwt.sign(payload, env.JWT_SECRET);
    return token;
}
async function verifyToken(token, env) {
    const valid = await jwt.verify(token, env.JWT_SECRET);
    if (!valid)
        return undefined;
    const { payload } = jwt.decode(token);
    return payload;
}
export { generateToken, verifyToken };
//# sourceMappingURL=jwt.js.map