import { clearSessionCookie, headersWithCookies } from './utils';
export async function handleGoogleLogout(_request) {
    return new Response(null, {
        status: 302,
        headers: headersWithCookies({ Location: '/' }, [clearSessionCookie()]),
    });
}
//# sourceMappingURL=logout.js.map