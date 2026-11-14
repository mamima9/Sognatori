import React, { useEffect, useState } from "react";
import { createWildSognatoreSpriteSheet } from "@/lib/adventurePixelSprites";

/**
 * Sprite overworld Avventura: usa l'artwork individuale del roster,
 * ridotto a una risoluzione controllata per ottenere un look da RPG 2D.
 */
export default function AdventureSognatoreSprite({ s, size = 88, className = "", walking = true }) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [pixelArtwork, setPixelArtwork] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const artwork = s?.img && !imageFailed ? s.img : "";

  useEffect(() => {
    setImageFailed(false);
    setPixelArtwork("");
  }, [s?.id, s?.img]);

  useEffect(() => {
    if (!s || artwork) {
      setSheetUrl("");
      return;
    }
    const sheet = createWildSognatoreSpriteSheet(s);
    setSheetUrl(sheet.toDataURL());
  }, [s?.id, s?.nome, s?.tipo, artwork]);

  const buildPixelArtwork = (event) => {
    const image = event.currentTarget;
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) return;
    const targetHeight = 64;
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * targetHeight / image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, targetWidth, targetHeight);
    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    setPixelArtwork(canvas.toDataURL("image/png"));
  };

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
        <>
          {!pixelArtwork && (
            <img
              src={artwork}
              alt=""
              aria-hidden="true"
              draggable={false}
              onLoad={buildPixelArtwork}
              onError={() => {
                setImageFailed(true);
                setPixelArtwork("");
              }}
              style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
            />
          )}
          <img
            src={pixelArtwork || artwork}
            alt={s.nome || "Sognatore"}
            draggable={false}
            onError={() => setImageFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center bottom",
              imageRendering: pixelArtwork ? "pixelated" : "auto",
              // In modalità statica non mostrare GIF/WebP animate prima dello snapshot PNG.
              visibility: !walking && !pixelArtwork ? "hidden" : "visible"
            }}
          />
        </>
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
