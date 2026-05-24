# Atom — Setup Guide

## 1. Database migration

In [Supabase SQL Editor](https://supabase.com/dashboard), run **both** files in order:

1. `supabase/migrations/20250323000000_atom_mux_quiz.sql`
2. `supabase/migrations/20250323000001_allow_null_mux_ids.sql`

**Quick fix** (if upload fails with `mux_playback_id` null constraint):

```sql
ALTER TABLE videos ALTER COLUMN mux_playback_id DROP NOT NULL;
```

## 2. Edge function secrets

Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**:

| Secret | Description |
|--------|-------------|
| `MUX_TOKEN_ID` | Mux API token ID |
| `MUX_TOKEN_SECRET` | Mux API token secret |
| `GEMINI_API_KEY` | Google AI Studio API key |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.

## 3. Deploy edge functions

```bash
npx supabase login
npx supabase link --project-ref pbrputyaipirogfvigxl
npx supabase functions deploy mux-upload
npx supabase functions deploy mux-webhook
npx supabase functions deploy generate-quiz
```

## 4. Mux webhook

Mux does **not** let you pick individual events in the dashboard. Once you add a webhook URL, Mux sends **all** webhook events to that URL. Your `mux-webhook` function only acts on the ones it needs.

1. Go to [dashboard.mux.com](https://dashboard.mux.com)
2. Check the environment toggle (top) — use **Development** while testing, **Production** when live. Webhooks are **per environment**.
3. **Settings** (gear, bottom-left) → **Webhooks**
4. **Create new webhook** (or edit yours)
5. **URL only** — paste:
   ```
   https://pbrputyaipirogfvigxl.supabase.co/functions/v1/mux-webhook
   ```
6. Save. Copy the **Signing secret** and add it in Supabase → **Edge Functions** → **Secrets** as `MUX_WEBHOOK_SECRET` (optional but recommended).

Events Atom uses (sent automatically; no checkbox UI):

- `video.upload.asset_created`
- `video.asset.ready`
- `video.asset.errored`

**Verify:** After an upload, open your webhook → **Recent deliveries** in Mux. You should see `200` responses.

## Quiz not showing?

1. Tap the **Quiz** button (brain icon) on the right while watching a video — you do not need to watch until the end.
2. For AI quizzes, deploy the function and set the API key:
   ```bash
   npx supabase functions deploy generate-quiz
   ```
   Add `GEMINI_API_KEY` in **Edge Functions → Secrets** ([Google AI Studio](https://aistudio.google.com/apikey)).
3. If AI fails, choose **Use offline quiz** in the modal.

## Delete videos

Run in SQL Editor (if delete from the app fails):

```sql
-- From supabase/migrations/20250323000002_videos_delete_policy.sql
CREATE POLICY "Users can delete their own videos"
  ON videos FOR DELETE
  USING (auth.uid() = user_id);
```

Or delete the row manually: **Table Editor → videos → delete row**.

If you deleted only in **Mux** (not Supabase), the feed may show "video does not exist" — the app now auto-removes broken entries, or delete the row in Supabase.

## Troubleshooting upload errors

If you see **"Edge Function returned a non-2xx status code"**, the UI will now show the real message after redeploying. Common causes:

| Error message | Fix |
|---------------|-----|
| `Mux credentials not configured` | Add `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` under **Edge Functions → Secrets**, then `npx supabase functions deploy mux-upload` |
| `mux_playback_id` null constraint | Run: `ALTER TABLE videos ALTER COLUMN mux_playback_id DROP NOT NULL;` |
| `Database insert failed` | Run step 1 migration SQL in Supabase SQL Editor |
| `Unauthorized` | Sign out and sign back in |
| `Mux API error` | Check Mux tokens match your Mux environment (Development vs Production) |

View logs: Supabase Dashboard → **Edge Functions** → `mux-upload` → **Logs**.

## 5. Local dev

```bash
# macOS / Linux
cp .env.example .env
```

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

Then edit **`.env`** (not `.env.example`) with your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

```bash
npm install
npm run dev
```

## 6. Deploy frontend (Vercel)

1. Push repo to GitHub
2. Import in Vercel
3. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Add production URL to Supabase Auth redirect URLs

## Upload flow

1. User submits form → `mux-upload` creates DB row + Mux direct upload URL
2. Browser PUTs file to Mux with progress bar
3. Mux webhook → `mux-webhook` sets `mux_playback_id` and `status: ready`
4. Feed shows video when `mux_playback_id` is set
