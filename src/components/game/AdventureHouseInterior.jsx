import React, { useEffect, useRef, useState } from "react";
import AdventureTravelerSprite from "@/components/game/AdventureTravelerSprite";

const W=800,H=520;
const THEMES={
  Natura:{wall:"#244b32",floor:"#9cae70",trim:"#d4dc9a",dark:"#493b2b",accent:"#75a94d",window:"#a9d7b0",motif:"leaf"},
  Robot:{wall:"#263e50",floor:"#718f91",trim:"#b6e5df",dark:"#1b2c3b",accent:"#42b8bd",window:"#8ce5e4",motif:"circuit"},
  Demone:{wall:"#482936",floor:"#946052",trim:"#efaa70",dark:"#2c1b29",accent:"#c65350",window:"#f39b63",motif:"ember"},
  Nuvola:{wall:"#526b8b",floor:"#b5cbe0",trim:"#f3f0f2",dark:"#34445f",accent:"#a4c8ed",window:"#e3f3ff",motif:"cloud"},
  Umano:{wall:"#654637",floor:"#bd9468",trim:"#efd19b",dark:"#493126",accent:"#b96e46",window:"#9dc6c5",motif:"wood"},
  Luce:{wall:"#80652f",floor:"#d8bd75",trim:"#fff0b1",dark:"#554322",accent:"#f4d66e",window:"#fff4c6",motif:"sun"},
  Dolce:{wall:"#70486b",floor:"#d3a4bf",trim:"#ffe0ed",dark:"#50364e",accent:"#e99acb",window:"#f8d8ec",motif:"flower"},
  Marino:{wall:"#20536a",floor:"#76b5b6",trim:"#c6f0e9",dark:"#173d54",accent:"#43a6b6",window:"#b7edf0",motif:"coral"},
  Orso:{wall:"#4d392b",floor:"#a98254",trim:"#e5c58e",dark:"#33271f",accent:"#bd8d52",window:"#b5c5a2",motif:"pine"},
  Mago:{wall:"#3c315c",floor:"#8d7db2",trim:"#e2d6ff",dark:"#29213f",accent:"#a78bdf",window:"#d6c7ff",motif:"rune"},
  Salato:{wall:"#626b69",floor:"#c2c1ae",trim:"#f2e7c7",dark:"#3f4948",accent:"#a7b9b5",window:"#e7f0e9",motif:"crystal"}
};
const LAYOUTS=[
  [{x:86,y:180,w:168,h:70},{x:545,y:175,w:165,h:78},{x:105,y:350,w:115,h:55},{x:580,y:345,w:112,h:60}],
  [{x:78,y:175,w:210,h:90},{x:510,y:175,w:210,h:90},{x:290,y:345,w:220,h:65}],
  [{x:85,y:175,w:130,h:100},{x:585,y:175,w:130,h:100},{x:285,y:155,w:230,h:62},{x:295,y:365,w:210,h:55}],
  [{x:95,y:185,w:175,h:85},{x:530,y:185,w:175,h:85},{x:300,y:335,w:200,h:80}],
  [{x:85,y:175,w:155,h:68},{x:560,y:175,w:155,h:68},{x:85,y:350,w:155,h:68},{x:560,y:350,w:155,h:68}],
  [{x:90,y:175,w:135,h:95},{x:575,y:175,w:135,h:95},{x:300,y:165,w:200,h:70},{x:300,y:360,w:200,h:55}]
];
function drawThemeMotif(ctx,motif,t){
  const px=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  ctx.save();
  if(motif==="leaf"){px(385,36,5,54,t.accent);px(360,47,28,12,t.trim);px(388,63,30,12,t.accent);px(375,43,12,5,t.window);}
  if(motif==="circuit"){px(360,48,80,5,t.accent);px(397,28,5,65,t.trim);px(340,45,5,25,t.accent);px(455,65,5,25,t.accent);px(335,65,20,5,t.trim);px(445,85,20,5,t.trim);}
  if(motif==="ember"){for(let i=0;i<5;i++){px(350+i*24,75-(i%2)*14,5,18,t.accent);px(353+i*24,66-(i%2)*14,4,8,t.trim);}}
  if(motif==="cloud"){for(let i=0;i<4;i++){ctx.fillStyle=i%2?t.accent:t.trim;ctx.beginPath();ctx.arc(350+i*32,65-(i%2)*10,17,0,Math.PI*2);ctx.fill();}}
  if(motif==="wood"){for(let i=0;i<6;i++)px(350+i*20,36,5,55,i%2?t.accent:t.dark);}
  if(motif==="sun"){ctx.strokeStyle=t.trim;ctx.lineWidth=5;ctx.beginPath();ctx.arc(400,62,24,0,Math.PI*2);ctx.stroke();px(397,25,6,15,t.trim);px(397,84,6,15,t.trim);px(360,59,15,6,t.trim);px(425,59,15,6,t.trim);}
  if(motif==="flower"){for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillStyle=t.accent;ctx.beginPath();ctx.arc(400+Math.cos(a)*16,62+Math.sin(a)*16,12,0,Math.PI*2);ctx.fill();}px(394,56,12,12,t.trim);}
  if(motif==="coral"){ctx.strokeStyle=t.trim;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(400,90);ctx.lineTo(400,38);ctx.lineTo(375,20);ctx.moveTo(400,60);ctx.lineTo(428,36);ctx.stroke();}
  if(motif==="pine"){for(let i=0;i<3;i++){px(370+i*25,38,5,54,t.dark);ctx.fillStyle=t.accent;ctx.beginPath();ctx.moveTo(372+i*25,25);ctx.lineTo(350+i*25,70);ctx.lineTo(394+i*25,70);ctx.fill();}}
  if(motif==="rune"){ctx.strokeStyle=t.trim;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(370,83);ctx.lineTo(400,27);ctx.lineTo(430,83);ctx.moveTo(380,65);ctx.lineTo(420,65);ctx.stroke();ctx.fillStyle=t.accent;ctx.fillRect(395,50,10,10);}
  if(motif==="crystal"){ctx.fillStyle=t.trim;ctx.beginPath();ctx.moveTo(400,22);ctx.lineTo(430,57);ctx.lineTo(400,94);ctx.lineTo(370,57);ctx.closePath();ctx.fill();ctx.fillStyle=t.accent;ctx.fillRect(396,36,8,44);}
  ctx.restore();
}
function drawRoom(ctx,house,player,tick){
  const theme=THEMES[house.city.faction]||THEMES.Umano;
  const layout=LAYOUTS[((house.number||1)-1)%LAYOUTS.length];
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#101a1b";ctx.fillRect(0,0,W,H);
  ctx.fillStyle=theme.wall;ctx.fillRect(25,20,750,480);
  ctx.fillStyle=theme.floor;ctx.fillRect(45,145,710,330);
  ctx.fillStyle=theme.trim;ctx.fillRect(25,128,750,18);
  // Floor tiles and beams.
  ctx.globalAlpha=.2;ctx.fillStyle=theme.dark;
  for(let y=160;y<470;y+=38)for(let x=52+(Math.floor(y/38)%2)*19;x<750;x+=38)ctx.fillRect(x,y,32,2);
  ctx.globalAlpha=1;
  ctx.fillStyle=theme.dark;ctx.fillRect(75,53,118,70);ctx.fillRect(607,53,118,70);
  ctx.fillStyle=theme.window;ctx.fillRect(83,61,102,54);ctx.fillRect(615,61,102,54);
  ctx.fillStyle=theme.trim;ctx.fillRect(132,61,5,54);ctx.fillRect(83,85,102,5);ctx.fillRect(664,61,5,54);ctx.fillRect(615,85,102,5);
  drawThemeMotif(ctx,theme.motif,theme);
  // Furniture arrangement differs by room number; materials follow the faction.
  for(const [i,o] of layout.entries()){
    ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(o.x+6,o.y+8,o.w,o.h);
    ctx.fillStyle=theme.dark;ctx.fillRect(o.x,o.y,o.w,o.h);
    ctx.fillStyle=i%2?theme.accent:theme.trim;ctx.fillRect(o.x+5,o.y+5,o.w-10,Math.max(7,o.h*.23));
    ctx.fillStyle=theme.floor;ctx.fillRect(o.x+10,o.y+o.h*.48,o.w-20,Math.max(6,o.h*.25));
    if(theme.motif==="rune"||theme.motif==="crystal"){ctx.fillStyle=theme.trim;ctx.fillRect(o.x+o.w/2-3,o.y+o.h*.35,6,o.h*.35);}
  }
  // Central rug/altar/work area.
  ctx.fillStyle=theme.dark;ctx.fillRect(310,240,180,100);
  ctx.fillStyle=theme.accent;ctx.fillRect(320,250,160,80);
  ctx.fillStyle=theme.trim;ctx.fillRect(330,260,140,60);
  if(theme.motif==="leaf"||theme.motif==="flower"){ctx.fillStyle=theme.dark;ctx.fillRect(394,272,12,38);ctx.fillRect(370,278,25,7);ctx.fillRect(405,288,25,7);}
  if(theme.motif==="circuit"||theme.motif==="rune"){ctx.fillStyle=theme.trim;ctx.fillRect(365,275,70,5);ctx.fillRect(397,265,6,50);}
  if(theme.motif==="coral"||theme.motif==="crystal"){ctx.fillStyle=theme.window;ctx.beginPath();ctx.moveTo(400,265);ctx.lineTo(430,295);ctx.lineTo(400,320);ctx.lineTo(370,295);ctx.closePath();ctx.fill();}
  // Exit doorway: south wall, visible and physically reachable.
  ctx.fillStyle=theme.dark;ctx.fillRect(355,418,90,82);
  ctx.fillStyle=theme.trim;ctx.fillRect(362,425,76,75);
  ctx.fillStyle=theme.dark;ctx.fillRect(370,433,60,67);
  ctx.fillStyle=theme.accent;ctx.fillRect(418,466,5,5);
  // Player avatar in the same pixel scale as the room.
  const {x,y}=player,step=Math.floor(tick/10)%2;
  ctx.fillStyle="rgba(0,0,0,.28)";ctx.fillRect(x-13,y+17,27,6);
  ctx.fillStyle="#302a35";ctx.fillRect(x-9,y+5+(step?1:0),7,13);ctx.fillRect(x+3,y+5,7,13);
  ctx.fillStyle="#4779a5";ctx.fillRect(x-12,y-10,24,18);
  ctx.fillStyle="#e6b88e";ctx.fillRect(x-10,y-27,20,18);
  ctx.fillStyle="#49352d";ctx.fillRect(x-11,y-30,22,8);ctx.fillRect(x-13,y-24,5,10);
  ctx.fillStyle="#25202a";ctx.fillRect(x-5,y-20,3,3);ctx.fillRect(x+4,y-20,3,3);
  ctx.fillStyle="#e8c69b";ctx.fillRect(x-15+(step?2:0),y-5,5,13);ctx.fillRect(x+10-(step?2:0),y-5,5,13);
}
export default function AdventureHouseInterior({house,onExit}){
  const canvasRef=useRef(null),position=useRef({x:400,y:350}),keys=useRef({});
  const [dialogue,setDialogue]=useState(""),[nearNpc,setNearNpc]=useState(false),[nearExit,setNearExit]=useState(false);
  const [tick,setTick]=useState(0);
  const titles=["Rifugio","Bottega","Casa degli abitanti","Locanda","Dimora del custode","Laboratorio"];
  const title=house.city.id==="natura"?["Rifugio tra le fronde","Bottega dell'erborista","Casa del raccoglitore","Locanda del sottobosco","Dimora del custode","Officina del legno vivo"][(house.number||1)-1]:titles[(house.number||1)-1];
  const theme=THEMES[house.city.faction]||THEMES.Umano;
  useEffect(()=>{
    const down=e=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d","e"].includes(k)){e.preventDefault();keys.current[k]=true;}};
    const up=e=>{keys.current[e.key.toLowerCase()]=false;};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
  },[]);
  useEffect(()=>{
    let raf,last=0,frame=0;const ctx=canvasRef.current?.getContext("2d");if(!ctx)return;
    const loop=now=>{
      const dt=Math.min((now-last)/16.67,2);last=now;frame++;
      const k=keys.current;let dx=0,dy=0;
      if(k.w||k.arrowup)dy--;if(k.s||k.arrowdown)dy++;if(k.a||k.arrowleft)dx--;if(k.d||k.arrowright)dx++;
      if(dx||dy){
        const len=Math.hypot(dx,dy);
        const next={x:Math.max(65,Math.min(735,position.current.x+dx/len*3.1*dt)),y:Math.max(190,Math.min(474,position.current.y+dy/len*3.1*dt))};
        const layout=LAYOUTS[((house.number||1)-1)%LAYOUTS.length];
        const hitsFurniture=layout.some(o=>next.x>o.x-17&&next.x<o.x+o.w+17&&next.y>o.y-24&&next.y<o.y+o.h+8);
        const hitsCentral=next.x>292&&next.x<508&&next.y>216&&next.y<352;
        if(!hitsFurniture&&!hitsCentral)position.current=next;
      }
      const npc=Math.hypot(position.current.x-400,position.current.y-205)<88;
      const exit=position.current.y>445&&Math.abs(position.current.x-400)<62;
      setNearNpc(npc);setNearExit(exit);if(frame%8===0)setTick(t=>t+1);
      drawRoom(ctx,house,position.current,frame);raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);
  },[house]);
  const interact=()=>{if(nearExit){onExit();return;}if(nearNpc)setDialogue(house.dialogue||"Benvenuto! Questa casa custodisce una storia della città.");};
  const move=(key,active)=>{keys.current[key]=active;};
  return <div className="fixed inset-0 z-[90] flex flex-col text-white" style={{background:theme.dark}}>
    <header className="flex items-center justify-between border-b border-white/15 bg-black/55 px-4 py-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.3em]" style={{color:theme.trim}}>{house.city.city} · {house.city.faction}</div><div className="text-lg font-black">{title}</div></div>
      <button onClick={onExit} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">Esci dalla casa</button>
    </header>
    <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2">
      <div className="relative w-full max-w-[1100px]">
        <canvas ref={canvasRef} width={W} height={H} className="block aspect-[20/13] w-full rounded-xl border-4 shadow-2xl" style={{imageRendering:"pixelated",borderColor:theme.trim}}/>
        <div className="pointer-events-none absolute left-1/2 top-[36%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <AdventureTravelerSprite traveler={house.resident} faction={house.city.faction} size={48} direction="down" walking={false}/>
          <span className="rounded bg-black/80 px-2 py-1 text-[10px] font-black">{house.resident}</span>
        </div>
        {dialogue&&<div className="absolute bottom-3 left-1/2 w-[min(90%,560px)] -translate-x-1/2 rounded-xl border bg-black/90 p-4 text-sm shadow-xl" style={{borderColor:theme.trim}}><b style={{color:theme.trim}}>{house.resident}</b><p className="mt-1">{dialogue}</p><button onClick={()=>setDialogue("")} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-black text-black">Continua</button></div>}
      </div>
    </main>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/55 px-4 py-3">
      <div className="text-xs text-white/70">WASD / frecce per muoverti · raggiungi la porta a sud e premi E</div>
      <div className="flex items-center gap-2">
        <button onPointerDown={()=>move("arrowleft",true)} onPointerUp={()=>move("arrowleft",false)} onPointerLeave={()=>move("arrowleft",false)} className="rounded-lg bg-white/15 px-4 py-3 font-black">←</button>
        <div className="flex flex-col gap-1"><button onPointerDown={()=>move("arrowup",true)} onPointerUp={()=>move("arrowup",false)} onPointerLeave={()=>move("arrowup",false)} className="rounded-lg bg-white/15 px-4 py-1 font-black">↑</button><button onPointerDown={()=>move("arrowdown",true)} onPointerUp={()=>move("arrowdown",false)} onPointerLeave={()=>move("arrowdown",false)} className="rounded-lg bg-white/15 px-4 py-1 font-black">↓</button></div>
        <button onPointerDown={()=>move("arrowright",true)} onPointerUp={()=>move("arrowright",false)} onPointerLeave={()=>move("arrowright",false)} className="rounded-lg bg-white/15 px-4 py-3 font-black">→</button>
        <button onClick={interact} className="ml-2 rounded-xl px-5 py-3 text-xs font-black text-black" style={{background:theme.trim}}>{nearExit?"ESCI":nearNpc?"PARLA":"INTERAGISCI"}</button>
      </div>
    </footer>
  </div>;
}
