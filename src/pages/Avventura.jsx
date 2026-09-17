import React, { useEffect, useMemo, useRef, useState } from "react";\nimport { Navigate } from "react-router-dom";\nimport { useAuth } from "@/lib/AuthContext";

/*
  SOGNATORI — AVVENTURA
  File unico, pronto da usare in src/pages/Avventura.jsx

  Contiene:
  - mondo grande e continuo
  - movimento WASD / frecce
  - camera fluida
  - collisioni
  - acqua, alberi, rocce, case e recinti
  - 4 zone esplorabili
  - NPC interattivi
  - raccolta di cristalli
  - erba alta con incontri casuali
  - ciclo giorno/notte
  - minimappa
  - quest semplice
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

const TESTER_EMAILS = [
  "bibitoeuro@gmail.com",
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

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
  const crystals = [];

  // Alberi distribuiti nel mondo, evitando la zona centrale.
  for (let i = 0; i < 150; i++) {
    const x = 80 + rand() * (WORLD.width - 160);
    const y = 80 + rand() * (WORLD.height - 160);

    if (Math.abs(x - 1800) < 420 && Math.abs(y - 1200) < 300) continue;

    trees.push({
      id: `tree-${i}`,
      x,
      y,
      r: 28 + rand() * 12,
    });
  }

  for (let i = 0; i < 65; i++) {
    rocks.push({
      id: `rock-${i}`,
      x: 80 + rand() * (WORLD.width - 160),
      y: 80 + rand() * (WORLD.height - 160),
      r: 13 + rand() * 13,
    });
  }

  for (let i = 0; i < 28; i++) {
    crystals.push({
      id: `crystal-${i}`,
      x: 180 + rand() * (WORLD.width - 360),
      y: 180 + rand() * (WORLD.height - 360),
    });
  }

  return { trees, rocks, crystals };
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
      "Benvenuto nel Cuore Verde. I cristalli che trovi appartengono all'antico Sentiero dei Sognatori.",
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
      "Le montagne custodiscono cristalli molto più potenti. Ma non andarci senza prepararti.",
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

function circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  return Math.hypot(cx - closestX, cy - closestY) < radius;
}

export default function Avventura() {
  const canvasRef = useRef(null);

  const { user, isLoadingAuth, authChecked } = useAuth();

  const testerAllowed =
    !!user?.email &&
    TESTER_EMAILS.includes(user.email.toLowerCase());
  const keysRef = useRef({});
  const playerRef = useRef({ x: 1800, y: 900 });
  const cameraRef = useRef({ x: 1800, y: 900 });

  const [player, setPlayer] = useState(playerRef.current);
  const [crystals, setCrystals] = useState(WORLD_OBJECTS.crystals);
  const [message, setMessage] = useState("");
  const [dialogue, setDialogue] = useState(null);
  const [encounter, setEncounter] = useState(null);
  const [time, setTime] = useState(9);
  const [questDone, setQuestDone] = useState(false);

  const collected = 28 - crystals.length;

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

  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;

      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(
          e.key.toLowerCase()
        )
      ) {
        e.preventDefault();
      }
    };

    const up = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    let animation;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;

      if (keys.w || keys.arrowup) dy -= 1;
      if (keys.s || keys.arrowdown) dy += 1;
      if (keys.a || keys.arrowleft) dx -= 1;
      if (keys.d || keys.arrowright) dx += 1;

      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        dx /= length;
        dy /= length;

        const speed = PLAYER.speed * dt;
        const next = {
          x: clamp(playerRef.current.x + dx * speed, 30, WORLD.width - 30),
          y: clamp(playerRef.current.y + dy * speed, 30, WORLD.height - 30),
        };

        let blocked = false;

        for (const tree of WORLD_OBJECTS.trees) {
          if (
            Math.hypot(next.x - tree.x, next.y - tree.y) <
            tree.r + PLAYER.size * 0.45
          ) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          for (const rock of WORLD_OBJECTS.rocks) {
            if (
              Math.hypot(next.x - rock.x, next.y - rock.y) <
              rock.r + PLAYER.size * 0.45
            ) {
              blocked = true;
              break;
            }
          }
        }

        // Lago centrale.
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

        if (!blocked) {
          playerRef.current = next;
          setPlayer({ ...next });

          // Raccolta cristalli.
          setCrystals((old) =>
            old.filter((crystal) => {
              if (distance(next, crystal) < 34) {
                setMessage("✦ Cristallo del Sogno raccolto!");
                setTimeout(() => setMessage(""), 1800);
                return false;
              }
              return true;
            })
          );

          // Erba alta → piccolo incontro casuale.
          if (
            Math.sin(next.x * 0.013 + next.y * 0.009) > 0.995 &&
            Math.random() < 0.018
          ) {
            setEncounter({
              name: ["Cillymbu", "Càncucc", "Draciocco", "Ashaadi"][
                Math.floor(Math.random() * 4)
              ],
            });
          }
        }
      }

      const target = playerRef.current;
      cameraRef.current.x += (target.x - cameraRef.current.x) * 0.1;
      cameraRef.current.y += (target.y - cameraRef.current.y) * 0.1;

      setTime((t) => (t + dt * 0.03) % 24);

      animation = requestAnimationFrame(loop);
    };

    animation = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animation);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let frame;

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const cam = cameraRef.current;
      const scale = Math.min(w / 1100, h / 700);
      const offsetX = w / 2 - cam.x * scale;
      const offsetY = h / 2 - cam.y * scale;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Mondo.
      ctx.fillStyle = "#203b29";
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);

      for (const z of ZONES) {
        ctx.fillStyle = z.color;
        ctx.globalAlpha = 0.82;
        ctx.fillRect(z.x, z.y, z.w, z.h);
      }
      ctx.globalAlpha = 1;

      // Sentieri principali.
      ctx.fillStyle = "#c7a56a";
      ctx.fillRect(0, 1010, WORLD.width, 100);
      ctx.fillRect(1740, 0, 120, WORLD.height);
      ctx.fillRect(800, 550, 2100, 70);

      // Lago.
      ctx.fillStyle = "#276b82";
      ctx.beginPath();
      ctx.roundRect(1570, 820, 460, 220, 90);
      ctx.fill();

      ctx.strokeStyle = "#6ec6d9";
      ctx.lineWidth = 7;
      for (let y = 850; y < 1010; y += 38) {
        ctx.beginPath();
        ctx.moveTo(1610, y);
        ctx.quadraticCurveTo(1730, y - 18, 1840, y);
        ctx.stroke();
      }

      // Case.
      drawHouse(ctx, 1730, 1010, "#7c4f35");
      drawHouse(ctx, 2380, 1460, "#694d39");
      drawHouse(ctx, 1210, 650, "#604b72");

      // Alberi.
      for (const tree of WORLD_OBJECTS.trees) {
        drawTree(ctx, tree.x, tree.y, tree.r);
      }

      // Rocce.
      for (const rock of WORLD_OBJECTS.rocks) {
        ctx.fillStyle = "#575757";
        ctx.beginPath();
        ctx.ellipse(rock.x, rock.y, rock.r * 1.2, rock.r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#777";
        ctx.beginPath();
        ctx.ellipse(
          rock.x - rock.r * 0.25,
          rock.y - rock.r * 0.2,
          rock.r * 0.45,
          rock.r * 0.25,
          -0.4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Cristalli.
      for (const crystal of crystals) {
        ctx.save();
        ctx.translate(crystal.x, crystal.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#b9f2ff";
        ctx.shadowColor = "#8be9fd";
        ctx.shadowBlur = 18;
        ctx.fillRect(-9, -9, 18, 18);
        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // NPC.
      for (const npc of NPCS) {
        drawNpc(ctx, npc);
      }

      // Player.
      drawPlayer(ctx, playerRef.current);

      // Zone label nel mondo.
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.roundRect(playerRef.current.x - 180, playerRef.current.y - 120, 360, 50, 20);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "700 22px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(zone.name, playerRef.current.x, playerRef.current.y - 88);

      ctx.restore();

      // Overlay notte.
      const night =
        time > 20 || time < 6
          ? 0.46
          : time > 18
          ? ((time - 18) / 2) * 0.46
          : 0;

      if (night > 0) {
        ctx.fillStyle = `rgba(8,15,40,${night})`;
        ctx.fillRect(0, 0, w, h);
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [crystals, player, zone, time]);

  const interact = () => {
    const nearest = NPCS.find((npc) => distance(playerRef.current, npc) < 90);

    if (nearest) {
      setDialogue(nearest);
      return;
    }

    setMessage("Non c'è nessuno qui con cui interagire.");
    setTimeout(() => setMessage(""), 1600);
  };

  const questText = questDone
    ? "✓ I cristalli sono stati raccolti."
    : `Raccogli 10 Cristalli del Sogno (${Math.min(collected, 10)}/10)`;

  useEffect(() => {
    if (collected >= 10 && !questDone) {
      setQuestDone(true);
      setMessage("★ Missione completata: Sentiero dei Sognatori!");
    }
  }, [collected, questDone]);

  // Il controllo accesso viene fatto dopo tutti gli hook:
  // così React non cambia mai l'ordine degli hook tra un render e l'altro.
  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
          Controllo accesso tester...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!testerAllowed) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* HUD superiore */}
      <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="rounded-2xl border border-white/15 bg-black/60 px-5 py-4 backdrop-blur-md shadow-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">
            Sognatori
          </div>
          <div className="mt-1 text-2xl font-black">AVVENTURA</div>
          <div className="mt-1 text-sm text-white/60">{zone.name}</div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-black/60 px-5 py-4 text-right backdrop-blur-md">
          <div className="text-xs text-white/50">CRISTALLI</div>
          <div className="text-xl font-black">✦ {collected} / 28</div>
          <div className="mt-1 text-xs text-white/50">
            Ore {String(Math.floor(time)).padStart(2, "0")}:
            {String(Math.floor((time % 1) * 60)).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Quest */}
      <div className="absolute left-4 top-32 w-72 rounded-2xl border border-yellow-200/15 bg-black/55 p-4 backdrop-blur-md">
        <div className="text-[11px] font-black uppercase tracking-widest text-yellow-200/70">
          Missione
        </div>
        <div className="mt-2 text-sm font-semibold">{questText}</div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-yellow-300 transition-all"
            style={{ width: `${Math.min(100, (collected / 10) * 100)}%` }}
          />
        </div>
      </div>

      {/* Minimap */}
      <div className="absolute right-4 top-32 h-40 w-56 overflow-hidden rounded-2xl border border-white/15 bg-black/65 shadow-2xl backdrop-blur-md">
        <div className="relative h-full w-full">
          {ZONES.map((z) => (
            <div
              key={z.name}
              className="absolute"
              style={{
                left: `${(z.x / WORLD.width) * 100}%`,
                top: `${(z.y / WORLD.height) * 100}%`,
                width: `${(z.w / WORLD.width) * 100}%`,
                height: `${(z.h / WORLD.height) * 100}%`,
                background: z.color,
                opacity: 0.8,
              }}
            />
          ))}
          <div
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_white]"
            style={{
              left: `${(player.x / WORLD.width) * 100}%`,
              top: `${(player.y / WORLD.height) * 100}%`,
            }}
          />
        </div>
        <div className="absolute bottom-2 left-3 text-[9px] font-bold uppercase tracking-widest text-white/50">
          Mappa del mondo
        </div>
      </div>

      {/* Controlli */}
      <div className="absolute bottom-5 left-5 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-xs text-white/60 backdrop-blur-md">
        <span className="font-bold text-white">WASD / FRECCE</span> · muovi
        <br />
        <span className="font-bold text-white">E</span> · interagisci
      </div>

      <button
        onClick={interact}
        className="absolute bottom-5 right-5 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black backdrop-blur-md transition hover:bg-white/20 active:scale-95"
      >
        E · INTERAGISCI
      </button>

      {/* Messaggio */}
      {message && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/75 px-6 py-3 text-sm font-bold shadow-2xl backdrop-blur-md">
          {message}
        </div>
      )}

      {/* Dialogo */}
      {dialogue && (
        <div className="absolute inset-x-4 bottom-5 mx-auto max-w-3xl rounded-3xl border border-white/15 bg-black/85 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 text-sm font-black uppercase tracking-widest text-yellow-200">
            {dialogue.name}
          </div>
          <div className="text-base leading-7 text-white/85">{dialogue.dialogue}</div>
          <button
            onClick={() => setDialogue(null)}
            className="mt-5 rounded-xl bg-white px-5 py-2 text-sm font-black text-black"
          >
            Continua
          </button>
        </div>
      )}

      {/* Incontro */}
      {encounter && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[min(420px,90vw)] rounded-3xl border border-white/15 bg-zinc-950 p-7 text-center shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-white/40">
              Incontro selvatico
            </div>
            <div className="mt-4 text-4xl font-black">{encounter.name}</div>
            <div className="mt-3 text-sm text-white/50">
              Un Sognatore è apparso nell'erba alta.
            </div>
            <button
              onClick={() => setEncounter(null)}
              className="mt-7 w-full rounded-xl bg-yellow-300 py-3 font-black text-black"
            >
              Affronta
            </button>
            <button
              onClick={() => setEncounter(null)}
              className="mt-2 w-full rounded-xl bg-white/10 py-3 font-bold"
            >
              Fuggi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function drawPlayer(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // corpo
  ctx.fillStyle = "#f2c14e";
  ctx.beginPath();
  ctx.roundRect(-14, -4, 28, 34, 9);
  ctx.fill();

  // testa
  ctx.fillStyle = "#f4d7b5";
  ctx.beginPath();
  ctx.arc(0, -14, 16, 0, Math.PI * 2);
  ctx.fill();

  // capelli
  ctx.fillStyle = "#2d211d";
  ctx.beginPath();
  ctx.arc(0, -18, 16, Math.PI, Math.PI * 2);
  ctx.fill();

  // occhi
  ctx.fillStyle = "#111";
  ctx.fillRect(-6, -16, 3, 4);
  ctx.fillRect(3, -16, 3, 4);

  ctx.restore();
}

function drawTree(ctx, x, y, r) {
  ctx.fillStyle = "#573b27";
  ctx.fillRect(x - 8, y, 16, r * 1.8);

  ctx.fillStyle = "#183f2a";
  ctx.beginPath();
  ctx.arc(x, y - 12, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#27613b";
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.62, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3e7d48";
  ctx.beginPath();
  ctx.arc(x + r * 0.35, y - r * 0.2, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHouse(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 190, 130);

  ctx.fillStyle = "#40251b";
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x + 95, y - 95);
  ctx.lineTo(x + 210, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d9c29c";
  ctx.fillRect(x + 72, y + 58, 42, 72);

  ctx.fillStyle = "#8ed1dc";
  ctx.fillRect(x + 25, y + 35, 35, 35);
  ctx.fillRect(x + 130, y + 35, 35, 35);
}

function drawNpc(ctx, npc) {
  ctx.save();
  ctx.translate(npc.x, npc.y);

  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(0, 25, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = npc.color;
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4d7b5";
  ctx.beginPath();
  ctx.arc(0, -20, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.fillRect(-5, -22, 3, 4);
  ctx.fillRect(3, -22, 3, 4);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(npc.name, 0, 43);

  ctx.restore();
}
