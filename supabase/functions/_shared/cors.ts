const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://if-ts-doesn-t-work-im-gay.vercel.app',
  'https://if-ts-doesn-t-work-im-gay-castrix-codes-projects.vercel.app',
]

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') ?? ''
  if (ALLOWED_ORIGINS.includes(origin)) return origin
  // Also allow any Vercel preview deployment
  if (origin.includes('vercel.app')) return origin
  return ALLOWED_ORIGINS[0]
}

export function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  }
}

export function jsonResponse(body: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req ?? new Request('')), 'Content-Type': 'application/json' },
  })
}
