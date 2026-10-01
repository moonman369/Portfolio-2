import { Briefcase, Code, Cpu } from "lucide-react";
import {
  ABOUT_SECTION_HEADING,
  ABOUT_SECTION_PARAGRAPHS,
  ABOUT_SECTION_CARDS,
  RESUME_URL,
} from "../context/constants";
import { useReveal } from "../hooks/useReveal";
import BlueSheen from "./BlueSheen";
import GlowBeam from "./GlowBeam";
import SectionHeading from "./SectionHeading";

const ICONS = {
  code: Code,
  cpu: Cpu,
  briefcase: Briefcase,
};

const AboutSection = () => {
  const { ref, pending } = useReveal();

  return (
    <section
      id="about"
      ref={ref}
      data-reveal-pending={pending || undefined}
      className="section-pad relative text-left"
    >
      <div className="container max-w-6xl">
        <SectionHeading index="01" label="About">
          About Me
        </SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* left col*/}
          <div className="lg:col-span-7 space-y-6">
            <h3
              data-reveal
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
                {paragraph}
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
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      {card.title}
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
