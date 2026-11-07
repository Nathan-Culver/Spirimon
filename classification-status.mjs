import {activeTypes,domainSources,canonicalDomain} from './classifications.mjs';
import {heldEquipment} from './equipment.mjs';
import {passiveEffects} from './classification-passives.mjs';
// Shared classification-based status rules. Values are relative modifiers.
export const STATUS_GROUPS={
 burn:'heat',frostbite:'cold',freeze:'cold',poison:'toxin',toxic:'toxin',
 paralysis:'shock',sleep:'mental',confusion:'mental',infatuation:'mental',
 nightmare:'mental',flinch:'control',slow:'control',trap:'control',
 leechSeed:'nature',curse:'spirit',perish:'spirit',disable:'control',taunt:'control'
};
const PROFILE={
 Elemental:{heat:-.5,cold:-.25,shock:-.25},
 Construct:{toxin:-.5,mental:-.5,spirit:.25},
 Undead:{toxin:-.5,mental:-.25,spirit:.25},
 Plant:{toxin:-.25,nature:-.5,heat:.5},
 Beast:{mental:.1,nature:-.1},
 Celestial:{spirit:-.5,mental:-.25},
 Fiend:{heat:-.25,spirit:-.25},
 Ooze:{toxin:-.25,control:-.25,shock:.25},
 Giant:{control:-.25},
 Aberration:{mental:-.25,spirit:.25},
 Fey:{mental:-.25,control:-.1},
 Monstrosity:{control:-.1},
 Life:{nature:-.5,toxin:-.25},
 Death:{spirit:-.5,nature:.25},
 Spirit:{spirit:-.5},
 Psionic:{mental:-.5},
 Nature:{nature:-.5,heat:.25},
 Storm:{shock:-.5},
 Void:{spirit:-.25,mental:-.25},
 Magic:{spirit:-.25},
 Fate:{control:-.25}
};
export const STATUS_PROFILE=PROFILE;
export const PERIODIC_RATES={burn:1/32,poison:1/32,toxic:1/96,frostbite:1/32,leechSeed:1/32,curse:1/48,trap:1/48,nightmare:1/24};
export function statusModifier(effect,sp={},ind={},mode='application'){
 const group=STATUS_GROUPS[effect]||effect;
 const sources=domainSources(sp,ind),innate=new Set(sources.innate);
 const suppressed=new Set([...(sp.suppressedDomains||[]),...(ind.suppressedDomains||[])].map(canonicalDomain));
 const acquired=new Set([...sources.equipped,...sources.temporary].filter(d=>!innate.has(d)&&!suppressed.has(d)));
 let amount=0;
 for(const t of activeTypes(sp,ind))amount+=(PROFILE[t]?.[group]||0);
 for(const d of innate)amount+=(PROFILE[d]?.[group]||0);
 if(mode!=='periodic')for(const d of acquired)amount+=(PROFILE[d]?.[group]||0)*.5;
 const passives=passiveEffects(sp,ind,{maxHp:ind.maxHp,statusGroup:group,weather:ind.battlefield?.weather});
 if(mode==='periodic')amount-=passives.periodicResistance||0;
 else amount-=passives.statusResistance||0;
 const held=heldEquipment(ind,sp),heldModifier=held?.statusModifiers?.[effect]??held?.statusModifiers?.[group]??0;if(Number.isFinite(heldModifier))amount+=heldModifier;
 for(const key of ['statusModifiers','passiveStatusModifiers','heldStatusModifiers','temporaryStatusModifiers']){
  const v=ind[key]?.[effect]??ind[key]?.[group]??0;
  if(typeof v==='number')amount+=v;
 }
 return amount;
}
export function statusChance(base,effect,sp,ind,options={}){
 const chance=Math.max(0,Math.min(1,Number(base)||0));
 if(options.ignoreResistance)return chance;
 const minimum=Math.max(0,Math.min(1,Number(options.minimumChance)||0));
 return Math.min(1,Math.max(minimum,chance*(1+statusModifier(effect,sp,ind,'application'))));
}
export function statusDuration(base,effect,sp,ind){
 // Apply relative resistance once; elapsed time is anchored separately.
 return Math.max(0,base*(1+statusModifier(effect,sp,ind,'duration')));
}
export function periodicDamage(base,effect,sp,ind){
 return Math.max(0,Math.round(base*(1+statusModifier(effect,sp,ind,'periodic'))));
}
export function rebaseStatusTimer(timer,now,effect,sp,ind){
 const original=timer.baseDuration??Math.max(0,timer.until-(timer.appliedAt??now));
 const appliedAt=timer.appliedAt??now;
 return {...timer,appliedAt,baseDuration:original,until:appliedAt+Math.max(0,statusDuration(original,effect,sp,ind))*(timer.durationFactor??1)};
}
