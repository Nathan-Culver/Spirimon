// Rewards belong to defeated individuals, not the last selected target.
export function battleRewards(battle,rank=1){
 const roster=battle.enemyRoster||[...(battle.multi?.enemies||[]),...(battle.multi?.reserves||[]),battle.enemy,...(battle.enemyTeam||[])];
 const seen=new Set(),defeated=[];
 for(const unit of roster){if(!unit||unit.hp>0||seen.has(unit.id||unit))continue;seen.add(unit.id||unit);defeated.push(unit);}
 const xp=defeated.reduce((sum,u)=>sum+Math.max(1,Math.ceil(u.level*(battle.trainer?35:24)/2)),0);
 const sealerXP=defeated.reduce((sum,u)=>sum+30+u.level*4,0);
 return {xp,sealerXP,coins:battle.trainer?defeated.length*(35+rank*12):0,defeated:defeated.length};
}

// Remainders go to the earliest recorded participants; the total never grows.
export function participantRewards(battle,spirits,total){
 let ids=[...new Set(battle.participants||[])].filter(id=>spirits.some(u=>u.id===id));
 if(!ids.length&&spirits.some(u=>u.id===battle.ally))ids=[battle.ally];
 return ids.map((id,n)=>({id,xp:Math.floor(total/ids.length)+(n<total%ids.length?1:0)}));
}
