export function preflightResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export function preflightResponseWithOrigin(origin: string) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeadersWithOrigin(origin),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Vary': 'Origin',
    }
  });
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

export function corsHeadersWithOrigin(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

export function jsonWithCors(data: unknown, status = 200) {
  return new Response(typeof data === 'string' ? data : JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': typeof data === 'string' ? 'text/plain' : 'application/json',
      ...corsHeaders()
    },
  });
}
