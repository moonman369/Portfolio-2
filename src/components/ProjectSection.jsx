import { ArrowRight, ExternalLink, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { PROJECTS, GITHUB_URL } from "../context/constants";
import { useReveal } from "../hooks/useReveal";
import {
  PROJECT_IMAGE_HEIGHT,
  PROJECT_IMAGE_WIDTH,
  projectMedia,
} from "../lib/projectMedia";
import BlueSheen from "./BlueSheen";
import SectionHeading from "./SectionHeading";

// The first projects get more room.
const FEATURED_COUNT = 2;

// Rendered widths: featured cards are half the row on large screens, the
// rest a third; two columns on tablets; full width on phones.
const IMAGE_SIZES = {
  featured:
    "(min-width: 1024px) 560px, (min-width: 768px) 344px, calc(100vw - 2.5rem)",
  regular:
    "(min-width: 1024px) 368px, (min-width: 768px) 344px, calc(100vw - 2.5rem)",
};

const ProjectImage = ({ image, alt, sizes }) => {
  const media = projectMedia(image);
  const imgProps = {
    alt,
    loading: "lazy",
    decoding: "async",
    width: PROJECT_IMAGE_WIDTH,
    height: PROJECT_IMAGE_HEIGHT,
    className: "w-full h-full object-cover",
  };

  if (!media) return <img src={image} {...imgProps} />;

  return (
    <picture className="block h-full">
      <source type="image/avif" srcSet={media.avif} sizes={sizes} />
      <source type="image/webp" srcSet={media.webp} sizes={sizes} />
      <img src={media.src} {...imgProps} />
    </picture>
  );
};

const linkClass =
  "group/link inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-foreground hover:text-ink";
const linkIconClass =
  "transition-transform duration-(--motion-fast) ease-moon-out group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5";

const ProjectSection = () => {
  const { ref, pending } = useReveal();

  return (
    <section
      id="projects"
      ref={ref}
      data-reveal-pending={pending || undefined}
      className="section-pad relative text-left"
    >
      <div className="container max-w-6xl">
        <SectionHeading
          index="04"
          label="Projects"
          intro="A selection of things I've built across backend integration, AI engineering, and the cloud. Each one taught me something new."
        >
          Featured Projects
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-6">
          {PROJECTS.map((project, index) => {
            const featured = index < FEATURED_COUNT;
            return (
              <article
                key={project.id}
                data-reveal
                className={cn(
                  "surface card-ring group flex flex-col overflow-hidden rounded-xl border border-border bg-card/85",
                  featured ? "lg:col-span-3" : "lg:col-span-2",
                )}
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
                  {project.image ? (
                    <ProjectImage
                      image={project.image}
                      alt={project.title}
                      sizes={featured ? IMAGE_SIZES.featured : IMAGE_SIZES.regular}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="font-heading text-4xl font-semibold text-primary/50">
                        {project.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* A veil over the screenshot that lifts on hover/focus. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent transition-opacity duration-(--motion-base) ease-moon-out group-hover:opacity-0 group-focus-within:opacity-0"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-4 top-4 rounded bg-background/85 px-2 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
                  <h3
                    className={cn(
                      "font-heading font-semibold text-foreground",
                      featured ? "text-h3" : "text-lg leading-snug",
                    )}
                  >
                    {project.title}
                  </h3>

                  <div className="mt-auto flex flex-wrap items-center gap-x-6">
                    {project.demo &&
                      (project.demo.startsWith("/") ? (
                        <Link
                          to={project.demo}
                          state={{ internal: true }}
                          className={linkClass}
                        >
                          <ExternalLink size={16} aria-hidden="true" className={linkIconClass} />{" "}
                          Live Demo
                        </Link>
                      ) : (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClass}
                        >
                          <ExternalLink size={16} aria-hidden="true" className={linkIconClass} />{" "}
                          Live Demo
                        </a>
                      ))}
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        <Github size={16} aria-hidden="true" /> Code
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div data-reveal className="mt-12">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-glow-blue"
          >
            <BlueSheen />
            Check My GitHub <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProjectSection;
