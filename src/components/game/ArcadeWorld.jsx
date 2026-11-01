import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

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
    worldEn: "The Dreamers’ Forest",
    dialogueEn: "Welcome to the Dreamers’ Forest. Every choice can change your path. Are you ready to put your true nature to the test?",
    dialogue:
      "Benvenuto nella Foresta dei Sognatori. Qui ogni scelta può cambiare il tuo cammino. Sei pronto/a a mettere alla prova la tua natura?",
  },

  2: {
    name: "NPC 2",
    emoji: "👹",
    world: "Il Vulcano dei Demoni",
    worldEn: "The Demons’ Volcano",
    dialogueEn: "Strength alone is not enough here. You must have the courage to change when things get tough. Let’s see what you’re made of.",
    dialogue:
      "Qui dentro non basta essere forte. Devi avere il coraggio di cambiare quando le cose si fanno difficili. Vediamo quanto vali.",
  },

  3: {
    name: "NPC 3",
    emoji: "🌊",
    world: "Splash",
    worldEn: "Splash",
    dialogueEn: "Water is always changing direction… just like an auction. Don’t get caught off guard, and think carefully about your next move!",
    dialogue:
      "L'acqua cambia continuamente direzione... proprio come un'asta. Non farti sorprendere e pensa bene alla tua prossima mossa!",
  },

  4: {
    name: "NPC 4",
    emoji: "🍬",
    world: "Sniakerville",
    worldEn: "Sniakerville",
    dialogueEn: "Everything looks sweet and peaceful, doesn’t it? Don’t trust appearances. The sweetest things can be the most dangerous.",
    dialogue:
      "Sembra tutto dolce e tranquillo, vero? Non fidarti delle apparenze. Le cose più dolci posso essere le più pericolose.",
  },

  5: {
    name: "NPC 5",
    emoji: "☁️",
    world: "Sulle nuvole",
    worldEn: "Above the Clouds",
    dialogueEn: "From up here, everything seems easier. How long can you keep your head in the clouds without losing your mind?",
    dialogue:
      "Da quassù tutto sembra più semplice. Quanto riuscirai a tenere la testa tra le nuvole senza impazzire?",
  },

  6: {
    name: "NPC 6",
    emoji: "🤖",
    world: "Bug City",
    worldEn: "Bug City",
    dialogueEn: "System online. Opponent analysis complete. Predicted error: underestimating the auction. Victory assured.",
    dialogue:
      "Sistema attivo. Analisi dell'avversario completata. Errore previsto: sottovalutare l'asta. Vittoria assicurata",
  },

  7: {
    name: "NPC 7",
    emoji: "🏠",
    world: "Una piccola casa",
    worldEn: "A Little House",
    dialogueEn: "You let this little house fool you. The strategy here is different… use your best ones. Don’t worry, you’ll be scared until the moment you finally lose.",
    dialogue:
      "Ti sei lasciato/a ingannare da questa casetta. Qui si gioca con una strategia diversa...usare i migliori, tranquillo/a avrai paura fino a quando finalmente avrai perso",
  },

  8: {
    name: "NPC 8",
    emoji: "🧙",
    world: "Accademia dei Sognatori",
    worldEn: "Dreamers’ Academy",
    dialogueEn: "Welcome to the Academy. You’ve come a long way. Here, we don’t just learn how to fight: we learn to transcend our reality. I made this same journey a long time ago.",
    dialogue:
      "Benvenuto all'Accademia , hai fatto un bel viaggio. Qui non si impara soltanto a combattere: si impara a trascendere la tua realtà. Ho fatto il tuo stesso viaggio, tempo fa",
  },

  9: {
    name: "NPC 9",
    emoji: "👑",
    world: "Mimmiland",
    worldEn: "Mimmiland",
    dialogueEn: "Prove that you are truly worthy of entering the heart of Mimmiland. Defeat me and become part of the world of the Dreamers.",
    dialogue:
      "Dimostrami di essere davvero degno di entrare nel cuore di Mimmiland. Battimi ed entra davvero a far parte del mondo dei Sognatori",
  },
   10: {
    name: "Mangu",
    emoji: "🧙",
    world: "Dream Arena",
    worldEn: "Dream Arena",
    dialogueEn: "Welcome to the Dream Arena! I’m Mangu. I have 300 credits, and I’m not here to give anything away: I’m very interested in Spinoff and Pepe. Let’s see if you can beat me at the auction too.",
    dialogue:
      "Benvenuto nella Dream Arena! Sono Mangu. Ho 300 crediti e oggi non sono qui per fare beneficenza: Spinoff e Pepe mi interessano parecchio. Vediamo se riesci a battermi anche all’asta.",
  }, 
};

function DreamArenaStage10({
  player,
  npc,
  npcName,
  npcImage,
  portrait,
  nearNpc,
  isEnglish,
}) {
  const pillars = [8, 25, 75, 92];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "#17152c",
        imageRendering: "pixelated",
      }}
    >
      {/* PARETI ESTERNE */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #292347 0%, #51436b 42%, #211d38 100%)",
        }}
      />

      {/* SOFFITTO MONUMENTALE */}
      <div
        className="absolute top-0 left-0 w-full h-[18%]"
        style={{
          background:
            "repeating-linear-gradient(90deg, #302847 0px, #302847 42px, #49395b 43px, #49395b 48px)",
          borderBottom: "8px solid #b58b45",
          boxShadow: "0 8px 20px #080713",
        }}
      />

      {/* VETRATA CENTRALE */}
      <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[30%] h-[23%]">
        <div
          className="absolute inset-0 border-4 border-amber-500"
          style={{
            background:
              "linear-gradient(135deg, #182d59, #6652a2, #1c2345)",
            clipPath:
              "polygon(0 0,100% 0,100% 75%,50% 100%,0 75%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-amber-200 text-5xl opacity-80">
          ✦
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.3em] text-amber-200 font-black">
          SOGNATORI
        </div>
      </div>

      {/* PARETI LATERALI */}
      <div
        className="absolute left-0 top-[18%] bottom-0 w-[7%]"
        style={{
          background:
            "repeating-linear-gradient(180deg, #39304f 0px, #39304f 32px, #51415e 33px, #51415e 38px)",
          borderRight: "5px solid #a77d42",
        }}
      />
      <div
        className="absolute right-0 top-[18%] bottom-0 w-[7%]"
        style={{
          background:
            "repeating-linear-gradient(180deg, #39304f 0px, #39304f 32px, #51415e 33px, #51415e 38px)",
          borderLeft: "5px solid #a77d42",
        }}
      />

      {/* VETRATE LATERALI */}
      {[10, 27, 73, 90].map((x, i) => (
        <div
          key={i}
          className="absolute top-[25%] h-[18%] w-[8%] border-4 border-amber-700"
          style={{
            left: `${x}%`,
            background:
              "linear-gradient(180deg, #77b7d5, #394a83 55%, #202342)",
            boxShadow: "inset 0 0 12px #b6dfff",
          }}
        >
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-amber-600" />
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-amber-600" />
        </div>
      ))}

      {/* PAVIMENTO A SCACCHIERA */}
      <div
        className="absolute left-[7%] right-[7%] top-[43%] bottom-0"
        style={{
          backgroundColor: "#51445f",
          backgroundImage: `
            linear-gradient(45deg, #62536e 25%, transparent 25%),
            linear-gradient(-45deg, #62536e 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #62536e 75%),
            linear-gradient(-45deg, transparent 75%, #62536e 75%)
          `,
          backgroundSize: "48px 48px",
          backgroundPosition:
            "0 0, 0 24px, 24px -24px, -24px 0px",
          borderTop: "8px solid #b58b45",
        }}
      />

      {/* CORRIDOIO CENTRALE */}
      <div
        className="absolute top-[43%] bottom-0 left-[36%] w-[28%]"
        style={{
          background:
            "repeating-linear-gradient(90deg, #6c5b70 0px, #6c5b70 28px, #78647a 29px, #78647a 32px)",
          borderLeft: "4px solid #c09a55",
          borderRight: "4px solid #c09a55",
        }}
      />

      {/* DECORAZIONI DEL PAVIMENTO */}
      <div className="absolute top-[48%] left-1/2 -translate-x-1/2 text-amber-300 text-5xl opacity-30">
        ✦
      </div>
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-amber-300 text-4xl opacity-40">
        ◈
      </div>

      {/* PIATTAFORMA DEL MAESTRO */}
      <div
        className="absolute left-1/2 top-[48%] w-[48%] h-[31%]"
        style={{
          transform: "translateX(-50%)",
          background:
            "linear-gradient(180deg, #c59c57, #73502f)",
          clipPath:
            "polygon(12% 0,88% 0,100% 22%,100% 78%,88% 100%,12% 100%,0 78%,0 22%)",
          boxShadow: "0 10px 20px #090713",
        }}
      />
      <div
        className="absolute left-1/2 top-[49%] w-[45%] h-[29%]"
        style={{
          transform: "translateX(-50%)",
          background:
            "repeating-linear-gradient(45deg, #493a53 0px, #493a53 18px, #594660 19px, #594660 36px)",
          clipPath:
            "polygon(12% 0,88% 0,100% 22%,100% 78%,88% 100%,12% 100%,0 78%,0 22%)",
        }}
      />

      {/* SIGILLO CENTRALE */}
      <div
        className="absolute left-1/2 top-[64%] w-[19%] h-[12%]"
        style={{
          transform: "translate(-50%, -50%)",
          border: "4px solid #d7ae61",
          background:
            "radial-gradient(circle, #55406e, #211b39)",
          clipPath:
            "polygon(50% 0,100% 50%,50% 100%,0 50%)",
          boxShadow: "0 0 20px #d7ae61",
        }}
      />
      <div className="absolute left-1/2 top-[64%] -translate-x-1/2 -translate-y-1/2 text-amber-200 text-3xl">
        ✦
      </div>

      {/* COLONNE MONUMENTALI */}
      {pillars.map((x, i) => (
        <div
          key={i}
          className="absolute top-[39%] h-[32%] w-[5%]"
          style={{
            left: `${x}%`,
            background:
              "linear-gradient(90deg, #725c68, #d0b18a, #806b72)",
            borderLeft: "3px solid #d8b77b",
            borderRight: "3px solid #392b42",
            boxShadow: "4px 6px 8px #100c1e",
          }}
        >
          <div className="absolute -top-2 -left-2 -right-2 h-3 bg-amber-600 border-2 border-amber-300" />
          <div className="absolute bottom-0 -left-2 -right-2 h-3 bg-amber-700" />
        </div>
      ))}

      {/* TORCE DECORATIVE */}
      {[15, 85].map((x, i) => (
        <div
          key={i}
          className="absolute top-[34%] text-3xl"
          style={{
            left: `${x}%`,
            filter: "drop-shadow(0 0 12px #ff9c35)",
          }}
        >
          🔥
        </div>
      ))}

      {/* STATUE LATERALI */}
      <div className="absolute left-[11%] bottom-[13%] text-5xl">
        🗿
      </div>
      <div className="absolute right-[11%] bottom-[13%] text-5xl">
        🗿
      </div>

      {/* STENDARDI */}
      <div className="absolute left-[20%] top-[19%] text-4xl text-amber-300">
        ⚑
      </div>
      <div className="absolute right-[20%] top-[19%] text-4xl text-amber-300">
        ⚑
      </div>

      {/* MANGU */}
      <div
        className="absolute flex flex-col items-center z-20"
        style={{
          left: "50%",
          top: "43%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="w-14 h-14 flex items-center justify-center"
          style={{
            filter: "drop-shadow(0 0 10px #f5bd5c)",
          }}
        >
          {npcImage ? (
            <img
              src={`/images/${npcImage}`}
              alt={npcName}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-5xl">{npc.emoji}</span>
          )}
        </div>
        <div className="px-3 py-1 bg-[#21172d] border-2 border-amber-500 text-amber-300 text-xs font-black whitespace-nowrap">
          {npcName}
        </div>
      </div>

      {/* GIOCATORE */}
      <motion.div
        className="absolute flex flex-col items-center z-30"
        animate={{
          left: `${25 + player.x * 2}%`,
          top: `${32 + player.y * 2.2}%`,
        }}
        transition={{ duration: 0.12 }}
      >
        <div className="w-12 h-12 drop-shadow-xl">
          {portrait ? (
            <img
              src={`/images/${portrait}`}
              alt="Ritratto giocatore"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-4xl">🧙‍♂️</span>
          )}
        </div>
        <div className="px-2 py-0.5 bg-slate-950/90 text-white text-[10px] font-black">
          YOU
        </div>
      </motion.div>

      {/* INDICATORE INTERAZIONE */}
      {nearNpc && (
        <div className="absolute left-1/2 top-[32%] -translate-x-1/2 text-amber-300 text-xl font-black animate-bounce z-40">
          ▼
          <div className="text-[10px] whitespace-nowrap bg-black/80 px-2 py-1">
            {isEnglish ? "PRESS E TO TALK" : "PREMI E PER PARLARE"}
          </div>
        </div>
      )}

      {/* LUCI AMBIENTALI */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(5,4,15,.55) 100%)",
        }}
      />
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
  const { lang } = useLanguage();
  const isEnglish = lang === "en";
  const MAP = MAPS[stage] || MAPS[1];
  const isStage10 = stage === 10;

  const npc = STAGE_NPCS[stage] || STAGE_NPCS[1];
  const dialogue = isEnglish ? (npc.dialogueEn || npc.dialogue) : npc.dialogue;
  const worldName = isEnglish ? (npc.worldEn || npc.world) : npc.world; 

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
              {worldName}
            </h1>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
          >
            {isEnglish ? "← Back" : "← Indietro"}
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
    isEnglish={isEnglish}
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

          <><b>WASD</b> / <b>{isEnglish ? "ARROW KEYS" : "FRECCE"}</b> {isEnglish ? "to move" : "per muoverti"}</>

          {nearNpc && (
            <span className="ml-3 text-amber-400 font-bold">
              • {isEnglish ? "Press E to talk" : "Premi E per parlare"}
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
                💬 {isEnglish ? "TALK TO" : "PARLA CON"} {npcName}
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
                “{dialogue}”
              </p>

              <button
                onClick={() => onStartAuction(stage)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-black hover:brightness-110 transition"
              >
                🔮 {isEnglish ? "START AUCTION" : "INIZIA L’ASTA"}
              </button>

            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </div>
  );
}