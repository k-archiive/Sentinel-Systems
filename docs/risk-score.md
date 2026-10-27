# Flood risk score

How the app turns a route and a set of flood points into a score from 0 to 100,
and how each stretch of the route gets its colour. Code: `Route_Machine/src/risk/scoreRoute.js`.

## Inputs

- **Route:** the line OSRM returns, as `[lat, lng]` points in driving order.
- **Flood points:** `{ lat, lng, depthFt }` for each known flooded spot. Today this is test data;
  it will be the Hurricane Harvey high-water marks (and later live gauges).

## Step 1: which points matter

A flood point counts only if it is within **150 m** of the route (about one to two city blocks).
Distance is measured to the nearest point on the route line, not just to its corners.

## Step 2: how much each point matters

Each point gets a **contribution** between 0 and 1:

```
contribution = proximity × depth
proximity    = 1 − distance / 150 m          (1 on the road, 0 at 150 m)
depth        = depthFt / 2, kept between 0.2 and 1   (0.5 if depth is unknown)
```

Depth tops out at **2 ft** because the National Weather Service warns that 2 ft of water can
float most vehicles. Shallow water still counts a little (0.2), because depth can change fast.

## Step 3: the route score

The contributions combine as if each point were an independent chance of trouble:

```
score = 100 × (1 − (1 − c₁)(1 − c₂)…(1 − cₙ))
```

So one deep point right on the road gives a score near 100, each extra point raises the score
by less than the one before, and the score can never go above 100.

| Score | Level | Colour |
|---|---|---|
| 0 | Clear | Blue |
| 1–29 | Low | Yellow |
| 30–59 | Moderate | Orange |
| 60–100 | High | Red |

## Step 4: colouring the route

Each piece of the route gets its own risk: the highest contribution of any flood point near
that piece. The same thresholds give its colour, so drivers see exactly which stretch is
dangerous instead of one warning for the whole trip.

The result also reports how many flood points are near the route, the deepest water, and how
many metres of the route are affected.

## Ranking routes (for rerouting)

`rankRoutes()` scores several candidate routes and sorts them safest first, using travel time to
break ties. The reroute feature can use it once the app requests alternative routes from OSRM.

## Known limits / to tune

- 150 m and the 2 ft cap are starting values; tune them when testing against past flood days.
- Harvey marks are from 2017. They show where flooding *has* happened, not where it is now.
- Points are treated as independent even when several mark the same flooded area.
