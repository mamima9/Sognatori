import React from "react";
import HealthBar, { SognatoreImage, FactionBadge } from "./HealthBar";
import { getType } from "@/lib/battleEngine";

export default function BenchCard({ s, side = "player" }) {
  if (!s) return <div className="flex-1" />;
  const fainted = s.fainted;
  return (
    <div className={`flex-1 min-w-[110px] rounded-lg p-1.5 border transition ${fainted ? "opacity-30 grayscale border-white/10" : side === "player" ? "border-emerald-500/30 bg-white/5" : "border-rose-500/30 bg-white/5"}`}>
      <div className="flex gap-1.5 items-start">
        <SognatoreImage s={s} className="w-10 h-10 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold truncate">{s.nome}</div>
          <FactionBadge type={getType(s)} />
          <div className="mt-0.5"><HealthBar hp={s.hp || 20} hpMax={s.hpMax || 20} /></div>
          <div className="text-[8px] text-slate-400">{s.hp || 20}/{s.hpMax || 20} PS</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-0.5 mt-1 text-[8px]">
        {[["A", s.att + (s.statMods?.att || 0)], ["D", s.dif + (s.statMods?.dif || 0)], ["V", s.vel + (s.statMods?.vel || 0)]].map(([l, v]) => (
          <div key={l} className="bg-white/5 rounded px-0.5 text-center"><span className="text-slate-400">{l}</span> <span className="font-bold">{v}</span></div>
        ))}
      </div>
      <div className="text-[8px] text-amber-400/80 font-semibold mt-0.5 truncate">{s.abil}</div>
      <div className="text-[7px] text-slate-400 leading-tight mt-0.5">{s.abilDesc}</div>
    </div>
  );
}