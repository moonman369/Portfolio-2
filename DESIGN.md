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
| Name on phones (< 640px, `text-name`) | `clamp(2.5rem, 11.5vw, 4rem)` | 1.02 | -0.04em |
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
  instead, one block per word. (Until round 5 each line rose out of an
  `overflow: clip` mask on WAAPI; the name is now final from the first
  paint, see §11.)
  Splitting per *character* was also rejected on quality grounds: per-character
  inline-blocks break kerning pairs like "Ay" at display size.
- **The entrance starts the frame after the first paint.** (Since round 5
  this is the moon only; see §11.) CSS holds the
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
- **Motion:** desktop idles through a full turn in 200s at a steady 30fps,
  blending neighbouring texels along the spin so the surface glides instead
  of stepping a texel at a time; paused off-screen and in hidden tabs.
  Dragging turns it a few degrees with the pointer (eased back on release).
  Phones and reduced motion: one frame per phase change, no idle turn.
- **Revised after review:** hover no longer turns the sphere (only the orbit
  brightens), and the drag was inverted so the shadow follows the pointer:
  dragging right pushes the terminator right over the lit side (towards new),
  dragging left pulls it back (towards full). Keys keep slider semantics
  (Right/Up = next phase, towards full). The idle turn used to redraw only
  per whole texel (~5 frames/s), which read as stepping.
- **Cost:** canvas capped at 256 px (the disc shows at ≤340 CSS px). Measured
  on desktop: ~2.4 ms median (3.6 ms p90) for a turning frame, ~1.3 ms for a
  phase-only frame; ~2.3 ms on a phone at 4× CPU. Zero frames off-screen.
  The smooth idle turn draws 30 frames/s at ~2.3 ms each (about 7% of one
  desktop core while the hero is on screen), against ~5 frames/s before.
- **Startup (fixed after the final Lighthouse pass):** the sphere had added
  ~390ms of TBT (Lighthouse bisect over the Round 4 commits: 711 → 1098ms
  median; the blue buttons, stats and glass commits were flat). Its geometry
  now fills typed arrays directly (324ms → 35ms at 4x CPU on a phone) and is
  built in its own task just after the first paint instead of inside React's
  first commit; the texture is requested at `load` and decoded in a
  short-lived worker (`moonTexture.worker.js`, main-thread fallback), which
  took an 82ms task off the main thread. The canvas is pixel-identical.
- **Lighthouse mobile after the fix**, alternating with the pre-Round-4 build
  in one session: when the machine benchmarked like earlier rounds (index
  ~1400-1600) both scored 91-94, TBT 223-273ms, CLS 0, A11y 100; LCP (the
  hero paragraph, gated by its entrance) 2.2-2.7s against 2.2-2.3s. When it
  benchmarked ~600-700, both fell to the 70s, with this build 100-400ms of
  TBT behind.
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

## 10. "Round 4" brief: moon ↔ moonman369, Moonmind, shorter hero, idle cost

(Section 9 above covers the previous brief; its heading predates this one.)

### Part 1. The moon and "moonman369"

- **Identity line:** the hero's eyebrow is now the handle, `moonman369`
  (`HERO_SECTION_HANDLE`), in mono, letter-spaced, `--ink`, lower case, with
  a 14px moon mark in front. It sits above the `<h1>`, which holds only the
  name. The greeting (`HERO_SECTION_GREETING`) is no longer shown and the
  handle left the role line ("Backend Dev / AI Engineer"); both constants
  are kept. Nothing is said about "369".
- **The mark (`MoonMark`)** is now a tiny lit sphere: the hero moon's own
  renderer (`lib/moonSphere.js`) on a canvas at the device pixel ratio (up to
  3×), with a brighter night side (earthshine 0.14 vs 0.05) and a 1px accent
  rim (`.moon-mark::after`) so a new moon keeps its outline. It draws once per
  phase change and has no loop. The navbar mark (28px) follows scroll as
  before (new at the top, full at Contact): `useScrollMoonPhase` now publishes
  progress even without a path to write (same signature), and the mark
  subscribes. The same component is used in the Moonmind launcher, the chat
  headers, the hero button, the assistant label and the footer. All spheres
  share one texture (`lib/moonTextureSource.js`), requested once at `load`.
- **Favicons** (`scripts/render-favicons.py`, from the same texture and
  lighting, a waxing gibbous with the accent rim, exposure lifted so the lit
  side carries the shape at 16px): `favicon.svg` (a hand-drawn vector match),
  `favicon-32.png` (2.9 KB), `apple-touch-icon.png` (180px on dark paper,
  16 KB), `icon-192.png` (13 KB) and `icon-512.png` (61 KB, 256-colour).
  Checked on white, light-grey and two dark tab colours. The old
  `personal-information.png` is no longer linked (the file is kept in
  `public/`). Title and meta tags are unchanged.
- **Today's phase** (`lib/lunarPhase.js`): days since the new moon of
  2000-01-06 18:14 UTC, modulo 29.530588853; illuminated fraction
  (1 − cos 2πc) / 2; eight names (`MOON_PHASE_NAMES`), each covering an
  eighth of the cycle centred on it. Checked against the new moon of
  2024-04-08 and the full moons of 2024-04-23 and 2025-09-07.
- **The hero moon now spans one whole lunar cycle** (slider 0 new, 25 first
  quarter, 50 full, 75 last quarter, 100 new). A waning moon is lit from the
  left, so today's real moon is drawn correctly (the sphere takes a cycle
  position; the sun swings from right to left through full). Along the cycle
  the terminator always moves right to left, so the drag keeps "the shadow
  follows the pointer". Release, tap and arrow keys step through the eight
  named phases; Home/End go to either end (both new moon);
  `aria-valuetext` is the phase name.
- It opens on today's phase and **no longer follows scroll** (the navbar
  mark still does). The caption under the moon reads
  `today · waning gibbous · 83% lit` (`MOON_CAPTION_TODAY`), or
  `viewing · full moon` (`MOON_CAPTION_VIEWING`) once the moon is more than
  ~3.5 hours of cycle away from today. Then a "back to today" button (44px
  tall, focus ring, next in tab order) eases it home and returns focus to the
  moon; with reduced motion the jump is instant. A second line, "drag the
  moon", fades after the first interaction and stays gone for the visit
  (a module-level flag, memory only). All strings are in `constants.js`.
- Verified (`moontest.mjs`, date pinned in the page, 22 checks): opens on
  today's phase and caption; drag both ways; snap to named phases; caption
  and button switch; tap and lap; back to today by keyboard, with the focus
  ring and focus returned; Home/Right/End/Left over the cycle; scroll leaves
  the hero moon alone; hover draws nothing; idle 30fps on-screen, none
  off-screen; a waning gibbous is lit on the left; a vertical swipe on a phone
  scrolls the page; reduced motion is instant. Behaviour suite: 35/35.

### Part 2. Making Moonmind discoverable

- **Starter chips** (`MOONMIND_STARTERS`): while the conversation holds only
  the greeting, four chips sit under it (`role="group"`, "Suggested
  questions"). A tap goes through the chat's own send path (`sendMessage`,
  sticky scroll on), exactly as if typed; nothing is sent before that. They
  are disabled while a reply loads, vanish with the first user message,
  wrap on small screens, are 44px tall, and settle in with the chat's
  `mm-stage-in` stagger (none with reduced motion). A double tap sends once.
  The input is untouched (auto-grow, Enter, Shift+Enter, 16px).
- **Labels** (`MOONMIND_ASK_LABEL`, `MOONMIND_ASK_ARIA_LABEL`): the navbar
  pill reads "Ask Moonmind" (lg+), and the bottom-nav centre button shows it
  under a 20px mark, wrapped onto two 9px lines in a 48px rounded square so
  the bar keeps 8px between targets at 375px (9px measured); below 360px it
  is the mark alone. Both are named "Ask Moonmind, AI assistant". The hero
  button reads "Ask Moonmind" with "my AI assistant" beneath
  (`HERO_MOONMIND_SUBLABEL`, hidden below 360px); its accessible name is its
  text. The launcher's `aria-label` and position are unchanged.
- **The nudge** (`MoonmindNudge`, `hooks/useMoonmindNudge.js`,
  `lib/moonmindNudge.js`):
  - *Where:* whichever entry point is rendered, checked in the DOM at show
    time (not by breakpoint): the floating launcher if displayed, else the
    bottom-nav button. 12px above the launcher, or 12px above the whole
    bottom bar (never over it); within max(16px, safe area) of the screen
    edges, at most 20rem wide; the tail is measured to the button's centre
    and is the scale origin.
  - *What:* `MOONMIND_NUDGE_TEXT`, the first two starters
    (`MOONMIND_NUDGE_STARTERS`), and a 44px close button
    (`MOONMIND_NUDGE_CLOSE_LABEL`). A chip opens the chat and sends through
    `sendMessage`.
  - *When:* ~7s after the page mounts, or when About or Projects is 30% up
    the viewport, whichever is first, but not before 1.5s (so a deep link
    doesn't meet it mid-load). Once per visit (`sessionStorage`
    `moonmind_nudge_seen`, in try/catch); never while the chat is open, after
    it has been opened in this visit, or when a conversation already exists.
    Home page only, so never on `/moonmind`.
  - *Away:* close button, Escape (listener only while shown), a tap outside,
    opening the chat, or ~9s (paused while the pointer or focus is inside).
  - *Motion:* scale 0.6 → 1 on the site spring plus a quick fade, from the
    tail; one ring pulses out from the button (scale 1 → 1.9, fading). Out: a
    150ms fade. Reduced motion: fade only, no ring. Transform and opacity
    only; solid `--card` with an accent ring, no blur.
  - *Accessibility:* an always-present, empty, out-of-flow `role="status"`
    (polite) right after each anchor button, so the text is announced when it
    appears and keyboard users meet it in order; never a dialog, never takes
    focus. Timers and listeners are cleared on unmount.
- Verified (`nudgetest.mjs`, Moonmind runs mocked, every POST counted, 30
  checks): nothing before ~7s, then on the launcher with the 12px gap and the
  tail on the button; live region, no focus taken, nothing sent; Escape,
  close, outside tap and ~9s each dismiss; once per visit across a reload;
  About in view shows it early; a chip opens the chat and sends once; never
  while or after the chat is open, or with a conversation; 375 and 320px in
  both themes (margins, gap, tail); reduced motion is a fade; the four
  starters (44px, nothing sent), a starter sends once as the visitor's
  message, a double tap sends once, and Enter / Shift+Enter still work.
  Behaviour suite 35/35 (its selectors now use the new accessible names).

### Part 3a. A shorter hero

- `HERO_SECTION_TAGLINE` ("AI Engineer building agentic systems on
  Azure.", 46 characters, facts already on the site) replaces the long
  introduction in the hero, straight after the role line and before the
  buttons; readable from the first paint (not part of the entrance).
  `HERO_SECTION_DESCRIPTION` stays in `constants.js`; About is untouched.
- Measured with the bottom bar in place: at 375×667 the buttons end at
  503px (bar at 608px), at 375×812 at 564px (bar at 753px); the moon
  (84-213px) and its caption (to 244px) are fully in frame. 768 and 1440
  are shorter too (desktop buttons end at 669px of 900).
- **Caption contrast fix:** the contrast scanner skips `pointer-events:
  none` text, so the caption under the moon (and the old drag hint before it)
  had never been measured. On wide screens it sits outside the text haze, and
  in light mode it measured ~1:1 against the darkest crater pixel. It now has
  its own small plate of page colour (90% light, 75% dark) feathered by a soft
  shadow. Worst-pixel contrast: light 6.43:1, dark 6.29:1 (before the plate,
  a star under one glyph gave 1.63:1 in dark; 8.73:1 against the
  background itself), at 375, 768 and 1440, for "today", "viewing", the hint
  and "back to today" (`captioncontrast.mjs`). The full-page scan still
  passes (lowest 5.04:1).

### Part 3b. Idle cost

**Sources of ongoing motion** (audited before the change):

| Source | Kind | Where it ran |
| --- | --- | --- |
| Hero moon idle turn | rAF loop (main thread), 30fps | desktop, hero on screen |
| Meteors | rAF loop in the sky worker | while the hero is on screen |
| `stars-drift` | CSS scroll-timeline animation | dark, desktop |
| `twinkle` × 6 | CSS, infinite | dark, desktop |
| `glow-breathe` + `glow-spin` | CSS, infinite (×3 dark glow buttons) | navbar pill, hero, launcher |
| `blue-breathe` | CSS, infinite (×4-5 blue buttons) | hero, About, Projects, Contact |
| `lunar-drift`, `lunar-sun` | CSS, infinite | light, desktop |
| `lunar-parallax` | CSS scroll-timeline | light, desktop |
| Chat thinking (`mm-*`) | CSS, infinite | only while a run is in progress (functional) |
| Nudge timers | setTimeout (7s, 9s) | once per visit |
| No `setInterval` anywhere; the count-up, scroll and springs loops run only while something changes. |

**Measured** (`ui-tools/idlemeasure.mjs`): 1440×900, 4× CPU, 10s trace of
the idle page with no input, main-thread busy time (union of tasks), split
by self time; `document.getAnimations().length` at the same moment.

| | Before | After (first 30s) | After (frozen, 30s+ idle) |
| --- | --- | --- | --- |
| Dark, top: animations / busy | 17 / **93.3%** (scripting 36%, rendering 13%, painting 3.6%) | 8 / 4.9% (0.3 / 1.2 / 0.4) | 8 (1 running) / 0.00% |
| Dark, About | 17 / 8.3% | 6 / 5.0% | 6 (1 running) / 0.00% |
| Dark, Projects | 17 / 7.2% | 5 / 3.1% | 5 (1 running) / 0.00% |
| Light, top | 13 / **91.6%** (34.8% / 12.8% / 4.2%) | 10 / 6.1% | 10 (1 running) / 0.02% |
| Light, About | 13 / 5.3% | 8 / 3.3% | 8 (1 running) / 0.00% |
| Light, Projects | 13 / 3.5% | 7 / 2.5% | 7 (1 running) / 0.00% |

No task over 50ms in any of these. Runs on this machine vary by about ±1.5
points (see Round 4's note on machine variance), so the active figures are
"about 5%" rather than precise.

**What changed:**

1. *The hero moon renders in a worker* (`lib/moon.worker.js` behind
   `lib/moonSphereHost.js`; the canvas is handed over with
   `transferControlToOffscreen`). Its 30fps idle turn was nearly all of the
   93%: ~12ms of script per frame at 4× CPU, and, worse, a main-thread frame
   30 times a second, in which every CSS animation, the IntersectionObservers
   and hit-testing were serviced too. From a worker the canvas reaches the
   compositor without a main-thread frame. Same renderer, pixel-identical,
   same API to the controller; browsers without OffscreenCanvas keep the
   main-thread path. The loop still runs only while something changes or
   the idle turn is on.
2. *The six twinkles moved onto the star canvas in the sky worker*
   (`lib/twinkles.js`, 20fps cap, small dirty squares restored from the star
   layer): they cost ~3% as CSS animations and were six entries in
   `getAnimations()`. They now ride the star canvas, so they drift with the
   star field on scroll (≤120px over the page) rather than sitting on a
   separate fixed layer; brightness, size, timing and positions are as before.
   Without a worker they stay CSS (`SkyMotion`).
3. *Off-screen pause* (`hooks/useOffscreenPause.js`, used by Home and 404):
   an IntersectionObserver (96px margin) sets `data-offscreen` on the glow
   buttons in the page flow, and CSS removes their looping animation while it
   is set. Removed rather than `animation-play-state: paused`, because a
   paused animation still counts in `getAnimations()`; it restarts inside the
   margin, before it is visible, so nothing jumps. The fixed navbar pill and
   launcher are always in view and keep theirs.
4. *Hidden tab*: `<html data-tab-hidden>` pauses every animation in place
   (they resume from the same point: measured +367ms of drift for 367ms
   visible, no jump); the moon worker stops its idle turn; the sky worker
   stops meteors and twinkles (they already respected visibility; the
   twinkles keep their phase across the pause).
5. *Idle freeze* (`lib/idleFreeze.js`): the always-on layers (fixed glows,
   lunar drift, twinkles, meteors, moon turn) were together above the 3%
   line, so after 30s without pointer, scroll, touch or key input
   `<html data-idle>` pauses the decorative CSS loops in place, the sky
   worker lets the meteors in flight finish but starts no more and holds the
   twinkles, and the moon stops turning; the next input carries on from the
   same frame. Functional motion (chat thinking, springs, count-ups) is never
   frozen.

**Targets:** dark meets "6 or fewer animations at a text-only section" (5 at
Projects, 6 at About). Light has 7 at Projects (8 at About, where a blue
button is in view): its three fixed lunar layers (drift, sunlight swing,
scroll parallax) plus the navbar pill's and the launcher's two loops each.
Getting to 6 would mean removing one of those visible effects (merging the
sunlight swing into the drift changes how the light moves), so they stay; in
the frozen state all of them are paused and only the scroll-linked
parallax counts as running. Idle main-thread cost: from 92-93% to about 5%
at the top while active (2.5-5% elsewhere), and 0% once frozen.

Verified (`ui-tools/idletest.mjs`, 10 checks): hero glows flagged and their
loops removed at Projects, fixed glows kept, ≤6 at Projects (dark), back on
return; hidden tab holds every animation and the moon, and resumes with no
jump; after 30s idle the glows hold and the moon stops; the next input
resumes everything. Moon tests 22/22 (stats now read from the worker; the
lit side read from a screenshot), behaviour 35/35, nudge 30/30, stats 14/14.

### Review tweaks (after the four parts)

These supersede the matching points in Parts 1 and 2 above.

- **The mark is the line icon again.** The tiny lit sphere read as overuse of
  the moon image, so `MoonMark` is back to the thin-line moon (stroke circle +
  lit path in `currentColor`) everywhere: beside "Ayan's Portfolio" (still
  waxing with scroll, through its path again), the "Ask Moonmind" pill and
  buttons, the launcher, the chat headers, the hero eyebrow and the footer.
  The hero moon and the favicons keep the textured moon.
- **Bottom-nav Moonmind button:** the mark alone in its 44px glow circle;
  the small "Ask Moonmind" label is gone (still named "Ask Moonmind, AI
  assistant"). The desktop pill and the hero button keep their labels.
- **The nudge is a slim pill that says "Ask me anything about Ayan"**
  (`MOONMIND_NUDGE_TEXT`), with a small glow-coloured spark and a close
  button; the starter chips moved out of it (they stay in the chat). Tapping
  it opens the chat; nothing is sent. Same anchors (the launcher on
  desktop, the bottom-nav button on phones), timing, once-per-visit rule and
  dismissals. Motion, with anime.js on WAAPI: the pill pops out of its tail
  on the site spring, its words rise into place one after another
  (`stagger`, 55ms apart), one ring pulses from the button, and it shrinks
  back into the tail when it goes. Reduced motion: a fade.
- **About's "Download Résumé"** has the dark button glow (`btn-glow` +
  `GlowBeam`), like the hero's Ask Moonmind; it stops off-screen and freezes
  when idle like the others.
- **Starter questions** (`MOONMIND_STARTERS`): "Who are you?", "Tell me
  something about Ayan", "Share all of Ayan's profile links and his résumé",
  "Show me Ayan's LeetCode and GitHub stats".
- Re-verified: behaviour 35/35, nudge 30/30 (the bubble's text, and a tap
  opens the chat with nothing sent), moon 22/22, idle 10/10, stats 14/14.

### Moonmind intro pop-up (replaces the nudge's timing and content)

- **When:** on every page load and reload, ~2s in (ambient motion, i.e.
  `load` + 1.2s, plus 600ms so the hero entrance has played). Once per page
  load: an in-site return from `/moonmind` does not show it again (a
  memory-only flag). Not while the chat is open; opening the chat closes it.
  The old once-per-visit `sessionStorage` key and the 7s / About-in-view
  trigger are gone.
- **Where:** unchanged: the floating launcher on laptops, else the
  bottom-nav Moonmind button, 12px above it (above the whole bar on phones),
  within 16px and the safe areas, tail at the button.
- **What:** a card in the chat-header style: the line moon in its accent
  circle, "Moonmind AI" (`MOONMIND_INTRO_TITLE`), "Ayan's portfolio
  assistant" in mono (`MOONMIND_INTRO_TAG`), and "Ask me anything about
  Ayan's projects, skills and experience." (`MOONMIND_INTRO_TEXT`). The card
  is a button that opens the chat (nothing is sent); a 44px close button sits
  in its corner.
- **How long:** `MOONMIND_INTRO_MS` (7s; measured 6.9-7.5s). A thin
  accent-to-glow line along its foot drains over that time, and its WAAPI
  animation is the timer: hovering or focusing the card pauses it, leaving
  resumes it. Closes early on outside click, Escape, the close button, or
  opening the chat.
- **Motion** (anime.js `waapi` + `createSpring` + `stagger`, compositor
  only): the card springs out of its tail (translate + scale from 0.5), the
  mark turns in on a bouncier spring, the mark, title, tag and text rise in
  70ms apart, one soft glow-coloured sheen crosses the card at ~0.5s, and one
  ring pulses out from the button. Going away it shrinks back into the tail
  (150ms). Reduced motion: a fade in and out, and a plain 7s timer.
- **Accessibility:** unchanged: an always-present polite `role="status"`
  right after the button; never a dialog; never takes focus.
- Verified (`nudgetest.mjs`, 26 checks): shown ~2.2s after load at the
  launcher with the 12px gap and the tail on the button; its text; live
  region, no focus taken, nothing sent; gone after 6-8s; a reload shows it
  again; Escape, outside click and the close button; hover holds it past 9s
  and it finishes once the pointer leaves; a tap opens the chat and sends
  nothing; never while the chat is open, nor again after an in-site return
  from `/moonmind`; 375 and 320px in both themes; reduced motion is a fade;
  and the starter chips as before. Behaviour 35/35, idle 10/10, moon 22/22.

## 11. Round 5: phone hero, hero buttons, shorter Projects list, contact autofill

Phones are anything under 640px. Tablet (640px+) and desktop were checked
pixel for pixel against the previous build (reduced motion, both themes,
640×900, 768×1024, 1024×768, 1280×800): identical, apart from the button
heights in Part B.

### Part A. Type size and the first screen

Before, measured at 375×812 (dark):

| | Before | After |
| --- | --- | --- |
| Name | 65px (`text-display`), two lines | 43px (`text-name`, `clamp(2.5rem, 11.5vw, 4rem)`), line height 1.02; 40px at 320, 41.4 at 360, 44.9 at 390, 47.6 at 414, 64px from ~557px up |
| Smallest hero text | 11px: moon caption (2 lines), "drag the moon", "my AI assistant" | 12px: moon caption (1 line), "drag the moon" |
| Role line | 13px | 14px |
| Eyebrow (handle) | 12px | 13px |
| Tagline | 16px / 1.375 | 16px / 1.5 |
| Top padding | `6.75rem` + centring; content 157-651px, moon 84px | `5.5rem` (top bar + 24px) and `5.25rem` at the bottom (bottom nav + 24px); content centred between them, the moon with it |
| LCP | the tagline; the name painted 0.7-1.0s after first paint (4x CPU) | the tagline, painted in the same frame as the name (see below) |

- **Phone type scale in the hero:** name (fluid), tagline 16px / 1.5, role
  line 14px, eyebrow 13px, captions 12px, button labels 16px.
- **Name:** one word per line beside the moon on every phone (on one line it
  would have to sit below the moon's caption, leaving the space beside the
  moon empty). `text-wrap: balance`; words never break. From 640px the
  display size applies as before (so there is a step from 64px to ~93px at
  640px; tablet is unchanged by design).
- **Moon caption:** `MOON_CAPTION_TODAY_SHORT` ("last quarter · 68%") and
  `MOON_CAPTION_VIEWING_SHORT` ("last quarter") under 400px; the full
  versions from 400px. Both are rendered and one is `display: none`, so
  there is no resize logic and only one is read. 12px, one line. On phones
  the caption box is at least the moon's width plus 0.75rem a side and
  pinned to that right edge, so it stays centred under the disc while it
  fits and grows to the left (never off screen) when longer (e.g. the full
  caption at 414px).
- **Moon on phones:** `--hero-moon-w: clamp(112px, 46vw - 44px, 176px)`
  (the old formula, floor raised from 108 to 112px; in px so a larger text
  size grows the text, not the moon). It hangs from the content block
  (`container` is `relative` on phones), rising by a quarter of its width so
  its disc is level with the handle and its caption, including the 44px
  "back to today" button, ends above the role line. Checked in both the
  "today" and "away" states at 320-639px: no overlap, closest gap 7.7px
  (375px, the button's box against "Engineer").
- **Vertical rhythm:** the top bar ends at 64px, the bottom nav starts at
  innerHeight - 57px. At 375×667 the content (moon tick to social icons) runs
  ~87-569px (23px below the top bar, 41px above the bottom nav); at 375×812
  ~159-641px (bottom nav 755px); 390×844 ~172-659px.
- **First screen:**

  | Size | Buttons end | Social icons end | Bottom nav |
  | --- | --- | --- | --- |
  | 320×568 | 504px | 572px (scroll) | 511px |
  | 360×640 | 485px | 553px | 583px |
  | 375×667 | 501px | 569px | 610px |
  | 375×812 | 573px | 641px | 755px |
  | 390×844 | 591px | 659px | 787px |
  | 414×896 | 620px | 688px | 839px |

  Measured with the "Ask Moonmind" second line hidden on phones (Part B
  lays the buttons out side by side; these are the stacked numbers).
- **Name at first paint / LCP.** The name, role line, tagline and buttons
  are no longer part of the entrance: final colour, size and position from
  the first paint. The handle and the social icons rise in on a CSS
  animation (`hero-rise`: 14px of transform over 600ms, opacity over 300ms,
  the icons 120ms later) that needs no JavaScript; the moon keeps its JS
  draw, held by `[data-entrance="pending"] .hero-moon`, which now has a CSS
  fail-safe (`hero-hold-release`, 1.5s) so a slow or failed script cannot
  leave it hidden. Element Timing at 375×812, 4x CPU, 3 runs: before, the
  name rendered 668-1020ms after FCP; after, at FCP (1840-2232ms, the same
  timestamp as FCP and LCP).
  **The LCP element on a phone is still the tagline,** not the name: Chrome
  picks the largest text box, and at the requested 40-46px the name's lines
  are ~4,000px² each against the tagline's ~22,000px². Making the name win
  would need a larger name or a smaller tagline, so this is reported rather
  than forced. On desktop (1280×800) the name is now the LCP element (it
  was hidden at first paint before).
- **Large text:** at 200% text size the name and moon used to collide
  (also before this round). Under 20em wide (never at the default text size,
  where the narrowest phone is 320px = 20em; at 200% text, every phone; also
  any page zoom that takes a phone under 320 CSS px), the text column starts
  below the moon block instead of beside it. Swept 100/125/150/175/200% text
  (Chrome's default-font-size setting) at 320-639px and 200% page zoom, in
  the "away" state: no text overlaps the moon or caption, nothing runs off
  the screen.
- **Moonmind intro card on phones:** its close button was already 44×44px.
  On a phone it sits above the bottom nav, over the end of the hero: it
  covered the social icons at 375×812 and 360×780 and the buttons at
  375×667. It now checks, before it is shown (it stays `visibility: hidden`,
  so it is not announced either), whether it would cover any child of a
  `data-nudge-avoid` element on screen (the hero's text column), and if so
  it is skipped for that load. When and how often it appears is otherwise
  unchanged. Result: skipped at 375×667, 360×780, 375×812; shown at 390×844,
  414×896, 768×1024, 1024×768 and 1280×800 (none of which it covers). If the
  visitor has already scrolled past the hero, it shows as before.

### Part B. The two hero buttons

Before (375×812): a `flex flex-wrap gap-3` row; "Download Résumé" 203px
and "Ask Moonmind / my AI assistant" 174px need 389px of a 335px row, so
they wrapped onto two left-aligned rows of different widths.

- **Phones, 22.5em (360px) to 639px:** `grid grid-cols-2`, 14px gap, the
  row spans the content width; each button is half of it (153px at 360,
  160.5 at 375, 168 at 390, 180 at 414, 292.5 at 639) and 48px tall.
  Labels: the download icon + "Résumé" (`HERO_CTA_RESUME_SHORT`) and the
  moon icon + "Ask Moonmind"; 16px, centred, 0.5rem side padding on both.
- **Below 22.5em:** one full-width column, 14px gap, both 48px, with the full
  "Download Résumé" label (280px wide at 320, 300px at 340).
  **Deviation:** the brief asked for the grid from 340px. "Ask Moonmind"
  (108px) with its 18px icon and 8px gap is 134px of content, and half of a
  340px screen's 300px row less the gap is 143px, leaving 4px a side, so the
  columns start at 22.5em instead, the smallest width where the label fits
  with 8px padding (needs ~355px). In em, so at large text sizes the
  buttons stack too.
- **640px and up:** unchanged: side by side at natural width (203 and
  174px), "my AI assistant" second line on the Moonmind button, both 48px
  (`items-stretch`; the two-line label is 34px, inside the 48px minimum).
- **Accessible names:** the résumé link has `aria-label="Download résumé"`
  (`HERO_CTA_RESUME_ARIA_LABEL`; contains "Résumé" and "Download Résumé").
  The hero Moonmind button had no `aria-label` (its name was its text, "Ask
  Moonmind my AI assistant"); with the second line hidden on phones it now
  carries the existing `MOONMIND_ASK_ARIA_LABEL` ("Ask Moonmind, AI
  assistant"), the same name as the navbar and bottom-nav buttons.
- **Glows:** unchanged styles. With the 14px gap the blue halo (18px) runs
  under the dark button, which paints over it, and the dark button's own
  blurred halo stays separate; nothing clips them (the row has no overflow
  set; the hero's `overflow-x: clip` is 20px away). Checked in both themes
  after ambient motion starts.
- **Order and focus:** DOM order unchanged (moon, résumé, Moonmind, social
  icons); both focus rings (2px, 3px offset) are complete in the grid, both
  themes.
- **First screen with the pair side by side:**

  | Size | Buttons end | Social icons end | Bottom nav |
  | --- | --- | --- | --- |
  | 320×568 (stacked) | 506px | 574px (scroll) | 511px |
  | 360×640 | 455px | 523px | 583px |
  | 375×667 | 471px | 539px | 610px |
  | 375×812 | 543px | 611px | 755px |
  | 390×844 | 561px | 629px | 787px |
  | 414×896 | 590px | 658px | 839px |

  The shorter hero lets the Moonmind intro card fit again at 360×780 and
  375×812 (it ends 23px above the card); it is still skipped at 360×640 and
  375×667, where it would cover the buttons or icons.

### Part C. Projects: a shorter list on phones

| At 375px | Before | Collapsed | Expanded |
| --- | --- | --- | --- |
| Projects section | 5,068px (12 cards, 335-387px each) | 2,618px (6 cards + button) | 4,655px |
| Whole page | 11,591px | 9,140px | 11,177px |
| Card image | 207px (16:10) | 168px | 168px |

- **What shows:** under 640px, the first `PROJECTS_MOBILE_INITIAL_COUNT`
  (6) projects in their current order; nothing is renamed, reordered or
  removed (numbers, links and the internal `/moonmind` link included). From
  640px all 12 show and there is no button; 640, 768 and 1280px are
  pixel-identical to the previous build (full page, both themes).
- **How:** CSS only. Cards past the count carry `data-extra`; under 40rem
  (Tailwind's `sm`, the breakpoint that also hides the button)
  `#projects-grid:not([data-expanded="true"]) > [data-extra]` is
  `display: none`. The DOM stays complete, and resizing across 640px in
  either state needs no code (checked: collapsed and expanded, 375 → 800 →
  375px). Their lazy images are not fetched while hidden: scrolling the
  whole collapsed page fetched the 6 shown images and none of the other 6;
  expanding and scrolling fetched all 6.
- **Image height on phones:** with full-height images the collapsed section
  was ~2,860px, over the ~2,700px target, so (the optional step) the image
  box is 168px tall on phones (`object-fit: cover`, same files and
  `sizes`); 16:10 from 640px.
- **The button:** under the grid, full width, 48px, 16px label, the ghost
  style (no glow) with a chevron that turns over when expanded. A real
  `<button type="button">` with `aria-expanded` and
  `aria-controls="projects-grid"`. Labels: `PROJECTS_SHOW_MORE_LABEL` with
  the count filled in ("Show 6 more projects") and
  `PROJECTS_SHOW_FEWER_LABEL` ("Show fewer projects"). Only rendered when
  there are more projects than the count; `sm:hidden` from 640px.
- **Expanding:** the cards appear above the button (it moved from 381px to
  2,419px on screen) and the page does not scroll (`scrollY` unchanged, no
  scroll events). Focus moves to the first new card's heading
  (`tabIndex={-1}`) with `preventScroll` for a tap or click; from the
  keyboard (click `detail` 0) focus is allowed to bring the heading on screen
  so the focus is visible. "6 more projects shown"
  (`PROJECTS_SHOWN_ANNOUNCEMENT`) goes into a visually hidden
  `role="status"`, cleared on collapse.
- **Collapsing:** focus stays on the button; if the section's top is then
  above the screen it is scrolled back to (smooth, instant under reduced
  motion, as set on `<html>`), heading 121px from the top, clear of the top
  bar.
- **Motion:** the new cards rise in through the section's existing scroll
  entrance (`useReveal`), which never saw them while hidden; once only.
  Reduced motion: they just appear.
- **State:** memory only; a reload starts collapsed.
- Stats, Skills, About and Contact heights are unchanged (1739, 853, 1502,
  1371px at 375).

### Part D. Contact form: autofill hints

| Field | Added |
| --- | --- |
| `#name` (text) | `autocomplete="name"`, `autocapitalize="words"` |
| `#email` (email) | `autocomplete="email"`, `inputmode="email"`, `autocapitalize="none"`, `spellcheck="false"` |
| `#message` (textarea) | `autocapitalize="sentences"` (no `autocomplete`) |
| honeypot checkbox | unchanged (`autocomplete="off"`, `tabindex="-1"`, hidden) |

- Labels: all three fields already had a visible `<label for>` matching
  their `id` ("Your Name", "Your Email", "Your Message"); nothing to fix.
  The honeypot has no label by design (hidden, `aria-hidden`).
- No change to ids, names, classes, placeholders, validation, the
  Web3Forms request, the toasts or the "not configured" notice; no visual
  change.
- Chrome's Issues panel (CDP `Audits`) reports no form or autofill issue on
  the page. (Its other entries are unrelated: a lazy-load note on the
  external GitHub stats card, and CORS errors because the stats API on
  :8000 was not running locally.) Whether Chrome offers saved details can't
  be shown headless (no profile data; the autofill service does not run), so
  that check is for a real browser.

## 12. Moonmind chat redesign: smooth, simple, clear

Presentation only: the backend contract (`moonmindApi.js`, `moonmindRun.js`,
endpoints, headers, payloads, polling, run/step/message shapes, storage keys
and formats) is untouched, and so are Enter / Shift+Enter, the auto-growing
input and its cap, sticky follow-scroll, the per-message steps toggle, the
sources list and the starter chips' send path. Tested against a scripted
mock of `POST /runs` and `GET /runs/:id` (Playwright request interception;
the app's API code is not edited for tests).

**Before**, as measured on the live site (desktop and 375px), plus the same
checks re-run against the previous build with the mock:

| | Before |
| --- | --- |
| Long answer (1,491 chars, 840px in a 516px list) | lands at the bottom; its start 340px above the view |
| Screen readers | no `role="log"`, no live region: an answer is never announced |
| Longest starter chip at 375px | two lines squeezed into a 44px pill |
| Header subtitle in the panel | cut off ("Ayan's portfolio assist…") |
| Per-message actions | none |
| Knowledge run | ~12.0s click to answer; steps 3.0 + 3.0 (2.8 retrieving) + 3.4s; "Thought for 9s"; ~3s unaccounted |
| Agent / capabilities / stats | ~10s / ~2s / ~4s |
| Answer arrival | all at once (111 → 914 chars between two samples 250ms apart); empty until then |
| While running | current step shown twice (header + last pipeline row); the mock check finds "Writing the answer" 3 times in the DOM (header, pipeline, the hidden list) |
| Header shimmer | blurred amber smear behind the words |
| Expanded steps | "Preparing the search 32ms", "Collecting results 34ms"; parent and child durations overlap |
| Route chip | internal names (knowledge, agent, stats, capabilities) |
| Step text | 11-12px mono |
| First 300ms of a run | nothing |
| Expand to full page | route swaps in ~11ms, no transition; the thread rewinds to the top and scrolls down for ~1s (0 → 993 → 1121); mock: 15 distinct `scrollTop` values in 1.5s desktop, 18 on a phone |
| Minimize after a direct visit | goes to `/` with the panel closed |
| "Refresh chat" (↻) | actually starts a new chat; "Clear" is the loudest button; focus drops to `<body>` after clearing |
| Input on first load of `/moonmind` | once 128px tall for one line (not reproducible) |
| Opening the panel on a phone | focuses the input (keyboard covers the starter chips) |
| Panel on phones | `role="dialog"`, no `aria-modal`; the page behind scrolls and is reachable |
| Chat chunk | 167.90 kB (51.64 kB gzip); page chunk 2.19 kB (0.97 kB) |

### Part 1. Messages and composer

- **Answer arrival** (`MoonmindChat`, layout effect): an assistant message
  from a run is seen first without text and then with it. At that moment:
  following along and the answer under 60% of the list's height, stay at
  the bottom (as before); following along and longer, scroll so the message
  starts 12px below the top of the list (250ms ease-out tween, instant with
  reduced motion) and stop following the bottom; scrolled up, nothing moves
  and a **"Jump to latest ↓"** pill (44px, centred above the composer) takes
  them to the start of the newest answer; it hides once they reach the
  bottom. Messages already complete when the list mounts never count, so
  switching views or reopening moves nothing. Measured (mock, 1,491-char
  answer): the answer's message starts 12px below the top in the desktop
  panel (822px answer in a 458px list) and on a phone (522px list); the pill
  lands it at 12px too.
- **No CSS smooth scrolling** on the list any more (it caused the
  rewind-and-glide on remount); programmatic moves are instant or the short
  tween in `lib/moonmindScroll.js`, which the reader's wheel or touch
  cancels. `overscroll-behavior: contain`, `scrollbar-gutter: stable`.
- **Assistant text:** open layout, 65ch, line height 1.6, `text-wrap:
  pretty`; 0.75em between paragraphs and lists, 1.1em above headings
  (balanced). The "Moonmind" identity line stays once per group.
- **User bubble:** one tint (`primary/12`), one radius (`rounded-2xl`), no
  ring, right-aligned, 85% max.
- **Copy:** under each finished answer (not the greeting, not errors), a
  44px icon button "Copy answer" that copies the rendered text (no markdown
  marks); its icon turns to a check and "Copied" shows for 1.5s, announced
  through the chat's hidden status. Mouse/trackpad: fades in on hover or
  focus of its message. Touch: always there, muted.
- **Starter chips:** `min-height: 44px`, 10px block padding, `text-wrap:
  balance`, a 1.5rem radius so two-line chips read as one pill (59px tall
  at 375px for the longest).
- **Header subtitle:** `MOONMIND_SUBTITLE` where it fits, else
  `MOONMIND_SUBTITLE_SHORT` ("AI assistant"), chosen by a container query on
  the title block, so it is never cut. The panel (both sizes) shows the
  short one; the full page the full one.
- **Accessibility:** the list is `role="log"`, `aria-live="polite"`,
  `aria-relevant="additions"`, labelled "Conversation". The steps panel and
  the actions row inside it are `aria-live="off"`, so step updates are not
  read; a separate visually hidden `role="status"` says "Working…" when a run
  starts and "Answer ready" when it ends (and "Copied").
- **Composer:** `enterkeyhint="send"`; 16px; Send stays 44×44 and at 40%
  opacity when empty.

### Part 2. Waiting for the response

- **Poll interval (reported, not changed):** `POLL_INTERVAL_MS = 900` in
  `moonmindApi.js`, polls strictly sequential (the next request waits for
  the previous one, then 900ms), backoff 1/2/4/8s on transient errors, a
  130s deadline from the click. So an answer can land up to ~0.9s plus one
  round trip after the backend finished; see Suggestions for the ~3s gap.
- **Reserved space:** after the 300ms hold (so a quick run never flashes it),
  three soft lines (90/75/55%) under the trace where the answer will go,
  breathing once every 2s (opacity on the group: one animation). The answer
  replaces them in place: measured 12.0px below the steps panel for both.
  The steps panel keeps its bottom margin while running for that reason.
- **Answer entrance:** in the same layout effect that detects the arrival
  (before the first paint of the text), each block of the answer
  (paragraph, list, heading) fades in and rises 8px, 240ms, 40ms apart,
  delays capped at 160ms: every block done by 400ms (measured: 12 blocks,
  last ends at 400ms). No typewriter. Reduced motion: none.
- **Reassurance:** one line between the trace and the skeleton, only when
  waiting is long: "Still working. Searching takes a few seconds." from 6s,
  replaced by "This is taking longer than usual." from 20s
  (`MOONMIND_WAIT_SLOW`, `MOONMIND_WAIT_LONG`); counted from when the run
  was first seen (kept per message in module scope, so a view switch keeps
  the real start). Gone when the answer arrives. Measured: none at 5s, the
  first at 6.6s, the second at 21s, never both.
- **Errors** (detection unchanged; tested with mocked responses): a failed
  answer shows only its sentence and a "Try again" button
  (`MOONMIND_TRY_AGAIN`, 44px) on the last message, which resends the
  previous question through the existing send path. No trace, sources or
  copy on a failure (a timed-out run used to say "Thought for 1s" above the
  timeout sentence). Not offered when the chat is not configured at all.
  Checked: a 500 on `POST /runs` ("Sorry, something went wrong…"), offline
  (requests aborted as disconnected; same sentence; Try again works once
  back online), and the 130s deadline with a fake clock ("That one is taking
  longer than expected…"). "Answer ready" is not announced after a failure;
  the log reads the sentence.
- The old `TypingDots` (the glowing orb for a running message with no live
  steps) is gone; the waiting area covers it.

### Part 3. The steps panel (live event feed)

Presentation only: step data, order and live behaviour are unchanged
(`buildStepRows` is untouched; two presentation helpers were added to
`moonmindSteps.js`, `visibleRows` and `formatStepSeconds`, with tests:
17/17 pass).

- **One line of truth while running:** the header is the status line, a
  7px amber dot pulsing on transform/opacity and the current step's name,
  once. The pipeline under it keeps finished top-level stages in grey with
  their names; the current stage is a static amber dot without its name
  (it is in the status line). The expanded list is rendered only while
  open, so a closed panel never hides a second copy. Measured with the mock
  at three points of a knowledge run: the status name appears exactly once
  in the chat's DOM each time.
- **No text smear:** the blurred amber sweep (`.mm-thinking`) and the
  blurred orb (`.mm-orb`, also the old typing indicator) are gone, with
  their keyframes and the `--mm-think` colour. No progress line either: the
  chat already has its two continuous animations while running (this dot
  and the skeleton's breath). The 300ms hold stays: the whole panel appears
  only once a run has lasted 300ms.
- **Expanded list:** top-level steps with their durations, right-aligned,
  `tabular-nums`, in seconds with one decimal ("2.8s"). Sub-steps and tool
  steps only under a "Details" disclosure (`MOONMIND_DETAILS_LABEL`, 44px,
  `aria-expanded`), without durations, so parent and child times never sit
  side by side. Any finished row under 300ms is dropped (it folds into its
  parent): "Preparing the search" and "Collecting results" no longer show.
  No duration is ever below 0.1s. Text is 12px (was 11px); top-level names
  in the foreground colour, sub-steps in the muted one.
- **Route chip in plain words** (`MOONMIND_ROUTE_LABELS`): knowledge "From
  the portfolio", agent and its retired alias tech_web "Researched", stats
  "Live stats", capabilities "About Moonmind", greeting "Greeting", refusal
  "Out of scope". `action` (labelled "Preparing a response" as a step, with
  no clear visitor-facing meaning) is not mapped and shows its raw name,
  like any route not in the map. The raw route is always the chip's
  `title`. The full list comes from `NODE_LABELS` in `moonmindSteps.js` and
  the captured traces; the API code itself does not enumerate routes.
- **Collapsed header after the run:** chevron, "Thought for 9s", the chip on
  the right; 44px tall (was 36px); `aria-expanded` / `aria-controls` kept.

### Part 4. One loader: the moon

- **`MoonLoader`** (`components/MoonLoader.jsx`, 18px): the site's moon mark
  (the navbar/header outline ring) with its lit disc masked by a shadow disc
  that slides sideways on `transform: translateX` (300ms ease-out) as the
  phase grows. SVG only: no path morphing, no `filter`, no `box-shadow`.
- **Phase:** the API does not send how many steps a run will take, so the
  "unknown total" rule applies: one phase per finished top-level stage
  through 0.2 → 0.45 → 0.7 → 0.85, holding on the last until the answer
  lands. Measured on a knowledge run: shadow offset 3.6 → 3.6 → 12.6 →
  15.3px at 0.45s, 3.5s, 6.5s and 10.5s.
- **Where:** it *is* the status line's indicator, in amber (earthshine),
  left of the current step's name. It replaces the Part 3 dot rather than
  sitting beside it (one idea per element); its gentle opacity pulse is the
  "dot pulse". It is also the panel's placeholder while the chat chunk
  loads (it replaced the three static dots).
- **First 300ms:** nothing. Then the steps panel fades in once with
  "Thinking…" and the moon at its first phase if no step has arrived, else
  the current step.
- **Removed:** the orb and sweep (Part 3), the three dots, and the dead
  `.mm-chat .animate-spin/-bounce/-fade-in` reduced-motion rules (nothing in
  the chat uses them). Every remaining `.mm-*` animation has its
  reduced-motion rule.
- **Cost:** while a run is going the chat runs exactly two continuous
  animations (the loader's pulse and the skeleton's breath, both opacity);
  none when idle or after the answer; none under reduced motion (static half
  moon, no pulse, no slide). A hidden tab pauses them: `/moonmind` now sets
  `data-tab-hidden` too (`useOffscreenPause`), as the home page did. The
  panel unmounts when closed, so a closed chat runs nothing.

### Part 5. Panel ↔ full page

- **Scroll position** (`lib/moonmindView.js` `listMemory`, memory only):
  the list's distance from its bottom is saved on every scroll and when a
  view's chat unmounts, and restored in the new view's first layout effect,
  before its first paint: within 80px of the bottom means "at the bottom" and
  lands exactly there; otherwise the same distance from the bottom. No
  animated scroll at all (the CSS smooth scrolling that caused the rewind is
  gone, Part 1). Measured by sampling `scrollTop` every 30ms for 1.5s after
  each switch: expand and minimize, desktop and 375px phone, **0 changes, one
  value** each time (before: 15-18 distinct values sweeping from 0); reading
  300px up in the panel → 300px up on the page.
- **Transition:** `switchView` wraps the navigation in
  `document.startViewTransition` where supported and motion is allowed. The
  chat container is `view-transition-name: mm-chat` in both views (the panel
  and the page's chat box), so the panel grows into the page and the page
  shrinks back into the panel; the rest cross-fades; 280ms ease-out.
  React Router commits navigation asynchronously, so the update callback
  resolves when the new view's chat signals `viewReady()` (mounted, scroll
  restored), with an 800ms fallback. Reduced motion or no API: an instant
  switch, same end state. Router calls and `state: { from, internal: true }`
  are unchanged.
- **The panel itself doesn't animate when it comes back:** if it mounts
  already open (returning from the page), there is no launcher morph and no
  fade; the transition is the only motion. Opens from the page still morph.
- **Minimize reopens the panel:** it sets the panel open in the Moonmind
  context (which outlives the route) and then navigates as before:
  `navigate(-1)` after an internal expand, else to `from` or `/`. A
  `reopenChat` flag in history state was not used: `navigate(-1)` cannot
  carry state, and the context already does the job. A direct visit to
  `/moonmind` then Minimize now lands on `/` with the panel open and the
  conversation in it (was: closed). Browser back and forward are unchanged:
  back from the page shows the home page with the panel as it was, forward
  renders the page; a direct visit's back still leaves.
- **Keyboard:** on the full page, Escape minimizes, except while the
  new-chat confirmation is open (Escape cancels that, as before) or during
  an IME composition (`isComposing` / keyCode 229). The input keeps focus
  after switching on desktop (autofocus on mount; phones in Part 7).
- Checked with and without reduced motion: 1 view transition per switch
  with motion, 0 without; same results otherwise.

### Part 6. New chat, undo, reload

- **"New chat"** (`MOONMIND_NEW_CHAT_LABEL`, `aria-label` and `title`) with
  a compose icon (`SquarePen`) in both headers, one shared component
  (`MoonmindNewChat`). With only the greeting it is dimmed (40%) and
  `aria-disabled` (still focusable, does nothing, no confirmation); while
  the confirmation is open it is `disabled`, as before.
- **Confirmation:** the same inline bar and copy ("Start a new chat? This
  clears the current conversation."), Escape cancels, focus starts on
  Cancel. Buttons: "Cancel" (on the page colour with a visible ring, medium
  weight) and "Start new chat" (`MOONMIND_START_NEW_CHAT`, a plain primary
  button at normal weight; it was "Clear", the loudest thing in the bar).
- **After clearing:** focus goes to the input on desktop; on touch
  (`pointer: coarse`) to the greeting (`tabindex="-1"`), so the keyboard
  stays down. "New chat started" is announced politely.
- **Undo:** "Chat cleared. Undo" above the composer for 6s. Undo restores
  the previous messages and session id exactly (checked: the stored JSON
  and the session id are byte-identical afterwards), from values kept in
  memory only (`undoRef` in the context). They are dropped after 6s, or as
  soon as a new message is sent; nothing is written back after that
  (storage checked at 6.4s and 7.4s: both keys absent). A reply still in
  flight when the chat was cleared is not restored (its run was cancelled;
  restoring its placeholder would leave it waiting forever). The next run
  after a new chat sends no `sessionId`, as before.
- **Reload mid-run (verified, not changed):** with a ~15s mocked run,
  reloading at 5s does **not** resume it: no further polls are sent, and
  the restored conversation ends with the question and no answer (the
  in-flight placeholder is never stored, and there is no resume path).
  The live-site observation was a fast run that had finished before the
  reload. Reported under Suggestions; "Reconnecting…" is not shown
  because nothing reconnects.
- **Input height:** empty, the input has no measured height at all (its
  natural one line); text is measured on change and again once
  `document.fonts.ready` resolves. With the fonts delayed 1.5s on a first
  load of `/moonmind` it is 38px before and after; it grows to the 128px cap
  and returns to 38px when emptied.

### Part 7. Phones and accessibility

- **No autofocus on touch** (`pointer: coarse`): opening the panel or
  loading `/moonmind` never focuses the input (the keyboard would cover the
  starters); the panel focuses the dialog itself (`tabindex="-1"`, no
  visible ring) so screen readers land inside it. Desktop keeps focusing
  the input. Measured at 375px: active element = the dialog (was the
  textarea); on the full page, not the textarea.
- **Modal under 640px** (`Moonmind.jsx`, `lib/inertOutside.js`):
  `aria-modal="true"`; everything outside the panel is `inert` (walking up
  from the panel and marking siblings; restored exactly on close); Tab and
  Shift+Tab wrap inside the panel; the page is locked with
  `overflow: hidden` plus `scrollbar-gutter: stable` (no jump; measured: a
  wheel over the page leaves `scrollY` at 600). A dim backdrop
  (`bg-background/70`, kept out of the inert set) sits behind the panel and
  closes it on tap, which is also what tapping the (now covered) bottom-nav
  button used to do.
- **At every size:** Escape closes the panel (not while the new-chat
  confirmation is open, which takes Escape itself, nor during IME
  composition), and focus returns to the element that opened it if it is
  still on screen (the navbar pill, the bottom-nav button, the hero
  button), else the launcher, else the bottom-nav button. The brief asked
  for the launcher at 640px+; returning to the actual opener is the usual
  dialog pattern and covers the navbar pill, and the launcher is the
  fallback. From 640px the panel stays non-modal (no `aria-modal`, nothing
  inert, page scrolls).
- **Keyboard on phones:** the panel already follows the visual viewport
  (`useVisualViewportVars`); the full page now does too (fixed to
  `--vv-top` / `--vv-height`). The list keeps a reader at the bottom when it
  gets shorter (`ResizeObserver`). Simulated by shrinking the viewport to
  480px: panel composer bottom 381px, page composer 441px, both inside the
  480px; the list stays at the latest message.
- **Both themes** (axe-core `color-contrast` + ARIA rules on the panel and
  the page, with an answer, sources and the expanded trace, dark and
  light, 320, 375 and 1280px): 0 violations. Panel and page are solid page
  colour (no blur over scrolling content).
- **Sizes:** smallest chat text 12px, input 16px, no horizontal scroll at
  320 and 375px; every tap target in the chat is at least 44×44 (raised: the
  steps header 36 → 44, Sources 32 → 44, the input 38 → 44; inline links
  inside answers are text and exempt).
- **Safe areas:** the full page's right padding used the left inset; it now
  uses `safe-area-inset-right`. The panel already used the insets on every
  side; the page header and composer keep the top and bottom ones.

### Verification fixes (after the seven parts)

Recording one full question and answer at 4x CPU showed the chat
re-rendering, and re-parsing the markdown of every answer, on every poll
(~1s), every keystroke and every status change (this was already so before
the redesign; the new statuses made it more frequent). Three changes,
behaviour unchanged:

- **Markdown parsed once per answer** (`Markdown`, `memo` on the content):
  polls no longer produce long tasks at all (before: 50-200ms each at 4x).
- **The composer owns its text** (`Composer`): a keystroke re-renders the
  input, not the conversation. Enter / Shift+Enter, the auto-grow and its
  cap, and the fonts-ready measuring move with it unchanged.
- **The answer's entrance is CSS** (`.mm-enter`: the same fade + 8px rise,
  40ms apart, done within 400ms), and the arrival is measured and scrolled
  in the next frame instead of inside React's commit. Measuring in the
  commit had forced the new answer's layout into the same task (one
  ~0.65-0.72s task at 4x instead of two ~0.3s ones). The follow-scroll
  waits for that decision, so the list still never moves twice; the
  entrance is marked done after 400ms so a re-render cannot cut it short,
  and is remembered per answer (module scope) so a remount never replays
  it.

All part checks were re-run after this (panel and page, both themes, phone
and desktop): same results.

### After: measured against the mock (desktop 1280×800 and phone 375×812)

| Check | Before | After |
| --- | --- | --- |
| Long answer, its message's top vs the top of the list | ~340px above the view | 12px below the top (panel, phone, page); the pill lands it at 12px |
| `scrollTop` sampled every 30ms for 1.5s after expand / minimize | 15-18 distinct values sweeping from 0 | 1 value, 0 changes (both ways, desktop and phone); 300px up stays 300px up |
| Current step name in the DOM while running | up to 3 times | once (checked at three points of a run) |
| Trace rows under 300ms / durations under 0.1s | "12ms", "32ms" rows | none |
| Smallest chat text / input | 11px / 16px | 12px / 16px |
| Tap targets under 44px in the chat | steps header 36px, Sources 32px, input 38px | none (320, 375, 1280px; panel and page; both themes) |
| Horizontal scroll at 320 / 375px | none | none |
| Input focused when the panel opens on touch | yes | no (the dialog is focused) |
| Continuous animations while running / idle | sweep, orb (3 layers), pipeline dot | 2 (loader pulse, skeleton breath) / 0; none with reduced motion; paused in a hidden tab |
| axe-core contrast + ARIA (panel and page, both themes) | not measured | 0 violations |
| Chat chunk (lazy) | 167.90 kB, 51.64 kB gzip | 175.47 kB, 54.26 kB gzip (+2.62 kB) |
| `/moonmind` page chunk | 2.19 kB, 0.97 kB gzip | 2.60 kB, 1.18 kB gzip |
| Initial JS | 423.00 kB, 143.73 kB gzip | 427.65 kB, 145.55 kB gzip (+1.82 kB: the panel's dialog logic, the loader, the new constants); budget 170 kB |
| CSS | 73.85 kB, 14.93 kB gzip | 75.22 kB, 15.15 kB gzip |

- **Behaviour checks** (all with the mock): send by typing + Enter,
  Shift+Enter (newline, nothing sent), the Send button and a starter chip;
  500, offline and timeout with Try again; New chat (empty: no confirm;
  confirm bar, Escape, Start new chat, focus, Undo, expiry, new message);
  expand → minimize → panel with the conversation, direct visit → minimize,
  back and forward; Copy; Jump to latest; reduced motion (no CSS or JS
  animation in the chat, no view transition, instant jumps; everything
  still works). Reload mid-run: does not resume (see Suggestions).
- **Long tasks, one full question and answer at 4x CPU** (5 alternating
  runs; this machine's load drifts a lot, so only medians): before, the
  longest task 190ms (phone) / 137ms (desktop); after 237 / 326ms; total
  blocking 420 / 302ms before, 370 / 513ms after. Both builds are far from
  "no task over 50ms". What remains after the fixes above: sending (~110-130ms
  at 4x, was 150-210) and the answer itself: rendering a 1,500-character
  markdown answer (~70-300ms) and its first layout and paint (~140-380ms,
  mostly text layout; `text-wrap: pretty` and layout containment were
  measured and make no difference). See Suggestions.
- **Lighthouse mobile** (home page; the chat is lazy), 3 runs alternating
  with the previous build: Performance 62 / 73 / 66 before, 62 / 75 / 64
  after; Accessibility 100 both; CLS 0 both. The machine benchmarked
  237-689 during these runs (earlier rounds scored 90+ at ~1,400-1,600), so
  the ≥ 90 budget could not be confirmed here for either build.

## 13. Phones: one step smaller

Under 640px the whole site is ~6% smaller, set in one place (the "Phones:
one step smaller" block at the end of `index.css`); tablet and desktop are
pixel-identical (full page, both themes, 640, 768, 1024, 1280px).

- **Root size:** `html { font-size: 93.75% }`, i.e. 15px at the browser's
  default 16px. A percentage rather than `15px`, so a visitor's own browser
  text size still applies. Everything in rem (text, padding, gaps,
  components, the chat) follows. Media queries do not (they use the initial
  size), so every breakpoint is where it was.
- **Floors:** `--text-xs` ≥ 12px, `--text-sm` ≥ 14px (so paragraphs set in
  `text-sm` keep their 14px), the eyebrow ≥ 12px (and the intro card's 11px
  mono tag is 12px on phones), inputs and textareas ≥ 16px (no iOS zoom),
  `min-h-11` / `min-w-11` / `size-11` / `icon-btn` ≥ 44px. Answers in the
  chat are 14.06px.
- **Set by hand** (they are in px or vw and would not follow): the hero name
  `clamp(2.5rem, 10.6vw, 4rem)` (43.1 → 39.75px at 375, 40 → 37.5px at 320,
  −6 to −8%); section headings `clamp(2.25rem, 1.35rem + 3.4vw, 4.25rem)`
  (36 → 33.75px at 320-375, −6%; −8% at 414-639); the moon
  `clamp(104px, 42vw − 40px, 162px)` (128.5 → 117.5px at 375, 112 → 104px
  at 320, −7 to −9%).
- **The navbars do not change:** the top bar's height, padding, brand text
  and gap and the toggle icon, and the bottom nav's padding, width and icon
  size are pinned with `--u` (one rem as it is everywhere else, 16px at the
  default). Measured: identical geometry, icons included, at 320 and 375px.
  The chat panel's phone position uses `--u` too, so it keeps its gaps to
  both bars (top 72px, 19px above the bottom nav, as before).
- **Header (the space above the hero content), ~25% shorter:** the hero
  starts just under the top bar and puts its content 37% of the way down
  the spare height (63% below) instead of in the middle, never closer than
  24px to the bar. Navbar → top of the moon: 102 → 75px at 375×812 (−26%),
  29 → 22px at 375×667 (−24%), 11 → 10px at 320×568 (already the minimum).
- **Footer, ~22% shorter:** top padding 1.25rem, and ~13px between its last
  line (the back-to-top button) and the bottom nav plus the safe area. The
  part above the bottom nav: 140 → 108px at 375 (−23%), 156 → 124px at 320
  (−21%); the whole block 197 → 165px.
- Checked at 320, 360, 375, 390 and 414px, dark and light: no text under
  12px, inputs 16px, no tap target under 44px, no horizontal scroll, the
  moon's caption and "back to today" clear of the text at 100% and 200% text
  size (closest gap 4.4px at 360px).
- **Not fixed (copy):** with the longer hero tagline (commit `9b93ee8`, six
  lines at 320px), the second hero button ends below the bottom nav at
  320×568: 554px against the bar at 511px before this change, 524px after.
  A shorter tagline (or a shorter variant on narrow phones) would fix it.

## 14. Moonmind intro card on phones: the overlap rule is gone

The Round 5 rule that skipped the intro card when it would cover the hero's
text, buttons or icons (§11, Part A) made it disappear on most real phones:
it needs ~120px between the end of the hero and the bottom nav, which the
deployed build had at 390×844 and 412×915 but not at 375×812 (120px) or
412×780 (112px), and no phone has with the browser's toolbars showing. At
the owner's request the rule is dropped: the card shows on every load on
every size, as it did before Round 5, and on a short screen it may briefly
cover the end of the hero until it goes (7s, close, Escape, a tap outside,
or opening the chat). `data-nudge-avoid` and the hide-until-checked step are
removed with it.

## 15. Moonmind on phones: no box, a compact header, a chat that stays

- **No box on phones (`/moonmind`, under 640px):** the chat runs edge to
  edge under the header: no side margins, border, rounded corners or
  shadow; a hairline under the header; the safe areas move onto the chat
  itself (left, right, and the composer's bottom). From 640px it is the
  card it was (desktop unchanged).
- **Compact header on phones:** badge 44 → 30px with an 18px mark, title
  22.5 → 15px, tighter padding; the header goes from 74-102px (it wrapped
  the subtitle at 320) to 55px, buttons still 44px. The floating panel's
  badge matches (32px, 18px mark). The badge is written `size-8
  sm:size-11` so the phones' 44px tap-target floor (§13) does not catch it.
- **Starter chips on one line:** with the full width, all four fit on one
  line on the page from 360px up (the long one wrapped at 320-375px
  before). At 320px the two longest still wrap: ~300px of 14px text in
  ~254px; one line there would mean going under 14px.
- **The chat survives the tab:** the conversation and the session id are in
  `localStorage` instead of `sessionStorage` (same keys, same formats), so
  closing the tab or opening the site in a new one picks it up again, with
  the same backend session. A chat still in `sessionStorage` is moved over
  the first time it is read. "New chat" clears both stores; Undo works as
  before. Note: the conversation now stays on the device until "New chat",
  and two tabs share it (the last write wins). A reload mid-run still does
  not resume the run (§12).

## 16. Suggestions (skipped because they would change behaviour)

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
- **Moonmind answers arrive ~3s after the trace ends** (live knowledge run:
  ~12.0s waited, "Thought for 9s"). The client polls every 900ms after each
  response, so up to ~1s of that is polling; the rest is between the last
  step and the answer being available. A shorter interval, long-polling or
  streaming the answer would shorten it. That is a backend/API decision, so
  the interval is unchanged.
- **Moonmind runs do not survive a reload.** The running placeholder (with
  its `runId`) is filtered out before the conversation is saved, so a reload
  mid-run leaves the question unanswered and stops polling, although the run
  finishes on the server. Storing the in-flight `runId` and polling it again
  on load (then showing "Reconnecting…" while it does) would fix it; that
  changes what is stored and the run lifecycle, so it was left out.
- **A long Moonmind answer still costs one long render and one long layout**
  (~0.1-0.4s each at 4x CPU, about the same as before). Parsing markdown
  in a worker (the answer arrives whole, so it can be parsed off the main
  thread before it is shown) or rendering it a few blocks per frame would
  bring both under 50ms; either is a structural change to how answers are
  rendered, so it was left out.
