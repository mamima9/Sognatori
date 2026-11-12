import React from "react";

/**
 * Rendering degli artwork ufficiali dei Sognatori come personaggi NPC
 * dell'Avventura. Mantiene il PNG originale: niente downsampling su canvas,
 * cornici, badge o indicatori da interfaccia.
 */
export default function AdventureSognatoreSprite({
  s,
  size = 88,
  className = "",
}) {
  if (!s?.img) return null;

  return (
    <div
      className={className}
      title={s.nome || "Sognatore"}
      aria-label={s.nome || "Sognatore"}
      style={{
        width: size,
        height: size + 12,
        position: "relative",
        flex: "0 0 auto",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {/* Ombra aderente al terreno: ancora visivamente il PNG alla mappa. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "23%",
          right: "23%",
          bottom: 2,
          height: Math.max(5, size * 0.075),
          borderRadius: "50%",
          background: "rgba(5, 12, 9, .48)",
          filter: "blur(3px)",
        }}
      />
      <img
        src={s.img}
        alt={s.nome || "Sognatore"}
        draggable={false}
        loading="eager"
        decoding="async"
        style={{
          position: "relative",
          zIndex: 1,
          display: "block",
          width: size,
          height: size,
          objectFit: "contain",
          objectPosition: "center bottom",
          imageRendering: "auto",
          filter: "drop-shadow(0 2px 2px rgba(0,0,0,.42))",
        }}
      />
    </div>
  );
}
