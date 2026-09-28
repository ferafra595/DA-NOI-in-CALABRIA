-- Esegui una sola volta nella Console D1. Non elimina dati esistenti.
CREATE TABLE IF NOT EXISTS territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submission_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  placeholder TEXT DEFAULT '',
  required INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  options TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT '',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO submission_fields(field_key,label,field_type,placeholder,required,active,sort_order,options) VALUES
('title','Nome evento','text','Es. Festa di San Michele',1,1,10,''),
('category','Categoria','select','',1,1,20,'Feste patronali|Sagre|Concerti|Musica|Cultura|Tradizioni|Sport|Eventi per bambini|Enogastronomia|Fiere/Mercatini|Feste Locali'),
('province','Provincia','province','',1,1,30,''),
('city','Comune','text','Comune',1,1,40,''),
('locality','Località','text','Frazione o località',0,1,50,''),
('address','Indirizzo / luogo','text','Piazza, via, struttura...',0,1,60,''),
('start_date','Data inizio','date','',1,1,70,''),
('end_date','Data fine','date','',0,1,80,''),
('start_time','Ora','time','',0,1,90,''),
('price_type','Ingresso','select','',0,1,100,'Gratuito|A pagamento'),
('description','Descrizione','textarea','Racconta brevemente l’evento',0,1,110,''),
('program_text','Programma','textarea','Programma delle giornate e degli orari',0,1,120,''),
('organizer','Organizzatore','text','Comune, Pro Loco, associazione...',0,1,130,''),
('phone','Telefono','tel','',0,1,140,''),
('email','Email','email','',1,1,150,''),
('social','Social / sito','url','https://',0,1,160,''),
('poster_url','Locandina / immagine','url','URL immagine',0,1,170,'');

CREATE TABLE IF NOT EXISTS submission_payloads (
  submission_id INTEGER PRIMARY KEY,
  payload TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS partner_profiles (
  partner_id INTEGER PRIMARY KEY,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  facebook TEXT DEFAULT '',
  maps_url TEXT DEFAULT ''
);
