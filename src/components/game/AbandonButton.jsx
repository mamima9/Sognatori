import React from "react";

import { useLanguage } from "@/lib/i18n";

export default function AbandonButton({ onAbandon, confirmMessage }) {
  const { t } = useLanguage();
  const msg = confirmMessage || t('battle.abandonConfirm');
  const handleClick = () => {
    if (window.confirm(msg)) onAbandon();
  };
  return (
    <button
      onClick={handleClick}
      className="fixed bottom-2 right-4 z-[99] text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition font-bold backdrop-blur border border-red-500/30 shadow-lg md:bottom-4 md:right-4"
    >
      🏳️ {t('battle.abandon')}
    </button>
  );
}