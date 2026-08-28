const ABILITY_EN = {
  adli_shield: { name: "Ritual", desc: "If attacked by a Human: +5 DEF for that turn" },
  cancucc_immune: { name: "Bread and Hugs", desc: "Cannot suffer ATT and DEF drops" },
  eroe_splash: { name: "FOMO Cumulonimbus", desc: "The attack also deals 3 HP to the opponent's ally" },
  nuvobetta_heal: { name: "Majorette", desc: "When attacking: +1 HP to self, +2 HP to ally" },
  scrocco_slow: { name: "Rug Pull", desc: "The target: -4 SPD" },
  deb_aura: { name: "Expedition", desc: "On entry: all Robot allies +2 ATT" },
  aragostino_fullhp: { name: "Cold Storage", desc: "+3 ATT if HP = 20" },
  sparkly_debuff: { name: "FUD", desc: "On entry: opponents -3 ATT" },
  nina_regen: { name: "Apotheosis", desc: "Recovers 2 HP every turn" },
  taomarco_lock: { name: "Errare Swap", desc: "The target cannot switch next turn" },
  riwupido_nullify: { name: "Divine Seal", desc: "On entry: nullifies opponent Robots' abilities" },
  fourmori_buff: { name: "Airdrop", desc: "If the attack hits: allies +6 SPD" },
  ginza_guard: { name: "Ally Protection", desc: "The ally cannot suffer stat drops" },
  dragociocco_antislurpo: { name: "Anti-Slurp", desc: "Cannot be attacked by Bears" },
  lari_typechange: { name: "Pink Clouds", desc: "The target becomes Cloud type" },
  uesditti_debuff: { name: "DeFi Depeg", desc: "The hit opponent: -4 DEF" },
  fierononno_swap: { name: "HODL Testnet", desc: "If the ally protects, swaps position with it" },
  long_stable: { name: "Airdrop Claim", desc: "Immune to stat drops, attack +6" },
  pepe_memecoin: { name: "Memecoin", desc: "On entry: +4 to the ally's lowest stat" },
  cillymbu_aura: { name: "Bamboo Thrust", desc: "Allies +3 ATT" },
  pequeno_block: { name: "Seed Phrase", desc: "On entry: blocks the first attack of the fastest opponent" },
  cenere_scoppio: { name: "Burning White Paper", desc: "Before fainting: 3 damage to both opponents" },
  icepadel_priority: { name: "Pan Strike", desc: "Attacks with priority +1" },
  pirimar_lpool: { name: "Liquidity Pool", desc: "If the attack hits: recovers 6 HP" },
};

export function getAbilityName(s, lang) {
  if (lang === "en" && s.abilKey && ABILITY_EN[s.abilKey]) return ABILITY_EN[s.abilKey].name;
  return s.abil;
}

export function getAbilityDesc(s, lang) {
  if (lang === "en" && s.abilKey && ABILITY_EN[s.abilKey]) return ABILITY_EN[s.abilKey].desc;
  return s.abilDesc;
}