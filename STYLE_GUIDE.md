# SriCalendar Style Guide

## Brand feeling

Warm, playful, polished, and high-tech without looking corporate. Interfaces should feel tactile and calm: soft white space, rounded geometry, concise copy, and small delightful reactions.

## Colour tokens

| Token | Hex | Use |
|---|---|---|
| Baby pink | `#FFC1D5` | primary brand colour, checkboxes, selection warmth |
| Soft pink | `#FFD6E2` | gradients and decorative glow |
| Blush | `#FFF0F5` | tinted surfaces and gentle backgrounds |
| Lavender | `#D8C8FA` | toggles, focus surfaces |
| Mint | `#B5EAD7` | success and completed states |
| Sky | `#B5D8EB` | incomplete tasks, content cards |
| Peach | `#FFDAC1` | notes and gentle fields |
| Yellow | `#FFF1C1` | stickers and sparkle |
| Coral pink | `#F36F9C` | primary actions and emphasis |
| Deep purple | `#8068B0` | headings and navigation |
| Pink-white | `#FFF8FB` | application background |
| Primary text | `#4A4458` | body text |
| Muted text | `#7A7289` | metadata and hints |

Use coral for one primary action per local context. Never place low-contrast pastel text on white; pastels are surfaces and decorations, while text uses purple or primary gray.

## Typography

- Display: Playfair Display 700, 24–36 px. Used only for page and period headings.
- UI/body: Quicksand 400–700, 14–18 px.
- Dates: Quicksand 600/700, 20–28 px.
- Metadata: Quicksand 600, 10–12 px, optionally uppercase with `0.12em` tracking.

## Spacing and shape

Base spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 56 px. Controls are at least 40 px on roomy layouts; compact calendar cells retain accessible labels. Cards use 24 px radius, fields 13–16 px, and pills `999px`. The standard soft shadow is `0 8px 32px rgba(74, 68, 88, 0.08)`.

Glass surfaces use a translucent white fill, white hairline border, and `backdrop-filter: blur(12px)`. Keep blur for overlays and auth cards, not every component.

## Motion

| Interaction | Duration | Curve |
|---|---:|---|
| Hover/tap | 120–180 ms | ease-out |
| Panel/theme transition | 300–350 ms | `cubic-bezier(.2,.8,.2,1)` |
| New list item | 200 ms | Framer default spring/ease |
| Check bounce | ~300 ms | scale `0 → 1.3 → 1` |
| Confetti | 2.4–3.2 s | ease-in fall |

Honor `prefers-reduced-motion`; all decorative animation reduces to near-instant transitions.

## Responsive rules

- Over 950 px: calendar and 340–410 px daily side panel.
- At 950 px and below: daily panel becomes a bottom sheet with a visible 118 px peek state; focus or hover expands it.
- At 600 px and below: denser calendar cells, compact status controls, and horizontally scrollable week planner.

## Voice

Copy is supportive, concise, and creator-specific: “Today’s sparkle list,” “Content studio,” and “Make something wonderful today.” Avoid childish language, excessive exclamation, and guilt around incomplete tasks.
