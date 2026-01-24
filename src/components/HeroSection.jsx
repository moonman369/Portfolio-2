import { ArrowDown } from "lucide-react";
import React from "react";
import {
  HERO_SECTION_DESCRIPTION,
  HERO_SECTION_FNAME,
  HERO_SECTION_GREETING,
  HERO_SECTION_LNAME,
} from "../context/constants";

const HeroSection = () => {
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
            <span className="text-primary opacity-0 animate-fade-in-delay-1">
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

          <div className="opacity-0 animate-fade-in-delay-4 pt-4">
            <a href="#projects" className="cosmic-button">
              View My Work
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-0.5 flex flex-col items-center animate-bounce cursor-pointer">
        <span className="text-sm text-muted-foreground mb-2">Scroll</span>
        <ArrowDown className="h-5 w-5 text-primary" />
      </div>
    </section>
  );
};

export default HeroSection;
