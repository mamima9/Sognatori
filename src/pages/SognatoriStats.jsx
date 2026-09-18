// @ts-nocheck

import React from "react";
import { Link } from "react-router-dom";
import { ROSTER } from "@/lib/sognatoriData";

import {
  getAbilityName,
  getAbilityDesc,
  getAbility2Name,
  getAbility2Desc,
} from "@/lib/abilityI18n";

import {
  FACTIONS,
  FACTION_COLORS,
  chart,
} from "@/lib/typeChart";


const getTypeStyle = (tipo) => {
  switch (tipo) {
    case "Mago":
      return "bg-violet-500/20 text-violet-300 border-violet-400/30";

    case "Dolce":
      return "bg-pink-500/20 text-pink-300 border-pink-400/30";

    case "Nuvola":
      return "bg-sky-500/20 text-sky-300 border-sky-400/30";

    case "Robot":
      return "bg-slate-500/20 text-slate-300 border-slate-400/30";

    case "Marino":
      return "bg-cyan-500/20 text-cyan-300 border-cyan-400/30";

    case "Umano":
      return "bg-amber-500/20 text-amber-300 border-amber-400/30";

    case "Luce":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";

    case "Natura":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-400/30";

    case "Demone":
      return "bg-red-500/20 text-red-300 border-red-400/30";

    case "Orso":
      return "bg-amber-700/20 text-amber-300 border-amber-600/30";

    case "Salato":
      return "bg-orange-500/20 text-orange-300 border-orange-400/30";

    default:
      return "bg-white/10 text-slate-300 border-white/10";
  }
};


/* =========================================================
   ORDINE UFFICIALE DELLA PAGINA SOGNATORI
========================================================= */

const SOGNATORI_ORDER = [
  "adlimago",
  "eroe",
  "cancucc",
  "dragociocco",
  "deb",
  "sparkly",
  "taomarco",
  "aragostino",
  "cillymbu",
  "nina",
  "nuvobetta",
  "scroccospell",
  "riwupido",
  "fourmori",
  "ginza",
  "lari",
  "uesditti",
  "long",
  "pepe",
  "icepadel",
  "pirimar",
  "fierononno",
  "pequeno",
  "cenere",
];


/* Usa ROSTER senza modificarlo */
const orderedRoster = SOGNATORI_ORDER
  .map((id) => ROSTER.find((s) => s.id === id))
  .filter(Boolean);


/* =========================================================
   COLORI AFFINITÀ
========================================================= */

const TYPE_EFFECT_STYLES = {
  se: {
    label: "SOFFERENTE!",
    bg: "#16a34a",
  },

  res: {
    label: "ARGINATO",
    bg: "#f97316",
  },

  immune: {
    label: "INVIOLABILE!",
    bg: "#475569",
  },
};


/* =========================================================
   BADGE TIPO
========================================================= */

const TypeBadge = ({ type }) => (
  <span
    className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10"
    style={{
      backgroundColor: `${FACTION_COLORS[type]}CC`,
    }}
  >
    {type}
  </span>
);


/* =========================================================
   BADGE EFFETTO
========================================================= */

const EffectBadge = ({ effect }) => {
  const style = TYPE_EFFECT_STYLES[effect];

  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black text-white"
      style={{
        backgroundColor: style.bg,
      }}
    >
      {style.label}
    </span>
  );
};


/* =========================================================
   COMPONENTE AFFINITÀ
========================================================= */

const AffinitySection = ({ type }) => {

  /*
   * ATTACCO
   * Il Sognatore di questo tipo attacca i difensori.
   */
  const strongAttack = FACTIONS.filter(
    (defender) => chart[type]?.[defender] === 5
  );

  const resistedAttack = FACTIONS.filter(
    (defender) => chart[type]?.[defender] === -3
  );

  const immuneAttack = FACTIONS.filter(
    (defender) => chart[type]?.[defender] === -15
  );


  /*
   * DIFESA
   * Il Sognatore di questo tipo viene attaccato
   * dagli altri tipi.
   */
  const strongDefense = FACTIONS.filter(
    (attacker) => chart[attacker]?.[type] === 5
  );

  const resistedDefense = FACTIONS.filter(
    (attacker) => chart[attacker]?.[type] === -3
  );

  const immuneDefense = FACTIONS.filter(
    (attacker) => chart[attacker]?.[type] === -15
  );


  return (
    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">


      {/* =================================================
          ATTACCO
      ================================================= */}

      <div>

        <div className="flex items-center gap-2 mb-2">

          <span className="text-[10px] font-black text-red-300 uppercase tracking-widest">
            ⚔️ Affinità Attacco
          </span>

        </div>


        <div className="space-y-1.5">

          {/* SOFFERENTE */}

          {strongAttack.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">

              <EffectBadge effect="se" />

              {strongAttack.map((type) => (
                <TypeBadge
                  key={type}
                  type={type}
                />
              ))}

            </div>
          )}


          {/* ARGINATO */}

          {resistedAttack.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">

              <EffectBadge effect="res" />

              {resistedAttack.map((type) => (
                <TypeBadge
                  key={type}
                  type={type}
                />
              ))}

            </div>
          )}


          {/* INVIOLABILE */}

          {immuneAttack.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">

              <EffectBadge effect="immune" />

              {immuneAttack.map((type) => (
                <TypeBadge
                  key={type}
                  type={type}
                />
              ))}

            </div>
          )}

        </div>

      </div>


      {/* =================================================
          DIFESA
      ================================================= */}

      <div>

        <div className="flex items-center gap-2 mb-2">

          <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">
            🛡️ Affinità Difesa
          </span>

        </div>


        <div className="space-y-1.5">

          {/* SOFFERENTE */}

          {strongDefense.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">

              <EffectBadge effect="se" />

              {strongDefense.map((type) => (
                <TypeBadge
                  key={type}
                  type={type}
                />
              ))}

            </div>
          )}


          {/* ARGINATO */}

          {resistedDefense.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">

              <EffectBadge effect="res" />

              {resistedDefense.map((type) => (
                <TypeBadge
                  key={type}
                  type={type}
                />
              ))}

            </div>
          )}


          {/* INVIOLABILE */}

          {immuneDefense.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">

              <EffectBadge effect="immune" />

              {immuneDefense.map((type) => (
                <TypeBadge
                  key={type}
                  type={type}
                />
              ))}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};


/* =========================================================
   COMPONENTE PRINCIPALE
========================================================= */

export default function SognatoriStats() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white px-4 py-8">

      <div className="max-w-5xl mx-auto">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between gap-4 mb-8">

          <div>

            <div className="text-[10px] uppercase tracking-[0.25em] text-amber-400 font-bold mb-2">
              Sognatori
            </div>

            <h1 className="text-3xl sm:text-5xl font-black">
              Statistiche & Abilità
            </h1>

            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Scopri statistiche, affinità e abilità di tutti i Sognatori
              disponibili.
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Le informazioni riportate qui sono le stesse utilizzate
              durante le battaglie.
            </p>

          </div>


          <Link
            to="/"
            className="shrink-0 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold transition"
          >
            ← Home
          </Link>

        </div>


        {/* =================================================
            LEGENDA STATISTICHE
        ================================================= */}

        <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-4">

          <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3">
            Statistiche
          </div>


          <div className="grid grid-cols-3 gap-2 max-w-md">


            {/* ATT */}

            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2 text-center">

              <div className="text-[9px] text-red-300 font-bold">
                ATT
              </div>

              <div className="text-[10px] text-slate-400">
                Attacco
              </div>

            </div>


            {/* DIF */}

            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2 text-center">

              <div className="text-[9px] text-blue-300 font-bold">
                DIF
              </div>

              <div className="text-[10px] text-slate-400">
                Difesa
              </div>

            </div>


            {/* VEL */}

            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-2 text-center">

              <div className="text-[9px] text-green-300 font-bold">
                VEL
              </div>

              <div className="text-[10px] text-slate-400">
                Velocità
              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            SOGNATORI
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">


          {orderedRoster.map((s) => (

            <article
              key={s.id}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-xl hover:border-amber-400/30 transition"
            >


              {/* =================================================
                  IMMAGINE + NOME
              ================================================= */}

              <div className="p-4 flex gap-3 items-center">

                <div className="w-20 h-20 rounded-xl bg-black/20 flex items-center justify-center overflow-hidden shrink-0">

                  <img
                    src={s.img}
                    alt={s.nome}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />

                </div>


                <div className="min-w-0">


                  {/* NUMERO */}

                  <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400/70 font-bold mb-0.5">
                    #{String(
                      SOGNATORI_ORDER.indexOf(s.id) + 1
                    ).padStart(3, "0")}
                  </div>


                  {/* NOME */}

                  <h2 className="text-lg font-black truncate">
                    {s.nome}
                  </h2>


                  {/* TIPO */}

                  <span
                    className={`inline-flex mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${getTypeStyle(
                      s.tipo
                    )}`}
                  >
                    {s.tipo}
                  </span>

                </div>

              </div>


              {/* =================================================
                  STATISTICHE
              ================================================= */}

              <div className="grid grid-cols-3 gap-2 px-4 pb-3">


                {/* ATT */}

                <div className="rounded-lg bg-red-500/10 border border-red-500/10 p-2 text-center">

                  <div className="text-[9px] text-red-300 uppercase font-bold">
                    ATT
                  </div>

                  <div className="text-xl font-black">
                    {s.att}
                  </div>

                </div>


                {/* DIF */}

                <div className="rounded-lg bg-blue-500/10 border border-blue-500/10 p-2 text-center">

                  <div className="text-[9px] text-blue-300 uppercase font-bold">
                    DIF
                  </div>

                  <div className="text-xl font-black">
                    {s.dif}
                  </div>

                </div>


                {/* VEL */}

                <div className="rounded-lg bg-green-500/10 border border-green-500/10 p-2 text-center">

                  <div className="text-[9px] text-green-300 uppercase font-bold">
                    VEL
                  </div>

                  <div className="text-xl font-black">
                    {s.vel}
                  </div>

                </div>

              </div>


              {/* =================================================
                  ABILITÀ + AFFINITÀ
              ================================================= */}

              <div className="mx-4 mb-4 rounded-xl bg-black/20 border border-white/5 p-3">


                {/* ABILITÀ 1 */}

                <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">
                  Abilità
                </div>

                <div className="text-sm font-bold text-white">
                  {getAbilityName(s, "it") || "—"}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {getAbilityDesc(s, "it") || "—"}
                </p>


                {/* ABILITÀ 2 */}

                {s.abil2Key && (

                  <div className="pt-3 border-t border-white/10">

                    <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">
                      Abilità 2
                    </div>

                    <div className="text-sm font-bold text-white">
                      {getAbility2Name(s, "it")}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {getAbility2Desc(s, "it")}
                    </p>

                  </div>

                )}


                {/* =================================================
                    AFFINITÀ DEL SOGNATORE
                ================================================= */}

                <AffinitySection type={s.tipo} />

              </div>

            </article>

          ))}

        </div>

      </div>

    </div>
  );
}