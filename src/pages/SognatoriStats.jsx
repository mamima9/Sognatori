// @ts-nocheck

import React from "react";
import { Link } from "react-router-dom";
import { ROSTER } from "@/lib/sognatoriData";
import {
  getAbilityName,
  getAbilityDesc,
} from "@/lib/abilityI18n";

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

    default:
      return "bg-white/10 text-slate-300 border-white/10";
  }
};

export default function SognatoriStats() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-amber-400 font-bold mb-2">
              Sognatori
            </div>

            <h1 className="text-3xl sm:text-5xl font-black">
              Statistiche & Abilità
            </h1>

            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Scopri statistiche, tipi e abilità di tutti i Sognatori
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

        {/* LEGENDA STATISTICHE */}
        <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3">
            Statistiche
          </div>

          <div className="grid grid-cols-3 gap-2 max-w-md">

            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2 text-center">
              <div className="text-[9px] text-red-300 font-bold">
                ATT
              </div>

              <div className="text-[10px] text-slate-400">
                Attacco
              </div>
            </div>

            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2 text-center">
              <div className="text-[9px] text-blue-300 font-bold">
                DIF
              </div>

              <div className="text-[10px] text-slate-400">
                Difesa
              </div>
            </div>

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

        {/* SOGNATORI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {ROSTER.map((s) => (
            <article
              key={s.id}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-xl hover:border-amber-400/30 transition"
            >

              {/* IMMAGINE + NOME */}
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

                  <h2 className="text-lg font-black truncate">
                    {s.nome}
                  </h2>

                  <span
                    className={`inline-flex mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${getTypeStyle(
                      s.tipo
                    )}`}
                  >
                    {s.tipo}
                  </span>

                </div>
              </div>

              {/* STATISTICHE */}
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

              {/* ABILITÀ */}
              <div className="mx-4 mb-4 rounded-xl bg-black/20 border border-white/5 p-3">

                <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">
                  {getAbilityName(s, "it")}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed min-h-[48px]">
                  {getAbilityDesc(s, "it")}
                </p>

              </div>

            </article>
          ))}

        </div>

      </div>
    </div>
  );
}