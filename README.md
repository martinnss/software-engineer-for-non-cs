# Software Engineering for Non-CS Majors
### Interactive Presentation Deck — Martín Olivares · UTEM 2026

A high-performance, fully animated presentation built with Next.js and Reveal.js. Designed for Industrial Engineering students at Universidad Tecnológica Metropolitana (UTEM), Santiago, Chile. The core argument: systems thinkers are the best builders in the AI era — and syntax is no longer the bottleneck.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 (React 19, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + custom CSS (900+ lines) |
| Presentation | Reveal.js 6.0.0 |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Compiler | React Compiler (enabled) |
| Build | ESLint 9, PostCSS |

No external animation libraries. All motion is pure CSS keyframes + Canvas API + `requestAnimationFrame`.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (Turbopack)
npx next dev --turbopack

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000).

**Navigation:**
- `→` / `Space` / `Click` — next fragment or slide
- `←` — previous
- `F` — fullscreen
- Works with keyboard, mouse click, and touch.

---

## Project Structure

```
slides/
├── src/
│   └── app/
│       ├── page.tsx          # All 12 slides + all animation logic (~700 lines)
│       ├── layout.tsx        # Root layout, fonts, metadata
│       └── globals.css       # Design tokens, keyframes, all component styles (~900 lines)
├── public/                   # Static assets
├── slides_content.md         # Full slide text reference (all 12 slides)
├── next.config.ts            # React Compiler config
├── postcss.config.mjs        # Tailwind CSS v4 plugin
├── tsconfig.json             # Strict mode, ES2017 target
└── .claude/
    └── launch.json           # Dev server config
```

---

## Design System

All tokens live in `:root` inside `globals.css`.

```css
--blue:    #0066FF       /* primary — electric blue */
--violet:  #7c3aed       /* accent */
--orange:  #ff6b35       /* accent */
--green:   #00c853       /* accent */
--red:     #ff3b5c       /* accent */

--text:    #0a0a0a       /* near-black body text */
--muted:   rgba(0,0,0,0.62)
--muted-2: rgba(0,0,0,0.42)

--bg:      #ffffff
--bg-2:    #f5f5f7       /* card surface */
--bg-3:    #eef2ff       /* blue-tinted surface */

--shadow-blue: 0 0 40px rgba(0,102,255,0.25), 0 8px 32px rgba(0,102,255,0.15)
```

**Typography:** Inter for all headings and body. JetBrains Mono for code labels, metrics, and monospace accents. Heading sizes use `clamp()` to scale fluidly between viewport widths.

---

## Animation System

### Keyframes (20+)

| Keyframe | Used on |
|---|---|
| `fadeInUp / fadeInLeft / fadeInRight` | Section entrances |
| `typewriterWidth + blinkCursor` | Slide 1 hero title |
| `tombstoneDrop` | Tombstone per-click reveal (Slide 5) |
| `rocketLaunch` | Rocket exit animation (Slide 5) |
| `bubbleFloat` | Floating tool bubbles (Slide 7) |
| `panelEnter` | Playbook panel fragments (Slide 11) |
| `learnCardIn` | Learn-by-doing cards (Slide 6) |
| `drawLine` | SVG stroke-dashoffset (timeline + arrow) |
| `impactReveal` | Hero "Tu turno." text (Slide 12) |
| `shake` | "Before" state degradation (Slide 8) |
| `neonPulseBlue` | 90% stat counter glow (Slide 3) |
| `asciiScroll` | Background ambient layer |
| `bounceIn / cardReveal / scaleIn` | General entrance effects |
| `float` | Timeline nodes + icons hover |
| `pulseCta` | CTA border pulse (Slide 12) |

### Utility Classes

```css
.anim-fadeInUp / .anim-fadeInLeft / .anim-fadeInRight
.anim-fadeIn / .anim-scaleIn / .anim-float / .anim-bounceIn

.delay-100 through .delay-1500   /* 0.1s – 1.5s steps */
```

All entrance animations use `cubic-bezier(0.16, 1, 0.3, 1)` — a snappy, natural spring curve.

### Fragment System

Reveal.js fragments control when elements appear (per click). Two patterns are used:

**1. Direct fragment** — the element itself is the fragment:
```tsx
<div className="learn-card fragment">...</div>
```
CSS handles the entrance animation via the `.fragment.visible` selector:
```css
.reveal .learn-card.fragment.visible {
  animation: learnCardIn 0.55s cubic-bezier(0.16,1,0.3,1) both;
}
```

**2. Hidden trigger fragment** — an invisible `div` fires a JS side-effect on click:
```tsx
<div className="fragment" data-action="tomb-1" style={{ display: 'none' }} />
```
The `fragmentshown` event reads `data-action` and toggles a CSS class on a target element:
```tsx
deck.on('fragmentshown', (ev: unknown) => {
  const action = (ev as { fragment: HTMLElement }).fragment?.dataset?.action;
  if (action === 'tomb-1') document.querySelectorAll('.tombstone')[0]?.classList.add('animate');
});
```
This pattern is used for the tombstone drops (Slide 5) and the Antes → Ahora transition (Slide 8).

---

## Special Features

### ASCII Ambient Background
A fixed overlay of sparse monospace characters (`01{}[]<>/*-+=_.,:;`) sits behind all slides. Generated once at module level, doubled in height for a seamless infinite scroll loop at 90s/cycle. Opacity `0.055` — present but never distracting. `aria-hidden` for screen readers.

### Canvas Particle System (Slide 1)
70 nodes rendered on an HTML5 canvas. Each node moves with a velocity vector, bounces off viewport edges, and pulses via `Math.sin()`. Nodes within 130px of each other draw connecting lines with alpha proportional to distance. Fully responsive — resizes on window resize. Cleaned up on unmount via `cancelAnimationFrame`.

### Animated Counter
Smooth number animation from 0 to a target using cubic ease-out, triggered by the `slidechanged` event:
```tsx
function animateCounter(el, target, duration = 1400, suffix = '') { ... }
```
Used for the **90%** stat (Slide 3) and the **12 features** metric (Slide 9).

### Floating Bubbles (Slide 7)
Each `BubbleTool` component receives unique position, size, and motion vectors (`--tx`, `--ty`, `--dur`) as CSS custom properties, enabling independent float physics with zero JavaScript:
```tsx
<BubbleTool name="Zapier" emoji="⚡" size={148} tx="12px" ty="18px" dur="5.2s" ... />
```

### Antes → Ahora Transition (Slide 8)
Two-phase reveal via hidden fragment:
1. "Antes" card is visible at full width on slide enter
2. On click: `.dying` class applies `grayscale(1) + scale(0.82) + shake` to the "Antes" card
3. Simultaneously: SVG arrow draws itself with `stroke-dashoffset`, "Ahora" card slides in from the right with a spring ease

### Click-to-Advance
In addition to keyboard and touch, any click on the presentation advances to the next fragment or slide:
```tsx
revealEl.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('a, button, input, select, textarea')) deck.next();
});
```

---

## Slides Overview

| # | Title | Key Interaction |
|---|---|---|
| 01 | De la UTEM a Silicon Valley | Typewriter title, canvas particles |
| 02 | Yo estaba exactamente ahí | 2 fragments (story + plot twist) |
| 03 | El mundo quiere Builders | 8 fragments + animated 90% counter |
| 04 | Ventaja unfair | Timeline nodes light up on enter |
| 05 | Mi cementerio personal | 4 fragments (3 tombstones drop + rocket launch) |
| 06 | Aprender haciendo | 4 card fragments + punch line |
| 07 | Tu equipo en una pestaña | 11 floating tool bubbles + 1 fragment |
| 08 | La IA ya escribe el código difícil | 3 fragments (arrow + ahora + conclusion) |
| 09 | Demo: Noora Labs | Animated counter, 1 fragment |
| 10 | El conocimiento de élite está GRATIS | 5 resource cards + 1 fragment |
| 11 | De idea a MVP en 1 semana | 5 panel fragments, each animates on click |
| 12 | Tu turno | Impact reveal, 2 fragments, solid blue bg |

Full slide text available in [`slides_content.md`](./slides_content.md).

---

## Image Placeholders

Slides reference real images not yet added. They render as dashed boxes via the `ImgPlaceholder` component. To replace them, drop images into `/public` and swap `<ImgPlaceholder>` for `<Image>` from `next/image`:

| Slide | Placeholder label | Suggested path |
|---|---|---|
| 01 | UTEM Campus · Santiago | `/public/utem-campus.jpg` |
| 01 | Silicon Valley · San Francisco | `/public/sf-skyline.jpg` |
| 02 | Tu foto UTEM · estudiante | `/public/martin-utem.jpg` |
| 02 | Spik AI / Noora · App Store | `/public/noora-appstore.png` |
| 09 | Noora Labs interface | `/public/noora-ui.png` |

---

## Context

This deck was built as a guest lecture for Industrial Engineering students at UTEM, Santiago (2026 cohort). The talk is structured around three claims:

1. **Systems thinking > syntax** — Industriales already think in constraints, flows, and optimization. That is the hard part of building software.
2. **AI eliminates the bottleneck** — Tools like Cursor, Claude, and Replit Agent write the implementation. The builder's job is problem selection and system design.
3. **Iterate or die** — Three failed apps are not failure. They are the curriculum.

The final slide is a call to action: build something this week.

---

*Built with Next.js · Reveal.js · Pure CSS animations · Canvas API*
*Martín Olivares — [@martinolivares](https://x.com/martinolivares)*
