import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, X, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

const ToastContext = createContext();

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "default", duration = 4000 }) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      <div className="fixed bottom-5 right-5 z-100 flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0">
        {toasts.map((t) => {
          const isError = t.variant === "destructive";
          const Icon = isError ? AlertCircle : CheckCircle;
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg shadow-lg border bg-card text-card-foreground",
                "animate-fade-in",
                isError ? "border-red-500/50" : "border-primary/50",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 mt-0.5",
                  isError ? "text-red-500" : "text-primary",
                )}
              />
              <div className="flex-1 text-left">
                {t.title && <p className="font-semibold text-sm">{t.title}</p>}
                {t.description && (
                  <p className="text-sm text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};
