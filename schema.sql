CREATE TABLE IF NOT EXISTS automations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  level TEXT NOT NULL,
  file_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  requirements TEXT NOT NULL,
  code TEXT,
  download_url TEXT,
  video_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);