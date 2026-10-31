# Vita Health — design

Flat, confident, like the cover of a nature magazine. Cream paper, black ink, one violet accent.
No 3D, no glow, no gradients, no glass, no shadows.

## Tokens (`src/app/globals.css`, mapped in `tailwind.config.ts`)

| Token | Value | Use |
|---|---|---|
| `canvas` / `surface` | `#F7F4E8` | every background (never pure white) |
| `subtle` | `#EEEADB` | quiet fills: segmented controls, hover |
| `fg` | `#000000` | text, primary buttons, outlines, data fills |
| `line` | `#C6C3BA` | muted dividers and resting input borders |
| `accent` / `accent-on` | `#643AED` / `#F7F4E8` | **background of one feature block only** — never text, never a border |
| `kcal-*` | earth browns | calorie data in the cabinet (quiet, not a second accent) |

`brand-*` now resolves to ink so older cabinet code stays monochrome.

## Type

- **Display:** Anton (Oswald 700 fills Cyrillic). Uppercase, line-height 0.85, no tracking,
  only at 40px or larger: `text-d-40`, `text-d-90`, `text-d-120`, `text-d-150`.
- **Text:** Inter 14–22px, tracking −0.01em, body 16px / 1.4.

## Shape

- 20px radius on everything: buttons, cards, inputs, images, tags.
- No shadows: separate things with a 1px black outline (`border-fg`) or a `line` divider.

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
