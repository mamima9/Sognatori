import React, { useMemo, useState } from "react";
import { ROSTER } from "@/lib/sognatoriData";

/**
 * Prototype for City 14 cooperative adventure.
 * Shared round model: 3 actions per player; party size 2–5.
 * This is a local prototype, not online room synchronization.
 */
const STARTERS = ROSTER.slice(0, 29);
const STORY = [
  { name: "Piazza delle Lanterne", text: "Le lanterne della città si stanno spegnendo. Gli abitanti raccontano di una presenza sotto la città.", type: "town" },
  { name: "Bosco dei Sussurri", text: "Piccoli mostri custodiscono i sentieri. Tra le radici si intravedono tracce di un Sognatore disperso.", type: "encounter" },
  { name: "Archivio Sommerso", text: "Rune, stanze mutevoli e un enigma: le porte reagiscono alle azioni coordinate della squadra.", type: "dungeon" },
  { name: "Sala del Sigillo", text: "Il sigillo si rompe. La creatura che alimentava il buio emerge per lo scontro finale.", type: "boss" },
];
const ACTIONS = ["Esplora", "Parla", "Attacca", "Proteggi", "Switch", "Allenati", "Scambia"];
const css = { background:"#17241f", panel:"#26372e", gold:"#d6b77a", text:"#f4ead8", muted:"#b8c4b5" };

export default function CooperativeCity14() {
  const [partySize,setPartySize] = useState(2);
  const [starters,setStarters] = useState([]);
  const [players,setPlayers] = useState([]);
  const [step,setStep] = useState(0);
  const [round,setRound] = useState(1);
  const [actions,setActions] = useState({});
  const [log,setLog] = useState(["Benvenuti nella città cooperativa. Scegliete il Sognatore iniziale per ogni partecipante."]);
  const [recruited,setRecruited] = useState([]);
  const [bossHp,setBossHp] = useState(100);
  const [bossStarted,setBossStarted] = useState(false);

  const available = useMemo(()=>STARTERS.filter(s=>!starters.includes(s.id)),[starters]);
  const addStarter = (id) => {
    if(starters.length>=partySize || starters.includes(id)) return;
    const s=STARTERS.find(x=>x.id===id);
    setStarters(v=>[...v,id]);
    setPlayers(v=>[...v,{starter:s,active:s,bench:null}]);
  };
  const ready = starters.length===partySize;
  const spent = (p)=>actions[p]||0;
  const perform = (p,action) => {
    if(spent(p)>=3) return;
    const player=players[p];
    if(action==="Switch" && !player.bench) { setLog(v=>["Serve un Sognatore in panchina per effettuare lo switch.",...v]); return; }
    if(action==="Scambia" && p===0 && !players.some(x=>x.bench)) { setLog(v=>["Prima reclutate un Sognatore di panchina. Lo scambio non può coinvolgere gli iniziali.",...v]); return; }
    setActions(v=>({...v,[p]:spent(p)+1}));
    if(action==="Attacca" && bossStarted) setBossHp(h=>Math.max(0,h-8));
    setLog(v=>[`P${p+1} — ${action} (${player.active.nome})`,...v].slice(0,12));
  };
  const recruit = () => {
    const candidate=ROSTER.find(s=>!starters.includes(s.id)&&!players.some(p=>p.bench?.id===s.id)&&!recruited.includes(s.id));
    if(!candidate) { setLog(v=>["Non ci sono altri Sognatori disponibili nel prototipo.",...v]);return; }
    const owner=players.findIndex(p=>!p.bench);
    if(owner<0){setLog(v=>["Ogni giocatore ha già una panchina.",...v]);return;}
    setPlayers(v=>v.map((p,i)=>i===owner?{...p,bench:candidate}:p));
    setRecruited(v=>[...v,candidate.id]);
    setLog(v=>[`${candidate.nome} si unisce alla panchina di P${owner+1}!`,...v]);
  };
  const switchPlayer = (p) => {
    setPlayers(v=>v.map((x,i)=>i===p&&x.bench?{...x,active:x.bench,bench:x.active}:x));
    perform(p,"Switch");
  };
  const advance = () => {
    setStep(s=>Math.min(STORY.length-1,s+1));
    setActions({});
    setRound(r=>r+1);
    setLog(v=>["La squadra avanza alla fase successiva.",...v]);
    if(step>=2)setBossStarted(true);
  };
  const reset = () => {setStarters([]);setPlayers([]);setStep(0);setRound(1);setActions({});setRecruited([]);setBossHp(100);setBossStarted(false);setLog(["Nuova spedizione iniziata."]);};

  return <main style={{minHeight:"100vh",background:css.background,color:css.text,padding:"24px",fontFamily:"inherit"}}>
    <div style={{maxWidth:1150,margin:"0 auto"}}>
      <header style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:16,alignItems:"center"}}>
        <div><div style={{letterSpacing:4,fontSize:12,color:css.gold}}>SOGNATORI • COOPERATIVA</div><h1 style={{fontSize:34,fontWeight:900,margin:"6px 0"}}>Città XIV — Lumequieto</h1><p style={{color:css.muted}}>Una storia condivisa per 2–5 giocatori · 3 azioni a testa per round</p></div>
        <button onClick={reset} style={btn(css.gold)}>Nuova spedizione</button>
      </header>
      <section style={panel}><h2 style={h2}>1 · Squadra</h2><label>Numero giocatori <select value={partySize} disabled={starters.length>0} onChange={e=>setPartySize(Number(e.target.value))} style={selectStyle}>{[2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
      {!ready&&<p style={{color:css.muted}}>Scegliete {partySize} Sognatori iniziali dal roster dei primi 29 ({starters.length}/{partySize}).</p>}
      <div style={grid}>{available.map(s=><button key={s.id} onClick={()=>addStarter(s.id)} style={cardButton}><img src={s.img} alt="" style={{width:64,height:64,objectFit:"contain"}}/><strong>{s.nome}</strong><small>{s.tipo||s.fazione}</small></button>)}</div>
      {players.length>0&&<div style={grid}>{players.map((p,i)=><div key={p.starter.id} style={miniPanel}><strong>Giocatore {i+1}</strong><div style={{display:"flex",gap:10,alignItems:"center"}}><img src={p.active.img} alt="" style={{width:58,height:58,objectFit:"contain"}}/><div><b>{p.active.nome}</b><div style={{color:css.muted,fontSize:12}}>Titolare attivo</div></div></div><div style={{marginTop:8,color:css.muted}}>Panchina: {p.bench?.nome||"Da reclutare"}</div></div>)}</div>}
      </section>
      {ready&&<section style={panel}><h2 style={h2}>2 · Round {round} — {STORY[step].name}</h2><p>{STORY[step].text}</p><div style={{padding:12,border:"1px solid #536859",borderRadius:12,margin:"12px 0"}}><strong>Azioni rimaste</strong><div style={grid}>{players.map((p,i)=><div key={i} style={miniPanel}><strong>Giocatore {i+1} · {p.active.nome}</strong><p>{3-spent(i)} / 3 disponibili</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ACTIONS.map(a=><button key={a} disabled={spent(i)>=3} onClick={()=>a==="Switch"?switchPlayer(i):perform(i,a)} style={btn(spent(i)>=3?"#526056":css.gold)}>{a}</button>)}</div></div>)}</div></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}><button onClick={recruit} style={btn("#91c99c")}>Recluta Sognatore di panchina</button><button onClick={advance} disabled={players.some((_,i)=>spent(i)<3)} style={btn(css.gold)}>{step===STORY.length-1?"Completa la storia":"Avanza fase"}</button></div>
        {bossStarted&&<div style={{marginTop:16}}><strong>Boss finale · Sigillo Vivente</strong><div style={{height:14,background:"#492f31",borderRadius:8,overflow:"hidden",marginTop:6}}><div style={{height:"100%",width:bossHp+"%",background:"#e87962",transition:"width .2s"}}/></div><small>HP {bossHp}/100 · Attacco prototipo: 8 danni</small>{bossHp===0&&<p style={{color:"#a8e0ac",fontWeight:800}}>Boss sconfitto! La squadra ha completato la storia.</p>}</div>}
      </section>}
      <section style={panel}><h2 style={h2}>Registro dell'avventura</h2><div style={{maxHeight:220,overflow:"auto"}}>{log.map((entry,i)=><div key={i} style={{padding:"6px 0",borderBottom:"1px solid #ffffff14"}}>{entry}</div>)}</div></section>
      <p style={{fontSize:12,color:css.muted}}>Prototipo locale UI: le azioni, la squadra e il progresso sono gestiti nel browser. Multiplayer online sincronizzato, dungeon grafico e persistenza server saranno fasi successive.</p>
    </div>
  </main>;
}
const panel={background:"#26372e",border:"1px solid #536859",borderRadius:18,padding:18,marginTop:18};
const miniPanel={background:"#17241f",border:"1px solid #465b4c",borderRadius:12,padding:12};
const h2={fontSize:20,fontWeight:800,color:"#d6b77a",marginTop:0};
const grid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginTop:12};
const cardButton={background:"#17241f",color:"#f4ead8",border:"1px solid #536859",borderRadius:12,padding:10,display:"flex",alignItems:"center",gap:8,flexDirection:"column",cursor:"pointer"};
const selectStyle={marginLeft:10,background:"#17241f",color:"#f4ead8",padding:8,borderRadius:8};
function btn(bg){return {background:bg,color:"#17241f",border:0,borderRadius:10,padding:"9px 12px",fontWeight:800,cursor:"pointer"}}
