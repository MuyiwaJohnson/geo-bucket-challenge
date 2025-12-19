"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBucketStats } from "@/lib/hooks/use-buckets";
import { useProperties } from "@/lib/hooks/use-properties";
import { Layers, MapPin, TrendingUp, BarChart3, Loader2 } from "lucide-react";

function StatCard({
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const { data: stats, isLoading: statsLoading } = useBucketStats();
  const { data: properties, isLoading: propertiesLoading } = useProperties();

  const isLoading = statsLoading || propertiesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Statistics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Overview of geo-bucket system performance
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Properties"
              value={stats?.total_properties ?? 0}
              description="Properties in database"
              icon={MapPin}
            />
            <StatCard
              title="Geo-Buckets"
              value={stats?.total_buckets ?? 0}
              description="Spatial buckets created"
              icon={Layers}
            />
            <StatCard
              title="Avg per Bucket"
              value={stats ? Math.round(stats.avg_properties_per_bucket) : 0}
              description="Average properties per bucket"
              icon={TrendingUp}
            />
            <StatCard
              title="Max per Bucket"
              value={stats?.max_properties_per_bucket ?? 0}
              description="Maximum properties in a bucket"
              icon={BarChart3}
            />
          </div>

          {stats && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bucket Distribution</CardTitle>
                  <CardDescription>
                    Properties distribution across buckets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Minimum
                      </span>
                      <span className="font-semibold">
                        {stats.min_properties_per_bucket}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Average
                      </span>
                      <span className="font-semibold">
                        {Math.round(stats.avg_properties_per_bucket)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Maximum
                      </span>
                      <span className="font-semibold">
                        {stats.max_properties_per_bucket}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>
                    Overall system metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Properties
                      </span>
                      <span className="font-semibold">
                        {properties?.length ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Buckets
                      </span>
                      <span className="font-semibold">
                        {stats.total_buckets}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Coverage
                      </span>
                      <span className="font-semibold">
                        {stats.total_buckets > 0
                          ? `${((stats.total_properties / stats.total_buckets) * 100).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

