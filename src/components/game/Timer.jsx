import React, { useState, useEffect, useRef } from "react";

export function useCountdown(totalSeconds, onExpire, resetKey) {
  const [seconds, setSeconds] = useState(totalSeconds);
  const callbackRef = useRef(onExpire);
  callbackRef.current = onExpire;

  useEffect(() => {
    setSeconds(totalSeconds);
    if (totalSeconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          callbackRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resetKey, totalSeconds]);

  return seconds;
}

export function TimerBar({ seconds, total, className = "" }) {
  const pct = total > 0 ? (seconds / total) * 100 : 0;
  const color = pct > 50 ? "#22c55e" : pct > 25 ? "#eab308" : "#ef4444";
  return (
    <div className={`w-full h-2 rounded-full bg-black/40 overflow-hidden ${className}`}>
      <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}