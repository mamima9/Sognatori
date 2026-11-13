import React, { useEffect, useState } from "react";
import { createWildSognatoreSpriteSheet } from "@/lib/adventurePixelSprites";

/**
 * Artwork individuale del roster usato come sprite nella sola modalità
 * Avventura. Mantiene un fallback procedurale per i Sognatori senza artwork.
 */
export default function AdventureSognatoreSprite({ s, size = 88, className = "", walking = true }) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const artwork = s?.img && !imageFailed ? s.img : "";

  useEffect(() => {
    setImageFailed(false);
  }, [s?.id, s?.img]);

  useEffect(() => {
    if (!s || artwork) {
      setSheetUrl("");
      return;
    }
    const sheet = createWildSognatoreSpriteSheet(s);
    setSheetUrl(sheet.toDataURL());
  }, [s?.id, s?.nome, s?.tipo, artwork]);

  if (!s) return null;

  return (
    <div
      className={className}
      title={s.nome || "Sognatore"}
      role="img"
      aria-label={s.nome || "Sognatore"}
      style={{
        width: size,
        height: size,
        flex: "0 0 auto",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: "drop-shadow(0 3px 3px rgba(0,0,0,.42))",
        animation: walking ? "adventure-sognatore-idle 1.15s ease-in-out infinite" : "none"
      }}
    >
      {artwork ? (
        <img
          src={artwork}
          alt={s.nome || "Sognatore"}
          draggable={false}
          onError={() => setImageFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center bottom",
            imageRendering: "auto"
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: sheetUrl ? "url(" + sheetUrl + ")" : "none",
            backgroundRepeat: "no-repeat",
            backgroundSize: "200% 200%",
            backgroundPosition: "0% 0%",
            imageRendering: "pixelated"
          }}
        />
      )}
      <style>{`@keyframes adventure-sognatore-idle {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-2px) scale(1.015); }
      }`}</style>
    </div>
  );
}
