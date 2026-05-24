export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://if-ts-doesn-t-work-im-gay.vercel.app/',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
