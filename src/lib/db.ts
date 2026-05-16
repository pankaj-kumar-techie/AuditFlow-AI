// db.ts
// Simple JSON file database for lead persistence.
// Key requirement from Developer Brief Section 3:
//   When Full Report runs, it MUST use the same competitor as the Lite Report.
//   Keyed by domain. Records written on Lite, updated on Full.

import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "leads.json");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

export interface LeadRecord {
  // Identity
  domain: string;
  city: string;
  state?: string;
  vertical: string;
  lead_name: string;

  // Lead GBP
  lead_rank: number;
  lead_rating: number;
  lead_reviews: number;

  // Competitor — locked in at Lite time, reused for Full
  competitor_name: string;
  competitor_domain: string;
  competitor_rank: number;
  competitor_rating: number;
  competitor_reviews: number;
  competitor_cid?: string;

  // Financials (from math engine)
  total_loss: number;
  loss_low: number;
  loss_high: number;
  missed_jobs: number;

  // Paradox
  paradox_type: "reviews" | "rating" | "rank" | "invisible" | "empty";
  paradox_headline: string;

  // Timestamps
  lite_generated_at: string;
  full_generated_at?: string;
}

function readDb(): Record<string, LeadRecord> {
  if (!fs.existsSync(DB_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeDb(data: Record<string, LeadRecord>): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const LeadDB = {
  get(domain: string): LeadRecord | null {
    return readDb()[domain] || null;
  },

  save(record: LeadRecord): void {
    const data = readDb();
    // Never overwrite competitor data set by Lite Report
    const existing = data[record.domain];
    if (existing && !record.full_generated_at) {
      // Lite re-run: update financials + timestamps but preserve competitor
      data[record.domain] = {
        ...existing,
        ...record,
        competitor_name: existing.competitor_name,
        competitor_domain: existing.competitor_domain,
        competitor_rank: existing.competitor_rank,
        competitor_rating: existing.competitor_rating,
        competitor_reviews: existing.competitor_reviews,
      };
    } else {
      data[record.domain] = record;
    }
    writeDb(data);
  },

  all(): LeadRecord[] {
    return Object.values(readDb());
  },

  delete(domain: string): void {
    const data = readDb();
    delete data[domain];
    writeDb(data);
  },
};