-- Atom: Mux upload status + quiz results

-- Playback/asset IDs are set by Mux webhook after upload — must be nullable on insert
ALTER TABLE videos ALTER COLUMN mux_playback_id DROP NOT NULL;

ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'uploading',
  ADD COLUMN IF NOT EXISTS mux_upload_id text;

CREATE INDEX IF NOT EXISTS videos_status_idx ON videos (status);
CREATE INDEX IF NOT EXISTS videos_mux_upload_id_idx ON videos (mux_upload_id);

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id uuid NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add FK only if videos.id exists (adjust if your table name differs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_results_video_id_fkey'
  ) THEN
    ALTER TABLE quiz_results
      ADD CONSTRAINT quiz_results_video_id_fkey
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own quiz results" ON quiz_results;
CREATE POLICY "Users insert own quiz results"
  ON quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own quiz results" ON quiz_results;
CREATE POLICY "Users read own quiz results"
  ON quiz_results FOR SELECT
  USING (auth.uid() = user_id);
