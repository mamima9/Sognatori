// AMARGENTA — capitale segreta degli Amaro, la Città del Caffè.
// Scena Canvas ad alta densità: pixel-art RPG moderna, architettura stratificata,
// piantagioni di Coffea, torrefazioni, piazze, insegne, vapore e luci animate.
const P = {
  ink:"#21191b", shadow:"#302126", stone:"#594039", stoneLight:"#92705a",
  soil:"#4a3028", bark:"#65402f", cocoa:"#80513a", roast:"#a66a43",
  copper:"#c1844e", gold:"#e7b66b", cream:"#f4dfb8", ivory:"#fff1d4",
  leaf:"#456b45", leaf2:"#6f914f", leaf3:"#9eaa62", water:"#315e5a",
  waterLight:"#78b6a0", window:"#ffcf7b"
};
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const ellipse=(c,x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function line(c,pts,col,width=2){c.strokeStyle=col;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();}
function text(c,s,x,y,size=7,col=P.ivory){c.fillStyle=col;c.font="bold "+size+"px monospace";c.textAlign="center";c.fillText(s,x,y);}
function glow(c,x,y,r,a,col=P.gold){c.save();c.globalAlpha=a;ellipse(c,x,y,r,r,col);c.restore();}
function bean(c,x,y,s=1,rot=0){c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);ellipse(c,0,0,8,13,"#382321");ellipse(c,-1,-1,6,11,"#9b5b37");line(c,[[-1,-9],[2,-4],[-2,1],[1,8]],"#e0a36a",1.5);c.restore();}
function crystal(c,x,y,s=1,col=P.gold){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,2,17,17,6,"rgba(0,0,0,.28)");c.fillStyle=P.shadow;c.beginPath();c.moveTo(0,-30);c.lineTo(14,-7);c.lineTo(9,15);c.lineTo(-9,15);c.lineTo(-14,-7);c.closePath();c.fill();c.fillStyle=col;c.beginPath();c.moveTo(0,-26);c.lineTo(9,-6);c.lineTo(6,11);c.lineTo(-6,11);c.lineTo(-9,-6);c.closePath();c.fill();line(c,[[0,-24],[0,9]],P.ivory,1.5);c.restore();}
function coffeeTree(c,x,y,s=1,phase=0){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,2,20,22,7,"rgba(0,0,0,.25)");rect(c,-4,-9,8,29,P.bark);ellipse(c,-13,-20,17,16,P.leaf);ellipse(c,5,-31,22,20,P.leaf2);ellipse(c,21,-17,16,15,P.leaf);ellipse(c,0,-9,22,15,P.leaf2);for(let i=0;i<5;i++){const a=i*2.4+phase;const bx=Math.cos(a)*13,by=-19+Math.sin(a)*11;ellipse(c,bx,by,3,5,i%2?"#b65b45":"#d07a4c");}line(c,[[-12,-28],[0,-38],[14,-30]],"#b7c57c",2);c.restore();}
function lamp(c,x,y,t,i=0){rect(c,x-3,y-1,6,30,P.ink);rect(c,x-9,y-7,18,5,P.copper);rect(c,x-7,y-22,14,16,P.gold);rect(c,x-4,y-19,8,10,P.ivory);glow(c,x,y-13,23,.07+.04*Math.sin(t*2+i));}
function roof(c,x,y,w,col=P.shadow){c.fillStyle=col;c.beginPath();c.moveTo(x-w/2-9,y);c.lineTo(x,y-30);c.lineTo(x+w/2+9,y);c.closePath();c.fill();line(c,[[x-w/2-7,y-2],[x,y-29],[x+w/2+7,y-2]],P.copper,3);}
function cafe(c,x,y,name,kind=0){c.save();c.translate(x,y);const w=kind===1?88:72,h=kind===1?65:56;ellipse(c,4,h/2+9,w*.7,10,"rgba(0,0,0,.3)");rect(c,-w/2-5,-h/2+10,w+10,h,P.ink);rect(c,-w/2,-h/2+14,w,h-5,kind%2?"#936044":"#80503a");rect(c,-w/2+5,-h/2+18,w-10,h-13,"#b17b50");roof(c,0,-h/2+17,w,kind===1?"#382426":"#49302a");for(const wx of [-w/2+13,w/2-27]){rect(c,wx,-h/2+25,17,20,P.shadow);rect(c,wx+3,-h/2+28,11,14,P.window);rect(c,wx+8,-h/2+28,2,14,P.copper);}rect(c,-10,h/2-25,20,26,P.shadow);rect(c,-7,h/2-22,14,23,"#bd8758");rect(c,-w/2+7,h/2-39,w-14,10,"#302126");rect(c,-w/2+10,h/2-37,w-20,6,P.gold);text(c,name,0,h/2-30,5,P.ink);if(kind===1){rect(c,-w/2-4,-h/2+4,w+8,5,P.gold);bean(c,0,-h/2-6,1.2);}c.restore();}
function roastery(c,x,y,t){c.save();c.translate(x,y);ellipse(c,0,31,55,13,"rgba(0,0,0,.3)");rect(c,-48,-26,96,58,"#49302a");rect(c,-42,-20,84,48,"#a36c46");roof(c,0,-20,84,"#302126");rect(c,-31,-8,26,28,"#392426");rect(c,-27,-4,18,20,"#d08b51");rect(c,8,-8,25,28,"#392426");rect(c,12,-4,17,20,"#e2ae69");rect(c,-7,-40,14,21,"#5a3a32");rect(c,-4,-54,8,16,"#302126");for(let i=0;i<3;i++){const p=t*0.7+i*1.7;ellipse(c,Math.sin(p)*5,-62-i*13,5+i,4+i,"rgba(238,222,194,"+(.35-i*.08)+")");}text(c,"TORREFAZIONE",0,24,6,P.ivory);c.restore();}
function cupFountain(c,x,y,t){c.save();c.translate(x,y);ellipse(c,0,28,55,15,"rgba(0,0,0,.28)");ellipse(c,0,15,50,14,P.stone);ellipse(c,0,11,43,10,P.gold);rect(c,-30,-22,60,32,P.cream);rect(c,-26,-18,52,24,"#8e5338");rect(c,-21,-15,42,16,"#4a2926");c.strokeStyle=P.cream;c.lineWidth=7;c.beginPath();c.arc(31,-7,13,-Math.PI/2,Math.PI/2);c.stroke();ellipse(c,0,-23,30,7,"#e6c18d");ellipse(c,0,-25,23,5,"#4a2926");for(let i=0;i<5;i++){const a=t*1.7+i*1.25;ellipse(c,Math.cos(a)*34,-7+Math.sin(a)*3,2,3,P.ivory);}for(let i=0;i<3;i++){const p=t*1.3+i*2;line(c,[[Math.sin(p)*5,-33],[Math.sin(p+.5)*8,-45],[Math.sin(p+1)*3,-56]],"rgba(255,235,194,.65)",2);}c.restore();}
function beanMonument(c,x,y,t){c.save();c.translate(x,y);ellipse(c,0,25,50,12,"rgba(0,0,0,.3)");rect(c,-38,9,76,13,P.stone);rect(c,-32,4,64,8,P.stoneLight);ellipse(c,0,-16,24,34,"#392321");ellipse(c,-3,-18,18,27,"#a35e39");line(c,[[0,-40],[5,-26],[-2,-12],[3,8]],"#f0bd79",4);for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.12;glow(c,Math.cos(a)*37,-14+Math.sin(a)*37,3,.7);}c.restore();}
function terrace(c,x,y,w,h){c.save();rect(c,x-w/2,y-h/2,w,h,"#654334");rect(c,x-w/2+4,y-h/2+4,w-8,h-8,"#9b6947");rect(c,x-w/2+9,y-h/2+9,w-18,5,"#c38a57");for(let i=0;i<5;i++){const xx=x-w/2+14+i*(w-28)/4;coffeeTree(c,xx,y+5,.42,i);}c.restore();}
export function drawAdventureAmaroCity(ctx,city){
  const t=performance.now()/1000;ctx.save();ctx.translate(Math.round(city.x/4)*4,Math.round(city.y/4)*4);ctx.scale(1.55,1.55);ctx.imageSmoothingEnabled=false;
  // Fondovalle terrazzato e mura concentriche della città fortificata.
  ellipse(ctx,0,22,316,248,"rgba(0,0,0,.32)");ellipse(ctx,0,5,302,238,"#302126");ellipse(ctx,0,-3,287,226,"#654334");ellipse(ctx,0,-7,274,215,"#b17a50");ellipse(ctx,0,-8,259,202,"#51372f");ellipse(ctx,0,-8,244,189,"#c18a58");
  // Mura merlate, contrafforti e torri con lanterne.
  for(let i=0;i<40;i++){const a=i*Math.PI*2/40,x=Math.cos(a)*251,y=-8+Math.sin(a)*193;ctx.save();ctx.translate(x,y);ctx.rotate(a);rect(ctx,-7,-10,14,22,"#50342d");rect(ctx,-5,-8,10,16,"#d09a63");rect(ctx,-8,-13,16,5,"#f0c17c");ctx.restore();}
  for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8,x=Math.cos(a)*235,y=-8+Math.sin(a)*177;ellipse(ctx,x,y+5,18,10,"rgba(0,0,0,.28)");rect(ctx,x-13,y-19,26,27,"#49302b");rect(ctx,x-9,y-16,18,20,"#b77c4e");ctx.fillStyle="#392426";ctx.beginPath();ctx.moveTo(x-17,y-18);ctx.lineTo(x,y-43);ctx.lineTo(x+17,y-18);ctx.closePath();ctx.fill();rect(ctx,x-3,y-13,6,13,P.window);glow(ctx,x,y-29,16,.08);}
  // Strade radiali in pietra e canali di drenaggio.
  ctx.strokeStyle="#52372e";ctx.lineWidth=35;ctx.beginPath();ctx.ellipse(0,-5,194,151,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#d0a071";ctx.lineWidth=25;ctx.beginPath();ctx.ellipse(0,-5,192,149,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#f0d0a0";ctx.lineWidth=2;ctx.setLineDash([7,10]);ctx.beginPath();ctx.ellipse(0,-5,192,149,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  const blocks=[[-139,-93],[0,-164],[139,-93],[-139,93],[139,93],[0,164]];
  for(const [x,y] of blocks){line(ctx,[[0,0],[x*.82,y*.82]],"#604033",31);line(ctx,[[0,-2],[x*.82,y*.82]],"#d2a16e",21);line(ctx,[[0,-2],[x*.82,y*.82]],"#f0d0a0",1);}
  // Quartiere delle piantagioni: aiuole a terrazza con alberi di Coffea e bacche rosse.
  terrace(ctx,-185,-86,67,47);terrace(ctx,185,86,67,47);terrace(ctx,-90,151,66,43);terrace(ctx,91,-151,66,43);
  for(let i=0;i<26;i++){const a=i*2.399,x=Math.cos(a)*(205+(i%3)*8),y=Math.sin(a)*(151+(i%4)*7);coffeeTree(ctx,x,y,.62+(i%3)*.08,i);}
  // Canale di acqua ambrata e ponti in pietra.
  ctx.save();ctx.translate(-164,8);ctx.rotate(-.48);ellipse(ctx,0,0,57,25,"#3b2928");ellipse(ctx,0,-4,51,19,P.water);ellipse(ctx,0,-7,43,13,P.waterLight);for(let i=0;i<5;i++){const xx=(t*15+i*18)%76-38;line(ctx,[[xx,-8],[xx+8,-7]],"#d5e6bd",1.5);}rect(ctx,-44,-9,88,18,"#49302a");rect(ctx,-40,-7,80,11,"#c18a58");for(let i=-32;i<=32;i+=12)rect(ctx,i,-6,4,9,P.gold);ctx.restore();
  // Sei edifici unici: caffè storico, mercato, archivio, locanda, erboristeria e torrefazione.
  cafe(ctx,-137,-91,"CAFFE' REGALE",1);cafe(ctx,139,-91,"MERCATO DELLE FAVE",0);cafe(ctx,-139,94,"LOCANDA CREMA",0);cafe(ctx,139,94,"SPEZIE & AROMI",0);cafe(ctx,0,166,"ARCHIVIO DEL GUSTO",0);roastery(ctx,0,-163,t);
  // Piazza centrale: fontana-tazzina e monumento del chicco.
  cupFountain(ctx,-83,22,t);beanMonument(ctx,91,22,t);
  // Palazzo della Corporazione del Caffè, con cupola e vetrate.
  ellipse(ctx,4,64,83,18,"rgba(0,0,0,.3)");rect(ctx,-65,-43,130,100,"#382426");rect(ctx,-58,-37,116,89,"#80513b");rect(ctx,-50,-30,100,79,"#b47a4c");rect(ctx,-43,-24,86,9,"#e0b176");
  for(const s of [-1,1]){rect(ctx,s*49-15,-70,30,78,"#58382e");rect(ctx,s*49-11,-65,22,67,"#c18a58");rect(ctx,s*49-4,-54,8,26,P.window);ctx.fillStyle="#392426";ctx.beginPath();ctx.moveTo(s*49-20,-70);ctx.lineTo(s*49,-102);ctx.lineTo(s*49+20,-70);ctx.closePath();ctx.fill();}
  rect(ctx,-28,-62,56,77,"#49302b");ctx.fillStyle="#392426";ctx.beginPath();ctx.moveTo(-34,-62);ctx.quadraticCurveTo(-30,-111,0,-119);ctx.quadraticCurveTo(30,-111,34,-62);ctx.closePath();ctx.fill();ctx.fillStyle="#d29a5e";ctx.beginPath();ctx.moveTo(-26,-62);ctx.quadraticCurveTo(-22,-101,0,-108);ctx.quadraticCurveTo(22,-101,26,-62);ctx.closePath();ctx.fill();rect(ctx,-3,-137,6,24,P.bark);bean(ctx,0,-146,1.5);
  rect(ctx,-13,-42,26,45,"#392426");rect(ctx,-9,-38,18,37,P.window);for(let i=0;i<5;i++)rect(ctx,-42-i*5,57+i*4,84+i*10,4,i%2?"#9b6948":"#d4a16b");
  // Pergolati, sacchi di juta, barili e tavolini esterni.
  for(const [x,y] of [[-190,34],[190,-35],[-38,-192],[40,192]]){rect(ctx,x-25,y-3,50,5,"#49302a");rect(ctx,x-22,y-21,4,20,P.bark);rect(ctx,x+18,y-21,4,20,P.bark);rect(ctx,x-27,y-24,54,4,P.gold);bean(ctx,x-12,y-11,.55);bean(ctx,5,y-11,.55);}
  for(const [x,y] of [[-47,105],[52,-108]]){ellipse(ctx,x,y+7,20,7,"rgba(0,0,0,.25)");rect(ctx,x-18,y-4,36,5,P.bark);rect(ctx,x-15,y-8,30,4,P.copper);rect(ctx,x-13,y-20,26,12,"#76503a");ellipse(ctx,x,y-20,13,4,"#bd8758");}
  // Lampioni caldi, cristalli decorativi e insegne direzionali.
  for(const [x,y,i] of [[-198,-72,0],[198,4,1],[-123,151,2],[125,151,3],[8,-190,4],[-12,190,5]])lamp(ctx,x,y,t,i);
  crystal(ctx,108,5,.5,"#e9bc79");crystal(ctx,-190,111,.38,"#d89b61");crystal(ctx,185,-107,.38,"#e7c58d");
  // Vapore delle torrefazioni, lucciole e chicchi che fluttuano nella piazza.
  for(let i=0;i<18;i++){const p=t*(.35+(i%5)*.08)+i*1.31,x=Math.sin(p)*(150+(i%4)*20),y=Math.cos(p*.82)*(100+(i%3)*15);ctx.globalAlpha=.2+(Math.sin(p*2)+1)*.2;if(i%3===0)bean(ctx,x,y,.28,p);else ellipse(ctx,x,y,2,3,i%2?P.gold:P.ivory);}ctx.globalAlpha=1;
  // Targhe e identità forte della città: nessuna confusione con una generica città fantasy.
  rect(ctx,-123,211,246,34,"rgba(25,17,18,.96)");rect(ctx,-123,211,6,34,P.gold);text(ctx,"AMARGENTA",0,226,13,P.ivory);text(ctx,"CAPITALE DEL CAFFE'  •  FAZIONE AMARO",0,238,6,P.gold);
  ctx.restore();
}
