import React from "react";
import { FACTIONS, FACTION_COLORS, chart } from "@/lib/typeChart";

const CELL = {
  "5":   { bg: "#22c55e", label: "+5", color: "white" },
  "-3":  { bg: "#f97316", label: "-3", color: "white" },
  "-15": { bg: "#1e293b", label: "✕",  color: "#64748b" },
  "0":   { bg: "rgba(255,255,255,0.05)", label: "·", color: "#475569" },
};

export default function TypeChartTable() {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse mx-auto">
        <thead>
          <tr>
            <th className="p-0.5"></th>
            {FACTIONS.map(f => (
              <th key={f} className="p-0.5">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-[7px] sm:text-[9px] font-bold" style={{ backgroundColor: FACTION_COLORS[f] }}>
                  {f.slice(0, 3).toUpperCase()}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FACTIONS.map(attacker => (
            <tr key={attacker}>
              <td className="p-0.5">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-[7px] sm:text-[9px] font-bold" style={{ backgroundColor: FACTION_COLORS[attacker] }}>
                  {attacker.slice(0, 3).toUpperCase()}
                </div>
              </td>
              {FACTIONS.map(defender => {
                const val = chart[attacker]?.[defender] ?? 0;
                const style = CELL[String(val)] || CELL["0"];
                return (
                  <td key={defender} className="p-0.5">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded flex items-center justify-center font-bold text-[9px] sm:text-xs" style={{ backgroundColor: style.bg, color: style.color }}>
                      {style.label}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}