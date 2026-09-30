import { Link } from "react-router-dom";
import { Home as HomeIcon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import StarBackground from "../components/StarBackground";
import LightModeBackground from "../components/LightModeBackground";
import HeroMoon from "../components/HeroMoon";
import BlueSheen from "../components/BlueSheen";

// "Lost in orbit": the hero's moon, with its satellite drifted off course.
export const NotFound = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="relative min-h-svh overflow-x-clip text-foreground">
      {isDarkMode ? <StarBackground /> : <LightModeBackground />}

      <div className="relative z-10 min-h-svh flex flex-col items-center justify-center px-5 py-16 text-center">
        <HeroMoon lost className="w-56 sm:w-72 h-auto mb-6" />

        <div className="paper-scrim flex flex-col items-center">
          <h1 className="font-heading text-display font-semibold">404</h1>
          <p className="font-heading text-h3 font-semibold mt-4">
            Page Not Found
          </p>
          <p className="text-muted-foreground mt-3 max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link to="/" className="btn-primary btn-glow-blue mt-10">
          <BlueSheen />
          <HomeIcon size={16} aria-hidden="true" /> Back to Home
        </Link>
      </div>
    </div>
  );
};
