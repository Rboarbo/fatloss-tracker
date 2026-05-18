# Fatloss Tracker — CLAUDE.md

## Project context

Een lichtgewicht, offline-first web-app waarmee de gebruiker zijn/haar afslankproces bijhoudt. Geen account vereist; alle data blijft lokaal in de browser.

- **Gebruiker:** persoonlijk gebruik (Ronald)
- **Doel:** dagelijkse invoer van gewicht, calorieën en/of metingen, met eenvoudige voortgangsvisualisatie
- **Tijdsbestek:** snelle MVP, geen langdurig project
- **Deployment:** statische HTML/JS, gehost via GitHub Pages

---

## Stack

| Laag | Keuze |
|------|-------|
| Framework | React 18 + Vite |
| Stijl | Tailwind CSS v3 |
| State | React hooks + localStorage |
| Charts | Recharts |
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

# Deploy (GitHub Pages via gh-pages branch)
npm run deploy    # bouwt + pusht naar gh-pages
```

> Deploy-script in `package.json`: `"deploy": "npm run build && gh-pages -d dist"`

---

## Storage keys conventie

Alle localStorage-sleutels beginnen met het prefix `fatloss:`.

| Key | Inhoud |
|-----|--------|
| `fatloss:entries` | `Entry[]` — dagelijkse metingen (gewicht, calorieën, datum) |
| `fatloss:settings` | `Settings` — doel, startgewicht, eenheden (kg/lbs), etc. |

Lees/schrijf altijd via centrale helper-functies in `src/lib/storage.ts`, nooit direct `localStorage.getItem` aanroepen vanuit componenten.

---

## Niet-doen lijst

- **Geen backend** — geen API-calls, geen server, geen database
- **Geen auth** — geen login, geen accounts, geen sessies
- **Geen externe opslag** — geen Supabase, Firebase, of andere cloud-services
- **Geen router** — geen React Router, geen URL-gebaseerde navigatie
- **Geen onnodige dependencies** — voeg alleen packages toe als ze echt nodig zijn
- **Geen comments die uitleggen wat code doet** — alleen comments als de *waarom* niet-voor-de-hand-liggend is
- **Geen overengineering** — geen context providers, geen Redux, geen abstractielagen die de MVP-scope overstijgen
