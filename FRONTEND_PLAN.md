# Frontend Implementation Plan - Next.js 16 UI

## 🎯 Overview

Build a modern, beautiful web interface for the Geo-Bucket property search system with full CRUD operations and interactive mapping.

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [UI/UX Design](#uiux-design)
4. [Mapping Library](#mapping-library)
5. [Feature Breakdown](#feature-breakdown)
6. [Component Architecture](#component-architecture)
7. [API Integration](#api-integration)
8. [State Management](#state-management)
9. [Routing Structure](#routing-structure)
10. [Implementation Phases](#implementation-phases)

---

## 🛠️ Tech Stack

### Core Framework

- **Next.js 16** (App Router)
- **TypeScript 5.9+**
- **React 19** (with Next.js)

### UI Framework

- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful, accessible components built on Radix UI
- **Lucide React** - Icon library

### Mapping

- **Leaflet** + **React-Leaflet** - Lightweight, open-source mapping
  - Alternative: **Mapbox GL JS** (if premium features needed)
  - Alternative: **Google Maps** (if budget allows)

### Form Handling

- **React Hook Form** - Performant forms
- **Zod** - Schema validation (already in use)

### Data Fetching

- **TanStack Query (React Query)** - Server state management
- **SWR** (alternative) - Lightweight option

### Additional Libraries

- **Zustand** or **Jotai** - Client state management (if needed)
- **date-fns** - Date formatting
- **clsx** / **tailwind-merge** - Conditional styling

---

## 📁 Project Structure

```
geoflow/
├── apps/
│   ├── api/              # Existing Fastify API
│   ├── seed/             # Existing seed script
│   └── web/              # NEW: Next.js 16 frontend
│       ├── app/          # App Router
│       │   ├── (auth)/   # Auth routes (if needed)
│       │   ├── (dashboard)/
│       │   │   ├── properties/
│       │   │   │   ├── page.tsx          # List view
│       │   │   │   ├── new/
│       │   │   │   │   └── page.tsx      # Create form
│       │   │   │   ├── [id]/
│       │   │   │   │   ├── page.tsx      # Detail view
│       │   │   │   │   └── edit/
│       │   │   │   │       └── page.tsx  # Edit form
│       │   │   ├── search/
│       │   │   │   └── page.tsx          # Search with map
│       │   │   ├── map/
│       │   │   │   └── page.tsx          # Full-screen map view
│       │   │   └── stats/
│       │   │       └── page.tsx          # Bucket statistics
│       │   ├── api/                      # API routes (if needed)
│       │   ├── layout.tsx
│       │   └── page.tsx                 # Homepage
│       ├── components/
│       │   ├── ui/                      # shadcn/ui components
│       │   ├── properties/
│       │   │   ├── PropertyCard.tsx
│       │   │   ├── PropertyForm.tsx
│       │   │   ├── PropertyList.tsx
│       │   │   └── PropertyDetail.tsx
│       │   ├── map/
│       │   │   ├── PropertyMap.tsx
│       │   │   ├── MapMarker.tsx
│       │   │   └── MapControls.tsx
│       │   ├── search/
│       │   │   ├── SearchBar.tsx
│       │   │   └── SearchResults.tsx
│       │   └── layout/
│       │       ├── Header.tsx
│       │       ├── Sidebar.tsx
│       │       └── Footer.tsx
│       ├── lib/
│       │   ├── api.ts                   # API client
│       │   ├── utils.ts                 # Utilities
│       │   └── hooks/
│       │       ├── useProperties.ts
│       │       ├── useSearch.ts
│       │       └── useMap.ts
│       ├── public/
│       │   └── leaflet/                 # Leaflet assets
│       ├── styles/
│       │   └── globals.css
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── packages/
│   ├── db/              # Existing
│   ├── types/            # Existing
│   └── ui/               # NEW: Shared UI components (optional)
└── ...
```

---

## 🎨 UI/UX Design

### Design Principles

- **Modern & Clean**: Minimal, spacious layouts
- **Responsive**: Mobile-first approach
- **Accessible**: WCAG 2.1 AA compliance
- **Fast**: Optimistic updates, loading states
- **Intuitive**: Clear navigation, helpful feedback

### Color Scheme

- **Primary**: Blue/Teal (trust, location)
- **Secondary**: Green (success, growth)
- **Accent**: Orange/Amber (highlights, CTAs)
- **Neutral**: Gray scale for text/backgrounds
- **Dark Mode**: Full support

### Typography

- **Headings**: Inter or Geist (modern, readable)
- **Body**: System font stack
- **Monospace**: For coordinates/IDs

### Layout

- **Header**: Logo, navigation, search bar
- **Main Content**: Grid/list view with sidebar filters
- **Map View**: Full-screen or split-screen
- **Footer**: Links, stats, version

---

## 🗺️ Mapping Library

### Recommendation: **Leaflet + React-Leaflet**

**Why Leaflet?**

- ✅ Free & open-source
- ✅ Lightweight (~40KB)
- ✅ Highly customizable
- ✅ Great React integration
- ✅ Works with OpenStreetMap (free tiles)
- ✅ Mobile-friendly

**Features:**

- Interactive map with zoom/pan
- Property markers with popups
- Cluster markers for many properties
- Draw/search area
- Current location
- Custom tile layers (optional: Mapbox, Google)

**Alternative: Mapbox GL JS**

- More advanced features
- Better performance at scale
- Requires API key (free tier available)
- Better 3D support

---

## ✨ Feature Breakdown

### 1. **Homepage** (`/`)

- Hero section with search
- Quick stats (total properties, buckets)
- Featured properties grid
- Map preview

### 2. **Properties List** (`/properties`)

- **View**: Grid/List toggle
- **Filters**: Location, price range, bedrooms, bathrooms
- **Sort**: Price, date, location
- **Pagination**: Infinite scroll or page-based
- **Actions**: Create, View, Edit, Delete

### 3. **Property Detail** (`/properties/[id]`)

- Full property information
- Large map with marker
- Related properties (same bucket)
- Edit/Delete actions

### 4. **Create Property** (`/properties/new`)

- Form with validation
- Map picker for coordinates
- Real-time coordinate display
- Auto-assign to bucket (show bucket info)

### 5. **Edit Property** (`/properties/[id]/edit`)

- Pre-filled form
- Update location (re-assign bucket if needed)
- Save changes

### 6. **Search** (`/search`)

- Search bar (prominent)
- Results list + map side-by-side
- Location autocomplete
- Filter by similarity score
- Show bucket grouping

### 7. **Map View** (`/map`)

- Full-screen interactive map
- All properties as markers
- Cluster groups
- Click marker → show property card
- Search overlay
- Filter controls

### 8. **Statistics** (`/stats`)

- Bucket statistics dashboard
- Charts (total buckets, properties per bucket)
- Visualizations
- Export data

---

## 🧩 Component Architecture

### Core Components

#### `PropertyCard`

- Property image placeholder
- Title, location, price
- Quick stats (bedrooms, bathrooms)
- Actions (view, edit, delete)
- Map preview thumbnail

#### `PropertyForm`

- Title input
- Location name input
- Coordinate inputs (lat/lng)
- Map picker (click to set coordinates)
- Price, bedrooms, bathrooms
- Submit/Cancel buttons
- Validation errors

#### `PropertyMap`

- Leaflet map container
- Markers for properties
- Popup on marker click
- Zoom to bounds
- Current location button
- Search location

#### `SearchBar`

- Input with autocomplete
- Search button
- Recent searches
- Suggestions

#### `PropertyList`

- Grid/List view toggle
- Filter sidebar
- Sort dropdown
- Pagination
- Empty state

---

## 🔌 API Integration

### API Client (`lib/api.ts`)

```typescript
// Centralized API client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = {
  properties: {
    list: () => fetch(`${API_BASE}/api/properties`),
    get: (id: number) => fetch(`${API_BASE}/api/properties/${id}`),
    create: (data: CreatePropertyRequest) =>
      fetch(`${API_BASE}/api/properties`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: UpdatePropertyRequest) =>
      fetch(`${API_BASE}/api/properties/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetch(`${API_BASE}/api/properties/${id}`, { method: "DELETE" }),
  },
  search: {
    byLocation: (location: string) =>
      fetch(
        `${API_BASE}/api/properties/search?location=${encodeURIComponent(location)}`
      ),
  },
  buckets: {
    stats: () => fetch(`${API_BASE}/api/geo-buckets/stats`),
  },
};
```

### React Query Hooks

```typescript
// useProperties.ts
export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list().then((r) => r.json()),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.properties.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}
```

---

## 📊 State Management

### Server State

- **TanStack Query** - All API data
- Automatic caching, refetching, optimistic updates

### Client State

- **React Context** or **Zustand** - UI state (filters, view mode)
- **URL Search Params** - Search query, filters (shareable URLs)

### Form State

- **React Hook Form** - All form inputs
- **Zod** - Validation schemas

---

## 🛣️ Routing Structure

```
/                           # Homepage
/properties                 # List all properties
/properties/new             # Create property
/properties/[id]            # View property detail
/properties/[id]/edit       # Edit property
/search                     # Search with map
/search?location=sangotedo  # Search results
/map                        # Full-screen map
/stats                      # Bucket statistics
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Day 1)

- [ ] Set up Next.js 16 app
- [ ] Install dependencies (Tailwind, shadcn/ui, Leaflet)
- [ ] Configure TypeScript, ESLint
- [ ] Set up API client
- [ ] Create basic layout (Header, Footer)

### Phase 2: Core UI (Day 2)

- [ ] Install shadcn/ui components
- [ ] Create PropertyCard component
- [ ] Create PropertyList page
- [ ] Create PropertyDetail page
- [ ] Basic styling and responsive design

### Phase 3: CRUD Operations (Day 3)

- [ ] Create PropertyForm component
- [ ] Implement Create property page
- [ ] Implement Edit property page
- [ ] Implement Delete functionality
- [ ] Add React Query hooks
- [ ] Error handling and loading states

### Phase 4: Mapping (Day 4)

- [ ] Set up Leaflet map
- [ ] Create PropertyMap component
- [ ] Add markers for properties
- [ ] Implement map in detail view
- [ ] Create full-screen map page
- [ ] Add map controls (zoom, current location)

### Phase 5: Search & Filters (Day 5)

- [ ] Create SearchBar component
- [ ] Implement search page
- [ ] Add filters (price, bedrooms, bathrooms)
- [ ] Add sorting
- [ ] Integrate search with map
- [ ] Show bucket grouping

### Phase 6: Polish & Enhancement (Day 6)

- [ ] Add statistics dashboard
- [ ] Improve animations and transitions
- [ ] Add loading skeletons
- [ ] Optimize images and assets
- [ ] Add error boundaries
- [ ] Performance optimization
- [ ] Accessibility improvements

---

## 📦 Dependencies to Install

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.23.8",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13"
  }
}
```

---

## 🎯 Key Features

### Must-Have

- ✅ Full CRUD operations
- ✅ Interactive map with markers
- ✅ Search with location normalization
- ✅ Responsive design
- ✅ Beautiful, modern UI

### Nice-to-Have

- 🌟 Property image upload
- 🌟 Advanced filters
- 🌟 Export to CSV/JSON
- 🌟 Dark mode
- 🌟 Property comparison
- 🌟 Favorites/bookmarks
- 🌟 Share property links

---

## 🔒 Security Considerations

- API URL from environment variables
- Input sanitization (Zod validation)
- CORS configuration on API
- Rate limiting (if needed)
- Error message sanitization

---

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

---

## ✅ Success Criteria

1. All CRUD operations work seamlessly
2. Map displays all properties correctly
3. Search returns consistent results
4. UI is beautiful and intuitive
5. App is fully responsive
6. Performance is fast (< 3s load time)
7. Accessibility standards met

---

## 🚦 Next Steps

1. Review and approve this plan
2. Set up Next.js 16 app structure
3. Install and configure dependencies
4. Start with Phase 1 (Foundation)
5. Iterate through phases

---

**Ready to proceed?** Let me know if you want any changes to this plan before we start implementation!
