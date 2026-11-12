import React, { useEffect, useState } from "react";
import { createWildSognatoreSpriteSheet } from "@/lib/adventurePixelSprites";

/**
 * Sprite originale overworld del Sognatore: silhouette per tipologia,
 * dettagli individuali e animazione idle a due frame in pixel art.
 */
export default function AdventureSognatoreSprite({ s, size = 88, className = "", walking = true }) {
  const [sheetUrl, setSheetUrl] = useState("");
  useEffect(() => {
    if (!s) { setSheetUrl(""); return; }
    const sheet = createWildSognatoreSpriteSheet(s);
    setSheetUrl(sheet.toDataURL());
  }, [s?.id, s?.nome, s?.tipo]);
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
        backgroundImage: sheetUrl ? "url(" + sheetUrl + ")" : "none",
        backgroundRepeat: "no-repeat",
        backgroundSize: "200% 200%",
        backgroundPosition: "0% 0%",
        imageRendering: "pixelated",
        filter: "drop-shadow(0 2px 2px rgba(0,0,0,.38))",
        animation: walking ? "sognatori-wild-idle .42s steps(2,end) infinite" : "none"
      }}
    >
      <style>{`@keyframes sognatori-wild-idle { from { background-position-x: 0%; } to { background-position-x: 100%; } }`}</style>
    </div>
  );
}
