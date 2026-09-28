# Marchesato in Festa

Sito mobile-first pronto per Cloudflare Pages, con frontend pubblico, pannello admin, Cloudflare D1, R2 e notifiche email opzionali.

## Struttura essenziale

- `index.html` — sito pubblico
- `styles.css` — tutto il design responsive
- `app.js` — routing, pagine, ricerca, calendario e form
- `admin.html` + `admin.js` — area riservata
- `functions/api/[[path]].js` — unico backend API
- `schema.sql` — database D1
- `assets/` — loghi
- `wrangler.toml.example` — configurazione Cloudflare

## Pubblicazione Cloudflare Pages

1. Carica questa cartella in un repository GitHub.
2. Crea un progetto Cloudflare Pages collegato al repository.
3. Build command: lascia vuoto.
4. Build output directory: `.`
5. Crea un database D1, ad esempio `marchesato-in-festa`.
6. Esegui `schema.sql` sul database D1.
7. In Pages > Settings > Bindings aggiungi D1 con nome binding esatto `DB`.
8. Crea un bucket R2, ad esempio `marchesato-media`, e collegalo con binding `MEDIA`.
9. Aggiungi le variabili/secrets:
   - `ADMIN_PASSWORD` = password scelta per `/admin`
   - `SESSION_SECRET` = stringa lunga e casuale
   - `NOTIFY_EMAIL` = email che deve ricevere le nuove segnalazioni (opzionale)
   - `RESEND_API_KEY` = chiave Resend per l'invio email (opzionale)
   - `FROM_EMAIL` = mittente verificato su Resend (opzionale)
10. Deploy.

## Prima apertura

Il frontend contiene dati dimostrativi come fallback, quindi il sito appare già completo anche prima di popolare D1. Appena aggiungi eventi dall'admin, i dati reali del database sostituiscono quelli dimostrativi.

Area admin: `/admin`

## Note di produzione

- Le immagini demo remote servono solo a riempire il layout; sostituiscile dall'admin con immagini reali.
- Le segnalazioni utenti vengono salvate in D1 e compaiono nell'admin. Con Resend configurato arriva anche l'email.
- Gli eventi approvati dalle segnalazioni vengono creati nel database con un click.
- Gli eventi conclusi restano raggiungibili e quindi utili per SEO.
- La newsletter è graficamente predisposta ma volutamente non attiva.
