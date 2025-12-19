"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PropertyResponse } from "@geoflow/types";
import { Loader2 } from "lucide-react";

let iconFixed = false;
function fixLeafletIcons() {
  if (typeof window !== "undefined" && !iconFixed) {
    iconFixed = true;
    const prototype = L.Icon.Default.prototype as { _getIconUrl?: unknown };
    delete prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }
}

interface PropertyMapProps {
  properties: PropertyResponse[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export function PropertyMap({
  properties,
  center = [6.4698, 3.6285],
  zoom = 13,
  height = "400px",
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    fixLeafletIcons();

    mapRef.current = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);

    requestAnimationFrame(() => {
      setIsLoading(false);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };

    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [isLoading]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    properties.forEach((property, index) => {
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background: #111;
            color: #fff;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 11px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            border: 2px solid #fff;
            font-family: system-ui, sans-serif;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13],
      });

      const marker = L.marker([property.lat, property.lng], {
        icon: customIcon,
      }).addTo(mapRef.current!);

      const popupContent = `
        <div style="padding: 10px; min-width: 180px; font-family: system-ui, sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="
              background: #111;
              color: #fff;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 10px;
            ">${index + 1}</span>
            <h3 style="font-weight: 600; margin: 0; font-size: 13px; color: #111;">${property.title}</h3>
          </div>
          <p style="color: #737373; margin: 0 0 4px 0; font-size: 12px;">${property.location_name}</p>
          <p style="font-weight: 600; margin: 0; font-size: 14px; color: #111;">
            ${property.price ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(property.price) : "N/A"}
          </p>
          ${property.bedrooms ? `<p style="color: #737373; margin: 4px 0 0 0; font-size: 11px;">${property.bedrooms} beds · ${property.bathrooms ?? 0} baths</p>` : ""}
        </div>
      `;
      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    if (properties.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        properties.map((p) => [p.lat, p.lng] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [properties, isLoading]);

  const containerStyle =
    height === "100%"
      ? { height: "100%", minHeight: "400px", position: "relative" as const }
      : { height, position: "relative" as const };

  return (
    <div style={containerStyle} className="w-full rounded-lg overflow-hidden">
      <div
        ref={containerRef}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      />
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
          }}
        >
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
