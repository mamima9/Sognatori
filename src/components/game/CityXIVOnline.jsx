import React,{useCallback,useEffect,useMemo,useRef,useState} from "react";
import {supabase} from "@/lib/supabase";
import {ROSTER} from "@/lib/sognatoriData";
import Lumequieto3D from "@/components/Lumequieto3D";

const STARTERS=ROSTER.slice(0,29);
const BG="#17241f",PANEL="#26372e",GOLD="#d6b77a",TEXT="#f4ead8",MUTED="#b8c4b5";
const box={background:PANEL,border:"1px solid #536859",borderRadius:16,padding:14};
const button=(color=GOLD)=>({background:color,color:BG,border:0,borderRadius:10,padding:"10px 13px",fontWeight:800,cursor:"pointer"});
const nameOf=(user)=>user?.user_metadata?.username||user?.user_metadata?.full_name||user?.email?.split("@")[0]||"Player";
export default function CityXIVOnline({onBack=()=>{}}){
 const [user,setUser]=useState(null),[screen,setScreen]=useState("menu"),[roomId,setRoomId]=useState(null),[room,setRoom]=useState(null),[players,setPlayers]=useState([]),[gameState,setGameState]=useState(null);
 const [selected,setSelected]=useState(STARTERS[0]?.id||""),[maxPlayers,setMaxPlayers]=useState(5),[code,setCode]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[position,setPosition]=useState({x:0,z:3}),[restoreKey,setRestoreKey]=useState(0),[partyPanelOpen,setPartyPanelOpen]=useState(false),[presenceNow,setPresenceNow]=useState(Date.now());const [phaseRetry,setPhaseRetry]=useState(0),[recruitPanelOpen,setRecruitPanelOpen]=useState(false),[recruitCandidate,setRecruitCandidate]=useState("");
 const lastPositionRef=useRef(0),roomIdRef=useRef(null),roomRef=useRef(null),hydratedRoomRef=useRef(null),phaseResolveRef=useRef(null);const phaseAttemptRef=useRef({}),phaseRetryTimerRef=useRef(null);
 useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user||null))},[]);
 useEffect(()=>{const t=setInterval(()=>setPresenceNow(Date.now()),15000);return()=>clearInterval(t)},[]);
 const refreshRoom=useCallback(async(id)=>{
   if(!id)return;
   const [r,p]=await Promise.all([supabase.from("cityxiv_rooms").select("*").eq("id",id).single(),supabase.from("cityxiv_room_players").select("*").eq("room_id",id).order("joined_at")]);
   if(r.error||p.error){setError(r.error?.message||p.error?.message||"Aggiornamento stanza non riuscito.");return}
   setRoom(r.data);roomRef.current=r.data;setPlayers(p.data||[]);setGameState(r.data.game_state);
   if(user?.id&&hydratedRoomRef.current!==id){
     const saved=p.data?.find(player=>player.user_id===user.id)?.position;
     if(saved&&Number.isFinite(Number(saved.x))&&Number.isFinite(Number(saved.z)))setPosition({x:Number(saved.x),z:Number(saved.z)});
     hydratedRoomRef.current=id;setRestoreKey(k=>k+1);
   }
   if(r.data.status==="waiting")setScreen("lobby");else setScreen("game");
 },[user?.id]);
 useEffect(()=>{roomIdRef.current=roomId},[roomId]);
 useEffect(()=>{
   if(!roomId)return;
   refreshRoom(roomId);
   const channel=supabase.channel("cityxiv-online-"+roomId)
     .on("postgres_changes",{event:"*",schema:"public",table:"cityxiv_rooms",filter:"id=eq."+roomId},()=>refreshRoom(roomId))
     .on("postgres_changes",{event:"*",schema:"public",table:"cityxiv_room_players",filter:"room_id=eq."+roomId},()=>refreshRoom(roomId))
     .subscribe();
   const heartbeat=setInterval(()=>supabase.rpc("cityxiv_ping",{p_room_id:roomId}),20000);
   return()=>{clearInterval(heartbeat);supabase.removeChannel(channel)};
 },[roomId,refreshRoom]);
 useEffect(()=>{
   if(!roomId||!user||room?.status!=="playing")return;
   if(gameState?.phase!=="enemy"){
     phaseResolveRef.current=null;phaseAttemptRef.current={};
     if(phaseRetryTimerRef.current){clearTimeout(phaseRetryTimerRef.current);phaseRetryTimerRef.current=null;}
     return;
   }
   if(room.host_id!==user.id){phaseResolveRef.current=null;return;}
   const token=roomId+":"+(gameState?.round||0)+":"+user.id;
   if(phaseResolveRef.current===token)return;
   const attempt=phaseAttemptRef.current[token]||0;
   if(attempt>=5)return;
   phaseResolveRef.current=token;
   supabase.rpc("cityxiv_enemy_turn",{p_room_id:roomId}).then(({error:e})=>{
     if(e){
       phaseResolveRef.current=null;
       const next=attempt+1;phaseAttemptRef.current[token]=next;
       setError(e.message||"Turno avversari non riuscito.");
       if(next<5)phaseRetryTimerRef.current=setTimeout(()=>{phaseRetryTimerRef.current=null;setPhaseRetry(v=>v+1);},Math.min(1500*next,8000));
       return;
     }
     phaseAttemptRef.current[token]=0;setError("");refreshRoom(roomId);
   });
 },[roomId,user?.id,room?.status,room?.host_id,gameState?.phase,gameState?.round,phaseRetry,refreshRoom]);
 useEffect(()=>()=>{if(phaseRetryTimerRef.current)clearTimeout(phaseRetryTimerRef.current);},[]);
 useEffect(()=>{
   if(!user||roomId)return;
   supabase.rpc("cityxiv_resume_room").then(({data,error:e})=>{if(!e&&data){setRoomId(data);setScreen("lobby")}});
 },[user,roomId]);
 const actRpc=async(name,args)=>{
   setError("");setBusy(true);
   try{const {data,error:e}=await supabase.rpc(name,args);if(e)throw e;if(roomId)await refreshRoom(roomId);return data}
   catch(e){setError(e?.message||"Operazione non riuscita.");return null}
   finally{setBusy(false)}
 };
 const create=async()=>{
   if(!user)return setError("Accedi prima di creare una stanza.");
   const id=await actRpc("cityxiv_create_room",{p_player_name:nameOf(user),p_character_id:selected,p_max_players:maxPlayers});
   if(id){setRoomId(id);setCode("");setScreen("lobby")}
 };
 const join=async()=>{
   if(!user)return setError("Accedi prima di entrare in una stanza.");
   const id=await actRpc("cityxiv_join_room",{p_room_code:code,p_player_name:nameOf(user),p_character_id:selected});
   if(id){setRoomId(id);setScreen("lobby")}
 };
 const leave=async()=>{
   const id=roomIdRef.current;
   if(id){await supabase.rpc("cityxiv_leave_room",{p_room_id:id});supabase.removeChannel("cityxiv-online-"+id)}
   setRoomId(null);setRoom(null);setPlayers([]);setGameState(null);setScreen("menu");hydratedRoomRef.current=null;onBack();
 };
 const ready=async()=>{const me=players.find(p=>p.user_id===user?.id);await actRpc("cityxiv_set_ready",{p_room_id:roomId,p_ready:!me?.ready})};
 const start=async()=>await actRpc("cityxiv_start_room",{p_room_id:roomId});
 const advance=async()=>await actRpc("cityxiv_advance",{p_room_id:roomId});
 const prepAction=async(a)=>await actRpc("cityxiv_boss_prep_action",{p_room_id:roomId,p_action:a});
 const prepReadyToggle=async()=>await actRpc("cityxiv_boss_prep_ready",{p_room_id:roomId,p_ready:!prepReady});
 const startBoss=async()=>await actRpc("cityxiv_boss_start",{p_room_id:roomId});
 const sendAction=async(a,characterId=null)=>await actRpc("cityxiv_action",{p_room_id:roomId,p_action:a,p_character_id:characterId});
 const offerRecruit=async(candidate)=>{const result=await actRpc("cityxiv_recruit_offer",{p_room_id:roomId,p_character_id:candidate});if(result){setRecruitPanelOpen(false);setRecruitCandidate("");}return result;};
 const voteRecruit=async(accept)=>await actRpc("cityxiv_recruit_vote",{p_room_id:roomId,p_accept:accept});
 const move=useCallback(({x,z})=>{
   setPosition({x,z});if(!roomIdRef.current||Date.now()-lastPositionRef.current<400)return;
   lastPositionRef.current=Date.now();supabase.rpc("cityxiv_update_position",{p_room_id:roomIdRef.current,p_x:x,p_z:z});
 },[]);
 const current=gameState?.players?.[user?.id];
 const active=useMemo(()=>STARTERS.find(s=>s.id===current?.active)||STARTERS.find(s=>s.id===selected)||STARTERS[0],[current?.active,selected]);
 const onlinePlayers=useMemo(()=>players.filter(p=>Number.isFinite(Date.parse(p.last_seen))&&Date.parse(p.last_seen)>presenceNow-90000),[players,presenceNow]);
 const remote=useMemo(()=>onlinePlayers.filter(p=>p.user_id!==user?.id).map(p=>{const activeId=gameState?.players?.[p.user_id]?.active||p.character_id;return {id:p.user_id,name:p.player_name,character_id:activeId,img:STARTERS.find(s=>s.id===activeId)?.img,position:p.position||{x:0,z:3}}}),[onlinePlayers,user?.id,gameState]);
 const stage=gameState?.stage||0;
 const stageNames=["Piazza delle Lanterne","Bosco dei Sussurri","Archivio Sommerso","Sala del Sigillo"];
 const me=players.find(p=>p.user_id===user?.id);
 const talkRewardDone=!!gameState?.flags?.["talk_reward_"+user?.id+"_stage_"+stage],minorFightDone=!!gameState?.flags?.["minor_fight_"+user?.id+"_stage_"+stage];
 const hp=current?.hp??20,used=current?.actions_used??0,phase=gameState?.phase||"players",allReady=onlinePlayers.length>0&&onlinePlayers.every(p=>(gameState?.players?.[p.user_id]?.actions_used||0)>=3),allActionsReset=onlinePlayers.length>0&&onlinePlayers.every(p=>(gameState?.players?.[p.user_id]?.actions_used||0)===0),prepReady=!!gameState?.prep_ready?.[user?.id],prepAllReady=onlinePlayers.length>0&&onlinePlayers.every(p=>!!gameState?.prep_ready?.[p.user_id]),canAdvanceZone=stage===0?((gameState.round||1)>=2&&(gameState.clues||0)>=2&&!!gameState.flags?.explored_stage_0):stage===3?(!!gameState.enemy&&gameState.enemy.hp<=0):(!!gameState.flags?.["explored_stage_"+stage]&&!!gameState.enemy&&gameState.enemy.hp<=0);
 const ownedRecruitIds=useMemo(()=>Object.values(gameState?.players||{}).flatMap(p=>[p?.active,p?.bench].filter(Boolean)),[gameState?.players]);
 const recruitOptions=useMemo(()=>STARTERS.filter(s=>!ownedRecruitIds.includes(s.id)),[ownedRecruitIds]);
 const recruitOffer=gameState?.recruit_offer?.candidate&&gameState.recruit_offer.stage===stage?gameState.recruit_offer:null;
 const recruitProposerOnline=!!recruitOffer&&onlinePlayers.some(p=>p.user_id===recruitOffer.proposer);
 const recruitOfferVisible=!!recruitOffer&&recruitProposerOnline&&phase==="players"&&(!gameState.enemy||gameState.enemy.hp<=0);
 const recruitAttemptDone=!!gameState?.flags?.["recruit_offer_attempt_"+user?.id+"_stage_"+stage];
 const canOfferRecruit=stage<3&&phase==="players"&&(!gameState.enemy||gameState.enemy.hp<=0)&&!current?.bench&&!recruitAttemptDone&&(!recruitOffer||!recruitProposerOnline)&&recruitOptions.length>0;
 useEffect(()=>{if(recruitPanelOpen&&!canOfferRecruit)setRecruitPanelOpen(false)},[recruitPanelOpen,canOfferRecruit]);
 const recruitVotesYes=onlinePlayers.filter(p=>recruitOffer?.votes?.[p.user_id]===true).length;
  const enemyRetryToken=roomId+":"+(gameState?.round||0)+":"+user?.id,enemyRetryExhausted=phase==="enemy"&&room?.host_id===user?.id&&(phaseAttemptRef.current[enemyRetryToken]||0)>=5;
 const showGame=room?.status==="playing"||room?.status==="finished";
 if(!user)return <main style={{position:"fixed",inset:0,overflow:"auto",background:BG,color:TEXT,padding:20,display:"grid",placeItems:"center"}}><section style={{...box,maxWidth:480,textAlign:"center"}}><h1>City XIV · Multiplayer online</h1><p>Accedi per creare o unirti a una stanza cooperativa da 2 a 5 giocatori.</p><a href="/login?returnTo=%2Favventura-coop" style={button()}>Accedi</a><button style={{...button("#9eb5e4"),marginLeft:8}} onClick={onBack}>Indietro</button></section></main>;
 if(showGame&&gameState&&!gameState.won&&!gameState.lost&&room?.status!=="finished"){
   return <main style={{position:"fixed",inset:0,overflow:"hidden",background:BG,color:TEXT}}>
    <div style={{position:"absolute",inset:0}}><Lumequieto3D stage={stage} restorePosition={position} restoreKey={restoreKey} avatarCharacter={active} remotePlayers={remote} controlsHidden={partyPanelOpen||recruitPanelOpen||recruitOfferVisible||phase==="prep"||phase==="enemy"} onPositionChange={move}/></div>
    <header style={{position:"absolute",top:8,left:8,right:8,display:"flex",gap:8,alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",pointerEvents:"none"}}>
      <div style={{...box,pointerEvents:"auto",padding:"9px 12px"}}><b>🌐 CITY XIV · {stageNames[stage]||"Lumequieto"}</b><div style={{fontSize:12}}>Stanza {room?.room_code} · Round {gameState.round} · {onlinePlayers.length} online/{players.length} · {phase==="enemy"?"Avversari":phase==="prep"?"Preparazione":"Party"} · {allReady?"Tutti pronti":"Scelte in corso"}</div></div>
      <div style={{...box,pointerEvents:"auto",padding:8,display:"flex",gap:6,alignItems:"center"}}><img src={active?.img} alt="" width="42" height="42" style={{objectFit:"contain"}}/><span><b>{me?.player_name}</b><div>HP {hp}/20 · {3-used} azioni</div><small>XP {current?.xp||0} · Monete {gameState.coins||0}</small></span></div>
    </header>
    <div style={{position:"absolute",top:92,left:8,display:"flex",gap:6,flexWrap:"wrap",maxWidth:"min(70vw,680px)"}}>{remote.map(p=><div key={p.id} style={{background:"#17241fe8",border:"1px solid #d6b77a",borderRadius:12,padding:7,display:"flex",gap:6,alignItems:"center"}}><img src={p.img} alt="" width="38" height="38" style={{objectFit:"contain"}}/><span style={{fontSize:12}}><b>{p.name}</b><div>{p.character_id}</div><div>{Math.round(p.position.x)}, {Math.round(p.position.z)}</div></span></div>)}</div>
    <div data-camera-ignore style={{position:"absolute",bottom:8,left:8,right:8,display:phase==="prep"?"none":"grid",gridTemplateColumns:"repeat(auto-fit,minmax(105px,1fr))",gap:7,zIndex:15}}>{phase==="enemy"?<div style={{gridColumn:"1 / -1",background:"#3b2e24",border:"1px solid #d6b77a",borderRadius:12,padding:10,textAlign:"center"}}>Avversari in azione · il turno si risolve automaticamente{enemyRetryExhausted&&<button style={{...button("#fc9854"),marginLeft:8}} onClick={()=>{phaseAttemptRef.current[enemyRetryToken]=0;phaseResolveRef.current=null;setPhaseRetry(v=>v+1);setError("");}}>Riprova turno</button>}</div>:gameState.enemy&&gameState.enemy.hp>0?<><button style={button(GOLD)} disabled={busy||used>=3} onClick={()=>sendAction("attack")}>⚔️ Attacca</button><button style={button("#c9b6e8")} disabled={busy||used>=3} onClick={()=>sendAction("attack_area")}>✨ Area</button><button style={button("#91c99c")} disabled={busy||used>=3} onClick={()=>sendAction("protect")}>🛡️ Proteggi</button><button style={button("#91c99c")} disabled={busy||used>=3||hp>=20} onClick={()=>sendAction("recover")}>💚 Recupera</button><button style={button("#9eb5e4")} disabled={busy||used>=3||!current?.bench} onClick={()=>sendAction("switch")}>🔄 Switch</button></>:<><button style={button("#fc9854")} disabled={busy||used>=3} onClick={()=>sendAction("explore")}>🧭 Esplora</button><button style={button("#91c99c")} disabled={busy||used>=3||minorFightDone} onClick={()=>sendAction("fight_minor")}>{minorFightDone?"⚔️ Lotta minore · completata":"⚔️ Lotta minore"}</button><button style={button("#9eb5e4")} disabled={busy||used>=3||talkRewardDone} onClick={()=>sendAction("talk")}>{talkRewardDone?"💬 Parla · già ottenuto":"💬 Parla"}</button></>}{canOfferRecruit&&<button style={button("#c9b6e8")} onClick={()=>{setRecruitCandidate(recruitOptions[0]?.id||"");setRecruitPanelOpen(true);}}>🤝 Recluta</button>}<button style={button("#b5c7c2")} onClick={()=>setPartyPanelOpen(v=>!v)}>👥 Party Team</button>{room?.host_id===user.id&&canAdvanceZone&&<button style={button(GOLD)} disabled={busy||phase!=="players"||!allActionsReset} onClick={advance}>{stage===3?"Concludi":"Avanza zona"}</button>}<button style={button("#b5c7c2")} onClick={leave}>Esci</button></div>
    {recruitPanelOpen&&!recruitOffer&&<div data-camera-ignore style={{position:"absolute",inset:0,zIndex:40,background:"#07110de8",display:"grid",placeItems:"center",padding:12}}><section style={{width:"min(96vw,520px)",maxHeight:"85dvh",overflow:"auto",background:BG,border:"2px solid #d6b77a",borderRadius:18,padding:14}}><h2>🤝 Proponi reclutamento</h2><p>La squadra decide all’unanimità. Il reclutamento è disponibile una volta per zona, per giocatore, e non consuma una delle tre azioni.</p><label>Sognatore<select value={recruitCandidate} onChange={e=>setRecruitCandidate(e.target.value)} style={{display:"block",width:"100%",padding:10,borderRadius:10,marginTop:8}}>{recruitOptions.map(s=><option key={s.id} value={s.id}>{s.nome} · {s.tipo}</option>)}</select></label>{STARTERS.find(s=>s.id===recruitCandidate)&&<div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}><img src={STARTERS.find(s=>s.id===recruitCandidate)?.img} alt="" width="80" height="80" style={{objectFit:"contain"}}/><b>{STARTERS.find(s=>s.id===recruitCandidate)?.nome}</b></div>}<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><button style={button("#c9b6e8")} disabled={busy||!recruitCandidate} onClick={()=>offerRecruit(recruitCandidate)}>Proponi alla squadra</button><button style={button("#9eb5e4")} onClick={()=>setRecruitPanelOpen(false)}>Annulla</button></div></section></div>}
    {recruitOfferVisible&&<div data-camera-ignore style={{position:"absolute",inset:0,zIndex:40,background:"#07110de8",display:"grid",placeItems:"center",padding:12}}><section style={{width:"min(96vw,520px)",maxHeight:"85dvh",overflow:"auto",background:BG,border:"2px solid #d6b77a",borderRadius:18,padding:14}}><h2>🤝 Voto reclutamento</h2><div style={{display:"flex",alignItems:"center",gap:10}}><img src={STARTERS.find(s=>s.id===recruitOffer.candidate)?.img} alt="" width="84" height="84" style={{objectFit:"contain"}}/><div><b>{STARTERS.find(s=>s.id===recruitOffer.candidate)?.nome||recruitOffer.candidate}</b><div>Proposto da {players.find(p=>p.user_id===recruitOffer.proposer)?.player_name||"un membro"}</div></div></div><p>Serve il sì di tutti i giocatori attivi. Un rifiuto annulla la proposta.</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{onlinePlayers.map(p=><span key={p.user_id} style={{border:"1px solid #536859",borderRadius:8,padding:"5px 8px",fontSize:12}}>{p.player_name} · {recruitOffer.votes?.[p.user_id]===true?"✔️ Sì":"⌛ Attesa"}</span>)}</div><p>{recruitVotesYes}/{onlinePlayers.length} voti favorevoli</p><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}><button style={button("#91c99c")} disabled={busy||recruitOffer.votes?.[user?.id]===true} onClick={()=>voteRecruit(true)}>Accetta</button><button style={button("#fc9854")} disabled={busy} onClick={()=>voteRecruit(false)}>Rifiuta</button></div></section></div>}
    {phase==="prep"&&<div data-camera-ignore style={{position:"absolute",bottom:8,left:8,right:8,zIndex:25,background:"#17241ff5",border:"2px solid #d6b77a",borderRadius:18,padding:12,maxHeight:"45dvh",overflow:"auto"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}><div><b>🛡️ Preparazione al Sigillo Vivente</b><div style={{fontSize:12}}>Recupera, cambia Sognatore, equipaggia e chiedi aiuto al Custode. Le modifiche annullano la conferma di tutti.</div></div><button style={button("#b5c7c2")} onClick={leave}>Esci</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:7,marginTop:10}}><button style={button("#91c99c")} disabled={busy} onClick={()=>prepAction("recover")}>💚 Recupero totale</button><button style={button("#9eb5e4")} disabled={busy||!current?.bench} onClick={()=>prepAction("switch")}>🔄 Switch</button><button style={button(GOLD)} disabled={busy} onClick={()=>prepAction("equip_weapon")}>🗡️ Equip Spada</button><button style={button(GOLD)} disabled={busy} onClick={()=>prepAction("equip_armor")}>🛡️ Equip Armatura</button><button style={button(GOLD)} disabled={busy} onClick={()=>prepAction("equip_amulet")}>✨ Equip Amuleto</button><button style={button("#c9b6e8")} disabled={busy||!!gameState.flags?.boss_aid_stage_3} onClick={()=>prepAction("npc_aid")}>🧙 Aiuto Custode</button><button style={button("#91c99c")} disabled={busy} onClick={prepReadyToggle}>{prepReady?"Annulla conferma":"Sono pronto"}</button><button style={button("#fc9854")} disabled={busy||room?.host_id!==user?.id||!prepAllReady} onClick={startBoss}>Avvia boss</button><button style={button("#b5c7c2")} onClick={()=>setPartyPanelOpen(v=>!v)}>👥 Party Team</button></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8,fontSize:12}}>{players.map(p=><span key={p.user_id} style={{border:"1px solid #536859",borderRadius:8,padding:"5px 8px"}}>{p.player_name} · {onlinePlayers.some(x=>x.user_id===p.user_id)?(gameState.prep_ready?.[p.user_id]?"✔️ Pronto":"In preparazione"):"Offline · sospeso"}</span>)}</div><small>{prepAllReady?"Tutti pronti: l'host può attivare il boss.":"Aspettate che tutti confermino."}</small></div>}{partyPanelOpen&&<div data-camera-ignore style={{position:"absolute",inset:0,zIndex:30,background:"#07110de8",display:"grid",placeItems:"center",padding:12}}><section style={{width:"min(96vw,600px)",maxHeight:"85dvh",overflow:"auto",background:BG,border:"2px solid #d6b77a",borderRadius:18,padding:14}}><header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><h2 style={{margin:0}}>Party Team</h2><button style={button("#9eb5e4")} onClick={()=>setPartyPanelOpen(false)}>Chiudi</button></header>{players.map(p=>{
 const q=(gameState&&gameState.players&&gameState.players[p.user_id])||{};
 const a=STARTERS.find(s=>s.id===q.active)||STARTERS.find(s=>s.id===p.character_id);
 const b=STARTERS.find(s=>s.id===q.bench);
 const isOnline=onlinePlayers.some(x=>x.user_id===p.user_id);
 const displayName=a?a.nome:q.active;
 const activeImg=a?a.img:"";
 const benchName=b?b.nome:"";
 const benchImg=b?b.img:"";
 return <div key={p.user_id} style={{...box,marginTop:10,opacity:isOnline?1:.65}}>
   <div style={{display:"flex",gap:10,alignItems:"center"}}>
     <img src={activeImg} alt="" width="60" height="60" style={{objectFit:"contain"}}/>
     <div><b>{p.player_name} · {isOnline?"🟢 Online":"⚪ Offline"}</b><div>{displayName}</div><small>HP {q.hp||20}/20 · Lv {q.level||1} · XP {q.xp||0} · Azioni {q.actions_used||0}/3</small></div>
   </div>
   {b?<div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}><img src={benchImg} alt="" width="48" height="48" style={{objectFit:"contain"}}/><small>Panchina: {benchName} · HP {q.bench_hp||20}/20</small></div>:null}
 </div>
})}</section></div>}
    <div data-camera-ignore style={{position:"absolute",right:8,bottom:80,maxWidth:"min(40vw,220px)",background:"#17241fe8",border:"1px solid #d6b77a",borderRadius:14,padding:10,zIndex:10}}><b>{gameState.enemy?.name||"Esplorazione"}</b>{gameState.enemy&&<div>HP {gameState.enemy.hp}/{gameState.enemy.max} · Fase {gameState.enemy.phase||1}</div>}<div style={{fontSize:12}}>Indizi {gameState.clues||0} · Esplorazioni zona {gameState.flags?.["explores_stage_"+stage]||0}/2 · Minori {gameState.minor_fights||0} · Tesori {gameState.treasure_count||0}</div><div style={{marginTop:8,maxHeight:100,overflow:"auto"}}>{(gameState.log||[]).slice(-4).map((entry,i)=><div key={i} style={{fontSize:12,borderTop:"1px solid #ffffff22",paddingTop:4}}>{players.find(p=>p.user_id===entry.user_id)?.player_name||"Squadra"} · {entry.action}</div>)}</div></div>
    {error&&<div style={{position:"absolute",top:"70%",left:8,right:8,background:"#522d2d",borderRadius:12,padding:8}}>{error}</div>}
   </main>;
 }
 if(showGame&&gameState&&(gameState.won||gameState.lost||room?.status==="finished")){
   return <main style={{position:"fixed",inset:0,background:BG,color:TEXT,overflow:"auto",padding:20}}><section style={{...box,maxWidth:800,margin:"0 auto",textAlign:"center"}}><h1>{gameState.won?"🏆 Lumequieto è salva!":"💫 Spedizione fallita"}</h1><p>{gameState.won?"Il Sigillo Vivente è stato sconfitto dalla squadra.":"La squadra è esausta. La stanza conserva la spedizione."}</p><p>Monete condivise: {gameState.coins}</p><button style={button()} onClick={leave}>Esci</button></section></main>;
 }
 if(screen==="lobby"&&room)return <main style={{position:"fixed",inset:0,overflow:"auto",background:BG,color:TEXT,padding:18}}><section style={{maxWidth:1000,margin:"0 auto"}}><header style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}><div><small style={{letterSpacing:4,color:GOLD}}>SOGNATORI · CITY XIV ONLINE</small><h1 style={{margin:"6px 0"}}>Stanza {room.room_code}</h1><p>Cooperativa online · {onlinePlayers.length} online / {players.length} in stanza · max {room.max_players}</p></div><button style={button("#9eb5e4")} onClick={leave}>Esci</button></header><section style={{...box,marginTop:14}}><div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}><b>Codice invito: {room.room_code}</b><button style={button(GOLD)} onClick={()=>navigator.clipboard?.writeText(room.room_code)}>Copia codice</button><span>Host: {players.find(p=>p.user_id===room.host_id)?.player_name||"—"}</span></div><p>Il leader avvia quando 2–5 giocatori sono presenti e tutti sono pronti.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:12}}>{players.map(p=><div key={p.user_id} style={{background:BG,border:"1px solid #536859",borderRadius:12,padding:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><img src={STARTERS.find(s=>s.id===p.character_id)?.img} alt="" width="64" height="64" style={{objectFit:"contain"}}/><div><b>{p.player_name}</b><div>{p.user_id===room.host_id?"👑 Host":""}</div><div>{onlinePlayers.some(x=>x.user_id===p.user_id)?"🟢 Online":"⚪ Offline"}</div><div style={{color:p.ready?"#a8e0ac":MUTED}}>{p.ready?"Pronto":"Non pronto"}</div></div></div></div>)}</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><button style={button("#91c99c")} disabled={busy} onClick={ready}>{me?.ready?"Annulla ready":"Sono pronto"}</button>{room.host_id===user.id&&<button style={button(GOLD)} disabled={busy||onlinePlayers.length<2||onlinePlayers.length>room.max_players||!onlinePlayers.every(p=>p.ready)} onClick={start}>Avvia avventura</button>}<button style={button("#9eb5e4")} onClick={()=>refreshRoom(roomId)}>Aggiorna</button></div></section>{error&&<p style={{color:"#f5a3a3"}}>{error}</p>}<section style={{...box,marginTop:14}}><p>La stanza e la progressione sono salvate nel database. Se un host perde la connessione, il ruolo passa a un membro attivo dopo il timeout.</p></section></section></main>;
 return <main style={{position:"fixed",inset:0,overflow:"auto",background:BG,color:TEXT,padding:18}}><section style={{maxWidth:1200,margin:"0 auto"}}><header style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}><div><small style={{letterSpacing:4,color:GOLD}}>SOGNATORI · CITY XIV ONLINE</small><h1 style={{margin:"6px 0"}}>Lumequieto cooperativa</h1><p>Stanze private online da 2 a 5 giocatori · progressione condivisa · reconnect.</p></div><button style={button("#9eb5e4")} onClick={onBack}>Indietro</button></header><section style={{...box,marginTop:14}}><label style={{display:"block",marginBottom:10}}>Sognatore <select value={selected} onChange={e=>setSelected(e.target.value)} style={{padding:10,borderRadius:10,marginLeft:8}}>{STARTERS.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</select></label><div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}><img src={STARTERS.find(s=>s.id===selected)?.img} alt="" width="100" height="100" style={{objectFit:"contain"}}/><div><b>Personaggio iniziale</b><p>Ogni partecipante sceglie il proprio Sognatore e lo vede nel mondo.</p></div></div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:14}}><label>Numero massimo <select value={maxPlayers} onChange={e=>setMaxPlayers(+e.target.value)} style={{padding:9,borderRadius:10}}>{[2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></label><button style={button(GOLD)} disabled={busy} onClick={create}>Crea stanza</button><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="CODICE" maxLength={6} style={{padding:10,borderRadius:10,letterSpacing:2}}/><button style={button("#91c99c")} disabled={busy||code.trim().length!==6} onClick={join}>Entra</button></div></section>{error&&<div style={{background:"#522d2d",borderRadius:12,padding:10,marginTop:10}}>{error}</div>}<section style={{...box,marginTop:14}}><h2>Cooperativa online</h2><ul><li>Stanza con codice invito e lobby readiness.</li><li>Posizioni e avatar dei compagni sincronizzati via realtime.</li><li>3 azioni per giocatore, combattimenti condivisi, progressione, XP e monete.</li><li>Salvataggio server, reconnect e trasferimento host.</li></ul></section></section></main>;
}
