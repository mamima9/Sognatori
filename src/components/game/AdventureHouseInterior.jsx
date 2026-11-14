import React, { useEffect, useRef, useState } from "react";
import AdventureTravelerSprite from "@/components/game/AdventureTravelerSprite";

const ROOM_W = 800;
const ROOM_H = 520;

const ROOM_LAYOUTS = [
  [{x:105,y:115,w:150,h:70,c:"#8b6848"},{x:555,y:110,w:130,h:85,c:"#557d45"},{x:120,y:330,w:115,h:65,c:"#9b7548"},{x:560,y:330,w:120,h:65,c:"#6d5139"}],
  [{x:100,y:110,w:190,h:85,c:"#557d45"},{x:520,y:110,w:170,h:85,c:"#9b7548"},{x:115,y:330,w:145,h:70,c:"#557d45"},{x:540,y:330,w:145,h:70,c:"#9b7548"}],
  [{x:95,y:115,w:145,h:85,c:"#9b7548"},{x:560,y:115,w:145,h:85,c:"#9b7548"},{x:300,y:105,w:200,h:65,c:"#557d45"},{x:300,y:350,w:200,h:55,c:"#9b7548"}],
  [{x:100,y:120,w:160,h:95,c:"#9b7548"},{x:540,y:120,w:160,h:95,c:"#9b7548"},{x:285,y:315,w:230,h:85,c:"#6d5139"}],
  [{x:90,y:110,w:160,h:75,c:"#557d45"},{x:550,y:110,w:160,h:75,c:"#557d45"},{x:105,y:330,w:130,h:75,c:"#9b7548"},{x:565,y:330,w:130,h:75,c:"#9b7548"}],
  [{x:100,y:110,w:145,h:100,c:"#6d5139"},{x:555,y:110,w:145,h:100,c:"#6d5139"},{x:300,y:105,w:200,h:80,c:"#9b7548"},{x:300,y:345,w:200,h:55,c:"#557d45"}],
];

function drawRoom(ctx, room, player, tick) {
  const n = Math.max(0, (room.number || 1) - 1) % ROOM_LAYOUTS.length;
  const palettes = [
    ["#284d35","#a2b879","#e2c98e"],["#294c35","#b9a16d","#e9d6a5"],
    ["#51402e","#c59a62","#f1d5a0"],["#49372d","#b78a58","#f0d4a0"],
    ["#354a36","#9cae79","#e6d09a"],["#3d3b32","#aa8a61","#ead2a1"]
  ];
  const [wall,floor,trim] = palettes[n];
  ctx.clearRect(0,0,ROOM_W,ROOM_H);
  ctx.fillStyle="#17231b"; ctx.fillRect(0,0,ROOM_W,ROOM_H);
  ctx.fillStyle=wall; ctx.fillRect(28,22,744,476);
  ctx.fillStyle=floor; ctx.fillRect(48,150,704,324);
  ctx.fillStyle=trim; ctx.fillRect(28,132,744,18);
  ctx.fillStyle="rgba(35,24,16,.18)";
  for(let y=165;y<470;y+=48) for(let x=55+(Math.floor(y/48)%2)*24;x<750;x+=48) ctx.fillRect(x,y,42,2);
  // Finestre, travi e dettagli architettonici.
  ctx.fillStyle="#382d26"; ctx.fillRect(105,52,112,70); ctx.fillRect(583,52,112,70);
  ctx.fillStyle=n===1?"#9bc9bd":"#9bc4d2"; ctx.fillRect(113,60,96,54); ctx.fillRect(591,60,96,54);
  ctx.fillStyle="#5b402b"; ctx.fillRect(158,58,5,58); ctx.fillRect(113,85,96,5); ctx.fillRect(636,58,5,58); ctx.fillRect(591,85,96,5);
  // Mobili specifici per la stanza.
  for(const o of ROOM_LAYOUTS[n]){
    ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(o.x+5,o.y+8,o.w,o.h);
    ctx.fillStyle=o.c;ctx.fillRect(o.x,o.y,o.w,o.h);
    ctx.fillStyle="#d8b77d";ctx.fillRect(o.x,o.y,o.w,7);
    ctx.fillStyle="rgba(30,22,16,.35)";ctx.fillRect(o.x+8,o.y+o.h-9,o.w-16,5);
    if(n===1||n===4){ctx.fillStyle="#4f8b50";ctx.fillRect(o.x+o.w/2-9,o.y-18,18,18);ctx.fillStyle="#9cbd68";ctx.fillRect(o.x+o.w/2-3,o.y-27,6,12);}
  }
  // Tappeto centrale e porta d'uscita sul lato sud.
  ctx.fillStyle="#6f493d";ctx.fillRect(320,230,160,105);ctx.fillStyle="#c99b69";ctx.fillRect(328,238,144,89);
  ctx.fillStyle="#4b3024";ctx.fillRect(365,420,70,78);ctx.fillStyle="#b88a50";ctx.fillRect(371,426,58,72);
  ctx.fillStyle="#f3d18b";ctx.fillRect(414,459,5,5);
  // Personaggio in pixel art.
  const x=player.x,y=player.y,step=Math.floor(tick/10)%2;
  ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(x-13,y+17,27,6);
  ctx.fillStyle="#302a35";ctx.fillRect(x-9,y+5,7,13);ctx.fillRect(x+3,y+5,7,13);
  ctx.fillStyle="#4779a5";ctx.fillRect(x-12,y-10,24,18);
  ctx.fillStyle="#e6b88e";ctx.fillRect(x-10,y-27,20,18);
  ctx.fillStyle="#49352d";ctx.fillRect(x-11,y-30,22,8);ctx.fillRect(x-13,y-24,5,10);
  ctx.fillStyle="#25202a";ctx.fillRect(x-5,y-20,3,3);ctx.fillRect(x+4,y-20,3,3);
  ctx.fillStyle="#e8c69b";ctx.fillRect(x-15+(step?2:0),y-5,5,13);ctx.fillRect(x+10-(step?2:0),y-5,5,13);
}

export default function AdventureHouseInterior({ house, onExit }) {
  const canvasRef=useRef(null);
  const position=useRef({x:400,y:350});
  const keys=useRef({});
  const [player,setPlayer]=useState({x:400,y:350});
  const [dialogue,setDialogue]=useState("");
  const [nearNpc,setNearNpc]=useState(false);
  const [nearExit,setNearExit]=useState(false);
  const [tick,setTick]=useState(0);
  const title=house.city.id==="natura"
    ? ["Rifugio tra le fronde","Bottega dell'erborista","Casa del raccoglitore","Locanda del sottobosco","Dimora del custode","Officina del legno vivo"][(house.number||1)-1]
    : ["Casa del viandante","Bottega delle mappe","Casa degli abitanti","Locanda","Casa del custode","Laboratorio"][(house.number||1)-1];
  const faction=house.city.faction;
  useEffect(()=>{
    const down=e=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d","e"].includes(k)){e.preventDefault();keys.current[k]=true;}};
    const up=e=>{keys.current[e.key.toLowerCase()]=false;};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
  },[]);
  useEffect(()=>{
    let raf,last=0,frame=0;
    const canvas=canvasRef.current,ctx=canvas?.getContext("2d");
    if(!ctx)return;
    const loop=now=>{
      const dt=Math.min((now-last)/16.67,2);last=now;frame++;
      let dx=0,dy=0;const k=keys.current;
      if(k.w||k.arrowup)dy--;if(k.s||k.arrowdown)dy++;if(k.a||k.arrowleft)dx--;if(k.d||k.arrowright)dx++;
      if(dx||dy){const len=Math.hypot(dx,dy);const next={x:Math.max(72,Math.min(728,position.current.x+dx/len*3.1*dt)),y:Math.max(190,Math.min(410,position.current.y+dy/len*3.1*dt))};position.current=next;setPlayer(next);}
      const npcNear=Math.hypot(position.current.x-400,position.current.y-205)<92;
      const exitNear=position.current.y>438&&Math.abs(position.current.x-400)<72;
      setNearNpc(npcNear);setNearExit(exitNear);
      if(frame%8===0)setTick(t=>t+1);
      drawRoom(ctx,house,position.current,frame);
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);
  },[house]);
  const interact=()=>{
    if(nearExit){onExit();return;}
    if(nearNpc)setDialogue(house.dialogue||"Benvenuto! Ogni casa custodisce una storia di questa città.");
  };
  const move=(key,active)=>{keys.current[key]=active;};
  return <div className="fixed inset-0 z-[90] flex flex-col bg-[#101810] text-white">
    <div className="flex items-center justify-between border-b border-white/15 bg-black/70 px-4 py-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.3em] text-emerald-200">{house.city.city} · {faction}</div><div className="text-lg font-black">{title}</div></div>
      <button onClick={onExit} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">Esci dalla casa</button>
    </div>
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2">
      <div className="relative w-full max-w-[1100px]">
        <canvas ref={canvasRef} width={ROOM_W} height={ROOM_H} className="block aspect-[20/13] w-full rounded-xl border-4 border-[#8d704b] shadow-2xl" style={{imageRendering:"pixelated"}} />
        <div className="pointer-events-none absolute left-1/2 top-[36%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <AdventureTravelerSprite traveler={house.resident} faction={faction} size={42} direction="down" walking={false}/>
          <span className="rounded bg-black/75 px-2 py-1 text-[10px] font-black">{house.resident}</span>
        </div>
        {dialogue&&<div className="absolute bottom-3 left-1/2 w-[min(90%,560px)] -translate-x-1/2 rounded-xl border border-emerald-200/40 bg-black/90 p-4 text-sm shadow-xl"><b className="text-emerald-200">{house.resident}</b><p className="mt-1">{dialogue}</p><button onClick={()=>setDialogue("")} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-black text-black">Continua</button></div>}
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/60 px-4 py-3">
      <div className="text-xs text-white/65">WASD / frecce per muoverti · E per parlare o uscire</div>
      <div className="flex items-center gap-2">
        <button onPointerDown={()=>move("arrowleft",true)} onPointerUp={()=>move("arrowleft",false)} onPointerLeave={()=>move("arrowleft",false)} className="rounded-lg bg-white/15 px-4 py-3 font-black">←</button>
        <div className="flex flex-col gap-1"><button onPointerDown={()=>move("arrowup",true)} onPointerUp={()=>move("arrowup",false)} onPointerLeave={()=>move("arrowup",false)} className="rounded-lg bg-white/15 px-4 py-1 font-black">↑</button><button onPointerDown={()=>move("arrowdown",true)} onPointerUp={()=>move("arrowdown",false)} onPointerLeave={()=>move("arrowdown",false)} className="rounded-lg bg-white/15 px-4 py-1 font-black">↓</button></div>
        <button onPointerDown={()=>move("arrowright",true)} onPointerUp={()=>move("arrowright",false)} onPointerLeave={()=>move("arrowright",false)} className="rounded-lg bg-white/15 px-4 py-3 font-black">→</button>
        <button onClick={interact} className="ml-2 rounded-xl bg-emerald-300 px-5 py-3 text-xs font-black text-[#102016]">{nearExit?"ESCI":nearNpc?"PARLA":"INTERAGISCI"}</button>
      </div>
    </div>
  </div>;
}
