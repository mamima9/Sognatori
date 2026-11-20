import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { ROSTER } from "@/lib/sognatoriData";
import { buyArabniteListing, cancelArabniteListing, getArabniteMarket, listArabniteCard, loadArabniteCollection } from "@/lib/arabniteCards";

const cardById = Object.fromEntries(ROSTER.map((card) => [card.id, card]));
const panelStyle = { marginTop: 14, padding: 12, borderRadius: 12, background: "linear-gradient(145deg,#292039,#171625)", border: "1px solid #d8b46b66", color: "#f2e4cc" };
const buttonStyle = { border: "1px solid #d8b46b", borderRadius: 8, padding: "7px 10px", background: "#59417a", color: "#fff3dc", fontWeight: 800, cursor: "pointer" };

export default function ArabniteOnlineMarket() {
  const { user, isAuthenticated } = useAuth();
  const [market, setMarket] = useState([]);
  const [owned, setOwned] = useState([]);
  const [prices, setPrices] = useState({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [coins, setCoins] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    const [collection, listings] = await Promise.all([loadArabniteCollection(), getArabniteMarket()]);
    setOwned(collection.cards);
    setCoins(collection.coins);
    setMarket(listings);
  }, [isAuthenticated]);

  useEffect(() => {
    refresh().catch((error) => setMessage(error.message || "Impossibile caricare il mercato."));
  }, [refresh]);

  const act = async (key, fn, success) => {
    setBusy(key); setMessage("");
    try { await fn(); await refresh(); setMessage(success); }
    catch (error) { setMessage(error.message || "Operazione non riuscita."); }
    finally { setBusy(""); }
  };

  if (!isAuthenticated) return <div style={panelStyle}><strong>MERCATO DI ARABNITE</strong><p style={{fontSize:12,color:"#d7c5a5"}}>Accedi al tuo profilo per consultare il mercato condiviso e gestire le tue carte numerate.</p></div>;

  return <section style={panelStyle}>
    <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <strong style={{color:"#f1cb7b",letterSpacing:1}}>MERCATO DI ARABNITE</strong>
      <span style={{fontSize:11,color:"#e9c58d"}}>{coins === null ? "…" : coins+" monete"}</span>
    </div>
    {message && <div role="status" style={{fontSize:11,marginTop:8,color:"#bfe8bf",overflowWrap:"anywhere"}}>{message}</div>}
    <div style={{fontSize:11,color:"#d7c5a5",margin:"10px 0 6px"}}>LE TUE CARTE NUMERATE</div>
    {owned.length===0 && <div style={{fontSize:11,color:"#bfae98"}}>Non possiedi ancora carte nel database condiviso.</div>}
    <div style={{display:"grid",gap:7}}>
      {owned.map((instance) => {
        const card=cardById[instance.card_id];
        if(!card)return null;
        const key=instance.id;
        return <div key={key} style={{display:"flex",alignItems:"center",gap:8,padding:"7px",borderRadius:9,background:"#ffffff0c"}}>
          <img src={card.img} alt={card.nome} style={{width:38,height:38,objectFit:"contain"}}/>
          <div style={{flex:1,minWidth:0}}><strong style={{fontSize:11}}>{card.nome}</strong><div style={{fontSize:9,color:"#d7c5a5"}}>#{String(instance.serial_number).padStart(3,"0")}</div></div>
          <input aria-label={"Prezzo per "+card.nome} type="number" min="1" value={prices[key]||""} onChange={(e)=>setPrices(v=>({...v,[key]:e.target.value}))} placeholder="Prezzo" style={{width:65,minWidth:0,padding:6,borderRadius:7,border:"1px solid #8d795e",background:"#211b2a",color:"#fff"}}/>
          <button disabled={busy===key||!Number(prices[key])} onClick={()=>act(key,()=>listArabniteCard(key,prices[key]),"Carta messa in vendita.")} style={{...buttonStyle,opacity:busy===key||!Number(prices[key])?.5:1,fontSize:9}}>Vendi</button>
        </div>;
      })}
    </div>
    <div style={{fontSize:11,color:"#d7c5a5",margin:"14px 0 6px"}}>OFFERTE DEI GIOCATORI</div>
    {market.length===0 && <div style={{fontSize:11,color:"#bfae98"}}>Nessuna carta in vendita al momento.</div>}
    <div style={{display:"grid",gap:7}}>
      {market.map((listing)=>{
        const instance=listing.sognatore_card_instances;
        const card=cardById[instance?.card_id];
        if(!card)return null;
        const mine=listing.seller_id===user?.id;
        return <div key={listing.id} style={{display:"flex",alignItems:"center",gap:8,padding:7,borderRadius:9,background:"#ffffff0c"}}>
          <img src={card.img} alt={card.nome} style={{width:38,height:38,objectFit:"contain"}}/>
          <div style={{flex:1,minWidth:0}}><strong style={{fontSize:11}}>{card.nome}</strong><div style={{fontSize:9,color:"#d7c5a5"}}>#{String(instance.serial_number).padStart(3,"0")} · {instance.rarity}</div></div>
          <strong style={{fontSize:11,color:"#f1cb7b"}}>{listing.price} ✦</strong>
          {mine ? <button disabled={busy===listing.id} onClick={()=>act(listing.id,()=>cancelArabniteListing(listing.id),"Annuncio ritirato.")} style={{...buttonStyle,fontSize:9}}>Ritira</button> : <button disabled={busy===listing.id} onClick={()=>act(listing.id,()=>buyArabniteListing(listing.id),"Acquisto completato.")} style={{...buttonStyle,fontSize:9}}>Compra</button>}
        </div>;
      })}
    </div>
    <button onClick={()=>refresh().catch(e=>setMessage(e.message))} style={{...buttonStyle,marginTop:10,width:"100%"}}>Aggiorna mercato</button>
  </section>;
}
