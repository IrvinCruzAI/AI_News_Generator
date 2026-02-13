/*
  # Initial Database Schema for NewsGen AI

  ## Overview
  This migration sets up the core database structure for the NewsGen AI application,
  which allows users to search for news and generate AI articles from headlines.

  ## New Tables
  
  ### 1. `profiles`
  User profiles linked to Supabase auth.users
  - `id` (uuid, primary key) - Matches auth.users.id
  - `email` (text) - User email
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. `search_history`
  Stores user search queries for quick access and analytics
  - `id` (uuid, primary key) - Unique search record ID
  - `user_id` (uuid, foreign key) - References profiles.id
  - `query` (text) - The search query string
  - `results_count` (integer) - Number of results returned
  - `searched_at` (timestamptz) - When the search was performed
  
  ### 3. `generated_articles`
  Stores AI-generated articles from news headlines
  - `id` (uuid, primary key) - Unique article ID
  - `user_id` (uuid, foreign key) - References profiles.id
  - `title` (text) - Article title
  - `content` (text) - Full article content
  - `source_url` (text) - Original news source URL
  - `status` (text) - Article status: 'generating', 'ready', or 'error'
  - `error_message` (text, nullable) - Error details if status is 'error'
  - `created_at` (timestamptz) - When generation started
  - `completed_at` (timestamptz, nullable) - When generation completed
  
  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with policies ensuring:
  - Users can only access their own data
  - All operations require authentication
  - No public access to any data
  
  ### Policies Created
  
  #### profiles table:
  1. Users can view their own profile
  2. Users can update their own profile
  3. Users can insert their own profile (on signup)
  
  #### search_history table:
  1. Users can view their own search history
  2. Users can insert their own searches
  3. Users can delete their own search history
  
  #### generated_articles table:
  1. Users can view their own articles
  2. Users can insert their own articles
  3. Users can update their own articles (for status changes)
  4. Users can delete their own articles

  ## Important Notes
  - All tables use uuid for primary keys with automatic generation
  - Timestamps use timestamptz for timezone awareness
  - Foreign keys enforce referential integrity
  - Indexes are created on frequently queried columns
  - All policies check auth.uid() for user authentication
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- SEARCH HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query text NOT NULL,
  results_count integer DEFAULT 0 NOT NULL,
  searched_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Policies for search_history
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own searches"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);

-- =====================================================
-- GENERATED ARTICLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS generated_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  source_url text NOT NULL,
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE generated_articles ENABLE ROW LEVEL SECURITY;

-- Policies for generated_articles
CREATE POLICY "Users can view own articles"
  ON generated_articles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own articles"
  ON generated_articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own articles"
  ON generated_articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own articles"
  ON generated_articles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_articles_user_id ON generated_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_articles_created_at ON generated_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_articles_status ON generated_articles(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();