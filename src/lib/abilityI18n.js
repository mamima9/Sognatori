const ABILITY_EN = {
  adli_shield: { name: "Ritual", desc: "If it has to defend against a Human, it gets +5 DEF." },
  cancucc_immune: { name: "Bread and Hugs", desc: "Cannot suffer ATT or DEF drops." },
  eroe_splash: { name: "FOMO Cumulonimbus", desc: "When it deals damage, it also deals 3 damage to the opponent's ally." },
  nuvobetta_heal: { name: "Majorette", desc: "When it deals damage, recovers 1 HP and its ally recovers 2 HP." },
  scrocco_slow: { name: "Rug Pull", desc: "When it deals damage, hit opponents lose 4 SPD." },
  deb_aura: { name: "Expedition", desc: "On entry, all allied Robots gain +2 ATT." },
  aragostino_fullhp: { name: "Cold Storage", desc: "Gets +3 ATT only when at 20 HP." },
  sparkly_debuff: { name: "FUD", desc: "On entry, opponents lose 3 ATT." },
  nina_regen: { name: "Apotheosis", desc: "Recovers 2 HP every turn." },
  taomarco_def_buff: {
  name: "Errare Swap",
  desc: "When it deals damage, it gains +1 DEF."
},
  riwupido_nullify: { name: "Divine Seal", desc: "On entry, nullifies the abilities of opposing Robots." },
  fourmori_buff: { name: "TDM", desc: "If its attack hits, ally gain +6 SPD." },
  ginza_guard: { name: "Ally Protection", desc: "Its ally cannot suffer stat drops." },
  dragociocco_antislurpo: { name: "Anti-Slurp", desc: "Cannot be attacked by Bears." },
  lari_typechange: { name: "Pink Clouds", desc: "Anyone hit by its attack becomes Cloud type." },
  uesditti_debuff: { name: "DeFi Depeg", desc: "The hit opponent loses 4 DEF." },
  fierononno_swap: { name: "HODL", desc: "If its ally Protects, it swaps position with that ally." },
  long_stable: { name: "Airdrop Claim", desc: "Stat decreases become increases." },
  pepe_memecoin: { name: "Memecoin", desc: "On entry, the ally's lowest base stat gains +4." },
  cillymbu_aura: { name: "Bamboo Thrust", desc: "Ally gain +3 ATT." },
  pequeno_block: { name: "Seed Phrase", desc: "On entry, blocks the first attack of the fastest opposing Sognatore." },
  cenere_scoppio: { name: "Burning White Paper", desc:"When it drops below 5 HP, it deals 3 damage to each opponent" },
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