# Fatloss Tracker

Persoonlijke offline-first + cloud-sync web-app voor het bijhouden van gewicht, lichaamssamenstelling en training.

**Live app:** https://rboarbo.github.io/fatloss-tracker/

---

## Stack

- React 18 + Vite + Tailwind CSS v3 + Recharts
- Supabase (auth, Postgres, Edge Functions)
- GitHub Pages (statische hosting)

---

## Lokale ontwikkeling

```bash
# 1. Clone + dependencies
git clone https://github.com/Rboarbo/fatloss-tracker.git
cd fatloss-tracker
npm install

# 2. Maak .env.local aan
cp .env.example .env.local
# Vul VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in

# 3. Start dev server
npm run dev
```

---

## Supabase setup

### 1. Project aanmaken
Ga naar [supabase.com](https://supabase.com) → "New project" → noteer:
- Project URL (Settings → API)
- Anon public key (Settings → API)
- Service role key (Settings → API — alleen voor Edge Function)

### 2. Database schema aanmaken
Ga naar **SQL Editor** → plak en voer uit:

```
supabase/migrations/001_initial.sql
```

### 3. Auth instellen
Ga naar **Authentication → URL Configuration**:
- Site URL: `https://rboarbo.github.io/fatloss-tracker/`
- Redirect URLs: voeg toe: `https://rboarbo.github.io/fatloss-tracker/`

### 4. Edge Function deployen

```bash
# Installeer Supabase CLI
npm install -g supabase

# Login + link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy Edge Function
supabase functions deploy health-import

# Test via curl:
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/health-import" \
  -H "Authorization: Bearer YOUR_HAE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":{"workouts":[],"metrics":[]}}'
# Verwacht: {"imported_workouts":0,"imported_daily_metrics":0,"workouts_low_confidence":0}
```

### 5. GitHub Secrets instellen
Ga naar je GitHub repo → Settings → Secrets and variables → Actions → New secret:
- `VITE_SUPABASE_URL` = `https://YOUR_PROJECT.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJ...` (anon public key)

---

## Apple Health automation setup (Health Auto Export)

Volledig automatische import van workouts + dagelijkse metingen vanuit Apple Health.

### Stap 1: Installeer Health Auto Export

Download **Health Auto Export** op je iPhone (App Store).

### Stap 2: Geef permissies

In de HAE app → Health Permissions → zet aan:
- Workouts
- Heart Rate
- Body Mass (gewicht)
- Body Fat Percentage
- Lean Body Mass
- Step Count
- Walking + Running Distance
- Resting Heart Rate
- Heart Rate Variability (HRV)
- VO2 Max
- Active Energy Burned
- Exercise Time
- Time in Daylight
- Blood Oxygen Saturation
- Flights Climbed

### Stap 3: Genereer je Bearer token

Open de Fatloss Tracker app → tab **Instellingen** → sectie "Apple Health automatisering" → klik **"+ Token genereren"** → kopieer de token.

### Stap 4: Configureer REST API automation

In HAE → tab **Automations** → "+" → **REST API**:

| Veld | Waarde |
|------|--------|
| URL | kopieer uit de app (Instellingen → Apple Health automatisering) |
| Method | POST |
| Header naam | `Authorization` |
| Header waarde | `Bearer <jouw-token>` |

### Stap 5: Voeg triggers toe

Voeg 2 triggers toe:

1. **Workout End** — realtime push na elke workout
   - Data: Workouts (alle velden)

2. **Scheduled** — dagelijkse aggregatie (stel in op 23:59)
   - Data: alle bovenstaande Metrics + Workouts

### Stap 6: Test

Tap "Run Now" in de automations-lijst → controleer Supabase → Table Editor → `workouts` en `daily_metrics`.

Of gebruik de **"Test verbinding"** knop in de app-instellingen.

---

## Commit & deploy

```bash
git add .
git commit -m "feat: ..."
git push  # triggert GitHub Actions → automatisch deploy naar GitHub Pages
```
