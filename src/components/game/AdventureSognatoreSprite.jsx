import React, { useEffect, useState } from "react";
import { createWildSognatoreSpriteSheet } from "@/lib/adventurePixelSprites";

/**
 * Sprite overworld Avventura: usa l'artwork individuale del roster,
 * ridotto a una risoluzione controllata per ottenere un look da RPG 2D.
 */
export default function AdventureSognatoreSprite({ s, size = 88, className = "", walking = true, crisp = false, overworld = false }) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [pixelArtwork, setPixelArtwork] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const artwork = s?.img && !imageFailed ? s.img : "";

  useEffect(() => {
    setImageFailed(false);
    setPixelArtwork("");
  }, [s?.id, s?.img, overworld]);

  useEffect(() => {
    if (!s || artwork) {
      setSheetUrl("");
      return;
    }
    const sheet = createWildSognatoreSpriteSheet(s);
    setSheetUrl(sheet.toDataURL());
  }, [s?.id, s?.nome, s?.tipo, artwork, overworld]);

  const buildPixelArtwork = (event) => {
    const image = event.currentTarget;
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) return;
    const targetHeight = 64;
    let source = image;
    let sourceX = 0, sourceY = 0, sourceWidth = image.naturalWidth, sourceHeight = image.naturalHeight;
    if (overworld) {
      const scan = document.createElement("canvas");
      scan.width = sourceWidth; scan.height = sourceHeight;
      const scanContext = scan.getContext("2d", { willReadFrequently: true });
      if (!scanContext) return;
      scanContext.drawImage(image, 0, 0);
      const frame = scanContext.getImageData(0, 0, sourceWidth, sourceHeight);
      const pixels = frame.data;
      const seen = new Uint8Array(sourceWidth * sourceHeight);
      const queue = new Int32Array(sourceWidth * sourceHeight);
      let head = 0, tail = 0;
      const add = (x, y) => {
        const index = y * sourceWidth + x;
        if (seen[index]) return;
        const p = index * 4;
        if (pixels[p] > 24 || pixels[p + 1] > 24 || pixels[p + 2] > 24) return;
        seen[index] = 1; queue[tail++] = index;
      };
      for (let x = 0; x < sourceWidth; x++) { add(x, 0); add(x, sourceHeight - 1); }
      for (let y = 1; y < sourceHeight - 1; y++) { add(0, y); add(sourceWidth - 1, y); }
      while (head < tail) {
        const index = queue[head++];
        const x = index % sourceWidth, y = (index / sourceWidth) | 0;
        pixels[index * 4 + 3] = 0;
        if (x > 0) add(x - 1, y);
        if (x + 1 < sourceWidth) add(x + 1, y);
        if (y > 0) add(x - sourceWidth);
        if (y + 1 < sourceHeight) add(x + sourceWidth);
      }
      scanContext.putImageData(frame, 0, 0);
      let minX = sourceWidth, minY = sourceHeight, maxX = -1, maxY = -1;
      for (let y = 0; y < sourceHeight; y++) for (let x = 0; x < sourceWidth; x++) {
        if (pixels[(y * sourceWidth + x) * 4 + 3] > 0) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
      if (maxX >= minX && maxY >= minY) {
        const padX = Math.max(3, Math.round((maxX - minX + 1) * 0.045));
        const padY = Math.max(3, Math.round((maxY - minY + 1) * 0.045));
        source = scan;
        sourceX = Math.max(0, minX - padX); sourceY = Math.max(0, minY - padY);
        sourceWidth = Math.min(scan.width - 1, maxX + padX) - sourceX + 1;
        sourceHeight = Math.min(scan.height - 1, maxY + padY) - sourceY + 1;
      }
    }
    const targetWidth = Math.max(1, Math.round(sourceWidth * targetHeight / sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, targetWidth, targetHeight);
    context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
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
            src={crisp ? artwork : (pixelArtwork || artwork)}
            alt={s.nome || "Sognatore"}
            draggable={false}
            onError={() => setImageFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center bottom",
              imageRendering: crisp ? "auto" : (pixelArtwork ? "pixelated" : "auto"),
              // In modalità statica non mostrare GIF/WebP animate prima dello snapshot PNG.
              visibility: !crisp && !walking && !pixelArtwork ? "hidden" : "visible"
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
