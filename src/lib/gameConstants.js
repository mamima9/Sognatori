export const MODE_LABELS = {
  it: { competitive: "Competitiva", friendly: "Amichevole", private: "Privata" },
  en: { competitive: "Competitive", friendly: "Friendly", private: "Private" },
};

export const modeLabel = (mode, lang = "it") => MODE_LABELS[lang]?.[mode] || MODE_LABELS.it[mode] || mode;