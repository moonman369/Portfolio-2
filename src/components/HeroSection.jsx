import { Download } from "lucide-react";
import { animate } from "animejs/animation";
import { createDrawable } from "animejs/svg";
import { stagger } from "animejs/utils";
import { waapi } from "animejs/waapi";
import {
  HERO_SECTION_FNAME,
  HERO_SECTION_HANDLE,
  HERO_SECTION_LNAME,
  HERO_SECTION_ROLES,
  HERO_SECTION_TAGLINE,
  HERO_MOONMIND_SUBLABEL,
  MOONMIND_ASK_LABEL,
  RESUME_URL,
} from "../context/constants";
import { useMoonmind } from "../context/MoonmindContext";
import { useAnimeScope } from "../hooks/useAnimeScope";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { moonmindIntentProps } from "../lib/lazyChat";
import { DURATION, EASE, STAGGER, rise } from "../lib/motion";
import BlueSheen from "./BlueSheen";
import GlowBeam from "./GlowBeam";
import HeroMoonControl from "./HeroMoonControl";
import MoonMark from "./MoonMark";
import SocialLinks from "./SocialLinks";

const FULL_NAME = `${HERO_SECTION_FNAME} ${HERO_SECTION_LNAME}`;

// The typewriter used to cycle through these; they now sit under the name as
// one quiet line, minus the name itself and the handle (which has its own
// line above the name).
const ROLES = HERO_SECTION_ROLES.filter(
  (role, index, all) =>
    role !== FULL_NAME &&
    role !== HERO_SECTION_HANDLE &&
    all.indexOf(role) === index,
);

// Load choreography: the moon draws itself while the name rises line by line
// out of its masks, then everything else settles in. Runs once, in the frame
// after the first paint; until then CSS holds the animated parts hidden
// (`data-entrance="pending"`). With reduced motion there is no pending state
// and no animation: the hero renders complete.
const playEntrance = (root) => {
  const q = (selector) => root.querySelectorAll(selector);

  // Strokes need the JS engine (dash offsets); createDrawable(…, 0, 0) hides
  // them synchronously. Everything else is WAAPI, which holds its own start
  // state through its delay (fill: both) — so nothing here reads style.
  animate(createDrawable(q("[data-draw]"), 0, 0), {
    draw: ["0 0", "0 1"],
    duration: DURATION.slow * 1.5,
    ease: EASE.inOut,
    delay: stagger(STAGGER * 0.75),
  });

  // The lit sphere settles in as its orbit draws.
  waapi.animate(q("[data-moon-disc]"), {
    opacity: [0, 1],
    transform: ["scale(0.94)", "scale(1)"],
    duration: DURATION.slow * 1.5,
    ease: EASE.out,
  });

  waapi.animate(q("[data-shade], [data-satellite]"), {
    opacity: [0, 1],
    duration: DURATION.slow,
    delay: DURATION.slow * 1.5,
    ease: EASE.out,
  });

  // The name rises line by line out of its masks.
  waapi.animate(q("[data-hero-word]"), {
    transform: ["translateY(130%)", "translateY(0%)"],
    duration: DURATION.slow * 1.5,
    delay: stagger(STAGGER * 1.5, { start: DURATION.fast }),
    ease: EASE.expo,
  });

  // Blocks go through the shared entrance, overlapping the name.
  rise(q("[data-hero-rise]"), { delay: DURATION.base / 2 });

  // Every start state is now held by an animation, so the CSS hold can go.
  root.removeAttribute("data-entrance");

  return () => root.setAttribute("data-entrance", "pending");
};

const HeroSection = () => {
  const { open: openMoonmind } = useMoonmind();

  const reducedMotion = usePrefersReducedMotion();
  const root = useAnimeScope(
    (scope, { reducedMotion: reduced }) => {
      if (reduced || !scope.root) return undefined;
      return playEntrance(scope.root);
    },
    { afterPaint: true },
  );

  return (
    <section
      id="hero"
      ref={root}
      data-entrance={reducedMotion ? undefined : "pending"}
      className="relative min-h-svh flex items-center overflow-x-clip pt-[calc(6.75rem+env(safe-area-inset-top))] lg:pt-[calc(5.5rem+env(safe-area-inset-top))] pb-28 md:pb-20"
    >
      <div className="container w-full grid grid-cols-1 lg:grid-cols-12 lg:items-center gap-y-10 lg:gap-x-8">
        {/* The moon: top-right beside the name on phones and tablets (fully
            in frame, above the text column's paper), its own column on wide
            screens. Only the moon itself takes pointer input. */}
        <div className="pointer-events-none absolute z-20 right-[max(1.25rem,env(safe-area-inset-right))] top-[calc(5.25rem+env(safe-area-inset-top))] w-[clamp(6.75rem,46vw_-_2.75rem,11rem)] sm:right-8 sm:w-[17rem] md:w-[21rem] lg:static lg:z-auto lg:order-2 lg:col-span-5 lg:w-full lg:max-w-[34rem] lg:justify-self-end">
          <HeroMoonControl />
        </div>

        <div className="paper-scrim relative z-10 flex flex-col lg:block lg:order-1 lg:col-span-7 text-left">
          {/* The handle is the identity line: the moon glyph ties it to the
              hero moon and the site mark. */}
          <p
            data-hero-rise
            className="eyebrow normal-case inline-flex items-center gap-2 text-ink mb-5 md:mb-7"
          >
            <MoonMark size={14} />
            {HERO_SECTION_HANDLE}
          </p>
          <h1 className="font-heading">
            <span
              data-hero-name
              className="block text-display font-semibold text-foreground"
            >
              {/* One mask per line; the padding gives descenders room
                  below the mask without moving anything. The split lives in
                  the markup rather than splitText: the name is already two
                  words, and splitting at runtime cost ~200ms at load on a
                  slow phone (see DESIGN.md). */}
              {[HERO_SECTION_FNAME, HERO_SECTION_LNAME].map((word, index) => (
                <span key={word}>
                  {index > 0 && " "}
                  <span className="block overflow-clip pb-[0.2em] -mb-[0.2em]">
                    <span data-hero-word className="block">
                      {word}
                    </span>
                  </span>
                </span>
              ))}
            </span>
          </h1>

          <p
            data-hero-rise
            className="mt-6 md:mt-8 font-mono text-[0.8125rem] md:text-sm text-ink flex flex-wrap gap-x-2 md:gap-x-3 gap-y-1"
          >
            {ROLES.map((role, index) => (
              <span key={role} className="inline-flex items-center gap-2 md:gap-3">
                {role}
                {index < ROLES.length - 1 && (
                  <span aria-hidden="true" className="text-muted-foreground">
                    /
                  </span>
                )}
              </span>
            ))}
          </p>

          {/* One line in place of the long introduction (which now lives
              only in About). Readable from the first paint, so it is not
              part of the entrance. */}
          <p className="mt-4 md:mt-5 max-w-[40ch] text-base md:text-xl leading-snug text-muted-foreground text-pretty">
            {HERO_SECTION_TAGLINE}
          </p>

          {/* Straight after the tagline, so both buttons are on screen on
              first load on phones. */}
          <div data-hero-rise className="mt-7 lg:mt-9 flex flex-wrap gap-3">
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-glow-blue"
            >
              <BlueSheen />
              <Download size={18} aria-hidden="true" /> Download Résumé
            </a>

            <button
              onClick={openMoonmind}
              {...moonmindIntentProps}
              className="btn-ghost btn-glow"
            >
              <GlowBeam />
              <MoonMark size={18} />
              <span className="flex flex-col items-start text-left leading-tight">
                <span>{MOONMIND_ASK_LABEL}</span>
                <span className="max-[359px]:hidden text-[0.6875rem] font-normal text-muted-foreground">
                  {HERO_MOONMIND_SUBLABEL}
                </span>
              </span>
            </button>
          </div>

          <div data-hero-rise className="max-lg:order-3 mt-8">
            <SocialLinks />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
