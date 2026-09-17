"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/utils/use-safe-reduced-motion";
import { Check, Info, TriangleAlert, X } from "lucide-react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(
  null
);

/** Fires a transient notification. Safe to call from any client component. */
export function useToast() {
  const push = useContext(ToastContext);
  if (!push) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return push;
}

const icons: Record<Tone, typeof Check> = {
  success: Check,
  error: TriangleAlert,
  info: Info,
};

const tones: Record<Tone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-danger/30 bg-danger/10 text-danger",
  info: "border-border bg-background text-foreground",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduce = useSafeReducedMotion();

  const dismiss = useCallback(
    (id: number) => setToasts((all) => all.filter((t) => t.id !== id)),
    []
  );

  const push = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = Date.now() + Math.random();
      setToasts((all) => [...all.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* `polite` so a screen reader finishes the current sentence first. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-5 sm:translate-x-0"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = icons[toast.tone];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={`pointer-events-auto flex items-center gap-3 rounded-control border px-4 py-3 text-sm shadow-hover backdrop-blur ${tones[toast.tone]}`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1 text-foreground">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
