-- SQLite can't modify CHECK constraints directly, so we recreate the table
PRAGMA foreign_keys=OFF;

CREATE TABLE plants_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'garden',
  type TEXT NOT NULL DEFAULT 'other',
  species TEXT,
  variety TEXT,
  batch_size INTEGER DEFAULT 1,
  location TEXT,
  date_started TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO plants_new SELECT * FROM plants;
DROP TABLE plants;
ALTER TABLE plants_new RENAME TO plants;

CREATE INDEX IF NOT EXISTS idx_care_logs_plant ON care_logs(plant_id);
CREATE INDEX IF NOT EXISTS idx_care_schedules_plant ON care_schedules(plant_id);
CREATE INDEX IF NOT EXISTS idx_photos_plant ON photos(plant_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_at, completed);

PRAGMA foreign_keys=ON;
