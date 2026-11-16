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
function coffeeRelic(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,2,17,18,6,"rgba(0,0,0,.3)");c.fillStyle="#2b1b1a";c.beginPath();c.ellipse(0,0,13,22,-.18,0,Math.PI*2);c.fill();c.fillStyle="#9b5938";c.beginPath();c.ellipse(-2,-2,10,18,-.18,0,Math.PI*2);c.fill();line(c,[[-1,-17],[3,-8],[-2,0],[2,9],[-1,16]],"#f0c17b",3);line(c,[[-7,-10],[-10,-3],[-7,5]],"#d28a55",1.5);c.restore();}
function coffeeTree(c,x,y,s=1,phase=0){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,2,20,22,7,"rgba(0,0,0,.25)");rect(c,-4,-9,8,29,P.bark);ellipse(c,-13,-20,17,16,P.leaf);ellipse(c,5,-31,22,20,P.leaf2);ellipse(c,21,-17,16,15,P.leaf);ellipse(c,0,-9,22,15,P.leaf2);for(let i=0;i<5;i++){const a=i*2.4+phase;const bx=Math.cos(a)*13,by=-19+Math.sin(a)*11;ellipse(c,bx,by,3,5,i%2?"#b65b45":"#d07a4c");}line(c,[[-12,-28],[0,-38],[14,-30]],"#b7c57c",2);c.restore();}
function lamp(c,x,y,t,i=0){rect(c,x-3,y-1,6,30,P.ink);rect(c,x-9,y-7,18,5,P.copper);rect(c,x-7,y-22,14,16,P.gold);rect(c,x-4,y-19,8,10,P.ivory);glow(c,x,y-13,23,.07+.04*Math.sin(t*2+i));}
function roof(c,x,y,w,col=P.shadow){c.fillStyle=col;c.beginPath();c.moveTo(x-w/2-9,y);c.lineTo(x,y-30);c.lineTo(x+w/2+9,y);c.closePath();c.fill();line(c,[[x-w/2-7,y-2],[x,y-29],[x+w/2+7,y-2]],P.copper,3);}
function cafe(c,x,y,name,kind=0){c.save();c.translate(x,y);const w=kind===1?88:72,h=kind===1?65:56,depth=13;ellipse(c,5,h/2+depth+5,w*.72,11,"rgba(0,0,0,.34)");face(c,[[-w/2,-h/2+12],[w/2,-h/2+12],[w/2+depth,-h/2+2],[depth-w/2,-h/2+2]],"#4a3029");face(c,[[w/2,-h/2+12],[w/2,h/2+8],[w/2+depth,h/2-depth+8],[w/2+depth,-h/2+2]],"#493027");rect(c,-w/2,-h/2+12,w,h-4,kind%2?"#936044":"#80503a");rect(c,-w/2+5,-h/2+17,w-10,h-14,"#b17b50");face(c,[[-w/2-9,-h/2+14],[0,-h/2-19],[w/2+9,-h/2+14],[w/2+depth,-h/2+3],[depth,-h/2-29],[-w/2+depth,-h/2+3]],"#302126");face(c,[[-w/2-6,-h/2+12],[0,-h/2-21],[w/2+7,-h/2+12]],kind===1?"#604034":"#49302a");line(c,[[-w/2-6,-h/2+12],[0,-h/2-21],[w/2+7,-h/2+12]],P.copper,3);for(const wx of [-w/2+13,w/2-27]){rect(c,wx,-h/2+25,17,20,P.shadow);rect(c,wx+3,-h/2+28,11,14,P.window);rect(c,wx+8,-h/2+28,2,14,P.copper);}rect(c,-10,h/2-25,20,26,P.shadow);rect(c,-7,h/2-22,14,23,"#bd8758");rect(c,-w/2+7,h/2-39,w-14,10,"#302126");rect(c,-w/2+10,h/2-37,w-20,6,P.gold);text(c,name,0,h/2-30,5,P.ink);if(kind===1){rect(c,-w/2-4,-h/2+4,w+8,5,P.gold);bean(c,0,-h/2-6,1.2);}c.restore();}
function roastery(c,x,y,t){c.save();c.translate(x,y);ellipse(c,6,39,61,14,"rgba(0,0,0,.34)");face(c,[[-48,-18],[48,-18],[62,-31],[-34,-31]],"#49302a");face(c,[[48,-18],[48,32],[62,19],[62,-31]],"#382722");rect(c,-48,-18,96,50,"#49302a");rect(c,-42,-13,84,45,"#a36c46");face(c,[[-48,-18],[0,-53],[48,-18],[62,-31],[14,-66],[-34,-31]],"#302126");face(c,[[-48,-18],[0,-53],[48,-18]],"#654332");line(c,[[-48,-18],[0,-53],[48,-18]],P.copper,3);rect(c,-31,-8,26,28,"#392426");rect(c,-27,-4,18,20,"#d08b51");rect(c,8,-8,25,28,"#392426");rect(c,12,-4,17,20,"#e2ae69");rect(c,-7,-40,14,21,"#5a3a32");rect(c,-4,-54,8,16,"#302126");for(let i=0;i<3;i++){const p=t*.7+i*1.7;ellipse(c,Math.sin(p)*5,-62-i*13,5+i,4+i,"rgba(238,222,194,"+(.35-i*.08)+")");}text(c,"TORREFAZIONE",0,24,6,P.ivory);c.restore();}
function cupFountain(c,x,y,t){c.save();c.translate(x,y);ellipse(c,0,28,55,15,"rgba(0,0,0,.28)");ellipse(c,0,15,50,14,P.stone);ellipse(c,0,11,43,10,P.gold);rect(c,-30,-22,60,32,P.cream);rect(c,-26,-18,52,24,"#8e5338");rect(c,-21,-15,42,16,"#4a2926");c.strokeStyle=P.cream;c.lineWidth=7;c.beginPath();c.arc(31,-7,13,-Math.PI/2,Math.PI/2);c.stroke();ellipse(c,0,-23,30,7,"#e6c18d");ellipse(c,0,-25,23,5,"#4a2926");for(let i=0;i<5;i++){const a=t*1.7+i*1.25;ellipse(c,Math.cos(a)*34,-7+Math.sin(a)*3,2,3,P.ivory);}for(let i=0;i<3;i++){const p=t*1.3+i*2;line(c,[[Math.sin(p)*5,-33],[Math.sin(p+.5)*8,-45],[Math.sin(p+1)*3,-56]],"rgba(255,235,194,.65)",2);}c.restore();}
function beanMonument(c,x,y,t){c.save();c.translate(x,y);ellipse(c,0,25,50,12,"rgba(0,0,0,.3)");rect(c,-38,9,76,13,P.stone);rect(c,-32,4,64,8,P.stoneLight);ellipse(c,0,-16,24,34,"#392321");ellipse(c,-3,-18,18,27,"#a35e39");line(c,[[0,-40],[5,-26],[-2,-12],[3,8]],"#f0bd79",4);for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.12;glow(c,Math.cos(a)*37,-14+Math.sin(a)*37,3,.7);}c.restore();}
function terrace(c,x,y,w,h){c.save();rect(c,x-w/2,y-h/2,w,h,"#654334");rect(c,x-w/2+4,y-h/2+4,w-8,h-8,"#9b6947");rect(c,x-w/2+9,y-h/2+9,w-18,5,"#c38a57");for(let i=0;i<5;i++){const xx=x-w/2+14+i*(w-28)/4;coffeeTree(c,xx,y+5,.42,i);}c.restore();}
// Geometria dimetrica 2.5D: piattaforme con top, pareti laterali e quote reali.
function face(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();}
function raisedPlot(c,x,y,w,d,h,top,front,side){
  const a=[x,y-d/2],b=[x+w/2,y],cc=[x,y+d/2],dd=[x-w/2,y];
  const drop=[0,h];
  face(c,[dd,cc,[cc[0],cc[1]+h],[dd[0],dd[1]+h]],front);
  face(c,[cc,b,[b[0],b[1]+h],[cc[0],cc[1]+h]],side);
  face(c,[a,b,cc,dd],top);
  face(c,[a,[a[0],a[1]+2], [b[0],b[1]+2],b],"rgba(255,220,164,.22)");
}
function coffeeTreeVolume(c,x,y,s=1,phase=0){
  // Albero a volume: tronco, chioma a strati e bacche leggibili.
  c.save();c.translate(x,y);c.scale(s,s);
  ellipse(c,4,12,15,5,"rgba(12,10,9,.32)");
  face(c,[[-3,-3],[3,-3],[5,13],[-5,13]],"#503126");
  face(c,[[-4,-3],[0,-8],[4,-3],[0,0]],"#8b5938");
  ellipse(c,-7,-13,12,10,"#36583a");ellipse(c,5,-20,15,13,"#527b45");
  ellipse(c,17,-12,11,10,"#3f683d");ellipse(c,0,-8,15,10,"#6c914e");
  line(c,[[-10,-22],[-1,-29],[10,-24]],"#b5c47a",2);
  for(let i=0;i<6;i++){const a=i*2.4+phase;ellipse(c,Math.cos(a)*10, -15+Math.sin(a)*8,2.3,3.5,i%2?"#b94e3e":"#dc8050");}
  c.restore();
}
function plantationTier(c,x,y,w,d,level,t){
  const h=18+level*3;
  raisedPlot(c,x,y,w,d,h,level===2?"#8c6844":level===1?"#79553a":"#674632",
    "#493027","#382722");
  // Filari ordinati sulla superficie superiore; la scala varia con la profondità.
  for(let row=0;row<3;row++){
    const yy=y-d*.27+row*d*.27;
    for(let col=0;col<7;col++){
      const xx=x-w*.39+col*w*.13+(row%2)*w*.025;
      coffeeTreeVolume(c,xx,yy-h*.12,.34+row*.055,t+row+col);
    }
  }
  // Muretti di contenimento e piccoli gradini di accesso.
  line(c,[[x-w*.48,y],[x,y+d*.48],[x+w*.48,y]],"#c18a58",3);
  for(let k=0;k<4;k++){const sx=x-w*.48+k*8;c.fillStyle="#d4a06b";c.fillRect(sx,y+5+k*2,7,3);}
}
function drawCoffeeMountainChain(c,t){
  // La montagna è una successione di terrazze agricole rialzate, non una sagoma piatta.
  plantationTier(c,-286,-125,184,112,2,t);
  plantationTier(c,-180,-238,142,94,1,t);
  plantationTier(c,286,-126,190,116,2,t);
  plantationTier(c,190,218,166,108,1,t);
  plantationTier(c,-270,218,170,106,1,t);
  // Sentieri di collegamento che salgono a tornanti tra le quote.
  line(c,[[-388,-65],[-358,-78],[-340,-52],[-315,-66],[-292,-40]],"#d5ae7c",7);
  line(c,[[270,145],[298,125],[320,145],[350,124]],"#d5ae7c",7);
  line(c,[[-180,-175],[-155,-158],[-174,-139],[-147,-120]],"#e1bd8c",4);
  line(c,[[185,164],[210,145],[194,127],[222,110]],"#e1bd8c",4);
}
export function drawAdventureAmaroCity(ctx,city){
  const t=performance.now()/1000;ctx.save();ctx.translate(Math.round(city.x/4)*4,Math.round(city.y/4)*4);ctx.scale(1.55,1.55);ctx.imageSmoothingEnabled=false;
  // Fondovalle terrazzato e mura concentriche della città fortificata.
  ellipse(ctx,0,22,316,248,"rgba(0,0,0,.32)");ellipse(ctx,0,5,302,238,"#302126");ellipse(ctx,0,-3,287,226,"#654334");ellipse(ctx,0,-7,274,215,"#b17a50");ellipse(ctx,0,-8,259,202,"#51372f");ellipse(ctx,0,-8,244,189,"#c18a58");
  // Skyline montano e piantagioni su più quote, nello stile delle mappe RPG 2.5D.
  drawCoffeeMountainChain(ctx,t);
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
  // Lampioni caldi, monumenti a chicco e insegne direzionali.
  for(const [x,y,i] of [[-198,-72,0],[198,4,1],[-123,151,2],[125,151,3],[8,-190,4],[-12,190,5]])lamp(ctx,x,y,t,i);
  coffeeRelic(ctx,108,5,.5,"#e9bc79");coffeeRelic(ctx,-190,111,.38,"#d89b61");coffeeRelic(ctx,185,-107,.38,"#e7c58d");
  // Vapore delle torrefazioni, lucciole e chicchi che fluttuano nella piazza.
  for(let i=0;i<18;i++){const p=t*(.35+(i%5)*.08)+i*1.31,x=Math.sin(p)*(150+(i%4)*20),y=Math.cos(p*.82)*(100+(i%3)*15);ctx.globalAlpha=.2+(Math.sin(p*2)+1)*.2;if(i%3===0)bean(ctx,x,y,.28,p);else ellipse(ctx,x,y,2,3,i%2?P.gold:P.ivory);}ctx.globalAlpha=1;
  // Targhe e identità forte della città: nessuna confusione con una generica città fantasy.
  rect(ctx,-123,211,246,34,"rgba(25,17,18,.96)");rect(ctx,-123,211,6,34,P.gold);text(ctx,"AMARGENTA",0,226,13,P.ivory);text(ctx,"CAPITALE DEL CAFFE'  •  FAZIONE AMARO",0,238,6,P.gold);
  ctx.restore();
}
