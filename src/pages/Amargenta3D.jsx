import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import AdventureBattle from "@/components/game/AdventureBattle";
import { ROSTER, ROSTER_AMARGENTA } from "@/lib/sognatoriData";

// Amargenta ospita esclusivamente le carte numerate dal 40 in avanti.
const AMARGENTA_ROSTER = ROSTER_AMARGENTA;
const AMARGENTA_SOGNATORE_IDS = new Set(AMARGENTA_ROSTER.map((s) => String(s.id)));
const ARABNITE_RESIDENT_IDS = ["adlimago","biglia","brama","lumen","ponce","sanlegno","trix","vudele"];
const ARABNITE_RESIDENTS = ARABNITE_RESIDENT_IDS.map((id) => ROSTER.find((s) => s.id === id)).filter(Boolean);

/**
 * Amargenta 3D — ambiente esplorabile sperimentale.
 * La scena è isolata dal renderer Canvas di Avventura: non modifica Arcade/Multiplayer.
 * Gli asset GLB definitivi di Scenario potranno sostituire progressivamente i moduli procedurali.
 */
function Amargenta3DContent({ onExit }) {
  const hostRef = useRef(null);
  const travelToWorldRef = useRef(null);
  const [hint, setHint] = useState("");
  const [activeCharacter, setActiveCharacter] = useState("talpitrippa");
  const [zone, setZone] = useState("Ingresso di Amargenta");
  const [worldTransition, setWorldTransition] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const [nearby, setNearby] = useState(null);
  const [ownedAmargentaIds, setOwnedAmargentaIds] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("sognatori:amargenta:roster:v1") || "{}");
      const valid = AMARGENTA_ROSTER.map((s) => s.id);
      if (Array.isArray(saved.ownedIds)) return [...new Set(saved.ownedIds.filter((id) => valid.includes(id)))];
      if (Array.isArray(saved.partyIds) || Array.isArray(saved.boxIds)) return [...new Set([...(saved.partyIds || []), ...(saved.boxIds || [])].filter((id) => valid.includes(id)))];
      return [];
    } catch { return []; }
  });
  const ownedAmargentaIdsRef = useRef(ownedAmargentaIds);
  const [amargentaPartyIds, setAmargentaPartyIds] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("sognatori:amargenta:roster:v1") || "{}");
      const valid = AMARGENTA_ROSTER.map((s) => s.id);
      return Array.isArray(saved.partyIds) ? [...new Set(saved.partyIds.filter((id) => valid.includes(id)))].slice(0, 4) : [];
    } catch { return []; }
  });
  const [amargentaBoxIds, setAmargentaBoxIds] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("sognatori:amargenta:roster:v1") || "{}");
      const valid = AMARGENTA_ROSTER.map((s) => s.id);
      return Array.isArray(saved.boxIds) ? [...new Set(saved.boxIds.filter((id) => valid.includes(id)))].slice(0, valid.length) : [];
    } catch { return []; }
  });
  const recruitAmargenta = (id) => {
    if (!AMARGENTA_SOGNATORE_IDS.has(String(id)) || ownedAmargentaIdsRef.current.includes(id)) return false;
    ownedAmargentaIdsRef.current = [...ownedAmargentaIdsRef.current, id];
    setOwnedAmargentaIds(ownedAmargentaIdsRef.current);
    setAmargentaBoxIds((ids) => ids.includes(id) ? ids : [...ids, id]);
    setToast((AMARGENTA_ROSTER.find((s) => s.id === id)?.nome || "Il Sognatore") + " si è unito ad Amargenta!");
    return true;
  };
  const moveAmargentaToParty = (id) => {
    if (!ownedAmargentaIds.includes(id) || amargentaPartyIds.includes(id) || amargentaPartyIds.length >= 4) return;
    setAmargentaBoxIds((ids) => ids.filter((item) => item !== id));
    setAmargentaPartyIds((ids) => [...ids, id]);
  };
  const moveAmargentaToBox = (id) => {
    if (!amargentaPartyIds.includes(id)) return;
    setAmargentaPartyIds((ids) => ids.filter((item) => item !== id));
    setAmargentaBoxIds((ids) => ids.includes(id) ? ids : [...ids, id]);
  };
  const [savedProgress] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("sognatori:amargenta:save:v2") || "{}"); }
    catch { return {}; }
  });
  // La fiducia è la progressione sociale di Amargenta: ogni incarico concluso
  // rafforza il legame con il Sognatore che lo ha affidato.
  const [residentTrust, setResidentTrust] = useState(() =>
    savedProgress.residentTrust && typeof savedProgress.residentTrust === "object" ? savedProgress.residentTrust : {}
  );
  const awardResidentTrust = (residentId) => setResidentTrust((current) => ({
    ...current,
    [residentId]: Math.min(5, (Number(current[residentId]) || 0) + 1)
  }));
  useEffect(() => {
    try {
      window.localStorage.setItem("sognatori:amargenta:roster:v1", JSON.stringify({
        ownedIds: [...new Set(ownedAmargentaIds.filter((id) => AMARGENTA_SOGNATORE_IDS.has(String(id))))],
        partyIds: amargentaPartyIds.filter((id) => ownedAmargentaIds.includes(id)).slice(0, 4),
        boxIds: amargentaBoxIds.filter((id) => ownedAmargentaIds.includes(id) && !amargentaPartyIds.includes(id))
      }));
    } catch (error) { console.warn("Impossibile salvare il box di Amargenta:", error); }
  }, [ownedAmargentaIds, amargentaPartyIds, amargentaBoxIds]);
  const [questStarted, setQuestStarted] = useState(Boolean(savedProgress.questStarted));
  const [questCount, setQuestCount] = useState(Number(savedProgress.questCount) || 0);
  const [questDone, setQuestDone] = useState(Boolean(savedProgress.questDone));
  const [inventory, setInventory] = useState(() => {
    const savedInventory = savedProgress.inventory || {};
    return {
      amberBeans: Number(savedInventory.amberBeans) || 0,
      recipeFragments: Number(savedInventory.recipeFragments) || 0,
      waterCrystals: Number(savedInventory.waterCrystals) || 0,
      citrus: Number(savedInventory.citrus) || 0,
      relics: Number(savedInventory.relics) || 0,
      coffeeBlend: Number(savedInventory.coffeeBlend) || 0,
      herbalTea: Number(savedInventory.herbalTea) || 0,
      peppers: Number(savedInventory.peppers) || 0,
      truffles: Number(savedInventory.truffles) || 0,
      milk: Number(savedInventory.milk) || 0,
      coffeeBeans: Number(savedInventory.coffeeBeans) || 0
    };
  });
  const [recipeStarted, setRecipeStarted] = useState(Boolean(savedProgress.recipeStarted));
  const [recipePages, setRecipePages] = useState(Number(savedProgress.recipePages) || 0);
  const [recipeDone, setRecipeDone] = useState(Boolean(savedProgress.recipeDone));
  const [waterStarted, setWaterStarted] = useState(Boolean(savedProgress.waterStarted));
  const [valves, setValves] = useState(Number(savedProgress.valves) || 0);
  const [waterDone, setWaterDone] = useState(Boolean(savedProgress.waterDone));
  const [secretUnlocked, setSecretUnlocked] = useState(Boolean(savedProgress.secretUnlocked));
  const [vaultClaimed, setVaultClaimed] = useState(Boolean(savedProgress.vaultClaimed));
  const [citrusHarvested, setCitrusHarvested] = useState(Boolean(savedProgress.citrusHarvested));
  const [bellsStarted, setBellsStarted] = useState(Boolean(savedProgress.bellsStarted));
  const [bellCount, setBellCount] = useState(Number(savedProgress.bellCount) || 0);
  const [bellsDone, setBellsDone] = useState(Boolean(savedProgress.bellsDone));
  const [activatedBells, setActivatedBells] = useState(Array.isArray(savedProgress.activatedBells) ? savedProgress.activatedBells : []);
  const [blendStarted, setBlendStarted] = useState(Boolean(savedProgress.blendStarted));
  const [blendDone, setBlendDone] = useState(Boolean(savedProgress.blendDone));
  const [botanicalCacheClaimed, setBotanicalCacheClaimed] = useState(Boolean(savedProgress.botanicalCacheClaimed));
  const [dungeonSigils, setDungeonSigils] = useState(Array.isArray(savedProgress.dungeonSigils) ? savedProgress.dungeonSigils : []);
  const [dungeonBossDefeated, setDungeonBossDefeated] = useState(Boolean(savedProgress.dungeonBossDefeated));
  const [dungeonBattleOpen, setDungeonBattleOpen] = useState(false);
  const [zibelleBattleOpen, setZibelleBattleOpen] = useState(false);
  const [latteloBattleOpen, setLatteloBattleOpen] = useState(false);
  const inventoryRef = useRef(inventory);
  const citrusHarvestedRef = useRef(Boolean(savedProgress.citrusHarvested));
  const [collectedAmber, setCollectedAmber] = useState(Array.isArray(savedProgress.collectedAmber) ? savedProgress.collectedAmber : []);
  const [collectedPages, setCollectedPages] = useState(Array.isArray(savedProgress.collectedPages) ? savedProgress.collectedPages : []);
  const [activatedValves, setActivatedValves] = useState(Array.isArray(savedProgress.activatedValves) ? savedProgress.activatedValves : []);
  const [panel, setPanel] = useState(null);
  const [journalPage, setJournalPage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [touchStick, setTouchStick] = useState({x:0,y:0});
  const touchStickRef = useRef({x:0,y:0});
  const [playerCoords, setPlayerCoords] = useState({ x: -44, z: 2 });
  const [worldMoment, setWorldMoment] = useState("Mattina");
  const [toast, setToast] = useState("");
  const [arabniteCollection, setArabniteCollection] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("sognatori:arabnite:cards:v1") || "{}");
      return { packs: Math.max(0, Number(saved.packs) || 0), packInventory: Array.isArray(saved.packInventory) ? saved.packInventory.filter(p=>["standard","premium","rare"].includes(p)) : Array(Math.max(0,Number(saved.packs)||0)).fill("standard"), coins: Math.max(0, Number(saved.coins ?? 120) || 0), collectedPackIds: Array.isArray(saved.collectedPackIds) ? saved.collectedPackIds : [], cards: saved.cards && typeof saved.cards === "object" ? saved.cards : {} };
    } catch { return { packs: 0, packInventory: [], coins: 120, collectedPackIds: [], cards: {} }; }
  });
  const arabniteCollectionRef = useRef(arabniteCollection);
  const [cardReveal, setCardReveal] = useState([]);
  const [cardDuelOpen, setCardDuelOpen] = useState(false);
  const [cardDuel, setCardDuel] = useState(null);
  const startCardDuel = (playerCard) => {
    const pool=ROSTER.filter(card=>card.id!==playerCard.id);
    const opponentCard=pool[Math.floor(Math.random()*pool.length)];
    const playerHp=24+Math.max(0,Number(playerCard.dif)||0),opponentHp=24+Math.max(0,Number(opponentCard.dif)||0);
    setCardDuel({playerCard,opponentCard,playerHp,opponentHp,maxPlayerHp:playerHp,maxOpponentHp:opponentHp,turn:"player",log:"La sfida comincia! Tocca ATTACCA per giocare la tua carta.",done:false});
  };
  const playCardDuelTurn = () => setCardDuel(current => {
    if(!current||current.done)return current;
    const damage=Math.max(2,(Number(current.playerCard.att)||5)-Math.floor((Number(current.opponentCard.dif)||0)*.28)+Math.floor(Math.random()*4));
    const enemyHp=Math.max(0,current.opponentHp-damage);
    if(enemyHp<=0){
      const reward={...arabniteCollectionRef.current,coins:Number(arabniteCollectionRef.current.coins??120)+15};
      arabniteCollectionRef.current=reward;setArabniteCollection(reward);setToast("Vittoria nell'Arena delle Carte · +15 monete");
      return {...current,opponentHp:0,done:true,log:current.playerCard.nome+" infligge "+damage+" danni: hai vinto il duello!"};
    }
    const counter=Math.max(1,(Number(current.opponentCard.att)||5)-Math.floor((Number(current.playerCard.dif)||0)*.28)+Math.floor(Math.random()*3));
    const playerHp=Math.max(0,current.playerHp-counter);
    if(playerHp<=0){setToast("Sfida persa · puoi ritentare nell'Arena");return {...current,opponentHp:enemyHp,playerHp:0,done:true,log:current.opponentCard.nome+" contrattacca per "+counter+" danni. Hai perso il duello."};}
    return {...current,opponentHp:enemyHp,playerHp,log:current.playerCard.nome+" infligge "+damage+" danni. "+current.opponentCard.nome+" contrattacca per "+counter+" danni."};
  });
  const collectArabnitePack = (id) => {
    const current = arabniteCollectionRef.current;
    if (current.collectedPackIds.includes(id)) return;
    const next = { ...current, coins: Number(current.coins ?? 120) + 5, packs: current.packs + 1, packInventory: [...(current.packInventory||[]),"standard"], collectedPackIds: [...current.collectedPackIds, id] };
    arabniteCollectionRef.current = next; setArabniteCollection(next);
    setToast("Bustina raccolta! Puoi aprirla dall'Album dei Sognatori.");
  };
  const openArabnitePack = () => {
    const current = arabniteCollectionRef.current;
    if (current.packs <= 0) { setToast("Non hai bustine da aprire. Cercane altre ad Arabnite!"); return; }
    const counts = { ...current.cards }, drawn = [], packKind=(current.packInventory||[])[0]||"standard";
    const weightedPick = (pool) => {
      const weighted=pool.map(card=>({card,weight:Math.max(1,Number(card.costo)||1)}));
      const total=weighted.reduce((sum,item)=>sum+item.weight,0);let roll=Math.random()*total;
      for(const item of weighted){roll-=item.weight;if(roll<=0)return item.card;}
      return weighted[weighted.length-1]?.card;
    };
    const tier=(card)=>{const value=Number(card.costo)||1;return value>=40?"LEGGENDA":value>=28?"EPICA":value>=18?"RARA":"COMUNE";};
    for (let i = 0; i < 3; i++) {
      const remaining=ROSTER.filter(card=>!drawn.some(p=>p.id===card.id));
      let pool=remaining.length?remaining:ROSTER;
      if(packKind==="standard") pool=pool.filter(card=>tier(card)==="COMUNE"||tier(card)==="RARA");
      if(packKind==="premium") pool=pool.filter(card=>tier(card)!=="COMUNE");
      if(packKind==="rare") pool=pool.filter(card=>tier(card)==="EPICA"||tier(card)==="LEGGENDA");
      if(!pool.length)pool=remaining.length?remaining:ROSTER;
      const card=weightedPick(pool);
      counts[card.id]=(Number(counts[card.id])||0)+1;
      drawn.push({...card,rarity:tier(card),isNew:counts[card.id]===1,copies:counts[card.id]});
    }
    if(packKind==="premium"&&!drawn.some(card=>card.rarity==="EPICA"||card.rarity==="LEGGENDA")){
      const guaranteed=weightedPick(ROSTER.filter(card=>["EPICA","LEGGENDA"].includes(tier(card))));
      if(guaranteed){const index=drawn.length-1,old=drawn[index];counts[old.id]=Math.max(0,counts[old.id]-1);counts[guaranteed.id]=(Number(counts[guaranteed.id])||0)+1;drawn[index]={...guaranteed,rarity:tier(guaranteed),isNew:counts[guaranteed.id]===1,copies:counts[guaranteed.id]};}
    }
    const next = { ...current, coins: Number(current.coins ?? 120), packs: Math.max(0,current.packs-1), packInventory:(current.packInventory||[]).slice(1), cards: counts };
    arabniteCollectionRef.current = next; setArabniteCollection(next);
    setCardReveal(drawn); setToast("Bustina aperta · hai trovato 3 carte!");
  };
  const buyArabnitePack = (kind="standard") => {
    const offers={standard:{label:"Bustina del Bazar",price:30},premium:{label:"Bustina delle Lanterne",price:65},rare:{label:"Bustina del Collezionista",price:110}};
    const offer=offers[kind]||offers.standard, current=arabniteCollectionRef.current;
    if(Number(current.coins??120)<offer.price){setToast("Monete insufficienti: cerca altre carte o tesori in città.");return false;}
    const next={...current,coins:Number(current.coins??120)-offer.price,packs:current.packs+1,packInventory:[...(current.packInventory||[]),kind]};
    arabniteCollectionRef.current=next;setArabniteCollection(next);setToast(offer.label+" acquistata!");return true;
  };
  const tradeArabniteCard = (npcName) => {
    const current=arabniteCollectionRef.current, counts={...current.cards};
    const duplicates=ROSTER.filter(card=>(Number(counts[card.id])||0)>1);
    if(!duplicates.length){setToast("Per scambiare serve almeno una carta doppia.");return false;}
    const missing=ROSTER.filter(card=>(Number(counts[card.id])||0)===0);
    if(!missing.length){setToast("Hai già completato l'album!");return false;}
    const npcRules={Brama:{wanted:["Dolce","Umano"],bonus:8},Lumen:{wanted:["Luce","Mago","Nuvola"],bonus:12}};
    const rule=npcRules[npcName]||{wanted:[],bonus:5};
    const wantedDuplicates=duplicates.filter(card=>rule.wanted.includes(card.tipo));
    const givePool=wantedDuplicates.length?wantedDuplicates:duplicates;
    const give=givePool.sort((a,b)=>(Number(a.costo)||0)-(Number(b.costo)||0))[0];
    const receivePool=missing.filter(card=>rule.wanted.includes(card.tipo));
    const receive=receivePool.length?receivePool[Math.floor(Math.random()*receivePool.length)]:missing[Math.floor(Math.random()*missing.length)];
    counts[give.id]-=1;counts[receive.id]=1;
    const next={...current,cards:counts,coins:Number(current.coins??120)+rule.bonus};
    arabniteCollectionRef.current=next;setArabniteCollection(next);
    setCardReveal([{...receive,isNew:true,copies:1}]);
    setToast(npcName+" ha accettato "+give.nome+" e ti ha dato "+receive.nome+" · +"+rule.bonus+" monete.");return true;
  };
  useEffect(() => { try { window.localStorage.setItem("sognatori:arabnite:cards:v1", JSON.stringify(arabniteCollection)); } catch (error) { console.warn("Impossibile salvare la collezione di Arabnite:",error); } }, [arabniteCollection]);
  const questActiveRef = useRef(Boolean(savedProgress.questStarted));
  const questCountRef = useRef(Number(savedProgress.questCount) || 0);
  const questDoneRef = useRef(Boolean(savedProgress.questDone));
  const recipeDoneRef = useRef(Boolean(savedProgress.recipeDone));
  const waterDoneRef = useRef(Boolean(savedProgress.waterDone));
  const secretUnlockedRef = useRef(Boolean(savedProgress.secretUnlocked));
  const recipeStartedRef = useRef(Boolean(savedProgress.recipeStarted));
  const recipePagesRef = useRef(Number(savedProgress.recipePages) || 0);
  const waterStartedRef = useRef(Boolean(savedProgress.waterStarted));
  const valvesRef = useRef(Number(savedProgress.valves) || 0);
  const collectedAmberRef = useRef(new Set(Array.isArray(savedProgress.collectedAmber) ? savedProgress.collectedAmber : []));
  const collectedPagesRef = useRef(new Set(Array.isArray(savedProgress.collectedPages) ? savedProgress.collectedPages : []));
  const activatedValvesRef = useRef(new Set(Array.isArray(savedProgress.activatedValves) ? savedProgress.activatedValves : []));
  const vaultClaimedRef = useRef(Boolean(savedProgress.vaultClaimed));
  const bellsStartedRef = useRef(Boolean(savedProgress.bellsStarted));
  const bellCountRef = useRef(Number(savedProgress.bellCount) || 0);
  const bellsDoneRef = useRef(Boolean(savedProgress.bellsDone));
  const activatedBellsRef = useRef(new Set(Array.isArray(savedProgress.activatedBells) ? savedProgress.activatedBells : []));
  const blendStartedRef = useRef(Boolean(savedProgress.blendStarted));
  const blendDoneRef = useRef(Boolean(savedProgress.blendDone));
  const botanicalCacheClaimedRef = useRef(Boolean(savedProgress.botanicalCacheClaimed));
  const dungeonSigilsRef = useRef(Array.isArray(savedProgress.dungeonSigils) ? savedProgress.dungeonSigils : []);
  const dungeonBossDefeatedRef = useRef(Boolean(savedProgress.dungeonBossDefeated));
  const zoneRef = useRef("Ingresso di Amargenta");
  const controlsLockedRef = useRef(false);
  const menuOpenRef = useRef(false);

  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => {
    menuOpenRef.current = Boolean(menuOpen);
    controlsLockedRef.current = Boolean(menuOpen || dialogue || panel || dungeonBattleOpen || cardDuelOpen);
    if (menuOpen) {
      touchStickRef.current = { x: 0, y: 0 };
      setTouchStick({ x: 0, y: 0 });
    }
  }, [menuOpen, dialogue, panel, dungeonBattleOpen, cardDuelOpen]);
  useEffect(() => {
    arabniteCollectionRef.current = arabniteCollection;
    try { window.localStorage.setItem("sognatori:arabnite:cards:v1", JSON.stringify(arabniteCollection)); }
    catch (error) { console.warn("Salvataggio album Arabnite non disponibile", error); }
  }, [arabniteCollection]);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    try {
      window.localStorage.setItem("sognatori:amargenta:save:v2", JSON.stringify({
        questStarted, questCount, questDone, inventory, residentTrust,
        recipeStarted, recipePages, recipeDone,
        waterStarted, valves, waterDone, secretUnlocked, vaultClaimed, citrusHarvested,
        collectedAmber, collectedPages, activatedValves,
        bellsStarted, bellCount, bellsDone, activatedBells,
        blendStarted, blendDone, botanicalCacheClaimed,
        dungeonSigils, dungeonBossDefeated
      }));
    } catch (error) {
      console.warn("Salvataggio Amargenta non disponibile", error);
    }
  }, [questStarted, questCount, questDone, inventory, residentTrust, recipeStarted, recipePages, recipeDone, waterStarted, valves, waterDone, secretUnlocked, vaultClaimed, citrusHarvested, collectedAmber, collectedPages, activatedValves, bellsStarted, bellCount, bellsDone, activatedBells, blendStarted, blendDone, botanicalCacheClaimed, dungeonSigils, dungeonBossDefeated]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let renderer, scene, arabniteScene, camera, frame, observer;
    let disposed = false;
    const keys = new Set();
    const clock = new THREE.Clock();
    const sessionStorageKey = "sognatori:world-session:v1";
    let restoredSession = null;
    try {
      const stored = JSON.parse(window.localStorage.getItem(sessionStorageKey) || "null");
      if (stored && stored.version === 1 && stored.worlds && typeof stored.worlds === "object") restoredSession = stored;
    } catch { restoredSession = null; }
    let sessionWorlds = restoredSession?.worlds || {};
    const player = new THREE.Group();
    const playerMotion = { model:null, arms:[], feet:[] };
    const colliders = [];
    let jumpHeight = 0;
    let jumpVelocity = 0;
    let jumpRequested = false;
    const walkablePlatforms = [];
    const walkableRamps = [];
    const interactables = [];
    const npcActors = [];
    const smokePuffs = [];
    const amberPickups = [];
    const arabnitePackMeshes = [];
    const arabPortalEffects = [];
    const fireflies = [];
    const bellActors = [];
    const groundEdits = [];
    const ambientCreatures = [];
    const harvestableTrees = [];
    const candyShots = [];
    const arabniteCandyTargets = [];
    let climbHeight = 0;
    let climbingWall = null;
    let arabniteActive = false;
    let arabniteReady = false;
    let isArabniteIceAt = () => false;
    let yaw = Math.PI * 0.22, pitch = 0.34, distance = 9.2;
    const movementVelocity = new THREE.Vector3();
    const desiredMovement = new THREE.Vector3();
    const cameraLookTarget = new THREE.Vector3();
    let cameraReady = false;
    let dragging = false, lastX = 0, lastY = 0, lastHudUpdate = 0, currentPeriod = -1;
    const mat = (color, roughness=0.9, extra={}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
    const stone = mat("#9a8871"), stoneLight = mat("#c0ad91"), darkStone = mat("#655747");
    const roof = mat("#704638"), wood = mat("#65442f"), leaf = mat("#365d38"), leaf2 = mat("#587d43");
    const coffeeRed = mat("#a82f27"), water = mat("#397f83",0.22,{metalness:0.08});
    const gold = mat("#bd8750",0.42,{metalness:0.45}), plaster = mat("#c7ad88");
    const groundMat = mat("#536746"), pathMat = mat("#9b896e");
    // Texture procedurali leggere: prato screziato e terra battuta, senza asset esterni.
    const makeTileTexture = (base, flecks, seed=1) => {
      const canvas=document.createElement("canvas");canvas.width=canvas.height=512;
      const ctx=canvas.getContext("2d");ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
      let value=seed;const random=()=>{value=(value*16807)%2147483647;return(value-1)/2147483646;};
      for(let i=0;i<1900;i++){
        const x=random()*256,y=random()*256,r=.5+random()*2.2;
        ctx.globalAlpha=.08+random()*.2;ctx.fillStyle=flecks[Math.floor(random()*flecks.length)];
        ctx.beginPath();ctx.ellipse(x,y,r,r*(.45+random()),random()*Math.PI,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
      const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
      texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
    };
    groundMat.map=makeTileTexture("#66764b",["#87915a","#3e593d","#b0a16a","#52643e"],17);
    groundMat.map.repeat.set(24,24);groundMat.color.set("#ffffff");
    pathMat.map=makeTileTexture("#b79a70",["#d5bc91","#8e7658","#e0c99f","#9c805d"],31);
    pathMat.map.repeat.set(3,3);pathMat.color.set("#ffffff");
    const addMesh = (geo, material, parent=scene, x=0,y=0,z=0) => {
      const m = new THREE.Mesh(geo,material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
    };
    const box = (w,h,d,material,parent,x,y,z) => addMesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z);
    const cylinder = (rt,rb,h,material,parent,x,y,z,segments=12) => addMesh(new THREE.CylinderGeometry(rt,rb,h,segments),material,parent,x,y,z);
    const sphere = (r,material,parent,x,y,z,detail=1) => addMesh(new THREE.IcosahedronGeometry(r,detail),material,parent,x,y,z);
    const addCollider = (x,z,r,height=2.2) => colliders.push({type:"circle",x,z,r,height});
    const addBoxCollider = (x,z,w,d,rotation=0,height=3) => colliders.push({
      type:"box",x,z,halfW:w/2,halfD:d/2,rotation,height
    });
    const isWaterAt = (x,z) => {
      const center=28+(z-2)*.08, bridge=Math.abs(z)<3.8||Math.abs(z+32)<3.8;
      return !bridge&&Math.abs(z)<50&&Math.abs(x-center)<5.6;
    };
    const isBlockedAt = (x,z,radius=.55) => {
      if(isWaterAt(x,z)&&!(characterState?.active==="piocino"&&jumpHeight>=1.35)&&characterState?.active!=="ripple")return true;
      return colliders.some(collider => {
      if (jumpHeight + climbHeight > (collider.height ?? 2.2) + .08) return false;
      if (collider.type !== "box") {
        return Math.hypot(x-collider.x,z-collider.z) < collider.r+radius;
      }
      const dx=x-collider.x, dz=z-collider.z;
      const cos=Math.cos(collider.rotation||0), sin=Math.sin(collider.rotation||0);
      const localX=dx*cos+dz*sin, localZ=-dx*sin+dz*cos;
      const closestX=THREE.MathUtils.clamp(localX,-collider.halfW,collider.halfW);
      const closestZ=THREE.MathUtils.clamp(localZ,-collider.halfD,collider.halfD);
      return Math.hypot(localX-closestX,localZ-closestZ)<radius;
      });
    };
    const addInteriorWallColliders = (cx,cz,width,depth,doorSide="north",doorWidth=3.2) => {
      const halfW=width/2, halfD=depth/2, wall=.5, gap=doorWidth/2;
      if (doorSide==="north") {
        addBoxCollider(cx-(gap+halfW)/2,cz-halfD,(halfW-gap),wall);
        addBoxCollider(cx+(gap+halfW)/2,cz-halfD,(halfW-gap),wall);
      } else addBoxCollider(cx,cz-halfD,width,wall);
      if (doorSide==="south") {
        addBoxCollider(cx-(gap+halfW)/2,cz+halfD,(halfW-gap),wall);
        addBoxCollider(cx+(gap+halfW)/2,cz+halfD,(halfW-gap),wall);
      } else addBoxCollider(cx,cz+halfD,width,wall);
      addBoxCollider(cx-halfW,cz,wall,depth);
      addBoxCollider(cx+halfW,cz,wall,depth);
    };
    const makeTree = (x,z,s=1,berries=false) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(s);
      // Tronco rastremato e radici visibili: silhouette leggibile anche da lontano.
      const trunk=cylinder(.29,.16,2.55,wood,g,0,1.22,0,11);
      trunk.rotation.z=.025;
      for(let side=-1;side<=1;side+=2){
        const root=cylinder(.10,.22,.82,wood,g,side*.27,.28,.12,8);
        root.rotation.z=side*.62;
        const branch=cylinder(.065,.12,1.35,wood,g,side*.48,1.9,-.02,8);
        branch.rotation.z=side*-.48;
        const twig=cylinder(.035,.07,.8,wood,g,side*.9,2.48,-.04,7);
        twig.rotation.z=side*.32;
      }
      // Chiome organiche: icosaedri deformati, non sfere perfette ripetute.
      const makeCanopy=(radius,material,px,py,pz,seed)=>{
        const geo=new THREE.IcosahedronGeometry(radius,2);
        const attr=geo.attributes.position;
        for(let v=0;v<attr.count;v++){
          const vx=attr.getX(v),vy=attr.getY(v),vz=attr.getZ(v);
          const wave=1+.075*Math.sin(vx*8+seed)*Math.cos(vy*7-seed*.7)+.035*Math.sin(vz*13+seed*1.3);
          attr.setXYZ(v,vx*wave,vy*wave,vz*wave);
        }
        geo.computeVertexNormals();
        const mesh=new THREE.Mesh(geo,material);
        mesh.position.set(px,py,pz);mesh.scale.set(1.12,.94,1.02);
        mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
      };
      for(let i=0;i<9;i++){
        const a=i*2.399,ring=i%3;
        makeCanopy(.72+(i%2)*.12,i%3?leaf:leaf2,Math.cos(a)*(.48+ring*.1),2.48+ring*.28,Math.sin(a)*(.48+ring*.1),i+Math.round(x*3));
      }
      makeCanopy(.72,leaf2,0,3.12,0,31+Math.round(z));
      // Ciuffi esterni e foglie singole spezzano il profilo della chioma.
      for(let i=0;i<16;i++){
        const a=i*2.399,rr=.83+(i%3)*.09;
        const leafTip=addMesh(new THREE.ConeGeometry(.12,.34,5),i%3?leaf:leaf2,g,Math.cos(a)*rr,2.35+(i%4)*.19,Math.sin(a)*rr);
        leafTip.rotation.z=Math.cos(a)*-.45;leafTip.rotation.x=Math.sin(a)*.42;
      }
      const berryMeshes=[];
      if(berries){
        const berryMat=mat("#c85b4c",.48,{roughness:.48});
        for(let i=0;i<16;i++){
          const a=i*2.399,rr=.58+(i%3)*.16;
          berryMeshes.push(sphere(.075,berryMat,g,Math.cos(a)*rr,2.05+(i%5)*.22,Math.sin(a)*rr,2));
        }
      }
      harvestableTrees.push({group:g,x,z,berries:berryMeshes,harvested:false});
      addCollider(x,z,.62*s,3.4*s);
      return g;
    };
    // Muccanza #42 — giovane fan umano del latte di Lattelo, con bottiglia e tazza da caffellatte.
    const makeMuccanza = () => {
      const g=new THREE.Group();scene.add(g);g.position.set(-28,0,-30);
      const skin=mat("#d99b70"), hair=mat("#4b2d24"), shirt=mat("#f1e8d6"), shirtShade=mat("#d5c5a8");
      const denim=mat("#344b64"), shoes=mat("#49352d"), milk=mat("#fff8e9",.28), blue=mat("#278ed0",.35), gold=mat("#e5b64f");
      const torso=new THREE.Group();g.add(torso);
      const body=sphere(.48,shirt,torso,0,1.15,0,2);body.scale.set(.9,1.12,.72);
      // Maglia con un piccolo simbolo a goccia blu.
      sphere(.19,blue,torso,0,1.2,.405,2).scale.set(.72,1.05,.24);
      sphere(.075,milk,torso,0,1.24,.47,2);
      const headPivot=new THREE.Group();g.add(headPivot);headPivot.position.set(0,2.02,.04);
      sphere(.43,skin,headPivot,0,.05,.08,2).scale.set(.95,1.08,.88);
      const hairCap=sphere(.44,hair,headPivot,0,.31,-.015,2);hairCap.scale.set(1.04,.58,.95);
      sphere(.22,hair,headPivot,-.29,.12,.05,1).scale.set(.65,1.1,.8);
      sphere(.22,hair,headPivot,.29,.12,.05,1).scale.set(.65,1.1,.8);
      const eyes=[];
      for(const side of [-1,1]){
        sphere(.105,milk,headPivot,side*.16,.08,.79,2);
        sphere(.052,hair,headPivot,side*.16,.08,.842,2);
        sphere(.025,mat("#ffffff"),headPivot,side*.14,.112,.875,1);
        const brow=sphere(.09,hair,headPivot,side*.16,.235,.76,1);brow.scale.set(1.25,.34,.3);brow.rotation.z=side*.12;
      }
      const smile=box(.16,.035,.025,hair,headPivot,0,-.14,.82);
      // Ciuffo a goccia e distintivo a tazza: dettagli da protagonista Nintendo.
      const forelock=sphere(.19,hair,headPivot,.12,.39,.31,2);forelock.scale.set(1.05,.55,.5);forelock.rotation.z=-.35;
      const milkBadge=sphere(.105,gold,torso,.27,1.38,.29,2);milkBadge.scale.set(.75,1,.35);
      sphere(.045,milk,torso,.27,1.4,.33,1);
      const legs=[];
      for(const side of [-1,1]){
        const leg=new THREE.Group();g.add(leg);leg.position.set(side*.19,.68,0);
        box(.22,.58,.24,denim,leg,0,-.28,0);
        box(.3,.18,.4,shoes,leg,0,-.62,.1);
        legs.push(leg);
      }
      const arms=[];
      for(const side of [-1,1]){
        const arm=new THREE.Group();g.add(arm);arm.position.set(side*.43,1.48,0);
        box(.17,.52,.19,shirt,arm,0,-.24,0);
        sphere(.12,skin,arm,0,-.53,.04,1);
        arms.push(arm);
      }
      // Bottiglia del latte Lattelo nella mano sinistra, tazza di caffellatte nella destra.
      const bottle=cylinder(.13,.16,.48,milk,g,-.65,.98,.16,12);
      cylinder(.07,.075,.12,blue,g,-.65,1.28,.16,10);
      const label=box(.2,.16,.025,blue,g,-.65,.98,.295);
      const mug=cylinder(.13,.15,.22,shirt,g,.65,.91,.18,12);
      cylinder(.125,.125,.025,mat("#7b4b2d"),g,.65,1.035,.18,12);
      const handle=new THREE.Mesh(new THREE.TorusGeometry(.1,.025,7,14,Math.PI*1.6),shirt);
      handle.position.set(.8,.93,.18);handle.rotation.z=Math.PI/2;g.add(handle);
      const interaction={id:"recruit-muccanza",title:"Muccanza · Fan del Lattelo",text:"Muccanza è un fan sfegatato del latte di Lattelo. Lo beve sempre mischiato al caffè.",x:g.position.x,z:g.position.z,radius:4.1,action:()=>{
        if(ownedAmargentaIdsRef.current.includes("muccanza")){setDialogue({title:"Muccanza",text:"Muccanza è già nella tua collezione."});return;}
        setDialogue({title:"Incontro · Muccanza",text:"«Il latte di Lattelo è il migliore di tutta Amargenta! Vuoi assaggiare il mio caffellatte?» Muccanza sembra disposto a seguirti se condividi la sua passione.",confirm:()=>{recruitAmargenta("muccanza");setDialogue(null);}});
      }};
      interactables.push(interaction);
      npcActors.push({group:g,phase:1.8,kind:"muccanza",leftArm:arms[0],rightArm:arms[1],headPivot,legs,homeX:-28,homeZ:-30});
      return g;
    };
    const makeZibelle = (x,z,index=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      const fur=mat("#713b28"), furLight=mat("#9b5634"), furDark=mat("#48251d"), cream=mat("#f0c982"), innerEar=mat("#d88c62"), dark=mat("#241510"), eye=mat("#fff8e9"), coffee=mat("#b47a3c");
      const bodyPivot=new THREE.Group();g.add(bodyPivot);
      const body=sphere(.72,fur,bodyPivot,0,.68,0,2);body.scale.set(1.32,.72,.82);
      const rump=sphere(.48,furDark,bodyPivot,-.56,.67,-.12,2);rump.scale.set(1.05,.88,.9);
      const belly=sphere(.48,cream,bodyPivot,0,.48,.46,2);belly.scale.set(1.12,.55,.65);
      const headPivot=new THREE.Group();g.add(headPivot);headPivot.position.set(0,1.18,.52);
      const head=sphere(.58,furLight,headPivot,0,.12,.12,2);head.scale.set(1.08,.96,.9);
      const muzzle=sphere(.31,cream,headPivot,0,-.12,.61,2);muzzle.scale.set(1.25,.72,.72);
      const nose=sphere(.075,dark,headPivot,0,-.09,.86,1);
      const ears=[];
      for(const side of [-1,1]){
        const earPivot=new THREE.Group();headPivot.add(earPivot);earPivot.position.set(side*.39,.53,.02);earPivot.rotation.z=side*-.18;
        const ear=sphere(.27,furDark,earPivot,0,.2,0,2);ear.scale.set(.72,1.48,.48);
        const inner=sphere(.17,innerEar,earPivot,0,.22,.16,1);inner.scale.set(.72,1.25,.3);ears.push(earPivot);
        sphere(.095,eye,headPivot,side*.225,.19,.66,1);sphere(.05,dark,headPivot,side*.225,.19,.735,1);
        sphere(.035,mat("#ffffff"),headPivot,side*.245,.225,.77,1);
      }
      const legs=[];
      for(const side of [-1,1])for(const fore of [true,false]){
        const pivot=new THREE.Group();g.add(pivot);pivot.position.set(side*(fore?.43:.49),.43,fore?.39:-.43);
        const leg=sphere(fore?.2:.23,fore?fur:furDark,pivot,0,-.16,0,1);leg.scale.set(.86,1.25,1.05);
        const paw=sphere(.19,furLight,pivot,0,-.32,.08,1);paw.scale.set(1,.48,1.35);
        legs.push({pivot,side,fore});
      }
      const tailPivot=new THREE.Group();g.add(tailPivot);tailPivot.position.set(-.72,.82,-.36);
      const tail=sphere(.5,furDark,tailPivot,0,-.1,-.34,2);tail.scale.set(1.02,.92,1.65);tail.rotation.x=-.28;
      const tailTip=sphere(.28,furLight,tailPivot,-.03,.02,-.83,2);tailTip.scale.set(1,.92,1.12);
      for(let i=0;i<3;i++){const bean=sphere(.085,coffee,bodyPivot,-.32+i*.3,.91,.22,1);bean.scale.set(.7,1.25,.5);}
      // Macchie morbide sul dorso e ciuffo scuro per una silhouette più riconoscibile.
      for(const [x,y,z,r] of [[-.48,.91,-.42,.14],[.38,.84,-.43,.12],[-.2,1.08,-.48,.1]]){const patch=sphere(r,furDark,bodyPivot,x,y,z,1);patch.scale.set(1.3,.65,.35);}
      const whiskers=[];
      for(const side of [-1,1]){const w=box(.22,.018,.018,cream,headPivot,side*.34,-.2,.69);w.rotation.z=side*.18;whiskers.push(w);}
      const aroma=new THREE.Group();g.add(aroma);
      for(let i=0;i<3;i++){const puff=sphere(.085,mat("#e4c99d",.65,{transparent:true,opacity:.5}),aroma,.25+i*.12,1.5+i*.17,-.55,1);puff.userData.phase=i*.9;}
      const interaction={id:"wild-zibelle-"+index,title:"Zibelle selvatica",text:"Una Zibelle selvatica ti ha notato. Avvicinati per affrontarla.",x,z,radius:3.8,action:()=>setZibelleBattleOpen(true)};
      interactables.push(interaction);
      const phase=index*1.73;
      npcActors.push({group:g,phase,wild:true,legs,tailPivot,headPivot,ears,bodyPivot,aroma,interaction,homeX:x,homeZ:z,roamRadius:3.2+index%3*1.1,walkSpeed:.55+index%3*.12});
      return g;
    };
    // Umami #44: cane da tartufo, esplora il sottobosco con il naso a terra.
    const makeUmami = () => {
      const g=new THREE.Group();scene.add(g);g.position.set(-48,0,30);
      const coat=mat("#4a3025"), coatLight=mat("#79513a"), cream=mat("#d8c6a7"), dark=mat("#211815"), nose=mat("#171313"), eye=mat("#f7e8cf"), leather=mat("#8d4e32"), gold=mat("#d6a64f");
      const bodyPivot=new THREE.Group();g.add(bodyPivot);
      const body=sphere(.62,coat,bodyPivot,0,.7,0,2);body.scale.set(1.28,.82,.82);
      const chest=sphere(.38,cream,bodyPivot,0,.53,.43,2);chest.scale.set(.9,.8,.6);
      // Ciuffi e macchie del mantello: il profilo è più soffice e leggibile.
      for(let i=0;i<9;i++){
        const a=i*2.399, side=Math.cos(a), front=Math.sin(a);
        const tuft=sphere(.16+(i%3)*.025,i%2?coatLight:cream,bodyPivot,side*.48,.72+(i%4)*.12,front*.34,1);
        tuft.scale.set(1.25,.72,.82);
      }
      sphere(.12,coat,bodyPivot,-.42,.94,.39,1).scale.set(1.2,.7,.45);
      sphere(.12,coat,bodyPivot,.42,.94,.39,1).scale.set(1.2,.7,.45);
      const headPivot=new THREE.Group();g.add(headPivot);headPivot.position.set(0,1.03,.48);
      const head=sphere(.43,coatLight,headPivot,0,.05,.12,2);head.scale.set(1.08,.9,1.05);
      const muzzle=sphere(.27,cream,headPivot,0,-.17,.48,2);muzzle.scale.set(1.2,.7,.85);
      const tongue=sphere(.09,mat("#d97878"),headPivot,0,-.34,.63,1);tongue.scale.set(.8,1.2,.45);
      const browL=sphere(.1,coat,headPivot,-.2,.3,.4,1);browL.scale.set(1.3,.42,.5);
      const browR=sphere(.1,coat,headPivot,.2,.3,.4,1);browR.scale.set(1.3,.42,.5);
      sphere(.09,nose,headPivot,0,-.12,.69,2);
      // Tartufo ampio e lucido, guance morbide e sopracciglia espressive.
      sphere(.18,coatLight,headPivot,0,-.22,.49,2).scale.set(1.18,.55,.62);
      for(const side of [-1,1]){
        const brow=sphere(.105,coat,headPivot,side*.19,.28,.43,1);brow.scale.set(1.35,.48,.55);
      }
      const ears=[];
      for(const side of [-1,1]){
        const ear=new THREE.Group();headPivot.add(ear);ear.position.set(side*.31,.31,-.02);ear.rotation.z=side*-.28;
        const flap=sphere(.16,coat,ear,0,.12,0,1);flap.scale.set(.72,1.35,.48);ears.push(ear);
        sphere(.07,eye,headPivot,side*.19,.12,.46,1);sphere(.035,dark,headPivot,side*.19,.12,.51,1);
      }
      const legs=[];
      for(const side of [-1,1])for(const fore of [true,false]){
        const pivot=new THREE.Group();g.add(pivot);pivot.position.set(side*.34,.4,fore?.32:-.37);
        const leg=sphere(.14,coat,pivot,0,-.14,0,1);leg.scale.set(.85,1.35,.9);
        sphere(.15,dark,pivot,0,-.29,.04,1);legs.push({pivot,side,fore});
      }
      const tailPivot=new THREE.Group();g.add(tailPivot);tailPivot.position.set(0,.83,-.68);
      const tail=sphere(.12,coatLight,tailPivot,0,-.12,-.2,1);tail.scale.set(.8,1,1.8);
      // Pettorina da cane da tartufo e tartufo trovato.
      const harness=box(.62,.12,.48,leather,g,0,.85,-.02);harness.rotation.x=-.12;
      sphere(.12,gold,g,0,.91,.28,1);
      const truffle=sphere(.16,mat("#35251c"),g,.42,.1,.56,2);truffle.scale.set(1.2,.7,.9);
      const aroma=new THREE.Group();g.add(aroma);
      for(let i=0;i<3;i++){const scent=sphere(.055,mat("#d8c5a0",.7,{transparent:true,opacity:.42}),aroma,.2+i*.12,1.1+i*.16,-.4,1);scent.userData.phase=i*.8;}
      const interaction={id:"recruit-belligonghi-umami",title:"Belligonghi-umami · Cane da tartufo",text:"Belligonghi-umami annusa il terreno di Amargenta alla ricerca di tartufi.",x:g.position.x,z:g.position.z,radius:4.2,action:()=>{
        if(ownedAmargentaIdsRef.current.includes("belligonghi-umami")){setDialogue({title:"Belligonghi-umami",text:"Belligonghi-umami è già nella tua collezione."});return;}
        setDialogue({title:"Incontro · Belligonghi-umami",text:"Bau! Belligonghi-umami ha fiutato una traccia sotto le radici. Il cane da tartufo sembra incuriosito: vuoi convincerlo a unirsi alla tua avventura?",confirm:()=>{recruitAmargenta("belligonghi-umami");setDialogue(null);}});
      }};
      interactables.push(interaction);
      npcActors.push({group:g,phase:2.4,wild:true,legs,tailPivot,headPivot,ears,bodyPivot,aroma,interaction,homeX:-48,homeZ:30,roamRadius:2.4,walkSpeed:.48});
      return g;
    };
    // Creature RPG 3D per i Sognatori 36–39, con silhouette e animazione dedicate.
    const makeRecruitableCreature = (id,name,x,z,colors,kind="round") => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      const main=mat(colors[0]),light=mat(colors[1]),dark=mat(colors[2]),accent=mat(colors[3]||"#e8c98c");
      const body=sphere(kind==="bull"?.62:.58,main,g,0,.72,0,2);body.scale.set(kind==="bull"?1.35:1.05,kind==="tall"?1.28:.9,kind==="rabbit"?.78:.92);
      const headPivot=new THREE.Group();g.add(headPivot);headPivot.position.set(0,1.28,.38);
      sphere(kind==="rabbit"?.42:.43,light,headPivot,0,.12,.12,2);
      sphere(.22,accent,headPivot,0,-.08,.48,2).scale.set(1.15,.72,.65);
      for(const side of [-1,1]){sphere(.065,dark,headPivot,side*.17,.18,.47,1);sphere(.025,mat("#fff8e8"),headPivot,side*.18,.2,.49,1);}
      const ears=[];
      if(kind==="rabbit"||kind==="bull")for(const side of [-1,1]){
        const ear=new THREE.Group();headPivot.add(ear);ear.position.set(side*.25,.42,0);ear.rotation.z=side*(kind==="bull"?.48:.12);
        const e=sphere(kind==="bull"?.13:.16,main,ear,0,.27,0,1);e.scale.set(.8,kind==="bull"?1.7:2.1,.55);
        sphere(.07,light,ear,0,.27,.07,1).scale.set(.8,1.7,.25);ears.push(ear);
      }
      const legs=[];
      for(const side of [-1,1])for(const fore of [true,false]){
        const pivot=new THREE.Group();g.add(pivot);pivot.position.set(side*.34,.42,fore?.32:-.34);
        const limb=sphere(.14,kind==="bull"?main:dark,pivot,0,-.16,0,1);limb.scale.set(.9,1.25,1);
        sphere(.16,accent,pivot,0,-.3,.035,1);legs.push({pivot,side,fore});
      }
      const tailPivot=new THREE.Group();g.add(tailPivot);tailPivot.position.set(0,.8,-.55);
      sphere(.11,light,tailPivot,0,-.1,-.24,1).scale.set(1,1,1.8);
      const aroma=new THREE.Group();g.add(aroma);
      for(let i=0;i<3;i++){const puff=sphere(kind==="swamp"?.1:.075,accent,aroma,(i-1)*.22,1.75+i*.15,-.25,1);puff.userData.phase=i*.8;}
      const interaction={id:"recruit-"+id,title:name,text:name+" ti osserva. Sembra curioso, ma deve ancora decidere se fidarsi di te.",x,z,radius:4.1,action:()=>{
        if(ownedAmargentaIdsRef.current.includes(id)){setDialogue({title:name,text:name+" è già nella tua collezione. Nessun doppione ad Amargenta."});return;}
        setDialogue({title:"Incontro · "+name,text:"Hai incontrato "+name+". Parlagli e convincilo a unirsi alla tua avventura.",confirm:()=>{recruitAmargenta(id);setDialogue(null);}});
      }};
      interactables.push(interaction);
      npcActors.push({group:g,phase:x*.13+z*.07,wild:true,legs,tailPivot,headPivot,ears,bodyPivot:{position:{y:0}},aroma,interaction,homeX:x,homeZ:z,roamRadius:1.8,walkSpeed:.32});
      return g;    };
    // Flame #45: creatura ardente che diffonde nell'aria il profumo pungente del peperoncino.
    const makeFlame = () => {
      const g=new THREE.Group();scene.add(g);g.position.set(32,0,-28);
      const ember=mat("#b92d20",.55), red=mat("#ed4b24",.48), orange=mat("#ff842e",.42), gold=mat("#ffd45c",.38), pale=mat("#fff0b5",.32), dark=mat("#54231d"), eye=mat("#fff8e9",.22), pupil=mat("#30202a",.28);
      const bodyPivot=new THREE.Group();g.add(bodyPivot);
      // Corpo compatto e leggibile: pancia luminosa, guance e piccoli rilievi da creatura Nintendo.
      const body=sphere(.58,ember,bodyPivot,0,.91,0,3);body.scale.set(.9,1.08,.82);
      const belly=sphere(.34,orange,bodyPivot,0,.82,.34,3);belly.scale.set(.92,1.04,.48);
      sphere(.19,gold,bodyPivot,0,.83,.51,2).scale.set(.88,.94,.28);
      const headPivot=new THREE.Group();g.add(headPivot);headPivot.position.set(0,1.43,.08);
      const head=sphere(.43,red,headPivot,0,.04,.04,3);head.scale.set(1.08,.96,.9);
      const cheeks=[];
      for(const side of [-1,1]){
        sphere(.105,orange,headPivot,side*.29,-.08,.43,2).scale.set(1,.72,.35);
        sphere(.105,eye,headPivot,side*.155,.12,.405,2).scale.set(.82,1.12,.55);
        sphere(.052,pupil,headPivot,side*.145,.105,.447,2);
        sphere(.018,mat("#ffffff",.18),headPivot,side*.13,.13,.475,1);
        cheeks.push(side);
      }
      // Sopracciglia e sorriso danno un'espressione vivace e riconoscibile.
      const browL=sphere(.075,dark,headPivot,-.16,.29,.39,2);browL.scale.set(1.3,.38,.35);browL.rotation.z=.18;
      const browR=sphere(.075,dark,headPivot,.16,.29,.39,2);browR.scale.set(1.3,.38,.35);browR.rotation.z=-.18;
      const smile=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,7,18,Math.PI),dark);smile.position.set(0,-.13,.435);smile.rotation.z=Math.PI;headPivot.add(smile);
      const flameTips=[];
      // Cresta a gocce appuntite: silhouette a corona, più organica delle sfere sovrapposte.
      for(let i=0;i<5;i++){
        const tip=sphere(.19-i*.012,i%2?orange:gold,bodyPivot,(i-2)*.19,1.55+(i%2)*.12,-.015,3);
        tip.scale.set(.42,1.9,.48);tip.rotation.z=(i-2)*-.24;flameTips.push(tip);
      }
      // Due grandi fiammelle laterali e una punta centrale luminosa.
      for(const side of [-1,1]){
        const petal=sphere(.23,orange,bodyPivot,side*.43,1.2,-.025,3);
        petal.scale.set(.42,1.72,.55);petal.rotation.z=side*-.58;
        const inner=sphere(.12,gold,bodyPivot,side*.44,1.22,.13,2);
        inner.scale.set(.48,1.45,.42);
      }
      const crownCore=sphere(.13,pale,bodyPivot,0,1.76,.02,2);crownCore.scale.set(.52,1.45,.48);
      const emberDots=[];
      for(let i=0;i<6;i++){
        const mote=sphere(.035+i%2*.018,i%2?gold:orange,g,(i-2.5)*.2,1.35+(i%3)*.32,-.3-(i%2)*.08,1);
        emberDots.push(mote);
      }
      const arms=[];
      for(const side of [-1,1]){
        const arm=sphere(.12,red,g,side*.48,1.08,.02,1);arm.scale.set(.7,1.5,.7);arms.push(arm);
      }
      const legs=[];
      for(const side of [-1,1]){
        const pivot=new THREE.Group();g.add(pivot);pivot.position.set(side*.19,.35,0);
        sphere(.12,dark,pivot,0,-.1,.03,1);legs.push({pivot,side,fore:true});
      }
      const tailPivot=new THREE.Group();g.add(tailPivot);tailPivot.position.set(0,.8,-.4);
      const aroma=new THREE.Group();g.add(aroma);
      for(let i=0;i<5;i++){
        const puff=sphere(.075,mat("#ffb04b",.55,{transparent:true,opacity:.58}),aroma,(i-2)*.12,1.95+(i%3)*.16,-.28,1);
        puff.userData.phase=i*.72;
      }
      const interaction={id:"recruit-flame",title:"Flame · Aroma di peperoncino",text:"Flame diffonde nell'aria un aroma intenso e pungente di peperoncino.",x:g.position.x,z:g.position.z,radius:4.2,action:()=>{
        if(ownedAmargentaIdsRef.current.includes("flame")){setDialogue({title:"Flame",text:"Flame è già nella tua collezione."});return;}
        setDialogue({title:"Incontro · Flame",text:"Flame sprigiona un aroma intenso di peperoncino. L'aria intorno a lui pizzica il naso. Vuoi convincerlo a unirsi alla tua avventura?",confirm:()=>{recruitAmargenta("flame");setDialogue(null);}});
      }};
      interactables.push(interaction);
      npcActors.push({group:g,phase:5.1,wild:true,legs,tailPivot,headPivot,ears:[],bodyPivot,aroma,interaction,homeX:32,homeZ:-28,roamRadius:2.1,walkSpeed:.36,flameTips,emberDots});
      return g;
    };
    // Albero di peperoncino: piccolo albero ornamentale accanto a Flame.
    const makeChiliTree = (x,z) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      const trunk=mat("#68412b"), foliage=mat("#47713c"), foliageLight=mat("#6f9148");
      const pepperRed=mat("#c92f25",.48), pepperBright=mat("#ed5635",.42), stem=mat("#54743b");
      cylinder(.2,.29,2.15,trunk,g,0,1.075,0,9);
      for(let side of [-1,1]){
        const branch=cylinder(.075,.12,1.25,trunk,g,side*.42,1.9,0,7);
        branch.rotation.z=side*-.55;
      }
      for(let i=0;i<9;i++){
        const a=i*2.399,ring=i%3;
        const crown=sphere(.72+(i%2)*.1,i%3?foliage:foliageLight,g,Math.cos(a)*(.5+ring*.12),2.45+ring*.28,Math.sin(a)*(.48+ring*.12),2);
        crown.scale.set(1.12,.78,.95);
      }
      // Peperoncini pendenti, rossi e ben visibili tra le foglie.
      for(let i=0;i<11;i++){
        const a=i*2.4,rr=.62+(i%3)*.16;
        const px=Math.cos(a)*rr, pz=Math.sin(a)*rr, py=1.9+(i%4)*.22;
        const pepper=new THREE.Group();g.add(pepper);pepper.position.set(px,py,pz);
        const pod=sphere(.13,i%3?pepperRed:pepperBright,pepper,0,-.19,0,2);
        pod.scale.set(.72,1.9,.72);pod.rotation.z=(i%2?-.12:.12);
        const tip=addMesh(new THREE.ConeGeometry(.065,.2,7),pepperRed,pepper,0,-.39,0);
        tip.rotation.x=Math.PI;
        cylinder(.035,.045,.16,stem,pepper,0,-.015,0,6);
      }
      addCollider(x,z,.48,3.35);
    };
    // Terreno morbido da tartufi per Umami: zolle, foglie e tartufi affioranti.
    const makeTrufflePatch = (x,z) => {
      const soil=mat("#594532"), soilLight=mat("#806344"), truffleMat=mat("#30231d",.72), leafMat=mat("#66794a");
      const patch=addMesh(new THREE.CircleGeometry(5.4,40),soil,scene,x,.035,z);
      patch.rotation.x=-Math.PI/2;patch.scale.set(1.18,.82,1);
      for(let i=0;i<19;i++){
        const a=i*2.399,rr=1.1+(i%5)*.72,px=x+Math.cos(a)*rr,pz=z+Math.sin(a)*rr*.78;
        const mound=sphere(.42+(i%3)*.08,i%2?soilLight:soil,scene,px,.12,pz,1);
        mound.scale.set(1.35,.34,1.08);
        if(i%2===0){
          const truffle=sphere(.16+(i%3)*.025,truffleMat,scene,px+.12,.22,pz-.08,2);
          truffle.scale.set(1.2,.72,.92);
        }
        for(let j=0;j<3;j++){
          const blade=sphere(.12,leafMat,scene,px+(j-1)*.13,.24,pz+.18,1);
          blade.scale.set(.45,1.5,.35);blade.rotation.z=(j-1)*.35;
        }
      }
      // Piccoli tartufi in evidenza intorno al cane, come tracce da fiutare.
      for(let i=0;i<5;i++){
        const a=i*1.257,rr=2.5+(i%2)*.55;
        const truffle=sphere(.19,truffleMat,scene,x+Math.cos(a)*rr,.18,z+Math.sin(a)*rr*.8,2);
        truffle.scale.set(1.25,.7,.9);
      }
    };
    const makeCoffeePlant = (x,z,s=1) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(s);
      cylinder(.045,.07,.72,wood,g,0,.36,0,6);
      for(let i=0;i<7;i++){const a=i*2.4;const l=sphere(.38,i%2?leaf:leaf2,g,Math.cos(a)*.26,.55+(i%3)*.08,Math.sin(a)*.26,1);l.scale.set(1.35,.35,.72);}
      for(let i=0;i<5;i++){const a=i*2.4;sphere(.09,coffeeRed,g,Math.cos(a)*.34,.38+(i%3)*.13,Math.sin(a)*.34,1);}
      return g;
    };
    const makeCitrusTree = (x,z,s=1) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(s);
      cylinder(.16,.24,1.8,wood,g,0,.9,0,7);
      for(let i=0;i<6;i++){const a=i*2.4;const crown=sphere(.9,i%2?leaf:leaf2,g,Math.cos(a)*.38,2+Math.sin(a)*.22,Math.sin(a)*.38,1);crown.scale.set(1.2,.8,1);}
      for(let i=0;i<9;i++){const a=i*2.399;const r=.55+(i%3)*.12;sphere(.12,mat("#e5a33d"),g,Math.cos(a)*r,1.45+(i%4)*.28,Math.sin(a)*r,1);}
      addCollider(x,z,.5*s);
      return g;
    };
    const makeGreenhouse = (x,z) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      const frame=mat("#60452f"), glass=mat("#8bb9a1",.18,{transparent:true,opacity:.36,metalness:.08});
      box(10,.22,7,stoneLight,g,0,.12,0);
      for(const px of [-4.7,0,4.7])box(.16,3.5,.16,frame,g,px,1.85,0);
      for(const pz of [-3.2,3.2])box(9.5,.16,.16,frame,g,0,3.45,pz);
      const roofGlass=addMesh(new THREE.BoxGeometry(10,.12,7),glass,g,0,3.5,0);roofGlass.rotation.x=.02;
      for(let i=0;i<5;i++){const plant=makeCoffeePlant(x-3.5+i*1.7,z,.9);plant.position.y=.25;}
      addBoxCollider(x,z,10,7);
    };
    const makeHouse = (x,z,w=5,d=4,h=3.3,variant=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      box(w,h,d,variant?plaster:stone,g,0,h/2,0);
      // Facciata in intonaco caldo, assi orizzontali e travi lignee a vista.
      const facade=variant?mat("#d7c29e"):mat("#c6b18b");
      for(let row=0;row<Math.floor(h/.48);row++){
        box(w+.035,.055,.055,row%2?wood:darkStone,g,0,.28+row*.48,d/2+.045);
      }
      for(let col=-1;col<=1;col++){
        const px=col*w*.34;
        box(.13,h-.18,.12,wood,g,px,h/2,d/2+.1);
      }
      // Tetto tradizionale a padiglione, con gronda profonda e copertura scura.
      const eaves=box(w+.95,.2,d+.95,wood,g,0,h-.02,0);
      const roofMaterial=mat(variant?"#465849":"#3b4a40",.98);
      // Tetto a due falde con colmo leggibile, invece del cono piramidale.
      const roofAngle=Math.atan2(.95,d*.56);
      const roofHalf=Math.sqrt((d*.56)*(d*.56)+.95*.95);
      const roofA=addMesh(new THREE.BoxGeometry(w+.72,.18,roofHalf*1.12),roofMaterial,g,0,h+.48,-d*.25);
      roofA.rotation.x=-roofAngle;
      const roofB=addMesh(new THREE.BoxGeometry(w+.72,.18,roofHalf*1.12),roofMaterial,g,0,h+.48,d*.25);
      roofB.rotation.x=roofAngle;
      box(w+.82,.2,.22,darkStone,g,0,h+1.02,0);
      // Tegole in fasce sottili e terminali in legno.
      for(let row=0;row<3;row++){
        const z=-d*.39+row*d*.26;
        const tileA=box(w+.76,.045,.075,mat("#6b5541"),g,0,h+.88-row*.25,z);
        tileA.rotation.x=-roofAngle;
        const tileB=box(w+.76,.045,.075,mat("#6b5541"),g,0,h+.88-row*.25,-z);
        tileB.rotation.x=roofAngle;
      }
      // Fascia frontale e porta scorrevole con riquadri chiari.
      box(w+.5,.18,.22,darkStone,g,0,h+.04,d/2+.4);
      box(1.02,1.78,.17,wood,g,0,.9,d/2+.1);
      box(.76,1.48,.045,mat("#d9c8a7"),g,0,.91,d/2+.2);
      for(let y=.25;y<1.65;y+=.34)box(.78,.045,.035,wood,g,0,y,d/2+.24);
      for(const wx of [-w*.29,w*.29]){
        box(.72,.86,.16,wood,g,wx,2.05,d/2+.1);
        box(.52,.64,.055,mat("#d9c49c"),g,wx,2.05,d/2+.19);
        for(let bar=-1;bar<=1;bar++)box(.045,.62,.035,wood,g,wx+bar*.22,2.05,d/2+.23);
      }
      // Finestre laterali con cornici lignee, davanzali e imposte.
      for(const side of [-1,1]){
        const sx=side*(w/2+.045);
        box(.12,.92,1.05,wood,g,sx,2.05,0);
        box(.055,.68,.78,mat("#d9c49c"),g,sx+side*.07,2.05,0);
        box(.18,.12,1.18,wood,g,sx+side*.08,1.55,0);
        box(.12,.78,.12,wood,g,sx+side*.1,2.05,0);
        for(const dz of [-.52,.52])box(.12,.95,.12,wood,g,sx+side*.1,2.05,dz);
      }
      // Camino in pietra e comignolo in legno sul retro del tetto.
      box(.72,1.25,.72,darkStone,g,w*.28,h+.95,-d*.2);
      box(.9,.16,.9,stoneLight,g,w*.28,h+1.6,-d*.2);
      // Travi angolari, gronda con supporti e insegna del locale.
      for(const wx of [-w*.43,w*.43]){
        box(.2,h-.2,.2,wood,g,wx,h/2,d/2+.11);
        box(.16,.42,.16,wood,g,wx,h-.3,d/2+.34);
      }
      for(let i=0;i<Math.floor(w/1.4);i++){
        const beam=box(.12,.16,d+.2,wood,g,-w/2+.7+i*1.4,h+.08,0);
        beam.rotation.z=(i%2?-.025:.025);
      }
      box(1.35,.28,.12,gold,g,0,h-0.55,d/2+.2);
      addBoxCollider(x,z,w+.7,d+.7,0,4.8);
      return g;
    };
    const makeWall = (x,z,length,height=1.2,rot=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rot;
      box(length,height,.65,stone,g,0,height/2,0);
      for(let i=0;i<Math.floor(length/.8);i++) box(.7,.12,.72,stoneLight,g,-length/2+.4+i*.8,height+.04,0);
      addBoxCollider(x,z,length,.9,rot);
    };
    const makeBridge = (x,z,length=12) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      box(length,.24,3.3,stone,g,0,.12,0);
      for(let i=0;i<Math.floor(length/.8);i++){box(.7,.8,.35,stoneLight,g,-length/2+.4+i*.8,.62,-1.65);box(.7,.8,.35,stoneLight,g,-length/2+.4+i*.8,.62,1.65);}
      const arch=addMesh(new THREE.TorusGeometry(length*.32,.34,8,32,Math.PI),darkStone,g,0,-.35,0);arch.rotation.z=Math.PI;
      walkablePlatforms.push({x,z,w:length,d:3.3,height:.24});
      // Il ponte resta attraversabile e la sua quota viene applicata al personaggio.
    };
    const makeTerrace = (x,z,w,depth,level,wallSide="south") => {
      const y=level*1.45;
      const top=addMesh(new THREE.BoxGeometry(w,.35,depth),groundMat,scene,x,y,z);
      walkablePlatforms.push({x,z,w,d:depth,height:y+.175});
      const wallAlongX=wallSide==="north"||wallSide==="south";
      const retainingWallX=wallSide==="west"?x-w/2:wallSide==="east"?x+w/2:x;
      const retainingWallZ=wallSide==="north"?z-depth/2:wallSide==="south"?z+depth/2:z;
      box(wallAlongX?w:.55,.95,wallAlongX?.55:depth,stone,scene,retainingWallX,y-.58,retainingWallZ);
      for(let i=0;i<Math.floor(w/2.2);i++) for(let j=0;j<2;j++) {
        const plant=makeCoffeePlant(x-w/2+1+i*2.1,z-depth/2+1+j*2.2,.8);
        plant.position.y=y+.2;
      }
      return top;
    };
    const makeWalkRamp = (a,b,width,fromY,toY) => {
      const dx=b[0]-a[0], dz=b[1]-a[1], length=Math.hypot(dx,dz);
      const px=-dz/length*width/2, pz=dx/length*width/2;
      const geometry=new THREE.BufferGeometry();
      const vertices=new Float32Array([
        a[0]+px,fromY,a[1]+pz, a[0]-px,fromY,a[1]-pz,
        b[0]-px,toY,b[1]-pz, b[0]+px,toY,b[1]+pz
      ]);
      geometry.setAttribute("position",new THREE.BufferAttribute(vertices,3));
      geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
      const rampMaterial=mat("#b58b5d");rampMaterial.side=THREE.DoubleSide;
      const ramp=new THREE.Mesh(geometry,rampMaterial);ramp.receiveShadow=true;ramp.castShadow=true;scene.add(ramp);
      walkableRamps.push({a,b,width,fromY,toY});
    };
    const getWalkHeight = (x,z) => {
      for(const ramp of walkableRamps){
        const dx=ramp.b[0]-ramp.a[0],dz=ramp.b[1]-ramp.a[1],length2=dx*dx+dz*dz;
        const t=THREE.MathUtils.clamp(((x-ramp.a[0])*dx+(z-ramp.a[1])*dz)/length2,0,1);
        const px=ramp.a[0]+dx*t,pz=ramp.a[1]+dz*t;
        if(Math.hypot(x-px,z-pz)<=ramp.width/2) return ramp.fromY+(ramp.toY-ramp.fromY)*t;
      }
      for(const platform of walkablePlatforms){
        if(Math.abs(x-platform.x)<=platform.w/2 && Math.abs(z-platform.z)<=platform.d/2) return platform.height;
      }
      return 0;
    };
    const makeMountain = (x,z,r,h,seed=0) => {
      const geo=new THREE.ConeGeometry(r,h,7,3);const m=addMesh(geo,mat(seed%2?"#65736b":"#7e887f"),scene,x,h/2-1,z);m.rotation.y=seed*1.7;
      const cap=addMesh(new THREE.ConeGeometry(r*.38,h*.24,7),mat("#d8d8cf"),scene,x,h*.88-1,z);cap.rotation.y=seed*1.7;
      addCollider(x,z,r*.68);
    };
    const makeLamp = (x,z) => {cylinder(.07,.11,2.5,darkStone,scene,x,1.25,z,8);box(.55,.55,.55,gold,scene,x,2.55,z);sphere(.22,mat("#ffd58b",.25,{emissive:"#d58c35",emissiveIntensity:1.2}),scene,x,2.55,z,2);addCollider(x,z,.28,2.9);};
    const makeFountain = (x,z) => {
      cylinder(3.3,3.7,.65,stoneLight,scene,x,.35,z,32);
      cylinder(2.8,3.1,.22,water,scene,x,.78,z,32);
      cylinder(.55,.8,2.1,stone,scene,x,1.75,z,16);
      const bean=sphere(1.05,gold,scene,x,3.45,z,2);bean.scale.set(.72,1.25,.48);bean.rotation.z=-.25;
      const seam=addMesh(new THREE.TorusGeometry(.72,.055,8,32),darkStone,scene,x,3.45,z);seam.scale.set(.7,1.3,.5);seam.rotation.z=-.25;
      for(let i=0;i<8;i++){const a=i*Math.PI/4;const jet=cylinder(.045,.045,1.3,water,scene,x+Math.cos(a)*1.5,1.55,z+Math.sin(a)*1.5,6);jet.rotation.z=Math.cos(a)*-.3;jet.rotation.x=Math.sin(a)*.3;}
      addCollider(x,z,3.35);
    };
    const makeRoastery = (x,z) => {
      makeHouse(x,z,11,8,4.5,1);
      box(2.2,2.5,.18,darkStone,scene,x,1.5,z+4.12);
      cylinder(.7,.85,2.4,gold,scene,x,1.35,z+4.25,16);
      cylinder(.48,.58,1.5,wood,scene,x,1.3,z+4.4,16);
      box(1.1,6.5,1.1,darkStone,scene,x+3.7,7,z-2.2);
      // Tenda d'ingresso, travi esterne e catasta di legna della torrefazione.
      makeNoren(x,z+4.24,"#9b4936");
      for(let i=0;i<5;i++)box(.42,.22,.42,i%2?wood:darkStone,scene,x-4.2+i*.48,.22,z+4.6);
      for(let i=0;i<4;i++){const puff=sphere(.45+i*.1,mat("#c8c6bd",1,{transparent:true,opacity:.48}),scene,x+3.7+Math.sin(i*2)*.4,10+i*.65,z-2.2,1);smokePuffs.push(puff);}
    };

    // Modelli 3D autonomi: nessuna illustrazione 2D incollata sulla superficie.
    const addSognatoreCrest = () => null;
    const addInteraction = (id, title, text, x, z, action=null, radius=3.2) => {
      interactables.push({id,title,text,x,z,action,radius});
    };
    const removeInteraction = (id) => {
      const index = interactables.findIndex(item => item.id === id);
      if (index >= 0) interactables.splice(index, 1);
    };
    const removeNpcInteraction = (name) => {
      for(let i=interactables.length-1;i>=0;i--){
        if(interactables[i].title.startsWith(name+" ·")) interactables.splice(i,1);
      }
    };
    const makeGroundEdit=(kind,x,z)=>{
      const g=new THREE.Group();scene.add(g);g.position.set(x,.06,z);
      if(kind==="hole"){
        const rim=addMesh(new THREE.TorusGeometry(.72,.16,7,18),mat("#765037"),g,0,0,0);rim.rotation.x=-Math.PI/2;
        const hollow=addMesh(new THREE.CircleGeometry(.62,20),mat("#30231d"),g,0,-.025,0);hollow.rotation.x=-Math.PI/2;
        for(let i=0;i<5;i++){const clod=sphere(.13,mat("#956744"),g,Math.cos(i*1.25)*.8,.04,Math.sin(i*1.25)*.8,1);clod.scale.y=.45;}
      }else if(kind==="furrow"){
        for(let i=-1;i<=1;i++){const line=addMesh(new THREE.PlaneGeometry(.18,4.6),mat("#6d4c31"),g,i*.48,.01,0);line.rotation.x=-Math.PI/2;}
      }else{
        const patch=addMesh(new THREE.CircleGeometry(.9,20),mat("#879b4c"),g,0,0,0);patch.rotation.x=-Math.PI/2;
        for(let i=0;i<7;i++){const blade=addMesh(new THREE.ConeGeometry(.08,.42,4),mat("#b3bd60"),g,Math.cos(i)*.5,.2,Math.sin(i)*.5);blade.rotation.z=-.25+Math.sin(i)*.5;}
      }
      groundEdits.push(g);if(groundEdits.length>42){scene.remove(groundEdits.shift());}
    };
    // Ogni abitante è un Sognatore: niente esseri umani generici ad Amargenta.
    // Le professioni sono accessori/attività, non NPC separati.
    const makeNpc = (id,name,job,x,z,shirt,lines,scale=1,options={}) => {
      const g=new THREE.Group();(options.parent||scene).add(g);g.position.set(x,0,z);g.scale.setScalar(scale);
      const palettes={
        barista:["#713b28","#9b5634","#f0c982","#d88c62"],
        merchant:["#d99b70","#4b2d24","#f1e8d6","#278ed0"],
        archivist:["#4a3025","#79513a","#d8c6a7","#d6a64f"],
        guard:["#e8ad19","#ffd34a","#f2d7a1","#aebbc1"],
        farmer:["#ed4b24","#ff842e","#ffd45c","#fff0b5"],
        "town-cook":["#d99b70","#4b2d24","#f1e8d6","#a94a35"],
        "town-carpenter":["#e8ad19","#ffd34a","#f2d7a1","#8a5938"],
        "town-gardener":["#e8ad19","#ffd34a","#f2d7a1","#4d8b38"],
        roaster:["#713b28","#9b5634","#f0c982","#b47a3c"],
        keeper:["#4a3025","#79513a","#d8c6a7","#a9d7c2"],
        "cafe-host":["#d99b70","#4b2d24","#f1e8d6","#278ed0"],
        milkkeeper:["#ffd92e","#fff0b2","#f5d8a1","#087df0"]
      };
      const [baseColor,lightColor,bellyColor,accentColor]=palettes[id]||palettes.barista;
      const rosterIdByName = {
        Zibelle:"zibelle", Muccanza:"muccanza", "Belligonghi-umami":"belligonghi-umami",
        Cardinero:"cardinero", Flame:"flame", Biglia:"biglia", Brama:"brama",
        Lumen:"lumen", Ponce:"ponce", Sanlegno:"sanlegno", Trix:"trix", Vudele:"vudele"
      };
      const base=mat(baseColor),light=mat(lightColor),belly=mat(bellyColor),accent=mat(accentColor);
      const dark=mat("#241b1a"),white=mat("#fff8e9");
      const bodyPivot=new THREE.Group();g.add(bodyPivot);
      const body=sphere(.56,base,bodyPivot,0,.82,0,2);body.scale.set(1.12,1.02,.92);
      sphere(.34,belly,bodyPivot,0,.68,.39,2).scale.set(1.05,.72,.48);
      const headPivot=new THREE.Group();g.add(headPivot);headPivot.position.set(0,1.48,.12);
      sphere(.46,light,headPivot,0,.12,.08,2).scale.set(1.08,1,.9);
      sphere(.23,belly,headPivot,0,-.12,.47,2).scale.set(1.2,.72,.6);
      for(const side of [-1,1]){
        sphere(.105,white,headPivot,side*.17,.18,.43,2);
        sphere(.052,dark,headPivot,side*.17,.18,.49,2);
        sphere(.025,white,headPivot,side*.15,.21,.515,1);
        const ear=sphere(id==="guard"?.2:.16,base,headPivot,side*.34,.52,-.02,2);
        ear.scale.set(.72,id==="guard"?1.35:1.7,.55);
      }
      sphere(.07,dark,headPivot,0,-.12,.56,1);
      const smile=box(.15,.025,.018,dark,headPivot,0,-.23,.52);
      const tuft=sphere(.2,accent,headPivot,0,.55,.16,2);tuft.scale.set(.75,1.35,.55);
      const arms=[];
      for(const side of [-1,1]){
        const arm=new THREE.Group();g.add(arm);arm.position.set(side*.48,1.12,0);
        const limb=sphere(.13,base,arm,0,-.18,.02,1);limb.scale.set(.8,1.6,.8);
        sphere(.13,light,arm,0,-.38,.08,1);
        arms.push(arm);
      }
      for(const side of [-1,1]){
        const leg=sphere(.16,base,g,side*.24,.25,0,1);leg.scale.set(.9,1.35,.95);
        sphere(.17,dark,g,side*.24,.09,.07,1);
      }
      // Attrezzo distintivo del mestiere, sempre integrato nel design del Sognatore.
      if(id==="milkkeeper"){
        cylinder(.16,.19,.42,mat("#c8d4df",.35,{metalness:.45}),g,.62,.72,.12,10);
        cylinder(.12,.12,.035,accent,g,.62,.95,.12,10);
        sphere(.09,belly,g,.62,.72,.34,1);
      }else if(["barista","roaster","cafe-host"].includes(id)){
        cylinder(.13,.16,.28,belly,g,.62,.76,.12,10);
        cylinder(.11,.11,.025,accent,g,.62,.915,.12,10);
        const handle=addMesh(new THREE.TorusGeometry(.09,.018,6,12,Math.PI),belly,g,.76,.78,.12);handle.rotation.z=Math.PI/2;
      }else if(id==="merchant"||id==="town-cook"){
        box(.38,.38,.08,accent,g,-.52,.76,.12);
        sphere(.12,belly,g,-.52,.98,.12,1);
      }else if(id==="archivist"||id==="keeper"){
        box(.34,.42,.1,mat("#8a6749"),g,.56,.76,.05);
        box(.25,.31,.035,mat("#ead9b7"),g,.56,.76,.11);
        for(let k=0;k<3;k++)box(.18,.025,.02,accent,g,.56,.84-k*.08,.14);
      }else if(id==="guard"||id==="town-carpenter"){
        const tool=cylinder(.035,.045,.9,mat("#8a5938"),g,.62,.85,.04,7);tool.rotation.z=-.25;
        box(.28,.16,.1,mat("#aebbc1"),g,.62,1.3,.04);
      }else{
        for(let k=0;k<3;k++){const leafBit=sphere(.09,accent,g,-.45+k*.18,1.28,.18,1);leafBit.scale.set(.55,1.45,.35);}
      }
      // Arabnite usa NPC low-poly leggeri per ridurre il carico della scena.
      const lightweightArabnite=["Adli","Biglia","Brama","Lumen","Ponce","Sanlegno","Trix","Vudele","Cervio","Gunvallo","Rullino"];
      if(lightweightArabnite.includes(name)){
        g.children.forEach(child=>{child.visible=false;});
        const mini=new THREE.Group();g.add(mini);
        const miniBody=mat(({Adli:"#17201c",Biglia:"#b72c25",Brama:"#f0c52e",Lumen:"#258bdc",Ponce:"#d9a34c",Sanlegno:"#a66a32",Trix:"#258bdc",Vudele:"#f28db9",Cervio:"#55c9f4",Gunvallo:"#9b4d20",Rullino:"#236de8"})[name]||baseColor);
        const miniLight=mat(({Adli:"#f7f4e9",Biglia:"#f2bd8b",Brama:"#ffe45c",Lumen:"#8bd4ff",Ponce:"#ffe0a1",Sanlegno:"#c9a078",Trix:"#8bd4ff",Vudele:"#ffd1e8",Cervio:"#e8f8ff",Gunvallo:"#d58a45",Rullino:"#43dcb2"})[name]||lightColor);
        if(name==="Ponce"){
          // Ponce è un cammello 3D: corpo robusto, gobba, collo arcuato e quattro zampe.
          const camelBody=new THREE.Mesh(new THREE.SphereGeometry(.62,10,8),miniBody);camelBody.position.set(0,.91,-.02);camelBody.scale.set(1.55,.88,.94);mini.add(camelBody);
          const hump=new THREE.Mesh(new THREE.SphereGeometry(.38,9,7),mat("#b98238"));hump.position.set(0,1.55,-.12);hump.scale.set(1.02,1.35,.92);mini.add(hump);
          const neck=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.62,3,7),miniBody);neck.position.set(0,1.55,.43);neck.rotation.x=-.28;neck.rotation.z=-.12;mini.add(neck);
          const camelHead=new THREE.Mesh(new THREE.SphereGeometry(.2,8,7),miniLight);camelHead.position.set(0,2.03,.62);camelHead.scale.set(1.05,.9,1.28);mini.add(camelHead);
          const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.19,8,6),mat("#e8bd83"));muzzle.position.set(0,1.91,.86);muzzle.scale.set(.88,.62,1.1);mini.add(muzzle);
          for(const side of [-1,1]){
            const ear=new THREE.Mesh(new THREE.ConeGeometry(.075,.25,5),miniLight);ear.position.set(side*.2,2.27,.52);ear.rotation.z=side*-.28;mini.add(ear);
            const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,6,5),dark);eye.position.set(side*.18,2.08,.76);mini.add(eye);
            const frontLeg=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.42,2,5),miniBody);frontLeg.position.set(side*.38,.34,.31);mini.add(frontLeg);
            const rearLeg=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.4,2,5),miniBody);rearLeg.position.set(side*.38,.34,-.38);mini.add(rearLeg);
            const hoof=new THREE.Mesh(new THREE.BoxGeometry(.2,.11,.24),mat("#4b3428"));hoof.position.set(side*.38,.09,.34);mini.add(hoof);
            const rearHoof=new THREE.Mesh(new THREE.BoxGeometry(.2,.11,.24),mat("#4b3428"));rearHoof.position.set(side*.38,.09,-.35);mini.add(rearHoof);
          }
          const tail=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.34,2,5),miniBody);tail.position.set(0,.72,-.88);tail.rotation.x=-.35;mini.add(tail);
          const tailTuft=new THREE.Mesh(new THREE.SphereGeometry(.09,6,5),dark);tailTuft.position.set(0,.5,-1.02);mini.add(tailTuft);
          const saddle=new THREE.Mesh(new THREE.BoxGeometry(.78,.16,.72),mat("#8d3e32"));saddle.position.set(0,1.48,-.08);mini.add(saddle);
          const saddleTrim=new THREE.Mesh(new THREE.BoxGeometry(.84,.055,.76),mat("#e8bd68"));saddleTrim.position.set(0,1.56,-.08);mini.add(saddleTrim);
          const bridle=new THREE.Mesh(new THREE.TorusGeometry(.25,.025,5,16),mat("#6b3b2a"));bridle.position.set(0,1.96,.78);mini.add(bridle);
        }else{
          const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.48,2,5),miniBody);body.position.y=.72;
          const bodyShapes={Biglia:[1.22,1.02,.92],Brama:[1.02,1.12,.9],Lumen:[.82,1.3,.78],Sanlegno:[1.16,1.22,1.02],Trix:[.86,1.18,.82],Vudele:[1.28,.92,1.05]};
          const bodyShape=bodyShapes[name]||[1,1,1];body.scale.set(...bodyShape);mini.add(body);
          const head=new THREE.Mesh(new THREE.SphereGeometry(.31,7,5),miniLight);head.position.set(0,1.42,.035);
          const headShapes={Biglia:[1.12,1.02,.9],Brama:[1.18,.88,1],Lumen:[.92,1.12,.92],Sanlegno:[1.02,1.08,.95],Trix:[.92,1.02,.92],Vudele:[1.12,1.04,1.08]};
          head.scale.set(...(headShapes[name]||[1,1,1]));mini.add(head);
          const face=new THREE.Mesh(new THREE.SphereGeometry(.19,6,4),belly);face.scale.set(1,.65,.5);face.position.set(0,1.34,.27);mini.add(face);
          const genericParts=[body,head,face];
          for(const side of [-1,1]){
            const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,5,4),dark);eye.position.set(side*.105,1.48,.285);mini.add(eye);genericParts.push(eye);
            const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.24,1,4),miniBody);leg.position.set(side*.17,.2,.015);mini.add(leg);genericParts.push(leg);
          }
          if(["Adli","Brama","Lumen","Sanlegno","Trix","Vudele"].includes(name))genericParts.forEach(part=>{part.visible=false;});
        }
        if(name==="Cervio"){
          for(const side of [-1,1]){const antler=new THREE.Mesh(new THREE.ConeGeometry(.075,.48,5),miniLight);antler.position.set(side*.19,1.88,-.01);antler.rotation.z=side*-.2;mini.add(antler);}
        }else if(name==="Gunvallo"){
          const hat=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.09,7),dark);hat.position.set(0,1.72,.02);mini.add(hat);
        }else if(name==="Rullino"){
          const beak=new THREE.Mesh(new THREE.ConeGeometry(.12,.22,5),mat("#ff861c"));beak.position.set(0,1.3,.38);beak.rotation.x=Math.PI/2;mini.add(beak);
        }else if(name==="Biglia"){
          const crest=new THREE.Mesh(new THREE.ConeGeometry(.2,.42,6),mat("#f4c64f"));crest.position.set(0,1.83,-.02);mini.add(crest);
          const shield=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.1,8),mat("#f4c64f"));shield.position.set(.39,.88,.18);shield.rotation.x=Math.PI/2;mini.add(shield);
          const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.13),mat("#b72c25"));gem.position.set(.39,.88,.25);mini.add(gem);
        }else if(name==="Adli"){
          // Mago-albero: tronco di abete spoglio, testa nera tonda e cappello bianco/blu.
          const trunk=mat("#315c43"),black=mat("#101116"),blue=mat("#315bca"),white=mat("#f5f5f1");
          for(let tier=0;tier<3;tier++){const bough=new THREE.Mesh(new THREE.ConeGeometry(.56-tier*.11,.78,7),trunk);bough.position.set(0,.62+tier*.38,0);mini.add(bough);}
          const head=new THREE.Mesh(new THREE.SphereGeometry(.35,10,8),black);head.position.set(0,1.92,.03);mini.add(head);
          for(const side of [-1,1]){
            const eyeWhite=new THREE.Mesh(new THREE.SphereGeometry(.105,8,6),white);eyeWhite.position.set(side*.14,1.96,.335);mini.add(eyeWhite);
            const spiralCurve=new THREE.CatmullRomCurve3(Array.from({length:28},(_,i)=>{const t=i/27*Math.PI*4,r=.012+t*.012;return new THREE.Vector3(side*.14+Math.cos(t)*r,1.96+Math.sin(t)*r,.43);}));
            mini.add(new THREE.Mesh(new THREE.TubeGeometry(spiralCurve,36,.018,5,false),blue));
          }
          const hatBrim=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.09,12),white);hatBrim.position.set(0,2.28,0);mini.add(hatBrim);
          const hat=new THREE.Mesh(new THREE.ConeGeometry(.39,.88,9),blue);hat.position.set(0,2.73,0);hat.rotation.z=-.12;mini.add(hat);
          const hatBand=new THREE.Mesh(new THREE.TorusGeometry(.32,.045,6,16),white);hatBand.position.set(0,2.43,0);mini.add(hatBand);
          const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.52,2,6),black);arm.position.set(.58,.98,.05);arm.rotation.z=-.85;mini.add(arm);
          const hand=new THREE.Mesh(new THREE.SphereGeometry(.11,7,6),black);hand.position.set(.83,1.25,.12);mini.add(hand);
          const wand=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.62,7),mat("#6b4930"));wand.position.set(.94,1.57,.15);wand.rotation.z=-.2;mini.add(wand);
          const spark=new THREE.Mesh(new THREE.OctahedronGeometry(.07),white);spark.position.set(.94,1.91,.15);mini.add(spark);
        }else if(name==="Brama"){
          // Demone-borsello di gemme: corpo blu/giallo, corna e testa a lanterna con occhi di biglia.
          const sack=new THREE.Mesh(new THREE.SphereGeometry(.5,9,7),mat("#2458b9"));sack.position.set(0,.92,0);sack.scale.set(1.05,1.25,.86);mini.add(sack);
          const bellyGem=new THREE.Mesh(new THREE.SphereGeometry(.39,9,7),mat("#f3cc35"));bellyGem.position.set(0,.94,.35);bellyGem.scale.set(1,.9,.35);mini.add(bellyGem);
          for(let i=0;i<9;i++){const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.13+(i%3)*.025),mat(i%2?"#56b6ff":"#f6d447"));const a=i*2.399;gem.position.set(Math.cos(a)*.37,.72+(i%4)*.19,.46+Math.sin(a)*.08);mini.add(gem);}
          const lantern=new THREE.Mesh(new THREE.SphereGeometry(.42,9,7),mat("#f3ca36",.12,{metalness:.15}));lantern.position.set(0,1.83,.04);lantern.scale.set(1,.96,.9);mini.add(lantern);
          for(const side of [-1,1]){
            const horn=new THREE.Mesh(new THREE.ConeGeometry(.13,.55,6),mat("#2458b9"));horn.position.set(side*.31,2.29,-.02);horn.rotation.z=side*-.32;mini.add(horn);
          }
          const eyeRed=new THREE.Mesh(new THREE.SphereGeometry(.145,8,7),mat("#d83a36"));eyeRed.position.set(-.16,1.86,.39);mini.add(eyeRed);
          const eyeYellow=new THREE.Mesh(new THREE.SphereGeometry(.145,8,7),mat("#ffe45c"));eyeYellow.position.set(.16,1.86,.39);mini.add(eyeYellow);
          for(const eye of [eyeRed,eyeYellow]){const pupil=new THREE.Mesh(new THREE.SphereGeometry(.05,6,5),mat("#171322"));pupil.position.set(eye.position.x,eye.position.y,.52);mini.add(pupil);}
          const mouth=new THREE.Mesh(new THREE.BoxGeometry(.22,.055,.04),mat("#37212a"));mouth.position.set(0,1.61,.4);mini.add(mouth);
        }else if(name==="Lumen"||name==="Trix"){
          // Lumen è la gatta blu bipede; Trix la sua piccola evoluzione quadrupede.
          const blueFur=mat("#2189df"),blueLight=mat("#75c8ff"),innerEar=mat("#f5a8ce"),darkEye=mat("#10223e");
          const small=name==="Trix",scale=small?.78:1;
          const cat=new THREE.Group();mini.add(cat);cat.scale.setScalar(scale);
          const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.29,.62,3,8),blueFur);torso.position.set(0,.92,0);torso.scale.set(1,.92,.9);cat.add(torso);
          const catHead=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),blueFur);catHead.position.set(0,1.78,.08);catHead.scale.set(1.1,1,.9);cat.add(catHead);
          const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),blueLight);muzzle.position.set(0,1.66,.36);muzzle.scale.set(1,.65,.55);cat.add(muzzle);
          for(const side of [-1,1]){
            const ear=new THREE.Mesh(new THREE.ConeGeometry(.16,.48,6),blueFur);ear.position.set(side*.22,2.15,.02);ear.rotation.z=side*-.18;cat.add(ear);
            const inner=new THREE.Mesh(new THREE.ConeGeometry(.075,.29,5),innerEar);inner.position.set(side*.22,2.16,.12);inner.rotation.z=side*-.18;cat.add(inner);
            const eye=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),darkEye);eye.position.set(side*.14,1.83,.39);cat.add(eye);
            const shine=new THREE.Mesh(new THREE.SphereGeometry(.025,6,5),white);shine.position.set(side*.12,1.86,.45);cat.add(shine);
            const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.36,2,6),blueFur);leg.position.set(side*.19,.31,.08);cat.add(leg);
            const paw=new THREE.Mesh(new THREE.SphereGeometry(.11,7,6),blueLight);paw.position.set(side*.19,.1,.12);cat.add(paw);
          }
          const tailCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.66,-.22),new THREE.Vector3(.32,.55,-.48),new THREE.Vector3(.46,.9,-.72),new THREE.Vector3(.28,1.18,-.8)]);
          cat.add(new THREE.Mesh(new THREE.TubeGeometry(tailCurve,22,.075,7,false),blueFur));
          if(small){
            // La mini-evoluzione cammina a quattro zampe e ha corpo più basso e allungato.
            torso.scale.set(1.5,.62,1);torso.position.set(0,.66,-.06);catHead.position.set(0,1.15,.48);
            muzzle.position.set(0,1.04,.77);
            for(const child of cat.children){if(child.geometry?.type==="CapsuleGeometry"&&child!==torso)child.visible=false;}
            for(const side of [-1,1])for(const z of [-.34,.38]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.34,2,6),blueFur);leg.position.set(side*.23,.3,z);cat.add(leg);const paw=new THREE.Mesh(new THREE.SphereGeometry(.1,7,6),blueLight);paw.position.set(side*.23,.1,z+.04);cat.add(paw);}
          }else{
            for(const side of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.4,2,6),blueFur);arm.position.set(side*.39,1.02,.04);arm.rotation.z=side*-.18;cat.add(arm);}
          }
        }else if(name==="Sanlegno"){
          // Un bastoncino di palo santo vivo, con braci e fiamme avvolte intorno al legno.
          const wood=mat("#9b6537"),grain=mat("#4b3025"),ember=mat("#ff7a22",.15,{emissive:"#ff4b13",emissiveIntensity:1.4}),flame=mat("#ffb21f",.12,{emissive:"#ff6b12",emissiveIntensity:1.3}),hot=mat("#ffe76a",.1,{emissive:"#ffb62d",emissiveIntensity:1.5});
          const stick=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,1.72,7),wood);stick.position.set(0,.98,0);stick.rotation.z=-.1;mini.add(stick);
          for(let i=0;i<4;i++){const line=new THREE.Mesh(new THREE.CylinderGeometry(.012,.018,1.3,5),grain);line.position.set(-.12+i*.08,.98,.205);line.rotation.z=-.1;mini.add(line);}
          const face=new THREE.Mesh(new THREE.SphereGeometry(.12,7,6),grain);face.position.set(0,1.12,.22);face.scale.set(1,.72,.45);mini.add(face);
          for(const side of [-1,1]){const fire=new THREE.Mesh(new THREE.ConeGeometry(.18,.68,6),flame);fire.position.set(side*.19,1.96,.02);fire.rotation.z=side*.32;mini.add(fire);}
          for(let i=0;i<3;i++){const fire=new THREE.Mesh(new THREE.ConeGeometry(.13,.52,6),i===1?hot:ember);fire.position.set((i-1)*.17,2.35+(i%2)*.12,-.02);fire.rotation.z=(i-1)*-.25;mini.add(fire);}
          const coal=new THREE.Mesh(new THREE.SphereGeometry(.13,7,6),ember);coal.position.set(0,.2,.08);mini.add(coal);
        }else if(name==="Vudele"){
          // Elefantessa rosa, bambola voodoo cucita e lecca-lecca in mano.
          const pink=mat("#f18bb7"),pinkLight=mat("#ffc0d8"),seam=mat("#8b456a"),white=mat("#fff0e5");
          const body=new THREE.Mesh(new THREE.SphereGeometry(.48,10,8),pink);body.position.set(0,.85,0);body.scale.set(1.05,1.1,.88);mini.add(body);
          const head=new THREE.Mesh(new THREE.SphereGeometry(.4,10,8),pink);head.position.set(0,1.62,.08);mini.add(head);
          for(const side of [-1,1]){const ear=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),pinkLight);ear.position.set(side*.48,1.63,-.02);ear.scale.set(1.15,.72,.28);mini.add(ear);const stitch=new THREE.Mesh(new THREE.TorusGeometry(.19,.018,5,14),seam);stitch.position.set(side*.48,1.63,.08);mini.add(stitch);}
          const trunkCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.55,.42),new THREE.Vector3(.04,1.3,.68),new THREE.Vector3(.12,1.05,.72),new THREE.Vector3(.28,1.08,.72)]);
          mini.add(new THREE.Mesh(new THREE.TubeGeometry(trunkCurve,18,.12,8,false),pink));
          for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.055,7,6),seam);eye.position.set(side*.15,1.72,.43);mini.add(eye);const tusk=new THREE.Mesh(new THREE.ConeGeometry(.055,.22,5),white);tusk.position.set(side*.16,1.38,.42);tusk.rotation.x=Math.PI;mini.add(tusk);}
          // Cuciture a X sulla pancia e sugli arti.
          for(let i=0;i<3;i++){const stitch=new THREE.Mesh(new THREE.BoxGeometry(.045,.045,.025),seam);stitch.position.set(-.1+i*.1,.88,.43);stitch.rotation.z=Math.PI/4;mini.add(stitch);}
          const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.06,.42,2,6),pink);arm.position.set(.53,.92,.06);arm.rotation.z=-.65;mini.add(arm);
          const stick=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.58,7),mat("#e8e0d4"));stick.position.set(.83,1.16,.16);stick.rotation.z=-.2;mini.add(stick);
          const candy=new THREE.Mesh(new THREE.SphereGeometry(.22,9,7),mat("#f6f3f0"));candy.position.set(.83,1.52,.16);mini.add(candy);
          const swirl=new THREE.Mesh(new THREE.TorusGeometry(.13,.035,6,16),mat("#e94f91"));swirl.position.set(.83,1.52,.37);mini.add(swirl);
        }else if(name==="Ponce"){
          // Il modello del cammello è completo nel ramo dedicato sopra.
        }else{
          const crest=new THREE.Mesh(new THREE.ConeGeometry(.13,.25,5),accent);crest.position.y=1.78;mini.add(crest);
        }
        // Piccolo ritratto ufficiale integrato nel modello 3D: conserva la silhouette
        // personalizzata e rende immediatamente riconoscibile il Sognatore.
        mini.userData.isLightweightArabniteNpc=true;
      }
      g.userData.npcName=name;
      npcActors.push({group:g,baseY:0,phase:npcActors.length*1.7,leftArm:arms[0],rightArm:arms[1],headPivot,kind:id});
      if(!options.detached){addCollider(x,z,.48*scale);addInteraction(id,name+" · "+job,lines.join("\\n"),x,z,null,3.8);}
      return g;
    };
    // Cardinero: piccoli custodi dei giardini di Amargenta. Sono abitanti pacifici, non combattenti.
    const makeCardinero = (name,x,z,scale=1) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(scale);
      const dark=mat("#202637"), face=mat("#151d2d"), goldBody=mat("#e8ad19"), goldLight=mat("#ffd34a");
      const cream=mat("#f2d7a1"), leather=mat("#8a5938"), metal=mat("#aebbc1",.38,{metalness:.62});
      const red=mat("#d82e26"), white=mat("#fff2d7"), green=mat("#4d8b38"), petal=mat("#f5bd22");
      // Corpo segmentato da piccolo bruco-giardiniere.
      sphere(.42,dark,g,0,1.62,0,2).scale.set(1.12,1,.92);
      sphere(.31,face,g,0,1.72,.25,2).scale.set(1,.9,.7);
      for(const ex of [-.17,.17]){
        sphere(.145,red,g,ex,1.78,.48,1);
        sphere(.065,white,g,ex-.025,1.82,.535,1);
        sphere(.045,mat("#16131a"),g,ex,1.76,.55,1);
      }
      sphere(.16,red,g,0,1.52,.52,1);
      sphere(.31,goldLight,g,0,1.17,.2,2).scale.set(1.05,.58,.7);
      for(let i=0;i<4;i++){
        const seg=sphere(.29-i*.018,goldBody,g,.42+i*.39,.68-i*.025,-.02,1);
        seg.scale.set(1.08,.92,.95);
        sphere(.09,goldLight,g,.42+i*.39,.48-i*.025,.02,1);
      }
      // Salopette da giardiniere e bretelle.
      box(.52,.52,.12,cream,g,0,.92,.36);
      box(.58,.09,.08,leather,g,0,.64,.39);
      for(const sx of [-.2,.2]){
        const strap=box(.075,.47,.08,cream,g,sx,1.2,.4);strap.rotation.z=sx<0?-.25:.25;
        sphere(.055,goldLight,g,sx*1.08,1.37,.46,1);
      }
      // Cappello di paglia con margherita e coccinella.
      cylinder(.55,.58,.12,leather,g,0,2.12,0,12);
      const crown=sphere(.35,mat("#d9a34e"),g,0,2.29,0,2);crown.scale.set(1,.48,1);
      for(let k=0;k<7;k++){
        const a=k*Math.PI*2/7;
        sphere(.115,petal,g,.31+Math.cos(a)*.13,2.34+Math.sin(a)*.13,.18,1);
      }
      sphere(.12,white,g,.31,2.34,.2,1);sphere(.09,red,g,-.28,2.25,.18,1);
      for(let k=0;k<3;k++)sphere(.025,dark,g,-.32+k*.05,2.25,.255,1);
      // Braccia, paletta e annaffiatoio.
      const leftArm=box(.14,.43,.14,dark,g,-.43,1.02,.04);leftArm.rotation.z=-.42;
      const rightArm=box(.14,.43,.14,dark,g,.43,1.02,.04);rightArm.rotation.z=.42;
      const shovelHandle=cylinder(.035,.04,.48,leather,g,-.73,1.12,.26,6);shovelHandle.rotation.z=-.3;
      const blade=addMesh(new THREE.ConeGeometry(.16,.3,4),metal,g,-.82,1.4,.26);blade.rotation.z=Math.PI;
      cylinder(.16,.18,.25,metal,g,.58,.62,.42,10);
      const canBody=sphere(.23,metal,g,.58,.62,.42,2);canBody.scale.set(1,.78,.8);
      const spout=cylinder(.045,.07,.42,metal,g,.84,.7,.42,8);spout.rotation.z=-1.15;
      const handle=addMesh(new THREE.TorusGeometry(.16,.035,6,12,Math.PI),metal,g,.42,.72,.42);handle.rotation.z=Math.PI;
      // Vasetto con fiore sul dorso.
      cylinder(.22,.28,.3,mat("#b65e2f"),g,0,2.48,-.38,8);
      cylinder(.24,.3,.07,mat("#49372d"),g,0,2.65,-.38,8);
      cylinder(.045,.055,.48,green,g,0,2.91,-.38,6);
      const flowerPivot=new THREE.Group();g.add(flowerPivot);flowerPivot.position.set(0,3.15,-.38);
      for(let k=0;k<8;k++){const a=k*Math.PI/4;const bloom=sphere(.105,petal,flowerPivot,Math.cos(a)*.13,Math.sin(a)*.13,0,2);bloom.scale.set(.9,1.25,.65);}
      sphere(.085,mat("#7a4a2a"),flowerPivot,0,0,.04,2);
      // Piccole foglie luminose e una coccinella sulla salopette.
      for(let k=0;k<3;k++){const leafBit=sphere(.09,green,g,-.22+k*.22,1.48,.43,1);leafBit.scale.set(.55,1.45,.35);leafBit.rotation.z=(k-1)*-.42;}
      const ladybug=sphere(.075,red,g,.34,1.02,.42,2);ladybug.scale.set(1.15,.72,.55);
      sphere(.025,dark,g,.31,1.04,.47,1);sphere(.025,dark,g,.37,1.04,.47,1);
      npcActors.push({group:g,baseY:0,phase:npcActors.length*1.9,leftArm,rightArm,flowerPivot});
      addCollider(x,z,.5*scale);
      const cardineroId="cardinero";
      addInteraction("recruit-"+cardineroId,name+" · Cardinero",
        "Si prende cura dei giardini di Amargenta. È pacifico e non vuole combattere.",
        x,z,()=>{
          if(ownedAmargentaIdsRef.current.includes(cardineroId)){setDialogue({title:name+" · Cardinero",text:"Cardinero è già nella tua collezione."});return;}
          setDialogue({title:"Incontro · "+name,text:"Cardinero cura i giardini, le aiuole e i fiori di Amargenta. Non vuole lottare: preferisce far fiorire la città. Vuoi convincerlo a unirsi a te?",confirm:()=>{recruitAmargenta(cardineroId);setDialogue(null);}});
        },4.2);
      return g;
    };
    const makeMarketStall = (x,z,accent) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      const fabric=mat(accent,.96,{side:THREE.DoubleSide}),cream=mat("#f3dfbd",.96,{side:THREE.DoubleSide});
      box(5.8,.2,3.4,wood,g,0,.9,0);
      for(const sx of [-2.55,2.55])for(const sz of [-1.35,1.35])cylinder(.09,.12,3.45,wood,g,sx,1.72,sz,8);
      const canopy=addMesh(new THREE.ConeGeometry(3.65,1.15,4),fabric,g,0,3.55,0);canopy.rotation.y=Math.PI/4;canopy.scale.set(1.2,.8,.78);
      for(let side=0;side<4;side++){const angle=side*Math.PI/2;const stripe=box(1.65,.08,.035,side%2?cream:fabric,g,Math.cos(angle)*1.7,3.25,Math.sin(angle)*1.7);stripe.rotation.y=angle;}
      for(let i=0;i<8;i++){const goods=sphere(.16,i%2?gold:wood,g,-2.1+(i%4)*1.35,1.16+(i%2)*.12,.35+Math.floor(i/4)*.65,1);goods.scale.set(.9,1.2,.7);}
    };
    const makeVillageLantern = (x,z) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      cylinder(.09,.13,2.05,wood,g,0,1.02,0,8);
      box(.72,.12,.72,wood,g,0,2.12,0);
      box(.52,.66,.52,mat("#e6c995",.35,{emissive:"#b77b39",emissiveIntensity:.35,transparent:true,opacity:.82}),g,0,2.48,0);
      box(.82,.13,.82,wood,g,0,2.86,0);
      const cap=addMesh(new THREE.ConeGeometry(.62,.42,4),roof,g,0,3.12,0);cap.rotation.y=Math.PI/4;
      box(.07,.45,.07,coffeeRed,g,0,3.52,0);
      addCollider(x,z,.24);
    };
    const makeCherryTree = (x,z,s=1) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(s);
      cylinder(.2,.3,2.6,wood,g,0,1.3,0,7);
      const blossom=mat("#e8aeb5");
      for(let i=0;i<7;i++){
        const a=i*Math.PI*2/7;
        const crown=sphere(.88,blossom,g,Math.cos(a)*.58,2.75+(i%3)*.24,Math.sin(a)*.58,1);
        crown.scale.set(1.15,.78,1);
      }
      for(let i=0;i<9;i++){const a=i*2.399;sphere(.12,mat("#f4d4cb"),g,Math.cos(a)*.8,2.5+(i%4)*.25,Math.sin(a)*.8,1);}
      addCollider(x,z,.5*s);
    };
    const makeVillageFence = (x,z,length,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      box(length,.16,.18,wood,g,0,.58,0);box(length,.16,.18,wood,g,0,1.08,0);
      const count=Math.max(2,Math.floor(length/.8));
      for(let i=0;i<=count;i++){const px=-length/2+i*length/count;box(.14,1.35,.16,wood,g,px,.68,0);}
      addBoxCollider(x,z,length,.35,rotation);
    };
    const makeVillageSign = (x,z,label,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      box(.16,2.2,.16,wood,g,0,1.1,0);
      box(1.8,.78,.16,wood,g,0,2.12,.04);
      box(1.55,.52,.04,gold,g,0,2.12,.14);
      const mark=box(.28,.28,.05,coffeeRed,g,0,2.12,.18);mark.rotation.z=Math.PI/4;
      // Piccola targa leggibile anche da vicino, con simbolo del chicco.
      const plaque=box(1.45,.34,.035,mat("#ead9b7"),g,0,1.82,.16);
      plaque.material.side=THREE.DoubleSide;
      const emblem=sphere(.1,coffeeRed,g,0,2.12,.22,1);emblem.scale.set(.7,1.25,.35);
    };
    const makeStoneLantern = (x,z) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      box(.62,.38,.62,stone,g,0,.2,0);
      box(.42,1.05,.42,stoneLight,g,0,.88,0);
      box(.78,.18,.78,stone,g,0,1.48,0);
      const light=sphere(.18,mat("#ffd58b",.2,{emissive:"#d58c35",emissiveIntensity:.65}),g,0,1.72,0,2);
      addCollider(x,z,.32);
    };    const makeNoren = (x,z,color="#a64c36") => {
      const fabric=mat(color,.95,{side:THREE.DoubleSide});
      for(let i=0;i<3;i++){const panel=box(.52,.88,.07,fabric,scene,x-.54+i*.54,2.35,z);panel.rotation.z=(i-1)*-.035;}
      box(1.8,.12,.14,wood,scene,x,2.85,z);
    };
    const makeBench = (x,z,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      box(2.2,.18,.72,wood,g,0,.72,0);
      for(const px of [-.82,.82]){box(.18,.72,.18,darkStone,g,px,.36,0);box(.16,.68,.16,wood,g,px,.38,-.42);}
      box(2.2,.72,.16,wood,g,0,1.08,-.42);addCollider(x,z,.85,.95);
    };
    const makeFlowerBed = (x,z,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      box(3.2,.42,1.65,wood,g,0,.21,0);box(2.9,.12,1.35,mat("#59452f"),g,0,.48,0);
      for(let i=0;i<13;i++){const px=-1.25+(i%7)*.42,pz=-.4+Math.floor(i/7)*.75;cylinder(.035,.045,.5,leaf,g,px,.72,pz,5);sphere(.17,mat(["#d9a0a2","#e7c57f","#f0e5d0","#a5b68b"][i%4]),g,px,.99,pz,1);}
      addCollider(x,z,1.35,.58);
    };
    const makeWell = (x,z) => {
      cylinder(1.25,1.4,.8,stone,scene,x,.4,z,16);cylinder(1.02,1.02,.12,water,scene,x,.84,z,16);
      for(const px of [-1,1])box(.18,2.4,.18,wood,scene,x+px,1.9,z);
      box(2.45,.18,.22,wood,scene,x,3.1,z);
      const cap=addMesh(new THREE.ConeGeometry(1.6,.8,4),roof,scene,x,3.55,z);cap.rotation.y=Math.PI/4;
      cylinder(.055,.055,1.7,gold,scene,x,1.8,z,8);addCollider(x,z,1.4,3.9);
    };
    const makeBanner = (x,z,color="#a64c36",rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      box(.14,3.3,.14,wood,g,0,1.65,0);box(.18,.18,1.6,gold,g,0,3.1,0);
      box(1.15,1.9,.08,mat(color,.95,{side:THREE.DoubleSide}),g,0,2.05,.08);
      const emblem=sphere(.22,gold,g,0,2.15,.15,1);emblem.scale.set(.7,1.25,.3);addCollider(x,z,.22);
    };
    const makeWoodCart = (x,z,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      box(2.3,.22,1.45,wood,g,0,.95,0);
      for(const px of [-.9,.9])for(const pz of [-.62,.62])box(.16,.82,.16,wood,g,px,1.35,pz);
      box(2.35,.16,1.5,wood,g,0,1.8,0);
      for(const px of [-1.25,1.25]){const wheel=addMesh(new THREE.TorusGeometry(.48,.11,8,18),darkStone,g,px,.58,0);wheel.rotation.y=Math.PI/2;cylinder(.12,.12,.28,gold,g,px,.58,0,10).rotation.z=Math.PI/2;}
      addCollider(x,z,1.35,1.95);
    };
    const makeStoneSteps = (x,z,count=5,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      for(let i=0;i<count;i++){box(3.2,.22,.9,stoneLight,g,0,.11+i*.25,i*.88);box(3.35,.1,.12,darkStone,g,0,.25+i*.25,i*.88-.38);}
      addBoxCollider(x,z+count*.38,3.25,count*.88+.5,rotation,Math.max(1.1,count*.25+.25));
    };
    const makeWoodPergola = (x,z,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      for(const px of [-2.4,2.4])for(const pz of [-1.8,1.8])box(.22,3.5,.22,wood,g,px,1.75,pz);
      for(let i=0;i<7;i++)box(.18,.2,4.2,wood,g,-2.4+i*.8,3.45,0);
      box(5,.2,.22,wood,g,0,3.48,-1.8);box(5,.2,.22,wood,g,0,3.48,1.8);
      for(let i=0;i<12;i++){const a=i*2.399;const vine=sphere(.18,leaf,g,Math.cos(a)*2.1,2.8+(i%3)*.18,Math.sin(a)*1.5,1);vine.scale.set(1.5,.7,1);}
      for(const px of [-2.4,2.4])for(const pz of [-1.8,1.8])addCollider(x+px*Math.cos(rotation)+pz*Math.sin(rotation),z-px*Math.sin(rotation)+pz*Math.cos(rotation),.22,3.6);
    };
    const makeRockGarden = (x,z,seed=0) => {
      for(let i=0;i<9;i++){const a=i*2.399+seed,r=1.1+(i%3)*.7;const rock=sphere(.35+(i%3)*.12,i%2?stone:stoneLight,scene,x+Math.cos(a)*r,.18,z+Math.sin(a)*r,1);rock.scale.set(1.5,.7,1.1);}
      const shrub=sphere(.75,leaf,scene,x,.5,z,1);shrub.scale.set(1.4,.7,1);addCollider(x,z,1.5);
    };
    const makeNoticeBoard = (x,z,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      box(.18,2.4,.18,wood,g,-.72,1.2,0);box(.18,2.4,.18,wood,g,.72,1.2,0);
      box(1.8,1.5,.18,wood,g,0,2.15,0);box(1.52,1.18,.06,mat("#d8c39b"),g,0,2.15,.13);
      for(let i=0;i<3;i++){box(.82,.035,.035,coffeeRed,g,0,2.48-i*.28,.18);}
      box(2.05,.16,.28,wood,g,0,3.02,0);addCollider(x,z,.3,3.2);
    };
    const makeStringLights = (x1,z1,x2,z2,count=9) => {
      const points=[];
      for(let i=0;i<=12;i++){const t=i/12;points.push(new THREE.Vector3(x1+(x2-x1)*t,5.1-Math.sin(t*Math.PI)*1.15,z1+(z2-z1)*t));}
      const cable=new THREE.CatmullRomCurve3(points);
      addMesh(new THREE.TubeGeometry(cable,24,.035,5,false),darkStone,scene);
      for(let i=0;i<count;i++){
        const t=(i+.5)/count,p=cable.getPoint(t);
        cylinder(.045,.045,.35,gold,scene,p.x,p.y-.18,p.z,6);
        sphere(.13,mat("#ffd58b",.2,{emissive:"#d58c35",emissiveIntensity:.9}),scene,p.x,p.y-.43,p.z,1);
      }
    };

    const makeInterior = (cx,cz,doorSide="north") => {
      const floor=mat("#6e5745"), wall=mat("#b99a72"), beam=mat("#4b3028"), brass=mat("#c08b4e",.35,{metalness:.55});
      box(14,.35,12,floor,scene,cx,-.175,cz);
      const doorWidth=3.2, sideLength=(14-doorWidth)/2, sideOffset=(14+doorWidth)/4;
      if(doorSide==="north"){
        box(sideLength,4,.35,wall,scene,cx-sideOffset,2,cz-6);
        box(sideLength,4,.35,wall,scene,cx+sideOffset,2,cz-6);
      } else box(14,4,.35,wall,scene,cx,2,cz-6);
      box(.35,4,12,wall,scene,cx-7,2,cz);
      box(.35,4,12,wall,scene,cx+7,2,cz);
      if(doorSide==="south"){
        box(sideLength,4,.35,wall,scene,cx-sideOffset,2,cz+6);
        box(sideLength,4,.35,wall,scene,cx+sideOffset,2,cz+6);
      } else box(14,4,.35,wall,scene,cx,2,cz+6);
      for(let x=-6;x<=6;x+=3){
        if(!(doorSide==="north"&&x===0))box(.22,4,.28,beam,scene,cx+x,2,cz-5.72);
        if(!(doorSide==="south"&&x===0))box(.22,4,.28,beam,scene,cx+x,2,cz+5.72);
      }
      for(let x=-5;x<=5;x+=5){if(x!==0)box(.2,4,11,beam,scene,cx+x,2,cz);}
      for(let i=0;i<5;i++){box(1.8,.35,.55,beam,scene,cx-5.3+i*2.5,2.2,cz-4.8);for(let j=0;j<3;j++)box(.38,.48,.38,j%2?gold:wood,scene,cx-5+i*2.5,2.58,cz-4.8+j*.12);}
      box(3,.25,2.2,wood,scene,cx+2,.95,cz+1);
      cylinder(.72,.85,1.6,brass,scene,cx+2,1.85,cz+1,16);
      cylinder(.55,.68,.25,gold,scene,cx+2,2.75,cz+1,16);
      for(let i=0;i<4;i++){const pipe=cylinder(.09,.09,3,brass,scene,cx-4+i*1.1,2.7,cz+2,8);pipe.rotation.z=Math.PI/2;}
      for(let i=0;i<4;i++){const sack=sphere(.58,mat("#a88a61"),scene,cx-4+i*1.25,.55,cz+4,1);sack.scale.set(.8,1.1,.8);}
      makeLamp(cx-3,cz-2);makeLamp(cx+4,cz-3);
      addInteriorWallColliders(cx,cz,14,12,doorSide);
    };


    const makeCafeInterior = (cx,cz) => {
      const floor=mat("#826448"), plaster=mat("#d2b88e"), darkWood=mat("#4b3028"), redFabric=mat("#a64d38");
      box(15,.35,13,floor,scene,cx,-.175,cz);
      const doorWidth=3.2, sideLength=(15-doorWidth)/2, sideOffset=(15+doorWidth)/4;
      box(sideLength,4,.35,plaster,scene,cx-sideOffset,2,cz-6.5);
      box(sideLength,4,.35,plaster,scene,cx+sideOffset,2,cz-6.5);
      box(15,4,.35,plaster,scene,cx,2,cz+6.5);
      box(.35,4,13,plaster,scene,cx-7.5,2,cz);box(.35,4,13,plaster,scene,cx+7.5,2,cz);
      for(let i=0;i<3;i++){
        box(3,.18,1.7,darkWood,scene,cx-4+i*4,1.05,cz+1.8);
        for(const dx of [-1.1,1.1])for(const dz of [-.5,.5])cylinder(.09,.1,.72,darkWood,scene,cx-4+i*4+dx,.42,cz+1.8+dz,8);
        for(const dx of [-1,1])cylinder(.07,.08,.62,redFabric,scene,cx-4+i*4+dx,1.48,cz+1.8,8);
      }
      box(11,1.1,1.1,darkWood,scene,cx,1.1,cz-4.6);
      box(11,.12,1.15,gold,scene,cx,1.72,cz-4.6);
      for(let i=0;i<4;i++){cylinder(.32,.38,.65,wood,scene,cx-4+i*2.6,.38,cz-2.9,10);cylinder(.34,.38,.12,mat("#b88b5a"),scene,cx-4+i*2.6,.76,cz-2.9,10);}
      box(2.3,1.25,.85,gold,scene,cx+3,2.25,cz-4.25);
      box(2.1,.3,.9,darkWood,scene,cx+3,1.55,cz-4.25);
      for(let i=0;i<3;i++){cylinder(.09,.09,.65,gold,scene,cx+2.3+i*.7,1.55,cz-3.7,8);cylinder(.22,.22,.12,mat("#f1dfbd"),scene,cx+2.3+i*.7,1.17,cz-3.7,12);}
      for(let i=0;i<6;i++){box(2.4,.16,.3,darkWood,scene,cx-5.8,1.5+i*.62,cz+4.5);for(let j=0;j<4;j++)cylinder(.13,.16,.34,j%2?gold:wood,scene,cx-6.5+j*.42,1.78+i*.62,cz+4.5,8);}
      for(let i=0;i<4;i++){sphere(.18,mat("#ffd58b",.25,{emissive:"#d58c35",emissiveIntensity:1.1}),scene,cx-5+i*3.3,3.35,cz,2);cylinder(.035,.035,.8,darkWood,scene,cx-5+i*3.3,3.75,cz,6);}
      addInteriorWallColliders(cx,cz,15,13,"north");
    };

    const makeWaterfall = (x,z,h=9) => {
      const fall=box(3.2,h,.18,water,scene,x,h/2,z);
      fall.material=water; fall.material.transparent=true; fall.material.opacity=.82;
      for(let i=0;i<5;i++) sphere(.7,water,scene,x-1.5+i*.7,.25,z+1,1);
    };

    try {
      scene=new THREE.Scene();scene.background=new THREE.Color("#c7dfdf");scene.fog=new THREE.Fog("#c7dfdf",92,235);
arabniteScene=new THREE.Scene();arabniteScene.background=new THREE.Color("#171326");arabniteScene.fog=new THREE.FogExp2("#171326",0.0065); const arabniteWorld=new THREE.Group();arabniteWorld.name="ArabniteWorld";arabniteScene.add(arabniteWorld);
      const compactDevice=window.matchMedia("(max-width: 720px)").matches;
      const width=Math.max(1,host.clientWidth||window.innerWidth||800);
      const height=Math.max(1,host.clientHeight||window.innerHeight||600);
      // Alcuni browser/driver non concedono un contesto WebGL con antialias o profilo high-performance.
      // Ritentiamo con un contesto essenziale prima di dichiarare la scena non disponibile.
      let rendererError=null;
      for(const options of [
        {antialias:true,powerPreference:"high-performance",alpha:false,depth:true,stencil:false},
        {antialias:false,powerPreference:"low-power",alpha:false,depth:true,stencil:false,preserveDrawingBuffer:false},
        {antialias:false,powerPreference:"default",alpha:false,depth:true,stencil:false}
      ]){
        try { renderer=new THREE.WebGLRenderer(options); break; }
        catch(error){ rendererError=error; console.warn("Amargenta WebGL retry:",error); }
      }
      if(!renderer) throw new Error("WebGL non disponibile: "+(rendererError?.message||"impossibile creare il contesto grafico"));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,compactDevice?1:1.35));
      renderer.setSize(width,height,false);
      camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 260);
      renderer.domElement.style.display="block";renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";renderer.domElement.style.touchAction="none";
      // Ombre disattivate per una resa pulita e un rendering più leggero.
      renderer.shadowMap.enabled=false;
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.setClearColor("#b7cbd0",1);
      renderer.domElement.addEventListener("webglcontextlost",(event)=>{event.preventDefault();setHint("Sto ripristinando la grafica: la tua posizione e i progressi restano salvati.");});
      renderer.domElement.addEventListener("webglcontextrestored",()=>{setHint("");if(camera)cameraReady=false;});
      host.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight("#f2fbff","#52664b",1.9));
      arabniteScene.add(new THREE.HemisphereLight("#c8c4ff","#4d2e28",2.15));
      const arabMoon=new THREE.DirectionalLight("#ffe0ad",2.7);arabMoon.position.set(165,75,45);arabniteScene.add(arabMoon);
      const arabFill=new THREE.PointLight("#8a72ff",95,95,2);arabFill.position.set(178,18,28);arabniteScene.add(arabFill);
      const sun=new THREE.DirectionalLight("#fff1d7",2.35);sun.position.set(-35,55,25);scene.add(sun);
      const warmFill=new THREE.DirectionalLight("#ffd6a0",.62);warmFill.position.set(35,18,-30);scene.add(warmFill);
      const skyFill=new THREE.DirectionalLight("#b9dfff",.34);skyFill.position.set(-8,22,48);scene.add(skyFill);
      // Fondovalle stabile: personaggio, NPC e arredi condividono la stessa quota.
      // Il dislivello resta concentrato nelle terrazze, collegate dalle rampe percorribili.
      const terrainGeo=new THREE.PlaneGeometry(240,240,120,120);terrainGeo.rotateX(-Math.PI/2);
      const pos=terrainGeo.attributes.position;
      for(let i=0;i<pos.count;i++)pos.setY(i,0);
      terrainGeo.computeVertexNormals();addMesh(terrainGeo,groundMat,scene,0,0,0);
      for(let i=0;i<12;i++) makeMountain(-65+(i%4)*42,-68-Math.floor(i/4)*12,12+(i%3)*5,26+(i%4)*9,i);
      // Fiume e gola orientati da nord a sud, a est del borgo.
      const river=addMesh(new THREE.PlaneGeometry(12,100,1,1),water,scene,28,.05,2);river.rotation.x=-Math.PI/2;river.rotation.z=.08;
      // Sponde erbose e ciottoli levigati per dare profondità al corso d'acqua.
      for(let i=0;i<22;i++){
        const z=-46+i*4.2,wiggle=Math.sin(i*1.7)*1.6;
        for(const side of [-1,1]){
          const bank=sphere(.72,i%2?leaf:leaf2,scene,28+side*(7.1+wiggle*.2),.12,z,1);
          bank.scale.set(1.8,.38,.72);
          if(i%3===0){
            const pebble=sphere(.42,stoneLight,scene,28+side*(6.2+wiggle*.2),.16,z+1,1);
            pebble.scale.set(1.3,.55,.8);
          }
        }
      }
      for(let i=0;i<7;i++){sphere(1.2,stoneLight,scene,22+Math.sin(i*2)*3,.2,-35+i*11,1);}
      makeWaterfall(31,-25,9);makeWaterfall(29,24,7);makeBridge(26,0,15);makeBridge(26,-32,15);


      const road=addMesh(new THREE.PlaneGeometry(13,75),pathMat,scene,-28,.04,4);road.rotation.x=-Math.PI/2;road.rotation.z=Math.PI/2;
      // Solchi dei carri e pietre di bordo lungo la strada d'ingresso.
      for(const offset of [-2.1,2.1]){
        const rut=addMesh(new THREE.PlaneGeometry(.18,69),mat("#8e7658"),scene,-28+offset,.055,4);rut.rotation.x=-Math.PI/2;rut.rotation.z=Math.PI/2;
      }
      for(let i=0;i<18;i++){
        const z=-30+i*4;
        for(const x of [-35,-21]){
          const edge=sphere(.22,stoneLight,scene,x,.12,z,1);edge.scale.set(1.6,.45,.8);
        }
      }
      makeWall(-38,-8,15,2.2,Math.PI/2);makeWall(-38,12,15,2.2,Math.PI/2);
      // Portale d'ingresso in legno, ispirato ai portali dei villaggi di Hisui.
      const oldGate=addMesh(new THREE.TorusGeometry(2.5,.48,8,24,Math.PI),stoneLight,scene,-38,3,2);oldGate.visible=false;
      for(const gx of [-42,-34]){
        box(.72,5.4,.72,wood,scene,gx,2.7,2);
        box(.92,.28,.92,gold,scene,gx,5.15,2);
      }
      box(10.2,.72,1.05,wood,scene,-38,5.25,2);
      box(8.8,.3,1.2,darkStone,scene,-38,5.72,2);
      const gateCrest=addMesh(new THREE.ConeGeometry(1.2,.72,4),roof,scene,-38,6.22,2);gateCrest.rotation.y=Math.PI/4;
      box(3.2,.7,.18,mat("#d9c49c"),scene,-38,4.35,2.55);
      box(2.7,.12,.08,coffeeRed,scene,-38,4.35,2.67);
      for(let i=0;i<5;i++)sphere(.1,gold,scene,-39+i*.5,4.35,2.75,1);
      makeVillageLantern(-43,7);makeVillageLantern(-33,7);
      // Terrazze a gradoni sul lato nord e sud
      for(let l=0;l<3;l++){
        makeTerrace(-22,-36-l*12,25,9,l,l===0?"south":l===1?"east":"north");
        makeTerrace(-18,39+l*10,28,9,l,l===0?"north":l===1?"east":"south");
      }
      // Rampe percorribili che collegano fisicamente i tre livelli delle terrazze.
      makeWalkRamp([-22,-40.5],[-22,-48],6,.175,1.625);
      makeWalkRamp([-22,-52.5],[-22,-60],6,1.625,3.075);
      makeWalkRamp([-18,43.5],[-18,49],6,.175,1.625);
      makeWalkRamp([-18,53.5],[-18,59],6,1.625,3.075);
      // Borgo superiore: torre, case, vicoli e piazzetta alta
      for(let y=0;y<3;y++)box(.6,1.2,.1,darkStone,scene,-8,3+y*3,-23.35);
      // Piazza centrale: pavimentazione in pietra, fontana e lanterne tradizionali.
      const plaza=addMesh(new THREE.CylinderGeometry(13,13,.4,48),pathMat,scene,0,.05,0);plaza.scale.z=.72;
      makeFountain(0,.5);
      for(let i=0;i<10;i++){const a=i*Math.PI*2/10;makeStoneLantern(Math.cos(a)*10,Math.sin(a)*7.5);}
      makeWell(-8,7);makeBench(-10,-5,Math.PI/2);makeBench(10,-5,-Math.PI/2);
      makeFlowerBed(-12,0,Math.PI/2);makeFlowerBed(12,0,Math.PI/2);
      makeNoticeBoard(-16,-8,Math.PI/2);
      makeStringLights(-12,-11,12,11,13);makeStringLights(-14,8,14,-8,11);
      makeWoodPergola(0,13,0);makeRockGarden(-15,-16,1);makeRockGarden(16,17,2);
      makeBanner(-13,-12,"#a64c36",Math.PI/2);makeBanner(13,12,"#526d58",Math.PI/2);
      // Piccolo padiglione civico: edificio simbolo visibile dalla piazza.
      makeNoren(-1,-19.35,"#536d58");
      makeVillageSign(7,-22,"Piazza del Chicco",Math.PI/2);
      makeStoneLantern(-7,-22);makeStoneLantern(7,-22);
      for(const dx of [-3.8,3.8])box(.24,3.6,.24,wood,scene,-1+dx,1.8,-19.3);
      // Pietre di bordo e aiuole che incorniciano il centro del villaggio.
      for(let i=0;i<16;i++){
        const a=i*Math.PI/8,px=Math.cos(a)*15.5,pz=Math.sin(a)*11.5;
        const pebble=sphere(.42, i%2?stoneLight:stone,scene,px,.2,pz,1);pebble.scale.set(1.4,.55,.8);
        if(i%2===0)makeCoffeePlant(px*1.08,pz*1.08,.72);
      }
      makeNoren(12,-10.35,"#567b68");makeNoren(15,15.65,"#a64c36");
      // Dettagli da villaggio di Hisui: vialetti, lanterne, recinti e alberi in fiore.
      const villagePath=mat("#b89b75");
      for(const [x,z,w,d] of [[0,-13,5,25],[0,13,5,24],[-14,0,20,4],[14,0,20,4],[-24,-8,4,18],[22,8,4,20]]){
        const p=addMesh(new THREE.PlaneGeometry(w,d),villagePath,scene,x,.075,z);p.rotation.x=-Math.PI/2;
      }
      for(const [x,z] of [[-15,-8],[-15,8],[15,-8],[15,8],[-5,-18],[5,18],[25,-14],[25,18]])makeVillageLantern(x,z);
      makeCherryTree(-31,-12,1.15);makeCherryTree(31,12,1.05);makeCherryTree(-31,22,.9);
      makeVillageFence(-28,-2,12,Math.PI/2);
      makeVillageFence(-28,15,10,Math.PI/2);
      makeBench(-20,-15,.2);makeBench(20,18,-.2);
      makeFlowerBed(-24,9,.2);makeFlowerBed(24,-10,-.2);
      makeBanner(-18,26,"#b9824d",Math.PI/2);makeBanner(20,-23,"#9b4936",Math.PI/2);
      makeVillageSign(-19,-3,"Piazza",Math.PI/2);
      makeVillageSign(31,5,"Fiume",Math.PI/2);
      makeVillageSign(-31,29,"Terrazze",Math.PI/2);
      // Distretto produttivo e magazzini a sud-est
      // Muretti, scale e terrazzamenti di collegamento.
      for(let i=0;i<5;i++){makeWall(-12+i*5,22+i*3,9,.9,-.45);for(let s=0;s<4;s++)box(2.1,.32,1.3,stoneLight,scene,-18+i*4+s*1.1,1.1+s*.35,24+i*3);}
      makeStoneSteps(-18,35,7,-.1);makeStoneSteps(-22,-31,6,Math.PI);
      // Giardini agrumati e serre della corporazione del caffè.
      for(let i=0;i<9;i++)makeCitrusTree(-48+(i%3)*7,18+Math.floor(i/3)*7,.85+(i%2)*.12);
      makeWoodPergola(-49,4,Math.PI/2);makeFlowerBed(-57,10,.4);makeFlowerBed(-39,10,-.4);
      // Sentiero panoramico, rocce e vegetazione: alternanza di pini e alberi in fiore.
      for(let i=0;i<48;i++){const a=i*2.399,rr=38+(i%5)*4;makeTree(Math.cos(a)*rr,Math.sin(a)*rr,.7+(i%3)*.18,i%4===0);}
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6,rr=31+(i%3)*2;
        makeCherryTree(Math.cos(a)*rr,Math.sin(a)*rr,.72+(i%2)*.16);
      }
      // Passata artistica: sottobosco a più livelli, bordi morbidi e dettagli ravvicinati.
      // La distribuzione è deterministica per mantenere identica la scena ad ogni caricamento.
      const meadowMats=["#e7c96f","#f1e6c2","#e99a9a","#d8b7e8","#f4a65e"].map(color=>mat(color,.82));
      const grassMats=["#718e50","#8da85d","#a5b96d","#587b49"].map(color=>mat(color,1));
      const detailRock=mat("#a9a18b",.96), mushroomCap=mat("#d77b58",.8), mushroomStem=mat("#eee0c4",1);
      const flowerCenterMat=mat("#f7d56c",.72), flowerPetalMats=meadowMats;
      const seeded=(n)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
      for(let i=0;i<210;i++){
        const a=seeded(i+11)*Math.PI*2, r=13+seeded(i+91)*43;
        const x=Math.cos(a)*r,z=Math.sin(a)*r;
        if(Math.abs(x-28)<9&&Math.abs(z)<48)continue;
        const patch=new THREE.Group();scene.add(patch);patch.position.set(x,0,z);
        const blades=3+(i%4);
        for(let j=0;j<blades;j++){
          const angle=seeded(i*7+j)*Math.PI*2;
          const blade=addMesh(new THREE.ConeGeometry(.055+seeded(i+j)*.035,.38+seeded(i+j+4)*.24,5),grassMats[(i+j)%grassMats.length],patch,Math.cos(angle)*.12,.19,Math.sin(angle)*.12);
          blade.rotation.z=Math.cos(angle)*.28;blade.rotation.x=Math.sin(angle)*.28;
        }
        if(i%3===0){
          const flower=sphere(.105,meadowMats[i%meadowMats.length],patch,0,.43,0,2);
          flower.scale.set(1,.55,1);
          sphere(.045,flowerCenterMat,patch,0,.49,0,1);
        }
        if(i%9===0){
          cylinder(.09,.12,.22,mushroomStem,patch,.24,.11,.12,7);
          const cap=sphere(.18,mushroomCap,patch,.24,.27,.12,2);cap.scale.set(1,.48,1);
        }
      }
      // Pietre piatte irregolari lungo il sentiero principale: leggibilità senza effetto griglia.
      for(let i=0;i<74;i++){
        const t=i/73,side=(seeded(i+501)-.5)*1.9;
        const x=-18+t*39+side,z=10+Math.sin(t*Math.PI*2)*2.2+(seeded(i+601)-.5)*1.4;
        const stoneMesh=addMesh(new THREE.DodecahedronGeometry(.28+seeded(i+701)*.18,0),detailRock,scene,x,.09,z);
        stoneMesh.scale.set(1.35,.28,.9);stoneMesh.rotation.y=seeded(i+801)*Math.PI;
      }
      // Piccoli gruppi di fiori vicino agli ingressi delle case.
      for(const [cx,cz] of [[-18,-12],[8,-18],[18,8],[-34,4],[35,-10]]){
        for(let j=0;j<7;j++){
          const a=j/7*Math.PI*2,rr=1.1+(j%2)*.45;
          const flower=sphere(.12,meadowMats[j%meadowMats.length],scene,cx+Math.cos(a)*rr,.38,cz+Math.sin(a)*rr,2);
          flower.scale.set(1,.62,1);
          sphere(.045,flowerCenterMat,scene,cx+Math.cos(a)*rr,.45,cz+Math.sin(a)*rr,1);
        }
      }
      // Piccolo bosco sacro ai margini del villaggio: rocce, cespugli e pietre votive.
      makeRockGarden(-42,-26,3);makeRockGarden(43,27,5);makeRockGarden(-43,39,7);
      for(let i=0;i<24;i++){const x=-35+(i%6)*8,z=-4+Math.floor(i/6)*9;sphere(1.2,stoneLight,scene,x,.25,z,1);addCollider(x,z,.62);}
      // Arredi, carri, sacchi e casse: area di carico della corporazione.
      makeWoodCart(22,22,-.15);makeWoodCart(-19,22,.25);
      for(let i=0;i<8;i++){const x=-8+(i%4)*4,z=17+Math.floor(i/4)*3;box(1.2,.8,.9,wood,scene,x,.4,z);box(1.25,.12,.95,gold,scene,x,.85,z);}
      for(let i=0;i<5;i++){const x=20+i*1.2;cylinder(.38,.42,.9,wood,scene,x,.45,35,10);cylinder(.4,.4,.1,gold,scene,x,.55,35,10);cylinder(.4,.4,.1,gold,scene,x,.2,35,10);}
      // Mercato coperto con tende, casse, sacchi e insegne da borgo artigiano.
      makeMarketStall(-8,9,"#a64c36");makeMarketStall(8,10,"#d0a05d");makeMarketStall(-17,19,"#567b68");
      makeNoren(-8,10.2,"#a64c36");makeNoren(8,11.2,"#c49a5b");
      makeVillageLantern(-11,3);makeVillageLantern(11,3);
      makeVillageFence(-11,15,9,.1);makeVillageFence(11,16,9,-.1);
      for(const [x,z] of [[-5,4],[5,4],[18,-5],[-20,-18]]){cylinder(.08,.1,1.1,wood,scene,x,.55,z,8);box(1.6,.12,.55,wood,scene,x,.95,z);}
      // Tubature, valvole e depositi esterni della torrefazione.
      for(let i=0;i<4;i++){const p=cylinder(.12,.12,5,gold,scene,10+i*1.6,3.4,32,10);p.rotation.z=Math.PI/2;box(.45,.45,.45,wood,scene,9+i*2, .4,35);}
      // Interni ricostruiti: caffetteria, laboratorio e Cripta. Gli ambienti
      // poggiano sul piano del borgo e mantengono gli ingressi allineati ai passaggi.
      makeCafeInterior(-68,62);
      makeInterior(68,68,"north");
      makeInterior(68,-68,"south");
      // Interni accessibili: laboratorio della torrefazione e caffetteria storica.
      // Le condotte sono invalicabili fuori dai due ponti in pietra.
      addBoxCollider(28,-42,12,12);
      addBoxCollider(28,-16,12,27);
      addBoxCollider(28,28,12,48);
      // Cripta delle Miscele: accesso segreto legato alle tre missioni cittadine.
      const vaultArch=new THREE.Group();scene.add(vaultArch);vaultArch.position.set(-70,0,-48);
      box(8,3.4,.7,darkStone,vaultArch,0,1.7,0);
      box(3.1,3,.3,gold,vaultArch,0,1.5,.42);
      box(2.2,2.5,.22,wood,vaultArch,0,1.3,.62);
      for(let i=0;i<5;i++)sphere(.12,gold,vaultArch,-1.35+i*.68,3.2,.45,1);
      box(1.8,1.15,1.1,wood,scene,68,.62,-68);
      box(1.9,.2,1.16,gold,scene,68,1.27,-68);
      sphere(.28,mat("#d4b3ff",.2,{emissive:"#8d59d4",emissiveIntensity:.8}),scene,68,1.65,-68,2);
      addCollider(68,-68,1.2);
      // Cornice aperta della porta della torrefazione: il passaggio è realmente libero.
      box(.18,3,.25,gold,scene,66.4,1.5,62);
      box(.18,3,.25,gold,scene,69.6,1.5,62);
      box(3.4,.18,.25,gold,scene,68,3,62);
      // Cornice della porta segreta sul lato sud della Cripta.
      box(.18,3,.25,gold,scene,66.4,1.5,-62);
      box(.18,3,.25,gold,scene,69.6,1.5,-62);
      box(3.4,.18,.25,gold,scene,68,3,-62);
      addInteraction("cafe-exit","Uscita del Caffè delle Tre Foglie","Tornare alle terrazze della città?",-68,62,()=>{player.position.set(-22,1,-.5);setZone("Piazza del Chicco");},4.2);
      addInteraction("vault-door","Cripta delle Miscele","Una porta sigillata da tre prove.",-70,-43,()=>{
        if(!(questDoneRef.current&&recipeDoneRef.current&&waterDoneRef.current)){
          setDialogue({title:"Cripta delle Miscele · Sigillata",text:"Il sigillo richiede tre prove: le Fave d'Ambra, la Ricetta Perduta e le Condotte Riattivate."});
          return;
        }
        secretUnlockedRef.current=true;setSecretUnlocked(true);
        player.position.set(68,0,-59.5);setZone("Cripta delle Miscele");
        setToast("La Cripta delle Miscele è stata aperta");
      },4.8);
      addInteraction("vault-exit","Uscita della Cripta","Tornare ai giardini di Amargenta?",68,-62,()=>{player.position.set(-70,0,-39.5);setZone("Giardino del Retrogusto");},4.2);
      // Dungeon di Amargenta: tre sigilli da attivare nell'ordine inciso sulle lastre.
      const dungeonSealMaterials = [];
      const dungeonSealPositions = [[63,-66],[73,-66],[68,-72]];
      dungeonSealPositions.forEach(([x,z],index)=>{
        const pedestal=cylinder(.48,.62,.72,darkStone,scene,x,.36,z,8);
        const rune=sphere(.3,mat("#53605c",.25,{emissive:"#243b35",emissiveIntensity:.25}),scene,x,1.05,z,2);
        const halo=addMesh(new THREE.TorusGeometry(.52,.055,8,20),gold,scene,x,1.05,z);
        halo.rotation.x=Math.PI/2;
        dungeonSealMaterials.push({rune,halo});
        if(dungeonSigilsRef.current.includes(index)){
          rune.material=mat("#8ac6a0",.22,{emissive:"#397d58",emissiveIntensity:1.1});
          halo.material=mat("#9bd9ad",.25,{emissive:"#397d58",emissiveIntensity:.7});
        }
        addInteraction("dungeon-seal-"+index,"Sigillo antico "+(index+1),"Le incisioni indicano la sequenza: est, ovest, nord. Attiva le rune in quest'ordine.",x,z,()=>{
          if(dungeonBossDefeatedRef.current)return;
          if(dungeonSigilsRef.current.includes(index))return;
          const sequence=[1,0,2];
          const expected=sequence[dungeonSigilsRef.current.length];
          if(index!==expected){
            dungeonSigilsRef.current=[];
            setDungeonSigils([]);
            dungeonSealMaterials.forEach(({rune,halo})=>{
              rune.material=mat("#53605c",.25,{emissive:"#243b35",emissiveIntensity:.25});
              halo.material=gold;
            });
            setToast("Sequenza errata · I sigilli si sono resettati");
            return;
          }
          const next=[...dungeonSigilsRef.current,index];
          dungeonSigilsRef.current=next;
          setDungeonSigils(next);
          rune.material=mat("#8ac6a0",.22,{emissive:"#397d58",emissiveIntensity:1.1});
          halo.material=mat("#9bd9ad",.25,{emissive:"#397d58",emissiveIntensity:.7});
          setToast("Sigillo risvegliato · "+next.length+"/3");
          if(next.length===3){dungeonGuardian.visible=true;setDialogue({title:"I tre sigilli sono attivi",text:"Le rune si sono accese. Qualcosa si sta risvegliando nel cuore della Cripta…"});}
        },3.2);
      });
      // Il Guardiano emerge soltanto dopo la soluzione del puzzle.
      const dungeonGuardian=new THREE.Group();
      scene.add(dungeonGuardian);
      dungeonGuardian.position.set(68,0,-69.5);
      const guardianDark=mat("#292d2b",.55,{metalness:.18});
      const guardianGold=mat("#bd8750",.3,{metalness:.55,emissive:"#6f3d1c",emissiveIntensity:.35});
      const guardianCore=sphere(1.05,guardianDark,dungeonGuardian,0,1.45,0,2);
      guardianCore.scale.set(.8,1.25,.72);
      for(let side of [-1,1]){
        const horn=cylinder(.08,.28,1.05,guardianGold,dungeonGuardian,side*.62,2.55,-.08,7);
        horn.rotation.z=side*.38;
        sphere(.2,guardianGold,dungeonGuardian,side*.35,1.7,.63,2);
      }
      const guardianCrown=sphere(.32,guardianGold,dungeonGuardian,0,2.75,0,2);
      dungeonGuardian.visible=dungeonSigilsRef.current.length===3&&!dungeonBossDefeatedRef.current;
      addInteraction("dungeon-guardian","Guardiano del Retrogusto","Una presenza antica custodisce il cuore della Cripta.",68,-69.5,()=>{
        if(dungeonBossDefeatedRef.current){
          setDialogue({title:"Guardiano del Retrogusto",text:"La sua luce si è spenta. La Cripta riconosce il tuo coraggio."});
          return;
        }
        if(dungeonSigilsRef.current.length<3){
          setDialogue({title:"Guardiano del Retrogusto",text:"Tre sigilli trattengono il suo sonno. Risolvi la sequenza delle rune prima di affrontarlo."});
          return;
        }
        setDungeonBattleOpen(true);
      },3.8);
      addInteraction("vault-chest","Scrigno delle Miscele","Un antico scrigno custodisce il cuore della città.",68,-68,()=>{
        if(!secretUnlockedRef.current){setDialogue({title:"Scrigno sigillato",text:"Il sigillo della cripta non è ancora stato spezzato."});return;}
        if(!dungeonBossDefeatedRef.current){setDialogue({title:"Il cuore è protetto",text:"Il Guardiano del Retrogusto è ancora nella Cripta. Attiva i tre sigilli e affrontalo prima di aprire lo scrigno."});return;}
        if(vaultClaimedRef.current){setDialogue({title:"Scrigno delle Miscele",text:"Lo scrigno è vuoto. Hai già recuperato il Cuore del Retrogusto."});return;}
        vaultClaimedRef.current=true;setVaultClaimed(true);setInventory(old=>({...old,relics:old.relics+1}));
        setDialogue({title:"Cuore del Retrogusto",text:"Hai ottenuto una reliquia unica di Amargenta. Il suo aroma cambia con la luce."});
      },3.2);
      // Personaggi con dialoghi contestuali.
      makeNpc("barista","Zibelle","Custode del caffè",2,5,"#a94a35",["Benvenuto ad Amargenta!","La fontana segna il cuore della città.","La torrefazione lavora anche dopo il tramonto."]);
      makeNpc("merchant","Muccanza","Mercante del borgo",-10,12,"#b47b43",["Cerchi qualcosa di speciale?","Le fave d'ambra crescono solo sulle terrazze alte."]);
      makeNpc("archivist","Belligonghi-umami","Custode delle ricette", -10,-19,"#526d78",["Ogni chicco conserva una storia.","Nell'archivio trovi le ricette più antiche della fazione Amaro."]);
      makeNpc("guard","Cardinero","Custode delle condotte",18,-7,"#68745a",["Il ponte è sicuro, ma non oltrepassare le gole senza prepararti."]);
      makeNpc("farmer","Flame","Custode delle piante di peperoncino", -24,-31,"#6b8a57",["Queste piante richiedono ombra e acqua fresca.","Raccogliere le bacche mature è un'arte."]);
      // Abitanti di servizio: danno vita alla piazza senza introdurre nuove missioni.
      makeNpc("town-cook","Muccanza","Preparatore di bevande",-13,5,"#b65a43",["La zuppa di fave è il piatto preferito dei viaggiatori.","Quando il mercato apre, qui profuma di pane caldo."]);
      makeNpc("town-carpenter","Cardinero","Manutentore dei sentieri",14,19,"#8b6948",["Ogni trave di Amargenta è lavorata a mano.","Il legno migliore arriva dai boschi sopra il fiume."]);
      makeNpc("town-gardener","Cardinero","Giardiniere",-34,16,"#718b59",["Le aiuole della piazza cambiano colore con le stagioni.","Non calpestare i germogli appena piantati!"]);
      // I Cardinero curano le aiuole e i giardini: sono NPC pacifici, senza statistiche e senza battaglie.
      // Cardinero #43: custode pacifico dei giardini, reclutabile senza battaglia.
      makeCardinero("Cardinero",-41,22,.92);
      // Lattelo #41: incontro selvatico Natura presso i filari orientali.
      {
        const g=new THREE.Group();scene.add(g);g.position.set(42,0,38);
        const coat=mat("#ffd92e"), blue=mat("#087df0"), cream=mat("#f5d8a1"), muzzle=mat("#f5b99a"), hoof=mat("#75452b"), dark=mat("#171717"), metal=mat("#c8d4df",.35,{metalness:.55});
        const body=sphere(.72,coat,g,0,.86,0,2);body.scale.set(1.05,1.08,.82);
        const head=sphere(.58,coat,g,0,1.72,.12,2);head.scale.set(1.02,1.05,.92);
        sphere(.34,muzzle,g,0,1.53,.62,2).scale.set(1.2,.72,.55);
        sphere(.09,dark,g,-.22,1.83,.61,2);sphere(.09,dark,g,.22,1.83,.61,2);
        // Macchie tonde sul manto e ciuffo frontale per una silhouette più riconoscibile.
        for(const [x,y,z,scale] of [[-.48,1.02,.28,.19],[.43,.68,.3,.16],[-.28,1.35,-.25,.13],[.3,1.15,-.34,.14]]){
          const patch=sphere(scale,mat("#fff0b2"),g,x,y,z,2);patch.scale.set(1.25,.82,.42);
        }
        sphere(.23,blue,g,0,2.19,.08,2).scale.set(1.1,.48,.75);
        const forelock=sphere(.2,cream,g,0,2.02,.47,2);forelock.scale.set(1.3,.45,.45);
        for(const side of [-1,1]){
          const horn=sphere(.18,cream,g,side*.32,2.35,.02,2);horn.scale.set(.65,1.25,.65);
          const ear=sphere(.25,coat,g,side*.58,1.95,0,2);ear.scale.set(1.2,.48,.5);
          const innerEar=sphere(.12,muzzle,g,side*.58,1.96,.09,1);innerEar.scale.set(1.1,.55,.35);
          sphere(.115,mat("#fff8e8"),g,side*.22,1.86,.65,2);
          sphere(.055,dark,g,side*.22,1.86,.705,2);
          sphere(.022,mat("#ffffff"),g,side*.195,1.89,.745,1);
        }
        // Ciuffo a stella e macchie blu sul fianco: firma visiva del Lattelo.
        for(let i=0;i<3;i++){const tuft=sphere(.14,cream,g,(i-1)*.16,2.27,.34,2);tuft.scale.set(.65,1.35,.5);tuft.rotation.z=(i-1)*-.3;}
        for(const [x,y,z] of [[-.55,1.05,.2],[.5,.9,.25],[-.34,1.3,-.35],[.28,.72,-.4]]){const spot=sphere(.12,blue,g,x,y,z,1);spot.scale.set(1.25,.85,.3);}
        // Quattro zampette corte e robuste, con zoccoli ben visibili.
        for(const side of [-1,1])for(const front of [-1,1]){
          const x=side*.34,z=front*.39;
          const leg=sphere(.17,coat,g,x,.32,z,2);leg.scale.set(.9,1.45,.92);
          sphere(.18,hoof,g,x,.1,z+.035,2).scale.set(1,.62,1.15);
        }
        // Mammella e campanellino blu: richiami al latte fresco di Lattelo.
        sphere(.24,muzzle,g,0,.48,.34,2).scale.set(1.15,.72,.9);
        for(const side of [-1,1])sphere(.045,muzzle,g,side*.1,.31,.39,1);
        const collar=cylinder(.34,.34,.09,blue,g,0,1.28,.02,12);collar.rotation.x=Math.PI/2;
        sphere(.18,blue,g,.62,.76,-.4,2);        const bucket=cylinder(.19,.24,.35,metal,g,-.58,.3,.22,10);
        const handle=new THREE.Mesh(new THREE.TorusGeometry(.2,.025,6,16,Math.PI),metal);handle.position.set(-.58,.52,.22);g.add(handle);
        const interaction={id:"wild-lattelo-41",title:"Lattelo · Natura",text:"Un Lattelo selvatico ti osserva tra i filari.",x:42,z:38,radius:4.2,action:()=>{
          if(ownedAmargentaIdsRef.current.includes("lattelo")){setDialogue({title:"Lattelo",text:"Lattelo è già parte della tua collezione. Nessun doppione."});return;}
          setDialogue({title:"Un incontro speciale · Lattelo",text:"Il piccolo Sognatore sembra incuriosito, ma non si fida ancora. Avvicinati con calma e fagli capire che vuoi viaggiare insieme.",confirm:()=>{recruitAmargenta("lattelo");setDialogue(null);}});
        }};
        interactables.push(interaction);
      }
      // Solo i Sognatori esclusivi di Amargenta sono collocati in questa città.
      // Muccanza è un Umano fan del latte di Lattelo: non una seconda mucca.
      makeMuccanza();
      // Piccolo branco di Lattelo: pascolo e imbottigliamento del latte.
      makeNpc("milkkeeper","Lattelo","Pascolo e raccolta del latte",45,43,"#ffd92e",["Il latte fresco viene imbottigliato qui ogni mattina.","I Lattelo pascolano tranquilli tra i filari."]);
      makeNpc("milkkeeper","Lattelo","Addetto all’imbottigliamento",51,47,"#ffd92e",["Ogni bottiglia viene chiusa e conservata al fresco.","Il latte di Amargenta è pronto per il mercato."]);
      // Test di stabilità: una sola Zibelle selvatica attiva in città.
      makeZibelle(-43,-54,0);
      makeUmami();
      makeTrufflePatch(-48,30);
      makeFlame();
      makeChiliTree(36,-28);
      addInteraction("chili-harvest","Raccogli peperoncini","Le piante di Flame hanno prodotto peperoncini maturi.",36,-28,()=>{setInventory(old=>({...old,peppers:old.peppers+1}));setToast("Peperoncino raccolto");},4.2);
      addInteraction("coffee-harvest","Raccogli chicchi di caffè","Zibelle ti mostra i chicchi maturi.",-43,-54,()=>{setInventory(old=>({...old,coffeeBeans:old.coffeeBeans+1}));setToast("Chicco di caffè raccolto");},4.2);
      addInteraction("truffle-harvest","Cerca tartufi","Il terreno smosso nasconde tartufi profumati.",-48,30,()=>{setInventory(old=>({...old,truffles:old.truffles+1}));setToast("Tartufo trovato");},4.2);
      addInteraction("milk-bottle","Imbottiglia il latte","I Lattelo hanno riempito il contenitore.",48,45,()=>{setInventory(old=>({...old,milk:old.milk+1}));setToast("Latte imbottigliato");},4.5);
      addInteraction("cardinero-prune","Cura il giardino","Cardinero ti indica le piante da potare.",-34,16,()=>{setInventory(old=>({...old,waterCrystals:old.waterCrystals+1}));setToast("Giardino curato · Essenza verde ottenuta");},4.2);
      // Compagni nell'overworld: Tartadino pascola, Patato lascia solchi.
      const makeCompanion=(id,x,z,color)=>{
        const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
        const body=sphere(.72,mat(color),g,0,.78,0,2);body.scale.set(1.05,.9,.95);
        addSognatoreCrest(g, id === "patato" ? "patatos" : id, .92, .62);
        sphere(.48,mat(color),g,0,1.42,.28,2);
        for(const side of [-1,1]){sphere(.12,mat("#fff8e9"),g,side*.19,1.48,.68,2);sphere(.055,mat("#211820"),g,side*.19,1.48,.77,2);}
        const feet=[];for(const side of [-1,1]){const foot=sphere(.2,mat("#a66a42"),g,side*.28,.18,.12,1);foot.scale.set(1,.55,1.3);feet.push(foot);}
        if(id==="tartadino"){const shell=sphere(.42,mat("#b46a32"),g,0,1.05,-.35,2);shell.scale.set(1.25,.75,.8);sphere(.18,mat("#65a83f"),g,0,1.92,.22,1).scale.set(.45,1.5,.35);}
        if(id==="patato"){for(let i=0;i<3;i++){const lump=sphere(.17,mat("#8b633e"),g,-.28+i*.28,.92,-.52,1);lump.scale.y=.65;}}
        ambientCreatures.push({id,group:g,homeX:x,homeZ:z,phase:ambientCreatures.length*1.7,feet});
      };
      makeCompanion("tartadino",-36,20,"#dca52c");makeCompanion("patato",-50,-18,"#a87b4b");
      const makeFlyer=(id,x,y,z,color)=>{
        const g=new THREE.Group();scene.add(g);g.position.set(x,y,z);
        const body=sphere(.48,mat(color),g,0,0,0,2);body.scale.set(1.25,.72,.85);sphere(.28,mat(color),g,0,.08,.38,2);
        addSognatoreCrest(g, id, .12, .52);
        const wingMat=mat("#eee2f5",.65),left=sphere(.38,wingMat,g,-.52,.12,0,1),right=sphere(.38,wingMat,g,.52,.12,0,1);left.scale.set(1.3,.2,.7);right.scale.set(1.3,.2,.7);
        ambientCreatures.push({id,group:g,homeX:x,homeZ:z,baseY:y,phase:ambientCreatures.length*2.1,fly:true,leftWing:left,rightWing:right});
      };
      makeFlyer("dodo",-28,12,-8,"#9b83c4");makeFlyer("flypork",5,16,-34,"#ef9d9d");makeFlyer("cocconn",44,14,24,"#e7c18d");

      // Portali monumentali gemelli: pietra antica, archi, gemme e un nucleo magico pulsante.
      const arabGold=mat("#d9a63c",.42,{metalness:.48}),arabRed=mat("#8f2731"),arabStone=mat("#c6a36a");
      const makeSpyroPortal=(x,z,rotation=0,worldName="",parent=scene)=>{
        const g=new THREE.Group();parent.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
        const carvedStone=mat("#b99a70",.82),shadowStone=mat("#70523e",.9),gem=mat("#63d8dc",.24,{metalness:.28,emissive:"#1a8fbd",emissiveIntensity:.72});
        box(8.8,.42,3.8,shadowStone,g,0,.22,0);box(7.8,.34,3.1,arabStone,g,0,.58,0); 
        for(const side of [-1,1]){
          cylinder(.48,.7,6.35,carvedStone,g,side*3.15,3.75,0,12);
          cylinder(.72,.72,.34,arabGold,g,side*3.15,6.78,0,12);
          cylinder(.62,.62,.22,shadowStone,g,side*3.15,.98,0,12);
          box(.18,3.9,.16,arabGold,g,side*3.15,3.65,.52);sphere(.38,gem,g,side*3.15,4.45,.12,2);
          const crystal=addMesh(new THREE.OctahedronGeometry(.55),gem,g,side*4.05,4.15,.18);crystal.rotation.z=side*.22;
          const cap=addMesh(new THREE.ConeGeometry(.72,.85,4),arabRed,g,side*3.15,7.2,0);cap.rotation.y=Math.PI/4;
        }
        box(7.8,.62,1.1,carvedStone,g,0,7.1,0);
        addMesh(new THREE.TorusGeometry(3.25,.42,10,40,Math.PI),carvedStone,g,0,3.9,0);
        addMesh(new THREE.TorusGeometry(3.25,.12,8,40,Math.PI),arabGold,g,0,3.9,.16);
        const coreMaterial=new THREE.MeshBasicMaterial({color:"#53cfe0",transparent:true,opacity:.58,side:THREE.DoubleSide});
        const core=addMesh(new THREE.CircleGeometry(2.48,48),coreMaterial,g,0,3.55,.28);
        // Nome della destinazione centrato e leggibile nel cerchio del portale.
        if(worldName){
          const labelCanvas=document.createElement("canvas");labelCanvas.width=1024;labelCanvas.height=192;
          const ctx=labelCanvas.getContext("2d");
          if(ctx){
            ctx.clearRect(0,0,1024,192);ctx.fillStyle="rgba(30,20,34,.78)";
            ctx.beginPath();ctx.roundRect(28,22,968,148,38);ctx.fill();
            ctx.strokeStyle="#f3d28a";ctx.lineWidth=8;ctx.stroke();
            ctx.fillStyle="#fff1c7";ctx.textAlign="center";ctx.textBaseline="middle";
            ctx.font="900 92px Georgia,serif";ctx.shadowColor="#6a3b13";ctx.shadowBlur=18;
            ctx.fillText(worldName.toUpperCase(),512,98);
            const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;
            const labelMaterial=new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
            addMesh(new THREE.PlaneGeometry(4.65,.88),labelMaterial,g,0,3.55,.62);
          }
        }
        const ring=addMesh(new THREE.TorusGeometry(2.62,.22,12,48),arabGold,g,0,3.55,.35);
        const innerRing=addMesh(new THREE.TorusGeometry(2.27,.065,8,48),gem,g,0,3.55,.38);
        for(let i=0;i<7;i++){const rune=addMesh(new THREE.OctahedronGeometry(.16),arabGold,g,Math.cos(i*Math.PI*2/7)*2.92,3.55+Math.sin(i*Math.PI*2/7)*2.92,.44);rune.rotation.z=i*.7;}
        const crest=addMesh(new THREE.OctahedronGeometry(.78),arabGold,g,0,8.05,0);crest.rotation.y=Math.PI/4;crest.rotation.z=Math.PI/4;
        sphere(.24,gem,g,0,8.05,.35,2);
        arabPortalEffects.push({ring,innerRing,core,crest,phase:x*.07});
        return g;
      };
      try { makeSpyroPortal(67,2,-Math.PI/2,"Arabnite"); }
      catch (error) { console.error("Portale Arabnite non inizializzato: Amargenta resta disponibile", error); }
      travelToWorldRef.current=(target)=>{
        const toArabnite=target==="arabnite";
        if(toArabnite&&!arabniteReady){setToast("Arabnite non è disponibile in questo momento. Amargenta resta esplorabile.");return;}
        if(Boolean(arabniteActive)===toArabnite)return;
        saveCurrentWorld();
        setWorldTransition(toArabnite?"arabnite":"amargenta");controlsLockedRef.current=true;
        window.setTimeout(()=>{
          const destinationKey=toArabnite?"arabnite":"amargenta";
          const destination=sessionWorlds[destinationKey];
          if(toArabnite){scene.remove(player);arabniteScene.add(player);arabniteActive=true;}
          else{arabniteScene.remove(player);scene.add(player);scene.add(talpitrippaShadow);arabniteActive=false;}
          const defaults=toArabnite?{x:178,z:12,yaw:Math.PI*.12,pitch:.38,distance:compactDevice?12.2:10.8,character:"cervio"}:{x:61,z:2,yaw:Math.PI*.22,pitch:.34,distance:compactDevice?10.2:8.9,character:"moci-moci"};
          const state=destination&&Number.isFinite(destination.x)&&Number.isFinite(destination.z)?destination:defaults;
          player.position.set(state.x,0,state.z);
          yaw=Number.isFinite(state.yaw)?state.yaw:defaults.yaw;
          pitch=Number.isFinite(state.pitch)?THREE.MathUtils.clamp(state.pitch,.2,.88):defaults.pitch;
          distance=Number.isFinite(state.distance)?THREE.MathUtils.clamp(state.distance,7,18):defaults.distance;
          switchCharacter(state.character||defaults.character,true);
          movementVelocity.set(0,0,0);jumpHeight=0;jumpVelocity=0;climbHeight=0;climbingWall=null;
          zoneRef.current=toArabnite?"Arabnite · Piazza delle Lanterne":"Ingresso di Amargenta";setZone(zoneRef.current);cameraReady=false;controlsLockedRef.current=false;setWorldTransition(null);setMenuOpen(false);setPanel(null);saveCurrentWorld();
        },420);
      };
      // L'accesso diretto dal pulsante Arabnite apre subito il mondo corretto.
      if(new URLSearchParams(window.location.search).get("world")==="arabnite"){
        window.setTimeout(()=>travelToWorldRef.current?.("arabnite"),250);
      }
      const arabniteBuildSnapshot={interactables:interactables.length,colliders:colliders.length,npcActors:npcActors.length,packs:arabnitePackMeshes.length,portalEffects:arabPortalEffects.length};
      try {
      // ARABNITE: città notturna di cupole, bazar, lanterne e oasi lunare.
      // La sabbia continua sotto tutta la cintura di dune, senza fessure o bordi neri.
      addMesh(new THREE.PlaneGeometry(190,190,32,32),mat("#c29a63"),arabniteWorld,178,-.02,12).rotation.x=-Math.PI/2;
      // Pista da pattinaggio di Arabnite: ampia, a livello del terreno e con ingresso aperto a sud.
       const arabIce=mat("#a8e8f2",.16,{metalness:.32,roughness:.12});
       const icePatch=addMesh(new THREE.PlaneGeometry(38,28),arabIce,arabniteWorld,164,-.005,-13);
       icePatch.rotation.x=-Math.PI/2;
       // Bordo basso in ghiaccio, con un varco centrale sul lato sud.
       const rinkRail=mat("#d9f8ff",.18,{metalness:.24,roughness:.16});
       const rinkWall=(x,z,w,d)=>box(w,.42,d,rinkRail,arabniteWorld,x,.22,z);
       rinkWall(164,-27,38,.48);rinkWall(145,-13,.48,28);rinkWall(183,-13,.48,28);
       rinkWall(151,-0.2,10,.48);rinkWall(177,-0.2,10,.48);
       isArabniteIceAt=(x,z)=>arabniteActive&&x>=145.5&&x<=182.5&&z>=-26.5&&z<=.2;
      const sandstone=mat("#a87845"),lantern=mat("#ffbd4b",.3,{emissive:"#e88925",emissiveIntensity:1.5}),sand=mat("#c29a63");
      try { makeSpyroPortal(132,12,Math.PI/2,"Amargenta",arabniteWorld); }
      catch (error) { console.error("Portale di ritorno non inizializzato: Arabnite resta caricabile", error); }
      const dome=(x,z,r,h,color)=>{cylinder(r,r,h*.45,sandstone,arabniteWorld,x,h*.22,z,20);const d=sphere(r,mat(color),arabniteWorld,x,h*.45,z,2);d.scale.y=.72;cylinder(r*.16,r*.16,h*.28,arabGold,arabniteWorld,x,h*.95,z,12);sphere(r*.12,lantern,arabniteWorld,x,h*1.1,z,1);};
       const hangLantern=(x,z,y=3)=>{
         const g=new THREE.Group();arabniteWorld.add(g);g.position.set(x,y,z);
         const poleHeight=Math.max(.55,y-.25);
         cylinder(.075,.11,poleHeight,arabWood,g,0,-poleHeight/2,0,8);
         cylinder(.28,.38,.7,arabGold,g,0,0,0,8);
         sphere(.25,lantern,g,0,0,0,1);
         sphere(.16,arabRed,g,0,.48,0,1).scale.y=.5;
       };
      const arabWall=mat("#d8bd91"),arabWallLight=mat("#ead5ad"),arabRoof=mat("#8e5542"),arabWood=mat("#62432f"),arabCloth=mat("#9f3f48");
      const makeArabHouse=(x,z,w=11,d=8,h=4.4,accent="#9f3f48")=>{
        const g=new THREE.Group();arabniteWorld.add(g);g.position.set(x,0,z);
        const cloth=mat(accent),door=mat("#55362c"),windowGlow=mat("#f8c76d",.3,{emissive:"#c9782e",emissiveIntensity:.55});
        box(w,h,d,arabWall,g,0,h/2,0);box(w+.7,.28,d+.7,arabStone,g,0,h+.08,0);box(w+.25,.16,d+.25,arabRoof,g,0,h+.3,0);
        for(const side of [-1,1]){
          const domeX=side*w*.25;cylinder(1.28,1.42,.52,arabRoof,g,domeX,h+.55,-.2,16);
          const domeCap=addMesh(new THREE.SphereGeometry(1.22,16,10,0,Math.PI*2,0,Math.PI/2),arabRoof,g,domeX,h+.8,-.2);domeCap.scale.y=.9;sphere(.12,arabGold,g,domeX,h+1.86,-.2,1);
          box(1.05,1.45,.16,arabWood,g,side*w*.34,2.75,d/2+.1);box(.72,1.08,.08,windowGlow,g,side*w*.34,2.76,d/2+.2);
          box(1.24,.12,.25,arabStone,g,side*w*.34,2.02,d/2+.18);box(.08,1.15,.12,arabGold,g,side*w*.34,2.76,d/2+.27);
        }
        box(1.55,2.55,.2,door,g,0,1.3,d/2+.12);
        addMesh(new THREE.TorusGeometry(.88,.17,8,20,Math.PI),arabStone,g,0,2.55,d/2+.14);
        box(2.05,.18,.55,arabCloth,g,0,h+.55,d/2+.15);
        for(let stripe=-2;stripe<=2;stripe++)box(.12,.16,.58,stripe%2?arabGold:cloth,g,stripe*.36,h+.55,d/2+.18);
        box(3.2,.14,.8,arabWood,g,0,3.65,d/2+.42);box(3.2,.13,.12,arabGold,g,0,4.08,d/2+.78);
        for(let i=0;i<7;i++)box(.08,.42,.08,arabWood,g,-1.45+i*.48,3.88,d/2+.78);
        for(const side of [-1,1]){box(.12,.9,.12,arabWood,g,side*1.45,4.05,d/2+.78);const lamp=new THREE.Group();g.add(lamp);lamp.position.set(side*(w/2-.6),2.65,d/2+.35);cylinder(.12,.18,.36,arabGold,lamp,0,0,0,8);sphere(.16,lantern,lamp,0,-.08,.05,1);}
        for(let row=0;row<3;row++)box(w+.08,.055,.08,row%2?arabGold:arabWood,g,0,.55+row*.58,d/2+.08);
        box(2.1,.16,.7,arabStone,g,0,.12,d/2+.25);addBoxCollider(x,z,w+.7,d+.8,0,h+1.8);return g;
      };
      // Cupole e tronchi dell'oasi sono ostacoli solidi, non attraversabili.
      // Sentieri chiari tra portale, bazar e oasi: leggibili senza tagliare le bancarelle.
      const bazaarTrail=addMesh(new THREE.PlaneGeometry(6.5,48),sand,arabniteWorld,181,.025,27);bazaarTrail.rotation.x=-Math.PI/2;bazaarTrail.rotation.z=-.24;
      const oasisTrail=addMesh(new THREE.PlaneGeometry(5.5,26),sand,arabniteWorld,192,.028,43);oasisTrail.rotation.x=-Math.PI/2;
      // Cintura di dune monumentali: Arabnite è un bacino chiuso, senza uscite oltre il deserto.
      const duneMat=mat("#b88c55"),duneLight=mat("#d3ad73"),rockMat=mat("#66516d");
      [[132,-20,15,3.4,10],[132,48,17,3.1,11],[225,55,16,3.8,10],[151,67,12,2.1,8],[218,-42,18,2.7,12]].forEach(([x,z,w,h,d],i)=>{const dune=sphere(1,i%2?duneMat:duneLight,arabniteWorld,x,h*.34,z,2);dune.scale.set(w,h,d);});
      // Quattro pareti di sabbia alte 22–30 unità, con collisioni solide e nessun varco attraversabile.
      const duneWall=(x,z,w,d,seed=0)=>{
        const wall=sphere(1,seed%2?duneMat:duneLight,arabniteWorld,x,3.4+((seed%3)*.35),z,2);
        wall.scale.set(w,4.6+(seed%3)*.45,d);
        addBoxCollider(x,z,w*.88,d*.88,0,9);
        const crest=sphere(1,seed%2?duneLight:duneMat,arabniteWorld,x-w*.12,6.2+((seed%2)*.35),z+d*.08,2);
        crest.scale.set(w*.72,2.2,d*.72);
      };
      // Dune arretrate verso il perimetro: il centro della città resta ampio e leggibile.
      for(let i=0;i<7;i++){
        const z=-55+i*19;
        duneWall(104,z,20,18,i);
        duneWall(253,z,20,18,i+1);
      }
      for(let i=0;i<7;i++){
        const x=119+i*19;
        duneWall(x,-66,20,18,i+1);
        duneWall(x,91,20,18,i);
      }
      for(let i=0;i<18;i++){const x=136+(i*17%83),z=-38+((i*29)%112);if((x>155&&x<211&&z>-5&&z<22)||Math.hypot(x-190,z-48)<15||(Math.abs(x-208)<17&&Math.abs(z+12)<13))continue;const rock=sphere(.8,rockMat,arabniteWorld,x,.55+(i%3)*.12,z,1);rock.scale.set(.9+(i%4)*.25,.7+(i%3)*.18,.8+(i%5)*.18);}
      // Un solo sistema di punti per il cielo stellato, leggero anche su mobile.
      const starPositions=[];for(let i=0;i<180;i++){const x=132+(i*37%96),y=17+(i*19%25),z=-42+(i*53%112);starPositions.push(x,y,z);}
      const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute("position",new THREE.Float32BufferAttribute(starPositions,3));
      const starField=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:"#f6e7ff",size:.34,transparent:true,opacity:.82,sizeAttenuation:true}));arabniteWorld.add(starField);
       // Unico grande tendone di Arabnite: arena aperta dedicata ai duelli 1 contro 1.
       const arenaX=208,arenaZ=-12,arenaWood=mat("#593a2b"),arenaGold=mat("#e8bd68",.24,{metalness:.35}),arenaCloth=mat("#713d58"),arenaLight=mat("#f6d58a",.25,{emissive:"#c98736",emissiveIntensity:.6});
       const arenaTent=new THREE.Group();arabniteWorld.add(arenaTent);arenaTent.position.set(arenaX,0,arenaZ);
       for(const sx of [-12.5,12.5])for(const sz of [-8.5,8.5]){
         cylinder(.2,.27,7.2,arenaWood,arenaTent,sx,3.6,sz,10);
         cylinder(.3,.34,.24,arenaGold,arenaTent,sx,.18,sz,10);
       }
       const canopy=addMesh(new THREE.ConeGeometry(17.2,5.2,4),arenaCloth,arenaTent,0,8.2,0);canopy.rotation.y=Math.PI/4;
       box(25.4,.38,17.4,arenaCloth,arenaTent,0,5.8,0);
       for(const sx of [-12.5,12.5])box(.28,1.3,17.2,arenaCloth,arenaTent,sx,5.05,0);
       for(const sz of [-8.5,8.5])box(25.2,1.3,.28,arenaCloth,arenaTent,0,5.05,sz);
       const arenaRug=addMesh(new THREE.PlaneGeometry(20,13),mat("#512e4e"),arenaTent,0,.055,0);arenaRug.rotation.x=-Math.PI/2;
       const arenaBorder=addMesh(new THREE.PlaneGeometry(21,14),arenaGold,arenaTent,0,.035,0);arenaBorder.rotation.x=-Math.PI/2;
       box(8,.55,3.8,arenaWood,arenaTent,0,1.05,0);
       box(8.25,.14,4.05,arenaGold,arenaTent,0,1.36,0);
       for(const side of [-1,1]){
         box(1.3,.16,2.4,arenaGold,arenaTent,side*5.4,.55,0);
         const sigil=addMesh(new THREE.CircleGeometry(.75,6),arenaLight,arenaTent,side*5.4,.66,0);sigil.rotation.x=-Math.PI/2;
       }
       for(let i=0;i<6;i++){const lamp=new THREE.Group();arenaTent.add(lamp);lamp.position.set(-9+i*3.6,4.5,-8.2);cylinder(.18,.22,.42,arenaGold,lamp,0,0,0,8);sphere(.2,arenaLight,lamp,0,-.12,0,1);}

      const oasis=addMesh(new THREE.CircleGeometry(9,48),mat("#287f91",.2,{metalness:.16}),arabniteWorld,190,.04,48);oasis.rotation.x=-Math.PI/2;
      for(let i=0;i<9;i++){const a=i*Math.PI*2/9,x=190+Math.cos(a)*11,z=48+Math.sin(a)*11;cylinder(.28,.48,4,wood,arabniteWorld,x,2,z,8);addCollider(x,z,.58,4.5);for(let k=0;k<5;k++){const lf=sphere(1.8,mat("#397d50"),arabniteWorld,x+Math.cos(a+k*1.2)*1.5,4.1,z+Math.sin(a+k*1.2)*1.5,1);lf.scale.set(1.4,.16,.48);lf.rotation.y=a+k*1.2;}hangLantern(x,z,2.8);}
      for(let i=0;i<18;i++){const pebble=sphere(.18,lantern,arabniteWorld,150+i*4.5,.14,38+Math.sin(i*.5)*2,1);pebble.scale.y=.3;}
       // La piazza resta libera: nessun bancone, panchina o tendone secondario.
      makeNpc("guard","Biglia","Custode del Sigillo Cremisi",158,-1,"#b72c25",["Il fuoco antico protegge Arabnite.","Il Sigillo Cremisi non deve spegnersi."],1.15,{parent:arabniteWorld});
      makeNpc("merchant","Brama","Mercante delle Gemme",190,-3,"#a98251",["Ogni tesoro ha una storia.","Le gemme più rare arrivano dalle dune."],1.08,{parent:arabniteWorld});
      makeNpc("keeper","Lumen","Custode della Luna",177,20,"#514080",["La notte è una mappa piena di stelle.","Segui la luna per trovare l'oasi."],1,{parent:arabniteWorld});
      makeNpc("archivist","Ponce","Emiro del Bazar",205,8,"#d9a34c",["Benvenuto nel bazar di Arabnite.","Qui ogni spezia ha un segreto."],1.08,{parent:arabniteWorld});
      makeNpc("farmer","Sanlegno","Spirito del Bosco Ardente",146,14,"#8b633f",[],1.05,{parent:arabniteWorld});
      makeNpc("barista","Trix","Guardiana dei Vicoli Lunari",211,43,"#45347d",["I vicoli cambiano quando sorge la luna.","Non tutto ciò che brilla è un tesoro."],.95,{parent:arabniteWorld});
      makeNpc("town-cook","Vudele","Giocattolaio delle Caramelle",164,53,"#e85b9b",["I miei dolci nascondono sorprese.","Un sorriso apre più porte di una chiave."],1,{parent:arabniteWorld});
      // Cervio, Gunvallo e Rullino sono i tre personaggi giocabili: non esistono copie-NPC.
       // Rimossi i filari di lanterne sospese nel cielo e quelle senza sostegno vicino ai cespugli.
       for(let i=0;i<14;i++){const x=139+(i*23%88),z=-31+(i*31%91);if((x>158&&x<207&&z>-5&&z<22)||Math.hypot(x-190,z-48)<14)continue;const shrub=sphere(.72,i%2?mat("#47764b"):mat("#5f8151"),arabniteWorld,x,.48,z,1);shrub.scale.set(1.25,.62,1);}
      interactables.filter(item=>item.x>120&&item.id!=="arabnite-return").forEach(item=>{
        item.action=()=>setDialogue({title:item.title,text:"Le strade di Arabnite sono aperte ai viaggiatori. Per ora non ci sono incarichi: goditi la città e cerca le bustine dei Sognatori."});
      });
      // Ponce e Sanlegno sono presenti come abitanti, ma senza interazioni o dialoghi.
      removeNpcInteraction("Ponce");
       removeNpcInteraction("Sanlegno");
      // Lumen resta visibile nell'overworld, ma senza dialogo né interazione.
      removeNpcInteraction("Lumen");
       addInteraction("arabnite-card-arena","Arena delle Carte","Entra nell’arena e sfida un avversario in un duello 1 contro 1.",208,-12,()=>{setCardDuel(null);setCardDuelOpen(true);},7.5);
      // I bazar sono interazioni integrate con i rispettivi NPC: nessun punto di interazione sovrapposto.
      const setArabniteNpcAction=(name,description,action,radius=7.2)=>{
        const entry=interactables.find(item=>item.title.startsWith(name+" ·"));
        if(entry){entry.text=description;entry.action=action;entry.radius=radius;}
      };
       setArabniteNpcAction("Brama","BUSTINE STANDARD · 30 monete · scambia doppioni.",()=>setDialogue({title:"Brama · Bazar delle Bustine",text:"«Ehi viaggiatore! Qui trovi le bustine standard dei Sognatori. Ogni bustina contiene 3 carte: puoi anche scambiare un doppione con una carta che ti manca.»",actions:[{label:"Compra 1 bustina · 30 monete",run:()=>{buyArabnitePack("standard");}},{label:"Compra 3 bustine · 90 monete",run:()=>{if(buyArabnitePack("standard")&&buyArabnitePack("standard")&&buyArabnitePack("standard"))setDialogue(null);}},{label:"Scambia un doppione",run:()=>tradeArabniteCard("Brama")}]}),7.2);
       // Ponce resta visibile come abitante, ma non apre dialoghi né interazioni.
       setArabniteNpcAction("Trix","BUSTINE RARE · 110 monete.",()=>setDialogue({title:"Trix · Emporio Raro",text:"«Le mie bustine rare contengono soltanto carte epiche o leggendarie: tre tesori per i collezionisti.»",actions:[{label:"Compra rara · 110 monete",run:()=>{buyArabnitePack("rare");}}]}),7.2);
      // Adli accoglie chi arriva ad Arabnite: è l'inventore del gioco di carte dei Sognatori.
      const adli=makeNpc("archivist","Adli","Inventore del Gioco di Carte",151,7,"#c68b42",[
        "Benvenuto ad Arabnite! Qui le carte dei Sognatori sono una vera passione.",
        "Sono stato io a inventare il Gioco di Carte dei Sognatori."
      ],1.12,{parent:arabniteWorld});
      // Adli usa il modello 3D originale da mago-albero, non un artwork piatto.
      adli.userData.isArabniteFounder=true;
      removeNpcInteraction("Adli");
      addInteraction("adli-origin-story","Adli · Inventore del Gioco", "Il fondatore del Gioco di Carte dei Sognatori ti dà il benvenuto.",151,7,()=>setDialogue({
        title:"Adli · L'inventore del gioco",
        text:"«Benvenuto ad Arabnite! Forse non lo sai, ma sono stato io a inventare il Gioco di Carte dei Sognatori. All'inizio era solo un modo per raccogliere le storie e le abilità dei Sognatori. Poi sono nate le bustine, i bazar e la voglia di completare la collezione. Qui puoi comprare nuove bustine, trovare carte rare e scambiarle con altri collezionisti. La tua avventura comincia proprio da qui!»"
      }),4.4);
      const makeArabnitePack=(id,x,z)=>{
        const g=new THREE.Group();arabniteWorld.add(g);g.position.set(x,.62,z);
        const foil=mat("#6d3c8f",.3,{metalness:.42}),foilLight=mat("#b98be0",.28,{metalness:.32}),seal=mat("#f5cf72",.25,{metalness:.45});
        box(.92,.96,.16,foil,g,0,0,0);box(.98,.13,.2,seal,g,0,.5,0);box(.72,.08,.19,foilLight,g,0,.25,.1);
        const crest=addMesh(new THREE.OctahedronGeometry(.2),seal,g,0,.03,.12);crest.rotation.z=Math.PI/4;
        for(const side of [-1,1]){const fold=box(.12,.82,.12,foilLight,g,side*.42,0,.08);fold.rotation.z=side*.12;}
        const halo=addMesh(new THREE.TorusGeometry(.72,.035,6,24),seal,g,0,-.08,0);halo.rotation.x=Math.PI/2;
        const phase=x*.17+z*.11,already=arabniteCollectionRef.current.collectedPackIds.includes(id);
        g.visible=!already;arabnitePackMeshes.push({group:g,baseY:.62,phase});
        if(!already)addInteraction("arabnite-pack-"+id,"Bustina dei Sognatori","Una bustina sigillata: raccoglila e aprila dall'Album dei Sognatori.",x,z,()=>{
          if(arabniteCollectionRef.current.collectedPackIds.includes(id))return;g.visible=false;collectArabnitePack(id);
        },3.1);
      };
      [["souq-rooftop",139,-24],["silk-alley",165,-36],["west-arcade",205,-35],["moon-minaret",226,12],["oasis-terrace",224,48],["palm-courtyard",190,64],["garden-steps",154,50],["lantern-gate",140,12],["north-west-terrace",151,-50],["north-market-roof",180,-48],["north-east-arch",214,-46],["eastern-dune",239,-4],["east-lantern",240,22],["south-east-courtyard",232,67],["south-oasis-edge",204,75],["south-garden",172,69],["south-west-gate",133,35],["west-crescent",136,-2]].forEach(([id,x,z])=>makeArabnitePack(id,x,z));
      // Bersagli di caramella per la skill di Gunvallo: colpirli assegna monete del bazar.
      [[174,-28],[216,-18],[224,30],[151,39],[185,55]].forEach(([x,z],index)=>{
        const jar=new THREE.Group();arabniteWorld.add(jar);jar.position.set(x,0,z);
        const glass=mat("#e8b4dc",.24,{transparent:true,opacity:.82,roughness:.25});
        cylinder(.32,.38,.72,glass,jar,0,.42,0,10);
        cylinder(.38,.38,.12,mat("#f2c66d"),jar,0,.82,0,10);
        const candy=addMesh(new THREE.OctahedronGeometry(.22),mat(index%2?"#ff7c9d":"#8de1c5"),jar,0,.48,.04);candy.rotation.z=.3;
        arabniteCandyTargets.push({group:jar,x,z,active:true});
      });
      arabniteReady=true;
      } catch(error) {
        arabniteReady=false;
        isArabniteIceAt=()=>false;
        arabniteWorld.clear();
        interactables.splice(arabniteBuildSnapshot.interactables);
        colliders.splice(arabniteBuildSnapshot.colliders);
        npcActors.splice(arabniteBuildSnapshot.npcActors);
        arabnitePackMeshes.splice(arabniteBuildSnapshot.packs);
        arabPortalEffects.splice(arabniteBuildSnapshot.portalEffects);
        console.error("Arabnite non inizializzata: Amargenta resta autonoma",error);
      }

      const linaInteraction=interactables.find(item=>item.id==="farmer");
      if(linaInteraction)linaInteraction.action=()=>{
        if(questCountRef.current>=3){
          if(!questDoneRef.current){questDoneRef.current=true;setQuestDone(true);awardResidentTrust("farmer");setToast("Missione completata · Fave d'Ambra · Fiducia di Flame +1");}
          setDialogue({title:"Flame · Coltivatrice",text:"Hai riportato tutte e tre le Fave d'Ambra! Le terrazze ti riconoscono come raccoglitore esperto."});
        } else if(!questActiveRef.current){
          questActiveRef.current=true;setQuestStarted(true);
          setDialogue({title:"Flame · La raccolta delle Fave d'Ambra",text:"Tre fave speciali sono cadute tra le terrazze. Le riconosci dal bagliore dorato. Raccoglile e torna da me."});
        } else setDialogue({title:"Flame · Coltivatrice",text:"Te ne mancano ancora "+(3-questCountRef.current)+". Cerca tra i filari delle terrazze."});
      };
      const ormaInteraction=interactables.find(item=>item.id==="archivist");
      if(ormaInteraction)ormaInteraction.action=()=>{
        if(recipePagesRef.current>=4){
          if(!recipeDoneRef.current){recipeDoneRef.current=true;setRecipeDone(true);awardResidentTrust("archivist");setToast("Missione completata · Ricetta Perduta · Fiducia +1");}
          setDialogue({title:"Belligonghi-umami · Archivista",text:"Hai ricomposto la Ricetta delle Sette Tostature. La custodirò nell'archivio della città."});
        } else if(!recipeStartedRef.current){
          recipeStartedRef.current=true;setRecipeStarted(true);
          setDialogue({title:"Belligonghi-umami · La Ricetta Perduta",text:"Quattro pagine della ricetta originale sono state disperse per Amargenta. Recuperale: la quinta tostatura non deve andare perduta."});
        } else setDialogue({title:"Belligonghi-umami · Archivista",text:"Pagine recuperate: "+recipePagesRef.current+"/4. Cerca nei luoghi antichi, vicino ai ponti e alle botteghe."});
      };
      const brunoInteraction=interactables.find(item=>item.id==="guard");
      if(brunoInteraction)brunoInteraction.action=()=>{
        if(valvesRef.current>=3){
          if(!waterDoneRef.current){waterDoneRef.current=true;setWaterDone(true);awardResidentTrust("guard");setInventory(old=>({...old,waterCrystals:old.waterCrystals+1}));setToast("Missione completata · Condotte Riattivate · Fiducia +1");}
          setDialogue({title:"Cardinero · Guardiano del ponte",text:"L'acqua è tornata a scorrere in tutte le condotte. Amargenta ti deve un favore."});
        } else if(!waterStartedRef.current){
          waterStartedRef.current=true;setWaterStarted(true);
          setDialogue({title:"Cardinero · Le Condotte Antiche",text:"Tre valvole sono bloccate lungo il fiume. Riattivale per riportare acqua ai giardini e alle cascate."});
        } else setDialogue({title:"Cardinero · Guardiano del ponte",text:"Condotte riattivate: "+valvesRef.current+"/3. Cerca le valvole vicino ai ponti e alla torrefazione."});
      };
      [[-34,-37],[-12,-45],[-4,-28]].forEach((p,i)=>{
        const g=new THREE.Group();scene.add(g);g.position.set(p[0],.8,p[1]);
        if(collectedAmberRef.current.has(i))g.visible=false;
        const core=sphere(.34,gold,g,0,0,0,2);core.scale.set(.78,1.25,.78);
        const ring=addMesh(new THREE.TorusGeometry(.56,.045,6,20),mat("#f4d28d",.3,{emissive:"#c58a42",emissiveIntensity:.7}),g,0,0,0);ring.rotation.x=Math.PI/2;
        g.userData.amberPickup=true;
        amberPickups.push(g);
        if(!collectedAmberRef.current.has(i)) addInteraction("amber-bean-"+i,"Fava d'Ambra","Una fava rara raccolta sulle terrazze.",p[0],p[1],()=>{
          if(!questActiveRef.current){setDialogue({title:"Fava d'Ambra",text:"È una fava rara. Flame potrebbe sapere cosa farne."});return;}
          if(g.userData.collected||collectedAmberRef.current.has(i))return;
          g.userData.collected=true;g.visible=false;removeInteraction("amber-bean-"+i);collectedAmberRef.current.add(i);
          const nextCollected=[...collectedAmberRef.current];setCollectedAmber(nextCollected);
          questCountRef.current+=1;setQuestCount(questCountRef.current);
          setInventory(old=>({...old,amberBeans:old.amberBeans+1}));
          if(questCountRef.current===3)setDialogue({title:"Raccolta completata",text:"Hai trovato tutte e tre le Fave d'Ambra. Torna da Flame per concludere la missione."});
          else setDialogue({title:"Fava d'Ambra raccolta",text:"Fave trovate: "+questCountRef.current+"/3."});
        },2.8);
      });
      // Quattro pagine della ricetta originale, ciascuna custodita in un punto diverso.
      [[-35,-16],[28,-30],[-61,62],[48,45]].forEach((p,i)=>{
        const page=new THREE.Group();scene.add(page);page.position.set(p[0],.9,p[1]);
        const parchment=box(.55,.08,.72,mat("#e9d3a7"),page,0,0,0);parchment.rotation.y=.25;
        box(.38,.025,.04,mat("#9d7048"),page,0,.055,-.15);
        box(.3,.025,.04,mat("#9d7048"),page,0,.055,0);
        box(.34,.025,.04,mat("#9d7048"),page,0,.055,.15);
        if(collectedPagesRef.current.has(i))page.visible=false;
        if(!collectedPagesRef.current.has(i)) addInteraction("recipe-page-"+i,"Pagina della Ricetta Perduta","Una pagina antica della Ricetta delle Sette Tostature.",p[0],p[1],()=>{
          if(!recipeStartedRef.current){setDialogue({title:"Pagina della Ricetta",text:"Una pagina preziosa. Belligonghi-umami saprà cosa farne."});return;}
          if(collectedPagesRef.current.has(i))return;
          collectedPagesRef.current.add(i);removeInteraction("recipe-page-"+i);setCollectedPages([...collectedPagesRef.current]);
          recipePagesRef.current+=1;setRecipePages(recipePagesRef.current);
          setInventory(old=>({...old,recipeFragments:old.recipeFragments+1}));
          page.visible=false;
          setDialogue({title:"Pagina recuperata",text:"Pagine della ricetta: "+recipePagesRef.current+"/4."});
          if(recipePagesRef.current===4)setToast("Hai recuperato tutte le pagine: torna da Belligonghi-umami");
        },2.8);
      });
      // Tre valvole interattive lungo le condotte: ogni attivazione cambia davvero lo stato.
      [[19,-18],[37,18],[13,38]].forEach((p,i)=>{
        const valve=new THREE.Group();scene.add(valve);valve.position.set(p[0],0,p[1]);
        cylinder(.18,.22,1.25,darkStone,valve,0,.62,0,8);
        const wheel=addMesh(new THREE.TorusGeometry(.52,.09,8,16),gold,valve,0,1.3,0);wheel.rotation.x=Math.PI/2;
        const handle=box(.12,1.1,.12,wood,valve,0,1.3,0);
        addCollider(p[0],p[1],.38);
        if(activatedValvesRef.current.has(i)){wheel.material=mat("#80b99a",.3,{emissive:"#2e7755",emissiveIntensity:.6});handle.material=mat("#80b99a");}
        if(!activatedValvesRef.current.has(i)) addInteraction("water-valve-"+i,"Valvola delle Condotte","Una valvola antica collegata alle cascate.",p[0],p[1],()=>{
          if(!waterStartedRef.current){setDialogue({title:"Valvola bloccata",text:"Cardinero al ponte dovrebbe sapere come riattivare le condotte."});return;}
          if(activatedValvesRef.current.has(i))return;
          activatedValvesRef.current.add(i);removeInteraction("water-valve-"+i);setActivatedValves([...activatedValvesRef.current]);
          valvesRef.current+=1;setValves(valvesRef.current);
          wheel.material=mat("#80b99a",.3,{emissive:"#2e7755",emissiveIntensity:.6});handle.material=mat("#80b99a");
          setDialogue({title:"Condotta riattivata",text:"Valvole attivate: "+valvesRef.current+"/3."});
          if(valvesRef.current===3)setToast("Le tre condotte sono di nuovo attive: torna da Cardinero");
        },3.1);
      });
      makeNpc("roaster","Zibelle","Esperto del caffè",69,66,"#9c5738",["Qui trasformiamo le fave in aroma.","Ascolta il ritmo dei tamburi di tostatura: ogni fase ha il suo tempo."]);
      const roasterInteraction=interactables.find(item=>item.id==="roaster");
      if(roasterInteraction)roasterInteraction.action=()=>{
        const beans=inventoryRef.current.amberBeans;
        if(beans<3){setDialogue({title:"Zibelle · Banco di tostatura",text:"Per preparare una Miscela d'Autore servono 3 Fave d'Ambra.\nIn borsa: "+beans+"."});return;}
        setInventory(old=>({...old,amberBeans:old.amberBeans-3,coffeeBlend:old.coffeeBlend+1}));
        setDialogue({title:"Miscela d'Autore",text:"Zibelle ha tostato tre Fave d'Ambra e preparato una Miscela d'Autore. La miscela è stata aggiunta alla tua borsa."});
      };
      const nerioInteraction=interactables.find(item=>item.id==="merchant");
      if(nerioInteraction)nerioInteraction.action=()=>{
        const bag=inventoryRef.current;
        if(bag.milk>0&&bag.truffles>0&&bag.peppers>0&&bag.coffeeBeans>0){
          setInventory(old=>({...old,milk:old.milk-1,truffles:old.truffles-1,peppers:old.peppers-1,coffeeBeans:old.coffeeBeans-1,amberBeans:old.amberBeans+4}));
          setDialogue({title:"Muccanza · Mercato di Amargenta",text:"Affare fatto! Ho acquistato 1 latte, 1 tartufo, 1 peperoncino e 1 chicco di caffè. Hai ricevuto 4 Fave d'Ambra."});
        }else{
          setDialogue({title:"Muccanza · Mercato di Amargenta",text:"Compro i prodotti freschi di Amargenta: consegnami 1 latte, 1 tartufo, 1 peperoncino e 1 chicco di caffè e ti pago 4 Fave d'Ambra. Raccogli i prodotti e torna da me."});
        }
      };
      makeNpc("keeper","Belligonghi-umami","Custode delle ricette",72,72,"#76618b",["Le ricette si tramandano, non si comprano.","La miscela perfetta nasce dall'equilibrio."]);
      const adaInteraction=interactables.find(item=>item.id==="keeper");
      if(adaInteraction)adaInteraction.action=()=>{
        if(blendDoneRef.current){setDialogue({title:"Belligonghi-umami · Custode delle ricette",text:"La Miscela delle Tre Foglie è custodita nella memoria di Amargenta. Hai dimostrato di saper rispettare ogni ingrediente."});return;}
        const blends=inventoryRef.current.coffeeBlend, teas=inventoryRef.current.herbalTea;
        if(!blendStartedRef.current){
          blendStartedRef.current=true;setBlendStarted(true);
          setDialogue({title:"Belligonghi-umami · La Miscela delle Tre Foglie",text:"Vorrei ricreare la miscela cerimoniale della città. Portami una Miscela d'Autore preparata da Zibelle e una Tisana del Retrogusto preparata da Muccanza. Solo unendo tostatura e infusione si rivela il suo aroma."});
          return;
        }
        if(blends<1||teas<1){
          setDialogue({title:"Belligonghi-umami · La Miscela delle Tre Foglie",text:"Ci siamo quasi. Servono 1 Miscela d'Autore e 1 Tisana del Retrogusto. Nella tua borsa: "+blends+" miscele e "+teas+" tisane. Zibelle usa 3 Fave d'Ambra; Muccanza usa 1 Fava e 1 agrume."});
          return;
        }
        setInventory(old=>({...old,coffeeBlend:old.coffeeBlend-1,herbalTea:old.herbalTea-1,relics:old.relics+1}));
        blendDoneRef.current=true;setBlendDone(true);awardResidentTrust("keeper");
        setToast("Ricetta segreta completata · Fiducia di Belligonghi-umami +1 · Reliquia ottenuta");
        setDialogue({title:"Belligonghi-umami · La Miscela delle Tre Foglie",text:"Tostatura e infusione si sono unite in un aroma antico. Hai ricreato la miscela cerimoniale di Amargenta! Belligonghi-umami ti affida una Reliquia delle Tre Foglie."});
      };
      makeNpc("cafe-host","Muccanza","Gestore della caffetteria",-68,66,"#8b6849",["Questo locale esiste da prima della grande piazza.","Ogni tavolo ha ascoltato una storia diversa."]);
      const eliaInteraction=interactables.find(item=>item.id==="cafe-host");
      if(eliaInteraction)eliaInteraction.action=()=>{
        if(bellsDoneRef.current){setDialogue({title:"Muccanza · Le campane del borgo",text:"Le tre campane hanno ritrovato la loro voce. Quando suonano insieme, tutta Amargenta ricorda le sue origini. Tieni questa piccola reliquia: te la sei meritata."});return;}
        if(bellCountRef.current>=3){
          bellsDoneRef.current=true;setBellsDone(true);awardResidentTrust("cafe-host");
          setInventory(old=>({...old,relics:old.relics+1}));
          setToast("Attività completata · Fiducia di Muccanza +1 · Le campane del borgo");
          setDialogue({title:"Muccanza · Il canto ritrovato",text:"Hai risvegliato tutte e tre le campane! Il loro suono si è propagato tra le terrazze e la piazza. Muccanza ti affida una Reliquia di Amargenta."});
        } else if(!bellsStartedRef.current){
          bellsStartedRef.current=true;setBellsStarted(true);
          setDialogue({title:"Muccanza · Le campane del borgo",text:"Un tempo le tre campane annunciavano l'apertura del mercato. Ora sono mute. Raggiungile nella città e interagisci con ognuna: vorrei sentire di nuovo il loro canto."});
        } else setDialogue({title:"Muccanza · Le campane del borgo",text:"Hai risvegliato "+bellCountRef.current+"/3 campane. Le trovi nella piazza e lungo la strada del mercato."});
      };
      // Piccola attività secondaria: riattiva le tre campane storiche di Amargenta.
      [[-30,4],[-2,18],[16,-2]].forEach((p,i)=>{
        const bell=new THREE.Group();scene.add(bell);bell.position.set(p[0],0,p[1]);
        cylinder(.09,.11,2.35,wood,bell,0,1.18,0,8);
        box(.72,.12,.72,gold,bell,0,2.35,0);
        const body=cylinder(.34,.48,.62,gold,bell,0,1.95,0,12);
        sphere(.09,wood,bell,0,1.58,0,1);
        if(activatedBellsRef.current.has(i))body.material=mat("#80b99a",.3,{emissive:"#2e7755",emissiveIntensity:.6});
        const clapper=sphere(.09,wood,bell,0,1.55,0,1);
        bellActors.push({group:bell,body,clapper,index:i});
        if(!activatedBellsRef.current.has(i))addInteraction("town-bell-"+i,"Campana del borgo","Una delle tre campane storiche di Amargenta.",p[0],p[1],()=>{
          if(!bellsStartedRef.current){setDialogue({title:"Campana silenziosa",text:"La campana è ancora bloccata. Muccanza, al Caffè delle Tre Foglie, conosce la storia delle tre campane."});return;}
          if(activatedBellsRef.current.has(i))return;
          activatedBellsRef.current.add(i);removeInteraction("town-bell-"+i);setActivatedBells([...activatedBellsRef.current]);
          bellCountRef.current+=1;setBellCount(bellCountRef.current);
          body.material=mat("#80b99a",.3,{emissive:"#2e7755",emissiveIntensity:.6});
          setToast("Campana risvegliata · "+bellCountRef.current+"/3");
          if(bellCountRef.current===3)setDialogue({title:"Il canto di Amargenta",text:"La terza campana ha risposto alle altre. Torna da Muccanza al Caffè delle Tre Foglie."});
          else setDialogue({title:"Campana risvegliata",text:"Il bronzo ha vibrato dopo anni di silenzio. Campane attivate: "+bellCountRef.current+"/3."});
        },3.2);
      });
      // Cassa nascosta del vecchio botanico: premio facoltativo per chi esplora il margine occidentale.
      const botanicalChest = new THREE.Group();
      scene.add(botanicalChest);
      botanicalChest.position.set(-49,0,-50);
      box(1.55,.82,1.05,wood,botanicalChest,0,.48,0);
      box(1.62,.16,1.12,gold,botanicalChest,0,.91,0);
      box(.18,.48,.16,gold,botanicalChest,0,.57,.58);
      const botanicalGem = sphere(.18,mat("#a8c99b",.22,{emissive:"#547b4a",emissiveIntensity:.65}),botanicalChest,0,1.18,0,2);
      botanicalGem.visible = !botanicalCacheClaimedRef.current;
      botanicalChest.visible = !botanicalCacheClaimedRef.current;
      if (!botanicalCacheClaimedRef.current) addInteraction("botanical-cache","Cassa del Vecchio Botanico","Una piccola cassa dimenticata tra le rocce. Il fermaglio porta il simbolo delle Tre Foglie.",-49,-50,()=>{
        if (botanicalCacheClaimedRef.current) return;
        botanicalCacheClaimedRef.current = true;
        setBotanicalCacheClaimed(true);
        botanicalChest.visible = false;
        setInventory(old=>({...old,amberBeans:old.amberBeans+2,relics:old.relics+1}));
        setToast("Segreto scoperto · Cassa del Vecchio Botanico");
        setDialogue({title:"Il lascito del Botanico",text:"Hai trovato una cassa nascosta tra le rocce. Dentro ci sono due Fave d'Ambra e una Reliquia antica. Il vecchio botanico ha lasciato un segno delle Tre Foglie."});
      },3.4);
      // Lucciole decorative: compaiono soltanto di notte nel giardino e vicino alla piazza.
      const fireflyMaterial=mat("#f3d88b",.25,{emissive:"#d9a94c",emissiveIntensity:1.1});
      for(let i=0;i<18;i++){
        const x=-34+(i%6)*11, z=-10+Math.floor(i/6)*13;
        const glow=sphere(.075,fireflyMaterial,scene,x,1.4+(i%4)*.28,z,1);
        glow.visible=false;
        fireflies.push({mesh:glow,baseX:x,baseZ:z,phase:i*.83});
      }
      if(!citrusHarvestedRef.current) addInteraction("citrus-harvest","Agrumi maturi","Un piccolo raccolto profumato.",-48,18,()=>{
        if(citrusHarvestedRef.current){setDialogue({title:"Agrumeto",text:"Hai già raccolto gli agrumi maturi di questo filare."});return;}
        citrusHarvestedRef.current=true;removeInteraction("citrus-harvest");setCitrusHarvested(true);
        setInventory(old=>({...old,citrus:old.citrus+1}));
        setDialogue({title:"Raccolta di Agrumi",text:"Hai raccolto un agrume profumato dai giardini di Amargenta. Muccanza potrebbe scambiarlo con te."});
      },4.5);
      // TALPITRIPPA 3D — modello volumetrico originale, non billboard.
      // Proporzioni: corpo tozzo, testa ampia, ventre crema, naso rosa, baffi dorati e artigli.
      const talpitrippa = new THREE.Group();
      const makePixelFur = (base, palette, seed=7) => {
        const canvas=document.createElement("canvas");canvas.width=canvas.height=256;
        const ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=false;
        ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
        let v=seed;const rand=()=>{v=(v*16807)%2147483647;return(v-1)/2147483646;};
        for(let i=0;i<5600;i++){
          const x=Math.floor(rand()*128)*4,y=Math.floor(rand()*128)*4;
          ctx.globalAlpha=.22+rand()*.42;ctx.fillStyle=palette[Math.floor(rand()*palette.length)];
          const s=2+Math.floor(rand()*2)*2;ctx.fillRect(x,y,s,s);
        }
        ctx.globalAlpha=1;
        const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
        tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestMipmapLinearFilter;tex.generateMipmaps=true;
        return tex;
      };
      const furTex=makePixelFur("#382437",["#513449","#68465b","#241a2c","#7a5266","#30202f"],11);
      const bellyTex=makePixelFur("#f4d58a",["#ffe9a8","#e9bd69","#fff0bd","#dcae62"],23);
      const furMat=new THREE.MeshStandardMaterial({map:furTex,color:"#ffffff",roughness:1});
      const bellyMat=new THREE.MeshStandardMaterial({map:bellyTex,color:"#ffffff",roughness:1});
      const darkFur=mat("#30202f"), pawFur=mat("#493044"), clawMat=mat("#ffe09a",.62), noseMat=mat("#ef6672",.34);
      const eyeMat=new THREE.MeshPhysicalMaterial({color:"#08070c",roughness:.08,clearcoat:1,clearcoatRoughness:.03});
      const eyeGlint= new THREE.MeshBasicMaterial({color:"#ffffff"});
      const whiskerMat=mat("#f3c66e",.52,{metalness:.08});
      const ellipsoid=(parent,material,pos,scale,segments=32)=>{
        const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,segments,Math.max(16,Math.floor(segments*.7))),material);
        mesh.position.set(...pos);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
      };
      // Massa principale e testa: forme sovrapposte con raccordo morbido.
      ellipsoid(talpitrippa,furMat,[0,1.03,0],[.88,1.02,.72],48);
      ellipsoid(talpitrippa,furMat,[0,2.02,.02],[.82,.79,.70],48);
      // Ventre chiaro in primo piano.
      ellipsoid(talpitrippa,bellyMat,[0,1.10,.575],[.62,.72,.205],40);
      // Guance e muso.
      ellipsoid(talpitrippa,darkFur,[-.43,1.99,.51],[.25,.20,.18],28);
      ellipsoid(talpitrippa,darkFur,[.43,1.99,.51],[.25,.20,.18],28);
      // Occhi lucidi con riflessi: i riferimenti permettono un battito naturale.
      const eyeMeshes=[];
      for(const side of [-1,1]){
        const eye=ellipsoid(talpitrippa,eyeMat,[side*.285,2.28,.625],[.145,.19,.095],32);
        eyeMeshes.push(eye);
        ellipsoid(talpitrippa,eyeGlint,[side*.325,2.355,.708],[.045,.052,.018],16);
        ellipsoid(talpitrippa,eyeGlint,[side*.245,2.24,.713],[.018,.022,.012],12);
      }
      // Naso rosa prominente, con luce superiore.
      ellipsoid(talpitrippa,noseMat,[0,2.04,.77],[.265,.225,.17],40);
      ellipsoid(talpitrippa,new THREE.MeshBasicMaterial({color:"#ffb0a5"}),[-.075,2.145,.91],[.105,.045,.018],20);
      // Baffi dorati a ciuffi curvi, su entrambi i lati del muso.
      const whiskerCurve=(points,r=.025)=>{
        const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
        const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,16,r,7,false),whiskerMat);
        mesh.castShadow=true;talpitrippa.add(mesh);
      };
      for(const side of [-1,1]){
        for(let j=0;j<3;j++){
          const y=2.03+(j-1)*.105;
          whiskerCurve([[side*.18,y,.79],[side*.42,y+(j-1)*.055,.83],[side*.67,y+(j-1)*.12,.76]],.027);
        }
      }
      // Braccia corte e zampe anteriori appoggiate al ventre.
      const arms=[];
      for(const side of [-1,1]){
        const arm=new THREE.Group();arm.position.set(side*.57,1.32,.24);talpitrippa.add(arm);arms.push(arm);
        ellipsoid(arm,furMat,[0,0,0],[.28,.48,.30],32);
        ellipsoid(arm,pawFur,[0,-.30,.12],[.22,.19,.22],24);
        for(let k=-1;k<=1;k++){
          const claw=new THREE.Mesh(new THREE.ConeGeometry(.065,.22,12),clawMat);
          claw.position.set(k*.115,-.43,.28);claw.rotation.x=-.48;claw.rotation.z=-k*.12;claw.castShadow=true;arm.add(claw);
        }
      }
      // Piedi larghi, con tre unghiette ciascuno.
      const feet=[];
      for(const side of [-1,1]){
        const foot=new THREE.Group();foot.position.set(side*.43,.19,.17);talpitrippa.add(foot);feet.push(foot);
        ellipsoid(foot,pawFur,[0,0,.06],[.39,.20,.43],32);
        for(let k=-1;k<=1;k++){
          const claw=new THREE.Mesh(new THREE.ConeGeometry(.085,.25,12),clawMat);
          claw.position.set(k*.19,-.015,.39);claw.rotation.x=-.58;claw.rotation.z=-k*.16;claw.castShadow=true;foot.add(claw);
        }
      }
      // Piccole ciocche in rilievo lungo la silhouette per evitare l'effetto gommoso.
      for(let i=0;i<17;i++){
        const a=(i/17)*Math.PI*2;
        const tuft=ellipsoid(talpitrippa,darkFur,[Math.cos(a)*.76,1.45+Math.sin(a)*.68,Math.sin(a)*.52],[.075,.12,.07],12);
        tuft.rotation.z=-Math.cos(a)*.35;
      }
      talpitrippa.position.set(0,0,0);
      player.add(talpitrippa);

      // RIPPLE 3D — secondo personaggio selezionabile e giocabile nell'overworld.
      // Modello procedurale ispirato allo screenshot: squalo antropomorfo, tuta rossa,
      // fasce bianche/nere, sneakers e amo. Tutte le parti sono geometria 3D.
      const ripple = new THREE.Group();
      const rippleBlack=mat("#171820",.48), rippleDark=mat("#252630",.52);
      const rippleWhite=mat("#eee9df",.72), rippleRed=mat("#c92332",.48);
      const rippleRedDark=mat("#831b28",.58), rippleSole=mat("#f4eee4",.82);
      const rippleEye=new THREE.MeshPhysicalMaterial({color:"#e8e4df",roughness:.16,clearcoat:1});
      const rippleIris=mat("#d52d37",.24,{metalness:.18});
      const ripplePupil=mat("#100f16",.12);
      const rippleTeeth=mat("#fff4d9",.35);
      const rippleBody=new THREE.Group();ripple.add(rippleBody);
      const rEll=(parent,material,pos,scale,detail=24)=>{
        const m=new THREE.Mesh(new THREE.SphereGeometry(1,detail,Math.max(12,detail>>1)),material);
        m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
      };
      // Testa allungata e muso da squalo.
      rEll(rippleBody,rippleBlack,[0,2.16,.02],[.66,.73,.62],40);
      rEll(rippleBody,rippleDark,[0,2.28,.48],[.59,.40,.72],36);
      rEll(rippleBody,rippleWhite,[0,1.98,.72],[.53,.18,.57],32);
      // Mascella aperta: interno rosso e doppia fila di denti.
      rEll(rippleBody,rippleRedDark,[0,1.91,.93],[.48,.12,.40],32);
      rEll(rippleBody,rippleWhite,[0,2.035,.93],[.49,.075,.39],32);
      for(let i=0;i<7;i++){
        const x=-.38+i*.127;
        const tooth=new THREE.Mesh(new THREE.ConeGeometry(.045,.15,8),rippleTeeth);
        tooth.position.set(x,1.985,.99);tooth.rotation.z=Math.PI;tooth.castShadow=true;rippleBody.add(tooth);
        const lower=new THREE.Mesh(new THREE.ConeGeometry(.04,.13,8),rippleTeeth);
        lower.position.set(x,1.855,1.02);lower.castShadow=true;rippleBody.add(lower);
      }
      // Occhio laterale rosso, grande e leggibile.
      rEll(rippleBody,rippleEye,[-.47,2.47,.38],[.17,.19,.10],28);
      rEll(rippleBody,rippleIris,[-.49,2.47,.465],[.105,.12,.045],24);
      rEll(rippleBody,ripplePupil,[-.50,2.47,.502],[.055,.075,.025],20);
      rEll(rippleBody,rippleEye,[-.52,2.51,.523],[.025,.03,.012],12);
      // Secondo occhio speculare, leggibile anche nelle inquadrature frontali.
      rEll(rippleBody,rippleEye,[.47,2.47,.38],[.17,.19,.10],28);
      rEll(rippleBody,rippleIris,[.49,2.47,.465],[.105,.12,.045],24);
      rEll(rippleBody,ripplePupil,[.50,2.47,.502],[.055,.075,.025],20);
      rEll(rippleBody,rippleEye,[.52,2.51,.523],[.025,.03,.012],12);
      // Corpo a righe bianco/nero e dettagli rossi sulla schiena.
      rEll(rippleBody,rippleBlack,[0,1.25,-.02],[.49,.77,.39],32);
      for(let i=0;i<4;i++){
        const stripe=rEll(rippleBody,rippleWhite,[0,.91+i*.20,.285],[.47,.055,.13],24);
        stripe.rotation.z=-.05;
      }
      const dorsal=new THREE.Mesh(new THREE.ConeGeometry(.16,.42,8),rippleRed);
      dorsal.position.set(.02,2.68,-.34);dorsal.rotation.z=-.25;dorsal.castShadow=true;rippleBody.add(dorsal);
      // Pantaloncini rossi con bande laterali bianche.
      rEll(rippleBody,rippleRed,[0,.69,.02],[.51,.30,.40],32);
      for(const side of [-1,1]){
        const stripe=rEll(rippleBody,rippleSole,[side*.48,.72,.045],[.045,.25,.32],18);
        stripe.rotation.z=side*-.10;
      }
      const rippleArms=[],rippleFeet=[];
      for(const side of [-1,1]){
        const arm=new THREE.Group();arm.position.set(side*.53,1.42,.02);rippleBody.add(arm);rippleArms.push(arm);
        const limb=rEll(arm,rippleBlack,[side*.10,-.35,.02],[.17,.55,.19],24);limb.rotation.z=side*-.13;
        rEll(arm,rippleRedDark,[side*.13,-.66,.06],[.13,.23,.15],18);
        for(let k=0;k<3;k++)rEll(arm,rippleWhite,[side*(.08+k*.055),-.82,.14],[.035,.10,.04],12);
        const leg=new THREE.Group();leg.position.set(side*.23,.48,.04);rippleBody.add(leg);rippleFeet.push(leg);
        rEll(leg,rippleWhite,[0,-.20,.01],[.13,.38,.14],20);
        rEll(leg,rippleRed,[0,-.43,.08],[.17,.13,.22],20);
        rEll(leg,rippleSole,[0,-.52,.12],[.20,.055,.27],20);
        // Lacci delle sneakers.
        for(let lace=0;lace<3;lace++)rEll(leg,rippleWhite,[0,-.39+lace*.045,.255],[.09,.018,.018],10);
      }
      // Amo appeso al muso con cordino rosso.
      const hookCurve=new THREE.CatmullRomCurve3([
        new THREE.Vector3(-.59,2.03,.75),new THREE.Vector3(-.72,1.75,.82),
        new THREE.Vector3(-.70,1.48,.80),new THREE.Vector3(-.55,1.40,.80),
        new THREE.Vector3(-.48,1.52,.80)
      ]);
      const hook=new THREE.Mesh(new THREE.TubeGeometry(hookCurve,24,.025,8,false),mat("#9da1a6",.25,{metalness:.8}));
      hook.castShadow=true;rippleBody.add(hook);
      const cordCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.60,2.04,.76),new THREE.Vector3(-.69,1.96,.78),new THREE.Vector3(-.68,1.86,.80)]);
      const cord=new THREE.Mesh(new THREE.TubeGeometry(cordCurve,12,.018,6,false),rippleRed);
      rippleBody.add(cord);
      ripple.visible=false;player.add(ripple);

      // MOCI-MOCI — spiritello nuvola rosa con ciuffi di panna e sfere zuccherate.
      const mociMoci=new THREE.Group();player.add(mociMoci);mociMoci.visible=false;
      const mociPink=mat("#f48ab8"),mociLight=mat("#ffc1d8"),mociShadow=mat("#bd6da9"),mociCream=mat("#fff1dc"),mociBlue=mat("#668bdc"),mociDark=mat("#25152f"),mociWhite=new THREE.MeshBasicMaterial({color:"#ffffff"});
      const mEll=(parent,material,pos,scale,detail=24)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,detail,Math.max(12,detail>>1)),material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;};
      mEll(mociMoci,mociPink,[0,1.42,0],[1.12,.83,.62],36);
      mEll(mociMoci,mociCream,[0,1.05,.34],[.91,.48,.34],32);
      mEll(mociMoci,mociLight,[-.34,2.08,-.02],[.69,.58,.55],28);
      mEll(mociMoci,mat("#9ce77d"),[.02,2.48,-.03],[.64,.49,.52],28);
      mEll(mociMoci,mat("#ffd84c"),[.76,2.02,.02],[.48,.55,.45],28);
      // Riccioli bianchi e azzurri ai lati del corpo.
      const mociCurl=(x,y,z,scale=1)=>{const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y+.38*scale,z),new THREE.Vector3(x-.18*scale,y+.2*scale,z+.06),new THREE.Vector3(x-.13*scale,y-.05*scale,z+.08),new THREE.Vector3(x+.12*scale,y-.12*scale,z+.08),new THREE.Vector3(x+.19*scale,y+.04*scale,z+.08)]);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.12*scale,10,false),mociBlue);mociMoci.add(mesh);};
      mociCurl(-.9,1.62,.25,.9);mociCurl(.53,.84,.48,.82);
      const mociEyes=[];
      for(const side of [-1,1]){mEll(mociMoci,mociDark,[side*.38,1.48,.57],[.19,.25,.09],24);mEll(mociMoci,mat("#d94c9a"),[side*.38,1.43,.65],[.12,.14,.035],20);mociEyes.push(mEll(mociMoci,mociWhite,[side*.43,1.57,.69],[.055,.07,.025],12));mEll(mociMoci,mociPink,[side*.69,1.22,.48],[.19,.12,.05],16);}
      mEll(mociMoci,mociDark,[0,1.16,.72],[.18,.12,.06],16);mEll(mociMoci,mat("#ef5b85"),[0,1.08,.78],[.13,.1,.04],16);
      const antenna=new THREE.Group();antenna.position.set(.67,2.4,-.02);mociMoci.add(antenna);
      const antennaStem=cylinder(.045,.06,.48,mat("#f28a39"),antenna,0,.22,0,8);antennaStem.rotation.z=-.3;
      mEll(antenna,mat("#ed4b9a"),[.1,.52,0],[.25,.29,.22],20);mEll(antenna,mociWhite,[.04,.62,.17],[.1,.1,.04],12);
      const mociArms=[];
      for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.84,1.08,.02);mociMoci.add(arm);mociArms.push(arm);mEll(arm,mociPink,[side*.08,-.22,.05],[.22,.35,.2],18);}
      
      // PIOCINO — piccolo uccello giallo, cresta fucsia e collana di gemme viola.
      const piocino=new THREE.Group();player.add(piocino);piocino.visible=false;
      const birdYellow=mat("#ffd51e"),birdGold=mat("#f3a900"),birdCream=mat("#fff0a6"),birdPink=mat("#e82d9a"),birdPurple=mat("#7425bc"),birdBeak=mat("#9147d6"),birdEye=new THREE.MeshPhysicalMaterial({color:"#120b22",roughness:.08,clearcoat:1});
      mEll(piocino,birdYellow,[0,1.3,0],[.73,.83,.58],36);
      mEll(piocino,birdYellow,[0,2.04,.08],[.68,.65,.57],36);
      mEll(piocino,birdCream,[0,1.18,.49],[.49,.48,.16],28);
      const piocinoEyes=[];
      for(const side of [-1,1]){mEll(piocino,mociWhite,[side*.28,2.18,.55],[.2,.23,.08],24);piocinoEyes.push(mEll(piocino,birdEye,[side*.29,2.17,.62],[.13,.17,.06],24));mEll(piocino,mociWhite,[side*.33,2.25,.675],[.055,.065,.025],12);}
      const beak= new THREE.Mesh(new THREE.ConeGeometry(.2,.42,6),birdBeak);beak.position.set(0,1.91,.72);beak.rotation.x=-Math.PI/2;piocino.add(beak);
      const crest=[];
      for(let i=0;i<5;i++){const feather=new THREE.Mesh(new THREE.ConeGeometry(.15,.78-i*.055,7),birdPink);feather.position.set(-.34+i*.17,2.73+(i%2)*.1,-.05);feather.rotation.z=-.45+i*.23;feather.castShadow=true;piocino.add(feather);crest.push(feather);}
      const birdWings=[];
      for(const side of [-1,1]){const wing=new THREE.Group();wing.position.set(side*.58,1.48,-.02);piocino.add(wing);mEll(wing,birdGold,[side*.16,0,0],[.34,.48,.17],20);birdWings.push(wing);}
      const necklace=new THREE.Group();piocino.add(necklace);
      for(let i=0;i<9;i++){const a=Math.PI+(i/8)*Math.PI;const gem=mEll(necklace,birdPurple,[Math.cos(a)*.43,1.63+Math.sin(a)*.25,.48],[.13,.15,.12],12);gem.rotation.z=a*.2;mEll(necklace,mociWhite,[Math.cos(a)*.43-.035,1.68+Math.sin(a)*.25,.59],[.035,.04,.02],8);}
      const birdFeet=[];
      // Zampe corte da piccolo uccello, raccolte sotto il piumaggio.
      for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.27,.57,.08);piocino.add(leg);cylinder(.045,.05,.18,birdPink,leg,0,-.07,0,8);mEll(leg,birdPink,[0,-.17,.12],[.18,.065,.22],12);for(let k=-1;k<=1;k++){const toe=new THREE.Mesh(new THREE.ConeGeometry(.04,.15,6),birdCream);toe.position.set(k*.09,-.18,.27);toe.rotation.x=-Math.PI/2;leg.add(toe);}birdFeet.push(leg);}
      // ARABNITE: tre avatar esclusivi selezionabili soltanto nella tredicesima città.
      const cervio=new THREE.Group();player.add(cervio);cervio.visible=false;
      const cervioWhite=mat("#e8f8ff"),cervioBlue=mat("#55c9f4"),cervioDark=mat("#163b78"),cervioEye=mat("#071b35");
      mEll(cervio,cervioWhite,[0,1.28,-.05],[.48,.75,.72],28);
      mEll(cervio,cervioWhite,[0,2.15,.35],[.43,.55,.43],28);
      for(const side of [-1,1]){
        mEll(cervio,cervioBlue,[side*.39,2.31,.34],[.22,.12,.14],16);
        mEll(cervio,cervioEye,[side*.17,2.23,.72],[.075,.09,.035],16);
        const leg=new THREE.Group();leg.position.set(side*.28,.72,.03);cervio.add(leg);cylinder(.11,.085,.68,cervioWhite,leg,0,-.25,0,10);mEll(leg,cervioBlue,[0,-.62,.08],[.14,.12,.18],12);
        const antler=new THREE.Group();antler.position.set(side*.2,2.55,.16);cervio.add(antler);
        const stem=cylinder(.035,.05,.85,cervioBlue,antler,0,.4,0,7);stem.rotation.z=-side*.15;
        for(let j=0;j<3;j++){const branch=cylinder(.025,.035,.42,cervioBlue,antler,side*(.12+j*.08),.48+j*.17,0,7);branch.rotation.z=-side*.9;}
      }
      mEll(cervio,cervioBlue,[0,1.52,.48],[.32,.42,.22],20);
      const cervioTail=mEll(cervio,cervioWhite,[.42,1.55,-.62],[.2,.36,.2],16);cervioTail.rotation.z=-.6;
      const cervioLegs=[];for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.22,.65,-.42);cervio.add(leg);cylinder(.09,.07,.62,cervioWhite,leg,0,-.25,0,8);cervioLegs.push(leg);}
      
      // GUNVALLO: destriero cowboy bruno con cappello, stella e archibugio scenico.
      const gunvallo=new THREE.Group();player.add(gunvallo);gunvallo.visible=false;
      const horseBrown=mat("#9b4d20"),horseLight=mat("#d58a45"),horseDark=mat("#4b2418"),gunMetal=mat("#78899a",.35,{metalness:.65}),gunGold=mat("#e9ad26",.35,{metalness:.5});
      mEll(gunvallo,horseBrown,[0,1.12,-.05],[.68,.55,.95],28);
      mEll(gunvallo,horseBrown,[0,1.9,.53],[.42,.75,.42],28);
      mEll(gunvallo,horseLight,[0,1.65,.88],[.35,.28,.32],20);
      const hat=cylinder(.39,.39,.18,horseDark,gunvallo,0,2.62,.48,12);cylinder(.56,.56,.08,horseDark,gunvallo,0,2.53,.48,16);
      mEll(gunvallo,gunGold,[0,2.68,.59],[.13,.15,.045],12);
      const star=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),gunGold);star.position.set(0,2.68,.65);gunvallo.add(star);
      // Fucile portato lateralmente, puramente decorativo.
      const barrel=cylinder(.09,.09,1.45,gunMetal,gunvallo,0,1.83,1.0,10);barrel.rotation.x=Math.PI/2;
      cylinder(.15,.15,.38,horseDark,gunvallo,0,1.83,.48,10).rotation.x=Math.PI/2;
      cylinder(.12,.12,.26,gunGold,gunvallo,0,1.83,.13,10).rotation.x=Math.PI/2;
      const gunLegs=[];for(const side of [-1,1])for(const z of [-.52,.48]){const leg=new THREE.Group();leg.position.set(side*.4,.72,z);gunvallo.add(leg);cylinder(.13,.09,.65,horseBrown,leg,0,-.28,0,9);mEll(leg,gunMetal,[0,-.62,.06],[.17,.12,.2],12);gunLegs.push(leg);}
      const mane=mEll(gunvallo,horseDark,[0,2.05,.02],[.18,.58,.22],16);mane.rotation.x=-.3;
      const gunTail=mEll(gunvallo,horseBrown,[.56,1.25,-.8],[.2,.22,.55],16);gunTail.rotation.x=-.6;
      
      // RULLINO: papero blu tondeggiante, pancia turchese e becco/zampe arancioni.
      const rullino=new THREE.Group();player.add(rullino);rullino.visible=false;
      const duckBlue=mat("#1455df"),duckLight=mat("#2b79ff"),duckMint=mat("#43dcb2"),duckOrange=mat("#ff861c"),duckDark=mat("#101333");
      mEll(rullino,duckBlue,[0,1.55,0],[.72,.82,.62],32);
      mEll(rullino,duckMint,[.08,1.05,.24],[.66,.59,.48],28);
      mEll(rullino,duckBlue,[0,2.27,.12],[.68,.65,.56],32);
      for(const side of [-1,1]){mEll(rullino,duckDark,[side*.27,2.29,.61],[.12,.15,.055],18);mEll(rullino,mociWhite,[side*.30,2.35,.66],[.045,.05,.02],10);}
      mEll(rullino,duckOrange,[0,2.02,.72],[.29,.18,.2],16);
      const duckFeet=[];for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.28,.63,.08);rullino.add(leg);cylinder(.055,.05,.32,duckOrange,leg,0,-.13,0,8);mEll(leg,duckOrange,[0,-.29,.16],[.23,.07,.28],12);duckFeet.push(leg);}
      const duckWings=[];for(const side of [-1,1]){const wing=new THREE.Group();wing.position.set(side*.58,1.42,-.03);rullino.add(wing);mEll(wing,duckLight,[side*.13,0,0],[.27,.44,.17],18);duckWings.push(wing);}
      
      const characterState={active:"talpitrippa",talpitrippa,ripple,mociMoci,piocino,cervio,gunvallo,rullino,arms,feet,rippleArms,rippleFeet,mociArms,birdFeet,birdWings,eyeMeshes,mociEyes,piocinoEyes};
      // Cloni visivi dei due Sognatori di supporto: il modello controllato resta unico.
      const arabniteCompanions={cervio:cervio.clone(true),gunvallo:gunvallo.clone(true),rullino:rullino.clone(true)};
      Object.entries(arabniteCompanions).forEach(([id,model])=>{model.name="ArabniteCompanion-"+id;model.scale.setScalar(.48);model.visible=false;arabniteWorld.add(model);});
      const regularOrder=["talpitrippa","ripple","moci-moci","piocino"];
      const arabniteOrder=["cervio","gunvallo","rullino"];
      const switchCharacter=(requestedCharacter=null,silent=false)=>{
        const order=arabniteActive?arabniteOrder:regularOrder;
        if(requestedCharacter)characterState.active=order.includes(requestedCharacter)?requestedCharacter:order[0];
        else if(!order.includes(characterState.active))characterState.active=order[0];
        else characterState.active=order[(order.indexOf(characterState.active)+1)%order.length];
        const models={"talpitrippa":talpitrippa,"ripple":ripple,"moci-moci":mociMoci,"piocino":piocino,"cervio":cervio,"gunvallo":gunvallo,"rullino":rullino};
        Object.entries(models).forEach(([id,model])=>model.visible=id===characterState.active);
        Object.values(arabniteCompanions).forEach(model=>{model.visible=false;});
        const configs={
          "talpitrippa":{model:talpitrippa,arms,feet,eyes:eyeMeshes},
          "ripple":{model:rippleBody,arms:rippleArms,feet:rippleFeet,eyes:[]},
          "moci-moci":{model:mociMoci,arms:mociArms,feet:[],eyes:mociEyes},
          "piocino":{model:piocino,arms:birdWings,feet:birdFeet,eyes:piocinoEyes},
          "cervio":{model:cervio,arms:[],feet:cervioLegs,eyes:[]},
          "gunvallo":{model:gunvallo,arms:[],feet:gunLegs,eyes:[]},
          "rullino":{model:rullino,arms:duckWings,feet:duckFeet,eyes:[]}
        };
        const config=configs[characterState.active];
        setActiveCharacter(characterState.active);
        playerMotion.model=config.model;playerMotion.arms=config.arms;playerMotion.feet=config.feet;playerMotion.eyes=config.eyes;
        const labels={"talpitrippa":"Talpitrippa","ripple":"Ripple","moci-moci":"Moci-Moci","piocino":"Piocino","cervio":"Cervio","gunvallo":"Gunvallo","rullino":"Rullino"};
        if(!silent)setToast(labels[characterState.active]+" · personaggio attivo");
      };
      // Ombra di contatto morbida per ancorare il Sognatore al pavimento.
      const playerGroundShadow=new THREE.Mesh(new THREE.CircleGeometry(.62,32),new THREE.MeshBasicMaterial({color:"#172018",transparent:true,opacity:.28,depthWrite:false}));
      playerGroundShadow.rotation.x=-Math.PI/2;
      playerGroundShadow.position.y=.035;
      playerGroundShadow.renderOrder=2;
      scene.add(playerGroundShadow);
      scene.add(player);
      player.position.set(-44,0,2);

      const saveCurrentWorld=()=>{
        try{
          const worldKey=arabniteActive?"arabnite":"amargenta";
          sessionWorlds={...sessionWorlds,[worldKey]:{
            x:player.position.x,z:player.position.z,yaw,pitch,distance,character:characterState.active
          }};
          window.localStorage.setItem(sessionStorageKey,JSON.stringify({
            version:1,savedAt:Date.now(),activeWorld:worldKey,
            activeCharacter:characterState.active,worlds:sessionWorlds,elapsedTime:clock.elapsedTime
          }));
        }catch(error){console.warn("Salvataggio sessione overworld non disponibile",error);}
      };

      // Riprende mondo, posizione, camera e personaggio dopo la sospensione del browser mobile.
      const requestedWorld=new URLSearchParams(window.location.search).get("world")==="arabnite"
        ?"arabnite":(restoredSession?.activeWorld==="arabnite"?"arabnite":"amargenta");
      const restoredWorld=restoredSession?.worlds?.[requestedWorld];
      if(restoredSession&&restoredWorld&&Number.isFinite(restoredWorld.x)&&Number.isFinite(restoredWorld.z)){
        if(requestedWorld==="arabnite"&&arabniteReady){
          scene.remove(player);arabniteScene.add(player);arabniteActive=true;
        }
        player.position.set(restoredWorld.x,0,restoredWorld.z);
        if(Number.isFinite(restoredWorld.yaw))yaw=restoredWorld.yaw;
        if(Number.isFinite(restoredWorld.pitch))pitch=THREE.MathUtils.clamp(restoredWorld.pitch,.2,.88);
        if(Number.isFinite(restoredWorld.distance))distance=THREE.MathUtils.clamp(restoredWorld.distance,7,18);
        switchCharacter(restoredWorld.character||restoredSession.activeCharacter,true);
        zoneRef.current=requestedWorld==="arabnite"?"Arabnite · Piazza delle Lanterne":"Ingresso di Amargenta";setZone(zoneRef.current);
      }else switchCharacter(characterState.active,true);
      if(Number.isFinite(restoredSession?.elapsedTime)){clock.start();clock.elapsedTime=Math.max(0,restoredSession.elapsedTime);}

      // La città usa geometrie procedurali native: nessuna richiesta a modelli GLB mancanti.
      // Arabnite vive in una scena autonoma: sposta qui tutti gli oggetti del suo settore
      // prima di avviare il loop, così non vengono mai renderizzati dentro Amargenta.
      scene.updateMatrixWorld(true);
      for(const object of [...scene.children]){
        const worldPosition=new THREE.Vector3();object.getWorldPosition(worldPosition);
        if(worldPosition.x>110){scene.remove(object);arabniteScene.add(object);}
      }
      arabniteScene.add(new THREE.AmbientLight("#c9b6ff",0.28));

      const onKeyDown=e=>{
        if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ShiftLeft","ShiftRight","Space"].includes(e.code)){
          if(!controlsLockedRef.current){keys.add(e.code);e.preventDefault();}
        }
        if(e.code==="Space"&&!e.repeat&&!controlsLockedRef.current){jumpRequested=true;e.preventDefault();}
        if(e.code==="KeyE"&&!e.repeat&&!controlsLockedRef.current){
          const p=player.position;
          const target=interactables.map(item=>({...item,distance:Math.hypot(p.x-item.x,p.z-item.z)})).filter(item=>item.distance<item.radius).sort((a,b)=>a.distance-b.distance)[0];
          if(target){if(target.action)target.action();else setDialogue({title:target.title,text:target.text});}
        }
        if(e.code==="KeyF"&&!e.repeat&&!controlsLockedRef.current){
          const p=player.position;
          if(arabniteActive&&characterState.active==="cervio"){
            movementVelocity.add(new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y)).multiplyScalar(13));
            setToast("Cervio · Scatto delle Dune!");
          } else if(arabniteActive&&characterState.active==="rullino"){
            if(isArabniteIceAt(p.x,p.z)){movementVelocity.multiplyScalar(1.65);setToast("Rullino · Curva sul ghiaccio!");}
            else {jumpRequested=true;setToast("Rullino · Salto pattinato!");}
          } else if(characterState.active==="talpitrippa"){
            makeGroundEdit("hole",p.x+Math.sin(player.rotation.y)*1.15,p.z+Math.cos(player.rotation.y)*1.15);setToast("Talpitrippa ha scavato una buca!");
          } else if(characterState.active==="ripple"){
            if(isWaterAt(p.x,p.z)||Math.abs(p.x-(28+(p.z-2)*.08))<9){setInventory(old=>({...old,fish:(old.fish||0)+1}));setToast("Ripple ha pescato un pesce con il suo uncino!");playerMotion.arms.forEach((arm)=>{arm.rotation.x=-.85;});}
            else setToast("Avvicinati al fiume per pescare con Ripple.");
          } else if(characterState.active==="moci-moci"){
            const wall=colliders.filter(c=>c.type==="box"&&c.height>=2.5).map(c=>({...c,distance:Math.hypot(p.x-c.x,p.z-c.z)})).filter(c=>c.distance<Math.max(c.halfW,c.halfD)+1.8).sort((a,b)=>a.distance-b.distance)[0];
            if(wall){climbingWall=wall;climbHeight=Math.max(.2,climbHeight);setToast("Moci Moci si è appiccicato alla parete: tieni W per scalarla!");}
            else setToast("Avvicinati a una parete per scalarla con Moci Moci.");
          } else if(characterState.active==="piocino"){
            jumpRequested=true;setToast("Piocino prende il volo! Tieni premuto SPAZIO per svolazzare.");
          } else if(characterState.active==="gunvallo"){
            const shot=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),mat("#ff70b8",.3,{emissive:"#d52d86",emissiveIntensity:.7}));
            shot.position.set(p.x,1.65,p.z);shot.castShadow=true;(arabniteActive?arabniteWorld:scene).add(shot);
            const dir=new THREE.Vector3(Math.sin(player.rotation.y),.08,Math.cos(player.rotation.y)).normalize();
            candyShots.push({mesh:shot,velocity:dir.multiplyScalar(22),life:2.2});
            setToast("Gunvallo spara una caramella! Mira ai barattoli per colpirli.");
          }
        }
        if(e.code==="Escape"){setDialogue(null);setPanel(null);}
        if(!e.repeat&&e.code==="KeyC"&&!controlsLockedRef.current){switchCharacter();saveCurrentWorld();}
        if(!e.repeat&&e.code==="KeyM")setPanel(old=>old==="map"?null:"map");
        if(!e.repeat&&e.code==="KeyI")setPanel(old=>old==="inventory"?null:"inventory");
        if(!e.repeat&&e.code==="KeyJ")setPanel(old=>old==="journal"?null:"journal");
      };
      const onKeyUp=e=>keys.delete(e.code);
      const onWindowBlur=()=>{keys.clear();saveCurrentWorld();};
      const onVisibilityChange=()=>{
        if(document.hidden){keys.clear();saveCurrentWorld();return;}
        resize();cameraReady=false;
      };
      const onPageShow=()=>{if(!document.hidden){resize();cameraReady=false;}};
      document.addEventListener("visibilitychange",onVisibilityChange);
      window.addEventListener("pagehide",saveCurrentWorld);
      window.addEventListener("pageshow",onPageShow);
      const onPointerDown=e=>{if(e.button!==0)return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);};
      const onPointerUp=()=>{dragging=false;};
      const onPointerMove=e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*(compactDevice ? 0.005 : 0.0036);pitch=Math.max(.20,Math.min(.88,pitch+dy*.0034));};
      const onWheel=e=>{distance=THREE.MathUtils.clamp(distance+e.deltaY*.009,compactDevice?7.8:7,compactDevice?16:18);};
      renderer.domElement.addEventListener("pointerdown",onPointerDown);
      renderer.domElement.addEventListener("pointerup",onPointerUp);
      renderer.domElement.addEventListener("pointercancel",onPointerUp);
      renderer.domElement.addEventListener("pointermove",onPointerMove);
      renderer.domElement.addEventListener("wheel",onWheel,{passive:true});
      window.addEventListener("keydown",onKeyDown);window.addEventListener("keyup",onKeyUp);window.addEventListener("blur",onWindowBlur);
      const resize = () => {
        if (disposed || !camera || !renderer) return;
        const resizeWidth = host.clientWidth;
        const resizeHeight = host.clientHeight;
        if (!resizeWidth || !resizeHeight) return;
        camera.aspect = resizeWidth / resizeHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(resizeWidth, resizeHeight);
      };
      observer=new ResizeObserver(resize);observer.observe(host);
      let lastSessionSaveAt=0;
      const animate=()=>{
        if(disposed)return;frame=requestAnimationFrame(animate);
        if(document.hidden)return;
        if(menuOpenRef.current){

          keys.clear();

          const pausedDelta=clock.getDelta();

          clock.elapsedTime-=pausedDelta;

          renderer.render(arabniteActive?arabniteScene:scene,camera);

          return;

        }
         const dt=Math.min(clock.getDelta(),.04);
        if(Date.now()-lastSessionSaveAt>450){lastSessionSaveAt=Date.now();saveCurrentWorld();}
        if(jumpRequested&&jumpHeight<=.001&&!controlsLockedRef.current)jumpVelocity=characterState.active==="piocino"?8.2:7.4;
         const piocinoFlying=characterState.active==="piocino"&&keys.has("Space");
         jumpRequested=false;
         if(piocinoFlying){
           // Volo alto e sostenuto: Piocino raggiunge la quota di esplorazione originale e supera agevolmente i fiumi.
           jumpVelocity=0;
           jumpHeight=THREE.MathUtils.damp(jumpHeight,5.0,5.5,dt);
         }else if(jumpHeight>0||jumpVelocity>0){
           jumpVelocity-=18*dt;
           jumpHeight+=jumpVelocity*dt;
           if(jumpHeight<=0){jumpHeight=0;jumpVelocity=0;}
         }
        const forward=(keys.has("KeyW")||keys.has("ArrowUp")?1:0)-(keys.has("KeyS")||keys.has("ArrowDown")?1:0)-touchStickRef.current.y;
        const side=(keys.has("KeyD")||keys.has("ArrowRight")?1:0)-(keys.has("KeyA")||keys.has("ArrowLeft")?1:0)+touchStickRef.current.x;
        if(controlsLockedRef.current) keys.clear();
        const activeForward=controlsLockedRef.current?0:forward;
        const activeSide=controlsLockedRef.current?0:side;
        const inputLength=Math.min(1,Math.hypot(activeForward,activeSide));
        const sprint=(keys.has("ShiftLeft")||keys.has("ShiftRight"))&&inputLength>.05;
        const onIce=isArabniteIceAt(player.position.x,player.position.z);
        const isRullino=characterState.active==="rullino"&&arabniteActive;
        const isCervio=characterState.active==="cervio"&&arabniteActive;
        desiredMovement.set(0,0,0);
        if(inputLength>.05){
          const dir=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
          const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
          const baseSpeed=isCervio?11.4:isRullino?8.2:6.1;
          const speed=baseSpeed*(sprint?(isCervio?1.32:1.5):1);
          desiredMovement.copy(dir).multiplyScalar(activeForward).addScaledVector(right,activeSide).normalize().multiplyScalar(speed);
        }
        // Sul ghiaccio senza Rullino la trazione crolla: si continua a scivolare e sterzare tardi.
        const acceleration=onIce&&!isRullino?(inputLength>.05?1.65:.38):isRullino?11.5:inputLength>.05?7.2:9.5;
        movementVelocity.lerp(desiredMovement,1-Math.exp(-acceleration*dt));
        const move=movementVelocity.clone().multiplyScalar(dt);

        if(climbingWall&&characterState.active==="moci-moci"){
          if(inputLength>.05&&activeForward>.05){climbHeight=Math.min((climbingWall.height||3.4)+.6,climbHeight+3.4*dt);movementVelocity.multiplyScalar(.08);}
          else if(inputLength>.05&&activeForward<-.05){climbHeight=Math.max(0,climbHeight-3.4*dt);}
          else if(inputLength<.05){climbHeight=Math.max(0,climbHeight-1.1*dt);}
          if(climbHeight<=.01){climbHeight=0;climbingWall=null;}
        }else if(climbingWall){climbHeight=0;climbingWall=null;}
        const nx = player.position.x + move.x;
        const nz = player.position.z + move.z;
        if (Math.abs(move.x) > 0.0001 && !isBlockedAt(nx, player.position.z)) {
          player.position.x = nx;
        } else if (isBlockedAt(nx, player.position.z)) {
          movementVelocity.x = 0;
        }
        if (Math.abs(move.z) > 0.0001 && !isBlockedAt(player.position.x, nz)) {
          player.position.z = nz;
        } else if (isBlockedAt(player.position.x, nz)) {
          movementVelocity.z = 0;
        }
        player.position.y=(player.position.x>120?0:getWalkHeight(player.position.x,player.position.z))+jumpHeight+climbHeight;
        ambientCreatures.forEach(cr=>{
          const t=clock.elapsedTime+cr.phase;
          if(cr.fly){cr.group.position.set(cr.homeX+Math.sin(t*.22)*9,cr.baseY+Math.sin(t*1.25)*1.15,cr.homeZ+Math.cos(t*.19)*8);cr.group.rotation.z=Math.sin(t*2.4)*.08;cr.leftWing.rotation.z=Math.sin(t*9)*.52;cr.rightWing.rotation.z=-Math.sin(t*9)*.52;}
          else{cr.group.position.x=cr.homeX+Math.sin(t*.28)*3.2;cr.group.position.z=cr.homeZ+Math.cos(t*.24)*2.8;cr.group.position.y=Math.abs(Math.sin(t*3))*.07;cr.group.rotation.y=Math.sin(t*.28)*.5;cr.feet.forEach((foot,i)=>foot.rotation.x=Math.sin(t*4+i*Math.PI)*.18);if(cr.id==="tartadino"&&Math.floor(t/9)!==Math.floor((t-.04)/9))makeGroundEdit("grass",cr.group.position.x,cr.group.position.z);if(cr.id==="patato"&&Math.floor(t/12)!==Math.floor((t-.04)/12))makeGroundEdit("furrow",cr.group.position.x,cr.group.position.z);}
        });
        for(let i=candyShots.length-1;i>=0;i--){
          const shot=candyShots[i];shot.mesh.position.addScaledVector(shot.velocity,dt);shot.life-=dt;
          if(arabniteActive){
            const target=arabniteCandyTargets.find(t=>t.active&&Math.hypot(shot.mesh.position.x-t.x,shot.mesh.position.z-t.z)<1.35&&shot.mesh.position.y<3.2);
            if(target){target.active=false;target.group.visible=false;const reward={...arabniteCollectionRef.current,coins:Number(arabniteCollectionRef.current.coins??120)+5};arabniteCollectionRef.current=reward;setArabniteCollection(reward);setToast("Barattolo colpito! +5 monete.");shot.life=0;}
          }
          if(shot.life<=0){shot.mesh.parent?.remove(shot.mesh);shot.mesh.geometry.dispose();shot.mesh.material.dispose();candyShots.splice(i,1);}
        }
        const horizontalSpeed=Math.hypot(movementVelocity.x,movementVelocity.z);
        if(horizontalSpeed>.18){
          const desiredFacing=Math.atan2(movementVelocity.x,movementVelocity.z);
          const angleDelta=Math.atan2(Math.sin(desiredFacing-player.rotation.y),Math.cos(desiredFacing-player.rotation.y));
          player.rotation.y+=angleDelta*(1-Math.exp(-13*dt));
          // La camera segue gradualmente la direzione di marcia, senza strappi.
          const followYaw=player.rotation.y+Math.PI;
          const yawDelta=Math.atan2(Math.sin(followYaw-yaw),Math.cos(followYaw-yaw));
          yaw+=yawDelta*(1-Math.exp(-2.8*dt));
        }
        // Ciclo di movimento del modello 3D: rimbalzo del corpo e alternanza di braccia/piedi.
        const walkBlend=THREE.MathUtils.clamp(horizontalSpeed/4.6,0,1);
        const gait=clock.elapsedTime*(sprint?10.5:7.8);
        if(isRullino&&onIce){player.rotation.z=THREE.MathUtils.damp(player.rotation.z,Math.sin(clock.elapsedTime*5)*.035,5,dt);playerMotion.model.rotation.x=Math.sin(clock.elapsedTime*9)*.035;}
        if(isCervio&&horizontalSpeed>.2){playerMotion.model.scale.set(1.04,1.02,1.06);}
        const step=Math.sin(gait)*walkBlend;
        if(playerMotion.model){
          const idleBreath=Math.sin(clock.elapsedTime*2.1)*.018;
          const idleSway=Math.sin(clock.elapsedTime*1.05)*.012;
          playerMotion.model.position.y=Math.abs(Math.sin(gait*2))*.055*walkBlend+jumpHeight*.10+idleBreath*(1-walkBlend);          playerMotion.model.scale.y=1+idleBreath*.32;
          playerMotion.model.rotation.z=THREE.MathUtils.damp(playerMotion.model.rotation.z,-activeSide*.045*walkBlend+idleSway*(1-walkBlend),7,dt);
          playerMotion.arms.forEach((arm,i)=>{arm.rotation.x=THREE.MathUtils.damp(arm.rotation.x,(i===0?1:-1)*step*.16+Math.sin(clock.elapsedTime*1.7+i)*.025*(1-walkBlend),9,dt);});
          playerMotion.feet.forEach((foot,i)=>{
            const phase=step*(i===0?-1:1);
            foot.rotation.x=THREE.MathUtils.damp(foot.rotation.x,phase*.48,12,dt);

          });
          playerGroundShadow.position.x=player.position.x;
          playerGroundShadow.position.z=player.position.z;
          const airborne=THREE.MathUtils.clamp(jumpHeight/1.2,0,1);
          const shadowScale=1+walkBlend*.08-airborne*.22;
          playerGroundShadow.scale.set(shadowScale,shadowScale,1);
          playerGroundShadow.material.opacity=.28-airborne*.12;
          // Battito palpebrale breve e asincrono, senza interrompere il movimento.
          const blinkPhase=(clock.elapsedTime+1.3)%4.7;
          const blink=blinkPhase>.0&&blinkPhase<.13?Math.sin(Math.PI*blinkPhase/.13):0;
          playerMotion.eyes?.forEach(eye=>{eye.scale.y=.19*(1-.88*blink);});
        }
        if(!(isRullino&&onIce))player.rotation.z=THREE.MathUtils.damp(player.rotation.z,-(activeSide*.025*walkBlend),7,dt);
        if(!isCervio)playerMotion.model?.scale.set(1,1,1);
                const target=new THREE.Vector3(player.position.x,player.position.y+(arabniteActive?1.56:1.44),player.position.z);
        const cp=new THREE.Vector3(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);
        if(!cameraReady){camera.position.copy(cp);cameraLookTarget.copy(target);cameraReady=true;}
        const cameraEase=1-Math.exp(-7.4*dt);
        camera.position.lerp(cp,cameraEase);
        cameraLookTarget.lerp(target,1-Math.exp(-9.2*dt));
        camera.lookAt(cameraLookTarget);
        smokePuffs.forEach(puff=>{puff.position.y+=dt*.45;if(puff.position.y>13)puff.position.y=10;});
        const p=player.position;
        // Attraversare fisicamente il cerchio del portale cambia mondo in automatico.
        if(!controlsLockedRef.current){
          const portalDistance=arabniteActive?Math.hypot(p.x-132,p.z-12):Math.hypot(p.x-67,p.z-2);
          if(portalDistance<3.9)travelToWorldRef.current?.(arabniteActive?"amargenta":"arabnite");
        }
        if(clock.elapsedTime-lastHudUpdate>0.22){lastHudUpdate=clock.elapsedTime;setPlayerCoords({x:Math.round(p.x),z:Math.round(p.z)});}
        const period=Math.floor((clock.elapsedTime%240)/60);
        const moments=["Mattina","Pomeriggio","Tramonto","Notte"];
        if(period!==currentPeriod){currentPeriod=period;setWorldMoment(moments[period]);}
        const daylight=period===0?1:period===1?.82:period===2?.48:.22;
        sun.intensity=3.2*daylight;
        sun.position.set(Math.cos(clock.elapsedTime*.025)*38,22+daylight*34,Math.sin(clock.elapsedTime*.025)*32);
        scene.background.setHSL(.55,.22,.28+daylight*.22);
        scene.fog.color.copy(scene.background);
        const closest=interactables.map(item=>({...item,distance:Math.hypot(p.x-item.x,p.z-item.z)})).filter(item=>item.distance<item.radius).sort((a,b)=>a.distance-b.distance)[0];
        setNearby(old=>old?.id===closest?.id?old:(closest||null));
        npcActors.forEach((actor,i)=>{
          const npcName=actor.group.userData.npcName;
          if(npcName==="Lumen"||npcName==="Trix") actor.group.visible=period===3;
          const idle=clock.elapsedTime*1.7+actor.phase;
          if(actor.wild){
            const t=clock.elapsedTime*actor.walkSpeed+actor.phase;
            const targetX=actor.homeX+Math.cos(t*.42)*actor.roamRadius;
            const targetZ=actor.homeZ+Math.sin(t*.67)*actor.roamRadius*.72;
            const dx=targetX-actor.group.position.x,dz=targetZ-actor.group.position.z;
            const distanceToTarget=Math.hypot(dx,dz);
            const step=Math.min(distanceToTarget,dt*(.8+actor.walkSpeed*.55));
            if(distanceToTarget>.08){actor.group.position.x+=dx/distanceToTarget*step;actor.group.position.z+=dz/distanceToTarget*step;actor.group.rotation.y=Math.atan2(dx,dz);}
            const gait=clock.elapsedTime*8*actor.walkSpeed+actor.phase;
            actor.legs.forEach((leg,j)=>{leg.pivot.rotation.x=Math.sin(gait+(j%2)*Math.PI)*.42;});
            actor.bodyPivot.position.y=.04+Math.abs(Math.sin(gait*2))*.045;
            actor.headPivot.rotation.x=Math.sin(idle*.65)*.045;
            actor.tailPivot.rotation.x=Math.sin(idle*1.4)*.18;
            actor.tailPivot.rotation.z=Math.sin(idle*.9)*.13;
            actor.ears.forEach((ear,j)=>{ear.rotation.z=(j===0?-.18:.18)+Math.sin(idle*1.8+j)*.07;});
            actor.aroma.children.forEach((puff,j)=>{puff.position.y=1.45+j*.17+Math.sin(clock.elapsedTime*1.7+puff.userData.phase)*.09;puff.visible=Math.sin(clock.elapsedTime*1.7+puff.userData.phase)>.0;});
            if(actor.flameTips)actor.flameTips.forEach((tip,j)=>{tip.scale.y=1.35+Math.sin(idle*2.8+j*.9)*.35;tip.rotation.z=Math.sin(idle*2+j)*.16;});
            if(actor.emberDots)actor.emberDots.forEach((mote,j)=>{mote.position.y=1.35+(j%3)*.32+Math.sin(idle*2+j*1.7)*.16;mote.position.x=Math.sin(idle*1.3+j*2)*.48;mote.scale.setScalar(.7+(.5+.5*Math.sin(idle*3+j))*1.0);});
            actor.interaction.x=actor.group.position.x;actor.interaction.z=actor.group.position.z;
          }else{
            const breath=Math.sin(idle)*.035;
            actor.group.position.y=breath;
            const wave=Math.sin(idle*.82), slow=Math.sin(idle*.48);
            actor.leftArm.rotation.x=wave*.045;
            actor.rightArm.rotation.x=-wave*.045;
            actor.leftArm.rotation.z=-.16;
            actor.rightArm.rotation.z=.16;
            // Piccoli gesti caratteristici: ogni abitante ha un ritmo riconoscibile.
            if(actor.kind==="barista"||actor.kind==="cafe-host"){
              actor.rightArm.rotation.x=-.34+Math.sin(idle*1.25)*.13;
              actor.leftArm.rotation.x=.08+Math.sin(idle*.7)*.05;
            }else if(actor.kind==="archivist"){
              actor.group.rotation.x=.025+Math.sin(idle*.55)*.018;
              actor.rightArm.rotation.x=-.22+Math.sin(idle*.9)*.07;
              actor.leftArm.rotation.x=-.16+Math.sin(idle*.8)*.05;
            }else if(actor.kind==="guard"){
              actor.group.rotation.y=Math.sin(idle*.62)*.12;
              actor.leftArm.rotation.x=-.08+Math.sin(idle*.7)*.035;
              actor.rightArm.rotation.x=.04+Math.sin(idle*.7)*.025;
            }else if(actor.kind==="farmer"||actor.kind==="town-gardener"){
              actor.leftArm.rotation.x=-.12+Math.sin(idle*.72)*.11;
              actor.rightArm.rotation.x=.12-Math.sin(idle*.72)*.11;
              actor.group.rotation.z=Math.sin(idle*.5)*.012;
            }else if(actor.kind==="muccanza"){
              actor.rightArm.rotation.x=-.72+Math.sin(idle*1.2)*.12;
              actor.leftArm.rotation.x=.16+Math.sin(idle*.8)*.06;
              actor.headPivot.rotation.z=Math.sin(idle*.7)*.045;
            }else if(actor.kind==="cardinero"){
              actor.leftArm.rotation.z=-.42+Math.sin(idle*1.4)*.08;
              actor.rightArm.rotation.z=.42-Math.sin(idle*1.1)*.08;
              if(actor.flowerPivot)actor.flowerPivot.rotation.z=Math.sin(idle*.9)*.12;
              actor.group.rotation.y=Math.sin(idle*.42)*.08;
            }else if(actor.kind==="town-cook"){
              actor.rightArm.rotation.x=-.48+Math.sin(idle*1.65)*.2;
              actor.rightArm.rotation.z=.2+Math.sin(idle*1.65)*.06;
              actor.leftArm.rotation.x=-.12+Math.sin(idle*1.1)*.05;
            }else if(actor.kind==="town-carpenter"){
              actor.rightArm.rotation.x=-.22+Math.max(0,Math.sin(idle*2.1))*.38;
              actor.rightArm.rotation.z=.12;
              actor.leftArm.rotation.x=-.08+Math.sin(idle*.8)*.035;
            }else if(actor.kind==="roaster"){
              actor.rightArm.rotation.x=-.28+Math.sin(idle*1.4)*.12;
              actor.leftArm.rotation.x=.1+Math.sin(idle*.9)*.05;
            }else if(actor.kind==="keeper"){
              actor.group.rotation.z=Math.sin(idle*.7)*.018;
              actor.leftArm.rotation.x=-.08+Math.sin(idle*.6)*.04;
              actor.rightArm.rotation.x=-.08-Math.sin(idle*.6)*.04;
            }else{
              actor.leftArm.rotation.x=wave*.07;
              actor.rightArm.rotation.x=-wave*.07;
            }
            const nearPlayer=Math.hypot(p.x-actor.group.position.x,p.z-actor.group.position.z)<8;
            if(!["guard","town-cook","town-carpenter","town-gardener","farmer","keeper"].includes(actor.kind)){
              actor.group.rotation.y=nearPlayer?Math.atan2(p.x-actor.group.position.x,p.z-actor.group.position.z):Math.sin(clock.elapsedTime*.45+actor.phase)*.08;
            }
          }
        });
        bellActors.forEach(({group,clapper,index})=>{
          const swing=Math.sin(clock.elapsedTime*2.4+index*1.8)*.035;
          group.rotation.z=swing;
          clapper.rotation.z=-swing*2.5;
        });
        fireflies.forEach(({mesh,baseX,baseZ,phase})=>{
          mesh.visible=period===3;
          if(mesh.visible){
            mesh.position.x=baseX+Math.sin(clock.elapsedTime*.8+phase)*.65;
            mesh.position.y=1.25+Math.sin(clock.elapsedTime*1.7+phase)*.42;
            mesh.position.z=baseZ+Math.cos(clock.elapsedTime*.7+phase)*.65;
          }
        });
        amberPickups.forEach(pickup=>{if(pickup.visible)pickup.rotation.y+=dt*.65;});
        arabnitePackMeshes.forEach(({group,baseY,phase})=>{if(group.visible){group.position.y=baseY+Math.sin(clock.elapsedTime*2.1+phase)*.16;group.rotation.y=clock.elapsedTime*.55+phase*.08;}});
        arabPortalEffects.forEach(({ring,innerRing,core,crest,phase})=>{ring.rotation.z+=dt*.22;innerRing.rotation.z-=dt*.3;core.material.opacity=.42+Math.sin(clock.elapsedTime*2.2+phase)*.13;crest.rotation.y+=dt*.5;crest.rotation.z+=dt*.22;});
        if(dungeonGuardian.visible)dungeonGuardian.rotation.y=Math.sin(clock.elapsedTime*.8)*.12;
        const nextZone=p.x>120?"Arabnite · "+(p.z>34?"Oasi della Luna":p.z<0?"Bazar delle Gemme":"Piazza delle Lanterne"):p.x > 60 && p.z < -55 ? "Giardino dei Sigilli" : p.x < -60 && p.z < -30 ? "Giardino del Retrogusto" : p.x < -60 && p.z > 55 ? "Terrazza delle Tre Foglie" : p.x > 60 && p.z > 55 ? "Piazzale della Torrefazione" : p.x>8&&p.z>20?"Distretto della Torrefazione":p.x>17?"Valle delle Cascate":p.x<-10&&p.z<-15?"Borgo superiore":p.x<-10?"Terrazze del Caffè":Math.hypot(p.x,p.z)<13?"Piazza del Chicco":"Ingresso di Amargenta";
        if (nextZone !== zoneRef.current) { zoneRef.current = nextZone; setZone(nextZone); }
        renderer.render(arabniteActive?arabniteScene:scene,camera);
      };
      animate();
      return ()=>{saveCurrentWorld();cancelAnimationFrame(frame);observer?.disconnect();document.removeEventListener("visibilitychange",onVisibilityChange);window.removeEventListener("pagehide",saveCurrentWorld);window.removeEventListener("pageshow",onPageShow);window.removeEventListener("keydown",onKeyDown);window.removeEventListener("keyup",onKeyUp);window.removeEventListener("blur",onWindowBlur);renderer.domElement.removeEventListener("pointerdown",onPointerDown);renderer.domElement.removeEventListener("pointerup",onPointerUp);renderer.domElement.removeEventListener("pointercancel",onPointerUp);renderer.domElement.removeEventListener("pointermove",onPointerMove);renderer.domElement.removeEventListener("wheel",onWheel);renderer.dispose();[scene,arabniteScene].filter(Boolean).forEach(world=>world.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.();}));if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement);};
    } catch (error) {
      console.error("Amargenta 3D init error",error);
      setHint("Avvio grafica 3D non riuscito: "+(error?.message||"WebGL non disponibile")+". In Chrome attiva l'accelerazione grafica e aggiorna i driver video.");
    }
    return ()=>{saveCurrentWorld();disposed=true;if(frame)cancelAnimationFrame(frame);observer?.disconnect();};
  }, []);

  const trustTotal = Object.values(residentTrust).reduce((sum, value) => sum + Math.max(0, Math.min(5, Number(value) || 0)), 0);
  const trustResidents = [
    { id: "farmer", name: "Flame" },
    { id: "archivist", name: "Belligonghi-umami" },
    { id: "guard", name: "Cardinero" },
    { id: "cafe-host", name: "Muccanza" },
    { id: "keeper", name: "Belligonghi-umami · Ricette" }
  ];

  const activeObjective = !questDone
    ? (questCount >= 3 ? "Torna da Flame per concludere le Fave d'Ambra" : questStarted ? "Raccogli le tre Fave d'Ambra sulle terrazze" : "Parla con Flame tra le piante di peperoncino")
    : !recipeDone
      ? (recipePages >= 4 ? "Torna da Belligonghi-umami per ricomporre la Ricetta Perduta" : recipeStarted ? "Recupera le quattro pagine della ricetta" : "Parla con Belligonghi-umami vicino alla raccolta")
      : !waterDone
        ? (valves >= 3 ? "Torna da Cardinero per completare le Condotte Antiche" : waterStarted ? "Riattiva le tre valvole lungo il fiume" : "Parla con Cardinero vicino alle condotte")
        : bellsStarted && !bellsDone ? (bellCount >= 3 ? "Torna da Muccanza per ricevere la ricompensa" : "Risveglia le tre campane del borgo")
          : blendStarted && !blendDone ? "Completa la Miscela delle Tre Foglie da Belligonghi-umami"
          : !secretUnlocked ? "Raggiungi la porta della Cripta delle Miscele" : dungeonSigils.length < 3 ? "Risolvi la sequenza dei tre sigilli nella Cripta" : !dungeonBossDefeated ? "Affronta il Guardiano del Retrogusto" : !vaultClaimed ? "Apri lo scrigno nel cuore della Cripta" : "Amargenta è stata completata: esplora liberamente";

  const nearestWaypoint = (points) => points
    .filter(point => !point.done)
    .map(point => ({ ...point, distance: Math.hypot(point.x-playerCoords.x, point.z-playerCoords.z) }))
    .sort((a,b) => a.distance-b.distance)[0] || null;
  let objectiveWaypoint = null;
  if (!questDone) {
    objectiveWaypoint = questCount >= 3
      ? { name:"Flame", x:-24, z:-31 }
      : questStarted
        ? nearestWaypoint([[-34,-37],[-12,-45],[-4,-28]].map(([x,z],i)=>({name:"Fava d'Ambra",x,z,done:collectedAmber.includes(i)})))
        : { name:"Flame", x:-24, z:-31 };
  } else if (!recipeDone) {
    objectiveWaypoint = recipePages >= 4
      ? { name:"Belligonghi-umami", x:-10, z:-19 }
      : recipeStarted
        ? nearestWaypoint([[-35,-16],[28,-30],[-61,62],[48,45]].map(([x,z],i)=>({name:"Pagina della ricetta",x,z,done:collectedPages.includes(i)})))
        : { name:"Belligonghi-umami", x:-10, z:-19 };
  } else if (!waterDone) {
    objectiveWaypoint = valves >= 3
      ? { name:"Cardinero", x:18, z:-7 }
      : waterStarted
        ? nearestWaypoint([[19,-18],[37,18],[13,38]].map(([x,z],i)=>({name:"Valvola",x,z,done:activatedValves.includes(i)})))
        : { name:"Cardinero", x:18, z:-7 };
  } else if (bellsStarted && !bellsDone) {
    objectiveWaypoint = bellCount >= 3
      ? { name:"Muccanza", x:-68, z:66 }
      : nearestWaypoint([[-30,4],[-2,18],[16,-2]].map(([x,z],i)=>({name:"Campana",x,z,done:activatedBells.includes(i)})));
  } else if (blendStarted && !blendDone) {
    objectiveWaypoint = { name:"Belligonghi-umami", x:72, z:72 };
  } else if (!secretUnlocked) objectiveWaypoint = { name:"Porta della Cripta", x:-70, z:-43 };
  else if (!vaultClaimed) objectiveWaypoint = { name:"Scrigno delle Miscele", x:68, z:-68 };
  const waypointDirection = objectiveWaypoint
    ? ["N","NE","E","SE","S","SW","W","NW"][((Math.round(Math.atan2(objectiveWaypoint.x-playerCoords.x, -(objectiveWaypoint.z-playerCoords.z))/(Math.PI/4))+8)%8)]
    : null;
  const waypointDistance = objectiveWaypoint
    ? Math.round(Math.hypot(objectiveWaypoint.x-playerCoords.x, objectiveWaypoint.z-playerCoords.z))
    : null;

  return <div style={{position:"fixed",inset:0,background:"#18221e",color:"#f4ead8",fontFamily:"Inter,system-ui,sans-serif",overflow:"hidden"}}>
    <style>{`
      .amargenta-glass{background:linear-gradient(145deg,rgba(19,32,29,.88),rgba(27,43,36,.76));border:1px solid rgba(232,199,139,.42);box-shadow:0 14px 38px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
      .amargenta-title{padding:10px 12px;border-radius:16px;background:linear-gradient(100deg,rgba(18,29,27,.82),rgba(18,29,27,.12));}
      .amargenta-menu-button{border:1px solid rgba(238,204,145,.7)!important;border-radius:12px!important;background:linear-gradient(145deg,#c39455,#805638)!important;color:#fff6e8!important;padding:11px 16px!important;font-weight:950!important;letter-spacing:.08em;box-shadow:0 7px 22px #0006,inset 0 1px #fff5!important;transition:transform .18s,filter .18s}
      .amargenta-menu-button:hover{transform:translateY(-2px);filter:brightness(1.12)}
      .amargenta-status{position:absolute;top:18px;right:18px;display:flex;gap:8px;align-items:center;padding:9px 13px;border-radius:14px;color:#f8edda;font-size:11px;font-weight:800;letter-spacing:.04em}
      .amargenta-objective{position:absolute;right:20px;bottom:22px;width:min(360px,calc(100vw - 180px));padding:15px 17px;border-radius:17px;color:#f7eddd}
      .amargenta-objective-label{font-size:9px;letter-spacing:.2em;font-weight:900;color:#e9c58d;margin-bottom:6px}
      .amargenta-objective-title{font-size:14px;line-height:1.45;font-weight:800}
      .amargenta-objective-waypoint{display:flex;justify-content:space-between;gap:10px;margin-top:9px;padding-top:9px;border-top:1px solid #ffffff20;color:#d9c7a8;font-size:10px;font-weight:800}
      .amargenta-menu-panel{position:absolute;left:18px;top:88px;width:min(390px,calc(100vw - 36px));max-height:calc(100vh - 108px);overflow-y:auto;padding:18px;border-radius:20px;background:linear-gradient(145deg,rgba(20,34,30,.97),rgba(28,43,35,.96));border:1px solid #d8b77d99;box-shadow:0 22px 70px #000b;font-size:12px;line-height:1.65;backdrop-filter:blur(20px)}
      .amargenta-menu-panel button{transition:transform .16s,filter .16s}
      .amargenta-menu-panel button:hover{filter:brightness(1.16);transform:translateY(-1px)}
      .amargenta-toast{position:absolute;top:84px;left:50%;transform:translateX(-50%);padding:11px 18px;border-radius:14px;background:rgba(27,48,39,.94);border:1px solid #e0c18b;color:#f6e8cf;font-size:12px;font-weight:850;box-shadow:0 12px 32px #0008;backdrop-filter:blur(12px)}
      .amargenta-interact{border:1px solid #f1d39a!important;background:linear-gradient(145deg,rgba(39,56,43,.96),rgba(21,33,29,.96))!important;box-shadow:0 12px 34px #0009,inset 0 1px #ffffff22!important;padding:13px 20px!important;border-radius:15px!important;backdrop-filter:blur(12px);font-size:12px!important}
      .amargenta-dialogue{background:linear-gradient(145deg,rgba(42,34,27,.98),rgba(18,34,29,.98));border:1px solid #e2c28b;box-shadow:0 24px 80px #000c,inset 0 1px #ffffff20}
      @media (max-width: 720px) {
        .amargenta-title{top:9px!important;left:9px!important;gap:8px!important;padding:7px 8px!important}
        .amargenta-title .amargenta-brand{font-size:15px!important;letter-spacing:2px!important}
        .amargenta-title .amargenta-city{font-size:21px!important}
        .amargenta-menu-button{padding:8px 10px!important;font-size:10px}
        .amargenta-status{top:64px;left:10px;right:auto;padding:7px 10px;font-size:9px}
         .arabnite-coins{top:104px!important;right:10px!important;padding:7px 10px!important;font-size:10px!important}
        .amargenta-objective{right:10px;bottom:12px;width:min(245px,calc(100vw - 145px));padding:11px 12px}
        .amargenta-objective-title{font-size:11px}
        .amargenta-objective-waypoint{font-size:9px;margin-top:6px;padding-top:6px}
        .amargenta-menu-panel{left:10px;top:108px;width:min(370px,calc(100vw - 20px));max-height:calc(100vh - 120px);padding:14px}
        .amargenta-toast{top:108px;width:max-content;max-width:calc(100vw - 24px);font-size:10px;text-align:center}
        .amargenta-joystick{left:12px!important;bottom:16px!important;width:116px!important;height:116px!important}
        .amargenta-interact{bottom:145px!important;max-width:calc(100vw - 28px);white-space:normal!important}
        .amargenta-dialogue{bottom:14px!important;padding:16px!important}
      }
      @media (max-width: 390px){.amargenta-title{gap:6px!important}.amargenta-title .amargenta-brand{font-size:12px!important}.amargenta-title .amargenta-city{font-size:18px!important}.amargenta-menu-button{padding:7px 8px!important}}
    `}</style>
    <div ref={hostRef} style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#b7cbd0 0%,#d5d0b0 48%,#66764b 100%)"}} />
    
    <div className="amargenta-title" style={{position:"absolute",top:18,left:18,display:"flex",alignItems:"center",gap:16,pointerEvents:"none",textShadow:"0 2px 12px #17201d",zIndex:20}}>
      <div className="amargenta-brand" style={{fontSize:22,letterSpacing:3,color:"#f2c94c",fontWeight:1000}}>SOGNATORI</div>
      <div className="amargenta-city" style={{fontSize:30,fontWeight:900,lineHeight:1.15,color:"#ffffff"}}>{zone?.toLowerCase().includes("arabnite")?"ARABNITE":"AMARGENTA"}</div>
      <button className="amargenta-menu-button" onClick={()=>{setMenuOpen(v=>!v);if(menuOpen)setPanel(null);}} style={{pointerEvents:"auto",cursor:"pointer",whiteSpace:"nowrap"}}>☰ MENU</button>
    </div>
     <div className="amargenta-status amargenta-glass"><span style={{color:"#e9c58d"}}>✦</span><span>{zone}</span><span style={{opacity:.45}}>·</span><span>{worldMoment}</span>{!zone?.toLowerCase().includes("arabnite")&&<><span style={{opacity:.45}}>·</span><span style={{color:"#e9c58d"}}>✦ FIDUCIA {trustTotal}/25</span></>}</div>
     {!menuOpen&&!dialogue&&!zone?.toLowerCase().includes("arabnite")&&<div className="amargenta-objective amargenta-glass"><div className="amargenta-objective-label">✧ PROSSIMO OBIETTIVO</div><div className="amargenta-objective-title">{activeObjective}</div>{objectiveWaypoint&&<div className="amargenta-objective-waypoint"><span>⌖ {objectiveWaypoint.name} · {waypointDirection}</span><span>{waypointDistance} m</span></div>}</div>}
    {hint&&<div className="amargenta-toast" style={{top:54,zIndex:40,background:"rgba(27,48,39,.96)"}}>{hint}</div>}{toast&&<div className="amargenta-toast">{toast}</div>}
    {menuOpen&&<div className="amargenta-menu-panel">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><strong style={{color:"#e9c58d",letterSpacing:1}}>MENU · {zone?.toLowerCase().includes("arabnite")?"ARABNITE":"AMARGENTA"}</strong><button onClick={()=>{setMenuOpen(false);setPanel(null);}} style={{background:"transparent",color:"#f4ead8",border:0,fontSize:18,cursor:"pointer"}}>×</button></div>
      <button onClick={()=>travelToWorldRef.current?.(zone?.toLowerCase().includes("arabnite")?"amargenta":"arabnite")} style={{width:"100%",marginBottom:10,border:"1px solid #e8c47e",borderRadius:10,background:"linear-gradient(135deg,#9b713e,#65452d)",color:"#fff2d8",padding:"12px 10px",fontSize:12,fontWeight:900,cursor:"pointer"}}>{zone?.toLowerCase().includes("arabnite")?"✦ TORNA AD AMARGENTA":"✦ RAGGIUNGI IL PORTALE DI ARABNITE"}</button>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:7,marginBottom:12}}>
        {(zone?.toLowerCase().includes("arabnite") ? [[null,"⌂","Menu"],["arabnitani","✧","Arabnitani"],["zone","☀","Zona e orario"]] : [[null,"⌂","Menu"],["journal","✎","Taccuino"],["inventory","▣","Borsa"],["zone","☀","Zona e orario"],["team","♙","Squadra"],["restart","↻","Riparti dal primo giorno"],["exit","↩","Torna a Verdelume"]]).map(([id,icon,label])=><button key={String(id)} onClick={()=>{if(id==="exit"){if(zone?.toLowerCase().includes("arabnite"))travelToWorldRef.current?.("amargenta");else{setMenuOpen(false);onExit?onExit():window.location.assign("/avventura");}}else if(id==="restart"){if(window.confirm("Ripartire dal primo giorno? Verranno azzerati progressi, squadra e oggetti di Amargenta su questo dispositivo.")){["sognatori:amargenta:save:v2","sognatori:amargenta:roster:v1","sognatori:amargenta:first-day:v1"].forEach(key=>window.localStorage.removeItem(key));window.location.reload();}}else {setPanel(id);if(id==="journal")setJournalPage(0);}}} style={{border:"1px solid #d8bd8b88",borderRadius:9,background:panel===id?"#a87545ee":"#26382bee",color:"#f6ead5",padding:"10px 9px",fontSize:11,fontWeight:800,cursor:"pointer",textAlign:"left"}}>{icon} · {label}</button>)}
      </div>
      {panel===null&&!zone?.toLowerCase().includes("arabnite")&&<div style={{padding:"10px 2px",color:"#d7c5a5"}}><strong style={{color:"#e9c58d"}}>Amargenta</strong><div>La città segreta del caffè</div><div style={{marginTop:8}}>Scegli una sezione per consultare il taccuino, la squadra o la borsa.</div><div style={{marginTop:14,padding:12,borderRadius:12,background:"#ffffff0b",border:"1px solid #d8bd8b55"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,color:"#e9c58d",fontWeight:900,fontSize:11}}><span>FIDUCIA DEGLI ABITANTI</span><span>{trustTotal}/25</span></div><div style={{height:6,background:"#ffffff18",borderRadius:9,overflow:"hidden",marginTop:8}}><div style={{height:"100%",width:(trustTotal/25*100)+"%",background:"linear-gradient(90deg,#78a879,#e9c58d)",borderRadius:9}}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginTop:10}}>{trustResidents.map((resident)=><div key={resident.id} style={{fontSize:10,color:"#d7c5a5",display:"flex",justifyContent:"space-between",gap:5}}><span>{resident.name}</span><strong style={{color:"#e9c58d"}}>{residentTrust[resident.id]||0}/5</strong></div>)}</div><div style={{fontSize:10,color:"#d7c5a5",marginTop:8}}>Completa gli incarichi per costruire legami più forti. La fiducia resta salvata.</div></div></div>}
      {panel===null&&zone?.toLowerCase().includes("arabnite")&&<div style={{padding:"10px 2px",color:"#e8d7bd"}}>
         <strong style={{color:"#f1cb7b"}}>Arabnite · Città delle Lanterne</strong>
         <div style={{marginTop:7}}>Un grande tendone ospita l’Arena delle Carte: entra e affronta duelli 1 contro 1.</div>
         <div style={{display:"flex",justifyContent:"space-between",marginTop:14,padding:12,borderRadius:12,background:"#ffffff0b",border:"1px solid #e9c16d66"}}><span>🃏 Carte scoperte</span><strong>{ROSTER.filter(card=>Number(arabniteCollection.cards[card.id])>0).length}/64</strong></div>
         <div style={{display:"flex",justifyContent:"space-between",marginTop:8,padding:12,borderRadius:12,background:"#ffffff0b",border:"1px solid #e9c16d66"}}><span>✦ Bustine da aprire</span><strong>{arabniteCollection.packs}</strong></div>
         <div style={{display:"flex",justifyContent:"space-between",marginTop:8,padding:12,borderRadius:12,background:"#ffffff0b",border:"1px solid #e9c16d66"}}><span>◈ Monete del bazar</span><strong>{arabniteCollection.coins??120}</strong></div>
         <div style={{fontSize:11,lineHeight:1.5,color:"#e8d7bd",marginTop:8}}>Adli custodisce l’Arena delle Carte. Raccogli le bustine sparse in città per ampliare la tua collezione.</div>
         <button onClick={()=>setPanel("cards")} style={{width:"100%",marginTop:10,border:"1px solid #e9c16d",borderRadius:10,padding:11,background:"linear-gradient(135deg,#76519b,#3f315e)",color:"#fff4dc",fontWeight:900}}>APRI L'ALBUM DEI SOGNATORI</button>
       </div>}
       {panel==="arabnitani"&&<div style={{color:"#f2e4cc"}}>
         <div style={{fontSize:11,color:"#d7c5a5",marginBottom:10}}>Gli abitanti di Arabnite, esclusi i tre Sognatori giocabili: Cervio, Gunvallo e Rullino.</div>
         <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:9}}>
           {ARABNITE_RESIDENTS.map((s)=> <div key={s.id} style={{minWidth:0,padding:8,borderRadius:11,background:"linear-gradient(145deg,#ffffff12,#ffffff06)",border:"1px solid #e9c16d55",textAlign:"center"}}>
             <div style={{height:112,display:"grid",placeItems:"center",borderRadius:8,background:"#171c25"}}><img src={s.img} alt={s.nome} loading="lazy" style={{width:"100%",height:"100%",objectFit:"contain"}}/></div>
             <strong style={{display:"block",marginTop:6,fontSize:12,color:"#f5d38b"}}>{s.nome}</strong>
             <span style={{fontSize:9,color:"#d7c5a5"}}>Carta n. {s.numero||1} · {s.tipo}</span>
           </div>)}
         </div>
       </div>}
       {panel==="zone"&&<div style={{padding:8,borderRadius:9,background:"#ffffff0b"}}><strong style={{color:"#e9c58d"}}>ZONA ATTUALE</strong><div style={{fontSize:15,fontWeight:800,marginTop:5}}>{zone}</div><div style={{marginTop:5,color:"#d7c5a5"}}>Momento della giornata: {worldMoment}</div><div style={{marginTop:5,color:"#d7c5a5"}}>Posizione · X {playerCoords.x} · Z {playerCoords.z}</div></div>}
      {panel==="controls"&&<div style={{color:"#e6d6bb"}}><strong style={{color:"#e9c58d"}}>ESPLORAZIONE LIBERA</strong><div style={{marginTop:6}}>WASD o frecce: muovi il personaggio</div><div>C: cambia personaggio · ad Arabnite Cervio / Gunvallo / Rullino</div><div>F: abilità speciale del personaggio attivo</div><div>Shift: corri</div><div>Spazio: salta gli ostacoli bassi</div><div>E: interagisci</div><div>Trascina il mouse: ruota la visuale</div><div>Rotella: avvicina o allontana la visuale</div><div style={{marginTop:10,fontWeight:800}}>Comandi touch</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,46px)",gridTemplateRows:"repeat(2,46px)",gap:5,marginTop:7,touchAction:"none"}}>{[{label:"↑",code:"KeyW",col:2,row:1},{label:"←",code:"KeyA",col:1,row:2},{label:"↓",code:"KeyS",col:2,row:2},{label:"→",code:"KeyD",col:3,row:2}].map(c=><button key={c.code} style={{gridColumn:c.col,gridRow:c.row,border:"1px solid #e1c28d88",borderRadius:12,background:"#18221ecc",color:"#f8ecd8",fontSize:22,fontWeight:800,touchAction:"none"}} onPointerDown={e=>{e.preventDefault();window.dispatchEvent(new KeyboardEvent("keydown",{code:c.code}));}} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))} onPointerCancel={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))} onLostPointerCapture={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))} onPointerLeave={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))}>{c.label}</button>)}</div></div>}
      {panel!==null&&panel!=="zone"&&panel!=="controls"&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><strong style={{color:panel==="journal"?"#68472f":"#e9c58d",letterSpacing:1}}>{panel==="journal"?"TACCUINO DI AMARGENTA":panel==="team"?"SQUADRA DI AMARGENTA":panel==="cards"?"ALBUM DEI SOGNATORI":panel==="arabnitani"?"ARABNITANI":"BORSA E RISORSE"}</strong><button onClick={()=>setPanel(null)} style={{background:"transparent",color:panel==="journal"?"#68472f":"#f4ead8",border:0,fontSize:18,cursor:"pointer"}}>←</button></div>}
      {panel==="map"&&<div>
        <div style={{height:190,position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid #8d7554",background:"linear-gradient(135deg,#405f3c,#718454 48%,#526e48)",backgroundImage:"repeating-linear-gradient(0deg,transparent 0 18px,rgba(255,255,255,.035) 18px 19px),repeating-linear-gradient(90deg,transparent 0 18px,rgba(255,255,255,.035) 18px 19px)"}}>
          <div style={{position:"absolute",left:"68%",top:0,width:9,height:"100%",background:"#397f83",opacity:.9}}/>
          <div style={{position:"absolute",left:"60%",top:"27%",width:"25%",height:7,background:"#b99a71",border:"1px solid #6d563d"}}/>
          <div style={{position:"absolute",left:"60%",top:"50%",width:"25%",height:7,background:"#b99a71",border:"1px solid #6d563d"}}/>
          <div style={{position:"absolute",left:"17%",top:"49%",width:"47%",height:7,background:"#c7a47a",transform:"rotate(-2deg)"}}/>
          <div style={{position:"absolute",left:"48%",top:"50%",width:"23%",height:6,background:"#c7a47a",transform:"rotate(24deg)"}}/>
          {[
            ["Ingresso",-44,2,"#f1d18b"],["Piazza",0,0,"#e5b66b"],["Flame",-24,-31,"#d9d58b"],
            ["Belligonghi-umami",-10,-19,"#c7a5df"],["Cardinero",18,-7,"#78b6c1"],["Torrefazione",16,28,"#a64c36"],
            ["Caffè",-22,-1,"#a64c36"],["Campana Ovest",-30,4,"#f0d28a"],["Campana Mercato",-2,18,"#f0d28a"],["Campana Est",16,-2,"#f0d28a"],["Cripta",-70,-43,"#d4b3ff"]
          ].map(([name,x,z,color])=><div key={name} title={name} style={{position:"absolute",left:Math.max(2,Math.min(98,(x+72)/144*100))+"%",top:Math.max(2,Math.min(98,(z+72)/144*100))+"%",width:8,height:8,borderRadius:8,background:color,border:"1px solid #33271f",transform:"translate(-50%,-50%)"}}/>)}
          <div style={{position:"absolute",left:Math.max(3,Math.min(97,(playerCoords.x+72)/144*100))+"%",top:Math.max(3,Math.min(97,(playerCoords.z+72)/144*100))+"%",width:12,height:12,borderRadius:12,background:"#fff",border:"3px solid #a64c36",boxShadow:"0 0 12px #fff",transform:"translate(-50%,-50%)"}}/>
          <div style={{position:"absolute",right:7,top:5,fontSize:9,fontWeight:900,color:"#fff4d8",textShadow:"0 1px 3px #000"}}>N ↑</div>
        </div>
        <div style={{marginTop:8,color:"#d7c5a5"}}>Punti dorati: ingresso e piazza · Simboli: personaggi, botteghe e Cripta · Punto bianco: tu</div>
      </div>}
      {panel==="journal"&&<div style={{padding:14,borderRadius:12,background:"linear-gradient(145deg,#f3e5c8,#e6d2ad)",border:"2px solid #9b7950",boxShadow:"inset 0 0 0 4px #ffffff55",color:"#493522"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:8,borderBottom:"1px solid #9b795077",fontSize:10,letterSpacing:2,fontWeight:900,color:"#8a603c"}}><span>DIARIO DI VIAGGIO</span><span>PAGINA {journalPage+1} / 2</span></div>
        {[["Le Fave d'Ambra",questStarted,questCount,3,questDone,"Aiuta Flame a controllare le piante e raccogli tre fave dorate."],["La Ricetta Perduta",recipeStarted,recipePages,4,recipeDone,"Aiuta Belligonghi-umami a ricomporre la ricetta perduta."],["Le Condotte Antiche",waterStarted,valves,3,waterDone,"Aiuta Cardinero a riattivare le tre condotte."],["Le campane del borgo",bellsStarted,bellCount,3,bellsDone,"Parla con Muccanza al Caffè delle Tre Foglie, risveglia le tre campane e torna da lui."]].slice(journalPage*3,journalPage*3+3).map(([name,started,count,total,done,desc],index)=><div key={name} style={{minHeight:112,padding:"12px 2px",borderBottom:"1px dashed #a98b65"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}><strong style={{fontFamily:"Georgia,serif",fontSize:15}}>{journalPage*3+index+1}. {name}</strong><span style={{fontSize:9,fontWeight:900,color:done?"#287345":"#94622e",whiteSpace:"nowrap"}}>{done?"COMPLETATA":started?count+"/"+total:"DA INIZIARE"}</span></div>
          <div style={{fontFamily:"Georgia,serif",fontSize:12,lineHeight:1.5,color:"#654c35",marginTop:7}}>{desc}</div>
          <div style={{marginTop:7,height:4,borderRadius:5,background:"#c8b18e",overflow:"hidden"}}><div style={{height:"100%",width:(done?100:started?Math.min(100,count/total*100):0)+"%",background:"#668052"}}/></div>
        </div>)}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
          <button disabled={journalPage===0} onClick={()=>setJournalPage(p=>Math.max(0,p-1))} style={{border:"1px solid #9b7950",borderRadius:8,padding:"7px 12px",background:journalPage===0?"#d8c7aa":"#8b6542",color:journalPage===0?"#a99476":"#fff2dc",fontWeight:900,cursor:journalPage===0?"default":"pointer"}}>‹ PAGINA PRECEDENTE</button>
          <button disabled={journalPage===1} onClick={()=>setJournalPage(p=>Math.min(1,p+1))} style={{border:"1px solid #9b7950",borderRadius:8,padding:"7px 12px",background:journalPage===1?"#d8c7aa":"#8b6542",color:journalPage===1?"#a99476":"#fff2dc",fontWeight:900,cursor:journalPage===1?"default":"pointer"}}>SUCCESSIVA ›</button>
        </div>
      </div>}
      {panel==="cards"&&<div style={{color:"#f2e4cc"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:9}}>
          <div><strong style={{color:"#f1cb7b"}}>COLLEZIONE</strong><div style={{fontSize:10,color:"#d7c5a5"}}>{ROSTER.filter(card=>Number(arabniteCollection.cards[card.id])>0).length} carte scoperte · 64 disponibili</div><div style={{fontSize:9,color:"#d7c5a5"}}>Bustine: {(arabniteCollection.packInventory||[]).filter(p=>p==="standard").length} standard · {(arabniteCollection.packInventory||[]).filter(p=>p==="premium").length} premium · {(arabniteCollection.packInventory||[]).filter(p=>p==="rare").length} rare</div></div>
          <div style={{fontSize:22,fontWeight:1000,color:"#f1cb7b"}}>{arabniteCollection.packs} ✦</div>
        </div>
        <button disabled={arabniteCollection.packs<=0} onClick={openArabnitePack} style={{width:"100%",border:"1px solid #f0c66e",borderRadius:10,padding:12,background:arabniteCollection.packs>0?"linear-gradient(135deg,#8d5bb2,#51366f)":"#49404f",color:"#fff5df",fontWeight:1000,cursor:arabniteCollection.packs>0?"pointer":"not-allowed",opacity:arabniteCollection.packs>0?1:.55}}>✦ SBUSTA UNA BUSTINA · 3 CARTE</button>
        {cardReveal.length>0&&<div style={{marginTop:11,padding:10,borderRadius:12,background:"linear-gradient(135deg,#5b3d76,#27223f)",border:"1px solid #e8c46f"}}>
          <div style={{fontWeight:900,color:"#f7d887",marginBottom:8}}>ULTIMA SBUSTATA</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:7}}>{cardReveal.map((card,index)=><div key={card.id+"-"+index} style={{textAlign:"center",minWidth:0}}>
            <img src={card.img} alt={card.nome} style={{width:"100%",height:76,objectFit:"contain",background:"#ffffff16",borderRadius:8}}/><strong style={{display:"block",fontSize:10,marginTop:4}}>{card.nome}</strong>
            <span style={{fontSize:9,color:card.rarity==="LEGGENDA"?"#ffd36b":card.rarity==="EPICA"?"#e0a5ff":card.rarity==="RARA"?"#8bd8ff":"#c9c1b7"}}>{card.rarity||"COMUNE"}</span><span style={{display:"block",fontSize:9,color:card.isNew?"#9ff0c0":"#f5d28a"}}>{card.isNew?"NUOVA":"DOPPIONE"} · x{card.copies}</span>
          </div>)}</div><button onClick={()=>setCardReveal([])} style={{marginTop:8,border:0,background:"transparent",color:"#f1dfbd",fontSize:10,textDecoration:"underline"}}>Nascondi risultato</button>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:7,marginTop:12}}>
          {Array.from({length:64},(_,index)=>{const card=ROSTER[index]||null,copies=card?Number(arabniteCollection.cards[card.id])||0:0,discovered=copies>0;return <div key={card?.id||"slot-"+index} style={{minWidth:0,padding:6,borderRadius:9,border:"1px solid "+(discovered?"#d8b46b88":"#ffffff20"),background:discovered?"linear-gradient(160deg,#57466b,#302c43)":"#ffffff08",textAlign:"center"}}>
            <div style={{height:92,position:"relative",overflow:"hidden",borderRadius:7,background:"linear-gradient(145deg,#221b35,#5a4773)",border:"1px solid "+(discovered?"#f1cb7b88":"#ffffff20")}}><img src={card.img} alt={card.nome} loading="lazy" onError={(e)=>{e.currentTarget.style.visibility="hidden";}} style={{width:"100%",height:"100%",objectFit:"contain",opacity:discovered?1:.28,filter:discovered?"none":"grayscale(1) brightness(.72)"}}/>{!discovered&&<div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",fontSize:23,fontWeight:1000,color:"#f1dba9",textShadow:"0 2px 8px #171126"}}>?</div>}</div>
            <strong style={{display:"block",fontSize:9,marginTop:4,overflowWrap:"anywhere"}}>{discovered?card.nome:card?"???":"Carta "+(index+1)}</strong>
            <span style={{display:"block",fontSize:8,color:"#d2c0a5",marginTop:2}}>{discovered?card.tipo+(copies>1?" · x"+copies:""):card?"Da scoprire":"Archivio in arrivo"}</span><span style={{display:"block",fontSize:7,color:"#e9c58d",marginTop:2}}>{discovered?(Number(card.costo)>=40?"LEGGENDA":Number(card.costo)>=28?"EPICA":Number(card.costo)>=18?"RARA":"COMUNE"):""}</span>
          </div>;})}
        </div>
        <div style={{fontSize:9,color:"#bfae98",marginTop:9}}></div>
      </div>}
      {panel==="team"&&<div>
        <div style={{color:"#d7c5a5",marginBottom:10}}>La squadra di Amargenta è indipendente dall'Avventura. Puoi portare fino a 4 Sognatori; solo quelli in squadra partecipano alle lotte.</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><strong style={{color:"#e9c58d"}}>SQUADRA ATTIVA</strong><span style={{color:"#e9c58d"}}>{amargentaPartyIds.length}/4</span></div>
        {amargentaPartyIds.length===0&&<div style={{padding:10,color:"#d7c5a5"}}>Non hai ancora compagni. Esplora Amargenta, parla con i Sognatori e convincili a unirsi a te.</div>}
        {AMARGENTA_ROSTER.filter((s)=>amargentaPartyIds.includes(s.id)).map((s)=><div key={s.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:"1px solid #ffffff18"}}><img src={s.img} alt={s.nome} style={{width:42,height:42,objectFit:"contain",background:"#ffffff12",borderRadius:9}}/><div style={{flex:1,minWidth:0}}><strong>{s.nome}</strong><div style={{fontSize:10,color:"#d7c5a5"}}>{s.tipo} · ATK {s.att} · DEF {s.dif} · SPE {s.vel}</div></div><button onClick={()=>moveAmargentaToBox(s.id)} style={{border:"1px solid #d8bd8b88",borderRadius:8,padding:"6px 9px",background:"#49352d",color:"#f6ead5",fontSize:10,fontWeight:800}}>Al box</button></div>)}
        <div style={{marginTop:14,marginBottom:7}}><strong style={{color:"#e9c58d"}}>BOX DI AMARGENTA · {amargentaBoxIds.length}</strong></div>
        {amargentaBoxIds.length===0&&<div style={{color:"#d7c5a5",padding:8}}>Nessun Sognatore nel box.</div>}
        {AMARGENTA_ROSTER.filter((s)=>ownedAmargentaIds.includes(s.id) && amargentaBoxIds.includes(s.id)).map((s)=><div key={s.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:"1px solid #ffffff18"}}><img src={s.img} alt={s.nome} style={{width:42,height:42,objectFit:"contain",background:"#ffffff12",borderRadius:9}}/><div style={{flex:1,minWidth:0}}><strong>{s.nome}</strong><div style={{fontSize:10,color:"#d7c5a5"}}>{s.tipo} · ATK {s.att} · DEF {s.dif} · SPE {s.vel}</div></div><button disabled={amargentaPartyIds.length>=4} onClick={()=>moveAmargentaToParty(s.id)} style={{border:"1px solid #d8bd8b88",borderRadius:8,padding:"6px 9px",background:amargentaPartyIds.length>=4?"#454545":"#315b42",color:"#f6ead5",fontSize:10,fontWeight:800,opacity:amargentaPartyIds.length>=4?.5:1}}>In squadra</button></div>)}
      </div>}
      {panel==="inventory"&&<div>
        {[[ "Fave d'Ambra",inventory.amberBeans,"☕",["Peperoncini",inventory.peppers,"🌶️"],["Tartufi",inventory.truffles,"🍄"],["Latte imbottigliato",inventory.milk,"🥛"],["Chicchi di caffè",inventory.coffeeBeans,"🫘"]],["Frammenti di ricetta",inventory.recipeFragments,"📜"],["Cristalli d'acqua",inventory.waterCrystals,"💧"],["Agrumi",inventory.citrus,"🍊"],["Miscele d'Autore",inventory.coffeeBlend,"☕"],["Tisane del Retrogusto",inventory.herbalTea,"🍵"],["Reliquie",inventory.relics,"✦"]].map(([name,count,emoji])=><div key={name} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #ffffff18"}}><span>{emoji} {name}</span><strong>{count}</strong></div>)}
        <div style={{marginTop:10,color:"#d7c5a5"}}>Le risorse e i progressi vengono salvati su questo dispositivo.</div>
      </div>}
    </div>}
    {latteloBattleOpen&&<AdventureBattle
      opponentName="Lattelo"
      isWild
      playerRoster={AMARGENTA_ROSTER.filter((s) => amargentaPartyIds.includes(s.id))}
      enemyTeam={[{...ROSTER.find(s=>s.id==="lattelo"),hp:20,hpMax:20}]}
      onFinish={(result)=>{
        setLatteloBattleOpen(false);
        if(result==="win"){recruitAmargenta("lattelo");setToast("Lattelo ha deciso di unirsi a te!");}
        else if(result==="loss")setToast("Lattelo ti ha respinto · Puoi riprovare");
      }}
    />}
    {zibelleBattleOpen&&<AdventureBattle
      opponentName="Zibelle selvatica"
      isWild
      playerRoster={AMARGENTA_ROSTER.filter((s) => amargentaBoxIds.includes(s.id))}
      enemyTeam={[{...ROSTER.find(s=>s.id==="zibelle"),hp:20,hpMax:20}]}
      onFinish={(result)=>{
        setZibelleBattleOpen(false);
        if(result==="win"){if(recruitAmargenta("zibelle"))setToast("Zibelle si è unita alla tua squadra!");else setToast("Zibelle è già stata convinta: non puoi ottenere un doppione.");}
        else if(result==="loss")setToast("La Zibelle ti ha respinto · Puoi riprovare");
      }}
    />}
    {dungeonBattleOpen&&<AdventureBattle
      opponentName="Guardiano del Retrogusto"
      isWild
      playerRoster={AMARGENTA_ROSTER.filter((s) => amargentaBoxIds.includes(s.id))}
      enemyTeam={[{
        id:"guardian-retrogusto",
        nome:"Guardiano del Retrogusto",
        tipo:"Salato",
        att:17,
        dif:15,
        vel:10,
        hp:60,
        hpMax:60,
        abilKey:"riwi_riccioarmatura",
        abil:"Corazza delle Tre Foglie",
        abilDesc:"La corazza punisce chi osa colpire il Guardiano."
      }]}
      onFinish={(result)=>{
        setDungeonBattleOpen(false);
        if(result==="win"){
          dungeonBossDefeatedRef.current=true;
          setDungeonBossDefeated(true);
          setToast("Guardiano sconfitto · Cripta purificata");
          setDialogue({title:"Il Guardiano si dissolve",text:"La corazza si apre e la creatura si arrende. Il cuore della Cripta è finalmente libero: raggiungi lo scrigno centrale."});
        } else if(result==="loss"){
          setToast("Il Guardiano ti ha respinto · Puoi riprovare");
        }
      }}
    />}
    {!menuOpen&&<>{nearby&&!dialogue&&<button className="amargenta-interact" onClick={()=>{if(nearby.action)nearby.action();else setDialogue({title:nearby.title,text:nearby.text});}} style={{position:"absolute",left:"50%",bottom:30,transform:"translateX(-50%)",padding:"10px 16px",borderRadius:12,background:"#18221eef",border:"1px solid #e1c28d",fontSize:13,boxShadow:"0 8px 30px #0008",whiteSpace:"nowrap",color:"#f5ead7",cursor:"pointer"}}><strong style={{color:"#f0c98d"}}>E · INTERAGISCI</strong><span style={{marginLeft:10}}>{nearby.title}</span></button>}
    <div className="amargenta-joystick" aria-label="Joystick analogico" style={{position:"absolute",left:24,bottom:24,width:132,height:132,borderRadius:"50%",border:"2px solid #e1c28d99",background:"radial-gradient(circle,#314638dd 0%,#18221edb 72%)",boxShadow:"0 8px 28px #0008",touchAction:"none",display:"grid",placeItems:"center",zIndex:12}}
      onPointerDown={e=>{if(controlsLockedRef.current)return;e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-(r.left+r.width/2))/(r.width*.34);const y=(e.clientY-(r.top+r.height/2))/(r.height*.34);const v={x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))};touchStickRef.current=v;setTouchStick(v);}}
      onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-(r.left+r.width/2))/(r.width*.34);const y=(e.clientY-(r.top+r.height/2))/(r.height*.34);const len=Math.hypot(x,y);const scale=len>1?1/len:1;const v={x:x*scale,y:y*scale};touchStickRef.current=v;setTouchStick(v);}}
      onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);touchStickRef.current={x:0,y:0};setTouchStick({x:0,y:0});}}
      onPointerCancel={()=>{touchStickRef.current={x:0,y:0};setTouchStick({x:0,y:0});}}
      onLostPointerCapture={()=>{touchStickRef.current={x:0,y:0};setTouchStick({x:0,y:0});}}>
      <div style={{width:54,height:54,borderRadius:"50%",border:"2px solid #f0d5a5",background:"linear-gradient(145deg,#c49a63,#76543a)",boxShadow:"0 3px 12px #0009",transform:`translate(${touchStick.x*35}px,${touchStick.y*35}px)`,pointerEvents:"none"}}/>
    </div>
    <div className="amargenta-mobile-actions" style={{position:"absolute",right:18,bottom:22,display:"flex",flexDirection:"column",alignItems:"center",gap:9,zIndex:16,pointerEvents:"none"}}>
      <button aria-label="Cambia personaggio" onPointerDown={e=>{e.preventDefault();if(!controlsLockedRef.current)window.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyC"}));}} style={{pointerEvents:"auto",width:68,height:56,borderRadius:18,border:"2px solid #f0d5a5",background:"linear-gradient(145deg,#426b83,#243c50)",color:"#fff3dc",fontWeight:900,fontSize:11,boxShadow:"0 5px 18px #0009",touchAction:"none",cursor:"pointer"}}>⇄<br/>CAMBIA</button>
      <button aria-label="Usa abilità del Sognatore attivo" onPointerDown={e=>{e.preventDefault();if(controlsLockedRef.current)return;window.dispatchEvent(new KeyboardEvent("keydown",{code:activeCharacter==="cervio"?"ShiftLeft":"KeyF"}));}} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:"ShiftLeft"}))} onPointerCancel={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:"ShiftLeft"}))} onLostPointerCapture={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:"ShiftLeft"}))} style={{pointerEvents:"auto",width:68,height:56,borderRadius:18,border:"2px solid #f0d5a5",background:"linear-gradient(145deg,#a87843,#694327)",color:"#fff3dc",fontWeight:900,fontSize:11,boxShadow:"0 5px 18px #0009",touchAction:"none",cursor:"pointer"}}>{({"talpitrippa":"⛏|SCAVA","ripple":"🎣|PESCA","moci-moci":"🧗|SCALA","piocino":"🪽|VOLA","gunvallo":"🍬|SPARA","cervio":"💨|CORRI","rullino":"⛸|PATTINA"}[activeCharacter]||"✦|AZIONE").split("|")[0]}<br/>{({"talpitrippa":"SCAVA","ripple":"PESCA","moci-moci":"SCALA","piocino":"VOLA","gunvallo":"SPARA","cervio":"CORRI","rullino":"PATTINA"}[activeCharacter]||"AZIONE")}</button>
      <button aria-label="Salta o svolazza con Piocino" onPointerDown={e=>{e.preventDefault();if(!controlsLockedRef.current)window.dispatchEvent(new KeyboardEvent("keydown",{code:"Space"}));}} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:"Space"}))} onPointerCancel={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:"Space"}))} onLostPointerCapture={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:"Space"}))} style={{pointerEvents:"auto",width:68,height:56,borderRadius:18,border:"2px solid #f0d5a5",background:"linear-gradient(145deg,#c49a63,#76543a)",color:"#fff3dc",fontWeight:900,fontSize:11,boxShadow:"0 5px 18px #0009",touchAction:"none",cursor:"pointer"}}>↑<br/>{activeCharacter==="piocino"?"VOLA":"SALTO"}</button>
    </div></>}
<div>{worldTransition&&<div role="status" aria-live="polite" style={{position:"absolute",inset:0,zIndex:100,display:"grid",placeItems:"center",background:worldTransition==="arabnite"?"radial-gradient(ellipse at center,#56351b 0%,#130f18 72%)":"radial-gradient(ellipse at center,#254a38 0%,#101a19 72%)",color:"#fff1d5",fontFamily:"inherit",pointerEvents:"all"}}><div style={{textAlign:"center",padding:24}}><div style={{fontSize:11,letterSpacing:5,fontWeight:900,color:"#e6bd75",marginBottom:18}}>S O G N A T O R I</div><div style={{fontSize:30,fontWeight:950,letterSpacing:2}}>{worldTransition==="arabnite"?"ARABNITE":"AMARGENTA"}</div><div style={{marginTop:12,fontSize:13,color:"#ead8bb"}}>{worldTransition==="arabnite"?"Il portale si apre sulle terre di Arabnite…":"Il varco ti riporta tra i profumi di Amargenta…"}</div><div style={{width:150,height:3,background:"#ffffff30",borderRadius:9,margin:"24px auto 0",overflow:"hidden"}}><div style={{height:"100%",width:"42%",background:"#e6bd75",borderRadius:9,animation:"arabniteLoad 1s ease-in-out infinite alternate"}}/></div></div><style>{"@keyframes arabniteLoad{from{transform:translateX(-35%)}to{transform:translateX(190%)}}"}</style></div>}</div>    {cardDuelOpen&&<div role="dialog" aria-modal="true" style={{position:"absolute",inset:0,zIndex:120,display:"grid",placeItems:"center",padding:14,background:"rgba(10,9,18,.88)",backdropFilter:"blur(8px)",color:"#fff1d5"}}>
      <div style={{width:"min(820px,100%)",maxHeight:"92%",overflowY:"auto",padding:18,borderRadius:20,border:"2px solid #e6bd75",background:"linear-gradient(145deg,#3d2945,#211e31)",boxShadow:"0 20px 70px #000b"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}>
          <div><div style={{fontSize:10,letterSpacing:3,color:"#e6bd75",fontWeight:900}}>ARABNITE · ARENA</div><div style={{fontSize:23,fontWeight:1000}}>Duello 1 vs 1</div></div>
          <button onClick={()=>{setCardDuelOpen(false);setCardDuel(null);}} style={{border:"1px solid #e6bd75",borderRadius:10,padding:"8px 12px",background:"#4a3547",color:"#fff1d5",fontWeight:900}}>ESCI ✕</button>
        </div>
        {!cardDuel&&<><div style={{color:"#e4d2b8",fontSize:13,marginBottom:12}}>Scegli una carta tra i 64 Sognatori. L'avversario ne schiererà una casuale. Ogni attacco consuma un turno e l'avversario contrattacca.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(104px,1fr))",gap:8}}>
            {ROSTER.map(card=><button key={card.id} onClick={()=>startCardDuel(card)} style={{minWidth:0,padding:7,borderRadius:11,border:"1px solid #d9b56b88",background:"#ffffff10",color:"#fff1d5",cursor:"pointer",textAlign:"center"}}>
              <img src={card.img} alt={card.nome} loading="lazy" style={{width:"100%",height:82,objectFit:"contain"}}/>
              <strong style={{display:"block",fontSize:11,overflowWrap:"anywhere"}}>{card.nome}</strong>
              <span style={{display:"block",fontSize:9,color:"#e6bd75"}}>ATK {card.att} · DEF {card.dif}</span>
            </button>)}
          </div>
        </>}
        {cardDuel&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{card:cardDuel.playerCard,hp:cardDuel.playerHp,max:cardDuel.maxPlayerHp,label:"LA TUA CARTA"},{card:cardDuel.opponentCard,hp:cardDuel.opponentHp,max:cardDuel.maxOpponentHp,label:"AVVERSARIO"}].map((side,i)=><div key={side.card.id} style={{padding:10,borderRadius:14,border:"1px solid #e6bd7588",background:"#ffffff0c",textAlign:"center"}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#e6bd75",fontWeight:900}}>{side.label}</div>
              <img src={side.card.img} alt={side.card.nome} style={{height:130,maxWidth:"100%",objectFit:"contain"}}/>
              <strong style={{display:"block",fontSize:14}}>{side.card.nome}</strong>
              <div style={{fontSize:10,color:"#d8c5a8",margin:"4px 0 8px"}}>ATK {side.card.att} · DEF {side.card.dif} · SPE {side.card.vel}</div>
              <div style={{height:9,borderRadius:9,background:"#ffffff20",overflow:"hidden"}}><div style={{height:"100%",width:Math.max(0,side.hp/side.max*100)+"%",background:i===0?"#79cf9a":"#e77c72"}}/></div>
              <div style={{fontSize:12,fontWeight:900,marginTop:4}}>{side.hp} / {side.max} HP</div>
            </div>)}
          </div>
          <div style={{marginTop:12,padding:12,borderRadius:12,background:"#100f1c",color:"#f3dfb9",lineHeight:1.5}}>{cardDuel.log}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
            {!cardDuel.done&&<button onClick={playCardDuelTurn} style={{flex:1,minWidth:140,padding:13,borderRadius:11,border:"1px solid #ffe08a",background:"linear-gradient(135deg,#b46a36,#80442d)",color:"#fff4dc",fontWeight:1000,cursor:"pointer"}}>⚔ ATTACCA</button>}
            {cardDuel.done&&<button onClick={()=>setCardDuel(null)} style={{flex:1,minWidth:140,padding:13,borderRadius:11,border:"1px solid #ffe08a",background:"#68508b",color:"#fff4dc",fontWeight:1000,cursor:"pointer"}}>NUOVA SFIDA</button>}
          </div>
        </div>}
      </div>
    </div>}
    {dialogue&&<div className="amargenta-dialogue" role="dialog" aria-modal="true" style={{position:"absolute",left:"50%",bottom:28,transform:"translateX(-50%)",width:"min(560px,calc(100vw - 32px))",padding:20,borderRadius:20,zIndex:30}}>
      <div style={{fontSize:10,letterSpacing:3,color:"#d8b77d",fontWeight:800}}>AMARGENTA · INCONTRO</div>
      <div style={{fontSize:22,fontWeight:900,margin:"5px 0 10px"}}>{dialogue.title}</div>
      <div style={{whiteSpace:"pre-line",lineHeight:1.7,fontSize:14,color:"#f2e6d3"}}>{dialogue.text}</div>
      {dialogue.actions?.map((action,index)=><button key={action.label+"-"+index} onClick={action.run} style={{marginTop:15,marginRight:8,border:"1px solid #e9c16d",borderRadius:9,padding:"8px 14px",background:"#59417a",color:"#fff3dc",fontWeight:900,cursor:"pointer"}}>{action.label}</button>)}{dialogue.confirm&&<button onClick={dialogue.confirm} style={{marginTop:15,marginRight:8,border:"1px solid #a8d4a2",borderRadius:9,padding:"8px 18px",background:"#315b42",color:"#fff3dc",fontWeight:900,cursor:"pointer"}}>Convincilo a unirsi</button>}<button onClick={()=>setDialogue(null)} style={{marginTop:15,border:"1px solid #d8b77d",borderRadius:9,padding:"8px 18px",background:"#9b6848",color:"#fff3dc",fontWeight:800,cursor:"pointer"}}>Continua · Esc</button>
    </div>}
  </div>;
}

class Amargenta3DErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Amargenta render error:", error, info); }
  render() {
    if (this.state.error) {
      const message = this.state.error?.message || String(this.state.error);
      return <div style={{position:"fixed",inset:0,zIndex:99999,background:"#18221e",color:"#f4ead8",display:"grid",placeItems:"center",padding:24,fontFamily:"system-ui,sans-serif"}}><div style={{width:"min(620px,100%)",padding:24,border:"1px solid #d8b77d",borderRadius:18,background:"#243229"}}><div style={{fontSize:12,letterSpacing:3,color:"#e7c28c",fontWeight:900}}>SOGNATORI · DIAGNOSTICA AMARGENTA</div><h1 style={{fontSize:24,fontWeight:900,margin:"12px 0"}}>Errore durante l'avvio della città</h1><p style={{fontSize:14,lineHeight:1.6,overflowWrap:"anywhere"}}>{message}</p><p style={{fontSize:12,opacity:.75,marginTop:14}}>Mandami uno screenshot di questa schermata: mostra l'errore reale.</p><button onClick={()=>window.location.reload()} style={{marginTop:18,padding:"10px 16px",borderRadius:10,background:"#c39455",color:"#18221e",fontWeight:900}}>Ricarica</button></div></div>;
    }
    return this.props.children;
  }
}
export default function Amargenta3D(props) {
  return <Amargenta3DErrorBoundary><Amargenta3DContent {...props} /></Amargenta3DErrorBoundary>;
}