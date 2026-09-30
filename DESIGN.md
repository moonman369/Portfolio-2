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
| `--foreground` | `214 45% 95%` #edf1f8 | `222 44% 14%` #141d33 | Body text |
| `--card` | `220 20% 11%` #161a22 | `216 33% 99%` #fcfcfd | Panels |
| `--muted` | `220 16% 15%` | `216 22% 91%` | Quiet fills |
| `--muted-foreground` | `215 20% 72%` #a9b5c6 | `218 20% 32%` #414d62 (was `218 18% 36%`) | Secondary text, placeholders |
| `--primary` | `204 100% 76%` #85ceff | `212 88% 42%` #0d65c9 | Accent: links, focus, moon line |
| `--primary-foreground` | = background | = background | Text on accent |
| `--ink` (new, Round 4) | = primary | `212 92% 32%` #074d9d | Small blue text: eyebrows, active/hover links, skill levels (`text-ink`) |
| `--earthshine` (new) | `38 100% 64%` #ffbc47 | `28 95% 33%` | Live states only (e.g. "Sending...") |
| `--glow` (new) | `204 100% 70%` lunar blue | `45 96% 60%` buttery moon yellow | Button halos and travelling rims, card hover glow |
| `--glow-hi` (new) | `49 100% 82%` butter | `50 100% 86%` pale butter | The bright core of a button's travelling light |
| `--border` | `218 16% 19%` | `216 18% 85%` | Hairlines (decorative) |
| `--input` (new) | `216 12% 42%` | `216 12% 54%` | Field borders (≥ 3:1) |
| `--ring` (new) | = primary | = primary | Focus rings |

Light glass (light mode only, Round 4; see §9):

| Token | Light | Use |
| --- | --- | --- |
| `--lunar-wash` | `0.25` (was 0.5) | Paper wash over the whole stone |
| `--haze` | `0.8` phones/tablets, `0.75` desktop | Feathered haze behind each text column |
| `--glass-top` / `--glass-bottom` | `0.55` / `0.38` | Card glass: vertical gradient of `--card` |
| `--glass-edge` | `0 0% 100%` (used at 60-70%) | 1px lighter glass edge and top highlight |
| `--glass-shade` | `218 45% 28%` | Cool, soft card and bar shadows |

Measured contrast (WCAG 2.x):

| Pair | Dark | Light |
| --- | --- | --- |
| foreground / background | 16.48 | 15.18 |
| muted-foreground / background (also placeholders) | 8.99 | 7.73 |
| muted-foreground / card | 8.40 | 8.30 |
| ink / background | 10.88 | 7.51 |
| primary / background | 10.88 | 5.14 |
| primary-foreground on primary | 10.88 | 5.14 |
| earthshine / background | 11.10 | ≥ 4.5 |

The palette was brightened after Phase 1 review ("a bit brighter shades");
every pair above was re-measured.
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

## 5. Phase 2

### Direction changes from the Phase 1 review

These come from the site owner and supersede the original brief where the
two disagree:

- **Brighter palette** (table above).
- **Meteors and twinkles** over the background, in both themes (ink-coloured
  and fainter on paper). CSS keyframes on transform/opacity only; two meteors
  and no twinkles on phones; none with reduced motion.
- **Glowing main buttons** (`btn-glow` + `GlowBeam`): a light travelling
  round the border and a breathing halo. On the hero buttons, navbar
  Moonmind, launcher, Get In Touch, Check My GitHub, Send Message and Back
  to Home. Static under reduced motion.
- **Skills keep percentage bars**, now with counters: each bar fills and its
  number counts 0 → exact level when first seen, on hover (that card) and on
  every tab switch. The list scrolls in its own region with no scrollbar.

These loops are the one sanctioned exception to "nothing decorative loops".

**Ambient motion is deferred.** With the meteors and glows painting from the
first frame, LCP went from 2.34s to 2.9s. They now switch on 1.2s after the
`load` event (`enableAmbientMotion`) and fade in, which restored LCP and cut
TBT further.

### Sections

- `useReveal` + `[data-reveal]`: each element rises once when it enters the
  viewport (WAAPI, staggered), held by CSS only while motion is allowed;
  print shows everything.
- `SectionHeading`: `0N / Label` mono eyebrow on a hairline, then heading.
- About: numbered hairline list. Stats: readout panels, difficulty labels as
  text + coloured dot (coloured text failed contrast in light mode), bars via
  `scaleX`. Projects: first two featured, dark veil lifts on hover. Contact:
  48px fields, earthshine "Sending..." (`aria-busy`). 404: the moon with its
  satellite drifted off orbit.

### Measurements (Phase 2)

Lighthouse mobile, median of 5 runs:

| | Before | Phase 1 | Phase 2 | Budget |
| --- | --- | --- | --- | --- |
| Performance | 69 | 83 | **90** † | ≥ 90 (borderline) |
| Accessibility | 90 | 100 | **100** | ✓ |
| LCP | 2.72s | 2.34s | **2.35s** | < 2.5s ✓ |
| TBT | 1,356ms | 541ms | **328ms** † | < 200ms ✗ |
| CLS | 0.003 | 0 | **0** | ✓ |
| Initial JS (gzip) | 159.7 KB | 130.2 KB | **132.1 KB** | ≤ 170 KB ✓ |

† Machine variance: rebuilding the Phase 2 commit and measuring it again in
a later session gave Perf 81 / TBT ~630ms, identical to the Phase 3 build
measured alongside it. Comparisons are only meaningful between builds run
back-to-back; treat Perf 90 as borderline, not a pass. The ambient-motion
deferral was measured that way (79 → 88 in the same session).

Full-page scroll, Chrome trace at 4x CPU:

| | Before | Phase 1 | Phase 2 |
| --- | --- | --- | --- |
| Mobile: long tasks / blocking | 141 / 6.4s | 21 / 1.25s | **2 / 124ms** |
| Desktop: long tasks / blocking | 135 / 8.7s | 53 / 2.7s | **15 / 282ms** |

What remains in scroll is paint/layout as sections reveal and images decode,
plus small amounts from the navbar moon frame and ScrollToTop's listener.

## 6. Phase 3: Moonmind chat

- **Launcher → panel morph** (desktop, motion allowed): the panel grows out
  of the launcher's corner on the shared spring (WAAPI transform, compositor)
  while its contents fade in, and shrinks back into the launcher on close
  (~330ms). To animate the close, the panel stays rendered for that time with
  `inert` and `aria-hidden`; nothing inside it can be reached, and the
  launcher is back underneath. Phones keep the previous fade; reduced motion
  opens and closes instantly.
- **One visual language** for the panel and `/moonmind`: moon-mark badge,
  display-font title, mono subtitle, 44px header actions (`moonmindUi.js`),
  accent-tinted user bubbles, identity row with the moon mark, 16px composer
  with a 44px send button.
- **Steps**: the per-message toggle and collapsed default are unchanged, and
  so is the 300ms shimmer hold. While running and closed, a mono pipeline of
  the top-level stages sits under the header; each stage fades up and its
  connector draws in once, and the running stage glows earthshine. When the
  answer lands the pipeline folds away and the header shows the route as a
  badge (earthshine if the run failed). The collapsible list no longer
  animates its height (layout); its contents fade instead. The shimmer is
  now an opacity breath instead of a background-position sweep.
- **Sources** keep `<details>`; opening it staggers the chips in.
- **Typing indicator**: three dots breathing in turn (opacity).
- Every `.mm-*` reduced-motion rule is kept or replaced with an equivalent.
- The last legacy utilities (`text-gradient`, `bg-gradient-primary`) are gone.

Measured back-to-back with the Phase 2 build, Phase 3 changes nothing at
page load (the chat is still lazy): Perf 81 vs 81, TBT ~620 vs ~630ms.

## 7. Round 2

### Meteors on the star canvas (dark mode)

- The four CSS-animated meteor elements are replaced by a fixed pool drawn on
  the star canvas (`lib/meteors.js`): desktop up to 3 at once, a new one every
  0.8–2.3s (about 2× before), varied length, speed and angle, thin 1.2px trails
  with a long tail fade and a short head fade; phones at most 2 at once, every
  2.5–6s. Nothing is created in the DOM per meteor, and each frame restores
  only the rectangles the last frame drew over.
- **Off the main thread.** A canvas animated from the main thread forces a
  main-thread frame each time it draws, and every running CSS animation then
  pays style work on those frames. Measured idle on the hero at 4x CPU: 6.0s
  busy per 10s on desktop (2.8s on phones) with a main-thread loop, 1.2s
  (0.36s) with the canvas transferred to a worker (`lib/sky.worker.js`,
  3.7 KB) — below the Phase 2 baseline. Browsers without OffscreenCanvas run
  the same code on the main thread.
- Capped at 30fps, and the loop runs only while a meteor is alive. Stops when
  the hero is off-screen or the tab is hidden, starts only after ambient
  motion is on (post-load), never with reduced motion. Verified by pixel-diff
  sampling: meteors appear in the hero, nothing changes off-hero or with
  reduced motion.
- Light mode no longer has meteors (it gets the lunar surface instead).

### Light mode: a sunlit lunar surface

- **Source:** NASA's Scientific Visualization Studio, CGI Moon Kit
  (<https://svs.gsfc.nasa.gov/4720>), public domain; credit "NASA's Scientific
  Visualization Studio". `ldem_16_uint.tif` (elevation) and
  `lroc_color_poles_4k.tif` (albedo).
- **Pre-rendered, not live.** `scripts/render-lunar-surface.py` crops a
  mid-latitude region (38°W–62°E, 30°N–32.5°S, so the equirectangular stretch
  stays small), shades the relief with a low western sun (22°) for crisp
  crater shadows, modulates it by the real albedo and tints it cool grey.
- **Files:** `src/assets/lunar/` — 1600×1000 landscape (AVIF 67 KB, WebP
  116 KB) and a 900px portrait crop for phones (AVIF 50 KB, WebP 102 KB),
  art-directed with `<picture>`. Requested only once ambient motion switches
  on (after `load`), fading in over the paper colour; nothing is fetched
  before the load event.
- **Motion (desktop, motion allowed):** a 90s drift/zoom, a "sunlight"
  gradient swinging ±28° over 75s so the craters seem to change shade, and a
  4% scroll-timeline parallax. Transform only; 227ms of main thread per 8s at
  4x CPU. Phones and reduced motion: the still image.
- **Readability (superseded by the light glass in §9):** an even paper wash (50%) over the stone, and near-opaque
  (95%) feathered paper scrims behind each section's content column, the hero
  text column, the `/moonmind` header and the 404 copy. The light navbar is
  95% paper. Checked by rendering: every visible text run was compared with
  the closest-luminance background pixel under it, at 8 scroll positions,
  1440px and 375px, plus `/moonmind` and 404. All pass AA; lowest 4.65:1.
- Cards on the stone (`.surface`) were solid card-white with a crisp low
  shadow (now glass, see §9).
- Dark mode is unchanged.

### Interactive hero moon (`HeroMoonControl`)

- A `role="slider"` (0 new → 100 full, `aria-valuetext` "new moon", "waxing
  crescent", "first quarter", "waxing gibbous", "full moon"). Drag left/right
  moves the terminator and hatched shadow; release springs to the nearest of
  those five. Tap/click steps to the next and sends the satellite round the
  orbit once (fast, then settling; it passes behind the disc on the far
  side). Arrow keys step, Home/End jump. Desktop hover tilts it toward the
  pointer (±7°) and brightens craters and orbit. A mono hint ("drag to change
  the phase") fades after the first interaction, in memory only.
- Scroll sync: the navbar moon keeps the scroll-driven new → full. The hero
  moon follows the same progress from its resting gibbous (62%) to full, so
  the hero looks as before at the top of the page; while the visitor is
  interacting it is theirs, and their next scroll eases it back. Progress
  comes from the navbar's existing frame (`lib/scrollPhase.js`), not a second
  scroll listener.
- `touch-action: pan-y`: a vertical swipe that starts on the moon scrolls the
  page and changes nothing (the controller only takes over once a drag moves
  horizontally or a tap completes). Pointer moves write straight to the SVG
  via one animation frame; React never re-renders during a drag. Springs and
  the lap use anime.js per-module imports. Reduced motion: instant changes,
  no spring, tilt or lap. Nothing reacts while the hero is off-screen.
- Verified: drag/snap, tap/lap, keys, focus ring, scroll hand-back, hover
  tilt, buttons uncovered, vertical swipe on phones, reduced motion.

### Hero on phones

- Both hero buttons now sit directly under the roles line below `lg`, so at
  375×812 they end at 443px, well above the bottom bar (755px); also checked
  at 320×640, 390×844 and 768×1024. The description follows them.
- The moon is sized to the viewport (`clamp(6.75rem, 46vw - 2.75rem, 11rem)`)
  and sits fully in frame, above the text column's paper, 64–98px clear of the
  name on phones.

## 8. Round 3

- **Glow colour.** Light mode's glows (button halos, travelling rims, card
  hover) are the buttery yellow of the moon seen from earth; in dark mode the
  halo stays lunar blue and only the rim's bright core turns butter.
- **Thinking glow.** While Moonmind is working (after the same 300ms hold),
  a warm butter glow sweeps across the steps header behind the label, and a
  small orb breathes and ripples beside it; the legacy typing dots are the
  same orb. Blurred layers on transform/opacity only; static with reduced
  motion.

- **Expanded steps as a trace.** The live pipeline's connect-the-dots,
  vertical: one rail with a dot per step (primary when done, earthshine when
  running or warned, hollow for tool steps) and nested steps branching off.
  Opening the panel draws it in a step at a time (rows rise, rail segments
  and branches draw; transform/opacity), including rows that arrive while it
  is open. Each row shows only the step name and duration: the backend's debug
  summaries (`route=… confidence=… slots=…`) are no longer displayed anywhere
  in the chat. The data and its storage are unchanged.

## 9. Round 4

### Hero moon as a lit sphere

- **Texture:** 1024×512 equirectangular, grayscale, from NASA's Scientific
  Visualization Studio CGI Moon Kit (<https://svs.gsfc.nasa.gov/4720>,
  public domain): `lroc_color_poles_4k.tif` albedo with a gentle
  overhead-lit relief from `ldem_16_uint.tif` baked in
  (`scripts/render-moon-sphere-texture.py`). `src/assets/moon/` — AVIF
  46.9 KB, WebP 66.7 KB. Loaded after the first paint; until it arrives the
  sphere is lit but plain, and before the first frame the disc is a flat CSS
  circle, so there is never a hole.
- **Rendering** (`lib/moonSphere.js`, no WebGL): each disc pixel is mapped
  once to latitude/longitude plus their first-order change under tilt; a
  frame looks up the texture (cached per view), lights it with Lambert from
  a sun set by the phase, softens the terminator (smoothstep over n·l),
  darkens the limb and adds ~5% cool earthshine on the night side. Accent rim
  glow and a halo (dark) / cool cast shadow (light, stronger) in CSS.
- **Layers:** back half of the orbit and the satellite's far-side twin behind
  the canvas; front half, ticks and satellite in front, so the lap really
  passes behind the moon.
- **Motion:** hover and drag turn the sphere a few degrees (texture
  longitude/latitude, eased); desktop idles through a full turn in 200s,
  redrawing only when the texture has moved a texel (~5 frames/s), paused
  off-screen and in hidden tabs. Phones and reduced motion: one frame per
  phase change, no idle turn, no hover.
- **Cost:** canvas capped at 256 px (the disc shows at ≤340 CSS px). Measured
  on desktop: ~2.4 ms median (3.6 ms p90) for a turning frame, ~1.3 ms for a
  phase-only frame; ~2.3 ms on a phone at 4× CPU. Zero frames off-screen.
- The hint now sits centred directly under the disc (below the lower tick),
  wrapping to two lines in the narrow phone column; it still fades after the
  first interaction. The 404 page keeps the line-drawn moon.

### Blue buttons: their own glow

- The solid blue buttons (Download Résumé, Get In Touch, Check My GitHub,
  Send Message, Back to Home) use `btn-glow-blue` + `BlueSheen`, separate
  from the dark button's `btn-glow` + `GlowBeam` (Moonmind AI, navbar,
  launcher), which are unchanged.
- A cool halo (`--glow-blue`: dark `204 100% 66%`, light `212 95% 52%`,
  tuned apart from `--glow`) breathes on a 2.8s cycle, reaching ~18px past the
  edge: a radial gradient on `::before`, masked to the ring outside the
  button so it never tints the face; only opacity and transform animate.
  Hover/focus brightens it (×1.45) and sweeps one sheen across; press
  tightens it. Waits for ambient motion like the other glows. Reduced motion:
  a steady halo at 0.7, no breathing or sweep, hover still brightens.
- "Sending..." sets the halo to earthshine with the earthshine fill. Button
  text contrast is unchanged (5.1:1 light, 10.9:1 dark).

### Stats count-up

- Every LeetCode and GitHub number counts: solved, rank, the ring percentage
  (in tenths), Easy/Medium/Hard (the solved half of "x / y"; the total shows
  at once), repos, commits, PRs and stars.
- One shared rAF loop (`lib/countDriver.js`) runs all of them and stops when
  idle; values come from `countUp.js`'s `frameValue`, so finals and formats
  are exact (the rank steps in 500s while running and lands exact). Text is
  written with `textContent` only, in tabular digits, with the final width
  reserved so nothing shifts. `useCountDriver` binds a number to it.
- Load: plays once the card is in view and its data is in, 70ms apart within a
  card (ring and solved, rank, Easy, Medium, Hard; GitHub rows in order),
  1200ms ease-out (rank and ring 900ms).
- Replay: hovering a number (mouse) or tapping it (touch, on pointerdown)
  counts only that number again from 0 in 700ms; ignored while it runs. No
  extra tab stops. The ring and the bars are driven by their numbers, so they
  replay with them.
- Cached then fresh data: counts on from the shown value (800ms), never from
  0. A 0 or missing value is shown as is. Reduced motion: finals at once, no
  replay.
- Screen readers: the counting text is `aria-hidden`; the final value is in an
  sr-only span (bars: "x of y solved"; the ring keeps its `aria-label`).
- Tested with mocked stats responses in the browser; the fetch and cache code
  is untouched.

### Light mode: less white, more glass

- **Layers:** the stone under a thin paper wash (`--lunar-wash` 0.25, was
  0.5); each section's content column, the hero text column, the `/moonmind`
  header and the 404 copy in a feathered haze (`--haze`, was 95% paper);
  cards (`.surface`) as glass on top: a vertical `--card` gradient from 55%
  to 38%, a 1px edge lighter than the glass plus a top highlight (white at
  60-70%, no hard white borders), and a cool, soft shadow (`--glass-shade`).
- **Blur, desktop only** (fine pointer and 1024px+): `backdrop-filter:
  blur(10px)` on the large panels marked `.glass-blur` (the three Stats
  cards and the contact form) and 12px behind the navbar, so at most four
  blur at once. Skills and project cards, phones and tablets: no blur; the
  denser haze (0.8 vs 0.75) is the faked frost.
- **Bars:** the navbar is glass from the top of the page (phones 94%→86%
  paper; desktop 88%→80% with the blur); the mobile bottom bar (`.nav-bar`)
  95%→88% with a top highlight. Dense enough that text scrolling under them
  stays out of the way, and nav labels keep AA even over dark project images.
- **Text:** light `--muted-foreground` deepened to `218 20% 32%`, and a new
  `--ink` (`212 92% 32%`) for small blue text, since the paper under text
  is thinner. Button blue (`--primary`) is unchanged. In dark mode `--ink`
  equals `--primary`.
- **Checked:** every visible text run against the closest-luminance pixel
  under it, 8 scroll positions at 1440px and 375px, plus `/moonmind` and
  404: all pass AA, lowest 5.0:1 (hero copy over the stone 5.03:1). Dark mode
  screenshots are pixel-identical before and after (375/1440, six sections,
  reduced motion).
- **Blur cost:** wheel-scroll of the whole page at 4x CPU, 1440px, light,
  3 runs each: blur on 83-110 long tasks, p50 frame 57-90ms; blur off
  109-117, p50 89-90ms. No measurable cost, so the blur stays. The absolute
  numbers are high because this machine is much slower today than in Phase 2:
  the Phase 2 commit, rebuilt and traced back-to-back, gave 93 long tasks /
  3.5s blocking against this build's 102 / 3.6s (15 / 282ms when first
  recorded). Compare builds only when they are run side by side.

## 10. Suggestions (skipped because they would change behaviour)

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
- The GitHub "repos per language" card is an external image with a black
  `midnight_purple` theme, which sits heavily on the light theme. Choosing its
  `theme` per site theme would change the request URL, so it is left alone.
- `ScrollToTop` sets state from a raw scroll listener; it could share the
  navbar's single animation frame.
