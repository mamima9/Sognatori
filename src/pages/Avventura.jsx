// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ROSTER } from "@/lib/sognatoriData";
import AdventureCampaign from "@/components/game/AdventureCampaign";
import AdventureTravelerSprite from "@/components/game/AdventureTravelerSprite";
import GlobalMusicPlayer from "@/components/game/GlobalMusicPlayer";
import { ADVENTURE_CITIES, buildCityTeam } from "@/lib/adventureCampaignData";

/*
  SOGNATORI — AVVENTURA

  - mondo grande e continuo
  - movimento WASD / frecce
  - pad touch mobile
  - camera fluida
  - collisioni
  - acqua, alberi, rocce, case
  - 4 zone esplorabili
  - NPC interattivi
  - Sognatori selvatici
  - sfidanti
  - cooldown incontri
  - ciclo giorno/notte
  - minimappa
  - quest
  - HUD
  - nessuna dipendenza aggiuntiva
*/

const WORLD = {
  width: 3600,
  height: 2400,
};

const PLAYER = {
  size: 30,
  speed: 230,
};

const PLAYER_START = {
  x: 1450,
  y: 1100,
};

const TESTER_EMAILS = [
  "bibitoeuro@gmail.com",
];

const WILD_STARTS = [
  {
    id: "wild-1",
    x: 1460,
    y: 470,
    name: "Cancucc",
  },
  {
    id: "wild-2",
    x: 1050,
    y: 1320,
    name: "Cillymbu",
  },
  {
    id: "wild-3",
    x: 2250,
    y: 720,
    name: "Nina",
  },
  {
    id: "wild-4",
    x: 2900,
    y: 1320,
    name: "Dragociocco",
  },
  {
    id: "wild-5",
    x: 680,
    y: 1880,
    name: "Pepe",
  },
  {
    id: "wild-6",
    x: 3150,
    y: 520,
    name: "Icepadel",
  },
  {
    id: "wild-7",
    x: 2350,
    y: 1960,
    name: "Eroe",
  },
  {
    id: "wild-8",
    x: 1380,
    y: 2050,
    name: "Uesditti",
  },
];

const CHALLENGERS = ADVENTURE_CITIES.map((city) => ({
  ...city,
  id: city.id,
  name: city.traveler,
  team: buildCityTeam(city.faction, city.id),
  vision: 190,
  homeX: city.x,
  homeY: city.y,
  radius: 76,
  color: city.color,
}));

const clamp = (v, min, max) =>
  Math.max(min, Math.min(max, v));

const distance = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

function seededRandom(seed) {
  let value = seed;

  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function buildWorld() {
  const rand = seededRandom(42);

  const trees = [];
  const rocks = [];

  for (let i = 0; i < 150; i++) {
    const x = 80 + rand() * (WORLD.width - 160);
    const y = 80 + rand() * (WORLD.height - 160);

    if (ADVENTURE_CITIES.some((city) => Math.hypot(x - city.x, y - city.y) < 250)) continue;

    if (
      Math.abs(x - 1800) < 420 &&
      Math.abs(y - 1200) < 300
    ) {
      continue;
    }

    trees.push({
      id: `tree-${i}`,
      x,
      y,
      r: 28 + rand() * 12,
    });
  }

  for (let i = 0; i < 65; i++) {
    const x = 80 + rand() * (WORLD.width - 160);
    const y = 80 + rand() * (WORLD.height - 160);
    if (ADVENTURE_CITIES.some((city) => Math.hypot(x - city.x, y - city.y) < 220)) continue;
    rocks.push({ id: `rock-${i}`, x, y, r: 13 + rand() * 13 });
  }

  return {
    trees,
    rocks,
  };
}

const WORLD_OBJECTS = buildWorld();

const NPCS = [
  {
    id: "elder",
    name: "Lumen",
    x: 1800,
    y: 1110,
    color: "#f4d35e",
    dialogue:
      "Benvenuto nel Cuore Verde. Qui inizia il Sentiero dei Sognatori.",
  },
  {
    id: "explorer",
    name: "Neri",
    x: 1300,
    y: 710,
    color: "#73c2fb",
    dialogue:
      "A nord c'è il Bosco delle Ombre. Di notte i sentieri cambiano completamente atmosfera.",
  },
  {
    id: "smith",
    name: "Brak",
    x: 2460,
    y: 1520,
    color: "#e76f51",
    dialogue:
      "Le montagne custodiscono segreti antichi. Ma non andarci senza prepararti.",
  },
];

const ZONES = [
  {
    name: "Prato dei Sogni",
    x: 0,
    y: 0,
    w: 1800,
    h: 1200,
    color: "#5b8f4d",
  },
  {
    name: "Bosco delle Ombre",
    x: 0,
    y: 1200,
    w: 1600,
    h: 1200,
    color: "#355c43",
  },
  {
    name: "Monti di Cenere",
    x: 1800,
    y: 1200,
    w: 1800,
    h: 1200,
    color: "#655d55",
  },
  {
    name: "Valle Dorata",
    x: 1800,
    y: 0,
    w: 1800,
    h: 1200,
    color: "#a38b45",
  },
];


/* Terreno HD pixel-art: variazioni organiche e dettagli per bioma, senza griglia piatta. */
function drawGroundTiles(ctx, camera, viewWidth, viewHeight, scale) {
  const tile = 48;
  const halfW = viewWidth / (2 * scale) + tile * 2;
  const halfH = viewHeight / (2 * scale) + tile * 2;
  const left = Math.max(0, Math.floor((camera.x - halfW) / tile) * tile);
  const right = Math.min(WORLD.width, camera.x + halfW);
  const top = Math.max(0, Math.floor((camera.y - halfH) / tile) * tile);
  const bottom = Math.min(WORLD.height, camera.y + halfH);
  const palettes = {
    "Prato dei Sogni": ["#568d49", "#5e984e", "#659f54", "#548747", "#70a85b"],
    "Bosco delle Ombre": ["#294f3b", "#315c42", "#386648", "#2c563d", "#416d4a"],
    "Monti di Cenere": ["#686258", "#746c60", "#7d7568", "#625d55", "#898071"],
    "Valle Dorata": ["#9a8242", "#a88d48", "#b29650", "#967c3d", "#baa15b"],
  };
  const flowerColors = ["#f4e8c4", "#e8a8c8", "#d7e9ef", "#f1cf72"];
  for (let y = top; y < bottom; y += tile) {
    for (let x = left; x < right; x += tile) {
      const zone = ZONES.find(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) || ZONES[0];
      const seed = Math.abs(((x / tile) * 73856093) ^ ((y / tile) * 19349663));
      const palette = palettes[zone.name];
      ctx.fillStyle = palette[seed % palette.length];
      ctx.fillRect(x, y, tile, tile);

      // Ombre e riflessi spezzano la ripetizione dei quadrati.
      ctx.fillStyle = "rgba(12,24,20,.07)";
      ctx.fillRect(x, y, tile, 3);
      ctx.fillRect(x, y, 3, tile);
      ctx.fillStyle = "rgba(235,224,170,.055)";
      ctx.fillRect(x + 5, y + 6, 17 + seed % 15, 3);
      ctx.fillRect(x + 10, y + 12, 4, 3);

      if (seed % 3 === 0) {
        const gx = x + 7 + seed % 29;
        const gy = y + 8 + (seed >> 3) % 27;
        ctx.fillStyle = zone.name === "Monti di Cenere" ? "#aaa08d" : zone.name === "Valle Dorata" ? "#d1b66a" : "#83b365";
        ctx.fillRect(gx, gy, 3, 7);
        ctx.fillRect(gx + 4, gy - 3, 3, 6);
        ctx.fillRect(gx + 8, gy + 1, 3, 5);
      }
      if (seed % 11 === 0 && zone.name !== "Monti di Cenere") {
        const fx = x + 12 + seed % 24;
        const fy = y + 13 + (seed >> 4) % 22;
        ctx.fillStyle = flowerColors[(seed >> 2) % flowerColors.length];
        ctx.fillRect(fx, fy, 4, 4);
        ctx.fillRect(fx + 4, fy - 3, 3, 3);
        ctx.fillStyle = "rgba(255,244,198,.65)";
        ctx.fillRect(fx + 1, fy - 2, 2, 2);
      }
      if (seed % 13 === 0) {
        ctx.fillStyle = "rgba(20,34,27,.16)";
        ctx.fillRect(x + 31, y + 32, 8, 3);
        ctx.fillRect(x + 34, y + 28, 3, 7);
      }
    }
  }
}

function circleRectCollision(
  cx,
  cy,
  radius,
  rx,
  ry,
  rw,
  rh
) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);

  return (
    Math.hypot(cx - closestX, cy - closestY) <
    radius
  );
}

export default function Avventura() {
  const canvasRef = useRef(null);
  const worldFrameRef = useRef(null);
  const sognatoreImagesRef = useRef(new Map());

  useEffect(() => {
    const images = new Map();
    ROSTER.forEach((sognatore) => {
      if (!sognatore?.nome || !sognatore?.img) return;
      const image = new Image();
      image.onload = () => sognatoreImagesRef.current.set(sognatore.nome.toLowerCase(), image);
      image.src = sognatore.img;
      images.set(sognatore.nome.toLowerCase(), image);
    });
    sognatoreImagesRef.current = images;
    return () => {
      images.forEach((image) => { image.onload = null; });
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const { user, isLoadingAuth, authChecked } = useAuth();

  const testerAllowed =
    !!user?.email &&
    TESTER_EMAILS.includes(
      user.email.toLowerCase()
    );

  /*
    ============================
    REFS PRINCIPALI
    ============================
  */

  const keysRef = useRef({});
  const interactRef = useRef(null);
  const battleOpenRef = useRef(false);
  const setCampaignPause = useCallback((paused) => { battleOpenRef.current = paused; }, []);

  const playerRef = useRef({
    ...PLAYER_START,
  });
  const playerFacingRef = useRef({ x: 0, y: -1 });

  const cameraRef = useRef({
    ...PLAYER_START,
  });

  const wildRef = useRef(
    WILD_STARTS.map((s) => ({
      ...s,
    }))
  );

  const challengerRef = useRef(
    CHALLENGERS.map((s) => ({
      ...s,
    }))
  );

  /*
    Cooldown reali.
    Usiamo ref perché il game loop gira continuamente
    e non deve dipendere dagli state React.
  */

  const challengerCooldownRef = useRef({});
  const wildCooldownRef = useRef({});

  /*
    Evitano che il requestAnimationFrame
    apra continuamente la stessa finestra.
  */

  const encounterOpenRef = useRef(false);
  const challengerEncounterOpenRef = useRef(false);

  const lastEntityRenderRef = useRef(0);

  /*
    ============================
    STATE
    ============================
  */

  const [player, setPlayer] = useState(
    playerRef.current
  );

const [message, setMessage] = useState("");

  const [dialogue, setDialogue] = useState(null);

  const [encounter, setEncounter] =
    useState(null);

  const [challengerEncounter, setChallengerEncounter] =
    useState(null);

  const [wildSognatori, setWildSognatori] =
    useState(WILD_STARTS);

  const [time, setTime] = useState(9);

  const zone = useMemo(() => {
    return (
      ZONES.find(
        (z) =>
          player.x >= z.x &&
          player.x < z.x + z.w &&
          player.y >= z.y &&
          player.y < z.y + z.h
      ) || ZONES[0]
    );
  }, [player]);

  /*
    ============================
    KEYBOARD
    ============================
  */

  useEffect(() => {
    const down = (e) => {
      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();

      keysRef.current[key] = true;
      keysRef.current[code] = true;

      if (key === "e" && !e.repeat) {
        e.preventDefault();
        interactRef.current?.();
      }

      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
        ].includes(key)
      ) {
        e.preventDefault();
      }
    };

    const up = (e) => {
      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();

      keysRef.current[key] = false;
      keysRef.current[code] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /*
    ============================
    GAME LOOP
    ============================
  */

  useEffect(() => {
    let animation;

    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min(
        (now - last) / 1000,
        0.05
      );

      last = now;

      if (battleOpenRef.current || encounterOpenRef.current || challengerEncounterOpenRef.current) {
        animation = requestAnimationFrame(loop);
        return;
      }

      const keys = keysRef.current;

      let dx = 0;
      let dy = 0;

      /*
        MOVIMENTO
      */

      if (
        keys.w ||
        keys.keyw ||
        keys.arrowup
      ) {
        dy -= 1;
      }

      if (
        keys.s ||
        keys.keys ||
        keys.arrowdown
      ) {
        dy += 1;
      }

      if (
        keys.a ||
        keys.keya ||
        keys.arrowleft
      ) {
        dx -= 1;
      }

      if (
        keys.d ||
        keys.keyd ||
        keys.arrowright
      ) {
        dx += 1;
      }

      if (dx || dy) {
        const length = Math.hypot(dx, dy);

        dx /= length;
        dy /= length;
        playerFacingRef.current = { x: dx, y: dy };

        const movement =
          PLAYER.speed * dt;

        const next = {
          x: clamp(
            playerRef.current.x +
              dx * movement,
            30,
            WORLD.width - 30
          ),

          y: clamp(
            playerRef.current.y +
              dy * movement,
            30,
            WORLD.height - 30
          ),
        };

        let blocked = false;

        /*
          ALBERI
        */

        for (const tree of WORLD_OBJECTS.trees) {
          if (
            Math.hypot(
              next.x - tree.x,
              next.y - tree.y
            ) <
            tree.r +
              PLAYER.size * 0.45
          ) {
            blocked = true;
            break;
          }
        }

        /*
          ROCCE
        */

        if (!blocked) {
          for (const rock of WORLD_OBJECTS.rocks) {
            if (
              Math.hypot(
                next.x - rock.x,
                next.y - rock.y
              ) <
              rock.r +
                PLAYER.size * 0.45
            ) {
              blocked = true;
              break;
            }
          }
        }

        /*
          LAGO
        */

        if (
          circleRectCollision(
            next.x,
            next.y,
            PLAYER.size * 0.45,
            1570,
            820,
            460,
            220
          )
        ) {
          blocked = true;
        }

        /*
          MOVIMENTO REALE
        */

        if (!blocked) {
          playerRef.current = next;

          setPlayer({
            ...next,
          });

        }
      }

      /*
        SOGNATORI SELVATICI E SFIDANTI STATICI.
        Le coordinate iniziali restano fisse: si muove soltanto il giocatore.
      */

      // Gli incontri non partono più automaticamente:
      // il giocatore sceglie quando interagire premendo E.
      /*
        ============================
        CAMERA
        ============================
      */

      const target =
        playerRef.current;

      cameraRef.current.x +=
        (target.x -
          cameraRef.current.x) *
        0.1;

      cameraRef.current.y +=
        (target.y -
          cameraRef.current.y) *
        0.1;

      /*
        ============================
        TEMPO
        ============================
      */

      setTime(
        (t) =>
          (t + dt * 0.03) % 24
      );

      animation =
        requestAnimationFrame(loop);
    };

    animation =
      requestAnimationFrame(loop);

    return () =>
      cancelAnimationFrame(
        animation
      );
  }, []);

  /*
    ============================
    CANVAS RENDER
    ============================
  */

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    const dpr =
      window.devicePixelRatio ||
      1;

    const resize = () => {
      const frame = worldFrameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    };

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    let frame;

    const draw = () => {
      const worldFrame = worldFrameRef.current;
      if (!worldFrame) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const rect = worldFrame.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(
        0,
        0,
        w,
        h
      );

      const cam =
        cameraRef.current;

      const scale = Math.min(w / 1100, h / 825);

      const offsetX =
        w / 2 -
        cam.x * scale;

      const offsetY =
        h / 2 -
        cam.y * scale;

      ctx.save();

      ctx.translate(
        offsetX,
        offsetY
      );

      ctx.scale(
        scale,
        scale
      );

      /*
        MONDO
      */

      ctx.fillStyle =
        "#203b29";

      ctx.fillRect(
        0,
        0,
        WORLD.width,
        WORLD.height
      );

      /*
        ZONE
      */

      for (const z of ZONES) {
        ctx.fillStyle =
          z.color;

        ctx.globalAlpha =
          0.82;

        ctx.fillRect(
          z.x,
          z.y,
          z.w,
          z.h
        );
      }

      ctx.globalAlpha = 1;

      // Dettaglio del terreno a tile GBA.
      drawGroundTiles(ctx, cam, w, h, scale);

      /* SENTIERI: bordi d'erba, terra calda e tracce di ghiaia. */
      const paths = [
        { x: 0, y: 1002, w: WORLD.width, h: 116, horizontal: true },
        { x: 1732, y: 0, w: 136, h: WORLD.height, horizontal: false },
        { x: 792, y: 542, w: 2116, h: 86, horizontal: true },
      ];
      for (const path of paths) {
        ctx.fillStyle = "rgba(37,42,29,.3)";
        ctx.fillRect(path.x, path.y, path.w, path.h);
        ctx.fillStyle = "#92744b";
        ctx.fillRect(path.x, path.y + 5, path.w, path.h - 10);
        ctx.fillStyle = "#c7a56a";
        ctx.fillRect(path.x, path.y + 9, path.w, path.h - 18);
        ctx.fillStyle = "rgba(246,218,157,.34)";
        ctx.fillRect(path.x, path.y + 12, path.w, 5);
        ctx.fillStyle = "rgba(102,76,47,.22)";
        ctx.fillRect(path.x, path.y + path.h - 15, path.w, 5);

        const step = 54;
        for (let n = 0; n < (path.horizontal ? path.w : path.h); n += step) {
          const px = path.horizontal ? path.x + n + ((n / step) % 2) * 9 : path.x + 24 + (n % 3) * 18;
          const py = path.horizontal ? path.y + 25 + (n % 3) * 17 : path.y + n + ((n / step) % 2) * 8;
          ctx.fillStyle = "rgba(245,220,171,.45)";
          ctx.fillRect(px, py, 7, 3);
          ctx.fillStyle = "rgba(106,79,49,.24)";
          ctx.fillRect(px + 13, py + 10, 5, 3);
        }
      }

      /*
        LAGO
      */

      ctx.fillStyle =
        "#276b82";

      ctx.beginPath();

      ctx.roundRect(
        1570,
        820,
        460,
        220,
        90
      );

      ctx.fill();

      ctx.strokeStyle = "rgba(122,218,229,.75)";
      ctx.lineWidth = 5;
      for (let y = 850; y < 1010; y += 38) {
        ctx.beginPath();
        ctx.moveTo(1610, y);
        ctx.quadraticCurveTo(1730, y - 18, 1840, y);
        ctx.stroke();
      }
      // Riflessi spezzati, rive in pietra e piccoli ciuffi sulle sponde.
      ctx.fillStyle = "#8bd6d8";
      ctx.fillRect(1640, 842, 32, 4);
      ctx.fillRect(1790, 900, 44, 4);
      ctx.fillRect(1680, 982, 24, 3);
      ctx.fillStyle = "#a9c77a";
      ctx.fillRect(1558, 866, 12, 5);
      ctx.fillRect(1548, 878, 8, 8);
      ctx.fillRect(2028, 944, 13, 5);
      ctx.fillRect(2034, 954, 8, 8);
      ctx.fillStyle = "#d5c18b";
      ctx.fillRect(1582, 824, 18, 5);
      ctx.fillRect(2004, 1035, 24, 5);

      /*
        EDIFICI RIMOSSI
        Le case non esplorabili sono state eliminate dal mondo.
      */

      /*
        ALBERI
      */

      for (const tree of WORLD_OBJECTS.trees) {
        drawTree(
          ctx,
          tree.x,
          tree.y,
          tree.r
        );
      }

      // I landmark sono disegnati dietro ai personaggi: ogni città ha un simbolo architettonico proprio.
      for (const city of ADVENTURE_CITIES) {
        drawCityLandmark(ctx, city);
      }

      /*
        ROCCE
      */

      for (const rock of WORLD_OBJECTS.rocks) {
        ctx.save();
        ctx.translate(Math.round(rock.x / 3) * 3, Math.round(rock.y / 3) * 3);
        ctx.fillStyle = "rgba(9,15,18,.28)";
        ctx.beginPath(); ctx.ellipse(3, rock.r * .62, rock.r * 1.25, rock.r * .42, 0, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = "#3e4548";
        ctx.beginPath();
        ctx.moveTo(-rock.r * 1.1, rock.r * .35);
        ctx.lineTo(-rock.r * .8, -rock.r * .35);
        ctx.lineTo(-rock.r * .18, -rock.r);
        ctx.lineTo(rock.r * .52, -rock.r * .72);
        ctx.lineTo(rock.r * 1.12, rock.r * .2);
        ctx.lineTo(rock.r * .72, rock.r * .7);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = "#727b7b";
        ctx.beginPath();
        ctx.moveTo(-rock.r * .8, -rock.r * .35);
        ctx.lineTo(-rock.r * .18, -rock.r);
        ctx.lineTo(rock.r * .1, -rock.r * .16);
        ctx.lineTo(-rock.r * .2, rock.r * .12);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = "#9da09a";
        ctx.fillRect(-rock.r * .16, -rock.r * .82, Math.max(3, rock.r * .22), Math.max(3, rock.r * .16));
        ctx.fillStyle = "#4e595b";
        ctx.fillRect(rock.r * .48, -rock.r * .35, Math.max(3, rock.r * .18), Math.max(3, rock.r * .28));
        ctx.fillStyle = "rgba(211,219,205,.35)";
        ctx.fillRect(-rock.r * .58, rock.r * .08, Math.max(3, rock.r * .2), 3);
        ctx.restore();
      }

      /*
        SOGNATORI NPC
        Gli artwork ufficiali vengono disegnati nel mondo, non in un layer HTML
        separato: così condividono scala, camera e profondità con il giocatore.
      */
      for (const wild of wildRef.current) {
        const image = sognatoreImagesRef.current.get(wild.name.toLowerCase());
        if (!image?.complete || !image.naturalWidth) continue;

        const maxWidth = 116;
        const maxHeight = 112;
        const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        const left = Math.round(wild.x - drawWidth / 2);
        const top = Math.round(wild.y - drawHeight);

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.fillStyle = "rgba(5,12,9,.42)";
        ctx.beginPath();
        ctx.ellipse(wild.x, wild.y - 2, Math.max(15, drawWidth * .31), 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "rgba(0,0,0,.32)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 3;
        ctx.drawImage(image, left, top, drawWidth, drawHeight);
        ctx.restore();

        if (Math.hypot(playerRef.current.x - wild.x, playerRef.current.y - wild.y) < 190) {
          ctx.save();
          ctx.font = "bold 13px system-ui";
          ctx.textAlign = "center";
          const labelWidth = ctx.measureText(wild.name).width + 18;
          ctx.fillStyle = "rgba(8,16,13,.82)";
          ctx.fillRect(wild.x - labelWidth / 2, top - 24, labelWidth, 19);
          ctx.fillStyle = "#f3f0df";
          ctx.fillText(wild.name, wild.x, top - 10);
          ctx.restore();
        }
      }

      /*
        NPC
      */

      for (const npc of NPCS) {
        drawNpc(ctx, npc);
      }

      /*
        PLAYER
      */

      drawPlayer(
        ctx,
        playerRef.current
      );

      /*
        ZONE LABEL
      */

      ctx.fillStyle =
        "rgba(0,0,0,.35)";

      ctx.roundRect(
        playerRef.current.x -
          180,
        playerRef.current.y -
          120,
        360,
        50,
        20
      );

      ctx.fill();

      ctx.fillStyle =
        "#fff";

      ctx.font =
        "700 22px system-ui";

      ctx.textAlign =
        "center";

      ctx.fillText(
        zone.name,
        playerRef.current.x,
        playerRef.current.y -
          88
      );

      ctx.restore();

      /*
        NOTTE
      */

      const night =
        time > 20 ||
        time < 6
          ? 0.46
          : time > 18
          ? ((time - 18) /
              2) *
            0.46
          : 0;

      if (night > 0) {
        ctx.fillStyle =
          `rgba(8,15,40,${night})`;

        ctx.fillRect(
          0,
          0,
          w,
          h
        );
      }

      frame =
        requestAnimationFrame(
          draw
        );
    };

    frame =
      requestAnimationFrame(
        draw
      );

    return () => {
      cancelAnimationFrame(
        frame
      );

      window.removeEventListener(
        "resize",
        resize
      );
    };
  }, [
    player,
    zone,
    time,
  ]);

  /*
    ============================
    INTERAZIONE NPC
    ============================
  */

  const interact = () => {
    if (dialogue || encounter || challengerEncounter || battleOpenRef.current) return;

    const currentPosition = playerRef.current;
    const interactionRadius = 105;

    const nearestNpc = NPCS
      .map((npc) => ({ ...npc, interactionDistance: distance(currentPosition, npc) }))
      .filter((npc) => npc.interactionDistance < interactionRadius)
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestNpc) {
      setDialogue(nearestNpc);
      return;
    }

    const nearestChallenger = challengerRef.current
      .map((challenger) => ({
        ...challenger,
        interactionDistance: distance(currentPosition, challenger),
      }))
      .filter((challenger) =>
        challenger.interactionDistance < interactionRadius &&
        Date.now() >= (challengerCooldownRef.current[challenger.id] || 0)
      )
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestChallenger) {
      challengerEncounterOpenRef.current = true;
      setChallengerEncounter(nearestChallenger);
      return;
    }

    const nearestWild = wildRef.current
      .map((sognatore) => ({
        ...sognatore,
        interactionDistance: distance(currentPosition, sognatore),
      }))
      .filter((sognatore) =>
        sognatore.interactionDistance < interactionRadius &&
        Date.now() >= (wildCooldownRef.current[sognatore.id] || 0)
      )
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestWild) {
      encounterOpenRef.current = true;
      setEncounter(nearestWild);
      return;
    }

    setMessage("Avvicinati a un personaggio o a un Sognatore e premi E.");
    setTimeout(() => setMessage(""), 1800);
  };

  interactRef.current = interact;

  /*
    ============================
    ACCESSO
    ============================
  */

  if (
    isLoadingAuth ||
    !authChecked
  ) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
          Controllo accesso tester...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!testerAllowed) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /*
    ============================
    RETURN
    ============================
  */

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-screen flex-col items-center justify-between overflow-hidden bg-[#090d0a] px-2 py-2 text-white select-none touch-none">
      <div className="flex w-full max-w-[1100px] items-center justify-between px-2">
        <div className="text-xs font-black tracking-[.25em] text-emerald-100/70">SOGNATORI · AVVENTURA</div>
        <div className="text-xs font-bold text-white/60">{zone.name}</div>
      </div>
      <div ref={worldFrameRef} className="relative aspect-[4/3] w-full max-w-[min(100vw,calc((100dvh-190px)*4/3))] shrink overflow-hidden rounded-lg border-4 border-[#536b50] bg-black shadow-[0_0_0_2px_#172719,0_12px_40px_rgba(0,0,0,.55)]">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none h-full w-full" />

      <div className="pointer-events-none absolute inset-0">
      {/* =====================================
            SFIDANTI
            ===================================== */}

        {challengerRef.current.map(
          (c) => {
            const frame = worldFrameRef.current;
            const w = frame?.clientWidth || 0;
            const h = frame?.clientHeight || 0;
            const scale = Math.min(w / 1100, h / 825);

            const sx =
              w / 2 +
              (c.x - player.x) *
                scale;

            const sy =
              h / 2 +
              (c.y - player.y) *
                scale;

            if (
              sx < -120 ||
              sx > w + 120 ||
              sy < -150 ||
              sy > h + 150
            ) {
              return null;
            }

            const cooldownUntil =
              challengerCooldownRef
                .current[c.id] ||
              0;

            const available =
              Date.now() >=
              cooldownUntil;

            const close =
              available &&
              Math.hypot(
                player.x - c.x,
                player.y - c.y
              ) < c.vision;

            return (
              <div
                key={c.id}
                className="absolute -translate-x-1/2 -translate-y-full"
                style={{
                  left: sx,
                  top: sy,
                  opacity: available
                    ? 1
                    : 0.55,
                }}
              >
                {close && (
                  <div className="mb-1 rounded-full border border-amber-300/30 bg-amber-950/85 px-2 py-0.5 text-[8px] font-black text-amber-100">
                    E · PARLA
                  </div>
                )}

                <div className="mx-auto flex h-[76px] w-[68px] items-end justify-center">
                  <AdventureTravelerSprite traveler={c.name} faction={c.faction} size={66} />
                </div>

              </div>
            );
          }
        )}
      </div>
      </div>

      {/* CONTROLLI ESTERNI AL MONDO */}
      <div className="flex w-full max-w-[1100px] items-center justify-between gap-3 px-2 pb-1">
        <div className="grid grid-cols-3 gap-1 touch-none">
          <span />
          <button aria-label="Su" onPointerDown={(e) => { e.preventDefault(); keysRef.current.arrowup = true; }} onPointerUp={() => { keysRef.current.arrowup = false; }} onPointerLeave={() => { keysRef.current.arrowup = false; }} className="h-11 w-11 rounded-lg border border-white/15 bg-[#263629] text-xl font-black active:bg-emerald-700">▲</button>
          <span />
          {["arrowleft","arrowdown","arrowright"].map((key) => <button key={key} aria-label={key} onPointerDown={(e) => { e.preventDefault(); keysRef.current[key] = true; }} onPointerUp={() => { keysRef.current[key] = false; }} onPointerLeave={() => { keysRef.current[key] = false; }} className="h-11 w-11 rounded-lg border border-white/15 bg-[#263629] text-xl font-black active:bg-emerald-700">{key === "arrowleft" ? "◀" : key === "arrowdown" ? "▼" : "▶"}</button>)}
        </div>
        <div className="hidden text-center text-[10px] font-bold leading-5 text-white/45 sm:block">WASD / FRECCE<br/>PER MUOVERTI</div>
        <button type="button" onClick={interact} className="rounded-xl border border-emerald-200/30 bg-emerald-300 px-5 py-4 text-xs font-black tracking-wide text-[#142116] shadow-lg active:scale-95">E · INTERAGISCI</button>
      </div>

      {message && (
        <div className="fixed bottom-24 left-1/2 z-[65] -translate-x-1/2 rounded-full border border-white/15 bg-black/85 px-5 py-3 text-center text-xs font-bold shadow-2xl">
          {message}
        </div>
      )}
      {/* =====================================
          DIALOGO NPC
          ===================================== */}

      {dialogue && (
        <div className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-3xl rounded-3xl border border-white/15 bg-black/85 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 text-sm font-black uppercase tracking-widest text-yellow-200">
            {dialogue.name}
          </div>

          <div className="text-base leading-7 text-white/85">
            {dialogue.dialogue}
          </div>

          <button
            type="button"
            onClick={() =>
              setDialogue(null)
            }
            className="mt-5 rounded-xl bg-white px-5 py-2 text-sm font-black text-black"
          >
            Continua
          </button>
        </div>
      )}

      <AdventureCampaign
        menuContent={(
      <div className="space-y-3">

      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl border border-white/15 bg-black/60 px-5 py-4 shadow-2xl backdrop-blur-md">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">
            Sognatori
          </div>

          <div className="mt-1 text-2xl font-black">
            AVVENTURA
          </div>

          <div className="mt-1 text-sm text-white/60">
            {zone.name}
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-black/60 px-5 py-4 text-right shadow-2xl backdrop-blur-md">
          <div className="mt-1 text-xs text-white/50">
            Ore{" "}
            {String(
              Math.floor(time)
            ).padStart(2, "0")}
            :
            {String(
              Math.floor(
                (time % 1) * 60
              )
            ).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="h-36 w-full overflow-hidden rounded-xl border border-white/15 bg-black/60 shadow-lg backdrop-blur-md">
        <div className="relative h-full w-full">
          {ZONES.map((z) => (
            <div
              key={z.name}
              className="absolute"
              style={{
                left: `${
                  (z.x /
                    WORLD.width) *
                  100
                }%`,

                top: `${
                  (z.y /
                    WORLD.height) *
                  100
                }%`,

                width: `${
                  (z.w /
                    WORLD.width) *
                  100
                }%`,

                height: `${
                  (z.h /
                    WORLD.height) *
                  100
                }%`,

                background:
                  z.color,

                opacity: 0.8,
              }}
            />
          ))}
          {ADVENTURE_CITIES.map((city) => (
            <div key={city.id} title={city.city + " · " + city.faction} className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/60" style={{ left: (city.x / WORLD.width * 100) + "%", top: (city.y / WORLD.height * 100) + "%", background: city.color }} />
          ))}

          <div
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_white]"
            style={{
              left: `${
                (player.x /
                  WORLD.width) *
                100
              }%`,

              top: `${
                (player.y /
                  WORLD.height) *
                100
              }%`,
            }}
          />
        </div>
      </div>
          <GlobalMusicPlayer insideAdventureMenu />
      </div>
        )}
        userKey={user?.id || user?.email}
        player={player}
        facing={playerFacingRef.current}
        walking={!!(keysRef.current.w || keysRef.current.a || keysRef.current.s || keysRef.current.d || keysRef.current.arrowup || keysRef.current.arrowdown || keysRef.current.arrowleft || keysRef.current.arrowright)}
        encounter={challengerEncounter}
        wildEncounter={encounter}
        onClose={() => {
          if (challengerEncounter?.id) challengerCooldownRef.current[challengerEncounter.id] = Date.now() + 30000;
          challengerEncounterOpenRef.current = false;
          setChallengerEncounter(null);
        }}
        onPauseChange={setCampaignPause}
        onWildClose={(recruited) => {
          if (encounter?.id) {
            wildCooldownRef.current[encounter.id] = Date.now() + 20000;
            if (recruited) {
              wildRef.current = wildRef.current.filter((s) => s.id !== encounter.id);
              setWildSognatori(wildRef.current.map((s) => ({ ...s })));
              setMessage("✦ " + encounter.name + " ha scelto di viaggiare con te!");
              setTimeout(() => setMessage(""), 2200);
            }
          }
          encounterOpenRef.current = false;
          setEncounter(null);
        }}
      />
    </div>
  );
}

/*
  ============================================
  PLAYER
  ============================================
*/

function drawPlayer(ctx, p) {
  // Protagonista pixel-art con silhouette, zaino e accessori leggibili.
  ctx.save();
  ctx.translate(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4);

  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(1, 19, 19, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Zaino e spallacci.
  ctx.fillStyle = "#49362d";
  ctx.fillRect(-14, -12, 8, 22);
  ctx.fillStyle = "#9a623d";
  ctx.fillRect(-15, -10, 7, 14);
  ctx.fillStyle = "#d49a55";
  ctx.fillRect(-14, -8, 4, 5);
  ctx.fillStyle = "#55382c";
  ctx.fillRect(-8, -12, 4, 17);
  ctx.fillRect(5, -12, 4, 17);

  // Gambe, pantaloni e stivali.
  ctx.fillStyle = "#26344e";
  ctx.fillRect(-9, 5, 8, 12);
  ctx.fillRect(2, 5, 8, 12);
  ctx.fillStyle = "#40577e";
  ctx.fillRect(-8, 7, 5, 7);
  ctx.fillRect(3, 7, 5, 7);
  ctx.fillStyle = "#30272a";
  ctx.fillRect(-11, 15, 10, 5);
  ctx.fillRect(2, 15, 11, 5);
  ctx.fillStyle = "#b88955";
  ctx.fillRect(-10, 15, 7, 2);
  ctx.fillRect(3, 15, 7, 2);

  // Giacca da viaggiatore a strati.
  ctx.fillStyle = "#8e452f";
  ctx.fillRect(-13, -14, 26, 22);
  ctx.fillStyle = "#d36b3f";
  ctx.fillRect(-10, -13, 20, 18);
  ctx.fillStyle = "#f0ad52";
  ctx.fillRect(-7, -12, 14, 14);
  ctx.fillStyle = "#8e452f";
  ctx.fillRect(-2, -12, 4, 17);
  ctx.fillStyle = "#f6d18a";
  ctx.fillRect(-1, -8, 2, 3);
  ctx.fillRect(-1, -1, 2, 3);

  // Braccia con guanti e polsini.
  ctx.fillStyle = "#d99b70";
  ctx.fillRect(-17, -11, 5, 14);
  ctx.fillRect(12, -11, 5, 14);
  ctx.fillStyle = "#c45c3d";
  ctx.fillRect(-17, -13, 5, 5);
  ctx.fillRect(12, -13, 5, 5);
  ctx.fillStyle = "#302a32";
  ctx.fillRect(-17, 1, 6, 5);
  ctx.fillRect(11, 1, 6, 5);

  // Collo, volto e capelli.
  ctx.fillStyle = "#b87956";
  ctx.fillRect(-5, -19, 10, 7);
  ctx.fillStyle = "#efc49a";
  ctx.fillRect(-10, -34, 20, 17);
  ctx.fillStyle = "#d99f78";
  ctx.fillRect(-10, -23, 4, 5);
  ctx.fillRect(6, -23, 4, 5);
  ctx.fillStyle = "#33272a";
  ctx.fillRect(-11, -36, 22, 7);
  ctx.fillRect(-9, -41, 18, 6);
  ctx.fillRect(-12, -33, 5, 7);
  ctx.fillRect(7, -34, 5, 6);
  ctx.fillStyle = "#f2bd55";
  ctx.fillRect(-12, -42, 24, 5);
  ctx.fillRect(-7, -46, 14, 4);
  ctx.fillStyle = "#f7d58b";
  ctx.fillRect(-7, -41, 13, 2);
  ctx.fillStyle = "#29242a";
  ctx.fillRect(-6, -27, 3, 3);
  ctx.fillRect(4, -27, 3, 3);

  // Sciarpa rossa, elemento iconico del protagonista.
  ctx.fillStyle = "#7e2638";
  ctx.fillRect(-8, -17, 16, 5);
  ctx.fillStyle = "#d84e4d";
  ctx.fillRect(-7, -17, 14, 3);
  ctx.fillRect(5, -14, 5, 15);
  ctx.fillStyle = "#f08a65";
  ctx.fillRect(6, -13, 2, 8);

  // Riflessi pixel e dettagli del tessuto.
  ctx.fillStyle = "rgba(255,226,163,.55)";
  ctx.fillRect(-8, -11, 3, 2);
  ctx.fillRect(6, -9, 2, 4);
  ctx.fillStyle = "#e6bd79";
  ctx.fillRect(-9, 4, 3, 2);
  ctx.fillRect(6, 4, 3, 2);
  ctx.restore();
}
/*
  ============================================
  TREE
  ============================================
*/

function drawTree(ctx, x, y, r) {
  const size = Math.max(32, Math.round(r * 1.9 / 4) * 4);
  const left = Math.round(x - size / 2);
  const top = Math.round(y - size * 1.38);
  ctx.save();
  ctx.fillStyle = "rgba(7,18,15,.3)";
  ctx.beginPath();
  ctx.ellipse(x + 7, y + 17, size * .62, size * .2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tronco leggibile sotto la chioma.
  ctx.fillStyle = "#493426";
  ctx.fillRect(x - 7, y - 8, 14, 34);
  ctx.fillStyle = "#795039";
  ctx.fillRect(x - 3, y - 5, 5, 27);
  ctx.fillStyle = "#a4774c";
  ctx.fillRect(x + 3, y + 1, 3, 13);

  // Chioma a livelli, con masse sovrapposte e luce dall'alto a sinistra.
  ctx.fillStyle = "#173d2b";
  ctx.fillRect(left + size * .22, top + size * .28, size * .58, size * .66);
  ctx.fillRect(left + size * .08, top + size * .43, size * .84, size * .38);
  ctx.fillRect(left + size * .31, top + size * .08, size * .42, size * .72);

  ctx.fillStyle = "#24583a";
  ctx.fillRect(left + size * .2, top + size * .3, size * .6, size * .54);
  ctx.fillRect(left + size * .12, top + size * .47, size * .76, size * .27);
  ctx.fillRect(left + size * .34, top + size * .16, size * .34, size * .56);

  ctx.fillStyle = "#397b48";
  ctx.fillRect(left + size * .24, top + size * .24, size * .22, size * .17);
  ctx.fillRect(left + size * .49, top + size * .18, size * .2, size * .15);
  ctx.fillRect(left + size * .12, top + size * .48, size * .23, size * .14);
  ctx.fillRect(left + size * .58, top + size * .46, size * .23, size * .14);

  ctx.fillStyle = "#65a65b";
  ctx.fillRect(left + size * .29, top + size * .23, size * .13, size * .08);
  ctx.fillRect(left + size * .52, top + size * .2, size * .1, size * .07);
  ctx.fillRect(left + size * .17, top + size * .48, size * .1, size * .07);
  ctx.fillStyle = "rgba(179,215,116,.65)";
  ctx.fillRect(left + size * .34, top + size * .14, size * .08, size * .05);

  // Piccoli ciuffi laterali: chioma meno geometrica e più naturale.
  ctx.fillStyle = "#2d6841";
  ctx.fillRect(left + size * .02, top + size * .55, size * .2, size * .17);
  ctx.fillRect(left + size * .76, top + size * .39, size * .2, size * .2);
  ctx.restore();
}

/*
  ============================================
  HOUSE
  ============================================
*/

function drawHouse(ctx, x, y, color) {
  ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(x - 8, y + 112, 208, 30);
  ctx.fillStyle = "#3a2925"; ctx.fillRect(x - 12, y - 54, 214, 72); ctx.fillRect(x + 4, y - 72, 178, 24);
  ctx.fillStyle = "#754638"; ctx.fillRect(x - 5, y - 50, 200, 58);
  ctx.fillStyle = "#9a5c43";
  for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) ctx.fillRect(x + col * 28 + (row % 2) * 8, y - 44 + row * 13, 18, 5);
  ctx.fillStyle = color; ctx.fillRect(x + 8, y + 5, 174, 105);
  ctx.fillStyle = "#d8bd91"; ctx.fillRect(x + 75, y + 58, 38, 52);
  ctx.fillStyle = "#4b3025"; ctx.fillRect(x + 80, y + 62, 28, 48);
  ctx.fillStyle = "#82c9d8"; ctx.fillRect(x + 24, y + 28, 34, 30); ctx.fillRect(x + 132, y + 28, 34, 30);
  ctx.fillStyle = "#e7e0bd"; ctx.fillRect(x + 39, y + 28, 4, 30); ctx.fillRect(x + 24, y + 41, 34, 4); ctx.fillRect(x + 147, y + 28, 4, 30); ctx.fillRect(x + 132, y + 41, 34, 4);
}

/*
  ============================================
  NPC
  ============================================
*/

function drawNpc(ctx, npc) {
  ctx.save();
  ctx.translate(Math.round(npc.x / 3) * 3, Math.round(npc.y / 3) * 3);
  ctx.imageSmoothingEnabled = false;

  // Ombra a terra e piedi ben separati.
  ctx.fillStyle = "rgba(7,14,18,.34)";
  ctx.beginPath(); ctx.ellipse(1, 22, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#302b36";
  ctx.fillRect(-10, 12, 8, 9); ctx.fillRect(3, 12, 8, 9);
  ctx.fillStyle = "#b68a5d";
  ctx.fillRect(-10, 18, 8, 3); ctx.fillRect(3, 18, 8, 3);

  // Mantello, tunica e cintura.
  ctx.fillStyle = "#273449";
  ctx.fillRect(-13, -5, 26, 20);
  ctx.fillRect(-16, -2, 5, 13); ctx.fillRect(11, -2, 5, 13);
  ctx.fillStyle = npc.color;
  ctx.fillRect(-11, -8, 22, 20);
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.fillRect(-8, -6, 5, 13);
  ctx.fillStyle = "#e5c17f";
  ctx.fillRect(-10, 8, 20, 3);
  ctx.fillRect(-2, 6, 4, 6);

  // Braccia, collo e volto.
  ctx.fillStyle = "#d99e79";
  ctx.fillRect(-16, -5, 5, 13); ctx.fillRect(11, -5, 5, 13);
  ctx.fillRect(-4, -15, 8, 8);
  ctx.fillStyle = "#efc69f";
  ctx.fillRect(-10, -31, 20, 19);
  ctx.fillStyle = "#b97759";
  ctx.fillRect(-10, -17, 3, 4); ctx.fillRect(7, -17, 3, 4);

  // Capelli e copricapo con un tratto distintivo per gli NPC.
  ctx.fillStyle = npc.id === "elder" ? "#e5e0d0" : npc.id === "smith" ? "#49312b" : "#34465a";
  ctx.fillRect(-11, -33, 22, 7);
  ctx.fillRect(-9, -37, 18, 6);
  if (npc.id === "elder") {
    ctx.fillRect(-13, -29, 4, 13); ctx.fillRect(9, -29, 4, 13);
    ctx.fillStyle = "#f4d35e"; ctx.fillRect(-13, -40, 26, 3);
  } else if (npc.id === "smith") {
    ctx.fillStyle = "#d5a15a"; ctx.fillRect(-13, -39, 26, 5);
    ctx.fillStyle = "#754b34"; ctx.fillRect(-8, -44, 16, 6);
  } else {
    ctx.fillStyle = "#7fc5e8"; ctx.fillRect(-11, -39, 22, 3);
    ctx.fillRect(8, -37, 5, 9);
  }
  ctx.fillStyle = "#282532";
  ctx.fillRect(-6, -23, 3, 3); ctx.fillRect(4, -23, 3, 3);
  ctx.fillStyle = "#fff0d4";
  ctx.fillRect(-4, -15, 8, 2);

  // Piccolo nome su targhetta scura, senza badge flottante.
  ctx.fillStyle = "rgba(12,18,27,.82)";
  ctx.fillRect(-29, 29, 58, 16);
  ctx.fillStyle = npc.color;
  ctx.fillRect(-29, 29, 3, 16);
  ctx.fillStyle = "#fff4df";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(npc.name, 0, 41);
  ctx.restore();
}

function drawCityLandmark(ctx, city) {
  const x = Math.round(city.x / 4) * 4;
  const y = Math.round((city.y - 66) / 4) * 4;
  const accent = city.color || "#e5c17f";
  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled = false;

  // Piattaforma in pietra, ombra e iscrizione della città.
  ctx.fillStyle = "rgba(5,12,18,.32)";
  ctx.fillRect(-48, 27, 96, 12);
  ctx.fillStyle = "#4a4a50";
  ctx.fillRect(-46, 17, 92, 12);
  ctx.fillStyle = "#77747a";
  ctx.fillRect(-42, 17, 84, 5);
  ctx.fillStyle = accent;
  ctx.fillRect(-34, 13, 68, 3);

  // Ogni città ha un landmark astratto diverso dalla propria fazione.
  switch (city.faction) {
    case "Demone":
      ctx.fillStyle = "#4c2838"; ctx.fillRect(-27, -17, 54, 32);
      ctx.fillStyle = "#b94e5d"; ctx.fillRect(-22, -25, 44, 12);
      ctx.fillStyle = "#e98b69";
      ctx.beginPath(); ctx.moveTo(-25, -22); ctx.lineTo(-40, -48); ctx.lineTo(-12, -31); ctx.fill();
      ctx.beginPath(); ctx.moveTo(25, -22); ctx.lineTo(40, -48); ctx.lineTo(12, -31); ctx.fill();
      ctx.fillStyle = "#f3c477"; ctx.fillRect(-4, -12, 8, 18); break;
    case "Robot":
      ctx.fillStyle = "#344d62"; ctx.fillRect(-27, -25, 54, 42);
      ctx.fillStyle = "#65c3c6"; ctx.fillRect(-18, -17, 36, 23);
      ctx.fillStyle = "#c8e6d9"; ctx.fillRect(-4, -42, 8, 17);
      ctx.fillRect(-35, -7, 8, 20); ctx.fillRect(27, -7, 8, 20);
      ctx.fillStyle = "#193444"; ctx.fillRect(-11, -10, 7, 6); ctx.fillRect(4, -10, 7, 6); break;
    case "Natura":
      ctx.fillStyle = "#5a4930"; ctx.fillRect(-8, -25, 16, 42);
      ctx.fillStyle = "#38734b";
      ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(-31, -13); ctx.lineTo(31, -13); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(-38, 0); ctx.lineTo(38, 0); ctx.fill();
      ctx.fillStyle = "#b7d77d"; ctx.fillRect(-3, -38, 6, 8); break;
    case "Nuvola":
      ctx.fillStyle = "#6b82ad"; ctx.fillRect(-6, -20, 12, 37);
      ctx.fillStyle = "#c6d8f2";
      ctx.beginPath(); ctx.arc(-14, -24, 16, 0, Math.PI * 2); ctx.arc(8, -31, 22, 0, Math.PI * 2); ctx.arc(25, -20, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8bbbe3"; ctx.fillRect(-3, -14, 6, 25); break;
    case "Umano":
      ctx.fillStyle = "#73513d"; ctx.fillRect(-31, -19, 62, 36);
      ctx.fillStyle = "#d5a36c"; ctx.fillRect(-24, -12, 48, 26);
      ctx.fillStyle = "#483b3a"; ctx.fillRect(-7, -34, 14, 51);
      ctx.fillStyle = "#f0d5a1"; ctx.fillRect(-3, -27, 6, 8); break;
    case "Luce":
      ctx.fillStyle = "#a47e36"; ctx.fillRect(-8, -18, 16, 35);
      ctx.fillStyle = "#f3df9a";
      for (let n = 0; n < 8; n++) { const a = n * Math.PI / 4; ctx.fillRect(Math.cos(a) * 27 - 3, -34 + Math.sin(a) * 27, 6, 13); }
      ctx.fillStyle = "#fff0bc"; ctx.beginPath(); ctx.arc(0, -34, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e2b94f"; ctx.beginPath(); ctx.arc(0, -34, 8, 0, Math.PI * 2); ctx.fill(); break;
    case "Dolce":
      ctx.fillStyle = "#a45d92"; ctx.fillRect(-26, -16, 52, 33);
      ctx.fillStyle = "#f0b2d4"; ctx.fillRect(-20, -28, 40, 12);
      ctx.fillStyle = "#fff0df"; ctx.fillRect(-13, -9, 26, 21);
      ctx.fillStyle = "#e48bbb"; ctx.fillRect(-4, -23, 8, 7); break;
    case "Marino":
      ctx.fillStyle = "#286d83"; ctx.fillRect(-27, -15, 54, 32);
      ctx.fillStyle = "#65c8d2";
      ctx.beginPath(); ctx.moveTo(-28, -16); ctx.lineTo(-42, -42); ctx.lineTo(-8, -24); ctx.fill();
      ctx.beginPath(); ctx.moveTo(28, -16); ctx.lineTo(42, -42); ctx.lineTo(8, -24); ctx.fill();
      ctx.fillStyle = "#d2eff0"; ctx.fillRect(-5, -34, 10, 40);
      ctx.fillStyle = "#1e526d"; ctx.fillRect(-17, -5, 34, 5); break;
    case "Orso":
      ctx.fillStyle = "#684a32"; ctx.fillRect(-29, -15, 58, 32);
      ctx.fillStyle = "#b78b56";
      ctx.beginPath(); ctx.moveTo(-29, -14); ctx.lineTo(-38, -43); ctx.lineTo(-9, -24); ctx.fill();
      ctx.beginPath(); ctx.moveTo(29, -14); ctx.lineTo(38, -43); ctx.lineTo(9, -24); ctx.fill();
      ctx.fillStyle = "#e3c18a"; ctx.fillRect(-15, -7, 30, 18);
      ctx.fillStyle = "#513b2e"; ctx.fillRect(-5, -2, 10, 6); break;
    case "Mago":
      ctx.fillStyle = "#59447e"; ctx.fillRect(-26, -18, 52, 35);
      ctx.fillStyle = "#b19ae7";
      ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(-30, -14); ctx.lineTo(30, -14); ctx.fill();
      ctx.fillStyle = "#f2d68a"; ctx.fillRect(-4, -35, 8, 8);
      ctx.fillStyle = "#d4c3f4"; ctx.fillRect(-2, -10, 4, 22); break;
    case "Salato":
      ctx.fillStyle = "#60696a"; ctx.fillRect(-27, -17, 54, 34);
      ctx.fillStyle = "#c7c6b8";
      ctx.beginPath(); ctx.moveTo(0, -61); ctx.lineTo(-23, -16); ctx.lineTo(0, -25); ctx.lineTo(23, -16); ctx.fill();
      ctx.fillStyle = "#e8d8b1"; ctx.fillRect(-5, -12, 10, 22); break;
    default:
      ctx.fillStyle = accent; ctx.fillRect(-20, -22, 40, 39);
  }

  // Gemma luminosa centrale e piccoli pixel di riflesso.
  ctx.fillStyle = "#fff0bd";
  ctx.fillRect(-2, 2, 4, 4);
  ctx.fillStyle = "rgba(255,255,255,.48)";
  ctx.fillRect(-30, 20, 12, 2);
  ctx.fillRect(18, 20, 12, 2);
  ctx.restore();
}

