import React from "react";

const PALETTES = {
  Demone: ["#5a2536", "#b9474e", "#ef8b62", "#ffd18a"],
  Robot: ["#29465f", "#4d9ab0", "#9be1d7", "#f3d36b"],
  Natura: ["#244b32", "#4d9853", "#9bd36b", "#e9d58a"],
  Nuvola: ["#43517e", "#829bd7", "#d5e4ff", "#f4c7ec"],
  Umano: ["#493a30", "#b47b4c", "#edc18d", "#f3dfb5"],
  Luce: ["#66502c", "#e2bd53", "#fff0a6", "#fffdf0"],
  Dolce: ["#713e69", "#d77caf", "#ffc5d8", "#fff0a9"],
  Marino: ["#174c68", "#2b9db1", "#83e3df", "#d4f8f2"],
  Orso: ["#49351f", "#9b6939", "#d7a35b", "#f0d39a"],
  Mago: ["#382b60", "#765db0", "#bba7ed", "#f1d5ff"],
  Salato: ["#4e4b43", "#a49a83", "#e0d7bd", "#fff5dc"],
};
const SHAPES = [
  ["00111100","01111110","11222211","12233221","12222221","01222210","00122100","01100110","11000011","11000011"],
  ["00011000","00111100","01122110","11233211","12222221","01222210","00122100","01100110","11011011","10000001"],
  ["00111100","01122110","11233211","12222221","12222221","01222210","00122100","01111110","11000011","10000001"],
];
export default function AdventureSognatoreSprite({ s, size = 56, walking = false, className = "" }) {
  if (!s) return null;
  const faction = s.tipo || s.fazione || "Natura";
  const palette = PALETTES[faction] || PALETTES.Natura;
  const seed = Array.from(String(s.id || s.nome || "dream")).reduce((a, c) => a + c.charCodeAt(0), 0);
  const shape = SHAPES[seed % SHAPES.length];
  const pixels = shape.join("").split("");
  return (
    <div className={className} style={{ width: size, height: size + 7, position: "relative", flex: "0 0 auto" }} title={s.nome}>
      <style>{'@keyframes sogIdle {0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}} @keyframes sogWalk {0%,100%{transform:translateY(0) scaleX(1)}25%{transform:translateY(-4px) scaleX(.96)}75%{transform:translateY(-2px) scaleX(1.04)}}'}</style>
      <div style={{ position:"absolute", left:"18%", right:"18%", bottom:1, height:6, borderRadius:"50%", background:"rgba(0,0,0,.35)", filter:"blur(1px)" }} />
      <div style={{ position:"absolute", inset:"0 0 5px", display:"grid", gridTemplateColumns:"repeat(8,1fr)", gridTemplateRows:"repeat(10,1fr)", imageRendering:"pixelated", animation: walking ? "sogWalk .38s steps(2,end) infinite" : "sogIdle 1.25s ease-in-out infinite", filter:"drop-shadow(0 3px 2px rgba(0,0,0,.55))" }}>
        {pixels.map((p, i) => {
          if (p === "0") return <span key={i} />;
          const colors = { "1":"#201d26", "2":palette[1], "3":palette[2] };
          let color = colors[p] || palette[1];
          if (p === "2" && (i + seed) % 11 === 0) color = palette[0];
          if (p === "1" && (i % 8 === 2 || i % 8 === 5) && i > 20 && i < 40) color = "#fff7e8";
          return <span key={i} style={{ background:color, boxShadow:p === "3" ? "inset 0 0 0 1px " + palette[3] : undefined }} />;
        })}
      </div>
    </div>
  );
}