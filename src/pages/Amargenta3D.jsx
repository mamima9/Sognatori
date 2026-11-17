import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import AdventureBattle from "@/components/game/AdventureBattle";
import { ROSTER } from "@/lib/sognatoriData";

// Roster locale di Amargenta: separato dal resto dell'Avventura.
const AMARGENTA_SOGNATORE_IDS = new Set([
  "torosucco", "crunchypat", "talamos", "pingcake",
  "zibelle", "lattelo", "muccanza", "cardinero", "umami", "flame"
]);
const AMARGENTA_ROSTER = ROSTER.filter((s) => AMARGENTA_SOGNATORE_IDS.has(String(s.id)));


/**
 * Amargenta 3D — ambiente esplorabile sperimentale.
 * La scena è isolata dal renderer Canvas di Avventura: non modifica Arcade/Multiplayer.
 * Gli asset GLB definitivi di Scenario potranno sostituire progressivamente i moduli procedurali.
 */
export default function Amargenta3D({ onExit }) {
  const hostRef = useRef(null);
  const [hint, setHint] = useState("");
  const [zone, setZone] = useState("Ingresso di Amargenta");
  const [dialogue, setDialogue] = useState(null);
  const [nearby, setNearby] = useState(null);
  const [amargentaPartyIds, setAmargentaPartyIds] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("sognatori:amargenta:roster:v1") || "{}");
      const valid = AMARGENTA_ROSTER.map((s) => s.id);
      if (Array.isArray(saved.partyIds)) return saved.partyIds.filter((id) => valid.includes(id)).slice(0, 4);
      return valid.slice(0, 4);
    } catch { return AMARGENTA_ROSTER.slice(0, 4).map((s) => s.id); }
  });
  const [amargentaBoxIds, setAmargentaBoxIds] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("sognatori:amargenta:roster:v1") || "{}");
      const valid = AMARGENTA_ROSTER.map((s) => s.id);
      if (Array.isArray(saved.partyIds) && Array.isArray(saved.boxIds)) return saved.boxIds.filter((id) => valid.includes(id) && !saved.partyIds.includes(id));
      const party = Array.isArray(saved.partyIds) ? saved.partyIds : valid.slice(0, 4);
      return valid.filter((id) => !party.includes(id));
    } catch { return AMARGENTA_ROSTER.slice(4).map((s) => s.id); }
  });
  const moveAmargentaToParty = (id) => {
    if (amargentaPartyIds.includes(id) || amargentaPartyIds.length >= 4) return;
    setAmargentaBoxIds((ids) => ids.filter((item) => item !== id));
    setAmargentaPartyIds((ids) => [...ids, id]);
  };
  const moveAmargentaToBox = (id) => {
    if (!amargentaPartyIds.includes(id)) return;
    setAmargentaPartyIds((ids) => ids.filter((item) => item !== id));
    setAmargentaBoxIds((ids) => [...ids, id]);
  };
  const [savedProgress] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("sognatori:amargenta:save:v2") || "{}"); }
    catch { return {}; }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("sognatori:amargenta:roster:v1", JSON.stringify({
        partyIds: amargentaPartyIds.filter((id) => AMARGENTA_SOGNATORE_IDS.has(String(id))).slice(0, 4),
        boxIds: amargentaBoxIds.filter((id) => AMARGENTA_SOGNATORE_IDS.has(String(id)))
      }));
    } catch (error) { console.warn("Impossibile salvare il box di Amargenta:", error); }
  }, [amargentaPartyIds, amargentaBoxIds]);
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
      herbalTea: Number(savedInventory.herbalTea) || 0
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
  const [muccanzaBattleOpen, setMuccanzaBattleOpen] = useState(false);
  const [muccanzaOpponentName, setMuccanzaOpponentName] = useState("Fan del Latte");
  const inventoryRef = useRef(inventory);
  const citrusHarvestedRef = useRef(Boolean(savedProgress.citrusHarvested));
  const [collectedAmber, setCollectedAmber] = useState(Array.isArray(savedProgress.collectedAmber) ? savedProgress.collectedAmber : []);
  const [collectedPages, setCollectedPages] = useState(Array.isArray(savedProgress.collectedPages) ? savedProgress.collectedPages : []);
  const [activatedValves, setActivatedValves] = useState(Array.isArray(savedProgress.activatedValves) ? savedProgress.activatedValves : []);
  const [panel, setPanel] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [touchStick, setTouchStick] = useState({x:0,y:0});
  const touchStickRef = useRef({x:0,y:0});
  const [playerCoords, setPlayerCoords] = useState({ x: -44, z: 2 });
  const [worldMoment, setWorldMoment] = useState("Mattina");
  const [toast, setToast] = useState("");
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

  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => {
    controlsLockedRef.current = Boolean(dialogue || panel || dungeonBattleOpen || muccanzaBattleOpen);
  }, [dialogue, panel, dungeonBattleOpen, muccanzaBattleOpen]);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    try {
      window.localStorage.setItem("sognatori:amargenta:save:v2", JSON.stringify({
        questStarted, questCount, questDone, inventory,
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
  }, [questStarted, questCount, questDone, inventory, recipeStarted, recipePages, recipeDone, waterStarted, valves, waterDone, secretUnlocked, vaultClaimed, citrusHarvested, collectedAmber, collectedPages, activatedValves, bellsStarted, bellCount, bellsDone, activatedBells, blendStarted, blendDone, botanicalCacheClaimed, dungeonSigils, dungeonBossDefeated]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let renderer, scene, camera, frame, observer;
    let disposed = false;
    const keys = new Set();
    const clock = new THREE.Clock();
    const player = new THREE.Group();
    const playerMotion = { leftArm:null, rightArm:null, leftLeg:null, rightLeg:null };
    const colliders = [];
    const walkablePlatforms = [];
    const walkableRamps = [];
    const interactables = [];
    const npcActors = [];
    const smokePuffs = [];
    const amberPickups = [];
    const fireflies = [];
    const bellActors = [];
    let yaw = Math.PI * 0.22, pitch = 0.34, distance = 12;
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
      const canvas=document.createElement("canvas");canvas.width=canvas.height=256;
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
    const addCollider = (x,z,r) => colliders.push({type:"circle",x,z,r});
    const addBoxCollider = (x,z,w,d,rotation=0) => colliders.push({
      type:"box",x,z,halfW:w/2,halfD:d/2,rotation
    });
    const isBlockedAt = (x,z,radius=.55) => colliders.some(collider => {
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
      const g=new THREE.Group(); scene.add(g); g.position.set(x,0,z); g.scale.setScalar(s);
      cylinder(0.18,0.28,2.2,wood,g,0,1.1,0,7);
      for(let i=0;i<5;i++){const a=i*2.4; const c=sphere(1.05,i%2?leaf:leaf2,g,Math.cos(a)*.55,2.45+(i%2)*.3,Math.sin(a)*.55,1); c.scale.set(1.1,.78,1);}
      if(berries) for(let i=0;i<15;i++){const a=i*2.399, rr=.55+(i%3)*.16; sphere(.105,coffeeRed,g,Math.cos(a)*rr,1.9+(i%5)*.22,Math.sin(a)*rr,1);}
      addCollider(x,z,.55*s);
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
      const headPivot=new THREE.Group();g.add(headPivot);headPivot.position.set(0,1.03,.48);
      const head=sphere(.43,coatLight,headPivot,0,.05,.12,2);head.scale.set(1.08,.9,1.05);
      const muzzle=sphere(.27,cream,headPivot,0,-.17,.48,2);muzzle.scale.set(1.2,.7,.85);
      sphere(.09,nose,headPivot,0,-.12,.69,1);
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
      const interaction={id:"wild-umami-44",title:"Umami · Cane da tartufo",text:"Umami, il cane da tartufo di Amargenta, annusa il terreno e sembra aver fiutato qualcosa.",x:g.position.x,z:g.position.z,radius:4.2,action:()=>setDialogue({title:"Umami · Cane da tartufo",text:"Bau! Bau! Umami ha fiutato una traccia sotto le radici. Seguilo nel sottobosco: il suo naso non sbaglia mai."})};
      interactables.push(interaction);
      npcActors.push({group:g,phase:2.4,wild:true,legs,tailPivot,headPivot,ears,bodyPivot,aroma,interaction,homeX:-48,homeZ:30,roamRadius:2.4,walkSpeed:.48});
      return g;
    };
    // Flame #45: creatura ardente che diffonde nell'aria il profumo pungente del peperoncino.
    const makeFlame = () => {
      const g=new THREE.Group();scene.add(g);g.position.set(32,0,-28);
      const ember=mat("#c83b22"), red=mat("#f05a24"), orange=mat("#ff9b32"), gold=mat("#ffd05a"), dark=mat("#54231d"), eye=mat("#fff1d8");
      const bodyPivot=new THREE.Group();g.add(bodyPivot);
      const body=sphere(.52,ember,bodyPivot,0,1.02,0,2);body.scale.set(.88,1.18,.78);
      const belly=sphere(.3,orange,bodyPivot,0,.87,.31,2);belly.scale.set(.9,1.05,.55);
      const headPivot=new THREE.Group();g.add(headPivot);headPivot.position.set(0,1.54,.04);
      const head=sphere(.38,red,headPivot,0,.04,.04,2);head.scale.set(1,.95,.85);
      for(const side of [-1,1]){
        sphere(.07,eye,headPivot,side*.14,.1,.33,1);
        sphere(.035,dark,headPivot,side*.14,.1,.38,1);
      }
      box(.15,.035,.025,dark,headPivot,0,-.12,.35);
      const flameTips=[];
      for(let i=0;i<5;i++){
        const tip=sphere(.19-i*.018,i%2?orange:gold,bodyPivot,(i-2)*.16,1.55+(i%2)*.12,-.02,1);
        tip.scale.set(.48,1.7,.5);tip.rotation.z=(i-2)*-.18;flameTips.push(tip);
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
      const interaction={id:"wild-flame-45",title:"Flame · Aroma di peperoncino",text:"Flame sprigiona un aroma intenso di peperoncino. L'aria intorno a lui pizzica il naso.",x:g.position.x,z:g.position.z,radius:4.2,action:()=>setDialogue({title:"Flame · Aroma di peperoncino",text:"Fsssh! Flame diffonde nell'aria il suo aroma di peperoncino: pungente, caldo e impossibile da ignorare. Meglio non stargli troppo vicino quando si agita!"})};
      interactables.push(interaction);
      npcActors.push({group:g,phase:5.1,wild:true,legs,tailPivot,headPivot,ears:[],bodyPivot,aroma,interaction,homeX:32,homeZ:-28,roamRadius:2.1,walkSpeed:.36,flameTips});
      return g;
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
      const roofMesh=addMesh(new THREE.ConeGeometry(w*.84,1.38,4),roofMaterial,g,0,h+.68,0);
      roofMesh.rotation.y=Math.PI/4;roofMesh.scale.z=d/w;
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
      addBoxCollider(x,z,w+.7,d+.7);
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
    const makeLamp = (x,z) => {cylinder(.07,.11,2.5,darkStone,scene,x,1.25,z,8);box(.55,.55,.55,gold,scene,x,2.55,z);sphere(.22,mat("#ffd58b",.25,{emissive:"#d58c35",emissiveIntensity:1.2}),scene,x,2.55,z,2);addCollider(x,z,.28);};
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

    const addInteraction = (id, title, text, x, z, action=null, radius=3.2) => {
      interactables.push({id,title,text,x,z,action,radius});
    };
    const removeInteraction = (id) => {
      const index = interactables.findIndex(item => item.id === id);
      if (index >= 0) interactables.splice(index, 1);
    };
    const makeNpc = (id,name,job,x,z,shirt,lines,scale=1) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(scale);
      const skinToneById={barista:"#d9ad83",merchant:"#bd8868",archivist:"#e2c29b",guard:"#a96f50",farmer:"#d9a477","town-cook":"#e0b58c","town-carpenter":"#b77c58","town-gardener":"#e4c19b",roaster:"#bd8a68",keeper:"#d7a77d","cafe-host":"#edc9a2"};
      const hairToneById={barista:"#4b2b24",merchant:"#30231f",archivist:"#a7a39a",guard:"#382b29",farmer:"#6b4329","town-cook":"#a94a35","town-carpenter":"#6d4934","town-gardener":"#72523a",roaster:"#39251f",keeper:"#6b527c","cafe-host":"#75452e"};
      const skin=mat(skinToneById[id]||"#d9ad83"), dark=mat(hairToneById[id]||"#302a2a"), trousers=mat(id==="guard"?"#35483f":id==="farmer"?"#596044":"#4b5860"), cloth=mat(shirt), boot=mat("#49372d");
      const trim=mat(id==="guard"?"#d8c18c":id==="archivist"?"#b9c6c4":id==="town-gardener"?"#c6d49b":"#ead4a9");
      // Linguaggio visivo Sognatori: proporzioni chibi, testa ampia, corpo compatto e silhouette leggibile.
      const torso=cylinder(.3,.39,.72,cloth,g,0,.96,0,10);torso.scale.z=.86;
      sphere(.39,skin,g,0,1.57,.015,2);
      const hair=sphere(.405,dark,g,0,1.78,-.035,2);hair.scale.set(1,.55,.95);
      // Ogni abitante ha una silhouette dei capelli distinta.
      if(["barista","cafe-host"].includes(id)){
        const fringe=sphere(.28,dark,g,0,1.82,.29,1);fringe.scale.set(1.35,.48,.62);
        for(let k=-1;k<=1;k++)sphere(.11,dark,g,k*.2,1.92,.22,1);
      }else if(id==="merchant"){
        const hood=sphere(.47,dark,g,0,1.82,-.08,2);hood.scale.set(1.12,.72,1);
        sphere(.2,dark,g,-.34,1.54,.03,1);sphere(.2,dark,g,.34,1.54,.03,1);
      }else if(id==="archivist"){
        sphere(.18,dark,g,-.37,1.66,-.02,1);sphere(.18,dark,g,.37,1.66,-.02,1);
        box(.48,.08,.18,dark,g,0,1.98,-.04);
      }else if(id==="guard"){
        sphere(.17,dark,g,0,1.98,-.02,1);
        for(let k=-1;k<=1;k++)sphere(.09,dark,g,k*.18,1.88,.2,1);
      }else if(id==="farmer"||id==="town-gardener"){
        const bun=sphere(.2,dark,g,0,1.92,-.3,1);bun.scale.set(1,1,.85);
        sphere(.1,dark,g,-.35,1.64,0,1);sphere(.1,dark,g,.35,1.64,0,1);
      }else if(id==="town-cook"){
        sphere(.14,dark,g,-.36,1.62,.02,1);sphere(.14,dark,g,.36,1.62,.02,1);
      }else if(id==="town-carpenter"){
        for(let k=-1;k<=1;k++)sphere(.12,dark,g,k*.2,1.95,.06,1);
      }else if(id==="roaster"){
        sphere(.22,dark,g,0,1.95,-.04,1);
      }else if(id==="keeper"){
        sphere(.2,dark,g,0,1.98,-.04,1);sphere(.12,dark,g,-.34,1.67,.02,1);sphere(.12,dark,g,.34,1.67,.02,1);
      }
      box(.1,.07,.045,mat("#241f20"),g,-.105,1.64,.255);
      box(.1,.07,.045,mat("#241f20"),g,.105,1.64,.255);
      const leftArm=box(.17,.55,.18,cloth,g,-.39,.98,0);leftArm.rotation.z=-.16;
      const rightArm=box(.17,.55,.18,cloth,g,.39,.98,0);rightArm.rotation.z=.16;
      box(.22,.53,.22,trousers,g,-.14,.38,0);
      box(.22,.53,.22,trousers,g,.14,.38,0);
      box(.27,.15,.36,boot,g,-.14,.1,.08);
      box(.24,.13,.34,boot,g,.14,.12,.08);
      if(id.startsWith("muccanza")){
        // Cappuccio viola, giacca maculata e pantofole a muso di Lattelo.
        const purple=mat("#382b42"), creamCow=mat("#f3e5c8"), pinkCow=mat("#e9878b"), cowSpot=mat("#35283d"), antenna=mat("#f5b51b");
        sphere(.43,purple,g,0,1.72,-.03,2).scale.set(1.05,.9,.95);
        for(const side of [-1,1]){
          sphere(.13,pinkCow,g,side*.39,1.7,.02,1).scale.set(.8,1.25,.55);
          sphere(.075,antenna,g,side*.22,.08,.23,1);
          sphere(.13,creamCow,g,side*.14,.08,.19,1).scale.set(1.25,.55,1.5);
          sphere(.09,pinkCow,g,side*.14,.09,.31,1).scale.set(1.1,.75,.55);
          sphere(.025,mat("#17131a"),g,side*.14-.035,.13,.34,1);
          sphere(.025,mat("#17131a"),g,side*.14+.035,.13,.34,1);
          sphere(.11,cowSpot,g,side*.2,.39,.13,1).scale.set(1,.8,.45);
          sphere(.11,cowSpot,g,side*.43,1.04,.1,1).scale.set(.8,1.2,.5);
          sphere(.1,cowSpot,g,side*.15,.41,.12,1).scale.set(1,.8,.5);
        }
        for(const [sx,sy,sz,r] of [[-.19,1.03,.31,.13],[.13,1.08,.31,.16],[.02,.9,.32,.11],[-.2,.39,.12,.12],[.18,.4,.12,.1]]){
          sphere(r,cowSpot,g,sx,sy,sz,1).scale.set(1,.85,.42);
        }
        const curl=new THREE.CatmullRomCurve3([new THREE.Vector3(0,2.08,0),new THREE.Vector3(0,2.28,.02),new THREE.Vector3(.1,2.43,.02),new THREE.Vector3(.02,2.54,.02),new THREE.Vector3(-.06,2.5,.02)]);
        addMesh(new THREE.TubeGeometry(curl,.2,.045,6,false),antenna,g,0,0,0);
      }
      const badge=sphere(.09,gold,g,0,1.12,.3,1);
      badge.scale.set(1,.8,.3);
      if(id==="barista"||id==="roaster"){
        box(.34,.46,.055,mat("#e8d7bd"),g,0,1.12,.405);
        box(.38,.08,.06,mat("#8c5036"),g,0,.91,.42);
      }
      if(id==="merchant"){cylinder(.34,.08,.16,mat("#8b5735"),g,0,1.95,0,10);box(.16,.22,.16,gold,g,0,2.08,0);}
      if(id==="archivist"){box(.32,.42,.09,mat("#8a6749"),g,.48,1.05,.02);box(.25,.32,.035,mat("#e7d2a8"),g,.48,1.05,.08);}
      if(id==="guard"){const spear=cylinder(.035,.05,2.2,gold,g,.62,1.35,0,6);spear.rotation.z=-.08;sphere(.1,stoneLight,g,.62,2.48,0,1);}
      if(id==="farmer"){box(.34,.28,.3,mat("#98633e"),g,-.48,.76,-.05);for(let i=0;i<3;i++)sphere(.09,coffeeRed,g,-.58+i*.1,.94,-.05,1);}
      if(id==="roaster"){cylinder(.28,.28,.12,mat("#4a3028"),g,0,2.03,0,10);box(.4,.08,.18,gold,g,0,2.08,0);}
      // Volti più leggibili: occhi, sopracciglia, naso, sorriso e acconciature individuali.
      const eyeWhite=mat("#fff5df"), pupil=mat("#211b19"), warmSkin=mat("#b97859");
      const iris=mat(({barista:"#6b8f88",merchant:"#8a603b",archivist:"#71879a",guard:"#586b55",farmer:"#78904f","town-cook":"#7b604a","town-carpenter":"#6c7f8a","town-gardener":"#71945e",roaster:"#95633d",keeper:"#8a6a9d","cafe-host":"#6d8e9a"})[id]||"#6b8f88");
      for(const ex of [-.145,.145]){
        sphere(.075,eyeWhite,g,ex,1.62,.34,1);
        sphere(.043,iris,g,ex,1.62,.386,1);
        sphere(.025,pupil,g,ex,1.62,.414,1);
        sphere(.018,mat("#ffffff"),g,ex-.012,1.645,.435,1);
        box(.12,.035,.035,dark,g,ex,1.735,.31);
      }
      sphere(.052,warmSkin,g,0,1.52,.365,1);
      box(.13,.025,.02,mat("#704238"),g,0,1.455,.35);
      // Colletto, bordi delle maniche, cintura e fibbia.
      const collar=addMesh(new THREE.ConeGeometry(.19,.22,4),trim,g,0,1.37,.02);collar.rotation.y=Math.PI/4;
      box(.59,.075,.32,dark,g,0,.72,0);
      box(.13,.14,.055,gold,g,0,.72,.19);
      for(const side of [-1,1]){
        sphere(.105,skin,g,side*.37,.72,.02,1);
        box(.2,.11,.19,trim,g,side*.36,1.28,.015);
      }
      // Firma visiva distinta per ogni mestiere.
      if(id==="barista"||id==="cafe-host"){
        cylinder(.23,.25,.12,mat("#eee0c5"),g,0,1.98,0,12);
        cylinder(.12,.12,.19,mat("#8e4937"),g,0,2.12,0,10);
        box(.42,.42,.045,mat("#eee0c5"),g,0,1.08,.43);
        box(.34,.055,.05,mat("#a94a35"),g,0,1.23,.46);
      }
      if(id==="merchant"){
        const hood=sphere(.34,mat("#8b5735"),g,0,1.91,-.03,1);hood.scale.set(1.05,.5,1);
        box(.32,.07,.07,gold,g,0,1.94,.25);
      }
      if(id==="archivist"){
        box(.78,.12,.72,mat("#4c6574"),g,0,1.94,0);
        box(.86,.1,.78,mat("#b28a54"),g,0,2.02,0);
        box(.1,.23,.08,mat("#b28a54"),g,0,2.14,0);
      }
      if(id==="guard"){
        cylinder(.31,.34,.18,mat("#7e8d78"),g,0,1.98,0,8);
        box(.5,.1,.12,gold,g,0,1.9,.05);
        box(.1,.35,.09,mat("#9a4c37"),g,0,2.18,-.02);
      }
      if(id==="farmer"){
        cylinder(.39,.4,.09,mat("#b58a4c"),g,0,1.91,0,10);
        cylinder(.22,.25,.27,mat("#8b643b"),g,0,2.08,0,10);
        for(let k=0;k<3;k++)sphere(.075,coffeeRed,g,-.16+k*.16,1.91,.2,1);
      }
      if(id==="roaster"){
        cylinder(.31,.33,.1,mat("#4a3028"),g,0,2.02,0,10);
        box(.46,.07,.19,gold,g,0,2.1,0);
        const scarf=box(.5,.13,.12,mat("#e1a34d"),g,0,1.43,.19);scarf.rotation.z=-.08;
        // Occhiali protettivi da torrefazione.
        for(const ex of [-.15,.15]){const lens=sphere(.105,mat("#d7c39a",.75,{transparent:true,opacity:.65}),g,ex,1.63,.39,1);lens.scale.set(1,.72,.3);}
        box(.18,.035,.035,mat("#4a3028"),g,0,1.63,.4);
      }
      if(id==="town-cook"){
        // Cappello alto da cucina e grembiule.
        cylinder(.27,.3,.12,mat("#fff0dc"),g,0,2.02,0,10);
        sphere(.22,mat("#fff0dc"),g,-.12,2.2,0,1);sphere(.22,mat("#fff0dc"),g,.12,2.2,0,1);
        box(.42,.48,.055,mat("#f0e4d1"),g,0,1.02,.38);
        box(.44,.07,.07,mat("#a94a35"),g,0,.8,.41);
      }
      if(id==="town-carpenter"){
        // Bretelle, martello e cappello da lavoro.
        box(.08,.6,.08,gold,g,-.22,1.08,.17);box(.08,.6,.08,gold,g,.22,1.08,.17);
        const hammer=cylinder(.045,.045,.48,mat("#70482f"),g,.55,1.05,.04,6);hammer.rotation.z=-.18;
        box(.25,.12,.14,mat("#77736b"),g,.55,1.3,.04);
        box(.72,.1,.62,mat("#8b6948"),g,0,1.99,0);
      }
      if(id==="town-gardener"){
        // Corona di foglie e borsa di semi.
        for(let k=0;k<5;k++){const leafBit=sphere(.12,mat("#718b59"),g,Math.cos(k*1.25)*.34,1.91+Math.sin(k*1.25)*.1,.02,1);leafBit.scale.set(.7,1.4,.4);leafBit.rotation.z=-Math.cos(k*1.25)*.5;}
        box(.28,.3,.18,mat("#98633e"),g,-.48,.85,-.04);
        for(let k=0;k<3;k++)sphere(.045,mat("#d8b65c"),g,-.48+k*.08,1.03,.05,1);
      }
      if(id==="keeper"){
        // Mantellina e pendente della custode.
        const cape=addMesh(new THREE.ConeGeometry(.48,.72,5),mat("#645071"),g,0,.96,-.16);cape.rotation.x=Math.PI;
        sphere(.13,mat("#a9d7c2"),g,0,1.34,.36,1);
        for(let k=0;k<3;k++)sphere(.07,mat("#a9d7c2"),g,-.2+k*.2,1.88,.2,1);
      }
      npcActors.push({group:g,baseY:0,phase:npcActors.length*1.7,leftArm,rightArm,kind:id});
      addCollider(x,z,.42*scale);
      addInteraction(id,name,lines.join("\n"),x,z,null,3.6);
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
      for(let k=0;k<8;k++){const a=k*Math.PI/4;sphere(.105,petal,g,Math.cos(a)*.13,3.15,-.38+Math.sin(a)*.13,1);}
      sphere(.085,mat("#7a4a2a"),g,0,3.15,-.38,1);
      npcActors.push({group:g,baseY:0,phase:npcActors.length*1.9,leftArm,rightArm});
      addCollider(x,z,.5*scale);
      addInteraction("cardinero-"+name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),name+" · Cardinero",
        "Sono un Cardinero: mi prendo cura dei giardini, delle aiuole e dei fiori di Amargenta. Non combatto: il mio posto è tra le piante! 🌻",
        x,z,()=>setDialogue({title:name+" · Cardinero",text:"Qui ogni fiore merita attenzione. Noi Cardinero curiamo i giardini di Amargenta, annaffiamo le aiuole e proteggiamo le piante.\n\nNon siamo combattenti e non vogliamo lottare: preferiamo far fiorire la città!"}),4.2);
      return g;
    };
    const makeMarketStall = (x,z,accent) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      box(4,.22,2.3,wood,g,0,1.05,0);
      box(.16,2.1,.16,wood,g,-1.8,1.9,-.85);box(.16,2.1,.16,wood,g,1.8,1.9,-.85);
      box(4,.14,2.3,mat(accent),g,0,3,-.1);
      for(let i=0;i<5;i++) box(.72,.09,2.32,i%2?mat("#f1dfbd"):mat(accent),g,-1.44+i*.72,2.93,-.1);
      // Bordo della tenda, frange e sostegni del banco.
      box(4,.12,.16,wood,g,0,2.82,1.08);
      for(let i=0;i<9;i++)box(.12,.22,.12,i%2?mat("#f1dfbd"):mat(accent),g,-1.92+i*.48,2.72,1.08);
      for(let i=0;i<7;i++){const bean=sphere(.13,i%2?gold:wood,g,-1.4+(i%4)*.85,1.32+(i%2)*.12,.35+Math.floor(i/4)*.45,1);bean.scale.set(.8,1.25,.65);}
      addBoxCollider(x,z,4,2.3);
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
    };
    const makeNoren = (x,z,color="#a64c36") => {
      const fabric=mat(color,.95,{side:THREE.DoubleSide});
      for(let i=0;i<3;i++){const panel=box(.52,.88,.07,fabric,scene,x-.54+i*.54,2.35,z);panel.rotation.z=(i-1)*-.035;}
      box(1.8,.12,.14,wood,scene,x,2.85,z);
    };
    const makeBench = (x,z,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      box(2.2,.18,.72,wood,g,0,.72,0);
      for(const px of [-.82,.82]){box(.18,.72,.18,darkStone,g,px,.36,0);box(.16,.68,.16,wood,g,px,.38,-.42);}
      box(2.2,.72,.16,wood,g,0,1.08,-.42);addCollider(x,z,.85);
    };
    const makeFlowerBed = (x,z,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      box(3.2,.42,1.65,wood,g,0,.21,0);box(2.9,.12,1.35,mat("#59452f"),g,0,.48,0);
      for(let i=0;i<13;i++){const px=-1.25+(i%7)*.42,pz=-.4+Math.floor(i/7)*.75;cylinder(.035,.045,.5,leaf,g,px,.72,pz,5);sphere(.17,mat(["#d9a0a2","#e7c57f","#f0e5d0","#a5b68b"][i%4]),g,px,.99,pz,1);}
      addCollider(x,z,1.35);
    };
    const makeWell = (x,z) => {
      cylinder(1.25,1.4,.8,stone,scene,x,.4,z,16);cylinder(1.02,1.02,.12,water,scene,x,.84,z,16);
      for(const px of [-1,1])box(.18,2.4,.18,wood,scene,x+px,1.9,z);
      box(2.45,.18,.22,wood,scene,x,3.1,z);
      const cap=addMesh(new THREE.ConeGeometry(1.6,.8,4),roof,scene,x,3.55,z);cap.rotation.y=Math.PI/4;
      cylinder(.055,.055,1.7,gold,scene,x,1.8,z,8);addCollider(x,z,1.4);
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
      addCollider(x,z,1.35);
    };
    const makeStoneSteps = (x,z,count=5,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      for(let i=0;i<count;i++){box(3.2,.22,.9,stoneLight,g,0,.11+i*.25,i*.88);box(3.35,.1,.12,darkStone,g,0,.25+i*.25,i*.88-.38);}
    };
    const makeWoodPergola = (x,z,rotation=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
      for(const px of [-2.4,2.4])for(const pz of [-1.8,1.8])box(.22,3.5,.22,wood,g,px,1.75,pz);
      for(let i=0;i<7;i++)box(.18,.2,4.2,wood,g,-2.4+i*.8,3.45,0);
      box(5,.2,.22,wood,g,0,3.48,-1.8);box(5,.2,.22,wood,g,0,3.48,1.8);
      for(let i=0;i<12;i++){const a=i*2.399;const vine=sphere(.18,leaf,g,Math.cos(a)*2.1,2.8+(i%3)*.18,Math.sin(a)*1.5,1);vine.scale.set(1.5,.7,1);}
      addCollider(x,z,2.1);
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
      box(2.05,.16,.28,wood,g,0,3.02,0);addCollider(x,z,.3);
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
      scene=new THREE.Scene();scene.background=new THREE.Color("#b7cbd0");scene.fog=new THREE.Fog("#b7cbd0",78,210);
      camera=new THREE.PerspectiveCamera(62,host.clientWidth/host.clientHeight,.1,350);
      renderer=new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
      const compactDevice=window.matchMedia("(max-width: 720px)").matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,compactDevice?1.2:1.7));renderer.setSize(host.clientWidth,host.clientHeight);
      renderer.domElement.style.display="block";renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";renderer.domElement.style.touchAction="none";
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.setClearColor("#b7cbd0",1);
      host.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight("#e8f3ff","#64513b",1.65));
      const sun=new THREE.DirectionalLight("#fff0d6",2.65);sun.position.set(-35,55,25);sun.castShadow=true;sun.shadow.mapSize.set(compactDevice?1024:2048,compactDevice?1024:2048);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;sun.shadow.bias=-.00018;sun.shadow.normalBias=.035;scene.add(sun);
      const warmFill=new THREE.DirectionalLight("#f4c98d",.45);warmFill.position.set(35,18,-30);scene.add(warmFill);
      // Fondovalle stabile: personaggio, NPC e arredi condividono la stessa quota.
      // Il dislivello resta concentrato nelle terrazze, collegate dalle rampe percorribili.
      const terrainGeo=new THREE.PlaneGeometry(150,150,90,90);terrainGeo.rotateX(-Math.PI/2);
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
      // Ingresso ovest e strada principale
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
      makeHouse(-22,-5,7,6,4,0);makeHouse(-12,-13,6,5,3.5,1);makeHouse(-18,13,6,5,3.5,0);
      cylinder(1.7,2,13,stone,scene,-8,6.5,-25,12);const towerRoof=addMesh(new THREE.ConeGeometry(2.2,2.2,4),roof,scene,-8,14,-25);towerRoof.rotation.y=Math.PI/4;
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
      makeHouse(-1,-23,10,7,4.6,1);
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
      makeHouse(12,-13,6,5,3.7,1);makeHouse(15,13,6,5,3.7,0);
      makeNoren(12,-10.35,"#567b68");makeNoren(15,15.65,"#a64c36");
      // Dettagli da villaggio di Hisui: vialetti, lanterne, recinti e alberi in fiore.
      const villagePath=mat("#b89b75");
      for(const [x,z,w,d] of [[0,-13,5,25],[0,13,5,24],[-14,0,20,4],[14,0,20,4],[-24,-8,4,18],[22,8,4,20]]){
        const p=addMesh(new THREE.PlaneGeometry(w,d),villagePath,scene,x,.075,z);p.rotation.x=-Math.PI/2;
      }
      for(const [x,z] of [[-15,-8],[-15,8],[15,-8],[15,8],[-5,-18],[5,18],[25,-14],[25,18]])makeVillageLantern(x,z);
      makeCherryTree(-31,-12,1.15);makeCherryTree(31,12,1.05);makeCherryTree(-31,22,.9);
      makeVillageFence(-28,-2,12,Math.PI/2);makeVillageFence(29,-3,12,Math.PI/2);
      makeVillageFence(-28,15,10,Math.PI/2);makeVillageFence(29,17,10,Math.PI/2);
      makeBench(-20,-15,.2);makeBench(20,18,-.2);
      makeFlowerBed(-24,9,.2);makeFlowerBed(24,-10,-.2);
      makeBanner(-18,26,"#b9824d",Math.PI/2);makeBanner(20,-23,"#9b4936",Math.PI/2);
      makeVillageSign(-19,-3,"Piazza",Math.PI/2);
      makeVillageSign(31,5,"Fiume",Math.PI/2);
      makeVillageSign(-31,29,"Terrazze",Math.PI/2);
      // Distretto produttivo e magazzini a sud-est
      makeRoastery(16,28);makeHouse(7,39,6,5,3.3,0);makeHouse(25,42,5,5,3,1);
      // Muretti, scale e terrazzamenti di collegamento.
      for(let i=0;i<5;i++){makeWall(-12+i*5,22+i*3,9,.9,-.45);for(let s=0;s<4;s++)box(2.1,.32,1.3,stoneLight,scene,-18+i*4+s*1.1,1.1+s*.35,24+i*3);}
      makeStoneSteps(-18,35,7,-.1);makeStoneSteps(-22,-31,6,Math.PI);
      // Giardini agrumati e serre della corporazione del caffè.
      for(let i=0;i<9;i++)makeCitrusTree(-48+(i%3)*7,18+Math.floor(i/3)*7,.85+(i%2)*.12);
      makeGreenhouse(-52,-16);
      makeWoodPergola(-49,4,Math.PI/2);makeFlowerBed(-57,10,.4);makeFlowerBed(-39,10,-.4);
      // Sentiero panoramico, rocce e vegetazione: alternanza di pini e alberi in fiore.
      for(let i=0;i<48;i++){const a=i*2.399,rr=38+(i%5)*4;makeTree(Math.cos(a)*rr,Math.sin(a)*rr,.7+(i%3)*.18,i%4===0);}
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6,rr=31+(i%3)*2;
        makeCherryTree(Math.cos(a)*rr,Math.sin(a)*rr,.72+(i%2)*.16);
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
      // Interni accessibili: laboratorio della torrefazione e caffetteria storica.
      makeInterior(68,68);
      makeCafeInterior(-68,68);
      makeInterior(68,-68,"south");
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
      addInteraction("roastery-door","Torrefazione di Amargenta","La porta conduce al laboratorio della torrefazione.",16,33,()=>{player.position.set(68,0,59.5);setZone("Interno della Torrefazione");},4.2);
      addInteraction("roastery-exit","Uscita della torrefazione","Tornare alla piazza del borgo?",68,62,()=>{player.position.set(16,0,33.5);setZone("Distretto della Torrefazione");},4.2);
      addInteraction("cafe-door","Caffè delle Tre Foglie","Entra nella caffetteria più antica di Amargenta.",-22,-1.5,()=>{player.position.set(-68,0,59.5);setZone("Caffè delle Tre Foglie");},6.4);
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
      makeNpc("barista","Mira","Barista",2,5,"#a94a35",["Benvenuto ad Amargenta!","La fontana segna il cuore della città.","La torrefazione lavora anche dopo il tramonto."]);
      makeNpc("merchant","Nerio","Mercante di fave",-10,12,"#b47b43",["Cerchi qualcosa di speciale?","Le fave d'ambra crescono solo sulle terrazze alte."]);
      makeNpc("archivist","Orma","Archivista", -10,-19,"#526d78",["Ogni chicco conserva una storia.","Nell'archivio trovi le ricette più antiche della fazione Amaro."]);
      makeNpc("guard","Bruno","Guardiano del ponte",18,-7,"#68745a",["Il ponte è sicuro, ma non oltrepassare le gole senza prepararti."]);
      makeNpc("farmer","Lina","Coltivatrice", -24,-31,"#6b8a57",["Queste piante richiedono ombra e acqua fresca.","Raccogliere le bacche mature è un'arte."]);
      // Abitanti di servizio: danno vita alla piazza senza introdurre nuove missioni.
      makeNpc("town-cook","Tessa","Cuoca del borgo",-13,5,"#b65a43",["La zuppa di fave è il piatto preferito dei viaggiatori.","Quando il mercato apre, qui profuma di pane caldo."]);
      makeNpc("town-carpenter","Ruvo","Falegname",14,19,"#8b6948",["Ogni trave di Amargenta è lavorata a mano.","Il legno migliore arriva dai boschi sopra il fiume."]);
      makeNpc("town-gardener","Nemi","Giardiniera",-34,16,"#718b59",["Le aiuole della piazza cambiano colore con le stagioni.","Non calpestare i germogli appena piantati!"]);
      // I Cardinero curano le aiuole e i giardini: sono NPC pacifici, senza statistiche e senza battaglie.
      makeCardinero("Girasole",-14,3,.92);
      makeCardinero("Petalo",14,3,.92);
      makeCardinero("Primula",-55,13,.88);
      makeCardinero("Germoglio",-40,13,.88);
            // I Muccanza: fan del latte speciale di Lattelo, bevanda simbolo dei caffè di Amargenta.
      makeNpc("muccanza-1","Bovino","Fan del Latte", -7,-17,"#f0dfbf",["Il latte di Lattelo è il segreto dei caffè di Amargenta. Lo mischio al caffè ogni mattina!","Non è latte qualunque: io bevo solo quello di Lattelo."]);
      makeNpc("muccanza-2","Panna","Collezionista di Lattelo", 21,-8,"#f0dfbf",["In tutta Amargenta si parla del latte di Lattelo. È perfetto da mischiare col caffè.","Ho perfino una collezione di tazze dedicate a Lattelo!"]);
      makeNpc("muccanza-3","Moka","Fan del Latte", 5,27,"#f0dfbf",["Il caffè senza latte di Lattelo? Per me è impensabile.","Il suo gusto è diventato famoso in tutta la città."]);
      ["muccanza-1","muccanza-2","muccanza-3"].forEach((id,index)=>{
        const interaction=interactables.find(item=>item.id===id);
        if(interaction)interaction.action=()=>{
          setMuccanzaOpponentName(["Bovino · Fan del Latte","Panna · Collezionista","Moka · Fan del Latte"][index]);
          setMuccanzaBattleOpen(true);
        };
      });
      // Lattelo #41: incontro selvatico Natura presso i filari orientali.
      {
        const g=new THREE.Group();scene.add(g);g.position.set(42,0,38);
        const coat=mat("#ffd92e"), blue=mat("#087df0"), cream=mat("#f5d8a1"), muzzle=mat("#f5b99a"), hoof=mat("#75452b"), dark=mat("#171717"), metal=mat("#c8d4df",.35,{metalness:.55});
        const body=sphere(.72,coat,g,0,.86,0,2);body.scale.set(1.05,1.08,.82);
        sphere(.58,coat,g,0,1.72,.12,2);
        sphere(.34,muzzle,g,0,1.53,.62,2).scale.set(1.2,.72,.55);
        sphere(.09,dark,g,-.22,1.83,.61,1);sphere(.09,dark,g,.22,1.83,.61,1);
        sphere(.23,blue,g,0,2.19,.08,2).scale.set(1.1,.48,.75);
        for(const side of [-1,1]){
          const horn=sphere(.18,cream,g,side*.32,2.35,.02,2);horn.scale.set(.65,1.25,.65);
          const ear=sphere(.25,coat,g,side*.58,1.95,0,2);ear.scale.set(1.2,.48,.5);
          sphere(.17,blue,g,side*.35,.48,0,1);
          const leg=sphere(.19,coat,g,side*.34,.25,.05,1);leg.scale.set(.9,1.2,.9);
          sphere(.2,hoof,g,side*.34,.08,.12,1);
        }
        sphere(.18,blue,g,.62,.76,-.4,2);
        const bucket=cylinder(.19,.24,.35,metal,g,-.58,.3,.22,10);
        const handle=new THREE.Mesh(new THREE.TorusGeometry(.2,.025,6,16,Math.PI),metal);handle.position.set(-.58,.52,.22);g.add(handle);
        const interaction={id:"wild-lattelo-41",title:"Lattelo · Natura",text:"Un Lattelo selvatico ti osserva tra i filari. Avvicinati per affrontarlo.",x:42,z:38,radius:4.2,action:()=>setLatteloBattleOpen(true)};
        interactables.push(interaction);
      }
      [[-53,-48],[-43,-54],[-34,-43],[-57,-31],[-28,-55],[34,34],[48,20],[53,-24],[28,52]].forEach(([x,z],i)=>makeZibelle(x,z,i));
      makeUmami();
      makeFlame();
      const linaInteraction=interactables.find(item=>item.id==="farmer");
      if(linaInteraction)linaInteraction.action=()=>{
        if(questCountRef.current>=3){
          if(!questDoneRef.current){questDoneRef.current=true;setQuestDone(true);setToast("Missione completata · Fave d'Ambra");}
          setDialogue({title:"Lina · Coltivatrice",text:"Hai riportato tutte e tre le Fave d'Ambra! Le terrazze ti riconoscono come raccoglitore esperto."});
        } else if(!questActiveRef.current){
          questActiveRef.current=true;setQuestStarted(true);
          setDialogue({title:"Lina · La raccolta delle Fave d'Ambra",text:"Tre fave speciali sono cadute tra le terrazze. Le riconosci dal bagliore dorato. Raccoglile e torna da me."});
        } else setDialogue({title:"Lina · Coltivatrice",text:"Te ne mancano ancora "+(3-questCountRef.current)+". Cerca tra i filari delle terrazze."});
      };
      const ormaInteraction=interactables.find(item=>item.id==="archivist");
      if(ormaInteraction)ormaInteraction.action=()=>{
        if(recipePagesRef.current>=4){
          if(!recipeDoneRef.current){recipeDoneRef.current=true;setRecipeDone(true);setToast("Missione completata · Ricetta Perduta");}
          setDialogue({title:"Orma · Archivista",text:"Hai ricomposto la Ricetta delle Sette Tostature. La custodirò nell'archivio della città."});
        } else if(!recipeStartedRef.current){
          recipeStartedRef.current=true;setRecipeStarted(true);
          setDialogue({title:"Orma · La Ricetta Perduta",text:"Quattro pagine della ricetta originale sono state disperse per Amargenta. Recuperale: la quinta tostatura non deve andare perduta."});
        } else setDialogue({title:"Orma · Archivista",text:"Pagine recuperate: "+recipePagesRef.current+"/4. Cerca nei luoghi antichi, vicino ai ponti e alle botteghe."});
      };
      const brunoInteraction=interactables.find(item=>item.id==="guard");
      if(brunoInteraction)brunoInteraction.action=()=>{
        if(valvesRef.current>=3){
          if(!waterDoneRef.current){waterDoneRef.current=true;setWaterDone(true);setInventory(old=>({...old,waterCrystals:old.waterCrystals+1}));setToast("Missione completata · Condotte Riattivate");}
          setDialogue({title:"Bruno · Guardiano del ponte",text:"L'acqua è tornata a scorrere in tutte le condotte. Amargenta ti deve un favore."});
        } else if(!waterStartedRef.current){
          waterStartedRef.current=true;setWaterStarted(true);
          setDialogue({title:"Bruno · Le Condotte Antiche",text:"Tre valvole sono bloccate lungo il fiume. Riattivale per riportare acqua ai giardini e alle cascate."});
        } else setDialogue({title:"Bruno · Guardiano del ponte",text:"Condotte riattivate: "+valvesRef.current+"/3. Cerca le valvole vicino ai ponti e alla torrefazione."});
      };
      [[-34,-37],[-12,-45],[-4,-28]].forEach((p,i)=>{
        const g=new THREE.Group();scene.add(g);g.position.set(p[0],.8,p[1]);
        if(collectedAmberRef.current.has(i))g.visible=false;
        const core=sphere(.34,gold,g,0,0,0,2);core.scale.set(.78,1.25,.78);
        const ring=addMesh(new THREE.TorusGeometry(.56,.045,6,20),mat("#f4d28d",.3,{emissive:"#c58a42",emissiveIntensity:.7}),g,0,0,0);ring.rotation.x=Math.PI/2;
        g.userData.amberPickup=true;
        amberPickups.push(g);
        if(!collectedAmberRef.current.has(i)) addInteraction("amber-bean-"+i,"Fava d'Ambra","Una fava rara raccolta sulle terrazze.",p[0],p[1],()=>{
          if(!questActiveRef.current){setDialogue({title:"Fava d'Ambra",text:"È una fava rara. Lina potrebbe sapere cosa farne."});return;}
          if(g.userData.collected||collectedAmberRef.current.has(i))return;
          g.userData.collected=true;g.visible=false;removeInteraction("amber-bean-"+i);collectedAmberRef.current.add(i);
          const nextCollected=[...collectedAmberRef.current];setCollectedAmber(nextCollected);
          questCountRef.current+=1;setQuestCount(questCountRef.current);
          setInventory(old=>({...old,amberBeans:old.amberBeans+1}));
          if(questCountRef.current===3)setDialogue({title:"Raccolta completata",text:"Hai trovato tutte e tre le Fave d'Ambra. Torna da Lina per concludere la missione."});
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
          if(!recipeStartedRef.current){setDialogue({title:"Pagina della Ricetta",text:"Una pagina preziosa. Orma saprà cosa farne."});return;}
          if(collectedPagesRef.current.has(i))return;
          collectedPagesRef.current.add(i);removeInteraction("recipe-page-"+i);setCollectedPages([...collectedPagesRef.current]);
          recipePagesRef.current+=1;setRecipePages(recipePagesRef.current);
          setInventory(old=>({...old,recipeFragments:old.recipeFragments+1}));
          page.visible=false;
          setDialogue({title:"Pagina recuperata",text:"Pagine della ricetta: "+recipePagesRef.current+"/4."});
          if(recipePagesRef.current===4)setToast("Hai recuperato tutte le pagine: torna da Orma");
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
          if(!waterStartedRef.current){setDialogue({title:"Valvola bloccata",text:"Bruno al ponte dovrebbe sapere come riattivare le condotte."});return;}
          if(activatedValvesRef.current.has(i))return;
          activatedValvesRef.current.add(i);removeInteraction("water-valve-"+i);setActivatedValves([...activatedValvesRef.current]);
          valvesRef.current+=1;setValves(valvesRef.current);
          wheel.material=mat("#80b99a",.3,{emissive:"#2e7755",emissiveIntensity:.6});handle.material=mat("#80b99a");
          setDialogue({title:"Condotta riattivata",text:"Valvole attivate: "+valvesRef.current+"/3."});
          if(valvesRef.current===3)setToast("Le tre condotte sono di nuovo attive: torna da Bruno");
        },3.1);
      });
      makeNpc("roaster","Tostino","Maestro torrefattore",69,66,"#9c5738",["Qui trasformiamo le fave in aroma.","Ascolta il ritmo dei tamburi di tostatura: ogni fase ha il suo tempo."]);
      const roasterInteraction=interactables.find(item=>item.id==="roaster");
      if(roasterInteraction)roasterInteraction.action=()=>{
        const beans=inventoryRef.current.amberBeans;
        if(beans<3){setDialogue({title:"Tostino · Banco di tostatura",text:"Per preparare una Miscela d'Autore servono 3 Fave d'Ambra.\nIn borsa: "+beans+"."});return;}
        setInventory(old=>({...old,amberBeans:old.amberBeans-3,coffeeBlend:old.coffeeBlend+1}));
        setDialogue({title:"Miscela d'Autore",text:"Tostino ha tostato tre Fave d'Ambra e preparato una Miscela d'Autore. La miscela è stata aggiunta alla tua borsa."});
      };
      const nerioInteraction=interactables.find(item=>item.id==="merchant");
      if(nerioInteraction)nerioInteraction.action=()=>{
        const beans=inventoryRef.current.amberBeans, citrusCount=inventoryRef.current.citrus;
        if(beans<1||citrusCount<1){setDialogue({title:"Nerio · Banco degli scambi",text:"Per preparare una Tisana del Retrogusto servono 1 Fava d'Ambra e 1 agrume.\nIn borsa: "+beans+" fave e "+citrusCount+" agrumi."});return;}
        setInventory(old=>({...old,amberBeans:old.amberBeans-1,citrus:old.citrus-1,herbalTea:old.herbalTea+1}));
        setDialogue({title:"Tisana del Retrogusto",text:"Nerio ha preparato una tisana aromatica usando la tua Fava d'Ambra e il tuo agrume. La tisana è nella tua borsa."});
      };
      makeNpc("keeper","Ada","Custode delle ricette",72,72,"#76618b",["Le ricette si tramandano, non si comprano.","La miscela perfetta nasce dall'equilibrio."]);
      const adaInteraction=interactables.find(item=>item.id==="keeper");
      if(adaInteraction)adaInteraction.action=()=>{
        if(blendDoneRef.current){setDialogue({title:"Ada · Custode delle ricette",text:"La Miscela delle Tre Foglie è custodita nella memoria di Amargenta. Hai dimostrato di saper rispettare ogni ingrediente."});return;}
        const blends=inventoryRef.current.coffeeBlend, teas=inventoryRef.current.herbalTea;
        if(!blendStartedRef.current){
          blendStartedRef.current=true;setBlendStarted(true);
          setDialogue({title:"Ada · La Miscela delle Tre Foglie",text:"Vorrei ricreare la miscela cerimoniale della città. Portami una Miscela d'Autore preparata da Tostino e una Tisana del Retrogusto preparata da Nerio. Solo unendo tostatura e infusione si rivela il suo aroma."});
          return;
        }
        if(blends<1||teas<1){
          setDialogue({title:"Ada · La Miscela delle Tre Foglie",text:"Ci siamo quasi. Servono 1 Miscela d'Autore e 1 Tisana del Retrogusto. Nella tua borsa: "+blends+" miscele e "+teas+" tisane. Tostino usa 3 Fave d'Ambra; Nerio usa 1 Fava e 1 agrume."});
          return;
        }
        setInventory(old=>({...old,coffeeBlend:old.coffeeBlend-1,herbalTea:old.herbalTea-1,relics:old.relics+1}));
        blendDoneRef.current=true;setBlendDone(true);
        setToast("Ricetta segreta completata · Reliquia ottenuta");
        setDialogue({title:"Ada · La Miscela delle Tre Foglie",text:"Tostatura e infusione si sono unite in un aroma antico. Hai ricreato la miscela cerimoniale di Amargenta! Ada ti affida una Reliquia delle Tre Foglie."});
      };
      makeNpc("cafe-host","Elia","Proprietario del Caffè",-68,66,"#8b6849",["Questo locale esiste da prima della grande piazza.","Ogni tavolo ha ascoltato una storia diversa."]);
      const eliaInteraction=interactables.find(item=>item.id==="cafe-host");
      if(eliaInteraction)eliaInteraction.action=()=>{
        if(bellsDoneRef.current){setDialogue({title:"Elia · Le campane del borgo",text:"Le tre campane hanno ritrovato la loro voce. Quando suonano insieme, tutta Amargenta ricorda le sue origini. Tieni questa piccola reliquia: te la sei meritata."});return;}
        if(bellCountRef.current>=3){
          bellsDoneRef.current=true;setBellsDone(true);
          setInventory(old=>({...old,relics:old.relics+1}));
          setToast("Attività completata · Le campane del borgo");
          setDialogue({title:"Elia · Il canto ritrovato",text:"Hai risvegliato tutte e tre le campane! Il loro suono si è propagato tra le terrazze e la piazza. Elia ti affida una Reliquia di Amargenta."});
        } else if(!bellsStartedRef.current){
          bellsStartedRef.current=true;setBellsStarted(true);
          setDialogue({title:"Elia · Le campane del borgo",text:"Un tempo le tre campane annunciavano l'apertura del mercato. Ora sono mute. Raggiungile nella città e interagisci con ognuna: vorrei sentire di nuovo il loro canto."});
        } else setDialogue({title:"Elia · Le campane del borgo",text:"Hai risvegliato "+bellCountRef.current+"/3 campane. Le trovi nella piazza e lungo la strada del mercato."});
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
          if(!bellsStartedRef.current){setDialogue({title:"Campana silenziosa",text:"La campana è ancora bloccata. Elia, al Caffè delle Tre Foglie, conosce la storia delle tre campane."});return;}
          if(activatedBellsRef.current.has(i))return;
          activatedBellsRef.current.add(i);removeInteraction("town-bell-"+i);setActivatedBells([...activatedBellsRef.current]);
          bellCountRef.current+=1;setBellCount(bellCountRef.current);
          body.material=mat("#80b99a",.3,{emissive:"#2e7755",emissiveIntensity:.6});
          setToast("Campana risvegliata · "+bellCountRef.current+"/3");
          if(bellCountRef.current===3)setDialogue({title:"Il canto di Amargenta",text:"La terza campana ha risposto alle altre. Torna da Elia al Caffè delle Tre Foglie."});
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
        setDialogue({title:"Raccolta di Agrumi",text:"Hai raccolto un agrume profumato dai giardini di Amargenta. Nerio potrebbe scambiarlo con te."});
      },4.5);
      // Avatar 3D completo: abiti da esploratore, cappellino, zaino e arti animabili.
      const jacket=mat("#334d61"), jacketLight=mat("#557186"), skinTone=mat("#d7ae89"), pants=mat("#35404a"), leather=mat("#70482f"), redCap=mat("#a8322b"), capShade=mat("#702923"), bootMat=mat("#342b29");
      // Protagonista: silhouette da eroe Sognatori, proporzioni chibi e outfit iconico da esploratore.
      const torso=cylinder(.39,.46,.96,jacket,player,0,1.12,0,12);torso.scale.z=.86;
      sphere(.46,skinTone,player,0,1.92,.015,2);
      // Collo, colletto e dettagli della giacca.
      cylinder(.15,.16,.2,skinTone,player,0,1.68,0,10);
      box(.55,.16,.13,jacketLight,player,0,1.68,.27);
      box(.09,.72,.07,leather,player,0,1.2,.36);
      for(let i=0;i<3;i++)sphere(.035,gold,player,0,1.42+i*.2,.405,1);
      // Cappellino rosso con visiera frontale.
      sphere(.47,redCap,player,0,2.16,-.005,2).scale.set(1,.38,1);
      box(.72,.11,.48,capShade,player,0,2.1,.23);
      // Emblema a stella, marchio distintivo del protagonista.
      const heroEmblem=sphere(.105,gold,player,0,2.2,.385,1);heroEmblem.scale.set(1,.72,.28);
      sphere(.035,mat("#fff0b8"),player,0,2.2,.42,1);
      // Zaino in cuoio, fibbie e tasca esterna.
      box(.68,.82,.34,leather,player,0,1.25,-.36);
      box(.56,.28,.08,mat("#9b7048"),player,0,1.08,-.56);
      box(.58,.09,.08,gold,player,0,1.47,-.56);
      box(.2,.24,.08,wood,player,0,1.28,-.58);
      // Braccia e mani.
      playerMotion.leftArm=box(.2,.68,.22,jacket,player,-.5,1.12,0);
      playerMotion.rightArm=box(.2,.68,.22,jacket,player,.5,1.12,0);
      sphere(.15,skinTone,player,-.5,.76,.02,1);sphere(.15,skinTone,player,.5,.76,.02,1);
      // Guanti e polsini color ambra.
      for(const side of [-1,1])box(.22,.13,.23,gold,player,side*.5,.88,.015);
      // Pantaloni, ginocchia e scarponi.
      playerMotion.leftLeg=box(.25,.62,.27,pants,player,-.2,.38,0);
      playerMotion.rightLeg=box(.25,.62,.27,pants,player,.2,.38,0);
      box(.31,.2,.46,bootMat,player,-.2,.08,.13);
      box(.31,.2,.46,bootMat,player,.2,.08,.13);
      // Fibbia frontale a stella e sciarpa corta: dettagli riconoscibili anche da lontano.
      const beltBuckle=sphere(.105,gold,player,0,.83,.32,1);beltBuckle.scale.set(1,1,.35);
      const scarf=box(.56,.12,.16,mat("#e3a34d"),player,0,1.57,.27);scarf.rotation.z=-.04;
      // Spallacci e fibbie dello zaino.
      for(const side of [-1,1]){const strap=box(.09,.72,.09,mat("#b58a58"),player,side*.28,1.32,.25);strap.rotation.z=side*.2;}
      scene.add(player);player.position.set(-44,0,2);

      // La città usa geometrie procedurali native: nessuna richiesta a modelli GLB mancanti.
      const onKeyDown=e=>{
        if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ShiftLeft","ShiftRight"].includes(e.code)){
          if(!controlsLockedRef.current){keys.add(e.code);e.preventDefault();}
        }
        if(e.code==="KeyE"&&!e.repeat&&!controlsLockedRef.current){
          const p=player.position;
          const target=interactables.map(item=>({...item,distance:Math.hypot(p.x-item.x,p.z-item.z)})).filter(item=>item.distance<item.radius).sort((a,b)=>a.distance-b.distance)[0];
          if(target){if(target.action)target.action();else setDialogue({title:target.title,text:target.text});}
        }
        if(e.code==="Escape"){setDialogue(null);setPanel(null);}
        if(!e.repeat&&e.code==="KeyM")setPanel(old=>old==="map"?null:"map");
        if(!e.repeat&&e.code==="KeyI")setPanel(old=>old==="inventory"?null:"inventory");
        if(!e.repeat&&e.code==="KeyJ")setPanel(old=>old==="journal"?null:"journal");
      };
      const onKeyUp=e=>keys.delete(e.code);
      const onWindowBlur=()=>keys.clear();
      const onPointerDown=e=>{if(e.button!==0)return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);};
      const onPointerUp=()=>{dragging=false;};
      const onPointerMove=e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.0038;pitch=Math.max(.16,Math.min(.82,pitch+dy*.0032));};
      const onWheel=e=>{distance=THREE.MathUtils.clamp(distance+e.deltaY*.009,7,20);};
      renderer.domElement.addEventListener("pointerdown",onPointerDown);
      renderer.domElement.addEventListener("pointerup",onPointerUp);
      renderer.domElement.addEventListener("pointercancel",onPointerUp);
      renderer.domElement.addEventListener("pointermove",onPointerMove);
      renderer.domElement.addEventListener("wheel",onWheel,{passive:true});
      window.addEventListener("keydown",onKeyDown);window.addEventListener("keyup",onKeyUp);window.addEventListener("blur",onWindowBlur);
      const resize=()=>{if(!host.clientWidth||!host.clientHeight)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
      observer=new ResizeObserver(resize);observer.observe(host);
      const animate=()=>{
        if(disposed)return;frame=requestAnimationFrame(animate);
        const dt=Math.min(clock.getDelta(),.04);
        const forward=(keys.has("KeyW")||keys.has("ArrowUp")?1:0)-(keys.has("KeyS")||keys.has("ArrowDown")?1:0)-touchStickRef.current.y;
        const side=(keys.has("KeyD")||keys.has("ArrowRight")?1:0)-(keys.has("KeyA")||keys.has("ArrowLeft")?1:0)+touchStickRef.current.x;
        if(controlsLockedRef.current) keys.clear();
        const activeForward=controlsLockedRef.current?0:forward;
        const activeSide=controlsLockedRef.current?0:side;
        const inputLength=Math.hypot(activeForward,activeSide);
        const sprint=(keys.has("ShiftLeft")||keys.has("ShiftRight"))&&inputLength>.05;
        desiredMovement.set(0,0,0);
        if(inputLength>.05){
          const dir=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
          const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
          desiredMovement.copy(dir).multiplyScalar(activeForward).addScaledVector(right,activeSide).normalize().multiplyScalar(sprint?11.5:7.2);
        }
        // Accelerazione e frenata progressive: niente scatti quando si preme o rilascia il movimento.
        const acceleration= inputLength>.05 ? 8.5 : 11;
        movementVelocity.lerp(desiredMovement,1-Math.exp(-acceleration*dt));
        const move=movementVelocity.clone().multiplyScalar(dt);
        const nx=THREE.MathUtils.clamp(player.position.x+move.x,-72,72);
        const nz=THREE.MathUtils.clamp(player.position.z+move.z,-72,72);
        if(Math.abs(move.x)>.0001&&!isBlockedAt(nx,player.position.z))player.position.x=nx;
        else if(isBlockedAt(nx,player.position.z))movementVelocity.x=0;
        if(Math.abs(move.z)>.0001&&!isBlockedAt(player.position.x,nz))player.position.z=nz;
        else if(isBlockedAt(player.position.x,nz))movementVelocity.z=0;
        player.position.y=getWalkHeight(player.position.x,player.position.z);
        const horizontalSpeed=Math.hypot(movementVelocity.x,movementVelocity.z);
        if(horizontalSpeed>.18){
          const desiredFacing=Math.atan2(movementVelocity.x,movementVelocity.z);
          const angleDelta=Math.atan2(Math.sin(desiredFacing-player.rotation.y),Math.cos(desiredFacing-player.rotation.y));
          player.rotation.y+=angleDelta*(1-Math.exp(-13*dt));
          // La camera segue gradualmente la direzione di marcia, senza strappi.
          const followYaw=player.rotation.y+Math.PI;
          const yawDelta=Math.atan2(Math.sin(followYaw-yaw),Math.cos(followYaw-yaw));
          yaw+=yawDelta*(1-Math.exp(-2.1*dt));
        }
        // Ciclo passi proporzionale alla velocità, con ampiezza che sfuma durante la frenata.
        const gait=clock.elapsedTime*10.5;
        const walkBlend=THREE.MathUtils.clamp(horizontalSpeed/5.2,0,1);
        const armSwing=Math.sin(gait)*.42*walkBlend;
        const legSwing=Math.sin(gait)*.48*walkBlend;
        playerMotion.leftArm.rotation.x=THREE.MathUtils.damp(playerMotion.leftArm.rotation.x,armSwing,14,dt);
        playerMotion.rightArm.rotation.x=THREE.MathUtils.damp(playerMotion.rightArm.rotation.x,-armSwing,14,dt);
        playerMotion.leftLeg.rotation.x=THREE.MathUtils.damp(playerMotion.leftLeg.rotation.x,-legSwing,14,dt);
        playerMotion.rightLeg.rotation.x=THREE.MathUtils.damp(playerMotion.rightLeg.rotation.x,legSwing,14,dt);
        const target=new THREE.Vector3(player.position.x,player.position.y+1.48,player.position.z);
        const cp=new THREE.Vector3(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);
        if(!cameraReady){camera.position.copy(cp);cameraLookTarget.copy(target);cameraReady=true;}
        const cameraEase=1-Math.exp(-7.5*dt);
        camera.position.lerp(cp,cameraEase);
        cameraLookTarget.lerp(target,1-Math.exp(-9*dt));
        camera.lookAt(cameraLookTarget);
        smokePuffs.forEach(puff=>{puff.position.y+=dt*.45;if(puff.position.y>13)puff.position.y=10;});
        const p=player.position;
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
        if(dungeonGuardian.visible)dungeonGuardian.rotation.y=Math.sin(clock.elapsedTime*.8)*.12;
        const nextZone=p.x > 60 && p.z < -55 ? "Cripta delle Miscele" : p.x < -60 && p.z < -30 ? "Giardino del Retrogusto" : p.x < -60 && p.z > 55 ? "Caffè delle Tre Foglie" : p.x > 60 && p.z > 55 ? "Interno della Torrefazione" : p.x>8&&p.z>20?"Distretto della Torrefazione":p.x>17?"Valle delle Cascate":p.x<-10&&p.z<-15?"Borgo superiore":p.x<-10?"Terrazze del Caffè":Math.hypot(p.x,p.z)<13?"Piazza del Chicco":"Ingresso di Amargenta";
        if (nextZone !== zoneRef.current) { zoneRef.current = nextZone; setZone(nextZone); }
        renderer.render(scene,camera);
      };
      animate();
      return ()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener("keydown",onKeyDown);window.removeEventListener("keyup",onKeyUp);window.removeEventListener("blur",onWindowBlur);renderer.domElement.removeEventListener("pointerdown",onPointerDown);renderer.domElement.removeEventListener("pointerup",onPointerUp);renderer.domElement.removeEventListener("pointercancel",onPointerUp);renderer.domElement.removeEventListener("pointermove",onPointerMove);renderer.domElement.removeEventListener("wheel",onWheel);renderer.dispose();scene.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.();});if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement);};
    } catch (error) {
      console.error("Amargenta 3D init error",error);
      setHint("Il browser non ha inizializzato WebGL. Prova ad aggiornare il browser o attivare l'accelerazione hardware.");
    }
    return ()=>{disposed=true;if(frame)cancelAnimationFrame(frame);observer?.disconnect();};
  }, []);

  const activeObjective = !questDone
    ? (questCount >= 3 ? "Torna da Lina per concludere le Fave d'Ambra" : questStarted ? "Raccogli le tre Fave d'Ambra sulle terrazze" : "Parla con Lina nell'agrumeto")
    : !recipeDone
      ? (recipePages >= 4 ? "Torna da Orma per ricomporre la Ricetta Perduta" : recipeStarted ? "Recupera le quattro pagine della ricetta" : "Parla con Orma nell'archivio")
      : !waterDone
        ? (valves >= 3 ? "Torna da Bruno per completare le Condotte Antiche" : waterStarted ? "Riattiva le tre valvole lungo il fiume" : "Parla con Bruno vicino al ponte")
        : bellsStarted && !bellsDone ? (bellCount >= 3 ? "Torna da Elia per ricevere la ricompensa" : "Risveglia le tre campane del borgo")
          : blendStarted && !blendDone ? "Completa la Miscela delle Tre Foglie da Ada"
          : !secretUnlocked ? "Raggiungi la porta della Cripta delle Miscele" : dungeonSigils.length < 3 ? "Risolvi la sequenza dei tre sigilli nella Cripta" : !dungeonBossDefeated ? "Affronta il Guardiano del Retrogusto" : !vaultClaimed ? "Apri lo scrigno nel cuore della Cripta" : "Amargenta è stata completata: esplora liberamente";

  const nearestWaypoint = (points) => points
    .filter(point => !point.done)
    .map(point => ({ ...point, distance: Math.hypot(point.x-playerCoords.x, point.z-playerCoords.z) }))
    .sort((a,b) => a.distance-b.distance)[0] || null;
  let objectiveWaypoint = null;
  if (!questDone) {
    objectiveWaypoint = questCount >= 3
      ? { name:"Lina", x:-24, z:-31 }
      : questStarted
        ? nearestWaypoint([[-34,-37],[-12,-45],[-4,-28]].map(([x,z],i)=>({name:"Fava d'Ambra",x,z,done:collectedAmber.includes(i)})))
        : { name:"Lina", x:-24, z:-31 };
  } else if (!recipeDone) {
    objectiveWaypoint = recipePages >= 4
      ? { name:"Orma", x:-10, z:-19 }
      : recipeStarted
        ? nearestWaypoint([[-35,-16],[28,-30],[-61,62],[48,45]].map(([x,z],i)=>({name:"Pagina della ricetta",x,z,done:collectedPages.includes(i)})))
        : { name:"Orma", x:-10, z:-19 };
  } else if (!waterDone) {
    objectiveWaypoint = valves >= 3
      ? { name:"Bruno", x:18, z:-7 }
      : waterStarted
        ? nearestWaypoint([[19,-18],[37,18],[13,38]].map(([x,z],i)=>({name:"Valvola",x,z,done:activatedValves.includes(i)})))
        : { name:"Bruno", x:18, z:-7 };
  } else if (bellsStarted && !bellsDone) {
    objectiveWaypoint = bellCount >= 3
      ? { name:"Elia", x:-68, z:66 }
      : nearestWaypoint([[-30,4],[-2,18],[16,-2]].map(([x,z],i)=>({name:"Campana",x,z,done:activatedBells.includes(i)})));
  } else if (blendStarted && !blendDone) {
    objectiveWaypoint = { name:"Ada", x:72, z:72 };
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
    <div ref={hostRef} style={{position:"absolute",inset:0}} />
    
    <div className="amargenta-title" style={{position:"absolute",top:18,left:18,display:"flex",alignItems:"center",gap:16,pointerEvents:"none",textShadow:"0 2px 12px #17201d",zIndex:20}}>
      <div className="amargenta-brand" style={{fontSize:22,letterSpacing:3,color:"#f2c94c",fontWeight:1000}}>SOGNATORI</div>
      <div className="amargenta-city" style={{fontSize:30,fontWeight:900,lineHeight:1.15,color:"#ffffff"}}>AMARGENTA</div>
      <button className="amargenta-menu-button" onClick={()=>{setMenuOpen(v=>!v);if(menuOpen)setPanel(null);}} style={{pointerEvents:"auto",cursor:"pointer",whiteSpace:"nowrap"}}>☰ MENU</button>
    </div>
    <div className="amargenta-status amargenta-glass"><span style={{color:"#e9c58d"}}>✦</span><span>{zone}</span><span style={{opacity:.45}}>·</span><span>{worldMoment}</span></div>
    {!menuOpen&&!dialogue&&<div className="amargenta-objective amargenta-glass"><div className="amargenta-objective-label">✧ PROSSIMO OBIETTIVO</div><div className="amargenta-objective-title">{activeObjective}</div>{objectiveWaypoint&&<div className="amargenta-objective-waypoint"><span>⌖ {objectiveWaypoint.name} · {waypointDirection}</span><span>{waypointDistance} m</span></div>}</div>}
    {toast&&<div className="amargenta-toast">{toast}</div>}
    {menuOpen&&<div className="amargenta-menu-panel">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><strong style={{color:"#e9c58d",letterSpacing:1}}>MENU · AMARGENTA</strong><button onClick={()=>{setMenuOpen(false);setPanel(null);}} style={{background:"transparent",color:"#f4ead8",border:0,fontSize:18,cursor:"pointer"}}>×</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:7,marginBottom:12}}>
        {[[null,"⌂","Menu"],["journal","✎","Taccuino"],["map","⌖","Mappa"],["inventory","▣","Borsa"],["zone","☀","Zona e orario"],["team","♙","Squadra"],["controls","⌨","Comandi"],["exit","↩","Torna ad Avventura"]].map(([id,icon,label])=><button key={String(id)} onClick={()=>{if(id==="exit"){setMenuOpen(false);onExit?onExit():window.location.assign("/avventura");}else setPanel(id);}} style={{border:"1px solid #d8bd8b88",borderRadius:9,background:panel===id?"#a87545ee":"#26382bee",color:"#f6ead5",padding:"10px 9px",fontSize:11,fontWeight:800,cursor:"pointer",textAlign:"left"}}>{icon} · {label}</button>)}
      </div>
      {panel===null&&<div style={{padding:"10px 2px",color:"#d7c5a5"}}><strong style={{color:"#e9c58d"}}>Amargenta</strong><div>La città segreta del caffè</div><div style={{marginTop:8}}>Scegli una sezione dal menu per consultare il taccuino, la mappa, la squadra, la borsa o i comandi.</div></div>}
      {panel==="zone"&&<div style={{padding:8,borderRadius:9,background:"#ffffff0b"}}><strong style={{color:"#e9c58d"}}>ZONA ATTUALE</strong><div style={{fontSize:15,fontWeight:800,marginTop:5}}>{zone}</div><div style={{marginTop:5,color:"#d7c5a5"}}>Momento della giornata: {worldMoment}</div><div style={{marginTop:5,color:"#d7c5a5"}}>Posizione · X {playerCoords.x} · Z {playerCoords.z}</div></div>}
      {panel==="controls"&&<div style={{color:"#e6d6bb"}}><strong style={{color:"#e9c58d"}}>ESPLORAZIONE LIBERA</strong><div style={{marginTop:6}}>WASD o frecce: muovi il personaggio</div><div>Shift: corri</div><div>E: interagisci</div><div>Trascina il mouse: ruota la visuale</div><div>Rotella: avvicina o allontana la visuale</div><div style={{marginTop:10,fontWeight:800}}>Comandi touch</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,46px)",gridTemplateRows:"repeat(2,46px)",gap:5,marginTop:7,touchAction:"none"}}>{[{label:"↑",code:"KeyW",col:2,row:1},{label:"←",code:"KeyA",col:1,row:2},{label:"↓",code:"KeyS",col:2,row:2},{label:"→",code:"KeyD",col:3,row:2}].map(c=><button key={c.code} style={{gridColumn:c.col,gridRow:c.row,border:"1px solid #e1c28d88",borderRadius:12,background:"#18221ecc",color:"#f8ecd8",fontSize:22,fontWeight:800,touchAction:"none"}} onPointerDown={e=>{e.preventDefault();window.dispatchEvent(new KeyboardEvent("keydown",{code:c.code}));}} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))} onPointerCancel={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))} onLostPointerCapture={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))} onPointerLeave={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))}>{c.label}</button>)}</div></div>}
      {panel!==null&&panel!=="zone"&&panel!=="controls"&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><strong style={{color:"#e9c58d",letterSpacing:1}}>{panel==="map"?"MAPPA DI AMARGENTA":panel==="journal"?"TACCUINO DI AMARGENTA":panel==="team"?"SQUADRA DI AMARGENTA":"BORSA E RISORSE"}</strong><button onClick={()=>setPanel(null)} style={{background:"transparent",color:"#f4ead8",border:0,fontSize:18,cursor:"pointer"}}>←</button></div>}
      {panel==="map"&&<div>
        <div style={{height:190,position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid #8d7554",background:"linear-gradient(135deg,#405f3c,#718454 48%,#526e48)",backgroundImage:"repeating-linear-gradient(0deg,transparent 0 18px,rgba(255,255,255,.035) 18px 19px),repeating-linear-gradient(90deg,transparent 0 18px,rgba(255,255,255,.035) 18px 19px)"}}>
          <div style={{position:"absolute",left:"68%",top:0,width:9,height:"100%",background:"#397f83",opacity:.9}}/>
          <div style={{position:"absolute",left:"60%",top:"27%",width:"25%",height:7,background:"#b99a71",border:"1px solid #6d563d"}}/>
          <div style={{position:"absolute",left:"60%",top:"50%",width:"25%",height:7,background:"#b99a71",border:"1px solid #6d563d"}}/>
          <div style={{position:"absolute",left:"17%",top:"49%",width:"47%",height:7,background:"#c7a47a",transform:"rotate(-2deg)"}}/>
          <div style={{position:"absolute",left:"48%",top:"50%",width:"23%",height:6,background:"#c7a47a",transform:"rotate(24deg)"}}/>
          {[
            ["Ingresso",-44,2,"#f1d18b"],["Piazza",0,0,"#e5b66b"],["Lina",-24,-31,"#d9d58b"],
            ["Orma",-10,-19,"#c7a5df"],["Bruno",18,-7,"#78b6c1"],["Torrefazione",16,28,"#a64c36"],
            ["Caffè",-22,-1,"#a64c36"],["Campana Ovest",-30,4,"#f0d28a"],["Campana Mercato",-2,18,"#f0d28a"],["Campana Est",16,-2,"#f0d28a"],["Cripta",-70,-43,"#d4b3ff"]
          ].map(([name,x,z,color])=><div key={name} title={name} style={{position:"absolute",left:Math.max(2,Math.min(98,(x+72)/144*100))+"%",top:Math.max(2,Math.min(98,(z+72)/144*100))+"%",width:8,height:8,borderRadius:8,background:color,border:"1px solid #33271f",transform:"translate(-50%,-50%)"}}/>)}
          <div style={{position:"absolute",left:Math.max(3,Math.min(97,(playerCoords.x+72)/144*100))+"%",top:Math.max(3,Math.min(97,(playerCoords.z+72)/144*100))+"%",width:12,height:12,borderRadius:12,background:"#fff",border:"3px solid #a64c36",boxShadow:"0 0 12px #fff",transform:"translate(-50%,-50%)"}}/>
          <div style={{position:"absolute",right:7,top:5,fontSize:9,fontWeight:900,color:"#fff4d8",textShadow:"0 1px 3px #000"}}>N ↑</div>
        </div>
        <div style={{marginTop:8,color:"#d7c5a5"}}>Punti dorati: ingresso e piazza · Simboli: personaggi, botteghe e Cripta · Punto bianco: tu</div>
      </div>}
      {panel==="journal"&&<div>
        {[["Le Fave d'Ambra",questStarted,questCount,3,questDone,"Parla con Lina, raccogli tre fave dorate e riportale alla coltivatrice."],["La Ricetta Perduta",recipeStarted,recipePages,4,recipeDone,"Parla con Orma e recupera quattro pagine disperse in città."],["Le Condotte Antiche",waterStarted,valves,3,waterDone,"Parla con Bruno e riattiva le tre valvole lungo il fiume."],["Le campane del borgo",bellsStarted,bellCount,3,bellsDone,"Parla con Elia al Caffè delle Tre Foglie, risveglia le tre campane e torna da lui."],["La Miscela delle Tre Foglie",blendStarted,blendDone?1:0,1,blendDone,"Parla con Ada, porta una Miscela d'Autore e una Tisana del Retrogusto, poi ricevi la reliquia."]].map(([name,started,count,total,done,desc])=><div key={name} style={{padding:"9px 0",borderBottom:"1px solid #ffffff18"}}><div style={{display:"flex",justifyContent:"space-between"}}><strong>{name}</strong><span style={{color:done?"#9dd4a8":"#e8c58d"}}>{done?"COMPLETATA":started?count+"/"+total:"NON INIZIATA"}</span></div><div style={{color:"#d7c5a5",marginTop:3}}>{desc}</div></div>)}
        <div style={{marginTop:10,color:"#e6c28b"}}>Segreto: {secretUnlocked?"Cripta aperta":"completa tutte e tre le missioni."}</div>
        <div style={{marginTop:6,color:botanicalCacheClaimed?"#9dd4a8":"#d7c5a5"}}>Esplorazione: {botanicalCacheClaimed?"Cassa del Botanico recuperata":"Una traccia delle Tre Foglie è nascosta tra le rocce occidentali."}</div>
        <div style={{marginTop:6,color:dungeonBossDefeated?"#9dd4a8":"#d7c5a5"}}>Cripta: {dungeonBossDefeated?"Guardiano sconfitto · "+(vaultClaimed?"Cuore recuperato":"scrigno da aprire"):dungeonSigils.length+"/3 sigilli risvegliati"}</div>
      </div>}
      {panel==="team"&&<div>
        <div style={{color:"#d7c5a5",marginBottom:10}}>La squadra di Amargenta è indipendente dall'Avventura. Puoi portare fino a 4 Sognatori; solo quelli in squadra partecipano alle lotte.</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><strong style={{color:"#e9c58d"}}>SQUADRA ATTIVA</strong><span style={{color:"#e9c58d"}}>{amargentaPartyIds.length}/4</span></div>
        {amargentaPartyIds.length===0&&<div style={{padding:10,color:"#d7c5a5"}}>La squadra è vuota: sposta qui almeno 2 Sognatori dal box per poter combattere.</div>}
        {AMARGENTA_ROSTER.filter((s)=>amargentaPartyIds.includes(s.id)).map((s)=><div key={s.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:"1px solid #ffffff18"}}><img src={s.img} alt={s.nome} style={{width:42,height:42,objectFit:"contain",background:"#ffffff12",borderRadius:9}}/><div style={{flex:1,minWidth:0}}><strong>{s.nome}</strong><div style={{fontSize:10,color:"#d7c5a5"}}>{s.tipo} · ATK {s.att} · DEF {s.dif} · SPE {s.vel}</div></div><button onClick={()=>moveAmargentaToBox(s.id)} style={{border:"1px solid #d8bd8b88",borderRadius:8,padding:"6px 9px",background:"#49352d",color:"#f6ead5",fontSize:10,fontWeight:800}}>Al box</button></div>)}
        <div style={{marginTop:14,marginBottom:7}}><strong style={{color:"#e9c58d"}}>BOX DI AMARGENTA · {amargentaBoxIds.length}</strong></div>
        {amargentaBoxIds.length===0&&<div style={{color:"#d7c5a5",padding:8}}>Nessun Sognatore nel box.</div>}
        {AMARGENTA_ROSTER.filter((s)=>amargentaBoxIds.includes(s.id)).map((s)=><div key={s.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:"1px solid #ffffff18"}}><img src={s.img} alt={s.nome} style={{width:42,height:42,objectFit:"contain",background:"#ffffff12",borderRadius:9}}/><div style={{flex:1,minWidth:0}}><strong>{s.nome}</strong><div style={{fontSize:10,color:"#d7c5a5"}}>{s.tipo} · ATK {s.att} · DEF {s.dif} · SPE {s.vel}</div></div><button disabled={amargentaPartyIds.length>=4} onClick={()=>moveAmargentaToParty(s.id)} style={{border:"1px solid #d8bd8b88",borderRadius:8,padding:"6px 9px",background:amargentaPartyIds.length>=4?"#454545":"#315b42",color:"#f6ead5",fontSize:10,fontWeight:800,opacity:amargentaPartyIds.length>=4?.5:1}}>In squadra</button></div>)}
      </div>}
      {panel==="inventory"&&<div>
        {[[ "Fave d'Ambra",inventory.amberBeans,"☕"],["Frammenti di ricetta",inventory.recipeFragments,"📜"],["Cristalli d'acqua",inventory.waterCrystals,"💧"],["Agrumi",inventory.citrus,"🍊"],["Miscele d'Autore",inventory.coffeeBlend,"☕"],["Tisane del Retrogusto",inventory.herbalTea,"🍵"],["Reliquie",inventory.relics,"✦"]].map(([name,count,emoji])=><div key={name} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #ffffff18"}}><span>{emoji} {name}</span><strong>{count}</strong></div>)}
        <div style={{marginTop:10,color:"#d7c5a5"}}>Le risorse e i progressi vengono salvati su questo dispositivo.</div>
      </div>}
    </div>}
    {muccanzaBattleOpen&&<AdventureBattle
      opponentName={muccanzaOpponentName}
      isWild={false}
      playerRoster={AMARGENTA_ROSTER.filter((s) => amargentaPartyIds.includes(s.id))}
      enemyTeam={[{...ROSTER.find(s=>s.id==="muccanza"),id:"muccanza-"+muccanzaOpponentName,hp:20,hpMax:20}]}
      onFinish={(result)=>{
        setMuccanzaBattleOpen(false);
        if(result==="win")setToast("Sfida vinta · Muccanza #42");
        else if(result==="loss")setToast("Il fan di Lattelo ti ha battuto · Puoi riprovare");
      }}
    />}
    {latteloBattleOpen&&<AdventureBattle
      opponentName="Lattelo"
      isWild
      playerRoster={AMARGENTA_ROSTER.filter((s) => amargentaBoxIds.includes(s.id))}
      enemyTeam={[{...ROSTER.find(s=>s.id==="lattelo"),hp:20,hpMax:20}]}
      onFinish={(result)=>{
        setLatteloBattleOpen(false);
        if(result==="win")setToast("Lattelo sconfitto · Lattelo #41");
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
        if(result==="win")setToast("Zibelle selvatica sconfitta · Aroma di caffè disperso");
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
    {nearby&&!dialogue&&<button className="amargenta-interact" onClick={()=>{if(nearby.action)nearby.action();else setDialogue({title:nearby.title,text:nearby.text});}} style={{position:"absolute",left:"50%",bottom:30,transform:"translateX(-50%)",padding:"10px 16px",borderRadius:12,background:"#18221eef",border:"1px solid #e1c28d",fontSize:13,boxShadow:"0 8px 30px #0008",whiteSpace:"nowrap",color:"#f5ead7",cursor:"pointer"}}><strong style={{color:"#f0c98d"}}>E · INTERAGISCI</strong><span style={{marginLeft:10}}>{nearby.title}</span></button>}
    <div className="amargenta-joystick" aria-label="Joystick analogico" style={{position:"absolute",left:24,bottom:24,width:132,height:132,borderRadius:"50%",border:"2px solid #e1c28d99",background:"radial-gradient(circle,#314638dd 0%,#18221edb 72%)",boxShadow:"0 8px 28px #0008",touchAction:"none",display:"grid",placeItems:"center",zIndex:12}}
      onPointerDown={e=>{if(controlsLockedRef.current)return;e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-(r.left+r.width/2))/(r.width*.34);const y=(e.clientY-(r.top+r.height/2))/(r.height*.34);const v={x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))};touchStickRef.current=v;setTouchStick(v);}}
      onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-(r.left+r.width/2))/(r.width*.34);const y=(e.clientY-(r.top+r.height/2))/(r.height*.34);const len=Math.hypot(x,y);const scale=len>1?1/len:1;const v={x:x*scale,y:y*scale};touchStickRef.current=v;setTouchStick(v);}}
      onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);touchStickRef.current={x:0,y:0};setTouchStick({x:0,y:0});}}
      onPointerCancel={()=>{touchStickRef.current={x:0,y:0};setTouchStick({x:0,y:0});}}
      onLostPointerCapture={()=>{touchStickRef.current={x:0,y:0};setTouchStick({x:0,y:0});}}>
      <div style={{width:54,height:54,borderRadius:"50%",border:"2px solid #f0d5a5",background:"linear-gradient(145deg,#c49a63,#76543a)",boxShadow:"0 3px 12px #0009",transform:`translate(${touchStick.x*35}px,${touchStick.y*35}px)`,pointerEvents:"none"}}/>
    </div>
    {dialogue&&<div className="amargenta-dialogue" role="dialog" aria-modal="true" style={{position:"absolute",left:"50%",bottom:28,transform:"translateX(-50%)",width:"min(560px,calc(100vw - 32px))",padding:20,borderRadius:20,zIndex:30}}>
      <div style={{fontSize:10,letterSpacing:3,color:"#d8b77d",fontWeight:800}}>AMARGENTA · INCONTRO</div>
      <div style={{fontSize:22,fontWeight:900,margin:"5px 0 10px"}}>{dialogue.title}</div>
      <div style={{whiteSpace:"pre-line",lineHeight:1.7,fontSize:14,color:"#f2e6d3"}}>{dialogue.text}</div>
      <button onClick={()=>setDialogue(null)} style={{marginTop:15,border:"1px solid #d8b77d",borderRadius:9,padding:"8px 18px",background:"#9b6848",color:"#fff3dc",fontWeight:800,cursor:"pointer"}}>Continua · Esc</button>
    </div>}
  </div>;
}
