import { Minimize2 } from "lucide-react";
import { BiBrain } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import StarBackground from "../components/StarBackground";
import LightModeBackground from "../components/LightModeBackground";
import MoonmindChat from "../components/MoonmindChat";

const MoonmindPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-foreground relative flex flex-col overflow-hidden">
      {/* Same background as the site */}
      {isDarkMode ? <StarBackground /> : <LightModeBackground />}

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-3xl mx-auto p-4 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 py-4">
          <BiBrain className="text-3xl text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">
              <span className="text-gradient">Moonmind AI</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Ayan's portfolio assistant
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            aria-label="Minimize to portfolio"
            title="Minimize"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 transition-all text-sm hover:btn-glow"
          >
            <Minimize2 size={16} /> Minimize
          </button>
        </div>

        {/* Glassy chat container */}
        <div className="flex-1 min-h-0 mb-4 glass rounded-2xl overflow-hidden flex flex-col">
          <MoonmindChat className="flex-1" />
        </div>
      </div>
    </div>
  );
};

export default MoonmindPage;
