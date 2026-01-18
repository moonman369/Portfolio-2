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

          <p className="text-lg md:text-lg text-muted-foreground max-w-2xl mx-auto opacity-0 animate-fade-in-delay-4">
            I am Ayan Maiti. I am currently working as a System Engineer in Tata
            Consultancy Services Limited. I have worked as a Blockchain/Web3
            Developer Intern at W3Dev Private Limited for four(4) months. I have
            an in-depth understanding of blockchain development, its related
            concepts, and fullstack web development
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
