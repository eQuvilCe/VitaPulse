# Vita Health — design

Quiet, white and alive. Paper-white pages, deep forest ink, ONE flat green, and a lime dot that
runs along a heartbeat line. No gradients, no glass, no glow on cards, no shadows: depth comes
from whitespace and hairlines. The heartbeat line is the single memorable thing; everything else
stays out of its way.

## Themes and tokens

All colour comes from CSS variables in `src/app/globals.css`, mapped to Tailwind in
`tailwind.config.ts`. Components never branch on the theme and never hard-code colours
(no `text-white`, `bg-black`, hex values or `white/10`): use the token classes below and both
themes work for free.

| Token (Tailwind) | Light | Dark | Use |
|---|---|---|---|
| `canvas` / `surface` | white | `#08110C` / `#0E1A13` | page background / cards, inputs |
| `subtle` | `#F4F7F3` | `#142319` | quiet fills and section bands |
| `fg` / `fg-muted` / `fg-subtle` | `#0E1A13` / `#4B5A50` / `#66756A` | `#EEF4EF` / `#AABAAF` / `#809286` | text |
| `line` / `line-strong` | `#E4EAE3` / `#CBD5CB` | `#1E3025` / `#2C4535` | dividers / outlines and controls |
| `accent` / `accent-on` | `#177A43` / white | `#4AC878` / `#06140C` | the one green: buttons, the result block, active states |
| `accent-2` | `#1F8C4E` | `#6EDC96` | the heartbeat line, chart strokes |
| `lime` / `halo` | `#C4F03C` / `#AAE132` | `#CDF550` | the pulse dot and its soft halo. Fills only, never text |
| `brand-*` | green scale | green scale | tints (`brand-50` for chips), healthy data |
| `kcal-*` | amber | lifted amber | calorie data, the one complementary colour |
| `warn`, `danger`, `info` | semantic | lifted | status |
| `cream` / `ink` | fixed | fixed | text and scrims over photos and video only |

Rules of thumb: text on `bg-accent` is `text-accent-on`; outlines are `border-line` (quiet) or
`border-line-strong` (controls and tables); never stack a shadow on a card.

**Switching.** `:root[data-theme="dark"]` (or `light`) is an explicit choice; with none, the
system theme applies through `prefers-color-scheme`. An inline script in `app/layout.tsx`
applies the saved choice before first paint. Both theme blocks come from one source of values.

**Toggles** (`@/components/ui`): `ThemeToggle` and `LanguageToggle`, in every navbar.

## Type

One family: **Onest** (Latin + Cyrillic). Headlines are Onest at weight 500, tracking −0.04 to
−0.055em, line-height ~1, sentence case, 38–112px. Body 16px / 1.45, lead text 18–20px in
`fg-muted`. Big numbers are the same face, tabular. No uppercase, no second typeface.

## Shape

20px on cards, 14px on fields, 28px on sheets; buttons and chips are `rounded-full`.
The hero photo sits in an arch (`rounded-t-[999px]`).

## Components (`src/components/ui`)

- `Button` — `primary`: flat green. `secondary`: hairline that darkens on hover.
- `Card` — `surface`: white + hairline. `accent`: the flat green block, one per screen.
- `Badge`, `Progress` — flat fills, no glow.

## Landing

Hero (headline, arch with the runner video, heartbeat line) → big statement with a pill photo in
the line, then three plain rows with a live mini-visual each → **how it works** on a pale band
(a line fills as you scroll, a lime dot at its head) → your numbers (hairline sliders, one solid
green result block) → closing headline and the heartbeat line that comes to rest on its dot.

## Motion

- On load: headline lines rise, the arch opens like a window, the heartbeat line draws itself.
- Ambient (the only loop): a lime dot runs along the hero line; the closing dot breathes.
- Scroll: the video drifts inside the arch, row hairlines draw across, rings and charts fill, the
  process line fills and its steps turn solid. Reveals are a plain fade up.
- 3D: the arch tips up to 3° toward the mouse. Nothing else.
- All of it stops under `prefers-reduced-motion: reduce`; the finished state is always readable.
