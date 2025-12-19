"use client";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { SearchBar } from "@/components/search/search-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Layers, ArrowRight, Map, Building2 } from "lucide-react";
import { useBucketStats } from "@/lib/hooks/use-buckets";

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="stat-card card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatsSection() {
  const { data: stats, isLoading } = useBucketStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="stat-card">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-32 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard
        title="Total Properties"
        value={stats?.total_properties ?? 0}
        description="Properties in database"
        icon={MapPin}
      />
      <StatsCard
        title="Geo-Buckets"
        value={stats?.total_buckets ?? 0}
        description="Spatial buckets created"
        icon={Layers}
      />
      <StatsCard
        title="Avg per Bucket"
        value={stats ? Math.round(stats.avg_properties_per_bucket) : 0}
        description="Average properties per bucket"
        icon={TrendingUp}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b">
          <div className="container py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                Property Search
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Find properties by location with intelligent geo-bucket grouping.
                Consistent results for &quot;Sangotedo&quot;, &quot;sangotedo lagos&quot;, 
                or &quot;Sangotedo, Ajah&quot;.
              </p>
              <div className="pt-2">
                <SearchBar />
              </div>
            </div>
          </div>
        </section>

        <div className="container py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Stats */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Statistics
            </h2>
            <StatsSection />
          </section>

          {/* Quick Actions */}
          <section className="grid gap-4 md:grid-cols-2">
            <Card className="card-hover group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <CardTitle className="text-lg">Browse Properties</CardTitle>
                </div>
                <CardDescription>
                  View all properties in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/properties" className="gap-2">
                    View All
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Map className="h-5 w-5" />
                  <CardTitle className="text-lg">Interactive Map</CardTitle>
                </div>
                <CardDescription>
                  Explore properties on an interactive map
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/map" className="gap-2">
                    Open Map
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* How it works */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              How it works
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Normalization",
                  description: "Location names are normalized to a standard format regardless of case or formatting.",
                },
                {
                  step: "02",
                  title: "Spatial Bucketing",
                  description: "Properties within ~500m are grouped into the same bucket for consistent results.",
                },
                {
                  step: "03",
                  title: "Smart Matching",
                  description: "Any variation of a location name returns relevant properties from matching buckets.",
                },
              ].map((item) => (
                <div key={item.step} className="space-y-3">
                  <span className="text-sm font-mono text-muted-foreground">{item.step}</span>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="font-medium text-foreground">GeoFlow</span>
            </div>
            <p>Built with Next.js, PostGIS & Supabase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
