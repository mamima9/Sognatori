// Citta delle fazioni: renderer ambientale dedicato, allo stesso livello di dettaglio di Verdelume.
// Solo grafica: non altera coordinate, porte, collisioni, incontri o logica di gioco.
const P={
Demone:["#4d303a","#2d202b","#b95754","#ffb36a","#7e4249"],
Robot:["#365965","#203d4b","#69d1c6","#dcfff2","#4d8991"],
Nuvola:["#819cbd","#536d8d","#cce4f5","#fff9ef","#a9c9e7"],
Umano:["#94734e","#60462f","#d8b17a","#f5e2b6","#b98b5c"],
Luce:["#b89a53","#79602f","#f2d77e","#fff5c4","#d6b85f"],
Dolce:["#a66d94","#714967","#f0b5d4","#fff0e6","#d48db8"],
Marino:["#397b8b","#214f65","#80d5d6","#d9fff1","#58a9b4"],
Orso:["#816044","#4a382c","#c49b63","#f1d8a5","#a67d4e"],
Mago:["#655785","#3d3459","#b9a7eb","#f4eaff","#8b78b9"],
Salato:["#929b91","#58625f","#e2dfce","#fffdf2","#b8bcb0"]};
function ellipse(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function tree(c,x,y,s,p,type=0){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,4,18,28,8,"rgba(8,15,18,.25)");c.fillStyle=p[1];c.fillRect(-5,-3,10,25);if(type===1){c.fillStyle=p[4];c.beginPath();c.moveTo(0,-55);c.lineTo(-27,4);c.lineTo(27,4);c.closePath();c.fill();c.fillStyle=p[2];c.beginPath();c.moveTo(0,-40);c.lineTo(-19,5);c.lineTo(19,5);c.closePath();c.fill();}else{for(const [x,y,r,col] of [[-16,-17,17,p[1]],[0,-31,21,p[4]],[17,-17,17,p[2]],[0,-9,23,p[4]]])ellipse(c,x,y,r,r,col);c.fillStyle=p[3];c.fillRect(-11,-29,7,4);c.fillRect(5,-37,8,4);}c.restore();}
function lamp(c,x,y,p,t){c.fillStyle=p[1];c.fillRect(x-3,y-2,6,36);c.fillRect(x-10,y-5,20,5);c.fillStyle=p[4];c.fillRect(x-8,y-20,16,16);c.globalAlpha=.7+.25*Math.sin(t*2+x);c.fillStyle=p[3];c.fillRect(x-4,y-16,8,10);c.globalAlpha=1;ellipse(c,x,y-12,19,19,"rgba(255,224,140,.09)");}
function fountain(c,x,y,p,t){ellipse(c,x,y+6,34,15,p[1]);ellipse(c,x,y,31,13,p[4]);ellipse(c,x,y-3,24,8,p[2]);c.globalAlpha=.5+.25*Math.sin(t*2);c.strokeStyle=p[3];c.lineWidth=2;c.beginPath();c.ellipse(x,y-4,12+Math.sin(t)*4,4,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;}
export function drawAdventureFactionCity(ctx,city){
const p=P[city.faction];if(!p)return;const t=performance.now()/1000;
ctx.save();ctx.translate(Math.round(city.x/4)*4,Math.round(city.y/4)*4);ctx.scale(1.55,1.55);ctx.imageSmoothingEnabled=false;
// Fascia esterna e bioma: ogni fazione ha una propria identita ambientale.
ellipse(ctx,0,12,305,248,"rgba(5,12,18,.22)");ellipse(ctx,0,0,294,236,p[1]);ellipse(ctx,0,-4,281,224,p[0]);ellipse(ctx,0,-5,263,207,p[4]);ellipse(ctx,0,-4,245,190,p[0]);
for(let i=0;i<34;i++){const a=i*Math.PI*2/34,x=Math.cos(a)*(244+(i%3)*9),y=Math.sin(a)*(178+(i%4)*7);if(city.faction==="Robot"){ctx.fillStyle=p[1];ctx.fillRect(x-13,y-23,26,43);ctx.fillStyle=p[2];ctx.fillRect(x-9,y-19,18,34);ctx.fillStyle=p[3];ctx.fillRect(x-5,y-12,10,6);}else if(city.faction==="Marino"){ctx.fillStyle=p[1];ctx.fillRect(x-4,y-9,8,32);ctx.fillStyle=p[2];ctx.beginPath();ctx.arc(x,y-16,13,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(x-13,y-16,26,6);}else if(city.faction==="Salato"){ctx.fillStyle=p[2];ctx.beginPath();ctx.moveTo(x,y-37);ctx.lineTo(x-15,y+12);ctx.lineTo(x+14,y+12);ctx.closePath();ctx.fill();}else tree(ctx,x,y,.65+(i%4)*.09,p,city.faction==="Nuvola"?1:city.faction==="Orso"?2:0);}
// Sentieri circolari e sei diramazioni agli ingressi: stessi accessi gia presenti.
ctx.strokeStyle=p[1];ctx.lineWidth=29;ctx.beginPath();ctx.ellipse(0,0,190,151,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=p[2];ctx.lineWidth=20;ctx.beginPath();ctx.ellipse(0,-2,188,149,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="rgba(255,255,255,.2)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-2,188,149,0,0,Math.PI*2);ctx.stroke();
const houses=[[-132,-88],[0,-158],[132,-88],[-132,88],[132,88],[0,158]];
for(const [x,y] of houses){ctx.strokeStyle=p[1];ctx.lineWidth=25;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x*.78,y*.78);ctx.stroke();ctx.strokeStyle=p[2];ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x*.78,y*.78);ctx.stroke();ctx.strokeStyle="rgba(255,255,255,.2)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x*.78,y*.78);ctx.stroke();}
// Piazza centrale con lastre e riflessi.
ellipse(ctx,0,0,91,70,p[1]);ellipse(ctx,0,-3,84,63,p[2]);ctx.strokeStyle="rgba(40,35,32,.24)";ctx.lineWidth=1.5;for(let r=-3;r<=3;r++){const y=r*17,half=78*Math.sqrt(Math.max(.1,1-y*y/4100));ctx.beginPath();ctx.moveTo(-half,y);ctx.lineTo(half,y);ctx.stroke();}for(let col=-4;col<=4;col++){const x=col*18;ctx.beginPath();ctx.moveTo(x,-60);ctx.lineTo(x*.84,60);ctx.stroke();}
// Monumento centrale distintivo per fazione.
if(city.faction==="Demone"){ctx.fillStyle=p[1];ctx.fillRect(-39,-22,78,60);ctx.fillStyle=p[2];ctx.beginPath();ctx.moveTo(-40,-20);ctx.lineTo(-21,-78);ctx.lineTo(-4,-20);ctx.fill();ctx.beginPath();ctx.moveTo(40,-20);ctx.lineTo(21,-78);ctx.lineTo(4,-20);ctx.fill();ctx.fillStyle=p[3];ctx.fillRect(-6,-8,12,37);}
else if(city.faction==="Robot"){ctx.fillStyle=p[1];ctx.fillRect(-39,-42,78,78);ctx.fillStyle=p[2];ctx.fillRect(-30,-33,60,60);ctx.fillStyle=p[1];ctx.fillRect(-18,-22,36,35);ctx.fillStyle=p[3];ctx.fillRect(-8,-12,16,12);ctx.fillRect(-3,-57,6,16);}
else if(city.faction==="Nuvola"){ellipse(ctx,0,5,68,20,p[2]);ctx.fillStyle=p[2];ctx.fillRect(-5,-52,10,54);ellipse(ctx,-25,-44,19,19,p[2]);ellipse(ctx,25,-40,23,23,p[2]);}
else if(city.faction==="Umano"){ctx.fillStyle=p[1];ctx.fillRect(-42,-37,84,76);ctx.fillStyle=p[2];ctx.fillRect(-34,-29,68,65);ctx.fillStyle=p[4];ctx.fillRect(-7,-12,14,47);ctx.fillStyle=p[3];ctx.fillRect(-24,-22,48,5);}
else if(city.faction==="Luce"){ctx.fillStyle=p[4];ctx.beginPath();ctx.moveTo(0,-82);ctx.lineTo(-28,35);ctx.lineTo(28,35);ctx.closePath();ctx.fill();ellipse(ctx,0,-43,21,21,p[3]);ctx.strokeStyle=p[2];ctx.lineWidth=4;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*55,-43+Math.sin(a)*55);ctx.lineTo(Math.cos(a)*70,-43+Math.sin(a)*70);ctx.stroke();}}
else if(city.faction==="Dolce"){for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(ctx,Math.cos(a)*23,-26+Math.sin(a)*23,13,19,i%2?p[2]:p[3]);}ellipse(ctx,0,-26,13,13,p[4]);}
else if(city.faction==="Marino"){ctx.fillStyle=p[1];ctx.fillRect(-72,-8,144,47);ctx.fillStyle=p[2];ctx.fillRect(-72,0,144,5);ctx.fillRect(-72,27,144,5);ctx.fillStyle=p[3];ctx.fillRect(-48,-20,96,11);ctx.fillStyle=p[4];ctx.fillRect(-6,-58,12,40);}
else if(city.faction==="Orso"){ctx.fillStyle=p[1];ctx.fillRect(-54,-28,108,67);ctx.fillStyle=p[4];ctx.beginPath();ctx.moveTo(-60,-26);ctx.lineTo(0,-76);ctx.lineTo(60,-26);ctx.closePath();ctx.fill();ctx.fillStyle=p[3];ctx.fillRect(-9,-4,18,18);}
else if(city.faction==="Mago"){ctx.strokeStyle=p[2];ctx.lineWidth=9;ctx.strokeRect(-39,-53,78,91);ctx.strokeStyle=p[3];ctx.lineWidth=4;ctx.strokeRect(-23,-36,46,59);ctx.fillStyle=p[3];ctx.beginPath();ctx.moveTo(0,-80);ctx.lineTo(-12,-57);ctx.lineTo(12,-57);ctx.closePath();ctx.fill();}
else if(city.faction==="Salato"){for(let i=-1;i<=1;i++){ctx.fillStyle=p[2];ctx.beginPath();ctx.moveTo(i*34,-55-Math.abs(i)*12);ctx.lineTo(i*34-18,35);ctx.lineTo(i*34+18,35);ctx.closePath();ctx.fill();ctx.fillStyle=p[3];ctx.fillRect(i*34-2,-35-Math.abs(i)*12,4,60);}}
// Case con facciate, tetti, abbaini, finestre e porte: posizioni compatibili con gli ingressi.
houses.forEach(([bx,by],i)=>{const w=i%3===0?68:61,h=i%2===0?58:64,l=bx-w/2,top=by-h/2;ctx.fillStyle="rgba(4,10,14,.35)";ctx.fillRect(l+8,top+h-1,w+7,17);ctx.fillStyle=p[1];ctx.fillRect(l-4,top+9,w+8,h-5);ctx.fillStyle=p[2];ctx.fillRect(l,top+13,w,h-13);ctx.fillStyle=p[4];ctx.fillRect(l+5,top+19,w-10,h-22);ctx.fillStyle=p[1];if(["Nuvola","Dolce","Luce"].includes(city.faction)){ctx.beginPath();ctx.ellipse(bx,top+17,w*.62,20,0,Math.PI,Math.PI*2);ctx.fill();}else if(["Robot","Marino","Salato"].includes(city.faction)){ctx.fillRect(l-7,top+5,w+14,13);ctx.fillStyle=p[2];ctx.fillRect(l-3,top+2,w+6,4);}else{ctx.beginPath();ctx.moveTo(l-8,top+18);ctx.lineTo(bx,top-21);ctx.lineTo(l+w+8,top+18);ctx.closePath();ctx.fill();}for(const wx of [l+12,l+w-23]){ctx.fillStyle=p[1];ctx.fillRect(wx-3,top+27,17,19);ctx.fillStyle=p[3];ctx.fillRect(wx,top+30,11,12);ctx.fillStyle=p[2];ctx.fillRect(wx+4,top+30,3,12);ctx.fillRect(wx,top+35,11,2);}ctx.fillStyle=p[1];ctx.fillRect(bx-9,top+h-25,18,25);ctx.fillStyle=p[2];ctx.fillRect(bx-6,top+h-22,12,22);ctx.fillStyle=p[1];ctx.fillRect(bx-4,top+h-19,8,19);ctx.fillStyle=p[3];ctx.fillRect(bx+3,top+h-12,2,3);ctx.fillStyle=p[2];ctx.fillRect(bx-5,top+h-32,10,5);ctx.fillStyle=p[3];ctx.fillRect(bx-2,top+h-38,4,6);ctx.fillStyle=p[1];ctx.fillRect(bx-18,top+h-45,36,8);ctx.fillStyle=p[2];ctx.font="bold 5px monospace";ctx.textAlign="center";ctx.fillText(["CASA","TORRE","BOTTEGA","LOCANDA","SALA","OFFICINA"][i],bx,top+h-39,33);});
// Punti di interesse, arredi, vegetazione e luci.
fountain(ctx,-94,18,p,t);lamp(ctx,-193,-74,p,t);lamp(ctx,194,48,p,t);
if(city.faction==="Marino"){ctx.fillStyle=p[1];ctx.fillRect(-221,100,74,8);ctx.fillStyle=p[2];ctx.fillRect(-218,94,68,5);for(let i=0;i<6;i++){ctx.fillStyle=p[3];ctx.fillRect(-210+i*11,95,4,4);}}
else if(city.faction==="Robot"){ctx.strokeStyle=p[2];ctx.lineWidth=4;ctx.strokeRect(146,-125,52,68);ctx.strokeStyle=p[3];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(172,-120);ctx.lineTo(172,-62);ctx.moveTo(151,-91);ctx.lineTo(193,-91);ctx.stroke();}
else if(city.faction==="Mago"){ctx.strokeStyle=p[2];ctx.lineWidth=3;ctx.beginPath();ctx.arc(174,-112,22,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=p[3];ctx.beginPath();ctx.arc(174,-112,12,0,Math.PI*2);ctx.stroke();}
else if(city.faction==="Demone"){for(const x of [-205,205]){ctx.fillStyle=p[1];ctx.fillRect(x-8,20,16,42);ctx.fillStyle=p[3];ctx.fillRect(x-3,26,6,19);}}
else if(city.faction==="Dolce"){for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(ctx,Math.cos(a)*207,Math.sin(a)*142,5,5,i%2?p[2]:p[3]);}}
else if(city.faction==="Salato"){for(let i=0;i<5;i++){const x=-180+i*90;ctx.fillStyle=p[2];ctx.beginPath();ctx.moveTo(x,100);ctx.lineTo(x-10,133);ctx.lineTo(x+10,133);ctx.closePath();ctx.fill();}}
else{for(let i=0;i<7;i++){const x=-205+i*68;ctx.fillStyle=p[4];ctx.fillRect(x,102,5,17);ctx.fillStyle=p[2];ctx.fillRect(x-5,98,15,5);}}
for(let i=0;i<18;i++){const phase=t*(.55+(i%4)*.13)+i*1.7,x=Math.sin(phase)*(175+(i%3)*20),y=Math.cos(phase*.8)*(112+(i%2)*20);ctx.globalAlpha=.28+(.5+.5*Math.sin(phase*2))*.48;if(city.faction==="Marino"){ctx.strokeStyle=p[3];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,2+i%3,0,Math.PI*2);ctx.stroke();}else if(city.faction==="Mago"){ctx.strokeStyle=p[3];ctx.lineWidth=2;ctx.strokeRect(x,y,5,5);}else{ctx.fillStyle=p[3];ctx.fillRect(x,y,city.faction==="Demone"?3:4,city.faction==="Demone"?5:4);}ctx.globalAlpha=1;}
ctx.fillStyle="rgba(8,13,18,.88)";ctx.fillRect(-100,216,200,26);ctx.fillStyle=p[2];ctx.fillRect(-100,216,5,26);ctx.fillStyle="#fff5df";ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.fillText(city.city||city.name||city.faction.toUpperCase(),0,233,188);
ctx.restore();
}
