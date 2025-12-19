# GeoFlow Web Application

Next.js 16 frontend for the Geo-Bucket property search system.

## Features

- Property search with location normalization
- Interactive map with Leaflet
- Full CRUD operations for properties
- Real-time bucket statistics
- Responsive design with Tailwind CSS

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

Create a `.env.local` file:

```bash
# Backend API URL (server-side only)
API_URL=http://localhost:3001
```

## Architecture

- **Next.js API Routes**: Proxy layer to hide backend API URL
- **React Query**: Server state management
- **Leaflet**: Interactive mapping
- **shadcn/ui**: UI components

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/             # Utilities and API client
└── api/             # Next.js API route proxies
```
