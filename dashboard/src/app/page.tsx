"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Rocket, Users, Building2, Heart, DollarSign,
  MapPin, Calendar, Search, ExternalLink,
  TrendingUp, BarChart3, Globe, Filter,
  X, ChevronRight, Award, Landmark, Loader2
} from "lucide-react";
import { SEED_DATA } from "@/data/seed";
import { createClient } from "@/utils/supabase/client";
import {
  Organization, OrgCategory,
  CATEGORY_LABELS, CATEGORY_BADGE
} from "@/data/types";

// Dynamic import for MapView (SSR disabled — Mapbox requires window)
const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

// ==========================================
// TAB CONFIG
// ==========================================

const TABS: { key: OrgCategory | "all"; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "Overview", icon: <BarChart3 size={16} /> },
  { key: "financial_literacy", label: "Financial Literacy", icon: <DollarSign size={16} /> },
  { key: "startup", label: "Startups", icon: <Rocket size={16} /> },
  { key: "leadership", label: "Leadership", icon: <Users size={16} /> },
  { key: "community", label: "Community", icon: <Building2 size={16} /> },
  { key: "grassroots", label: "Grassroots", icon: <Heart size={16} /> },
];

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

const US_STATES = [
  "ALL", "CA", "DC", "GA", "MA", "MD", "NY", "ON", "PA", "TX", "VA"
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function DashboardPage() {
  const [data, setData] = useState<Organization[]>(SEED_DATA);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"seed" | "supabase">("seed");
  const [activeTab, setActiveTab] = useState<OrgCategory | "all">("all");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [showIntro, setShowIntro] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const handleIntroEnd = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 800);
  }, []);

  // Load from Supabase, fallback to seed
  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        const { data: rows, error } = await supabase
          .from("organizations")
          .select("*")
          .order("year_featured", { ascending: true });

        if (!error && rows && rows.length > 0) {
          setData(rows as Organization[]);
          setDataSource("supabase");
        } else {
          // Supabase empty or unconfigured — use seed
          setData(SEED_DATA);
          setDataSource("seed");
        }
      } catch {
        // Supabase not configured — use seed silently
        setData(SEED_DATA);
        setDataSource("seed");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectOrg = useCallback((org: Organization) => {
    setSelectedOrg(org);
  }, []);

  // ==========================================
  // FILTERING
  // ==========================================

  const filtered = useMemo(() => {
    let result = data;

    if (activeTab !== "all") {
      result = result.filter((o) => o.category === activeTab);
    }
    if (selectedYear) {
      result = result.filter((o) => o.year_featured === selectedYear);
    }
    if (selectedState !== "ALL") {
      result = result.filter((o) => o.location_state === selectedState);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.mission.toLowerCase().includes(q) ||
          o.tags.some((t) => t.toLowerCase().includes(q)) ||
          o.subcategory.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, activeTab, selectedYear, selectedState, searchQuery]);

  // ==========================================
  // STATS
  // ==========================================

  const totalOrgs = data.length;
  const totalFunding = data.reduce((s, o) => s + (o.funding_amount || 0), 0);
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of data) {
      counts[o.category] = (counts[o.category] || 0) + 1;
    }
    return counts;
  }, [data]);
  const uniqueStates = useMemo(
    () => new Set(data.map((o) => o.location_state)).size,
    [data]
  );
  const yearCounts = useMemo(() => {
    const c: Record<number, number> = {};
    for (const y of YEARS) c[y] = 0;
    for (const o of data) c[o.year_featured] = (c[o.year_featured] || 0) + 1;
    return c;
  }, [data]);

  const clearFilters = () => {
    setSelectedYear(null);
    setSelectedState("ALL");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedYear || selectedState !== "ALL" || searchQuery;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="app-shell">
      {showIntro && (
        <div className={`intro-overlay ${fadeOut ? "fade-out" : ""}`}>
          <div className="intro-video-container">
            <video
              className="intro-video"
              src="/logo.mp4"
              autoPlay
              muted
              playsInline
              onEnded={handleIntroEnd}
            />
            <button className="intro-skip-btn" onClick={handleIntroEnd}>
              Skip Intro
            </button>
          </div>
        </div>
      )}
      {/* HEADER */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">
            <Landmark size={20} />
          </div>
          <div>
            <h1>
              Black <span>America</span> Dashboard
            </h1>
          </div>
        </div>
        <div className="header-meta">
          <span className="header-badge">2020 – 2026</span>
          <span>{totalOrgs} Organizations Tracked</span>
        </div>
      </header>

      {/* TAB NAV */}
      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
            <span className="tab-count">
              {tab.key === "all"
                ? totalOrgs
                : categoryCounts[tab.key] || 0}
            </span>
          </button>
        ))}
      </nav>

      {/* MAIN */}
      <main className="main-content">
        {/* IMPACT STATS */}
        <div className="stats-grid">
          <div className="stat-card gold">
            <span className="stat-label">Organizations</span>
            <span className="stat-value gold">{totalOrgs}</span>
            <span className="stat-meta">Across {uniqueStates} states & regions</span>
          </div>
          <div className="stat-card teal">
            <span className="stat-label">Total Funding</span>
            <span className="stat-value teal">
              ${(totalFunding / 1_000_000).toFixed(0)}M+
            </span>
            <span className="stat-meta">Tracked across startups & funds</span>
          </div>
          <div className="stat-card purple">
            <span className="stat-label">Financial Literacy</span>
            <span className="stat-value purple">
              {categoryCounts["financial_literacy"] || 0}
            </span>
            <span className="stat-meta">Programs & platforms</span>
          </div>
          <div className="stat-card rose">
            <span className="stat-label">Categories</span>
            <span className="stat-value rose">5</span>
            <span className="stat-meta">Startups · Leadership · Community · Grassroots · Financial</span>
          </div>
          <div className="stat-card blue">
            <span className="stat-label">Year Span</span>
            <span className="stat-value blue">7</span>
            <span className="stat-meta">Years of data (2020–2026)</span>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="timeline-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Timeline</h2>
              <p className="section-subtitle">
                Filter by year — click to toggle
              </p>
            </div>
          </div>
          <div className="timeline-bar">
            {YEARS.map((y) => (
              <button
                key={y}
                className={`timeline-year ${selectedYear === y ? "active" : ""}`}
                onClick={() =>
                  setSelectedYear(selectedYear === y ? null : y)
                }
              >
                {y}
                <span className="year-count">{yearCounts[y]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters-bar">
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                color: "var(--color-text-muted)",
              }}
            />
            <input
              id="search-input"
              type="text"
              className="filter-input"
              placeholder="Search orgs, tags, missions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <select
            id="state-filter"
            className="filter-select"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All States" : s}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              className="filter-chip"
              onClick={clearFilters}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <X size={12} /> Clear Filters
            </button>
          )}
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
            }}
          >
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* INTERACTIVE MAP */}
        <MapView organizations={filtered} onSelectOrg={handleSelectOrg} />

        {/* ORG CARDS GRID */}
        <div className="section-header">
          <div>
            <h2 className="section-title">
              {activeTab === "all"
                ? "All Organizations"
                : CATEGORY_LABELS[activeTab]}
            </h2>
            <p className="section-subtitle">
              {filtered.length} organization
              {filtered.length !== 1 ? "s" : ""}{" "}
              {hasActiveFilters ? "(filtered)" : ""}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Filter size={48} />
            <p>No organizations match your filters.</p>
            <button className="filter-chip" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="org-grid">
            {filtered.map((org) => (
              <div
                key={org.id}
                className="org-card animate-in"
                onClick={() => setSelectedOrg(org)}
              >
                <div className="org-card-top">
                  <h3 className="org-name">{org.name}</h3>
                  <span
                    className={`org-category-badge ${CATEGORY_BADGE[org.category]}`}
                  >
                    {CATEGORY_LABELS[org.category]}
                  </span>
                </div>
                <p className="org-mission">{org.mission}</p>
                <div className="org-meta-row">
                  <span className="org-meta">
                    <MapPin size={14} />
                    {org.location_city}, {org.location_state}
                  </span>
                  <span className="org-meta">
                    <Calendar size={14} />
                    {org.year_featured}
                  </span>
                  {org.delivery_model && (
                    <span className="org-meta">
                      <Globe size={14} />
                      {(org.delivery_model || "virtual").replace("_", " ")}
                    </span>
                  )}
                </div>
                {org.tags.length > 0 && (
                  <div className="org-tags">
                    {org.tags.slice(0, 4).map((t) => (
                      <span key={t} className="org-tag">
                        {t}
                      </span>
                    ))}
                    {org.tags.length > 4 && (
                      <span className="org-tag">+{org.tags.length - 4}</span>
                    )}
                  </div>
                )}
                {org.impact_metric && (
                  <div className="org-impact">
                    <TrendingUp size={14} />
                    {org.impact_metric}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-content">
          <span className="footer-text">Powered by</span>
          <div className="footer-logo-container">
            <img
              src="/innov8edge.jpg"
              alt="Innov8Edge Logo"
              className="footer-logo"
            />
          </div>
        </div>
      </footer>

      {/* DETAIL MODAL */}
      {selectedOrg && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedOrg(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedOrg(null)}
            >
              <X size={16} />
            </button>

            <span
              className={`org-category-badge ${CATEGORY_BADGE[selectedOrg.category]}`}
              style={{ marginBottom: 12, display: "inline-block" }}
            >
              {CATEGORY_LABELS[selectedOrg.category]}
            </span>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 800,
                marginBottom: 4,
              }}
            >
              {selectedOrg.name}
            </h2>

            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.85rem",
                marginBottom: 20,
              }}
            >
              {selectedOrg.subcategory}
            </p>

            <div
              style={{
                background: "var(--color-bg-card)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
                {selectedOrg.mission}
              </p>
            </div>

            {selectedOrg.summary && (
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                {selectedOrg.summary}
              </p>
            )}

            {/* Detail Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <DetailItem
                icon={<MapPin size={14} />}
                label="Location"
                value={`${selectedOrg.location_city}, ${selectedOrg.location_state}`}
              />
              <DetailItem
                icon={<Calendar size={14} />}
                label="Year Featured"
                value={String(selectedOrg.year_featured)}
              />
              {selectedOrg.year_founded && (
                <DetailItem
                  icon={<Landmark size={14} />}
                  label="Founded"
                  value={String(selectedOrg.year_founded)}
                />
              )}
              <DetailItem
                icon={<Globe size={14} />}
                label="Delivery"
                value={(selectedOrg.delivery_model || "virtual").replace("_", " ")}
              />
              {selectedOrg.funding_amount && (
                <DetailItem
                  icon={<DollarSign size={14} />}
                  label="Funding"
                  value={`$${(selectedOrg.funding_amount / 1_000_000).toFixed(0)}M`}
                />
              )}
              {selectedOrg.cohort_size && (
                <DetailItem
                  icon={<Users size={14} />}
                  label="Cohort Size"
                  value={String(selectedOrg.cohort_size)}
                />
              )}
            </div>

            {selectedOrg.impact_metric && (
              <div className="org-impact" style={{ marginBottom: 16 }}>
                <Award size={14} />
                {selectedOrg.impact_metric}
              </div>
            )}

            {selectedOrg.leaders.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  Leadership
                </p>
                <p style={{ fontSize: "0.85rem" }}>
                  {selectedOrg.leaders.join(", ")}
                </p>
              </div>
            )}

            {selectedOrg.tags.length > 0 && (
              <div className="org-tags" style={{ marginBottom: 16 }}>
                {selectedOrg.tags.map((t) => (
                  <span key={t} className="org-tag">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {selectedOrg.source_url && (
              <a
                href={selectedOrg.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--color-gold)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Visit Source <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// DETAIL ITEM HELPER
// ==========================================

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "10px 12px",
        background: "var(--color-bg-card)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {icon}
        {label}
      </span>
      <span style={{ fontSize: "0.88rem", fontWeight: 500, textTransform: "capitalize" }}>
        {value}
      </span>
    </div>
  );
}
