-- Add pot and soil fields to plants
ALTER TABLE plants ADD COLUMN pot_type TEXT;           -- e.g. terracotta, plastic, ceramic, fabric, custom value
ALTER TABLE plants ADD COLUMN inner_pot TEXT;          -- if layered: the functional inner pot type
ALTER TABLE plants ADD COLUMN in_decorative_pot INTEGER DEFAULT 0; -- 1 if plant is in a cover/decorative pot
ALTER TABLE plants ADD COLUMN soil_type TEXT;          -- e.g. all_purpose, cactus_mix, orchid_bark, custom value

-- App-wide settings (key/value store)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
-- Expected keys: location_city, location_lat, location_lng
