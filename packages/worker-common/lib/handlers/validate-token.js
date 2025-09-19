import { jsonWithCors } from '../services/cors';
import { verifyToken } from '../services/jwt';
export async function handleValidateToken(request, env) {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
        return jsonWithCors('Unauthorized', 401);
    }
    const token = auth.slice(7);
    const payload = await verifyToken(token, env);
    if (!payload) {
        return jsonWithCors('Unauthorized', 401);
    }
    return jsonWithCors({ user: payload });
}
//# sourceMappingURL=validate-token.js.map