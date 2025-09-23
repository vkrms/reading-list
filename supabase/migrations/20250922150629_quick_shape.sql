/*
  # Create Reading List Schema

  1. New Tables
    - `reading_list_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `url` (text, the original URL)
      - `title` (text, fetched from OpenGraph data)
      - `description` (text, optional meta description)
      - `image_url` (text, optional OpenGraph image)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reading_list_items` table
    - Add policies for authenticated users to manage their own items
*/

CREATE TABLE IF NOT EXISTS reading_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reading_list_items ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own items
CREATE POLICY "Users can read own reading list items"
  ON reading_list_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own items
CREATE POLICY "Users can insert own reading list items"
  ON reading_list_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own items
CREATE POLICY "Users can update own reading list items"
  ON reading_list_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own items
CREATE POLICY "Users can delete own reading list items"
  ON reading_list_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS reading_list_items_user_id_idx ON reading_list_items(user_id);
CREATE INDEX IF NOT EXISTS reading_list_items_created_at_idx ON reading_list_items(created_at DESC);