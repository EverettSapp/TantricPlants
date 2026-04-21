-- Indoor spaces: windows and surfaces with light profiles
CREATE TABLE IF NOT EXISTS indoor_spaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                -- e.g. "Living room south window", "Bathroom shelf"
  space_type TEXT NOT NULL CHECK(space_type IN ('window', 'surface', 'shelf', 'hanging')),
  direction TEXT CHECK(direction IN ('N','NE','E','SE','S','SW','W','NW')),
  obstruction TEXT CHECK(obstruction IN ('open','partial','shaded','overhanging')),
  humidity TEXT CHECK(humidity IN ('high','medium','low')),
  near_vent INTEGER DEFAULT 0,
  near_radiator INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Link plants to a defined space
ALTER TABLE plants ADD COLUMN indoor_space_id INTEGER REFERENCES indoor_spaces(id) ON DELETE SET NULL;
