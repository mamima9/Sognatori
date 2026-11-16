// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ROSTER } from "@/lib/sognatoriData";
import AdventureCampaign from "@/components/game/AdventureCampaign";
import AdventureTravelerSprite from "@/components/game/AdventureTravelerSprite";
import AdventureHouseInterior from "@/components/game/AdventureHouseInterior";
import AdventureWorldSystems from "@/components/game/AdventureWorldSystems";
import GlobalMusicPlayer from "@/components/game/GlobalMusicPlayer";
import { ADVENTURE_CITIES, ADVENTURE_WILD_AREAS, ADVENTURE_FACTION_LORE, buildCityTeam } from "@/lib/adventureCampaignData";
import { drawAdventureTraveler, drawAdventureWildSognatoreDirectional } from "@/lib/adventurePixelSprites";
import { drawAdventureNaturaCity } from "@/lib/adventureNaturaCity";
import { drawAdventureAmaroCity, drawAdventureAmaroOccluders, getAmaroElevationAt, canTraverseAmaroElevation } from "@/lib/adventureAmaroCity";
import { drawAdventureFactionCity } from "@/lib/adventureFactionCity";
import { drawAdventureCitySpecials, ADVENTURE_CITY_SPECIALS } from "@/lib/adventureCitySpecials";

/*
  SOGNATORI — AVVENTURA

  - mondo grande e continuo
  - movimento WASD / frecce
  - pad touch mobile
  - camera fluida
  - collisioni
  - acqua, alberi, rocce, case
  - 4 zone esplorabili
  - NPC interattivi
  - Sognatori selvatici
  - sfidanti
  - cooldown incontri
  - ciclo giorno/notte
  - minimappa
  - quest
  - HUD
  - nessuna dipendenza aggiuntiva
*/

const WORLD = {
  width: 3600,
  height: 2400,
};

const PLAYER = {
  size: 30,
  speed: 230,
};

const PLAYER_START = {
  x: 1450,
  y: 1100,
};

// Ogni specie compare una sola volta nella città della propria fazione.
const WILD_CORNER_ANCHORS = [
  { x: 430, y: 390, corner: "NO" },
  { x: 3170, y: 390, corner: "NE" },
  { x: 430, y: 2010, corner: "SO" },
  { x: 3170, y: 2010, corner: "SE" },
];

const FACTION_LORE_SITES = {
  Demone: ["PRIMA SCINTILLA", "FORGIA DEI NOMI", "CENERE FERTILE", "CAMPANE DI FERRO"],
  Robot: ["NUCLEO PRIMO", "MUSEO DEGLI ERRORI", "BINARI SOSPESI", "ARCHIVIO DEI RICORDI"],
  Natura: ["GRANDE SEME", "RADICI ANTICHE", "LINFA CHIARA", "CASE-ALBERO"],
  Nuvola: ["GRANDE CORRENTE", "CAMPANA DEL VENTO", "VELE CELESTI", "ATLANTE VUOTO"],
  Umano: ["PIAZZA DEGLI UNDICI", "MERCATO DEI FAVORI", "TEATRO DELLE POSSIBILITÀ", "BACHECA DEI VIANDANTI"],
  Luce: ["SPECCHIO DELL'ALBA", "LANTERNE SOLARI", "OBELISCO DELLE SCELTE", "GIARDINO D'OMBRA"],
  Dolce: ["PATTO DELLE MILLE MANI", "GIARDINO SOSPESO", "FONTANA DI NETTARE", "FIORI CANDITI"],
  Marino: ["MAREE PROFONDE", "CORALLI LUMINOSI", "CONCHIGLIA ANTICA", "VASCA DELLE CORRENTI"],
  Orso: ["SETTE TANE", "PIETRA DEL BRANCO", "PINI ANTICHI", "FALÒ DELLA VIGILIA"],
  Mago: ["ARCHIVIO IMPOSSIBILE", "ARCHI RUNICI", "SPECCHIO D'ETERE", "TOMO VIVENTE"],
  Salato: ["SALE BIANCO", "VASCA DI CRISTALLO", "GEYSER MINERALE", "CANYON SALINO"],
};

function buildMapWildStarts(city) {
  const residents = ROSTER.filter((sognatore) => (sognatore.tipo || sognatore.fazione) === city.faction);
  // Un solo incontro per specie in ogni città: niente copie duplicate dello stesso Sognatore.
  const offsets = [[0, 0]];
  return residents.flatMap((sognatore, index) => {
    // Distribuisce gli incontri tra i quattro settori, lasciando libero l'asse centrale.
    const anchor = index === 0
      ? { x: 1500, y: 360, corner: "NORD-OVEST" }
      : WILD_CORNER_ANCHORS[index % WILD_CORNER_ANCHORS.length];
    const layer = Math.floor(index / WILD_CORNER_ANCHORS.length);
    const directionX = anchor.x < WORLD.width / 2 ? 1 : -1;
    const directionY = anchor.y < WORLD.height / 2 ? 1 : -1;
    const centerX = anchor.x + directionX * layer * 190;
    const centerY = anchor.y + directionY * layer * 140;
    const loreSites = FACTION_LORE_SITES[city.faction] || [];
    const loreSite = loreSites[index % loreSites.length] || city.faction;
    return offsets.map(([ox, oy], copy) => ({
      id: "wild-" + city.id + "-" + sognatore.id + "-" + (copy + 1),
      rosterId: sognatore.id,
      // Un solo esemplare della specie, sempre quello arruolabile.
      x: centerX + ox,
      y: centerY + oy,
      isSleepingBlocker: false,
      name: sognatore.nome,
      img: sognatore.img,
      tipo: sognatore.tipo || sognatore.fazione,
      recruitable: true,
      speciesIndex: index,
      cornerIndex: index % WILD_CORNER_ANCHORS.length,
      siteX: centerX + directionX * 145,
      siteY: centerY,
      habitatX: centerX + directionX * 145,
      habitatY: centerY,
      habitatKey: sognatore.id,
      loreSite,
    }));
  });
}

const SOGNATORE_HABITATS = {
  adlimago:"arcane-study", cancucc:"bakery-garden", eroe:"storm-cliff", nuvobetta:"cloud-meadow",
  scroccospell:"cursed-library", deb:"delivery-workshop", aragostino:"tidal-rockpool", sparkly:"market-square",
  nina:"sun-orchard", taomarco:"swap-crossroads", riwupido:"purification-shrine", fourmori:"ant-hill",
  ginza:"guardian-courtyard", dragociocco:"cocoa-grove", tinia:"pink-cloud-garden", uesditti:"rune-library",
  fierononno:"old-watchtower", long:"railway-yard", pepe:"ember-swamp", cillymbu:"bamboo-grove",
  pequeno:"seedling-hollow", cenere:"volcanic-crater", icepadel:"frozen-arena", pirimar:"coral-current",
  spinoff:"expansion-grove", toasty:"salt-kiln", shoboshi:"shadow-altar", elmas:"crystal-plateau",
  "ring-ape":"ancient-ring", slurpo:"ancient-ring"
};

function drawSognatoreHabitat(ctx, rosterId, faction, x, y, label, cornerIndex = 0) {
  const scenes = {
    "arcane-study":["#302744","#71569b","#d7c4f2"],
    "bakery-garden":["#70462f","#c88a51","#f5d8a6"],
    "storm-cliff":["#334e72","#7ea8d5","#e6f4ff"],
    "cloud-meadow":["#647ca5","#b9d3ed","#fff8f0"],
    "cursed-library":["#28233e","#70539b","#d5b5ef"],
    "delivery-workshop":["#244653","#4f9da8","#c1f1e5"],
    "tidal-rockpool":["#17485c","#3b9aaa","#b8e9df"],
    "market-square":["#674632","#bd8656","#f0d0a0"],
    "sun-orchard":["#78602b","#d6b34e","#fff0a8"],
    "swap-crossroads":["#5c4039","#c17d4c","#f3d19b"],
    "purification-shrine":["#6c5a2d","#d8bb59","#fff6c9"],
    "ant-hill":["#62452f","#b77d50","#e8c18a"],
    "guardian-courtyard":["#574331","#a87949","#e5c38b"],
    "cocoa-grove":["#58352f","#a65d50","#e9b58a"],
    "pink-cloud-garden":["#65527f","#bd9bdc","#f8dff0"],
    "rune-library":["#342b55","#8068b0","#e4d5ff"],
    "old-watchtower":["#42556e","#8ca9c8","#e4e9ee"],
    "railway-yard":["#263e4b","#568b94","#c1d8d1"],
    "ember-swamp":["#482936","#a64b4e","#f29a58"],
    "bamboo-grove":["#294a35","#5c9b51","#c4df83"],
    "seedling-hollow":["#34513a","#78a95b","#d4e9a0"],
    "volcanic-crater":["#44252d","#b94d42","#ffb05c"],
    "frozen-arena":["#244c62","#77b8ca","#efffff"],
    "coral-current":["#164c61","#3c9eaa","#c0f0e7"],
    "expansion-grove":["#31513c","#6a9e58","#d6e89a"],
    "salt-kiln":["#555d5b","#a7ada2","#f1e4c4"],
    "shadow-altar":["#302d4a","#685b8d","#d0c5ed"],
    "crystal-plateau":["#4b5c62","#9cb7b9","#f0ffff"],
    "ancient-ring":["#49372b","#9b7044","#e8c58a"]
  };
  const scene = SOGNATORE_HABITATS[rosterId] || "seedling-hollow";
  const [soil,main,glow] = scenes[scene];
  const r = (x,y,w,h,color) => { ctx.fillStyle=color; ctx.fillRect(x,y,w,h); };
  const dot = (x,y,rx,ry,color) => { ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill(); };
  const line = (x1,y1,x2,y2,color,width=4) => { ctx.strokeStyle=color; ctx.lineWidth=width; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); };
  const rock = (x,y,color=main) => { dot(x,y,12,7,soil); dot(x-2,y-3,10,7,color); r(x-5,y-6,5,2,glow); };
  const sprout = (x,y) => { r(x-2,y-1,4,17,soil); dot(x-7,y-8,7,4,main); dot(x+7,y-12,7,4,glow); };
  const star = (x,y) => { dot(x,y,3,3,glow); line(x-7,y,x+7,y,glow,2); line(x,y-7,x,y+7,glow,2); };
  ctx.save(); ctx.translate(x,y); ctx.imageSmoothingEnabled=false;
  // Suolo e perimetro: ogni specie riceve un micro-bioma con palette propria.
  dot(0,13,91,34,"rgba(0,0,0,.24)"); dot(0,7,86,29,soil); dot(0,3,76,23,main);
  dot(-45,7,23,9,soil); dot(45,7,23,9,soil);
  switch(scene) {
    case "arcane-study":
      r(-29,-31,58,37,soil); r(-25,-27,50,29,main); r(-20,-23,40,3,glow);
      for(let k=0;k<3;k++){r(-18+k*15,-18,9,17,soil);r(-16+k*15,-16,5,13,glow);}
      star(0,-38); line(-42,0,-30,-18,glow,3); line(42,0,30,-18,glow,3); break;
    case "bakery-garden":
      dot(0,-13,25,20,soil); dot(0,-17,21,16,main); dot(-5,-21,5,4,glow); dot(8,-12,5,4,glow);
      r(-36,0,72,7,soil); r(-30,-5,60,5,glow); dot(-43,-10,9,7,main); dot(43,-10,9,7,main); break;
    case "storm-cliff":
      for(let k=0;k<4;k++){line(-48+k*30,12,-34+k*30,-23-(k%2)*10,soil,10);line(-48+k*30,10,-34+k*30,-21-(k%2)*10,main,5);}
      line(-18,-29,0,-43,glow,3); line(0,-43,16,-29,glow,3); star(0,-46); break;
    case "cloud-meadow":
      for(let k=0;k<4;k++){dot(-45+k*30,-9-(k%2)*8,18,10,main);dot(-40+k*30,-13-(k%2)*8,12,7,glow);}
      line(0,-5,0,-30,soil,4); dot(0,-34,6,6,glow); break;
    case "cursed-library":
      r(-38,-28,76,34,soil); r(-32,-24,64,27,main); r(-5,-23,10,24,glow);
      for(let k=0;k<4;k++)r(-27+k*17,-19,10,18,k%2?glow:soil);
      star(-45,-33); star(43,-32); break;
    case "delivery-workshop":
      r(-39,-25,78,31,soil); r(-34,-21,68,25,main); r(-27,-15,18,12,glow); r(8,-15,18,12,glow);
      line(-44,-29,44,-29,glow,3); dot(0,-32,5,5,glow); break;
    case "tidal-rockpool":
      dot(0,1,57,20,"#153c54"); dot(0,-2,48,15,main); dot(-30,-7,13,8,glow); dot(28,4,12,7,glow);
      for(let k=0;k<5;k++)line(-40+k*20,8,-33+k*20,1,glow,2); rock(-54,-13); rock(52,-13); break;
    case "market-square":
      r(-38,-25,76,30,soil); line(-38,-24,38,-24,glow,4); line(-25,-24,-25,-4,glow,3); line(0,-24,0,-4,glow,3); line(25,-24,25,-4,glow,3);
      for(let k=0;k<3;k++)dot(-24+k*24,-17,7,6,main); break;
    case "sun-orchard":
      for(let k=0;k<5;k++){r(-43+k*21,-4,4,20,soil);dot(-41+k*21,-18,12,12,main);dot(-44+k*21,-22,6,6,glow);}
      star(0,-42); break;
    case "swap-crossroads":
      line(-48,-2,48,-2,soil,9); line(0,-35,0,25,soil,9); line(-45,-2,45,-2,glow,2); line(0,-33,0,23,glow,2);
      dot(0,-3,12,12,main); star(0,-3); break;
    case "purification-shrine":
      line(-32,4,0,-38,soil,8); line(32,4,0,-38,soil,8); line(-32,4,32,4,soil,8);
      line(-24,0,0,-29,glow,3); line(24,0,0,-29,glow,3); star(0,-15); break;
    case "ant-hill":
      dot(0,-5,32,24,soil); dot(0,-12,23,17,main); dot(0,-11,7,10,soil);
      for(let k=0;k<6;k++){dot(-48+k*19,13,3,3,glow);line(-48+k*19,13,-43+k*19,3,soil,2);} break;
    case "guardian-courtyard":
      r(-36,-25,72,30,soil); r(-30,-20,60,22,main); line(-39,-25,39,-25,glow,4);
      for(let k=0;k<4;k++)r(-29+k*19,-16,7,14,k%2?glow:soil);
      dot(0,-30,10,8,glow); break;
    case "cocoa-grove":
      for(let k=0;k<4;k++){r(-38+k*24,-7,5,18,soil);dot(-35+k*24,-20,13,13,main);dot(-39+k*24,-24,6,5,glow);}
      dot(0,-8,13,9,soil); break;
    case "pink-cloud-garden":
      for(let k=0;k<5;k++){dot(-48+k*24,-12-(k%2)*9,14,10,main);dot(-48+k*24,-17-(k%2)*9,7,6,glow);}
      line(0,-4,0,-29,soil,3); dot(0,-32,8,8,glow); break;
    case "rune-library":
      r(-34,-27,68,31,soil); r(-29,-22,58,24,main);
      for(let k=0;k<3;k++){line(-18+k*18,-17,-18+k*18,-3,glow,2);dot(-18+k*18,-20,4,4,glow);}
      star(0,-35); break;
    case "old-watchtower":
      r(-13,-42,26,48,soil); r(-9,-38,18,40,main); r(-23,-42,46,6,glow);
      for(let k=0;k<3;k++)r(-6+k*6,-30,3,7,glow); line(-35,0,35,0,soil,5); break;
    case "railway-yard":
      line(-49,-2,49,-2,soil,8); line(-49,7,49,7,glow,3);
      for(let k=0;k<6;k++)r(-42+k*16,-7,5,19,soil);
      r(-12,-28,24,18,main); r(-8,-24,16,10,glow); break;
    case "ember-swamp":
      dot(-30,4,20,12,soil); dot(28,6,20,12,soil); dot(0,-4,18,12,main);
      for(let k=0;k<5;k++){line(-34+k*17,0,-29+k*17,-22-(k%2)*7,glow,3);dot(-29+k*17,-24-(k%2)*7,4,5,main);}
      star(0,-40); break;
    case "bamboo-grove":
      for(let k=0;k<6;k++){r(-44+k*17,-40+(k%2)*5,5,48,soil);r(-42+k*17,-38+(k%2)*5,2,42,glow);line(-45+k*17,-20, -34+k*17,-24,main,3);}
      dot(-25,-5,15,7,main); dot(25,-5,15,7,main); break;
    case "seedling-hollow":
      dot(0,-5,27,23,soil); line(0,8,0,-28,glow,5); dot(-13,-20,15,7,main); dot(14,-27,16,8,glow);
      for(let k=0;k<4;k++)dot(-48+k*31,8,5,4,soil); break;
    case "volcanic-crater":
      dot(0,-2,54,23,soil); dot(0,-7,35,15,main); dot(0,-11,18,9,glow);
      for(let k=0;k<5;k++)line(-32+k*16,-7,-28+k*16,-28-(k%2)*8,glow,4);
      star(0,-42); break;
    case "frozen-arena":
      dot(0,-3,54,22,soil); dot(0,-7,45,16,main); line(-34,-7,0,-31,glow,4); line(0,-31,34,-7,glow,4);
      line(-34,-7,0,16,glow,4); line(0,16,34,-7,glow,4); star(0,-32); break;
    case "coral-current":
      dot(0,8,52,14,"#153d52");
      for(let k=0;k<6;k++){line(-42+k*17,8,-40+k*17,-12-(k%3)*7,soil,5);dot(-40+k*17,-17-(k%3)*7,6,6,glow);}
      line(-45,-2,-22,-8,glow,2);line(22,-8,45,-2,glow,2);break;
    case "expansion-grove":
      for(let k=0;k<4;k++){line(-36+k*24,8,-36+k*24,-24,soil,5);dot(-36+k*24,-28,13,12,main);dot(-42+k*24,-31,6,5,glow);}
      line(-50,-2,50,-2,glow,2); star(0,-42);break;
    case "salt-kiln":
      r(-29,-29,58,34,soil); r(-24,-24,48,28,main); r(-17,-16,34,17,glow);
      dot(0,-12,9,8,soil); for(let k=0;k<4;k++)line(-24+k*16,8,-18+k*16,-5,glow,2);break;
    case "shadow-altar":
      r(-33,-14,66,18,soil); line(-28,-14,0,-43,main,8); line(28,-14,0,-43,main,8);
      dot(0,-23,12,12,glow); dot(0,-23,5,5,soil); star(-39,-34);star(39,-34);break;
    case "crystal-plateau":
      for(let k=0;k<5;k++){ctx.beginPath();ctx.moveTo(-42+k*20,8);ctx.lineTo(-35+k*20,-25-(k%2)*12);ctx.lineTo(-27+k*20,8);ctx.closePath();ctx.fillStyle=k%2?main:glow;ctx.fill();}
      line(-49,10,49,10,soil,4);break;
    case "ancient-ring":
      ctx.strokeStyle=soil;ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,-13,29,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=glow;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-13,29,0,Math.PI*2);ctx.stroke();
      for(let k=0;k<4;k++)dot(-42+k*28,10,6,5,main);star(0,-49);break;
  }
  // Piccoli dettagli coerenti con l'identità, non un unico fondale copiato.
  if(cornerIndex%2===0){dot(-64,-4,3,3,glow);dot(64,3,3,3,glow);}
  ctx.fillStyle="rgba(7,13,18,.9)";ctx.fillRect(-116,25,232,27);
  ctx.fillStyle=glow;ctx.fillRect(-116,25,5,27);
  ctx.fillStyle="#fff6e7";ctx.font="bold 12px monospace";ctx.textAlign="center";ctx.fillText(label,0,44,220);
  ctx.restore();
}

function drawFactionLoreSite(ctx, faction, x, y, label, cornerIndex = 0) {
  const palettes = {
    Demone: ["#512d35", "#e86b4e", "#ffc06c"],
    Robot: ["#254957", "#69d8cf", "#d2fff0"],
    Natura: ["#4b392b", "#579b59", "#c4e78d"],
    Nuvola: ["#829fc2", "#d9edff", "#fff5c8"],
    Umano: ["#745139", "#c9955e", "#f1d6a3"],
    Luce: ["#8b6c32", "#f0d36d", "#fff5bd"],
    Dolce: ["#8d527f", "#eaa6cb", "#fff0dc"],
    Marino: ["#20566c", "#57c1c8", "#c4f4e9"],
    Orso: ["#57412f", "#a9804e", "#e8c990"],
    Mago: ["#463b68", "#9e87d7", "#f2d68a"],
    Salato: ["#646d69", "#bfc6b9", "#fff7e4"],
  };
  const [dark, main, light] = palettes[faction] || palettes.Natura;
  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(5,12,15,.24)";
  ctx.beginPath(); ctx.ellipse(0, 16, 76, 27, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dark; ctx.fillRect(-62, 5, 124, 13);
  ctx.fillStyle = main; ctx.fillRect(-55, 0, 110, 8);
  ctx.fillStyle = light; ctx.fillRect(-43, 1, 86, 3);

  switch (faction) {
    case "Demone":
      ctx.fillStyle = dark; ctx.fillRect(-22, -40, 44, 42);
      ctx.fillStyle = main; ctx.beginPath(); ctx.moveTo(-20, -22); ctx.lineTo(-9, -56); ctx.lineTo(0, -25); ctx.lineTo(12, -62); ctx.lineTo(22, -22); ctx.fill();
      ctx.fillStyle = light; ctx.fillRect(-4, -22, 8, 23); break;
    case "Robot":
      ctx.fillStyle = dark; ctx.fillRect(-28, -42, 56, 43);
      ctx.strokeStyle = main; ctx.lineWidth = 5; ctx.strokeRect(-20, -34, 40, 28);
      ctx.fillStyle = light; ctx.fillRect(-6, -25, 12, 12);
      ctx.strokeStyle = main; ctx.lineWidth = 3;
      for (const [sx, sy] of [[-38,-30],[38,-30],[-38,0],[38,0]]) { ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx/2,sy/2); ctx.stroke(); } break;
    case "Natura":
      ctx.fillStyle = dark; ctx.fillRect(-5, -30, 10, 33);
      ctx.fillStyle = main;
      for (const [sx, sy, radius] of [[0,-42,20],[-17,-27,14],[17,-27,14]]) { ctx.beginPath(); ctx.arc(sx,sy,radius,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle = light; ctx.fillRect(-5, -49, 10, 9); break;
    case "Nuvola":
      ctx.fillStyle = main;
      for (const [sx, sy, radius] of [[-16,-25,15],[0,-38,21],[18,-25,14]]) { ctx.beginPath(); ctx.arc(sx,sy,radius,0,Math.PI*2); ctx.fill(); }
      ctx.strokeStyle = light; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(0,3); ctx.stroke();
      ctx.fillStyle = light; ctx.beginPath(); ctx.arc(0,-43,5,0,Math.PI*2); ctx.fill(); break;
    case "Umano":
      ctx.fillStyle = dark; ctx.fillRect(-24,-45,48,48);
      ctx.fillStyle = main; ctx.fillRect(-19,-39,38,35);
      ctx.fillStyle = light; ctx.fillRect(-4,-33,8,26);
      ctx.fillStyle = light; ctx.fillRect(-30,-51,60,5); break;
    case "Luce":
      ctx.fillStyle = main; ctx.beginPath(); ctx.moveTo(0,-58); ctx.lineTo(27,-27); ctx.lineTo(0,0); ctx.lineTo(-27,-27); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = light; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = light; ctx.fillRect(-3,-34,6,15); break;
    case "Dolce":
      ctx.fillStyle = main;
      for (let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*18,-29+Math.sin(a)*18,11,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle = light; ctx.beginPath(); ctx.arc(0,-29,8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = dark; ctx.fillRect(-4,-10,8,11); break;
    case "Marino":
      ctx.fillStyle = main; ctx.beginPath(); ctx.moveTo(-30,-12); ctx.quadraticCurveTo(-42,-54,0,-48); ctx.quadraticCurveTo(42,-54,30,-12); ctx.quadraticCurveTo(0,2,-30,-12); ctx.fill();
      ctx.strokeStyle = light; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0,-43); ctx.lineTo(0,-10); ctx.stroke();
      ctx.fillStyle = light; ctx.beginPath(); ctx.arc(0,-30,5,0,Math.PI*2); ctx.fill(); break;
    case "Orso":
      ctx.fillStyle = main; ctx.fillRect(-25,-36,50,36);
      ctx.beginPath(); ctx.arc(-17,-38,10,0,Math.PI*2); ctx.arc(17,-38,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = light; ctx.fillRect(-13,-24,26,12);
      ctx.fillStyle = dark; ctx.fillRect(-4,-21,8,7); break;
    case "Mago":
      ctx.strokeStyle = main; ctx.lineWidth = 6; ctx.strokeRect(-28,-48,56,50);
      ctx.strokeStyle = light; ctx.lineWidth = 3; ctx.strokeRect(-17,-36,34,28);
      ctx.fillStyle = light; ctx.beginPath(); ctx.arc(0,-22,7,0,Math.PI*2); ctx.fill(); break;
    case "Salato":
      ctx.fillStyle = main; ctx.beginPath(); ctx.moveTo(0,-62); ctx.lineTo(24,-18); ctx.lineTo(12,-5); ctx.lineTo(-12,-5); ctx.lineTo(-24,-18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = light; ctx.fillRect(-3,-48,6,32);
      ctx.fillStyle = dark; ctx.fillRect(-32,-4,64,5); break;
  }

  ctx.fillStyle = "rgba(7,13,18,.88)";
  ctx.fillRect(-116, 25, 232, 27);
  ctx.fillStyle = light;
  ctx.fillRect(-116, 25, 5, 27);
  ctx.fillStyle = "#fff6e7";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, 0, 44, 220);
  ctx.restore();
}

const MAP_DOOR = { x: 1800, y: 2220, radius: 94 };
const MAP_NORTH_DOOR = { x: 1800, y: 150, radius: 94 };
// Porta segreta sul margine occidentale di Verdelume/Amargenta.
const AMARGENTA_DOOR = { x: 145, y: 1200, radius: 94 };
const AMARGENTA_SPAWN = { x: 320, y: 1200 };
const MAP_SPAWN = { x: 1800, y: 320 };
const MAP_SOUTH_SPAWN = { x: 1800, y: 2080 };

const CHALLENGERS = ADVENTURE_CITIES.map((city) => {
  const lore = ADVENTURE_FACTION_LORE[city.id];
  return {
  ...city,
  ...lore,
  id: city.id,
  name: lore?.leader || city.traveler,
  traveler: lore?.leader || city.traveler,
  team: buildCityTeam(city.faction, city.id),
  vision: 190,
  homeX: city.x,
  homeY: city.y,
  radius: 76,
  color: city.color,
  };
});

/* Sei case visitabili per città, ognuna con un abitante. */
// Disposizione urbana per fazione: sei abitazioni raggiungibili, distribuite in quartieri.
const HOUSE_OFFSETS_BY_CITY = {
  demone: [[-226,-142],[-72,-248],[188,-190],[-252,58],[224,116],[42,252]],
  robot: [[-242,-174],[-24,-258],[236,-112],[-208,144],[184,224],[36,42]],
  nuvola: [[-238,-150],[-72,-268],[188,-226],[-270,76],[226,122],[42,264]],
  umano: [[-248,-112],[-126,-254],[176,-224],[-236,174],[244,158],[54,32]],
  luce: [[-214,-208],[-12,-266],[238,-144],[-260,104],[176,242],[18,54]],
  dolce: [[-250,-166],[-88,-260],[206,-202],[-222,126],[244,86],[18,254]],
  marino: [[-244,-128],[-44,-262],[226,-188],[-260,116],[206,224],[22,48]],
  orso: [[-230,-178],[-42,-258],[236,-126],[-244,144],[184,238],[42,28]],
  mago: [[-246,-146],[-104,-266],[208,-218],[-224,154],[248,102],[36,258]],
  salato: [[-236,-196],[-24,-264],[244,-142],[-258,118],[198,236],[22,36]],
  natura: [[-132,-88],[0,-158],[132,-88],[-132,88],[132,88],[0,158]],
};
const HOUSE_OFFSETS = HOUSE_OFFSETS_BY_CITY;
const HOUSE_RESIDENTS = [
  ["Elda", "La strada fuori è piena di storie."],
  ["Timo", "Colleziono mappe e racconti."],
  ["Nora", "Ogni angolo nasconde qualcosa."],
  ["Berto", "Ogni fazione costruisce a modo suo."],
  ["Lumi", "I dettagli più belli si notano fermandosi."],
  ["Riko", "Continua a esplorare!"],
];
const ADVENTURE_HOUSES = ADVENTURE_CITIES.flatMap((city) =>
  (HOUSE_OFFSETS[city.id] || HOUSE_OFFSETS.natura).map(([ox, oy], index) => ({
    id: city.id + "-house-" + index,
    city,
    x: city.x + ox * 1.55,
    y: city.y + oy * 1.55,
    resident: (ADVENTURE_FACTION_LORE[city.id]?.npcs?.[index] || HOUSE_RESIDENTS[index])[0],
    dialogue: (ADVENTURE_FACTION_LORE[city.id]?.npcs?.[index] || HOUSE_RESIDENTS[index])[1],
    number: index + 1,
  }))
);

const clamp = (v, min, max) =>
  Math.max(min, Math.min(max, v));

const distance = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

function seededRandom(seed) {
  let value = seed;

  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function buildWorld() {
  const rand = seededRandom(42);

  const trees = [];
  const rocks = [];

  for (let i = 0; i < 150; i++) {
    const x = 80 + rand() * (WORLD.width - 160);
    const y = 80 + rand() * (WORLD.height - 160);

    if (
      Math.hypot(x - 1800, y - 1200) < 390 ||
      Math.hypot(x - MAP_SPAWN.x, y - MAP_SPAWN.y) < 145 ||
      Math.hypot(x - MAP_SOUTH_SPAWN.x, y - MAP_SOUTH_SPAWN.y) < 145 ||
      Math.hypot(x - MAP_NORTH_DOOR.x, y - MAP_NORTH_DOOR.y) < 165 ||
      Math.hypot(x - MAP_DOOR.x, y - MAP_DOOR.y) < 165 ||
      Math.hypot(x - AMARGENTA_DOOR.x, y - AMARGENTA_DOOR.y) < 190 ||
      WILD_CORNER_ANCHORS.some((anchor) => Math.hypot(x - anchor.x, y - anchor.y) < 470)
    ) continue;
    if (ADVENTURE_CITIES.some((city) => Math.hypot(x - city.x, y - city.y) < 250)) continue;

    if (
      Math.abs(x - 1800) < 420 &&
      Math.abs(y - 1200) < 300
    ) {
      continue;
    }

    trees.push({
      id: `tree-${i}`,
      x,
      y,
      r: 28 + rand() * 12,
    });
  }

  for (let i = 0; i < 65; i++) {
    const x = 80 + rand() * (WORLD.width - 160);
    const y = 80 + rand() * (WORLD.height - 160);
    if (
      Math.hypot(x - 1800, y - 1200) < 390 ||
      Math.hypot(x - MAP_SPAWN.x, y - MAP_SPAWN.y) < 145 ||
      Math.hypot(x - MAP_SOUTH_SPAWN.x, y - MAP_SOUTH_SPAWN.y) < 145 ||
      Math.hypot(x - MAP_NORTH_DOOR.x, y - MAP_NORTH_DOOR.y) < 165 ||
      Math.hypot(x - MAP_DOOR.x, y - MAP_DOOR.y) < 165 ||
      Math.hypot(x - AMARGENTA_DOOR.x, y - AMARGENTA_DOOR.y) < 190 ||
      WILD_CORNER_ANCHORS.some((anchor) => Math.hypot(x - anchor.x, y - anchor.y) < 470)
    ) continue;
    if (ADVENTURE_CITIES.some((city) => Math.hypot(x - city.x, y - city.y) < 220)) continue;
    rocks.push({ id: `rock-${i}`, x, y, r: 13 + rand() * 13 });
  }

  return {
    trees,
    rocks,
  };
}

const WORLD_OBJECTS = buildWorld();

const OUTDOOR_NPC_POSITIONS = [
  [[920, 470], [2680, 730], [920, 1840]],
  [[1120, 360], [2860, 1120], [2520, 1940]],
  [[720, 920], [2900, 520], [2700, 1780]],
  [[1180, 520], [2640, 1680], [760, 1940]],
  [[900, 1760], [2780, 500], [2780, 1850]],
  [[720, 520], [2860, 920], [1120, 1940]],
  [[1080, 390], [2920, 1640], [720, 1760]],
  [[760, 1080], [2860, 420], [2600, 1940]],
  [[1120, 1840], [2860, 1080], [760, 430]],
  [[720, 430], [2700, 1840], [2920, 900]],
  [[1120, 520], [2600, 420], [760, 1840]],
];

const NPC_FACTION_COLORS = {
  Demone: "#e87958", Robot: "#70d8cf", Natura: "#91c86b",
  Nuvola: "#c8e5ff", Umano: "#d6a36d", Luce: "#f5dc7b",
  Dolce: "#efa8d0", Marino: "#72d4dc", Orso: "#bd9562",
  Mago: "#b9a1ed", Salato: "#d4d2bd",
};

function buildOutdoorNPCs(city, lore, gameTime = 9) {
  const mapIndex = Math.max(0, ADVENTURE_CITIES.findIndex((item) => item.id === city.id));
  const positions = OUTDOOR_NPC_POSITIONS[mapIndex % OUTDOOR_NPC_POSITIONS.length];
  const residents = lore?.npcs || [];
  const hour = ((Number(gameTime) || 0) % 24 + 24) % 24;
  const isNatura = city.faction === "Natura";

  return positions.map(([baseX, baseY], index) => {
    let x = baseX;
    let y = baseY;
    let activity = "IN PAESE";
    let routine = "Sono felice di vivere a Verdelume.";

    // Piccoli spostamenti intorno alle postazioni originali: non invadono
    // ingressi, punti di spawn o il Grande Seme. La stessa coordinata
    // viene usata dal rendering e dal sistema di interazione.
    if (isNatura) {
      const morning = hour >= 6 && hour < 12;
      const afternoon = hour >= 12 && hour < 18;
      const evening = hour >= 18 || hour < 6;

      if (index === 0) {
        if (morning) { x += 54; y += 28; activity = "RACCOGLIE ERBE"; routine = "Il mattino è il momento migliore per raccogliere le erbe."; }
        else if (afternoon) { x -= 42; y += 22; activity = "SISTEMA LE AIUOLE"; routine = "Sto rimettendo in ordine le aiuole del villaggio."; }
        else { x += 12; y -= 24; activity = "SI RIPOSA"; routine = "Anche la foresta ha bisogno di riposo."; }
      } else if (index === 1) {
        if (morning || afternoon) { x -= 48; y += 26; activity = "PREPARA RIMEDI"; routine = "Le piante dello stagno hanno proprietà preziose."; }
        else { x += 30; y -= 32; activity = "BOTTEGA CHIUSA"; routine = "Domani riaprirò la bottega con nuove tisane."; }
      } else {
        if (evening) { x -= 34; y += 30; activity = "VEGLIA NOTTURNA"; routine = "Di notte veglio sul Grande Seme e sulle sue radici."; }
        else { x += 26; y -= 36; activity = "CUSTODISCE IL SEME"; routine = "Il Grande Seme custodisce la memoria di Verdelume."; }
      }
    }

    return {
      id: "outdoor-" + city.id + "-" + index,
      name: residents[index]?.[0] || ["Viandante", "Esploratore", "Artigiano"][index],
      dialogue: isNatura ? routine : (residents[index]?.[1] || "Ogni angolo di questa terra custodisce una storia."),
      x, y,
      faction: city.faction,
      index,
      activity: isNatura ? activity : null,
      color: NPC_FACTION_COLORS[city.faction] || "#d6b47a",
    };
  });
}

const ZONES = [
  {
    name: "Prato dei Sogni",
    x: 0,
    y: 0,
    w: 1800,
    h: 1200,
    color: "#5b8f4d",
  },
  {
    name: "Bosco delle Ombre",
    x: 0,
    y: 1200,
    w: 1600,
    h: 1200,
    color: "#355c43",
  },
  {
    name: "Monti di Cenere",
    x: 1800,
    y: 1200,
    w: 1800,
    h: 1200,
    color: "#655d55",
  },
  {
    name: "Valle Dorata",
    x: 1800,
    y: 0,
    w: 1800,
    h: 1200,
    color: "#a38b45",
  },
];


/* Terreno HD pixel-art: variazioni organiche e dettagli per bioma, senza griglia piatta. */
function drawGroundTiles(ctx, camera, viewWidth, viewHeight, scale, faction = "Natura") {
  const tile = 48;
  const halfW = viewWidth / (2 * scale) + tile * 2;
  const halfH = viewHeight / (2 * scale) + tile * 2;
  const left = Math.max(0, Math.floor((camera.x - halfW) / tile) * tile);
  const right = Math.min(WORLD.width, camera.x + halfW);
  const top = Math.max(0, Math.floor((camera.y - halfH) / tile) * tile);
  const bottom = Math.min(WORLD.height, camera.y + halfH);
  const palettes = {
    "Prato dei Sogni": ["#568d49", "#5e984e", "#659f54", "#548747", "#70a85b"],
    "Bosco delle Ombre": ["#294f3b", "#315c42", "#386648", "#2c563d", "#416d4a"],
    "Monti di Cenere": ["#686258", "#746c60", "#7d7568", "#625d55", "#898071"],
    "Valle Dorata": ["#9a8242", "#a88d48", "#b29650", "#967c3d", "#baa15b"],
  };
  const factionPalettes = {
    Demone: ["#75434a", "#96504c", "#b65d4d", "#633b43", "#c87555"],
    Robot: ["#7d8993", "#89949e", "#9ba5ad", "#78848e", "#b9c1c8"],
    Natura: ["#426f45", "#52864a", "#659c52", "#365f40", "#79ad60"],
    Nuvola: ["#dce7ef", "#e3edf4", "#edf4f8", "#cbd9e4", "#f7fbff"],
    Umano: ["#41454b", "#55585d", "#686d73", "#34383e", "#858b91"],
    Luce: ["#b49a4b", "#c9ad57", "#ddc46d", "#a98b3e", "#ead58c"],
    Dolce: ["#a97849", "#c89a62", "#d9b17f", "#986b43", "#e5c18a"],
    Marino: ["#367b88", "#438e9b", "#58a5ae", "#2e697e", "#80c1c5"],
    Orso: ["#766044", "#92734d", "#aa875a", "#624e3c", "#c09b69"],
    Mago: ["#62517f", "#79649a", "#907ab0", "#51436e", "#b09ad0"],
    Salato: ["#a96f77", "#c98e91", "#d9a5a5", "#98676d", "#e8c5c2"],
    Amaro: ["#39252a", "#56352f", "#765044", "#9b6848", "#c18a50"],
  };
  const factionPalette = factionPalettes[faction] || palettes["Prato dei Sogni"];
  const detailColors = {
    Amaro: "#e5b66b", Robot: "#d4d9de", Nuvola: "#ffffff", Umano: "#858b91",
    Dolce: "#e5c18a", Salato: "#e8c5c2",
  };
  const detailColor = detailColors[faction] || "#83b365";
  const flowerColors = faction === "Robot" ? ["#d4d9de", "#f6f8fa", "#aeb8c1", "#ffffff"]
    : faction === "Nuvola" ? ["#ffffff", "#f4f9fd", "#d3e2ec", "#ffffff"]
    : faction === "Umano" ? ["#858b91", "#d5d9dd", "#aeb3b8", "#ffffff"]
    : faction === "Dolce" ? ["#e5c18a", "#fff0d0", "#d9b17f", "#f0d7b5"]
    : faction === "Salato" ? ["#e8c5c2", "#fff0e8", "#d9a5a5", "#f1d8d5"]
    : ["#f4e8c4", "#e8a8c8", "#d7e9ef", "#f1cf72"];
  for (let y = top; y < bottom; y += tile) {
    for (let x = left; x < right; x += tile) {
      const zone = ZONES.find(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) || ZONES[0];
      const seed = Math.abs(((x / tile) * 73856093) ^ ((y / tile) * 19349663));
      const palette = factionPalette;
      ctx.fillStyle = palette[seed % palette.length];
      ctx.fillRect(x, y, tile, tile);

      // Ombre e riflessi spezzano la ripetizione dei quadrati.
      ctx.fillStyle = "rgba(12,24,20,.07)";
      ctx.fillRect(x, y, tile, 3);
      ctx.fillRect(x, y, 3, tile);
      ctx.fillStyle = "rgba(235,224,170,.055)";
      ctx.fillRect(x + 5, y + 6, 17 + seed % 15, 3);
      ctx.fillRect(x + 10, y + 12, 4, 3);

      if (seed % 3 === 0) {
        const gx = x + 7 + seed % 29;
        const gy = y + 8 + (seed >> 3) % 27;
        ctx.fillStyle = detailColor;
        ctx.fillRect(gx, gy, 3, 7);
        ctx.fillRect(gx + 4, gy - 3, 3, 6);
        ctx.fillRect(gx + 8, gy + 1, 3, 5);
      }
      if (seed % 11 === 0 && zone.name !== "Monti di Cenere") {
        const fx = x + 12 + seed % 24;
        const fy = y + 13 + (seed >> 4) % 22;
        ctx.fillStyle = flowerColors[(seed >> 2) % flowerColors.length];
        ctx.fillRect(fx, fy, 4, 4);
        ctx.fillRect(fx + 4, fy - 3, 3, 3);
        ctx.fillStyle = "rgba(255,244,198,.65)";
        ctx.fillRect(fx + 1, fy - 2, 2, 2);
      }
      if (seed % 13 === 0) {
        ctx.fillStyle = "rgba(20,34,27,.16)";
        ctx.fillRect(x + 31, y + 32, 8, 3);
        ctx.fillRect(x + 34, y + 28, 3, 7);
      }

      // Trame ambientali riconoscibili: ogni fazione lascia una firma sul terreno.
      if (seed % 5 === 0) {
        ctx.save();
        ctx.lineCap = "square";
        switch (faction) {
          case "Demone":
            ctx.strokeStyle = "rgba(255,151,83,.58)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + 8, y + 35); ctx.lineTo(x + 17, y + 27); ctx.lineTo(x + 14, y + 18); ctx.lineTo(x + 25, y + 9); ctx.stroke();
            ctx.fillStyle = "rgba(255,190,100,.42)"; ctx.fillRect(x + 22, y + 7, 4, 3); break;
          case "Robot":
            ctx.strokeStyle = "rgba(137,239,220,.48)"; ctx.lineWidth = 2;
            ctx.strokeRect(x + 9, y + 9, 22, 22);
            ctx.fillStyle = "rgba(188,255,239,.7)"; ctx.fillRect(x + 18, y + 18, 5, 5);
            ctx.fillRect(x + 5, y + 19, 5, 2); ctx.fillRect(x + 30, y + 19, 5, 2); break;
          case "Natura":
            ctx.fillStyle = "rgba(179,220,112,.58)";
            ctx.fillRect(x + 14, y + 13, 4, 10); ctx.fillRect(x + 10, y + 16, 4, 4); ctx.fillRect(x + 18, y + 16, 4, 4);
            ctx.fillStyle = "rgba(242,224,151,.65)"; ctx.fillRect(x + 27, y + 30, 3, 3); break;
          case "Nuvola":
            ctx.fillStyle = "rgba(245,251,255,.38)";
            ctx.beginPath(); ctx.arc(x + 17, y + 20, 7, 0, Math.PI * 2); ctx.arc(x + 25, y + 18, 9, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(x + 8, y + 31, 12, 2); break;
          case "Umano":
            ctx.fillStyle = "rgba(77,52,34,.22)";
            ctx.fillRect(x + 7, y + 8, 13, 8); ctx.fillRect(x + 23, y + 20, 16, 9);
            ctx.fillStyle = "rgba(241,214,163,.36)"; ctx.fillRect(x + 9, y + 10, 9, 2); break;
          case "Luce":
            ctx.strokeStyle = "rgba(255,240,168,.55)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + 24, y + 7); ctx.lineTo(x + 24, y + 17); ctx.moveTo(x + 19, y + 12); ctx.lineTo(x + 29, y + 12); ctx.stroke();
            ctx.fillStyle = "rgba(255,246,196,.55)"; ctx.fillRect(x + 22, y + 21, 4, 4); break;
          case "Dolce":
            ctx.fillStyle = "rgba(255,224,241,.62)";
            ctx.fillRect(x + 9, y + 12, 4, 9); ctx.fillRect(x + 7, y + 14, 8, 4);
            ctx.fillStyle = "rgba(255,244,220,.72)"; ctx.fillRect(x + 27, y + 28, 4, 3); break;
          case "Marino":
            ctx.strokeStyle = "rgba(176,239,235,.55)"; ctx.lineWidth = 2;            ctx.beginPath(); ctx.moveTo(x + 5, y + 14); ctx.quadraticCurveTo(x + 15, y + 7, x + 25, y + 14); ctx.moveTo(x + 16, y + 27); ctx.quadraticCurveTo(x + 26, y + 20, x + 38, y + 27); ctx.stroke(); break;
          case "Orso":
            ctx.strokeStyle = "rgba(235,202,151,.42)"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x + 12, y + 11); ctx.lineTo(x + 18, y + 27); ctx.moveTo(x + 19, y + 9); ctx.lineTo(x + 25, y + 25); ctx.moveTo(x + 26, y + 8); ctx.lineTo(x + 32, y + 23); ctx.stroke(); break;
          case "Mago":
            ctx.strokeStyle = "rgba(215,199,255,.55)"; ctx.lineWidth = 2;
            ctx.strokeRect(x + 12, y + 12, 18, 18);
            ctx.fillStyle = "rgba(255,225,139,.72)"; ctx.fillRect(x + 20, y + 19, 4, 4); break;
          case "Salato":
            ctx.fillStyle = "rgba(255,255,245,.65)";
            ctx.fillRect(x + 13, y + 12, 4, 4); ctx.fillRect(x + 24, y + 24, 5, 5); ctx.fillRect(x + 31, y + 9, 3, 3);
            ctx.strokeStyle = "rgba(255,255,255,.38)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + 15, y + 29); ctx.lineTo(x + 21, y + 23); ctx.lineTo(x + 27, y + 29); ctx.stroke(); break;
        }
        ctx.restore();
      }
    }
  }
}

function drawFactionBorderTerrain(ctx, faction) {
  const themes = {
    Demone: ["#241b24","#4a2930","#783b3b","#bd5944","#ff9b52"],
    Robot: ["#202c35","#394b57","#61727b","#94a3aa","#d2e0e2"],
    Natura: ["#1c3428","#294a35","#426746","#719052","#a9bd75"],
    Nuvola: ["#718fa7","#9fb8c9","#c7d9e4","#e7f0f4","#ffffff"],
    Umano: ["#28282b","#424044","#625a51","#93816a","#c2aa84"],
    Luce: ["#403724","#6d5835","#a58a4c","#d0b66d","#f5e6ad"],
    Dolce: ["#49332f","#765044","#a87359","#d4a477","#f0d4a5"],
    Marino: ["#183747","#24566a","#347e8c","#69aeb0","#b5e0d5"],
    Orso: ["#30291f","#514333","#786044","#a4875b","#d0b98b"],
    Mago: ["#28233b","#403657","#62577f","#9384b4","#d2c5e8"],
    Salato: ["#3e3035","#685057","#98767a","#c3a0a0","#ead8ce"],
  };
  const p = themes[faction] || themes.Natura;
  const seeded = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const fillRidge = (points, color, baseY, side) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (side === "top") {
      ctx.moveTo(-1100, -1050);
      for (let x=-1100;x<=WORLD.width+1100;x+=95) ctx.lineTo(x, baseY + (seeded(x*.013+2)-.5)*230);
      ctx.lineTo(WORLD.width+1100,-1050);
    } else if (side === "bottom") {
      ctx.moveTo(-1100,WORLD.height+1050);
      for (let x=-1100;x<=WORLD.width+1100;x+=95) ctx.lineTo(x,WORLD.height-baseY+(seeded(x*.017+9)-.5)*230);
      ctx.lineTo(WORLD.width+1100,WORLD.height+1050);
    } else if (side === "left") {
      ctx.moveTo(-1100,-1000);
      for(let y=-1000;y<=WORLD.height+1000;y+=95) ctx.lineTo(-baseY+(seeded(y*.013+4)-.5)*230,y);
      ctx.lineTo(-1100,WORLD.height+1000);
    } else {
      ctx.moveTo(WORLD.width+1100,-1000);
      for(let y=-1000;y<=WORLD.height+1000;y+=95) ctx.lineTo(WORLD.width+baseY+(seeded(y*.017+8)-.5)*230,y);
      ctx.lineTo(WORLD.width+1100,WORLD.height+1000);
    }
    ctx.closePath();ctx.fill();
  };
  const drawMountain = (x,y,s,volcanic=false) => {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle="rgba(5,9,12,.3)";ctx.beginPath();ctx.ellipse(0,12,150,25,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=p[1];ctx.beginPath();ctx.moveTo(-150,20);ctx.lineTo(-105,-70);ctx.lineTo(-54,-120);ctx.lineTo(-12,-225);ctx.lineTo(38,-155);ctx.lineTo(86,-95);ctx.lineTo(150,20);ctx.closePath();ctx.fill();
    ctx.fillStyle=p[2];ctx.beginPath();ctx.moveTo(-12,-225);ctx.lineTo(38,-155);ctx.lineTo(86,-95);ctx.lineTo(150,20);ctx.lineTo(8,20);ctx.closePath();ctx.fill();
    ctx.fillStyle=p[3];ctx.beginPath();ctx.moveTo(-12,-225);ctx.lineTo(-42,-142);ctx.lineTo(-4,-160);ctx.lineTo(26,-125);ctx.lineTo(38,-155);ctx.closePath();ctx.fill();
    if(volcanic){
      ctx.fillStyle="#25191e";ctx.beginPath();ctx.ellipse(-12,-215,32,10,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=p[4];ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-18,-204);ctx.quadraticCurveTo(-46,-135,-70,-60);ctx.stroke();
      ctx.strokeStyle="#ffcf72";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-18,-204);ctx.quadraticCurveTo(-46,-135,-70,-60);ctx.stroke();
      ctx.fillStyle="rgba(74,76,78,.62)";
      for(let k=0;k<4;k++){ctx.beginPath();ctx.arc(-12+k*20,-265-k*22,22+k*3,0,Math.PI*2);ctx.fill();}
    }
    ctx.restore();
  };
  const drawTree = (x,y,s) => {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle="#3a3027";ctx.fillRect(-9,-55,18,75);
    for(const [dx,dy,r,col] of [[-27,-62,39,p[1]],[8,-93,48,p[2]],[40,-58,34,p[1]],[0,-38,42,p[2]]]){
      ctx.fillStyle=col;ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle=p[3];ctx.globalAlpha=.75;ctx.fillRect(-29,-85,13,6);ctx.fillRect(8,-116,15,7);ctx.globalAlpha=1;ctx.restore();
  };
  // Fondo atmosferico sfumato, senza cornici geometriche o fasce piatte.
  const bg=ctx.createLinearGradient(-900,-900,WORLD.width+900,WORLD.height+900);
  bg.addColorStop(0,p[0]);bg.addColorStop(.5,p[1]);bg.addColorStop(1,p[0]);
  ctx.fillStyle=bg;ctx.fillRect(-1100,-1100,WORLD.width+2200,WORLD.height+2200);
  // Profondità: tre profili irregolari sovrapposti, con foschia tra i piani.
  for(const side of ["top","bottom","left","right"]){
    fillRidge(null,p[1],side==="left"||side==="right"?520:470,side);
    fillRidge(null,p[2],side==="left"||side==="right"?330:300,side);
    fillRidge(null,p[0],side==="left"||side==="right"?150:135,side);
  }
  // Paesaggi iconici dedicati: niente montagne generiche nelle cinque città speciali.
  const customLandscape = ["Dolce","Nuvola","Marino","Mago","Robot"].includes(faction);
  if (!customLandscape) {
    for(let i=0;i<8;i++){
      const x= -450+i*650;
      drawMountain(x,-310,0.9+(i%3)*.18,faction==="Demone");
      drawMountain(x,WORLD.height+310,0.82+(i%4)*.13,faction==="Demone");
    }
    for(let i=0;i<6;i++){
      const y= -250+i*570;
      ctx.save();ctx.translate(-320,y);ctx.rotate(-Math.PI/2);drawMountain(0,0,.78+(i%3)*.16,faction==="Demone");ctx.restore();
      ctx.save();ctx.translate(WORLD.width+320,y);ctx.rotate(Math.PI/2);drawMountain(0,0,.78+(i%3)*.16,faction==="Demone");ctx.restore();
    }
  }

  const drawCandyHill = (x,y,s) => {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle="rgba(24,12,20,.25)";ctx.beginPath();ctx.ellipse(0,12,155,25,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#9d557b";ctx.beginPath();ctx.moveTo(-160,20);ctx.bezierCurveTo(-145,-80,-70,-175,0,-185);ctx.bezierCurveTo(95,-175,150,-75,160,20);ctx.closePath();ctx.fill();
    ctx.fillStyle="#e8a2c0";ctx.beginPath();ctx.moveTo(-115,0);ctx.bezierCurveTo(-90,-85,-35,-145,10,-155);ctx.bezierCurveTo(80,-135,115,-70,130,0);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#fff0d0";ctx.lineWidth=13;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-75,-80);ctx.bezierCurveTo(-20,-145,40,-145,90,-65);ctx.stroke();
    ctx.strokeStyle="#f7d36e";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-75,-80);ctx.bezierCurveTo(-20,-145,40,-145,90,-65);ctx.stroke();
    ctx.fillStyle="#ffe6a8";for(let k=0;k<9;k++){ctx.beginPath();ctx.arc(-85+k*21,-25-(k%3)*19,4,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  };
  const drawCloudBank = (x,y,s) => {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle="rgba(31,53,76,.18)";ctx.beginPath();ctx.ellipse(0,25,175,28,0,0,Math.PI*2);ctx.fill();
    for(const [dx,dy,rx,ry,col] of [[-95,0,76,52,"#a9c5d8"],[-35,-45,88,72,"#edf6fb"],[55,-34,91,69,"#ffffff"],[125,5,66,48,"#c7dce9"],[0,18,145,48,"#e4eff6"]]){
      ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(dx,dy,rx,ry,0,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle="rgba(255,255,255,.65)";ctx.lineWidth=5;ctx.beginPath();ctx.arc(-32,-52,53,3.5,5.7);ctx.stroke();
    ctx.restore();
  };
  const drawPalmIsland = (x,y,s) => {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle="rgba(5,20,28,.35)";ctx.beginPath();ctx.ellipse(0,30,150,30,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#236779";ctx.beginPath();ctx.ellipse(0,22,154,33,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#d9c28a";ctx.beginPath();ctx.ellipse(0,5,132,28,-.08,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#b4a06f";ctx.beginPath();ctx.ellipse(-8,11,100,15,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#805538";ctx.lineWidth=15;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(0,5);ctx.quadraticCurveTo(-12,-42,8,-92);ctx.stroke();
    ctx.strokeStyle="#b98756";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-2,-8);ctx.quadraticCurveTo(-12,-48,8,-92);ctx.stroke();
    for(let k=0;k<8;k++){const a=-Math.PI*.95+k*Math.PI*1.9/7;ctx.strokeStyle=k%2?"#367c48":"#4c9955";ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(8,-92);ctx.quadraticCurveTo(Math.cos(a)*52,-122+Math.sin(a)*15,Math.cos(a)*105,-91+Math.sin(a)*32);ctx.stroke();}
    ctx.fillStyle="#8b5938";ctx.beginPath();ctx.arc(3,-91,12,0,Math.PI*2);ctx.fill();
    ctx.restore();
  };
  const drawFloatingBook = (x,y,s,phase) => {
    ctx.save();ctx.translate(x,y+Math.sin(phase)*12);ctx.rotate(Math.sin(phase*.7)*.12);ctx.scale(s,s);
    ctx.fillStyle="rgba(7,5,16,.28)";ctx.beginPath();ctx.ellipse(0,28,42,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#392c55";ctx.beginPath();ctx.moveTo(-42,-20);ctx.quadraticCurveTo(-5,-33,0,-8);ctx.lineTo(0,28);ctx.quadraticCurveTo(-18,7,-42,15);ctx.closePath();ctx.fill();
    ctx.fillStyle="#684b91";ctx.beginPath();ctx.moveTo(0,-8);ctx.quadraticCurveTo(16,-32,42,-20);ctx.lineTo(42,15);ctx.quadraticCurveTo(15,8,0,28);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#e5d5ad";ctx.lineWidth=2;for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(-31,-8+k*9);ctx.lineTo(-7,-3+k*8);ctx.moveTo(8,-3+k*8);ctx.lineTo(31,-8+k*9);ctx.stroke();}
    ctx.strokeStyle="#c7a9ed";ctx.lineWidth=2;ctx.strokeRect(-42,-20,84,40);ctx.restore();
  };
  const drawLibraryTower = (x,y,s) => {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle="rgba(8,6,18,.3)";ctx.fillRect(-58,8,116,20);
    ctx.fillStyle="#302641";ctx.fillRect(-48,-155,96,165);
    ctx.fillStyle="#55436f";ctx.fillRect(-39,-145,78,150);
    for(let floor=0;floor<4;floor++){ctx.fillStyle="#251e35";ctx.fillRect(-32,-130+floor*34,64,27);for(let n=0;n<5;n++){ctx.fillStyle=["#c18a55","#9b6eb4","#d7b86b"][n%3];ctx.fillRect(-27+n*13,-124+floor*34,9,19);}}
    ctx.fillStyle="#cbb8e8";ctx.fillRect(-55,-160,110,8);ctx.beginPath();ctx.moveTo(-60,-160);ctx.lineTo(0,-195);ctx.lineTo(60,-160);ctx.closePath();ctx.fill();
    ctx.fillStyle="#e6cf83";ctx.fillRect(-5,-185,10,22);ctx.restore();
  };
  const drawBinaryMonument = (x,y,s,index) => {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle="rgba(4,12,16,.3)";ctx.fillRect(-62,12,124,16);
    ctx.fillStyle="#263b47";ctx.fillRect(-53,-130,106,140);
    ctx.fillStyle="#405b68";ctx.fillRect(-46,-123,92,126);
    ctx.fillStyle="#8ee6db";ctx.font="bold 15px monospace";ctx.textAlign="center";
    for(let row=0;row<7;row++){let bits="";for(let col=0;col<7;col++)bits+=((Math.floor(seeded(index*91+row*13+col)*2))?"1":"0");ctx.fillText(bits,0,-101+row*17);}
    ctx.strokeStyle="#9de8e2";ctx.lineWidth=3;ctx.strokeRect(-53,-130,106,140);
    ctx.fillStyle="#aebdc4";ctx.fillRect(-7,-150,14,20);ctx.restore();
  };
  if(faction==="Dolce"){
    for(let i=0;i<9;i++){const x=-480+i*610;drawCandyHill(x,-310-(i%2)*30,.75+(i%3)*.13);drawCandyHill(x,WORLD.height+310,.7+(i%4)*.1);}
    for(let i=0;i<5;i++){const y=-220+i*610;ctx.save();ctx.translate(-320,y);ctx.rotate(-Math.PI/2);drawCandyHill(0,0,.72+(i%3)*.12);ctx.restore();ctx.save();ctx.translate(WORLD.width+320,y);ctx.rotate(Math.PI/2);drawCandyHill(0,0,.72+(i%3)*.12);ctx.restore();}
  } else if(faction==="Nuvola"){
    for(let i=0;i<10;i++){const x=-420+i*500;drawCloudBank(x,-260-(i%3)*35,.8+(i%3)*.16);drawCloudBank(x,WORLD.height+260,.78+(i%4)*.1);}
    for(let i=0;i<6;i++){const y=-200+i*520;ctx.save();ctx.translate(-300,y);ctx.rotate(-Math.PI/2);drawCloudBank(0,0,.8);ctx.restore();ctx.save();ctx.translate(WORLD.width+300,y);ctx.rotate(Math.PI/2);drawCloudBank(0,0,.8);ctx.restore();}
  } else if(faction==="Marino"){
    for(let i=0;i<8;i++){const x=-400+i*610;drawPalmIsland(x,-290-(i%3)*28,.8+(i%3)*.12);drawPalmIsland(x,WORLD.height+290,.75+(i%4)*.1);}
    for(let i=0;i<5;i++){const y=-200+i*610;ctx.save();ctx.translate(-300,y);ctx.rotate(-Math.PI/2);drawPalmIsland(0,0,.8);ctx.restore();ctx.save();ctx.translate(WORLD.width+300,y);ctx.rotate(Math.PI/2);drawPalmIsland(0,0,.8);ctx.restore();}
  } else if(faction==="Mago"){
    for(let i=0;i<7;i++){const x=-400+i*680;drawLibraryTower(x,-300-(i%2)*30,.8+(i%3)*.12);drawLibraryTower(x,WORLD.height+300,.78+(i%4)*.1);}
    for(let i=0;i<5;i++){const y=-220+i*610;ctx.save();ctx.translate(-300,y);ctx.rotate(-Math.PI/2);drawLibraryTower(0,0,.78);ctx.restore();ctx.save();ctx.translate(WORLD.width+300,y);ctx.rotate(Math.PI/2);drawLibraryTower(0,0,.78);ctx.restore();}
    for(let i=0;i<24;i++){const x=-500+i*180,y=-120-(i%4)*35;drawFloatingBook(x,y,.45+(i%3)*.1,i*.8);drawFloatingBook(x,WORLD.height+120+(i%3)*24,.4+(i%4)*.08,i*1.2);}
  } else if(faction==="Robot"){
    for(let i=0;i<20;i++){const x=-500+i*230,y=-80-(i%3)*25;drawBinaryMonument(x,y,.7+(i%4)*.1,i);drawBinaryMonument(x,WORLD.height+80,.68+(i%3)*.1,i+30);}
    for(let i=0;i<8;i++){const y=-200+i*390;ctx.save();ctx.translate(-260,y);ctx.rotate(-Math.PI/2);drawBinaryMonument(0,0,.7,i+60);ctx.restore();ctx.save();ctx.translate(WORLD.width+260,y);ctx.rotate(Math.PI/2);drawBinaryMonument(0,0,.7,i+80);ctx.restore();}
  }
  // Silhouette specifiche per fazione: foreste, torri, scogliere, nuvole o cristalli.
  for(let i=0;i<24;i++){
    const x=-650+i*215, y=-95-(seeded(i+4)*85);
    if(faction==="Natura"||faction==="Orso") drawTree(x,y,.72+seeded(i+12)*.48);
    else if(faction==="Robot"){
      ctx.fillStyle=p[1];ctx.font="bold 28px monospace";ctx.textAlign="center";ctx.fillText(i%2?"1010":"0101",x,y-35);ctx.fillStyle=p[3];ctx.fillRect(x-28,y-15,56,5);
    } else if(faction==="Marino"){
      ctx.strokeStyle=p[3];ctx.lineWidth=23;ctx.beginPath();ctx.moveTo(x-100,y-30);ctx.bezierCurveTo(x-45,y-100,x+25,y+10,x+105,y-55);ctx.stroke();
    } else if(faction==="Nuvola"){
      ctx.fillStyle=p[3];for(const [dx,dy,r] of [[-35,-30,45],[10,-55,62],[65,-25,42]]){ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,Math.PI*2);ctx.fill();}
    } else if(faction==="Mago"){
      ctx.save();ctx.translate(x,y-35);ctx.rotate(.18);ctx.fillStyle="#684b91";ctx.fillRect(-25,-18,50,36);ctx.fillStyle="#e5d5ad";ctx.fillRect(-20,-12,40,3);ctx.fillRect(-20,-3,40,3);ctx.fillRect(-20,6,40,3);ctx.restore();
    } else if(faction==="Dolce"){
      ctx.strokeStyle="#fff0d0";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(x-25,y-5);ctx.lineTo(x-25,y-65);ctx.stroke();ctx.fillStyle="#f1a4c2";ctx.beginPath();ctx.arc(x-25,y-75,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff0d0";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-38,y-87);ctx.lineTo(x-12,y-63);ctx.stroke();
    } else if(faction==="Luce"){
      // Piccoli cancelli celesti dorati, con archi, colonne e coppe d'oro.
      ctx.save();
      ctx.translate(x,y);
      ctx.fillStyle="#b99543";ctx.fillRect(-42,-112,10,112);ctx.fillRect(32,-112,10,112);
      ctx.fillStyle="#f4df9a";ctx.fillRect(-48,-118,22,9);ctx.fillRect(26,-118,22,9);
      ctx.strokeStyle="#e8c96c";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-42,-108);ctx.quadraticCurveTo(0,-190,42,-108);ctx.stroke();
      ctx.strokeStyle="#fff0b5";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-33,-110);ctx.quadraticCurveTo(0,-169,33,-110);ctx.stroke();
      ctx.fillStyle="#d9b85c";ctx.fillRect(-52,-8,104,9);
      ctx.fillStyle="#f1d77e";ctx.beginPath();ctx.moveTo(-26,-42);ctx.lineTo(-19,-20);ctx.quadraticCurveTo(0,-10,19,-20);ctx.lineTo(26,-42);ctx.closePath();ctx.fill();
      ctx.strokeStyle="#fff0b5";ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle="#fff1b9";ctx.beginPath();ctx.arc(0,-48,7,0,Math.PI*2);ctx.fill();
      ctx.restore();
    } else if(faction==="Umano"){
      // Industrie carbonifere, ciminiere e fumo scuro: il distretto esterno di Crocevia.
      ctx.save();ctx.translate(x,y);
      ctx.fillStyle="#343337";ctx.fillRect(-55,-92,110,92);
      ctx.fillStyle="#514c4b";ctx.fillRect(-45,-82,90,82);
      ctx.fillStyle="#28272b";ctx.fillRect(-36,-152,24,72);ctx.fillRect(13,-188,28,108);
      ctx.fillStyle="#77706a";ctx.fillRect(-40,-157,32,8);ctx.fillRect(9,-194,32,8);
      ctx.fillStyle="#a49a8d";ctx.fillRect(-50,-45,100,6);ctx.fillRect(-50,-15,100,5);
      ctx.fillStyle="#252329";for(let k=0;k<5;k++){ctx.fillRect(-44+k*21,-70,13,20);}
      ctx.fillStyle="rgba(42,43,47,.55)";for(let k=0;k<4;k++){ctx.beginPath();ctx.arc(-24+k*24,-210-k*20,17+k*3,0,Math.PI*2);ctx.fill();}
      ctx.strokeStyle="#a36a42";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-52,-6);ctx.lineTo(52,-6);ctx.stroke();
      ctx.restore();
    } else if(faction==="Demone"){
      // Piccoli coni vulcanici, con colate incandescenti e pennacchi.
      drawMountain(x,y+30,.52+seeded(i)*.3,true);
    } else {
      ctx.fillStyle=p[2];ctx.beginPath();ctx.moveTo(x-48,y);ctx.lineTo(x-18,y-120-seeded(i)*70);ctx.lineTo(x+10,y-165-seeded(i)*55);ctx.lineTo(x+50,y);ctx.closePath();ctx.fill();
      ctx.fillStyle=p[3];ctx.fillRect(x-4,y-80,9,45);
    }
  }
  // Fascia di foschia e luce di rimbalzo lungo il confine del mondo giocabile.
  const haze=ctx.createLinearGradient(0,-170,0,150);
  haze.addColorStop(0,"rgba(0,0,0,0)");haze.addColorStop(.55,p[3]+"55");haze.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=haze;ctx.fillRect(-40,-170,WORLD.width+80,320);
  ctx.save();ctx.translate(0,WORLD.height);ctx.scale(1,-1);ctx.fillStyle=haze;ctx.fillRect(-40,-170,WORLD.width+80,320);ctx.restore();
}

function circleRectCollision(
  cx,
  cy,
  radius,
  rx,
  ry,
  rw,
  rh
) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);

  return (
    Math.hypot(cx - closestX, cy - closestY) <
    radius
  );
}

function collidesWithCityBuildings(x, y, radius, city) {
  if (city.faction === "Amaro") {
    const scale=1.55;
    const buildings=[
      {x:-137,y:-91,w:88,h:65,door:true},
      {x:139,y:-91,w:72,h:56,door:true},
      {x:-139,y:94,w:72,h:56,door:true},
      {x:139,y:94,w:72,h:56,door:true},
      {x:0,y:166,w:72,h:56,door:true},
      {x:0,y:-163,w:96,h:50,door:false},
      {x:0,y:7,w:130,h:100,door:true},
    ];
    return buildings.some((b)=>{
      const bx=city.x+b.x*scale,by=city.y+b.y*scale,w=b.w*scale,h=b.h*scale;
      const inDoor=b.door&&Math.abs(x-bx)<18*scale&&y>=by+h/2-8*scale&&y<=by+h/2+42*scale;
      if(inDoor)return false;
      return circleRectCollision(x,y,radius,bx-w/2,by-h/2-8*scale,w,h+18*scale);
    });
  }
  const cityScale = 1.55;
  const offsets = [
    [-132, -88], [0, -158], [132, -88],
    [-132, 88], [132, 88], [0, 158],
  ].map(([x, y]) => [x * cityScale, y * cityScale]);
  return offsets.some(([bx, by], index) => {
      const w = (index % 3 === 0 ? 62 : 54) * cityScale;
      const h = (index % 2 === 0 ? 48 : 56) * cityScale;
      const doorX = city.x + bx;
      const buildingBottom = city.y + by + h / 2;
      // Ingresso rivolto a sud: lascia sempre un corridoio libero davanti alla porta.
      const inDoorApproach = Math.abs(x - doorX) < 23 * cityScale &&
        y >= buildingBottom - 4 && y <= buildingBottom + 54 * cityScale;
      if (inDoorApproach) return false;
      return circleRectCollision(
        x,
        y,
        radius,
        doorX - w / 2 - 5,
        city.y + by - h / 2 - 12,
        w + 10,
        h + 31
      );
    });
}

export default function Avventura() {
  const canvasRef = useRef(null);
  const worldFrameRef = useRef(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const { user, isLoadingAuth, authChecked } = useAuth();

  // L'accesso all'Avventura è riservato a chi ha vinto la campagna Arcade completa.
  const accountEmails = [
    user?.email,
    user?.user_metadata?.email,
    user?.app_metadata?.email,
    ...(Array.isArray(user?.identities) ? user.identities.map((identity) => identity?.identity_data?.email) : []),
  ].filter(Boolean).map((email) => String(email).trim().toLowerCase());
  const isPersonalTester = accountEmails.includes("bibitoeuro@gmail.com");
  // Accesso Avventura concesso anche all'account Mangu, senza privilegi extra sulle porte.
  const isManguAccount = accountEmails.includes("manuelylari@gmail.com");

  // Accesso all'Avventura riservato ai vincitori Arcade e agli account autorizzati.
  const testerAllowed =
    user?.user_metadata?.sognatori_arcade_completed === true ||
    isPersonalTester ||
    isManguAccount;
  const personalAllDoorsUnlocked = isPersonalTester;
  const canEnterAmargenta = isPersonalTester;
  // Amargenta non entra nella progressione standard: è una mappa laboratorio privata.
  const availableCities = ADVENTURE_CITIES.filter((city) => city.id !== "amaro");

  /*
    ============================
    REFS PRINCIPALI
    ============================
  */

  const keysRef = useRef({});
  const interactRef = useRef(null);
  const battleOpenRef = useRef(false);
  const setCampaignPause = useCallback((paused) => { battleOpenRef.current = paused; }, []);

  const playerRef = useRef({
    ...PLAYER_START,
  });
  const playerFacingRef = useRef({ x: 0, y: -1 });

  const cameraRef = useRef({
    ...PLAYER_START,
  });

  const initialMap = ADVENTURE_CITIES.find((city) => city.id === "natura") || ADVENTURE_CITIES[0];
  const wildRef = useRef(buildMapWildStarts(initialMap));

  const challengerRef = useRef(
    CHALLENGERS.map((s) => ({
      ...s,
    }))
  );

  /*
    Cooldown reali.
    Usiamo ref perché il game loop gira continuamente
    e non deve dipendere dagli state React.
  */

  const challengerCooldownRef = useRef({});

  /*
    Evitano che il requestAnimationFrame
    apra continuamente la stessa finestra.
  */

  const encounterOpenRef = useRef(false);
  const challengerEncounterOpenRef = useRef(false);

  const lastEntityRenderRef = useRef(0);

  /*
    ============================
    STATE
    ============================
  */

  const [player, setPlayer] = useState(
    playerRef.current
  );
  // Lato da cui il personaggio è appena entrato nella città corrente.
  const [cityEntryDirection, setCityEntryDirection] = useState("north");

const [message, setMessage] = useState("");

  const [dialogue, setDialogue] = useState(null);
  const [interior, setInterior] = useState(null);

  const [encounter, setEncounter] =
    useState(null);

  const [challengerEncounter, setChallengerEncounter] =
    useState(null);

  const adventureSaveKey = "sognatori-adventure-v1-" + (user?.id || user?.email || "guest");
  const readAdventureSave = () => {
    try {
      const raw = localStorage.getItem(adventureSaveKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const [discoveredWildClues, setDiscoveredWildClues] = useState(() => {
    const saved = readAdventureSave();
    return saved?.discoveredWildClues && typeof saved.discoveredWildClues === "object"
      ? saved.discoveredWildClues
      : {};
  });
  const [completedWildTasks, setCompletedWildTasks] = useState(() => {
    const saved = readAdventureSave();
    return saved?.completedWildTasks && typeof saved.completedWildTasks === "object"
      ? saved.completedWildTasks
      : {};
  });

  const [time, setTime] = useState(9);
  const [defeatedLeaders, setDefeatedLeaders] = useState(() => {
    const saved = readAdventureSave();
    const conquered = Array.isArray(saved?.conqueredLeaders) ? saved.conqueredLeaders : [];
    // Bibito ha già completato la campagna: tutte le gemme dei capofazione
    // risultano conquistate sul suo account, senza alterare i progressi altrui.
    return new Set(isPersonalTester
      ? [...conquered, ...ADVENTURE_CITIES.map((city) => city.id)]
      : conquered);
  });
  const [recruitedAdventureIds, setRecruitedAdventureIds] = useState(() => {
    const saved = readAdventureSave();
    return Array.isArray(saved?.adventureRecruitedIds) ? saved.adventureRecruitedIds : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(adventureSaveKey, JSON.stringify({
        ...readAdventureSave(),
        conqueredLeaders: Array.from(defeatedLeaders),
        adventureRecruitedIds: recruitedAdventureIds,
        discoveredWildClues,
        completedWildTasks,
      }));
    } catch (error) {
      console.warn("Impossibile salvare i progressi dell'Avventura:", error);
    }
  }, [adventureSaveKey, defeatedLeaders, recruitedAdventureIds, discoveredWildClues, completedWildTasks]);
  const [activeMapId, setActiveMapId] = useState("natura");
  const activeCityBase = (canEnterAmargenta && activeMapId === "amaro" ? ADVENTURE_CITIES.find((city) => city.id === "amaro") : availableCities.find((city) => city.id === activeMapId)) || availableCities.find((city) => city.id === "natura") || ADVENTURE_CITIES[0];
  const activeLore = ADVENTURE_FACTION_LORE[activeMapId] || {};
  const activeCity = { ...activeCityBase, ...activeLore, x: 1800, y: 1200 };
  const cityNpcCharacters = buildOutdoorNPCs(activeCityBase, activeLore, time);
  const activeWildAreaBase = ADVENTURE_WILD_AREAS.find((area) => area.faction === activeCity.faction) || ADVENTURE_WILD_AREAS[0];
  const activeWildArea = { ...activeWildAreaBase, x: 1800, y: 760 };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("sognatori-music-mode", {
      detail: {
        mode: "adventure",
        cityId: activeMapId,
        entryDirection: cityEntryDirection,
      },
    }));
  }, [activeMapId, cityEntryDirection]);

  useEffect(() => {
    wildRef.current = buildMapWildStarts(activeCityBase);
    // Il capo presidia il sentiero meridionale, davanti alla porta della zona successiva.
    challengerRef.current = CHALLENGERS
      .filter((challenger) => challenger.id === activeMapId)
      .map((challenger) => ({ ...challenger, x: 1800, y: 1900 }));
    challengerCooldownRef.current = {};
  }, [activeMapId]);

  const zone = useMemo(() => {
    const nearbyLoreSite = wildRef.current.find((wild) =>
      wild.recruitable && Math.hypot(player.x - wild.siteX, player.y - wild.siteY) <= 170
    );
    if (nearbyLoreSite) {
      return { ...activeWildArea, name: nearbyLoreSite.loreSite, kind: "wild" };
    }
    const wildArea = activeWildArea;
    if (Math.hypot(player.x - wildArea.x, player.y - wildArea.y) <= wildArea.radius) {
      return { ...wildArea, name: wildArea.name, kind: "wild" };
    }
    if (Math.hypot(player.x - 1800, player.y - 1200) <= 620) {
      return { ...activeCity, name: "Città di " + activeCity.city, kind: "city" };
    }

    return (
      ZONES.find(
        (z) =>
          player.x >= z.x &&
          player.x < z.x + z.w &&
          player.y >= z.y &&
          player.y < z.y + z.h
      ) || ZONES[0]
    );
  }, [player, activeMapId]);

  /*
    ============================
    KEYBOARD
    ============================
  */

  useEffect(() => {
    const down = (e) => {
      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();

      keysRef.current[key] = true;
      keysRef.current[code] = true;

      if (key === "e" && !e.repeat) {
        e.preventDefault();
        interactRef.current?.();
      }

      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
        ].includes(key)
      ) {
        e.preventDefault();
      }
    };

    const up = (e) => {
      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();

      keysRef.current[key] = false;
      keysRef.current[code] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /*
    ============================
    GAME LOOP
    ============================
  */

  useEffect(() => {
    let animation;

    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min(
        (now - last) / 1000,
        0.05
      );

      last = now;

      if (battleOpenRef.current || encounterOpenRef.current || challengerEncounterOpenRef.current || interior) {
        animation = requestAnimationFrame(loop);
        return;
      }

      const keys = keysRef.current;

      let dx = 0;
      let dy = 0;

      /*
        MOVIMENTO
      */

      if (
        keys.w ||
        keys.keyw ||
        keys.arrowup
      ) {
        dy -= 1;
      }

      if (
        keys.s ||
        keys.keys ||
        keys.arrowdown
      ) {
        dy += 1;
      }

      if (
        keys.a ||
        keys.keya ||
        keys.arrowleft
      ) {
        dx -= 1;
      }

      if (
        keys.d ||
        keys.keyd ||
        keys.arrowright
      ) {
        dx += 1;
      }

      if (dx || dy) {
        const length = Math.hypot(dx, dy);

        dx /= length;
        dy /= length;
        playerFacingRef.current = { x: dx, y: dy };

        const movement =
          PLAYER.speed * dt;

        const next = {
          x: clamp(
            playerRef.current.x +
              dx * movement,
            30,
            WORLD.width - 30
          ),

          y: clamp(
            playerRef.current.y +
              dy * movement,
            30,
            WORLD.height - 30
          ),
        };

        let blocked = false;

        /*
          ALBERI
        */

        for (const tree of WORLD_OBJECTS.trees) {
          if (
            Math.hypot(
              next.x - tree.x,
              next.y - tree.y
            ) <
            tree.r +
              PLAYER.size * 0.45
          ) {
            blocked = true;
            break;
          }
        }

        /*
          ROCCE
        */

        if (!blocked) {
          for (const rock of WORLD_OBJECTS.rocks) {
            if (
              Math.hypot(
                next.x - rock.x,
                next.y - rock.y
              ) <
              rock.r +
                PLAYER.size * 0.45
            ) {
              blocked = true;
              break;
            }
          }
        }

        // I Sognatori sono creature fisiche: il primo dorme sul sentiero come un
        // guardiano vivente. Non si attraversa il suo corpo: bisogna avvicinarsi e interagire.
        if (!blocked) {
          for (const wild of wildRef.current) {
            const bodyRadius = wild.isSleepingBlocker ? 78 : 34;
            if (Math.hypot(next.x - wild.x, next.y - wild.y) < bodyRadius + PLAYER.size * 0.45) {
              blocked = true;
              break;
            }
          }
        }

        /*
          EDIFICI DELLE UNDICI CITTÀ
        */

        if (!blocked && collidesWithCityBuildings(next.x, next.y, PLAYER.size * 0.45, activeCity)) {
          blocked = true;
        }

        // Amargenta: i dislivelli si attraversano soltanto seguendo le rampe.
        if (!blocked && activeMapId === "amaro" &&
          !canTraverseAmaroElevation(playerRef.current.x, playerRef.current.y, next.x, next.y)) {
          blocked = true;
        }

        // Nessuna collisione residua del vecchio lago: il centro città è attraversabile.

        /*
          MOVIMENTO REALE
        */

        if (!blocked) {
          playerRef.current = next;

          setPlayer({
            ...next,
          });

        }
      }

      /*
        SOGNATORI SELVATICI E SFIDANTI STATICI.
        Le coordinate iniziali restano fisse: si muove soltanto il giocatore.
      */

      // Gli incontri non partono più automaticamente:
      // il giocatore sceglie quando interagire premendo E.
      /*
        ============================
        CAMERA
        ============================
      */

      const target =
        playerRef.current;

      cameraRef.current.x +=
        (target.x -
          cameraRef.current.x) *
        0.1;

      cameraRef.current.y +=
        (target.y -
          cameraRef.current.y) *
        0.1;

      /*
        ============================
        TEMPO
        ============================
      */

      setTime(
        (t) =>
          (t + dt * 0.03) % 24
      );

      animation =
        requestAnimationFrame(loop);
    };

    animation =
      requestAnimationFrame(loop);

    return () =>
      cancelAnimationFrame(
        animation
      );
  }, [interior]);

  /*
    ============================
    CANVAS RENDER
    ============================
  */

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    const dpr =
      window.devicePixelRatio ||
      1;

    const resize = () => {
      const frame = worldFrameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
      const pixelHeight = Math.max(1, Math.round(rect.height * dpr));

      // Cambiare canvas.width/height cancella il buffer: farlo solo
      // quando la misura reale è cambiata evita flash neri a ogni render.
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    };

    resize();

    window.addEventListener(
      "resize",
      resize
    );
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : null;
    if (worldFrameRef.current) resizeObserver?.observe(worldFrameRef.current);

    let frame;

    const draw = () => {
      const worldFrame = worldFrameRef.current;
      if (!worldFrame) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const rect = worldFrame.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(
        0,
        0,
        w,
        h
      );

      const cam =
        cameraRef.current;

      const scale = Math.min(w / 1100, h / 825);
      // Amargenta adotta una proiezione obliqua dimetrica; le altre mappe
      // mantengono esattamente la camera ortogonale precedente.
      const amaroProjection = activeMapId === "amaro"
        ? { xx: 1, xy: 0.18, yx: 0.48, yy: 0.82 }
        : null;
      const projectedCameraX = amaroProjection
        ? amaroProjection.xx * cam.x + amaroProjection.yx * cam.y
        : cam.x;
      const projectedCameraY = amaroProjection
        ? amaroProjection.xy * cam.x + amaroProjection.yy * cam.y
        : cam.y;

      const offsetX = w / 2 - projectedCameraX * scale;
      const offsetY = h / 2 - projectedCameraY * scale;

      ctx.save();

      ctx.translate(
        offsetX,
        offsetY
      );

      ctx.scale(
        scale,
        scale
      );
      if (amaroProjection) {
        ctx.transform(
          amaroProjection.xx,
          amaroProjection.xy,
          amaroProjection.yx,
          amaroProjection.yy,
          0,
          0
        );
      }

      /*
        MONDO
      */

      // Decorazione tematica oltre i confini: area non esplorabile, mai vuota o nera.
      drawFactionBorderTerrain(ctx, activeCity.faction);

      ctx.fillStyle =
        "#203b29";

      ctx.fillRect(
        0,
        0,
        WORLD.width,
        WORLD.height
      );

      /*
        ZONE
      */

      for (const z of ZONES) {
        ctx.fillStyle =
          z.color;

        ctx.globalAlpha =
          0.82;

        ctx.fillRect(
          z.x,
          z.y,
          z.w,
          z.h
        );
      }

      ctx.globalAlpha = 1;

      // Dettaglio del terreno a tile GBA.
      drawGroundTiles(ctx, cam, w, h, scale, activeCity.faction);

      /* SENTIERI: bordi d'erba, terra calda e tracce di ghiaia. */
      const pathPalettes = {
        Robot: ["#4f5b65", "#8b969f", "#d4d9de", "#aeb8c1"],
        Salato: ["#80565d", "#c98e91", "#e8c5c2", "#b9787e"],
        Dolce: ["#815333", "#c89a62", "#e5c18a", "#b77b45"],
        Nuvola: ["#aabac8", "#e3edf4", "#ffffff", "#d3e2ec"],
        Umano: ["#292c31", "#55585d", "#858b91", "#41454b"],
      };
      const [pathShadow, pathMain, pathLight, pathDetail] =
        pathPalettes[activeCity.faction] || ["#66513d", "#92744b", "#c7a56a", "#a68a61"];
      const paths = [
        { x: 0, y: 1002, w: WORLD.width, h: 116, horizontal: true },
        { x: 1732, y: 0, w: 136, h: WORLD.height, horizontal: false },
        { x: 792, y: 542, w: 2116, h: 86, horizontal: true },
      ];
      for (const path of paths) {
        ctx.fillStyle = pathShadow;
        ctx.fillRect(path.x, path.y, path.w, path.h);
        ctx.fillStyle = pathMain;
        ctx.fillRect(path.x, path.y + 5, path.w, path.h - 10);
        ctx.fillStyle = pathLight;
        ctx.fillRect(path.x, path.y + 9, path.w, path.h - 18);
        ctx.fillStyle = pathDetail;
        ctx.fillRect(path.x, path.y + 12, path.w, 5);
        ctx.fillStyle = pathShadow;
        ctx.fillRect(path.x, path.y + path.h - 15, path.w, 5);

        const step = 54;
        for (let n = 0; n < (path.horizontal ? path.w : path.h); n += step) {
          const px = path.horizontal ? path.x + n + ((n / step) % 2) * 9 : path.x + 24 + (n % 3) * 18;
          const py = path.horizontal ? path.y + 25 + (n % 3) * 17 : path.y + n + ((n / step) % 2) * 8;
          ctx.fillStyle = pathDetail;
          ctx.fillRect(px, py, 7, 3);
          ctx.fillStyle = pathShadow;
          ctx.fillRect(px + 13, py + 10, 5, 3);
        }
      }

      /* Nessun lago decorativo: le aree d'acqua non bloccano più l'esplorazione. */

      /*
        EDIFICI RIMOSSI
        Le case non esplorabili sono state eliminate dal mondo.
      */

      /*
        ALBERI
      */

      if (activeMapId !== "amaro") {
        for (const tree of WORLD_OBJECTS.trees) {
          drawTree(ctx, tree.x, tree.y, tree.r, activeCity.faction);
        }
      }

      // Dodici distretti abitati: piazza centrale, mura, strade e architetture di fazione.
      if (activeCity.faction !== "Nuvola") {
        drawCityDistrict(ctx, activeCity);
      }
      if (activeCity.faction !== "Natura") {
        drawAdventureFactionCity(ctx, activeCity);
      }
      drawCityLandmark(ctx, activeCity);
      drawAdventureFactionCityLife(ctx, activeCity);
      // Elementi ambientali distintivi: bambù, querce, cascate, caramelle e monumenti di fazione.
      ctx.save();
      ctx.translate(1800, 1200);
      drawAdventureCitySpecials(ctx, activeCity.faction, time);
      ctx.restore();

      // Soltanto il bioma della fazione attualmente caricata.
      drawWildArea(ctx, activeWildArea);

      // Portale di collegamento: ogni mappa conduce alla successiva.
      const currentLeaderDefeated = defeatedLeaders.has(activeMapId);
      const canUseCityDoors = personalAllDoorsUnlocked || currentLeaderDefeated;
      if (activeMapId !== "amaro") {
        drawAdventureDoor(ctx, MAP_DOOR.x, MAP_DOOR.y, activeCity.color,
          canUseCityDoors ? "PORTA · " + nextCityName(activeMapId, availableCities) : "BLOCCATA · " + nextCityName(activeMapId, availableCities),
          0, !canUseCityDoors);
        drawAdventureDoor(ctx, MAP_NORTH_DOOR.x, MAP_NORTH_DOOR.y, activeCity.color,
          personalAllDoorsUnlocked ? "PORTA · " + previousCityName(activeMapId, availableCities) : "BLOCCATA · " + previousCityName(activeMapId, availableCities),
          Math.PI, !personalAllDoorsUnlocked);
      }

      // Porta segreta occidentale di Verdelume, visibile ma accessibile solo a Bibito.
      if (activeMapId === "natura") {
        drawAdventureDoor(ctx, AMARGENTA_DOOR.x, AMARGENTA_DOOR.y, "#a7c7b5",
          canEnterAmargenta ? "AMARGENTA · BIBITO" : "SIGILLATA · AMARGENTA",
          -Math.PI / 2, !canEnterAmargenta);
      }
      if (activeMapId === "amaro") {
        drawAdventureDoor(ctx, AMARGENTA_DOOR.x, AMARGENTA_DOOR.y, "#a7c7b5", "USCITA · VERDELUME", -Math.PI / 2, false);
      }

      /*        ROCCE
      */

      if (activeMapId !== "amaro") {
        const rockPalettes = {
          Demone: ["#452d38", "#8d4650", "#d06a54"],
          Robot: ["#4f5b65", "#8b969f", "#d4d9de"],
          Natura: ["#3e4548", "#727b7b", "#9da09a"],
          Nuvola: ["#aabac8", "#e3edf4", "#ffffff"],
          Umano: ["#292c31", "#55585d", "#858b91"],
          Luce: ["#796039", "#c09a4c", "#f4d887"],
          Dolce: ["#815333", "#c89a62", "#e5c18a"],
          Marino: ["#294d60", "#4b8795", "#9bd1d0"],
          Orso: ["#49372b", "#806044", "#b9915c"],
          Mago: ["#3d3655", "#776b9d", "#c1b2e8"],
          Salato: ["#80565d", "#c98e91", "#e8c5c2"],
        };
        const [rockShadow, rockMid, rockLight] = rockPalettes[activeCity.faction] || rockPalettes.Natura;
        for (const rock of WORLD_OBJECTS.rocks) {
          ctx.save();
          ctx.translate(Math.round(rock.x / 3) * 3, Math.round(rock.y / 3) * 3);
          ctx.fillStyle = "rgba(9,15,18,.28)";
          ctx.beginPath(); ctx.ellipse(3, rock.r * .62, rock.r * 1.25, rock.r * .42, 0, 0, Math.PI * 2); ctx.fill();
  
          ctx.fillStyle = rockShadow;
          ctx.beginPath();
          ctx.moveTo(-rock.r * 1.1, rock.r * .35);
          ctx.lineTo(-rock.r * .8, -rock.r * .35);
          ctx.lineTo(-rock.r * .18, -rock.r);
          ctx.lineTo(rock.r * .52, -rock.r * .72);
          ctx.lineTo(rock.r * 1.12, rock.r * .2);
          ctx.lineTo(rock.r * .72, rock.r * .7);
          ctx.closePath(); ctx.fill();
  
          ctx.fillStyle = rockMid;
          ctx.beginPath();
          ctx.moveTo(-rock.r * .8, -rock.r * .35);
          ctx.lineTo(-rock.r * .18, -rock.r);
          ctx.lineTo(rock.r * .1, -rock.r * .16);
          ctx.lineTo(-rock.r * .2, rock.r * .12);
          ctx.closePath(); ctx.fill();
  
          ctx.fillStyle = rockLight;
          ctx.fillRect(-rock.r * .16, -rock.r * .82, Math.max(3, rock.r * .22), Math.max(3, rock.r * .16));
          ctx.fillStyle = rockShadow;
          ctx.fillRect(rock.r * .48, -rock.r * .35, Math.max(3, rock.r * .18), Math.max(3, rock.r * .28));
          ctx.fillStyle = "rgba(255,255,255,.28)";
          ctx.fillRect(-rock.r * .58, rock.r * .08, Math.max(3, rock.r * .2), 3);
          ctx.restore();
        }
  
      }
      if (activeMapId === "amaro") {
        // Inversa della matrice dimetrica: gli sprite restano verticali
        // mentre il terreno e l'architettura seguono la camera obliqua.
        const inv = { a:1.117, b:-0.245, c:-0.654, d:1.363 };
        const drawUprightAt = (x,y,draw) => {
          ctx.save();
          ctx.translate(x,y);
          ctx.transform(inv.a,inv.b,inv.c,inv.d,0,0);
          draw();
          ctx.restore();
        };
        const depthOf = (x,y) => 0.18*x + 0.82*y;
        const depthQueue = [];
        const enqueue = (x,y,draw) => depthQueue.push({ depth:depthOf(x,y), draw });

        // Alberi e rocce partecipano allo stesso ordinamento degli attori:
        // il protagonista può passare dietro o davanti a ogni elemento.
        for (const tree of WORLD_OBJECTS.trees) {
          enqueue(tree.x,tree.y,()=>drawUprightAt(tree.x,tree.y,()=>drawTree(ctx,0,0,tree.r,activeCity.faction)));
        }
        const rockPalettes = {
          Demone:["#452d38","#8d4650","#d06a54"], Robot:["#4f5b65","#8b969f","#d4d9de"],
          Natura:["#3e4548","#727b7b","#9da09a"], Nuvola:["#aabac8","#e3edf4","#ffffff"],
          Umano:["#292c31","#55585d","#858b91"], Luce:["#796039","#c09a4c","#f4d887"],
          Dolce:["#815333","#c89a62","#e5c18a"], Marino:["#294d60","#4b8795","#9bd1d0"],
          Orso:["#49372b","#806044","#b9915c"], Mago:["#3d3655","#776b9d","#c1b2e8"],
          Salato:["#80565d","#c98e91","#e8c5c2"],
        };
        const [rockShadow,rockMid,rockLight]=rockPalettes[activeCity.faction]||rockPalettes.Natura;
        for (const rock of WORLD_OBJECTS.rocks) {
          enqueue(rock.x,rock.y,()=>drawUprightAt(rock.x,rock.y,()=>{
            ctx.save();
            ctx.translate(Math.round(rock.x/3)*3-rock.x,Math.round(rock.y/3)*3-rock.y);
            ctx.fillStyle="rgba(9,15,18,.28)";
            ctx.beginPath();ctx.ellipse(3,rock.r*.62,rock.r*1.25,rock.r*.42,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=rockShadow;ctx.beginPath();
            ctx.moveTo(-rock.r*1.1,rock.r*.35);ctx.lineTo(-rock.r*.8,-rock.r*.35);
            ctx.lineTo(-rock.r*.18,-rock.r);ctx.lineTo(rock.r*.52,-rock.r*.72);
            ctx.lineTo(rock.r*1.12,rock.r*.2);ctx.lineTo(rock.r*.72,rock.r*.7);ctx.closePath();ctx.fill();
            ctx.fillStyle=rockMid;ctx.beginPath();
            ctx.moveTo(-rock.r*.8,-rock.r*.35);ctx.lineTo(-rock.r*.18,-rock.r);
            ctx.lineTo(rock.r*.1,-rock.r*.16);ctx.lineTo(-rock.r*.2,rock.r*.12);ctx.closePath();ctx.fill();
            ctx.fillStyle=rockLight;ctx.fillRect(-rock.r*.16,-rock.r*.82,Math.max(3,rock.r*.22),Math.max(3,rock.r*.16));
            ctx.fillStyle=rockShadow;ctx.fillRect(rock.r*.48,-rock.r*.35,Math.max(3,rock.r*.18),Math.max(3,rock.r*.28));
            ctx.fillStyle="rgba(255,255,255,.28)";ctx.fillRect(-rock.r*.58,rock.r*.08,Math.max(3,rock.r*.2),3);
            ctx.restore();
          }));
        }

        const spriteFrame=Math.floor(performance.now()/250)%4;
        const drawnLoreSites=new Set();
        for (const wild of wildRef.current) {
          if (!drawnLoreSites.has(wild.rosterId)) {
            drawnLoreSites.add(wild.rosterId);
            drawSognatoreHabitat(ctx,wild.rosterId,activeCity.faction,wild.habitatX,wild.habitatY,wild.loreSite,wild.cornerIndex);
          }
          const creature=ROSTER.find(entry=>entry.id===wild.rosterId);
          if (!creature) continue;
          const playerDx=playerRef.current.x-wild.x,playerDy=playerRef.current.y-wild.y;
          const wildFacing=Math.abs(playerDx)>Math.abs(playerDy)
            ? (playerDx<0?"left":"right") : (playerDy<0?"up":"down");
          enqueue(wild.x,wild.y,()=>drawUprightAt(wild.x,wild.y,()=>{
            drawOverworldSognatore(ctx,creature,0,0,spriteFrame,wild.isSleepingBlocker,wildFacing);
            if(wild.isSleepingBlocker){
              const phase=performance.now()/620;
              ctx.save();ctx.globalAlpha=.72+Math.sin(phase)*.18;
              ctx.font="bold 24px monospace";ctx.textAlign="center";ctx.fillStyle="#e9f1ff";
              ctx.shadowColor="#9cc8ff";ctx.shadowBlur=10;
              ctx.fillText("Z",42,-118-Math.sin(phase)*4);
              ctx.font="bold 15px monospace";ctx.fillText("Z",61,-140-Math.sin(phase+1)*4);
              ctx.restore();
            }
            if(wild.recruitable){
              ctx.save();ctx.font="bold 22px monospace";ctx.textAlign="center";
              ctx.fillStyle="#ffe58a";ctx.shadowColor="#ffbf45";ctx.shadowBlur=12;
              ctx.fillText("✦",0,-105);ctx.restore();
            }
            if(Math.hypot(playerRef.current.x-wild.x,playerRef.current.y-wild.y)<190){
              ctx.save();ctx.font="bold 15px monospace";ctx.textAlign="center";
              const labelWidth=ctx.measureText(wild.name).width+26;
              ctx.fillStyle="rgba(8,16,13,.9)";ctx.fillRect(-labelWidth/2,-94,labelWidth,27);
              ctx.fillStyle="#fff5dc";ctx.fillText(wild.name,0,-75);ctx.restore();
            }
          }));
        }

        for (const travelerData of CHALLENGERS.filter(item=>item.id===activeMapId)) {
          const traveler={...travelerData,x:1800,y:1900};
          const frame=Math.floor(performance.now()/270)%4;
          const faceX=playerRef.current.x-traveler.x,faceY=playerRef.current.y-traveler.y;
          const facing=Math.abs(faceX)>Math.abs(faceY)?(faceX<0?"left":"right"):(faceY<0?"up":"down");
          enqueue(traveler.x,traveler.y,()=>drawUprightAt(traveler.x,traveler.y,()=>{
            drawAdventureTraveler(ctx,traveler.traveler||traveler.name,traveler.faction,0,0,frame,1,facing);
            if(Math.hypot(playerRef.current.x-traveler.x,playerRef.current.y-traveler.y)<220){
              ctx.save();ctx.font="bold 14px monospace";ctx.textAlign="center";
              const labelWidth=ctx.measureText(traveler.traveler||traveler.name).width+24;
              ctx.fillStyle="rgba(8,16,13,.9)";ctx.fillRect(-labelWidth/2,-108,labelWidth,25);
              ctx.fillStyle="#fff0c8";ctx.fillText(traveler.traveler||traveler.name,0,-90);ctx.restore();
            }
          }));
        }

        for (const npc of cityNpcCharacters) {
          enqueue(npc.x,npc.y,()=>drawUprightAt(npc.x,npc.y,()=>drawNpc(ctx,{...npc,x:0,y:0})));
        }

        const playerIsWalking=!!(
          keysRef.current.w||keysRef.current.a||keysRef.current.s||keysRef.current.d||
          keysRef.current.arrowup||keysRef.current.arrowdown||keysRef.current.arrowleft||keysRef.current.arrowright
        );
        const playerElevation=getAmaroElevationAt(playerRef.current.x,playerRef.current.y);
        enqueue(playerRef.current.x,playerRef.current.y,()=>drawUprightAt(playerRef.current.x,playerRef.current.y,()=>{
          ctx.translate(0,-playerElevation);
          drawPlayer(ctx,{x:0,y:0},playerFacingRef.current,Math.floor(performance.now()/135)%4,playerIsWalking);
        }));

        depthQueue.sort((a,b)=>a.depth-b.depth);
        for(const item of depthQueue) item.draw();

        // Le facciate anteriori vengono ridisegnate per occludere gli attori
        // che si trovano fisicamente dietro agli edifici.
        drawAdventureAmaroOccluders(ctx,activeCity,playerRef.current.y);

        // Etichetta di zona leggibile, non inclinata dalla proiezione.
        drawUprightAt(playerRef.current.x,playerRef.current.y,()=>{
          ctx.fillStyle="rgba(0,0,0,.35)";
          ctx.beginPath();ctx.roundRect(-180,-120,360,50,20);ctx.fill();
          ctx.fillStyle="#fff";ctx.font="700 27px system-ui";ctx.textAlign="center";
          ctx.fillText(zone.name,0,-88);
        });
      } else {
      /*
        SOGNATORI NPC
        Gli artwork ufficiali vengono disegnati nel mondo, non in un layer HTML
        separato: così condividono scala, camera e profondità con il giocatore.
      */
      const spriteFrame = Math.floor(performance.now() / 250) % 4;
      const labeledWildNames = new Set();
      const drawnLoreSites = new Set();
      for (const wild of wildRef.current) {
        const siteKey = wild.rosterId;
        if (!drawnLoreSites.has(siteKey)) {
          drawnLoreSites.add(siteKey);
          drawSognatoreHabitat(ctx, wild.rosterId, activeCity.faction, wild.habitatX, wild.habitatY, wild.loreSite, wild.cornerIndex);
        }
        const wildKey = activeMapId + ":" + wild.rosterId;

        const creature = ROSTER.find((entry) => entry.id === wild.rosterId);
        if (!creature) continue;
        const playerDx = playerRef.current.x - wild.x;
        const playerDy = playerRef.current.y - wild.y;
        const wildFacing = Math.abs(playerDx) > Math.abs(playerDy) ? (playerDx < 0 ? "left" : "right") : (playerDy < 0 ? "up" : "down");
        drawOverworldSognatore(ctx, creature, wild.x, wild.y, spriteFrame, wild.isSleepingBlocker, wildFacing);
        if (wild.isSleepingBlocker) {
          const sleepPhase = performance.now() / 620;
          ctx.save();
          ctx.globalAlpha = 0.72 + Math.sin(sleepPhase) * 0.18;
          ctx.font = "bold 24px monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = "#e9f1ff";
          ctx.shadowColor = "#9cc8ff";
          ctx.shadowBlur = 10;
          ctx.fillText("Z", wild.x + 42, wild.y - 118 - Math.sin(sleepPhase) * 4);
          ctx.font = "bold 15px monospace";
          ctx.fillText("Z", wild.x + 61, wild.y - 140 - Math.sin(sleepPhase + 1) * 4);
          ctx.restore();
        }
        if (wild.recruitable) {
          ctx.save(); ctx.font = "bold 22px monospace"; ctx.textAlign = "center";
          ctx.fillStyle = "#ffe58a"; ctx.shadowColor = "#ffbf45"; ctx.shadowBlur = 12;
          ctx.fillText("✦", wild.x, wild.y - 105); ctx.restore();
        }
        if (!labeledWildNames.has(wild.rosterId) && Math.hypot(playerRef.current.x - wild.x, playerRef.current.y - wild.y) < 190) {
          labeledWildNames.add(wild.rosterId);
          ctx.save();
          ctx.font = "bold 15px monospace";
          ctx.textAlign = "center";
          const labelWidth = ctx.measureText(wild.name).width + 26;
          ctx.fillStyle = "rgba(8,16,13,.9)";
          ctx.fillRect(wild.x - labelWidth / 2, wild.y - 94, labelWidth, 27);
          ctx.fillStyle = "#fff5dc";
          ctx.fillText(wild.name, wild.x, wild.y - 75);
          ctx.restore();
        }
      }

      for (const travelerData of CHALLENGERS.filter((item) => item.id === activeMapId)) {
        const traveler = { ...travelerData, x: 1800, y: 1900 };
        const travelerFrame = Math.floor(performance.now() / 270) % 4;
        const faceX = playerRef.current.x - traveler.x;
        const faceY = playerRef.current.y - traveler.y;
        const facing = Math.abs(faceX) > Math.abs(faceY) ? (faceX < 0 ? "left" : "right") : (faceY < 0 ? "up" : "down");
        drawAdventureTraveler(ctx, traveler.traveler || traveler.name, traveler.faction, traveler.x, traveler.y, travelerFrame, 1, facing);
        if (Math.hypot(playerRef.current.x - traveler.x, playerRef.current.y - traveler.y) < 220) {
          ctx.save();
          ctx.font = "bold 14px monospace";
          ctx.textAlign = "center";
          const labelWidth = ctx.measureText(traveler.traveler || traveler.name).width + 24;
          ctx.fillStyle = "rgba(8,16,13,.9)";
          ctx.fillRect(traveler.x - labelWidth / 2, traveler.y - 108, labelWidth, 25);
          ctx.fillStyle = "#fff0c8";
          ctx.fillText(traveler.traveler || traveler.name, traveler.x, traveler.y - 90);
          ctx.restore();
        }
      }

      /*
        NPC
      */

      for (const npc of cityNpcCharacters) {
        drawNpc(ctx, npc);
      }

      /*
        PLAYER
      */

      const playerIsWalking = !!(
        keysRef.current.w || keysRef.current.a || keysRef.current.s || keysRef.current.d ||
        keysRef.current.arrowup || keysRef.current.arrowdown ||
        keysRef.current.arrowleft || keysRef.current.arrowright
      );
      const playerElevation = activeMapId === "amaro"
        ? getAmaroElevationAt(playerRef.current.x, playerRef.current.y)
        : 0;
      drawPlayer(
        ctx,
        { ...playerRef.current, y: playerRef.current.y - playerElevation },
        playerFacingRef.current,
        Math.floor(performance.now() / 135) % 4,
        playerIsWalking
      );
      if (activeMapId === "amaro") {
        drawAdventureAmaroOccluders(ctx, activeCity, playerRef.current.y);
      }


      }

      /*
        ZONE LABEL
      */

      ctx.fillStyle =
        "rgba(0,0,0,.35)";

      ctx.roundRect(
        playerRef.current.x -
          180,
        playerRef.current.y -
          120,
        360,
        50,
        20
      );

      ctx.fill();

      ctx.fillStyle =
        "#fff";

      ctx.font =
        "700 27px system-ui";

      ctx.textAlign =
        "center";

      ctx.fillText(
        zone.name,
        playerRef.current.x,
        playerRef.current.y -
          88
      );

      ctx.restore();

      /*
        NOTTE
      */

      const night =
        time > 20 ||
        time < 6
          ? 0.46
          : time > 18
          ? ((time - 18) /
              2) *
            0.46
          : 0;

      if (night > 0) {
        ctx.fillStyle =
          `rgba(8,15,40,${night})`;

        ctx.fillRect(
          0,
          0,
          w,
          h
        );
      }

      frame =
        requestAnimationFrame(
          draw
        );
    };

    frame =
      requestAnimationFrame(
        draw
      );

    return () => {
      cancelAnimationFrame(
        frame
      );

      window.removeEventListener(
        "resize",
        resize
      );
      resizeObserver?.disconnect();
    };
  }, [
    player,
    zone,
    time,
    activeMapId,
    discoveredWildClues,
    completedWildTasks,
    defeatedLeaders,
    personalAllDoorsUnlocked,
  ]);

  /*
    ============================
    INTERAZIONE NPC
    ============================
  */

  const interact = () => {
    if (dialogue || encounter || challengerEncounter || interior || battleOpenRef.current) return;

    const currentPosition = playerRef.current;
    const interactionRadius = 105;

    // Porta segreta occidentale: accesso e ritorno sono gestiti prima delle altre interazioni.
    const amargentaDoorDistance = Math.hypot(currentPosition.x - AMARGENTA_DOOR.x, currentPosition.y - AMARGENTA_DOOR.y);
    if ((activeMapId === "natura" || activeMapId === "amaro") && amargentaDoorDistance < 136) {
      if (activeMapId === "natura") {
        if (!canEnterAmargenta) {
          setMessage("Il sigillo riconosce soltanto Bibito. La porta resta chiusa.");
          setTimeout(() => setMessage(""), 2600);
          return;
        }
        setActiveMapId("amaro");
        playerRef.current = { ...AMARGENTA_SPAWN };
        cameraRef.current = { ...AMARGENTA_SPAWN };
        setPlayer({ ...AMARGENTA_SPAWN });
        setMessage("Il sigillo si apre. Benvenuto ad Amargenta, Bibito.");
        setTimeout(() => setMessage(""), 2600);
        return;
      }
      setActiveMapId("natura");
      playerRef.current = { ...AMARGENTA_SPAWN };
      cameraRef.current = { ...AMARGENTA_SPAWN };
      setPlayer({ ...AMARGENTA_SPAWN });
      setMessage("Sei tornato a Verdelume.");
      setTimeout(() => setMessage(""), 2200);
      return;
    }

    // Le porte hanno priorità sugli NPC: un personaggio vicino non deve intercettare l'interazione.
    if (Math.hypot(currentPosition.x - MAP_DOOR.x, currentPosition.y - MAP_DOOR.y) < MAP_DOOR.radius + 42) {
      if (!personalAllDoorsUnlocked && !defeatedLeaders.has(activeMapId)) {
        const leader = CHALLENGERS.find((challenger) => challenger.id === activeMapId);
        setMessage("La strada è sbarrata da " + (leader?.name || "il Capo fazione") + ". Sconfiggilo per proseguire.");
        setTimeout(() => setMessage(""), 2600);
        return;
      }
      const currentIndex = availableCities.findIndex((city) => city.id === activeMapId);
      const nextCity = availableCities[(currentIndex + 1) % availableCities.length];
      setCityEntryDirection("north");
      setActiveMapId(nextCity.id);
      playerRef.current = { ...MAP_SPAWN };
      cameraRef.current = { ...MAP_SPAWN };
      setPlayer({ ...MAP_SPAWN });
      setMessage("Ingresso a " + nextCity.city + " · " + nextCity.faction);
      setTimeout(() => setMessage(""), 2200);
      return;
    }

    if (Math.hypot(currentPosition.x - MAP_NORTH_DOOR.x, currentPosition.y - MAP_NORTH_DOOR.y) < MAP_NORTH_DOOR.radius + 42) {
      if (personalAllDoorsUnlocked) {
        const currentIndex = availableCities.findIndex((city) => city.id === activeMapId);
        const previousCity = availableCities[(currentIndex - 1 + availableCities.length) % availableCities.length];
        setCityEntryDirection("south");
        setActiveMapId(previousCity.id);
        playerRef.current = { ...MAP_SOUTH_SPAWN };
        cameraRef.current = { ...MAP_SOUTH_SPAWN };
        setPlayer({ ...MAP_SOUTH_SPAWN });
        setMessage("Ingresso a " + previousCity.city + " · " + previousCity.faction);
        setTimeout(() => setMessage(""), 2200);
        return;
      }
      setMessage("Porta nord sigillata. La progressione avviene solo verso sud, dopo aver sconfitto il Capo fazione.");
      setTimeout(() => setMessage(""), 2800);
      return;
    }

    const nearestNpc = cityNpcCharacters
      .map((npc) => ({ ...npc, interactionDistance: distance(currentPosition, npc) }))
      .filter((npc) => npc.interactionDistance < interactionRadius)
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestNpc) {
      setDialogue(nearestNpc);
      return;
    }

    // Elementi distintivi della città: interazione narrativa dedicata con il tasto E.
    const citySpecials = ADVENTURE_CITY_SPECIALS[activeMapId] || [];
    const nearestSpecial = citySpecials
      .map((item) => ({
        ...item,
        worldX: 1800 + item.x,
        worldY: 1200 + item.y,
        interactionDistance: distance(currentPosition, { x: 1800 + item.x, y: 1200 + item.y }),
      }))
      .filter((item) => item.interactionDistance < 88)
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestSpecial) {
      setDialogue({ name: nearestSpecial.name, dialogue: nearestSpecial.dialogue });
      return;
    }

    // Il Grande Seme è il cuore narrativo di Verdelume: si può consultare senza avviare un combattimento.
    if (activeMapId === "natura" && Math.hypot(currentPosition.x - 1800, currentPosition.y - 1200) < 105) {
      setDialogue({
        name: "Il Grande Seme",
        dialogue: "Le radici di Verdelume custodiscono i ricordi di ogni creatura nata nella foresta. Non chiede di essere protetto con la forza: vuole che tu ascolti, curi ciò che si è spezzato e lasci spazio a una nuova crescita. Quando la città sarà in armonia, anche i suoi sentieri riveleranno segreti.",
      });
      return;
    }

    const nearestHouse = ADVENTURE_HOUSES
      .filter((item) => item.city.id === activeMapId)
      .map((item) => ({ ...item, lore: ADVENTURE_FACTION_LORE[item.city.id] || {}, x: 1800 + (item.x - item.city.x), y: 1200 + (item.y - item.city.y), interactionDistance: distance(currentPosition, { x: 1800 + (item.x - item.city.x), y: 1200 + (item.y - item.city.y) }) }))
      .filter((item) => item.interactionDistance < 92)
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestHouse) {
      setInterior(nearestHouse);
      return;
    }

    const nearestChallenger = challengerRef.current
      .map((challenger) => ({
        ...challenger,
        interactionDistance: distance(currentPosition, challenger),
      }))
      .filter((challenger) =>
        challenger.interactionDistance < interactionRadius
      )
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestChallenger) {
      challengerEncounterOpenRef.current = true;
      setChallengerEncounter(nearestChallenger);
      return;
    }

    const nearestWild = wildRef.current
      .map((sognatore) => ({
        ...sognatore,
        interactionDistance: distance(currentPosition, sognatore),
      }))
      .filter((sognatore) =>
        sognatore.interactionDistance < interactionRadius
      )
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestWild) {
      encounterOpenRef.current = true;
      setEncounter({ ...nearestWild, taskCompleted: true });
      return;
    }

    // Esplorazione ambientale: alberi e rocce sono punti d'interazione.
    const nearestTree = WORLD_OBJECTS.trees
      .map((object) => ({ ...object, interactionDistance: distance(currentPosition, object) }))
      .filter((object) => object.interactionDistance < interactionRadius)
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];
    const nearestRock = WORLD_OBJECTS.rocks
      .map((object) => ({ ...object, interactionDistance: distance(currentPosition, object) }))
      .filter((object) => object.interactionDistance < interactionRadius)
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];
    const natureObject = !nearestTree ? nearestRock
      : !nearestRock ? nearestTree
      : nearestTree.interactionDistance <= nearestRock.interactionDistance ? nearestTree : nearestRock;

    if (natureObject) {
      const isTree = natureObject.id.startsWith("tree-");
      const observations = {
        Demone: isTree ? "La corteccia è annerita dal calore. Tra le radici brillano braci ancora vive." : "La roccia è vulcanica: è calda e attraversata da sottili venature rosse.",
        Robot: isTree ? "Un albero-metallico vibra a intervalli regolari. Sembra alimentato da un nucleo interno." : "La superficie minerale contiene filamenti conduttivi. Potrebbe essere un componente naturale.",
        Natura: isTree ? "Le foglie emanano un profumo intenso. Piccoli germogli crescono attorno alle radici." : "Il muschio ricopre la pietra e forma minuscole geometrie. La foresta è piena di vita.",
        Nuvola: isTree ? "La chioma è leggerissima e ondeggia anche senza vento." : "La pietra è porosa e levigata: sembra essersi formata tra le correnti d'aria.",
        Umano: isTree ? "Un albero robusto, con segni di vecchi raccolti e corde sul tronco." : "Una pietra da costruzione. Qualcuno ha inciso un vecchio simbolo sulla superficie.",
        Luce: isTree ? "La linfa riflette la luce come oro liquido." : "La roccia rifrange la luce in piccoli lampi dorati.",
        Dolce: isTree ? "Dalla corteccia filtra un aroma zuccherino. I frutti sembrano caramellati." : "La pietra è cristallizzata come zucchero grezzo e luccica ai bordi.",
        Marino: isTree ? "Le foglie sono umide e salmastre. Il tronco porta i segni delle maree." : "La roccia è levigata dall'acqua e contiene conchiglie fossilizzate.",
        Orso: isTree ? "Il tronco è enorme e resistente. Ci sono graffi profondi lasciati da artigli." : "Un masso compatto, usato probabilmente come punto di riferimento del branco.",
        Mago: isTree ? "Runichette luminose si accendono tra gli anelli del tronco." : "La pietra pulsa appena: percepisci una traccia di magia al suo interno.",
        Salato: isTree ? "La corteccia è pallida e coperta da cristalli di sale." : "Un blocco di salgemma compatto. Le sue facce brillano come vetro opaco.",
      };
      setMessage(observations[activeCity.faction] || (isTree ? "Un albero antico, radicato profondamente nel terreno." : "Una roccia consumata dal tempo."));
      setTimeout(() => setMessage(""), 2600);
      return;
    }

    setMessage("Avvicinati a un abitante, a un Sognatore, a un albero, a una roccia, al Capo fazione o alla porta e premi E.");
    setTimeout(() => setMessage(""), 1800);
  };

  interactRef.current = interact;

  /*
    ============================
    ACCESSO
    ============================
  */

  if (
    isLoadingAuth ||
    !authChecked
  ) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
          Verifica sblocco Avventura...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!testerAllowed) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /*
    ============================
    RETURN
    ============================
  */

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-screen flex-col items-center gap-1 overflow-hidden bg-[#090d0a] px-1 py-1 text-white select-none touch-none">
      <div className="flex w-full max-w-[1100px] shrink-0 items-center justify-between px-2 py-0.5">
        <div className="text-xs font-black tracking-[.25em] text-emerald-100/70">SOGNATORI · AVVENTURA</div>
        <div className="text-xs font-bold text-white/60">{activeCity.city} · {activeCity.faction} · {zone.name}</div>
      </div>
      <div ref={worldFrameRef} className="relative min-h-0 w-full max-w-[1100px] flex-1 overflow-hidden rounded-md border-2 border-[#536b50] bg-black shadow-[0_0_0_2px_#172719,0_8px_24px_rgba(0,0,0,.45)]">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none h-full w-full" />

      </div>

      {/* CONTROLLI ESTERNI AL MONDO */}
      <div className="flex w-full max-w-[1100px] shrink-0 items-center justify-between gap-3 px-2 pb-0.5 pt-0.5">
        <div className="grid grid-cols-3 gap-1 touch-none">
          <span />
          <button aria-label="Su" onPointerDown={(e) => { e.preventDefault(); keysRef.current.arrowup = true; }} onPointerUp={() => { keysRef.current.arrowup = false; }} onPointerLeave={() => { keysRef.current.arrowup = false; }} className="h-11 w-11 rounded-lg border border-white/15 bg-[#263629] text-xl font-black active:bg-emerald-700">▲</button>
          <span />
          {["arrowleft","arrowdown","arrowright"].map((key) => <button key={key} aria-label={key} onPointerDown={(e) => { e.preventDefault(); keysRef.current[key] = true; }} onPointerUp={() => { keysRef.current[key] = false; }} onPointerLeave={() => { keysRef.current[key] = false; }} className="h-11 w-11 rounded-lg border border-white/15 bg-[#263629] text-xl font-black active:bg-emerald-700">{key === "arrowleft" ? "◀" : key === "arrowdown" ? "▼" : "▶"}</button>)}
        </div>
        <div className="hidden text-center text-[10px] font-bold leading-5 text-white/45 sm:block">WASD / FRECCE<br/>PER MUOVERTI</div>
        <button type="button" onClick={interact} className="rounded-xl border border-emerald-200/30 bg-emerald-300 px-5 py-4 text-xs font-black tracking-wide text-[#142116] shadow-lg active:scale-95">E · INTERAGISCI</button>
      </div>

      {message && (
        <div className="fixed bottom-24 left-1/2 z-[65] -translate-x-1/2 rounded-full border border-white/15 bg-black/85 px-5 py-3 text-center text-xs font-bold shadow-2xl">
          {message}
        </div>
      )}
      {/* =====================================
          DIALOGO NPC
          ===================================== */}


      {interior && <AdventureHouseInterior house={interior} onExit={() => setInterior(null)} />}


      {dialogue && (
        <div className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-3xl rounded-3xl border border-white/15 bg-black/85 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 text-sm font-black uppercase tracking-widest text-yellow-200">
            {dialogue.name}
          </div>

          <div className="text-base leading-7 text-white/85">
            {dialogue.dialogue}
          </div>

          <button
            type="button"
            onClick={() =>
              setDialogue(null)
            }
            className="mt-5 rounded-xl bg-white px-5 py-2 text-sm font-black text-black"
          >
            Continua
          </button>
        </div>
      )}

      <AdventureCampaign
        menuContent={(
      <div className="space-y-3">

      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl border border-white/15 bg-black/60 px-5 py-4 shadow-2xl backdrop-blur-md">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">
            Sognatori
          </div>

          <div className="mt-1 text-2xl font-black">
            AVVENTURA
          </div>

          <div className="mt-1 text-sm text-white/60">
            {zone.name}
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-black/60 px-5 py-4 text-right shadow-2xl backdrop-blur-md">
          <div className="mt-1 text-xs text-white/50">
            Ore{" "}
            {String(
              Math.floor(time)
            ).padStart(2, "0")}
            :
            {String(
              Math.floor(
                (time % 1) * 60
              )
            ).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-100/20 bg-[#17251e] shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-3 py-2">
          <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-100">Mappa di {activeCity.city}</div><div className="text-[9px] text-white/45">Carta locale · {activeCity.faction}</div></div>
          <div className="rounded-full border border-emerald-200/25 bg-emerald-300/10 px-2 py-1 text-[9px] font-bold text-emerald-100">● {activeCity.city}</div>
        </div>
        <svg viewBox="0 0 900 600" role="img" aria-label={"Mappa locale della città di " + activeCity.city} className="block h-auto max-h-[270px] w-full">
          <defs>
            <linearGradient id="cityMapGround" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={activeCity.faction === "Demone" ? "#733b36" : activeCity.faction === "Robot" ? "#52636c" : activeCity.faction === "Natura" ? "#507b48" : activeCity.faction === "Nuvola" ? "#8caec4" : activeCity.faction === "Umano" ? "#8b795f" : activeCity.faction === "Luce" ? "#c4a95c" : activeCity.faction === "Dolce" ? "#b87c78" : activeCity.faction === "Marino" ? "#397f91" : activeCity.faction === "Orso" ? "#69533d" : activeCity.faction === "Mago" ? "#574a83" : "#8a8064"}/>
              <stop offset="1" stopColor="#182b2a"/>
            </linearGradient>
            <pattern id="cityMapTexture" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M0 18L72 54M-18 54L18 72M54 0L72 18" stroke="#f4e7c2" strokeWidth="2" opacity=".12"/>
              <circle cx="14" cy="15" r="3" fill="#fff2ce" opacity=".16"/><circle cx="54" cy="48" r="2" fill="#fff2ce" opacity=".14"/>
            </pattern>
          </defs>
          <rect width="900" height="600" fill="url(#cityMapGround)"/>
          <rect width="900" height="600" fill="url(#cityMapTexture)"/>
          {activeCity.faction === "Demone" ? <><path d="M0 470L180 310 300 410 455 210 620 380 790 180 900 300V600H0Z" fill="#332c2c" opacity=".62"/><path d="M90 0L170 130 130 205M650 0L590 130 650 210" stroke="#f18a4c" strokeWidth="12" opacity=".65" fill="none"/>{[170,430,700].map((x)=><circle key={x} cx={x} cy={430-(x%3)*30} r="15" fill="#ff9b42" opacity=".8"/>)}</>
          : activeCity.faction === "Robot" ? <><path d="M0 120H900M0 300H900M0 480H900M160 0V600M450 0V600M740 0V600" stroke="#b9d0d4" strokeWidth="18" opacity=".28"/>{[120,330,540,750].map((x)=><rect key={x} x={x} y="210" width="82" height="150" rx="12" fill="#253d48" stroke="#c6e2df" strokeWidth="7"/>)}</>
          : activeCity.faction === "Natura" ? <><path d="M0 530Q180 280 350 420T900 330V600H0Z" fill="#244e38" opacity=".72"/>{[100,230,370,610,780].map((x)=><g key={x} fill="#214b32"><path d={`M${x} 420l-52-120h104z M${x} 340l-42-100h84z`}/><rect x={x-7} y="420" width="14" height="70" fill="#78573a"/></g>)}</>
          : activeCity.faction === "Nuvola" ? <><path d="M0 450Q220 330 420 430T900 350V600H0Z" fill="#d6e5ec" opacity=".45"/>{[110,320,540,760].map((x)=><path key={x} d={`M${x-55} 180q-20-48 28-62q20-62 82-24q60-10 58 48q54 28 12 65H${x-45}q-48-2-40-27z`} fill="#f5fbff" opacity=".72"/>)}</>
          : activeCity.faction === "Umano" ? <><path d="M0 0H900V600H0Z" fill="#8a7357" opacity=".22"/>{[150,350,550,750].map((x)=><g key={x}><rect x={x-48} y="180" width="96" height="170" fill="#574c43" stroke="#d9c5a0" strokeWidth="7"/><path d={`M${x-60} 180l60-70 60 70`} fill="#a58a68"/></g>)}</>
          : activeCity.faction === "Luce" ? <><circle cx="450" cy="280" r="210" fill="#f7e6a0" opacity=".15"/>{[150,300,600,750].map((x)=><path key={x} d={`M${x} 500V180m-34 40l34-60 34 60`} stroke="#fff0ad" strokeWidth="12" fill="none" opacity=".72"/>)}</>
          : activeCity.faction === "Dolce" ? <><path d="M0 470Q220 350 450 470T900 420V600H0Z" fill="#8d4d69" opacity=".55"/>{[130,320,580,770].map((x)=><g key={x}><circle cx={x} cy="220" r="40" fill="#f3b5bd"/><circle cx={x-24} cy="210" r="22" fill="#ffe0a6"/><circle cx={x+25} cy="210" r="22" fill="#ffe0a6"/></g>)}</>
          : activeCity.faction === "Marino" ? <><path d="M0 180Q130 100 260 180T520 180T900 180M0 360Q130 280 260 360T520 360T900 360M0 540Q130 460 260 540T520 540T900 540" stroke="#a8e5e8" strokeWidth="24" fill="none" opacity=".55"/>{[160,450,740].map((x)=><path key={x} d={`M${x} 110q-80 60 0 120q80-60 0-120z`} fill="#d4f2ec" opacity=".65"/>)}</>
          : activeCity.faction === "Orso" ? <><path d="M0 460L180 270 310 420 510 190 690 420 830 250 900 340V600H0Z" fill="#493c30" opacity=".6"/>{[140,390,650,810].map((x)=><g key={x} fill="#253d2d"><circle cx={x} cy="210" r="34"/><circle cx={x-25} cy="235" r="26"/><circle cx={x+25} cy="235" r="26"/><rect x={x-9} y="230" width="18" height="150"/></g>)}</>
          : activeCity.faction === "Mago" ? <><path d="M0 470Q220 380 450 470T900 420" stroke="#c2a9f4" strokeWidth="16" fill="none" opacity=".6"/>{[170,450,730].map((x)=><g key={x} stroke="#e4d5ff" strokeWidth="8" fill="none"><path d={`M${x-55} 390V230h110v160z`}/><path d={`M${x-75} 230l75-95 75 95z`}/></g>)}</>
          : <><path d="M0 470Q200 350 400 470T900 400V600H0Z" fill="#d7d0b7" opacity=".25"/>{[120,330,570,790].map((x)=><path key={x} d={`M${x-55} 400l55-90 55 90z`} fill="#e7dfc7" opacity=".55"/>)}</>}
          <path d="M80 510Q230 420 340 470T560 410T820 470" stroke="#e7d6ae" strokeWidth="24" strokeDasharray="24 18" fill="none" opacity=".72"/>
          <g transform={`translate(${Math.max(35,Math.min(865,player.x/4))} ${Math.max(35,Math.min(565,player.y/4))})`}>
            <circle r="34" fill="#fff3a3" opacity=".28"/><circle r="18" fill="#fff3a3" stroke="#17251e" strokeWidth="5"/><circle r="7" fill="#17251e"/>
          </g>
          <rect x="8" y="8" width="884" height="584" rx="24" fill="none" stroke="#f3e5bd" strokeWidth="8" opacity=".55"/>
          <text x="28" y="52" fontSize="24" fontWeight="900" fill="#fff4d4" stroke="#17251e" strokeWidth="5" paintOrder="stroke">{activeCity.city.toUpperCase()}</text>
          <text x="850" y="566" textAnchor="end" fontSize="17" fontWeight="800" fill="#fff4d4" stroke="#17251e" strokeWidth="4" paintOrder="stroke">N ↑</text>
        </svg>
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[9px] text-white/65"><span>◉ La tua posizione nella città</span><span>{activeCity.faction} · Mappa locale</span></div>
      </div>
          <GlobalMusicPlayer insideAdventureMenu />
          <AdventureWorldSystems saveKey={adventureSaveKey} activeCity={activeCity} time={time} defeatedLeaders={defeatedLeaders} discoveredWildClues={discoveredWildClues} completedWildTasks={completedWildTasks} recruitedIds={recruitedAdventureIds} />
      </div>
        )}
        userKey={user?.id || user?.email}
        grantAllFactionGems={isPersonalTester}
        onLeaderDefeated={(leaderId) => setDefeatedLeaders((old) => new Set([...old, leaderId]))}
        player={player}
        facing={playerFacingRef.current}
        walking={!!(keysRef.current.w || keysRef.current.a || keysRef.current.s || keysRef.current.d || keysRef.current.arrowup || keysRef.current.arrowdown || keysRef.current.arrowleft || keysRef.current.arrowright)}
        encounter={challengerEncounter}
        wildEncounter={encounter}
        onClose={() => {
          // Parlare con il capo non consuma né blocca la possibilità di sfidarlo.
          challengerEncounterOpenRef.current = false;
          setChallengerEncounter(null);
        }}
        onPauseChange={setCampaignPause}
        onRestart={() => {
          playerRef.current = { ...PLAYER_START };
          cameraRef.current = { ...PLAYER_START };
          setPlayer({ ...PLAYER_START });
          setActiveMapId("natura");
          setTime(9);
          setDialogue(null);
          setInterior(null);
          setEncounter(null);
          setChallengerEncounter(null);
          setMessage("Nuovo viaggio iniziato!");
          setTimeout(() => setMessage(""), 2200);
          keysRef.current = {};
               challengerCooldownRef.current = {};
          encounterOpenRef.current = false;
          challengerEncounterOpenRef.current = false;
        }}
        onWildClose={(recruited) => {
          if (encounter?.id) {
            if (recruited) {
              wildRef.current = wildRef.current.filter((s) => s.id !== encounter.id);
              setRecruitedAdventureIds((old) => [...new Set([...old, encounter.rosterId || encounter.id])]);
              setMessage("✦ " + encounter.name + " ha scelto di viaggiare con te!");
              setTimeout(() => setMessage(""), 2200);
            }
          }
          encounterOpenRef.current = false;
          setEncounter(null);
        }}
      />
    </div>
  );
}

/*
  ============================================
  PLAYER
  ============================================
*/

// Gli incontri selvatici usano direttamente l'artwork ufficiale del roster.
// Il ritaglio rimuove solo lo sfondo scuro collegato ai bordi, preservando i dettagli interni.
const OVERWORLD_ART_CACHE = new Map();

function loadOverworldArtwork(src) {
  if (!src) return null;
  const cached = OVERWORLD_ART_CACHE.get(src);
  if (cached) return cached;
  const entry = { canvas: null, loading: true };
  OVERWORLD_ART_CACHE.set(src, entry);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const c = canvas.getContext("2d", { willReadFrequently: true });
    if (!c) { entry.loading = false; return; }
    c.drawImage(image, 0, 0);
    try {
      const frame = c.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const seen = new Uint8Array(canvas.width * canvas.height);
      const queue = new Int32Array(canvas.width * canvas.height);
      let head = 0, tail = 0;
      const add = (x, y) => {
        const index = y * canvas.width + x;
        if (seen[index]) return;
        const p = index * 4;
        if (data[p] > 24 || data[p + 1] > 24 || data[p + 2] > 24) return;
        seen[index] = 1;
        queue[tail++] = index;
      };
      for (let x = 0; x < canvas.width; x++) { add(x, 0); add(x, canvas.height - 1); }
      for (let y = 1; y < canvas.height - 1; y++) { add(0, y); add(canvas.width - 1, y); }
      while (head < tail) {
        const index = queue[head++];
        const x = index % canvas.width, y = (index / canvas.width) | 0;
        data[index * 4 + 3] = 0;
        if (x > 0) add(x - 1, y);
        if (x + 1 < canvas.width) add(x + 1, y);
        if (y > 0) add(x, y - 1);
        if (y + 1 < canvas.height) add(x, y + 1);
      }
      c.putImageData(frame, 0, 0);

      // Ritaglia il margine trasparente dell'artwork: ogni specie occupa
      // un ingombro coerente senza perdere corna, antenne, code o altri dettagli.
      let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
      for (let py = 0; py < canvas.height; py++) {
        for (let px = 0; px < canvas.width; px++) {
          if (data[(py * canvas.width + px) * 4 + 3] > 0) {
            minX = Math.min(minX, px); minY = Math.min(minY, py);
            maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
          }
        }
      }
      if (maxX >= minX && maxY >= minY) {
        const padX = Math.max(3, Math.round((maxX - minX + 1) * 0.045));
        const padY = Math.max(3, Math.round((maxY - minY + 1) * 0.045));
        minX = Math.max(0, minX - padX); minY = Math.max(0, minY - padY);
        maxX = Math.min(canvas.width - 1, maxX + padX);
        maxY = Math.min(canvas.height - 1, maxY + padY);
        const cropped = document.createElement("canvas");
        cropped.width = maxX - minX + 1; cropped.height = maxY - minY + 1;
        cropped.getContext("2d")?.drawImage(canvas, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
        entry.canvas = cropped;
      } else {
        entry.canvas = canvas;
      }
    } catch {
      entry.canvas = image;
    }
    entry.loading = false;
  };
  image.onerror = () => { entry.loading = false; entry.failed = true; };
  image.src = src;
  return entry;
}

function drawOverworldSognatore(ctx, s, x, y, frame = 0, sleepingBlocker = false, direction = "down") {
  // Artwork originale ritagliato: orientamento orizzontale a destra/sinistra.
  // Due pose alternate danno un leggero passo senza sostituire o deformare l'artwork.
  const artwork = loadOverworldArtwork(s?.img);
  if (!artwork || artwork.loading || artwork.failed || !artwork.canvas) return;
  const image = artwork.canvas;
  const maxHeight = sleepingBlocker ? 112 : 88;
  const ratio = Math.min(maxHeight / image.height, 1.25);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const facingLeft = direction === "left";
  const step = sleepingBlocker ? 0 : (Math.floor(frame / 2) % 2 === 0 ? 0 : 2);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - height + step));
  if (facingLeft) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.shadowColor = "rgba(0,0,0,.28)";
  ctx.shadowBlur = 5;
  ctx.drawImage(image, -Math.round(width / 2), 0, width, height);
  ctx.restore();
}

function nextCityName(cityId, cities = ADVENTURE_CITIES) {
  const index = cities.findIndex((city) => city.id === cityId);
  return cities[(index + 1) % cities.length].city;
}

function previousCityName(cityId, cities = ADVENTURE_CITIES) {
  const index = cities.findIndex((city) => city.id === cityId);
  return cities[(index - 1 + cities.length) % cities.length].city;
}

function drawAdventureDoor(ctx, x, y, color, label, rotation = 0, locked = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "rgba(0,0,0,.32)";
  ctx.beginPath(); ctx.ellipse(0, 8, 76, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#34333f";
  ctx.fillRect(-52, -112, 18, 122); ctx.fillRect(34, -112, 18, 122);
  ctx.fillRect(-62, -126, 124, 20);
  ctx.fillStyle = color;
  ctx.fillRect(-42, -100, 84, 94);
  ctx.fillStyle = "#171b2a";
  ctx.fillRect(-28, -84, 56, 82);
  ctx.fillStyle = locked ? "rgba(92,53,44,.94)" : "rgba(220,244,255,.75)";
  ctx.fillRect(-22, -78, 44, 70);
  ctx.fillStyle = locked ? "#d18b55" : "rgba(255,255,255,.32)";
  ctx.fillRect(-15, -72, 8, 52);
  if (locked) {
    ctx.fillStyle = "#f4d18a";
    ctx.fillRect(-12, -49, 24, 20);
    ctx.fillRect(-7, -59, 14, 13);
    ctx.fillStyle = "#593b2e";
    ctx.fillRect(-2, -43, 4, 8);
  }
  ctx.restore();

  // L'etichetta resta sempre leggibile: la porta nord è capovolta, ma il testo no.
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = locked ? "#ffd08a" : "#f6e4a7";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, 0, rotation === Math.PI ? 158 : -144);
  ctx.restore();
}

function drawPlayer(ctx, p, facing = { x: 0, y: -1 }, frame = 0, walking = false) {
  // Protagonista overworld 2026: silhouette leggibile, 4 direzioni e passo a 2 frame.
  // Il punto p resta ancorato ai piedi: collisioni, camera e coordinate non cambiano.
  const side = Math.abs(facing.x || 0) > Math.abs(facing.y || 0);
  const back = !side && (facing.y || 0) < 0;
  const walkPhase = ((frame % 4) + 4) % 4;
  const step = walking ? (walkPhase === 1 ? 2 : walkPhase === 3 ? -1 : 0) : 0;
  ctx.save();
  ctx.translate(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2);
  if (side && facing.x < 0) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;

  // Ombra morbida, separata dai piedi.
  ctx.fillStyle = "rgba(0,0,0,.36)";
  ctx.beginPath();
  ctx.ellipse(0, 19, 19, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gambe e stivali: alternanza netta durante il movimento.
  ctx.fillStyle = "#26344e";
  ctx.fillRect(-9, 4 + (step ? 1 : 0), 8, 12);
  ctx.fillRect(2, 4 + (step ? -1 : 0), 8, 12);
  ctx.fillStyle = "#40577e";
  ctx.fillRect(-8, 7 + (step ? 1 : 0), 5, 6);
  ctx.fillRect(3, 7 + (step ? -1 : 0), 5, 6);
  ctx.fillStyle = "#30272a";
  ctx.fillRect(-11, 15 + (step ? 1 : 0), 10, 5);
  ctx.fillRect(2, 15 + (step ? -1 : 0), 11, 5);
  ctx.fillStyle = "#d2a36a";
  ctx.fillRect(-10, 15 + (step ? 1 : 0), 7, 2);
  ctx.fillRect(3, 15 + (step ? -1 : 0), 7, 2);

  // Zaino visibile da dietro e di profilo.
  if (back || side) {
    ctx.fillStyle = "#49362d";
    ctx.fillRect(-15, -15, 8, 23);
    ctx.fillStyle = "#9a623d";
    ctx.fillRect(-14, -12, 6, 14);
    ctx.fillStyle = "#e0b66d";
    ctx.fillRect(-13, -9, 4, 5);
    ctx.fillStyle = "#55382c";
    ctx.fillRect(-8, -12, 3, 17);
  }

  // Giacca a pannelli, con cuciture e bordi luminosi.
  ctx.fillStyle = "#713c32";
  ctx.fillRect(-13, -15, 26, 22);
  ctx.fillStyle = "#c65e3d";
  ctx.fillRect(-11, -15, 22, 19);
  ctx.fillStyle = "#ed9a4c";
  ctx.fillRect(-8, -13, 16, 16);
  ctx.fillStyle = "#8e452f";
  ctx.fillRect(-2, -14, 4, 19);
  ctx.fillStyle = "#f6d18a";
  ctx.fillRect(-1, -9, 2, 3);
  ctx.fillRect(-1, -2, 2, 3);
  ctx.fillStyle = "rgba(255,226,163,.58)";
  ctx.fillRect(-8, -11, 3, 2);
  ctx.fillRect(5, -8, 2, 4);

  // Braccia animate; in vista posteriore la giacca copre parte delle maniche.
  const armSwing = walking ? (walkPhase === 1 ? 2 : walkPhase === 3 ? -1 : 0) : 0;
  ctx.fillStyle = "#b96b4d";
  ctx.fillRect(-17, -12 + armSwing, 5, 14);
  ctx.fillRect(12, -12 - armSwing, 5, 14);
  ctx.fillStyle = "#efc49a";
  ctx.fillRect(-17, 0 + armSwing, 5, 4);
  ctx.fillRect(12, 0 - armSwing, 5, 4);
  ctx.fillStyle = "#302a32";
  ctx.fillRect(-18, 2 + armSwing, 6, 4);
  ctx.fillRect(12, 2 - armSwing, 6, 4);

  // Collo e testa: il retro mostra i capelli, il profilo un solo occhio.
  ctx.fillStyle = "#b87956";
  ctx.fillRect(-5, -21, 10, 7);
  ctx.fillStyle = "#efc49a";
  ctx.fillRect(-10, -37, 20, 18);
  ctx.fillStyle = "#d99f78";
  ctx.fillRect(-11, -27, 3, 5);
  ctx.fillRect(8, -27, 3, 5);
  ctx.fillStyle = "#33272a";
  ctx.fillRect(-11, -40, 22, 7);
  ctx.fillRect(-9, -44, 18, 6);
  ctx.fillRect(-12, -37, 5, 7);
  ctx.fillRect(7, -37, 5, 7);

  if (back) {
    ctx.fillStyle = "#33272a";
    ctx.fillRect(-10, -39, 20, 13);
    ctx.fillRect(-8, -43, 16, 5);
    ctx.fillStyle = "#f2bd55";
    ctx.fillRect(-12, -44, 24, 4);
  } else if (side) {
    ctx.fillStyle = "#29242a";
    ctx.fillRect(3, -31, 3, 3);
    ctx.fillStyle = "#d99f78";
    ctx.fillRect(8, -28, 3, 2);
    ctx.fillStyle = "#f2bd55";
    ctx.fillRect(-11, -44, 23, 4);
    ctx.fillRect(-7, -47, 14, 3);
  } else {
    ctx.fillStyle = "#f2bd55";
    ctx.fillRect(-12, -44, 24, 5);
    ctx.fillRect(-7, -48, 14, 4);
    ctx.fillStyle = "#f7d58b";
    ctx.fillRect(-7, -43, 13, 2);
    ctx.fillStyle = "#29242a";
    ctx.fillRect(-6, -30, 3, 3);
    ctx.fillRect(4, -30, 3, 3);
    ctx.fillStyle = "#9d594a";
    ctx.fillRect(-2, -24, 4, 1);
  }

  // Sciarpa rossa: segno iconico del protagonista, leggibile da davanti e di lato.
  if (!back) {
    ctx.fillStyle = "#7e2638";
    ctx.fillRect(-9, -20, 18, 6);
    ctx.fillStyle = "#d84e4d";
    ctx.fillRect(-8, -19, 16, 3);
    ctx.fillRect(side ? 5 : 6, -15, 5, 14 + (walking ? step : 0));
    ctx.fillStyle = "#f08a65";
    ctx.fillRect(side ? 6 : 7, -14, 2, 8);
  } else {
    ctx.fillStyle = "#7e2638";
    ctx.fillRect(-9, -20, 18, 5);
    ctx.fillStyle = "#d84e4d";
    ctx.fillRect(-8, -19, 16, 2);
  }

  // Piccolo fermaglio e dettagli di equipaggiamento.
  ctx.fillStyle = "#f6d18a";
  ctx.fillRect(-13, -11, 3, 3);
  ctx.fillRect(10, -10, 3, 3);
  ctx.fillStyle = "#e6bd79";
  ctx.fillRect(-9, 4, 3, 2);
  ctx.fillRect(6, 4, 3, 2);

  // Rifinitura pixel-art: contorni, cuciture, riflessi e accessori leggibili
  // anche sullo schermo mobile senza cambiare hitbox o punto d'appoggio.
  ctx.fillStyle = "#512d2b";
  ctx.fillRect(-13, -15, 2, 19);
  ctx.fillRect(11, -15, 2, 19);
  ctx.fillRect(-10, 5, 2, 9);
  ctx.fillRect(8, 5, 2, 9);
  ctx.fillStyle = "#f7bd69";
  ctx.fillRect(-8, -12, 2, 5);
  ctx.fillRect(6, -10, 2, 4);
  ctx.fillRect(-10, 3, 3, 2);
  ctx.fillRect(7, 3, 3, 2);
  ctx.fillStyle = "#713c32";
  ctx.fillRect(-5, -7, 2, 9);
  ctx.fillRect(4, -7, 2, 9);
  ctx.fillStyle = "#f6d18a";
  ctx.fillRect(-2, -5, 4, 2);
  ctx.fillRect(-2, 1, 4, 2);

  // Tracolla e tasca dello zaino: visibili solo nelle viste in cui lo zaino
  // è esposto, così il retro resta distinto dal fronte.
  if (back || side) {
    ctx.fillStyle = "#2d2930";
    ctx.fillRect(-14, -15, 3, 19);
    ctx.fillStyle = "#d9a65e";
    ctx.fillRect(-13, -10, 2, 3);
    ctx.fillRect(-13, -1, 2, 3);
    ctx.fillStyle = "#6e452f";
    ctx.fillRect(-15, -1, 8, 7);
    ctx.fillStyle = "#d9a65e";
    ctx.fillRect(-14, 0, 6, 1);
    ctx.fillRect(-14, 4, 6, 1);
  }

  // Occhi e riflesso del ciuffo: il profilo mantiene un solo occhio.
  if (!back) {
    ctx.fillStyle = "#fff0d4";
    if (side) ctx.fillRect(3, -31, 1, 1);
    else {
      ctx.fillRect(-6, -31, 1, 1);
      ctx.fillRect(4, -31, 1, 1);
    }
    ctx.fillStyle = "#ffd98c";
    ctx.fillRect(-7, -46, 5, 1);
    ctx.fillRect(2, -46, 5, 1);
  }
  ctx.restore();
}
/*
  ============================================
  TREE
  ============================================
*/

function drawTree(ctx, x, y, r, faction = "Natura") {
  const palettes = {
    Demone: ["#49303a", "#8f3545", "#c9514e", "#f18a59"],
    Robot: ["#414b55", "#626f7a", "#8b969f", "#d4d9de"],
    Natura: ["#493426", "#173d2b", "#24583a", "#65a65b"],
    Nuvola: ["#aabac8", "#cbd9e4", "#e3edf4", "#ffffff"],
    Umano: ["#292c31", "#41454b", "#55585d", "#aeb3b8"],
    Luce: ["#73562c", "#a98639", "#e2c35e", "#fff0a8"],
    Dolce: ["#815333", "#a97849", "#c89a62", "#f0d7b5"],
    Marino: ["#31505a", "#27677a", "#3d9ba3", "#9ce0d9"],
    Orso: ["#49372b", "#604631", "#8b633d", "#c39a61"],
    Mago: ["#403553", "#554879", "#8571b5", "#c8b7f4"],
    Salato: ["#80565d", "#a96f77", "#c98e91", "#f1d8d5"],
  };
  const [bark, shade, foliage, highlight] = palettes[faction] || palettes.Natura;
  const size = Math.max(32, Math.round(r * 1.9 / 4) * 4);
  const left = Math.round(x - size / 2);
  const top = Math.round(y - size * 1.38);
  ctx.save();
  ctx.fillStyle = "rgba(7,18,15,.3)";
  ctx.beginPath();
  ctx.ellipse(x + 7, y + 17, size * .62, size * .2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tronco leggibile sotto la chioma.
  ctx.fillStyle = bark;
  ctx.fillRect(x - 7, y - 8, 14, 34);
  ctx.fillStyle = foliage;
  ctx.fillRect(x - 3, y - 5, 5, 27);
  ctx.fillStyle = highlight;
  ctx.fillRect(x + 3, y + 1, 3, 13);

  // Chioma a livelli, con masse sovrapposte e luce dall'alto a sinistra.
  ctx.fillStyle = shade;
  ctx.fillRect(left + size * .22, top + size * .28, size * .58, size * .66);
  ctx.fillRect(left + size * .08, top + size * .43, size * .84, size * .38);
  ctx.fillRect(left + size * .31, top + size * .08, size * .42, size * .72);

  ctx.fillStyle = foliage;
  ctx.fillRect(left + size * .2, top + size * .3, size * .6, size * .54);
  ctx.fillRect(left + size * .12, top + size * .47, size * .76, size * .27);
  ctx.fillRect(left + size * .34, top + size * .16, size * .34, size * .56);

  ctx.fillStyle = highlight;
  ctx.fillRect(left + size * .24, top + size * .24, size * .22, size * .17);
  ctx.fillRect(left + size * .49, top + size * .18, size * .2, size * .15);
  ctx.fillRect(left + size * .12, top + size * .48, size * .23, size * .14);
  ctx.fillRect(left + size * .58, top + size * .46, size * .23, size * .14);

  ctx.fillStyle = highlight;
  ctx.fillRect(left + size * .29, top + size * .23, size * .13, size * .08);
  ctx.fillRect(left + size * .52, top + size * .2, size * .1, size * .07);
  ctx.fillRect(left + size * .17, top + size * .48, size * .1, size * .07);
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.fillRect(left + size * .34, top + size * .14, size * .08, size * .05);

  // Piccoli ciuffi laterali: chioma meno geometrica e più naturale.
  ctx.fillStyle = foliage;
  ctx.fillRect(left + size * .02, top + size * .55, size * .2, size * .17);
  ctx.fillRect(left + size * .76, top + size * .39, size * .2, size * .2);
  ctx.restore();
}

/*
  ============================================
  HOUSE
  ============================================
*/

function drawHouse(ctx, x, y, color) {
  ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(x - 8, y + 112, 208, 30);
  ctx.fillStyle = "#3a2925"; ctx.fillRect(x - 12, y - 54, 214, 72); ctx.fillRect(x + 4, y - 72, 178, 24);
  ctx.fillStyle = "#754638"; ctx.fillRect(x - 5, y - 50, 200, 58);
  ctx.fillStyle = "#9a5c43";
  for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) ctx.fillRect(x + col * 28 + (row % 2) * 8, y - 44 + row * 13, 18, 5);
  ctx.fillStyle = color; ctx.fillRect(x + 8, y + 5, 174, 105);
  ctx.fillStyle = "#d8bd91"; ctx.fillRect(x + 75, y + 58, 38, 52);
  ctx.fillStyle = "#4b3025"; ctx.fillRect(x + 80, y + 62, 28, 48);
  ctx.fillStyle = "#82c9d8"; ctx.fillRect(x + 24, y + 28, 34, 30); ctx.fillRect(x + 132, y + 28, 34, 30);
  ctx.fillStyle = "#e7e0bd"; ctx.fillRect(x + 39, y + 28, 4, 30); ctx.fillRect(x + 24, y + 41, 34, 4); ctx.fillRect(x + 147, y + 28, 4, 30); ctx.fillRect(x + 132, y + 41, 34, 4);
}

/*
  ============================================
  NPC
  ============================================
*/

function drawNpc(ctx, npc) {
  ctx.save();
  ctx.translate(Math.round(npc.x / 3) * 3, Math.round(npc.y / 3) * 3);
  ctx.imageSmoothingEnabled = false;

  // Abitanti Natura: silhouette dedicate e animazioni d'attesa puramente visive.
  if (npc.faction === "Natura") {
    const bob = Math.round(Math.sin(performance.now() / 620 + (npc.index || 0) * 1.8) * 1.5);
    const sway = Math.sin(performance.now() / 470 + (npc.index || 0)) * 1.5;
    const role = (npc.index || 0) % 3;
    ctx.translate(0, bob);
    ctx.fillStyle = "rgba(7,14,18,.34)";
    ctx.beginPath(); ctx.ellipse(1, 22 - bob, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#493526"; ctx.fillRect(-10, 12, 8, 9); ctx.fillRect(3, 12, 8, 9);
    ctx.fillStyle = "#b68a5d"; ctx.fillRect(-10, 18, 8, 3); ctx.fillRect(3, 18, 8, 3);
    ctx.fillStyle = role === 1 ? "#765638" : "#315b3d"; ctx.fillRect(-14, -5, 28, 21);
    ctx.fillStyle = role === 2 ? "#9a7548" : "#78a94f"; ctx.fillRect(-11, -8, 22, 20);
    ctx.fillStyle = "#c5df83"; ctx.fillRect(-8, -6, 4, 13);
    ctx.fillStyle = "#e5c17f"; ctx.fillRect(-10, 8, 20, 3);
    ctx.save(); ctx.translate(-14, -2); ctx.rotate(sway * .035);
    ctx.fillStyle = "#d99e79"; ctx.fillRect(-3, 0, 6, 14); ctx.restore();
    ctx.save(); ctx.translate(14, -2); ctx.rotate(-sway * .035);
    ctx.fillStyle = "#d99e79"; ctx.fillRect(-3, 0, 6, 14); ctx.restore();
    ctx.fillStyle = "#d99e79"; ctx.fillRect(-4, -15, 8, 8);
    ctx.fillStyle = "#efc69f"; ctx.fillRect(-10, -31, 20, 19);
    ctx.fillStyle = role === 0 ? "#493526" : role === 1 ? "#6b4936" : "#344b35";
    ctx.fillRect(-11, -33, 22, 7); ctx.fillRect(-9, -37, 18, 6);
    // Tre copricapi identificano raccoglitore, erborista e custode.
    ctx.fillStyle = role === 0 ? "#a8cf63" : role === 1 ? "#d8b66b" : "#6eaa55";
    if (role === 0) {
      ctx.beginPath(); ctx.moveTo(-13, -34); ctx.quadraticCurveTo(-5, -53, 12, -42); ctx.quadraticCurveTo(2, -31, -13, -34); ctx.fill();
      ctx.fillStyle = "#e5f2a4"; ctx.fillRect(-3, -43, 3, 8);
    } else if (role === 1) {
      ctx.fillRect(-13, -40, 26, 5); ctx.fillRect(-8, -45, 16, 5);
      ctx.fillStyle = "#f4d98b"; ctx.fillRect(-3, -45, 6, 4);
    } else {
      ctx.beginPath(); ctx.arc(0, -39, 11, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#d9ef9a"; ctx.fillRect(-2, -48, 4, 5);
    }
    ctx.fillStyle = "#282532"; ctx.fillRect(-6, -23, 3, 3); ctx.fillRect(4, -23, 3, 3);
    ctx.fillStyle = "#fff0d4"; ctx.fillRect(-4, -15, 8, 2);
    // Oggetto di lavoro per ciascun abitante.
    if (role === 0) {
      ctx.fillStyle = "#8b603c"; ctx.fillRect(15, 2, 7, 12);
      ctx.fillStyle = "#b9854d"; ctx.fillRect(13, 0, 11, 4);
      ctx.fillStyle = "#78a94f"; ctx.fillRect(17, -4, 4, 5);
    } else if (role === 1) {
      ctx.fillStyle = "#8b603c"; ctx.fillRect(-22, 3, 8, 9);
      ctx.fillStyle = "#d8b66b"; ctx.fillRect(-24, 1, 12, 3);
      ctx.fillStyle = "#a8cf63"; ctx.fillRect(-20, -2, 4, 4);
    } else {
      ctx.fillStyle = "#765638"; ctx.fillRect(17, -15, 3, 31);
      ctx.fillStyle = "#c5df83"; ctx.fillRect(13, -17, 11, 5);
      ctx.fillStyle = "#e5c17f"; ctx.fillRect(15, 13, 7, 3);
    }
    // Equipaggiamento individuale: ogni residente ha una silhouette distinta.
    if (role === 0) {
      // Raccoglitore: tracolla, borsa e foglie raccolte.
      ctx.fillStyle = "#65452f"; ctx.fillRect(-13, -3, 8, 13);
      ctx.fillStyle = "#b9854d"; ctx.fillRect(-14, 1, 10, 9);
      ctx.fillStyle = "#d8b66b"; ctx.fillRect(-13, 0, 8, 2);
      ctx.fillStyle = "#78a94f"; ctx.fillRect(-12, -4, 3, 5); ctx.fillRect(-7, -6, 3, 5);
      ctx.strokeStyle = "#e5c17f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(8, 8); ctx.stroke();
    } else if (role === 1) {
      // Erborista: grembiule chiaro, tasche e fiala appesa alla cintura.
      ctx.fillStyle = "#e6d4a5"; ctx.fillRect(-8, -3, 16, 17);
      ctx.fillStyle = "#c2a16a"; ctx.fillRect(-7, 2, 14, 2); ctx.fillRect(-6, 7, 5, 5); ctx.fillRect(2, 7, 4, 5);
      ctx.fillStyle = "#79c7b4"; ctx.fillRect(11, 5, 5, 9);
      ctx.fillStyle = "#d8f1d9"; ctx.fillRect(12, 3, 3, 3);
      ctx.strokeStyle = "#d8b66b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(9, -3); ctx.stroke();
    } else {
      // Custode: mantello a foglia, fibbia e pendente del Grande Seme.
      ctx.fillStyle = "#294b35"; ctx.fillRect(-15, -5, 30, 18);
      ctx.fillStyle = "#6eaa55"; ctx.fillRect(-12, -4, 24, 15);
      ctx.fillStyle = "#a8cf63"; ctx.fillRect(-13, 7, 6, 5); ctx.fillRect(7, 7, 6, 5);
      ctx.fillStyle = "#f1d98b"; ctx.fillRect(-3, -1, 6, 6);
      ctx.fillStyle = "#9bd66c"; ctx.fillRect(-2, 0, 4, 4);
      ctx.fillStyle = "#765638"; ctx.fillRect(15, -13, 4, 28);
    }
    // Volti, capelli e accessori leggibili anche alla scala della mappa.
    const blink = Math.sin(performance.now() / 1000 + (npc.index || 0) * 2.4) > 0.985;
    ctx.fillStyle = role === 0 ? "#6a4935" : role === 1 ? "#8a5b3c" : "#d7d1b5";
    if (role === 0) { ctx.fillRect(-11,-33,22,5); ctx.fillRect(-12,-29,4,8); ctx.fillRect(8,-29,4,8); }
    else if (role === 1) { ctx.fillRect(-11,-34,22,5); ctx.fillRect(-12,-30,4,7); ctx.fillRect(8,-30,4,7); }
    else { ctx.fillRect(-11,-33,22,5); ctx.fillRect(-13,-29,4,11); ctx.fillRect(9,-29,4,11); }
    ctx.fillStyle = "#282532";
    if (blink) { ctx.fillRect(-6,-23,3,1); ctx.fillRect(4,-23,3,1); }
    else { ctx.fillRect(-6,-23,3,3); ctx.fillRect(4,-23,3,3); }
    ctx.fillStyle = "rgba(255,244,210,.7)"; ctx.fillRect(-8,-27,4,2); ctx.fillRect(4,-27,4,2);
    // Dettaglio identitario sul copricapo.
    if (role === 0) { ctx.fillStyle="#f0d98e"; ctx.fillRect(5,-45,4,7); ctx.fillRect(8,-48,3,5); }
    else if (role === 1) { ctx.fillStyle="#79c7b4"; ctx.fillRect(-3,-47,6,3); ctx.fillStyle="#e8f1c8"; ctx.fillRect(-1,-49,2,3); }
    else { ctx.fillStyle="#f2d78d"; ctx.fillRect(-3,-49,6,3); ctx.fillStyle="#8ecb69"; ctx.fillRect(-1,-53,2,5); }
    // Piccolo equipaggiamento e dettagli da RPG portatile 2010.
    ctx.fillStyle = "#e5c17f"; ctx.fillRect(-8, -4, 3, 9);
    ctx.fillStyle = "rgba(255,244,210,.75)"; ctx.fillRect(-7, -3, 1, 5);
    ctx.fillStyle = "rgba(12,18,27,.92)"; ctx.fillRect(-58, 27, 116, 31);
    ctx.fillStyle = "#a8cf63"; ctx.fillRect(-58, 27, 4, 31);
    ctx.fillStyle = "#fff4df"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
    ctx.fillText(npc.name, 0, 39, 108);
    ctx.fillStyle = "#c5df83"; ctx.font = "bold 8px monospace";
    ctx.fillText(npc.activity || "IN PAESE", 0, 51, 108);
    ctx.restore();
    return;
  }

  // Ombra a terra e piedi ben separati.
  ctx.fillStyle = "rgba(7,14,18,.34)";
  ctx.beginPath(); ctx.ellipse(1, 22, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#302b36";
  ctx.fillRect(-10, 12, 8, 9); ctx.fillRect(3, 12, 8, 9);
  ctx.fillStyle = "#b68a5d";
  ctx.fillRect(-10, 18, 8, 3); ctx.fillRect(3, 18, 8, 3);

  // Mantello, tunica e cintura.
  ctx.fillStyle = "#273449";
  ctx.fillRect(-13, -5, 26, 20);
  ctx.fillRect(-16, -2, 5, 13); ctx.fillRect(11, -2, 5, 13);
  ctx.fillStyle = npc.color;
  ctx.fillRect(-11, -8, 22, 20);
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.fillRect(-8, -6, 5, 13);
  ctx.fillStyle = "#e5c17f";
  ctx.fillRect(-10, 8, 20, 3);
  ctx.fillRect(-2, 6, 4, 6);

  // Braccia, collo e volto.
  ctx.fillStyle = "#d99e79";
  ctx.fillRect(-16, -5, 5, 13); ctx.fillRect(11, -5, 5, 13);
  ctx.fillRect(-4, -15, 8, 8);
  ctx.fillStyle = "#efc69f";
  ctx.fillRect(-10, -31, 20, 19);
  ctx.fillStyle = "#b97759";
  ctx.fillRect(-10, -17, 3, 4); ctx.fillRect(7, -17, 3, 4);

  // Capelli e copricapo con un tratto distintivo per gli NPC.
  ctx.fillStyle = npc.id === "elder" ? "#e5e0d0" : npc.id === "smith" ? "#49312b" : "#34465a";
  ctx.fillRect(-11, -33, 22, 7);
  ctx.fillRect(-9, -37, 18, 6);
  if (npc.id === "elder") {
    ctx.fillRect(-13, -29, 4, 13); ctx.fillRect(9, -29, 4, 13);
    ctx.fillStyle = "#f4d35e"; ctx.fillRect(-13, -40, 26, 3);
  } else if (npc.id === "smith") {
    ctx.fillStyle = "#d5a15a"; ctx.fillRect(-13, -39, 26, 5);
    ctx.fillStyle = "#754b34"; ctx.fillRect(-8, -44, 16, 6);
  } else {
    ctx.fillStyle = "#7fc5e8"; ctx.fillRect(-11, -39, 22, 3);
    ctx.fillRect(8, -37, 5, 9);
  }
  // Copricapo e silhouette dedicate per tutte le fazioni: non sono semplici cambi di colore.
  switch (npc.faction) {
    case "Demone":
      ctx.fillStyle = "#f08a62"; ctx.fillRect(-10, -43, 4, 9); ctx.fillRect(6, -43, 4, 9);
      ctx.fillStyle = "#542b3a"; ctx.fillRect(-9, -44, 3, 5); ctx.fillRect(6, -44, 3, 5);
      break;
    case "Robot":
      ctx.fillStyle = "#b9f4e8"; ctx.fillRect(-2, -47, 4, 9);
      ctx.fillRect(-5, -47, 10, 2); ctx.fillStyle = "#4dd4d0";
      ctx.fillRect(-8, -29, 16, 3); break;
    case "Nuvola":
      ctx.fillStyle = "#dcecff"; ctx.fillRect(-14, -40, 7, 5); ctx.fillRect(7, -40, 7, 5);
      ctx.fillRect(-9, -44, 18, 4); break;
    case "Umano":
      ctx.fillStyle = "#d9a45f"; ctx.fillRect(-12, -41, 24, 4);
      ctx.fillStyle = "#7d3f3a"; ctx.fillRect(-5, -42, 10, 3); break;
    case "Luce":
      ctx.fillStyle = "#ffe99b"; ctx.fillRect(-10, -46, 20, 2);
      ctx.fillRect(-7, -48, 14, 2); ctx.fillStyle = "#fff8d8";
      ctx.fillRect(-1, -51, 2, 3); break;
    case "Dolce":
      ctx.fillStyle = "#f3a8d0"; ctx.fillRect(-13, -42, 7, 6);
      ctx.fillRect(6, -42, 7, 6); ctx.fillStyle = "#ffe4ee";
      ctx.fillRect(-2, -44, 4, 4); break;
    case "Marino":
      ctx.fillStyle = "#65cbd4"; ctx.fillRect(-15, -31, 5, 11);
      ctx.fillRect(10, -31, 5, 11); ctx.fillStyle = "#bcebed";
      ctx.fillRect(-12, -34, 4, 4); ctx.fillRect(8, -34, 4, 4); break;
    case "Orso":
      ctx.fillStyle = "#a87843"; ctx.fillRect(-14, -43, 7, 8);
      ctx.fillRect(7, -43, 7, 8); ctx.fillStyle = "#e2c18a";
      ctx.fillRect(-12, -41, 3, 3); ctx.fillRect(9, -41, 3, 3); break;
    case "Mago":
      ctx.fillStyle = "#49386e"; ctx.fillRect(-13, -42, 26, 4);
      ctx.fillRect(-8, -49, 16, 8); ctx.fillStyle = "#d4c3f4";
      ctx.fillRect(-3, -49, 6, 2); break;
    case "Salato":
      ctx.fillStyle = "#c5c5b4"; ctx.fillRect(-9, -45, 5, 7);
      ctx.fillRect(-2, -49, 5, 11); ctx.fillRect(5, -45, 5, 7); break;
    default:
      ctx.fillStyle = npc.color; ctx.fillRect(-10, -40, 20, 3);
  }

  ctx.fillStyle = "#282532";
  ctx.fillRect(-6, -23, 3, 3); ctx.fillRect(4, -23, 3, 3);  ctx.fillStyle = "#282532";
  ctx.fillRect(-6, -23, 3, 3); ctx.fillRect(4, -23, 3, 3);
  ctx.fillStyle = "#fff0d4";
  ctx.fillRect(-4, -15, 8, 2);

  // Piccolo nome su targhetta scura, senza badge flottante.
  ctx.fillStyle = "rgba(12,18,27,.82)";
  ctx.fillRect(-42, 27, 84, 20);
  ctx.fillStyle = npc.color;
  ctx.fillRect(-42, 27, 4, 20);
  ctx.fillStyle = "#fff4df";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(npc.name, 0, 42, 78);
  ctx.restore();
}

function drawCityIdentity(ctx, city) {
  const accent = city.color || "#d6b47a";
  ctx.save();
  const tower = (x,y,w,h,body,roof) => {
    ctx.fillStyle="rgba(8,13,18,.32)"; ctx.fillRect(x-4,y+h-2,w+8,9);
    ctx.fillStyle=body; ctx.fillRect(x,y,w,h);
    ctx.fillStyle=roof; ctx.fillRect(x-5,y-8,w+10,10);
    ctx.fillStyle="rgba(255,244,210,.75)"; ctx.fillRect(x+5,y+12,5,13); ctx.fillRect(x+w-10,y+12,5,13);
  };
  switch(city.faction) {
    case "Demone":
      ctx.fillStyle="#542b35";ctx.fillRect(-42,-24,84,58);ctx.fillStyle="#bd5360";
      ctx.beginPath();ctx.moveTo(-42,-18);ctx.lineTo(-22,-76);ctx.lineTo(-5,-18);ctx.fill();
      ctx.beginPath();ctx.moveTo(42,-18);ctx.lineTo(22,-76);ctx.lineTo(5,-18);ctx.fill();
      ctx.fillStyle="#ff9a56";ctx.fillRect(-7,-10,14,39);ctx.fillStyle="#ffd17b";ctx.fillRect(-3,-20,6,18);break;
    case "Robot":
      tower(-48,-48,30,90,"#36586a","#8edbd0");tower(18,-60,30,102,"#36586a","#8edbd0");
      ctx.fillStyle="#8be6d8";ctx.fillRect(-3,-83,6,23);ctx.fillRect(-54,5,108,7);
      ctx.fillStyle="#e3f5ce";ctx.fillRect(-7,-36,14,14);break;
    case "Natura":
      ctx.fillStyle="#62472f";ctx.fillRect(-13,-8,26,52);
      for(const [x,y,r] of [[0,-47,43],[-31,-20,29],[31,-19,29],[0,-4,34]]){ctx.fillStyle="#286c46";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle="#a6d879";ctx.fillRect(-6,-56,12,15);ctx.fillRect(-28,-24,9,8);ctx.fillRect(20,-17,9,8);break;
    case "Nuvola":
      ctx.fillStyle="#d8e9fa";ctx.beginPath();ctx.ellipse(0,8,70,20,0,0,Math.PI*2);ctx.fill();
      tower(-12,-80,24,92,"#829ac4","#e4efff");ctx.fillStyle="#c6dcf4";
      ctx.beginPath();ctx.arc(-35,-43,19,0,Math.PI*2);ctx.arc(34,-34,23,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#8bbbe3";ctx.fillRect(-3,-96,6,18);break;
    case "Umano":
      tower(-22,-76,44,120,"#8c6044","#e2b77e");ctx.fillStyle="#f8e4b6";
      ctx.beginPath();ctx.arc(0,-48,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#67432f";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(0,-48);ctx.lineTo(0,-57);ctx.moveTo(0,-48);ctx.lineTo(8,-44);ctx.stroke();
      ctx.fillStyle="#b88955";ctx.fillRect(-58,42,116,8);break;
    case "Luce":
      ctx.fillStyle="#d9ae4d";ctx.beginPath();ctx.moveTo(0,-90);ctx.lineTo(-26,35);ctx.lineTo(26,35);ctx.closePath();ctx.fill();
      ctx.fillStyle="#fff1b6";ctx.beginPath();ctx.arc(0,-43,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffe58b";ctx.lineWidth=6;
      for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*54,-43+Math.sin(a)*54);ctx.lineTo(Math.cos(a)*70,-43+Math.sin(a)*70);ctx.stroke();}break;
    case "Dolce":
      ctx.fillStyle="#b96e9e";ctx.fillRect(-36,-5,72,45);ctx.fillStyle="#f4c0dc";
      ctx.beginPath();ctx.arc(0,-27,35,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#fff0dd";ctx.fillRect(-8,-47,16,76);
      ctx.fillStyle="#e88fbd";ctx.fillRect(-48,44,24,9);ctx.fillRect(24,44,24,9);break;
    case "Marino":
      ctx.fillStyle="#236b85";ctx.fillRect(-76,-5,152,48);ctx.fillStyle="#8ce0e1";ctx.fillRect(-76,3,152,4);ctx.fillRect(-76,31,152,4);
      ctx.fillStyle="#d5c39b";ctx.fillRect(-58,-12,116,13);ctx.fillStyle="#876e52";ctx.fillRect(-58,-18,8,20);ctx.fillRect(50,-18,8,20);
      ctx.fillStyle=accent;ctx.fillRect(-8,-58,16,42);break;
    case "Orso":
      tower(-54,-42,28,84,"#74553c","#c49a61");tower(26,-42,28,84,"#74553c","#c49a61");
      ctx.fillStyle="#b88b55";ctx.fillRect(-35,-53,70,16);ctx.fillStyle="#4b3a30";ctx.fillRect(-20,-8,40,50);
      ctx.fillStyle="#e4c18a";ctx.fillRect(-5,2,10,10);break;
    case "Mago":
      ctx.strokeStyle="#c6b3f4";ctx.lineWidth=8;ctx.strokeRect(-39,-58,78,94);ctx.strokeStyle="#f1d58b";ctx.lineWidth=4;ctx.strokeRect(-22,-40,44,58);
      ctx.fillStyle="#bca8f0";ctx.beginPath();ctx.moveTo(0,-80);ctx.lineTo(-12,-58);ctx.lineTo(12,-58);ctx.closePath();ctx.fill();
      ctx.fillStyle="#fff0bd";ctx.fillRect(-4,-15,8,8);break;
    case "Salato":
      ctx.fillStyle="#8a918d";ctx.fillRect(-58,30,116,12);
      for(const [x,y,h] of [[-34,10,65],[0,-12,90],[35,14,58]]){ctx.fillStyle="#e9e5d6";ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x-15,y+8);ctx.lineTo(x+15,y+8);ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.fillRect(x-3,y-h+18,5,Math.max(8,h-22));}break;
  }
  ctx.restore();
}

function drawFactionDistrictDetails(ctx, city) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const plaque = (text, color) => {
    ctx.fillStyle = "rgba(8,13,18,.86)";
    ctx.fillRect(-76, 188, 152, 22);
    ctx.fillStyle = color;
    ctx.fillRect(-76, 188, 4, 22);
    ctx.fillStyle = "#fff4df";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, 0, 202, 142);
  };
  switch (city.faction) {
    case "Demone":
      for (const x of [-190, 190]) { ctx.fillStyle="#39242d";ctx.fillRect(x-9,-20,18,82);ctx.fillStyle="#c85b55";ctx.beginPath();ctx.moveTo(x-20,-20);ctx.lineTo(x,-68);ctx.lineTo(x+20,-20);ctx.fill();ctx.fillStyle="#ffb36a";ctx.fillRect(x-3,-12,6,38); }
      plaque("FORNACI DELLA BRACE", "#e98261"); break;
    case "Robot":
      for (const x of [-190, 190]) { ctx.fillStyle="#284956";ctx.fillRect(x-18,-48,36,108);ctx.strokeStyle="#70d9cf";ctx.lineWidth=4;ctx.strokeRect(x-12,-38,24,84);ctx.fillStyle="#c3f6df";ctx.fillRect(x-4,-20,8,8); }
      ctx.strokeStyle="#83e4d6";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-190,-58);ctx.lineTo(190,-58);ctx.stroke();plaque("BINARI DEL NUCLEO", "#83e4d6");break;
    case "Natura":
      for (const x of [-190,190]) { ctx.fillStyle="#5a422d";ctx.fillRect(x-7,-5,14,88);ctx.fillStyle="#39784b";for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(x,-26-j*22,30-j*4,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#b9df85";ctx.fillRect(x-4,-52,8,8); }
      plaque("GIARDINI DEL SEME", "#a9d67c");break;
    case "Nuvola":
      for (const x of [-190,190]) { ctx.fillStyle="#d9e9f7";ctx.beginPath();ctx.ellipse(x,0,42,17,0,0,Math.PI*2);ctx.fill();ctx.fillRect(x-4,-72,8,72);ctx.fillStyle="#91b9e5";ctx.fillRect(x-2,-88,4,18); }
      plaque("PORTO DELLE CORRENTI", "#c5def5");break;
    case "Umano":
      for (const x of [-190,190]) { ctx.fillStyle="#79543a";ctx.fillRect(x-32,-26,64,82);ctx.fillStyle="#d4a36d";ctx.fillRect(x-25,-18,50,64);ctx.fillStyle="#f1d6a3";ctx.fillRect(x-5,-4,10,22); }
      plaque("MERCATO DEI VIANDANTI", "#e1b57e");break;
    case "Luce":
      for (const x of [-190,190]) { ctx.fillStyle="#b18b42";ctx.fillRect(x-5,-10,10,76);ctx.fillStyle="#fff0ae";ctx.beginPath();ctx.arc(x,-27,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#f7dc83";ctx.lineWidth=4;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*27,-27+Math.sin(a)*27);ctx.lineTo(x+Math.cos(a)*39,-27+Math.sin(a)*39);ctx.stroke();} }
      plaque("OBELISCHI DELL'ALBA", "#f3df9a");break;
    case "Dolce":
      for (const x of [-190,190]) { ctx.fillStyle="#a75e91";ctx.fillRect(x-24,-8,48,64);ctx.fillStyle="#f0b8d6";ctx.beginPath();ctx.arc(x,-12,30,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#fff0df";ctx.fillRect(x-5,8,10,48); }
      plaque("GIARDINI CANDITI", "#f0b8d6");break;
    case "Marino":
      for (const x of [-190,190]) { ctx.fillStyle="#276c82";ctx.fillRect(x-8,-45,16,102);ctx.fillStyle="#8ce0e1";ctx.fillRect(x-32,-48,64,5);ctx.fillRect(x-32,4,64,5);ctx.fillStyle="#d9c99f";ctx.fillRect(x-25,-60,50,12); }
      plaque("PONTILI DELLE MAREE", "#8ce0e1");break;
    case "Orso":
      for (const x of [-190,190]) { ctx.fillStyle="#604631";ctx.fillRect(x-27,-18,54,78);ctx.fillStyle="#b58b59";ctx.beginPath();ctx.moveTo(x-34,-18);ctx.lineTo(x,-62);ctx.lineTo(x+34,-18);ctx.fill();ctx.fillStyle="#e6c58e";ctx.fillRect(x-7,5,14,14); }
      plaque("BASTIONI DEL BRANCO", "#d0ad76");break;
    case "Mago":
      for (const x of [-190,190]) { ctx.strokeStyle="#c4b2f0";ctx.lineWidth=7;ctx.strokeRect(x-25,-44,50,100);ctx.strokeStyle="#f2d68a";ctx.lineWidth=3;ctx.strokeRect(x-14,-30,28,70);ctx.fillStyle="#f2d68a";ctx.fillRect(x-4,-62,8,12); }
      plaque("ARCHIVIO DELL'ETERE", "#c4b2f0");break;
    case "Salato":
      for (const x of [-190,190]) { ctx.fillStyle="#8a918d";ctx.fillRect(x-32,42,64,14);ctx.fillStyle="#e8e4d5";ctx.beginPath();ctx.moveTo(x,-78);ctx.lineTo(x-28,42);ctx.lineTo(x+28,42);ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.fillRect(x-3,-48,6,72); }
      plaque("VASCHE DEL SALE", "#e8e4d5");break;
  }
  ctx.restore();
}

function drawCityDistrict(ctx, city) {
  if (city.faction === "Natura") {
    drawAdventureNaturaCity(ctx, city);
    return;
  }
  if (city.faction === "Amaro") {
    drawAdventureAmaroCity(ctx, city);
    return;
  }
  const x = Math.round(city.x / 4) * 4;
  const y = Math.round(city.y / 4) * 4;
  const color = city.color || "#d6b47a";
  const buildings = [
    [-132, -88], [0, -158], [132, -88],
    [-132, 88], [132, 88], [0, 158],
  ];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.55, 1.55);
  ctx.imageSmoothingEnabled = false;

  // Piazza e anello stradale: quartiere ampio in stile RPG 2010.
  ctx.fillStyle = "rgba(20,25,28,.24)";
  ctx.beginPath(); ctx.ellipse(0, 8, 190, 156, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(220,202,158,.72)";
  ctx.lineWidth = 17;
  ctx.beginPath(); ctx.ellipse(0, 0, 168, 135, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(111,91,64,.55)";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 168, 135, 0, 0, Math.PI * 2); ctx.stroke();

  // Pavimentazione modulare e leggibile: la piazza ha una trama prospettica,
  // bordi in pietra e piccoli riflessi, senza trasformarsi in una griglia piatta.
  ctx.fillStyle = "rgba(238,220,177,.22)";
  ctx.beginPath(); ctx.ellipse(0, 0, 142, 111, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(91,76,58,.24)";
  ctx.lineWidth = 2;
  for (let row = -4; row <= 4; row++) {
    const py = row * 22;
    const half = 132 * Math.sqrt(Math.max(.08, 1 - (py * py) / (112 * 112)));
    ctx.beginPath(); ctx.moveTo(-half, py); ctx.lineTo(half, py); ctx.stroke();
  }
  for (let col = -5; col <= 5; col++) {
    const px = col * 25;
    ctx.beginPath(); ctx.moveTo(px, -108); ctx.lineTo(px * .82, 108); ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,245,215,.32)";
  ctx.fillRect(-118, -5, 236, 3);
  ctx.fillRect(-3, -91, 6, 182);

  // Piccole aiuole e lampioni ai margini della piazza, come landmark urbani DS.
  for (const side of [-1, 1]) {
    const lx = side * 151;
    ctx.fillStyle = "rgba(8,15,18,.28)";
    ctx.beginPath(); ctx.ellipse(lx + 3, 52, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = city.faction === "Marino" ? "#347b83" : "#66513a";
    ctx.fillRect(lx - 3, 12, 6, 39);
    ctx.fillStyle = city.faction === "Luce" || city.faction === "Nuvola" ? "#fff0ad" : color;
    ctx.fillRect(lx - 8, 4, 16, 11);
    ctx.fillStyle = "rgba(255,246,208,.8)";
    ctx.fillRect(lx - 3, 6, 6, 5);
    ctx.fillStyle = city.faction === "Natura" || city.faction === "Dolce" ? "#4f8a50" : "#8b7655";
    ctx.fillRect(lx - 15, 57, 30, 8);
    ctx.fillStyle = city.faction === "Natura" ? "#91c86b" : "#c4a36c";
    ctx.fillRect(lx - 10, 53, 7, 5);
    ctx.fillRect(lx + 4, 51, 7, 7);
  }

  // Arredi urbani: piccoli punti d'interesse ai margini, senza invadere
  // il passaggio centrale del giocatore o modificare collisioni e gameplay.
  const props = (side) => {
    const px = side * 112;
    const py = side < 0 ? -34 : 34;
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = "rgba(5,12,18,.32)";
    ctx.fillRect(-17, 25, 38, 7);
    switch (city.faction) {
      case "Demone":
        ctx.fillStyle = "#492b35"; ctx.fillRect(-11, -2, 22, 27);
        ctx.fillStyle = "#c95b4f"; ctx.fillRect(-8, -13, 16, 13);
        ctx.fillStyle = "#ffb36a"; ctx.fillRect(-3, -10, 6, 12);
        ctx.fillStyle = "#f6d18b"; ctx.fillRect(-1, -19, 3, 7); break;
      case "Robot":
        ctx.fillStyle = "#294b59"; ctx.fillRect(-14, -19, 28, 44);
        ctx.fillStyle = "#75d9cf"; ctx.fillRect(-9, -13, 18, 22);
        ctx.fillStyle = "#d8fff0"; ctx.fillRect(-4, -8, 8, 7);
        ctx.fillStyle = "#5b8490"; ctx.fillRect(-18, 21, 36, 5); break;
      case "Natura":
        ctx.fillStyle = "#61452e"; ctx.fillRect(-5, 2, 10, 24);
        ctx.fillStyle = "#3d7849";
        ctx.beginPath(); ctx.arc(0, -7, 17, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#a9d875"; ctx.fillRect(-4, -12, 8, 8);
        ctx.fillStyle = "#8d6840"; ctx.fillRect(-18, 23, 36, 5); break;
      case "Nuvola":
        ctx.fillStyle = "#6d8db5"; ctx.fillRect(-3, -4, 6, 29);
        ctx.fillStyle = "#e3f2ff";
        ctx.beginPath(); ctx.arc(-8, -12, 10, 0, Math.PI * 2); ctx.arc(5, -16, 13, 0, Math.PI * 2); ctx.arc(14, -8, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#a9c9ed"; ctx.fillRect(-14, 23, 28, 4); break;
      case "Umano":
        ctx.fillStyle = "#745039"; ctx.fillRect(-19, -8, 38, 31);
        ctx.fillStyle = "#c58b54"; ctx.fillRect(-16, -5, 32, 5);
        ctx.fillStyle = "#f1d6a3"; ctx.fillRect(-13, 1, 26, 3);
        ctx.fillStyle = "#62432f"; ctx.fillRect(-15, 23, 4, 5); ctx.fillRect(11, 23, 4, 5); break;
      case "Luce":
        ctx.fillStyle = "#a47e36"; ctx.fillRect(-4, -1, 8, 27);
        ctx.fillStyle = "#fff0ae"; ctx.beginPath(); ctx.arc(0, -10, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f3d77b"; ctx.fillRect(-2, -27, 4, 8);
        ctx.fillRect(-19, -12, 8, 4); ctx.fillRect(11, -12, 8, 4); break;
      case "Dolce":
        ctx.fillStyle = "#9f5e8d"; ctx.fillRect(-16, 1, 32, 24);
        ctx.fillStyle = "#f0b6d5"; ctx.beginPath(); ctx.arc(0, 0, 17, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff0df"; ctx.fillRect(-3, 4, 6, 17);
        ctx.fillStyle = "#d985b6"; ctx.fillRect(-19, 22, 38, 4); break;
      case "Marino":
        ctx.fillStyle = "#286b82"; ctx.fillRect(-15, -8, 30, 33);
        ctx.fillStyle = "#8ce0e1"; ctx.fillRect(-19, -12, 38, 5);
        ctx.fillStyle = "#d5c59c"; ctx.fillRect(-11, -18, 22, 7);        ctx.fillStyle = "#174b65"; ctx.fillRect(-18, 23, 36, 5); break;
      case "Orso":
        ctx.fillStyle = "#604631"; ctx.fillRect(-17, -2, 34, 27);
        ctx.fillStyle = "#b58b59"; ctx.beginPath(); ctx.moveTo(-20, -2); ctx.lineTo(0, -22); ctx.lineTo(20, -2); ctx.fill();
        ctx.fillStyle = "#e6c58e"; ctx.fillRect(-5, 5, 10, 10);
        ctx.fillStyle = "#49372b"; ctx.fillRect(-20, 23, 40, 5); break;
      case "Mago":
        ctx.strokeStyle = "#c8b8f2"; ctx.lineWidth = 5; ctx.strokeRect(-14, -16, 28, 42);
        ctx.strokeStyle = "#f2d68a"; ctx.lineWidth = 2; ctx.strokeRect(-7, -8, 14, 25);
        ctx.fillStyle = "#f2d68a"; ctx.fillRect(-2, -23, 4, 7); break;
      case "Salato":
        ctx.fillStyle = "#777e7a"; ctx.fillRect(-17, 15, 34, 10);
        ctx.fillStyle = "#e7e4d7"; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-15, 15); ctx.lineTo(15, 15); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillRect(-2, -12, 4, 25);
        ctx.fillStyle = "#b8b9ae"; ctx.fillRect(-20, 24, 40, 4); break;
    }
    ctx.restore();
  };
  props(-1);
  props(1);

  // Monumenti, skyline e piazze differenti per ciascuna fazione.
  drawCityIdentity(ctx, city);
  drawFactionDistrictDetails(ctx, city);

  // Sei edifici con silhouette, materiali e coperture specifiche per fazione.
  const architecture = {
    Demone: { wall: "#603544", roof: "#bd5962", trim: "#f08a65", shadow: "#38232e" },
    Robot: { wall: "#456b77", roof: "#9bd9d2", trim: "#d5f5e8", shadow: "#233e4c" },
    Natura: { wall: "#806b43", roof: "#54834d", trim: "#b9df85", shadow: "#493d2c" },
    Nuvola: { wall: "#8298b8", roof: "#d8e9fa", trim: "#f7fbff", shadow: "#536b8b" },
    Umano: { wall: "#89664b", roof: "#bd9566", trim: "#f1d6a3", shadow: "#59402f" },
    Luce: { wall: "#b18b43", roof: "#f4df9a", trim: "#fff5c4", shadow: "#72552f" },
    Dolce: { wall: "#a86b91", roof: "#e9a9cc", trim: "#fff0df", shadow: "#714566" },
    Marino: { wall: "#34758a", roof: "#65c8d2", trim: "#d5f5ed", shadow: "#204d63" },
    Orso: { wall: "#74553c", roof: "#c49a61", trim: "#e8c990", shadow: "#49382d" },
    Mago: { wall: "#594b79", roof: "#b6a0e7", trim: "#f2d68a", shadow: "#39304f" },
    Salato: { wall: "#85877e", roof: "#d2d0c2", trim: "#fff7e4", shadow: "#555b59" },
  };
  const style = architecture[city.faction] || architecture.Umano;

  // Ramificazioni in pietra collegano la piazza agli ingressi delle case.
  ctx.lineCap = "round";
  for (const [bx, by] of buildings) {
    ctx.strokeStyle = "rgba(76,63,49,.38)";
    ctx.lineWidth = 17;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bx * .78, by * .78); ctx.stroke();
    ctx.strokeStyle = "rgba(235,216,176,.55)";
    ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bx * .78, by * .78); ctx.stroke();
  }

  buildings.forEach(([bx, by], index) => {
    const w = index % 3 === 0 ? 62 : 54;
    const h = index % 2 === 0 ? 48 : 56;
    const left = bx - w / 2;
    const top = by - h / 2;
    // Ombra lunga e fondamenta a due livelli.
    ctx.fillStyle = "rgba(5,12,18,.38)";
    ctx.fillRect(left + 7, top + h - 1, w + 5, 14);
    ctx.fillStyle = style.shadow;
    ctx.fillRect(left - 4, top + 8, w + 8, h - 2);
    ctx.fillStyle = style.wall;
    ctx.fillRect(left, top + 12, w, h - 12);
    ctx.fillStyle = style.trim;
    ctx.fillRect(left + 3, top + 13, w - 6, 4);
    ctx.fillStyle = "rgba(255,239,202,.22)";
    ctx.fillRect(left + 3, top + 18, 3, h - 25);

    // Tetti diversi: cupole, terrazze, tetti a spiovente o guglie.
    ctx.fillStyle = style.roof;
    if (city.faction === "Nuvola" || city.faction === "Luce" || city.faction === "Dolce") {
      ctx.beginPath();
      ctx.ellipse(bx, top + 14, w * .58, city.faction === "Dolce" ? 17 : 13, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      if (city.faction === "Dolce") {
        ctx.fillRect(left + 4, top + 12, w - 8, 8);
        ctx.fillStyle = style.trim;
        ctx.fillRect(bx - 3, top - 3, 6, 15);
      }
    } else if (city.faction === "Robot" || city.faction === "Marino" || city.faction === "Salato") {
      ctx.fillRect(left - 5, top + 5, w + 10, 10);
      ctx.fillStyle = style.trim;
      ctx.fillRect(left - 2, top + 2, w + 4, 3);
      if (city.faction === "Robot") {
        ctx.fillStyle = "#6acbc5";
        ctx.fillRect(bx - 5, top - 10, 10, 14);
        ctx.fillRect(bx - 2, top - 17, 4, 8);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(left - 6, top + 15);
      ctx.lineTo(bx, top - (city.faction === "Demone" || city.faction === "Mago" ? 22 : 13));
      ctx.lineTo(left + w + 6, top + 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = style.trim;
      ctx.fillRect(bx - 2, top - 7, 4, 12);
    }

    // Finestre incassate con vetro, riflesso e davanzale.
    for (const wx of [left + 10, left + w - 20]) {
      ctx.fillStyle = style.shadow;
      ctx.fillRect(wx - 2, top + 25, 13, 14);
      ctx.fillStyle = city.faction === "Luce" || city.faction === "Nuvola" ? "#fff0b8" : "#8ed1d5";
      ctx.fillRect(wx, top + 27, 9, 10);
      ctx.fillStyle = "rgba(255,255,255,.62)";
      ctx.fillRect(wx + 1, top + 27, 2, 8);
      ctx.fillStyle = style.trim;
      ctx.fillRect(wx - 3, top + 39, 15, 3);
      ctx.fillRect(wx - 3, top + 24, 2, 16);
      ctx.fillRect(wx + 10, top + 24, 2, 16);
    }

    // Porta, maniglia e gradino.
    ctx.fillStyle = style.shadow;
    ctx.fillRect(bx - 7, top + h - 20, 14, 20);
    ctx.fillStyle = "#382d2b";
    ctx.fillRect(bx - 5, top + h - 18, 10, 18);
    ctx.fillStyle = style.trim;
    ctx.fillRect(bx + 2, top + h - 11, 2, 3);
    ctx.fillStyle = "rgba(255,226,166,.5)";
    ctx.fillRect(bx - 9, top + h, 18, 3);

    // Insegna o stemma sopra la porta, diverso per ogni quartiere.
    ctx.fillStyle = style.shadow;
    ctx.fillRect(bx - 10, top + h - 29, 20, 7);
    ctx.fillStyle = style.trim;
    ctx.fillRect(bx - 7, top + h - 27, 14, 3);
    if (index % 2 === 0) {
      ctx.fillStyle = style.trim;
      ctx.fillRect(bx - 2, top + h - 34, 4, 5);
    }

    // Tegole e dettagli sul bordo del tetto.
    ctx.fillStyle = "rgba(38,31,36,.28)";
    for (let tile = 0; tile < 4; tile++) {
      ctx.fillRect(left + 5 + tile * 13, top + 7, 8, 3);
    }
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.fillRect(left + 4, top + 16, w - 8, 2);
  });

  // Portale d'ingresso aperto verso il basso: il viaggiatore resta al centro.
  ctx.fillStyle = "#d5bd8a";
  ctx.fillRect(-34, 116, 68, 12);
  ctx.fillStyle = "#72553c";
  ctx.fillRect(-22, 112, 44, 7);
  ctx.restore();
}

function drawWildArea(ctx, area) {
  const x = area.x;
  const y = area.y;
  const r = area.radius;
  const areaScale = r / 190;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(areaScale, areaScale);
  ctx.imageSmoothingEnabled = false;

  // Ampia radura esplorabile: terreno a livelli, contorno netto e palette vivace da RPG 2010.
  ctx.fillStyle = area.color + "32";
  ctx.beginPath(); ctx.ellipse(0, 0, 190, 145, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(18,31,27,.20)";
  ctx.beginPath(); ctx.ellipse(0, 8, 180, 137, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = area.color + "20";
  ctx.beginPath(); ctx.ellipse(0, -5, 172, 130, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = area.color;
  ctx.globalAlpha = .72;
  ctx.lineWidth = 7;
  ctx.setLineDash([18, 13]);
  ctx.beginPath(); ctx.ellipse(0, 0, 182, 137, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Un landmark centrale diverso per ciascun bioma.
  if (area.biome === "lava") {
    ctx.fillStyle = "#542b35"; ctx.fillRect(-42, -24, 84, 58);
    ctx.fillStyle = "#d45b42"; ctx.beginPath(); ctx.moveTo(-34, 20); ctx.lineTo(-18, -48); ctx.lineTo(-2, 20); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, 20); ctx.lineTo(23, -58); ctx.lineTo(38, 20); ctx.fill();
    ctx.fillStyle = "#ffbd69"; ctx.fillRect(-7, -5, 14, 35);
  } else if (area.biome === "circuit") {
    ctx.fillStyle = "#244b5b"; ctx.fillRect(-48, -34, 96, 68);
    ctx.strokeStyle = "#7be0d3"; ctx.lineWidth = 5;
    ctx.strokeRect(-34, -20, 68, 40); ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-34, 0); ctx.moveTo(34, 0); ctx.lineTo(70, 0); ctx.stroke();
    ctx.fillStyle = "#b6f2d9"; ctx.fillRect(-8, -8, 16, 16);
  } else if (area.biome === "forest") {
    for (const [tx, ty, size] of [[-38, 12, 42], [0, -28, 52], [40, 16, 38]]) {
      ctx.fillStyle = "#513b2b"; ctx.fillRect(tx - 5, ty, 10, 48);
      ctx.fillStyle = "#24583a"; ctx.beginPath(); ctx.moveTo(tx, ty - size); ctx.lineTo(tx - size * .7, ty + 10); ctx.lineTo(tx + size * .7, ty + 10); ctx.fill();
      ctx.fillStyle = "#8fbd62"; ctx.fillRect(tx - 4, ty - size * .35, 8, 8);
    }
  } else if (area.biome === "cloud") {
    ctx.fillStyle = "#d9e9f7";
    for (const [cx, cy, cr] of [[-28, 0, 27], [0, -18, 38], [32, 4, 25]]) { ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#8db8e4"; ctx.fillRect(-8, 12, 16, 38);
  } else if (area.biome === "prairie") {
    ctx.fillStyle = "#9b7548"; ctx.fillRect(-52, 18, 104, 18);
    ctx.fillStyle = "#d8b47a"; ctx.fillRect(-42, 22, 84, 5);
    ctx.fillStyle = "#76583d"; ctx.fillRect(-25, -30, 50, 42);
    ctx.fillStyle = "#d6a16e"; ctx.fillRect(-18, -24, 36, 30);
  } else if (area.biome === "sun") {
    ctx.fillStyle = "#c69b47"; ctx.beginPath(); ctx.arc(0, -5, 42, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff0a8"; ctx.lineWidth = 6;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 52, -5 + Math.sin(a) * 52); ctx.lineTo(Math.cos(a) * 72, -5 + Math.sin(a) * 72); ctx.stroke(); }
    ctx.fillStyle = "#fff3bd"; ctx.beginPath(); ctx.arc(0, -5, 19, 0, Math.PI * 2); ctx.fill();
  } else if (area.biome === "candy") {
    ctx.fillStyle = "#a95f91"; ctx.fillRect(-42, 5, 84, 34);
    ctx.fillStyle = "#f3bad7";
    for (const [fx, fy] of [[-30, -24], [0, -44], [30, -20]]) { ctx.beginPath(); ctx.arc(fx, fy, 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#fff1df"; ctx.fillRect(-5, -12, 10, 46);
  } else if (area.biome === "ocean") {
    ctx.fillStyle = "#1c5b75"; ctx.beginPath(); ctx.ellipse(0, 8, 68, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8ce0e1"; ctx.lineWidth = 5;
    for (let yy = -8; yy <= 18; yy += 13) { ctx.beginPath(); ctx.moveTo(-50, yy); ctx.quadraticCurveTo(0, yy - 12, 50, yy); ctx.stroke(); }
    ctx.fillStyle = "#5fc2c7"; ctx.fillRect(-8, -44, 16, 35);
  } else if (area.biome === "mountain") {
    ctx.fillStyle = "#554536";
    ctx.beginPath(); ctx.moveTo(-65, 35); ctx.lineTo(-30, -48); ctx.lineTo(0, 8); ctx.lineTo(32, -62); ctx.lineTo(70, 35); ctx.fill();
    ctx.fillStyle = "#e3c18a"; ctx.beginPath(); ctx.moveTo(-30, -48); ctx.lineTo(-14, -9); ctx.lineTo(-43, -14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(32, -62); ctx.lineTo(50, -20); ctx.lineTo(17, -22); ctx.fill();
  } else if (area.biome === "arcane") {
    ctx.strokeStyle = "#c8b7f4"; ctx.lineWidth = 8;
    ctx.strokeRect(-44, -48, 88, 90);
    ctx.strokeRect(-24, -28, 48, 50);
    ctx.fillStyle = "#f2d68a"; ctx.beginPath(); ctx.arc(0, -4, 12, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = "#777e79"; ctx.fillRect(-48, 16, 96, 24);
    ctx.fillStyle = "#e8e2cb";
    for (const [sx, sy, sh] of [[-28, 8, 48], [0, -12, 70], [29, 10, 43]]) {
      ctx.beginPath(); ctx.moveTo(sx, sy - sh); ctx.lineTo(sx - 15, sy + 8); ctx.lineTo(sx + 15, sy + 8); ctx.closePath(); ctx.fill();
    }
  }

  // Ecosistema di contorno: silhouette diverse per ogni bioma, posizionate con seed fisso.
  for (let i = 0; i < 18; i++) {
    const angle = i * 2.399;
    const distance = 96 + (i % 4) * 17;
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance * .7;
    const flip = i % 2 ? 1 : -1;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(flip, 1);
    switch (area.biome) {
      case "lava":
        ctx.fillStyle = "#392b31"; ctx.fillRect(-7, -3, 17, 12);
        ctx.fillStyle = i % 3 ? "#a94d43" : "#ef8050";
        ctx.fillRect(-4, -6, 10, 5); ctx.fillRect(2, -9, 3, 4);
        if (i % 3 === 0) { ctx.fillStyle = "rgba(255,176,91,.7)"; ctx.fillRect(5, -13, 2, 3); }
        break;
      case "circuit":
        ctx.strokeStyle = "#76cfc3"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-10, 0); ctx.lineTo(0, 0); ctx.lineTo(0, -8); ctx.lineTo(10, -8); ctx.stroke();
        ctx.fillStyle = "#c5f5e7"; ctx.fillRect(-12, 6, 4, 4); ctx.fillRect(8, -10, 4, 4);
        break;
      case "forest":
        ctx.fillStyle = "#513b2b"; ctx.fillRect(-3, -2, 6, 16);
        ctx.fillStyle = i % 2 ? "#286044" : "#43834b";
        ctx.fillRect(-10, -10, 20, 12); ctx.fillRect(-7, -15, 14, 8);
        ctx.fillStyle = "#a8d477"; ctx.fillRect(-5, -12, 4, 3);
        if (i % 3 === 0) { ctx.fillStyle = "#e7c1d2"; ctx.fillRect(10, 4, 4, 4); }
        break;
      case "cloud":
        ctx.fillStyle = "rgba(245,251,255,.9)";
        ctx.beginPath(); ctx.arc(-6, 0, 7, 0, Math.PI * 2); ctx.arc(2, -5, 9, 0, Math.PI * 2); ctx.arc(10, 1, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#9fc2e5"; ctx.fillRect(-2, 6, 8, 3);
        break;
      case "prairie":
        ctx.fillStyle = "#72543a"; ctx.fillRect(-9, 5, 18, 4);
        ctx.fillStyle = "#d0a16c"; ctx.fillRect(-7, 1, 14, 4);
        ctx.fillStyle = "#72944f"; ctx.fillRect(-2, -9, 3, 13); ctx.fillRect(-7, -5, 5, 3); ctx.fillRect(2, -7, 5, 3);
        if (i % 3 === 0) { ctx.fillStyle = "#e9c7a1"; ctx.fillRect(7, -12, 4, 4); }
        break;
      case "sun":
        ctx.fillStyle = "#9b7838"; ctx.fillRect(-3, -2, 6, 15);
        ctx.fillStyle = "#4f7c45"; ctx.fillRect(-12, -9, 24, 12);
        ctx.fillStyle = "#e8bf53"; ctx.fillRect(-8, -14, 16, 9);
        ctx.fillStyle = "#fff1ad"; ctx.fillRect(-3, -11, 6, 4);
        break;
      case "candy":
        ctx.fillStyle = "#a95f91"; ctx.fillRect(-3, 0, 6, 13);
        ctx.fillStyle = i % 2 ? "#f4b8d6" : "#e7a7cb";
        ctx.fillRect(-11, -8, 22, 10); ctx.fillRect(-7, -13, 14, 7);
        ctx.fillStyle = "#fff2df"; ctx.fillRect(-2, -10, 4, 4);
        break;
      case "ocean":
        ctx.strokeStyle = i % 2 ? "#8ce0e1" : "#3b9eaa"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-12, 5); ctx.quadraticCurveTo(-5, -5, 2, 5); ctx.quadraticCurveTo(9, 14, 13, 2); ctx.stroke();
        ctx.fillStyle = "#e7d6ad"; ctx.fillRect(-10, -5, 5, 3);
        break;
      case "mountain":
        ctx.fillStyle = "#554536"; ctx.beginPath(); ctx.moveTo(-12, 10); ctx.lineTo(-5, -11); ctx.lineTo(2, 2); ctx.lineTo(9, -8); ctx.lineTo(14, 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#e3c18a"; ctx.fillRect(-6, -8, 4, 5); ctx.fillRect(7, -6, 3, 4);
        break;
      case "arcane":
        ctx.strokeStyle = "#bba9ec"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#f2d68a"; ctx.fillRect(-2, -12, 4, 4); ctx.fillRect(-2, 8, 4, 4);
        ctx.fillStyle = "#d8cafa"; ctx.fillRect(-2, -2, 4, 4);
        break;
      default:
        ctx.fillStyle = "#858b82"; ctx.fillRect(-9, 2, 18, 8);
        ctx.fillStyle = "#e8e2cb"; ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-3, -12); ctx.lineTo(2, 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1, 2); ctx.lineTo(8, -8); ctx.lineTo(11, 2); ctx.closePath(); ctx.fill();
        break;
    }
    ctx.restore();
  }

  // Nome dell'area, leggibile anche a distanza di esplorazione.
  ctx.fillStyle = "rgba(7,13,18,.82)";
  ctx.fillRect(-112, 145 * .76 - 30, 224, 24);
  ctx.fillStyle = "#fff4df";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(area.name, 0, 145 * .76 - 13, 216);
  ctx.restore();
}

// Dettagli ambientali animati e punti d'interesse per tutte le città.
function drawAdventureFactionCityLife(ctx, city) {
  if (city.faction === "Amaro" || city.faction === "Natura") return; // Verdelume possiede già un renderer completo e animato.
  const palette = {
    Demone:["#5b2938","#d85b4f","#ffb45f"], Robot:["#234b59","#66d7d0","#d8fff2"],
    Nuvola:["#647fa5","#b9d8f3","#f7fbff"], Umano:["#6a4935","#c28a55","#f4d7a0"],
    Luce:["#8a6b2f","#f0d36d","#fff4bd"], Dolce:["#75476d","#d78db8","#ffe0ef"],
    Marino:["#174b63","#3aa9b8","#baf4e9"], Orso:["#49382b","#9a7046","#e7c48c"],
    Mago:["#382d58","#9079c9","#e4d5ff"], Salato:["#4e5b5b","#aebbb2","#f3eedc"]
  };
  const [dark, main, glow] = palette[city.faction] || palette.Umano;
  const t = performance.now() / 1000;
  ctx.save();
  ctx.translate(Math.round(city.x), Math.round(city.y));
  ctx.scale(1.55, 1.55);
  ctx.imageSmoothingEnabled = false;
  const block = (x,y,w,h,color) => { ctx.fillStyle=color; ctx.fillRect(x,y,w,h); };
  const spark = (x,y,phase=0) => {
    const pulse = 0.55 + (Math.sin(t*2.2+phase)+1)*0.22;
    ctx.globalAlpha = pulse;
    block(x,y,4,4,glow); block(x+1,y-3,2,10,main); block(x-3,y+1,10,2,main);
    ctx.globalAlpha = 1;
  };
  // Quattro presidi riconoscibili circondano la piazza, senza coprire porte o case.
  const sites = [[-245,-80], [245,-80], [-245,80], [245,80]];
  sites.forEach(([x,y],i) => {
    ctx.fillStyle = "rgba(5,12,18,.28)";
    ctx.beginPath(); ctx.ellipse(x,y+18,32,9,0,0,Math.PI*2); ctx.fill();
    if (city.faction === "Demone") {
      block(x-18,y-27,36,43,dark); block(x-13,y-22,26,33,main);
      block(x-5,y-35,4,12,glow); block(x+5,y-39,4,16,glow);
      spark(x+23,y-28,i);
    } else if (city.faction === "Robot") {
      block(x-22,y-30,44,45,dark); block(x-17,y-25,34,34,main);
      block(x-12,y-19,24,3,glow); block(x-4,y-13,8,10,glow);
      block(x-27,y-35,54,4,glow);
    } else if (city.faction === "Nuvola") {
      ctx.fillStyle = main;
      [[-15,-8,15],[0,-23,20],[18,-9,14]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,Math.PI*2);ctx.fill();});
      block(x-2,y-2,4,23,glow); spark(x+22,y-31,i);
    } else if (city.faction === "Umano") {
      block(x-27,y-24,54,7,dark); block(x-23,y-17,46,25,main);
      for(let k=0;k<4;k++) block(x-20+k*13,y-12,7,17,k%2?glow:dark);
      block(x-31,y+9,62,4,glow);
    } else if (city.faction === "Luce") {
      ctx.fillStyle = main; ctx.beginPath(); ctx.moveTo(x,y-43);ctx.lineTo(x+25,y-7);ctx.lineTo(x,y+16);ctx.lineTo(x-25,y-7);ctx.closePath();ctx.fill();
      ctx.strokeStyle=glow;ctx.lineWidth=3;ctx.stroke();
      spark(x,y-8,i);
    } else if (city.faction === "Dolce") {
      for(let k=0;k<6;k++){const a=k*Math.PI/3;ctx.fillStyle=k%2?main:glow;ctx.beginPath();ctx.arc(x+Math.cos(a)*17,y-12+Math.sin(a)*17,10,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle=dark;ctx.beginPath();ctx.arc(x,y-12,7,0,Math.PI*2);ctx.fill();
    } else if (city.faction === "Marino") {
      ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(x,y-2,31,17,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=main;ctx.beginPath();ctx.ellipse(x,y-7,25,12,0,0,Math.PI*2);ctx.fill();
      for(let k=0;k<4;k++) block(x-20+k*13,y-24-(k%2)*6,4,17,glow);
      spark(x+27,y-26,i);
    } else if (city.faction === "Orso") {
      block(x-27,y-10,54,23,dark);block(x-22,y-19,44,18,main);
      block(x-22,y-27,10,10,glow);block(x+12,y-27,10,10,glow);
      block(x-5,y-3,10,6,dark);
    } else if (city.faction === "Mago") {
      block(x-24,y-29,48,39,dark);block(x-18,y-23,36,27,main);
      block(x-3,y-19,6,21,glow);spark(x,y-38,i);
    } else if (city.faction === "Salato") {
      for(let k=0;k<5;k++){ctx.fillStyle=k%2?main:glow;ctx.beginPath();ctx.moveTo(x-25+k*12,y+10);ctx.lineTo(x-19+k*12,y-31-(k%2)*10);ctx.lineTo(x-13+k*12,y+10);ctx.closePath();ctx.fill();}
      block(x-31,y+11,62,4,dark);
    }
  });
  // Piccoli elementi di vita: scintille, rune, bolle o petali secondo la fazione.
  for(let i=0;i<10;i++){
    const phase=t*(0.65+(i%3)*0.16)+i*1.7;
    const px=Math.sin(phase)*(190+(i%2)*24);
    const py=Math.cos(phase*0.8)*116;
    ctx.globalAlpha=0.35+(Math.sin(phase*2)+1)*0.22;
    if(city.faction==="Marino"){ctx.strokeStyle=glow;ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,3+(i%3),0,Math.PI*2);ctx.stroke();}
    else if(city.faction==="Demone"){block(px,py,3,5,glow);}
    else if(city.faction==="Robot"){block(px,py,5,2,glow);}
    else if(city.faction==="Dolce"){block(px,py,4,4,i%2?main:glow);}
    else if(city.faction==="Nuvola"){ctx.beginPath();ctx.arc(px,py,3+(i%2),0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();}
    else {block(px,py,3,3,glow);}
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

function drawCityLandmark(ctx, city) {
  if (city.faction === "Amaro" || city.faction === "Natura") return; // Il Grande Seme è già integrato nel renderer di Verdelume.
  const x = Math.round(city.x / 4) * 4;
  const y = Math.round((city.y - 66) / 4) * 4;
  const accent = city.color || "#e5c17f";
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.3, 1.3);
  ctx.imageSmoothingEnabled = false;

  // Piattaforma in pietra, ombra e iscrizione della città.
  ctx.fillStyle = "rgba(5,12,18,.32)";
  ctx.fillRect(-48, 27, 96, 12);
  ctx.fillStyle = "#4a4a50";
  ctx.fillRect(-46, 17, 92, 12);
  ctx.fillStyle = "#77747a";
  ctx.fillRect(-42, 17, 84, 5);
  ctx.fillStyle = accent;
  ctx.fillRect(-34, 13, 68, 3);

  // Ogni città ha un landmark astratto diverso dalla propria fazione.
  switch (city.faction) {
    case "Demone":
      ctx.fillStyle="#6f1724";ctx.fillRect(-25,-15,50,31);ctx.fillStyle="#ff3b24";
      ctx.beginPath();ctx.moveTo(-12,-12);ctx.lineTo(-37,-54);ctx.lineTo(-29,-13);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(12,-12);ctx.lineTo(37,-54);ctx.lineTo(29,-13);ctx.lineTo(8,0);ctx.closePath();ctx.fill();ctx.fillStyle="#ffb13b";ctx.fillRect(-31,-48,5,15);ctx.fillRect(26,-48,5,15);break;
    case "Robot":
      ctx.fillStyle="#4f5b65";ctx.fillRect(-29,-33,58,49);ctx.fillStyle="#8b969f";ctx.fillRect(-23,-27,46,36);
      ctx.fillStyle="#d4d9de";ctx.fillRect(-16,-20,9,9);ctx.fillRect(7,-20,9,9);ctx.fillStyle="#4f5b65";ctx.fillRect(-10,-5,20,5);
      ctx.fillStyle="#d4d9de";ctx.fillRect(-5,-42,10,9);ctx.fillRect(-36,-15,7,22);ctx.fillRect(29,-15,7,22);break;
    case "Natura":
      ctx.fillStyle="#254c32";ctx.fillRect(-6,-12,12,29);ctx.fillStyle="#2f7b3f";
      ctx.beginPath();ctx.moveTo(0,-57);ctx.quadraticCurveTo(-31,-44,-21,-16);ctx.quadraticCurveTo(-5,-15,0,-31);ctx.quadraticCurveTo(5,-15,21,-16);ctx.quadraticCurveTo(31,-44,0,-57);ctx.fill();
      ctx.fillStyle="#79bd58";ctx.fillRect(-2,-43,4,31);ctx.fillRect(-17,-28,16,4);ctx.fillRect(1,-35,16,4);break;
    case "Nuvola":
      ctx.fillStyle="#cbd9e4";ctx.beginPath();ctx.arc(-17,-19,17,0,Math.PI*2);ctx.arc(2,-32,23,0,Math.PI*2);ctx.arc(23,-18,17,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.fillRect(-25,-20,48,16);ctx.fillRect(-8,-43,20,13);ctx.fillStyle="#aabac8";ctx.fillRect(-18,-8,36,5);break;
    case "Umano":
      ctx.fillStyle="#292c31";ctx.fillRect(-34,-12,68,29);ctx.fillStyle="#55585d";ctx.beginPath();ctx.moveTo(-28,-15);ctx.lineTo(-22,-35);ctx.lineTo(-8,-24);ctx.lineTo(0,-49);ctx.lineTo(8,-24);ctx.lineTo(22,-35);ctx.lineTo(28,-15);ctx.closePath();ctx.fill();ctx.fillStyle="#858b91";ctx.fillRect(-20,-10,40,5);break;
    case "Luce":
      ctx.fillStyle="#a47e36";ctx.beginPath();ctx.moveTo(-24,-37);ctx.lineTo(-9,-27);ctx.lineTo(0,-9);ctx.lineTo(9,-27);ctx.lineTo(24,-37);ctx.lineTo(13,-7);ctx.lineTo(0,5);ctx.lineTo(-13,-7);ctx.closePath();ctx.fill();
      ctx.fillStyle="#f3df9a";ctx.fillRect(-5,-24,10,27);ctx.fillRect(-22,-38,12,6);ctx.fillRect(10,-38,12,6);break;
    case "Dolce":
      ctx.fillStyle="#815333";ctx.fillRect(-25,-25,22,22);ctx.fillRect(4,-29,23,23);ctx.fillRect(-17,2,24,18);ctx.fillStyle="#c89a62";ctx.fillRect(-21,-21,14,14);ctx.fillRect(8,-25,15,15);ctx.fillRect(-13,6,16,10);ctx.fillStyle="#e5c18a";ctx.fillRect(-17,-18,4,4);ctx.fillRect(13,-21,4,4);ctx.fillRect(-7,8,4,4);break;
    case "Marino":
      ctx.fillStyle="#124f78";ctx.beginPath();ctx.moveTo(-39,-5);ctx.quadraticCurveTo(-21,-42,0,-18);ctx.quadraticCurveTo(20,7,39,-30);ctx.lineTo(39,5);ctx.quadraticCurveTo(18,35,0,9);ctx.quadraticCurveTo(-20,-15,-39,24);ctx.closePath();ctx.fill();
      ctx.strokeStyle="#45b9e8";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-35,-8);ctx.quadraticCurveTo(-18,-33,0,-12);ctx.quadraticCurveTo(20,12,35,-24);ctx.stroke();break;
    case "Orso":
      ctx.fillStyle="#6b482d";ctx.beginPath();ctx.arc(0,-13,18,0,Math.PI*2);ctx.fill();for(const [px,py] of [[-20,-43],[-7,-51],[8,-51],[21,-43]]){ctx.beginPath();ctx.ellipse(px,py,8,12,0,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle="#b58a57";ctx.beginPath();ctx.arc(0,-13,9,0,Math.PI*2);ctx.fill();break;
    case "Mago":
      ctx.fillStyle="#554078";ctx.beginPath();ctx.moveTo(0,-58);ctx.lineTo(-29,-5);ctx.lineTo(29,-5);ctx.closePath();ctx.fill();ctx.fillStyle="#e6c44f";ctx.fillRect(-31,-7,62,9);ctx.fillStyle="#f2d66f";ctx.fillRect(-4,-39,8,8);ctx.fillRect(12,-24,6,6);break;
    case "Salato":
      ctx.fillStyle="#80565d";ctx.beginPath();ctx.moveTo(-27,-10);ctx.lineTo(-22,-39);ctx.lineTo(2,-55);ctx.lineTo(28,-34);ctx.lineTo(24,-5);ctx.lineTo(0,13);ctx.closePath();ctx.fill();ctx.fillStyle="#c98e91";ctx.beginPath();ctx.moveTo(-17,-12);ctx.lineTo(-14,-34);ctx.lineTo(2,-45);ctx.lineTo(19,-30);ctx.lineTo(16,-7);ctx.lineTo(0,5);ctx.closePath();ctx.fill();ctx.fillStyle="#f1d8d5";ctx.fillRect(-8,-28,7,7);break;
    default:
      ctx.fillStyle = accent; ctx.fillRect(-20, -22, 40, 39);
  }

  // Insegna della città: nome e fazione sono visibili anche senza aprire il menu.
  ctx.fillStyle = "rgba(7,13,18,.9)";
  ctx.fillRect(-58, 43, 116, 25);
  ctx.fillStyle = accent;
  ctx.fillRect(-58, 43, 4, 25);
  ctx.fillStyle = "#fff4df";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(city.city, 2, 54, 106);
  ctx.fillStyle = accent;
  ctx.font = "bold 8px monospace";
  ctx.fillText(city.faction.toUpperCase(), 2, 64, 106);
  ctx.restore();
}
