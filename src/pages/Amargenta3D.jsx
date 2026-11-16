import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Amargenta 3D — ambiente esplorabile sperimentale.
 * La scena è isolata dal renderer Canvas di Avventura: non modifica Arcade/Multiplayer.
 * Gli asset GLB definitivi di Scenario potranno sostituire progressivamente i moduli procedurali.
 */
export default function Amargenta3D({ onExit }) {
  const hostRef = useRef(null);
  const [hint, setHint] = useState("WASD per muoverti · Shift per correre · trascina per ruotare · M mappa · J diario · I borsa");
  const [zone, setZone] = useState("Ingresso di Amargenta");
  const [dialogue, setDialogue] = useState(null);
  const [nearby, setNearby] = useState(null);
  const [savedProgress] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("sognatori:amargenta:save:v2") || "{}"); }
    catch { return {}; }
  });
  const [questStarted, setQuestStarted] = useState(Boolean(savedProgress.questStarted));
  const [questCount, setQuestCount] = useState(Number(savedProgress.questCount) || 0);
  const [questDone, setQuestDone] = useState(Boolean(savedProgress.questDone));
  const [inventory, setInventory] = useState(() => ({
    amberBeans: 0, recipeFragments: 0, waterCrystals: 0, citrus: 0, relics: 0, coffeeBlend: 0, herbalTea: 0,
    ...(savedProgress.inventory || {}),
    coffeeBlend: Number(savedProgress.inventory?.coffeeBlend) || 0,
    herbalTea: Number(savedProgress.inventory?.herbalTea) || 0
  }));
  const [recipeStarted, setRecipeStarted] = useState(Boolean(savedProgress.recipeStarted));
  const [recipePages, setRecipePages] = useState(Number(savedProgress.recipePages) || 0);
  const [recipeDone, setRecipeDone] = useState(Boolean(savedProgress.recipeDone));
  const [waterStarted, setWaterStarted] = useState(Boolean(savedProgress.waterStarted));
  const [valves, setValves] = useState(Number(savedProgress.valves) || 0);
  const [waterDone, setWaterDone] = useState(Boolean(savedProgress.waterDone));
  const [secretUnlocked, setSecretUnlocked] = useState(Boolean(savedProgress.secretUnlocked));
  const [vaultClaimed, setVaultClaimed] = useState(Boolean(savedProgress.vaultClaimed));
  const [citrusHarvested, setCitrusHarvested] = useState(Boolean(savedProgress.citrusHarvested));
  const inventoryRef = useRef(inventory);
  const citrusHarvestedRef = useRef(Boolean(savedProgress.citrusHarvested));
  const [collectedAmber, setCollectedAmber] = useState(Array.isArray(savedProgress.collectedAmber) ? savedProgress.collectedAmber : []);
  const [collectedPages, setCollectedPages] = useState(Array.isArray(savedProgress.collectedPages) ? savedProgress.collectedPages : []);
  const [activatedValves, setActivatedValves] = useState(Array.isArray(savedProgress.activatedValves) ? savedProgress.activatedValves : []);
  const [panel, setPanel] = useState(null);
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
  const zoneRef = useRef("Ingresso di Amargenta");
  const controlsLockedRef = useRef(false);

  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => {
    controlsLockedRef.current = Boolean(dialogue || panel);
  }, [dialogue, panel]);
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
        collectedAmber, collectedPages, activatedValves
      }));
    } catch (error) {
      console.warn("Salvataggio Amargenta non disponibile", error);
    }
  }, [questStarted, questCount, questDone, inventory, recipeStarted, recipePages, recipeDone, waterStarted, valves, waterDone, secretUnlocked, vaultClaimed, citrusHarvested, collectedAmber, collectedPages, activatedValves]);

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
    const raycaster = new THREE.Raycaster();
    let yaw = Math.PI * 0.22, pitch = 0.34, distance = 12;
    let dragging = false, lastX = 0, lastY = 0, lastHudUpdate = 0, currentPeriod = -1;
    const mat = (color, roughness=0.9, extra={}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
    const stone = mat("#9a8871"), stoneLight = mat("#c0ad91"), darkStone = mat("#655747");
    const roof = mat("#704638"), wood = mat("#65442f"), leaf = mat("#365d38"), leaf2 = mat("#587d43");
    const coffeeRed = mat("#a82f27"), water = mat("#397f83",0.22,{metalness:0.08});
    const gold = mat("#bd8750",0.42,{metalness:0.45}), plaster = mat("#c7ad88");
    const groundMat = mat("#536746"), pathMat = mat("#9b896e");
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
      // pietre irregolari applicate alla facciata
      for(let row=0;row<4;row++) for(let col=0;col<Math.floor(w/.55);col++){
        const px=-w/2+.3+col*.55+(row%2)*.12;
        box(.42,.16,.055,row%2?stoneLight:darkStone,g,px,.38+row*.7,d/2+.035);
      }
      const roofMesh=addMesh(new THREE.ConeGeometry(w*.78,.95,4),roof,g,0,h+.42,0);roofMesh.rotation.y=Math.PI/4;roofMesh.scale.z=d/w;
      box(.9,1.7,.13,wood,g,0,.86,d/2+.08);
      for(const wx of [-w*.29,w*.29]){box(.58,.72,.12,darkStone,g,wx,2.05,d/2+.08);box(.38,.5,.04,gold,g,wx,2.05,d/2+.15);}
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
    const makeTerrace = (x,z,w,depth,level) => {
      const y=level*1.45;
      const top=addMesh(new THREE.BoxGeometry(w,.35,depth),groundMat,scene,x,y,z);
      walkablePlatforms.push({x,z,w,d:depth,height:y+.175});
      box(w,.95,.55,stone,scene,x,y-.58,z+depth/2);
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
    };
    const makeLamp = (x,z) => {cylinder(.07,.11,2.5,darkStone,scene,x,1.25,z,8);box(.55,.55,.55,gold,scene,x,2.55,z);sphere(.22,mat("#ffd58b",.25,{emissive:"#d58c35",emissiveIntensity:1.2}),scene,x,2.55,z,2);};
    const makeFountain = (x,z) => {
      cylinder(3.3,3.7,.65,stoneLight,scene,x,.35,z,32);
      cylinder(2.8,3.1,.22,water,scene,x,.78,z,32);
      cylinder(.55,.8,2.1,stone,scene,x,1.75,z,16);
      const bean=sphere(1.05,gold,scene,x,3.45,z,2);bean.scale.set(.72,1.25,.48);bean.rotation.z=-.25;
      const seam=addMesh(new THREE.TorusGeometry(.72,.055,8,32),darkStone,scene,x,3.45,z);seam.scale.set(.7,1.3,.5);seam.rotation.z=-.25;
      for(let i=0;i<8;i++){const a=i*Math.PI/4;const jet=cylinder(.045,.045,1.3,water,scene,x+Math.cos(a)*1.5,1.55,z+Math.sin(a)*1.5,6);jet.rotation.z=Math.cos(a)*-.3;jet.rotation.x=Math.sin(a)*.3;}
    };
    const makeRoastery = (x,z) => {
      makeHouse(x,z,11,8,4.5,1);
      box(2.2,2.5,.18,darkStone,scene,x,1.5,z+4.12);
      cylinder(.7,.85,2.4,gold,scene,x,1.35,z+4.25,16);
      cylinder(.48,.58,1.5,wood,scene,x,1.3,z+4.4,16);
      box(1.1,6.5,1.1,darkStone,scene,x+3.7,7,z-2.2);
      for(let i=0;i<4;i++){const puff=sphere(.45+i*.1,mat("#c8c6bd",1,{transparent:true,opacity:.48}),scene,x+3.7+Math.sin(i*2)*.4,10+i*.65,z-2.2,1);puff.userData.smoke=true;}
    };

    const addInteraction = (id, title, text, x, z, action=null, radius=3.2) => {
      interactables.push({id,title,text,x,z,action,radius});
    };
    const makeNpc = (id,name,job,x,z,shirt,lines,scale=1) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(scale);
      const skin=mat("#d9ad83"), dark=mat("#302a2a"), trousers=mat("#4b5860"), cloth=mat(shirt), boot=mat("#49372d");
      cylinder(.28,.34,.78,cloth,g,0,1.02,0,9);
      sphere(.29,skin,g,0,1.62,0,2);
      sphere(.31,dark,g,0,1.83,-.025,1).scale.set(1,.42,1);
      box(.1,.07,.045,mat("#241f20"),g,-.105,1.64,.255);
      box(.1,.07,.045,mat("#241f20"),g,.105,1.64,.255);
      box(.13,.62,.14,cloth,g,-.36,1.04,0).rotation.z=-.16;
      box(.13,.62,.14,cloth,g,.36,1.04,0).rotation.z=.16;
      box(.19,.62,.2,trousers,g,-.14,.43,0);
      box(.19,.62,.2,trousers,g,.14,.43,0);
      box(.24,.13,.34,boot,g,-.14,.12,.08);
      box(.24,.13,.34,boot,g,.14,.12,.08);
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
      npcActors.push({group:g,baseY:0,phase:npcActors.length*1.7});
      addCollider(x,z,.42*scale);
      addInteraction(id,name,lines.join("\n"),x,z,null,3.6);
      return g;
    };
    const makeMarketStall = (x,z,accent) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      box(4,.22,2.3,wood,g,0,1.05,0);
      box(.16,2.1,.16,wood,g,-1.8,1.9,-.85);box(.16,2.1,.16,wood,g,1.8,1.9,-.85);
      box(4,.14,2.3,mat(accent),g,0,3,-.1);
      for(let i=0;i<5;i++) box(.72,.09,2.32,i%2?mat("#f1dfbd"):mat(accent),g,-1.44+i*.72,2.93,-.1);
      for(let i=0;i<7;i++){const bean=sphere(.13,i%2?gold:wood,g,-1.4+(i%4)*.85,1.32+(i%2)*.12,.35+Math.floor(i/4)*.45,1);bean.scale.set(.8,1.25,.65);}
      addBoxCollider(x,z,4,2.3);
    };
    const makeInterior = (cx,cz,doorSide="north") => {
      const floor=mat("#6e5745"), wall=mat("#b99a72"), beam=mat("#4b3028"), brass=mat("#c08b4e",.35,{metalness:.55});
      box(14,.35,12,floor,scene,cx,.05,cz);
      box(14,4,.35,wall,scene,cx,2,cz-6);
      box(.35,4,12,wall,scene,cx-7,2,cz);
      box(.35,4,12,wall,scene,cx+7,2,cz);
      box(14,4,.35,wall,scene,cx,2,cz+6);
      for(let x=-6;x<=6;x+=3){box(.22,4,.28,beam,scene,cx+x,2,cz-5.72);box(.22,4,.28,beam,scene,cx+x,2,cz+5.72);}
      for(let x=-5;x<=5;x+=5){box(.2,4,11,beam,scene,cx+x,2,cz);}
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
      box(15,.35,13,floor,scene,cx,.05,cz);
      box(15,4,.35,plaster,scene,cx,2,cz-6.5);box(15,4,.35,plaster,scene,cx,2,cz+6.5);
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
      scene=new THREE.Scene();scene.background=new THREE.Color("#a9c4d1");scene.fog=new THREE.Fog("#a9c4d1",65,190);
      camera=new THREE.PerspectiveCamera(62,host.clientWidth/host.clientHeight,.1,350);
      renderer=new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setSize(host.clientWidth,host.clientHeight);
      renderer.domElement.style.display="block";renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";renderer.domElement.style.touchAction="none";
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
      host.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight("#e8f3ff","#64513b",2.0));
      const sun=new THREE.DirectionalLight("#fff0d6",3.2);sun.position.set(-35,55,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;scene.add(sun);
      // Valle montana e terreno ondulato
      const terrainGeo=new THREE.PlaneGeometry(150,150,90,90);terrainGeo.rotateX(-Math.PI/2);
      const pos=terrainGeo.attributes.position;
      for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,Math.sin(x*.075)*.7+Math.cos(z*.06)*.55+Math.sin((x+z)*.035)*.45);}
      terrainGeo.computeVertexNormals();addMesh(terrainGeo,groundMat,scene,0,-.4,0);
      for(let i=0;i<12;i++) makeMountain(-65+(i%4)*42,-68-Math.floor(i/4)*12,12+(i%3)*5,26+(i%4)*9,i);
      // Fiume e gola orientati da nord a sud, a est del borgo
      const river=addMesh(new THREE.PlaneGeometry(12,100,1,1),water,scene,28,.05,2);river.rotation.x=-Math.PI/2;river.rotation.z=.08;
      for(let i=0;i<7;i++){sphere(1.2,stoneLight,scene,22+Math.sin(i*2)*3,.2,-35+i*11,1);}
      makeWaterfall(31,-25,9);makeWaterfall(29,24,7);makeBridge(26,0,15);makeBridge(26,-32,15);
      // Ingresso ovest e strada principale
      const road=addMesh(new THREE.PlaneGeometry(13,75),pathMat,scene,-28,.04,4);road.rotation.x=-Math.PI/2;road.rotation.z=Math.PI/2;
      makeWall(-38,-8,15,2.2,Math.PI/2);makeWall(-38,12,15,2.2,Math.PI/2);
      const gate=addMesh(new THREE.TorusGeometry(2.5,.48,8,24,Math.PI),stoneLight,scene,-38,3,2);gate.rotation.z=Math.PI;
      // Terrazze a gradoni sul lato nord e sud
      for(let l=0;l<3;l++){makeTerrace(-22,-36-l*12,25,9,l);makeTerrace(-18,39+l*10,28,9,l);}
      // Rampe percorribili che collegano fisicamente i tre livelli delle terrazze.
      makeWalkRamp([-22,-40.5],[-22,-48],6,.175,1.625);
      makeWalkRamp([-22,-52.5],[-22,-60],6,1.625,3.075);
      makeWalkRamp([-18,43.5],[-18,49],6,.175,1.625);
      makeWalkRamp([-18,53.5],[-18,59],6,1.625,3.075);
      // Borgo superiore: torre, case, vicoli e piazzetta alta
      makeHouse(-22,-5,7,6,4,0);makeHouse(-12,-13,6,5,3.5,1);makeHouse(-18,13,6,5,3.5,0);
      cylinder(1.7,2,13,stone,scene,-8,6.5,-25,12);const towerRoof=addMesh(new THREE.ConeGeometry(2.2,2.2,4),roof,scene,-8,14,-25);towerRoof.rotation.y=Math.PI/4;
      for(let y=0;y<3;y++)box(.6,1.2,.1,darkStone,scene,-8,3+y*3,-23.35);
      // Piazza centrale e fontana monumentale
      const plaza=addMesh(new THREE.CylinderGeometry(13,13,.4,48),pathMat,scene,0,.05,0);plaza.scale.z=.72;
      makeFountain(0,.5);
      for(let i=0;i<10;i++){const a=i*Math.PI*2/10;makeLamp(Math.cos(a)*10,Math.sin(a)*7.5);}
      makeHouse(12,-13,6,5,3.7,1);makeHouse(15,13,6,5,3.7,0);
      // Distretto produttivo e magazzini a sud-est
      makeRoastery(16,28);makeHouse(7,39,6,5,3.3,0);makeHouse(25,42,5,5,3,1);
      // Muretti, scale e terrazzamenti di collegamento
      for(let i=0;i<5;i++){makeWall(-12+i*5,22+i*3,9,.9,-.45);for(let s=0;s<4;s++)box(2.1,.32,1.3,stoneLight,scene,-18+i*4+s*1.1,1.1+s*.35,24+i*3);}
      // Giardini agrumati e serre della corporazione del caffè.
      for(let i=0;i<9;i++)makeCitrusTree(-48+(i%3)*7,18+Math.floor(i/3)*7,.85+(i%2)*.12);
      makeGreenhouse(-52,-16);
      // Sentiero panoramico, rocce e vegetazione
      for(let i=0;i<48;i++){const a=i*2.399,rr=38+(i%5)*4;makeTree(Math.cos(a)*rr,Math.sin(a)*rr,.7+(i%3)*.18,i%4===0);}
      for(let i=0;i<24;i++){const x=-35+(i%6)*8,z=-4+Math.floor(i/6)*9;sphere(1.2,stoneLight,scene,x,.25,z,1);}
      // Arredi, carri, sacchi e casse
      for(let i=0;i<8;i++){const x=-8+(i%4)*4,z=17+Math.floor(i/4)*3;box(1.2,.8,.9,wood,scene,x,.4,z);box(1.25,.12,.95,gold,scene,x,.85,z);}
      for(let i=0;i<5;i++){cylinder(.38,.42,.9,wood,scene,20+i*1.2, .45,35,10);}
      // Mercato, botteghe vive e arredi della piazza.
      makeMarketStall(-8,9,"#a64c36");makeMarketStall(8,10,"#d0a05d");makeMarketStall(-17,19,"#567b68");
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
      const vaultChest=box(1.8,1.15,1.1,wood,scene,68,.62,-68);
      box(1.9,.2,1.16,gold,scene,68,1.27,-68);
      const vaultGem=sphere(.28,mat("#d4b3ff",.2,{emissive:"#8d59d4",emissiveIntensity:.8}),scene,68,1.65,-68,2);
      const interiorDoor=box(2.4,2.8,.2,wood,scene,68,1.45,62);
      box(1.5,2.2,.08,gold,scene,68,1.4,61.86);
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
      addInteraction("vault-chest","Scrigno delle Miscele","Un antico scrigno custodisce il cuore della città.",68,-68,()=>{
        if(!secretUnlockedRef.current){setDialogue({title:"Scrigno sigillato",text:"Il sigillo della cripta non è ancora stato spezzato."});return;}
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
      const amberPickups=[];
      [[-34,-37],[-12,-45],[-4,-28]].forEach((p,i)=>{
        const g=new THREE.Group();scene.add(g);g.position.set(p[0],.8,p[1]);
        if(collectedAmberRef.current.has(i))g.visible=false;
        const core=sphere(.34,gold,g,0,0,0,2);core.scale.set(.78,1.25,.78);
        const ring=addMesh(new THREE.TorusGeometry(.56,.045,6,20),mat("#f4d28d",.3,{emissive:"#c58a42",emissiveIntensity:.7}),g,0,0,0);ring.rotation.x=Math.PI/2;
        amberPickups.push(g);g.userData.amberPickup=true;
        addInteraction("amber-bean-"+i,"Fava d'Ambra","Una fava rara raccolta sulle terrazze.",p[0],p[1],()=>{
          if(!questActiveRef.current){setDialogue({title:"Fava d'Ambra",text:"È una fava rara. Lina potrebbe sapere cosa farne."});return;}
          if(g.userData.collected||collectedAmberRef.current.has(i))return;
          g.userData.collected=true;g.visible=false;collectedAmberRef.current.add(i);
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
        addInteraction("recipe-page-"+i,"Pagina della Ricetta Perduta","Una pagina antica della Ricetta delle Sette Tostature.",p[0],p[1],()=>{
          if(!recipeStartedRef.current){setDialogue({title:"Pagina della Ricetta",text:"Una pagina preziosa. Orma saprà cosa farne."});return;}
          if(collectedPagesRef.current.has(i))return;
          collectedPagesRef.current.add(i);setCollectedPages([...collectedPagesRef.current]);
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
        if(activatedValvesRef.current.has(i)){wheel.material=mat("#80b99a",.3,{emissive:"#2e7755",emissiveIntensity:.6});handle.material=mat("#80b99a");}
        addInteraction("water-valve-"+i,"Valvola delle Condotte","Una valvola antica collegata alle cascate.",p[0],p[1],()=>{
          if(!waterStartedRef.current){setDialogue({title:"Valvola bloccata",text:"Bruno al ponte dovrebbe sapere come riattivare le condotte."});return;}
          if(activatedValvesRef.current.has(i))return;
          activatedValvesRef.current.add(i);setActivatedValves([...activatedValvesRef.current]);
          valvesRef.current+=1;setValves(valvesRef.current);
          wheel.material=mat("#80b99a",.3,{emissive:"#2e7755",emissiveIntensity:.6});handle.material=mat("#80b99a");
          setDialogue({title:"Condotta riattivata",text:"Valvole attivate: "+valvesRef.current+"/3."});
          if(valvesRef.current===3)setToast("Le tre condotte sono di nuovo attive: torna da Bruno");
        },3.1);
      });
      makeNpc("roaster","Tostino","Maestro torrefattore",69,66,"#9c5738",["Qui trasformiamo le fave in aroma.","Ascolta il ritmo dei tamburi di tostatura: ogni fase ha il suo tempo."]);
      const roasterInteraction=interactables.find(item=>item.id==="roaster");
      if(roasterInteraction)roasterInteraction.action=()=>{
        if(inventoryRef.current.amberBeans<3){setDialogue({title:"Tostino · Banco di tostatura",text:"Per preparare una Miscela d'Autore servono tre Fave d'Ambra. Al momento non ne hai abbastanza."});return;}
        setInventory(old=>({...old,amberBeans:old.amberBeans-3,coffeeBlend:old.coffeeBlend+1}));
        setDialogue({title:"Miscela d'Autore",text:"Tostino ha tostato tre Fave d'Ambra e preparato una Miscela d'Autore. La miscela è stata aggiunta alla tua borsa."});
      };
      const nerioInteraction=interactables.find(item=>item.id==="merchant");
      if(nerioInteraction)nerioInteraction.action=()=>{
        if(inventoryRef.current.amberBeans<1||inventoryRef.current.citrus<1){setDialogue({title:"Nerio · Banco degli scambi",text:"Ti propongo uno scambio: una Fava d'Ambra e un agrume per una Tisana del Retrogusto."});return;}
        setInventory(old=>({...old,amberBeans:old.amberBeans-1,citrus:old.citrus-1,herbalTea:old.herbalTea+1}));
        setDialogue({title:"Tisana del Retrogusto",text:"Nerio ha preparato una tisana aromatica usando la tua Fava d'Ambra e il tuo agrume. La tisana è nella tua borsa."});
      };
      makeNpc("keeper","Ada","Custode delle ricette",72,72,"#76618b",["Le ricette si tramandano, non si comprano.","La miscela perfetta nasce dall'equilibrio."]);
      makeNpc("cafe-host","Elia","Proprietario del Caffè",-68,66,"#8b6849",["Questo locale esiste da prima della grande piazza.","Ogni tavolo ha ascoltato una storia diversa."]);
      addInteraction("citrus-harvest","Agrumi maturi","Un piccolo raccolto profumato.",-48,18,()=>{
        if(citrusHarvestedRef.current){setDialogue({title:"Agrumeto",text:"Hai già raccolto gli agrumi maturi di questo filare."});return;}
        citrusHarvestedRef.current=true;setCitrusHarvested(true);
        setInventory(old=>({...old,citrus:old.citrus+1}));
        setDialogue({title:"Raccolta di Agrumi",text:"Hai raccolto un agrume profumato dai giardini di Amargenta. Nerio potrebbe scambiarlo con te."});
      },4.5);
      // Avatar 3D completo: abiti da esploratore, cappellino, zaino e arti animabili.
      const jacket=mat("#334d61"), jacketLight=mat("#557186"), skinTone=mat("#d7ae89"), pants=mat("#35404a"), leather=mat("#70482f"), redCap=mat("#a8322b"), capShade=mat("#702923"), bootMat=mat("#342b29");
      const torso=cylinder(.37,.48,1.12,jacket,player,0,1.18,0,12);torso.scale.z=.82;
      sphere(.38,skinTone,player,0,2.02,.015,2);
      // Collo, colletto e dettagli della giacca.
      cylinder(.13,.15,.22,skinTone,player,0,1.78,0,10);
      box(.55,.16,.13,jacketLight,player,0,1.68,.27);
      box(.09,.72,.07,leather,player,0,1.2,.36);
      for(let i=0;i<3;i++)sphere(.035,gold,player,0,1.42+i*.2,.405,1);
      // Cappellino rosso con visiera frontale.
      sphere(.4,redCap,player,0,2.24,-.005,2).scale.set(1,.38,1);
      box(.64,.09,.42,capShade,player,0,2.18,.22);
      box(.28,.09,.12,mat("#e8d7bd"),player,0,2.28,-.02);
      // Zaino in cuoio, fibbie e tasca esterna.
      box(.68,.82,.34,leather,player,0,1.25,-.36);
      box(.56,.28,.08,mat("#9b7048"),player,0,1.08,-.56);
      box(.58,.09,.08,gold,player,0,1.47,-.56);
      box(.2,.24,.08,wood,player,0,1.28,-.58);
      // Braccia e mani.
      playerMotion.leftArm=box(.18,.76,.2,jacket,player,-.48,1.2,0);
      playerMotion.rightArm=box(.18,.76,.2,jacket,player,.48,1.2,0);
      sphere(.13,skinTone,player,-.48,.78,.02,1);sphere(.13,skinTone,player,.48,.78,.02,1);
      // Pantaloni, ginocchia e scarponi.
      playerMotion.leftLeg=box(.23,.72,.25,pants,player,-.19,.43,0);
      playerMotion.rightLeg=box(.23,.72,.25,pants,player,.19,.43,0);
      box(.28,.18,.43,bootMat,player,-.19,.09,.11);
      box(.28,.18,.43,bootMat,player,.19,.09,.11);
      // Spallacci e fibbie dello zaino.
      for(const side of [-1,1]){const strap=box(.09,.72,.09,mat("#b58a58"),player,side*.28,1.32,.25);strap.rotation.z=side*.2;}
      scene.add(player);player.position.set(-44,0,2);

      // I modelli GLB sostituiscono gradualmente i moduli procedurali quando vengono aggiunti.
      const gltfLoader = new GLTFLoader();
      [
        { url: "/assets/3d/amargenta/house-stone.glb", position: [-22, 0, -5] },
        { url: "/assets/3d/amargenta/roastery.glb", position: [16, 0, 28] },
        { url: "/assets/3d/amargenta/coffee-fountain.glb", position: [0, 0, .5] },
        { url: "/assets/3d/amargenta/stone-bridge.glb", position: [26, 0, 0] },
        { url: "/assets/3d/amargenta/coffee-tree.glb", position: [-30, 0, -36] }
      ].forEach(asset => gltfLoader.load(asset.url, gltf => {
        if (disposed) return;
        gltf.scene.position.set(...asset.position);
        gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        scene.add(gltf.scene);
      }, undefined, () => {}));
      const groundRay=new THREE.Raycaster();
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
      const onPointerDown=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);};
      const onPointerUp=()=>dragging=false;
      const onPointerMove=e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.005;pitch=Math.max(.12,Math.min(.9,pitch+dy*.004));};
      const onWheel=e=>{distance=Math.max(6,Math.min(22,distance+e.deltaY*.012));};
      renderer.domElement.addEventListener("pointerdown",onPointerDown);
      renderer.domElement.addEventListener("pointerup",onPointerUp);
      renderer.domElement.addEventListener("pointercancel",onPointerUp);
      renderer.domElement.addEventListener("pointermove",onPointerMove);
      renderer.domElement.addEventListener("wheel",onWheel,{passive:true});
      window.addEventListener("keydown",onKeyDown);window.addEventListener("keyup",onKeyUp);
      const resize=()=>{if(!host.clientWidth||!host.clientHeight)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
      observer=new ResizeObserver(resize);observer.observe(host);
      const animate=()=>{
        if(disposed)return;frame=requestAnimationFrame(animate);
        const dt=Math.min(clock.getDelta(),.04);
        const forward=(keys.has("KeyW")||keys.has("ArrowUp")?1:0)-(keys.has("KeyS")||keys.has("ArrowDown")?1:0);
        const side=(keys.has("KeyD")||keys.has("ArrowRight")?1:0)-(keys.has("KeyA")||keys.has("ArrowLeft")?1:0);
        if(controlsLockedRef.current) keys.clear();
        const activeForward=controlsLockedRef.current?0:forward;
        const activeSide=controlsLockedRef.current?0:side;
        if(activeForward||activeSide){const dir=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));const sprint=keys.has("ShiftLeft")||keys.has("ShiftRight");const move=dir.multiplyScalar(activeForward).add(right.multiplyScalar(activeSide)).normalize().multiplyScalar((sprint?12:8)*dt);const nx=THREE.MathUtils.clamp(player.position.x+move.x,-72,72),nz=THREE.MathUtils.clamp(player.position.z+move.z,-72,72);
          // Collisione separata sugli assi: il personaggio scivola lungo gli ostacoli invece di bloccarsi in diagonale.
          if(!isBlockedAt(nx,player.position.z)) player.position.x=nx;
          if(!isBlockedAt(player.position.x,nz)) player.position.z=nz;
          player.position.y=getWalkHeight(player.position.x,player.position.z);
          player.rotation.y=Math.atan2(move.x,move.z);
          const stride=clock.elapsedTime*10;playerMotion.leftArm.rotation.x=Math.sin(stride)*.38;playerMotion.rightArm.rotation.x=-Math.sin(stride)*.38;playerMotion.leftLeg.rotation.x=-Math.sin(stride)*.42;playerMotion.rightLeg.rotation.x=Math.sin(stride)*.42;
        } else {player.position.y=getWalkHeight(player.position.x,player.position.z);playerMotion.leftArm.rotation.x*=.82;playerMotion.rightArm.rotation.x*=.82;playerMotion.leftLeg.rotation.x*=.82;playerMotion.rightLeg.rotation.x*=.82;}
        const target=new THREE.Vector3(player.position.x,1.5,player.position.z);
        const cp=new THREE.Vector3(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);
        camera.position.lerp(cp,.12);camera.lookAt(target);
        scene.traverse(o=>{if(o.userData.smoke){o.position.y+=dt*.45;if(o.position.y>13)o.position.y=10;}});
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
          actor.group.position.y=Math.sin(clock.elapsedTime*1.7+actor.phase)*.045;
          const nearPlayer=Math.hypot(p.x-actor.group.position.x,p.z-actor.group.position.z)<8;
          actor.group.rotation.y=nearPlayer?Math.atan2(p.x-actor.group.position.x,p.z-actor.group.position.z):Math.sin(clock.elapsedTime*.45+actor.phase)*.08;
        });
        scene.traverse(o=>{if(o.userData.amberPickup){o.rotation.y+=dt*.65;}});
        const nextZone=p.x > 60 && p.z < -55 ? "Cripta delle Miscele" : p.x < -60 && p.z > 55 ? "Caffè delle Tre Foglie" : p.x > 60 && p.z > 55 ? "Interno della Torrefazione" : p.x>8&&p.z>20?"Distretto della Torrefazione":p.x>17?"Valle delle Cascate":p.x<-10&&p.z<-15?"Borgo superiore":p.x<-10?"Terrazze del Caffè":Math.hypot(p.x,p.z)<13?"Piazza del Chicco":"Ingresso di Amargenta";
        if (nextZone !== zoneRef.current) { zoneRef.current = nextZone; setZone(nextZone); }
        renderer.render(scene,camera);
      };
      animate();
      return ()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener("keydown",onKeyDown);window.removeEventListener("keyup",onKeyUp);renderer.domElement.removeEventListener("pointerdown",onPointerDown);renderer.domElement.removeEventListener("pointerup",onPointerUp);renderer.domElement.removeEventListener("pointercancel",onPointerUp);renderer.domElement.removeEventListener("pointermove",onPointerMove);renderer.domElement.removeEventListener("wheel",onWheel);renderer.dispose();scene.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.();});if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement);};
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
        : !secretUnlocked ? "Raggiungi la porta della Cripta delle Miscele" : !vaultClaimed ? "Apri lo scrigno nella Cripta" : "Amargenta è stata completata: esplora liberamente";

  return <div style={{position:"fixed",inset:0,background:"#18221e",color:"#f4ead8",fontFamily:"Inter,system-ui,sans-serif",overflow:"hidden"}}>
    <style>{`
      @media (max-width: 720px) {
        .amargenta-title { top: 10px !important; left: 12px !important; }
        .amargenta-title strong { font-size: 23px !important; }
        .amargenta-toolbar { top: 66px !important; left: 12px !important; right: 12px !important; transform: none !important; justify-content: flex-start !important; flex-wrap: wrap; }
        .amargenta-hud { top: 112px !important; right: 12px !important; width: min(205px, calc(100vw - 24px)) !important; }
        .amargenta-hint { left: 12px !important; right: 12px !important; bottom: 12px !important; max-width: none !important; }
        .amargenta-controls { right: 12px !important; bottom: 88px !important; }
      }
    `}</style>
    <div ref={hostRef} style={{position:"absolute",inset:0}} />
    <div className="amargenta-title" style={{position:"absolute",top:18,left:18,pointerEvents:"none",textShadow:"0 2px 12px #17201d"}}>
      <div style={{fontSize:11,letterSpacing:4,color:"#e2bd85",fontWeight:800}}>S O G N A T O R I · AVVENTURA 3D</div>
      <div style={{fontSize:30,fontWeight:900,lineHeight:1.15}}>AMARGENTA</div>
      <div style={{fontSize:12,opacity:.8}}>La città segreta del caffè</div>
    </div>
    <div style={{position:"absolute",top:20,right:20,padding:"10px 14px",border:"1px solid #d8c19a66",borderRadius:12,background:"#18221eaa",backdropFilter:"blur(8px)",fontSize:12}}>
      <div style={{fontSize:9,letterSpacing:2,color:"#d9b37c"}}>ZONA · {worldMoment.toUpperCase()}</div><strong>{zone}</strong>
    </div>
    <div className="amargenta-hud" style={{position:"absolute",top:92,right:20,width:238,padding:13,border:"1px solid #d8b77d88",borderRadius:12,background:"#18221edb",fontSize:11,lineHeight:1.5}}>
      <div style={{fontSize:9,letterSpacing:2,color:"#e5bd7d",fontWeight:900}}>DIARIO DI AMARGENTA</div>
      <div style={{marginTop:5,display:"flex",justifyContent:"space-between"}}><strong>Fave d'Ambra</strong><span>{questDone?"✓":questCount+"/3"}</span></div>
      <div style={{height:4,marginTop:4,borderRadius:8,background:"#49382b",overflow:"hidden"}}><div style={{height:"100%",width:(questCount/3*100)+"%",background:"#e1ae5e"}}/></div>
      <div style={{marginTop:7,display:"flex",justifyContent:"space-between"}}><strong>Ricetta Perduta</strong><span>{recipeDone?"✓":recipePages+"/4"}</span></div>
      <div style={{height:4,marginTop:4,borderRadius:8,background:"#49382b",overflow:"hidden"}}><div style={{height:"100%",width:(recipePages/4*100)+"%",background:"#c7a5df"}}/></div>
      <div style={{marginTop:7,display:"flex",justifyContent:"space-between"}}><strong>Condotte Antiche</strong><span>{waterDone?"✓":valves+"/3"}</span></div>
      <div style={{height:4,marginTop:4,borderRadius:8,background:"#49382b",overflow:"hidden"}}><div style={{height:"100%",width:(valves/3*100)+"%",background:"#78b6c1"}}/></div>
      <div style={{marginTop:9,paddingTop:8,borderTop:"1px solid #ffffff20"}}>
        <div style={{fontSize:9,letterSpacing:2,color:"#e5bd7d",fontWeight:900}}>OBIETTIVO ATTUALE</div>
        <div style={{marginTop:4,color:"#f4e5cb",fontSize:10,lineHeight:1.45}}>{activeObjective}</div>
      </div>
      <div style={{marginTop:8,color:"#d9bd91",fontSize:10}}>X {playerCoords.x} · Z {playerCoords.z}</div>
    </div>
    <div className="amargenta-toolbar" style={{position:"absolute",top:18,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6,pointerEvents:"auto"}}>
      {[["map","M","Mappa"],["journal","J","Diario"],["inventory","I","Borsa"]].map(([id,key,label])=><button key={id} onClick={()=>setPanel(old=>old===id?null:id)} style={{border:"1px solid #d8bd8b88",borderRadius:9,background:panel===id?"#a87545ee":"#18221edb",color:"#f6ead5",padding:"8px 11px",fontSize:11,fontWeight:800,cursor:"pointer"}}>{key} · {label}</button>)}
    </div>
    {toast&&<div style={{position:"absolute",top:66,left:"50%",transform:"translateX(-50%)",padding:"9px 16px",borderRadius:10,background:"#26382bee",border:"1px solid #e0c18b",color:"#f6e8cf",fontSize:12,fontWeight:800}}>{toast}</div>}
    {panel&&<div style={{position:"absolute",left:18,top:82,width:"min(330px,calc(100vw - 36px))",maxHeight:"60vh",overflowY:"auto",padding:16,borderRadius:15,background:"#17231fee",border:"1px solid #d8b77d99",boxShadow:"0 16px 45px #0009",fontSize:12,lineHeight:1.65}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><strong style={{color:"#e9c58d",letterSpacing:1}}>{panel==="map"?"MAPPA DI AMARGENTA":panel==="journal"?"DIARIO DEL VIAGGIATORE":"BORSA E RISORSE"}</strong><button onClick={()=>setPanel(null)} style={{background:"transparent",color:"#f4ead8",border:0,fontSize:18,cursor:"pointer"}}>×</button></div>
      {panel==="map"&&<div>
        <div style={{height:190,position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid #8d7554",background:"linear-gradient(145deg,#526c49 0%,#718354 45%,#345d5c 46%,#31504b 55%,#6b7850 56%,#455d3e 100%)"}}>
          <div style={{position:"absolute",left:"48%",top:0,width:10,height:"100%",background:"#397f83",opacity:.8}}/>
          <div style={{position:"absolute",left:"14%",top:"45%",width:"72%",height:12,background:"#b79a71",transform:"rotate(-12deg)"}}/>
          {[[50,50],[22,27],[78,72],[28,75],[70,20]].map(([x,y],i)=><div key={i} style={{position:"absolute",left:x+"%",top:y+"%",width:8,height:8,borderRadius:8,background:i===0?"#f1d18b":"#e5b66b",border:"1px solid #33271f"}}/>)}
          <div style={{position:"absolute",left:Math.max(3,Math.min(97,(playerCoords.x+72)/144*100))+"%",top:Math.max(3,Math.min(97,(playerCoords.z+72)/144*100))+"%",width:12,height:12,borderRadius:12,background:"#fff",border:"3px solid #a64c36",boxShadow:"0 0 12px #fff"}}/>
        </div>
        <div style={{marginTop:8,color:"#d7c5a5"}}>Piazza del Chicco · Terrazze · Torrefazione · Caffè delle Tre Foglie · Cripta segreta</div>
      </div>}
      {panel==="journal"&&<div>
        {[["Le Fave d'Ambra",questStarted,questCount,3,questDone,"Parla con Lina, raccogli tre fave dorate e riportale alla coltivatrice."],["La Ricetta Perduta",recipeStarted,recipePages,4,recipeDone,"Parla con Orma e recupera quattro pagine disperse in città."],["Le Condotte Antiche",waterStarted,valves,3,waterDone,"Parla con Bruno e riattiva le tre valvole lungo il fiume."]].map(([name,started,count,total,done,desc])=><div key={name} style={{padding:"9px 0",borderBottom:"1px solid #ffffff18"}}><div style={{display:"flex",justifyContent:"space-between"}}><strong>{name}</strong><span style={{color:done?"#9dd4a8":"#e8c58d"}}>{done?"COMPLETATA":started?count+"/"+total:"NON INIZIATA"}</span></div><div style={{color:"#d7c5a5",marginTop:3}}>{desc}</div></div>)}
        <div style={{marginTop:10,color:"#e6c28b"}}>Segreto: {secretUnlocked?"Cripta aperta":"completa tutte e tre le missioni."}</div>
      </div>}
      {panel==="inventory"&&<div>
        {[[ "Fave d'Ambra",inventory.amberBeans,"☕"],["Frammenti di ricetta",inventory.recipeFragments,"📜"],["Cristalli d'acqua",inventory.waterCrystals,"💧"],["Agrumi",inventory.citrus,"🍊"],["Miscele d'Autore",inventory.coffeeBlend,"☕"],["Tisane del Retrogusto",inventory.herbalTea,"🍵"],["Reliquie",inventory.relics,"✦"]].map(([name,count,emoji])=><div key={name} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #ffffff18"}}><span>{emoji} {name}</span><strong>{count}</strong></div>)}
        <div style={{marginTop:10,color:"#d7c5a5"}}>Le risorse e i progressi vengono salvati su questo dispositivo.</div>
      </div>}
    </div>}
    <div className="amargenta-hint" style={{position:"absolute",left:18,bottom:18,maxWidth:420,padding:"11px 14px",borderRadius:12,background:"#18221ecc",border:"1px solid #d8c19a55",fontSize:12,lineHeight:1.6}}>
      <strong style={{color:"#e7c28c"}}>ESPLORAZIONE LIBERA</strong><br/>{hint}<br/><span style={{opacity:.65}}>Amargenta · esplorazione, missioni, crafting e segreti</span>
    </div>
    {nearby&&!dialogue&&<button onClick={()=>{if(nearby.action)nearby.action();else setDialogue({title:nearby.title,text:nearby.text});}} style={{position:"absolute",left:"50%",bottom:30,transform:"translateX(-50%)",padding:"10px 16px",borderRadius:12,background:"#18221eef",border:"1px solid #e1c28d",fontSize:13,boxShadow:"0 8px 30px #0008",whiteSpace:"nowrap",color:"#f5ead7",cursor:"pointer"}}><strong style={{color:"#f0c98d"}}>E · INTERAGISCI</strong><span style={{marginLeft:10}}>{nearby.title}</span></button>}
    {dialogue&&<div role="dialog" aria-modal="true" style={{position:"absolute",left:"50%",bottom:28,transform:"translateX(-50%)",width:"min(560px,calc(100vw - 32px))",padding:20,borderRadius:18,background:"linear-gradient(145deg,#30231ff5,#17241ff5)",border:"1px solid #d7b77d",boxShadow:"0 18px 60px #0009"}}>
      <div style={{fontSize:10,letterSpacing:3,color:"#d8b77d",fontWeight:800}}>AMARGENTA · INCONTRO</div>
      <div style={{fontSize:22,fontWeight:900,margin:"5px 0 10px"}}>{dialogue.title}</div>
      <div style={{whiteSpace:"pre-line",lineHeight:1.7,fontSize:14,color:"#f2e6d3"}}>{dialogue.text}</div>
      <button onClick={()=>setDialogue(null)} style={{marginTop:15,border:"1px solid #d8b77d",borderRadius:9,padding:"8px 18px",background:"#9b6848",color:"#fff3dc",fontWeight:800,cursor:"pointer"}}>Continua · Esc</button>
    </div>}
    <div className="amargenta-controls" aria-label="Comandi touch" style={{position:"absolute",right:22,bottom:86,display:"grid",gridTemplateColumns:"repeat(3,46px)",gridTemplateRows:"repeat(2,46px)",gap:5,touchAction:"none"}}>
      {[{label:"↑",code:"KeyW",col:2,row:1},{label:"←",code:"KeyA",col:1,row:2},{label:"↓",code:"KeyS",col:2,row:2},{label:"→",code:"KeyD",col:3,row:2}].map(c=><button key={c.code} style={{gridColumn:c.col,gridRow:c.row,border:"1px solid #e1c28d88",borderRadius:12,background:"#18221ecc",color:"#f8ecd8",fontSize:22,fontWeight:800,touchAction:"none"}} onPointerDown={e=>{e.preventDefault();window.dispatchEvent(new KeyboardEvent("keydown",{code:c.code}));}} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))} onPointerLeave={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))}>{c.label}</button>)}
    </div>
    <button onClick={()=>onExit ? onExit() : window.location.assign("/avventura")} style={{position:"absolute",right:20,bottom:20,border:"1px solid #e1c28d",borderRadius:10,background:"#2d3b31dd",color:"#f8ecd8",padding:"11px 16px",fontWeight:700,cursor:"pointer"}}>← Torna ad Avventura</button>
  </div>;
}
