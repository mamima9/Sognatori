// @ts-nocheck

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMatch,
  updateMatch,
  subscribeToMatch,
  createMatchHistory,
} from "@/lib/matchService";
import { ROSTER } from "@/lib/sognatoriData";
import { FactionBadge } from "./HealthBar";
import { TimerBar } from "./Timer";
import { useAuth } from "@/lib/AuthContext";
import AbandonButton from "./AbandonButton";
import { modeLabel } from "@/lib/gameConstants";
import { useLanguage } from "@/lib/i18n";
import { bm } from "@/lib/battleMessages";
import { getAbilityName, getAbilityDesc } from "@/lib/abilityI18n";

const BID_OPTIONS = [1, 5, 10];
const AUCTION_SECONDS = 60;

const LOGO = "/images/bannerLOGOSOGNATORI.png";

export default function MultiplayerAuction({ matchId, onAbandon }) {
  const [match, setMatch] = useState(null);
  const [now, setNow] = useState(Date.now());

  const { user: currentUser } = useAuth();
  const { lang, t } = useLanguage();

  const m = bm(lang);
  const m_it = bm("it");
  const m_en = bm("en");

  const resolvingRef = useRef(false);

  // Timer basato su timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Carica e aggiorna la partita
  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = () =>
  getMatch(matchId)
    .then(setMatch)
    .catch(() => {});

    fetchMatch();

  const unsubscribe = subscribeToMatch(matchId, (event) => {
  if (event.id === matchId) {
    fetchMatch();
  }
});

    const pollInterval = setInterval(fetchMatch, 3000);

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      clearInterval(pollInterval);
    };
  }, [matchId]);

  const isHost =
    currentUser && match && match.player1_id === currentUser.id;

  const mySide = isHost ? "player1" : "player2";
  const oppSide = isHost ? "player2" : "player1";

  // ============================================================
  // HOST: INIZIALIZZAZIONE ASTA
  // ============================================================

  useEffect(() => {
    if (
      !isHost ||
      !match ||
      match.status !== "waiting" ||
      !match.player2_id
    ) {
      return;
    }

    if (match.game_state) return;

    const pool = [...ROSTER].sort(() => Math.random() - 0.5);

    const baseGs = {
      pool: [],
      player1_credits: 100,
      player2_credits: 100,
      player1_team: [],
      player2_team: [],
      currentLot: null,
      currentBid: 0,
      currentBidder: null,
      turn: "player1",
      lotSelector: "player1",
      passCount: 0,
      passedThisLot: [],
      lotStartTime: 0,
    };

    let gs;

    if (match.mode === "competitive") {
      gs = {
        ...baseGs,
        pool,
        phase: "auction_select",
        auctionMode: "choice",
        selectStartTime: Date.now(),
        log_it: [m_it.compMode(match.player1_name)],
        log_en: [m_en.compMode(match.player1_name)],
      };
    } else {
      gs = {
        ...baseGs,
        phase: "auction_setup",
        auctionMode: null,
        setupStartTime: Date.now(),
        log_it: [m_it.auctionStarts],
        log_en: [m_en.auctionStarts],
      };
    }

    updateMatch(match.id, {
      game_state: gs,
      status: "in_progress",
    });
  }, [match, isHost]);

  // ============================================================
  // HOST: AVVIO ASTA DOPO SCELTA MODALITÀ
  // ============================================================

  const startAuctionWithMode = async (mode) => {
    if (!isHost || !match?.game_state) {
      resolvingRef.current = false;
      return;
    }

    const gs = match.game_state;
    const pool = [...ROSTER].sort(() => Math.random() - 0.5);

    let newGs;

    if (mode === "random") {
      newGs = {
        ...gs,
        auctionMode: "random",
        pool,
        currentLot: pool[0],
        phase: "auction_bidding",
        turn: "player1",
        lotStartTime: Date.now(),
        passedThisLot: [],
        log_it: [...gs.log_it, m_it.randMode],
        log_en: [...gs.log_en, m_en.randMode],
      };
    } else {
      newGs = {
        ...gs,
        auctionMode: "choice",
        pool,
        phase: "auction_select",
        lotSelector: "player1",
        selectStartTime: Date.now(),
        log_it: [
          ...gs.log_it,
          m_it.choiceMode(match.player1_name),
        ],
        log_en: [
          ...gs.log_en,
          m_en.choiceMode(match.player1_name),
        ],
      };
    }

    await updateMatch(match.id, {
      game_state: newGs,
    });

    resolvingRef.current = false;
  };

  // ============================================================
  // PLAYER: SCELTA DEL LOTTO
  // ============================================================

  const selectLot = async (sogId) => {
    const gs = match.game_state;

    if (
      gs.phase !== "auction_select" ||
      gs.lotSelector !== mySide
    ) {
      return;
    }

    const lot = gs.pool.find((s) => s.id === sogId);

    if (!lot) return;

    const oppFull = gs[`${oppSide}_team`].length >= 4;

    if (oppFull) {
      let newGs = {
        ...gs,
        [`${mySide}_team`]: [
          ...gs[`${mySide}_team`],
          lot,
        ],
        [`${mySide}_credits`]:
          gs[`${mySide}_credits`] - 1,
        currentLot: lot,
        log_it: [
          ...gs.log_it,
          m_it.autoWinFull(myName, lot.nome),
        ],
        log_en: [
          ...gs.log_en,
          m_en.autoWinFull(myName, lot.nome),
        ],
      };

      const p1Done = newGs.player1_team.length >= 4;
      const p2Done = newGs.player2_team.length >= 4;

      if (p1Done && p2Done) {
        await finishAuction(newGs);
        return;
      }

      if (
        newGs.pool.filter((s) => s.id !== lot.id).length === 0
      ) {
        await finishAuction(newGs);
        return;
      }

      const next = nextLotState(newGs, mySide);

      newGs = {
        ...newGs,
        ...next,
      };

      await updateMatch(match.id, {
        game_state: newGs,
      });

      return;
    }

    const newGs = {
      ...gs,
      currentLot: lot,
      phase: "auction_bidding",
      turn: gs.lotSelector,
      lotStartTime: Date.now(),
      passedThisLot: [],
      log_it: [
        ...gs.log_it,
        m_it.selectsLot(
          gs.lotSelector === "player1"
            ? match.player1_name
            : match.player2_name,
          lot.nome
        ),
      ],
      log_en: [
        ...gs.log_en,
        m_en.selectsLot(
          gs.lotSelector === "player1"
            ? match.player1_name
            : match.player2_name,
          lot.nome
        ),
      ],
    };

    await updateMatch(match.id, {
      game_state: newGs,
    });
  };

  // ============================================================
  // HOST: PROCESSA AZIONE DELL'ASTA
  // ============================================================

  useEffect(() => {
    if (!isHost || !match || !match.game_state) return;

    const gs = match.game_state;

    if (gs.phase !== "auction_bidding") return;

    const action = match[`${gs.turn}_actions`];

    if (!action) return;

    if (resolvingRef.current) return;

    resolvingRef.current = true;

    processAuctionAction(action);
  }, [match, isHost]);

  // ============================================================
  // HOST: SCADENZA TIMER BIDDING
  // ============================================================

  useEffect(() => {
    if (!isHost || !match || !match.game_state) return;

    const gs = match.game_state;

    if (
      gs.phase !== "auction_bidding" ||
      !gs.currentLot ||
      !gs.lotStartTime
    ) {
      return;
    }

    const elapsed = Math.floor(
      (now - gs.lotStartTime) / 1000
    );

    if (elapsed < AUCTION_SECONDS) return;

    if (resolvingRef.current) return;

    resolvingRef.current = true;

    forfeitAuction(gs.turn);
  }, [now, isHost, match]);

  // ============================================================
  // HOST: SCADENZA TIMER SETUP
  // ============================================================

  useEffect(() => {
    if (!isHost || !match || !match.game_state) return;

    const gs = match.game_state;

    if (
      gs.phase !== "auction_setup" ||
      !gs.setupStartTime
    ) {
      return;
    }

    const elapsed = Math.floor(
      (now - gs.setupStartTime) / 1000
    );

    if (elapsed < AUCTION_SECONDS) return;

    if (resolvingRef.current) return;

    resolvingRef.current = true;

    forfeitAuction("player1");
  }, [now, isHost, match]);

  // ============================================================
  // HOST: SCADENZA TIMER SELEZIONE
  // ============================================================

  useEffect(() => {
    if (!isHost || !match || !match.game_state) return;

    const gs = match.game_state;

    if (
      gs.phase !== "auction_select" ||
      !gs.selectStartTime
    ) {
      return;
    }

    const elapsed = Math.floor(
      (now - gs.selectStartTime) / 1000
    );

    if (elapsed < AUCTION_SECONDS) return;

    if (resolvingRef.current) return;

    resolvingRef.current = true;

    forfeitAuction(gs.lotSelector);
  }, [now, isHost, match]);

  // ============================================================
  // PROCESSA AZIONE ASTA
  // ============================================================

  const processAuctionAction = async (action) => {
    const gs = { ...match.game_state };

    const actor = gs.turn;
    const other =
      actor === "player1" ? "player2" : "player1";

    const actorName =
      actor === "player1"
        ? match.player1_name
        : match.player2_name;

    let newGs = { ...gs };

    if (action.type === "bid") {
      const newBid = gs.currentBid + action.amount;

      if (
        newBid >
        gs[`${actor}_credits`]
      ) {
        resolvingRef.current = false;
        return;
      }

      newGs.currentBid = newBid;
      newGs.currentBidder = actor;
      newGs.turn = other;
      newGs.passCount = 0;
      newGs.lotStartTime = Date.now();

      newGs.log_it = [
        ...gs.log_it,
        m_it.bids(
          actorName,
          newBid,
          gs.currentLot.nome
        ),
      ];

      newGs.log_en = [
        ...gs.log_en,
        m_en.bids(
          actorName,
          newBid,
          gs.currentLot.nome
        ),
      ];
    } else if (action.type === "pass") {
      const actorDone =
        gs[`${actor}_team`].length >= 4;

      // Non si può passare a 0
      if (gs.currentBid === 0 && !actorDone) {
        await updateMatch(match.id, {
          player1_actions: null,
          player2_actions: null,
        });

        resolvingRef.current = false;
        return;
      }

      const loggedGs = {
        ...gs,
        log_it: [
          ...gs.log_it,
          m_it.passes(
            actorName,
            gs.currentLot.nome
          ),
        ],
        log_en: [
          ...gs.log_en,
          m_en.passes(
            actorName,
            gs.currentLot.nome
          ),
        ],
      };

      await resolveWin(other, loggedGs);
      return;
    }

    const clearActions = {
      player1_actions: null,
      player2_actions: null,
    };

    await updateMatch(match.id, {
      game_state: newGs,
      ...clearActions,
    });

    resolvingRef.current = false;
  };

  // ============================================================
  // STATO LOTTO SUCCESSIVO
  // ============================================================

  const nextLotState = (gs, winner) => {
    const newPool = gs.pool.filter(
      (s) => s.id !== gs.currentLot.id
    );

    if (gs.auctionMode === "choice") {
      let nextSelector =
        gs.lotSelector === "player1"
          ? "player2"
          : "player1";

      if (
        gs[`${nextSelector}_team`].length >= 4
      ) {
        nextSelector =
          nextSelector === "player1"
            ? "player2"
            : "player1";
      }

      return {
        pool: newPool,
        currentLot: null,
        phase: "auction_select",
        lotSelector: nextSelector,
        selectStartTime: Date.now(),
      };
    }

    return {
      pool: newPool,
      currentLot: newPool[0] || null,
      phase: "auction_bidding",
      turn:
        winner === "player1"
          ? "player2"
          : "player1",
      lotStartTime: newPool[0]
        ? Date.now()
        : 0,
    };
  };

  // ============================================================
  // RISOLUZIONE VINCITORE
  // ============================================================

  const resolveWin = async (winner, gs) => {
    const sog = gs.currentLot;

    const price = Math.max(
      1,
      gs.currentBid
    );

    const winnerTeamKey =
      `${winner}_team`;

    const winnerCreditsKey =
      `${winner}_credits`;

    const winnerName =
      winner === "player1"
        ? match.player1_name
        : match.player2_name;

    let newGs = {
      ...gs,

      [winnerTeamKey]: [
        ...gs[winnerTeamKey],
        sog,
      ],

      [winnerCreditsKey]:
        gs[winnerCreditsKey] - price,

      currentBid: 0,
      currentBidder: null,
      passCount: 0,
      passedThisLot: [],
      lotStartTime: 0,

      log_it: [
        ...gs.log_it,
        m_it.winsLot(
          winnerName,
          sog.nome,
          price
        ),
      ],

      log_en: [
        ...gs.log_en,
        m_en.winsLot(
          winnerName,
          sog.nome,
          price
        ),
      ],
    };

    const p1Done =
      newGs.player1_team.length >= 4;

    const p2Done =
      newGs.player2_team.length >= 4;

    if (p1Done && p2Done) {
      await finishAuction(newGs);
      return;
    }

    const remaining =
      newGs.pool.filter(
        (s) => s.id !== sog.id
      );

    if (remaining.length === 0) {
      await finishAuction(newGs);
      return;
    }

    const next =
      nextLotState(
        newGs,
        winner
      );

    newGs = {
      ...newGs,
      ...next,
    };

    const clearActions = {
      player1_actions: null,
      player2_actions: null,
    };

    await updateMatch(
      match.id,
      {
        game_state: newGs,
        ...clearActions,
      }
    );

    resolvingRef.current = false;
  };

  // ============================================================
  // FINE ASTA
  // ============================================================

  const finishAuction = async (gs) => {
    let p1Team = [
      ...gs.player1_team,
    ];

    let p2Team = [
      ...gs.player2_team,
    ];

    let pool = [
      ...gs.pool,
    ];

    while (
      p1Team.length < 4 &&
      pool.length > 0
    ) {
      p1Team.push(pool.shift());
    }

    while (
      p2Team.length < 4 &&
      pool.length > 0
    ) {
      p2Team.push(pool.shift());
    }

    const prematchGs = {
      ...gs,

      phase: "prematch",

      player1_starters: null,
      player2_starters: null,

      currentLot: null,
      currentBid: 0,
      currentBidder: null,

      pool: [],

      lotStartTime: 0,
      selectStartTime: 0,

      log_it: [
        ...gs.log_it,
        m_it.auctionEnds,
      ],

      log_en: [
        ...gs.log_en,
        m_en.auctionEnds,
      ],
    };

    await updateMatch(
      match.id,
      {
        game_state: prematchGs,
        player1_team: p1Team,
        player2_team: p2Team,
        player1_actions: null,
        player2_actions: null,
      }
    );

    resolvingRef.current = false;
  };

  // ============================================================
  // AZIONI PLAYER
  // ============================================================

  const submitBid = async (amount) => {
    const gs = match.game_state;

    if (
      gs.turn !== mySide ||
      !gs.currentLot
    ) {
      return;
    }

    const newBid =
      gs.currentBid + amount;

    if (
      newBid >
      gs[`${mySide}_credits`]
    ) {
      return;
    }

    await updateMatch(
      match.id,
      {
        [`${mySide}_actions`]: {
          type: "bid",
          amount,
        },
      }
    );
  };

  const submitPass = async () => {
    const gs = match.game_state;

    if (
      gs.turn !== mySide ||
      !gs.currentLot
    ) {
      return;
    }

    await updateMatch(
      match.id,
      {
        [`${mySide}_actions`]: {
          type: "pass",
        },
      }
    );
  };

  // ============================================================
  // FORFEIT
  // ============================================================

  const forfeitAuction = async (loser) => {
    const winner =
      loser === "player1"
        ? "player2"
        : "player1";

    const gs = match.game_state;

    await updateMatch(
      match.id,
      {
        game_state: {
          ...gs,
          phase: "done",
        },
        status: "done",
        winner,
        disconnect_winner: winner,
      }
    );

    await createMatchHistory({
      player1_id: match.player1_id,
      player2_id: match.player2_id,

      player1_name:
        match.player1_name,

      player2_name:
        match.player2_name,

      player1_team_ids:
        (gs?.player1_team || [])
          .map((s) => s.id),

      player2_team_ids:
        (gs?.player2_team || [])
          .map((s) => s.id),

      winner_id:
        winner === "player1"
          ? match.player1_id
          : match.player2_id,

      mode: match.mode,
    });

    resolvingRef.current = false;
  };

  // ============================================================
  // ABBANDONO
  // ============================================================

  const handleAbandon = async () => {
    const winner = oppSide;

    const gs = match.game_state;

    await updateMatch(
      match.id,
      {
        game_state: {
          ...gs,
          phase: "done",
        },
        status: "done",
        winner,
        disconnect_winner: winner,
      }
    );

    await createMatchHistory({
      player1_id: match.player1_id,
      player2_id: match.player2_id,

      player1_name:
        match.player1_name,

      player2_name:
        match.player2_name,

      player1_team_ids:
        (
          gs?.player1_team ||
          match.player1_team ||
          []
        ).map((s) => s.id),

      player2_team_ids:
        (
          gs?.player2_team ||
          match.player2_team ||
          []
        ).map((s) => s.id),

      winner_id:
        winner === "player1"
          ? match.player1_id
          : match.player2_id,

      mode: match.mode,
    });

    onAbandon();
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!match || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const gs = match.game_state;

  if (!gs) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const myCredits =
    gs[`${mySide}_credits`];

  const oppCredits =
    gs[`${oppSide}_credits`];

  const myTeam =
    gs[`${mySide}_team`];

  const oppTeam =
    gs[`${oppSide}_team`];

  const myDone =
    myTeam.length >= 4;

  const oppName =
    isHost
      ? match.player2_name
      : match.player1_name;

  const myName =
    isHost
      ? match.player1_name
      : (
          currentUser.full_name ||
          currentUser.email
        );

  const currentLot =
    gs.currentLot;

  const isMyTurn =
    gs.turn === mySide;

  const isSelector =
    gs.auctionMode === "choice" &&
    gs.lotSelector === mySide;

  const canPass =
    myDone ||
    gs.currentBid > 0;

  const timeLeft =
    gs.lotStartTime
      ? Math.max(
          0,
          AUCTION_SECONDS -
            Math.floor(
              (now - gs.lotStartTime) /
                1000
            )
        )
      : 0;

  return (
    <div className="min-h-screen px-4 py-6 max-w-3xl mx-auto bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      <AbandonButton
        onAbandon={handleAbandon}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-400">
          {t("auction.auctionMulti")}
        </div>

        <img
          src={LOGO}
          alt="Sognatori"
          className="h-10 object-contain"
        />

        <div className="text-[10px] text-slate-400">
          {modeLabel(match.mode, lang)}
        </div>
      </div>

      {/* ======================================================
          CREDITI & SQUADRE
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 mb-4">

        {/* MY PLAYER */}

        <div
          className={`rounded-xl p-3 border ${
            isMyTurn &&
            !myDone &&
            gs.phase === "auction_bidding"
              ? "bg-amber-500/10 border-amber-500/40"
              : "bg-emerald-500/10 border-emerald-500/30"
          }`}
        >
          <div className="text-xs font-semibold">
            {myName} (Tu)
          </div>

          <div className="text-lg font-bold">
            🪙 {myCredits}
          </div>

          <div className="text-[11px] text-slate-400">
            {myTeam.length}/4
          </div>

          <div className="flex gap-1 mt-1 flex-wrap">
            {myTeam.map((s) => (
              <div
                key={s.id}
                className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/40"
              >
                <img
                  src={s.img}
                  alt={s.nome}
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* OPPONENT */}

        <div
          className={`rounded-xl p-3 border text-right ${
            gs.turn === oppSide &&
            !(
              isHost
                ? gs.player2_team.length >= 4
                : gs.player1_team.length >= 4
            ) &&
            gs.phase === "auction_bidding"
              ? "bg-amber-500/10 border-amber-500/40"
              : "bg-rose-500/10 border-rose-500/30"
          }`}
        >
          <div className="text-xs font-semibold">
            {oppName}
          </div>

          <div className="text-lg font-bold">
            🪙 {oppCredits}
          </div>

          <div className="text-[11px] text-slate-400">
            {oppTeam.length}/4
          </div>

          <div className="flex gap-1 mt-1 justify-end flex-wrap">
            {oppTeam.map((s) => (
              <div
                key={s.id}
                className="w-8 h-8 rounded-lg overflow-hidden border border-rose-500/40"
              >
                <img
                  src={s.img}
                  alt={s.nome}
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================
          FASI DELL'ASTA
      ====================================================== */}

      <AnimatePresence mode="wait">

        {/* ====================================================
            AUCTION SETUP
        ==================================================== */}

        {gs.phase === "auction_setup" && (
          <motion.div
            key="setup"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            className="max-w-sm mx-auto text-center"
          >
            {isHost ? (
              <>
                <div className="flex justify-end mb-2">
                  <span
                    className={`text-xs font-bold ${
                      Math.max(
                        0,
                        AUCTION_SECONDS -
                          Math.floor(
                            (
                              now -
                              (
                                gs.setupStartTime ||
                                now
                              )
                            ) / 1000
                          )
                      ) <= 10
                        ? "text-red-400"
                        : "text-amber-400"
                    }`}
                  >
                    ⏱{" "}
                    {Math.max(
                      0,
                      AUCTION_SECONDS -
                        Math.floor(
                          (
                            now -
                            (
                              gs.setupStartTime ||
                              now
                            )
                          ) / 1000
                        )
                    )}
                    s
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2">
                  {t("auction.modeSetup")}
                </h3>

                <p className="text-sm text-slate-400 mb-4">
                  {t("auction.modeSetupDesc")}
                </p>

                <div className="grid grid-cols-1 gap-3">

                  <button
                    onClick={() =>
                      startAuctionWithMode(
                        "random"
                      )
                    }
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 hover:border-purple-500/50 transition text-left"
                  >
                    <div className="font-bold">
                      🎲{" "}
                      {t("battle.modeRandom")}
                    </div>

                    <div className="text-xs text-slate-400 mt-1">
                      {t(
                        "battle.modeRandomDesc"
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      startAuctionWithMode(
                        "choice"
                      )
                    }
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50 transition text-left"
                  >
                    <div className="font-bold">
                      🎯{" "}
                      {t("battle.modeChoice")}
                    </div>

                    <div className="text-xs text-slate-400 mt-1">
                      {t(
                        "battle.modeChoiceDesc"
                      )}
                    </div>
                  </button>

                </div>
              </>
            ) : (
              <div className="py-8">
                <div className="text-amber-400 text-lg mb-2">
                  {t("auction.selectWaiting")}
                </div>

                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              </div>
            )}
          </motion.div>
        )}

        {/* ====================================================
            AUCTION SELECT
        ==================================================== */}

        {gs.phase === "auction_select" && (
          <motion.div
            key="select"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
          >
            <div className="flex justify-between items-center mb-3">

              <div className="text-sm font-bold text-amber-400">
                {gs.lotSelector === mySide
                  ? `🎯 ${t(
                      "auction.yourTurn"
                    )}`
                  : `${t(
                      "auction.waitingSelection"
                    )} ${
                      gs.lotSelector === "player1"
                        ? match.player1_name
                        : match.player2_name
                    }...`}
              </div>

              {gs.selectStartTime && (
                <span
                  className={`text-xs font-bold ${
                    Math.max(
                      0,
                      AUCTION_SECONDS -
                        Math.floor(
                          (
                            now -
                            gs.selectStartTime
                          ) / 1000
                        )
                    ) <= 10
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  ⏱{" "}
                  {Math.max(
                    0,
                    AUCTION_SECONDS -
                      Math.floor(
                        (
                          now -
                          gs.selectStartTime
                        ) / 1000
                      )
                  )}
                  s
                </span>
              )}
            </div>

            {gs.lotSelector === mySide ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto p-1">
                {gs.pool.map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      selectLot(s.id)
                    }
                    className="rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 transition p-2 flex flex-col items-center gap-1"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden">
                      <img
                        src={s.img}
                        alt={s.nome}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="text-[10px] font-semibold text-center leading-tight">
                      {s.nome}
                    </div>

                    <FactionBadge
                      type={s.tipo}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        )}

        {/* ====================================================
            AUCTION BIDDING
        ==================================================== */}

        {gs.phase === "auction_bidding" &&
          currentLot && (
            <motion.div
              key={
                currentLot.id +
                "-" +
                gs.lotStartTime
              }
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -20,
              }}
              className="max-w-sm mx-auto"
            >

              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-4 flex gap-4 items-center">

                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                  <img
                    src={currentLot.img}
                    alt={currentLot.nome}
                    className="w-full h-full"
                  />
                </div>

                <div className="flex-1">

                  <div className="font-bold text-lg">
                    {currentLot.nome}
                  </div>

                  <FactionBadge
                    type={currentLot.tipo}
                  />

                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                    {[
                      [
                        "ATT",
                        currentLot.att,
                      ],
                      [
                        "DIF",
                        currentLot.dif,
                      ],
                      [
                        "VEL",
                        currentLot.vel,
                      ],
                    ].map(([l, v]) => (
                      <div
                        key={l}
                        className="bg-white/5 rounded px-1 py-0.5 text-center"
                      >
                        <div className="text-slate-400">
                          {l}
                        </div>

                        <div className="font-bold">
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-amber-400 mt-1 font-semibold">
                    {getAbilityName(
                      currentLot,
                      lang
                    )}
                  </div>

                  <div className="text-[9px] text-slate-300 mt-0.5 leading-tight">
                    {getAbilityDesc(
                      currentLot,
                      lang
                    )}
                  </div>

                </div>
              </div>

              {/* OFFERTA */}

              <div className="mt-3 text-center">

                <div className="text-xs text-slate-400">
                  {t(
                    "auction.currentBid"
                  )}
                </div>

                <div className="text-3xl font-bold text-amber-400">
                  🪙 {gs.currentBid}
                </div>

                <div className="text-xs text-slate-400">
                  {gs.currentBidder ===
                  "player1"
                    ? `${t(
                        "auction.bidderP1"
                      )} ${
                        match.player1_name
                      }`
                    : gs.currentBidder ===
                      "player2"
                    ? `${t(
                        "auction.bidderP1"
                      )} ${
                        match.player2_name
                      }`
                    : t(
                        "auction.noBid"
                      )}
                </div>

              </div>

              {/* TIMER */}

              <div className="mt-2">

                <div className="flex justify-between items-center mb-0.5">

                  <span className="text-[9px] text-slate-400">
                    {t(
                      "auction.timeLeft"
                    )}
                  </span>

                  <span
                    className={`text-[10px] font-bold ${
                      timeLeft <= 10
                        ? "text-red-400"
                        : "text-amber-400"
                    }`}
                  >
                    ⏱ {timeLeft}s
                  </span>

                </div>

                <TimerBar
                  seconds={timeLeft}
                  total={
                    AUCTION_SECONDS
                  }
                />

              </div>

              {/* CONTROLLI */}

              {isMyTurn && !myDone ? (
                <div
                  className={`mt-3 grid gap-2 ${
                    canPass
                      ? "grid-cols-4"
                      : "grid-cols-3"
                  }`}
                >

                  {BID_OPTIONS.map(
                    (amt) => (
                      <button
                        key={amt}
                        onClick={() =>
                          submitBid(amt)
                        }
                        disabled={
                          gs.currentBid +
                            amt >
                          myCredits
                        }
                        className="py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm disabled:opacity-30"
                      >
                        +{amt}
                      </button>
                    )
                  )}

                  {canPass && (
                    <button
                      onClick={
                        submitPass
                      }
                      className="py-2.5 rounded-lg bg-white/10 font-bold text-sm hover:bg-white/20"
                    >
                      {t(
                        "auction.pass"
                      )}
                    </button>
                  )}

                  {!canPass && (
                    <div className="text-[10px] text-amber-400/70 flex items-center justify-center text-center leading-tight">
                      {t(
                        "auction.mustBid"
                      )}
                    </div>
                  )}
                </div>
              ) : myDone ? (
                <div className="mt-3 text-center">
                  <button
                    onClick={
                      submitPass
                    }
                    className="px-6 py-2 rounded-lg bg-white/10 font-bold text-sm"
                  >
                    {t(
                      "auction.teamComplete"
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-3 text-center text-sm text-rose-400 animate-pulse">
                  {m.waitingFor}{" "}
                  {gs.turn === "player1"
                    ? match.player1_name
                    : match.player2_name}
                  ...
                </div>
              )}

            </motion.div>
          )}
      </AnimatePresence>

      {/* ======================================================
          LOG
      ====================================================== */}

      <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
        {(lang === "en"
          ? gs.log_en
          : gs.log_it || []
        )
          .slice(-10)
          .reverse()
          .map((l, i) => (
            <div
              key={i}
              className="text-[11px] text-slate-300 bg-white/5 rounded-md px-2 py-1"
            >
              {l}
            </div>
          ))}
      </div>
    </div>
  );
} 