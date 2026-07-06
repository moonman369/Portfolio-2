import { Briefcase, Code, Cpu } from "lucide-react";
import {
  ABOUT_SECTION_HEADING,
  ABOUT_SECTION_PARAGRAPHS,
  ABOUT_SECTION_CARDS,
  RESUME_URL,
} from "../context/constants";

const ICONS = {
  code: Code,
  cpu: Cpu,
  briefcase: Briefcase,
};

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          About <span className="text-gradient">Me</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* left col*/}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">{ABOUT_SECTION_HEADING}</h3>

            {ABOUT_SECTION_PARAGRAPHS.map((paragraph, key) => (
              <p key={key} className="text-muted-foreground">
                {paragraph}
              </p>
            ))}

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
              <a href="#contact" className="cosmic-button">
                Get In Touch
              </a>

              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-all duration-300 hover:btn-glow"
              >
                Download Résumé
              </a>
            </div>
          </div>

          {/* right col*/}
          <div className="grid grid-cols-1 gap-6">
            {ABOUT_SECTION_CARDS.map((card, key) => {
              const Icon = ICONS[card.icon] ?? Code;
              return (
                <div key={key} className="gradient-border p-6 card-hover">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-lg">{card.title}</h4>
                      <p className="text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
