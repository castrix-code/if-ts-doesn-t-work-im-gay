-- mux_playback_id is filled by Mux webhook after processing, not at insert time
ALTER TABLE videos ALTER COLUMN mux_playback_id DROP NOT NULL;

-- mux_asset_id is also set by webhook (optional column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'mux_asset_id'
  ) THEN
    ALTER TABLE videos ALTER COLUMN mux_asset_id DROP NOT NULL;
  END IF;
END $$;
