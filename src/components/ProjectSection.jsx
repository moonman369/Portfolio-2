import { ArrowRight, ExternalLink, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { PROJECTS, GITHUB_URL } from "../context/constants";
import {
  PROJECT_IMAGE_HEIGHT,
  PROJECT_IMAGE_WIDTH,
  projectMedia,
} from "../lib/projectMedia";

// Card width: full column on phones, half at md, a third inside max-w-5xl at lg.
const IMAGE_SIZES =
  "(min-width: 1024px) 320px, (min-width: 768px) 344px, calc(100vw - 2.5rem)";

const ProjectImage = ({ image, alt }) => {
  const media = projectMedia(image);
  const imgProps = {
    alt,
    loading: "lazy",
    decoding: "async",
    width: PROJECT_IMAGE_WIDTH,
    height: PROJECT_IMAGE_HEIGHT,
    className:
      "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
  };

  if (!media) return <img src={image} {...imgProps} />;

  return (
    <picture className="block h-full">
      <source type="image/avif" srcSet={media.avif} sizes={IMAGE_SIZES} />
      <source type="image/webp" srcSet={media.webp} sizes={IMAGE_SIZES} />
      <img src={media.src} {...imgProps} />
    </picture>
  );
};

const linkClass =
  "inline-flex items-center gap-1.5 text-sm text-foreground/80 hover:text-primary transition-colors duration-300";

const ProjectSection = () => {
  return (
    <section id="projects" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          Featured <span className="text-gradient">Projects</span>
        </h2>

        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          A selection of things I've built across backend integration, AI
          engineering, and the cloud. Each one taught me something new.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              className="group glass rounded-lg card-hover"
            >
              <div className="h-48 overflow-hidden rounded-t-lg">
                {project.image ? (
                  <ProjectImage image={project.image} alt={project.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-4xl font-bold text-primary/40">
                      {project.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col h-[calc(100%-12rem)]">
                <h3 className="text-lg font-semibold mb-4 text-left">
                  {project.title}
                </h3>

                <div className="mt-auto flex items-center gap-4">
                  {project.demo &&
                    (project.demo.startsWith("/") ? (
                      <Link
                        to={project.demo}
                        state={{ internal: true }}
                        className={linkClass}
                      >
                        <ExternalLink size={16} /> Live Demo
                      </Link>
                    ) : (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        <ExternalLink size={16} /> Live Demo
                      </a>
                    ))}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      <Github size={16} /> Code
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cosmic-button inline-flex items-center gap-2 mx-auto w-fit"
          >
            Check My GitHub <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProjectSection;
