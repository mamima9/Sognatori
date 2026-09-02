import React from import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import HealthBar, { FactionBadge, SognatoreImage } from "./HealthBar";
import { getType } from "@/lib/battleEngine";
import { useLanguage } from "@/lib/i18n";
import { getAbilityName, getAbilityDesc } from "@/lib/abilityI18n";

const EFFICACY = {
  it: {
    se: { label: "SOFFERENTE!", bg: "#16a34a" },
    res: { label: "ARGINATO", bg: "#f97316" },
    immune: { label: "INVIOLABILE!", bg: "#475569" },
    protected: { label: "INDIFFERENTE", bg: "#2563eb" },
    neutral: null,
  },
  en: {
    se: { label: "VULNERABLE!", bg: "#16a34a" },
    res: { label: "RESISTED", bg: "#f97316" },
    immune: { label: "INVULNERABLE!", bg: "#475569" },
    protected: { label: "NEUTRAL", bg: "#2563eb" },
    neutral: null,
  },
};

export default function BattlePokemon({ s, side, popup }) {
  const { lang } = useLanguage();

  if (!s) return <div className="w-full" />;

  const fainted = s.fainted;
  const eff = popup
    ? EFFICACY[lang][popup.efficacy]
    : null;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: side === "player" ? 40 : -40
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className="relative flex flex-col items-center"
    >
      <AnimatePresence>
        {eff && (
          <motion.div
            key={
              popup.efficacy +
              popup.targetId +
              popup.dmg
            }
            initial={{
              opacity: 0,
              y: 0,
              scale: 0.5
            }}
            animate={{
              opacity: 1,
              y: -35,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: -45
            }}
            transition={{
              duration: 4
            }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide shadow-lg"
            style={{
              backgroundColor: eff.bg,
              color: "white"
            }}
          >
            {eff.label}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-1 mb-1 items-center">
        <FactionBadge type={getType(s)} />
        {s.protectedThisTurn && (
          <span className="text-xs">🛡️</span>
        )}
      </div>

      <motion.div
        animate={
          fainted
            ? {
                opacity: 0.2,
                scale: 0.8,
                rotate: 15
              }
            : {
                opacity: 1,
                scale: 1,
                rotate: 0
              }
        }
        className={fainted ? "grayscale" : ""}
      >
        <SognatoreImage
          s={s}
          className="w-20 h-20 sm:w-24 sm:h-24"
        />
      </motion.div>

      <div className="mt-1 w-full max-w-[170px] text-center">
        <div className="text-xs font-semibold text-white truncate">
          {s.nome}
        </div>

        <div className="text-[9px] text-amber-400/80 font-semibold">
          {getAbilityName(s, lang)}
        </div>

        <div className="text-[8px] text-slate-400 leading-tight px-1">
          {getAbilityDesc(s, lang)}
        </div>

        <div className="flex justify-center gap-0.5 mt-1 text-[8px]">
          <span className="bg-red-500/20 rounded px-1">
            A{s.att + (s.statMods?.att || 0)}
          </span>

          <span className="bg-blue-500/20 rounded px-1">
            D{s.dif + (s.statMods?.dif || 0)}
          </span>

          <span className="bg-green-500/20 rounded px-1">
            V{s.vel + (s.statMods?.vel || 0)}
          </span>
        </div>

        <div className="mt-1">
          <HealthBar
            hp={s.hp}
            hpMax={s.hpMax}
          />
        </div>

        <div className="text-[10px] text-slate-300 mt-0.5">
          {s.hp}/{s.hpMax}
        </div>
      </div>
    </motion.div>
  );
}