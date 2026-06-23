/** Row shapes matching the Supabase schema (see supabase/schema.sql). */

export interface Coffee {
  id: string;
  user_id: string;
  name: string;
  roaster: string | null;
  origin_country: string | null;
  region: string | null;
  process: string | null;
  roast_level: string | null;
  purchase_date: string | null; // ISO date
  open_date: string | null; // ISO date
  notes: string | null;
  created_at: string;
}

export interface Brew {
  id: string;
  user_id: string;
  coffee_id: string | null;
  method: string;
  brewed_at: string; // ISO timestamp
  dose_g: number | null;
  water_g: number | null;
  ratio: number | null; // water per gram of coffee (1:ratio)
  water_temp_c: number | null;
  total_time_seconds: number | null;
  grind_size: string | null;
  rating: number | null; // 1–10
  satisfaction: number | null; // 1–5
  flavor_notes: string | null;
  comments: string | null;
  created_at: string;
}

/** A brew joined with a (possibly null) coffee. */
export interface BrewWithCoffee extends Brew {
  coffee: Pick<Coffee, "id" | "name" | "roaster" | "process"> | null;
}
