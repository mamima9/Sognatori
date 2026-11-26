import React,{useEffect,useRef,useState} from "react";
import * as THREE from "three";

export default function Lumequieto3D({stage=0,onLocationChange=()=>{}}){
 const mount=useRef(null),[hint,setHint]=useState("Esplora Lumequieto"),[mobile,setMobile]=useState(false);
 useEffect(()=>{
  const host=mount.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color("#9cc9e8");scene.fog=new THREE.Fog("#9cc9e8",24,90);
  const camera=new THREE.PerspectiveCamera(60,host.clientWidth/host.clientHeight,.1,120);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight("#dff4ff","#547447",2));
  const sun=new THREE.DirectionalLight("#fff0ce",3);sun.position.set(-12,20,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:"#6eaa58",roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const path=new THREE.Mesh(new THREE.PlaneGeometry(7,55),new THREE.MeshStandardMaterial({color:"#c3a477",roughness:1}));path.rotation.x=-Math.PI/2;path.position.set(0,.025,-15);scene.add(path);
  const mat=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.85});
  const trunk=mat("#765036"),leaf=mat("#42834b"),leaf2=mat("#6ca45c"),stone=mat("#9a9885"),roof=mat("#8b5540");
  function tree(x,z,s=1){const t=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.28*s,1.4*s,7),trunk);t.position.set(x,.7*s,z);t.castShadow=true;scene.add(t);for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry((1.05-i*.16)*s,1.55*s,8),i%2?leaf:leaf2);c.position.set(x,(1.45+i*.55)*s,z);c.castShadow=true;scene.add(c)}}
  for(let i=0;i<52;i++){const x=((i*17)%43)-21,z=-((i*13)%48)-3;if(Math.abs(x)>5)tree(x,z,.65+((i%4)*.15))}
  function building(x,z){const b=new THREE.Mesh(new THREE.BoxGeometry(4,3,4),mat("#e4d1a6"));b.position.set(x,1.5,z);b.castShadow=true;scene.add(b);const r=new THREE.Mesh(new THREE.ConeGeometry(3.1,1.8,4),roof);r.rotation.y=Math.PI/4;r.position.set(x,3.7,z);r.castShadow=true;scene.add(r);const door=new THREE.Mesh(new THREE.BoxGeometry(.8,1.7,.12),mat("#553d2b"));door.position.set(x, .85,z+2.05);scene.add(door)}
  building(-8,-10);building(8,-12);
  // ancient portal/ruin landmarks
  const columns=[];for(let x of [-3.2,3.2]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.45,.55,4,10),stone);c.position.set(x,2,-28);c.castShadow=true;scene.add(c);columns.push(c)}
  const lintel=new THREE.Mesh(new THREE.BoxGeometry(7.3,.8,.8),stone);lintel.position.set(0,4.1,-28);lintel.castShadow=true;scene.add(lintel);
  const glow=new THREE.Mesh(new THREE.TorusGeometry(2.15,.12,12,48),new THREE.MeshBasicMaterial({color:"#91e4d2"}));glow.position.set(0,2.6,-28);scene.add(glow);
  // player avatar, stylized low-poly
  const avatar=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.85,4,8),mat("#3477a5"));body.position.y=1.1;body.castShadow=true;avatar.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.34,12,10),mat("#e9c29b"));head.position.y=1.95;head.castShadow=true;avatar.add(head);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(.42,.55,8),mat("#6dbd72"));cap.position.y=2.28;cap.rotation.z=.2;avatar.add(cap);
  const backpack=new THREE.Mesh(new THREE.BoxGeometry(.42,.55,.25),mat("#b88743"));backpack.position.set(0,1.15,-.36);avatar.add(backpack);
  avatar.position.set(0,0,3);scene.add(avatar);
  const rocks=[];for(let i=0;i<20;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.4+(i%3)*.18,0),stone);rock.position.set(((i*9)%34)-17,.25,-((i*7)%36)-5);rock.castShadow=true;scene.add(rock)}
  camera.position.set(0,5,9);camera.lookAt(avatar.position);
  let keys={},move={x:0,z:0},running=true,last=0;
  const keydown=e=>{keys[e.key.toLowerCase()]=true;if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase()))e.preventDefault()},keyup=e=>keys[e.key.toLowerCase()]=false;
  window.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);
  const resize=()=>{if(!host.clientWidth)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};
  window.addEventListener("resize",resize);
  const animate=(t)=>{if(!running)return;requestAnimationFrame(animate);const dt=Math.min((t-last)/1000,.05)||0;last=t;let dx=move.x+(keys.a||keys.arrowleft?-1:0)+(keys.d||keys.arrowright?1:0),dz=move.z+(keys.w||keys.arrowup?-1:0)+(keys.s||keys.arrowdown?1:0);const len=Math.hypot(dx,dz);if(len>0){dx/=len;dz/=len;avatar.position.x+=dx*5*dt;avatar.position.z+=dz*5*dt;avatar.position.x=THREE.MathUtils.clamp(avatar.position.x,-18,18);avatar.position.z=THREE.MathUtils.clamp(avatar.position.z,2,-39);avatar.rotation.y=Math.atan2(dx,dz);setHint(avatar.position.z<-24?"La Porta delle Rune":avatar.position.z<-13?"Bosco dei Sussurri":avatar.position.x<-5?"Borgo delle Lanterne":"Sentiero di Lumequieto")}camera.position.lerp(new THREE.Vector3(avatar.position.x,avatar.position.y+4.6,avatar.position.z+7.5),.09);camera.lookAt(avatar.position.x,avatar.position.y+1,avatar.position.z-1);renderer.render(scene,camera)};
  requestAnimationFrame(animate);
  const setMove=(x,z)=>move={x,z};
  host.__setMove=setMove;
  return()=>{running=false;window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);window.removeEventListener("resize",resize);scene.traverse(o=>{o.geometry?.dispose();if(o.material?.dispose)o.material.dispose()});renderer.dispose();host.removeChild(renderer.domElement)};
 },[]);
 const control=(x,z)=>mount.current?.__setMove?.(x,z);
 return <div style={{position:"relative",width:"100%",height:"min(72vh,650px)",minHeight:390,borderRadius:20,overflow:"hidden",border:"1px solid #45634e",boxShadow:"0 16px 40px #0005"}}><div ref={mount} style={{width:"100%",height:"100%"}}/><div style={{position:"absolute",top:12,left:12,right:12,display:"flex",justifyContent:"space-between",pointerEvents:"none",gap:8}}><div style={{background:"#14251dcc",color:"#f5e6c5",padding:"10px 14px",borderRadius:12,backdropFilter:"blur(8px)"}}><b>LUMEQUIETO</b><div style={{fontSize:12}}>{hint}</div></div><div style={{background:"#14251dcc",color:"#f5e6c5",padding:"10px 14px",borderRadius:12,fontSize:12}}>WASD / frecce</div></div><div style={{position:"absolute",bottom:12,left:12,right:12,display:"flex",justifyContent:"space-between",alignItems:"end"}}><div style={{display:"grid",gridTemplateColumns:"repeat(3,48px)",gridTemplateRows:"repeat(2,48px)",gap:4}}><span/><button onTouchStart={()=>control(0,-1)} onTouchEnd={()=>control(0,0)} onMouseDown={()=>control(0,-1)} onMouseUp={()=>control(0,0)} style={pad}>▲</button><span/><button onTouchStart={()=>control(-1,0)} onTouchEnd={()=>control(0,0)} onMouseDown={()=>control(-1,0)} onMouseUp={()=>control(0,0)} style={pad}>◀</button><button onTouchStart={()=>control(0,1)} onTouchEnd={()=>control(0,0)} onMouseDown={()=>control(0,1)} onMouseUp={()=>control(0,0)} style={pad}>▼</button><button onTouchStart={()=>control(1,0)} onTouchEnd={()=>control(0,0)} onMouseDown={()=>control(1,0)} onMouseUp={()=>control(0,0)} style={pad}>▶</button></div><button onClick={()=>setHint("Interazione: presto NPC, tesori e porte")} style={{border:0,borderRadius:14,padding:"16px 20px",background:"#e0c17a",fontWeight:900}}>A · INTERAGISCI</button></div></div>
}
const pad={background:"#14251dcc",color:"#fff",border:"1px solid #ffffff44",borderRadius:12,fontSize:22,backdropFilter:"blur(6px)",touchAction:"none"};
