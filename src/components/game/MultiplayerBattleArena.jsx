// @ts-nocheck

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

import {
  getMatch,
  updateMatch,
  subscribeToMatch,
  createMatchHistory,
} from "@/lib/matchService";

import { ROSTER } from "@/lib/sognatoriData";

import {
  initBattleSognatore,
  orderActions,
  processActionDual,
  applyEndOfTurnDual,
  onEntryDual,
  calcDamage,
} from "@/lib/battleEngine";

import BattlePokemon from "./BattlePokemon";
import BenchCard from "./BenchCard";
import { SognatoreImage, FactionBadge } from "./HealthBar";
import TypeChartTable from "./TypeChartTable";
import { useCountdown, TimerBar } from "./Timer";
import { useAuth } from "@/lib/AuthContext";
import AbandonButton from "./AbandonButton";
import { modeLabel } from "@/lib/gameConstants";
import { useLanguage } from "@/lib/i18n";
import { bm } from "@/lib/battleMessages";
import { getAbilityName, getAbilityDesc } from "@/lib/abilityI18n";

const TURN_SECONDS = 60;

function buildAttacks(actions, myActive, oppActive) {
  const attacks = [];

  if (!actions) return attacks;

  const slots = myActive
    .map((s, i) => (s && !s.fainted ? i : null))
    .filter((i) => i !== null);

  slots.forEach((i) => {
    const act = actions[i];

    if (act && act.type === "attack" && myActive[i]) {
      const target =
        oppActive.find(
          (s) => s && s.id === act.targetId && !s.fainted
        ) ||
        oppActive.find((s) => s && !s.fainted);

      if (target) {
        attacks.push({
          attacker: myActive[i],
          target,
        });
      }
    }
  });

  return attacks;
}

export default function MultiplayerBattleArena({ matchId, onEnd }) {
  const [match, setMatch] = useState(null);

  const { user: currentUser } = useAuth();
  const { lang, t } = useLanguage();

  const m_it = bm("it");
  const m_en = bm("en");

  const [myActions, setMyActions] = useState({});
  const [showTypeChart, setShowTypeChart] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showBench, setShowBench] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [turnKey, setTurnKey] = useState(0);
  const [myStarters, setMyStarters] = useState([]);
  const [switchChoices, setSwitchChoices] = useState({});
  const [now, setNow] = useState(Date.now());

  const resolvingRef = useRef(false);
  const logEnd = useRef(null);
  const disconnectRef = useRef(false);
  const matchRef = useRef(null);

  matchRef.current = match;

  /*
   * ============================================================
   * CONVERSIONE ID -> OGGETTO SOGNATORE
   * ============================================================
   *
   * Supabase salva nella tabella matches solamente:
   *
   * player1_team_ids
   * player2_team_ids
   *
   * Il battle engine invece ha bisogno degli oggetti completi.
   */

  // Normalize both legacy DB formats: IDs or serialized Sognatore objects.
  // The auction can persist either form depending on the match version.
  const resolveTeam = (ids, legacyTeam) => {
    const source = Array.isArray(ids) && ids.length ? ids : (Array.isArray(legacyTeam) ? legacyTeam : []);

    return source
      .map((entry) => {
        if (entry && typeof entry === "object") {
          const id = entry.id ?? entry.sognatoreId ?? entry.sognatore_id;
          const roster = id != null ? ROSTER.find((s) => String(s.id) === String(id)) : null;
          return roster ? { ...roster, ...entry, nome: entry.nome ?? roster.nome, tipo: entry.tipo ?? roster.tipo, att: entry.att ?? roster.att, dif: entry.dif ?? roster.dif, vel: entry.vel ?? roster.vel, abilKey: entry.abilKey ?? roster.abilKey, img: entry.img ?? roster.img } : entry;
        }

        return ROSTER.find((s) => String(s.id) === String(entry));
      })
      .map((s) => {
        if (!s) return null;
        const roster = ROSTER.find((r) => String(r.id) === String(s.id));
        if (!roster) return s;
        return {
          ...roster,
          ...s,
          nome: s.nome ?? roster.nome,
          tipo: s.tipo ?? roster.tipo,
          att: Number.isFinite(Number(s.att)) ? Number(s.att) : roster.att,
          dif: Number.isFinite(Number(s.dif)) ? Number(s.dif) : roster.dif,
          vel: Number.isFinite(Number(s.vel)) ? Number(s.vel) : roster.vel,
          abilKey: s.abilKey ?? roster.abilKey,
          img: s.img ?? roster.img,
        };
      })
      .filter(Boolean);
  };

  const player1Team = resolveTeam(match?.player1_team_ids, match?.player1_team);
  const player2Team = resolveTeam(match?.player2_team_ids, match?.player2_team);

  /*
   * ============================================================
   * CLOCK
   * ============================================================
   */

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /*
   * Clear local switch choices when leaving switch phase
   */

  useEffect(() => {
    if (match?.game_state?.phase !== "switch") {
      setSwitchChoices({});
    }
  }, [match?.game_state?.phase]);

  /*
   * ============================================================
   * ANIMAZIONE TURNO
   * ============================================================
   */

  useEffect(() => {
    const gs = match?.game_state;

    if (!gs || gs.phase !== "animating") {
      setAnimStep(0);
      return;
    }

    const logs =
      (lang === "en"
        ? gs.lastTurnLog_en
        : gs.lastTurnLog_it) || [];

    if (animStep >= logs.length - 1) return;

    const timer = setTimeout(() => {
      setAnimStep((s) => s + 1);
    }, 4000);

    return () => clearTimeout(timer);
  }, [
    animStep,
    match?.game_state?.phase,
    match?.game_state?.turn,
    lang,
  ]);

  /*
   * ============================================================
   * CARICA PARTITA + REALTIME SUPABASE
   * ============================================================
   */

  useEffect(() => {
    if (!matchId) return;

    let active = true;

    const fetchMatch = async () => {
      try {
        const data = await getMatch(matchId);

        if (active) {
          setMatch(data);
        }
      } catch (error) {
        console.error("Errore caricamento match:", error);
      }
    };

    fetchMatch();

    const unsubscribe = subscribeToMatch(matchId, (updatedMatch) => {
      if (active) {
        setMatch(updatedMatch);
      }
    });

    const pollInterval = setInterval(fetchMatch, 5000);

    return () => {
      active = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }

      clearInterval(pollInterval);
    };
  }, [matchId]);

  /*
   * ============================================================
   * LATO DEL GIOCATORE
   * ============================================================
   */

  const isHost =
    currentUser &&
    match &&
    match.player1_id === currentUser.id;

  const mySide = isHost ? "player1" : "player2";
  const oppSide = isHost ? "player2" : "player1";

useEffect(() => {
  if (
    !matchId ||
    !match ||
    match.status !== "in_progress"
  ) {
    return;
  }

  const key = `${mySide}_last_seen`;

  let stopped = false;

  const beat = async () => {
    if (stopped) return;

    try {
      await updateMatch(matchId, {
        [key]: Date.now(),
      });
    } catch (error) {
      console.warn(
        "Heartbeat temporaneamente fallito:",
        error
      );
    }
  };

  // Primo heartbeat immediato
  beat();

  // Heartbeat ogni 5 secondi
  const interval = setInterval(beat, 5000);

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}, [
  matchId,
  match?.status,
  mySide,
]);
   
/*
 * ============================================================
 * DISCONNECT
 * ============================================================
 */
useEffect(() => {
  if (
    disconnectRef.current ||
    !match ||
    match.status !== "in_progress" ||
    !currentUser
  ) {
    return;
  }

  const oppLastSeen =
    match[`${oppSide}_last_seen`];

  /*
   * NON usiamo più battleStartTime come
   * riferimento per dichiarare una disconnessione.
   *
   * Se l'avversario non ha ancora mandato
   * un heartbeat, aspettiamo semplicemente.
   */
  if (!oppLastSeen) {
    return;
  }

  const elapsed =
    Date.now() - Number(oppLastSeen);

  /*
   * 45 secondi senza heartbeat = disconnessione reale.
   */
  const DISCONNECT_TIMEOUT = 180000;

  /*
   * Timestamp non valido o futuro:
   * non dichiarare nessuna disconnessione.
   */
  if (
    !Number.isFinite(Number(oppLastSeen)) ||
    Number(oppLastSeen) > Date.now() + 10000
  ) {
    return;
  }

  if (elapsed <= DISCONNECT_TIMEOUT) {
    return;
  }

  disconnectRef.current = true;

  const winner = mySide;

  const finishDisconnect = async () => {
    try {
      await updateMatch(match.id, {
        game_state: {
          ...match.game_state,
          phase: "done",
        },

        status: "done",

        winner,

        disconnect_winner: winner,
      });

      await createMatchHistory({
        player1_id:
          match.player1_id,

        player2_id:
          match.player2_id,

        player1_name:
          match.player1_name,

        player2_name:
          match.player2_name,

        player1_team_ids:
          player1Team.map(
            (s) => s.id
          ),

        player2_team_ids:
          player2Team.map(
            (s) => s.id
          ),

        winner_id:
          winner === "player1"
            ? match.player1_id
            : match.player2_id,

        mode: match.mode,
      });
    } catch (error) {
      console.error(
        "Errore gestione disconnessione:",
        error
      );

      disconnectRef.current = false;
    }
  };

  finishDisconnect();
}, [
  now,
  match,
  currentUser,
  mySide,
  oppSide,
  player1Team,
  player2Team,
]);

  /*
   * ============================================================
   * INIZIALIZZAZIONE PARTITA
   * ============================================================
   */

  useEffect(() => {
    if (
      !match ||
      match.status !== "waiting" ||
      !match.player2_id
    ) {
      return;
    }

    if (
      player1Team.length === 0 ||
      player2Team.length === 0
    ) {
      return;
    }

    /*
     * Se esiste già un game_state non dobbiamo ricrearlo.
     */
    if (match.game_state) {
      return;
    }

    const p1Active = player1Team
      .slice(0, 2)
      .map(initBattleSognatore);

    const p1Bench = player1Team
      .slice(2)
      .map(initBattleSognatore);

    const p2Active = player2Team
      .slice(0, 2)
      .map(initBattleSognatore);

    const p2Bench = player2Team
      .slice(2)
      .map(initBattleSognatore);

    const logsIt = [m_it.battleStart];
    const logsEn = [m_en.battleStart];

    p1Active.forEach((s) => {
      if (s) {
        const d = onEntryDual(
          s,
          p1Active,
          p2Active,
          m_it,
          m_en
        );

        logsIt.push(...d.log_it);
        logsEn.push(...d.log_en);
      }
    });

    p2Active.forEach((s) => {
      if (s) {
        const d = onEntryDual(
          s,
          p2Active,
          p1Active,
          m_it,
          m_en
        );

        logsIt.push(...d.log_it);
        logsEn.push(...d.log_en);
      }
    });

    const gs = {
      player1_active: p1Active,
      player2_active: p2Active,
      player1_bench: p1Bench,
      player2_bench: p2Bench,

      phase: "select",

      log_it: logsIt,
      log_en: logsEn,

      lastTurnLog_it: logsIt,
      lastTurnLog_en: logsEn,

      turn: 0,
      battleStartTime: Date.now(),
    };

    updateMatch(match.id, {
      game_state: gs,
      status: "in_progress",
    }).catch((error) => {
      console.error("Errore inizializzazione partita:", error);
    });
  }, [
    match,
    player1Team,
    player2Team,
  ]);

  /*
   * ============================================================
   * HOST: RISOLVE TURNO
   * ============================================================
   */

  useEffect(() => {
    if (
      !isHost ||
      !match ||
      match.status !== "in_progress" ||
      !match.game_state
    ) {
      return;
    }

    const gs = match.game_state;

    if (gs.phase !== "select") return;

    if (
      !match.player1_actions ||
      !match.player2_actions
    ) {
      return;
    }

    if (resolvingRef.current) return;

    resolvingRef.current = true;

    resolveTurn();
  }, [match, isHost]);

  /*
   * ============================================================
   * HOST: FINE ANIMAZIONE
   * ============================================================
   */

  useEffect(() => {
    if (
      !isHost ||
      !match ||
      !match.game_state ||
      match.game_state.phase !== "animating"
    ) {
      return;
    }

    const logs =
      match.game_state.lastTurnLog_it ||
      match.game_state.lastTurnLog ||
      [];

    const animMs = Math.max(
      16000,
      logs.length * 4000
    );

    const timer = setTimeout(
      () => handleAnimationEnd(),
      animMs
    );

    return () => clearTimeout(timer);

    // eslint-disable-next-line
  }, [
    match?.game_state?.phase,
    match?.game_state?.turn,
    isHost,
  ]);

  /*
   * ============================================================
   * HOST: SWITCH
   * ============================================================
   */

  useEffect(() => {
    if (
      !isHost ||
      !match ||
      !match.game_state ||
      match.game_state.phase !== "switch"
    ) {
      return;
    }

    const gs = match.game_state;

    const p1Needs =
      gs.player1_active.some(
        (s) => s && s.fainted
      );

    const p2Needs =
      gs.player2_active.some(
        (s) => s && s.fainted
      );

    if (
      p1Needs &&
      !match.player1_actions
    ) {
      return;
    }

    if (
      p2Needs &&
      !match.player2_actions
    ) {
      return;
    }

    if (resolvingRef.current) return;

    resolvingRef.current = true;

    applySwitches();
  }, [match, isHost]);

  /*
   * ============================================================
   * HOST: PREMATCH
   * ============================================================
   */

  useEffect(() => {
    if (
      !isHost ||
      !match ||
      !match.game_state ||
      match.game_state.phase !== "prematch"
    ) {
      return;
    }

    const p1A = match.player1_actions;
    const p2A = match.player2_actions;

    if (
      !p1A ||
      !p2A ||
      !p1A.starters ||
      !p2A.starters
    ) {
      return;
    }

    if (resolvingRef.current) return;

    resolvingRef.current = true;

    initBattleFromStarters(
      p1A.starters,
      p2A.starters
    );
  }, [match, isHost]);

  /*
   * ============================================================
   * INIZIALIZZA BATTAGLIA DA STARTER
   * ============================================================
   */

  const initBattleFromStarters = async (
    p1Starters,
    p2Starters
  ) => {
    const p1Team = player1Team;
    const p2Team = player2Team;

    const p1Active = p1Starters
      .map((i) => initBattleSognatore(p1Team[i]))
      .filter(Boolean);

    const p1BenchIdx = [0, 1, 2, 3].filter(
      (i) => !p1Starters.includes(i)
    );

    const p1Bench = p1BenchIdx
      .map((i) => initBattleSognatore(p1Team[i]))
      .filter(Boolean);

    const p2Active = p2Starters
      .map((i) => initBattleSognatore(p2Team[i]))
      .filter(Boolean);

    const p2BenchIdx = [0, 1, 2, 3].filter(
      (i) => !p2Starters.includes(i)
    );

    const p2Bench = p2BenchIdx
      .map((i) => initBattleSognatore(p2Team[i]))
      .filter(Boolean);

    const logsIt = [m_it.battleStart];
    const logsEn = [m_en.battleStart];

    p1Active.forEach((s) => {
      if (s) {
        const d = onEntryDual(
          s,
          p1Active,
          p2Active,
          m_it,
          m_en
        );

        logsIt.push(...d.log_it);
        logsEn.push(...d.log_en);
      }
    });

    p2Active.forEach((s) => {
      if (s) {
        const d = onEntryDual(
          s,
          p2Active,
          p1Active,
          m_it,
          m_en
        );

        logsIt.push(...d.log_it);
        logsEn.push(...d.log_en);
      }
    });

    const gs = {
      ...match.game_state,

      phase: "select",

      player1_active: p1Active,
      player2_active: p2Active,

      player1_bench: p1Bench,
      player2_bench: p2Bench,

      log_it: logsIt,
      log_en: logsEn,

      lastTurnLog_it: logsIt,
      lastTurnLog_en: logsEn,

      turn: 0,
      battleStartTime: Date.now(),
    };

    await updateMatch(match.id, {
      game_state: gs,
      player1_actions: null,
      player2_actions: null,
    });

    resolvingRef.current = false;
  };

  /*
   * ============================================================
   * RISOLUZIONE TURNO
   * ============================================================
   */

  const resolveTurn = async () => {
    const gs = {
      ...match.game_state,
    };

    let p1Active = [
      ...gs.player1_active,
    ];

    let p1Bench = [
      ...gs.player1_bench,
    ];

    let p2Active = [
      ...gs.player2_active,
    ];

    let p2Bench = [
      ...gs.player2_bench,
    ];

    const p1A = match.player1_actions;
    const p2A = match.player2_actions;

    const newLogIt = [
      ...(gs.log_it || []),
    ];

    const newLogEn = [
      ...(gs.log_en || []),
    ];

    const turnNum =
      (gs.turn || 0) + 1;

    newLogIt.push(
      `__TURN_${turnNum}__`
    );

    newLogEn.push(
      `__TURN_${turnNum}__`
    );

    const entered = [];

    /*
     * SWITCH PLAYER 1
     */

    const p1Slots = p1Active
      .map((s, i) =>
        s && !s.fainted ? i : null
      )
      .filter((i) => i !== null);

    p1Slots.forEach((i) => {
      const act = p1A[i];

      if (
        act &&
        act.type === "switch" &&
        p1Active[i]
      ) {
        const inc =
          p1Bench[act.benchIdx];

        const out =
          p1Active[i];

        if (!inc || !out) return;

        p1Active[i] = inc;
        p1Bench[act.benchIdx] = out;

        newLogIt.push(
          m_it.switchLog(
            out.nome,
            inc.nome
          )
        );

        newLogEn.push(
          m_en.switchLog(
            out.nome,
            inc.nome
          )
        );

        entered.push({
          s: inc,
          allies: p1Active,
          enemies: p2Active,
        });
      }
    });

    /*
     * SWITCH PLAYER 2
     */

    const p2Slots = p2Active
      .map((s, i) =>
        s && !s.fainted ? i : null
      )
      .filter((i) => i !== null);

    p2Slots.forEach((i) => {
      const act = p2A[i];

      if (
        act &&
        act.type === "switch" &&
        p2Active[i]
      ) {
        const inc =
          p2Bench[act.benchIdx];

        const out =
          p2Active[i];

        if (!inc || !out) return;

        p2Active[i] = inc;
        p2Bench[act.benchIdx] = out;

        newLogIt.push(
          m_it.switchLog(
            out.nome,
            inc.nome
          )
        );

        newLogEn.push(
          m_en.switchLog(
            out.nome,
            inc.nome
          )
        );

        entered.push({
          s: inc,
          allies: p2Active,
          enemies: p1Active,
        });
      }
    });

    /*
     * ABILITÀ ALL'INGRESSO
     */

    entered.forEach(
      ({ s, allies, enemies }) => {
        const d = onEntryDual(
          s,
          allies,
          enemies,
          m_it,
          m_en
        );

        newLogIt.push(
          ...d.log_it
        );

        newLogEn.push(
          ...d.log_en
        );
      }
    );

    /*
     * PROTECT PLAYER 1
     */

    p1Slots.forEach((i) => {
      const act = p1A[i];

      if (
        act &&
        act.type === "protect" &&
        p1Active[i] &&
        !p1Active[i].protectedLastTurn
      ) {
        p1Active[i].protectedThisTurn =
          true;

        newLogIt.push(
          m_it.protects(
            p1Active[i].nome
          )
        );

        newLogEn.push(
          m_en.protects(
            p1Active[i].nome
          )
        );
      }
    });

    /*
     * PROTECT PLAYER 2
     */

    p2Slots.forEach((i) => {
      const act = p2A[i];

      if (
        act &&
        act.type === "protect" &&
        p2Active[i] &&
        !p2Active[i].protectedLastTurn
      ) {
        p2Active[i].protectedThisTurn =
          true;

        newLogIt.push(
          m_it.protects(
            p2Active[i].nome
          )
        );

        newLogEn.push(
          m_en.protects(
            p2Active[i].nome
          )
        );
      }
    });

    /*
     * ATTACCHI
     */

    const playerAttacks = buildAttacks(
      p1A,
      p1Active,
      p2Active
    );

    const enemyAttacks = buildAttacks(
      p2A,
      p2Active,
      p1Active
    );

    const ordered = orderActions(
      p1Active,
      p2Active,
      playerAttacks,
      enemyAttacks
    );

    for (const act of ordered) {
      const {
        log_it,
        log_en,
      } = processActionDual(
        act,
        m_it,
        m_en
      );

      newLogIt.push(
        ...log_it
      );

      newLogEn.push(
        ...log_en
      );
    }

    /*
     * FINE TURNO
     */

    const endDual =
      applyEndOfTurnDual(
        [
          ...p1Active,
          ...p2Active,
        ],
        m_it,
        m_en
      );

    newLogIt.push(
      ...endDual.log_it
    );

    newLogEn.push(
      ...endDual.log_en
    );

    const prevLen =
      (gs.log_it || []).length + 1;

    await updateMatch(match.id, {
      game_state: {
        ...gs,

        player1_active: p1Active,
        player2_active: p2Active,

        player1_bench: p1Bench,
        player2_bench: p2Bench,

        phase: "animating",

        log_it: newLogIt,
        log_en: newLogEn,

        lastTurnLog_it:
          newLogIt.slice(prevLen),

        lastTurnLog_en:
          newLogEn.slice(prevLen),

        turn:
          (gs.turn || 0) + 1,
      },

      player1_actions: null,
      player2_actions: null,
    });

    resolvingRef.current = false;
  };

  /*
   * ============================================================
   * FINE ANIMAZIONE
   * ============================================================
   */

  const handleAnimationEnd = async () => {
    const m = matchRef.current;

    if (
      !m ||
      !m.game_state ||
      m.game_state.phase !== "animating"
    ) {
      return;
    }

    const gs = m.game_state;

    const p1Fainted =
      gs.player1_active.some(
        (s) => s && s.fainted
      );

    const p2Fainted =
      gs.player2_active.some(
        (s) => s && s.fainted
      );

    const p1Alive = [
      ...gs.player1_active,
      ...gs.player1_bench,
    ].filter(
      (s) => s && !s.fainted
    ).length;

    const p2Alive = [
      ...gs.player2_active,
      ...gs.player2_bench,
    ].filter(
      (s) => s && !s.fainted
    ).length;

    /*
     * PARTITA FINITA
     */

    if (
      p1Alive === 0 ||
      p2Alive === 0
    ) {
      const winner =
        p1Alive > 0
          ? "player1"
          : "player2";

      await updateMatch(m.id, {
        game_state: {
          ...gs,
          phase: "done",
        },

        status: "done",

        winner,
      });

      await createMatchHistory({
        player1_id: m.player1_id,
        player2_id: m.player2_id,

        player1_name: m.player1_name,
        player2_name: m.player2_name,

        player1_team_ids:
          player1Team.map(
            (s) => s.id
          ),

        player2_team_ids:
          player2Team.map(
            (s) => s.id
          ),

        winner_id:
          winner === "player1"
            ? m.player1_id
            : m.player2_id,

        mode: m.mode,
      });
    }

    /*
     * UNO O PIÙ KO
     */

    else if (
      p1Fainted ||
      p2Fainted
    ) {
      await updateMatch(m.id, {
        game_state: {
          ...gs,
          phase: "switch",
        },
      });
    }

    /*
     * CONTINUA
     */

    else {
      await updateMatch(m.id, {
        game_state: {
          ...gs,
          phase: "select",
        },
      });

      setTurnKey(
        (k) => k + 1
      );
    }
  };

  /*
   * ============================================================
   * APPLY SWITCHES
   * ============================================================
   */

  const applySwitches = async () => {
    const gs = {
      ...match.game_state,
    };

    let p1Active = [
      ...gs.player1_active,
    ];

    let p1Bench = [
      ...gs.player1_bench,
    ];

    let p2Active = [
      ...gs.player2_active,
    ];

    let p2Bench = [
      ...gs.player2_bench,
    ];

    const newLogIt = [
      ...(gs.log_it || []),
    ];

    const newLogEn = [
      ...(gs.log_en || []),
    ];

    const applySide = (
      actions,
      active,
      bench,
      sideName,
      oppActive
    ) => {
      if (!actions) {
        return {
          active,
          bench,
        };
      }

      Object.entries(actions).forEach(
        ([slotIdx, act]) => {
          if (
            act &&
            act.type === "switch"
          ) {
            const idx =
              parseInt(slotIdx);

            const inc =
              bench[act.benchIdx];

            const out =
              active[idx];

            if (
              out &&
              out.fainted &&
              inc &&
              !inc.fainted
            ) {
              active[idx] = inc;
              bench[act.benchIdx] =
                out;

              newLogIt.push(
                `${sideName}: ${m_it.koEnter(
                  out.nome,
                  inc.nome
                )}`
              );

              newLogEn.push(
                `${sideName}: ${m_en.koEnter(
                  out.nome,
                  inc.nome
                )}`
              );

              const d =
                onEntryDual(
                  inc,
                  active,
                  oppActive,
                  m_it,
                  m_en
                );

              newLogIt.push(
                ...d.log_it
              );

              newLogEn.push(
                ...d.log_en
              );
            }
          }

          else if (
            act &&
            act.type === "play_down"
          ) {
            const idx =
              parseInt(slotIdx);

            const out =
              active[idx];

            if (
              out &&
              out.fainted
            ) {
              newLogIt.push(
                `${sideName}: ${m_it.playDown(
                  out.nome
                )}`
              );

              newLogEn.push(
                `${sideName}: ${m_en.playDown(
                  out.nome
                )}`
              );

              active[idx] = null;
            }
          }
        }
      );

      const filteredActive =
        active.filter(
          (s) => s !== null
        );

      return {
        active: filteredActive,
        bench,
      };
    };

    const r1 = applySide(
      match.player1_actions,
      p1Active,
      p1Bench,
      match.player1_name,
      p2Active
    );

    p1Active = r1.active;
    p1Bench = r1.bench;

    const r2 = applySide(
      match.player2_actions,
      p2Active,
      p2Bench,
      match.player2_name,
      p1Active
    );

    p2Active = r2.active;
    p2Bench = r2.bench;

    const prevLen =
      (gs.log_it || []).length;

    await updateMatch(match.id, {
      game_state: {
        ...gs,

        player1_active:
          p1Active,

        player2_active:
          p2Active,

        player1_bench:
          p1Bench,

        player2_bench:
          p2Bench,

        phase: "select",

        log_it: newLogIt,
        log_en: newLogEn,

        lastTurnLog_it:
          newLogIt.slice(prevLen),

        lastTurnLog_en:
          newLogEn.slice(prevLen),
      },

      player1_actions: null,
      player2_actions: null,
    });

    setTurnKey(
      (k) => k + 1
    );

    resolvingRef.current = false;
  };

  /*
   * ============================================================
   * ACTION HANDLERS
   * ============================================================
   */

  const setAction = (
    slot,
    action
  ) => {
    setMyActions((a) => ({
      ...a,
      [slot]: action,
    }));
  };

  const submitActions = async () => {
    const key =
      `${mySide}_actions`;

    await updateMatch(
      match.id,
      {
        [key]: myActions,
      }
    );
  };

  const submitSwitchChoices = async (
    choices
  ) => {
    const key =
      `${mySide}_actions`;

    await updateMatch(
      match.id,
      {
        [key]: choices,
      }
    );
  };

  /*
   * ============================================================
   * TIMER TURNO
   * ============================================================
   */

  const handleTimerExpire = () => {
    if (
      !match ||
      match.game_state?.phase !==
        "select"
    ) {
      return;
    }

    const gs =
      match.game_state;

    const myActive =
      gs[`${mySide}_active`];

    const oppActive =
      gs[`${oppSide}_active`];

    const slots =
      myActive
        .map((s, i) =>
          s && !s.fainted
            ? i
            : null
        )
        .filter(
          (i) => i !== null
        );

    const auto = {};

    slots.forEach((i) => {
      const targets =
        oppActive.filter(
          (e) =>
            e && !e.fainted
        );

      if (
        targets.length > 0
      ) {
        auto[i] = {
          type: "attack",
          targetId:
            targets[
              Math.floor(
                Math.random() *
                  targets.length
              )
            ].id,
        };
      }

      else {
        auto[i] = {
          type: "protect",
        };
      }
    });

    setMyActions(auto);

    const key =
      `${mySide}_actions`;

    updateMatch(match.id, {
      [key]: auto,
    });
  };

  const timeLeft =
    useCountdown(
      match?.game_state?.phase ===
        "select" &&
        !match?.[
          `${mySide}_actions`
        ]
        ? TURN_SECONDS
        : 0,

      handleTimerExpire,

      `${match?.game_state?.phase}-${turnKey}`
    );

  /*
   * ============================================================
   * PREMATCH TIMER
   * ============================================================
   */

  const handlePrematchExpire = () => {
    if (
      !match ||
      match.game_state?.phase !==
        "prematch"
    ) {
      return;
    }

    if (
      match[
        `${mySide}_actions`
      ]
    ) {
      return;
    }

    const auto = [0, 1];

    setMyStarters(auto);

    updateMatch(match.id, {
      [`${mySide}_actions`]: {
        starters: auto,
      },
    });
  };

const prematchTimeLeft =
  useCountdown(
    match?.game_state?.phase ===
      "prematch" &&
      !match?.[
        `${mySide}_actions`
      ]
      ? TURN_SECONDS
      : 0,

    handlePrematchExpire,

    `prematch-${match?.id}-${match?.game_state?.battleStartTime || "new"}-${mySide}`
  );

  /*
   * ============================================================
   * SWITCH TIMER
   * ============================================================
   */

  const handleSwitchExpire = () => {
    if (
      !match ||
      match.game_state?.phase !==
        "switch"
    ) {
      return;
    }

    if (
      match[
        `${mySide}_actions`
      ]
    ) {
      return;
    }

    const gs =
      match.game_state;

    const myAct =
      gs[`${mySide}_active`];

    const myBch =
      gs[`${mySide}_bench`];

    const alive =
      myBch.filter(
        (s) =>
          s && !s.fainted
      );

    const faintedSlots =
      myAct
        .map((s, i) =>
          s && s.fainted
            ? i
            : null
        )
        .filter(
          (i) => i !== null
        );

    if (
      faintedSlots.length === 0
    ) {
      return;
    }

    const choices = {};

    let benchPtr = 0;

    faintedSlots.forEach(
      (slotIdx) => {
        if (
          benchPtr <
          alive.length
        ) {
          const benchIdx =
            myBch.indexOf(
              alive[benchPtr]
            );

          choices[slotIdx] = {
            type: "switch",
            benchIdx,
          };

          benchPtr++;
        }

        else {
          choices[slotIdx] = {
            type: "play_down",
          };
        }
      }
    );

    submitSwitchChoices(
      choices
    );
  };

  const switchTimeLeft =
    useCountdown(
      match?.game_state?.phase ===
        "switch" &&
        !match?.[
          `${mySide}_actions`
        ]
        ? TURN_SECONDS
        : 0,

      handleSwitchExpire,

      `switch-${match?.game_state?.turn}`
    );

  /*
   * ============================================================
   * STARTER
   * ============================================================
   */

  const submitStarters =
    async () => {
      if (
        myStarters.length !== 2
      ) {
        return;
      }

      await updateMatch(
        match.id,
        {
          [`${mySide}_actions`]: {
            starters:
              myStarters,
          },
        }
      );
    };

  /*
   * ============================================================
   * ABBANDONO
   * ============================================================
   */

  const handleAbandon =
    async () => {
      if (
        !window.confirm(
          t(
            "battle.abandonConfirm"
          )
        )
      ) {
        return;
      }

      const winner =
        oppSide;

      await updateMatch(
        match.id,
        {
          game_state: {
            ...match.game_state,
            phase: "done",
          },

          status: "done",

          winner,

          disconnect_winner:
            winner,
        }
      );

      await createMatchHistory({
        player1_id:
          match.player1_id,

        player2_id:
          match.player2_id,

        player1_name:
          match.player1_name,

        player2_name:
          match.player2_name,

        player1_team_ids:
          player1Team.map(
            (s) => s.id
          ),

        player2_team_ids:
          player2Team.map(
            (s) => s.id
          ),

        winner_id:
          winner === "player1"
            ? match.player1_id
            : match.player2_id,

        mode: match.mode,
      });

      onEnd();
    };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (
    !match ||
    !currentUser
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  /*
   * ============================================================
   * WAITING
   * ============================================================
   */

  if (
    match.status === "waiting"
  ) {
    const bothPresent =
      match.player2_id &&
      player2Team.length > 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950">
        <div className="text-2xl font-bold text-amber-400 mb-2">
          {bothPresent
            ? t(
                "multiplayer.starting"
              )
            : t(
                "multiplayer.waiting"
              )}
        </div>

        {!bothPresent && (
          <div className="text-sm text-slate-400 mb-6">
            {match.mode ===
            "private"
              ? `${t(
                  "multiplayer.roomCode"
                )}: ${
                  match.room_code
                }`
              : t(
                  "multiplayer.searching"
                )}
          </div>
        )}

        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  /*
   * ============================================================
   * DONE
   * ============================================================
   */

  if (
    match.status === "done"
  ) {
    const won =
      match.winner ===
      mySide;

    const fullLog =
      (
        lang === "en"
          ? match.game_state
              ?.log_en
          : match.game_state
              ?.log_it
      ) || [];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 px-6 py-10">
        <div className="text-7xl mb-4">
          {won ? "🏆" : "💀"}
        </div>

        <h2 className="text-4xl font-black mb-2">
          {won
            ? t(
                "battle.victory"
              )
            : t(
                "battle.defeat"
              )}
        </h2>

        <p className="text-slate-400 mb-6 text-sm">
          {won
            ? match.disconnect_winner ===
              mySide
              ? t(
                  "battle.disconnected"
                )
              : t(
                  "battle.youWon"
                )
            : match.disconnect_winner &&
              match.disconnect_winner !==
                mySide
            ? t(
                "battle.disconnectDetected"
              )
            : t(
                "battle.teamDefeated"
              )}
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={onEnd}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold hover:brightness-110 transition"
          >
            {t("battle.exit")}
          </button>

          <button
            onClick={() =>
              setShowSummary(
                (s) => !s
              )
            }
            className="px-6 py-3 rounded-full bg-white/10 font-bold hover:bg-white/20 transition"
          >
            📋{" "}
            {t(
              "battle.summary"
            )}
          </button>
        </div>

        {showSummary && (
          <div className="w-full max-w-md max-h-[50vh] overflow-y-auto rounded-2xl bg-slate-900/80 border border-white/10 p-4">
            <div className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-2">
              {t(
                "battle.fullLog"
              )}
            </div>

            <div className="space-y-1">
              {fullLog.map(
                (l, i) => (
                  <div
                    key={i}
                    className="text-[11px] text-slate-300 bg-white/5 rounded-md px-2 py-1"
                  >
                    {l}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
   * ============================================================
   * GAME STATE
   * ============================================================
   */

  const gs =
    match.game_state;

  if (!gs) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  /*
   * ============================================================
   * PREMATCH
   * ============================================================
   */

  if (
    gs.phase === "prematch"
  ) {
    const myTeam =
      isHost
        ? player1Team
        : player2Team;

   const myStarterActions =
  match[`${mySide}_actions`];

const oppStarterActions =
  match[`${oppSide}_actions`];

const mySubmitted =
  Array.isArray(myStarterActions?.starters) &&
  myStarterActions.starters.length === 2;

const oppSubmitted =
  Array.isArray(oppStarterActions?.starters) &&
  oppStarterActions.starters.length === 2;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white px-4 py-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            {t(
              "battle.selectStarters"
            )}
          </span>

          <div className="text-[10px] text-slate-400">
            {modeLabel(
              match.mode
            )}
          </div>
        </div>

        <AbandonButton
          onAbandon={
            handleAbandon
          }
        />

        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-amber-400">
            {t(
              "battle.chooseStarters"
            )}
          </h2>

          <p className="text-xs text-slate-400">
            {t(
              "battle.selectMsg"
            )}{" "}
            ({myStarters.length}
            /2)
          </p>
        </div>

        {!mySubmitted && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-400">
                {oppSubmitted
                  ? t(
                      "battle.opponentReady"
                    )
                  : t(
                      "multiplayer.waiting"
                    )}
              </span>

              <span
                className={`text-xs font-bold ${
                  prematchTimeLeft <=
                  10
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                ⏱{" "}
                {
                  prematchTimeLeft
                }
                s
              </span>
            </div>

            <TimerBar
              seconds={
                prematchTimeLeft
              }
              total={
                TURN_SECONDS
              }
            />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {(myTeam || []).map(
            (s, i) => (
              <div
                key={s.id}
                className={`rounded-xl p-2 border transition ${
                  mySubmitted
                    ? "border-white/10 bg-white/5"
                    : "cursor-pointer"
                } ${
                  myStarters.includes(
                    i
                  )
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-white/10 bg-white/5 hover:border-white/30"
                }`}
                onClick={() => {
                  if (
                    mySubmitted
                  )
                    return;

                  setMyStarters(
                    (prev) => {
                      if (
                        prev.includes(
                          i
                        )
                      ) {
                        return prev.filter(
                          (x) =>
                            x !== i
                        );
                      }

                      if (
                        prev.length >=
                        2
                      ) {
                        return prev;
                      }

                      return [
                        ...prev,
                        i,
                      ];
                    }
                  );
                }}
              >
                <div className="flex gap-2 items-center">
                  <SognatoreImage
                    s={s}
                    className="w-12 h-12"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">
                      {s.nome}
                    </div>

                    <FactionBadge
                      type={
                        s.tipo
                      }
                    />

                    <div className="flex gap-1 mt-0.5 text-[8px]">
                      <span className="bg-red-500/20 rounded px-1">
                        A{" "}
                        {s.att}
                      </span>

                      <span className="bg-blue-500/20 rounded px-1">
                        D{" "}
                        {s.dif}
                      </span>

                      <span className="bg-green-500/20 rounded px-1">
                        V{" "}
                        {s.vel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[8px] text-amber-400/80 font-semibold mt-1">
                  {getAbilityName(
                    s,
                    lang
                  )}
                </div>

                {myStarters.includes(
                  i
                ) && (
                  <div className="text-[9px] text-amber-400 font-bold mt-1 text-center">
                    ✓{" "}
                    {t(
                      "battle.starter"
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {!mySubmitted ? (
          <button
            onClick={
              submitStarters
            }
            disabled={
              myStarters.length !==
              2
            }
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold disabled:opacity-40 hover:brightness-110 transition"
          >
            {t(
              "battle.confirmFormation"
            )}{" "}
            ({myStarters.length}
            /2)
          </button>
        ) : (
          <div className="text-center text-sm text-amber-400 py-4 animate-pulse">
            {t(
              "battle.formationConfirmed"
            )}
          </div>
        )}
      </div>
    );
  }

  /*
   * ============================================================
   * BATTLE
   * ============================================================
   */

  const myActive =
    gs[`${mySide}_active`];

  const myBench =
    gs[`${mySide}_bench`];

  const oppActive =
    gs[`${oppSide}_active`];

  const oppBench =
    gs[`${oppSide}_bench`];

  const mySubmitted =
    !!match[
      `${mySide}_actions`
    ];

  const oppSubmitted =
    !!match[
      `${oppSide}_actions`
    ];

  const aliveSlots =
    myActive
      .map((s, i) =>
        s && !s.fainted
          ? i
          : null
      )
      .filter(
        (i) => i !== null
      );

  const benchAlive =
    myBench.filter(
      (s) =>
        s && !s.fainted
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col">
      <AbandonButton
        onAbandon={
          handleAbandon
        }
      />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-4 pb-3 min-h-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            {modeLabel(
              match.mode,
              lang
            )}{" "}
            ·{" "}
            {isHost
              ? match.player2_name
              : match.player1_name}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setShowBench(
                  true
                )
              }
              className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
            >
              🪑{" "}
              {t(
                "battle.bench"
              )}
            </button>

            <button
              onClick={() =>
                setShowTypeChart(
                  true
                )
              }
              className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
            >
              📊{" "}
              {t(
                "battle.types"
              )}
            </button>
          </div>
        </div>

        {(() => {
          const ttl =
            (lang === "en"
              ? gs.lastTurnLog_en
              : gs.lastTurnLog_it) ||
            [];

          const shown =
            ttl.filter(
              (l) =>
                !l.startsWith(
                  "__TURN_"
                )
            );

          return (
            gs.phase ===
              "animating" &&
            shown.length > 0
          );
        })() && (
          <div className="flex justify-center mb-2">
            <motion.div
              key={animStep}
              initial={{
                opacity: 0,
                scale: 0.85,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.3,
              }}
              className="bg-slate-900/90 backdrop-blur border border-amber-500/40 rounded-2xl px-5 py-3 max-w-[90%] text-center shadow-2xl"
            >
              <div className="text-[9px] uppercase tracking-widest text-amber-400 font-bold mb-1">
                {t(
                  "battle.turn"
                )}{" "}
                {gs.turn}
              </div>

              <div className="space-y-1 max-h-20 overflow-hidden">
                {(
                  (
                    lang ===
                    "en"
                      ? gs.lastTurnLog_en
                      : gs.lastTurnLog_it
                  ) || []
                )
                  .filter(
                    (l) =>
                      !l.startsWith(
                        "__TURN_"
                      )
                  )
                  .slice(
                    Math.max(
                      0,
                      animStep - 3
                    ),
                    animStep + 1
                  )
                  .map(
                    (
                      l,
                      i,
                      arr
                    ) => (
                      <div
                        key={i}
                        className={`text-xs font-semibold leading-snug ${
                          i ===
                          arr.length -
                            1
                            ? "text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {l}
                      </div>
                    )
                  )}
              </div>

              <div className="mt-2 flex justify-center gap-1">
                {(
                  (
                    lang ===
                    "en"
                      ? gs.lastTurnLog_en
                      : gs.lastTurnLog_it
                  ) || []
                )
                  .filter(
                    (l) =>
                      !l.startsWith(
                        "__TURN_"
                      )
                  )
                  .map(
                    (_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i <=
                          animStep
                            ? "bg-amber-400"
                            : "bg-white/20"
                        }`}
                      />
                    )
                  )}
              </div>
            </motion.div>
          </div>
        )}

        <div className="relative rounded-3xl bg-gradient-to-b from-rose-950/30 via-slate-900/40 to-emerald-950/30 border border-white/10 p-3 sm:p-4 flex-1 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="text-center text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-1">
              {t(
                "battle.opponent"
              )}
            </div>

            <div className="flex justify-around items-end min-h-[90px]">
              {oppActive.map(
                (s, i) =>
                  s ? (
                    <BattlePokemon
                      key={
                        s.id + i
                      }
                      s={s}
                      side="enemy"
                    />
                  ) : null
              )}
            </div>
          </div>

          <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div>
            <div className="flex justify-around items-start min-h-[90px]">
              {myActive.map(
                (s, i) =>
                  s ? (
                    <BattlePokemon
                      key={
                        s.id + i
                      }
                      s={s}
                      side="player"
                    />
                  ) : null
              )}
            </div>

            <div className="text-center text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-1">
              {t(
                "battle.you"
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/90 backdrop-blur border-t border-white/10 px-4 py-3 max-w-5xl mx-auto w-full">
        {gs.phase ===
          "select" &&
          !mySubmitted && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400">
                  {t(
                    "battle.timeMoves"
                  )}{" "}
                  {oppSubmitted &&
                    `· ${t(
                      "battle.opponentReady"
                    )}`}
                </span>

                <span
                  className={`text-xs font-bold ${
                    timeLeft <=
                    10
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  ⏱{" "}
                  {timeLeft}
                  s
                </span>
              </div>

              <TimerBar
                seconds={
                  timeLeft
                }
                total={
                  TURN_SECONDS
                }
              />
            </div>
          )}

        {gs.phase ===
          "select" &&
          !mySubmitted && (
            <div className="grid grid-cols-2 gap-3">
              {myActive.map(
                (s, i) => {
                  if (
                    !s ||
                    s.fainted
                  ) {
                    return (
                      <div
                        key={i}
                      />
                    );
                  }

                  const act =
                    myActions[i];

                  return (
                    <div
                      key={i}
                      className="rounded-xl bg-white/5 p-2"
                    >
                      <div className="text-xs font-semibold flex items-center gap-1">
                        <div className="w-5 h-5 rounded overflow-hidden">
                          <SognatoreImage
                            s={s}
                            className="w-full h-full"
                          />
                        </div>

                        {s.nome}

                        {s.protectedLastTurn && (
                          <span className="text-[9px] text-blue-400">
                            🛡️
                          </span>
                        )}

                        {s.cannotSwitch && (
                          <span className="text-[9px] text-red-400">
                            🔒
                          </span>
                        )}
                      </div>

                      <div className="text-[9px] text-amber-400/80 leading-tight mt-0.5">
                        {getAbilityName(
                          s,
                          lang
                        )}{" "}
                        ·{" "}
                        {getAbilityDesc(
                          s,
                          lang
                        )}
                      </div>

                      {!act ? (
                        <div className="grid grid-cols-3 gap-1 mt-1">
                          <button
                            onClick={() =>
                              setAction(
                                i,
                                {
                                  type: "attack",
                                  _picking: true,
                                }
                              )
                            }
                            className="text-[10px] py-1 rounded bg-red-500/20 hover:bg-red-500/30"
                          >
                            ⚔️{" "}
                            {t(
                              "battle.attack"
                            )}
                          </button>

                          <button
                            onClick={() =>
                              setAction(
                                i,
                                {
                                  type: "protect",
                                }
                              )
                            }
                            disabled={
                              s.protectedLastTurn
                            }
                            className="text-[10px] py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30"
                          >
                            🛡️{" "}
                            {t(
                              "battle.protect"
                            )}
                          </button>

                          <button
                            onClick={() =>
                              setAction(
                                i,
                                {
                                  type: "switch",
                                  _picking: true,
                                }
                              )
                            }
                            disabled={
                              benchAlive.length ===
                                0 ||
                              s.cannotSwitch
                            }
                            className="text-[10px] py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-30"
                          >
                            🔄{" "}
                            {t(
                              "battle.switch"
                            )}
                          </button>
                        </div>
                      ) : act._picking &&
                        act.type ===
                          "attack" ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {oppActive
                            .filter(
                              (e) =>
                                e &&
                                !e.fainted
                            )
                            .map(
                              (e) => {
                                const {
                                  dmg,
                                  efficacy,
                                } =
                                  calcDamage(
                                    s,
                                    e
                                  );

                                const effColor =
                                  efficacy ===
                                  "se"
                                    ? "text-green-400"
                                    : efficacy ===
                                      "res"
                                    ? "text-orange-400"
                                    : efficacy ===
                                      "immune"
                                    ? "text-slate-500"
                                    : "text-slate-300";

                                return (
                                  <button
                                    key={
                                      e.id
                                    }
                                    onClick={() =>
                                      setAction(
                                        i,
                                        {
                                          type: "attack",
                                          targetId:
                                            e.id,
                                        }
                                      )
                                    }
                                    className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 flex items-center gap-1"
                                  >
                                    <div className="w-5 h-5 rounded overflow-hidden">
                                      <SognatoreImage
                                        s={e}
                                        className="w-full h-full"
                                      />
                                    </div>

                                    {e.nome}

                                    <span
                                      className={`font-bold ${effColor}`}
                                    >
                                      ~
                                      {
                                        dmg
                                      }
                                    </span>
                                  </button>
                                );
                              }
                            )}
                        </div>
                      ) : act._picking &&
                        act.type ===
                          "switch" ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {myBench.map(
                            (
                              b,
                              bi
                            ) =>
                              b &&
                              !b.fainted ? (
                                <button
                                  key={
                                    b.id
                                  }
                                  onClick={() =>
                                    setAction(
                                      i,
                                      {
                                        type: "switch",
                                        benchIdx:
                                          bi,
                                      }
                                    )
                                  }
                                  className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 flex items-center gap-1"
                                >
                                  <div className="w-5 h-5 rounded overflow-hidden">
                                    <SognatoreImage
                                      s={b}
                                      className="w-full h-full"
                                    />
                                  </div>

                                  {
                                    b.nome
                                  }
                                </button>
                              ) : null
                          )}
                        </div>
                      ) : (
                        <div className="mt-1 text-[11px] flex justify-between">
                          <span>
                            {act.type ===
                            "attack"
                              ? `⚔️ ${
                                  oppActive.find(
                                    (
                                      e
                                    ) =>
                                      e?.id ===
                                      act.targetId
                                  )
                                    ?.nome ||
                                  ""
                                }`
                              : act.type ===
                                "protect"
                              ? `🛡️ ${t(
                                  "battle.protect"
                                )}`
                              : `🔄 ${
                                  myBench[
                                    act
                                      .benchIdx
                                  ]
                                    ?.nome ||
                                  ""
                                }`}
                          </span>

                          <button
                            onClick={() =>
                              setAction(
                                i,
                                null
                              )
                            }
                            className="text-[10px] text-amber-400"
                          >
                            {t(
                              "battle.change"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
              )}

              <div className="col-span-2">
                <button
                  onClick={
                    submitActions
                  }
                  disabled={
                    !aliveSlots.every(
                      (i) =>
                        myActions[
                          i
                        ] &&
                        !myActions[
                          i
                        ]._picking
                    )
                  }
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold disabled:opacity-40 hover:brightness-110 transition"
                >
                  {t(
                    "battle.confirmMoves"
                  )}
                </button>
              </div>
            </div>
          )}

        {gs.phase ===
          "select" &&
          mySubmitted && (
            <div className="text-center text-sm text-amber-400 py-4 animate-pulse">
              {t(
                "battle.waitingOpponent"
              )}
            </div>
          )}

        {gs.phase ===
          "animating" && (
            <div className="text-center text-sm text-amber-400 py-4 animate-pulse">
              {t(
                "battle.resolving"
              )}
            </div>
          )}

        {gs.phase ===
          "switch" && (
            <div className="py-2">
              {myActive.some(
                (s) =>
                  s &&
                  s.fainted
              ) ? (
                !mySubmitted ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-slate-400">
                        {t(
                          "battle.timeSub"
                        )}
                      </span>

                      <span
                        className={`text-xs font-bold ${
                          switchTimeLeft <=
                          10
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        ⏱{" "}
                        {
                          switchTimeLeft
                        }
                        s
                      </span>
                    </div>

                    <TimerBar
                      seconds={
                        switchTimeLeft
                      }
                      total={
                        TURN_SECONDS
                      }
                      className="mb-3"
                    />

                    <div className="text-sm text-amber-400 mb-3 text-center">
                      {t(
                        "battle.koMsg"
                      )}
                    </div>

                    {myActive.map(
                      (s, i) => {
                        if (
                          !s ||
                          !s.fainted
                        ) {
                          return null;
                        }

                        const choice =
                          switchChoices[
                            i
                          ];

                        return (
                          <div
                            key={i}
                            className="mb-3 rounded-xl bg-white/5 p-2"
                          >
                            <div className="text-xs font-semibold mb-1 text-center">
                              {
                                s.nome
                              }{" "}
                              — KO
                            </div>

                            {!choice ? (
                              <div className="flex flex-wrap gap-2 justify-center">
                                {benchAlive.map(
                                  (b) => {
                                    const bi =
                                      myBench.indexOf(
                                        b
                                      );

                                    const usedBench =
                                      Object.values(
                                        switchChoices
                                      ).filter(
                                        (
                                          c
                                        ) =>
                                          c &&
                                          c.type ===
                                            "switch" &&
                                          c.benchIdx ===
                                            bi
                                      ).length >
                                      0;

                                    return (
                                      <button
                                        key={
                                          b.id
                                        }
                                        disabled={
                                          usedBench
                                        }
                                        onClick={() =>
                                          setSwitchChoices(
                                            (
                                              prev
                                            ) => ({
                                              ...prev,
                                              [i]: {
                                                type: "switch",
                                                benchIdx:
                                                  bi,
                                              },
                                            })
                                          )
                                        }
                                        className="text-sm px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center gap-2 disabled:opacity-30"
                                      >
                                        <div className="w-7 h-7 rounded-lg overflow-hidden">
                                          <SognatoreImage
                                            s={
                                              b
                                            }
                                            className="w-full h-full"
                                          />
                                        </div>

                                        {
                                          b.nome
                                        }{" "}
                                        (
                                        {
                                          b.hp
                                        }
                                        /20)
                                      </button>
                                    );
                                  }
                                )}

                                {benchAlive.length ===
                                  0 && (
                                  <button
                                    onClick={() =>
                                      setSwitchChoices(
                                        (
                                          prev
                                        ) => ({
                                          ...prev,
                                          [i]: {
                                            type: "play_down",
                                          },
                                        })
                                      )
                                    }
                                    className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                                  >
                                    {t(
                                      "battle.playDown"
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex justify-between items-center px-2">
                                <span className="text-xs">
                                  {choice.type ===
                                  "switch"
                                    ? `🔄 ${
                                        myBench[
                                          choice
                                            .benchIdx
                                        ]
                                          ?.nome ||
                                        ""
                                      }`
                                    : `⬇️ ${t(
                                        "battle.playDown"
                                      )}`}
                                </span>

                                <button
                                  onClick={() =>
                                    setSwitchChoices(
                                      (
                                        prev
                                      ) => {
                                        const n =
                                          {
                                            ...prev,
                                          };

                                        delete n[
                                          i
                                        ];

                                        return n;
                                      }
                                    )
                                  }
                                  className="text-[10px] text-amber-400"
                                >
                                  {t(
                                    "battle.change"
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}

                    <button
                      onClick={() =>
                        submitSwitchChoices(
                          switchChoices
                        )
                      }
                      disabled={
                        !myActive.every(
                          (
                            s,
                            i
                          ) =>
                            !s ||
                            !s.fainted ||
                            switchChoices[
                              i
                            ]
                        )
                      }
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold disabled:opacity-40 hover:brightness-110 transition"
                    >
                      {t(
                        "battle.confirmMoves"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-sm text-amber-400 py-4 animate-pulse">
                    {t(
                      "battle.subConfirmed"
                    )}
                  </div>
                )
              ) : (
                <div className="text-center text-sm text-amber-400 py-4 animate-pulse">
                  {t(
                    "battle.waitingChoice"
                  )}
                </div>
              )}
            </div>
          )}
      </div>

      

      {showTypeChart && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() =>
            setShowTypeChart(
              false
            )
          }
        >
          <div
            className="bg-slate-900 rounded-2xl border border-white/10 p-4 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-amber-400">
                {t(
                  "battle.typeChart"
                )}
              </h3>

              <button
                onClick={() =>
                  setShowTypeChart(
                    false
                  )
                }
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <TypeChartTable />
          </div>
        </div>
      )}

      {showBench && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() =>
            setShowBench(
              false
            )
          }
        >
          <div
            className="bg-slate-900 rounded-2xl border border-white/10 p-4 max-w-md w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-amber-400">
                {t(
                  "battle.bench"
                )}
              </h3>

              <button
                onClick={() =>
                  setShowBench(
                    false
                  )
                }
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-rose-400 font-bold mb-2">
                  {t(
                    "battle.enemyBench"
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {oppBench.map(
                    (s, i) => (
                      <BenchCard
                        key={
                          s.id + i
                        }
                        s={s}
                        side="enemy"
                      />
                    )
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-emerald-400 font-bold mb-2">
                  {t(
                    "battle.yourBench"
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {myBench.map(
                    (s, i) => (
                      <BenchCard
                        key={
                          s.id + i
                        }
                        s={s}
                        side="player"
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}