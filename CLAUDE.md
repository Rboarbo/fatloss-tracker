# Fatloss Tracker — CLAUDE.md

## Project context

Een lichtgewicht, offline-first web-app waarmee de gebruiker zijn/haar afslankproces bijhoudt. Geen account vereist; alle data blijft lokaal in de browser.

- **Gebruiker:** persoonlijk gebruik (Ronald)
- **Doel:** dagelijkse invoer van gewicht, calorieën, metingen én training, met sport-specifieke tracking en voortgangsvisualisatie
- **Versie:** 1.1
- **Deployment:** statische HTML/JS, gehost via GitHub Pages

---

## Stack

| Laag | Keuze |
|------|-------|
| Framework | React 18 + Vite |
| Stijl | Tailwind CSS v3 |
| State | React hooks + localStorage |
| Charts | Recharts |
| Icons | lucide-react |
| Routing | geen (single-page, geen router) |
| Backend | **geen** |
| Auth | **geen** |
| Database | **geen** — alleen `localStorage` |

---

## Belangrijke commando's

```bash
npm run dev       # ontwikkelserver (localhost:5173)
npm run build     # productie-build naar /dist
npm run preview   # preview van de build lokaal

# Deploy (GitHub Pages via Actions — push naar main)
git push          # triggert .github/workflows/deploy.yml automatisch
```

---

## Storage keys conventie

Alle localStorage-sleutels beginnen met het prefix `fatloss:`.

| Key | Inhoud |
|-----|--------|
| `fatloss:entries` | `Entry[]` — dagelijkse metingen |
| `fatloss:settings` | `Settings` — doel, startgewicht, eenheden (kg/lbs) |

Lees/schrijf altijd via centrale helper-functies in `src/lib/storage.js`, nooit direct `localStorage.getItem` aanroepen vanuit componenten.

---

## Data types (v1.1)

### TrainingType

```js
// waarden gedefinieerd in src/lib/sport-config.js
'rust' | 'milon' | 'padel-training' | 'padel-wedstrijd' | 'mtb' | 'wandelen' | 'taichi' | 'anders'
```

### Entry

```js
{
  date: string,              // ISO 8601, bijv. "2026-05-19"
  weight: number | null,
  waist: number | null,      // cm
  hips: number | null,       // cm
  calories: number | null,   // eet-kcal
  training: TrainingType,    // default 'rust'

  // optioneel (v1.1)
  trainingDuration?: number, // minuten
  trainingKcal?: number,     // workout kcal (los van eten)
  avgHR?: number,            // gemiddelde hartslag
  distance?: number,         // km (MTB)
  notes?: string,
}
```

Bestaande entries zonder nieuwe velden blijven werken — gebruik overal optional chaining (`e?.training ?? 'rust'`).

---

## Componenten (v1.1)

| Bestand | Beschrijving |
|---------|--------------|
| `src/lib/sport-config.js` | `SPORT_CONFIG`, `WEEKLY_PROTOCOL`, `WORKOUT_FIELDS` — centraal fundament voor sport-logica |
| `src/components/WeekView.jsx` | Week-grid (Ma–Zo) met protocol vs. actueel, score-teller, klikbaar naar Invoer |
| `src/components/SportStats.jsx` | Grid van sport-kaarten: sessies, duur, workout kcal, gem. HR — afgelopen 4 weken |
| `src/pages/Dashboard.jsx` | WeekView + hero + grafieken (gewicht, kcal, taille, workout-volume) + SportStats |
| `src/pages/LogEntry.jsx` | Training-selector (grid), conditionele workout-details, history-tabel met Duur/HR |

---

## Niet-doen lijst

- **Geen backend** — geen API-calls, geen server, geen database
- **Geen auth** — geen login, geen accounts, geen sessies
- **Geen externe opslag** — geen Supabase, Firebase, of andere cloud-services
- **Geen router** — geen React Router, geen URL-gebaseerde navigatie
- **Geen onnodige dependencies** — voeg alleen packages toe als ze echt nodig zijn
- **Geen comments die uitleggen wat code doet** — alleen comments als de *waarom* niet-voor-de-hand-liggend is
- **Geen overengineering** — geen context providers, geen Redux, geen abstractielagen die de MVP-scope overstijgen
- **Storage keys niet wijzigen** — `fatloss:entries` en `fatloss:settings` blijven ongewijzigd
