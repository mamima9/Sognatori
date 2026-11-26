// Tactical rules for City XIV cooperative mode
export const getAdventureStats=(s,training=0,buffs={})=>({att:Math.max(1,(s?.att||1)+training+(buffs.att||0)),dif:Math.max(1,(s?.dif||1)+(buffs.dif||0)),vel:Math.max(1,(s?.vel||1)+(buffs.vel||0))});
export const calculateAdventureDamage=(attacker,training=0,buffs={},area=false)=>{const s=getAdventureStats(attacker,training,buffs);let damage=Math.max(2,Math.round(s.att*.65+s.vel*.15-s.dif*.08));return area?Math.max(2,Math.floor(damage*.65)):damage;};
export const mitigateAdventureDamage=(target,rawDamage,guard=false)=>{const s=getAdventureStats(target.active,target.train,target.buff);let damage=Math.max(1,rawDamage-Math.floor(s.dif/5));return guard?Math.ceil(damage/2):damage;};
export const applyAdventureStatus=(statuses,status)=>[...new Set([...(statuses||[]),status])];
export const clearRecoverableStatuses=statuses=>(statuses||[]).filter(s=>s!=="Abbiocco"&&s!=="Assetato");
