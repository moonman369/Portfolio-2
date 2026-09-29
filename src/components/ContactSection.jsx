import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { cn } from "../lib/utils";
import { useToast } from "../context/ToastContext";
import { CONTACT_INFO } from "../context/constants";
import { useReveal } from "../hooks/useReveal";
import GlowBeam from "./GlowBeam";
import SectionHeading from "./SectionHeading";
import SocialLinks from "./SocialLinks";

// Fields: 48px tall, 16px text (no iOS zoom), a >= 3:1 border and the global
// focus ring.
const fieldClass =
  "block w-full h-12 rounded-md border border-input bg-background px-4 text-base text-foreground focus:border-primary";

// Web3Forms delivers submissions to the email tied to this access key.
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ref: revealRef, pending: revealPending } = useReveal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");

    setIsSubmitting(true);

    if (!WEB3FORMS_ACCESS_KEY) {
      toast({
        title: "Email not configured",
        description:
          "Set VITE_WEB3FORMS_ACCESS_KEY in your .env to enable the contact form.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name,
          email,
          message,
          subject: `New portfolio message from ${name}`,
          from_name: "Ayan's Portfolio",
          replyto: email,
          botcheck: formData.get("botcheck"),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Message sent!",
          description: "Thanks for reaching out. I'll get back to you soon.",
        });
        form.reset();
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (err) {
      console.error("Contact form failed:", err);
      toast({
        title: "Couldn't send message",
        description: "Something went wrong. Please try again or email directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      ref={revealRef}
      data-reveal-pending={revealPending || undefined}
      className="section-pad relative text-left"
    >
      <div className="container max-w-6xl">
        <SectionHeading
          index="05"
          label="Contact"
          intro="Have a project in mind or just want to say hi? My inbox is always open, let's build something together!"
        >
          Get In Touch
        </SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Contact info */}
          <div className="lg:col-span-5 space-y-10">
            <h3
              data-reveal
              className="font-heading text-h3 font-semibold text-foreground"
            >
              Contact Information
            </h3>

            <div data-reveal className="border-t border-border">
              <div className="flex items-start gap-4 border-b border-border py-5">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h4 className="eyebrow text-muted-foreground">Email</h4>
                  <div>
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="inline-flex min-h-11 items-center break-all text-foreground hover:text-primary"
                    >
                      {CONTACT_INFO.email}
                    </a>
                  </div>
                </div>
              </div>

              {CONTACT_INFO.phone && (
                <div className="flex items-start gap-4 border-b border-border py-5">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <h4 className="eyebrow text-muted-foreground">Phone</h4>
                    <div>
                      <a
                        href={`tel:${CONTACT_INFO.phone}`}
                        className="inline-flex min-h-11 items-center text-foreground hover:text-primary"
                      >
                        {CONTACT_INFO.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4 border-b border-border py-5">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h4 className="eyebrow text-muted-foreground">Location</h4>
                  <div>
                    <a
                      href={CONTACT_INFO.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-foreground hover:text-primary"
                    >
                      {CONTACT_INFO.location}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div data-reveal>
              <h4 className="eyebrow text-muted-foreground mb-4">
                Connect With Me
              </h4>
              <SocialLinks className="flex-wrap justify-start" />
            </div>
          </div>

          {/* Contact form */}
          <div
            data-reveal
            className="lg:col-span-7 rounded-xl border border-border bg-card/85 p-6 md:p-8"
          >
            <h3 className="font-heading text-h3 font-semibold text-foreground mb-8">
              Send a Message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot spam trap — must stay empty */}
              <input
                type="checkbox"
                name="botcheck"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className={fieldClass}
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className={fieldClass}
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className={cn(fieldClass, "h-auto py-3 resize-none")}
                  placeholder="Hi Ayan, I'd love to talk about..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={cn(
                  "btn-primary btn-glow w-full",
                  // Sending: earthshine, the one warm "live" state.
                  isSubmitting &&
                    "disabled:opacity-100 bg-earthshine text-background [--glow:var(--earthshine)] [--glow-face:hsl(var(--earthshine))]",
                )}
              >
                <GlowBeam />
                {isSubmitting ? "Sending..." : "Send Message"}
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
