# Lunar Editorial: design notes

Working notes for the `ui-makeover` branch. This is a visual and motion redesign
only: behaviour is frozen (see the brief). The inventory below is the checklist
every phase is re-tested against.

Baseline for the "no logic changes" diff check is `c1a72e3` (the tip of
`feature/new_ui_1`, which `ui-makeover` branched from). `master` is 10 commits
behind that, so diffing against `master` would show work that predates this
branch.

---

## 1. Inventory

### Shell

| Component | Shows | Behaviour to preserve |
| --- | --- | --- |
| `main.jsx` | Providers: Theme → Toast → Moonmind → App, in StrictMode | Provider order |
| `App.jsx` | Router | Routes `/`, `/moonmind`, `*` |
| `pages/Home.jsx` | Background (stars in dark, gradient in light), Navbar, six sections, Footer, ScrollToTop, Moonmind overlay | Background swaps with theme |
| `pages/MoonmindPage.jsx` | Full-page chat: header (brain badge, title, subtitle), Refresh + Minimize buttons, chat body | Minimize: `navigate(-1)` if `state.internal`, else `navigate(state.from \|\| "/")`. Refresh opens the confirm (disabled while pending). `h-[100dvh]`; only the message list scrolls |
| `pages/NotFound.jsx` | 404, "Page Not Found", copy, Back to Home link | Link to `/` |

### Navigation

| Component | Shows | Behaviour to preserve |
| --- | --- | --- |
| `Navbar.jsx` | Top bar: "Ayan's Portfolio" (→ `#hero`), desktop icon links (md+) with the Moonmind button in the middle, ThemeToggle. Mobile: floating bottom bar with the same icons + Moonmind | Links are `href="#…"` anchors; clicking sets `activeNav`. Moonmind button calls `toggle()`. `isScrolled` (> 10px) changes the bar background. Every link has `title` + `aria-label`. There is **no** hamburger menu; mobile uses the bottom bar |
| `ThemeToggle.jsx` | Sun (dark) / Moon (light) | `toggleTheme()`; persists `theme` in localStorage (logic in ThemeContext) |
| `ScrollToTop.jsx` | Up-arrow button, bottom-left, hidden below `sm` | Visible after 300px; smooth-scrolls to top |
| `Footer.jsx` | © year, name; back-to-top link | `href="#hero"`, `aria-label="Back to top"` |
| `SocialLinks.jsx` | LinkedIn, GitHub, LeetCode, WhatsApp, Mail icons | New tab except `mailto:`; `aria-label` + `title` per link |

### Sections

| Component | Shows | Behaviour to preserve |
| --- | --- | --- |
| `HeroSection.jsx` `#hero` | "Hi, I'm" + typewriter over `HERO_SECTION_ROLES` (one round, ends on "Ayan Maiti"), description, Download Résumé (`RESUME_URL`, new tab), Moonmind AI button (`open()`), SocialLinks | Both buttons and their actions |
| `AboutSection.jsx` `#about` | "About Me", heading, two paragraphs, Get In Touch (`#contact`), Download Résumé, three cards (Backend, AI, Cloud) | Links |
| `SkillsSection.jsx` `#skills` | Category filter (All, GenAI/ML, Backend, Frontend, Cloud/Web3) and 36 skills with % bars. On mobile the list scrolls inside `max-h-[60vh]` | Filter state (`activeCategory`); every skill shown |
| `StatsSection.jsx` `#stats` | LeetCode card (ring %, solved, rank, Easy/Medium/Hard bars), GitHub card (repos, commits, PRs, stars + language card image), Certificates list (9 links) | Fetches (LeetCode, GitHub, geolocation) and env vars; localStorage `leetcodeCache` / `githubCache` (30-day expiry); falls back to cache or zeros; count-ups start when in view **and** data has loaded; reduced motion shows final values; screen-reader labels; whole cards link to the profiles |
| `ProjectSection.jsx` `#projects` | 12 project cards: image, title, Live Demo, Code. "Check My GitHub" | `/moonmind` demo uses `<Link state={{ internal: true }}>`; others open in new tabs |
| `ContactSection.jsx` `#contact` | Email, location, socials; form (name, email, message, honeypot) | Web3Forms POST; "Email not configured" toast when the key is unset; success/error toasts; `form.reset()` on success; `isSubmitting` disables the button and shows "Sending..." |

### Moonmind

| Component | Shows | Behaviour to preserve |
| --- | --- | --- |
| `Moonmind.jsx` | Launcher (desktop only, `max-sm:hidden`) when closed; `role="dialog"` panel when open: header (badge, title, subtitle, Refresh, Expand, Close) + chat | `open`/`close`; Expand navigates to `/moonmind` with `state: { from, internal: true }`; no focus trap today |
| `MoonmindChat.jsx` | Message list, assistant identity once per group, steps, markdown, typing dots, sources `<details>`, inline refresh confirm (`role="alertdialog"`), composer | Sticky auto-scroll (80px threshold); input autofocus on mount; Enter sends, Shift+Enter newline; textarea grows to 128px then scrolls; Escape cancels refresh, focus moves to Cancel; links open in new tabs |
| `MoonmindSteps.jsx` | One-line header (chevron + label) and collapsible step rows | Per-message `open` state, collapsed by default; shimmer only after 300ms of running; `aria-expanded` / `aria-controls` |
| `context/MoonmindContext.jsx` | — | sessionStorage persistence (`portfolio_chat_messages`, `portfolio_chat_session_id`); run/poll lifecycle; refresh confirm flow |

### Other

- `ToastContext.jsx`: toasts bottom-right, auto-dismiss after 4s, `role="status"`.
- Hooks: `useInView`, `useCountUp`, `usePrefersReducedMotion` / `useMediaQuery` / `useFinePointer`.

---

## 2. Motion reference (animejs.com)

I had no interactive browser tool, so this comes from the rendered homepage
source and the v4 documentation defaults, not from a frame-by-frame recording.
Only the rules are copied, not the look.

| | animejs.com | What we use |
| --- | --- | --- |
| Default duration | 1000ms, ease `out(2)` | Shorter: 150 / 300 / 600ms |
| Stagger gaps | 10ms (tick marks), 40ms (SVG paths), 100ms (lines) | 60ms for blocks, 28ms for characters |
| Easing | `inOut(3)`, `inOutExpo`, `out(4)` | `out(3)` for UI, `inOut(3)` for draws, `outExpo` for entrances |
| Springs | Only for things you throw (draggable release, `stiffness: 120, damping: 6`) | One spring preset, only for the launcher → panel morph (Phase 3) |
| On load | One hero sequence; SVG lines draw with a stagger | The moon draws once; the name rises char by char |
| On scroll | Line drawing synced to scroll (`onScroll({ sync: true })`) | Entrances fire once, when an element enters the viewport; nothing is scrubbed except the navbar moon phase |
| On hover | Small, fast, transform-only | Underline or border light, ≤ 150ms, transform/opacity only |

Rules we keep: one signature moment per screen, short stagger, nothing loops,
and motion confirms structure rather than decorating it.

---

## 3. Tokens

### Colour

HSL triplets. The variable names are unchanged; the values are remapped.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--background` | `220 24% 8%` #101319 | `216 26% 96%` #f2f4f7 | Page ink / paper |
| `--foreground` | `214 32% 91%` #e1e7ef | `222 44% 14%` #141d33 | Body text |
| `--card` | `220 20% 11%` #161a22 | `216 33% 99%` #fcfcfd | Panels |
| `--muted` | `220 16% 15%` | `216 22% 91%` | Quiet fills |
| `--muted-foreground` | `216 14% 66%` #9ca6b4 | `218 16% 37%` #4f5a6d | Secondary text, placeholders |
| `--primary` | `208 56% 78%` #a7c9e6 | `212 62% 34%` #21538c | Accent: links, focus, moon line |
| `--primary-foreground` | = background | = background | Text on accent |
| `--earthshine` (new) | `36 86% 66%` #f3b75e | `28 88% 32%` #994d0a | Live states only |
| `--border` | `218 16% 19%` | `216 18% 85%` | Hairlines (decorative) |
| `--input` (new) | `216 12% 42%` | `216 12% 54%` | Field borders (≥ 3:1) |
| `--ring` (new) | = primary | = primary | Focus rings |

Measured contrast (WCAG 2.x):

| Pair | Dark | Light |
| --- | --- | --- |
| foreground / background | 14.98 | 15.18 |
| muted-foreground / background (also placeholders) | 7.56 | 6.30 |
| muted-foreground / card | 7.06 | 6.77 |
| primary / background | 10.78 | 7.11 |
| primary-foreground on primary | 10.78 | 7.11 |
| earthshine / background | 10.43 | 5.58 |
| input border / background | 3.33 | 3.31 |

### Type

Three self-hosted files on first load, Latin subset only, `font-display: swap`,
each with a metric-matched local fallback so the swap does not move text.

| Role | Family | File | Fallback (size-adjust / ascent / descent) |
| --- | --- | --- | --- |
| Display (headings) | Bricolage Grotesque, display cut (opsz 72), variable `wght` 500–700 | `src/assets/fonts/bricolage-grotesque-display-latin.woff2`, 37 KB, **preloaded** | Arial Bold 93.76% / 99.19% / 28.80% |
| Body | IBM Plex Sans, variable `wght` 100–700 | `latin-wght-normal.woff2` (as shipped by Fontsource), 45 KB, **preloaded** | Arial 101.57% / 100.91% / 27.07% |
| Mono (labels, numbers, trace) | IBM Plex Mono 500 | `latin-500-normal.woff2`, 15 KB | Courier New 99.98% / 102.52% / 27.50% |

Why a custom instance of Bricolage: Fontsource's 41 KB `wght` file is pinned
to the *text* optical size, which loses the tight, quirky display cut that
makes Bricolage worth having; its `opsz` file keeps the cut but is 77 KB.
`scripts/build-display-font.py` pins the `opsz` file at 72 with weight 500–700
(37 KB). Bricolage is OFL 1.1 with no Reserved Font Name, so a modified
instance may ship; its licence sits next to the file. The Plex files are used
exactly as Fontsource ships them.

| Step | Size | Line height | Tracking |
| --- | --- | --- | --- |
| Display (hero name) | `clamp(3.75rem, 1.6rem + 10.5vw, 9.5rem)` | 0.9 | -0.04em |
| H2 (section) | `clamp(2.25rem, 1.4rem + 3.6vw, 4.25rem)` | 1.0 | -0.03em |
| H3 | `clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)` | 1.15 | -0.015em |
| Lead | 1.125rem | 1.6 | 0 |
| Body | 1rem (16px, also on mobile) | 1.65 | 0 |
| Small | 0.875rem | 1.5 | 0 |
| Eyebrow | 0.75rem mono, uppercase | 1.4 | 0.14em |

Headings use `text-wrap: balance`; paragraphs use `text-wrap: pretty`.

### Space, radii, lines

- 4px base unit. Section padding `clamp(5rem, 12vw, 9rem)` block;
  container inline padding `max(1.25rem, safe-area)` on phones, 2rem from `md`.
- Radii: 6px controls (buttons, inputs, chips), 12px panels, full for icon buttons.
- Hairlines are 1px `--border`. Field borders use `--input`.
- Focus ring: 2px solid `--ring`, 3px offset, in both themes.

### Motion (`src/lib/motion.js`)

| Token | Value |
| --- | --- |
| `DURATION.fast` | 150ms (hover, press) |
| `DURATION.base` | 300ms (fades, small rises) |
| `DURATION.slow` | 600ms (entrances, each moon stroke) |
| `EASE.out` | `out(3)`, CSS `cubic-bezier(0.33, 1, 0.68, 1)` |
| `EASE.inOut` | `inOut(3)`, CSS `cubic-bezier(0.65, 0, 0.35, 1)` |
| `EASE.expo` | `outExpo`, CSS `cubic-bezier(0.16, 1, 0.3, 1)` |
| `STAGGER` | 60ms (blocks); characters use `STAGGER / 2` |
| `SPRING` | `{ bounce: 0.2, duration: 450 }` |

`applyMotionTokens()` writes these to `--motion-*` custom properties on `<html>`
so CSS transitions read the same numbers.

---

## 4. Decisions and deviations

- **Star canvas has no animation loop at all.** It is drawn once (seeded, so it
  is stable across resizes). On desktop the very slow parallax is a CSS
  scroll-driven animation (`animation-timeline: scroll()`) on the canvas
  element, which runs on the compositor with no JS per frame. So the "30fps
  cap", "pause when hidden" and "stop when the hero is off-screen" rules are met
  trivially: there is nothing to pause. Phones and reduced motion get the static
  image only. Browsers without scroll timelines get the static image too.
- **Navbar moon phase** uses a passive scroll listener that only schedules a
  single `requestAnimationFrame`. The frame quantises progress to 60 steps and
  writes the path's `d` attribute only when the step changes (≈ 60 writes over
  the whole page), plus the "scrolled" flag only when it flips.
- **Backdrop blur**: kept only on the desktop (`md+`) top bar. The mobile top
  and bottom bars are solid, because blur over scrolling content is exactly the
  cost we are trying to avoid on phones.
- **Mobile bottom bar**: docked edge-to-edge (safe-area aware) so 7 × 44px
  targets fit with ≥ 8px gaps from 360px up (9px measured at 375). At 320px the
  targets stay 44px but the gaps shrink to 0 (still well above the WCAG 2.2 AA
  24px minimum).
- **Navbar mobile menu**: there is no menu to open; mobile navigation is the
  bottom bar, which is always visible. See Suggestions.
- **Typewriter removed.** The roles it typed (`moonman369`, `Backend Dev`, `AI
  Engineer`) now appear as a static mono line under the name, so no copy is lost.
- **Hero two-column layout starts at `lg`**, not `md`: at tablet width the
  moon beside a long paragraph floated awkwardly, so tablets get the phone
  composition (moon top-right, name beside it).

### Performance-driven deviations (section 0 wins)

Each of these was measured with a Chrome trace at 4x CPU slowdown.

- **No runtime `splitText` for the name.** It cost 160–240ms of main thread
  at load (it initialises `Intl.Segmenter` and rebuilds the DOM) to split two
  words that are already separate elements. The name is split in the markup
  instead: one `overflow: clip` mask per line (padded so descenders are never
  cut), and each line rises out of its mask on WAAPI. Same visual, ~0ms.
  Splitting per *character* was also rejected on quality grounds: per-character
  inline-blocks break kerning pairs like "Ay" at display size.
- **The entrance starts the frame after the first paint.** CSS holds the
  animated parts hidden (`[data-entrance="pending"]`, only rendered when motion
  is allowed), then `useAnimeScope({ afterPaint: true })` sets up the
  animations on a settled layout and releases the hold. Doing it in a layout
  effect forced the page's whole first layout inside React's commit.
- **The hero description is never animated.** It is the largest text in view,
  so it is the LCP element; hiding it for an entrance made Lighthouse fall back
  to the navbar brand and pushed LCP out.
- **No JS-engine `set()` for start states.** anime.js runs WAAPI with
  `fill: "both"`, so delayed animations already hold their first keyframe;
  `set()` read computed style on a dirty page and cost 160–420ms.
- **Moon strokes do not use `vector-effect: non-scaling-stroke`.** With it,
  anime.js reads each path's `getCTM()` every frame of the draw, forcing layout
  per path per frame. Stroke widths are set in viewBox units per breakpoint
  instead (about 1.2–1.6px rendered).
- **Fonts: display and body are preloaded, mono is not.** Preloading only the
  display font left the body font to swap in after first paint and re-lay-out
  the whole page (TBT +250–350ms). Preloading all three pushed LCP over 2.5s.
  Display + body measured best (see below).
- **`content-visibility: auto` on sections was tried and rejected.** It cut
  load-time main-thread work, but deep links broke: `/#stats` landed 409px off
  because estimated section sizes were corrected after the jump. Behaviour wins.

### Measurements (Phase 1)

Lighthouse mobile (simulated slow 4G, 4x CPU), production build served
locally, median of 5 runs. This machine is noisy: identical runs vary by up
to ±8 performance points, so single runs are not meaningful.

| | Before | After Phase 1 | Budget |
| --- | --- | --- | --- |
| Performance | 69 | **83** | ≥ 90 ✗ |
| Accessibility | 90 | **100** | ≥ 95 ✓ |
| LCP | 2.72s | **2.34s** | < 2.5s ✓ |
| TBT | 1,356ms | **541ms** | < 200ms ✗ |
| CLS | 0.003 | **0** | < 0.05 ✓ |
| Initial JS (gzip) | 159.7 KB | **130.2 KB** | ≤ 170 KB ✓ |
| Chat chunk (lazy) | in main bundle | 51.5 KB | — |
| Project images | 4.2 MB of PNG | 5–48 KB each (AVIF/WebP, 1x + 2x) | < 80 KB ✓ |
| Fonts on first load | 0 (system) | 3 files, 98 KB | ≤ 3 ✓ |

Full-page scroll, Chrome trace at 4x CPU slowdown:

| | Before | After Phase 1 |
| --- | --- | --- |
| Mobile: long tasks / blocking | 141 / 6.4s | 21 / 1.25s |
| Desktop: long tasks / blocking | 135 / 8.7s | 53 / 2.7s |

The remaining scroll cost is mostly compositor-layer updates (Layerize) and
paint in sections still on the old styling: Stats count-ups set React state
every frame and transition `width`, and cards scale on hover. Phase 2 rebuilds
those and re-measures.

**Why TBT is still over budget.** What remains at load is the client-rendered
React app itself: evaluating the bundle, rendering every section, and the first
style and layout of the whole page. The app shell plus hero alone is about 60%
of it; each other section adds a little. Closing the gap needs a structural
choice, none of which is purely visual:

1. Pre-render the page to static HTML at build time and hydrate (largest win
   for LCP; TBT still pays for hydration).
2. Mount below-the-fold sections in a second, interruptible pass
   (`useDeferredValue`). This changes when sections and their fetches mount,
   and deep links would need re-testing.
3. `content-visibility: auto` with measured per-section sizes (see the
   deep-link problem above).

---

## 5. Suggestions (skipped because they would change behaviour)

- Mobile nav menu (Escape to close, return focus, outside tap, scroll lock): not
  applicable today because the mobile nav is a permanent bottom bar, not a menu.
  If a menu is ever added, it needs that logic.
- `ThemeContext` initialises from localStorage in an effect, so without help the
  first paint is dark tokens even for light-theme users. `index.html` now sets
  the `dark` class before paint (same key, same default), which removes the flash
  without touching the context. Moving that into the context would be cleaner.
- `Navbar` `activeNav` only changes on click; it could follow the section in
  view.
- The Moonmind panel is `role="dialog"` but has no focus trap or Escape to close.
- `/#about` as a direct link does not scroll on load (also true before this
  branch); the other section links do.
- The production bundle resolves `react-router`'s `dist/development` build;
  worth checking whether a `production` resolve condition trims it.
