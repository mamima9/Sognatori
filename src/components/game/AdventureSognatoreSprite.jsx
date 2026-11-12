import React, { useEffect, useRef, useState } from "react";

/**
 * Pixel sprite generated from the official Sognatore artwork in ROSTER.img.
 * The original design is preserved; only the rendering resolution is reduced
 * to create a GBA-like pixel look.
 */
export default function AdventureSognatoreSprite({
  s,
  size = 56,
  walking = false,
  className = "",
}) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !s?.img) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    const source = new Image();
    source.onload = () => {
      if (cancelled) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setFailed(true);
        return;
      }
      const resolution = 32;
      canvas.width = resolution;
      canvas.height = resolution;
      ctx.clearRect(0, 0, resolution, resolution);
      ctx.imageSmoothingEnabled = false;

      const scale = Math.min(resolution / source.width, resolution / source.height);
      const width = Math.max(1, Math.round(source.width * scale));
      const height = Math.max(1, Math.round(source.height * scale));
      const x = Math.floor((resolution - width) / 2);
      const y = Math.floor((resolution - height) / 2);
      ctx.drawImage(source, x, y, width, height);
    };
    source.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    source.src = s.img;

    return () => {
      cancelled = true;
      source.onload = null;
      source.onerror = null;
    };
  }, [s?.img]);

  if (!s) return null;

  const animation = walking
    ? "officialSognatoreWalk .38s steps(2,end) infinite"
    : "officialSognatoreIdle 1.25s ease-in-out infinite";

  return (
    <div
      className={className}
      title={s.nome || "Sognatore"}
      aria-label={s.nome || "Sognatore"}
      style={{
        width: size,
        height: size + 8,
        position: "relative",
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes officialSognatoreIdle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes officialSognatoreWalk {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-3px) rotate(-2deg) scale(.98); }
          75% { transform: translateY(-1px) rotate(2deg) scale(1.02); }
        }
      `}</style>

      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "18%",
          right: "18%",
          bottom: 1,
          height: 6,
          borderRadius: "50%",
          background: "rgba(0,0,0,.38)",
          filter: "blur(1px)",
        }}
      />

      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", animation }}>
        {failed ? (
          <img
            src={s.img}
            alt={s.nome || "Sognatore"}
            draggable={false}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 3px 2px rgba(0,0,0,.6))" }}
          />
        ) : (
          <canvas
            ref={canvasRef}
            aria-label={s.nome || "Sognatore"}
            style={{
              width: size,
              height: size,
              imageRendering: "pixelated",
              objectFit: "contain",
              filter: "drop-shadow(0 3px 2px rgba(0,0,0,.6))",
            }}
          />
        )}
      </div>
    </div>
  );
}
