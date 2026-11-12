import React, { useEffect, useRef } from "react";
import { createAdventurePixelSprite } from "@/lib/adventurePixelSprites";

export default function AdventureSognatoreSprite({ s, size = 88, className = "" }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !s?.img) return undefined;
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const sprite = createAdventurePixelSprite(image, 32);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = sprite.width;
      canvas.height = sprite.height;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sprite, 0, 0);
    };
    image.src = s.img;
    return () => { active = false; image.onload = null; };
  }, [s?.img]);
  if (!s?.img) return null;
  return <div className={className} title={s.nome || "Sognatore"} aria-label={s.nome || "Sognatore"} style={{ width:size, height:size+8, display:"flex", alignItems:"flex-end", justifyContent:"center", flex:"0 0 auto" }}>
    <canvas ref={canvasRef} style={{ width:size, height:size, objectFit:"contain", imageRendering:"pixelated", display:"block" }} />
  </div>;
}
