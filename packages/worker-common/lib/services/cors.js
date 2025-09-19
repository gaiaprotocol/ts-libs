export function preflightResponse() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders()
    });
}
export function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
    };
}
export function jsonWithCors(data, status = 200) {
    return new Response(typeof data === 'string' ? data : JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': typeof data === 'string' ? 'text/plain' : 'application/json',
            ...corsHeaders()
        },
    });
}
//# sourceMappingURL=cors.js.map