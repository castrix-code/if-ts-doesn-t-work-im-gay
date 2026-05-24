import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const isValid = await verifyMuxSignature(req)
    if (!isValid) {
      return jsonResponse({ error: 'Invalid webhook signature' }, 403)
    }

    const body = await req.json()
    const eventType = body.type as string
    const data = body.data

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (eventType === 'video.upload.asset_created') {
      const uploadId = data.upload_id as string
      const assetId = data.asset_id as string

      await admin
        .from('videos')
        .update({ mux_asset_id: assetId, status: 'processing' })
        .eq('mux_upload_id', uploadId)
    }

    if (eventType === 'video.asset.ready') {
      const assetId = data.id as string
      const passthrough = data.passthrough as string | undefined
      const playbackId = data.playback_ids?.[0]?.id as string | undefined

      if (!playbackId) {
        return jsonResponse({ error: 'No playback ID in webhook' }, 400)
      }

      const updates = {
        mux_asset_id: assetId,
        mux_playback_id: playbackId,
        status: 'ready',
      }

      if (passthrough) {
        await admin.from('videos').update(updates).eq('id', passthrough)
      } else {
        await admin.from('videos').update(updates).eq('mux_asset_id', assetId)
      }
    }

    if (eventType === 'video.asset.errored') {
      const passthrough = data.passthrough as string | undefined
      if (passthrough) {
        await admin.from('videos').update({ status: 'error' }).eq('id', passthrough)
      }
    }

    return jsonResponse({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500)
  }
})
