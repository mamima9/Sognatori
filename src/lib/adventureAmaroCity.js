// Amargenta — città segreta della fazione Amaro.
// Renderer Canvas dedicato: architettura cacao/ambra, pixel art RPG moderna e dettagli animati.
const P = {
  dark:"#211b20", deep:"#39252a", bark:"#56352f", cocoa:"#765044",
  roast:"#9b6848", caramel:"#c18a50", amber:"#e5b66b",
  cream:"#f2dfb6", pale:"#fff1d2", teal:"#527b70", leaf:"#66865b"
};
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function stroke(c,pts,color,width){c.strokeStyle=color;c.lineWidth=width||2;c.lineCap="round";c.lineJoin="round";c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();}
function crystal(c,x,y,s,t){c.save();c.translate(x,y);c.scale(s,s);oval(c,2,18,20,7,"rgba(8,10,12,.3)");c.fillStyle=P.deep;c.beginPath();c.moveTo(0,-34);c.lineTo(17,-8);c.lineTo(11,18);c.lineTo(-11,18);c.lineTo(-17,-8);c.closePath();c.fill();c.fillStyle=t||P.amber;c.beginPath();c.moveTo(0,-29);c.lineTo(11,-7);c.lineTo(7,13);c.lineTo(-7,13);c.lineTo(-11,-7);c.closePath();c.fill();stroke(c,[[0,-27],[0,11]],P.pale,2);c.restore();}
function tree(c,x,y,s,i){c.save();c.translate(x,y);c.scale(s,s);oval(c,3,20,24,7,"rgba(8,10,12,.25)");box(c,-5,-10,10,32,P.deep);oval(c,-15,-19,18,17,i%2?"#49302d":"#654034");oval(c,4,-35,23,21,"#76503a");oval(c,21,-17,17,16,"#8a5b3e");oval(c,0,-8,24,17,"#704936");oval(c,6,-39,4,3,P.amber);oval(c,-16,-20,4,3,"#d99a5b");c.restore();}
function lamp(c,x,y,t,i){box(c,x-3,y-2,6,35,P.deep);box(c,x-10,y-6,20,5,P.roast);box(c,x-8,y-22,16,17,P.caramel);box(c,x-4,y-19,8,11,P.pale);c.globalAlpha=.12+(.5+.5*Math.sin(t*2+i))*.13;oval(c,x,y-13,20,20,P.amber);c.globalAlpha=1;}
function house(c,x,y,title,i,t){c.save();c.translate(x,y);const w=i===1?78:66,h=i===1?72:58;oval(c,5,h/2+8,w*.72,12,"rgba(8,10,12,.32)");box(c,-w/2-5,-h/2+13,w+10,h,"#30262a");box(c,-w/2,-h/2+17,w,h-5,i%2?"#986449":"#87583f");box(c,-w/2+5,-h/2+21,w-10,h-13,"#a36d49");c.fillStyle=i===1?"#38252a":"#49302d";c.beginPath();c.moveTo(-w/2-10,-h/2+19);c.lineTo(0,-h/2-28-(i===1?10:0));c.lineTo(w/2+10,-h/2+19);c.closePath();c.fill();stroke(c,[[-w/2-7,-h/2+17],[0,-h/2-25],[w/2+7,-h/2+17]],P.caramel,4);for(const wx of [-w/2+13,w/2-25]){box(c,wx-3,-h/2+29,19,22,P.deep);box(c,wx,-h/2+32,13,16,i===2?"#f6cb79":"#f2d59b");box(c,wx+5,-h/2+32,3,16,"#9a6747");box(c,wx,-h/2+39,13,2,"#9a6747");}box(c,-10,h/2-24,20,26,P.deep);box(c,-7,h/2-21,14,23,"#a16c49");box(c,3,h/2-11,2,3,P.amber);box(c,-w/2+5,h/2-39,w-10,11,"#2b2225");box(c,-w/2+7,h/2-37,w-14,7,"#d3a06a");c.fillStyle="#38272a";c.font="bold 5px monospace";c.textAlign="center";c.fillText(title,0,h/2-31,w-15);c.restore();}
function drawCore(c,t){oval(c,0,12,126,91,"rgba(10,12,15,.28)");oval(c,0,0,120,84,"#503b39");oval(c,0,-5,111,76,"#b0835d");oval(c,0,-7,99,66,"#d0a16a");oval(c,0,-9,83,54,"#e0bd88");c.strokeStyle="rgba(77,48,39,.34)";c.lineWidth=2;for(let r=-3;r<=3;r++){let y=r*15,h=91*Math.sqrt(Math.max(.1,1-y*y/5000));c.beginPath();c.moveTo(-h,y-8);c.lineTo(h,y-8);c.stroke();}oval(c,0,-7,48,39,"#6d4438");oval(c,0,-11,40,32,"#bd8452");c.save();c.translate(0,-15);c.rotate(-.2);c.fillStyle="#4b302d";c.beginPath();c.ellipse(0,0,17,27,0,0,Math.PI*2);c.fill();c.fillStyle="#a66a43";c.beginPath();c.ellipse(-3,-2,11,21,0,0,Math.PI*2);c.fill();stroke(c,[[0,-20],[4,-8],[0,2],[4,15]],"#e6b36e",3);c.restore();for(let i=0;i<8;i++){let a=i*Math.PI/4+t*.08;box(c,Math.cos(a)*56-2,-11+Math.sin(a)*43-2,4,4,i%2?P.cream:P.amber);}}
function drawPalace(c,t){oval(c,4,55,72,17,"rgba(8,10,12,.32)");box(c,-60,-40,120,90,"#39272b");box(c,-53,-35,106,83,"#81543f");box(c,-46,-29,92,76,"#a36d49");box(c,-38,-22,76,10,"#d3a06a");for(const s of [-1,1]){box(c,s*48-14,-65,28,75,"#694337");box(c,s*48-18,-72,36,12,"#39272b");c.fillStyle="#4a2e2d";c.beginPath();c.moveTo(s*48-21,-72);c.lineTo(s*48,-105);c.lineTo(s*48+21,-72);c.closePath();c.fill();box(c,s*48-3,-55,6,24,"#f0c47d");}box(c,-26,-58,52,106,"#4b302e");box(c,-21,-53,42,96,"#b17b50");c.fillStyle="#49302d";c.beginPath();c.moveTo(-31,-53);c.quadraticCurveTo(-25,-103,0,-111);c.quadraticCurveTo(25,-103,31,-53);c.closePath();c.fill();c.fillStyle="#d9a363";c.beginPath();c.moveTo(-23,-54);c.quadraticCurveTo(-18,-91,0,-98);c.quadraticCurveTo(18,-91,23,-54);c.closePath();c.fill();box(c,-3,-127,6,27,"#56352f");crystal(c,0,-132,.46,"#f7d28a");box(c,-13,-42,26,42,"#4c302d");box(c,-9,-38,18,34,"#f2c77d");for(let i=0;i<5;i++)box(c,-37-i*5,47+i*4,74+i*10,4,i%2?"#986949":"#d0a16b");c.globalAlpha=.72+Math.sin(t*2)*.12;box(c,-44,-15,8,17,"#ffe1a0");box(c,36,-15,8,17,"#ffe1a0");c.globalAlpha=1;}
export function drawAdventureAmaroCity(ctx,city){const t=performance.now()/1000;ctx.save();ctx.translate(Math.round(city.x/4)*4,Math.round(city.y/4)*4);ctx.scale(1.55,1.55);ctx.imageSmoothingEnabled=false;
  // Isola urbana, terrapieno e mura concentriche.
  oval(ctx,0,18,306,245,"rgba(5,8,12,.3)");oval(ctx,0,3,295,237,"#30242a");oval(ctx,0,-4,282,225,"#694538");oval(ctx,0,-7,269,213,"#a06d4b");oval(ctx,0,-8,254,199,"#6e4a3d");oval(ctx,0,-8,239,185,"#b08056");
  // 32 merli e otto torri di guardia.
  for(let i=0;i<32;i++){let a=i*Math.PI*2/32,x=Math.cos(a)*247,y=-8+Math.sin(a)*187;ctx.save();ctx.translate(x,y);ctx.rotate(a);box(ctx,-8,-10,16,23,"#4c302e");box(ctx,-6,-8,12,17,"#bd8959");box(ctx,-9,-13,18,5,"#e0b276");ctx.restore();}
  for(let i=0;i<8;i++){let a=i*Math.PI/4+Math.PI/8,x=Math.cos(a)*235,y=-8+Math.sin(a)*175;oval(ctx,x,y+4,17,10,"rgba(8,10,12,.3)");box(ctx,x-12,y-17,24,24,"#56352f");box(ctx,x-9,y-14,18,19,"#b47a4f");ctx.fillStyle="#402a2b";ctx.beginPath();ctx.moveTo(x-15,y-16);ctx.lineTo(x,y-37);ctx.lineTo(x+15,y-16);ctx.closePath();ctx.fill();crystal(ctx,x,y-27,.35,"#f4c978");}
  // Anello stradale e vie radiali.
  ctx.strokeStyle="#51362f";ctx.lineWidth=32;ctx.beginPath();ctx.ellipse(0,-4,192,151,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#c79a68";ctx.lineWidth=23;ctx.beginPath();ctx.ellipse(0,-5,190,149,0,0,Math.PI*2);ctx.stroke();
  const homes=[[-132,-88,"TORRE DELLE SPEZIE",0],[0,-158,"PALAZZO DEL CACAO",1],[132,-88,"FONDERIA D'AMBRA",2],[-132,88,"LOCANDA AMARA",3],[132,88,"BOTTEGA DELLE ERBE",4],[0,158,"ARCHIVIO DEI SAPORI",5]];
  for(const h of homes){stroke(ctx,[[0,0],[h[0]*.78,h[1]*.78]],"#5b3b32",29);stroke(ctx,[[0,-2],[h[0]*.78,h[1]*.78]],"#c89a68",19);}
  // Canale ambrato e ponticello.
  ctx.save();ctx.translate(-158,8);ctx.rotate(-.48);oval(ctx,0,0,53,24,"#4c302e");oval(ctx,0,-4,48,18,"#9c643e");oval(ctx,0,-7,41,12,"#d49a51");for(let i=0;i<4;i++){let o=(t*16+i*19)%70-35;ctx.strokeStyle="rgba(255,225,157,.7)";ctx.beginPath();ctx.ellipse(o,-8+(i%2)*4,7,2,0,0,Math.PI*2);ctx.stroke();}box(ctx,-42,-8,84,17,"#39272b");box(ctx,-38,-7,76,11,"#b27c50");for(let i=-30;i<=30;i+=12)box(ctx,i,-6,4,9,"#e0b27a");ctx.restore();
  // Giardini aromatici e alberi di cacao.
  for(const q of [[-191,-72], [190,72],[-86,143],[87,-140]]){oval(ctx,q[0],q[1]+7,32,13,"rgba(8,10,12,.3)");box(ctx,q[0]-29,q[1]-8,58,21,"#49302d");for(let i=0;i<6;i++){let px=q[0]-20+i*8;box(ctx,px,q[1]-4,4,11,i%2?"#688b5b":"#86a26a");box(ctx,px-2,q[1]-10-(i%2)*3,7,6,"#d68d66");}}
  for(let i=0;i<22;i++){let a=i*2.399,x=Math.cos(a)*(205+(i%3)*7),y=Math.sin(a)*(151+(i%4)*6);tree(ctx,x,y,.66+(i%3)*.08,i);}
  // Sei edifici diversi, piazza e palazzo centrale.
  for(let i=0;i<3;i++)house(ctx,homes[i][0],homes[i][1],homes[i][2],homes[i][3],t);drawCore(ctx,t);drawPalace(ctx,t);
  // Fontana, cristalli e illuminazione.
  oval(ctx,-93,27,31,13,"#49302d");oval(ctx,-93,23,27,10,"#bd8957");oval(ctx,-93,20,19,6,"#e7c18a");for(let i=0;i<5;i++)stroke(ctx,[[-108+i*7,20],[-108+i*7+Math.sin(t*2+i)*3,10-(i%2)*4],[-106+i*7,18]],"#f4d28d",2);
  crystal(ctx,104,20,.55,"#e7b56e");crystal(ctx,183,-96,.45,"#d99a5b");crystal(ctx,-184,102,.42,"#e7c68c");
  for(const q of [[-193,-74,0],[190,-5,1],[-125,145,2],[126,145,3],[8,-185,4],[-18,184,5]])lamp(ctx,q[0],q[1],t,q[2]);
  for(let i=0;i<3;i++)house(ctx,homes[i+3][0],homes[i+3][1],homes[i+3][2],homes[i+3][3],t);
  // Bacheca, panchine e contenitori di fave di cacao.
  box(ctx,143,96,50,8,"#49302d");box(ctx,147,87,42,13,"#d4a36e");box(ctx,151,90,34,7,"#f1dfba");ctx.fillStyle="#4b302d";ctx.font="bold 5px monospace";ctx.textAlign="center";ctx.fillText("BACHECA",168,96,33);
  for(const q of [[-48,105],[54,-105]]){box(ctx,q[0]-18,q[1],36,5,"#4a302d");box(ctx,q[0]-15,q[1]-4,30,4,"#bd8957");}
  for(let i=0;i<26;i++){let p=t*(.42+(i%5)*.07)+i*1.73,x=Math.sin(p)*(145+(i%4)*23),y=Math.cos(p*.83)*(93+(i%3)*17);ctx.globalAlpha=.25+(Math.sin(p*2)+1)*.22;if(i%3===0)oval(ctx,x,y,3,3,"#f7d99a");else box(ctx,x,y,i%2?3:4,i%2?5:2,i%2?"#e4b16a":"#f4dfb6");}ctx.globalAlpha=1;
  // Targa monumentale.
  box(ctx,-110,213,220,30,"rgba(22,17,20,.94)");box(ctx,-110,213,6,30,"#e2b16e");ctx.fillStyle="#fff0d2";ctx.font="bold 12px monospace";ctx.textAlign="center";ctx.fillText("AMARGENTA",0,228,195);ctx.fillStyle="#e7b875";ctx.font="bold 7px monospace";ctx.fillText("CITTA' DELLA FAZIONE AMARO",0,239,195);
  ctx.restore();
}
