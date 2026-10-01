import { Github, Linkedin, Mail } from "lucide-react";
import { SiLeetcode } from "react-icons/si";
import { FaWhatsapp } from "react-icons/fa";
import { cn } from "../lib/utils";
import { SOCIAL_LINKS } from "../context/constants";

const ICONS = {
  linkedin: Linkedin,
  github: Github,
  leetcode: SiLeetcode,
  whatsapp: FaWhatsapp,
  mail: Mail,
};

const SocialLinks = ({ className, itemClassName, size = 20 }) => {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {SOCIAL_LINKS.map((social) => {
        const Icon = ICONS[social.icon];
        if (!Icon) return null;
        const isMail = social.url.startsWith("mailto:");
        return (
          <a
            key={social.name}
            href={social.url}
            aria-label={social.name}
            title={social.name}
            {...(isMail
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            className={cn(
              "icon-btn text-muted-foreground ring-1 ring-inset ring-border",
              "hover:text-ink",
              itemClassName,
            )}
          >
            <Icon size={size} aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
