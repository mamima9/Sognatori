import React, { useEffect, useRef, useState } from "react";
import { drawAdventureTraveler } from "@/lib/adventurePixelSprites";

const W=800,H=520;
const THEMES={
  Natura:{wall:"#263d32",floor:"#b6a77b",trim:"#e7d7a5",dark:"#493a2b",accent:"#78a85b",light:"#d8e6b0"},
  Robot:{wall:"#263b4b",floor:"#82999a",trim:"#c5e5df",dark:"#192d3c",accent:"#55b8bd",light:"#d8f4ec"},
  Demone:{wall:"#472d38",floor:"#a17b68",trim:"#f0c18b",dark:"#2d1d29",accent:"#c85a54",light:"#f5d6a5"},
  Nuvola:{wall:"#526780",floor:"#c1cbd0",trim:"#f2eee5",dark:"#35465b",accent:"#9fc5e5",light:"#f7f4ef"},
  Umano:{wall:"#674a3a",floor:"#c5a77c",trim:"#f0d9aa",dark:"#493126",accent:"#bd8053",light:"#f4e4c4"},
  Luce:{wall:"#786333",floor:"#ddc78c",trim:"#fff2c5",dark:"#514222",accent:"#e5c45d",light:"#fff8db"},
  Dolce:{wall:"#75536e",floor:"#d9b8c5",trim:"#ffe7ec",dark:"#50364e",accent:"#d98fbd",light:"#fff0f4"},
  Marino:{wall:"#28576a",floor:"#91c1bb",trim:"#d4f2e9",dark:"#173d54",accent:"#49a6b5",light:"#e2f8ef"},
  Orso:{wall:"#514032",floor:"#b99669",trim:"#ecd6a6",dark:"#342820",accent:"#b88b55",light:"#f0dfbb"},
  Mago:{wall:"#423858",floor:"#a99bc0",trim:"#e8ddf7",dark:"#2b2440",accent:"#a48bd8",light:"#f2eaff"},
  Salato:{wall:"#666d69",floor:"#d0cdbd",trim:"#f4ecd5",dark:"#424947",accent:"#aab6ae",light:"#f7f3e7"}
};

const ROOM_VARIANTS = [
  {name:"Salotto", furniture:"sofa", accent:"rug"},
  {name:"Studio", furniture:"desk", accent:"map"},
  {name:"Camera", furniture:"bed", accent:"plant"},
  {name:"Bottega", furniture:"counter", accent:"wares"},
  {name:"Sala comune", furniture:"table", accent:"lamp"},
  {name:"Officina", furniture:"workbench", accent:"tools"}
];

function drawPlayerAvatar(ctx,x,y,frame=0){
  // Copia fedele del protagonista usato nell'overworld: stessi vestiti, zaino, capelli e sciarpa.
  const bob=frame?1:0;
  ctx.save();ctx.translate(Math.round(x/4)*4,Math.round(y/4)*4);
  ctx.fillStyle="rgba(0,0,0,.34)";ctx.beginPath();ctx.ellipse(1,19,19,6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#49362d";ctx.fillRect(-14,-12,8,22);ctx.fillStyle="#9a623d";ctx.fillRect(-15,-10,7,14);ctx.fillStyle="#d49a55";ctx.fillRect(-14,-8,4,5);ctx.fillStyle="#55382c";ctx.fillRect(-8,-12,4,17);ctx.fillRect(5,-12,4,17);
  ctx.fillStyle="#26344e";ctx.fillRect(-9,5+(frame?1:0),8,12);ctx.fillRect(2,5+(frame?0:1),8,12);ctx.fillStyle="#40577e";ctx.fillRect(-8,7,5,7);ctx.fillRect(3,7,5,7);ctx.fillStyle="#30272a";ctx.fillRect(-11,15,10,5);ctx.fillRect(2,15,11,5);ctx.fillStyle="#b88955";ctx.fillRect(-10,15,7,2);ctx.fillRect(3,15,7,2);
  ctx.fillStyle="#8e452f";ctx.fillRect(-13,-14+bob,26,22);ctx.fillStyle="#d36b3f";ctx.fillRect(-10,-13+bob,20,18);ctx.fillStyle="#f0ad52";ctx.fillRect(-7,-12+bob,14,14);ctx.fillStyle="#8e452f";ctx.fillRect(-2,-12+bob,4,17);ctx.fillStyle="#f6d18a";ctx.fillRect(-1,-8+bob,2,3);ctx.fillRect(-1,-1+bob,2,3);
  ctx.fillStyle="#d99b70";ctx.fillRect(-17,-11+bob,5,14);ctx.fillRect(12,-11+bob,5,14);ctx.fillStyle="#c45c3d";ctx.fillRect(-17,-13+bob,5,5);ctx.fillRect(12,-13+bob,5,5);ctx.fillStyle="#302a32";ctx.fillRect(-17,1+bob,6,5);ctx.fillRect(11,1+bob,6,5);
  ctx.fillStyle="#b87956";ctx.fillRect(-5,-19+bob,10,7);ctx.fillStyle="#efc49a";ctx.fillRect(-10,-34+bob,20,17);ctx.fillStyle="#d99f78";ctx.fillRect(-10,-23+bob,4,5);ctx.fillRect(6,-23+bob,4,5);ctx.fillStyle="#33272a";ctx.fillRect(-11,-36+bob,22,7);ctx.fillRect(-9,-41+bob,18,6);ctx.fillRect(-12,-33+bob,5,7);ctx.fillRect(7,-34+bob,5,6);ctx.fillStyle="#f2bd55";ctx.fillRect(-12,-42+bob,24,5);ctx.fillRect(-7,-46+bob,14,4);ctx.fillStyle="#f7d58b";ctx.fillRect(-7,-41+bob,13,2);ctx.fillStyle="#29242a";ctx.fillRect(-6,-27+bob,3,3);ctx.fillRect(4,-27+bob,3,3);
  ctx.fillStyle="#7e2638";ctx.fillRect(-8,-17+bob,16,5);ctx.fillStyle="#d84e4d";ctx.fillRect(-7,-17+bob,14,3);ctx.fillRect(5,-14+bob,5,15);ctx.fillStyle="#f08a65";ctx.fillRect(6,-13+bob,2,8);
  ctx.fillStyle="rgba(255,226,163,.55)";ctx.fillRect(-8,-11+bob,3,2);ctx.fillRect(6,-9+bob,2,4);ctx.fillStyle="#e6bd79";ctx.fillRect(-9,4,3,2);ctx.fillRect(6,4,3,2);
  ctx.restore();
}

function drawBookcase(ctx,t){
  // Libreria leggibile e raggiungibile: libri distinti, piccolo bagliore sull'interazione.
  ctx.fillStyle="rgba(0,0,0,.24)";ctx.fillRect(55,258,126,105);
  ctx.fillStyle=t.dark;ctx.fillRect(48,248,126,105);
  ctx.fillStyle=t.trim;ctx.fillRect(54,254,114,93);
  for(let row=0;row<3;row++){
    const y=260+row*28;ctx.fillStyle=t.dark;ctx.fillRect(59,y+19,104,4);
    const colors=[t.accent,"#b85c4e","#d9bd79","#6f8eaa","#e6d9c2",t.light];
    for(let i=0;i<6;i++){const x=62+i*16;ctx.fillStyle=colors[(i+row*2)%colors.length];ctx.fillRect(x,y,10,18);ctx.fillStyle="rgba(255,255,255,.35)";ctx.fillRect(x+2,y+3,2,10);}
  }
  ctx.fillStyle=t.light;ctx.fillRect(83,238,54,7);ctx.fillStyle=t.trim;ctx.fillRect(94,229,32,9);
  ctx.fillStyle=t.dark;ctx.fillRect(109,224,3,8);
}

function drawFurniture(ctx,variant,t){
  const px=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  // Arredi posizionati ai lati: il corridoio centrale e l'uscita restano sempre liberi.
  const x=variant.furniture==="desk"||variant.furniture==="workbench"?555:548;
  const y=variant.furniture==="bed"?168:variant.furniture==="sofa"?180:270;
  px(x+5,y+8,175,64,"rgba(0,0,0,.22)");px(x,y,175,64,t.dark);px(x+5,y+5,165,14,t.accent);px(x+8,y+24,159,31,t.trim);
  if(variant.furniture==="bed"){px(x+10,y+8,54,43,t.light);px(x+72,y+8,90,43,t.accent);px(x+78,y+12,78,8,t.trim);}
  if(variant.furniture==="desk"||variant.furniture==="workbench"){px(x+18,y-22,138,23,t.dark);px(x+24,y-18,126,14,t.accent);px(x+30,y-15,22,7,t.light);px(x+90,y-15,42,7,t.trim);}
  if(variant.furniture==="sofa"){px(x+8,y-10,159,18,t.accent);px(x+12,y-6,36,12,t.trim);px(x+130,y-6,36,12,t.trim);}
  if(variant.furniture==="counter"){px(x-8,y-22,190,25,t.accent);px(x,y-17,174,8,t.light);}
  if(variant.furniture==="table"){px(x+18,y-14,140,15,t.accent);px(x+25,y+1,8,40,t.dark);px(x+142,y+1,8,40,t.dark);}
  if(variant.furniture==="workbench"){px(x+30,y-35,8,22,t.light);px(x+72,y-30,45,10,t.accent);px(x+136,y-34,7,20,t.light);}
}

function drawRoom(ctx,house,player,tick){
  const t=THEMES[house.city.faction]||THEMES.Umano;
  const variant=ROOM_VARIANTS[((house.number||1)-1)%ROOM_VARIANTS.length];
  ctx.clearRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle="#111821";ctx.fillRect(0,0,W,H);
  // Stanza in prospettiva top-down, con profondità e finiture ispirate ai JRPG DS.
  ctx.fillStyle=t.wall;ctx.fillRect(20,16,760,488);
  ctx.fillStyle=t.dark;ctx.fillRect(35,112,730,370);
  ctx.fillStyle=t.floor;ctx.fillRect(43,120,714,354);
  for(let y=122;y<472;y+=44)for(let x=45+(Math.floor(y/44)%2)*22;x<755;x+=44){ctx.fillStyle="rgba(30,28,26,.13)";ctx.fillRect(x,y,42,2);ctx.fillRect(x,y,2,40);ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(x+5,y+5,13,2);}
  // Battiscopa, travi e pannelli murali.
  ctx.fillStyle=t.trim;ctx.fillRect(20,103,760,12);ctx.fillStyle=t.dark;ctx.fillRect(20,115,760,5);
  ctx.fillStyle=t.accent;ctx.fillRect(28,24,744,6);ctx.fillRect(28,24,6,79);ctx.fillRect(766,24,6,79);
  // Finestre laterali e luce naturale.
  ctx.fillStyle=t.dark;ctx.fillRect(78,42,118,54);ctx.fillRect(604,42,118,54);
  ctx.fillStyle=t.light;ctx.fillRect(84,48,106,42);ctx.fillRect(610,48,106,42);
  ctx.fillStyle=t.accent;ctx.fillRect(135,48,5,42);ctx.fillRect(84,67,106,4);ctx.fillRect(661,48,5,42);ctx.fillRect(610,67,106,4);
  // Emblema della fazione sulla parete di fondo.
  ctx.fillStyle=t.dark;ctx.fillRect(350,31,100,67);ctx.fillStyle=t.accent;ctx.fillRect(358,39,84,51);ctx.fillStyle=t.light;ctx.fillRect(378,51,44,27);
  ctx.fillStyle=t.trim;ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.fillText(house.city.faction.toUpperCase(),400,87);
  // Tappeto centrale decorativo, fuori dal percorso verso la porta.
  ctx.fillStyle=t.dark;ctx.fillRect(270,205,260,116);ctx.fillStyle=t.accent;ctx.fillRect(278,213,244,100);ctx.fillStyle=t.trim;ctx.fillRect(290,225,220,76);
  ctx.fillStyle=t.light;ctx.fillRect(394,242,12,42);ctx.fillRect(375,257,50,10);
  // Arredi diversi per ogni casa.
  drawFurniture(ctx,variant,t);
  // Libreria fissa a sinistra: davanti rimane un'area di accesso libera.
  drawBookcase(ctx,t);
  // Pianta/lampada/oggetto distintivo per differenziare le sei case.
  ctx.fillStyle=t.dark;ctx.fillRect(690,375,42,42);ctx.fillStyle=t.accent;ctx.fillRect(696,366,30,14);ctx.fillStyle=t.light;ctx.fillRect(704,354,14,14);
  // Porta sud: nessun mobile, tappeto o collisione nel corridoio d'accesso.
  ctx.fillStyle=t.dark;ctx.fillRect(350,423,100,81);ctx.fillStyle=t.trim;ctx.fillRect(359,429,82,75);ctx.fillStyle="#111821";ctx.fillRect(368,436,64,68);
  ctx.fillStyle=t.accent;ctx.fillRect(421,469,5,5);
  // Abitante: identico renderer e scala degli NPC esterni (non ridotto a un overlay).
  drawAdventureTraveler(ctx,house.resident,house.city.faction,400,205,Math.floor(tick/18)%2,1,"down");
  ctx.fillStyle="rgba(7,13,18,.88)";ctx.fillRect(334,119,132,24);ctx.fillStyle=t.light;ctx.font="bold 12px monospace";ctx.textAlign="center";ctx.fillText(house.resident,400,135);
  // Protagonista con identica sprite, outfit e accessori dell'overworld.
  drawPlayerAvatar(ctx,player.x,player.y,Math.floor(tick/9)%2);
}

export default function AdventureHouseInterior({house,onExit}){
  const canvasRef=useRef(null),position=useRef({x:400,y:365}),keys=useRef({});
  const [dialogue,setDialogue]=useState(null),[nearNpc,setNearNpc]=useState(false),[nearExit,setNearExit]=useState(false),[nearBooks,setNearBooks]=useState(false);
  const [tick,setTick]=useState(0);
  const variant=ROOM_VARIANTS[((house.number||1)-1)%ROOM_VARIANTS.length];
  const title=house.city.id==="natura"?["Rifugio tra le fronde","Bottega dell'erborista","Casa del raccoglitore","Locanda del sottobosco","Dimora del custode","Officina del legno vivo"][(house.number||1)-1]:variant.name+" · "+house.city.faction;
  const theme=THEMES[house.city.faction]||THEMES.Umano;
  const bookTitle=house.lore?.title||("Cronache di "+house.city.city);
  const bookText=house.lore?.lore||house.dialogue||("Queste pagine raccontano le origini di "+house.city.city+".");
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
        const len=Math.hypot(dx,dy),next={x:Math.max(55,Math.min(745,position.current.x+dx/len*3.1*dt)),y:Math.max(185,Math.min(480,position.current.y+dy/len*3.1*dt))};
        // Collisioni solo sugli arredi laterali e sulla libreria; corridoio della porta sempre libero.
        const hitsBookcase=next.x>35&&next.x<190&&next.y>238&&next.y<366;
        const furnitureX=next.x>535&&next.x<745&&next.y>155&&next.y<365;
        const hitsRug=next.x>260&&next.x<540&&next.y>200&&next.y<320;
        const inDoorLane=Math.abs(next.x-400)<62&&next.y>405;
        if((!hitsBookcase&&!furnitureX&&!hitsRug)||inDoorLane)position.current=next;
      }
      const npc=Math.hypot(position.current.x-400,position.current.y-205)<92;
      const books=Math.hypot(position.current.x-190,position.current.y-300)<76;
      const exit=position.current.y>445&&Math.abs(position.current.x-400)<68;
      setNearNpc(npc);setNearBooks(books);setNearExit(exit);
      if(frame%8===0)setTick(t=>t+1);
      drawRoom(ctx,house,position.current,frame);raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);
  },[house]);
  const interact=()=>{
    if(nearExit){onExit();return;}
    if(nearBooks){setDialogue({title:bookTitle,text:bookText,kind:"book"});return;}
    if(nearNpc)setDialogue({title:house.resident,text:house.dialogue||"Benvenuto! Questa casa custodisce una storia della città.",kind:"npc"});
  };
  const move=(key,active)=>{keys.current[key]=active;};
  return <div className="fixed inset-0 z-[90] flex flex-col text-white" style={{background:theme.dark}}>
    <header className="flex items-center justify-between border-b border-white/15 bg-black/55 px-4 py-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.3em]" style={{color:theme.trim}}>{house.city.city} · {house.city.faction}</div><div className="text-lg font-black">{title}</div></div>
      <div className="rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-widest" style={{borderColor:theme.trim,color:theme.trim}}>Casa {house.number}/6</div>
    </header>
    <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2">
      <div className="relative w-full max-w-[1100px]">
        <canvas ref={canvasRef} width={W} height={H} className="block aspect-[20/13] w-full rounded-xl border-4 shadow-2xl" style={{imageRendering:"pixelated",borderColor:theme.trim}}/>
        {dialogue&&<div className="absolute bottom-3 left-1/2 w-[min(90%,620px)] -translate-x-1/2 rounded-xl border bg-black/95 p-4 text-sm shadow-xl" style={{borderColor:theme.trim}}>
          <div className="flex items-center gap-2"><span className="text-lg">{dialogue.kind==="book"?"📖":"✦"}</span><b style={{color:theme.trim}}>{dialogue.title}</b></div>
          <p className="mt-2 leading-6 text-white/85">{dialogue.text}</p>
          <button onClick={()=>setDialogue(null)} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-black text-black">Chiudi libro</button>
        </div>}
      </div>
    </main>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/55 px-4 py-3">
      <div className="text-xs text-white/70">WASD / frecce · avvicinati alla libreria per leggere la lore · porta sud libera</div>
      <div className="flex items-center gap-2">
        <button onPointerDown={()=>move("arrowleft",true)} onPointerUp={()=>move("arrowleft",false)} onPointerLeave={()=>move("arrowleft",false)} className="rounded-lg bg-white/15 px-4 py-3 font-black">←</button>
        <div className="flex flex-col gap-1"><button onPointerDown={()=>move("arrowup",true)} onPointerUp={()=>move("arrowup",false)} onPointerLeave={()=>move("arrowup",false)} className="rounded-lg bg-white/15 px-4 py-1 font-black">↑</button><button onPointerDown={()=>move("arrowdown",true)} onPointerUp={()=>move("arrowdown",false)} onPointerLeave={()=>move("arrowdown",false)} className="rounded-lg bg-white/15 px-4 py-1 font-black">↓</button></div>
        <button onPointerDown={()=>move("arrowright",true)} onPointerUp={()=>move("arrowright",false)} onPointerLeave={()=>move("arrowright",false)} className="rounded-lg bg-white/15 px-4 py-3 font-black">→</button>
        <button onClick={interact} className="ml-2 rounded-xl px-5 py-3 text-xs font-black text-black" style={{background:theme.trim}}>{nearExit?"ESCI":nearBooks?"LEGGI LIBRO":nearNpc?"PARLA":"INTERAGISCI"}</button>
      </div>
    </footer>
  </div>;
}
