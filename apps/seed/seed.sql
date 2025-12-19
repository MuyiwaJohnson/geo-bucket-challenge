-- Seed script for geo-bucket system
-- Run this after applying the migration: 001_initial_schema.sql

-- Clear existing data (optional - for clean slate)
TRUNCATE TABLE properties, location_aliases, geo_buckets RESTART IDENTITY CASCADE;

-- Insert test properties
-- The assign_property_to_bucket function will auto-create buckets

INSERT INTO properties (title, location_name, location, price, bedrooms, bathrooms)
VALUES
  -- Required test case - All should map to same bucket
  (
    '3BR Flat in Sangotedo',
    'Sangotedo',
    ST_SetSRID(ST_Point(3.6285, 6.4698), 4326)::geography,
    5000000,
    3,
    2
  ),
  (
    '2BR Apartment near Ajah',
    'Sangotedo, Ajah',
    ST_SetSRID(ST_Point(3.6301, 6.4720), 4326)::geography,
    3500000,
    2,
    1
  ),
  (
    '4BR Duplex Lagos',
    'sangotedo lagos',
    ST_SetSRID(ST_Point(3.6290, 6.4705), 4326)::geography,
    12000000,
    4,
    3
  ),
  
  -- Additional test data
  (
    'Studio in Lekki Phase 1',
    'Lekki Phase 1',
    ST_SetSRID(ST_Point(3.4700, 6.4650), 4326)::geography,
    2000000,
    0,
    1
  ),
  (
    '5BR Mansion Victoria Island',
    'Victoria Island',
    ST_SetSRID(ST_Point(3.4219, 6.4281), 4326)::geography,
    50000000,
    5,
    4
  ),
  (
    '1BR Close to Sangotedo',
    'Near Sangotedo',
    ST_SetSRID(ST_Point(3.6286, 6.4699), 4326)::geography,
    1800000,
    1,
    1
  ),
  (
    '2BR in Sangotedo',
    'Sangotedo',
    ST_SetSRID(ST_Point(3.6295, 6.4710), 4326)::geography,
    4000000,
    2,
    2
  ),
  
  -- More Sangotedo variations (for testing location matching)
  (
    'Penthouse Sangotedo',
    'Sangotedo Phase 2',
    ST_SetSRID(ST_Point(3.6310, 6.4730), 4326)::geography,
    25000000,
    5,
    5
  ),
  (
    '1BR Studio Sangotedo',
    'sangotedo estate',
    ST_SetSRID(ST_Point(3.6275, 6.4685), 4326)::geography,
    1500000,
    1,
    1
  ),
  
  -- More Lekki properties
  (
    '3BR Terrace Lekki',
    'Lekki Phase 1',
    ST_SetSRID(ST_Point(3.4710, 6.4660), 4326)::geography,
    8000000,
    3,
    3
  ),
  (
    '2BR Apartment Lekki',
    'Lekki Phase 1',
    ST_SetSRID(ST_Point(3.4695, 6.4645), 4326)::geography,
    4500000,
    2,
    2
  ),
  (
    '4BR Duplex Lekki',
    'Lekki Phase 2',
    ST_SetSRID(ST_Point(3.4750, 6.4700), 4326)::geography,
    15000000,
    4,
    4
  ),
  
  -- Victoria Island properties
  (
    '3BR Flat Victoria Island',
    'Victoria Island',
    ST_SetSRID(ST_Point(3.4230, 6.4290), 4326)::geography,
    18000000,
    3,
    3
  ),
  (
    '2BR Apartment VI',
    'Victoria Island',
    ST_SetSRID(ST_Point(3.4200, 6.4270), 4326)::geography,
    12000000,
    2,
    2
  ),
  
  -- Ikeja properties (different area)
  (
    '3BR Flat Ikeja',
    'Ikeja',
    ST_SetSRID(ST_Point(3.3487, 6.5244), 4326)::geography,
    6000000,
    3,
    2
  ),
  (
    '2BR Apartment Ikeja',
    'Ikeja GRA',
    ST_SetSRID(ST_Point(3.3500, 6.5260), 4326)::geography,
    5000000,
    2,
    2
  ),
  
  -- Surulere properties
  (
    '3BR Flat Surulere',
    'Surulere',
    ST_SetSRID(ST_Point(3.3544, 6.4964), 4326)::geography,
    5500000,
    3,
    2
  ),
  (
    '2BR Apartment Surulere',
    'Surulere',
    ST_SetSRID(ST_Point(3.3560, 6.4980), 4326)::geography,
    4000000,
    2,
    1
  ),
  
  -- Edge cases: Very close coordinates
  (
    '1BR Micro Unit',
    'Sangotedo',
    ST_SetSRID(ST_Point(3.6287, 6.4700), 4326)::geography,
    1200000,
    1,
    1
  ),
  (
    'Studio Sangotedo',
    'Sangotedo',
    ST_SetSRID(ST_Point(3.6288, 6.4701), 4326)::geography,
    1000000,
    0,
    1
  );

-- Assign all properties to buckets
UPDATE properties p
SET bucket_id = assign_property_to_bucket(
  ST_Y(p.location::geometry),
  ST_X(p.location::geometry),
  p.location_name
);

-- Verify test case
SELECT 
  'Test Case Verification' as test,
  COUNT(*) as properties_found,
  'Expected: 6-8' as expected
FROM properties p
JOIN location_aliases la ON la.bucket_id = p.bucket_id
WHERE similarity(la.alias, normalize_location_name('sangotedo')) > 0.3;

-- Show all properties with their buckets
SELECT 
  p.id,
  p.title,
  p.location_name,
  p.bucket_id,
  gb.bucket_key
FROM properties p
LEFT JOIN geo_buckets gb ON gb.id = p.bucket_id
ORDER BY p.id;

