import React from "react";
import { Link } from "react-router-dom";
import TypeChartTable from "@/components/game/TypeChartTable";
import { useLanguage } from "@/lib/i18n";

export default function TypeChart() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-sm text-slate-400 hover:text-white">{t('lore.back')}</Link>
          <h1 className="text-lg font-bold text-amber-400">{t('battle.typeChart')}</h1>
          <div className="w-16" />
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs text-slate-400 mb-3 text-center">{t('battle.typeChartDesc')}</div>
          <TypeChartTable />
          <div className="flex flex-wrap gap-4 mt-4 text-[11px] justify-center">
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-500"></span> {t('typechart.superEffective')}</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-orange-500"></span> {t('typechart.resisted')}</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-slate-800"></span> {t('typechart.immune')}</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-white/5 border border-white/10"></span> {t('typechart.neutral')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}