# Google Maps Embed API

The app uses the **Google Maps Embed API** for things our Leaflet map can't do. The flood-aware
route itself stays on Leaflet, because an embedded Google map can't draw our risk colours.

| Feature | Where | Embed mode |
|---|---|---|
| Our route in Google Maps (Google follows our flood-aware path using 8 waypoints) | "Route in Google" tab after a search | `directions` |
| Street View of the destination | "Destination Street View" tab | `streetview` |
| Street View of a flood point | Click a flood point → "See it in Street View" | `streetview` |

Without a key, the preview shows a short setup message, and "Open in Google Maps" still works,
because Google Maps links don't need a key.

Code: `Route_Machine/src/google/embed.js` (URLs, with tests) and `src/components/GooglePreview.jsx`.

## Cost

Free. Google: Maps Embed usage is "available at no charge" and has no daily or per-second
limits. Google usually asks for a billing account on the project anyway; set a $1 budget alert.

## Getting a key

1. [console.cloud.google.com](https://console.cloud.google.com) → **New project** → parent
   resource **No organization**.
2. **Billing** → link a billing account. Google may place a temporary authorization hold on
   the card; it's released, not charged.
3. **APIs & Services → Library** → "Maps Embed API" → **Enable**.
4. **APIs & Services → Credentials → Create credentials → API key**.
5. Restrict the key (the key is visible in the page by design, so this is the protection):
   - **Websites:** `http://localhost:5173/*` and `https://sentinelsystems.vercel.app/*`
   - **API restrictions:** Maps Embed API only
6. **Billing → Budgets & alerts** → $1 budget.

## Adding the key

- **On your computer:** copy `Route_Machine/.env.example` to `Route_Machine/.env.local` and put
  the key after `VITE_GOOGLE_MAPS_EMBED_KEY=`. Restart `npm run dev`. `.env.local` is in
  `.gitignore`, so it's never committed. Don't paste the key into issues, PRs or chat.
- **On the live site:** Vercel → project → **Settings → Environment Variables** → add
  `VITE_GOOGLE_MAPS_EMBED_KEY`, then redeploy.

## Note for drivers

Street View photos can be months or years old, so they show what a place looks like, not
whether it's flooded now. The preview says this under every Street View.
