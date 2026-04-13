CREATE TABLE IF NOT EXISTS plots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  plot_type TEXT NOT NULL CHECK(plot_type IN ('seeding_tray', 'raised_bed', 'in_ground')),

  -- Seeding tray
  tray_rows INTEGER,
  tray_cols INTEGER,

  -- Garden bed
  length_ft REAL,
  width_ft REAL,
  height_in INTEGER,          -- raised bed height in inches
  soil_type TEXT,             -- 'native' | 'amended' | 'mix' | 'potting'
  sun_exposure TEXT,          -- 'full_sun' | 'part_sun' | 'part_shade' | 'full_shade'
  irrigation INTEGER DEFAULT 0,
  irrigation_type TEXT,       -- 'drip' | 'sprinkler' | 'hand' | 'none'
  notes TEXT,

  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plot_cells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  row_idx INTEGER NOT NULL,
  col_idx INTEGER NOT NULL,
  plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL,
  label TEXT,                -- free-text label if no plant linked
  notes TEXT,
  planted_at TEXT,
  UNIQUE(plot_id, row_idx, col_idx)
);

CREATE INDEX IF NOT EXISTS idx_plot_cells_plot ON plot_cells(plot_id);
