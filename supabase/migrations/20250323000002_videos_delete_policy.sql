-- Allow users to delete their own videos from the app
DROP POLICY IF EXISTS "Users can delete their own videos" ON videos;
CREATE POLICY "Users can delete their own videos"
  ON videos FOR DELETE
  USING (auth.uid() = user_id);
