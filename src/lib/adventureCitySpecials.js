// Elementi ambientali unici e interagibili delle undici città dell'Avventura.
export const ADVENTURE_CITY_SPECIALS = {
"demone": [{id:"braciere-antico",name:"Braciere delle Promesse",x:-285,y:-110,dialogue:"Le fiamme custodiscono i nomi di chi ha protetto Braciombra. Il fuoco non divora queste memorie: le tiene vive.",type:"fire"},{id:"campana-ferro",name:"Campana di Ferro",x:280,y:150,dialogue:"Quando la campana suona, ogni abitante ricorda una promessa fatta alla città.",type:"bell"} ],
"robot": [{id:"nucleo-memoria",name:"Nucleo di Memoria",x:-285,y:-120,dialogue:"Questo archivio conserva ricordi donati liberamente. Puoi ascoltarli, ma mai possederli.",type:"crystal"},{id:"binario-luce",name:"Binario Magnetico",x:270,y:160,dialogue:"Il binario trasporta energia tra i quartieri. Ogni impulso corrisponde a un ricordo condiviso.",type:"rail"} ],
"natura": [{id:"bosco-bambu",name:"Boschetto di Bambù",x:-285,y:-120,dialogue:"I bambù di Verdelume crescono seguendo il vento. Gli anziani li usano per costruire strumenti che non feriscono la foresta.",type:"bamboo"},{id:"quercia-antica",name:"Quercia delle Stagioni",x:270,y:150,dialogue:"Questa quercia ha visto nascere intere generazioni. Ogni anello del tronco custodisce una stagione della città.",type:"oak"} ],
"nuvola": [{id:"vela-celeste",name:"Vela della Grande Corrente",x:-285,y:-120,dialogue:"La vela cattura correnti invisibili e mantiene stabile l'isola. Il vento cambia quando cambia il cuore di chi lo ascolta.",type:"sail"},{id:"campana-vento",name:"Campana del Vento",x:270,y:150,dialogue:"Il suo suono attraversa le isole sospese e avvisa i viaggiatori quando una nuova corrente si apre.",type:"bell"} ],
"umano": [{id:"mercato-insegne",name:"Mercato degli Scambi",x:-285,y:-120,dialogue:"Qui non si paga con monete: si scambiano ore, abilità e storie. Ogni bancarella racconta un patto mantenuto.",type:"stall"},{id:"teatro-maschere",name:"Teatro delle Possibilità",x:270,y:150,dialogue:"Le maschere cambiano finale a ogni spettacolo. A Crocevia nessuna storia è obbligata a finire nello stesso modo.",type:"masks"} ],
"luce": [{id:"specchio-alba",name:"Specchio dell'Alba",x:-285,y:-120,dialogue:"Non riflette il volto: mostra una scelta che hai compiuto e che forse non hai ancora compreso.",type:"mirror"},{id:"obelisco-solare",name:"Obelisco Solare",x:270,y:150,dialogue:"L'obelisco raccoglie luce durante il giorno e la restituisce ai sentieri quando cala il buio.",type:"obelisk"} ],
"dolce": [{id:"giardino-caramelle",name:"Giardino delle Caramelle",x:-285,y:-120,dialogue:"Le caramelle cristallizzate crescono come fiori. Ogni colore rappresenta un gesto gentile compiuto dagli abitanti.",type:"candy"},{id:"fontana-nettare",name:"Fontana di Nettare",x:270,y:150,dialogue:"Il nettare conserva per un giorno un ricordo felice. Non serve a dimenticare il dolore, ma a trovare la forza di attraversarlo.",type:"fountain"} ],
"marino": [{id:"cascata-corallo",name:"Cascata dei Coralli",x:-285,y:-120,dialogue:"L'acqua scende da una vasca sopraelevata e alimenta i giardini di corallo. Ogni goccia porta con sé una voce del mare.",type:"waterfall"},{id:"conchiglia-madre",name:"Conchiglia Madre",x:270,y:150,dialogue:"Il battito della conchiglia regola le maree. Quando tace, gli abitanti si fermano ad ascoltare.",type:"shell"} ],
"orso": [{id:"totem-artiglio",name:"Totem degli Artigli",x:-285,y:-120,dialogue:"Il totem non celebra chi ha vinto una lotta, ma chi ha protetto il branco senza chiedere nulla in cambio.",type:"totem"},{id:"falò-vigilia",name:"Falò della Vigilia",x:270,y:150,dialogue:"La fiamma resta accesa per ogni viandante. Nessuno deve chiedere il permesso per scaldarsi a Zannaforte.",type:"fire"} ],
"mago": [{id:"portale-runico",name:"Arco Runico",x:-285,y:-120,dialogue:"Le rune cambiano ordine quando qualcuno formula una domanda sincera. La magia qui è una lingua da comprendere, non da temere.",type:"runes"},{id:"cristallo-etere",name:"Cristallo d'Etere",x:270,y:150,dialogue:"Il cristallo mostra possibilità che non si sono ancora verificate. Guardarlo troppo a lungo confonde il desiderio con il destino.",type:"crystal"} ],
"salato": [{id:"geyser-sale",name:"Geyser di Sale",x:-285,y:-120,dialogue:"Ogni eruzione deposita cristalli diversi. Gli studiosi li leggono come pagine lasciate dal mare antico.",type:"geyser"},{id:"obelisco-sale",name:"Obelisco di Cristallo",x:270,y:150,dialogue:"La luce attraversa i cristalli e si divide in colori inattesi: anche ciò che sembra uniforme contiene molte sfumature.",type:"obelisk"} ]
};

export function drawAdventureCitySpecials(ctx, faction, time = 0) {
  const cityId = ({Demone:"demone",Robot:"robot",Natura:"natura",Nuvola:"nuvola",Umano:"umano",Luce:"luce",Dolce:"dolce",Marino:"marino",Orso:"orso",Mago:"mago",Salato:"salato"})[faction];
  const items = ADVENTURE_CITY_SPECIALS[cityId] || [];
  for (const item of items) {
    const {x,y,type}=item;
    ctx.save(); ctx.translate(x,y); ctx.imageSmoothingEnabled=false;
    ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(4,19,34,10,0,0,Math.PI*2);ctx.fill();
    const block=(px,py,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(px,py,w,h);};
    const sparkle=(px,py)=>{block(px-2,py-7,4,14,"#fff4c2");block(px-7,py-2,14,4,"#fff4c2");};
    if(type==="bamboo"){
      for(let i=-2;i<=2;i++){const bx=i*12;block(bx-3,-48,6,68,"#386d43");block(bx-2,-42,2,53,"#a8d77b");for(let yy=-32;yy<12;yy+=17)block(bx-3,yy,6,2,"#c3e58a");block(bx-13,-28+(i%2)*13,12,4,"#6da957");block(bx+2,-16,12,4,"#8ac66a");}
    }else if(type==="oak"){
      block(-7,-4,14,29,"#60432e");block(-3,-1,5,24,"#a77a48");for(const [px,py,rx,ry,col] of [[-20,-30,22,20,"#245638"],[5,-42,27,25,"#347247"],[25,-26,21,19,"#43834d"],[0,-14,29,20,"#4b9252"]]){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(px,py,rx,ry,0,0,Math.PI*2);ctx.fill();}block(-15,-40,8,5,"#c5e58a");block(10,-52,9,5,"#d7e99a");
    }else if(type==="waterfall"){
      block(-31,-34,62,49,"#285a70");block(-25,-29,50,38,"#62b7c7");block(-17,-27,34,54,"#a8eced");block(-10,-21,9,49,"#e3ffff");block(7,-17,7,45,"#e3ffff");block(-39,14,78,8,"#317f91");block(-30,8,60,5,"#9be4e2");for(let i=0;i<5;i++){const yy=(time*36+i*13)%34;block(-18+(i%3)*15,yy-22,3,6,"#efffff");}
    }else if(type==="candy"){
      for(let i=0;i<5;i++){const bx=(i-2)*15;block(bx-6,-12,12,27,"#6b9b52");ctx.fillStyle=["#ff8fbd","#f8d66d","#9bd9f4","#d7a6f4","#ffb26d"][i];ctx.beginPath();ctx.arc(bx,-22-(i%2)*7,10,0,Math.PI*2);ctx.fill();block(bx-4,-36-(i%2)*7,8,8,"#fff0dc");}
      block(-35,16,70,5,"#a76c93");
    }else if(type==="fire"){
      block(-20,2,40,9,"#593c38");block(-13,-7,26,10,"#9b5845");ctx.fillStyle="#ff9c4d";ctx.beginPath();ctx.moveTo(0,-48-Math.sin(time*3)*3);ctx.lineTo(-15,-10);ctx.lineTo(13,-10);ctx.closePath();ctx.fill();ctx.fillStyle="#ffe18b";ctx.beginPath();ctx.moveTo(0,-31);ctx.lineTo(-6,-10);ctx.lineTo(6,-10);ctx.closePath();ctx.fill();
    }else if(type==="bell"){
      block(-4,-45,8,48,"#6c6472");ctx.fillStyle="#e8c77b";ctx.beginPath();ctx.arc(0,-23,19,Math.PI,0);ctx.lineTo(19,-3);ctx.lineTo(-19,-3);ctx.closePath();ctx.fill();block(-23,-5,46,5,"#a47c4c");block(-3,-2,6,9,"#fff0ba");
    }else if(type==="crystal"||type==="obelisk"||type==="geyser"){
      ctx.fillStyle=type==="geyser"?"#d8e2d7":type==="obelisk"?"#f7df91":"#a9e9ef";ctx.beginPath();ctx.moveTo(0,-55);ctx.lineTo(-22,8);ctx.lineTo(-8,18);ctx.lineTo(19,9);ctx.closePath();ctx.fill();block(-3,-38,5,40,"rgba(255,255,255,.5)");sparkle(0,-23);
    }else if(type==="rail"){
      block(-38,-8,76,14,"#284c5b");block(-34,-4,68,4,"#75d8d0");for(let i=0;i<6;i++)block(-31+i*12,8,4,7,"#a4c5bd");block(-7,-24,14,16,"#d7fff2");
    }else if(type==="sail"){
      block(-3,-42,6,67,"#7189a8");ctx.fillStyle="#f3f8ff";ctx.beginPath();ctx.moveTo(2,-38);ctx.lineTo(38,-10);ctx.lineTo(2,4);ctx.closePath();ctx.fill();ctx.fillStyle="#b8d9f5";ctx.beginPath();ctx.moveTo(-2,-30);ctx.lineTo(-31,-4);ctx.lineTo(-2,8);ctx.closePath();ctx.fill();block(-42,25,84,4,"#6f91b6");
    }else if(type==="stall"||type==="masks"){
      block(-35,-5,70,28,"#80583a");block(-40,-35,80,9,type==="stall"?"#d69a5f":"#8b6caa");block(-32,-26,64,20,type==="stall"?"#e5c18a":"#d4b7e9");if(type==="masks"){for(let i=-1;i<=1;i++){ctx.fillStyle="#f3d5a4";ctx.beginPath();ctx.arc(i*20,-16,8,0,Math.PI*2);ctx.fill();block(i*20-5,-14,3,3,"#4b354d");block(i*20+2,-14,3,3,"#4b354d");}}
    }else if(type==="mirror"){
      block(-25,-43,50,67,"#9a793f");block(-19,-37,38,55,"#f9e9ae");block(-14,-32,28,45,"#fff9d8");sparkle(0,-10);
    }else if(type==="fountain"){
      block(-35,5,70,13,"#8c6a9b");block(-29,-1,58,8,"#f0b5d5");block(-22,-10,44,9,"#d989b8");block(-3,-35,6,28,"#f6d6e8");block(-7,-38,14,7,"#fff0e6");for(let i=0;i<4;i++)block(-19+i*12,12,5,3,"#ffdc87");
    }else if(type==="shell"){
      ctx.fillStyle="#e6b7a4";ctx.beginPath();ctx.arc(0,-8,29,Math.PI,0);ctx.lineTo(29,13);ctx.lineTo(-29,13);ctx.closePath();ctx.fill();for(let i=-2;i<=2;i++){ctx.strokeStyle="#fff0d5";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(i*10,12);ctx.stroke();}
    }else if(type==="totem"){
      block(-19,-43,38,62,"#765333");block(-14,-37,28,16,"#c39860");block(-12,-15,24,23,"#d8b77e");block(-8,-31,5,5,"#392c27");block(4,-31,5,5,"#392c27");block(-5,-9,10,5,"#392c27");block(-26,-47,12,8,"#e4c68c");block(14,-47,12,8,"#e4c68c");
    }else if(type==="runes"){
      block(-4,-40,8,60,"#5d4b83");for(let i=0;i<4;i++){ctx.strokeStyle="#d5c3ff";ctx.lineWidth=3;ctx.strokeRect(-24+i*12,-30+i*8,14,14);}sparkle(0,-42);
    }
    // Piccola icona di interazione, senza coprire l'oggetto.
    ctx.fillStyle="rgba(5,12,18,.8)";ctx.fillRect(-24,31,48,14);ctx.fillStyle="#fff4df";ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.fillText("E · "+item.name.toUpperCase().slice(0,10),0,41,46);
    ctx.restore();
  }
}
