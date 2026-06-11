"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Organization, CATEGORY_LABELS } from "@/data/types";

// ==========================================
// Color mapping for category markers
// ==========================================
const MARKER_COLORS: Record<string, string> = {
  financial_literacy: "#d4a843",
  startup: "#2dd4bf",
  leadership: "#a78bfa",
  community: "#60a5fa",
  grassroots: "#fb7185",
};

interface MapViewProps {
  organizations: Organization[];
  onSelectOrg: (org: Organization) => void;
}

export default function MapView({ organizations, onSelectOrg }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Expose detail modal trigger to global window for Mapbox HTML popups
  useEffect(() => {
    (window as any).showOrgDetails = (id: string) => {
      const org = organizations.find((o) => o.id === id);
      if (org) {
        onSelectOrg(org);
      }
    };
    return () => {
      delete (window as any).showOrgDetails;
    };
  }, [organizations, onSelectOrg]);

  // Initialize map
  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-98.5, 39.0], // Center of US
      zoom: 3.5,
      pitch: 0,
      attributionControl: false,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.current.on("load", () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token]);

  // Update markers when organizations or map readiness changes
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers and active popup
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }

    // Add markers for orgs that have coordinates
    const orgsWithCoords = organizations.filter(
      (o) => typeof o.lat === "number" && typeof o.lng === "number"
    );

    const locationCounts: Record<string, number> = {};

    orgsWithCoords.forEach((org) => {
      // Create a deterministic offset for overlapping coordinates
      const coordKey = `${org.lat!.toFixed(4)},${org.lng!.toFixed(4)}`;
      const index = locationCounts[coordKey] || 0;
      locationCounts[coordKey] = index + 1;

      let markerLat = org.lat!;
      let markerLng = org.lng!;

      if (index > 0) {
        // Offset using a radial layout
        const angle = (index * 2 * Math.PI) / 8;
        // 0.08 degrees (~8km) separates markers clearly at low/mid zoom levels
        const radius = 0.08 * Math.ceil(index / 8);
        markerLat += Math.sin(angle) * radius;
        markerLng += Math.cos(angle) * radius;
      }

      // Custom marker element acting as a generous hit box (36px x 36px)
      const el = document.createElement("div");
      el.style.width = "36px";
      el.style.height = "36px";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";

      // Inner circle to support scale transformations without overriding Mapbox's positioning transform
      const circle = document.createElement("div");
      circle.style.width = "14px";
      circle.style.height = "14px";
      circle.style.borderRadius = "50%";
      circle.style.backgroundColor = MARKER_COLORS[org.category] || "#d4a843";
      circle.style.border = "2px solid rgba(255,255,255,0.8)";
      circle.style.transition = "transform 150ms ease, box-shadow 150ms ease";
      circle.style.boxShadow = `0 0 8px ${MARKER_COLORS[org.category] || "#d4a843"}55`;
      el.appendChild(circle);

      el.addEventListener("mouseenter", () => {
        circle.style.transform = "scale(1.6)";
        circle.style.boxShadow = `0 0 16px ${MARKER_COLORS[org.category] || "#d4a843"}99`;
        el.style.zIndex = "10";
        if (el.parentElement) {
          el.parentElement.style.zIndex = "10";
        }
      });
      el.addEventListener("mouseleave", () => {
        circle.style.transform = "scale(1)";
        circle.style.boxShadow = `0 0 8px ${MARKER_COLORS[org.category] || "#d4a843"}55`;
        el.style.zIndex = "1";
        if (el.parentElement) {
          el.parentElement.style.zIndex = "1";
        }
      });

      el.title = org.name; // Browser native tooltip on hover

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 16,
        closeButton: true,
        closeOnClick: true,
        maxWidth: "280px",
        focusAfterOpen: false,
      }).setHTML(`
        <div style="
          font-family: 'Inter', sans-serif;
          background: #1a2236;
          color: #f1f5f9;
          padding: 4px 2px 0 2px;
          border-radius: 8px;
        ">
          <div style="
            font-size: 0.68rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: ${MARKER_COLORS[org.category]};
            margin-bottom: 4px;
          ">${CATEGORY_LABELS[org.category]}</div>
          <div style="
            font-family: 'Outfit', sans-serif;
            font-size: 0.92rem;
            font-weight: 700;
            margin-bottom: 4px;
            line-height: 1.3;
          ">${org.name}</div>
          <div style="
            font-size: 0.75rem;
            color: #94a3b8;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 6px;
          ">${org.mission}</div>
          <div style="
            font-size: 0.7rem;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
          ">
            <span>📍 ${org.location_city}, ${org.location_state}</span>
            <span>📅 ${org.year_featured}</span>
          </div>
          <div style="
            display: flex;
            gap: 6px;
            margin-top: 8px;
          ">
            <button 
              onclick="window.showOrgDetails('${org.id}')"
              style="
                background: ${MARKER_COLORS[org.category]};
                color: #0a0e1a;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                font-size: 0.7rem;
                font-weight: 700;
                cursor: pointer;
                font-family: 'Inter', sans-serif;
                transition: opacity 150ms ease;
              "
              onmouseover="this.style.opacity='0.85'"
              onmouseout="this.style.opacity='1'"
            >
              View Details
            </button>
            ${org.source_url ? `
              <a 
                href="${org.source_url}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="
                  background: rgba(255,255,255,0.08);
                  color: #f1f5f9;
                  border: 1px solid rgba(255,255,255,0.12);
                  border-radius: 4px;
                  padding: 4px 10px;
                  font-size: 0.7rem;
                  font-weight: 600;
                  text-decoration: none;
                  display: inline-flex;
                  align-items: center;
                  font-family: 'Inter', sans-serif;
                  transition: background 150ms ease;
                "
                onmouseover="this.style.background='rgba(255,255,255,0.15)'"
                onmouseout="this.style.background='rgba(255,255,255,0.08)'"
              >
                Website ↗
              </a>
            ` : ''}
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([markerLng, markerLat])
        .addTo(map.current!);

      // Click opens the persistent popup anchored in-place
      el.addEventListener("click", (e) => {
        e.stopPropagation();

        // Close any active popup first
        if (activePopupRef.current && activePopupRef.current !== popup) {
          activePopupRef.current.remove();
        }

        if (popup.isOpen()) {
          popup.remove();
          activePopupRef.current = null;
        } else {
          popup.setLngLat([markerLng, markerLat]).addTo(map.current!);
          activePopupRef.current = popup;
        }
      });

      markersRef.current.push(marker);
    });

    // If we have orgs, fit bounds to show all safely
    if (orgsWithCoords.length > 1 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      orgsWithCoords.forEach((o) => bounds.extend([o.lng!, o.lat!]));
      
      const mapObj = map.current;
      // Wait for canvas dimensions to be populated
      const canvas = mapObj.getCanvas();
      if (canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0) {
        mapObj.fitBounds(bounds, {
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          maxZoom: 12,
          duration: 800,
        });
      } else {
        // Fallback: wait a tick
        setTimeout(() => {
          if (!mapObj.isStyleLoaded()) return;
          mapObj.fitBounds(bounds, {
            padding: { top: 40, bottom: 40, left: 40, right: 40 },
            maxZoom: 12,
            duration: 800,
          });
        }, 100);
      }
    }
  }, [organizations, mapReady, onSelectOrg]);

  // No token — show placeholder
  if (!token) {
    return (
      <div className="map-placeholder">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🗺️</div>
          <p style={{ fontWeight: 500 }}>Interactive Map</p>
          <p style={{ fontSize: "0.75rem", marginTop: 4, color: "var(--color-text-muted)" }}>
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to activate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-wrapper" style={{ position: "relative", width: "100%", height: "420px", marginBottom: "24px" }}>
      <div
        ref={mapContainer}
        className="map-container"
        style={{ width: "100%", height: "100%", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}
      />
      {/* Legend overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          background: "rgba(26, 34, 54, 0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(148,163,184,0.12)",
          borderRadius: 10,
          padding: "10px 14px",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          gap: 5,
          fontSize: "0.7rem",
        }}
      >
        {Object.entries(MARKER_COLORS).map(([cat, color]) => (
          <div
            key={cat}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#94a3b8" }}>
              {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
