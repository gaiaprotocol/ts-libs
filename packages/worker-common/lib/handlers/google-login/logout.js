import { corsHeadersWithOrigin } from '../../services/cors';
import { clearSessionCookie, headersWithCookies } from './utils';
export async function handleGoogleLogout(_request, redirectTo = '/', origin) {
    return new Response(null, {
        status: 302,
        headers: {
            ...headersWithCookies({ Location: redirectTo }, [clearSessionCookie()]),
            ...(origin ? corsHeadersWithOrigin(origin) : {})
        },
    });
}
//# sourceMappingURL=logout.js.map