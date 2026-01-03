import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load .env first
dotenv.config();

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL missing in environment variables");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY missing in environment variables");
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
