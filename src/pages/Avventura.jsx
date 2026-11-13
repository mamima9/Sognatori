// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ROSTER } from "@/lib/sognatoriData";
import AdventureCampaign from "@/components/game/AdventureCampaign";
import GlobalMusicPlayer from "@/components/game/GlobalMusicPlayer";
import { ADVENTURE_CITIES, ADVENTURE_WILD_AREAS, buildCityTeam } from "@/lib/adventureCampaignData";
import { drawAdventureTraveler, drawAdventureWildSognatore } from "@/lib/adventurePixelSprites";

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

// Due esemplari di OGNI Sognatore del roster, non soltanto quelli delle 11 aree.
const WILD_STARTS = ROSTER.flatMap((sognatore, index) =>
  [0, 1].map((copy) => {
    const slot = index * 2 + copy;
    const columns = 8;
    const column = slot % columns;
    const row = Math.floor(slot / columns);
    return {
      id: "wild-" + sognatore.id + "-" + (copy + 1),
      rosterId: sognatore.id,
      x: 230 + column * 445 + (copy === 0 ? -54 : 54),
      y: 190 + row * 285 + (copy === 0 ? -34 : 34),
      name: sognatore.nome,
    };
  })
);

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

/* Sei case visitabili per città, ognuna con un abitante. */
const HOUSE_OFFSETS = [
  [-132, -88], [0, -158], [132, -88],
  [-132, 88], [132, 88], [0, 158],
];
const HOUSE_RESIDENTS = [
  ["Elda", "La strada fuori è piena di storie. Fermati un momento: ogni sogno ha bisogno di riposo."],
  ["Timo", "Colleziono mappe e racconti. Ogni angolo di questo mondo nasconde qualcosa."],
  ["Nora", "Le città cambiano grazie a chi le attraversa. Lascia qui un ricordo del tuo viaggio."],
  ["Berto", "Hai visto il paesaggio fuori? Ogni fazione ha costruito la propria casa a modo suo."],
  ["Lumi", "Non avere fretta. I dettagli più belli si notano solo quando ci si ferma."],
  ["Riko", "Un giorno queste strade saranno piene di altri sognatori. Continua a esplorare!"],
];
const ADVENTURE_HOUSES = ADVENTURE_CITIES.flatMap((city) =>
  HOUSE_OFFSETS.map(([ox, oy], index) => ({
    id: city.id + "-house-" + index,
    city,
    x: city.x + ox * 1.55,
    y: city.y + oy * 1.55,
    resident: HOUSE_RESIDENTS[index][0],
    dialogue: HOUSE_RESIDENTS[index][1],
    number: index + 1,
  }))
);

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

function collidesWithCityBuildings(x, y, radius) {
  const cityScale = 1.55;
  const offsets = [
    [-132, -88], [0, -158], [132, -88],
    [-132, 88], [132, 88], [0, 158],
  ].map(([x, y]) => [x * cityScale, y * cityScale]);
  return ADVENTURE_CITIES.some((city) =>
    offsets.some(([bx, by], index) => {
      const w = (index % 3 === 0 ? 62 : 54) * cityScale;
      const h = (index % 2 === 0 ? 48 : 56) * cityScale;
      return circleRectCollision(
        x,
        y,
        radius,
        city.x + bx - w / 2 - 5,
        city.y + by - h / 2 - 12,
        w + 10,
        h + 31
      );
    })
  );
}

export default function Avventura() {
  const canvasRef = useRef(null);
  const worldFrameRef = useRef(null);
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
  const [interior, setInterior] = useState(null);

  const [encounter, setEncounter] =
    useState(null);

  const [challengerEncounter, setChallengerEncounter] =
    useState(null);

  const [time, setTime] = useState(9);

  const zone = useMemo(() => {
    const wildArea = ADVENTURE_WILD_AREAS.find((area) =>
      Math.hypot(player.x - area.x, player.y - area.y) <= area.radius
    );
    if (wildArea) return { ...wildArea, name: wildArea.name, kind: "wild" };

    const city = ADVENTURE_CITIES.find((item) =>
      Math.hypot(player.x - item.x, player.y - item.y) <= 315
    );
    if (city) return { ...city, name: "Città di " + city.city, kind: "city" };

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

      if (battleOpenRef.current || encounterOpenRef.current || challengerEncounterOpenRef.current || interior) {
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
          EDIFICI DELLE UNDICI CITTÀ
        */

        if (!blocked && collidesWithCityBuildings(next.x, next.y, PLAYER.size * 0.45)) {
          blocked = true;
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
  }, [interior]);

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

      // Undici distretti abitati: piazza centrale, mura, strade e architetture di fazione.
      for (const city of ADVENTURE_CITIES) {
        drawCityDistrict(ctx, city);
        drawCityLandmark(ctx, city);
      }

      // Undici biomi selvatici separati, ciascuno con terreno e landmark tematici.
      for (const area of ADVENTURE_WILD_AREAS) {
        drawWildArea(ctx, area);
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
      const spriteFrame = Math.floor(performance.now() / 360) % 2;
      for (const wild of wildRef.current) {
        const creature = ROSTER.find((entry) => entry.nome.toLowerCase() === wild.name.toLowerCase());
        if (!creature) continue;
        drawOverworldSognatore(ctx, creature, wild.x, wild.y, spriteFrame);
        if (Math.hypot(playerRef.current.x - wild.x, playerRef.current.y - wild.y) < 190) {
          ctx.save();
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          const labelWidth = ctx.measureText(wild.name).width + 18;
          ctx.fillStyle = "rgba(8,16,13,.82)";
          ctx.fillRect(wild.x - labelWidth / 2, wild.y - 66, labelWidth, 19);
          ctx.fillStyle = "#f3f0df";
          ctx.fillText(wild.name, wild.x, wild.y - 52);
          ctx.restore();
        }
      }

      for (const traveler of CHALLENGERS) {
        const travelerFrame = Math.floor(performance.now() / 380) % 2;
        const faceX = playerRef.current.x - traveler.x;
        const faceY = playerRef.current.y - traveler.y;
        const facing = Math.abs(faceX) > Math.abs(faceY) ? (faceX < 0 ? "left" : "right") : (faceY < 0 ? "up" : "down");
        drawAdventureTraveler(ctx, traveler.traveler || traveler.name, traveler.faction, traveler.x, traveler.y, travelerFrame, 1, facing);
        if (Math.hypot(playerRef.current.x - traveler.x, playerRef.current.y - traveler.y) < 220) {
          ctx.save();
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          const labelWidth = ctx.measureText(traveler.traveler || traveler.name).width + 18;
          ctx.fillStyle = "rgba(8,16,13,.82)";
          ctx.fillRect(traveler.x - labelWidth / 2, traveler.y - 91, labelWidth, 18);
          ctx.fillStyle = "#f4dfb0";
          ctx.fillText(traveler.traveler || traveler.name, traveler.x, traveler.y - 78);
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
    if (dialogue || encounter || challengerEncounter || interior || battleOpenRef.current) return;

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

    const nearestHouse = ADVENTURE_HOUSES
      .map((item) => ({ ...item, interactionDistance: distance(currentPosition, item) }))
      .filter((item) => item.interactionDistance < 92)
      .sort((a, b) => a.interactionDistance - b.interactionDistance)[0];

    if (nearestHouse) {
      setInterior(nearestHouse);
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

    setMessage("Avvicinati a una casa, a un personaggio o a un Sognatore e premi E.");
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


      {interior && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border-4 border-amber-200/70 bg-[#34251f] shadow-2xl">
            <div className="border-b-4 border-[#9b704b] bg-[#6c4935] px-6 py-4">
              <div className="text-[10px] font-black uppercase tracking-[.35em] text-amber-200">Interno esplorabile · {interior.city.city}</div>
              <div className="mt-1 text-2xl font-black text-white">{["Casa del viandante", "Bottega delle mappe", "Casa degli abitanti", "Locanda", "Casa del custode", "Laboratorio"][interior.number - 1]}</div>
            </div>
            <div className="relative min-h-[270px] overflow-hidden bg-[#b98758] p-6">
              <div className="absolute inset-4 border-4 border-[#70472f]/60 bg-[#d6ad78] shadow-inner">
                <div className="absolute inset-x-8 top-8 h-5 border-4 border-[#70472f] bg-[#8b5c3c]" />
                <div className="absolute bottom-0 left-1/2 h-16 w-24 -translate-x-1/2 border-x-4 border-t-4 border-[#70472f] bg-[#75452e]" />
                <div className="absolute left-8 top-20 h-16 w-20 border-4 border-[#70472f] bg-[#79b5c0] shadow-lg" />
                <div className="absolute right-8 top-20 h-16 w-20 border-4 border-[#70472f] bg-[#79b5c0] shadow-lg" />
                <div className="absolute bottom-8 left-1/2 h-12 w-40 -translate-x-1/2 border-4 border-[#70472f] bg-[#8a5738]" />
              </div>
              <div className="relative z-10 flex min-h-[220px] flex-col items-center justify-center text-center">
                <div className="mb-3 grid h-20 w-20 place-items-center rounded-2xl border-4 border-amber-100 bg-[#4c7950] text-4xl shadow-xl">🧑‍🌾</div>
                <div className="rounded-xl border-2 border-amber-100/70 bg-black/75 px-5 py-2 text-lg font-black text-white">{interior.resident}</div>
                <p className="mt-3 max-w-md rounded-xl bg-black/75 px-4 py-3 text-sm leading-6 text-white">{interior.dialogue}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 bg-[#2a1d19] px-5 py-4">
              <span className="text-xs font-bold text-amber-100/70">Puoi visitare tutte le case della città.</span>
              <button type="button" onClick={() => setInterior(null)} className="rounded-xl bg-amber-200 px-5 py-3 text-sm font-black text-[#38251b]">Esci dalla casa</button>
            </div>
          </div>
        </div>
      )}

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
          {ADVENTURE_WILD_AREAS.map((area) => (
            <div key={area.id} title={area.name + " · " + area.faction} className="absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80" style={{ left: (area.x / WORLD.width * 100) + "%", top: (area.y / WORLD.height * 100) + "%", background: area.color }} />
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

// Cache degli artwork ufficiali: gli sprite dell'overworld usano il design
// individuale del roster, con pixel scaling e animazione idle leggera.
const OVERWORLD_ARTWORK = new Map();

function drawOverworldSognatore(ctx, s, x, y, frame = 0) {
  const bob = frame ? 2 : 0;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 27, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (s?.img) {
    let image = OVERWORLD_ARTWORK.get(s.img);
    if (!image) {
      image = new Image();
      image.onload = () => { image.ready = true; };
      image.onerror = () => { image.failed = true; };
      image.src = s.img;
      OVERWORLD_ARTWORK.set(s.img, image);
    }
    if (image.complete && image.naturalWidth > 0) {
      const maxWidth = 68;
      const maxHeight = 68;
      const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const width = Math.max(1, image.naturalWidth * ratio);
      const height = Math.max(1, image.naturalHeight * ratio);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, Math.round(x - width / 2), Math.round(y - height + 7 - bob), Math.round(width), Math.round(height));
      ctx.restore();
      return;
    }
  }

  // Fallback pixel-art se l'immagine ufficiale non è disponibile.
  drawAdventureWildSognatore(ctx, s, x, y - bob, frame, 1.9);
  ctx.restore();
}

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

function drawCityIdentity(ctx, city) {
  const accent = city.color || "#d6b47a";
  ctx.save();
  const tower = (x,y,w,h,body,roof) => {
    ctx.fillStyle="rgba(8,13,18,.32)"; ctx.fillRect(x-4,y+h-2,w+8,9);
    ctx.fillStyle=body; ctx.fillRect(x,y,w,h);
    ctx.fillStyle=roof; ctx.fillRect(x-5,y-8,w+10,10);
    ctx.fillStyle="rgba(255,244,210,.75)"; ctx.fillRect(x+5,y+12,5,13); ctx.fillRect(x+w-10,y+12,5,13);
  };
  switch(city.faction) {
    case "Demone":
      ctx.fillStyle="#542b35";ctx.fillRect(-42,-24,84,58);ctx.fillStyle="#bd5360";
      ctx.beginPath();ctx.moveTo(-42,-18);ctx.lineTo(-22,-76);ctx.lineTo(-5,-18);ctx.fill();
      ctx.beginPath();ctx.moveTo(42,-18);ctx.lineTo(22,-76);ctx.lineTo(5,-18);ctx.fill();
      ctx.fillStyle="#ff9a56";ctx.fillRect(-7,-10,14,39);ctx.fillStyle="#ffd17b";ctx.fillRect(-3,-20,6,18);break;
    case "Robot":
      tower(-48,-48,30,90,"#36586a","#8edbd0");tower(18,-60,30,102,"#36586a","#8edbd0");
      ctx.fillStyle="#8be6d8";ctx.fillRect(-3,-83,6,23);ctx.fillRect(-54,5,108,7);
      ctx.fillStyle="#e3f5ce";ctx.fillRect(-7,-36,14,14);break;
    case "Natura":
      ctx.fillStyle="#62472f";ctx.fillRect(-13,-8,26,52);
      for(const [x,y,r] of [[0,-47,43],[-31,-20,29],[31,-19,29],[0,-4,34]]){ctx.fillStyle="#286c46";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle="#a6d879";ctx.fillRect(-6,-56,12,15);ctx.fillRect(-28,-24,9,8);ctx.fillRect(20,-17,9,8);break;
    case "Nuvola":
      ctx.fillStyle="#d8e9fa";ctx.beginPath();ctx.ellipse(0,8,70,20,0,0,Math.PI*2);ctx.fill();
      tower(-12,-80,24,92,"#829ac4","#e4efff");ctx.fillStyle="#c6dcf4";
      ctx.beginPath();ctx.arc(-35,-43,19,0,Math.PI*2);ctx.arc(34,-34,23,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#8bbbe3";ctx.fillRect(-3,-96,6,18);break;
    case "Umano":
      tower(-22,-76,44,120,"#8c6044","#e2b77e");ctx.fillStyle="#f8e4b6";
      ctx.beginPath();ctx.arc(0,-48,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#67432f";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(0,-48);ctx.lineTo(0,-57);ctx.moveTo(0,-48);ctx.lineTo(8,-44);ctx.stroke();
      ctx.fillStyle="#b88955";ctx.fillRect(-58,42,116,8);break;
    case "Luce":
      ctx.fillStyle="#d9ae4d";ctx.beginPath();ctx.moveTo(0,-90);ctx.lineTo(-26,35);ctx.lineTo(26,35);ctx.closePath();ctx.fill();
      ctx.fillStyle="#fff1b6";ctx.beginPath();ctx.arc(0,-43,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffe58b";ctx.lineWidth=6;
      for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*54,-43+Math.sin(a)*54);ctx.lineTo(Math.cos(a)*70,-43+Math.sin(a)*70);ctx.stroke();}break;
    case "Dolce":
      ctx.fillStyle="#b96e9e";ctx.fillRect(-36,-5,72,45);ctx.fillStyle="#f4c0dc";
      ctx.beginPath();ctx.arc(0,-27,35,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#fff0dd";ctx.fillRect(-8,-47,16,76);
      ctx.fillStyle="#e88fbd";ctx.fillRect(-48,44,24,9);ctx.fillRect(24,44,24,9);break;
    case "Marino":
      ctx.fillStyle="#236b85";ctx.fillRect(-76,-5,152,48);ctx.fillStyle="#8ce0e1";ctx.fillRect(-76,3,152,4);ctx.fillRect(-76,31,152,4);
      ctx.fillStyle="#d5c39b";ctx.fillRect(-58,-12,116,13);ctx.fillStyle="#876e52";ctx.fillRect(-58,-18,8,20);ctx.fillRect(50,-18,8,20);
      ctx.fillStyle=accent;ctx.fillRect(-8,-58,16,42);break;
    case "Orso":
      tower(-54,-42,28,84,"#74553c","#c49a61");tower(26,-42,28,84,"#74553c","#c49a61");
      ctx.fillStyle="#b88b55";ctx.fillRect(-35,-53,70,16);ctx.fillStyle="#4b3a30";ctx.fillRect(-20,-8,40,50);
      ctx.fillStyle="#e4c18a";ctx.fillRect(-5,2,10,10);break;
    case "Mago":
      ctx.strokeStyle="#c6b3f4";ctx.lineWidth=8;ctx.strokeRect(-39,-58,78,94);ctx.strokeStyle="#f1d58b";ctx.lineWidth=4;ctx.strokeRect(-22,-40,44,58);
      ctx.fillStyle="#bca8f0";ctx.beginPath();ctx.moveTo(0,-80);ctx.lineTo(-12,-58);ctx.lineTo(12,-58);ctx.closePath();ctx.fill();
      ctx.fillStyle="#fff0bd";ctx.fillRect(-4,-15,8,8);break;
    case "Salato":
      ctx.fillStyle="#8a918d";ctx.fillRect(-58,30,116,12);
      for(const [x,y,h] of [[-34,10,65],[0,-12,90],[35,14,58]]){ctx.fillStyle="#e9e5d6";ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x-15,y+8);ctx.lineTo(x+15,y+8);ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.fillRect(x-3,y-h+18,5,Math.max(8,h-22));}break;
  }
  ctx.restore();
}

function drawCityDistrict(ctx, city) {
  const x = Math.round(city.x / 4) * 4;
  const y = Math.round(city.y / 4) * 4;
  const color = city.color || "#d6b47a";
  const buildings = [
    [-132, -88], [0, -158], [132, -88],
    [-132, 88], [132, 88], [0, 158],
  ];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.55, 1.55);
  ctx.imageSmoothingEnabled = false;

  // Piazza e anello stradale: quartiere ampio in stile RPG 2010.
  ctx.fillStyle = "rgba(20,25,28,.24)";
  ctx.beginPath(); ctx.ellipse(0, 8, 190, 156, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(220,202,158,.72)";
  ctx.lineWidth = 17;
  ctx.beginPath(); ctx.ellipse(0, 0, 168, 135, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(111,91,64,.55)";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 168, 135, 0, 0, Math.PI * 2); ctx.stroke();

  // Monumenti, skyline e piazze differenti per ciascuna fazione.
  drawCityIdentity(ctx, city);

  buildings.forEach(([bx, by], index) => {
    const w = index % 3 === 0 ? 62 : 54;
    const h = index % 2 === 0 ? 48 : 56;
    const left = bx - w / 2;
    const top = by - h / 2;
    ctx.fillStyle = "rgba(5,12,18,.35)";
    ctx.fillRect(left + 5, top + h - 2, w + 3, 12);
    ctx.fillStyle = "#463b39";
    ctx.fillRect(left - 4, top + 8, w + 8, h - 4);
    ctx.fillStyle = city.faction === "Robot" ? "#456b77" :
      city.faction === "Marino" ? "#34758a" :
      city.faction === "Natura" ? "#806b43" :
      city.faction === "Dolce" ? "#a86b91" :
      city.faction === "Demone" ? "#603544" :
      city.faction === "Luce" ? "#b18b43" :
      city.faction === "Mago" ? "#594b79" :
      city.faction === "Nuvola" ? "#8298b8" :
      city.faction === "Orso" ? "#74553c" :
      city.faction === "Salato" ? "#85877e" : "#89664b";
    ctx.fillRect(left, top + 12, w, h - 12);
    ctx.fillStyle = color;
    ctx.fillRect(left + 4, top + 14, w - 8, 5);
    // Tetti distinti per fazione: cupola, punta, pannello o falde.
    ctx.fillStyle = city.faction === "Dolce" ? "#e9a9cc" :
      city.faction === "Robot" ? "#9bd9d2" :
      city.faction === "Luce" ? "#f4df9a" :
      city.faction === "Mago" ? "#b6a0e7" :
      city.faction === "Demone" ? "#bd5962" : "#b58a61";
    if (city.faction === "Nuvola" || city.faction === "Luce") {
      ctx.beginPath(); ctx.ellipse(bx, top + 13, w * .56, 13, 0, Math.PI, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(left - 5, top + 14); ctx.lineTo(bx, top - 12); ctx.lineTo(left + w + 5, top + 14); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "rgba(237,239,215,.9)";
    ctx.fillRect(left + 10, top + 25, 9, 10);
    ctx.fillRect(left + w - 19, top + 25, 9, 10);
    ctx.fillStyle = "#382d2b";
    ctx.fillRect(bx - 6, top + h - 19, 12, 19);
    if (city.faction === "Robot") {
      ctx.fillStyle = "#b8eee2"; ctx.fillRect(bx - 2, top - 7, 4, 13);
    }
  });

  // Portale d'ingresso aperto verso il basso: il viaggiatore resta al centro.
  ctx.fillStyle = "#d5bd8a";
  ctx.fillRect(-34, 116, 68, 12);
  ctx.fillStyle = "#72553c";
  ctx.fillRect(-22, 112, 44, 7);
  ctx.restore();
}

function drawWildArea(ctx, area) {
  const x = area.x;
  const y = area.y;
  const r = area.radius;
  const areaScale = r / 190;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(areaScale, areaScale);
  ctx.imageSmoothingEnabled = false;

  // Ampia radura esplorabile: terreno a livelli, contorno netto e palette vivace da RPG 2010.
  ctx.fillStyle = area.color + "32";
  ctx.beginPath(); ctx.ellipse(0, 0, 190, 145, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(18,31,27,.20)";
  ctx.beginPath(); ctx.ellipse(0, 8, 180, 137, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = area.color + "20";
  ctx.beginPath(); ctx.ellipse(0, -5, 172, 130, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = area.color;
  ctx.globalAlpha = .72;
  ctx.lineWidth = 7;
  ctx.setLineDash([18, 13]);
  ctx.beginPath(); ctx.ellipse(0, 0, 182, 137, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Un landmark centrale diverso per ciascun bioma.
  if (area.biome === "lava") {
    ctx.fillStyle = "#542b35"; ctx.fillRect(-42, -24, 84, 58);
    ctx.fillStyle = "#d45b42"; ctx.beginPath(); ctx.moveTo(-34, 20); ctx.lineTo(-18, -48); ctx.lineTo(-2, 20); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, 20); ctx.lineTo(23, -58); ctx.lineTo(38, 20); ctx.fill();
    ctx.fillStyle = "#ffbd69"; ctx.fillRect(-7, -5, 14, 35);
  } else if (area.biome === "circuit") {
    ctx.fillStyle = "#244b5b"; ctx.fillRect(-48, -34, 96, 68);
    ctx.strokeStyle = "#7be0d3"; ctx.lineWidth = 5;
    ctx.strokeRect(-34, -20, 68, 40); ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-34, 0); ctx.moveTo(34, 0); ctx.lineTo(70, 0); ctx.stroke();
    ctx.fillStyle = "#b6f2d9"; ctx.fillRect(-8, -8, 16, 16);
  } else if (area.biome === "forest") {
    for (const [tx, ty, size] of [[-38, 12, 42], [0, -28, 52], [40, 16, 38]]) {
      ctx.fillStyle = "#513b2b"; ctx.fillRect(tx - 5, ty, 10, 48);
      ctx.fillStyle = "#24583a"; ctx.beginPath(); ctx.moveTo(tx, ty - size); ctx.lineTo(tx - size * .7, ty + 10); ctx.lineTo(tx + size * .7, ty + 10); ctx.fill();
      ctx.fillStyle = "#8fbd62"; ctx.fillRect(tx - 4, ty - size * .35, 8, 8);
    }
  } else if (area.biome === "cloud") {
    ctx.fillStyle = "#d9e9f7";
    for (const [cx, cy, cr] of [[-28, 0, 27], [0, -18, 38], [32, 4, 25]]) { ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#8db8e4"; ctx.fillRect(-8, 12, 16, 38);
  } else if (area.biome === "prairie") {
    ctx.fillStyle = "#9b7548"; ctx.fillRect(-52, 18, 104, 18);
    ctx.fillStyle = "#d8b47a"; ctx.fillRect(-42, 22, 84, 5);
    ctx.fillStyle = "#76583d"; ctx.fillRect(-25, -30, 50, 42);
    ctx.fillStyle = "#d6a16e"; ctx.fillRect(-18, -24, 36, 30);
  } else if (area.biome === "sun") {
    ctx.fillStyle = "#c69b47"; ctx.beginPath(); ctx.arc(0, -5, 42, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff0a8"; ctx.lineWidth = 6;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 52, -5 + Math.sin(a) * 52); ctx.lineTo(Math.cos(a) * 72, -5 + Math.sin(a) * 72); ctx.stroke(); }
    ctx.fillStyle = "#fff3bd"; ctx.beginPath(); ctx.arc(0, -5, 19, 0, Math.PI * 2); ctx.fill();
  } else if (area.biome === "candy") {
    ctx.fillStyle = "#a95f91"; ctx.fillRect(-42, 5, 84, 34);
    ctx.fillStyle = "#f3bad7";
    for (const [fx, fy] of [[-30, -24], [0, -44], [30, -20]]) { ctx.beginPath(); ctx.arc(fx, fy, 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#fff1df"; ctx.fillRect(-5, -12, 10, 46);
  } else if (area.biome === "ocean") {
    ctx.fillStyle = "#1c5b75"; ctx.beginPath(); ctx.ellipse(0, 8, 68, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8ce0e1"; ctx.lineWidth = 5;
    for (let yy = -8; yy <= 18; yy += 13) { ctx.beginPath(); ctx.moveTo(-50, yy); ctx.quadraticCurveTo(0, yy - 12, 50, yy); ctx.stroke(); }
    ctx.fillStyle = "#5fc2c7"; ctx.fillRect(-8, -44, 16, 35);
  } else if (area.biome === "mountain") {
    ctx.fillStyle = "#554536";
    ctx.beginPath(); ctx.moveTo(-65, 35); ctx.lineTo(-30, -48); ctx.lineTo(0, 8); ctx.lineTo(32, -62); ctx.lineTo(70, 35); ctx.fill();
    ctx.fillStyle = "#e3c18a"; ctx.beginPath(); ctx.moveTo(-30, -48); ctx.lineTo(-14, -9); ctx.lineTo(-43, -14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(32, -62); ctx.lineTo(50, -20); ctx.lineTo(17, -22); ctx.fill();
  } else if (area.biome === "arcane") {
    ctx.strokeStyle = "#c8b7f4"; ctx.lineWidth = 8;
    ctx.strokeRect(-44, -48, 88, 90);
    ctx.strokeRect(-24, -28, 48, 50);
    ctx.fillStyle = "#f2d68a"; ctx.beginPath(); ctx.arc(0, -4, 12, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = "#777e79"; ctx.fillRect(-48, 16, 96, 24);
    ctx.fillStyle = "#e8e2cb";
    for (const [sx, sy, sh] of [[-28, 8, 48], [0, -12, 70], [29, 10, 43]]) {
      ctx.beginPath(); ctx.moveTo(sx, sy - sh); ctx.lineTo(sx - 15, sy + 8); ctx.lineTo(sx + 15, sy + 8); ctx.closePath(); ctx.fill();
    }
  }

  // Piante, pietre e piccoli segni distribuiti in modo deterministico.
  for (let i = 0; i < 18; i++) {
    const angle = i * 2.399;
    const distance = 92 + (i % 4) * 18;
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance * .72;
    ctx.fillStyle = i % 2 ? area.color : "rgba(238,235,207,.72)";
    if (area.biome === "ocean") {
      ctx.fillRect(px, py, 12, 3);
      ctx.fillRect(px + 4, py - 4, 3, 8);
    } else if (area.biome === "forest" || area.biome === "prairie" || area.biome === "candy") {
      ctx.fillRect(px, py, 4, 12);
      ctx.fillRect(px - 4, py + 2, 12, 3);
    } else {
      ctx.fillRect(px, py, 8, 8);
    }
  }

  // Nome dell'area, leggibile anche a distanza di esplorazione.
  ctx.fillStyle = "rgba(7,13,18,.82)";
  ctx.fillRect(-112, 145 * .76 - 30, 224, 24);
  ctx.fillStyle = "#fff4df";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(area.name, 0, 145 * .76 - 13, 216);
  ctx.restore();
}

function drawCityLandmark(ctx, city) {
  const x = Math.round(city.x / 4) * 4;
  const y = Math.round((city.y - 66) / 4) * 4;
  const accent = city.color || "#e5c17f";
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.3, 1.3);
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

  // Insegna della città: nome e fazione sono visibili anche senza aprire il menu.
  ctx.fillStyle = "rgba(7,13,18,.9)";
  ctx.fillRect(-58, 43, 116, 25);
  ctx.fillStyle = accent;
  ctx.fillRect(-58, 43, 4, 25);
  ctx.fillStyle = "#fff4df";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(city.city, 2, 54, 106);
  ctx.fillStyle = accent;
  ctx.font = "bold 8px monospace";
  ctx.fillText(city.faction.toUpperCase(), 2, 64, 106);
  ctx.restore();
}

