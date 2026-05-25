import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401, req)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse(
        { error: 'Supabase environment not configured on edge function' },
        500,
        req,
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return jsonResponse(
        { error: `Unauthorized: ${userError?.message || 'no user'}` },
        401,
        req,
      )
    }

    const { title, description } = await req.json()

    if (!title?.trim()) {
      return jsonResponse({ error: 'Title is required' }, 400, req)
    }

    const muxTokenId = Deno.env.get('MUX_TOKEN_ID')
    const muxTokenSecret = Deno.env.get('MUX_TOKEN_SECRET')

    if (!muxTokenId || !muxTokenSecret) {
      return jsonResponse(
        {
          error:
            'Mux credentials not configured. Add MUX_TOKEN_ID and MUX_TOKEN_SECRET in Supabase → Edge Functions → Secrets, then redeploy mux-upload.',
        },
        500,
        req,
      )
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    // Minimal insert — works even if migration columns are missing
    const { data: video, error: insertError } = await admin
      .from('videos')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        user_id: user.id,
        likes_count: 0,
      })
      .select('id')
      .single()

    if (insertError) {
      return jsonResponse(
        {
          error: `Database insert failed: ${insertError.message}. Run the SQL migration in SETUP.md step 1.`,
        },
        500,
        req,
      )
    }

    const credentials = btoa(`${muxTokenId}:${muxTokenSecret}`)

    const muxResponse = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        cors_origin: Deno.env.get('MUX_CORS_ORIGIN') ?? 'http://localhost:5173',
        new_asset_settings: {
          playback_policy: ['public'],
          passthrough: video.id,
        },
      }),
    })

    const muxBody = await muxResponse.json()

    if (!muxResponse.ok) {
      await admin.from('videos').delete().eq('id', video.id)
      const muxError =
        muxBody?.error?.messages?.join(', ') ||
        muxBody?.error?.type ||
        JSON.stringify(muxBody)
      return jsonResponse({ error: `Mux API error: ${muxError}` }, 500, req)
    }

    const uploadUrl = muxBody.data.url as string
    const uploadId = muxBody.data.id as string

    // Optional columns — ignore errors if migration not applied yet
    await admin
      .from('videos')
      .update({ mux_upload_id: uploadId, status: 'uploading' })
      .eq('id', video.id)

    return jsonResponse({
      uploadUrl,
      videoId: video.id,
      uploadId,
    }, 200, req)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500, req)
  }
})
