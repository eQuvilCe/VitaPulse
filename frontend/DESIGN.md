# Vita Health — design

Flat, confident, like the cover of a nature magazine. Cream paper, black ink, one violet accent.
No 3D, no glow, no glass, no shadows. Light and dark themes share one violet accent.

## Themes and tokens

All colour comes from CSS variables in `src/app/globals.css`, mapped to Tailwind in
`tailwind.config.ts`. Components never branch on the theme and never hard-code colours
(no `text-white`, `bg-black`, hex values or `white/10`): use the token classes below and both
themes work for free.

| Token (Tailwind) | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#F7F4E8` cream | `#12110E` warm near-black | page background |
| `surface` | `#F7F4E8` | `#1A1915` | cards, inputs |
| `subtle` | `#EEEADB` | `#24221D` | quiet fills: segmented controls, hover |
| `fg` / `fg-muted` / `fg-subtle` | black / `#4A4842` / `#7D7A71` | cream / `#BEBAAF` / `#8A867C` | text; `fg` is also the primary button fill |
| `line` | `#C6C3BA` | cream ~16% | dividers, resting input borders |
| `line-strong` | black | cream ~20% | card and control outlines |
| `accent` / `accent-on` | `#643AED` / cream | same | **background of one block per screen only** — never text or borders |
| `cream` / `ink` | cream / black | same (fixed) | text and scrims over photos and video only |
| `brand-*` | ink scale | cream scale | legacy name for ink: active states, healthy data |
| `kcal-*`, `warn`, `danger`, `info` | earth / semantic | lifted for dark | calorie data and status |

Rules of thumb: text on `bg-fg` is `text-canvas` (not `text-white`); text on `bg-accent` is
`text-accent-on`; outlines are `border-line-strong`; dividers are `border-line`.

**Switching.** `:root[data-theme="dark"]` (or `light`) is an explicit choice; with none, the
system theme applies through `prefers-color-scheme`. An inline script in `app/layout.tsx`
applies the saved choice before first paint, so there is no flash.

**Toggles** (export from `@/components/ui`, use them in every navbar, including the cabinet):
- `ThemeToggle` — sun/moon button; saves to `localStorage["vh-theme"]`. `useTheme()` returns
  `{ theme, setTheme }` if a screen needs the current theme.
- `LanguageToggle` — EN/RU; English by default for non-Russian browsers.
Both inherit `currentColor`, so they work on the page and over the hero video.

## Type

- **Display:** Anton (Oswald 700 fills Cyrillic). Uppercase, line-height 0.85, no tracking,
  only at 40px or larger: `text-d-40`, `text-d-90`, `text-d-120`, `text-d-150`.
- **Text:** Inter 14–22px, tracking −0.01em, body 16px / 1.4.

## Shape

- 20px radius on everything: buttons, cards, inputs, images, tags.
- No shadows: separate things with a 1px outline (`border-line-strong`) or a `line` divider.

## Components (`src/components/ui`)

- `Button` — `primary`: black fill, cream text. `secondary`: transparent, 1px black outline.
- `Card` — `surface`: cream + 1px black outline, 24px padding. `accent`: violet, cream text.
- `Input` — transparent, `line` border that turns black on hover/focus.
- `Badge` — outlined 20px tags. `Progress` — hairline track, ink fill.

## Layout

- Hero: full-bleed daylight photo (people in motion, nature, food), huge cream headline bottom-left,
  a soft curve into the cream page below.
- Sections: one centred huge statement (90–150px) + a narrow paragraph; 60–128px vertical spacing;
  no dense grids.
- Signature move: a small rounded photo set inside a line of the huge headline, in place of a word.
- Navbar: transparent; menu/logo left, compact "Vita Health" wordmark centre, ghost button right.

## Motion

Short colour/opacity transitions (200–600ms). Content fades up once on scroll. Nothing loops.
