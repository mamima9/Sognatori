import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MAP = [
  "####################",
  "#..................#",
  "#....###...........#",
  "#....#.#......###..#",
  "#....#.#........#..#",
  "#......#........#..#",
  "#.................##",
  "#..###............##",
  "#..#...............#",
  "#..#.....N.........#",
  "#..#...............#",
  "#..................#",
  "#......####........#",
  "#..................#",
  "####################",
];

const PLAYER_START = {
  x: 2,
  y: 2,
};

const NPC1 = {
  x: 10,
  y: 9,
};

export default function ArcadeWorld({
  stage = 1,
  onStartAuction,
  onBack,
}) {
  const [player, setPlayer] =
    useState(PLAYER_START);

  const [nearNpc, setNearNpc] =
    useState(false);

  const [talking, setTalking] =
    useState(false);

  const isWalkable = (x, y) => {
    if (!MAP[y] || !MAP[y][x]) return false;

    return MAP[y][x] !== "#";
  };

  const checkNpcDistance = (x, y) => {
    const distance =
      Math.abs(x - NPC1.x) +
      Math.abs(y - NPC1.y);

    return distance <= 1;
  };

  const movePlayer = (dx, dy) => {
    setPlayer((current) => {
      const nextX = current.x + dx;
      const nextY = current.y + dy;

      if (!isWalkable(nextX, nextY)) {
        return current;
      }

      setNearNpc(
        checkNpcDistance(nextX, nextY)
      );

      return {
        x: nextX,
        y: nextY,
      };
    });
  };

  const talkToNpc = () => {
    if (nearNpc) {
      setTalking(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (key === "e") {
        talkToNpc();
        return;
      }

      if (key === "arrowup" || key === "w") {
        event.preventDefault();
        movePlayer(0, -1);
      }

      if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        movePlayer(0, 1);
      }

      if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        movePlayer(-1, 0);
      }

      if (key === "arrowright" || key === "d") {
        event.preventDefault();
        movePlayer(1, 0);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [nearNpc]);

  const tileWidth = 100 / MAP[0].length;
  const tileHeight = 100 / MAP.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white flex flex-col items-center justify-center p-4">

      <div className="w-full max-w-5xl">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-4">

          <div>
            <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              ARCADE
            </div>

            <h1 className="text-2xl font-black">
              La Foresta dei Sognatori
            </h1>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
          >
            ← Indietro
          </button>

        </div>

        {/* MAPPA */}

        <div
          className="relative mx-auto overflow-hidden rounded-3xl border border-amber-500/30 shadow-2xl"
          style={{
            width: "100%",
            maxWidth: "960px",
            aspectRatio: "20 / 15",
            background:
              "linear-gradient(135deg, #16351f, #244d2c)",
          }}
        >

          {/* TILES */}

          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns:
                `repeat(${MAP[0].length}, 1fr)`,
              gridTemplateRows:
                `repeat(${MAP.length}, 1fr)`,
            }}
          >
            {MAP.map((row, y) =>
              row.split("").map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={
                    cell === "#"
                      ? "bg-emerald-950 border border-emerald-900"
                      : "bg-emerald-800/70 border border-emerald-700/20"
                  }
                >
                  {cell !== "#" &&
                    Math.random() > 0.82 && (
                      <div className="w-full h-full flex items-center justify-center text-xs opacity-40">
                        🌿
                      </div>
                    )}
                </div>
              ))
            )}
          </div>

          {/* NPC1 */}

          <div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
              left: `${NPC1.x * tileWidth}%`,
              top: `${NPC1.y * tileHeight}%`,
              width: `${tileWidth}%`,
              height: `${tileHeight}%`,
            }}
          >
            <div className="text-3xl drop-shadow-xl">
              🧙
            </div>

            <div className="text-[9px] font-black text-amber-300">
              NPC1
            </div>
          </div>

          {/* YOU */}

          <motion.div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            animate={{
              left: `${player.x * tileWidth}%`,
              top: `${player.y * tileHeight}%`,
            }}
            transition={{
              duration: 0.08,
            }}
            style={{
              width: `${tileWidth}%`,
              height: `${tileHeight}%`,
            }}
          >
            <div className="text-3xl drop-shadow-xl">
              🧙‍♂️
            </div>

            <div className="text-[9px] font-black text-white">
              YOU
            </div>
          </motion.div>

        </div>

        {/* CONTROLLI DESKTOP */}

        <div className="hidden sm:block text-center mt-4 text-xs text-slate-400">
          <b>WASD</b> / <b>FRECCE</b> per muoverti
          {nearNpc && (
            <span className="ml-3 text-amber-400 font-bold">
              • Premi E per parlare
            </span>
          )}
        </div>

        {/* PAD MOBILE */}

        <div className="sm:hidden flex justify-center mt-5">

          <div className="grid grid-cols-3 gap-2">

            <div />

            <button
              onClick={() =>
                movePlayer(0, -1)
              }
              className="w-16 h-14 rounded-xl bg-white/10 border border-white/10 text-2xl active:scale-90"
            >
              ▲
            </button>

            <div />

            <button
              onClick={() =>
                movePlayer(-1, 0)
              }
              className="w-16 h-14 rounded-xl bg-white/10 border border-white/10 text-2xl active:scale-90"
            >
              ◀
            </button>

            <button
              onClick={() =>
                movePlayer(0, 1)
              }
              className="w-16 h-14 rounded-xl bg-white/10 border border-white/10 text-2xl active:scale-90"
            >
              ▼
            </button>

            <button
              onClick={() =>
                movePlayer(1, 0)
              }
              className="w-16 h-14 rounded-xl bg-white/10 border border-white/10 text-2xl active:scale-90"
            >
              ▶
            </button>

          </div>

        </div>

        {/* PARLA */}

        <AnimatePresence>

          {nearNpc && !talking && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 10,
              }}
              className="mt-5 flex justify-center"
            >

              <button
                onClick={talkToNpc}
                className="px-8 py-3 rounded-full bg-amber-500 text-slate-950 font-black shadow-lg hover:brightness-110 active:scale-95 transition"
              >
                💬 PARLA CON NPC1
                <span className="ml-2 text-xs opacity-70">
                  [E]
                </span>
              </button>

            </motion.div>
          )}

        </AnimatePresence>

        {/* DIALOGO */}

        <AnimatePresence>

          {talking && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              className="mt-5 mx-auto max-w-md rounded-2xl bg-slate-900 border border-amber-500/40 p-5 text-center shadow-2xl"
            >

              <div className="text-4xl mb-2">
                🧙
              </div>

              <div className="text-amber-400 font-black uppercase tracking-widest text-xs mb-2">
                NPC1
              </div>

              <p className="text-sm text-slate-300 mb-5">
                “Ogni battaglia inizia con una
                scelta... Vuoi affidarti al
                destino?”
              </p>

              <button
                onClick={() => onStartAuction(stage)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-black hover:brightness-110 transition"
              >
                🔮 INIZIA L'ASTA
              </button>

            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </div>
  );
}