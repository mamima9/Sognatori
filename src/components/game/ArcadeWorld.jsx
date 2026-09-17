import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MAPS = {
  1: [
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
  ],

  2: [
    "####################",
    "#....##............#",
    "#....##....~~~~....#",
    "#...........##.....#",
    "#..####.....~~.....#",
    "#..#...............#",
    "#..#....######.....#",
    "#.......#..........#",
    "#.......#....###...#",
    "#...........N......#",
    "#.....###..........#",
    "#.....###....####..#",
    "#..................#",
    "#.............##...#",
    "####################",
  ],

  3: [
    "####################",
    "#~~~~..............#",
    "#~~~~....####......#",
    "#...........#......#",
    "#..####.....#......#",
    "#..#...............#",
    "#..#.....~~~~......#",
    "#........~~~~......#",
    "#.............###..#",
    "#..........N.......#",
    "#....###...........#",
    "#....###.....~~~~..#",
    "#...........~~~~...#",
    "#..................#",
    "####################",
  ],

  4: [
    "####################",
    "#..................#",
    "#..####.....###....#",
    "#..#........#......#",
    "#..#..####..#......#",
    "#...........#......#",
    "#.....###..........#",
    "#.....#............#",
    "#.....#....####....#",
    "#..........N.......#",
    "#..###.............#",
    "#..#......###......#",
    "#..#...............#",
    "#..................#",
    "####################",
  ],

  5: [
    "####################",
    "#...........##.....#",
    "#..###......##.....#",
    "#..#...............#",
    "#..#....####.......#",
    "#........#.........#",
    "#........#....###..#",
    "#..####........#...#",
    "#...............#..#",
    "#..........N.......#",
    "#.....###..........#",
    "#.....#............#",
    "#.....#....####....#",
    "#..................#",
    "####################",
  ],

  6: [
    "####################",
    "#..##..............#",
    "#..##....######....#",
    "#........#.........#",
    "#....###.#....###..#",
    "#....#........#....#",
    "#....#....##..#....#",
    "#.........##.......#",
    "#..###........###..#",
    "#..........N.......#",
    "#..###.............#",
    "#..#......#####....#",
    "#..#...............#",
    "#..................#",
    "####################",
  ],

  7: [
    "####################",
    "#..................#",
    "#....#####.........#",
    "#....#...#.........#",
    "#....#...#.........#",
    "#....#...#####.....#",
    "#....#.............#",
    "#....#####.........#",
    "#..................#",
    "#.........N........#",
    "#..................#",
    "#......####........#",
    "#..................#",
    "#..................#",
    "####################",
  ],

  8: [
    "####################",
    "#....####..........#",
    "#....#..#..........#",
    "#....#..#....###...#",
    "#....####....#.....#",
    "#..........###.....#",
    "#..................#",
    "#..######..........#",
    "#..#....#..........#",
    "#..#....#..N.......#",
    "#..######..........#",
    "#.........####.....#",
    "#.........#........#",
    "#..................#",
    "####################",
  ],

  9: [
    "####################",
    "#..................#",
    "#..###.......###...#",
    "#..#...........#...#",
    "#..#...#####...#...#",
    "#......#...#.......#",
    "#......#...#.......#",
    "#..###.#####...###.#",
    "#..#...........#...#",
    "#..#......N....#...#",
    "#.................##",
    "#....####..........#",
    "#....#.............#",
    "#..................#",
    "####################",
  ],

    10: [
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
    "....................",
  ],



};

const PLAYER_START = {
  x: 2,
  y: 2,
};

const NPC_POSITION = {
  x: 10,
  y: 9,
};

const STAGE_NPCS = {
  1: {
    name: "NPC 1",
    emoji: "🌳",
    world: "La Foresta dei Sognatori",
    dialogue:
      "Benvenuto nella Foresta dei Sognatori. Qui ogni scelta può cambiare il tuo cammino. Sei pronto/a a mettere alla prova la tua natura?",
  },

  2: {
    name: "NPC 2",
    emoji: "👹",
    world: "Il Vulcano dei Demoni",
    dialogue:
      "Qui dentro non basta essere forte. Devi avere il coraggio di cambiare quando le cose si fanno difficili. Vediamo quanto vali.",
  },

  3: {
    name: "NPC 3",
    emoji: "🌊",
    world: "Splash",
    dialogue:
      "L'acqua cambia continuamente direzione... proprio come un'asta. Non farti sorprendere e pensa bene alla tua prossima mossa!",
  },

  4: {
    name: "NPC 4",
    emoji: "🍬",
    world: "Sniakerville",
    dialogue:
      "Sembra tutto dolce e tranquillo, vero? Non fidarti delle apparenze. Le cose più dolci posso essere le più pericolose.",
  },

  5: {
    name: "NPC 5",
    emoji: "☁️",
    world: "Sulle nuvole",
    dialogue:
      "Da quassù tutto sembra più semplice. Quanto riuscirai a tenere la testa tra le nuvole senza impazzire?",
  },

  6: {
    name: "NPC 6",
    emoji: "🤖",
    world: "Bug City",
    dialogue:
      "Sistema attivo. Analisi dell'avversario completata. Errore previsto: sottovalutare l'asta. Vittoria assicurata",
  },

  7: {
    name: "NPC 7",
    emoji: "🏠",
    world: "Una piccola casa",
    dialogue:
      "Ti sei lasciato/a ingannare da questa casetta. Qui si gioca con una strategia diversa...usare i migliori, tranquillo/a avrai paura fino a quando finalmente avrai perso",
  },

  8: {
    name: "NPC 8",
    emoji: "🧙",
    world: "Accademia dei Sognatori",
    dialogue:
      "Benvenuto all'Accademia , hai fatto un bel viaggio. Qui non si impara soltanto a combattere: si impara a trascendere la tua realtà. Ho fatto il tuo stesso viaggio, tempo fa",
  },

  9: {
    name: "NPC 9",
    emoji: "👑",
    world: "Mimmiland",
    dialogue:
      "Dimostrami di essere davvero degno di entrare nel cuore di Mimmiland. Battimi ed entra davvero a far parte del mondo dei Sognatori",
  },
   10: {
    name: "NPC 10",
    emoji: "👑",
    world: "Dream Arena",
    dialogue:
      "Benvenuto nella Dream Arena. Questo è il cuore degli Stage dei Sognatori. Qui non esistono sentieri: esiste solo la battaglia.",
  }, 
};

function DreamArenaStage10({
  player,
  npc,
  npcName,
  npcImage,
  portrait,
  nearNpc,
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#120d1c]">

      {/* SKY / BACKGROUND */}

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #24163d 0%, #5b315f 48%, #120d1c 100%)",
        }}
      />

      {/* LUNA */}

      <div
        className="absolute w-28 h-28 rounded-full bg-amber-100/80 blur-[1px]"
        style={{
          right: "12%",
          top: "9%",
          boxShadow: "0 0 45px rgba(255,220,150,.35)",
        }}
      />

      {/* STELLE */}

      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-[10%] top-[15%] text-amber-200">✦</div>
        <div className="absolute left-[24%] top-[8%] text-amber-100 text-xs">✦</div>
        <div className="absolute left-[72%] top-[20%] text-amber-200">✦</div>
        <div className="absolute left-[84%] top-[12%] text-amber-100 text-xs">✦</div>
        <div className="absolute left-[62%] top-[8%] text-amber-100 text-xs">✦</div>
      </div>

      {/* ISOLE / ROCCE SULLO SFONDO */}

      <div className="absolute left-[4%] bottom-[19%] w-28 h-12 bg-[#24182d] rotate-[-5deg] rounded-[45%]" />
      <div className="absolute right-[4%] bottom-[22%] w-36 h-14 bg-[#24182d] rotate-[5deg] rounded-[45%]" />

      {/* ACQUA SOTTO L'ARENA */}

      <div
        className="absolute left-[5%] right-[5%] bottom-[0%] h-[38%] opacity-90"
        style={{
          background:
            "repeating-linear-gradient(165deg, #123c55 0px, #123c55 12px, #195673 13px, #195673 22px)",
          clipPath:
            "polygon(8% 20%, 92% 20%, 100% 100%, 0% 100%)",
        }}
      />

      {/* CASCATE LATERALI */}

      <div
        className="absolute left-[13%] bottom-[5%] w-8 h-32 opacity-70"
        style={{
          background:
            "linear-gradient(90deg, transparent, #6dc7dc, transparent)",
          clipPath:
            "polygon(25% 0, 75% 0, 100% 100%, 0 100%)",
        }}
      />

      <div
        className="absolute right-[13%] bottom-[5%] w-8 h-32 opacity-70"
        style={{
          background:
            "linear-gradient(90deg, transparent, #6dc7dc, transparent)",
          clipPath:
            "polygon(25% 0, 75% 0, 100% 100%, 0 100%)",
        }}
      />

      {/* ARENA OMBRA */}

      <div
        className="absolute left-1/2 top-[52%] w-[72%] h-[48%]"
        style={{
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,.45)",
          filter: "blur(18px)",
          clipPath:
            "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0 50%)",
        }}
      />

      {/* BASE DELL'ARENA */}

      <div
        className="absolute left-1/2 top-[50%] w-[70%] h-[45%]"
        style={{
          transform: "translate(-50%, -50%)",
          background:
            "linear-gradient(145deg, #51404d 0%, #302734 55%, #1d1721 100%)",
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          border: "4px solid #8e714c",
        }}
      />

      {/* BORDO ORO */}

      <div
        className="absolute left-1/2 top-[50%] w-[67%] h-[41%] pointer-events-none"
        style={{
          transform: "translate(-50%, -50%)",
          background:
            "linear-gradient(145deg, #c9a55a, #72562d)",
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        }}
      />

      {/* PAVIMENTO */}

      <div
        className="absolute left-1/2 top-[50%] w-[62%] h-[37%]"
        style={{
          transform: "translate(-50%, -50%)",
          background:
            "repeating-linear-gradient(45deg, #403541 0px, #403541 18px, #493c49 19px, #493c49 36px)",
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        }}
      />

      {/* ESAGONO CENTRALE */}

      <div
        className="absolute left-1/2 top-[50%] w-[27%] h-[34%]"
        style={{
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, #8b6b45 0%, #60482f 60%, #3d2d23 100%)",
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          boxShadow:
            "inset 0 0 0 5px rgba(212,175,55,.55)",
        }}
      />

      {/* SIMBOLO SOGNATORI */}

      <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 text-5xl opacity-20">
        ✦
      </div>

      {/* TORRI */}

      <div className="absolute left-[15%] top-[37%] text-5xl drop-shadow-2xl">
        🗿
      </div>

      <div className="absolute right-[15%] top-[37%] text-5xl drop-shadow-2xl">
        🗿
      </div>

      <div className="absolute left-[24%] bottom-[21%] text-4xl drop-shadow-2xl">
        🏛️
      </div>

      <div className="absolute right-[24%] bottom-[21%] text-4xl drop-shadow-2xl">
        🏛️
      </div>

      {/* BANDIERE */}

      <div className="absolute left-[30%] top-[26%] text-3xl">
        🚩
      </div>

      <div className="absolute right-[30%] top-[26%] text-3xl">
        🚩
      </div>

      {/* NPC */}

      <div
        className="absolute flex flex-col items-center"
        style={{
          left: "50%",
          top: "39%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-12 h-12 drop-shadow-2xl">

          {npcImage ? (
            <img
              src={`/images/${npcImage}`}
              alt={npcName}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-4xl">
              {npc.emoji}
            </span>
          )}

        </div>

        <div className="text-[10px] font-black text-amber-300 whitespace-nowrap">
          {npcName}
        </div>
      </div>

      {/* PLAYER */}

      <motion.div
        className="absolute flex flex-col items-center"
        animate={{
          left:
            player.x < 10
              ? `${25 + player.x * 2}%`
              : `${25 + player.x * 2}%`,
          top:
            player.y < 7
              ? `${32 + player.y * 2.2}%`
              : `${32 + player.y * 2.2}%`,
        }}
        transition={{
          duration: 0.12,
        }}
      >
        <div className="w-12 h-12 drop-shadow-2xl">

          {portrait ? (
            <img
              src={`/images/${portrait}`}
              alt="Ritratto giocatore"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-4xl">
              🧙‍♂️
            </span>
          )}

        </div>

        <div className="text-[10px] font-black text-white">
          YOU
        </div>
      </motion.div>

      {/* INDICATORE NPC */}

      {nearNpc && (
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 text-amber-300 text-xs font-black animate-bounce">
          ▼
        </div>
      )}

    </div>
  );
}
export default function ArcadeWorld({
  stage = 1,
  portrait,
  npcNames,
  npcImages,
  onStartAuction,
  onBack,
}) {
   const MAP = MAPS[stage] || MAPS[1];
  const isStage10 = stage === 10;

  const npc = STAGE_NPCS[stage] || STAGE_NPCS[1]; 

  const npcName = npcNames?.[stage] || npc.name;
  const npcImage = npcImages?.[stage];

  const [player, setPlayer] = useState(PLAYER_START);
  const [nearNpc, setNearNpc] = useState(false);
  const [talking, setTalking] = useState(false);

  const isWalkable = (x, y) => {
    if (!MAP[y] || !MAP[y][x]) return false;

    return MAP[y][x] !== "#";
  };

  const checkNpcDistance = (x, y) => {
    const distance =
      Math.abs(x - NPC_POSITION.x) +
      Math.abs(y - NPC_POSITION.y);

    return distance <= 1;
  };

  const movePlayer = (dx, dy) => {
    setPlayer((current) => {
      const nextX = current.x + dx;
      const nextY = current.y + dy;

      if (!isWalkable(nextX, nextY)) {
        return current;
      }

      setNearNpc(checkNpcDistance(nextX, nextY));

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

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
              {npc.world}
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
              stage === 1
                ? "linear-gradient(135deg, #16351f, #244d2c)"
                : stage === 2
                ? "linear-gradient(135deg, #4a160f, #8b2f16)"
                : stage === 3
                ? "linear-gradient(135deg, #0b3045, #176b87)"
                : stage === 4
                ? "linear-gradient(135deg, #5a246b, #d66bba)"
                : stage === 5
                ? "linear-gradient(135deg, #667085, #dbeafe)"
                : stage === 6
                ? "linear-gradient(135deg, #20242b, #475569)"
                : stage === 7
                ? "linear-gradient(135deg, #4a3020, #8b6b4a)"
                : stage === 8
                ? "linear-gradient(135deg, #252052, #5546a8)"
                : "linear-gradient(135deg, #3b174f, #8b2f8f)",
          }}
        >

         {isStage10 ? (
  <DreamArenaStage10
    player={player}
    npc={npc}
    npcName={npcName}
    npcImage={npcImage}
    portrait={portrait}
    nearNpc={nearNpc}
  />
) : (
  <>
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
                    cell === "~"
                      ? "bg-gradient-to-br from-yellow-400 via-orange-600 to-red-800 border border-orange-500/30 animate-pulse"
                      : cell === "#"
                      ? stage === 1
                        ? "bg-emerald-950 border border-emerald-900"
                        : stage === 2
                        ? "bg-stone-950 border border-stone-800"
                        : stage === 3
                        ? "bg-cyan-950 border border-cyan-900"
                        : stage === 4
                        ? "bg-fuchsia-950 border border-fuchsia-900"
                        : stage === 5
                        ? "bg-sky-950 border border-sky-900"
                        : stage === 6
                        ? "bg-slate-950 border border-slate-800"
                        : stage === 7
                        ? "bg-amber-950 border border-amber-900"
                        : stage === 8
                        ? "bg-indigo-950 border border-indigo-900"
                        : "bg-purple-950 border border-purple-900"
                      : stage === 1
                      ? "bg-emerald-800/70 border border-emerald-700/20"
                      : stage === 2
                      ? "bg-gradient-to-br from-stone-800 via-stone-900 to-zinc-950 border border-stone-700/30"
                      : stage === 3
                      ? "bg-cyan-800/70 border border-cyan-700/20"
                      : stage === 4
                      ? "bg-fuchsia-800/70 border border-fuchsia-700/20"
                      : stage === 5
                      ? "bg-sky-800/70 border border-sky-700/20"
                      : stage === 6
                      ? "bg-slate-700/70 border border-slate-600/20"
                      : stage === 7
                      ? "bg-amber-800/70 border border-amber-700/20"
                      : stage === 8
                      ? "bg-indigo-800/70 border border-indigo-700/20"
                      : "bg-purple-800/70 border border-purple-700/20"
                  }
                >

                  {cell !== "#" &&
                    cell !== "~" &&
                    Math.random() > 0.82 && (
                      <div className="w-full h-full flex items-center justify-center text-xs opacity-70">
                        {stage === 1
                          ? "🌿"
                          : stage === 2
                          ? "🪨"
                          : ""}
                      </div>
                    )}

                </div>
              ))
            )}

          </div>


          <div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
              left: `${NPC_POSITION.x * tileWidth}%`,
              top: `${NPC_POSITION.y * tileHeight}%`,
              width: `${tileWidth}%`,
              height: `${tileHeight}%`,
            }}
          >

            <div className="w-10 h-10 drop-shadow-xl">

              {npcImage ? (
                <img
                  src={`/images/${npcImage}`}
                  alt={npcName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-3xl">
                  {npc.emoji}
                </span>
              )}

            </div>

            <div className="text-[9px] font-black text-amber-300">
              {npcName}
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

            <div className="w-10 h-10 drop-shadow-xl">

              {portrait ? (
                <img
                  src={`/images/${portrait}`}
                  alt="Ritratto giocatore"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-3xl">
                  🧙‍♂️
                </span>
              )}

            </div>

            <div className="text-[9px] font-black text-white">
              YOU
            </div>

             </motion.div>
        </>
        )}

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
                💬 PARLA CON {npcName}
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

              <div className="w-10 h-10 drop-shadow-xl mx-auto mb-2">

                {npcImage ? (
                  <img
                    src={`/images/${npcImage}`}
                    alt={npcName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-3xl">
                    {npc.emoji}
                  </span>
                )}

              </div>

              <div className="text-amber-400 font-black uppercase tracking-widest text-xs mb-2">
                {npcName}
              </div>

              <p className="text-sm text-slate-300 mb-5">
                “{npc.dialogue}”
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