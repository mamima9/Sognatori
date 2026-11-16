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
  // Rampe fisiche leggibili tra il fondovalle e le terrazze rialzate.
  drawCoffeeRamp(c,[-390,-40],[-286,-69],19);
  drawCoffeeRamp(c,[390,-40],[286,-68],19);
  drawCoffeeRamp(c,[-390,125],[-270,165],18);
  drawCoffeeRamp(c,[390,120],[190,164],18);
  drawCoffeeRamp(c,[-286,-181],[-180,-191],15);
  // Sentieri di collegamento che salgono a tornanti tra le quote.
  line(c,[[-388,-65],[-358,-78],[-340,-52],[-315,-66],[-292,-40]],"#d5ae7c",7);
  line(c,[[270,145],[298,125],[320,145],[350,124]],"#d5ae7c",7);
  line(c,[[-180,-175],[-155,-158],[-174,-139],[-147,-120]],"#e1bd8c",4);
  line(c,[[185,164],[210,145],[194,127],[222,110]],"#e1bd8c",4);
}

const AMARO_ELEVATED_PLOTS = [
  { x:-286, y:-125, w:184, d:112, height:34 },
  { x:-180, y:-238, w:142, d:94, height:28 },
  { x:286, y:-126, w:190, d:116, height:34 },
  { x:190, y:218, w:166, d:108, height:28 },
  { x:-270, y:218, w:170, d:106, height:28 },
];
const AMARO_RAMPS = [
  { a:[-390,-40], b:[-286,-69], from:0, to:34, width:19 },
  { a:[390,-40], b:[286,-68], from:0, to:34, width:19 },
  { a:[-390,125], b:[-270,165], from:0, to:28, width:18 },
  { a:[390,120], b:[190,164], from:0, to:28, width:18 },
  { a:[-286,-181], b:[-180,-191], from:34, to:28, width:15 },
];
function pointInDiamond(px,py,x,y,w,d) {
  return Math.abs(px-x)/(w/2) + Math.abs(py-y)/(d/2) <= 1;
}
function projectToSegment(px,py,a,b) {
  const dx=b[0]-a[0], dy=b[1]-a[1], length2=dx*dx+dy*dy;
  const t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/length2));
  return { t, distance:Math.hypot(px-(a[0]+dx*t),py-(a[1]+dy*t)) };
}
export function getAmaroElevationAt(worldX,worldY) {
  const x=(worldX-1800)/1.55, y=(worldY-1200)/1.55;
  for (const ramp of AMARO_RAMPS) {
    const p=projectToSegment(x,y,ramp.a,ramp.b);
    if (p.distance<=ramp.width) return (ramp.from+(ramp.to-ramp.from)*p.t)*1.55;
  }
  for (const plot of AMARO_ELEVATED_PLOTS) {
    if (pointInDiamond(x,y,plot.x,plot.y,plot.w,plot.d)) return plot.height*1.55;
  }
  return 0;
}
export function canTraverseAmaroElevation(fromX,fromY,toX,toY) {
  const from=getAmaroElevationAt(fromX,fromY), to=getAmaroElevationAt(toX,toY);
  return Math.abs(to-from)<=12;
}
function drawCoffeeRamp(c,a,b,width) {
  line(c,[[a[0],a[1]+width/2],[b[0],b[1]+width/2]],"#493027",width+7);
  line(c,[a,b],"#c18a58",width);
  line(c,[[a[0],a[1]-width/2],[b[0],b[1]-width/2]],"#e1bd8c",2);
  for(let i=1;i<8;i++) {
    const t=i/8, x=a[0]+(b[0]-a[0])*t, y=a[1]+(b[1]-a[1])*t;
    line(c,[[x-width*.45,y],[x+width*.45,y]],"#e5c292",1.5);
  }
}


function drawAmaroMountainBackdrop(c){
  const ridge=(pts,color)=>{c.fillStyle=color;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();};
  ridge([[-390,-220],[-350,-270],[-318,-238],[-276,-302],[-230,-245],[-185,-286],[-132,-232],[-75,-286],[-20,-230],[40,-282],[95,-232],[150,-276],[205,-226],[265,-282],[320,-230],[390,-270],[390,-185],[-390,-185]],"#354a3a");
  ridge([[-390,-205],[-345,-246],[-308,-216],[-270,-278],[-228,-222],[-184,-260],[-140,-215],[-80,-263],[-28,-210],[28,-258],[78,-208],[128,-250],[178,-207],[230,-257],[280,-205],[330,-244],[390,-200],[390,-160],[-390,-160]],"#526648");
  for(let i=0;i<13;i++){const x=-365+i*61,y=-230-(i%3)*18;line(c,[[x-18,y+15],[x,y-20-(i%2)*9],[x+20,y+15]],i%2?"#a6a27b":"#c4b18a",2);}
  c.save();c.globalAlpha=.18;for(let i=0;i<6;i++)ellipse(c,-180+i*73,-176+(i%2)*18,48,10,"#f1e5c9");c.restore();
}
function drawAmaroBridge(c,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);ellipse(c,0,15,34,12,"rgba(0,0,0,.28)");
  face(c,[[-39,-4],[-29,-13],[29,-13],[39,-4],[31,5],[-31,5]],"#49352d");
  face(c,[[-34,-7],[-24,-16],[24,-16],[34,-7],[27,-1],[-27,-1]],"#b18a62");
  c.fillStyle="#315f59";c.beginPath();c.ellipse(0,2,16,9,0,0,Math.PI*2);c.fill();
  c.strokeStyle="#d3b18a";c.lineWidth=7;c.beginPath();c.moveTo(-35,-8);c.quadraticCurveTo(0,-34,35,-8);c.stroke();
  line(c,[[-35,-8],[35,-8]],"#e3c69c",2);for(let i=0;i<7;i++)rect(c,-27+i*9,-16,3,8,"#78543d");c.restore();
}
function drawAmaroRiver(c,t){
  const pts=[[-337,-244],[-310,-198],[-292,-158],[-318,-116],[-300,-76],[-276,-34],[-294,8],[-270,52],[-286,96],[-260,143],[-244,205],[-218,252]];
  line(c,pts,"#263f38",39);line(c,pts,"#356b68",30);line(c,pts,"#76b5a0",13);
  line(c,pts.map(([x,y],i)=>[x+(i%2?5:-4),y]),"rgba(214,241,207,.55)",3);
  for(let i=0;i<9;i++){const y=-190+i*48,x=-303+Math.sin(t*1.4+i)*8;line(c,[[x-7,y],[x+7,y+5],[x+15,y+2]],"rgba(210,242,218,.75)",2);}
  for(const [x,y] of [[-304,-118],[-279,44],[-258,139]]){line(c,[[x-7,y-5],[x-2,y+10],[x+4,y+17]],"#a7d7bd",4);line(c,[[x+4,y-3],[x+9,y+12],[x+13,y+17]],"#d4e8c9",2);}
  drawAmaroBridge(c,-295,-76,.9);drawAmaroBridge(c,-280,96,1);
}
function drawAmaroBellTower(c,x,y){
  c.save();c.translate(x,y);ellipse(c,3,66,39,12,"rgba(0,0,0,.3)");
  face(c,[[-30,5],[0,-8],[30,5],[30,63],[-30,63]],"#604333");
  face(c,[[-30,5],[0,-8],[0,54],[-30,63]],"#a77851");face(c,[[0,-8],[30,5],[30,63],[0,54]],"#80563c");
  rect(c,-24,-43,48,51,"#b17d53");face(c,[[-29,-43],[0,-70],[29,-43]],"#493027");
  line(c,[[-29,-43],[0,-70],[29,-43]],"#d6a36a",3);rect(c,-17,-36,34,5,"#684632");rect(c,-13,-27,26,20,"#382b28");
  ellipse(c,0,-17,7,9,"#d8b477");line(c,[[0,-8],[0,-1]],"#e7c88e",2);rect(c,-6,19,12,28,"#392722");rect(c,-3,23,6,20,"#d5a06a");
  for(const x0 of [-20,20])rect(c,x0-3,8,6,12,"#e6bb7e");c.restore();
}
function drawAmaroRoasteryAnnex(c,x,y,t){
  c.save();c.translate(x,y);ellipse(c,4,42,58,13,"rgba(0,0,0,.3)");
  face(c,[[-48,-12],[42,-12],[57,-25],[-33,-25]],"#54372c");face(c,[[42,-12],[42,35],[57,22],[57,-25]],"#382721");
  rect(c,-48,-12,90,47,"#8b5b3d");rect(c,-39,-5,72,37,"#b47b4e");
  face(c,[[-54,-12],[-5,-47],[48,-12],[60,-25],[8,-60],[-38,-25]],"#493027");line(c,[[-54,-12],[-5,-47],[48,-12]],"#d0a06a",3);
  rect(c,17,-53,12,31,"#624335");rect(c,20,-67,6,17,"#352622");
  for(let i=0;i<4;i++){const p=t*.8+i*1.3;ellipse(c,23+Math.sin(p)*4,-76-i*10,4+i,3+i,"rgba(239,226,200,"+(.34-i*.06)+")");}
  rect(c,-29,-2,20,26,"#392823");rect(c,-25,2,12,18,"#f0bd70");rect(c,1,-2,22,26,"#392823");rect(c,5,2,14,18,"#d9a66a");rect(c,-5,18,14,17,"#4a2b24");bean(c,-1,5,.5);c.restore();
}

export function drawAdventureAmaroCity(ctx,city){
  const t=performance.now()/1000;
  ctx.save();
  ctx.translate(Math.round(city.x/4)*4,Math.round(city.y/4)*4);
  ctx.scale(1.55,1.55);
  ctx.imageSmoothingEnabled=false;

  // AMARGENTA: borgo montano terrazzato, ricco di dettagli e percorsi.
  drawAmaroMountainBackdrop(ctx);
  drawAmaroRiver(ctx,t);
  // Niente piattaforma circolare vuota: terreno continuo, sentieri, terrazze e case.
  ellipse(ctx,0,24,390,292,"rgba(0,0,0,.28)");
  ctx.fillStyle="#24452e";
  ctx.beginPath();
  ctx.moveTo(-360,-175);ctx.lineTo(-286,-250);ctx.lineTo(-105,-270);
  ctx.lineTo(48,-245);ctx.lineTo(225,-260);ctx.lineTo(350,-168);
  ctx.lineTo(370,18);ctx.lineTo(315,218);ctx.lineTo(180,270);
  ctx.lineTo(-65,258);ctx.lineTo(-275,235);ctx.lineTo(-370,95);
  ctx.closePath();ctx.fill();
  ctx.fillStyle="#477344";
  ctx.beginPath();
  ctx.moveTo(-342,-168);ctx.lineTo(-270,-231);ctx.lineTo(-88,-250);
  ctx.lineTo(64,-226);ctx.lineTo(232,-239);ctx.lineTo(332,-155);
  ctx.lineTo(348,20);ctx.lineTo(295,197);ctx.lineTo(165,246);
  ctx.lineTo(-65,238);ctx.lineTo(-252,216);ctx.lineTo(-346,82);
  ctx.closePath();ctx.fill();

  // Prato a tasselli irregolari, erba alta, fiori e piccoli sassi.
  for(let i=0;i<250;i++){
    const x=-330+((i*97)%660), y=-225+((i*61)%450);
    const col=i%5===0?"#75944e":i%3===0?"#527d43":"#3d693d";
    rect(ctx,x,y,2+(i%3),2,col);
    if(i%11===0){rect(ctx,x+3,y-2,3,2,"#a9bd62");}
    if(i%17===0){ellipse(ctx,x+8,y+5,2,2,i%2?"#e7c46b":"#e9a0a0");}
  }
  for(const [x,y] of [[-320,-110],[315,-85],[-300,130],[300,125],[-75,-245],[95,238]]){
    for(let k=0;k<5;k++){
      const a=k*1.25;
      ellipse(ctx,x+Math.cos(a)*13,y+Math.sin(a)*8,5,3,k%2?"#5d9149":"#79a852");
    }
    ellipse(ctx,x,y+3,3,2,"#e8c66c");
  }

  // Sentieri di terra chiara con bordi in pietra: collegano ingressi,
  // piazza, botteghe e terrazze senza creare un anello geometrico.
  const road=(pts,width=30)=>{
    line(ctx,pts,"#76513a",width+9);
    line(ctx,pts,"#d5ad78",width);
    line(ctx,pts,"#f0d0a0",2);
  };
  road([[-365,78],[-286,60],[-220,32],[-155,18],[-82,30],[0,42],[82,25],[155,0],[238,-24],[355,-45]],34);
  road([[0,248],[8,190],[0,132],[0,78],[0,42]],31);
  road([[-150,18],[-178,-45],[-180,-105],[-205,-155]],24);
  road([[150,0],[180,-55],[188,-118],[220,-165]],24);
  road([[-82,30],[-110,95],[-155,145],[-190,205]],22);
  road([[82,25],[110,95],[155,145],[190,205]],22);
  // Pietre sparse lungo i sentieri.
  for(let i=0;i<34;i++){
    const x=-300+((i*83)%600), y=-180+((i*47)%360);
    if(i%3===0){ellipse(ctx,x,y,3+(i%3),2,"#b99468");}
  }

  // Torre campanaria sul terrazzo alto e torrefazione sul margine orientale.
  drawAmaroBellTower(ctx,-320,-175);
  drawAmaroRoasteryAnnex(ctx,278,-174,t);

  // Cinque piantagioni terrazzate rialzate, con filari ordinati di Coffea.
  plantationTier(ctx,-286,-125,184,112,2,t);
  plantationTier(ctx,-180,-238,142,94,1,t);
  plantationTier(ctx,286,-126,190,116,2,t);
  plantationTier(ctx,190,218,166,108,1,t);
  plantationTier(ctx,-270,218,170,106,1,t);
  drawCoffeeRamp(ctx,[-390,-40],[-286,-69],19);
  drawCoffeeRamp(ctx,[390,-40],[286,-68],19);
  drawCoffeeRamp(ctx,[-390,125],[-270,165],18);
  drawCoffeeRamp(ctx,[390,120],[190,164],18);
  drawCoffeeRamp(ctx,[-286,-181],[-180,-191],15);

  // Alberi di caffè e siepi ai margini del villaggio.
  for(let i=0;i<30;i++){
    const side=i%4, n=Math.floor(i/4);
    const x=side===0?-335+n*12:side===1?335-n*12:-250+n*17;
    const y=side===2?-225+n*10:side===3?225-n*10:-210+n*15;
    coffeeTreeVolume(ctx,x,y,.55+(n%3)*.07,t+i);
  }
  // Alberi d'ombra più grandi: tronchi e chiome a livelli.
  for(const [x,y,s] of [[-315,-5,1.25],[315,42,1.2],[-235,175,1.05],[250,-205,1.1]]){
    ellipse(ctx,x+5,y+18,25,8,"rgba(0,0,0,.25)");
    rect(ctx,x-5,y-12,10,34,"#5b3929");
    ellipse(ctx,x-12,y-28,22,19,"#315b38");
    ellipse(ctx,x+10,y-39,25,22,"#477b43");
    ellipse(ctx,x+20,y-17,19,17,"#5c8a49");
    ellipse(ctx,x-2,y-13,22,15,"#6d9950");
    for(let k=0;k<5;k++)ellipse(ctx,x-16+k*8,y-30+(k%2)*9,3,4,k%2?"#c65c45":"#d47b4c");
  }

  // Piazza centrale in pietra, irregolare, con mosaico a chicco.
  ctx.save();ctx.translate(0,42);
  ctx.fillStyle="rgba(0,0,0,.24)";
  ctx.beginPath();ctx.moveTo(-92,-34);ctx.lineTo(0,-65);ctx.lineTo(100,-30);ctx.lineTo(90,48);ctx.lineTo(0,76);ctx.lineTo(-98,43);ctx.closePath();ctx.fill();
  ctx.fillStyle="#76503a";
  ctx.beginPath();ctx.moveTo(-94,-43);ctx.lineTo(0,-75);ctx.lineTo(104,-37);ctx.lineTo(96,49);ctx.lineTo(0,82);ctx.lineTo(-103,46);ctx.closePath();ctx.fill();
  ctx.fillStyle="#c08b59";
  ctx.beginPath();ctx.moveTo(-84,-40);ctx.lineTo(0,-67);ctx.lineTo(92,-34);ctx.lineTo(85,42);ctx.lineTo(0,70);ctx.lineTo(-91,41);ctx.closePath();ctx.fill();
  for(let i=0;i<9;i++)line(ctx,[[-76+i*18,-31+i*2],[-65+i*16,37-i*2]],"rgba(87,53,37,.38)",1);
  bean(ctx,0,0,1.8,-.2);
  ctx.restore();

  // Edifici unici e ben separati, con tetti, facciate, finestre e ombre.
  roastery(ctx,0,-174,t);
  cafe(ctx,-142,-62,"CAFFE' REGALE",1);
  cafe(ctx,142,-62,"MERCATO DELLE FAVE",0);
  cafe(ctx,-145,111,"LOCANDA CREMA",0);
  cafe(ctx,145,111,"SPEZIE & AROMI",0);
  cafe(ctx,0,196,"ARCHIVIO DEL GUSTO",0);

  // Casa della Corporazione: edificio principale a più livelli, non un cerchio vuoto.
  ellipse(ctx,4,91,72,18,"rgba(0,0,0,.3)");
  face(ctx,[[-62,15],[0,-28],[62,15],[62,88],[-62,88]],"#493027");
  face(ctx,[[-62,15],[0,-28],[0,59],[-62,88]],"#815238");
  face(ctx,[[0,-28],[62,15],[62,88],[0,59]],"#65402f");
  face(ctx,[[-70,17],[0,-37],[70,17],[58,27],[0,-19],[-58,27]],"#382522");
  line(ctx,[[-70,17],[0,-37],[70,17]],"#d3a06a",4);
  rect(ctx,-48,31,96,8,"#d5a46c");
  for(const x of [-38,-13,13,38]){
    rect(ctx,x-5,43,10,23,"#392426");rect(ctx,x-3,46,6,17,P.window);
  }
  rect(ctx,-13,57,26,31,"#392426");rect(ctx,-9,61,18,27,"#c38a58");
  bean(ctx,0,-8,1.25,-.15);
  rect(ctx,-52,6,104,8,"#e0b176");

  // Monumento del chicco e fontana-tazzina nella piazza.
  cupFountain(ctx,-67,58,t);
  beanMonument(ctx,72,57,t);
  // Sacchi di juta, barili, tavolini, pergolati e insegne.
  for(const [x,y] of [[-198,5],[198,-2],[-48,-220],[52,224]]){
    rect(ctx,x-24,y-2,48,5,"#49302a");
    rect(ctx,x-20,y-19,4,18,P.bark);rect(ctx,x+16,y-19,4,18,P.bark);
    rect(ctx,x-26,y-22,52,4,P.gold);bean(ctx,x-10,y-10,.48);bean(ctx,8,y-10,.48);
  }
  for(const [x,y] of [[-85,145],[86,-120]]){
    ellipse(ctx,x,y+7,19,7,"rgba(0,0,0,.25)");
    rect(ctx,x-17,y-4,34,5,P.bark);rect(ctx,x-14,y-8,28,4,P.copper);
    rect(ctx,x-12,y-20,24,12,"#76503a");ellipse(ctx,x,y-20,12,4,"#bd8758");
  }
  for(const [x,y,i] of [[-205,-74,0],[205,62,1],[-115,177,2],[118,177,3],[0,-222,4],[-10,238,5]])lamp(ctx,x,y,t,i);
  coffeeRelic(ctx,100,53,.48);coffeeRelic(ctx,-190,112,.36);coffeeRelic(ctx,188,-105,.36);

  // Bacche, foglie, lucciole e vapore animato.
  for(let i=0;i<24;i++){
    const p=t*(.3+(i%5)*.07)+i*1.31;
    const x=Math.sin(p)*(150+(i%4)*28),y=Math.cos(p*.82)*(110+(i%3)*22);
    ctx.globalAlpha=.2+(Math.sin(p*2)+1)*.18;
    if(i%4===0)bean(ctx,x,y,.24,p);else ellipse(ctx,x,y,2,3,i%2?P.gold:P.ivory);
  }
  ctx.globalAlpha=1;
  // Cartello leggibile all'ingresso della città.
  rect(ctx,-124,260,248,31,"rgba(25,17,18,.94)");
  rect(ctx,-124,260,6,31,P.gold);
  text(ctx,"AMARGENTA",0,274,12,P.ivory);
  text(ctx,"CAPITALE DEL CAFFE'  •  FAZIONE AMARO",0,284,5,P.gold);
  ctx.restore();
}

// Ridisegna le facciate anteriori per una corretta occlusione del personaggio.
// Ridisegna gli edifici che si trovano davanti al protagonista per creare occlusione Y-sort.
export function drawAdventureAmaroOccluders(ctx,city,playerGroundY){
  const buildings=[
    {x:-142,y:-62,kind:1,anchor:-19},
    {x:142,y:-62,kind:0,anchor:-20},
    {x:-145,y:111,kind:0,anchor:149},
    {x:145,y:111,kind:0,anchor:149},
    {x:0,y:196,kind:0,anchor:231},
  ];
  ctx.save();ctx.translate(city.x,city.y);ctx.scale(1.55,1.55);
  for(const b of buildings){
    if(city.y+b.anchor*1.55>playerGroundY)cafe(ctx,b.x,b.y,"",b.kind);
  }
  if(city.y-117*1.55>playerGroundY)roastery(ctx,0,-174,performance.now()/1000);
  if(city.y+88*1.55>playerGroundY){
    face(ctx,[[-62,15],[0,-28],[62,15],[62,88],[-62,88]],"#493027");
    face(ctx,[[-62,15],[0,-28],[0,59],[-62,88]],"#815238");
    face(ctx,[[0,-28],[62,15],[62,88],[0,59]],"#65402f");
    face(ctx,[[-70,17],[0,-37],[70,17],[58,27],[0,-19],[-58,27]],"#382522");
    rect(ctx,-48,31,96,8,"#d5a46c");
    rect(ctx,-13,57,26,31,"#392426");
    rect(ctx,-9,61,18,27,"#c38a58");
  }
  ctx.restore();
}
