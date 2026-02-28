"use client";
import { useEffect, useState, useRef } from "react";
import { useProctor } from "./ProctorContext";

export default function ExamTimer({ minutes = 10 }) {
  const { deduct } = useProctor();
  const [time, setTime] = useState(minutes * 60);
  const endedRef = useRef(false);

  useEffect(() => {
    if (time <= 0) {
      if (!endedRef.current) {
        endedRef.current = true;
        deduct(10, "Time over");
      }
      return;
    }

    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, deduct]);

  return (
    <div className="fixed top-3 right-4 bg-black text-white px-4 py-2 rounded-xl font-mono shadow-md z-50">
      ⏱ {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}
    </div>
  );
}
