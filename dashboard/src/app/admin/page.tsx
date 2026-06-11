"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, ShieldAlert, Loader2, Check,
  Trash2, Edit, RefreshCw, AlertCircle,
  MapPin, Calendar, Globe, ExternalLink,
  Award, DollarSign, Users, Landmark, Tag
} from "lucide-react";
import { Organization, OrgCategory, OrgStatus } from "@/data/types";

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "live">("pending");
  const [triggeringRss, setTriggeringRss] = useState(false);
  const [rssResult, setRssResult] = useState<string | null>(null);

  // Edit states
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Load passcode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("admin_passcode");
    if (saved) {
      verifyPasscode(saved);
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const verifyPasscode = async (code: string) => {
    setCheckingAuth(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/action?passcode=${encodeURIComponent(code)}`);
      if (res.ok) {
        const result = await res.json();
        setOrganizations(result.organizations || []);
        localStorage.setItem("admin_passcode", code);
        setPasscode(code);
        setIsAuthorized(true);
      } else {
        localStorage.removeItem("admin_passcode");
        setErrorMsg("Invalid passcode. Access denied.");
      }
    } catch {
      setErrorMsg("Failed to connect to authentication API.");
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim()) {
      verifyPasscode(passcode.trim());
    }
  };

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/action", {
        headers: {
          "x-admin-passcode": passcode,
        },
      });
      if (res.ok) {
        const result = await res.json();
        setOrganizations(result.organizations || []);
      }
    } catch (e) {
      console.error("Failed to load records", e);
    } finally {
      setLoading(false);
    }
  }, [passcode]);

  const handleAction = async (action: "approve" | "reject", id: string) => {
    if (action === "reject" && !confirm("Are you sure you want to permanently delete this entry?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({ action, id }),
      });

      if (res.ok) {
        // Optimistically update list
        if (action === "approve") {
          setOrganizations(prev =>
            prev.map(org => org.id === id ? { ...org, status: "active" as OrgStatus } : org)
          );
        } else {
          setOrganizations(prev => prev.filter(org => org.id !== id));
        }
      } else {
        const err = await res.json();
        alert(`Action failed: ${err.message}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    }
  };

  const handleTriggerRSS = async () => {
    setTriggeringRss(true);
    setRssResult(null);
    try {
      const res = await fetch("/api/ingest/rss");
      const result = await res.json();
      if (res.ok) {
        setRssResult(`Success! ${result.message}`);
        fetchOrgs(); // Reload lists
      } else {
        setRssResult(`Failed: ${result.message}`);
      }
    } catch (e: any) {
      setRssResult(`Error: ${e.message}`);
    } finally {
      setTriggeringRss(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          action: "update",
          id: editingOrg.id,
          organization: editingOrg,
        }),
      });

      if (res.ok) {
        setOrganizations(prev =>
          prev.map(org => org.id === editingOrg.id ? editingOrg : org)
        );
        setEditingOrg(null);
      } else {
        const err = await res.json();
        alert(`Save failed: ${err.message}`);
      }
    } catch (e: any) {
      alert(`Error saving edits: ${e.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_passcode");
    setIsAuthorized(false);
    setPasscode("");
    setOrganizations([]);
  };

  const pendingList = organizations.filter(o => o.status === "pending_review");
  const liveList = organizations.filter(o => o.status === "active");

  const displayedList = activeTab === "pending" ? pendingList : liveList;

  // ==========================================
  // AUTHORIZATION CARD
  // ==========================================
  if (checkingAuth) {
    return (
      <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-gold)" }} />
        <p style={{ marginTop: 12, color: "var(--color-text-secondary)" }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 16 }}>
        <div className="card" style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ padding: 12, background: "var(--color-gold-dim)", borderRadius: "var(--radius-full)", color: "var(--color-gold)" }}>
              <ShieldAlert size={36} />
            </div>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>
            Admin Portal Gate
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginBottom: 24 }}>
            Enter your secret administrative passcode to manage pending entries and run pipelines.
          </p>
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              className="filter-input"
              placeholder="Enter passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ width: "100%", padding: 12, textAlign: "center" }}
              autoFocus
            />
            {errorMsg && (
              <p style={{ color: "var(--color-accent-rose)", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <AlertCircle size={14} /> {errorMsg}
              </p>
            )}
            <button type="submit" className="filter-chip active" style={{ padding: 12, fontWeight: 600 }}>
              Unlock Access
            </button>
          </form>
          <div style={{ marginTop: 20 }}>
            <Link href="/" style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={12} /> Return to Public Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-logo">
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, color: "inherit" }}>
            <div className="app-logo-icon">
              <Landmark size={20} />
            </div>
            <div>
              <h1>
                Black <span>America</span> Admin
              </h1>
            </div>
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="filter-chip" onClick={handleLogout} style={{ fontSize: "0.8rem" }}>
            Logout
          </button>
          <span className="header-badge">Admin Mode</span>
        </div>
      </header>

      {/* DASHBOARD BODY */}
      <main className="main-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 className="section-title" style={{ fontSize: "1.6rem" }}>Moderation Queue</h2>
            <p className="section-subtitle">Manage automated RSS and Google Alert submissions</p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="filter-chip"
              onClick={handleTriggerRSS}
              disabled={triggeringRss}
              style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}
            >
              {triggeringRss ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Fetching...
                </>
              ) : (
                <>
                  <RefreshCw size={14} /> Fetch RSS Feeds
                </>
              )}
            </button>
          </div>
        </div>

        {rssResult && (
          <div
            style={{
              padding: "12px 16px",
              background: rssResult.startsWith("Failed") ? "var(--color-accent-rose-dim)" : "var(--color-accent-teal-dim)",
              border: `1px solid ${rssResult.startsWith("Failed") ? "var(--color-accent-rose)" : "var(--color-accent-teal)"}`,
              borderRadius: "var(--radius-md)",
              marginBottom: 20,
              fontSize: "0.85rem",
              color: rssResult.startsWith("Failed") ? "var(--color-accent-rose)" : "var(--color-accent-teal)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>{rssResult}</span>
            <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => setRssResult(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* MODERATION COUNTS */}
        <div className="stats-grid">
          <div className="stat-card gold" style={{ cursor: "pointer" }} onClick={() => setActiveTab("pending")}>
            <span className="stat-label">Pending Inbound Drafts</span>
            <span className="stat-value gold">{pendingList.length}</span>
            <span className="stat-meta">Needs human verification to publish</span>
          </div>
          <div className="stat-card teal" style={{ cursor: "pointer" }} onClick={() => setActiveTab("live")}>
            <span className="stat-label">Live Organizations</span>
            <span className="stat-value teal">{liveList.length}</span>
            <span className="stat-meta">Currently visible on public map</span>
          </div>
        </div>

        {/* TAB CONTROL */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: 20 }}>
          <button
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "pending" ? "3px solid var(--color-gold)" : "none",
              color: activeTab === "pending" ? "var(--color-gold)" : "var(--color-text-secondary)",
              fontWeight: activeTab === "pending" ? 600 : 500,
              cursor: "pointer"
            }}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({pendingList.length})
          </button>
          <button
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "live" ? "3px solid var(--color-gold)" : "none",
              color: activeTab === "live" ? "var(--color-gold)" : "var(--color-text-secondary)",
              fontWeight: activeTab === "live" ? 600 : 500,
              cursor: "pointer"
            }}
            onClick={() => setActiveTab("live")}
          >
            Live Published ({liveList.length})
          </button>
        </div>

        {/* MODERATION CARDS LIST */}
        {loading ? (
          <div className="empty-state">
            <Loader2 className="animate-spin" size={36} />
            <p>Loading entries...</p>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <p>No entries found in this queue.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {displayedList.map((org) => (
              <div
                key={org.id}
                className="card animate-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  borderLeft: activeTab === "pending" ? "4px solid var(--color-gold)" : "4px solid var(--color-accent-teal)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <h3 className="org-name" style={{ fontSize: "1.15rem", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {org.name}
                      {org.source_url && (
                        <a href={org.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-muted)" }}>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                      {org.subcategory}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="filter-chip"
                      onClick={() => setEditingOrg(org)}
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Edit size={12} /> Edit
                    </button>
                    {org.status === "pending_review" && (
                      <button
                        className="filter-chip active"
                        onClick={() => handleAction("approve", org.id)}
                        style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--color-accent-teal-dim)", color: "var(--color-accent-teal)", borderColor: "var(--color-accent-teal)" }}
                      >
                        <Check size={12} /> Approve
                      </button>
                    )}
                    <button
                      className="filter-chip"
                      onClick={() => handleAction("reject", org.id)}
                      style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(251, 113, 133, 0.1)", color: "var(--color-accent-rose)", borderColor: "rgba(251, 113, 133, 0.2)" }}
                    >
                      <Trash2 size={12} /> {activeTab === "pending" ? "Reject" : "Delete"}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  <strong>Mission:</strong> {org.mission}
                </p>
                {org.summary && (
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                    <strong>Details:</strong> {org.summary}
                  </p>
                )}

                <div className="org-meta-row" style={{ marginTop: 4 }}>
                  <span className="org-meta">
                    <MapPin size={12} /> {org.location_city}, {org.location_state} {org.lat && org.lng ? `(${org.lat.toFixed(3)}, ${org.lng.toFixed(3)})` : "(No Coords)"}
                  </span>
                  <span className="org-meta">
                    <Calendar size={12} /> Featured: {org.year_featured} {org.year_founded ? `(Founded: ${org.year_founded})` : ""}
                  </span>
                  <span className="org-meta">
                    <Globe size={12} /> {(org.delivery_model || "virtual").replace("_", " ")}
                  </span>
                  {org.funding_amount && (
                    <span className="org-meta" style={{ color: "var(--color-accent-green)" }}>
                      <DollarSign size={12} /> ${(org.funding_amount / 1_000_000).toFixed(1)}M
                    </span>
                  )}
                  {org.cohort_size && (
                    <span className="org-meta">
                      <Users size={12} /> Cohort: {org.cohort_size}
                    </span>
                  )}
                </div>

                {org.tags.length > 0 && (
                  <div className="org-tags">
                    {org.tags.map(t => (
                      <span key={t} className="org-tag" style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                        <Tag size={10} /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* EDIT MODAL */}
      {editingOrg && (
        <div className="modal-overlay" onClick={() => setEditingOrg(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: 600 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, marginBottom: 16 }}>
              Edit Organization Profile
            </h3>

            <form onSubmit={handleEditSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Name</label>
                  <input
                    type="text"
                    className="filter-input"
                    value={editingOrg.name}
                    onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                    style={{ width: "100%" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Category</label>
                  <select
                    className="filter-select"
                    value={editingOrg.category}
                    onChange={(e) => setEditingOrg({ ...editingOrg, category: e.target.value as OrgCategory })}
                    style={{ width: "100%", height: 38 }}
                  >
                    <option value="financial_literacy">Financial Literacy & Wealth</option>
                    <option value="startup">Startups</option>
                    <option value="leadership">Leadership Circles</option>
                    <option value="community">Community Advancement</option>
                    <option value="grassroots">Grassroots / Self-Help</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Subcategory</label>
                  <input
                    type="text"
                    className="filter-input"
                    value={editingOrg.subcategory}
                    onChange={(e) => setEditingOrg({ ...editingOrg, subcategory: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Source URL</label>
                  <input
                    type="text"
                    className="filter-input"
                    value={editingOrg.source_url}
                    onChange={(e) => setEditingOrg({ ...editingOrg, source_url: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Mission</label>
                <textarea
                  className="filter-input"
                  value={editingOrg.mission}
                  onChange={(e) => setEditingOrg({ ...editingOrg, mission: e.target.value })}
                  style={{ width: "100%", minHeight: 60, fontFamily: "inherit", resize: "vertical" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Details / Summary</label>
                <textarea
                  className="filter-input"
                  value={editingOrg.summary}
                  onChange={(e) => setEditingOrg({ ...editingOrg, summary: e.target.value })}
                  style={{ width: "100%", minHeight: 80, fontFamily: "inherit", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>City</label>
                  <input
                    type="text"
                    className="filter-input"
                    value={editingOrg.location_city}
                    onChange={(e) => setEditingOrg({ ...editingOrg, location_city: e.target.value })}
                    style={{ width: "100%" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>State (2-Letter)</label>
                  <input
                    type="text"
                    className="filter-input"
                    value={editingOrg.location_state}
                    onChange={(e) => setEditingOrg({ ...editingOrg, location_state: e.target.value.toUpperCase() })}
                    style={{ width: "100%" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Featured Year</label>
                  <input
                    type="number"
                    className="filter-input"
                    value={editingOrg.year_featured}
                    onChange={(e) => setEditingOrg({ ...editingOrg, year_featured: parseInt(e.target.value) || 2026 })}
                    style={{ width: "100%" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="filter-input"
                    value={editingOrg.lat || ""}
                    onChange={(e) => setEditingOrg({ ...editingOrg, lat: parseFloat(e.target.value) || undefined })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="filter-input"
                    value={editingOrg.lng || ""}
                    onChange={(e) => setEditingOrg({ ...editingOrg, lng: parseFloat(e.target.value) || undefined })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="filter-chip" onClick={() => setEditingOrg(null)}>
                  Cancel
                </button>
                <button type="submit" className="filter-chip active" disabled={savingEdit} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {savingEdit ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
