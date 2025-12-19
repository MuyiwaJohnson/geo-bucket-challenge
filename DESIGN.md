# Geo-Bucket Backend System - Design Document

## 1. Geo-Bucket Strategy

### Overview

The geo-bucket system groups nearby properties into logical spatial buckets to ensure consistent search results regardless of location name variations or slight coordinate differences.

### Bucket Definition

**Grid-Based Approach:**
- Each bucket represents a grid cell of approximately **500 meters** at Lagos latitude
- Grid size: `0.005` degrees (latitude/longitude)
- Bucket key format: `grid:{lat_grid},{lng_grid}` (e.g., `grid:1293,725`)

**Bucket Characteristics:**
- **Radius**: 500 meters from center point
- **Coverage**: Each bucket covers a circular area with 500m radius
- **Overlap**: Buckets can overlap at boundaries to ensure properties near edges are captured
- **Auto-creation**: Buckets are created automatically when properties are assigned

### Bucket Assignment Algorithm

1. **Generate bucket key** from property coordinates using grid-based hashing
2. **Check for existing bucket** with matching key
3. **Fuzzy text match**: If no bucket found, search for buckets with similar location names
4. **Proximity search**: If still no match, find nearest bucket within 500m radius
5. **Create new bucket**: If no bucket exists within 500m, create a new one

### Why Grid-Based (Not H3)?

- **Simplicity**: No external dependencies, works with standard PostGIS
- **Predictability**: Easy to understand and debug
- **Performance**: Fast key generation and lookup
- **Sufficient**: Meets requirements without added complexity

**Trade-off**: Grid cells are not perfectly uniform (vary slightly by latitude), but this is acceptable for the use case.

---

## 2. Database Schema

### Tables

#### `geo_buckets`

Stores spatial bucket information.

```sql
CREATE TABLE geo_buckets (
  id BIGSERIAL PRIMARY KEY,
  bucket_key TEXT UNIQUE NOT NULL,        -- Grid key: "grid:1293,725"
  center_point GEOGRAPHY(POINT, 4326),    -- Center coordinates
  bounds GEOGRAPHY(POLYGON, 4326),        -- 500m radius boundary
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `GIST` index on `center_point` for spatial queries
- Unique index on `bucket_key` for fast lookups

#### `location_aliases`

Maps location name variations to buckets for text-based matching.

```sql
CREATE TABLE location_aliases (
  id BIGSERIAL PRIMARY KEY,
  canonical_name TEXT NOT NULL,           -- Normalized name
  alias TEXT NOT NULL,                     -- Original or variant name
  bucket_id BIGINT REFERENCES geo_buckets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alias, bucket_id)
);
```

**Indexes:**
- `GIN` trigram index on `alias` for fuzzy text matching
- Index on `canonical_name` for lookups
- Index on `bucket_id` for joins

#### `properties`

Stores property data with spatial coordinates.

```sql
CREATE TABLE properties (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  location_name TEXT NOT NULL,            -- Original location name
  location GEOGRAPHY(POINT, 4326),        -- Spatial coordinates
  price DECIMAL(12, 2),
  bedrooms INT,
  bathrooms INT,
  bucket_id BIGINT REFERENCES geo_buckets(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `GIST` index on `location` for spatial queries
- Index on `bucket_id` for bucket-based lookups
- Index on `location_name` for text searches

### Relationships

```
geo_buckets (1) ──< (many) properties
geo_buckets (1) ──< (many) location_aliases
```

### Extensions Required

- **PostGIS**: For spatial data types and functions
- **pg_trgm**: For trigram-based fuzzy text matching

---

## 3. Location Matching Logic

### Three-Step Process

#### Step 1: Text Normalization

Normalize input location name:
- Convert to lowercase
- Remove extra whitespace and commas
- Standardize separators

```sql
normalize_location_name('Sangotedo, Ajah') → 'sangotedo ajah'
```

#### Step 2: Fuzzy Text Matching

Use PostgreSQL trigram similarity to find matching location aliases:

```sql
SELECT bucket_id
FROM location_aliases
WHERE similarity(alias, normalized_input) > 0.3
ORDER BY similarity DESC
LIMIT 1;
```

**Similarity Threshold**: `0.3` (30% similarity)
- Handles typos: "sangotedo" matches "Sangotedo"
- Handles variations: "Sangotedo, Ajah" matches "Sangotedo"
- Case-insensitive (normalization handles this)

#### Step 3: Coordinate Proximity Fallback

If text matching fails, use spatial proximity:

```sql
SELECT id
FROM geo_buckets
WHERE ST_DWithin(
  center_point,
  ST_Point(lng, lat)::geography,
  500  -- 500 meters
)
ORDER BY center_point <-> ST_Point(lng, lat)::geography
LIMIT 1;
```

**Fallback Logic:**
1. Check if existing bucket within 500m
2. If yes, assign to that bucket
3. If no, create new bucket

### Matching Examples

| Input | Normalized | Matches |
|-------|-----------|---------|
| "Sangotedo" | "sangotedo" | "Sangotedo", "sangotedo lagos" |
| "Sangotedo, Ajah" | "sangotedo ajah" | "Sangotedo", "sangotedo lagos" |
| "sangotedo lagos" | "sangotedo lagos" | "Sangotedo", "Sangotedo, Ajah" |

All three inputs return properties from the same bucket.

---

## 4. Flow Diagram

### Property Creation Flow

```
User Request (POST /api/properties)
    ↓
Validate Input (title, location_name, lat, lng)
    ↓
Call assign_property_to_bucket(lat, lng, location_name)
    ↓
┌─────────────────────────────────────┐
│ 1. Normalize location_name          │
│    "Sangotedo, Ajah" → "sangotedo ajah" │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Generate bucket_key from coords  │
│    grid:1293,725                     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. Check existing bucket by key     │
│    Found? → Use it                   │
│    Not found? → Continue             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. Fuzzy text match on aliases      │
│    similarity > 0.3? → Use bucket   │
│    No match? → Continue              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. Spatial proximity search         │
│    Within 500m? → Use bucket        │
│    Not found? → Create new bucket   │
└─────────────────────────────────────┘
    ↓
Create/Update location_alias
    ↓
Insert property with bucket_id
    ↓
Return created property
```

### Search Flow

```
User Request (GET /api/properties/search?location=sangotedo)
    ↓
Validate location parameter
    ↓
Call search_properties_by_location('sangotedo')
    ↓
┌─────────────────────────────────────┐
│ 1. Normalize input                 │
│    "sangotedo" → "sangotedo"       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Fuzzy match location_aliases     │
│    similarity(alias, 'sangotedo') > 0.3 │
│    → Get matching bucket_ids        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. Query properties by bucket_id   │
│    WHERE bucket_id IN (matched_ids) │
└─────────────────────────────────────┘
    ↓
Return properties array
```

### System Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP
       ↓
┌─────────────────┐
│  Fastify API    │
│  (Validation)   │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│  @geoflow/db    │
│  (Functions)    │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│   Supabase      │
│   PostgreSQL    │
│   + PostGIS     │
└─────────────────┘
       │
       ├─── geo_buckets (GIST index)
       ├─── location_aliases (GIN trigram index)
       └─── properties (GIST index)
```

---

## 5. Scalability Considerations

### Current Design

- **GIST indexes**: Logarithmic query time (O(log n))
- **Bucket lookup**: O(1) by bucket_key, O(log n) by spatial query
- **Text matching**: O(log n) with trigram index
- **Handles**: Millions of properties efficiently

### Performance Optimizations

1. **Spatial indexes**: GIST indexes on all geography columns
2. **Bucket pre-filtering**: Reduces search space from all properties to bucket subset
3. **Trigram indexing**: Fast fuzzy text matching
4. **Composite queries**: Combine text + spatial for best results

### Future Enhancements (If Needed)

1. **H3 indexing**: More uniform hexagonal cells (if grid becomes limiting)
2. **Caching**: Cache popular location searches
3. **Bucket merging**: Merge overlapping/underutilized buckets
4. **Sharding**: Partition buckets by region for very large scale

---

## 6. Key Design Decisions

### Why Grid-Based Buckets?

- **Simple**: No external dependencies
- **Fast**: O(1) key generation and lookup
- **Sufficient**: 500m cells meet accuracy requirements
- **Debuggable**: Easy to understand and troubleshoot

### Why Hybrid Matching (Text + Coordinates)?

- **Text first**: Handles name variations ("Sangotedo" vs "Sangotedo, Ajah")
- **Coordinates fallback**: Ensures properties are grouped by physical proximity
- **Best of both**: Combines semantic understanding with spatial accuracy

### Why Database Functions?

- **Performance**: Logic runs close to data (no network round-trips)
- **Consistency**: Single source of truth for bucket assignment
- **Atomicity**: Bucket creation and property assignment in one transaction
- **Reusability**: Functions can be called from API, migrations, or scripts

### Why PostGIS GEOGRAPHY (Not GEOMETRY)?

- **Accuracy**: GEOGRAPHY uses spherical calculations (correct for lat/lng)
- **Distance**: ST_Distance returns meters (not degrees)
- **SRID 4326**: Standard WGS84 coordinate system

---

## 7. Testing Strategy

### Unit Tests

- SQL function correctness
- Bucket assignment logic
- Location normalization

### Integration Tests

- API endpoint behavior
- End-to-end property creation and search
- Required test case: 3 properties → 1 search → all returned

### Test Cases

1. **Location Matching**: "Sangotedo", "Sangotedo, Ajah", "sangotedo lagos" → same results
2. **Bucket Assignment**: Properties <500m apart → same bucket
3. **Bucket Assignment**: Properties >500m apart → different buckets
4. **API Validation**: Invalid coordinates rejected
5. **API Search**: Empty results handled gracefully

---

## 8. Summary

This geo-bucket system solves the location normalization problem by:

1. **Grouping by space**: Properties are grouped by physical proximity (500m buckets)
2. **Matching by text**: Location name variations are handled via fuzzy text matching
3. **Database-first**: All geo logic lives in SQL functions for performance and consistency
4. **Scalable**: Indexed queries ensure logarithmic performance even at scale

The system guarantees that searching "Sangotedo" returns ALL properties in that geographic area, regardless of how agents labeled them.

