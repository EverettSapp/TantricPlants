-- Extend care_schedules with status, source, and AI care note
ALTER TABLE care_schedules ADD COLUMN status TEXT NOT NULL DEFAULT 'suggested';
ALTER TABLE care_schedules ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE care_schedules ADD COLUMN ai_care_note TEXT;

-- Extend care_logs with observations (JSON array) and health snapshot
ALTER TABLE care_logs ADD COLUMN observations TEXT; -- JSON array e.g. ["soil_wet","new_growth"]
ALTER TABLE care_logs ADD COLUMN health_status TEXT; -- thriving|good|stressed|dormant

-- Add health status to plants
ALTER TABLE plants ADD COLUMN health_status TEXT NOT NULL DEFAULT 'good';
