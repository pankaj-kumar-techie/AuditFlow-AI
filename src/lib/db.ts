import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'leads.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

export interface LeadRecord {
  domain: string;
  city: string;
  vertical: string;
  lead_name: string;
  lead_rank: number;
  lead_rating: number;
  lead_reviews: number;
  
  competitor_name: string;
  competitor_domain: string;
  competitor_rank: number;
  competitor_rating: number;
  competitor_reviews: number;
  
  lite_generated_at: string;
  full_generated_at?: string;
  paradox_type: 'reviews' | 'rating' | 'similar' | 'invisible' | 'empty';
}

export const LeadDB = {
  get: (domain: string): LeadRecord | null => {
    if (!fs.existsSync(DB_PATH)) return null;
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return data[domain] || null;
  },
  
  save: (record: LeadRecord) => {
    const data = fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) : {};
    data[record.domain] = record;
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }
};
