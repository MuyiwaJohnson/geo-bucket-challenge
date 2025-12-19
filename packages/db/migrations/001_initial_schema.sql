-- ============================================
-- CLEANUP: Drop existing objects
-- ============================================

-- Drop functions (in reverse dependency order)
DROP FUNCTION IF EXISTS get_bucket_stats();
DROP FUNCTION IF EXISTS search_properties_by_location(TEXT);
DROP FUNCTION IF EXISTS assign_property_to_bucket(FLOAT, FLOAT, TEXT);
DROP FUNCTION IF EXISTS normalize_location_name(TEXT);
DROP FUNCTION IF EXISTS generate_bucket_key(FLOAT, FLOAT, FLOAT);

-- Drop indexes
DROP INDEX IF EXISTS properties_location_name_idx;
DROP INDEX IF EXISTS properties_bucket_id_idx;
DROP INDEX IF EXISTS properties_location_gist;
DROP INDEX IF EXISTS location_aliases_bucket_id_idx;
DROP INDEX IF EXISTS location_aliases_canonical_idx;
DROP INDEX IF EXISTS location_aliases_alias_trgm;
DROP INDEX IF EXISTS geo_buckets_key_idx;
DROP INDEX IF EXISTS geo_buckets_center_gist;

-- Drop tables (in reverse dependency order due to foreign keys)
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS location_aliases CASCADE;
DROP TABLE IF EXISTS geo_buckets CASCADE;

-- ============================================
-- SETUP: Create extensions and schema
-- ============================================

-- Enable required extensions
-- Note: In Supabase, these may need to be enabled via Dashboard > Extensions
-- If extensions are in 'extensions' schema, you may need schema-qualified names
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Geo buckets table
CREATE TABLE geo_buckets (
  id BIGSERIAL PRIMARY KEY,
  bucket_key TEXT UNIQUE NOT NULL,
  center_point GEOGRAPHY(POINT, 4326) NOT NULL,
  bounds GEOGRAPHY(POLYGON, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for spatial queries on center_point
CREATE INDEX geo_buckets_center_gist 
ON geo_buckets USING GIST (center_point);

-- Index for bucket_key lookups
CREATE INDEX geo_buckets_key_idx 
ON geo_buckets (bucket_key);

-- Location aliases table for name normalization
CREATE TABLE location_aliases (
  id BIGSERIAL PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  alias TEXT NOT NULL,
  bucket_id BIGINT NOT NULL REFERENCES geo_buckets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alias, bucket_id)
);

-- Trigram index for fuzzy text matching
-- Note: In Supabase, pg_trgm is typically in 'extensions' schema
-- If this fails, ensure pg_trgm extension is enabled via Dashboard > Extensions
-- Alternative: If extension is in public schema, remove 'extensions.' prefix
CREATE INDEX location_aliases_alias_trgm 
ON location_aliases USING GIN (alias extensions.gin_trgm_ops);

-- Index for canonical name lookups
CREATE INDEX location_aliases_canonical_idx 
ON location_aliases (canonical_name);

-- Index for bucket_id lookups
CREATE INDEX location_aliases_bucket_id_idx 
ON location_aliases (bucket_id);

-- Properties table
CREATE TABLE properties (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  location_name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  price DECIMAL(12, 2),
  bedrooms INT,
  bathrooms INT,
  bucket_id BIGINT REFERENCES geo_buckets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial index for location queries
CREATE INDEX properties_location_gist 
ON properties USING GIST (location);

-- Index for bucket_id lookups
CREATE INDEX properties_bucket_id_idx 
ON properties (bucket_id);

-- Index for location_name searches
CREATE INDEX properties_location_name_idx 
ON properties (location_name);

-- SQL Functions

-- Generate bucket key from coordinates (grid-based, ~500m cells)
CREATE OR REPLACE FUNCTION generate_bucket_key(
  lat FLOAT,
  lng FLOAT,
  grid_size FLOAT DEFAULT 0.005
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'grid:' || 
         floor(lat / grid_size)::TEXT || ',' || 
         floor(lng / grid_size)::TEXT;
$$;

-- Normalize location name for matching
CREATE OR REPLACE FUNCTION normalize_location_name(input_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(trim(input_name), '[,\s]+', ' ', 'g'));
$$;

-- Assign property to bucket (creates bucket if needed)
CREATE OR REPLACE FUNCTION assign_property_to_bucket(
  p_lat FLOAT,
  p_lng FLOAT,
  p_location_name TEXT
)
RETURNS BIGINT
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  v_bucket_id BIGINT;
  v_bucket_key TEXT;
  v_normalized_name TEXT;
  v_existing_bucket_id BIGINT;
  grid_size FLOAT := 0.005;  -- ~500m at Lagos latitude
  bucket_radius FLOAT := 500;  -- 500 meters
BEGIN
  -- Normalize location name
  v_normalized_name := public.normalize_location_name(p_location_name);
  
  -- Generate bucket key from coordinates
  v_bucket_key := public.generate_bucket_key(p_lat, p_lng, grid_size);
  
  -- Try to find existing bucket by key
  SELECT id INTO v_bucket_id
  FROM public.geo_buckets
  WHERE bucket_key = v_bucket_key
  LIMIT 1;
  
  -- If no bucket exists, try to find by location name (fuzzy match)
  IF v_bucket_id IS NULL THEN
    SELECT la.bucket_id INTO v_existing_bucket_id
    FROM public.location_aliases la
    WHERE extensions.similarity(la.alias, v_normalized_name) > 0.3
    ORDER BY extensions.similarity(la.alias, v_normalized_name) DESC
    LIMIT 1;
    
    IF v_existing_bucket_id IS NOT NULL THEN
      -- Check if existing bucket is within 500m
      IF EXISTS (
        SELECT 1
        FROM public.geo_buckets gb
        WHERE gb.id = v_existing_bucket_id
        AND extensions.ST_DWithin(
          gb.center_point,
          extensions.ST_SetSRID(extensions.ST_Point(p_lng, p_lat), 4326)::extensions.geography,
          bucket_radius
        )
      ) THEN
        v_bucket_id := v_existing_bucket_id;
      END IF;
    END IF;
  END IF;
  
  -- If still no bucket, find nearest bucket within 500m
  IF v_bucket_id IS NULL THEN
    SELECT id INTO v_bucket_id
    FROM public.geo_buckets
    WHERE extensions.ST_DWithin(
      center_point,
      extensions.ST_SetSRID(extensions.ST_Point(p_lng, p_lat), 4326)::extensions.geography,
      bucket_radius
    )
    ORDER BY center_point operator(extensions.<->) extensions.ST_SetSRID(extensions.ST_Point(p_lng, p_lat), 4326)::extensions.geography
    LIMIT 1;
  END IF;
  
  -- Create new bucket if none found
  IF v_bucket_id IS NULL THEN
    INSERT INTO public.geo_buckets (bucket_key, center_point, bounds)
    VALUES (
      v_bucket_key,
      extensions.ST_SetSRID(extensions.ST_Point(p_lng, p_lat), 4326)::extensions.geography,
      extensions.ST_Buffer(
        extensions.ST_SetSRID(extensions.ST_Point(p_lng, p_lat), 4326)::extensions.geography,
        bucket_radius
      )
    )
    RETURNING id INTO v_bucket_id;
  END IF;
  
  -- Add location alias if it doesn't exist
  INSERT INTO public.location_aliases (canonical_name, alias, bucket_id)
  VALUES (v_normalized_name, v_normalized_name, v_bucket_id)
  ON CONFLICT (alias, bucket_id) DO NOTHING;
  
  RETURN v_bucket_id;
END;
$$;

-- Search properties by location name
CREATE OR REPLACE FUNCTION search_properties_by_location(
  p_location TEXT
)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  location_name TEXT,
  lat FLOAT,
  lng FLOAT,
  price DECIMAL(12, 2),
  bedrooms INT,
  bathrooms INT,
  bucket_id BIGINT,
  created_at TIMESTAMPTZ
)
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  v_normalized_location TEXT;
BEGIN
  -- Normalize input location
  v_normalized_location := public.normalize_location_name(p_location);
  
  -- Return properties from matching buckets
  -- Location normalization: Properties in matching buckets are returned
  -- Filter by location_name similarity to ensure only relevant properties are returned
  -- This ensures "Sangotedo", "Sangotedo, Ajah", "sangotedo lagos" return same relevant results
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.location_name,
    extensions.ST_Y(p.location::extensions.geometry) AS lat,
    extensions.ST_X(p.location::extensions.geometry) AS lng,
    p.price,
    p.bedrooms,
    p.bathrooms,
    p.bucket_id,
    p.created_at
  FROM public.properties p
  WHERE p.bucket_id IN (
    SELECT DISTINCT la.bucket_id
    FROM public.location_aliases la
    WHERE extensions.similarity(la.alias, v_normalized_location) > 0.3
  )
  AND (
    extensions.similarity(public.normalize_location_name(p.location_name), v_normalized_location) > 0.3
    OR public.normalize_location_name(p.location_name) LIKE '%' || v_normalized_location || '%'
  )
  ORDER BY 
    extensions.similarity(public.normalize_location_name(p.location_name), v_normalized_location) DESC,
    p.created_at DESC;
END;
$$;

-- Get bucket statistics
CREATE OR REPLACE FUNCTION get_bucket_stats()
RETURNS TABLE (
  total_buckets BIGINT,
  total_properties BIGINT,
  avg_properties_per_bucket NUMERIC,
  max_properties_per_bucket BIGINT,
  min_properties_per_bucket BIGINT
)
SET search_path = ''
LANGUAGE sql
AS $$
  SELECT 
    COUNT(DISTINCT gb.id)::BIGINT as total_buckets,
    COUNT(p.id)::BIGINT as total_properties,
    COALESCE(AVG(bucket_counts.count), 0)::NUMERIC(10, 2) as avg_properties_per_bucket,
    COALESCE(MAX(bucket_counts.count), 0)::BIGINT as max_properties_per_bucket,
    COALESCE(MIN(bucket_counts.count), 0)::BIGINT as min_properties_per_bucket
  FROM public.geo_buckets gb
  LEFT JOIN public.properties p ON p.bucket_id = gb.id
  LEFT JOIN (
    SELECT bucket_id, COUNT(*)::BIGINT as count
    FROM public.properties
    WHERE bucket_id IS NOT NULL
    GROUP BY bucket_id
  ) bucket_counts ON bucket_counts.bucket_id = gb.id;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.geo_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT access to geo_buckets
CREATE POLICY "Allow public SELECT on geo_buckets"
ON public.geo_buckets
FOR SELECT
TO public
USING (true);

-- Allow public SELECT access to location_aliases
CREATE POLICY "Allow public SELECT on location_aliases"
ON public.location_aliases
FOR SELECT
TO public
USING (true);

-- Allow public SELECT access to properties
CREATE POLICY "Allow public SELECT on properties"
ON public.properties
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to INSERT properties
CREATE POLICY "Allow authenticated INSERT on properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to INSERT geo_buckets (via functions)
CREATE POLICY "Allow authenticated INSERT on geo_buckets"
ON public.geo_buckets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to INSERT location_aliases (via functions)
CREATE POLICY "Allow authenticated INSERT on location_aliases"
ON public.location_aliases
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to UPDATE properties
CREATE POLICY "Allow authenticated UPDATE on properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to DELETE properties
CREATE POLICY "Allow authenticated DELETE on properties"
ON public.properties
FOR DELETE
TO authenticated
USING (true);

