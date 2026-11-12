import React from "react";

const DESIGNS = {
  Demone: { main: "#8f3047", dark: "#401c32", light: "#f28a73", trim: "#f3c16a", hair: "#281b2b", gear: "horns" },
  Robot: { main: "#4b9eaf", dark: "#244b64", light: "#a8f1e9", trim: "#e0b86b", hair: "#d9f2ed", gear: "antenna" },
  Natura: { main: "#4c8b55", dark: "#254b37", light: "#a9d878", trim: "#e8d29a", hair: "#493b2b", gear: "leaf" },
  Nuvola: { main: "#778cc9", dark: "#3b477c", light: "#d9e8ff", trim: "#f3d8ff", hair: "#e6edff", gear: "cloud" },
  Umano: { main: "#b4774f", dark: "#603c35", light: "#f0c49a", trim: "#e9d18c", hair: "#382b2b", gear: "scarf" },
  Luce: { main: "#d2ad48", dark: "#785d2d", light: "#fff1a6", trim: "#fff8dc", hair: "#fff0b8", gear: "halo" },
  Dolce: { main: "#c778a7", dark: "#713e71", light: "#ffd2e9", trim: "#f4d68d", hair: "#754b69", gear: "ribbon" },
  Marino: { main: "#328da8", dark: "#204d70", light: "#9de7ee", trim: "#e1dca7", hair: "#274a61", gear: "fin" },
  Orso: { main: "#9a7045", dark: "#4e392d", light: "#d7b17b", trim: "#e8d2a2", hair: "#382b24", gear: "fur" },
  Mago: { main: "#7656a8", dark: "#382b65", light: "#c7a9f2", trim: "#f2d78b", hair: "#302b48", gear: "hat" },
  Salato: { main: "#8f928b", dark: "#494e52", light: "#e0ded0", trim: "#d5ad72", hair: "#343b43", gear: "salt" },
};

export default function AdventureTravelerSprite({ traveler, faction, size = 58 }) {
  const p = DESIGNS[faction] || DESIGNS.Umano;
  const seed = (traveler || "").split("").reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const variant = seed % 3;
  return (
    <svg
      width={size}
      height={size * 1.12}
      viewBox="0 0 96 108"
      role="img"
      aria-label={traveler || "Viaggiatore"}
      style={{ display: "block", imageRendering: "pixelated", overflow: "visible", filter: "drop-shadow(0 4px 3px rgba(0,0,0,.65))" }}
    >
      <ellipse cx="48" cy="101" rx="24" ry="5" fill="#07111b" opacity=".7" />
      <path d="M27 58 L17 87 L30 94 L42 76 L54 76 L66 94 L79 87 L69 58Z" fill={p.dark} stroke="#171a28" strokeWidth="3" />
      <path d="M32 58 L26 83 L39 87 L47 72 L55 72 L63 87 L76 83 L64 58Z" fill={p.main} stroke="#171a28" strokeWidth="2.5" />
      <path d="M39 76 L34 96 L45 97 L49 78 M57 78 L61 97 L72 96 L65 76" fill={p.dark} stroke="#171a28" strokeWidth="3" />
      <path d="M32 94 L29 101 L47 101 L47 96 M61 96 L61 101 L80 101 L76 94" fill="#252638" stroke="#111827" strokeWidth="2" />
      <path d="M28 43 Q16 48 19 67 L30 70 L38 54 M68 43 Q80 48 77 67 L66 70 L58 54" fill={p.main} stroke="#171a28" strokeWidth="3" />
      <path d="M35 49 L31 66 L48 76 L65 66 L61 49Z" fill={p.light} stroke="#171a28" strokeWidth="2.5" />
      <path d="M39 52 L48 60 L57 52" fill="none" stroke={p.trim} strokeWidth="3" />
      <path d="M37 29 Q48 20 59 29 L64 46 Q62 58 48 61 Q34 58 32 46Z" fill={p.light} stroke="#171a28" strokeWidth="3" />
      <path d="M34 39 Q35 25 49 25 Q62 25 63 39 L58 35 L53 38 L46 34 L39 39Z" fill={p.hair} stroke="#171a28" strokeWidth="2.5" />
      <rect x="39" y="43" width="4" height="4" fill="#172033" />
      <rect x="54" y="43" width="4" height="4" fill="#172033" />
      <path d="M44 52 Q48 55 52 52" fill="none" stroke="#8d4d55" strokeWidth="2" strokeLinecap="round" />
      <path d="M29 48 L20 57 L28 62 M67 48 L76 57 L68 62" fill="none" stroke={p.trim} strokeWidth="3" />
      {p.gear === "horns" && <path d="M37 31 L29 18 L42 25 M58 31 L67 18 L54 25" fill={p.light} stroke="#171a28" strokeWidth="3" />}
      {p.gear === "antenna" && <><path d="M48 25 L48 10" stroke={p.trim} strokeWidth="3"/><circle cx="48" cy="8" r="5" fill={p.light} stroke="#172033" strokeWidth="2"/></>}
      {p.gear === "leaf" && <path d="M49 29 Q44 7 67 12 Q65 28 49 29Z" fill={p.light} stroke="#172033" strokeWidth="2.5"/>}
      {p.gear === "cloud" && <path d="M30 25 Q26 14 38 14 Q43 4 53 13 Q66 8 68 23 Q59 30 30 25Z" fill={p.light} stroke="#172033" strokeWidth="2.5"/>}
      {p.gear === "scarf" && <path d="M33 55 Q48 63 64 54 L61 65 Q49 72 34 63Z" fill={p.trim} stroke="#172033" strokeWidth="2"/>}
      {p.gear === "halo" && <ellipse cx="48" cy="12" rx="19" ry="5" fill="none" stroke={p.trim} strokeWidth="4"/>}
      {p.gear === "ribbon" && <path d="M40 27 Q27 10 22 22 Q27 34 40 31 M56 27 Q69 10 74 22 Q69 34 56 31" fill={p.trim} stroke="#172033" strokeWidth="2.5"/>}
      {p.gear === "fin" && <path d="M61 34 Q78 18 76 40 L63 47Z" fill={p.light} stroke="#172033" strokeWidth="2.5"/>}
      {p.gear === "fur" && <path d="M31 34 L24 22 L36 27 L43 16 L49 26 L59 17 L61 30 L71 25 L64 40Z" fill={p.trim} stroke="#172033" strokeWidth="2.5"/>}
      {p.gear === "hat" && <path d="M29 29 L48 4 L67 29Z" fill={p.dark} stroke="#171a28" strokeWidth="3"/><path d="M26 29 L70 29" stroke={p.trim} strokeWidth="5" strokeLinecap="round"/>}
      {p.gear === "salt" && <path d="M31 28 L34 12 L42 23 L49 8 L56 23 L65 12 L66 29Z" fill={p.trim} stroke="#172033" strokeWidth="2.5"/>}
      <path d="M22 70 L12 78 L18 84 L31 77 M74 70 L84 78 L78 84 L65 77" fill="none" stroke={p.trim} strokeWidth="4" strokeLinecap="square"/>
      {variant === 1 && <path d="M29 62 L15 75 L22 81 L36 68" fill="none" stroke={p.light} strokeWidth="4"/>}
      {variant === 2 && <path d="M67 61 L81 73 L75 81 L61 68" fill="none" stroke={p.light} strokeWidth="4"/>}
      <path d="M48 62 L48 75" stroke={p.trim} strokeWidth="3"/>
      <rect x="44" y="66" width="8" height="8" fill={p.dark} stroke={p.trim} strokeWidth="1.5"/>
    </svg>
  );
}
