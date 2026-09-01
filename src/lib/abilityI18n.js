const ABILITY_EN = {
  adli_shield: { name: "Ritual", desc: "If it has to defend against a Human, it gets +5 DEF." },
  cancucc_immune: { name: "Bread and Hugs", desc: "Cannot suffer ATT or DEF drops." },
  eroe_splash: { name: "FOMO Cumulonimbus", desc: "When attacking, it also deals 3 damage to the opponent's ally." },
  nuvobetta_heal: { name: "Majorette", desc: "When attacking, recovers 1 HP and its ally recovers 2 HP." },
  scrocco_slow: { name: "Rug Pull", desc: "When attacking, hit opponents lose 4 SPD." },
  deb_aura: { name: "Expedition", desc: "On entry, all allied Robots gain +2 ATT." },
  aragostino_fullhp: { name: "Cold Storage", desc: "Gets +3 ATT only when at 20 HP." },
  sparkly_debuff: { name: "FUD", desc: "On entry, opponents lose 3 ATT." },
  nina_regen: { name: "Apotheosis", desc: "Recovers 2 HP every turn." },
  taomarco_lock: { name: "Errare Swap", desc: "The target cannot switch during the next turn." },
  riwupido_nullify: { name: "Divine Seal", desc: "On entry, nullifies the abilities of opposing Robots." },
  fourmori_buff: { name: "TDM", desc: "If its attack hits, allies gain +6 SPD." },
  ginza_guard: { name: "Ally Protection", desc: "Its ally cannot suffer stat drops." },
  dragociocco_antislurpo: { name: "Anti-Slurp", desc: "Cannot be attacked by Bears." },
  lari_typechange: { name: "Pink Clouds", desc: "Anyone hit by its attack becomes Cloud type." },
  uesditti_debuff: { name: "DeFi Depeg", desc: "The hit opponent loses 4 DEF." },
  fierononno_swap: { name: "HODL", desc: "If its ally Protects, it swaps position with that ally." },
  long_stable: { name: "Airdrop Claim", desc: "Stat decreases become increases." },
  pepe_memecoin: { name: "Memecoin", desc: "On entry, the ally's lowest stat gains +4." },
  cillymbu_aura: { name: "Bamboo Thrust", desc: "Allies gain +3 ATT." },
  pequeno_block: { name: "Seed Phrase", desc: "On entry, blocks the first attack of the fastest opposing Sognatore." },
  cenere_scoppio: { name: "Burning White Paper", desc: "Before fainting, deals 3 damage to both opponents." },
  icepadel_priority: { name: "Pan Strike", desc: "Attacks with +1 priority." },
  pirimar_lpool: { name: "Liquidity Pool", desc: "If its attack hits, recovers 6 HP." },
};

export function getAbilityName(s, lang) {
  if (lang === "en" && s.abilKey && ABILITY_EN[s.abilKey]) return ABILITY_EN[s.abilKey].name;
  return s.abil;
}

export function getAbilityDesc(s, lang) {
  if (lang === "en" && s.abilKey && ABILITY_EN[s.abilKey]) return ABILITY_EN[s.abilKey].desc;
  return s.abilDesc;
}