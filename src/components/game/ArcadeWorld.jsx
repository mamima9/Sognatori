import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const TILE = 48;

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
  "#..#.....M.........#",
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

const WIZARD = {
  x: 10,
  y: 9,
};

export default function ArcadeWorld({ onStartAuction, onBack }) {
  const [player, setPlayer] = useState(PLAYER_START);
  const [nearWizard, setNearWizard] = useState(false);

  const isWalkable = (x, y) => {
    if (!MAP[y] || !MAP[y][x]) return false;
    return MAP[y][x] !== "#";
  };

  const movePlayer = (dx, dy) => {
    setPlayer((current) => {
      const nextX = current.x + dx;
      const nextY = current.y + dy;

      if (!isWalkable(nextX, nextY)) {
        return current;
      }

      return {
        x: nextX,
        y: nextY,
      };
    });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (
        key === "arrowup" ||
        key === "w"
      ) {
        event.preventDefault();
        movePlayer(0, -1);
      }

      if (
        key === "arrowdown" ||
        key === "s"
      ) {
        event.preventDefault();
        movePlayer(0, 1);
      }

      if (
        key === "arrowleft" ||
        key === "a"
      ) {
        event.preventDefault();
        movePlayer(-1, 0);
      }

      if (
        key === "arrowright" ||
        key === "d"
      ) {
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
  }, []);

  useEffect(() => {
    const distance =
      Math.abs(player.x - WIZARD.x) +
      Math.abs(player.y - WIZARD.y);

    setNearWizard(distance <= 1);
  }, [player]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">

      <div className="w-full max-w-5xl">

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

        <div
          className="relative mx-auto overflow-hidden rounded-3xl border border-amber-500/30 shadow-2xl"
          style={{
            width: MAP[0].length * TILE,
            maxWidth: "100%",
            aspectRatio: `${MAP[0].length}/${MAP.length}`,
            background:
              "linear-gradient(135deg, #16351f, #244d2c)",
          }}
        >

          <div
            className="absolute inset-0"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${MAP[0].length}, 1fr)`,
              gridTemplateRows: `repeat(${MAP.length}, 1fr)`,
            }}
          >

            {MAP.map((row, y) =>
              row.split("").map((cell, x) => {

                const isWall =
                  cell === "#";

                return (
                  <div
                    key={`${x}-${y}`}
                    className={
                      isWall
                        ? "bg-emerald-950 border border-emerald-900"
                        : "bg-emerald-800/70 border border-emerald-700/20"
                    }
                  >
                    {!isWall && (
                      <div className="w-full h-full flex items-center justify-center text-[10px] opacity-30">
                        {Math.random() > 0.7
                          ? "🌿"
                          : ""}
                      </div>
                    )}
                  </div>
                );
              })
            )}

          </div>

          {/* MAGO */}

          <motion.div
            className="absolute flex flex-col items-center"
            animate={{
              x: WIZARD.x * (100 / MAP[0].length) + "%",
              y: WIZARD.y * (100 / MAP.length) + "%",
            }}
            style={{
              width: `${100 / MAP[0].length}%`,
              height: `${100 / MAP.length}%`,
            }}
          >
            <div className="text-3xl drop-shadow-lg">
              🧙
            </div>

            <div className="text-[8px] font-bold text-amber-300 whitespace-nowrap">
              MAGO
            </div>
          </motion.div>

          {/* PLAYER */}

          <motion.div
            className="absolute flex items-center justify-center"
            animate={{
              x: player.x * (100 / MAP[0].length) + "%",
              y: player.y * (100 / MAP.length) + "%",
            }}
            transition={{
              duration: 0.08,
            }}
            style={{
              width: `${100 / MAP[0].length}%`,
              height: `${100 / MAP.length}%`,
            }}
          >
            <div className="text-3xl drop-shadow-xl">
              🧙‍♂️
            </div>
          </motion.div>

        </div>

        <div className="text-center mt-4 text-xs text-slate-400">
          Usa <b>WASD</b> o le <b>frecce</b> per muoverti
        </div>

        {nearWizard && (
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-5 mx-auto max-w-md rounded-2xl bg-slate-900 border border-amber-500/40 p-5 text-center shadow-2xl"
          >

            <div className="text-4xl mb-2">
              🧙
            </div>

            <div className="text-amber-400 font-black uppercase tracking-widest text-xs mb-2">
              Mago dei Sognatori
            </div>

            <p className="text-sm text-slate-300 mb-4">
              “Ogni battaglia inizia con una
              scelta. Sei pronto ad affidarti
              al destino?”
            </p>

            <button
              onClick={onStartAuction}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-black hover:brightness-110 transition"
            >
              🔮 INIZIA L'ASTA
            </button>

          </motion.div>
        )}

      </div>

    </div>
  );
}