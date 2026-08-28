// @ts-nocheck
import React from "react";
import { FACTION_COLORS } from "@/lib/typeChart";

export function FactionBadge({ type }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white uppercase tracking-wide"
      style={{
        backgroundColor: FACTION_COLORS[type] || "#888",
      }}
    >
      {type}
    </span>
  );
}

export default function HealthBar({ hp, hpMax }) {
  const pct = Math.max(
    0,
    Math.min(100, (hp / hpMax) * 100)
  );

  const color =
    pct > 50
      ? "#22c55e"
      : pct > 25
        ? "#eab308"
        : "#ef4444";

  return (
    <div className="w-full h-2.5 rounded-full bg-black/30 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

export function SognatoreImage({
  s,
  className = "w-16 h-16",
}) {
  if (s?.img) {
    return (
      <div
        className={`${className} rounded-xl overflow-hidden`}
      >
        <img
          src={s.img}
          alt={s.nome || "Sognatore"}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center text-4xl`}
    >
      {s?.emoji || "❓"}
    </div>
  );
}