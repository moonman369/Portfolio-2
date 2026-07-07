import { useState } from "react";
import { cn } from "../lib/utils";
import {
  SKILLS_SECTION_PROP,
  SKILL_CATEGORY_LABELS,
} from "../context/constants";

const categories = Object.keys(SKILL_CATEGORY_LABELS);

const SkillsSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredSkills = SKILLS_SECTION_PROP.filter(
    (skill) => activeCategory === "all" || skill.category === activeCategory,
  );

  return (
    <section id="skills" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          My <span className="text-gradient">Skills</span>
        </h2>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-5 py-2 rounded-full transition-all duration-300 capitalize hover:btn-glow",
                activeCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/60 backdrop-blur-sm text-foreground/80 hover:bg-primary/10",
              )}
            >
              {SKILL_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        {/* On mobile this scrolls inside a capped height so the section
            doesn't take over the page; on md+ it lays out normally. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-1 md:max-h-none md:overflow-visible md:pr-0">
          {filteredSkills.map((skill, key) => (
            <div key={key} className="glass p-6 rounded-lg card-hover">
              <div className="text-left mb-4">
                <h3 className="font-semibold text-lg">{skill.name}</h3>
              </div>

              <div className="w-full bg-secondary/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-primary h-2 rounded-full origin-left animate-grow"
                  style={{ width: `${skill.level}%` }}
                />
              </div>

              <div className="text-right mt-1">
                <span className="text-sm text-muted-foreground">
                  {skill.level}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
