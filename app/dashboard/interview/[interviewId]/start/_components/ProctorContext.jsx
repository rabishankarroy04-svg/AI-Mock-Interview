"use client";
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ProctorContext = createContext();

export const ProctorProvider = ({ interviewId, children }) => {
  const router = useRouter();
  const [warnings, setWarnings] = useState(10);
  const autoSubmittedRef = useRef(false);
  const lastViolationRef = useRef({});

  const autoSubmit = useCallback(async () => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;

    console.warn("🚨 Auto-submitting interview due to violations");
    toast.error("Interview auto-submitted due to violations");

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.warn("Could not exit fullscreen naturally", err);
      }
    }

    router.replace(`/dashboard/interview/${interviewId}/feedback`);
  }, [interviewId, router]);

  const deduct = useCallback(
    (points, reason) => {
      const now = Date.now();
      const COOLDOWN_MS = 3000;
      const lastTime = lastViolationRef.current[reason] || 0;

      if (now - lastTime < COOLDOWN_MS) return; // ignore spam
      lastViolationRef.current[reason] = now;

      setWarnings((prev) => {
        if (prev <= 0) return prev;

        const next = Math.max(prev - points, 0);
        const time = new Date().toLocaleTimeString();
        console.log(
          `[Violation] ${time} | ${reason} | -${points} | Remaining: ${next}`,
        );
        toast.warning(`⚠ ${reason} (-${points}) | Remaining: ${next}`);

        if (next === 0) {
          autoSubmit();
        }

        return next;
      });
    },
    [autoSubmit],
  );

  return (
    <ProctorContext.Provider value={{ warnings, deduct }}>
      {children}
    </ProctorContext.Provider>
  );
};

export const useProctor = () => {
  const ctx = useContext(ProctorContext);
  if (!ctx) throw new Error("useProctor must be inside ProctorProvider");
  return ctx;
};
