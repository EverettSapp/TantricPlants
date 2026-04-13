-- Plants table
CREATE TABLE IF NOT EXISTS plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'garden' CHECK(category IN ('indoor', 'garden')),
  type TEXT NOT NULL CHECK(type IN ('seedling_batch', 'nursery_start', 'propagation', 'indoor', 'other')),
  species TEXT,
  variety TEXT,
  batch_size INTEGER DEFAULT 1, -- for seedling batches
  location TEXT,                 -- e.g. "south window", "greenhouse"
  date_started TEXT,             -- ISO date
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Care log (watering, fertilizing, repotting, etc.)
CREATE TABLE IF NOT EXISTS care_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  care_type TEXT NOT NULL CHECK(care_type IN ('water', 'fertilize', 'repot', 'prune', 'treat', 'observe', 'other')),
  notes TEXT,
  logged_at TEXT DEFAULT (datetime('now'))
);

-- Care schedules (how often each plant needs each care type)
CREATE TABLE IF NOT EXISTS care_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  care_type TEXT NOT NULL,
  interval_days INTEGER NOT NULL,
  last_done_at TEXT,
  next_due_at TEXT
);

-- Photos
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,          -- R2 object key
  caption TEXT,
  taken_at TEXT DEFAULT (datetime('now'))
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER REFERENCES plants(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  due_at TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_care_logs_plant ON care_logs(plant_id);
CREATE INDEX IF NOT EXISTS idx_care_schedules_plant ON care_schedules(plant_id);
CREATE INDEX IF NOT EXISTS idx_photos_plant ON photos(plant_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_at, completed);
