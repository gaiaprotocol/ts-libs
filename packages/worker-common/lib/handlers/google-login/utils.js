// ---- base64url helpers ----
export function b64urlEncode(input) {
    let bytes;
    if (typeof input === 'string')
        bytes = new TextEncoder().encode(input);
    else if (input instanceof ArrayBuffer)
        bytes = new Uint8Array(input);
    else
        bytes = input;
    let bin = '';
    for (let i = 0; i < bytes.length; i++)
        bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
export function b64urlToBytes(b64url) {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad)
        b64 += '='.repeat(4 - pad);
    const bin = atob(b64);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
export function b64urlDecodeToString(b64url) {
    return new TextDecoder().decode(b64urlToBytes(b64url));
}
// ---- crypto helpers ----
export async function sha256(input) {
    const enc = new TextEncoder();
    const data = input instanceof Uint8Array ? input : enc.encode(input);
    return await crypto.subtle.digest('SHA-256', data);
}
async function importHmacKey(secret) {
    const enc = new TextEncoder();
    return await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function hmacSign(env, data) {
    const key = await importHmacKey(env.COOKIE_SECRET);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return b64urlEncode(sig);
}
export async function hmacVerify(env, data, sigB64Url) {
    const key = await importHmacKey(env.COOKIE_SECRET);
    const sig = b64urlToBytes(sigB64Url);
    return await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data));
}
// ---- cookies ----
export function parseCookies(header) {
    const out = {};
    if (!header)
        return out;
    for (const part of header.split(';')) {
        const [k, v] = part.trim().split('=');
        if (!k)
            continue;
        out[k] = decodeURIComponent(v || '');
    }
    return out;
}
export function makeCookie(name, value, opts = {}) {
    const { httpOnly = true, path = '/', secure = true, sameSite = 'Lax', maxAge, domain } = opts;
    let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
    if (domain)
        cookie += `; Domain=${domain}`;
    if (secure)
        cookie += '; Secure';
    if (httpOnly)
        cookie += '; HttpOnly';
    if (maxAge != null)
        cookie += `; Max-Age=${maxAge}`;
    return cookie;
}
export function headersWithCookies(base, cookies = []) {
    const h = new Headers(base);
    for (const c of cookies)
        h.append('Set-Cookie', c);
    return h;
}
// ---- session ----
export async function makeSessionCookie(env, user, request, opts) {
    const ttlDays = Number(env.SESSION_TTL_DAYS || 7);
    const exp = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
    const payload = b64urlEncode(JSON.stringify({ exp, user }));
    const sig = await hmacSign(env, payload);
    const url = new URL(request.url);
    const secure = url.protocol === 'https:';
    return makeCookie('session', `${payload}.${sig}`, {
        maxAge: ttlDays * 24 * 60 * 60,
        secure,
        sameSite: opts?.sameSite ?? 'Lax',
        domain: opts?.domain,
    });
}
export async function readSession(env, request) {
    const cookies = parseCookies(request.headers.get('Cookie'));
    const raw = cookies['session'];
    if (!raw)
        return null;
    const [payload, sig] = raw.split('.');
    if (!payload || !sig)
        return null;
    const ok = await hmacVerify(env, payload, sig).catch(() => false);
    if (!ok)
        return null;
    let json;
    try {
        json = b64urlDecodeToString(payload);
    }
    catch {
        return null;
    }
    const data = JSON.parse(json);
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000))
        return null;
    return data.user;
}
export function clearSessionCookie() {
    return makeCookie('session', '', { maxAge: 0 });
}
export function zParse(schema, input) {
    const parsed = schema.safeParse(input);
    if (!parsed.success)
        throw new Error(parsed.error.message);
    return parsed.data;
}
//# sourceMappingURL=utils.js.map