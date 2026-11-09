# Design System

## Direction

A quiet after-hours writing studio: charcoal surfaces, warm paper-like typography, and orange as the one action color. The surface operates as a creative tool, not a marketing page. This code-first direction was supplied by the implementation brief; no user workflow preference is persisted.

## Tokens

| Token | Value | Purpose |
| --- | --- | --- |
| Background | `#151615` | Main workspace |
| Rail | `#111210` | Persistent navigation |
| Surface | `#1b1c1a` | Notebook and saved items |
| Border | `#2d2e2a` | Quiet structure |
| Foreground | `#f1eee7` | Headings and primary content |
| Muted | `#a19f97` | Supporting labels |
| Accent | `#ff8057` | Actions, selection, serif emphasis |
| Radius | `14px` | Photography cards |

DM Sans is the interface and display face; italic Instrument Serif is reserved for one expressive phrase in each main heading. Fonts are self-hosted under `assets/`.

## Studio Surface

Desktop uses a 236px category/navigation rail and an airy workspace. The headline introduces the task; word count and generation controls lead directly to the photo cards. Only two or three prompts are rendered. The notebook is the next step, not a competing hero action. Below 720px, navigation becomes an inert, hidden left panel until opened; closing restores focus to a visible control or the main workspace. Prompt cards stack as full-width, 170px photographic rows, preserving whole-word titles and 44px lock targets.

## Interaction and Accessibility

Selected categories and locks use `aria-pressed`. Orange focus rings, a skip link, visible text alternatives, reduced-motion support, and semantic buttons are required. The signature motion is a short staggered card deal on generation, disabled by reduced-motion preference. Text remains visible before animation. Photos use a dark bottom scrim for readable titles and remain atmospheric references rather than factual identity claims.
