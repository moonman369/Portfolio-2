import { Download } from "lucide-react";
import { BiBrain } from "react-icons/bi";
import {
  HERO_SECTION_DESCRIPTION,
  HERO_SECTION_FNAME,
  HERO_SECTION_GREETING,
  HERO_SECTION_LNAME,
  RESUME_URL,
} from "../context/constants";
import { useMoonmind } from "../context/MoonmindContext";
import SocialLinks from "./SocialLinks";

const HeroSection = () => {
  const { open: openMoonmind } = useMoonmind();

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-4"
    >
      <div className="container max-w-4xl mx-auto text-center z-10">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="opacity-0 animate-fade-in">
              {HERO_SECTION_GREETING}
            </span>
            <span className="text-gradient opacity-0 animate-fade-in-delay-1">
              {" "}
              {HERO_SECTION_FNAME}
            </span>
            <span className="text-gradient ml-2 opacity-0 animate-fade-in-delay-2">
              {" "}
              {HERO_SECTION_LNAME}
            </span>
          </h1>

          <p className="text-md md:text-md text-muted-foreground max-w-2xl mx-auto opacity-0 animate-fade-in-delay-4">
            {HERO_SECTION_DESCRIPTION}
          </p>

          <div className="opacity-0 animate-fade-in-delay-4 pt-4 flex flex-wrap gap-4 justify-center">
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cosmic-button inline-flex items-center gap-2"
            >
              <Download size={16} /> Download Résumé
            </a>

            <button
              onClick={openMoonmind}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-primary/60 bg-primary/10 backdrop-blur text-primary font-medium hover:bg-primary/20 transition-colors animate-moonmind-glow"
            >
              <BiBrain className="text-lg" /> Moonmind AI
            </button>
          </div>

          <SocialLinks className="justify-center opacity-0 animate-fade-in-delay-4 pt-2" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
