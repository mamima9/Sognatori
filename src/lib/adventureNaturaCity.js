// Renderer dedicato alla città Natura: Verdelume.
// Mantiene la stessa scala e gli stessi ingombri delle collisioni del quartiere standard.
export function drawAdventureNaturaCity(ctx, city) {
  const x = Math.round(city.x / 4) * 4;
  const y = Math.round(city.y / 4) * 4;
  const buildings = [
    [-132, -88], [0, -158], [132, -88],
    [-132, 88], [132, 88], [0, 158],
  ];
  const treehouse = (bx, by, variant = 0) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.fillStyle = "rgba(12,25,17,.34)";
    ctx.beginPath(); ctx.ellipse(8, 35, 43, 13, 0, 0, Math.PI * 2); ctx.fill();
    // Radici e tronco portante.
    ctx.fillStyle = "#493526"; ctx.fillRect(-8, -5, 16, 54);
    ctx.fillStyle = "#765033"; ctx.fillRect(-5, -5, 6, 49);
    for (let root = -1; root <= 1; root++) {
      ctx.strokeStyle = "#65462f"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(root * 23, 48); ctx.stroke();
    }
    // Chioma a più livelli, con luci pixel.
    for (const [cx, cy, rx, ry, color] of [
      [-24, -34, 25, 22, "#28633f"], [0, -55, 31, 27, variant % 2 ? "#34794a" : "#2e7045"],
      [26, -34, 25, 22, "#3b854d"], [0, -22, 33, 20, "#438f50"]
    ]) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#a6d879"; ctx.fillRect(-17, -62, 7, 5); ctx.fillRect(13, -42, 8, 5);
    ctx.fillStyle = "#e4c77b"; ctx.fillRect(-4, -73, 8, 5);
    // Casetta incastonata nella chioma.
    ctx.fillStyle = "#68482f"; ctx.fillRect(-19, -28, 38, 27);
    ctx.fillStyle = "#b77d4b"; ctx.fillRect(-23, -32, 46, 8);
    ctx.fillStyle = "#e5bd78"; ctx.beginPath(); ctx.moveTo(-24, -31); ctx.lineTo(0, -48); ctx.lineTo(24, -31); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#283e32"; ctx.fillRect(-5, -17, 11, 16);
    ctx.fillStyle = "#f5d98d"; ctx.fillRect(-15, -23, 7, 7); ctx.fillRect(9, -23, 7, 7);
    // Pedana e scala a pioli.
    ctx.fillStyle = "#8c603c"; ctx.fillRect(-29, -3, 58, 6);
    ctx.strokeStyle = "#b88751"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(22, 34); ctx.moveTo(31, 0); ctx.lineTo(31, 34); ctx.stroke();
    for (let rung = 7; rung < 34; rung += 8) { ctx.beginPath(); ctx.moveTo(22, rung); ctx.lineTo(31, rung); ctx.stroke(); }
    ctx.restore();
  };

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.55, 1.55);
  ctx.imageSmoothingEnabled = false;

  // Base della radura e anello di pietra naturale.
  ctx.fillStyle = "rgba(12,30,18,.28)";
  ctx.beginPath(); ctx.ellipse(0, 10, 214, 174, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#315d3d";
  ctx.beginPath(); ctx.ellipse(0, 0, 204, 164, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#639653";
  ctx.beginPath(); ctx.ellipse(0, -5, 190, 151, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#b5a477"; ctx.lineWidth = 17;
  ctx.beginPath(); ctx.ellipse(0, 0, 168, 135, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(238,222,170,.72)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 168, 135, 0, 0, Math.PI * 2); ctx.stroke();

  // Sentieri in terra battuta che convergono sul Grande Seme.
  ctx.lineCap = "round";
  for (const [tx, ty] of [[-132,-88],[0,-158],[132,-88],[-132,88],[132,88],[0,158]]) {
    ctx.strokeStyle = "#725638"; ctx.lineWidth = 23;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tx * .78, ty * .78); ctx.stroke();
    ctx.strokeStyle = "#c6a878"; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tx * .78, ty * .78); ctx.stroke();
    ctx.strokeStyle = "rgba(238,220,166,.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tx * .78, ty * .78); ctx.stroke();
  }

  // Aiuole, piccoli corsi d'acqua e vegetazione ai bordi della piazza.
  for (const side of [-1, 1]) {
    ctx.fillStyle = "#315d3c";
    ctx.beginPath(); ctx.ellipse(side * 151, 50, 27, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#82b65b";
    ctx.beginPath(); ctx.ellipse(side * 151, 45, 21, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d6e79b";
    for (let i = 0; i < 4; i++) ctx.fillRect(side * 151 - 12 + i * 8, 39 + (i % 2) * 7, 4, 4);
  }
  ctx.fillStyle = "#347c82";
  ctx.beginPath(); ctx.ellipse(-83, 91, 35, 13, -.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#83d4bd";
  ctx.beginPath(); ctx.ellipse(-83, 88, 26, 6, -.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#b4df7c";
  for (let i = 0; i < 9; i++) {
    const fx = -185 + i * 45;
    ctx.fillRect(fx, 111 + (i % 3) * 7, 3, 8);
    ctx.fillRect(fx - 4, 111 + (i % 3) * 7, 4, 3);
    ctx.fillRect(fx + 3, 108 + (i % 3) * 7, 4, 3);
  }

  // Sei case-albero: posizioni e ingombri restano compatibili con le collisioni esistenti.
  buildings.forEach(([bx, by], index) => treehouse(bx, by, index));

  // Grande Seme al centro, circondato da radici e pietre votive.
  ctx.fillStyle = "rgba(22,45,25,.38)";
  ctx.beginPath(); ctx.ellipse(0, 28, 58, 19, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#765334"; ctx.lineWidth = 9;
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(side * 25, 10, side * 40, 20, side * 53, 5); ctx.stroke();
  }
  ctx.fillStyle = "#775235"; ctx.fillRect(-10, -23, 20, 54);
  ctx.fillStyle = "#a1ce68";
  for (const [lx, ly, rx, ry] of [[0,-45,34,28],[-24,-30,23,18],[24,-30,23,18],[0,-12,29,19]]) {
    ctx.beginPath(); ctx.ellipse(lx, ly, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#d9ef9a"; ctx.fillRect(-5, -52, 10, 15);
  ctx.fillStyle = "#f4e6a2"; ctx.fillRect(-2, -57, 4, 5);
  ctx.fillStyle = "rgba(255,246,190,.32)";
  ctx.beginPath(); ctx.arc(0, -31, 47, 0, Math.PI * 2); ctx.fill();

  // Piccoli funghi, fiori e pietre decorative, disposti in modo deterministico.
  for (let i = 0; i < 16; i++) {
    const a = i * 2.399;
    const px = Math.cos(a) * (178 + (i % 3) * 7);
    const py = Math.sin(a) * (125 + (i % 3) * 5);
    ctx.fillStyle = i % 2 ? "#e8d6a2" : "#c5b58b";
    ctx.fillRect(px - 4, py, 9, 5);
    ctx.fillStyle = i % 3 ? "#e6b7c4" : "#f1dc8d";
    ctx.fillRect(px + 8, py - 5, 4, 4);
    ctx.fillStyle = "#f5edc5"; ctx.fillRect(px + 9, py - 6, 2, 2);
  }

  // Targhetta del quartiere.
  ctx.fillStyle = "rgba(8,18,15,.88)"; ctx.fillRect(-92, 188, 184, 23);
  ctx.fillStyle = "#a9d67c"; ctx.fillRect(-92, 188, 5, 23);
  ctx.fillStyle = "#fff5df"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
  ctx.fillText("VERDELUME · CASE-ALBERO", 0, 203, 174);
  ctx.restore();
}
