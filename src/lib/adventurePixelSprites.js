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
