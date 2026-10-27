# Usability check

**Requirement (README, non-functional):** a user can enter a route, view its risks and get safety
information in **3 interactions or fewer**.

**Status:** walkthrough done and fixes made (this document). Testing with real users is still to
do; the script and results table are at the bottom.

## How we counted

One interaction = one deliberate user action: a click or tap, typing an entry (all the
keystrokes for one field count as one), pressing Enter, or dismissing a pop-up. The start point
comes from the browser's location, so it needs no interaction after the first visit. The browser's
one-time "allow location?" prompt is outside the app and is listed separately.

Walkthrough by Fatima Ane on Oct 20, 2026, desktop Chrome, using the app in `Route_Machine`
with sample flood data.

## Results

| Task | Before | After | Meets ≤ 3? |
|---|---|---|---|
| Get a route and its flood risk for a Houston destination | 3: click search box, type, click Search | **2**: type, press Enter (3 if using the mouse to click Search) | Yes |
| See safety guidance for a high-risk route | 3 | **2**: guidance opens on its own | Yes |
| Destination not found, then fix it | 4 to see the error (incl. closing an alert), plus retyping | **2** to see the message, then edit and press Enter | Yes |
| Location blocked | +1 (alert to close before the map loads) | **+0**: message shown on the page | Yes |
| First visit only | +1 browser location prompt | +1 browser location prompt | Outside our control |

Time from pressing Enter to the route and risk score appearing: about **1 second** in one test
(home connection). The full speed check (under 5 s) is a separate task.

## Problems found and fixed

1. **Enter didn't search.** The search box wasn't a form, so users had to click Search.
   *Fix:* it's now a form; Enter submits.
2. **The search box needed a click before typing.** *Fix:* it's focused when the app opens.
3. **No feedback while searching.** Nothing changed for a second or two, which invites repeat
   clicks. *Fix:* the button reads "Finding route…" and is disabled until the result arrives.
4. **Pop-up alerts cost an extra click.** "Could not find that location" and "Could not get your
   location" used `alert()`. *Fix:* both are now messages on the page, and the typed text stays so
   it can be corrected.
5. **New routes could be off-screen.** The map never moved after the first load, so a far-away
   destination's route wasn't visible. *Fix:* the map zooms to fit each new route.

## Still to improve (not fixed here)

- **No way to choose a different start.** Routes always start from the user's location
  (or downtown if location is blocked).
- **Search only covers Houston.** Places like Kemah return "couldn't find". That's expected
  for now, but the message could say the app covers Houston only.
- **No suggestions while typing.** Autocomplete would help with misspellings.
- **The previous route stays on the map after a failed search,** which could confuse someone.

## Testing with real users (to do)

Ask 3–5 people who haven't seen the app (classmates, family). Don't help them; just watch,
count their interactions, and note where they hesitate.

**Script:** "This app plans driving routes in Houston and warns you about flooding. Please:"

1. Find a route to NRG Stadium and tell me how risky it is.
2. Find a route to a place of your choice.
3. *(With sample data)* Find a route to Houston City Hall. What would you do if the app said the
   route was dangerous?

| Tester | Task 1 interactions | Task 2 interactions | Task 3: understood the guidance? | Where they hesitated |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Pass:** every tester finishes tasks 1–2 in 3 interactions or fewer.
