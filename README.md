# Geo-Bucket Backend System

A backend service that returns consistent property search results for a given location using geo-buckets, ensuring that properties in the same physical area are returned regardless of location name variations or slight coordinate differences.

## Features

- **Geo-Bucket System**: Groups nearby properties into spatial buckets (~500m radius)
- **Fuzzy Location Matching**: Handles location name variations and typos
- **PostGIS Integration**: Uses spatial indexes for efficient geo queries
- **Fastify API**: Fast, lightweight HTTP server
- **TypeScript**: Full type safety across the stack

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10.4.1
- **Supabase Account** (with PostGIS enabled)
- **PostgreSQL** (via Supabase)

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd geoflow
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create `.env.local` files in each app directory (following Turborepo best practices):

```bash
# For the API server
cd apps/api
cp .env-template .env.local
# Edit .env.local with your Supabase credentials

# For the seed script
cd ../seed
cp .env-template .env.local
# Edit .env.local with your Supabase credentials

# For database migrations (optional)
cd ../../packages/db
cp .env-template .env.local
# Edit .env.local with your DATABASE_URL
```

**Required variables:**

```env
# SUPABASE (for @geoflow/db - Supabase client)
# Get from: Supabase Dashboard > Settings > API
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Configuration (apps/api only)
PORT=3000
HOST=0.0.0.0

# DATABASE (packages/db only - for migrations)
# Get from: Supabase Dashboard > Settings > Database > Connection String
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

4. **Set up the database**

Run the migration to create tables and functions:

```bash
# Connect to your Supabase database and run:
psql $DATABASE_URL -f packages/db/migrations/001_initial_schema.sql
```

Or use Supabase SQL Editor:

- Copy the contents of `packages/db/migrations/001_initial_schema.sql`
- Paste into Supabase SQL Editor
- Execute

## Running the Application

### Development Mode

Start the API server:

```bash
pnpm dev
```

The API will be available at `http://localhost:3000`

### Production Mode

Build and start:

```bash
pnpm build
pnpm start
```

## Seeding the Database

### Option 1: TypeScript Seed Script (Recommended)

Tests the full API flow:

```bash
cd apps/seed
pnpm seed
```

### Option 2: SQL Seed Script

Direct database insertion:

```bash
psql $DATABASE_URL -f apps/seed/seed.sql
```

## Running Tests

```bash
pnpm test
```

Or run tests for a specific package:

```bash
cd tests
pnpm test
```

## API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### 1. Create Property

**POST** `/api/properties`

Creates a new property and automatically assigns it to a geo-bucket.

**Request Body:**

```json
{
  "title": "3BR Flat in Sangotedo",
  "location_name": "Sangotedo",
  "lat": 6.4698,
  "lng": 3.6285,
  "price": 5000000,
  "bedrooms": 3,
  "bathrooms": 2
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "title": "3BR Flat in Sangotedo",
  "location_name": "Sangotedo",
  "lat": 6.4698,
  "lng": 3.6285,
  "price": 5000000,
  "bedrooms": 3,
  "bathrooms": 2,
  "bucket_id": 1,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Validation:**

- `title`: Required, non-empty string
- `location_name`: Required, non-empty string
- `lat`: Required, number between -90 and 90
- `lng`: Required, number between -180 and 180
- `price`: Optional, positive number
- `bedrooms`: Optional, non-negative integer
- `bathrooms`: Optional, non-negative integer

---

#### 2. Search Properties by Location

**GET** `/api/properties/search?location=sangotedo`

Searches for properties by location name (case-insensitive, typo-tolerant).

**Query Parameters:**

- `location` (required): Location name to search for

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "title": "3BR Flat in Sangotedo",
    "location_name": "Sangotedo",
    "lat": 6.4698,
    "lng": 3.6285,
    "price": 5000000,
    "bedrooms": 3,
    "bathrooms": 2,
    "bucket_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "title": "2BR Apartment near Ajah",
    "location_name": "Sangotedo, Ajah",
    "lat": 6.472,
    "lng": 3.6301,
    "price": 3500000,
    "bedrooms": 2,
    "bathrooms": 1,
    "bucket_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Examples:**

```bash
# Case-insensitive
GET /api/properties/search?location=sangotedo
GET /api/properties/search?location=SANGOTEDO
GET /api/properties/search?location=Sangotedo

# All return the same results
```

---

#### 3. Get Bucket Statistics

**GET** `/api/geo-buckets/stats`

Returns statistics about geo-buckets and property distribution.

**Response:** `200 OK`

```json
{
  "total_buckets": 5,
  "total_properties": 12,
  "avg_properties_per_bucket": 2.4,
  "max_properties_per_bucket": 4,
  "min_properties_per_bucket": 1
}
```

---

#### 4. Health Check

**GET** `/health`

Returns server health status.

**Response:** `200 OK`

```json
{
  "status": "ok"
}
```

## Example Requests

### Using cURL

**Create a property:**

```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "title": "3BR Flat in Sangotedo",
    "location_name": "Sangotedo",
    "lat": 6.4698,
    "lng": 3.6285,
    "price": 5000000,
    "bedrooms": 3,
    "bathrooms": 2
  }'
```

**Search for properties:**

```bash
curl "http://localhost:3000/api/properties/search?location=sangotedo"
```

**Get bucket stats:**

```bash
curl "http://localhost:3000/api/geo-buckets/stats"
```

### Using JavaScript/TypeScript

```typescript
// Create property
const response = await fetch("http://localhost:3000/api/properties", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "3BR Flat in Sangotedo",
    location_name: "Sangotedo",
    lat: 6.4698,
    lng: 3.6285,
    price: 5000000,
    bedrooms: 3,
    bathrooms: 2,
  }),
});

const property = await response.json();

// Search properties
const searchResponse = await fetch(
  "http://localhost:3000/api/properties/search?location=sangotedo"
);
const properties = await searchResponse.json();
```

## Required Test Case

The system must handle the following test case:

1. **Create 3 properties with different location names but same area:**

```bash
# Property 1
POST /api/properties
{
  "location_name": "Sangotedo",
  "lat": 6.4698,
  "lng": 3.6285
}

# Property 2
POST /api/properties
{
  "location_name": "Sangotedo, Ajah",
  "lat": 6.4720,
  "lng": 3.6301
}

# Property 3
POST /api/properties
{
  "location_name": "sangotedo lagos",
  "lat": 6.4705,
  "lng": 3.6290
}
```

2. **Search for "sangotedo":**

```bash
GET /api/properties/search?location=sangotedo
```

3. **Expected Result:** All 3 properties should be returned.

## Project Structure

```
geoflow/
├── apps/
│   ├── api/              # Fastify backend service
│   └── seed/             # Database seeding scripts
├── packages/
│   ├── db/               # Database layer (Supabase client, functions)
│   ├── types/            # Shared TypeScript types
│   ├── eslint-config/    # Shared ESLint configuration
│   └── typescript-config/# Shared TypeScript configuration
├── tests/                # Integration tests
├── DESIGN.md             # Architecture design document
└── README.md             # This file
```

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase) + PostGIS
- **Monorepo**: Turborepo
- **Package Manager**: pnpm

## Key Features

### Geo-Bucket System

- Grid-based buckets (~500m cells)
- Automatic bucket assignment
- Spatial indexing for fast queries

### Location Matching

- Fuzzy text matching (trigram similarity)
- Case-insensitive search
- Typo tolerance
- Coordinate-based fallback

### Performance

- GIST spatial indexes
- GIN trigram indexes
- Database-first geo logic
- Logarithmic query complexity

## Troubleshooting

### Database Connection Issues

Ensure your `.env` file has correct Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### PostGIS Not Available

Supabase has PostGIS enabled by default. If you're using a different PostgreSQL instance, enable it:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Migration Errors

If migrations fail, ensure:

1. PostGIS extension is enabled
2. `pg_trgm` extension is enabled
3. You have proper database permissions

## Development

### Adding New Endpoints

1. Create route file in `apps/api/src/routes/`
2. Register route in `apps/api/src/index.ts`
3. Add validation schema in `apps/api/src/lib/validation.ts`

### Modifying Database Schema

1. Update `packages/db/migrations/001_initial_schema.sql`
2. Run migration on database
3. Update TypeScript types in `packages/db/src/types.ts`

## License

Private project for ExpertListing assessment.

## Author

Built for ExpertListing Geo-Bucket Backend Assessment.
