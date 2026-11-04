import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
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
  11: [
    "#######################",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#.....................#",
    "#######################"
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

const FOREST_START = { x: 11, y: 1 };
const FOREST_NPC_POSITION = { x: 11, y: 29 };

// NPC segreti: non vengono disegnati sulla mappa, ma si possono incontrare
// esplorando le coordinate indicate.
const HIDDEN_NPCS = {
  3: {
    x: 16,
    y: 5,
    dialogue: "top usage : cancucc nina Deb",
    dialogueEn: "top usage : cancucc nina Deb",
  },
  4: {
    x: 16,
    y: 12,
    dialogue: "Il Genesis sta collassando , la fazione degli umani è in difficoltà . Se la fazione degli umani sparisce , l'equilibrio verrà rotto e tutti i sognatori saranno in pericolo",
    dialogueEn: "Genesis is collapsing. The human faction is in trouble, and if the human faction disappears, the balance will be broken and all Dreamers will be in danger.",
  },
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
  11: {
    name: "Eraclito",
    emoji: "👑",
    world: "La Radura delle Affinità",
    worldEn: "The Affinity Grove",
    dialogueEn: "Ahahahah. I see I've almost taken possession of you too. Allow me to introduce myself: I'm Eraclito. There's only one way to escape me. But if you're here, I don't think you intend to stop.",
    dialogue: "Ahahahah. Vedo che mi sono già quasi impossessato anche di te. Mi presento, sono Eraclito. C'è solo un modo per sfuggirmi. Ma se sei qui non credo che hai intenzione di smettere.",
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

function ForestMaze3D({ map, player, npcPosition, isEnglish, onMove }) {
  const mountRef = useRef(null);
  const playerRef = useRef(player);
  playerRef.current = player;
  const moveRef = useRef(onMove);
  moveRef.current = onMove;
  const stickRef = useRef({ active: false, pointerId: null, dx: 0, dy: 0, lastStep: 0 });
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const stick = stickRef.current;
      if (!stick.active || (!stick.dx && !stick.dy)) return;
      const now = Date.now();
      if (now - stick.lastStep < 190) return;
      stick.lastStep = now;
      moveRef.current?.(stick.dx, stick.dy);
    }, 45);
    return () => window.clearInterval(timer);
  }, []);

  const updateStick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const max = rect.width * 0.34;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const distance = Math.hypot(rawX, rawY) || 1;
    const scale = Math.min(1, max / distance);
    const x = rawX * scale;
    const y = rawY * scale;
    const dx = Math.abs(rawX) > Math.abs(rawY) ? (rawX > 0 ? 1 : -1) : 0;
    const dy = Math.abs(rawY) >= Math.abs(rawX) ? (rawY > 0 ? 1 : -1) : 0;
    stickRef.current.dx = distance > rect.width * 0.13 ? dx : 0;
    stickRef.current.dy = distance > rect.width * 0.13 ? dy : 0;
    setStickPosition({ x, y, active: true });
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#a8d4e7");
    scene.fog = new THREE.Fog("#a8d4e7", 30, 78);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    const renderer = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 1.5, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Ombre dinamiche disattivate: su smartphone causavano cali di frame.\n    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight("#e5ffe5", "#4b6038", 2.0));
    const sun = new THREE.DirectionalLight("#fff1c4", 2.4);
    sun.position.set(-8, 18, 7);
    sun.castShadow = false;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(map[0].length * 1.2 + 4, map.length * 1.2 + 4),
      new THREE.MeshStandardMaterial({ color: "#83a95a", roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set((map[0].length - 1) * 0.6, -0.12, (map.length - 1) * 0.6);
    ground.receiveShadow = true;
    scene.add(ground);

    const pathMaterial = new THREE.MeshStandardMaterial({ color: "#b99a68", roughness: 1 });
    const grassMaterial = new THREE.MeshStandardMaterial({ color: "#668d45", roughness: 1 });
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#69452b", roughness: 1 });
    const leafMaterials = ["#1d633b", "#287747", "#39884b", "#195535"].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 1 })
    );

    const tileGeo = new THREE.BoxGeometry(1.18, 0.12, 1.18);
    const trunkGeo = new THREE.CylinderGeometry(0.13, 0.2, 1.15, 6);
    const leafGeo = new THREE.ConeGeometry(0.78, 1.65, 7);
    const rockGeo = new THREE.DodecahedronGeometry(0.22, 0);

    map.forEach((row, z) => {
      row.split("").forEach((cell, x) => {
        const isMainTrail = x >= 9 && x <= 13 || [5, 15, 23].includes(z) && x >= 2 && x <= 20;
        const tile = new THREE.Mesh(tileGeo, cell === "#" || !isMainTrail ? grassMaterial : pathMaterial);
        tile.position.set(x * 1.2, -0.02, z * 1.2);
        tile.receiveShadow = true;
        scene.add(tile);

        if (cell === "#") {
          const tree = new THREE.Group();
          const trunk = new THREE.Mesh(trunkGeo, trunkMaterial);
          trunk.position.y = 0.62;
          trunk.castShadow = true;
          tree.add(trunk);

          const seed = (x * 17 + z * 31) % leafMaterials.length;
          [0, 1, 2].forEach((layer) => {
            const crown = new THREE.Mesh(leafGeo, leafMaterials[(seed + layer) % leafMaterials.length]);
            crown.position.y = 1.25 + layer * 0.48;
            crown.scale.set(1 - layer * 0.12, 1, 1 - layer * 0.12);
            crown.castShadow = true;
            tree.add(crown);
          });
          tree.position.set(x * 1.2, 0, z * 1.2);
          scene.add(tree);
        } else if ((x * 13 + z * 7) % 11 === 0) {
          const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({ color: "#8b9870" }));
          rock.position.set(x * 1.2 + 0.25, 0.12, z * 1.2 - 0.2);
          rock.scale.set(1.2, 0.7, 0.9);
          rock.castShadow = true;
          scene.add(rock);
        }
      });
    });

    // Le undici piazze delle affinità, disposte lungo una grande radura esplorabile.
    const addLandmark = (x, z, color, labelType, label) => {
      const group = new THREE.Group();
      group.position.set(x * 1.2, 0, z * 1.2);
      const mat = (hex, emissive = false) => new THREE.MeshStandardMaterial({
        color: hex, roughness: 0.55, metalness: 0.12,
        emissive: emissive ? hex : "#000000", emissiveIntensity: emissive ? 0.35 : 0
      });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.22, 0.18, 12), mat("#8a7958"));
      base.position.y = 0.1; base.receiveShadow = true; group.add(base);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.055, 8, 32), mat(color, true));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.24; group.add(ring);

      if (labelType === "cloud") {
        [[-0.42,0.95,0],[0,1.2,0],[0.42,0.95,0]].forEach(([cx,cy,cz]) => {
          const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.43, 9, 7), mat("#f4f7ff"));
          cloud.position.set(cx,cy,cz); cloud.scale.set(1.25,0.72,0.9); group.add(cloud);
        });
      } else if (labelType === "light") {
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), mat("#fff1a8", true));
        core.position.y = 1.45; group.add(core);
        for (let i=0;i<8;i++) {
          const ray = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.65,0.1), mat("#ffe18a", true));
          const a=i*Math.PI/4; ray.position.set(Math.cos(a)*0.65,1.45+Math.sin(a)*0.65,0); ray.rotation.z=-a; group.add(ray);
        }
      } else if (labelType === "marino") {
        const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,0.12,24), mat("#168fbd", true));
        pool.position.y=0.23; group.add(pool);
        const wave = new THREE.Mesh(new THREE.TorusGeometry(0.58,0.05,8,28), mat("#a4f0ff", true));
        wave.rotation.x=Math.PI/2; wave.position.y=0.34; group.add(wave);
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.17,10,8),mat("#d5fbff"));
        bubble.position.set(0,0.9,0); group.add(bubble);
      } else if (labelType === "demoni") {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.52,1.4,7), mat("#e65b28", true));
        flame.position.y=0.95; group.add(flame);
        [-1,1].forEach(side => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.14,0.58,6),mat("#39252a"));
          horn.position.set(side*0.38,1.48,0); horn.rotation.z=side*0.45; group.add(horn);
        });
      } else if (labelType === "natura") {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.34,1.55,7),mat("#76502e"));
        trunk.position.y=0.78; group.add(trunk);
        for(let i=0;i<3;i++){
          const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(0.72-i*0.1,1),mat(["#2d7d43","#45964e","#78ae58"][i]));
          crown.position.set((i-1)*0.12,1.65+i*0.36,0); crown.castShadow=true; group.add(crown);
        }
      } else if (labelType === "mago") {
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.72,0),mat("#a56be0",true));
        crystal.position.y=1.05; crystal.rotation.y=Math.PI/4; group.add(crystal);
        const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.68,0.045,8,24),mat("#d9b5ff",true));
        orbit.position.y=1.05; orbit.rotation.x=0.8; group.add(orbit);
      } else if (labelType === "umano") {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.38,1.45,8),mat("#44464b"));
        pillar.position.y=0.75; group.add(pillar);
        const crest = new THREE.Mesh(new THREE.SphereGeometry(0.34,10,8),mat("#e0c49a"));
        crest.position.y=1.65; group.add(crest);
      } else if (labelType === "dolce") {
        const sweet = new THREE.Mesh(new THREE.SphereGeometry(0.58,12,10),mat("#f4a9c8",true));
        sweet.position.y=0.88; group.add(sweet);
        const topping = new THREE.Mesh(new THREE.ConeGeometry(0.42,0.48,8),mat("#fff0d8"));
        topping.position.y=1.42; group.add(topping);
      } else if (labelType === "robot") {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.9,0.72),mat("#aeb8c2",true));
        body.position.y=0.9; group.add(body);
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.12,0.08),mat("#4bd9ef",true));
        eye.position.set(0,1.02,0.39); group.add(eye);
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.45,6),mat("#d9e1e8"));
        antenna.position.y=1.62; group.add(antenna);
      } else if (labelType === "orso") {
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.55,10,8),mat("#9a6840"));
        body.position.y=0.75; body.scale.set(1,1.15,0.8); group.add(body);
        [-0.34,0.34].forEach(side => {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2,8,6),mat("#704526"));
          ear.position.set(side*1.4,1.22,0); group.add(ear);
        });
        const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.18,8,6),mat("#e4c39b"));
        muzzle.position.set(0,0.78,0.43); group.add(muzzle);
      } else if (labelType === "salato") {
        const crystal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62,0),mat("#ffa630",true));
        crystal.position.y=0.95; group.add(crystal);
        const spikes = [-1,0,1].map((v) => {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12,0.55,5),mat("#ffe0a0"));
          spike.position.set(v*0.42,1.55,0); group.add(spike); return spike;
        });
      }

      // Etichetta leggibile sopra ogni monumento, sempre rivolta verso la telecamera.
      const canvas = document.createElement("canvas");
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "rgba(8,18,15,0.82)";
      ctx.beginPath(); ctx.roundRect(8, 8, 496, 112, 28); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 48px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label.toUpperCase(), 256, 66);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
      badge.position.y = 2.45;
      badge.scale.set(3.0, 0.75, 1);
      group.add(badge);

      const aura = new THREE.PointLight(color, 0.8, 3.8);
      aura.position.y = 1.1;
      group.add(aura);
      scene.add(group);
      return group;
    };

    addLandmark(3, 5, "#d5d5d0", "cloud", "Nuvola");
    addLandmark(11, 5, "#ffd700", "light", "Luce");
    addLandmark(19, 5, "#1e90ff", "marino", "Marino");
    addLandmark(3, 13, "#e83232", "demoni", "Demone");
    addLandmark(11, 13, "#2d8b2d", "natura", "Natura");
    addLandmark(19, 13, "#b8b8b8", "robot", "Robot");
    addLandmark(3, 21, "#7b3ca8", "mago", "Mago");
    addLandmark(7, 25, "#3a3a3a", "umano", "Umano");
    addLandmark(11, 21, "#c8a165", "dolce", "Dolce");
    addLandmark(15, 25, "#8b5a2b", "orso", "Orso");
    addLandmark(19, 21, "#ffa630", "salato", "Salato");

    const makeCharacter = (mainColor, accentColor, isBoss = false) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(isBoss ? 0.3 : 0.22, isBoss ? 0.42 : 0.28, isBoss ? 0.95 : 0.72, 8),
        new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.8 })
      );
      body.position.y = isBoss ? 0.72 : 0.58;
      body.castShadow = true;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(isBoss ? 0.28 : 0.22, 12, 10),
        new THREE.MeshStandardMaterial({ color: "#f0c59b" })
      );
      head.position.y = isBoss ? 1.42 : 1.12;
      head.castShadow = true;
      group.add(head);
      const accent = new THREE.Mesh(
        new THREE.ConeGeometry(isBoss ? 0.25 : 0.16, isBoss ? 0.5 : 0.3, 6),
        new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.25, roughness: 0.5 })
      );
      accent.position.y = isBoss ? 1.82 : 1.38;
      accent.castShadow = true;
      group.add(accent);
      return group;
    };

    const playerModel = makeCharacter("#3979bd", "#f2d36b");
    scene.add(playerModel);

    const bossModel = makeCharacter("#e6b84d", "#fff0a6", true);
    bossModel.position.set(npcPosition.x * 1.2, 0, npcPosition.y * 1.2);
    scene.add(bossModel);

    // Piccola radura e sigillo che annunciano l'incontro finale.
    const clearing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: "#c4a46a", roughness: 1 })
    );
    clearing.position.set(npcPosition.x * 1.2, 0.04, npcPosition.y * 1.2);
    scene.add(clearing);
    bossModel.position.y = 0.08;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    // Camera stabile in terza persona: non ruota a ogni cambio direzione.
    // Personaggio e camera interpolano tra le caselle per evitare scatti.
    const renderPosition = new THREE.Vector3(
      playerRef.current.x * 1.2,
      0,
      playerRef.current.y * 1.2
    );
    const cameraTarget = new THREE.Vector3(
      renderPosition.x,
      0.7,
      renderPosition.z + 2.5
    );
    const desiredCameraPosition = new THREE.Vector3();
    const desiredLookTarget = new THREE.Vector3();
    const clock = new THREE.Clock();

    camera.position.set(renderPosition.x, 7.2, renderPosition.z - 8.5);
    camera.lookAt(cameraTarget);

    let frame = 0;
    let running = true;
    const animate = () => {
      if (!running) return;
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const smoothing = 1 - Math.exp(-delta * 10);
      const current = playerRef.current;
      const targetX = current.x * 1.2;
      const targetZ = current.y * 1.2;

      renderPosition.x = THREE.MathUtils.damp(renderPosition.x, targetX, 11, delta);
      renderPosition.z = THREE.MathUtils.damp(renderPosition.z, targetZ, 11, delta);
      playerModel.position.set(renderPosition.x, 0, renderPosition.z);

      // La direzione cambia solo il modello, mai l'orientamento della telecamera.
      if (Math.abs(targetX - renderPosition.x) > Math.abs(targetZ - renderPosition.z)) {
        playerModel.rotation.y = targetX > renderPosition.x ? Math.PI / 2 : -Math.PI / 2;
      } else if (Math.abs(targetZ - renderPosition.z) > 0.02) {
        playerModel.rotation.y = targetZ > renderPosition.z ? 0 : Math.PI;
      }

      bossModel.rotation.y += delta * 0.25;

      desiredCameraPosition.set(renderPosition.x, 7.2, renderPosition.z - 8.5);
      desiredLookTarget.set(renderPosition.x, 0.7, renderPosition.z + 2.5);
      camera.position.lerp(desiredCameraPosition, smoothing);
      cameraTarget.lerp(desiredLookTarget, smoothing);
      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose());
        }
      });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [map, npcPosition.x, npcPosition.y]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#9bc9a0]">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute top-3 left-3 rounded-xl bg-emerald-950/75 border border-emerald-300/30 px-3 py-2 text-[10px] sm:text-xs font-black tracking-widest text-emerald-100 pointer-events-none">
        {isEnglish ? "AFFINITY GROVE · BONUS QUEST" : "RADURA DELLE AFFINITÀ · SFIDA BONUS"}
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[10px] text-white/90 pointer-events-none whitespace-nowrap hidden sm:block">
        {isEnglish ? "WASD / arrows to move" : "WASD / frecce per muoverti"}
      </div>
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

  const [player, setPlayer] = useState(stage === 11 ? FOREST_START : PLAYER_START);
  const activeNpcPosition = stage === 11 ? FOREST_NPC_POSITION : NPC_POSITION;
  const [nearNpc, setNearNpc] = useState(false);
  const [nearHiddenNpc, setNearHiddenNpc] = useState(false);
  const [talking, setTalking] = useState(false);
  const [talkingToHiddenNpc, setTalkingToHiddenNpc] = useState(false);
  const hiddenNpc = HIDDEN_NPCS[stage];

  const isWalkable = (x, y) => {
    if (!MAP[y] || !MAP[y][x]) return false;

    return MAP[y][x] !== "#";
  };

  const checkNpcDistance = (x, y) => {
    const distance =
      Math.abs(x - activeNpcPosition.x) +
      Math.abs(y - activeNpcPosition.y);

    return distance <= 1;
  };

  const checkHiddenNpcDistance = (x, y) => {
    if (!hiddenNpc) return false;
    return Math.abs(x - hiddenNpc.x) + Math.abs(y - hiddenNpc.y) <= 1;
  };

  const movePlayer = (dx, dy) => {
    setPlayer((current) => {
      const nextX = current.x + dx;
      const nextY = current.y + dy;

      if (!isWalkable(nextX, nextY)) {
        return current;
      }

      setNearNpc(checkNpcDistance(nextX, nextY));
      setNearHiddenNpc(checkHiddenNpcDistance(nextX, nextY));

      return {
        x: nextX,
        y: nextY,
      };
    });
  };

  const talkToNpc = () => {
    if (nearHiddenNpc) {
      setTalkingToHiddenNpc(true);
      return;
    }
    if (nearNpc) {
      setTalkingToHiddenNpc(false);
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
          className="relative mx-auto overflow-hidden rounded-3xl border border-amber-500/30 shadow-2xl touch-none select-none"
          onPointerDown={(event) => {
            if (event.pointerType !== "touch") return;
            event.currentTarget.dataset.touchStartX = String(event.clientX);
            event.currentTarget.dataset.touchStartY = String(event.clientY);
          }}
          onPointerUp={(event) => {
            if (event.pointerType !== "touch") return;
            const startX = Number(event.currentTarget.dataset.touchStartX);
            const startY = Number(event.currentTarget.dataset.touchStartY);
            if (!Number.isFinite(startX) || !Number.isFinite(startY)) return;
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
            if (Math.abs(dx) > Math.abs(dy)) {
              movePlayer(dx > 0 ? 1 : -1, 0);
            } else {
              // Nella visuale 3D, verso l'alto significa avanzare verso Eraclito.
              const forward = stage === 11;
              movePlayer(0, dy > 0 ? (forward ? -1 : 1) : (forward ? 1 : -1));
            }
            delete event.currentTarget.dataset.touchStartX;
            delete event.currentTarget.dataset.touchStartY;
          }}
          onPointerCancel={(event) => {
            delete event.currentTarget.dataset.touchStartX;
            delete event.currentTarget.dataset.touchStartY;
          }}
          style={{
            width: "100%",
            maxWidth: stage === 11 ? "560px" : "960px",
            aspectRatio: stage === 11 ? "23 / 31" : "20 / 15",
            maxHeight: stage === 11 ? "72vh" : undefined,
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
                : stage === 11
                ? "linear-gradient(135deg, #092c1a, #17633a, #527b35)"
                : "linear-gradient(135deg, #3b174f, #8b2f8f)",
          }}
        >

         {stage === 11 ? (
  <ForestMaze3D
    map={MAP}
    player={player}
    npcPosition={activeNpcPosition}
    isEnglish={isEnglish}
    onMove={movePlayer}
  />
) : isStage10 ? (
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
                    stage === 11
                      ? cell === "#"
                        ? "bg-gradient-to-br from-emerald-950 via-green-950 to-[#102b1b] border border-emerald-900/70 shadow-inner"
                        : "bg-gradient-to-br from-[#8b7045] via-[#6f5838] to-[#4d482b] border border-emerald-900/30"
                      : cell === "~"
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
                      : stage === 11
                      ? ((x + y) % 2 === 0 ? "bg-violet-900 border border-amber-500/30" : "bg-violet-800 border border-amber-400/20")
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

                  {Math.random() > (stage === 11 ? 0.58 : 0.82) && (
                    <div className="w-full h-full flex items-center justify-center text-xs opacity-75 pointer-events-none">
                      {stage === 11
                        ? cell === "#" ? "🌳" : (Math.random() > 0.5 ? "🌿" : "🍂")
                        : cell !== "#" && cell !== "~"
                        ? stage === 1 ? "🌿" : stage === 2 ? "🪨" : ""
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
              left: `${activeNpcPosition.x * tileWidth}%`,
              top: `${activeNpcPosition.y * tileHeight}%`,
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

        {/* Movimento touch diretto sulla mappa: trascina nella direzione desiderata. */}

        {/* PARLA */}

        <AnimatePresence>

          {(nearNpc || nearHiddenNpc) && !talking && !talkingToHiddenNpc && (
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
                💬 {isEnglish ? "TALK" : "PARLA"} {nearHiddenNpc ? (isEnglish ? "TO THE STRANGER" : "CON LO SCONOSCIUTO") : npcName}
              </button>

            </motion.div>
          )}

        </AnimatePresence>

        {/* DIALOGO NPC SEGRETO */}

        <AnimatePresence>
          {talkingToHiddenNpc && hiddenNpc && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-5 mx-auto max-w-md rounded-2xl bg-slate-950 border border-cyan-400/50 p-5 text-center shadow-2xl"
            >
              <div className="text-cyan-300 font-black uppercase tracking-widest text-xs mb-3">
                {isEnglish ? "Mysterious voice" : "Voce misteriosa"}
              </div>
              <p className="text-sm leading-relaxed text-slate-200 mb-5">
                “{isEnglish ? hiddenNpc.dialogueEn : hiddenNpc.dialogue}”
              </p>
              <button
                onClick={() => setTalkingToHiddenNpc(false)}
                className="w-full py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-black transition"
              >
                {isEnglish ? "CLOSE" : "CHIUDI"}
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