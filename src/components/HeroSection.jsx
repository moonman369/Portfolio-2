import { ArrowDown } from "lucide-react";
import React from "react";

const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-4"
    >
      <div className="container max-w-4xl mx-auto text-center z-10">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="opacity-0 animate-fade-in">Hi, I'm</span>
            <span className="text-primary opacity-0 animate-fade-in-delay-1">
              {" "}
              Ayan
            </span>
            <span className="text-gradient ml-2 opacity-0 animate-fade-in-delay-2">
              {" "}
              Maiti
            </span>
          </h1>

          <p className="text-md md:text-md text-muted-foreground max-w-2xl mx-auto opacity-0 animate-fade-in-delay-4">
            I am Ayan Maiti. I am currently working as a System Engineer in Tata
            Consultancy Services Limited. I have worked as a Blockchain/Web3
            Developer Intern at W3Dev Private Limited for four(4) months. I have
            an in-depth understanding of blockchain development, its related
            concepts, and fullstack web development
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
