import React from "react";
import { useLanguage } from "@/lib/i18n";

export default function AbandonButton({
  onAbandon,
  confirmMessage,
}) {
  const { t } = useLanguage();

  const msg =
    confirmMessage ||
    t("battle.abandonConfirm");

  const handleClick = () => {
    if (window.confirm(msg)) {
      onAbandon();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="
        text-[10px]
        w-7
        h-7
        rounded
        bg-red-500/20
        hover:bg-red-500/30
        text-red-400
        flex
        items-center
        justify-center
        transition
        border
        border-red-500/20
      "
      aria-label={t("battle.abandon")}
      title={t("battle.abandon")}
    >
      🏳️
    </button>
  );
}