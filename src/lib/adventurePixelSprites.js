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

export function createTravelerSpriteSheet(faction, traveler){
  const sheet=document.createElement("canvas");
  sheet.width=48; sheet.height=128;
  const ctx=sheet.getContext("2d");
  if(!ctx) return sheet;
  const directions=["down","left","right","up"];
  directions.forEach((direction,row)=>[0,1].forEach((frame,col)=>{
    ctx.save();
    ctx.translate(col*24,row*32);
    drawAdventureTraveler(
      ctx,
      traveler||faction,
      faction,
      12,
      31,
      frame,
      .45,
      direction
    );
    ctx.restore();
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
  const sheet=document.createElement("canvas");sheet.width=48;sheet.height=64;
  const ctx=sheet.getContext("2d");if(!ctx)return sheet;
  for(let frame=0;frame<2;frame++){
    ctx.save();ctx.translate(frame*24,0);
    drawAdventureWildSognatore(ctx,s,12,31,frame,.9);
    ctx.restore();
  }
  return sheet;
}


const TRAVELER_DESIGNS = {
  Vark:{coat:"#6e293b",trim:"#e7a35e",hair:"#292238",skin:"#e7b18e",accent:"#d85d58",hat:"horn"},
  "Unit-07":{coat:"#315c70",trim:"#a9e3d9",hair:"#243b50",skin:"#a9d8cf",accent:"#55c3c2",hat:"antenna"},
  Silva:{coat:"#416b42",trim:"#b7d77b",hair:"#4b3529",skin:"#e4b58b",accent:"#83b75d",hat:"leaf"},
  Cirrus:{coat:"#607da9",trim:"#e2eaf5",hair:"#c7d8ed",skin:"#ead7d0",accent:"#b6d4f0",hat:"cloud"},
  Mira:{coat:"#8a523d",trim:"#e4bd83",hair:"#382b2b",skin:"#d99c78",accent:"#bd4e4b",hat:"scarf"},
  Aurelia:{coat:"#a78335",trim:"#fff0b0",hair:"#ead99d",skin:"#f0d2a7",accent:"#f6df83",hat:"halo"},
  Miel:{coat:"#a65f91",trim:"#ffe0ed",hair:"#71496a",skin:"#edc1c6",accent:"#f3a9d1",hat:"bow"},
  Nerio:{coat:"#28677d",trim:"#b7e9e8",hair:"#29485b",skin:"#a1d3d4",accent:"#58b8c5",hat:"fin"},
  Bruma:{coat:"#795536",trim:"#e4c28a",hair:"#403027",skin:"#d6a97f",accent:"#b88b55",hat:"fur"},
  Merl:{coat:"#59447e",trim:"#e1d2a5",hair:"#302847",skin:"#d9b6a2",accent:"#aa8cdb",hat:"hat"},
  Saleh:{coat:"#686d69",trim:"#e8d8b1",hair:"#3b4147",skin:"#d4d1c5",accent:"#c5c8b8",hat:"crystal"}
};
function px(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
export function drawAdventureTraveler(ctx, traveler, faction, x, y, frame=0, scale=1, direction="down"){
  const base=TRAVELER_DESIGNS[traveler]||TRAVELER_DESIGNS.Mira;
  const identity=String(traveler||"Viandante");
  const seed=Array.from(identity).reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,7);
  const factionColors={
    Natura:["#365c3c","#668a49","#8cbd61","#b7d77d","#493a2b","#e8bd91"],
    Robot:["#315d72","#397f91","#55b8bd","#8de0d5","#244653","#a8e6df"],
    Demone:["#762d42","#a83d4e","#e66d62","#f3c477","#30202c","#e6a28d"],
    Nuvola:["#536c9b","#829ed0","#a9c8ed","#f5f0f5","#c5d9ef","#e8d8d1"],
    Umano:["#79503d","#b46b45","#d28b52","#dfc18a","#352a2b","#d99b72"],
    Luce:["#b28a35","#e0b84c","#f7e18c","#fff0bc","#f3e5b7","#f3d5a1"],
    Dolce:["#985b8d","#ca79aa","#e9a6d0","#ffe4ee","#744768","#f0c1c9"],
    Marino:["#28647d","#348da0","#5eb7c4","#bcebed","#25475a","#9dd4d8"],
    Orso:["#745033","#a87843","#bd8a4d","#e2c18a","#3a2b24","#d5a779"],
    Mago:["#59417e","#8064ad","#a48bd8","#d4c3f4","#302746","#d9b7a4"],
    Salato:["#646b6a","#898d83","#c5c5b4","#e8d8b1","#353b43","#d5d1c4"]
  };
  const palette=factionColors[faction]||factionColors.Umano;
  const d={
    ...base,
    coat:base===TRAVELER_DESIGNS.Mira&&!TRAVELER_DESIGNS[traveler]?palette[seed%4]:base.coat,
    trim:palette[(seed+1)%4],
    accent:palette[(seed+2)%4],
    hair:palette[4+(seed%2)],
    skin:base===TRAVELER_DESIGNS.Mira&&!TRAVELER_DESIGNS[traveler]?palette[5]:base.skin,
    variant:seed%5
  };
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
  // Il profilo sinistro viene specchiato; il destro usa il profilo naturale.
  if(direction==="left"){ctx.scale(-1,1);}
  const sideFacing=direction==="left"||direction==="right";
  const bob=frame?1:0;
  // grounding shadow and separated feet
  ctx.fillStyle="rgba(4,10,13,.34)";ctx.beginPath();ctx.ellipse(0,1,15,4,0,0,Math.PI*2);ctx.fill();
  px(ctx,-9, -9+bob,7,9,"#30303a");px(ctx,2,-9+(frame?0:1),7,9,"#30303a");
  px(ctx,-10,-2+bob,9,3,"#252630");px(ctx,2,-2+(frame?0:1),9,3,"#252630");
  // backpack and silhouette
  px(ctx,-13,-35+bob,6,19,"#332d36");px(ctx,-12,-33+bob,4,13,d.trim);
  px(ctx,-10,-35+bob,20,25,"#292b39");
  px(ctx,-9,-34+bob,18,23,d.coat);px(ctx,-4,-33+bob,8,20,d.trim);
  px(ctx,-2,-34+bob,4,22,d.coat);
  // sleeves, gloves and belt
  px(ctx,-15,-31+bob,5,16,d.coat);px(ctx,10,-31+bob,5,16,d.coat);
  px(ctx,-15,-17+bob,5,4,d.skin);px(ctx,10,-17+bob,5,4,d.skin);
  px(ctx,-8,-13+bob,16,3,d.accent);px(ctx,-2,-12+bob,4,3,d.trim);
  // neck and face
  px(ctx,-4,-42+bob,8,8,d.skin);px(ctx,-8,-55+bob,16,15,d.skin);
  px(ctx,-9,-53+bob,3,7,d.skin);px(ctx,6,-53+bob,3,7,d.skin);
  px(ctx,-9,-58+bob,18,7,d.hair);px(ctx,-7,-61+bob,14,4,d.hair);
  px(ctx,-9,-54+bob,4,5,d.hair);px(ctx,5,-54+bob,4,5,d.hair);
  if(direction==="up"){
    px(ctx,-9,-57+bob,18,13,d.hair);
    px(ctx,-7,-60+bob,14,4,d.hair);
  } else if(sideFacing) {
    // Un solo occhio e il naso laterale distinguono il profilo dai frame frontali.
    px(ctx, direction==="left" ? -5 : 3, -49+bob, 2, 2, "#24232b");
    px(ctx, direction==="left" ? 3 : -5, -46+bob, 3, 2, d.skin);
  } else {
    px(ctx,-5,-49+bob,2,2,"#24232b");
    px(ctx,3,-49+bob,2,2,"#24232b");
    px(ctx,-1,-44+bob,3,1,"#9e5f58");
  }
  // Distinct silhouette details derived from the resident's identity.
  if(d.variant===0){px(ctx,-11,-37+bob,5,9,d.accent);px(ctx,6,-30+bob,5,8,d.trim);}
  if(d.variant===1){px(ctx,-8,-62+bob,5,5,d.trim);px(ctx,3,-64+bob,5,7,d.accent);px(ctx,7,-56+bob,3,5,d.hair);}
  if(d.variant===2){px(ctx,-13,-29+bob,4,10,d.trim);px(ctx,9,-29+bob,4,10,d.accent);px(ctx,-5,-10+bob,10,3,d.trim);}
  if(d.variant===3){px(ctx,-7,-60+bob,4,7,d.accent);px(ctx,3,-60+bob,5,6,d.trim);px(ctx,5,-47+bob,4,3,d.accent);}
  if(d.variant===4){px(ctx,-10,-34+bob,4,6,d.trim);px(ctx,6,-36+bob,5,8,d.accent);px(ctx,-3,-18+bob,7,3,d.trim);}
  // Natura inhabitants are all elves: pointed ears are the shared Verdelume trait.
  if(faction==="Natura" && direction!=="up"){
    px(ctx,-14,-53+bob,7,3,d.skin);px(ctx,-19,-57+bob,7,5,d.accent);
    px(ctx,7,-53+bob,7,3,d.skin);px(ctx,12,-57+bob,7,5,d.accent);
    px(ctx,-17,-56+bob,4,2,d.trim);px(ctx,13,-56+bob,4,2,d.trim);
    px(ctx,-5,-66+bob,5,5,"#72a94e");px(ctx,1,-68+bob,5,6,"#9cc86b");
  }
  if(faction==="Robot"){px(ctx,-2,-69+bob,4,9,d.trim);px(ctx,-5,-70+bob,10,3,d.accent);px(ctx,-14,-27+bob,3,4,d.trim);}
  if(faction==="Demone"){px(ctx,-11,-66+bob,5,9,d.accent);px(ctx,6,-66+bob,5,9,d.accent);}
  if(faction==="Nuvola"){px(ctx,-12,-65+bob,7,4,d.trim);px(ctx,5,-65+bob,8,4,d.trim);px(ctx,-2,-68+bob,5,3,d.accent);}
  if(faction==="Luce"){px(ctx,-10,-69+bob,20,2,d.trim);px(ctx,-8,-71+bob,16,2,d.accent);}
  if(faction==="Dolce"){px(ctx,-15,-61+bob,7,6,d.accent);px(ctx,8,-61+bob,7,6,d.trim);}
  if(faction==="Marino"){px(ctx,-15,-54+bob,6,12,d.accent);px(ctx,9,-54+bob,6,12,d.accent);}
  if(faction==="Orso"){px(ctx,-12,-64+bob,7,8,d.trim);px(ctx,5,-64+bob,7,8,d.trim);}
  if(faction==="Mago"){px(ctx,-12,-62+bob,24,4,d.hair);px(ctx,-7,-70+bob,14,9,d.accent);px(ctx,-10,-57+bob,20,2,d.trim);}
  if(faction==="Salato"){px(ctx,-9,-69+bob,5,9,d.trim);px(ctx,-2,-73+bob,5,12,d.accent);px(ctx,5,-69+bob,5,9,d.trim);}
  // recognizable faction headpiece
  if(d.hat==="horn"){px(ctx,-9,-65+bob,4,7,d.trim);px(ctx,5,-65+bob,4,7,d.trim);}
  if(d.hat==="antenna"){px(ctx,-1,-68+bob,3,8,d.trim);px(ctx,-3,-69+bob,7,3,d.accent);}
  if(d.hat==="leaf"){px(ctx,-11,-64+bob,7,8,"#72a94e");px(ctx,4,-65+bob,8,8,"#9cc86b");}
  if(d.hat==="cloud"){px(ctx,-10,-63+bob,7,4,d.trim);px(ctx,4,-63+bob,7,4,d.trim);}
  if(d.hat==="scarf"){px(ctx,-9,-43+bob,18,5,d.accent);px(ctx,6,-40+bob,4,13,d.accent);}
  if(d.hat==="halo"){px(ctx,-10,-67+bob,20,2,d.trim);px(ctx,-8,-69+bob,16,2,d.trim);}
  if(d.hat==="bow"){px(ctx,-12,-60+bob,6,5,d.accent);px(ctx,6,-60+bob,6,5,d.accent);}
  if(d.hat==="fin"){px(ctx,-13,-55+bob,5,10,d.accent);px(ctx,8,-55+bob,5,10,d.accent);}
  if(d.hat==="fur"){px(ctx,-10,-64+bob,6,6,d.trim);px(ctx,-3,-66+bob,7,5,d.trim);px(ctx,5,-64+bob,6,6,d.trim);}
  if(d.hat==="hat"){px(ctx,-12,-61+bob,24,4,d.hair);px(ctx,-7,-68+bob,14,8,d.hair);px(ctx,-10,-58+bob,20,2,d.trim);}
  if(d.hat==="crystal"){px(ctx,-8,-66+bob,4,7,d.trim);px(ctx,-2,-69+bob,4,10,d.accent);px(ctx,5,-66+bob,4,7,d.trim);}
  // stitch highlights and walk-step pixels
  px(ctx,-7,-31+bob,3,5,d.accent);px(ctx,5,-27+bob,2,7,d.trim);
  if(frame){px(ctx,-10,-3,6,2,d.trim);px(ctx,4,-2,6,2,d.trim);}
  ctx.restore();
}



const WILD_SPECIES_DESIGNS = {
  adlimago: { shape:"mage", colors:["#44315f","#9b79c9","#d9c4f3","#f3d88b"] },
  cancucc: { shape:"bread", colors:["#8a4c31","#d7a16f","#f5d8a6","#fff0d2"] },
  eroe: { shape:"stormbird", colors:["#425c85","#8db8e4","#d9e8f7","#fff6ef"] },
  nuvobetta: { shape:"cloud-dancer", colors:["#655d9b","#b7a8e8","#f0dcff","#fff7fa"] },
  scroccospell: { shape:"spell-scroll", colors:["#392b5d","#765ca6","#c7b1eb","#f6df9a"] },
  deb: { shape:"robot-box", colors:["#284d5d","#4f9da8","#a9e1d7","#d8eee1"] },
  aragostino: { shape:"lobster", colors:["#713c35","#c45e4e","#f0a078","#ffe0a8"] },
  sparkly: { shape:"star-human", colors:["#654638","#c17d4c","#e7b67c","#fff0a8"] },
  nina: { shape:"angel", colors:["#8c6b2e","#e0bd58","#fff0a8","#fff9dc"] },
  taomarco: { shape:"scarf-human", colors:["#654638","#c17d4c","#e7b67c","#e85a50"] },
  riwupido: { shape:"light-seal", colors:["#8c6b2e","#e0bd58","#fff0a8","#fff9dc"] },
  fourmori: { shape:"ant", colors:["#604535","#b97850","#e8bd8e","#f5e4bd"] },
  ginza: { shape:"guardian", colors:["#654638","#a86e4d","#e7bd8e","#f5e0b9"] },
  dragociocco: { shape:"chocodragon", colors:["#713e67","#a85a50","#d78a68","#ffe0bd"] },
  tinia: { shape:"pink-cloud", colors:["#655d9b","#bd9bdc","#f3d7ef","#fff5fa"] },
  uesditti: { shape:"arcane-book", colors:["#392b5d","#765ca6","#c7b1eb","#f6df9a"] },
  fierononno: { shape:"old-cloud", colors:["#425c85","#8db8e4","#d9e8f7","#fff6ef"] },
  long: { shape:"long-robot", colors:["#284d5d","#4f9da8","#a9e1d7","#d8eee1"] },
  pepe: { shape:"frog", colors:["#294f38","#4f8a4e","#91bb62","#d7d89a"] },
  cillymbu: { shape:"bamboo", colors:["#294f38","#4f8a4e","#91bb62","#d7d89a"] },
  pequeno: { shape:"seedling", colors:["#294f38","#6d9b51","#b8d77b","#f2e7a8"] },
  cenere: { shape:"ember", colors:["#4c263b","#a44455","#e16c62","#f2bd7a"] },
  icepadel: { shape:"ice-pan", colors:["#20536a","#3e9bb0","#c4e8ed","#ffffff"] },
  pirimar: { shape:"shrimp", colors:["#20536a","#3e9bb0","#9ad9dc","#e2f4e9"] },
  spinoff: { shape:"spin-leaf", colors:["#294f38","#4f8a4e","#91bb62","#d7d89a"] },
  toasty: { shape:"toast", colors:["#6c4531","#b8794d","#e5b77e","#fff0c8"] },
  shoboshi: { shape:"ghost", colors:["#425c85","#8db8e4","#d9e8f7","#fff6ef"] },
  elmas: { shape:"crystal", colors:["#4c5558","#929b95","#c9c9b7","#ffffff"] },
  "ring-ape": { shape:"ring-ape", colors:["#513b2d","#8a603c","#c18c53","#f4d38d"] },
};

const WILD_OFFICIAL_ART_CACHE = new Map();

function getWildOfficialArt(src) {
  if (!src || typeof Image === "undefined") return null;
  let image = WILD_OFFICIAL_ART_CACHE.get(src);
  if (image) return image;
  image = new Image();
  image.onload = () => { image.__ready = true; };
  image.onerror = () => { image.__failed = true; };
  image.src = src;
  WILD_OFFICIAL_ART_CACHE.set(src, image);
  return image;
}

export function drawAdventureWildSognatore(ctx, s, x, y, frame=0, scale=1){
  const id = s?.id || "";
  const type = s?.tipo || "Natura";
  const factionPalettes = {
    Dolce:["#a96a91","#f0b9d4","#653e68","#fff0df"],
    Nuvola:["#7c9ec8","#d9e9f7","#425b82","#fff8ed"],
    Robot:["#4d9ba5","#b9e7dc","#254c5e","#e4f2e8"],
    Marino:["#3187a1","#a7dfe0","#194d68","#eff8e7"],
    Umano:["#a86e4d","#e7bd8e","#53382f","#f5e0b9"],
    Luce:["#d1aa43","#fff0a7","#80602a","#fffbe0"],
    Demone:["#a74755","#e27a68","#4b273d","#ffd08a"],
    Natura:["#568c4b","#a8c96c","#294f38","#e2dda1"],
    Orso:["#91623d","#d0a36a","#493326","#f0d6a1"],
    Mago:["#765ca6","#c7b1eb","#392c5d","#f6df9a"],
    Salato:["#828c84","#d1d0bd","#414a4d","#f3e4bf"]
  };
  const design = WILD_SPECIES_DESIGNS[id];
  const [main,light,dark,shine] = design?.colors || factionPalettes[type] || factionPalettes.Natura;
  const bob = frame ? 1 : 0;
  const shape = design?.shape || "seedling";
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  ctx.scale(scale,scale);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(0,1,14,4,0,0,Math.PI*2);
  ctx.fill();

  // Prima scelta: artwork ufficiale del Sognatore, ritagliato dall'illustrazione della sua carta.
  // Il crop esclude nome, statistiche e testo, mantenendo la creatura e il suo fondale illustrato.
  const officialArt = getWildOfficialArt(s?.img);
  if (officialArt?.complete && officialArt.naturalWidth > 0 && !officialArt.__failed) {
    const sw = officialArt.naturalWidth;
    const sh = officialArt.naturalHeight;
    const sx = Math.round(sw * 0.17);
    const sy = Math.round(sh * 0.15);
    const sourceW = Math.round(sw * 0.66);
    const sourceH = Math.round(sh * 0.46);
    const bobY = frame ? -0.5 : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(officialArt, sx, sy, sourceW, sourceH, -12, -29 + bobY, 24, 28);
    // Riflesso pixel-art leggero per armonizzare l'illustrazione con l'overworld.
    ctx.fillStyle = "rgba(255,245,220,.08)";
    ctx.fillRect(-11, -28 + bobY, 22, 1);
    ctx.restore();
    return;
  }

  // Fallback dedicato: resta disponibile se un artwork non è presente o non si carica.
  switch(shape){
    case "mage":
      px(ctx,-9,-15+bob,18,15,main);px(ctx,-7,-21+bob,14,10,light);
      px(ctx,-14,-25+bob,28,4,dark);px(ctx,-9,-34+bob,18,10,dark);
      px(ctx,-3,-31+bob,6,5,shine);px(ctx,10,-16+bob,4,13,dark);px(ctx,11,-20+bob,3,5,shine);break;
    case "bread":
      px(ctx,-13,-16+bob,26,15,dark);px(ctx,-11,-21+bob,22,17,main);
      px(ctx,-8,-25+bob,16,8,light);px(ctx,-7,-19+bob,4,3,shine);
      px(ctx,4,-20+bob,4,3,shine);px(ctx,-5,-7+bob,10,3,"#fff0d2");
      px(ctx,-15,-12+bob,4,7,main);px(ctx,11,-12+bob,4,7,main);break;
    case "stormbird":
      px(ctx,-8,-14+bob,16,14,main);px(ctx,-17,-17+bob,10,8,light);px(ctx,7,-17+bob,10,8,light);
      px(ctx,-7,-24+bob,14,12,light);px(ctx,-3,-31+bob,6,8,shine);
      px(ctx,-5,-2+bob,4,5,dark);px(ctx,3,-2+bob,4,5,dark);break;
    case "cloud-dancer":
      px(ctx,-12,-15+bob,24,14,main);px(ctx,-17,-12+bob,10,9,light);px(ctx,7,-12+bob,10,9,light);
      px(ctx,-8,-23+bob,16,11,light);px(ctx,-3,-29+bob,6,7,shine);
      px(ctx,-14,-5+bob,8,4,shine);px(ctx,6,-5+bob,8,4,shine);break;
    case "spell-scroll":
      px(ctx,-12,-20+bob,24,18,dark);px(ctx,-9,-18+bob,18,14,light);
      px(ctx,-13,-22+bob,26,4,main);px(ctx,-13,-5+bob,26,4,main);
      px(ctx,-4,-15+bob,8,8,shine);px(ctx,-2,-28+bob,4,8,shine);
      px(ctx,-15,-18+bob,4,15,light);px(ctx,11,-18+bob,4,15,light);break;
    case "robot-box":
      px(ctx,-12,-21+bob,24,22,dark);px(ctx,-9,-19+bob,18,18,main);
      px(ctx,-8,-26+bob,16,7,light);px(ctx,-5,-14+bob,3,3,shine);px(ctx,3,-14+bob,3,3,shine);
      px(ctx,-4,-7+bob,8,3,dark);px(ctx,-17,-17+bob,5,12,main);px(ctx,12,-17+bob,5,12,main);
      px(ctx,-3,-31+bob,6,6,shine);break;
    case "lobster":
      px(ctx,-11,-15+bob,22,15,dark);px(ctx,-9,-20+bob,18,14,main);
      px(ctx,-7,-25+bob,14,8,light);px(ctx,-18,-19+bob,8,9,main);px(ctx,10,-19+bob,8,9,main);
      px(ctx,-17,-27+bob,4,10,shine);px(ctx,13,-27+bob,4,10,shine);
      px(ctx,-5,-4+bob,4,7,dark);px(ctx,2,-4+bob,4,7,dark);break;
    case "star-human":
      px(ctx,-9,-15+bob,18,15,main);px(ctx,-7,-21+bob,14,10,light);
      px(ctx,-3,-31+bob,6,8,shine);px(ctx,-14,-22+bob,7,7,shine);px(ctx,7,-22+bob,7,7,shine);
      px(ctx,-5,-3+bob,10,4,dark);break;
    case "angel":
      px(ctx,-9,-15+bob,18,15,main);px(ctx,-7,-21+bob,14,10,light);
      px(ctx,-18,-19+bob,10,12,shine);px(ctx,8,-19+bob,10,12,shine);
      px(ctx,-10,-31+bob,20,3,shine);px(ctx,-7,-34+bob,14,2,shine);
      px(ctx,-3,-27+bob,6,4,shine);break;
    case "scarf-human":
      px(ctx,-10,-15+bob,20,16,dark);px(ctx,-8,-20+bob,16,12,main);
      px(ctx,-7,-28+bob,14,9,light);px(ctx,-11,-17+bob,5,9,main);px(ctx,6,-17+bob,5,9,main);
      px(ctx,-9,-12+bob,18,4,shine);px(ctx,7,-10+bob,5,14,shine);break;
    case "light-seal":
      px(ctx,-10,-14+bob,20,14,main);px(ctx,-7,-21+bob,14,10,light);
      px(ctx,-4,-32+bob,8,18,shine);px(ctx,-15,-19+bob,7,8,shine);px(ctx,8,-19+bob,7,8,shine);
      px(ctx,-4,-7+bob,8,3,dark);break;
    case "ant":
      px(ctx,-10,-14+bob,20,13,dark);px(ctx,-8,-20+bob,16,12,main);
      px(ctx,-6,-27+bob,12,8,light);px(ctx,-3,-31+bob,3,7,dark);px(ctx,1,-31+bob,3,7,dark);
      px(ctx,-16,-12+bob,7,4,main);px(ctx,9,-12+bob,7,4,main);
      px(ctx,-17,-2+bob,8,3,dark);px(ctx,9,-2+bob,8,3,dark);break;
    case "guardian":
      px(ctx,-13,-16+bob,26,16,dark);px(ctx,-10,-22+bob,20,15,main);
      px(ctx,-8,-29+bob,16,10,light);px(ctx,-14,-27+bob,7,9,dark);px(ctx,7,-27+bob,7,9,dark);
      px(ctx,-5,-9+bob,10,4,shine);px(ctx,-18,-14+bob,5,9,main);px(ctx,13,-14+bob,5,9,main);break;
    case "chocodragon":
      px(ctx,-11,-14+bob,22,15,main);px(ctx,-8,-21+bob,16,11,light);
      px(ctx,-15,-28+bob,8,12,dark);px(ctx,7,-28+bob,8,12,dark);
      px(ctx,-19,-16+bob,8,8,light);px(ctx,11,-16+bob,8,8,light);
      px(ctx,-4,-31+bob,8,5,shine);px(ctx,-5,-3+bob,4,6,dark);px(ctx,2,-3+bob,4,6,dark);break;
    case "pink-cloud":
      px(ctx,-13,-14+bob,26,13,main);px(ctx,-17,-13+bob,9,9,light);px(ctx,8,-13+bob,9,9,light);
      px(ctx,-9,-22+bob,18,12,light);px(ctx,-4,-29+bob,8,8,shine);
      px(ctx,-4,-3+bob,8,5,main);px(ctx,-16,-5+bob,7,3,shine);px(ctx,9,-5+bob,7,3,shine);break;
    case "arcane-book":
      px(ctx,-13,-20+bob,26,20,dark);px(ctx,-10,-18+bob,10,16,light);px(ctx,1,-18+bob,10,16,main);
      px(ctx,-2,-18+bob,4,16,shine);px(ctx,-6,-13+bob,4,4,shine);px(ctx,3,-13+bob,4,4,shine);
      px(ctx,-4,-29+bob,8,8,shine);break;
    case "old-cloud":
      px(ctx,-12,-15+bob,24,14,main);px(ctx,-16,-14+bob,9,8,light);px(ctx,7,-14+bob,9,8,light);
      px(ctx,-8,-23+bob,16,11,light);px(ctx,-8,-28+bob,16,4,shine);
      px(ctx,-8,-5+bob,5,3,shine);px(ctx,3,-5+bob,5,3,shine);px(ctx,-4,-2+bob,8,2,dark);break;
    case "long-robot":
      px(ctx,-8,-29+bob,16,28,dark);px(ctx,-6,-27+bob,12,24,main);
      px(ctx,-7,-33+bob,14,7,light);px(ctx,-4,-19+bob,8,4,shine);
      px(ctx,-13,-24+bob,5,13,main);px(ctx,8,-24+bob,5,13,main);
      px(ctx,-5,-3+bob,3,4,dark);px(ctx,2,-3+bob,3,4,dark);break;
    case "frog":
      px(ctx,-13,-15+bob,26,15,dark);px(ctx,-11,-20+bob,22,13,main);
      px(ctx,-12,-27+bob,8,9,light);px(ctx,4,-27+bob,8,9,light);
      px(ctx,-9,-29+bob,4,5,shine);px(ctx,5,-29+bob,4,5,shine);
      px(ctx,-7,-9+bob,4,3,dark);px(ctx,3,-9+bob,4,3,dark);
      px(ctx,-16,-4+bob,8,4,main);px(ctx,8,-4+bob,8,4,main);break;
    case "bamboo":
      px(ctx,-9,-14+bob,18,14,dark);px(ctx,-7,-19+bob,14,11,main);
      px(ctx,-4,-29+bob,4,13,light);px(ctx,2,-26+bob,4,10,main);
      px(ctx,-12,-24+bob,9,5,shine);px(ctx,4,-21+bob,10,5,shine);
      px(ctx,-3,-3+bob,6,4,dark);break;
    case "seedling":
      px(ctx,-11,-14+bob,22,14,dark);px(ctx,-8,-19+bob,16,11,main);
      px(ctx,-4,-26+bob,8,9,light);px(ctx,-15,-27+bob,12,6,shine);px(ctx,3,-29+bob,13,7,light);
      px(ctx,-4,-4+bob,8,4,dark);break;
    case "ember":
      px(ctx,-11,-15+bob,22,15,dark);px(ctx,-8,-20+bob,16,12,main);
      px(ctx,-6,-28+bob,12,10,light);px(ctx,-3,-35+bob,6,9,shine);
      px(ctx,-16,-14+bob,7,8,main);px(ctx,9,-14+bob,7,8,main);
      px(ctx,-4,-5+bob,8,3,shine);break;
    case "ice-pan":
      px(ctx,-13,-13+bob,26,13,dark);px(ctx,-10,-19+bob,20,11,main);
      px(ctx,-8,-25+bob,16,8,light);px(ctx,-5,-30+bob,10,5,shine);
      px(ctx,-18,-17+bob,6,12,light);px(ctx,12,-17+bob,6,12,light);
      px(ctx,-5,-3+bob,10,3,dark);break;
    case "shrimp":
      px(ctx,-13,-14+bob,24,13,main);px(ctx,-8,-21+bob,18,12,light);
      px(ctx,7,-18+bob,12,7,dark);px(ctx,12,-25+bob,5,11,main);
      px(ctx,-15,-12+bob,6,7,dark);px(ctx,-4,-29+bob,4,10,shine);
      px(ctx,-7,-3+bob,5,5,dark);px(ctx,1,-3+bob,5,5,dark);break;
    case "spin-leaf":
      px(ctx,-10,-14+bob,20,14,dark);px(ctx,-8,-19+bob,16,11,main);
      px(ctx,-3,-33+bob,6,18,light);px(ctx,-18,-27+bob,17,8,shine);
      px(ctx,2,-25+bob,17,8,light);px(ctx,-4,-4+bob,8,4,dark);break;
    case "toast":
      px(ctx,-12,-20+bob,24,20,dark);px(ctx,-9,-18+bob,18,15,main);
      px(ctx,-7,-23+bob,14,6,light);px(ctx,-5,-14+bob,4,3,shine);px(ctx,3,-14+bob,4,3,shine);
      px(ctx,-4,-7+bob,8,3,dark);px(ctx,-8,-1+bob,5,4,dark);px(ctx,4,-1+bob,5,4,dark);break;
    case "ghost":
      px(ctx,-12,-18+bob,24,18,main);px(ctx,-9,-26+bob,18,13,light);
      px(ctx,-6,-31+bob,12,7,shine);px(ctx,-12,-5+bob,6,8,main);px(ctx,-3,-4+bob,6,7,main);px(ctx,6,-5+bob,6,8,main);
      px(ctx,-6,-15+bob,3,4,dark);px(ctx,4,-15+bob,3,4,dark);break;
    case "crystal":
      px(ctx,-12,-12+bob,24,12,dark);px(ctx,-10,-20+bob,20,13,main);
      px(ctx,-7,-30+bob,14,12,light);px(ctx,-3,-35+bob,6,9,shine);
      px(ctx,-17,-13+bob,7,8,main);px(ctx,10,-13+bob,7,8,main);
      px(ctx,-3,-18+bob,3,9,shine);break;
    case "ring-ape":
      px(ctx,-12,-15+bob,24,15,dark);px(ctx,-9,-22+bob,18,15,main);
      px(ctx,-8,-29+bob,16,10,light);px(ctx,-15,-27+bob,8,9,dark);px(ctx,7,-27+bob,8,9,dark);
      px(ctx,-4,-6+bob,8,5,shine);px(ctx,-19,-14+bob,8,12,main);px(ctx,11,-14+bob,8,12,main);
      ctx.strokeStyle=shine;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-33+bob,8,Math.PI,Math.PI*2);ctx.stroke();break;
    default:
      px(ctx,-10,-15+bob,20,15,main);px(ctx,-8,-22+bob,16,10,light);
      px(ctx,-4,-30+bob,8,8,shine);break;
  }

  // Volto, riflessi e piccoli dettagli restano leggibili anche alla scala overworld.
  if(!["bread","stormbird","cloud-dancer","spell-scroll","arcane-book","ghost","crystal"].includes(shape)){
    px(ctx,-6,-14+bob,3,3,"#24232b");
    px(ctx,4,-14+bob,3,3,"#24232b");
    px(ctx,-2,-7+bob,5,2,dark);
  }
  px(ctx,-9,-3+bob,4,2,shine);
  px(ctx,5,-3+bob,4,2,shine);
  if(frame){px(ctx,-8,0,5,2,light);px(ctx,4,0,5,2,light);}
  ctx.restore();
}
