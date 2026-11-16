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
  const [hint, setHint] = useState("WASD per muoverti · trascina per ruotare la visuale · rotella per zoom");
  const [zone, setZone] = useState("Ingresso di Amargenta");
  const [dialogue, setDialogue] = useState(null);
  const [nearby, setNearby] = useState(null);
  const [questStarted, setQuestStarted] = useState(false);
  const [questCount, setQuestCount] = useState(0);
  const [questDone, setQuestDone] = useState(false);
  const questActiveRef = useRef(false);
  const questCountRef = useRef(0);
  const zoneRef = useRef("Ingresso di Amargenta");

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
    const interactables = [];
    const npcActors = [];
    const raycaster = new THREE.Raycaster();
    let yaw = Math.PI * 0.22, pitch = 0.34, distance = 12;
    let dragging = false, lastX = 0, lastY = 0;
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
    const addCollider = (x,z,r) => colliders.push({x,z,r});
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
      addCollider(x,z,Math.max(w,d)*.58);
      return g;
    };
    const makeWall = (x,z,length,height=1.2,rot=0) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rot;
      box(length,height,.65,stone,g,0,height/2,0);
      for(let i=0;i<Math.floor(length/.8);i++) box(.7,.12,.72,stoneLight,g,-length/2+.4+i*.8,height+.04,0);
      addCollider(x,z,length*.52);
    };
    const makeBridge = (x,z,length=12) => {
      const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
      box(length,.65,3.3,stone,g,0,2,0);
      for(let i=0;i<Math.floor(length/.8);i++){box(.7,.8,.35,stoneLight,g,-length/2+.4+i*.8,2.55,-1.65);box(.7,.8,.35,stoneLight,g,-length/2+.4+i*.8,2.55,1.65);}
      const arch=addMesh(new THREE.TorusGeometry(length*.32,.34,8,32,Math.PI),darkStone,g,0,.7,0);arch.rotation.z=Math.PI;
      addCollider(x,z,length*.5);
    };
    const makeTerrace = (x,z,w,depth,level) => {
      const y=level*1.45;
      const top=addMesh(new THREE.BoxGeometry(w,.35,depth),groundMat,scene,x,y,z);
      box(w,.95,.55,stone,scene,x,y-.58,z+depth/2);
      for(let i=0;i<Math.floor(w/2.2);i++) for(let j=0;j<2;j++) makeCoffeePlant(x-w/2+1+i*2.1,z-depth/2+1+j*2.2,.8);
      return top;
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
      npcActors.push({group:g,baseY:0,phase:npcActors.length*1.7});
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
      addCollider(x,z,1.5);
    };
    const makeInterior = (cx,cz) => {
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
      addCollider(cx-7,cz,1);addCollider(cx+7,cz,1);
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
      makeWaterfall(31,-25,9);makeWaterfall(29,24,7);makeBridge(26,0,15);makeBridge(26,-32,11);
      // Ingresso ovest e strada principale
      const road=addMesh(new THREE.PlaneGeometry(13,75),pathMat,scene,-28,.04,4);road.rotation.x=-Math.PI/2;road.rotation.z=Math.PI/2;
      makeWall(-38,-8,15,2.2,Math.PI/2);makeWall(-38,12,15,2.2,Math.PI/2);
      const gate=addMesh(new THREE.TorusGeometry(2.5,.48,8,24,Math.PI),stoneLight,scene,-38,3,2);gate.rotation.z=Math.PI;
      // Terrazze a gradoni sul lato nord e sud
      for(let l=0;l<3;l++){makeTerrace(-22,-36-l*12,25,9,l);makeTerrace(-18,39+l*10,28,9,l);}
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
      const interiorDoor=box(2.4,2.8,.2,wood,scene,68,1.45,62);
      box(1.5,2.2,.08,gold,scene,68,1.4,61.86);
      addInteraction("roastery-door","Torrefazione di Amargenta","La porta conduce al laboratorio della torrefazione.",16,33,()=>{player.position.set(68,0,59.5);setZone("Interno della Torrefazione");},4.2);
      addInteraction("roastery-exit","Uscita della torrefazione","Tornare alla piazza del borgo?",68,62,()=>{player.position.set(16,0,33.5);setZone("Distretto della Torrefazione");},4.2);
      addInteraction("cafe-door","Caffè delle Tre Foglie","Entra nella caffetteria più antica di Amargenta.",-22,-1.5,()=>{player.position.set(-68,0,59.5);setZone("Caffè delle Tre Foglie");},6.4);
      addInteraction("cafe-exit","Uscita del Caffè delle Tre Foglie","Tornare alle terrazze della città?",-68,62,()=>{player.position.set(-22,1,-.5);setZone("Piazza del Chicco");},4.2);
      // Personaggi con dialoghi contestuali.
      makeNpc("barista","Mira","Barista",2,5,"#a94a35",["Benvenuto ad Amargenta!","La fontana segna il cuore della città.","La torrefazione lavora anche dopo il tramonto."]);
      makeNpc("merchant","Nerio","Mercante di fave",-10,12,"#b47b43",["Cerchi qualcosa di speciale?","Le fave d'ambra crescono solo sulle terrazze alte."]);
      makeNpc("archivist","Orma","Archivista", -10,-19,"#526d78",["Ogni chicco conserva una storia.","Nell'archivio trovi le ricette più antiche della fazione Amaro."]);
      makeNpc("guard","Bruno","Guardiano del ponte",23,-7,"#68745a",["Il ponte è sicuro, ma non oltrepassare le gole senza prepararti."]);
      makeNpc("farmer","Lina","Coltivatrice", -24,-31,"#6b8a57",["Queste piante richiedono ombra e acqua fresca.","Raccogliere le bacche mature è un'arte."]);
      const linaInteraction=interactables.find(item=>item.id==="farmer");
      if(linaInteraction)linaInteraction.action=()=>{
        if(questCountRef.current>=3){setQuestDone(true);setDialogue({title:"Lina · Coltivatrice",text:"Hai riportato tutte e tre le Fave d'Ambra! La terrazza ti riconosce come raccoglitore esperto."});}
        else if(!questActiveRef.current){questActiveRef.current=true;setQuestStarted(true);setDialogue({title:"Lina · La raccolta delle Fave d'Ambra",text:"Tre fave speciali sono cadute tra le terrazze. Le riconosci dal bagliore dorato. Raccoglile e torna da me."});}
        else setDialogue({title:"Lina · Coltivatrice",text:"Te ne mancano ancora "+(3-questCountRef.current)+". Cerca tra i filari delle terrazze."});
      };
      const amberPickups=[];
      [[-34,-37],[-12,-45],[-4,-28]].forEach((p,i)=>{
        const g=new THREE.Group();scene.add(g);g.position.set(p[0],.8,p[1]);
        const core=sphere(.34,gold,g,0,0,0,2);core.scale.set(.78,1.25,.78);
        const ring=addMesh(new THREE.TorusGeometry(.56,.045,6,20),mat("#f4d28d",.3,{emissive:"#c58a42",emissiveIntensity:.7}),g,0,0,0);ring.rotation.x=Math.PI/2;
        amberPickups.push(g);g.userData.amberPickup=true;
        addInteraction("amber-bean-"+i,"Fava d'Ambra","Una fava rara raccolta sulle terrazze.",p[0],p[1],()=>{
          if(!questActiveRef.current){setDialogue({title:"Fava d'Ambra",text:"È una fava rara. Lina potrebbe sapere cosa farne."});return;}
          if(g.userData.collected)return;
          g.userData.collected=true;g.visible=false;questCountRef.current+=1;setQuestCount(questCountRef.current);
          if(questCountRef.current===3)setDialogue({title:"Raccolta completata",text:"Hai trovato tutte e tre le Fave d'Ambra. Torna da Lina per concludere la missione."});
          else setDialogue({title:"Fava d'Ambra raccolta",text:"Fave trovate: "+questCountRef.current+"/3."});
        },2.8);
      });
      makeNpc("roaster","Tostino","Maestro torrefattore",69,66,"#9c5738",["Qui trasformiamo le fave in aroma.","Ascolta il ritmo dei tamburi di tostatura: ogni fase ha il suo tempo."]);
      makeNpc("keeper","Ada","Custode delle ricette",72,72,"#76618b",["Le ricette si tramandano, non si comprano.","La miscela perfetta nasce dall'equilibrio."]);
      makeNpc("cafe-host","Elia","Proprietario del Caffè",-68,66,"#8b6849",["Questo locale esiste da prima della grande piazza.","Ogni tavolo ha ascoltato una storia diversa."]);
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
        if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)){keys.add(e.code);e.preventDefault();}
        if(e.code==="KeyE"&&!e.repeat){
          const p=player.position;
          const target=interactables.map(item=>({...item,distance:Math.hypot(p.x-item.x,p.z-item.z)})).filter(item=>item.distance<item.radius).sort((a,b)=>a.distance-b.distance)[0];
          if(target){if(target.action)target.action();else setDialogue({title:target.title,text:target.text});}
        }
        if(e.code==="Escape")setDialogue(null);
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
        if(forward||side){const dir=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));const move=dir.multiplyScalar(forward).add(right.multiplyScalar(side)).normalize().multiplyScalar(8*dt);const nx=player.position.x+move.x,nz=player.position.z+move.z;
          const blocked=colliders.some(c=>Math.hypot(nx-c.x,nz-c.z)<c.r+.55);
          if(!blocked){player.position.x=THREE.MathUtils.clamp(nx,-82,82);player.position.z=THREE.MathUtils.clamp(nz,-82,82);}
          player.rotation.y=Math.atan2(move.x,move.z);
          const stride=clock.elapsedTime*10;playerMotion.leftArm.rotation.x=Math.sin(stride)*.38;playerMotion.rightArm.rotation.x=-Math.sin(stride)*.38;playerMotion.leftLeg.rotation.x=-Math.sin(stride)*.42;playerMotion.rightLeg.rotation.x=Math.sin(stride)*.42;
        } else {playerMotion.leftArm.rotation.x*=.82;playerMotion.rightArm.rotation.x*=.82;playerMotion.leftLeg.rotation.x*=.82;playerMotion.rightLeg.rotation.x*=.82;}
        const target=new THREE.Vector3(player.position.x,1.5,player.position.z);
        const cp=new THREE.Vector3(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);
        camera.position.lerp(cp,.12);camera.lookAt(target);
        scene.traverse(o=>{if(o.userData.smoke){o.position.y+=dt*.45;if(o.position.y>13)o.position.y=10;}});
        const p=player.position;
        const closest=interactables.map(item=>({...item,distance:Math.hypot(p.x-item.x,p.z-item.z)})).filter(item=>item.distance<item.radius).sort((a,b)=>a.distance-b.distance)[0];
        setNearby(old=>old?.id===closest?.id?old:(closest||null));
        npcActors.forEach((actor,i)=>{actor.group.position.y=Math.sin(clock.elapsedTime*1.7+actor.phase)*.045;actor.group.rotation.y=Math.sin(clock.elapsedTime*.45+actor.phase)*.08;});
        scene.traverse(o=>{if(o.userData.amberPickup){o.rotation.y+=dt*.65;}});
        const nextZone=p.x < -60 && p.z > 55 ? "Caffè delle Tre Foglie" : p.x > 60 && p.z > 55 ? "Interno della Torrefazione" : p.x>8&&p.z>20?"Distretto della Torrefazione":p.x>17?"Valle delle Cascate":p.x<-10&&p.z<-15?"Borgo superiore":p.x<-10?"Terrazze del Caffè":Math.hypot(p.x,p.z)<13?"Piazza del Chicco":"Ingresso di Amargenta";
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

  return <div style={{position:"fixed",inset:0,background:"#18221e",color:"#f4ead8",fontFamily:"Inter,system-ui,sans-serif",overflow:"hidden"}}>
    <div ref={hostRef} style={{position:"absolute",inset:0}} />
    <div style={{position:"absolute",top:18,left:18,pointerEvents:"none",textShadow:"0 2px 12px #17201d"}}>
      <div style={{fontSize:11,letterSpacing:4,color:"#e2bd85",fontWeight:800}}>S O G N A T O R I · AVVENTURA 3D</div>
      <div style={{fontSize:30,fontWeight:900,lineHeight:1.15}}>AMARGENTA</div>
      <div style={{fontSize:12,opacity:.8}}>La città segreta del caffè</div>
    </div>
    <div style={{position:"absolute",top:20,right:20,padding:"10px 14px",border:"1px solid #d8c19a66",borderRadius:12,background:"#18221eaa",backdropFilter:"blur(8px)",fontSize:12}}>
      <div style={{fontSize:9,letterSpacing:2,color:"#d9b37c"}}>ZONA</div><strong>{zone}</strong>
    </div>
    {questStarted&&!questDone&&<div style={{position:"absolute",top:100,right:20,width:230,padding:13,border:"1px solid #d8b77d88",borderRadius:12,background:"#18221edb",fontSize:12,lineHeight:1.55}}>
      <div style={{fontSize:9,letterSpacing:2,color:"#e5bd7d",fontWeight:900}}>MISSIONE · AMARGENTA</div>
      <strong>Le Fave d'Ambra</strong>
      <div style={{marginTop:5,color:"#f0dfc2"}}>Raccogli le fave rare sulle terrazze.</div>
      <div style={{marginTop:8,fontWeight:900,color:"#eac27f"}}>{questCount} / 3 raccolte</div>
      <div style={{height:5,marginTop:5,borderRadius:8,background:"#49382b",overflow:"hidden"}}><div style={{height:"100%",width:(questCount/3*100)+"%",background:"#e1ae5e",transition:"width .2s"}}/></div>
    </div>}
    {questDone&&<div style={{position:"absolute",top:100,right:20,padding:"10px 14px",border:"1px solid #d8b77d",borderRadius:12,background:"#26382beF",fontSize:12}}>✓ Missione completata · Fave d'Ambra</div>}
    <div style={{position:"absolute",left:18,bottom:18,maxWidth:420,padding:"11px 14px",borderRadius:12,background:"#18221ecc",border:"1px solid #d8c19a55",fontSize:12,lineHeight:1.6}}>
      <strong style={{color:"#e7c28c"}}>ESPLORAZIONE LIBERA</strong><br/>{hint}<br/><span style={{opacity:.65}}>Prototipo 3D isolato · modelli GLB Scenario da integrare</span>
    </div>
    {nearby&&!dialogue&&<div style={{position:"absolute",left:"50%",bottom:30,transform:"translateX(-50%)",padding:"10px 16px",borderRadius:12,background:"#18221eef",border:"1px solid #e1c28d",fontSize:13,boxShadow:"0 8px 30px #0008",whiteSpace:"nowrap"}}><strong style={{color:"#f0c98d"}}>E · INTERAGISCI</strong><span style={{marginLeft:10}}>{nearby.title}</span></div>}
    {dialogue&&<div role="dialog" aria-modal="true" style={{position:"absolute",left:"50%",bottom:28,transform:"translateX(-50%)",width:"min(560px,calc(100vw - 32px))",padding:20,borderRadius:18,background:"linear-gradient(145deg,#30231ff5,#17241ff5)",border:"1px solid #d7b77d",boxShadow:"0 18px 60px #0009"}}>
      <div style={{fontSize:10,letterSpacing:3,color:"#d8b77d",fontWeight:800}}>AMARGENTA · INCONTRO</div>
      <div style={{fontSize:22,fontWeight:900,margin:"5px 0 10px"}}>{dialogue.title}</div>
      <div style={{whiteSpace:"pre-line",lineHeight:1.7,fontSize:14,color:"#f2e6d3"}}>{dialogue.text}</div>
      <button onClick={()=>setDialogue(null)} style={{marginTop:15,border:"1px solid #d8b77d",borderRadius:9,padding:"8px 18px",background:"#9b6848",color:"#fff3dc",fontWeight:800,cursor:"pointer"}}>Continua · Esc</button>
    </div>}
    <div aria-label="Comandi touch" style={{position:"absolute",right:22,bottom:86,display:"grid",gridTemplateColumns:"repeat(3,46px)",gridTemplateRows:"repeat(2,46px)",gap:5,touchAction:"none"}}>
      {[{label:"↑",code:"KeyW",col:2,row:1},{label:"←",code:"KeyA",col:1,row:2},{label:"↓",code:"KeyS",col:2,row:2},{label:"→",code:"KeyD",col:3,row:2}].map(c=><button key={c.code} style={{gridColumn:c.col,gridRow:c.row,border:"1px solid #e1c28d88",borderRadius:12,background:"#18221ecc",color:"#f8ecd8",fontSize:22,fontWeight:800,touchAction:"none"}} onPointerDown={e=>{e.preventDefault();window.dispatchEvent(new KeyboardEvent("keydown",{code:c.code}));}} onPointerUp={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))} onPointerLeave={()=>window.dispatchEvent(new KeyboardEvent("keyup",{code:c.code}))}>{c.label}</button>)}
    </div>
    <button onClick={()=>onExit ? onExit() : window.location.assign("/avventura")} style={{position:"absolute",right:20,bottom:20,border:"1px solid #e1c28d",borderRadius:10,background:"#2d3b31dd",color:"#f8ecd8",padding:"11px 16px",fontWeight:700,cursor:"pointer"}}>← Torna ad Avventura</button>
  </div>;
}
