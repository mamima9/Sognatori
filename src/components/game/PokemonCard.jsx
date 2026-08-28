import React from "react";
import { FACTION_COLORS } from "@/lib/typeChart";
import { FactionBadge, SognatoreImage } from "./HealthBar";
import { useLanguage } from "@/lib/i18n";
import { getAbilityName, getAbilityDesc } from "@/lib/abilityI18n";

export default function PokemonCard({ pokemon, selected, onClick }) {
  const { lang } = useLanguage();
  const color = FACTION_COLORS[pokemon.tipo] || "#888";
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 ${selected ? "border-amber-400 scale-105 shadow-lg shadow-amber-400/30" : "border-white/10 hover:border-white/30"}`}
      style={{ background: `linear-gradient(135deg, ${color}44, #0f172a 70%)` }}
    >
      <div className="p-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm truncate">{pokemon.nome}</h3>
            <div className="mt-1"><FactionBadge type={pokemon.tipo} /></div>
          </div>
          <SognatoreImage s={pokemon} className="w-14 h-14 flex-shrink-0" />
        </div>
        <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
          <Stat label="ATT" value={pokemon.att} />
          <Stat label="DIF" value={pokemon.dif} />
          <Stat label="VEL" value={pokemon.vel} />
        </div>
        <div className="mt-2 text-[10px] text-slate-300 leading-tight">
          <span className="text-amber-400 font-semibold">{getAbilityName(pokemon, lang)}</span> · {getAbilityDesc(pokemon, lang)}
        </div>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-[10px] text-slate-400">20 PS</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">{pokemon.costo} 🪙</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/5 rounded-md px-1.5 py-1 text-center">
      <div className="text-slate-400">{label}</div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}