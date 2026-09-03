import { typeBonus } from "./typeChart";
import { bm } from "./battleMessages";

export function initBattleSognatore(t) {
  return {
    ...t,
    hp: 20,
    hpMax: 20,
    statMods: { att: 0, dif: 0, vel: 0 },
    protectedLastTurn: false,
    protectedThisTurn: false,
    turnsInPlay: 0,
    cannotSwitch: false,
    abilityNullified: false,
    typeOverride: null,
    blockFirstAttack: false,
fainted: false
  };
}

export function getType(s) {
  return s.typeOverride || s.tipo;
}

export function effAtt(s) {
  let a = s.att + (s.statMods.att || 0);
  const abil = s.abilityNullified ? null : s.abilKey;

  if (abil === "aragostino_fullhp" && s.hp >= s.hpMax) {
    a += 3;
  }

  return Math.max(0, a);
}

export function effDef(s) {
  return Math.max(0, s.dif + (s.statMods.dif || 0));
}

export function effVel(s) {
  return Math.max(1, s.vel + (s.statMods.vel || 0));
}

export function getPriority(s) {
  const abil = s.abilityNullified ? null : s.abilKey;
  if (abil === "icepadel_priority") return 1;
  return 0;
}

function isDebuffImmune(target, allies) {
  if (!target) return false;
  const abil = target.abilityNullified ? null : target.abilKey;
  if (abil === "cancucc_immune" ) return true;
  if (allies && allies.some(a => a && !a.fainted && a.abilKey === "ginza_guard" && !a.abilityNullified && a.id !== target.id)) return true;
  return false;
}

function applyMod(target, stat, amount, allies) {
  if (!target || target.fainted) return false;

  // LONG: ogni diminuzione diventa un aumento
  if (
    amount < 0 &&
    target.abilKey === "long_stable" &&
    !target.abilityNullified
  ) {
    amount = Math.abs(amount);
  }

  if (amount < 0 && isDebuffImmune(target, allies)) return false;

  target.statMods[stat] = (target.statMods[stat] || 0) + amount;
  return true;
}

export function calcDamage(attacker, defender) {
  const atkType = getType(attacker);
  const defType = getType(defender);
  const defAbil = defender.abilityNullified ? null : defender.abilKey;

  if (defAbil === "dragociocco_antislurpo" && atkType === "Orso") {
    return { dmg: 0, bonus: 0, immune: true, antislurpo: true, efficacy: "immune" };
  }
  const bonus = typeBonus(atkType, defType);
  if (bonus === -15) return { dmg: 0, bonus, immune: true, efficacy: "immune" };

  let def = effDef(defender);
  if (defAbil === "adli_shield" && atkType === "Umano") def += 5;

  const raw = effAtt(attacker) - def + 4 + bonus;
  const efficacy = bonus === 5 ? "se" : bonus === -3 ? "res" : "neutral";
  return { dmg: Math.max(1, raw), bonus, immune: false, efficacy };
}

export function onEntry(s, allies, enemies, lang = 'it') {
  if (!s || s.fainted) return [];
  const log = [];
  const m = bm(lang);
  const abil = s.abilityNullified ? null : s.abilKey;
  s.blockFirstAttack = false;

  switch (abil) {
    case "sparkly_debuff":
      enemies.forEach(e => { if (e && !e.fainted && applyMod(e, "att", -3, enemies)) log.push(m.debuffAtt(e.nome)); });
      break;
   
case "deb_aura":
  allies.forEach(a => {
    if (
      a &&
      !a.fainted &&
      a.tipo === "Robot"
    ) {
      a.statMods.att = (a.statMods.att || 0) + 2;
      log.push(m.auraBuff(a.nome));
    }
  });
  break;

    case "cillymbu_aura":
      allies.forEach(a => { if (a && !a.fainted && a.id !== s.id) applyMod(a, "att", 3, allies); });
      log.push(m.alliesBuff(s.nome));
      break;
    case "pepe_memecoin": {
      const ally = allies.find(a => a && !a.fainted && a.id !== s.id);
      if (ally) {
        const stats = { att: ally.att, dif: ally.dif, vel: ally.vel };
        const lowest = Object.entries(stats).sort((a, b) => a[1] - b[1])[0][0];
        applyMod(ally, lowest, 4, allies);
        log.push(m.memecoin(ally.nome, lowest.toUpperCase()));
      }
      break;
    }
    case "riwupido_nullify":
      enemies.forEach(e => { if (e && !e.fainted && e.tipo === "Robot") { e.abilityNullified = true; log.push(m.nullified(e.nome)); } });
      break;
    case "pequeno_block": {
      const fastest = enemies.filter(e => e && !e.fainted).sort((a, b) => effVel(b) - effVel(a))[0];
      if (fastest) { fastest.blockFirstAttack = true; log.push(m.firstBlocked(fastest.nome)); }
      break;
    }
  }
  return log;
}

export function resolveAttacks(playerActive, enemyActive, playerAttacks, enemyAttacks) {
  const log = [];
  const events = [];
  const all = [];
  playerAttacks.forEach(a => all.push({ ...a, side: "player", allies: playerActive, enemies: enemyActive }));
  enemyAttacks.forEach(a => all.push({ ...a, side: "enemy", allies: enemyActive, enemies: playerActive }));

  all.sort((a, b) => {
    const pa = getPriority(a.attacker), pb = getPriority(b.attacker);
    if (pb !== pa) return pb - pa;
    const va = effVel(a.attacker), vb = effVel(b.attacker);
    if (vb !== va) return vb - va;
    return Math.random() - 0.5;
  });

  for (let act of all) {
    if (act.attacker.fainted) continue;
    if (!act.target || act.target.fainted) {
      const newTarget = (act.enemies || []).find(e => e && !e.fainted);
      if (!newTarget) continue;
      act = { ...act, target: newTarget };
    }

    if (act.attacker.blockFirstAttack) {
      act.attacker.blockFirstAttack = false;
      log.push(`${act.attacker.nome} è bloccato! (Seed Phrase)`);
      continue;
    }

    const { dmg, bonus, immune, antislurpo, efficacy } = calcDamage(act.attacker, act.target);
    let msg = `${act.attacker.nome} attacca ${act.target.nome}`;

    if (antislurpo) { events.push({ targetId: act.target.id, efficacy: "immune", dmg: 0 }); log.push(`${msg}: Antislurpo! Dragociocco non può essere attaccato dagli Orsi`); continue; }
    if (act.target.protectedThisTurn) { events.push({ targetId: act.target.id, efficacy: "protected", dmg: 0 }); log.push(`${msg} — protetto! (0 danni)`); continue; }
    if (immune) { events.push({ targetId: act.target.id, efficacy: "immune", dmg: 0 }); log.push(`${msg}: immunità! (0 danni)`); continue; }

    events.push({ targetId: act.target.id, efficacy, dmg });
    act.target.hp = Math.max(0, act.target.hp - dmg);
    if (bonus === 5) msg += " — Superefficace!";
    else if (bonus === -3) msg += " — Non molto efficace...";
    msg += ` (${dmg} danni)`;

    const abil = act.attacker.abilityNullified ? null : act.attacker.abilKey;
    switch (abil) {
      case "scrocco_slow":
        if (applyMod(act.target, "vel", -4, act.enemies)) msg += ` · ${act.target.nome} -4 VEL`;
        break;
      case "uesditti_debuff":
        if (applyMod(act.target, "dif", -4, act.enemies)) msg += ` · ${act.target.nome} -4 DIF`;
        break;
      case "lari_typechange":
        act.target.typeOverride = "Nuvola";
        msg += ` · ${act.target.nome} diventa Nuvola!`;
        break;
      case "pirimar_lpool":
        act.attacker.hp = Math.min(act.attacker.hpMax, act.attacker.hp + 6);
        msg += " · +6 PS (Liquidity Pool)";
        break;
      case "nuvobetta_heal":
        act.attacker.hp = Math.min(act.attacker.hpMax, act.attacker.hp + 1);
        const na = act.allies.find(a => a && !a.fainted && a.id !== act.attacker.id);
        if (na) { na.hp = Math.min(na.hpMax, na.hp + 2); msg += " · +2 PS alleato"; }
        break;
      case "fourmori_buff":
        act.allies.forEach(a => { if (a && !a.fainted && a.id !== act.attacker.id) applyMod(a, "vel", 6, act.allies); });
        msg += " · alleati +6 VEL";
        break;
      case "eroe_splash": {
        const ea = act.enemies.find(e => e && !e.fainted && e.id !== act.target.id);
        if (ea) { ea.hp = Math.max(0, ea.hp - 3); msg += " · 3 danni all'alleato avversario"; if (ea.hp === 0) { ea.fainted = true; msg += ` (${ea.nome} KO!)`; } }
        break;
      }
      case "taomarco_lock":
        act.target.cannotSwitch = true;
        msg += " · (non può switchare)";
        break;
    }

    if (act.target.hp === 0) {
      const tAbil = act.target.abilityNullified ? null : act.target.abilKey;
      if (tAbil === "cenere_scoppio") {
        act.enemies.forEach(e => { if (e && !e.fainted) { e.hp = Math.max(0, e.hp - 3); if (e.hp === 0) e.fainted = true; } });
        msg += ` · ${act.target.nome} esplode: 3 danni a tutti gli avversari!`;
      }
      act.target.fainted = true;
      msg += ` ${act.target.nome} è KO!`;
    }
    log.push(msg);
  }
  return { log, events };
}

export function orderActions(playerActive, enemyActive, playerAttacks, enemyAttacks) {
  const all = [];
  playerAttacks.forEach(a => all.push({ ...a, side: "player", allies: playerActive, enemies: enemyActive }));
  enemyAttacks.forEach(a => all.push({ ...a, side: "enemy", allies: enemyActive, enemies: playerActive }));
  all.sort((a, b) => {
    const pa = getPriority(a.attacker), pb = getPriority(b.attacker);
    if (pb !== pa) return pb - pa;
    const va = effVel(a.attacker), vb = effVel(b.attacker);
    if (vb !== va) return vb - va;
    return Math.random() - 0.5;
  });
  return all;
}

export function processAction(act, lang = 'it') {
  const log = [];
  const events = [];
  const m = bm(lang);
  if (!act || act.attacker.fainted) return { log, events };
  if (!act.target || act.target.fainted) {
    const newTarget = (act.enemies || []).find(e => e && !e.fainted);
    if (!newTarget) return { log, events };
    act = { ...act, target: newTarget };
  }

  if (act.attacker.blockFirstAttack) {
    act.attacker.blockFirstAttack = false;
    log.push(m.blocked(act.attacker.nome));
    return { log, events };
  }

  if (act.target.protectedThisTurn) {
    const fiero = (act.enemies || []).find(e => e && !e.fainted && !e.abilityNullified && e.abilKey === "fierononno_swap" && e.id !== act.target.id);
    if (fiero) {
      log.push(m.fieroSwap(act.target.nome, fiero.nome));
      act = { ...act, target: fiero };
    }
  }

  const { dmg, bonus, immune, antislurpo, efficacy } = calcDamage(act.attacker, act.target);
  let msg = m.attacks(act.attacker.nome, act.target.nome);

  if (antislurpo) { events.push({ targetId: act.target.id, efficacy: "immune", dmg: 0 }); log.push(m.antislurpo(msg)); return { log, events }; }
if (act.target.protectedThisTurn) {
  events.push({
    targetId: act.target.id,
    efficacy: "protected",
    dmg: 0
  });

  log.push(
    lang === "en"
      ? `${act.attacker.nome} attacks ${act.target.nome}, but ${act.target.nome} is protected.`
      : `${act.attacker.nome} attacca ${act.target.nome}, ma ${act.target.nome} si protegge.`
  );

  return { log, events };
}
  if (immune) { events.push({ targetId: act.target.id, efficacy: "immune", dmg: 0 }); log.push(m.immune(msg)); return { log, events }; }

  events.push({ targetId: act.target.id, efficacy, dmg });
  act.target.hp = Math.max(0, act.target.hp - dmg);
  if (bonus === 5) msg += m.superEffective;
  else if (bonus === -3) msg += m.notEffective;
  msg += m.damage(dmg);

  const abil = act.attacker.abilityNullified ? null : act.attacker.abilKey;
  switch (abil) {
    case "scrocco_slow":
      if (applyMod(act.target, "vel", -4, act.enemies)) msg += ` · ${m.slowDebuff(act.target.nome)}`;
      break;
    case "uesditti_debuff":
      if (applyMod(act.target, "dif", -4, act.enemies)) msg += ` · ${m.defDebuff(act.target.nome)}`;
      break;
    case "lari_typechange":
      act.target.typeOverride = "Nuvola";
      msg += ` · ${m.typeChange(act.target.nome)}`;
      break;
    case "pirimar_lpool":
      act.attacker.hp = Math.min(act.attacker.hpMax, act.attacker.hp + 6);
      msg += m.lpool;
      break;
    case "nuvobetta_heal":
      act.attacker.hp = Math.min(act.attacker.hpMax, act.attacker.hp + 1);
      const na = act.allies.find(a => a && !a.fainted && a.id !== act.attacker.id);
      if (na) { na.hp = Math.min(na.hpMax, na.hp + 2); msg += m.heal; }
      break;
    case "fourmori_buff":
      act.allies.forEach(a => { if (a && !a.fainted && a.id !== act.attacker.id) applyMod(a, "vel", 6, act.allies); });
      msg += m.velBuff;
      break;
    case "eroe_splash": {
      const ea = act.enemies.find(e => e && !e.fainted && e.id !== act.target.id);
      if (ea) { ea.hp = Math.max(0, ea.hp - 3); msg += m.splash; if (ea.hp === 0) { ea.fainted = true; msg += m.splashKo(ea.nome); } }
      break;
    }
    case "taomarco_lock":
      act.target.cannotSwitch = true;
      msg += m.lock;
      break;
  }

  if (act.target.hp === 0) {
    const tAbil = act.target.abilityNullified ? null : act.target.abilKey;
    if (tAbil === "cenere_scoppio") {
      act.enemies.forEach(e => { if (e && !e.fainted) { e.hp = Math.max(0, e.hp - 3); if (e.hp === 0) e.fainted = true; } });
      msg += ` · ${m.explode(act.target.nome)}`;
    }
    act.target.fainted = true;
    msg += m.ko(act.target.nome);
  }
  log.push(msg);
  return { log, events };
}

export function applyEndOfTurn(allActive, lang = 'it') {
  const log = [];
  const m = bm(lang);
  for (const s of allActive) {
    if (!s || s.fainted) continue;
    s.turnsInPlay = (s.turnsInPlay || 0) + 1;
    const abil = s.abilityNullified ? null : s.abilKey;
    if (abil === "nina_regen" && s.hp < s.hpMax) {
      const heal = Math.min(2, s.hpMax - s.hp);
      s.hp += heal;
      if (heal > 0) log.push(m.regen(s.nome, heal));
    }
    s.cannotSwitch = false;
    s.protectedLastTurn = s.protectedThisTurn;
    s.protectedThisTurn = false;
  }
  return log;
}

export function onEntryDual(s, allies, enemies, mIt, mEn) {
  const log_it = [], log_en = [];
  if (!s || s.fainted) return { log_it, log_en };
  const abil = s.abilityNullified ? null : s.abilKey;
  s.blockFirstAttack = false;
  switch (abil) {
    case "sparkly_debuff":
      enemies.forEach(e => { if (e && !e.fainted && applyMod(e, "att", -3, enemies)) { log_it.push(mIt.debuffAtt(e.nome)); log_en.push(mEn.debuffAtt(e.nome)); } });
      break;
    case "deb_aura":
      allies.forEach(a => { if (a && !a.fainted && a.tipo === "Robot" && applyMod(a, "att", 2, allies)) { log_it.push(mIt.auraBuff(a.nome)); log_en.push(mEn.auraBuff(a.nome)); } });
      break;
    case "cillymbu_aura":
      allies.forEach(a => { if (a && !a.fainted && a.id !== s.id) applyMod(a, "att", 3, allies); });
      log_it.push(mIt.alliesBuff(s.nome)); log_en.push(mEn.alliesBuff(s.nome));
      break;
    case "pepe_memecoin": {
      const ally = allies.find(a => a && !a.fainted && a.id !== s.id);
      if (ally) {
        const stats = { att: ally.att, dif: ally.dif, vel: ally.vel };
        const lowest = Object.entries(stats).sort((a, b) => a[1] - b[1])[0][0];
        applyMod(ally, lowest, 4, allies);
        log_it.push(mIt.memecoin(ally.nome, lowest.toUpperCase())); log_en.push(mEn.memecoin(ally.nome, lowest.toUpperCase()));
      }
      break;
    }
    case "riwupido_nullify":
      enemies.forEach(e => { if (e && !e.fainted && e.tipo === "Robot") { e.abilityNullified = true; log_it.push(mIt.nullified(e.nome)); log_en.push(mEn.nullified(e.nome)); } });
      break;
    case "pequeno_block": {
      const fastest = enemies.filter(e => e && !e.fainted).sort((a, b) => effVel(b) - effVel(a))[0];
      if (fastest) { fastest.blockFirstAttack = true; log_it.push(mIt.firstBlocked(fastest.nome)); log_en.push(mEn.firstBlocked(fastest.nome)); }
      break;
    }
  }
  return { log_it, log_en };
}

export function processActionDual(act, mIt, mEn) {
  const log_it = [], log_en = [], events = [];
  if (!act || act.attacker.fainted) return { log_it, log_en, events };
  if (!act.target || act.target.fainted) {
    const newTarget = (act.enemies || []).find(e => e && !e.fainted);
    if (!newTarget) return { log_it, log_en, events };
    act = { ...act, target: newTarget };
  }
  if (act.attacker.blockFirstAttack) {
    act.attacker.blockFirstAttack = false;
    log_it.push(mIt.blocked(act.attacker.nome)); log_en.push(mEn.blocked(act.attacker.nome));
    return { log_it, log_en, events };
  }
  if (act.target.protectedThisTurn) {
    const fiero = (act.enemies || []).find(e => e && !e.fainted && !e.abilityNullified && e.abilKey === "fierononno_swap" && e.id !== act.target.id);
    if (fiero) {
      log_it.push(mIt.fieroSwap(act.target.nome, fiero.nome)); log_en.push(mEn.fieroSwap(act.target.nome, fiero.nome));
      act = { ...act, target: fiero };
    }
  }
  const { dmg, bonus, immune, antislurpo, efficacy } = calcDamage(act.attacker, act.target);
  let msgIt = mIt.attacks(act.attacker.nome, act.target.nome);
  let msgEn = mEn.attacks(act.attacker.nome, act.target.nome);
  if (antislurpo) { events.push({ targetId: act.target.id, efficacy: "immune", dmg: 0 }); log_it.push(mIt.antislurpo(msgIt)); log_en.push(mEn.antislurpo(msgEn)); return { log_it, log_en, events }; }
if (act.target.protectedThisTurn) {
  log_it.push(mIt.protected(msgIt));
  log_en.push(mEn.protected(msgEn));
  return { log_it, log_en, events };
}
  if (immune) { events.push({ targetId: act.target.id, efficacy: "immune", dmg: 0 }); log_it.push(mIt.immune(msgIt)); log_en.push(mEn.immune(msgEn)); return { log_it, log_en, events }; }
  events.push({ targetId: act.target.id, efficacy, dmg });
  act.target.hp = Math.max(0, act.target.hp - dmg);
  if (bonus === 5) { msgIt += mIt.superEffective; msgEn += mEn.superEffective; }
  else if (bonus === -3) { msgIt += mIt.notEffective; msgEn += mEn.notEffective; }
  msgIt += mIt.damage(dmg); msgEn += mEn.damage(dmg);
  const abil = act.attacker.abilityNullified ? null : act.attacker.abilKey;
  switch (abil) {
    case "scrocco_slow":
      if (applyMod(act.target, "vel", -4, act.enemies)) { msgIt += ` · ${mIt.slowDebuff(act.target.nome)}`; msgEn += ` · ${mEn.slowDebuff(act.target.nome)}`; }
      break;
    case "uesditti_debuff":
      if (applyMod(act.target, "dif", -4, act.enemies)) { msgIt += ` · ${mIt.defDebuff(act.target.nome)}`; msgEn += ` · ${mEn.defDebuff(act.target.nome)}`; }
      break;
    case "lari_typechange":
      act.target.typeOverride = "Nuvola";
      msgIt += ` · ${mIt.typeChange(act.target.nome)}`; msgEn += ` · ${mEn.typeChange(act.target.nome)}`;
      break;
    case "pirimar_lpool":
      act.attacker.hp = Math.min(act.attacker.hpMax, act.attacker.hp + 6);
      msgIt += mIt.lpool; msgEn += mEn.lpool;
      break;
    case "nuvobetta_heal":
      act.attacker.hp = Math.min(act.attacker.hpMax, act.attacker.hp + 1);
      const na = act.allies.find(a => a && !a.fainted && a.id !== act.attacker.id);
      if (na) { na.hp = Math.min(na.hpMax, na.hp + 2); msgIt += mIt.heal; msgEn += mEn.heal; }
      break;
    case "fourmori_buff":
      act.allies.forEach(a => { if (a && !a.fainted && a.id !== act.attacker.id) applyMod(a, "vel", 6, act.allies); });
      msgIt += mIt.velBuff; msgEn += mEn.velBuff;
      break;
    case "eroe_splash": {
      const ea = act.enemies.find(e => e && !e.fainted && e.id !== act.target.id);
      if (ea) { ea.hp = Math.max(0, ea.hp - 3); msgIt += mIt.splash; msgEn += mEn.splash; if (ea.hp === 0) { ea.fainted = true; msgIt += mIt.splashKo(ea.nome); msgEn += mEn.splashKo(ea.nome); } }
      break;
    }
    case "taomarco_lock":
      act.target.cannotSwitch = true;
      msgIt += mIt.lock; msgEn += mEn.lock;
      break;
  }
  if (act.target.hp === 0) {
    const tAbil = act.target.abilityNullified ? null : act.target.abilKey;
    if (tAbil === "cenere_scoppio") {
      act.enemies.forEach(e => { if (e && !e.fainted) { e.hp = Math.max(0, e.hp - 3); if (e.hp === 0) e.fainted = true; } });
      msgIt += ` · ${mIt.explode(act.target.nome)}`; msgEn += ` · ${mEn.explode(act.target.nome)}`;
    }
    act.target.fainted = true;
    msgIt += mIt.ko(act.target.nome); msgEn += mEn.ko(act.target.nome);
  }
  log_it.push(msgIt); log_en.push(msgEn);
  return { log_it, log_en, events };
}

export function applyEndOfTurnDual(allActive, mIt, mEn) {
  const log_it = [], log_en = [];
  for (const s of allActive) {
    if (!s || s.fainted) continue;
    s.turnsInPlay = (s.turnsInPlay || 0) + 1;
    const abil = s.abilityNullified ? null : s.abilKey;
    if (abil === "nina_regen" && s.hp < s.hpMax) {
      const heal = Math.min(2, s.hpMax - s.hp);
      s.hp += heal;
      if (heal > 0) { log_it.push(mIt.regen(s.nome, heal)); log_en.push(mEn.regen(s.nome, heal)); }
    }
    s.cannotSwitch = false;
    s.protectedLastTurn = s.protectedThisTurn;
    s.protectedThisTurn = false;
  }
  return { log_it, log_en };
}

export function aiChooseActions(enemyActive, playerActive, enemyBench) {
  return enemyActive.map(s => {
    if (!s || s.fainted) return null;
    const benchAlive = enemyBench.filter(b => b && !b.fainted);
    if (s.hp <= 4 && benchAlive.length > 0) return { type: "switch", benchIdx: enemyBench.findIndex(b => b && !b.fainted) };
    if (s.hp < 12 && !s.protectedLastTurn && Math.random() < 0.3) return { type: "protect" };
    const targets = playerActive.filter(t => t && !t.fainted);
    if (targets.length === 0) return null;
    let best = targets[0], bestDmg = -1;
    for (const t of targets) {
      const { dmg } = calcDamage(s, t);
      if (dmg > bestDmg) { bestDmg = dmg; best = t; }
    }
    return { type: "attack", targetId: best.id };
  });
}
