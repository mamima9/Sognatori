/** Riduce l'artwork a una griglia sprite e conserva la trasparenza. */
export function createAdventurePixelSprite(image, targetHeight = 32) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const width = Math.max(1, Math.round(sourceWidth * targetHeight / Math.max(1, sourceHeight)));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, width, targetHeight);
  ctx.drawImage(image, 0, 0, width, targetHeight);
  return canvas;
}

const PALETTES = {
  Demone:{skin:"#e6a28d",hair:"#30202c",dark:"#351b32",main:"#762d42",light:"#e66d62",metal:"#e7b36b",cloth:"#a83d4e",accent:"#f3c477",kind:"horns"},
  Robot:{skin:"#a8e6df",hair:"#244653",dark:"#172d43",main:"#315d72",light:"#55b8bd",metal:"#d5e5d7",cloth:"#397f91",accent:"#8de0d5",kind:"antenna"},
  Natura:{skin:"#e8bd91",hair:"#493a2b",dark:"#20392d",main:"#365c3c",light:"#8cbd61",metal:"#d6c18a",cloth:"#668a49",accent:"#b7d77d",kind:"leaves"},
  Nuvola:{skin:"#e8d8d1",hair:"#c5d9ef",dark:"#293654",main:"#536c9b",light:"#a9c8ed",metal:"#f0d8e8",cloth:"#829ed0",accent:"#f5f0f5",kind:"cloud"},
  Umano:{skin:"#d99b72",hair:"#352a2b",dark:"#382a2d",main:"#79503d",light:"#d28b52",metal:"#dfc18a",cloth:"#b46b45",accent:"#d84e4d",kind:"scarf"},
  Luce:{skin:"#f3d5a1",hair:"#f3e5b7",dark:"#5e492a",main:"#b28a35",light:"#f7e18c",metal:"#fff1c4",cloth:"#e0b84c",accent:"#fff0bc",kind:"halo"},
  Dolce:{skin:"#f0c1c9",hair:"#744768",dark:"#4d3158",main:"#985b8d",light:"#e9a6d0",metal:"#f5d99b",cloth:"#ca79aa",accent:"#ffe4ee",kind:"ribbon"},
  Marino:{skin:"#9dd4d8",hair:"#25475a",dark:"#17374d",main:"#28647d",light:"#5eb7c4",metal:"#d7e6d4",cloth:"#348da0",accent:"#bcebed",kind:"fins"},
  Orso:{skin:"#d5a779",hair:"#3a2b24",dark:"#38291f",main:"#745033",light:"#bd8a4d",metal:"#e2c18a",cloth:"#a87843",accent:"#e3c18a",kind:"fur"},
  Mago:{skin:"#d9b7a4",hair:"#302746",dark:"#2b2449",main:"#59417e",light:"#a48bd8",metal:"#e6d18d",cloth:"#8064ad",accent:"#d4c3f4",kind:"hat"},
  Salato:{skin:"#d5d1c4",hair:"#353b43",dark:"#30383d",main:"#646b6a",light:"#c5c5b4",metal:"#d8b477",cloth:"#898d83",accent:"#e8d8b1",kind:"crystal"}
};

function pixel(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function drawFrame(ctx, faction, direction, frame){
  const p=PALETTES[faction]||PALETTES.Umano;
  const step=frame?1:0;
  const side=direction==="left"||direction==="right";
  const back=direction==="up";
  ctx.clearRect(0,0,24,32);
  // Shadow and feet
  pixel(ctx,5,29,14,2,"rgba(0,0,0,.28)");
  const legY=25+(step?1:0);
  pixel(ctx,7,legY,4,4,p.dark); pixel(ctx,13,legY+(step?-1:0),4,4,p.dark);
  pixel(ctx,6,29+(step?0:0),5,2,"#30272a"); pixel(ctx,13,29+(step?1:0),5,2,"#30272a");
  // Backpack silhouette
  if(!back&&!side){pixel(ctx,3,13,4,10,p.dark);pixel(ctx,4,14,3,7,p.cloth);pixel(ctx,5,15,1,2,p.metal);}
  // Arms
  pixel(ctx,4,14+(step?1:0),3,8,p.main); pixel(ctx,17,14+(step?-1:0),3,8,p.main);
  pixel(ctx,4,20+(step?1:0),3,3,p.skin); pixel(ctx,17,19+(step?-1:0),3,3,p.skin);
  // Coat body
  pixel(ctx,7,12,10,13,p.dark); pixel(ctx,8,12,8,12,p.main);
  pixel(ctx,9,13,6,9,p.light); pixel(ctx,11,13,2,10,p.cloth);
  pixel(ctx,8,23,8,2,p.dark); pixel(ctx,11,22,2,2,p.metal);
  // Neck and head
  pixel(ctx,10,9,4,4,p.skin);
  pixel(ctx,7,3,10,8,p.skin); pixel(ctx,6,5,2,4,p.skin); pixel(ctx,16,5,2,4,p.skin);
  if(back){
    pixel(ctx,7,2,10,7,p.hair); pixel(ctx,8,1,8,2,p.hair);
  } else if(side){
    pixel(ctx,direction==="left"?6:8,2,9,7,p.hair);
    pixel(ctx,direction==="left"?6:15,5,2,4,p.hair);
    pixel(ctx,direction==="left"?8:13,6,1,1,"#24212a");
  } else {
    pixel(ctx,6,2,12,4,p.hair); pixel(ctx,7,1,10,2,p.hair);
    pixel(ctx,6,5,2,3,p.hair); pixel(ctx,16,5,2,3,p.hair);
    pixel(ctx,8,7,2,1,"#29242a"); pixel(ctx,14,7,2,1,"#29242a");
  }
  // Faction signature
  if(p.kind==="horns"){pixel(ctx,6,0,3,3,p.light);pixel(ctx,15,0,3,3,p.light);}
  if(p.kind==="antenna"){pixel(ctx,11,0,2,3,p.metal);pixel(ctx,10,0,4,1,p.light);}
  if(p.kind==="leaves"){pixel(ctx,5,1,3,3,p.light);pixel(ctx,16,1,3,3,p.light);}
  if(p.kind==="cloud"){pixel(ctx,6,1,4,2,p.light);pixel(ctx,14,1,4,2,p.light);}
  if(p.kind==="halo"){pixel(ctx,7,0,10,1,p.metal);pixel(ctx,6,1,2,1,p.metal);pixel(ctx,16,1,2,1,p.metal);}
  if(p.kind==="ribbon"){pixel(ctx,4,2,3,2,p.light);pixel(ctx,17,2,3,2,p.light);}
  if(p.kind==="fins"){pixel(ctx,4,5,3,4,p.light);pixel(ctx,17,5,3,4,p.light);}
  if(p.kind==="fur"){pixel(ctx,6,0,3,3,p.metal);pixel(ctx,9,0,3,2,p.metal);pixel(ctx,15,0,3,3,p.metal);}
  if(p.kind==="hat"){pixel(ctx,5,2,14,2,p.dark);pixel(ctx,8,0,8,3,p.dark);pixel(ctx,6,4,12,1,p.metal);}
  if(p.kind==="crystal"){pixel(ctx,7,0,2,3,p.metal);pixel(ctx,11,0,2,3,p.metal);pixel(ctx,15,0,2,3,p.metal);}
  if(p.kind==="scarf"){pixel(ctx,8,12,8,2,p.accent);pixel(ctx,15,13,2,7,p.accent);}
  else {pixel(ctx,10,13,4,2,p.metal);}
  if(!back){pixel(ctx,9,15,1,1,p.accent);pixel(ctx,14,15,1,1,p.accent);}
  // Side-facing nose and a faction-coloured hem highlight
  if(side){pixel(ctx,direction==="left"?5:17,8,2,2,p.skin);}
  pixel(ctx,8,25,3,1,p.light);pixel(ctx,13,25,3,1,p.light);
}

export function createTravelerSpriteSheet(faction){
  const sheet=document.createElement("canvas");
  sheet.width=48; sheet.height=128;
  const ctx=sheet.getContext("2d");
  if(!ctx) return sheet;
  const dirs=["down","left","right","up"];
  dirs.forEach((dir,row)=>[0,1].forEach((frame,col)=>{
    const cell=document.createElement("canvas"); cell.width=24; cell.height=32;
    const cellCtx=cell.getContext("2d"); if(!cellCtx)return;
    drawFrame(cellCtx,faction,dir,frame);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(cell,col*24,row*32);
  }));
  return sheet;
}


const WILD_PALETTES = {
  Mago:["#44315f","#9b79c9","#d9c4f3","#f3d88b"], Dolce:["#713e67","#d783b8","#f4c5dc","#fff0df"],
  Nuvola:["#425c85","#8db8e4","#d9e8f7","#fff6ef"], Robot:["#284d5d","#4f9da8","#a9e1d7","#d8eee1"],
  Marino:["#20536a","#3e9bb0","#9ad9dc","#e2f4e9"], Umano:["#654638","#c17d4c","#e7b67c","#f4dfb7"],
  Luce:["#8c6b2e","#e0bd58","#fff0a8","#fff9dc"], Demone:["#4c263b","#a44455","#e16c62","#f2bd7a"],
  Natura:["#294f38","#4f8a4e","#91bb62","#d7d89a"], Orso:["#513b2d","#8a603c","#c18c53","#e4c28a"],
  Salato:["#4c5558","#929b95","#c9c9b7","#efe1bd"]
};
function wildPixel(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function wildFrame(ctx,s,frame){
  const p=WILD_PALETTES[s?.tipo]||WILD_PALETTES.Natura;
  const [dark,main,light,shine]=p;
  const seed=Array.from(String(s?.id||s?.nome||"")).reduce((n,ch)=>n+ch.charCodeAt(0),0);
  const bob=frame?1:0;
  ctx.clearRect(0,0,24,24);
  wildPixel(ctx,5,21,14,2,"rgba(0,0,0,.28)");
  const type=s?.tipo;
  if(type==="Nuvola"){wildPixel(ctx,5,9-bob,14,9,main);wildPixel(ctx,3,12-bob,18,5,main);wildPixel(ctx,7,6-bob,10,6,light);wildPixel(ctx,4,9-bob,5,5,light);wildPixel(ctx,15,8-bob,5,6,light);}
  else if(type==="Marino"){wildPixel(ctx,3,12-bob,18,7,main);wildPixel(ctx,6,8-bob,12,8,light);wildPixel(ctx,1,10-bob,5,8,main);wildPixel(ctx,18,10-bob,5,8,main);wildPixel(ctx,9,5-bob,6,4,shine);}
  else if(type==="Robot"){wildPixel(ctx,5,7-bob,14,13,dark);wildPixel(ctx,6,8-bob,12,11,main);wildPixel(ctx,8,4-bob,8,5,light);wildPixel(ctx,10,2-bob,4,3,shine);wildPixel(ctx,2,11-bob,3,7,main);wildPixel(ctx,19,11-bob,3,7,main);}
  else if(type==="Dolce"){wildPixel(ctx,5,9-bob,14,11,main);wildPixel(ctx,7,6-bob,10,7,light);wildPixel(ctx,4,12-bob,16,6,main);wildPixel(ctx,8,4-bob,8,3,shine);wildPixel(ctx,10,3-bob,4,2,light);}
  else if(type==="Mago"){wildPixel(ctx,6,10-bob,12,10,main);wildPixel(ctx,8,6-bob,8,7,light);wildPixel(ctx,4,8-bob,16,3,dark);wildPixel(ctx,9,2-bob,6,7,dark);wildPixel(ctx,11,4-bob,2,2,shine);}
  else if(type==="Demone"){wildPixel(ctx,5,9-bob,14,12,main);wildPixel(ctx,7,6-bob,10,8,light);wildPixel(ctx,5,4-bob,4,6,dark);wildPixel(ctx,15,4-bob,4,6,dark);wildPixel(ctx,6,2-bob,3,5,shine);wildPixel(ctx,15,2-bob,3,5,shine);}
  else if(type==="Natura"){wildPixel(ctx,6,10-bob,12,11,main);wildPixel(ctx,8,6-bob,8,8,light);wildPixel(ctx,3,7-bob,6,5,light);wildPixel(ctx,15,5-bob,6,6,light);wildPixel(ctx,10,3-bob,4,4,shine);}
  else if(type==="Orso"){wildPixel(ctx,5,9-bob,14,12,main);wildPixel(ctx,7,6-bob,10,8,light);wildPixel(ctx,4,4-bob,5,6,dark);wildPixel(ctx,15,4-bob,5,6,dark);wildPixel(ctx,5,5-bob,3,3,shine);wildPixel(ctx,16,5-bob,3,3,shine);}
  else if(type==="Luce"){wildPixel(ctx,6,9-bob,12,12,main);wildPixel(ctx,8,6-bob,8,8,light);wildPixel(ctx,9,2-bob,6,3,shine);wildPixel(ctx,3,7-bob,4,4,shine);wildPixel(ctx,17,7-bob,4,4,shine);}
  else if(type==="Salato"){wildPixel(ctx,6,10-bob,12,11,main);wildPixel(ctx,8,7-bob,8,7,light);wildPixel(ctx,9,2-bob,6,7,shine);wildPixel(ctx,4,12-bob,4,6,dark);wildPixel(ctx,16,12-bob,4,6,dark);}
  else {wildPixel(ctx,6,9-bob,12,12,main);wildPixel(ctx,8,5-bob,8,8,light);}
  wildPixel(ctx,7+(seed%10),14-bob,2,2,shine);
  wildPixel(ctx,8,16-bob,3,2,dark);wildPixel(ctx,14,16-bob,3,2,dark);
  wildPixel(ctx,9,13-bob,2,2,"#171b2b");wildPixel(ctx,14,13-bob,2,2,"#171b2b");
  wildPixel(ctx,10,18-bob,4,1,shine);
  if(seed%3===0)wildPixel(ctx,11,0,2,3,shine);
  if(frame){wildPixel(ctx,6,21,4,1,main);wildPixel(ctx,14,21,4,1,main);}
}
export function createWildSognatoreSpriteSheet(s){
  const sheet=document.createElement("canvas");sheet.width=48;sheet.height=24;
  const ctx=sheet.getContext("2d");if(!ctx)return sheet;
  for(let frame=0;frame<2;frame++){
    const cell=document.createElement("canvas");cell.width=24;cell.height=24;
    wildFrame(cell.getContext("2d"),s,frame);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(cell,frame*24,0);
  }
  return sheet;
}
