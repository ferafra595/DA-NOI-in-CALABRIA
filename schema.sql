CREATE TABLE IF NOT EXISTS events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 slug TEXT UNIQUE NOT NULL,
 title TEXT NOT NULL,
 category TEXT NOT NULL,
 area TEXT,
 province TEXT,
 city TEXT,
 locality TEXT,
 address TEXT,
 start_date TEXT NOT NULL,
 end_date TEXT,
 start_time TEXT,
 description TEXT,
 program TEXT,
 organizer TEXT,
 phone TEXT,
 email TEXT,
 social TEXT,
 image TEXT,
 poster_url TEXT,
 free INTEGER DEFAULT 1,
 featured INTEGER DEFAULT 0,
 weekend INTEGER DEFAULT 0,
 status TEXT DEFAULT 'published',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE TABLE IF NOT EXISTS submissions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL, category TEXT, province TEXT, city TEXT, locality TEXT, address TEXT,
 start_date TEXT, end_date TEXT, start_time TEXT, price_type TEXT, description TEXT, program_text TEXT,
 organizer TEXT, phone TEXT, email TEXT, social TEXT, poster_url TEXT,
 status TEXT DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS places (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL, type TEXT NOT NULL, city TEXT, province TEXT, description TEXT, image TEXT, address TEXT, phone TEXT, whatsapp TEXT, instagram TEXT, website TEXT, maps_url TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS partners (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL, description TEXT, logo TEXT, image TEXT, website TEXT, instagram TEXT, level TEXT DEFAULT 'partner', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
