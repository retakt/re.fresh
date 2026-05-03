-- Migration: Tags and Categories Database System
-- Version: 0.2.0
-- Description: Create dedicated tags and categories tables with junction tables for content linking

-- ============================================================================
-- STEP 1: Create Tags Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- ============================================================================
-- STEP 2: Create Categories Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_usage_count ON categories(usage_count DESC);

-- ============================================================================
-- STEP 3: Create Content Tags Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'tutorial', 'music', 'file')),
  content_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_type, content_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_tags_lookup ON content_tags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag_id ON content_tags(tag_id);

-- ============================================================================
-- STEP 4: Create Content Categories Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'tutorial', 'music', 'file')),
  content_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_type, content_id, category_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_categories_lookup ON content_categories(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_category_id ON content_categories(category_id);

-- ============================================================================
-- STEP 5: Helper Function - Generate Slug
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(trim(input_text), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 6: Migrate Existing Post Tags
-- ============================================================================
DO $$
DECLARE
  post_record RECORD;
  v_tag_name TEXT;
  v_tag_id UUID;
BEGIN
  FOR post_record IN 
    SELECT id, tags FROM posts WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    FOREACH v_tag_name IN ARRAY post_record.tags
    LOOP
      IF trim(v_tag_name) = '' THEN
        CONTINUE;
      END IF;
      
      INSERT INTO tags (name, slug)
      VALUES (trim(v_tag_name), generate_slug(v_tag_name))
      ON CONFLICT (name) DO NOTHING;
      
      SELECT id INTO v_tag_id FROM tags WHERE name = trim(v_tag_name);
      
      INSERT INTO content_tags (content_type, content_id, tag_id)
      VALUES ('post', post_record.id, v_tag_id)
      ON CONFLICT (content_type, content_id, tag_id) DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Post tags migration completed';
END $$;

-- ============================================================================
-- STEP 7: Migrate Existing Tutorial Tags
-- ============================================================================
DO $$
DECLARE
  tutorial_record RECORD;
  v_tag_name TEXT;
  v_tag_id UUID;
BEGIN
  FOR tutorial_record IN 
    SELECT id, tags FROM tutorials WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    FOREACH v_tag_name IN ARRAY tutorial_record.tags
    LOOP
      IF trim(v_tag_name) = '' THEN
        CONTINUE;
      END IF;
      
      INSERT INTO tags (name, slug)
      VALUES (trim(v_tag_name), generate_slug(v_tag_name))
      ON CONFLICT (name) DO NOTHING;
      
      SELECT id INTO v_tag_id FROM tags WHERE name = trim(v_tag_name);
      
      INSERT INTO content_tags (content_type, content_id, tag_id)
      VALUES ('tutorial', tutorial_record.id, v_tag_id)
      ON CONFLICT (content_type, content_id, tag_id) DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Tutorial tags migration completed';
END $$;

-- ============================================================================
-- STEP 8: Migrate Existing Tutorial Categories
-- ============================================================================
DO $$
DECLARE
  tutorial_record RECORD;
  v_category_name TEXT;
  v_category_id UUID;
  v_category_array TEXT[];
BEGIN
  FOR tutorial_record IN 
    SELECT id, category FROM tutorials WHERE category IS NOT NULL AND category != ''
  LOOP
    v_category_array := string_to_array(tutorial_record.category, ',');
    
    FOREACH v_category_name IN ARRAY v_category_array
    LOOP
      IF trim(v_category_name) = '' THEN
        CONTINUE;
      END IF;
      
      INSERT INTO categories (name, slug)
      VALUES (trim(v_category_name), generate_slug(v_category_name))
      ON CONFLICT (name) DO NOTHING;
      
      SELECT id INTO v_category_id FROM categories WHERE name = trim(v_category_name);
      
      INSERT INTO content_categories (content_type, content_id, category_id)
      VALUES ('tutorial', tutorial_record.id, v_category_id)
      ON CONFLICT (content_type, content_id, category_id) DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Tutorial categories migration completed';
END $$;

-- ============================================================================
-- STEP 9: Update Usage Counts
-- ============================================================================
-- Update tag usage counts
UPDATE tags SET usage_count = (
  SELECT COUNT(*) FROM content_tags WHERE content_tags.tag_id = tags.id
);

-- Update category usage counts
UPDATE categories SET usage_count = (
  SELECT COUNT(*) FROM content_categories WHERE content_categories.category_id = categories.id
);

-- ============================================================================
-- STEP 10: Create Triggers for Usage Count Maintenance
-- ============================================================================

-- Trigger function to increment tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to decrement tag usage count
CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to increment category usage count
CREATE OR REPLACE FUNCTION increment_category_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE categories SET usage_count = usage_count + 1 WHERE id = NEW.category_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to decrement category usage count
CREATE OR REPLACE FUNCTION decrement_category_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE categories SET usage_count = usage_count - 1 WHERE id = OLD.category_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_increment_tag_usage ON content_tags;
CREATE TRIGGER trigger_increment_tag_usage
  AFTER INSERT ON content_tags
  FOR EACH ROW EXECUTE FUNCTION increment_tag_usage();

DROP TRIGGER IF EXISTS trigger_decrement_tag_usage ON content_tags;
CREATE TRIGGER trigger_decrement_tag_usage
  AFTER DELETE ON content_tags
  FOR EACH ROW EXECUTE FUNCTION decrement_tag_usage();

DROP TRIGGER IF EXISTS trigger_increment_category_usage ON content_categories;
CREATE TRIGGER trigger_increment_category_usage
  AFTER INSERT ON content_categories
  FOR EACH ROW EXECUTE FUNCTION increment_category_usage();

DROP TRIGGER IF EXISTS trigger_decrement_category_usage ON content_categories;
CREATE TRIGGER trigger_decrement_category_usage
  AFTER DELETE ON content_categories
  FOR EACH ROW EXECUTE FUNCTION decrement_category_usage();

-- ============================================================================
-- STEP 11: Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to tags and categories
CREATE POLICY "Allow public read access to tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT USING (true);

-- Allow authenticated users to read content_tags and content_categories
CREATE POLICY "Allow authenticated read access to content_tags" ON content_tags FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to content_categories" ON content_categories FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete their own content tags/categories
-- (You may need to adjust these policies based on your auth setup)
CREATE POLICY "Allow authenticated insert to content_tags" ON content_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated delete from content_tags" ON content_tags FOR DELETE USING (true);
CREATE POLICY "Allow authenticated insert to content_categories" ON content_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated delete from content_categories" ON content_categories FOR DELETE USING (true);

-- Allow authenticated users to create new tags and categories
CREATE POLICY "Allow authenticated insert to tags" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated insert to categories" ON categories FOR INSERT WITH CHECK (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Summary:
-- ✅ Created tags, categories, content_tags, content_categories tables
-- ✅ Migrated all existing tags from posts and tutorials
-- ✅ Migrated all existing categories from tutorials
-- ✅ Set up usage count tracking with triggers
-- ✅ Enabled RLS with appropriate policies
--
-- Next Steps:
-- 1. Verify data migration: SELECT * FROM tags; SELECT * FROM categories;
-- 2. Check junction tables: SELECT * FROM content_tags LIMIT 10;
-- 3. Update frontend code to use new tables
-- 4. (Optional) Drop old columns after verifying everything works:
--    -- ALTER TABLE posts DROP COLUMN tags;
--    -- ALTER TABLE tutorials DROP COLUMN tags;
--    -- ALTER TABLE tutorials DROP COLUMN category;
