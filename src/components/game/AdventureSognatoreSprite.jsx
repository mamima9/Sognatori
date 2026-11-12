import React from "react";

/**
 * Uses the official artwork assigned to each Sognatore in sognatoriData.js.
 * No generated silhouettes or faction placeholders: the character identity
 * always comes from s.img.
 */
export default function AdventureSognatoreSprite({
  s,
  size = 56,
  walking = false,
  className = "",
}) {
  if (!s) return null;

  const artwork = s.img;
  const animationName = walking ? "officialSognatoreWalk" : "officialSognatoreIdle";

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

      {artwork ? (
        <img
          src={artwork}
          alt={s.nome || "Sognatore"}
          draggable={false}
          loading="eager"
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center bottom",
            imageRendering: "pixelated",
            filter: "drop-shadow(0 3px 2px rgba(0,0,0,.6))",
            transformOrigin: "center bottom",
            animation: animationName + (walking ? " .38s steps(2,end) infinite" : " 1.25s ease-in-out infinite"),
          }}
        />
      ) : (
        <span className="text-[9px] font-bold text-red-200">Sprite mancante</span>
      )}
    </div>
  );
}
