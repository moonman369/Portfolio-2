import { Link } from "react-router-dom";
import { Home as HomeIcon } from "lucide-react";

export const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl md:text-9xl font-bold text-gradient">404</h1>
      <p className="text-xl md:text-2xl font-semibold mt-4">Page Not Found</p>
      <p className="text-muted-foreground mt-2 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="cosmic-button inline-flex items-center gap-2 mt-8 w-fit"
      >
        <HomeIcon size={16} /> Back to Home
      </Link>
    </div>
  );
};
