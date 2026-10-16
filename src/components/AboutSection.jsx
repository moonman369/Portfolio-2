import { useEffect } from "react";
import { Briefcase, Code, Cpu } from "lucide-react";
import {
  ABOUT_HIGHLIGHTS,
  ABOUT_SECTION_HEADING,
  ABOUT_SECTION_PARAGRAPHS,
  ABOUT_SECTION_CARDS,
  RESUME_URL,
} from "../context/constants";
import { useReveal } from "../hooks/useReveal";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { whenAmbient } from "../lib/motion";
import BlueSheen from "./BlueSheen";
import GlowBeam from "./GlowBeam";
import SectionHeading from "./SectionHeading";

const ICONS = {
  code: Code,
  cpu: Cpu,
  briefcase: Briefcase,
};

// A paragraph with its key phrases (ABOUT_HIGHLIGHTS, first occurrence each)
// wrapped for a soft accent marker band behind them. The text is unchanged;
// the band is a decorative child, shown in its final state until the About
// animation (if it loads) sweeps it in. A phrase that is not there is simply
// not found.
const withHighlights = (text) => {
  const parts = [text];
  ABOUT_HIGHLIGHTS.forEach((phrase) => {
    const at = parts.findIndex((part) => typeof part === "string" && part.includes(phrase));
    if (at < 0) return;
    const [before, ...rest] = parts[at].split(phrase);
    parts.splice(
      at,
      1,
      before,
      <span key={phrase} className="about-hl">
        {phrase}
        <span aria-hidden="true" className="about-hl-mark" />
      </span>,
      rest.join(phrase),
    );
  });
  return parts;
};

// The About animation (lib/aboutMotion.js) lives in its own chunk, fetched
// once the section is within about a screen of the viewport, and never with
// reduced motion. Watching starts only once the page has loaded and settled
// (ambient motion), so the chunk never competes with the first load; About
// sits right under the hero. Until it runs, and if it never does,
// everything is in its final state.
const useAboutMotion = (ref, reducedMotion) => {
  useEffect(() => {
    const section = ref.current;
    if (!section || reducedMotion || typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    let stop = null;
    let cancelled = false;
    let near = null;
    const cancelAmbient = whenAmbient(() => {
    near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        import("../lib/aboutMotion")
          .then(({ startAboutMotion }) => {
            if (!cancelled) stop = startAboutMotion(section);
          })
          .catch(() => {
            /* offline or a stale deploy: About simply stays still */
          });
      },
      { rootMargin: "100% 0px" },
    );
    near.observe(section);
    });
    return () => {
      cancelled = true;
      cancelAmbient();
      near?.disconnect();
      stop?.();
    };
  }, [ref, reducedMotion]);
};

const AboutSection = () => {
  const { ref, pending } = useReveal();
  const reducedMotion = usePrefersReducedMotion();
  useAboutMotion(ref, reducedMotion);

  return (
    <section
      id="about"
      ref={ref}
      data-reveal-pending={pending || undefined}
      className="section-pad relative text-left"
    >
      <div className="container max-w-6xl">
        <SectionHeading index="01" label="About" reveal={false}>
          About Me
        </SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* left col*/}
          <div className="lg:col-span-7 space-y-6">
            <h3
              className="font-heading text-h3 font-semibold text-foreground"
            >
              {ABOUT_SECTION_HEADING}
            </h3>

            {ABOUT_SECTION_PARAGRAPHS.map((paragraph, key) => (
              <p
                key={key}
                data-reveal
                className="text-base md:text-lg leading-relaxed text-muted-foreground"
              >
                {withHighlights(paragraph)}
              </p>
            ))}

            <div data-reveal className="flex flex-wrap gap-3 pt-4">
              <a href="#contact" className="btn-primary btn-glow-blue">
                <BlueSheen />
                Get In Touch
              </a>

              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-glow"
              >
                <GlowBeam />
                Download Résumé
              </a>
            </div>
          </div>

          {/* right col: what I focus on, as a numbered hairline list */}
          <ol className="lg:col-span-5 border-t border-border">
            {ABOUT_SECTION_CARDS.map((card, key) => {
              const Icon = ICONS[card.icon] ?? Code;
              return (
                <li
                  key={key}
                  data-reveal
                  className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 border-b border-border py-7"
                >
                  <span className="font-mono text-xs text-muted-foreground pt-1.5">
                    {String(key + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="flex items-center gap-2.5 font-heading text-lg font-semibold text-foreground">
                      <Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                      <span className="about-row-title">{card.title}</span>
                    </h4>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
