import React, { useEffect, useState } from "react";
import { createTravelerSpriteSheet } from "@/lib/adventurePixelSprites";

export default function AdventureTravelerSprite({ traveler, faction, size = 58, direction = "down", walking = true }) {
  const [sheetUrl,setSheetUrl]=useState("");
  useEffect(()=>{
    const sheet=createTravelerSpriteSheet(faction, traveler);
    setSheetUrl(sheet.toDataURL());
  },[faction, traveler]);
  const row=({down:0,left:1,right:2,up:3})[direction] ?? 0;
  return <div role="img" aria-label={traveler || "Viaggiatore"} style={{
    width:size,height:size*1.34,display:"block",flex:"0 0 auto",
    backgroundImage:sheetUrl ? "url("+sheetUrl+")" : "none",
    backgroundRepeat:"no-repeat",backgroundSize:"200% 400%",
    backgroundPosition:"0% "+(row*100/3)+"%",
    imageRendering:"pixelated",
    filter:"drop-shadow(0 2px 1px rgba(0,0,0,.48))",
    animation:walking ? "sognatori-hgss-walk .34s steps(2,end) infinite" : "none"
  }}>
    <style>{`@keyframes sognatori-hgss-walk { from { background-position-x: 0%; } to { background-position-x: 100%; } }`}</style>
  </div>;
}
