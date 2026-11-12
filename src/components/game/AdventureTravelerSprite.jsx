import React from "react";

const STYLES = {
  Demone: { skin:"#e7a18b", hair:"#30202c", base:"#762d42", shadow:"#351b32", light:"#e66d62", metal:"#e7b36b", cloth:"#a83d4e", silhouette:"horns" },
  Robot: { skin:"#a8e6df", hair:"#244653", base:"#315d72", shadow:"#172d43", light:"#55b8bd", metal:"#d5e5d7", cloth:"#397f91", silhouette:"antenna" },
  Natura: { skin:"#e8bd91", hair:"#493a2b", base:"#365c3c", shadow:"#20392d", light:"#8cbd61", metal:"#d6c18a", cloth:"#668a49", silhouette:"leaves" },
  Nuvola: { skin:"#e8d8d1", hair:"#c5d9ef", base:"#536c9b", shadow:"#293654", light:"#a9c8ed", metal:"#f0d8e8", cloth:"#829ed0", silhouette:"cloud" },
  Umano: { skin:"#d99b72", hair:"#352a2b", base:"#79503d", shadow:"#382a2d", light:"#d28b52", metal:"#dfc18a", cloth:"#b46b45", silhouette:"scarf" },
  Luce: { skin:"#f3d5a1", hair:"#f3e5b7", base:"#b28a35", shadow:"#5e492a", light:"#f7e18c", metal:"#fff1c4", cloth:"#e0b84c", silhouette:"halo" },
  Dolce: { skin:"#f0c1c9", hair:"#744768", base:"#985b8d", shadow:"#4d3158", light:"#e9a6d0", metal:"#f5d99b", cloth:"#ca79aa", silhouette:"ribbon" },
  Marino: { skin:"#9dd4d8", hair:"#25475a", base:"#28647d", shadow:"#17374d", light:"#5eb7c4", metal:"#d7e6d4", cloth:"#348da0", silhouette:"fins" },
  Orso: { skin:"#d5a779", hair:"#3a2b24", base:"#745033", shadow:"#38291f", light:"#bd8a4d", metal:"#e2c18a", cloth:"#a87843", silhouette:"fur" },
  Mago: { skin:"#d9b7a4", hair:"#302746", base:"#59417e", shadow:"#2b2449", light:"#a48bd8", metal:"#e6d18d", cloth:"#8064ad", silhouette:"hat" },
  Salato: { skin:"#d5d1c4", hair:"#353b43", base:"#646b6a", shadow:"#30383d", light:"#c5c5b4", metal:"#d8b477", cloth:"#898d83", silhouette:"crystal" },
};

const INK = "#171b2b";

function FactionHead({ kind, p }) {
  switch (kind) {
    case "horns": return <><path d="M34 35 23 13 43 27M62 35 73 13 53 27" fill={p.light} stroke={INK} strokeWidth="4" strokeLinejoin="round"/><path d="M31 39Q27 17 48 17Q69 17 65 39L59 34 52 38 45 33 37 39Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    case "antenna": return <><path d="M48 23V8" stroke={p.metal} strokeWidth="4"/><path d="M39 12 48 4 57 12 48 19Z" fill={p.light} stroke={INK} strokeWidth="3"/><path d="M30 34Q30 19 48 19Q66 19 66 34L61 42H35Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    case "leaves": return <><path d="M39 31Q21 7 13 25Q20 42 39 38M51 29Q60 3 79 14Q77 34 51 38Z" fill={p.light} stroke={INK} strokeWidth="3"/><path d="M31 39Q32 19 49 19Q66 19 66 39L59 44H37Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    case "cloud": return <><path d="M23 33Q17 20 31 17Q37 5 49 14Q63 7 72 22Q78 34 64 38H31Z" fill={p.light} stroke={INK} strokeWidth="3"/><path d="M34 40Q34 22 49 22Q64 22 64 40L58 45H39Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    case "halo": return <><ellipse cx="48" cy="13" rx="24" ry="7" fill="none" stroke={p.metal} strokeWidth="5"/><path d="M33 39Q33 19 48 19Q63 19 63 39L58 45H38Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    case "ribbon": return <><path d="M39 33Q13 7 14 28Q18 43 41 39M57 33Q83 7 82 28Q78 43 55 39" fill={p.light} stroke={INK} strokeWidth="3"/><path d="M33 39Q33 19 48 19Q63 19 63 39L58 45H38Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    case "fins": return <><path d="M32 35Q10 15 17 46L35 48M64 35Q86 15 79 46L61 48" fill={p.light} stroke={INK} strokeWidth="3"/><path d="M33 39Q33 19 48 19Q63 19 63 39L58 45H38Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    case "fur": return <><path d="M24 38 17 19 34 28 40 10 49 26 61 10 64 29 79 20 69 44Z" fill={p.metal} stroke={INK} strokeWidth="3"/><path d="M31 42Q31 21 48 21Q65 21 65 42L58 47H38Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    case "hat": return <><path d="M21 36 48 2 75 36Z" fill={p.shadow} stroke={INK} strokeWidth="4"/><path d="M19 36H77" stroke={p.metal} strokeWidth="6" strokeLinecap="round"/><path d="M33 43Q33 24 48 24Q63 24 63 43L58 48H38Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    case "crystal": return <><path d="M25 36 32 13 42 26 49 5 57 26 68 13 72 37Z" fill={p.metal} stroke={INK} strokeWidth="3"/><path d="M33 42Q33 21 48 21Q63 21 63 42L58 47H38Z" fill={p.hair} stroke={INK} strokeWidth="3"/></>;
    default: return <path d="M32 40Q32 20 48 20Q64 20 64 40L58 47H38Z" fill={p.hair} stroke={INK} strokeWidth="3"/>;
  }
}

export default function AdventureTravelerSprite({ traveler, faction, size = 58 }) {
  const p = STYLES[faction] || STYLES.Umano;
  const seed = (traveler || "").split("").reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const variant = seed % 3;

  return (
    <svg
      width={size}
      height={size * 1.34}
      viewBox="0 0 96 128"
      role="img"
      aria-label={traveler || "Viaggiatore"}
      style={{ display:"block", imageRendering:"pixelated", overflow:"visible", filter:"drop-shadow(0 5px 3px rgba(0,0,0,.58))" }}
    >
      <ellipse cx="48" cy="120" rx="25" ry="5" fill="#080d18" opacity=".72"/>
      {/* Mantello e silhouette posteriori */}
      <path d="M31 58 17 91 25 112 48 103 71 112 79 91 65 58Z" fill={p.shadow} stroke={INK} strokeWidth="4" strokeLinejoin="round"/>
      <path d="M34 61 25 91 31 103 48 97 65 103 71 91 62 61Z" fill={p.base} stroke={INK} strokeWidth="3" strokeLinejoin="round"/>
      <path d="M35 69 29 91 40 88 48 96 56 88 67 91 61 69Z" fill={p.cloth} opacity=".9"/>
      {/* Gambe, ginocchiere e stivali */}
      <path d="M36 91 33 109 43 114 48 96 53 114 64 109 60 91Z" fill={p.base} stroke={INK} strokeWidth="3"/>
      <path d="M31 105 28 119 48 119 48 111 42 108Z M53 111 53 119 76 119 72 106 62 108Z" fill="#282a38" stroke={INK} strokeWidth="3"/>
      <path d="M32 115H46M57 115H72" stroke={p.metal} strokeWidth="3"/>
      {/* Braccia e guanti */}
      <path d="M31 57 19 69 13 91 24 95 38 72M65 57 77 69 83 91 72 95 58 72Z" fill={p.base} stroke={INK} strokeWidth="4" strokeLinejoin="round"/>
      <path d="M16 87 12 95 25 99 29 91M80 87 84 95 71 99 67 91Z" fill={p.shadow} stroke={INK} strokeWidth="3"/>
      {/* Corpetto stratificato */}
      <path d="M32 53 48 61 64 53 69 83 48 96 27 83Z" fill={p.light} stroke={INK} strokeWidth="4" strokeLinejoin="round"/>
      <path d="M38 60 48 68 58 60 61 81 48 89 35 81Z" fill={p.base} stroke={INK} strokeWidth="2"/>
      <path d="M48 66V91" stroke={p.metal} strokeWidth="3"/>
      <path d="M34 73 43 78M62 73 53 78" stroke={p.metal} strokeWidth="3"/>
      <path d="M40 84 48 89 56 84" fill="none" stroke={p.shadow} strokeWidth="3"/>
      {/* Cintura e stemma */}
      <path d="M29 86 48 94 67 86 65 94 48 102 31 94Z" fill={p.shadow} stroke={INK} strokeWidth="2"/>
      <path d="M43 91 48 87 53 91 48 98Z" fill={p.metal} stroke={INK} strokeWidth="2"/>
      {/* Collo, volto e capelli */}
      <path d="M41 48H55V61Q48 68 41 61Z" fill={p.skin} stroke={INK} strokeWidth="3"/>
      <path d="M33 34Q34 20 48 20Q63 20 64 36L61 52Q57 62 48 63Q38 61 34 52Z" fill={p.skin} stroke={INK} strokeWidth="3"/>
      <FactionHead kind={p.silhouette} p={p}/>
      <path d="M36 42 43 40M53 40 60 42" stroke={p.shadow} strokeWidth="2"/>
      <rect x="39" y="44" width="4" height="5" rx="1" fill="#172033"/>
      <rect x="54" y="44" width="4" height="5" rx="1" fill="#172033"/>
      <path d="M44 55Q48 58 52 55" fill="none" stroke="#9b5556" strokeWidth="2" strokeLinecap="round"/>
      {/* Accessori di fazione */}
      {p.silhouette === "scarf" && <path d="M32 58Q48 70 65 57L62 69 48 76 34 68Z M60 67 72 86 66 90 57 72Z" fill={p.metal} stroke={INK} strokeWidth="3"/>}
      {p.silhouette === "antenna" && <><path d="M25 64 15 78 25 84M71 64 81 78 71 84" fill="none" stroke={p.metal} strokeWidth="4"/><circle cx="48" cy="76" r="5" fill={p.metal} stroke={INK} strokeWidth="2"/></>}
      {p.silhouette === "leaves" && <path d="M27 65Q8 60 12 83Q25 88 32 72M69 65Q88 60 84 83Q71 88 64 72" fill={p.light} stroke={INK} strokeWidth="3"/>}
      {p.silhouette === "cloud" && <path d="M28 70Q17 58 10 72Q9 84 27 83M68 70Q79 58 86 72Q87 84 69 83" fill={p.light} stroke={INK} strokeWidth="3"/>}
      {p.silhouette === "halo" && <path d="M23 75 13 91 27 87M73 75 83 91 69 87" fill="none" stroke={p.metal} strokeWidth="4"/>}
      {p.silhouette === "ribbon" && <path d="M29 63Q13 51 11 67Q15 80 33 74M67 63Q83 51 85 67Q81 80 63 74" fill={p.light} stroke={INK} strokeWidth="3"/>}
      {p.silhouette === "fins" && <path d="M28 66 8 59 17 83 31 78M68 66 88 59 79 83 65 78" fill={p.light} stroke={INK} strokeWidth="3"/>}
      {p.silhouette === "fur" && <path d="M30 63 18 54 21 72 31 78M66 63 78 54 75 72 65 78" fill={p.metal} stroke={INK} strokeWidth="3"/>}
      {p.silhouette === "hat" && <path d="M66 72 82 80 73 91 62 82" fill={p.light} stroke={INK} strokeWidth="3"/>}
      {p.silhouette === "crystal" && <path d="M27 69 19 59 16 79 29 84M69 69 77 59 80 79 67 84" fill={p.metal} stroke={INK} strokeWidth="3"/>}
      {/* Differenziazione sottile per ogni viaggiatore */}
      {variant === 1 && <path d="M27 58 8 70 16 77 34 67" fill={p.cloth} stroke={INK} strokeWidth="3"/>}
      {variant === 2 && <path d="M69 58 88 70 80 77 62 67" fill={p.cloth} stroke={INK} strokeWidth="3"/>}
      <path d="M48 102 48 111" stroke={p.metal} strokeWidth="3"/>
    </svg>
  );
}
