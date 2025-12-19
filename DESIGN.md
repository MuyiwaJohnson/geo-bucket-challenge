# GeoFlow - Technical Design

## Problem

Property listings have inconsistent location names:

- "Sangotedo" vs "Sangotedo, Ajah" vs "sangotedo lagos"
- Traditional search returns fragmented results
- Users miss relevant properties

## Solution: Geo-Buckets

Group properties by **physical proximity** (~500m), not text matching.

```
Search "Sangotedo" → Find all buckets with similar aliases → Return ALL properties in those buckets
```

---

## Database Schema

```sql
-- Spatial containers (~500m radius)
geo_buckets (id, bucket_key, center_point, bounds)

-- Location name → bucket mapping
location_aliases (id, alias, bucket_id)

-- Property listings
properties (id, title, location_name, location, bucket_id, ...)
```

**Indexes**: GIST (spatial), GIN trigram (fuzzy text)

---

## Core Algorithms

### Bucket Assignment

```
1. Normalize name: "Sangotedo, Ajah" → "sangotedo ajah"
2. Generate key from coordinates: "grid:1293,725"
3. Find existing bucket OR create new one
4. Store location alias
5. Assign property to bucket
```

### Search

```
1. Normalize query: "Sangotedo" → "sangotedo"
2. Fuzzy match aliases: similarity > 0.3
3. Get properties from matching buckets
4. Filter by location name similarity
5. Return sorted results
```

---

## Key PostGIS Functions

| Function                | Purpose                       |
| ----------------------- | ----------------------------- |
| `ST_Point(lng, lat)`    | Create coordinate point       |
| `ST_DWithin(a, b, 500)` | Check if within 500m          |
| `ST_Buffer(point, 500)` | Create 500m boundary          |
| `similarity(a, b)`      | Trigram text similarity (0-1) |

---

## API Endpoints

```
GET  /api/properties              # List all
GET  /api/properties/:id          # Get one
POST /api/properties              # Create
PUT  /api/properties/:id          # Update
DELETE /api/properties/:id        # Delete
GET  /api/properties/search?location=X  # SEARCH (core feature)
GET  /api/geo-buckets/stats       # Statistics
```

---

## Project Structure

```
geoflow/
├── apps/api/       # Fastify REST API
├── apps/web/       # Next.js frontend
├── packages/db/    # Database client + functions
└── packages/types/ # Shared TypeScript types
```

---

## Why This Design?

| Decision           | Reason                               |
| ------------------ | ------------------------------------ |
| PostGIS            | Built-in, accurate, no external deps |
| Grid buckets       | Simple, fast, sufficient for 500m    |
| Fuzzy matching     | Handles typos and variations         |
| Database functions | Performance, atomicity               |
| Monorepo           | Shared types, unified tooling        |

---

## Performance

- **GIST indexes**: O(log n) spatial queries
- **Trigram indexes**: O(log n) text matching
- **Bucket pre-filtering**: Reduces search space
- **All SQL**: No network round-trips for logic
