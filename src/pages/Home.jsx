import HeroSection from "../components/HeroSection";
import Navbar from "../components/Navbar";
import StarBackground from "../components/StarBackground";
import LightModeBackground from "../components/LightModeBackground";
import { useTheme } from "../context/ThemeContext";
import AboutSection from "../components/AboutSection";
import SkillsSection from "../components/SkillsSection";
import StatsSection from "../components/StatsSection";
import ProjectSection from "../components/ProjectSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import Moonmind from "../components/Moonmind";

export const Home = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">
      {/* Background Effects */}
      {isDarkMode ? <StarBackground /> : <LightModeBackground />}

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />
        {/* About Section */}
        <AboutSection />
        {/* Skills Section */}
        <SkillsSection />
        {/* Stats Section */}
        <StatsSection />
        {/* Projects Section */}
        <ProjectSection />
        {/* Contact Section */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Moonmind AI chatbot (portal-less overlay) */}
      <Moonmind />
    </div>
  );
};
