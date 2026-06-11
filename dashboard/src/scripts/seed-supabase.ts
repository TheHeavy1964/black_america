// ==========================================
// SEED SUPABASE — Run this to populate your DB
// Usage: npx tsx src/scripts/seed-supabase.ts
// ==========================================

import { createClient } from "@supabase/supabase-js";

// Load from seed data
import { SEED_DATA } from "../data/seed";

import fs from "fs";
import path from "path";

// Manually load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  // Ignore env loading errors
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.error("   Make sure your .env.local is set up. See .env.local.example");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedDatabase() {
  console.log("🌱 Seeding Supabase with", SEED_DATA.length, "organizations...\n");

  // Upsert each record (id is primary key)
  const { data, error } = await supabase
    .from("organizations")
    .upsert(SEED_DATA, { onConflict: "id" });

  if (error) {
    console.error("❌ Seed failed:", error.message);
    console.error("\n📋 Make sure you've run the SQL schema first:");
    console.error("   → Copy docs/supabase_schema.sql into Supabase SQL Editor and run it");
    process.exit(1);
  }

  console.log("✅ Successfully seeded", SEED_DATA.length, "organizations!");
  console.log("\n📊 Breakdown:");

  const counts: Record<string, number> = {};
  for (const org of SEED_DATA) {
    counts[org.category] = (counts[org.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(counts)) {
    console.log(`   ${cat}: ${count}`);
  }

  console.log("\n🚀 Dashboard will now load from Supabase!");
}

seedDatabase();
