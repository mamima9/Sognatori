import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FACTIONS, FACTION_COLORS } from "@/lib/typeChart";
import { ROSTER } from "@/lib/sognatoriData";
import { FactionBadge } from "@/components/game/HealthBar";
import { useLanguage } from "@/lib/i18n";

const FACTION_ICONS = {
  Demone: "👹",
  Robot: "🤖",
  Natura: "🌿",
  Nuvola: "☁️",
  Umano: "🧍",
  Luce: "🙏",
  Dolce: "🍬",
  Marino: "🌊",
  Orso: "🐻",
  Mago: "🪄",
  Salato: "🧂",
};

export default function Lore() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="text-sm text-slate-400 hover:text-white"
          >
            {t("lore.back")}
          </Link>

          <img
            src="/images/bannerLOGOSOGNATORI.png"
            alt="Sognatori"
            className="h-10 object-contain"
          />

          <div className="w-16" />
        </div>

        <Section title={t("lore.genesis")}>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t("lore.genesisP1")}
          </p>

          <p className="text-sm text-slate-300 leading-relaxed mt-2">
            {t("lore.genesisP2")}
          </p>
        </Section>

        <Section title={t("lore.factions")}>
          <div className="grid sm:grid-cols-2 gap-2">
            {FACTIONS.map((f) => (
              <div
                key={f}
                className="rounded-xl p-3 border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${FACTION_COLORS[f]}22, transparent)`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">
                    {FACTION_ICONS[f]}
                  </span>

                  <FactionBadge type={f} />
                </div>

                <div className="text-xs font-bold text-white">
                  {t(`lore.faction.${f}.title`)}
                </div>

                <div className="text-[11px] text-slate-400 mt-0.5">
                  {t(`lore.faction.${f}.desc`)}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("lore.sognatori")}>
          <div className="space-y-2">
            {ROSTER.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg bg-white/5 p-2"
              >
                <div className="text-[10px] text-slate-500 w-5">
                  {i + 1}
                </div>

                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                  <img
                    src={s.img}
                    alt={s.nome}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {s.nome}
                    </span>

                    <FactionBadge type={s.tipo} />
                  </div>

                  <div className="text-[10px] text-slate-400 truncate">
                    {s.theme}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 text-right flex-shrink-0">
                  <div>
                    {s.att}/{s.dif}/{s.vel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="text-center text-[11px] text-slate-500 mt-8 mb-4 italic">
          {t("lore.footer")}
        </div>

      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-6"
    >
      <h2 className="text-lg font-bold text-amber-400 mb-3">
        {title}
      </h2>

      {children}
    </motion.div>
  );
}