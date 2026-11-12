// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ROSTER } from "@/lib/sognatoriData";
import AdventureCampaign from "@/components/game/AdventureCampaign";
import AdventureSognatoreSprite from "@/components/game/AdventureSognatoreSprite";
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
    speed: 38,
    behavior: "wander",
  },
  {
    id: "wild-2",
    x: 1050,
    y: 1320,
    name: "Cillymbu",
    speed: 30,
    behavior: "wander",
  },
  {
    id: "wild-3",
    x: 2250,
    y: 720,
    name: "Nina",
    speed: 34,
    behavior: "shy",
  },
  {
    id: "wild-4",
    x: 2900,
    y: 1320,
    name: "Dragociocco",
    speed: 28,
    behavior: "wander",
  },
  {
    id: "wild-5",
    x: 680,
    y: 1880,
    name: "Pepe",
    speed: 42,
    behavior: "shy",
  },
  {
    id: "wild-6",
    x: 3150,
    y: 520,
    name: "Icepadel",
    speed: 35,
    behavior: "wander",
  },
  {
    id: "wild-7",
    x: 2350,
    y: 1960,
    name: "Eroe",
    speed: 31,
    behavior: "wander",
  },
  {
    id: "wild-8",
    x: 1380,
    y: 2050,
    name: "Uesditti",
    speed: 45,
    behavior: "shy",
  },
];

const CHALLENGERS = ADVENTURE_CITIES.map((city) => ({
  ...city,
  id: city.id,
  name: city.traveler,
  team: buildCityTeam(city.faction, city.id),
  vision: 190,
  speed: 38,
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


/* GBA tile ground: texture deterministica, limitata all'area visibile. */
function drawGroundTiles(ctx, camera, viewWidth, viewHeight, scale) {
  const tile = 48;
  const halfW = viewWidth / (2 * scale) + tile * 2;
  const halfH = viewHeight / (2 * scale) + tile * 2;
  const left = Math.max(0, Math.floor((camera.x - halfW) / tile) * tile);
  const right = Math.min(WORLD.width, camera.x + halfW);
  const top = Math.max(0, Math.floor((camera.y - halfH) / tile) * tile);
  const bottom = Math.min(WORLD.height, camera.y + halfH);
  const palettes = {
    "Prato dei Sogni": ["#5f984e", "#639d51", "#588f49", "#6aa456", "#568b48"],
    "Bosco delle Ombre": ["#315d42", "#356447", "#2e573d", "#3a6949", "#315b40"],
    "Monti di Cenere": ["#71695d", "#786f63", "#696256", "#817768", "#6d665b"],
    "Valle Dorata": ["#a78d49", "#ad9550", "#9e8543", "#b49a55", "#a18845"],
  };
  for (let y = top; y < bottom; y += tile) {
    for (let x = left; x < right; x += tile) {
      const zone = ZONES.find(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) || ZONES[0];
      const seed = Math.abs(((x / tile) * 73856093) ^ ((y / tile) * 19349663));
      ctx.fillStyle = palettes[zone.name][seed % 5];
      ctx.fillRect(x, y, tile, tile);
      if (seed % 4 === 0) {
        ctx.fillStyle = zone.name === "Monti di Cenere" ? "#8d8374" : "#477b43";
        ctx.fillRect(x + 8 + seed % 17, y + 9 + seed % 19, 8, 4);
        ctx.fillRect(x + 12 + seed % 17, y + 5 + seed % 19, 4, 4);
      }
      if (seed % 7 === 0) {
        ctx.fillStyle = zone.name === "Valle Dorata" ? "#d0b86c" : "#80ad5a";
        ctx.fillRect(x + 29, y + 28, 5, 5);
        ctx.fillRect(x + 33, y + 24, 4, 4);
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
        ============================
        IA SOGNATORI SELVATICI
        ============================
      */

      wildRef.current =
        wildRef.current.map((s) => {
          const d = Math.hypot(
            playerRef.current.x - s.x,
            playerRef.current.y - s.y
          );

          let angle =
            s.angle ??
            Math.random() *
              Math.PI *
              2;

          let speed = s.speed;

          /*
            Sognatori timidi scappano
            se il giocatore si avvicina.
          */

          if (
            s.behavior === "shy" &&
            d < 180
          ) {
            angle = Math.atan2(
              s.y -
                playerRef.current.y,
              s.x -
                playerRef.current.x
            );

            speed *= 1.7;
          } else if (
            Math.random() <
            0.012
          ) {
            angle =
              Math.random() *
              Math.PI *
              2;
          }

          const nx = clamp(
            s.x +
              Math.cos(angle) *
                speed *
                dt,
            60,
            WORLD.width - 60
          );

          const ny = clamp(
            s.y +
              Math.sin(angle) *
                speed *
                dt,
            60,
            WORLD.height - 60
          );

          return {
            ...s,
            x: nx,
            y: ny,
            angle,
          };
        });

      /*
        ============================
        SFIDANTI
        ============================

        IMPORTANTISSIMO:
        NON inseguono più il giocatore.

        Pattugliano la loro zona.
      */

      challengerRef.current =
        challengerRef.current.map((c) => {
          let angle =
            c.angle ??
            Math.random() *
              Math.PI *
              2;

          /*
            Movimento casuale lento.
          */

          if (
            Math.random() <
            0.008
          ) {
            angle =
              Math.random() *
              Math.PI *
              2;
          }

          let nx = clamp(
            c.x + Math.cos(angle) * c.speed * dt,
            80,
            WORLD.width - 80
          );
          let ny = clamp(
            c.y + Math.sin(angle) * c.speed * dt,
            80,
            WORLD.height - 80
          );

          if (Math.hypot(nx - c.homeX, ny - c.homeY) > c.radius) {
            angle = Math.atan2(c.homeY - c.y, c.homeX - c.x);
            nx = c.x + Math.cos(angle) * c.speed * dt;
            ny = c.y + Math.sin(angle) * c.speed * dt;
          }

          return { ...c, x: nx, y: ny, angle };
        });

      /*
        Aggiorniamo il rendering
        delle entità ogni ~120ms.
      */

      if (
        now -
          lastEntityRenderRef.current >
        120
      ) {
        lastEntityRenderRef.current =
          now;

        setWildSognatori(
          wildRef.current.map(
            (s) => ({
              ...s,
            })
          )
        );
      }

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
      canvas.width =
        window.innerWidth * dpr;

      canvas.height =
        window.innerHeight * dpr;

      canvas.style.width =
        `${window.innerWidth}px`;

      canvas.style.height =
        `${window.innerHeight}px`;

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
      const w =
        window.innerWidth;

      const h =
        window.innerHeight;

      ctx.clearRect(
        0,
        0,
        w,
        h
      );

      const cam =
        cameraRef.current;

      const scale = Math.min(
        w / 1100,
        h / 700
      );

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

      /* SENTIERI */

      ctx.fillStyle =
        "#c7a56a";

      ctx.fillRect(
        0,
        1010,
        WORLD.width,
        100
      );

      ctx.fillRect(
        1740,
        0,
        120,
        WORLD.height
      );

      ctx.fillRect(
        800,
        550,
        2100,
        70
      );

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

      ctx.strokeStyle =
        "#6ec6d9";

      ctx.lineWidth = 7;

      for (
        let y = 850;
        y < 1010;
        y += 38
      ) {
        ctx.beginPath();

        ctx.moveTo(
          1610,
          y
        );

        ctx.quadraticCurveTo(
          1730,
          y - 18,
          1840,
          y
        );

        ctx.stroke();
      }

      /*
        CASE
      */

      drawHouse(
        ctx,
        1730,
        1010,
        "#7c4f35"
      );

      drawHouse(
        ctx,
        2380,
        1460,
        "#694d39"
      );

      drawHouse(
        ctx,
        1210,
        650,
        "#604b72"
      );

      for (const city of ADVENTURE_CITIES) {
        drawHouse(ctx, city.x - 78, city.y - 48, city.color);
        ctx.fillStyle = "rgba(0,0,0,.62)";
        ctx.fillRect(city.x - 82, city.y + 90, 164, 28);
        ctx.fillStyle = "#fff4cf";
        ctx.font = "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.fillText(city.city, city.x, city.y + 110);
      }

      // Undici città-fazione: ogni viaggiatore presidia la propria città.
      for (const city of ADVENTURE_CITIES) {
        drawHouse(ctx, city.x - 78, city.y - 48, city.color);
        ctx.fillStyle = "rgba(0,0,0,.62)";
        ctx.fillRect(city.x - 82, city.y + 90, 164, 28);
        ctx.fillStyle = "#fff4cf";
        ctx.font = "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.fillText(city.city, city.x, city.y + 110);
      }

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

      /*
        ROCCE
      */

      for (const rock of WORLD_OBJECTS.rocks) {
        ctx.fillStyle =
          "#575757";

        ctx.beginPath();

        ctx.ellipse(
          rock.x,
          rock.y,
          rock.r * 1.2,
          rock.r * 0.85,
          0,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          "#777";

        ctx.beginPath();

        ctx.ellipse(
          rock.x -
            rock.r *
              0.25,
          rock.y -
            rock.r *
              0.2,
          rock.r *
            0.45,
          rock.r *
            0.25,
          -0.4,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      /*
        NPC
      */

      for (const npc of NPCS) {
        drawNpc(
          ctx,
          npc
        );
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
    <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-black text-white select-none touch-auto">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
      />

      {/* =====================================
          PAD MOBILE
          ===================================== */}

      <div className="fixed bottom-1 left-5 z-50 md:hidden">
        <div className="relative h-36 w-36">
          <button
            type="button"
            aria-label="Muovi in alto"
            className="absolute left-12 top-0 h-12 w-12 rounded-xl border border-white/10 bg-black/35 text-xl font-black text-white backdrop-blur-md active:bg-white/40"
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.w = true;
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              keysRef.current.w = false;
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              keysRef.current.w = false;
            }}
          >
            ▲
          </button>

          <button
            type="button"
            aria-label="Muovi in basso"
            className="absolute bottom-0 left-12 h-12 w-12 rounded-xl border border-white/10 bg-black/35 text-xl font-black text-white backdrop-blur-md active:bg-white/40"
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.s = true;
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              keysRef.current.s = false;
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              keysRef.current.s = false;
            }}
          >
            ▼
          </button>

          <button
            type="button"
            aria-label="Muovi a sinistra"
            className="absolute left-0 top-12 h-12 w-12 rounded-xl border border-white/10 bg-black/35 text-xl font-black text-white backdrop-blur-md active:bg-white/40"
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.a = true;
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              keysRef.current.a = false;
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              keysRef.current.a = false;
            }}
          >
            ◀
          </button>

          <button
            type="button"
            aria-label="Muovi a destra"
            className="absolute right-0 top-12 h-12 w-12 rounded-xl border border-white/10 bg-black/35 text-xl font-black text-white backdrop-blur-md active:bg-white/40"
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.d = true;
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              keysRef.current.d = false;
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              keysRef.current.d = false;
            }}
          >
            ▶
          </button>

          <div className="absolute left-12 top-12 h-12 w-12 rounded-xl border border-white/10 bg-black/25" />
        </div>
      </div>

      {/* =====================================
          SOGNATORI SELVATICI
          ===================================== */}

      <div className="pointer-events-none absolute inset-0">
        {wildSognatori.map((s) => {
          const w =
            window.innerWidth;

          const h =
            window.innerHeight;

          const scale =
            Math.min(
              w / 1100,
              h / 700
            );

          const sx =
            w / 2 +
            (s.x - player.x) *
              scale;

          const sy =
            h / 2 +
            (s.y - player.y) *
              scale;

          if (
            sx < -100 ||
            sx > w + 100 ||
            sy < -120 ||
            sy > h + 120
          ) {
            return null;
          }

          return (
            <div
              key={s.id}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{
                left: sx,
                top: sy,
              }}
            >
              <div className="mb-1 whitespace-nowrap text-center text-[9px] font-black text-white drop-shadow-[0_2px_2px_black]">
                {s.name}
              </div>

              <AdventureSognatoreSprite s={ROSTER.find((entry) => entry.nome?.toLowerCase() === s.name.toLowerCase())} size={64} walking />

              <div className="mx-auto mt-[-4px] h-1.5 w-12 rounded-full bg-black/40">
                <div className="h-full w-full rounded-full bg-emerald-400" />
              </div>
            </div>
          );
        })}

        {/* =====================================
            SFIDANTI
            ===================================== */}

        {challengerRef.current.map(
          (c) => {
            const w =
              window.innerWidth;

            const h =
              window.innerHeight;

            const scale =
              Math.min(
                w / 1100,
                h / 700
              );

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

                <div
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/60 shadow-lg"
                  style={{
                    background:
                      c.color,
                  }}
                >
                  <span className="text-lg">
                    🧍
                  </span>
                </div>

                <div className="mt-1 whitespace-nowrap text-center text-[9px] font-black text-white drop-shadow-[0_2px_2px_black]">
                  {c.name}
                </div>
                <div className="whitespace-nowrap text-center text-[8px] font-bold text-amber-100/80 drop-shadow-[0_2px_2px_black]">
                  {c.city}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* =====================================
          CONTROLLI DESKTOP
          ===================================== */}

      <div className="absolute bottom-1 left-5 hidden rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-xs text-white/60 backdrop-blur-md md:block">
        <span className="font-bold text-white">
          WASD / FRECCE
        </span>{" "}
        · muovi
        <br />
        <span className="font-bold text-white">
          E
        </span>{" "}
        · interagisci
      </div>

      {/* =====================================
          INTERAGISCI
          ===================================== */}

      <button
        type="button"
        onClick={interact}
        className="fixed bottom-5 right-5 z-[56] rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black backdrop-blur-md transition hover:bg-white/20 active:scale-95"
      >
        E · INTERAGISCI
      </button>

      {/* =====================================
          MESSAGGIO
          ===================================== */}

      {message && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/75 px-6 py-3 text-sm font-bold shadow-2xl backdrop-blur-md">
          {message}
        </div>
      )}

      {/* =====================================
          DIALOGO NPC
          ===================================== */}

      {dialogue && (
        <div className="absolute inset-x-4 bottom-5 z-[60] mx-auto max-w-3xl rounded-3xl border border-white/15 bg-black/85 p-6 shadow-2xl backdrop-blur-xl">
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
  // Allenatore in pixel art 16-bit, ancorato ai piedi.
  ctx.save();
  ctx.translate(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4);
  ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(-13, 17, 26, 6);
  ctx.fillStyle = "#34251f"; ctx.fillRect(-10, 11, 8, 7); ctx.fillRect(3, 11, 8, 7);
  ctx.fillStyle = "#344c78"; ctx.fillRect(-10, 3, 20, 10); ctx.fillRect(-8, 10, 7, 7); ctx.fillRect(2, 10, 7, 7);
  ctx.fillStyle = "#e5a43c"; ctx.fillRect(-12, -10, 24, 16);
  ctx.fillStyle = "#f6c65c"; ctx.fillRect(-8, -8, 16, 12);
  ctx.fillStyle = "#e8b98d"; ctx.fillRect(-16, -7, 5, 13); ctx.fillRect(11, -7, 5, 13);
  ctx.fillStyle = "#d99b70"; ctx.fillRect(-5, -15, 10, 7);
  ctx.fillStyle = "#f0c69d"; ctx.fillRect(-10, -29, 20, 16);
  ctx.fillStyle = "#38271f"; ctx.fillRect(-11, -30, 22, 7); ctx.fillRect(-9, -35, 18, 5);
  ctx.fillStyle = "#d65d3e"; ctx.fillRect(-12, -38, 24, 5); ctx.fillRect(-7, -42, 14, 4);
  ctx.fillStyle = "#29221e"; ctx.fillRect(-6, -24, 3, 3); ctx.fillRect(4, -24, 3, 3);
  ctx.restore();
}

/*
  ============================================
  TREE
  ============================================
*/

function drawTree(ctx, x, y, r) {
  const size = Math.max(28, Math.round(r * 1.7 / 4) * 4);
  const left = Math.round(x - size / 2), top = Math.round(y - size * 1.25);
  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(left + 7, y + size * .45, size - 4, 10);
  ctx.fillStyle = "#173d2a"; ctx.fillRect(left + 8, top + 8, size - 16, size - 4);
  ctx.fillRect(left + 4, top + 16, size - 8, size - 18); ctx.fillRect(left + 12, top, size - 24, size);
  ctx.fillStyle = "#28613a"; ctx.fillRect(left + 12, top + 8, size - 24, size - 20); ctx.fillRect(left + 4, top + 20, size - 8, size - 28);
  ctx.fillStyle = "#43824a"; ctx.fillRect(left + 12, top + 8, 12, 10); ctx.fillRect(left + 26, top + 18, 10, 8); ctx.fillRect(left + size - 22, top + 12, 8, 8);
  ctx.fillStyle = "#65452d"; ctx.fillRect(x - 7, y + 3, 14, 25);
  ctx.fillStyle = "#8a5b36"; ctx.fillRect(x - 3, y + 4, 5, 20);
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
  ctx.save(); ctx.translate(Math.round(npc.x / 3) * 3, Math.round(npc.y / 3) * 3);
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(-13, 18, 26, 6);
  ctx.fillStyle = "#34304a"; ctx.fillRect(-9, 2, 18, 16);
  ctx.fillStyle = npc.color; ctx.fillRect(-12, -9, 24, 14);
  ctx.fillStyle = "#e9bd96"; ctx.fillRect(-9, -27, 18, 18);
  ctx.fillStyle = "#382a27"; ctx.fillRect(-10, -30, 20, 7); ctx.fillRect(-8, -34, 16, 5);
  ctx.fillStyle = "#211d1b"; ctx.fillRect(-5, -21, 3, 3); ctx.fillRect(3, -21, 3, 3);
  ctx.fillStyle = "#fff"; ctx.font = "bold 14px monospace"; ctx.textAlign = "center"; ctx.fillText(npc.name, 0, 40);
  ctx.restore();
}

