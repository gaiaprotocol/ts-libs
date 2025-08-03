import { verifyToken } from '../services/jwt';

export async function handleValidateToken(request: Request, env: { JWT_SECRET: string }) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = auth.slice(7);

  const payload = await verifyToken(token, env);
  if (!payload) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json({ user: payload });
}
