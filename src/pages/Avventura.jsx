// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ROSTER } from "@/lib/sognatoriData";
import AdventureCampaign from "@/components/game/AdventureCampaign";
import AdventureTravelerSprite from "@/components/game/AdventureTravelerSprite";
import AdventureHouseInterior from "@/components/game/AdventureHouseInterior";
import GlobalMusicPlayer from "@/components/game/GlobalMusicPlayer";
import { ADVENTURE_CITIES, ADVENTURE_WILD_AREAS, ADVENTURE_FACTION_LORE, buildCityTeam } from "@/lib/adventureCampaignData";
import { drawAdventureTraveler, drawAdventureWildSognatore } from "@/lib/adventurePixelSprites";
import { drawAdventureNaturaCity } from "@/lib/adventureNaturaCity";
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

// Ogni specie occupa un habitat distinto in uno dei quattro angoli della mappa.
// I quattro esemplari restano vicini al proprio elemento di lore; solo il primo è arruolabile.
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
  const offsets = [[-38, -26], [38, -26], [-38, 26], [38, 26]];
  return residents.flatMap((sognatore, index) => {
    const anchor = index === 0
      ? { x: 1800, y: 360, corner: "NORD" }
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
      x: index === 0 && copy === 0 ? 1800 : centerX + ox,
      y: index === 0 && copy === 0 ? 360 : centerY + oy,
      isSleepingBlocker: index === 0 && copy === 0,
      name: sognatore.nome,
      img: sognatore.img,
      tipo: sognatore.tipo || sognatore.fazione,
      recruitable: copy === 0,
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
  "ring-ape":"ancient-ring"
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
    Robot: ["#345c62", "#3f7378", "#568d8c", "#294d5b", "#70a7a0"],
    Natura: ["#426f45", "#52864a", "#659c52", "#365f40", "#79ad60"],
    Nuvola: ["#8da8c4", "#a8bdd2", "#c1d1df", "#7897b8", "#d4deeb"],
    Umano: ["#98734d", "#ad8557", "#c09a68", "#876344", "#d0ae7b"],
    Luce: ["#b49a4b", "#c9ad57", "#ddc46d", "#a98b3e", "#ead58c"],
    Dolce: ["#a96f9b", "#c083ae", "#d79ac0", "#95618d", "#e8b4d0"],
    Marino: ["#367b88", "#438e9b", "#58a5ae", "#2e697e", "#80c1c5"],
    Orso: ["#766044", "#92734d", "#aa875a", "#624e3c", "#c09b69"],
    Mago: ["#62517f", "#79649a", "#907ab0", "#51436e", "#b09ad0"],
    Salato: ["#8b8b7d", "#a3a394", "#b9b9a8", "#747b79", "#d0cbb6"],
  };
  const factionPalette = factionPalettes[faction] || palettes["Prato dei Sogni"];
  const flowerColors = ["#f4e8c4", "#e8a8c8", "#d7e9ef", "#f1cf72"];
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
        ctx.fillStyle = zone.name === "Monti di Cenere" ? "#aaa08d" : zone.name === "Valle Dorata" ? "#d1b66a" : "#83b365";
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
            ctx.strokeStyle = "rgba(176,239,235,.55)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + 5, y + 14); ctx.quadraticCurveTo(x + 15, y + 7, x + 25, y + 14); ctx.moveTo(x + 16, y + 27); ctx.quadraticCurveTo(x + 26, y + 20, x + 38, y + 27); ctx.stroke(); break;
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

  // Accesso all'Avventura e porte personali riservati a questo account o ai vincitori Arcade.
  const testerAllowed =
    user?.user_metadata?.sognatori_arcade_completed === true || isPersonalTester;
  const personalAllDoorsUnlocked = isPersonalTester;

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

const [message, setMessage] = useState("");

  const [dialogue, setDialogue] = useState(null);
  const [interior, setInterior] = useState(null);

  const [encounter, setEncounter] =
    useState(null);

  const [challengerEncounter, setChallengerEncounter] =
    useState(null);
  const [discoveredWildClues, setDiscoveredWildClues] = useState({});
  const [completedWildTasks, setCompletedWildTasks] = useState({});

  const [time, setTime] = useState(9);
  const [defeatedLeaders, setDefeatedLeaders] = useState(() => {
    try {
      const raw = localStorage.getItem("sognatori-adventure-v1-" + (user?.id || user?.email || "guest"));
      const saved = raw ? JSON.parse(raw) : null;
      return new Set(Array.isArray(saved?.conqueredLeaders) ? saved.conqueredLeaders : []);
    } catch { return new Set(); }
  });
  const [activeMapId, setActiveMapId] = useState("natura");
  const activeCityBase = ADVENTURE_CITIES.find((city) => city.id === activeMapId) || ADVENTURE_CITIES[0];
  const activeLore = ADVENTURE_FACTION_LORE[activeMapId] || {};
  const activeCity = { ...activeCityBase, ...activeLore, x: 1800, y: 1200 };
  const cityNpcCharacters = buildOutdoorNPCs(activeCityBase, activeLore, time);
  const activeWildAreaBase = ADVENTURE_WILD_AREAS.find((area) => area.faction === activeCity.faction) || ADVENTURE_WILD_AREAS[0];
  const activeWildArea = { ...activeWildAreaBase, x: 1800, y: 760 };

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

      const offsetX =
        w / 2 -
        cam.x * scale;

      const offsetY =
        h / 2 -
        cam.y * scale;

      ctx.save();

      ctx.translate(
        offsetX,
        offsetY
      );

      ctx.scale(
        scale,
        scale
      );

      /*
        MONDO
      */

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
      const paths = [
        { x: 0, y: 1002, w: WORLD.width, h: 116, horizontal: true },
        { x: 1732, y: 0, w: 136, h: WORLD.height, horizontal: false },
        { x: 792, y: 542, w: 2116, h: 86, horizontal: true },
      ];
      for (const path of paths) {
        ctx.fillStyle = "rgba(37,42,29,.3)";
        ctx.fillRect(path.x, path.y, path.w, path.h);
        ctx.fillStyle = "#92744b";
        ctx.fillRect(path.x, path.y + 5, path.w, path.h - 10);
        ctx.fillStyle = "#c7a56a";
        ctx.fillRect(path.x, path.y + 9, path.w, path.h - 18);
        ctx.fillStyle = "rgba(246,218,157,.34)";
        ctx.fillRect(path.x, path.y + 12, path.w, 5);
        ctx.fillStyle = "rgba(102,76,47,.22)";
        ctx.fillRect(path.x, path.y + path.h - 15, path.w, 5);

        const step = 54;
        for (let n = 0; n < (path.horizontal ? path.w : path.h); n += step) {
          const px = path.horizontal ? path.x + n + ((n / step) % 2) * 9 : path.x + 24 + (n % 3) * 18;
          const py = path.horizontal ? path.y + 25 + (n % 3) * 17 : path.y + n + ((n / step) % 2) * 8;
          ctx.fillStyle = "rgba(245,220,171,.45)";
          ctx.fillRect(px, py, 7, 3);
          ctx.fillStyle = "rgba(106,79,49,.24)";
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

      for (const tree of WORLD_OBJECTS.trees) {
        drawTree(
          ctx,
          tree.x,
          tree.y,
          tree.r,
          activeCity.faction
        );
      }

      // Undici distretti abitati: piazza centrale, mura, strade e architetture di fazione.
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
      drawAdventureDoor(ctx, MAP_DOOR.x, MAP_DOOR.y, activeCity.color,
        canUseCityDoors ? "PORTA · " + nextCityName(activeMapId) : "BLOCCATA · " + nextCityName(activeMapId),
        0, !canUseCityDoors);
      drawAdventureDoor(ctx, MAP_NORTH_DOOR.x, MAP_NORTH_DOOR.y, activeCity.color,
        personalAllDoorsUnlocked ? "PORTA · " + previousCityName(activeMapId) : "BLOCCATA · " + previousCityName(activeMapId),
        Math.PI, !personalAllDoorsUnlocked);

      /*
        ROCCE
      */

      const rockPalettes = {
        Demone: ["#452d38", "#8d4650", "#d06a54"],
        Robot: ["#344e5c", "#638d98", "#a4d7d2"],
        Natura: ["#3e4548", "#727b7b", "#9da09a"],
        Nuvola: ["#526982", "#91aac5", "#d7e5f4"],
        Umano: ["#51483e", "#89775f", "#c2ad88"],
        Luce: ["#796039", "#c09a4c", "#f4d887"],
        Dolce: ["#704b70", "#b77cae", "#f0c1df"],
        Marino: ["#294d60", "#4b8795", "#9bd1d0"],
        Orso: ["#49372b", "#806044", "#b9915c"],
        Mago: ["#3d3655", "#776b9d", "#c1b2e8"],
        Salato: ["#555d5b", "#a4aaa3", "#e4e5dc"],
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

      /*
        SOGNATORI NPC
        Gli artwork ufficiali vengono disegnati nel mondo, non in un layer HTML
        separato: così condividono scala, camera e profondità con il giocatore.
      */
      const spriteFrame = Math.floor(performance.now() / 360) % 2;
      const labeledWildNames = new Set();
      const drawnLoreSites = new Set();
      for (const wild of wildRef.current) {
        const siteKey = wild.rosterId;
        if (!drawnLoreSites.has(siteKey)) {
          drawnLoreSites.add(siteKey);
          drawSognatoreHabitat(ctx, wild.rosterId, activeCity.faction, wild.habitatX, wild.habitatY, wild.loreSite, wild.cornerIndex);
        }
        const wildKey = activeMapId + ":" + wild.rosterId;
        if (wild.recruitable && completedWildTasks[wildKey]) {
          // La missione modifica davvero il micro-bioma: ogni fazione mostra il risultato della sua azione.
          const ax = wild.habitatX + 42;
          const ay = wild.habitatY + 58;
          const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
          ctx.save();
          ctx.shadowColor = "#a3e635"; ctx.shadowBlur = 12;
          if (activeCity.faction === "Natura" || activeCity.faction === "Dolce") {
            px(ax - 3, ay - 3, 6, 22, "#76502d");
            px(ax - 15, ay - 9, 12, 8, "#65b94f"); px(ax + 3, ay - 14, 13, 9, "#8bdc62");
            px(ax - 11, ay - 19, 7, 7, "#d8f7a0"); px(ax + 8, ay - 23, 7, 7, "#f9d77b");
            px(ax - 5, ay + 19, 10, 3, "#55a84a");
          } else if (activeCity.faction === "Robot") {
            ctx.shadowColor = "#67e8f9";
            px(ax - 17, ay - 13, 34, 27, "#294b58"); px(ax - 12, ay - 8, 24, 17, "#78cbd0");
            px(ax - 5, ay - 3, 10, 7, "#eaffff"); px(ax - 2, ay - 18, 4, 5, "#67e8f9");
          } else if (activeCity.faction === "Luce" || activeCity.faction === "Mago") {
            ctx.shadowColor = "#fde68a";
            px(ax - 3, ay - 18, 6, 36, "#f5d76e"); px(ax - 12, ay - 8, 24, 5, "#fff4b0");
            px(ax - 8, ay - 18, 16, 5, "#fff4b0"); px(ax - 5, ay - 25, 10, 7, "#fffbe0");
          } else if (activeCity.faction === "Demone" || activeCity.faction === "Orso") {
            px(ax - 22, ay + 5, 17, 9, "#766b61"); px(ax - 7, ay - 1, 18, 11, "#938779");
            px(ax + 10, ay + 6, 15, 8, "#65594f"); px(ax - 2, ay - 8, 5, 8, "#a7f36c");
          } else if (activeCity.faction === "Marino") {
            ctx.shadowColor = "#67e8f9";
            px(ax - 22, ay + 5, 44, 7, "#287eaa"); px(ax - 16, ay - 1, 32, 6, "#59d4df");
            px(ax - 4, ay - 13, 8, 13, "#b9f5ef"); px(ax + 7, ay - 18, 5, 11, "#b9f5ef");
          } else if (activeCity.faction === "Nuvola") {
            ctx.shadowColor = "#e0f2fe";
            px(ax - 20, ay + 3, 40, 4, "#a5c8e8"); px(ax - 11, ay - 5, 22, 5, "#e0f2fe");
            px(ax - 4, ay - 17, 8, 12, "#ffffff"); px(ax - 12, ay - 23, 7, 7, "#dbeafe");
          } else {
            px(ax - 18, ay + 5, 36, 7, "#b9a17b"); px(ax - 13, ay - 5, 26, 10, "#e8d5a8");
            px(ax - 3, ay - 16, 6, 11, "#f8e8c2"); px(ax - 7, ay - 21, 14, 5, "#fff4d6");
          }
          ctx.shadowBlur = 0;
          ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
          ctx.fillStyle = "#d9f99d"; ctx.fillText("RIPRISTINATO", ax, ay + 34);
          ctx.restore();
        }
        const creature = ROSTER.find((entry) => entry.id === wild.rosterId);
        if (!creature) continue;
        drawOverworldSognatore(ctx, creature, wild.x, wild.y, spriteFrame, wild.isSleepingBlocker);
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
        if (wild.recruitable && !discoveredWildClues[wildKey]) {
          const clueX = wild.habitatX;
          const clueY = wild.habitatY + 48;
          ctx.save();
          ctx.translate(clueX, clueY);
          ctx.shadowColor = "#67e8f9";
          ctx.shadowBlur = 16;
          ctx.fillStyle = "rgba(8,35,48,.92)";
          ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#67e8f9"; ctx.lineWidth = 2; ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.font = "bold 21px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillStyle = "#a5f3fc"; ctx.fillText("?", 0, 1);
          ctx.font = "bold 10px monospace"; ctx.fillStyle = "#e0f2fe"; ctx.fillText("INDIZIO", 0, 33);
          ctx.restore();
        } else if (wild.recruitable && !completedWildTasks[wildKey]) {
          ctx.save();
          ctx.translate(wild.habitatX + 42, wild.habitatY + 58);
          ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 14;
          ctx.fillStyle = "rgba(48,32,8,.94)";
          ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.stroke();
          ctx.shadowBlur = 0; ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillStyle = "#fde68a"; ctx.fillText("!", 0, 1);
          ctx.font = "bold 9px monospace"; ctx.fillText("AZIONE", 0, 31);
          ctx.restore();
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
        const travelerFrame = Math.floor(performance.now() / 380) % 2;
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

      drawPlayer(
        ctx,
        playerRef.current
      );

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

    // Le porte hanno priorità sugli NPC: un personaggio vicino non deve intercettare l'interazione.
    if (Math.hypot(currentPosition.x - MAP_DOOR.x, currentPosition.y - MAP_DOOR.y) < MAP_DOOR.radius + 42) {
      if (!personalAllDoorsUnlocked && !defeatedLeaders.has(activeMapId)) {
        const leader = CHALLENGERS.find((challenger) => challenger.id === activeMapId);
        setMessage("La strada è sbarrata da " + (leader?.name || "il Capo fazione") + ". Sconfiggilo per proseguire.");
        setTimeout(() => setMessage(""), 2600);
        return;
      }
      const currentIndex = ADVENTURE_CITIES.findIndex((city) => city.id === activeMapId);
      const nextCity = ADVENTURE_CITIES[(currentIndex + 1) % ADVENTURE_CITIES.length];
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
        const currentIndex = ADVENTURE_CITIES.findIndex((city) => city.id === activeMapId);
        const previousCity = ADVENTURE_CITIES[(currentIndex - 1 + ADVENTURE_CITIES.length) % ADVENTURE_CITIES.length];
        setActiveMapId(previousCity.id);
        playerRef.current = { ...MAP_SPAWN };
        cameraRef.current = { ...MAP_SPAWN };
        setPlayer({ ...MAP_SPAWN });
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

    // Prima di parlare con il Sognatore, trova l'indizio fisico nel suo habitat.
    const nearestClue = wildRef.current
      .filter((sognatore) => sognatore.recruitable && !discoveredWildClues[activeMapId + ":" + sognatore.rosterId])
      .map((sognatore) => ({
        ...sognatore,
        clueX: sognatore.habitatX,
        clueY: sognatore.habitatY + 48,
        interactionDistance: distance(currentPosition, { x: sognatore.habitatX, y: sognatore.habitatY + 48 }),
      }))
      .filter((sognatore) => sognatore.interactionDistance < 78)
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestClue) {
      setDiscoveredWildClues((old) => ({ ...old, [activeMapId + ":" + nearestClue.rosterId]: true }));
      setMessage("Hai trovato un indizio di " + nearestClue.name + "! Ora puoi avvicinarti e parlargli.");
      setTimeout(() => setMessage(""), 2600);
      return;
    }

    const nearestTask = wildRef.current
      .filter((sognatore) => sognatore.recruitable && discoveredWildClues[activeMapId + ":" + sognatore.rosterId] && !completedWildTasks[activeMapId + ":" + sognatore.rosterId])
      .map((sognatore) => ({
        ...sognatore,
        interactionDistance: distance(currentPosition, { x: sognatore.habitatX + 42, y: sognatore.habitatY + 58 }),
      }))
      .filter((sognatore) => sognatore.interactionDistance < 78)
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestTask) {
      setCompletedWildTasks((old) => ({ ...old, [activeMapId + ":" + nearestTask.rosterId]: true }));
      setMessage("Obiettivo completato nell'habitat di " + nearestTask.name + "! Ora puoi parlargli.");
      setTimeout(() => setMessage(""), 2600);
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
      if (nearestWild.recruitable && !discoveredWildClues[activeMapId + ":" + nearestWild.rosterId]) {
        setMessage("Cerca prima l'indizio luminoso nel suo habitat.");
        setTimeout(() => setMessage(""), 2200);
        return;
      }
      if (nearestWild.recruitable && !completedWildTasks[activeMapId + ":" + nearestWild.rosterId]) {
        setMessage("Completa prima l'azione indicata nell'habitat.");
        setTimeout(() => setMessage(""), 2200);
        return;
      }
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

      <div className="h-36 w-full overflow-hidden rounded-xl border border-white/15 bg-black/60 shadow-lg backdrop-blur-md">
        <div className="relative h-full w-full">
          {ZONES.map((z) => (
            <div
              key={z.name}
              className="absolute"
              style={{
                left: `${
                  (z.x /
                    WORLD.width) *
                  100
                }%`,

                top: `${
                  (z.y /
                    WORLD.height) *
                  100
                }%`,

                width: `${
                  (z.w /
                    WORLD.width) *
                  100
                }%`,

                height: `${
                  (z.h /
                    WORLD.height) *
                  100
                }%`,

                background:
                  z.color,

                opacity: 0.8,
              }}
            />
          ))}
          <div title={activeCity.city + " · " + activeCity.faction} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ left: "50%", top: "50%", background: activeCity.color }} />
          <div title={"Porta per " + nextCityName(activeMapId)} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" style={{ left: "50%", top: (MAP_DOOR.y / WORLD.height * 100) + "%", background: "#f8df91" }} />
          <div title={"Porta per " + previousCityName(activeMapId)} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" style={{ left: "50%", top: (MAP_NORTH_DOOR.y / WORLD.height * 100) + "%", background: "#9edbff" }} />

          <div
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_white]"
            style={{
              left: `${
                (player.x /
                  WORLD.width) *
                100
              }%`,

              top: `${
                (player.y /
                  WORLD.height) *
                100
              }%`,
            }}
          />
        </div>
      </div>
          <GlobalMusicPlayer insideAdventureMenu />
      </div>
        )}
        userKey={user?.id || user?.email}
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

// Sprite nativo: il personaggio viene composto pixel per pixel sul canvas
// dell'overworld. Nessun PNG viene caricato o disegnato come creatura in mappa.
function drawOverworldSognatore(ctx, s, x, y, frame = 0, sleepingBlocker = false) {
  // Creature overworld grandi e leggibili: il guardiano addormentato ha
  // una presenza da ostacolo narrativo, non l'ingombro di un'icona o di una carta.
  drawAdventureWildSognatore(ctx, s, x, y - (frame ? 2 : 0), frame, sleepingBlocker ? 4.05 : 3.05);
}

function nextCityName(cityId) {
  const index = ADVENTURE_CITIES.findIndex((city) => city.id === cityId);
  return ADVENTURE_CITIES[(index + 1) % ADVENTURE_CITIES.length].city;
}

function previousCityName(cityId) {
  const index = ADVENTURE_CITIES.findIndex((city) => city.id === cityId);
  return ADVENTURE_CITIES[(index - 1 + ADVENTURE_CITIES.length) % ADVENTURE_CITIES.length].city;
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
  ctx.fillStyle = locked ? "#ffd08a" : "#f6e4a7";
  ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
  ctx.fillText(label, 0, -144);
  ctx.restore();
}

function drawPlayer(ctx, p) {
  // Protagonista pixel-art con silhouette, zaino e accessori leggibili.
  ctx.save();
  ctx.translate(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4);

  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(1, 19, 19, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Zaino e spallacci.
  ctx.fillStyle = "#49362d";
  ctx.fillRect(-14, -12, 8, 22);
  ctx.fillStyle = "#9a623d";
  ctx.fillRect(-15, -10, 7, 14);
  ctx.fillStyle = "#d49a55";
  ctx.fillRect(-14, -8, 4, 5);
  ctx.fillStyle = "#55382c";
  ctx.fillRect(-8, -12, 4, 17);
  ctx.fillRect(5, -12, 4, 17);

  // Gambe, pantaloni e stivali.
  ctx.fillStyle = "#26344e";
  ctx.fillRect(-9, 5, 8, 12);
  ctx.fillRect(2, 5, 8, 12);
  ctx.fillStyle = "#40577e";
  ctx.fillRect(-8, 7, 5, 7);
  ctx.fillRect(3, 7, 5, 7);
  ctx.fillStyle = "#30272a";
  ctx.fillRect(-11, 15, 10, 5);
  ctx.fillRect(2, 15, 11, 5);
  ctx.fillStyle = "#b88955";
  ctx.fillRect(-10, 15, 7, 2);
  ctx.fillRect(3, 15, 7, 2);

  // Giacca da viaggiatore a strati.
  ctx.fillStyle = "#8e452f";
  ctx.fillRect(-13, -14, 26, 22);
  ctx.fillStyle = "#d36b3f";
  ctx.fillRect(-10, -13, 20, 18);
  ctx.fillStyle = "#f0ad52";
  ctx.fillRect(-7, -12, 14, 14);
  ctx.fillStyle = "#8e452f";
  ctx.fillRect(-2, -12, 4, 17);
  ctx.fillStyle = "#f6d18a";
  ctx.fillRect(-1, -8, 2, 3);
  ctx.fillRect(-1, -1, 2, 3);

  // Braccia con guanti e polsini.
  ctx.fillStyle = "#d99b70";
  ctx.fillRect(-17, -11, 5, 14);
  ctx.fillRect(12, -11, 5, 14);
  ctx.fillStyle = "#c45c3d";
  ctx.fillRect(-17, -13, 5, 5);
  ctx.fillRect(12, -13, 5, 5);
  ctx.fillStyle = "#302a32";
  ctx.fillRect(-17, 1, 6, 5);
  ctx.fillRect(11, 1, 6, 5);

  // Collo, volto e capelli.
  ctx.fillStyle = "#b87956";
  ctx.fillRect(-5, -19, 10, 7);
  ctx.fillStyle = "#efc49a";
  ctx.fillRect(-10, -34, 20, 17);
  ctx.fillStyle = "#d99f78";
  ctx.fillRect(-10, -23, 4, 5);
  ctx.fillRect(6, -23, 4, 5);
  ctx.fillStyle = "#33272a";
  ctx.fillRect(-11, -36, 22, 7);
  ctx.fillRect(-9, -41, 18, 6);
  ctx.fillRect(-12, -33, 5, 7);
  ctx.fillRect(7, -34, 5, 6);
  ctx.fillStyle = "#f2bd55";
  ctx.fillRect(-12, -42, 24, 5);
  ctx.fillRect(-7, -46, 14, 4);
  ctx.fillStyle = "#f7d58b";
  ctx.fillRect(-7, -41, 13, 2);
  ctx.fillStyle = "#29242a";
  ctx.fillRect(-6, -27, 3, 3);
  ctx.fillRect(4, -27, 3, 3);

  // Sciarpa rossa, elemento iconico del protagonista.
  ctx.fillStyle = "#7e2638";
  ctx.fillRect(-8, -17, 16, 5);
  ctx.fillStyle = "#d84e4d";
  ctx.fillRect(-7, -17, 14, 3);
  ctx.fillRect(5, -14, 5, 15);
  ctx.fillStyle = "#f08a65";
  ctx.fillRect(6, -13, 2, 8);

  // Riflessi pixel e dettagli del tessuto.
  ctx.fillStyle = "rgba(255,226,163,.55)";
  ctx.fillRect(-8, -11, 3, 2);
  ctx.fillRect(6, -9, 2, 4);
  ctx.fillStyle = "#e6bd79";
  ctx.fillRect(-9, 4, 3, 2);
  ctx.fillRect(6, 4, 3, 2);
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
    Robot: ["#304c59", "#477c83", "#68c9bd", "#c5f4e5"],
    Natura: ["#493426", "#173d2b", "#24583a", "#65a65b"],
    Nuvola: ["#526b91", "#829fc4", "#c4d9ef", "#f1f7ff"],
    Umano: ["#60452f", "#315d3b", "#57864b", "#9abf65"],
    Luce: ["#73562c", "#a98639", "#e2c35e", "#fff0a8"],
    Dolce: ["#714565", "#a65c91", "#e18fbd", "#ffd9eb"],
    Marino: ["#31505a", "#27677a", "#3d9ba3", "#9ce0d9"],
    Orso: ["#49372b", "#604631", "#8b633d", "#c39a61"],
    Mago: ["#403553", "#554879", "#8571b5", "#c8b7f4"],
    Salato: ["#555d5b", "#777f79", "#b5b9ae", "#f0eee3"],
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
  ctx.fillStyle = "#282532";
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
        ctx.fillStyle = "#d5c59c"; ctx.fillRect(-11, -18, 22, 7);
        ctx.fillStyle = "#174b65"; ctx.fillRect(-18, 23, 36, 5); break;
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
  if (city.faction === "Natura") return; // Verdelume possiede già un renderer completo e animato.
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
  if (city.faction === "Natura") return; // Il Grande Seme è già integrato nel renderer di Verdelume.
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
      ctx.fillStyle = "#4c2838"; ctx.fillRect(-27, -17, 54, 32);
      ctx.fillStyle = "#b94e5d"; ctx.fillRect(-22, -25, 44, 12);
      ctx.fillStyle = "#e98b69";
      ctx.beginPath(); ctx.moveTo(-25, -22); ctx.lineTo(-40, -48); ctx.lineTo(-12, -31); ctx.fill();
      ctx.beginPath(); ctx.moveTo(25, -22); ctx.lineTo(40, -48); ctx.lineTo(12, -31); ctx.fill();
      ctx.fillStyle = "#f3c477"; ctx.fillRect(-4, -12, 8, 18); break;
    case "Robot":
      ctx.fillStyle = "#344d62"; ctx.fillRect(-27, -25, 54, 42);
      ctx.fillStyle = "#65c3c6"; ctx.fillRect(-18, -17, 36, 23);
      ctx.fillStyle = "#c8e6d9"; ctx.fillRect(-4, -42, 8, 17);
      ctx.fillRect(-35, -7, 8, 20); ctx.fillRect(27, -7, 8, 20);
      ctx.fillStyle = "#193444"; ctx.fillRect(-11, -10, 7, 6); ctx.fillRect(4, -10, 7, 6); break;
    case "Natura":
      ctx.fillStyle = "#5a4930"; ctx.fillRect(-8, -25, 16, 42);
      ctx.fillStyle = "#38734b";
      ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(-31, -13); ctx.lineTo(31, -13); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(-38, 0); ctx.lineTo(38, 0); ctx.fill();
      ctx.fillStyle = "#b7d77d"; ctx.fillRect(-3, -38, 6, 8); break;
    case "Nuvola":
      ctx.fillStyle = "#6b82ad"; ctx.fillRect(-6, -20, 12, 37);
      ctx.fillStyle = "#c6d8f2";
      ctx.beginPath(); ctx.arc(-14, -24, 16, 0, Math.PI * 2); ctx.arc(8, -31, 22, 0, Math.PI * 2); ctx.arc(25, -20, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8bbbe3"; ctx.fillRect(-3, -14, 6, 25); break;
    case "Umano":
      ctx.fillStyle = "#73513d"; ctx.fillRect(-31, -19, 62, 36);
      ctx.fillStyle = "#d5a36c"; ctx.fillRect(-24, -12, 48, 26);
      ctx.fillStyle = "#483b3a"; ctx.fillRect(-7, -34, 14, 51);
      ctx.fillStyle = "#f0d5a1"; ctx.fillRect(-3, -27, 6, 8); break;
    case "Luce":
      ctx.fillStyle = "#a47e36"; ctx.fillRect(-8, -18, 16, 35);
      ctx.fillStyle = "#f3df9a";
      for (let n = 0; n < 8; n++) { const a = n * Math.PI / 4; ctx.fillRect(Math.cos(a) * 27 - 3, -34 + Math.sin(a) * 27, 6, 13); }
      ctx.fillStyle = "#fff0bc"; ctx.beginPath(); ctx.arc(0, -34, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e2b94f"; ctx.beginPath(); ctx.arc(0, -34, 8, 0, Math.PI * 2); ctx.fill(); break;
    case "Dolce":
      ctx.fillStyle = "#a45d92"; ctx.fillRect(-26, -16, 52, 33);
      ctx.fillStyle = "#f0b2d4"; ctx.fillRect(-20, -28, 40, 12);
      ctx.fillStyle = "#fff0df"; ctx.fillRect(-13, -9, 26, 21);
      ctx.fillStyle = "#e48bbb"; ctx.fillRect(-4, -23, 8, 7); break;
    case "Marino":
      ctx.fillStyle = "#286d83"; ctx.fillRect(-27, -15, 54, 32);
      ctx.fillStyle = "#65c8d2";
      ctx.beginPath(); ctx.moveTo(-28, -16); ctx.lineTo(-42, -42); ctx.lineTo(-8, -24); ctx.fill();
      ctx.beginPath(); ctx.moveTo(28, -16); ctx.lineTo(42, -42); ctx.lineTo(8, -24); ctx.fill();
      ctx.fillStyle = "#d2eff0"; ctx.fillRect(-5, -34, 10, 40);
      ctx.fillStyle = "#1e526d"; ctx.fillRect(-17, -5, 34, 5); break;
    case "Orso":
      ctx.fillStyle = "#684a32"; ctx.fillRect(-29, -15, 58, 32);
      ctx.fillStyle = "#b78b56";
      ctx.beginPath(); ctx.moveTo(-29, -14); ctx.lineTo(-38, -43); ctx.lineTo(-9, -24); ctx.fill();
      ctx.beginPath(); ctx.moveTo(29, -14); ctx.lineTo(38, -43); ctx.lineTo(9, -24); ctx.fill();
      ctx.fillStyle = "#e3c18a"; ctx.fillRect(-15, -7, 30, 18);
      ctx.fillStyle = "#513b2e"; ctx.fillRect(-5, -2, 10, 6); break;
    case "Mago":
      ctx.fillStyle = "#59447e"; ctx.fillRect(-26, -18, 52, 35);
      ctx.fillStyle = "#b19ae7";
      ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(-30, -14); ctx.lineTo(30, -14); ctx.fill();
      ctx.fillStyle = "#f2d68a"; ctx.fillRect(-4, -35, 8, 8);
      ctx.fillStyle = "#d4c3f4"; ctx.fillRect(-2, -10, 4, 22); break;
    case "Salato":
      ctx.fillStyle = "#60696a"; ctx.fillRect(-27, -17, 54, 34);
      ctx.fillStyle = "#c7c6b8";
      ctx.beginPath(); ctx.moveTo(0, -61); ctx.lineTo(-23, -16); ctx.lineTo(0, -25); ctx.lineTo(23, -16); ctx.fill();
      ctx.fillStyle = "#e8d8b1"; ctx.fillRect(-5, -12, 10, 22); break;
    default:
      ctx.fillStyle = accent; ctx.fillRect(-20, -22, 40, 39);
  }

  // Gemma luminosa centrale e piccoli pixel di riflesso.
  ctx.fillStyle = "#fff0bd";
  ctx.fillRect(-2, 2, 4, 4);
  ctx.fillStyle = "rgba(255,255,255,.48)";
  ctx.fillRect(-30, 20, 12, 2);
  ctx.fillRect(18, 20, 12, 2);

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

