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
 Fire:{heat:-.5,cold:.25},
 Ice:{cold:-.5,heat:.25},
 Water:{heat:-.25},
 Lightning:{shock:-.5},
 Earth:{shock:-.25,control:-.25}
};
export const STATUS_PROFILE=PROFILE;
export const PERIODIC_RATES={burn:1/32,poison:1/32,toxic:1/96,frostbite:1/32,leechSeed:1/32,curse:1/48,trap:1/48,nightmare:1/24};
export function statusModifier(effect,sp={},ind={},mode='application'){
 const group=STATUS_GROUPS[effect]||effect;
 const innate=new Set((sp.domains||[]).filter(d=>!(ind.suppressedDomains||[]).includes(d)));
 const acquired=new Set((ind.acquiredDomains||[]).filter(d=>!innate.has(d)&&!(ind.suppressedDomains||[]).includes(d)));
 let amount=0;
 for(const t of new Set([sp.base,sp.alter]))if(t&&!(ind.suppressedTypes||[]).includes(t))amount+=(PROFILE[t]?.[group]||0);
 for(const d of innate)amount+=(PROFILE[d]?.[group]||0);
 if(mode!=='periodic')for(const d of acquired)amount+=(PROFILE[d]?.[group]||0)*.5;
 for(const key of ['statusModifiers','passiveStatusModifiers','heldStatusModifiers','temporaryStatusModifiers']){
  const v=ind[key]?.[effect]??ind[key]?.[group]??0;
  if(typeof v==='number')amount+=v;
 }
 return amount;
}
export function statusChance(base,effect,sp,ind,options={}){
 if(options.ignoreResistance)return Math.max(0,Math.min(1,base));
 return Math.max(options.minimumChance||0,Math.min(1,Math.max(0,base*(1+statusModifier(effect,sp,ind,'application')))));
}
export function statusDuration(base,effect,sp,ind){
 // Duration uses the agreed larger relative magnitudes: 25%, 50%, 75%.
 const modifier=statusModifier(effect,sp,ind,'duration');
 const adjusted=modifier===0?0:Math.sign(modifier)*Math.min(.75,Math.abs(modifier)*2.5);
 return Math.max(0,base*(1+adjusted));
}
export function periodicDamage(base,effect,sp,ind){
 return Math.max(0,Math.round(base*(1+statusModifier(effect,sp,ind,'periodic'))));
}
export function rebaseStatusTimer(timer,now,effect,sp,ind){
 const original=timer.baseDuration??Math.max(0,timer.until-(timer.appliedAt??now));
 const elapsed=Math.max(0,now-(timer.appliedAt??now));
 return {...timer,baseDuration:original,until:now+Math.max(0,statusDuration(original,effect,sp,ind)-elapsed)};
}
