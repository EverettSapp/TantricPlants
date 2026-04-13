ALTER TABLE plants ADD COLUMN category TEXT NOT NULL DEFAULT 'garden';
UPDATE plants SET category = 'indoor' WHERE type = 'indoor';
