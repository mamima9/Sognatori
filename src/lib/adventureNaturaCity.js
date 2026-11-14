// Verdelume — distretto Natura, renderer dedicato in stile RPG portatile 2012.
// Solo resa visiva: coordinate di gioco, collisioni, trigger e interazioni restano invariati.
export function drawAdventureNaturaCity(ctx, city) {
  const x = Math.round(city.x / 4) * 4;
  const y = Math.round(city.y / 4) * 4;
  const t = performance.now() / 1000;
  const houses = [
    [-178, -112, 0], [-58, -202, 1], [104, -174, 2],
    [190, -52, 3], [112, 126, 4], [-86, 166, 5], [-204, 40, 6]
  ];
  const ellipse = (px, py, rx, ry, color) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  };
  const path = (points, color, width) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
  };
  const tree = (tx, ty, size = 1, tone = 0) => {
    ctx.save(); ctx.translate(tx, ty); ctx.scale(size, size);
    ellipse(5, 22, 31, 10, "rgba(13,30,19,.30)");
    ctx.fillStyle = "#513a2a"; ctx.fillRect(-7, -7, 14, 34);
    ctx.fillStyle = "#8c6340"; ctx.fillRect(-3, -4, 5, 25);
    for (const [cx, cy, rx, ry, col] of [
      [-19,-25,22,20,tone ? "#28603b" : "#245638"],
      [3,-42,27,25,tone ? "#39794a" : "#347247"],
      [25,-25,21,20,tone ? "#43834d" : "#3b824a"],
      [0,-13,29,20,tone ? "#4b9252" : "#43864d"]
    ]) ellipse(cx, cy, rx, ry, col);
    ctx.fillStyle = "#9dcc68";
    ctx.fillRect(-18,-34,8,5); ctx.fillRect(8,-49,9,5); ctx.fillRect(22,-21,6,4);
    ctx.fillStyle = "#d7e99a"; ctx.fillRect(-3,-54,5,4);
    ctx.restore();
  };
  const treehouse = (bx, by, variant = 0) => {
    ctx.save(); ctx.translate(bx, by);
    ellipse(8, 38, 48, 14, "rgba(12,25,17,.38)");
    // Radici, tronco e piattaforma su più livelli.
    ctx.fillStyle = "#493526"; ctx.fillRect(-10, -12, 20, 58);
    ctx.fillStyle = "#80583a"; ctx.fillRect(-5, -9, 6, 52);
    for (let k=-1;k<=1;k++) path([[0,31],[k*19,49]], "#65462f", 5);
    ctx.fillStyle = "#765334"; ctx.fillRect(-34, -9, 68, 7);
    ctx.fillStyle = "#c08b53"; ctx.fillRect(-31, -12, 62, 4);
    // Chioma con volumi sovrapposti.
    for (const [cx,cy,rx,ry,col] of [
      [-27,-39,28,24,"#245638"],[0,-59,36,31,variant%2?"#39794a":"#2e7045"],
      [29,-39,28,24,"#347247"],[0,-25,39,25,"#438b4d"]
    ]) ellipse(cx,cy,rx,ry,col);
    ctx.fillStyle="#9acb67"; ctx.fillRect(-24,-49,9,6); ctx.fillRect(9,-67,10,6); ctx.fillRect(24,-34,8,5);
    ctx.fillStyle="#d6e994"; ctx.fillRect(-4,-77,8,5);
    // Casetta, tetto a scandole e finestre.
    ctx.fillStyle="#493526"; ctx.fillRect(-24,-34,48,33);
    ctx.fillStyle="#98613b"; ctx.fillRect(-27,-32,54,8);
    ctx.fillStyle="#d4a46a"; ctx.beginPath(); ctx.moveTo(-31,-31); ctx.lineTo(0,-54); ctx.lineTo(31,-31); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#9b6a42"; ctx.fillRect(-26,-29,52,4);
    for(let sh=-22;sh<25;sh+=9){ctx.fillStyle="#b77d4b";ctx.fillRect(sh,-28,6,3);}
    ctx.fillStyle="#283e32"; ctx.fillRect(-6,-17,12,18);
    ctx.fillStyle="#493526"; ctx.fillRect(-18,-26,11,11); ctx.fillRect(7,-26,11,11);
    ctx.fillStyle="#8bd1d0"; ctx.fillRect(-16,-24,7,7); ctx.fillRect(9,-24,7,7);
    ctx.fillStyle="#f6d98c"; ctx.fillRect(-13,-23,2,5); ctx.fillRect(12,-23,2,5);
    // Balcone, ringhiera, scala e lanterna.
    ctx.fillStyle="#68472f"; ctx.fillRect(-34,-7,68,5);
    ctx.fillStyle="#d2a36a"; ctx.fillRect(-32,-9,64,2);
    ctx.fillStyle="#8d603c"; for(let post=-29;post<=27;post+=8)ctx.fillRect(post,-16,3,8);
    ctx.fillRect(-35,-17,70,3);
    path([[-20,-3],[-29,9]],"#493526",4); path([[20,-3],[29,9]],"#493526",4);
    ctx.strokeStyle="#b88751";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(25,0);ctx.lineTo(25,38);ctx.moveTo(34,0);ctx.lineTo(34,38);ctx.stroke();
    for(let rung=8;rung<38;rung+=8){ctx.beginPath();ctx.moveTo(25,rung);ctx.lineTo(34,rung);ctx.stroke();}
    ctx.strokeStyle="#78a957";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-29,-50);ctx.quadraticCurveTo(-39,-31,-31,-18);ctx.moveTo(28,-54);ctx.quadraticCurveTo(39,-37,31,-23);ctx.stroke();
    ctx.strokeStyle="#493526";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-35);ctx.lineTo(0,-29);ctx.stroke();
    ctx.fillStyle="#f6d77e";ctx.fillRect(-4,-29,8,9);ctx.fillStyle="rgba(255,220,120,.22)";ctx.fillRect(-7,-32,14,15);
    ctx.restore();
  };
  const lamp = (lx,ly) => {
    ctx.fillStyle="#493526";ctx.fillRect(lx-3,ly-3,6,38);
    ctx.fillStyle="#8d603c";ctx.fillRect(lx-9,ly-7,18,5);
    ctx.fillStyle="#f4d77e";ctx.fillRect(lx-5,ly-20,10,13);
    ctx.fillStyle="#fff0b0";ctx.fillRect(lx-2,ly-18,4,9);
    ellipse(lx,ly-13,15,17,"rgba(255,220,120,.10)");
    ctx.fillStyle="#493526";ctx.fillRect(lx-8,ly+34,16,4);
  };

  ctx.save(); ctx.translate(x,y); ctx.scale(1.55,1.55); ctx.imageSmoothingEnabled=false;
  // Margine boschivo: la città emerge da una radura, non da un'isola piatta.
  ellipse(0,4,292,238,"rgba(8,24,17,.34)");
  ellipse(0,-5,278,226,"#254e35");
  ellipse(0,-8,265,214,"#477c49");
  for(let i=0;i<34;i++){
    const a=i*2.399, rx=239+(i%4)*7, ry=183+(i%3)*8;
    tree(Math.cos(a)*rx,Math.sin(a)*ry,0.72+(i%3)*0.13,i%2);
  }
  // Prato centrale e sentieri radiali con bordi in pietra.
  ellipse(0,0,220,178,"#5c934e");
  ellipse(0,-5,207,165,"#78a95a");
  ctx.strokeStyle="#b6a477";ctx.lineWidth=22;ctx.beginPath();ctx.ellipse(0,0,184,148,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="#e1d0a0";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,184,148,0,0,Math.PI*2);ctx.stroke();
  for(const [tx,ty] of [[-178,-112],[-58,-202],[104,-174],[190,-52],[112,126],[-86,166],[-204,40]]){
    path([[0,0],[tx*.78,ty*.78]],"#725638",28);
    path([[0,0],[tx*.78,ty*.78]],"#c8aa78",19);
    path([[0,0],[tx*.78,ty*.78]],"rgba(255,239,194,.48)",2);
  }
  // Piccola piazza pavimentata: lastre irregolari e stemma della città.
  ellipse(0,0,91,70,"#8b9a68"); ellipse(0,-3,83,63,"#c2b58b");
  ctx.strokeStyle="rgba(102,88,62,.38)";ctx.lineWidth=1.5;
  for(let row=-3;row<=3;row++){const py=row*17,half=78*Math.sqrt(Math.max(.1,1-py*py/4100));ctx.beginPath();ctx.moveTo(-half,py);ctx.lineTo(half,py);ctx.stroke();}
  for(let col=-4;col<=4;col++){const px=col*18;ctx.beginPath();ctx.moveTo(px,-60);ctx.lineTo(px*.84,60);ctx.stroke();}
  // Canale e stagno con rive, ponticello e riflessi animati.
  ctx.save();ctx.translate(-133,78);ctx.rotate(-.25);
  ellipse(0,0,57,24,"#3e6c49");ellipse(0,-2,51,18,"#276e78");ellipse(0,-5,43,11,"#6bb9b0");
  ctx.strokeStyle="rgba(219,250,222,.68)";ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,-5,25+Math.sin(t*2.2)*4,5,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#493526";ctx.fillRect(-43,-9,86,18);ctx.fillStyle="#b9854d";ctx.fillRect(-39,-7,78,13);
  for(let plank=-32;plank<=32;plank+=12){ctx.fillStyle="#e0b875";ctx.fillRect(plank,-7,3,13);}
  ctx.fillStyle="#765334";ctx.fillRect(-45,-13,90,4);ctx.fillRect(-45,9,90,4);
  ctx.restore();
  // Aiuole fiorite, recinzioni basse, orti e filari.
  for(const [gx,gy,flip] of [[-184,-10,1],[176,78,-1],[-90,137,1],[80,-136,-1]]){
    ctx.fillStyle="#765334";ctx.fillRect(gx-23,gy-10,46,20);
    ctx.fillStyle="#9c7449";ctx.fillRect(gx-20,gy-8,40,14);
    for(let j=0;j<5;j++){ctx.fillStyle=j%2?"#80b85c":"#a5cf70";ctx.fillRect(gx-16+j*8,gy-7,4,10);}
    for(let j=0;j<4;j++){ctx.fillStyle=["#f2d98b","#e7b6c9","#e9edc4","#d5c4ed"][j];ctx.fillRect(gx-16+j*10,gy-13-(j%2)*3,5,5);}
    ctx.fillStyle="#68472f";for(let j=0;j<6;j++)ctx.fillRect(gx-24+j*9,gy+12,3,4);
  }
  // Pozzetto, bacheca, panchine e lanterne: punti d'interesse urbani.
  ellipse(92,28,23,10,"rgba(15,30,20,.25)");
  ctx.fillStyle="#786f59";ctx.fillRect(71,13,42,19);ctx.fillStyle="#c2b58b";ctx.fillRect(74,10,36,7);
  ellipse(92,13,17,6,"#3e8b91");ellipse(92,11,11,3,"#b1e0ca");
  ctx.fillStyle="#493526";ctx.fillRect(-36,89,39,6);ctx.fillStyle="#b9854d";ctx.fillRect(-34,86,35,5);
  ctx.fillStyle="#765334";ctx.fillRect(-29,95,4,9);ctx.fillRect(-7,95,4,9);
  ctx.fillStyle="#493526";ctx.fillRect(30,-91,34,6);ctx.fillStyle="#b9854d";ctx.fillRect(32,-94,30,5);
  ctx.fillStyle="#765334";ctx.fillRect(36,-86,4,8);ctx.fillRect(54,-86,4,8);
  ctx.fillStyle="#493526";ctx.fillRect(147,-104,5,45);ctx.fillStyle="#b9854d";ctx.fillRect(132,-112,35,15);
  ctx.fillStyle="#f4e7c5";ctx.fillRect(136,-109,27,8);ctx.fillStyle="#527d43";ctx.font="bold 6px monospace";ctx.textAlign="center";ctx.fillText("BACHECA",149,-103);
  for(const [lx,ly] of [[-190,-74],[190,-5],[-125,145],[126,145],[8,-185]])lamp(lx,ly);
  // Case-albero in profondità: quelle posteriori prima, quelle anteriori per ultime.
  houses.slice(0,3).forEach(([hx,hy,v])=>treehouse(hx,hy,v));
  // Alberi singoli e cespugli tra gli edifici.
  for(const [tx,ty,sz] of [[-244,4,.82],[236,48,.9],[-146,172,.76],[155,-196,.8],[-8,206,.72],[224,-133,.72]])tree(tx,ty,sz,1);
  // Grande Seme e radici sacre al centro della piazza.
  ellipse(0,26,65,22,"rgba(20,45,25,.36)");
  for(const side of [-1,1])path([[0,28],[side*24,17],[side*43,28],[side*58,8]],"#765334",9);
  ctx.fillStyle="#68472f";ctx.fillRect(-13,-24,26,58);
  for(const [sx,sy,rx,ry,col] of [[0,-52,37,31,"#5b934b"],[-28,-32,26,20,"#76a95a"],[28,-32,26,20,"#76a95a"],[0,-14,32,22,"#86b962"]])ellipse(sx,sy,rx,ry,col);
  ellipse(0,-46,13,17,"#c6df83");ellipse(0,-49,6,10,"#f3e8a8");
  ellipse(0,-31,48,48,"rgba(242,255,177,.09)");
  // Pietre votive, piccoli funghi, fiori e ciuffi d'erba posizionati con seed fisso.
  for(let i=0;i<42;i++){
    const a=i*2.399,rr=95+(i%5)*27,px=Math.cos(a)*rr,py=Math.sin(a)*rr*.72;
    if(i%3===0){ctx.fillStyle="#b8aa83";ctx.fillRect(px,py,10,6);ctx.fillStyle="#e0d0a6";ctx.fillRect(px+2,py,5,2);}
    else if(i%3===1){ctx.fillStyle="#e6b7c4";ctx.fillRect(px,py,4,4);ctx.fillStyle="#f5edc5";ctx.fillRect(px+1,py-2,2,2);}
    else{ctx.fillStyle="#4d8248";ctx.fillRect(px,py,3,8);ctx.fillRect(px-4,py+2,5,3);ctx.fillRect(px+2,py-2,5,3);}
  }
  // Edifici e chiome in primo piano.
  houses.slice(3).forEach(([hx,hy,v])=>treehouse(hx,hy,v));
  // Abitazioni e botteghe al piede degli alberi: insegne e cassette.
  for(const [sx,sy,label] of [[-178,-112,"ERBE"],[-58,-202,"RIFUGIO"],[104,-174,"LOCANDA"],[190,-52,"ORTO"],[112,126,"LEGNO"],[-86,166,"SEMI"],[-204,40,"TISANE"]]){
    ctx.fillStyle="#493526";ctx.fillRect(sx-19,sy-5,38,7);
    ctx.fillStyle="#e2c28b";ctx.fillRect(sx-17,sy-4,34,4);
    ctx.fillStyle="#493526";ctx.font="bold 5px monospace";ctx.textAlign="center";ctx.fillText(label,sx,sy,34);
  }
  // Creature ambientali animate: lucciole, farfalle, rane e foglie.
  for(let i=0;i<12;i++){
    const phase=t*(.55+(i%4)*.12)+i*1.6,px=Math.sin(phase)*(125+(i%3)*30),py=-110+Math.cos(phase*.8)*72+(i%4)*13;
    ctx.fillStyle="rgba(226,255,151,"+(0.3+(Math.sin(phase*2)+1)*.3).toFixed(2)+")";ctx.fillRect(px,py,3,3);
  }
  for(const [fx,fy,col] of [[-96,-130,"#f0c5d2"],[118,-122,"#f4df8e"],[202,20,"#d7c4f2"]]){
    ctx.fillStyle=col;ctx.fillRect(fx-7,fy-3,6,6);ctx.fillRect(fx+1,fy-3,6,6);ctx.fillStyle="#59452f";ctx.fillRect(fx-1,fy-4,2,9);
  }
  ctx.fillStyle="#4b8b50";
  for(const [fx,fy] of [[-164,92],[-112,112]]){ctx.fillRect(fx-5,fy-3,10,7);ctx.fillRect(fx-7,fy-6,4,4);ctx.fillRect(fx+3,fy-6,4,4);ctx.fillStyle="#f5e9ad";ctx.fillRect(fx-4,fy-5,2,2);ctx.fillRect(fx+2,fy-5,2,2);ctx.fillStyle="#4b8b50";}
  for(let i=0;i<6;i++){const phase=t*1.15+i*2.1,lx=Math.sin(phase)*170,ly=-174+(i%3)*28+Math.cos(phase)*5;ctx.save();ctx.translate(lx,ly);ctx.rotate(Math.sin(phase)*.3);ctx.fillStyle="#b5dc79";ctx.fillRect(-5,-2,10,4);ctx.fillRect(-1,-5,2,10);ctx.restore();}
  // Targa d'ingresso in pietra e stemma della foglia.
  ctx.fillStyle="rgba(8,18,15,.9)";ctx.fillRect(-91,220,182,25);
  ctx.fillStyle="#a9d67c";ctx.fillRect(-91,220,5,25);
  ctx.fillStyle="#fff5df";ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.fillText("VERDELUME  ·  CASE-ALBERO",0,236,172);
  ctx.restore();
}
