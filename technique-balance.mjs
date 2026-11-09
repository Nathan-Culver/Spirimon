// One policy for authored, discovered, generated and saved Spirimon Techniques.
// Power is a relative potency. Level belongs in battle stats/damage, never in
// a second set of Technique tiers that would compound that growth.
export const TECHNIQUE_BALANCE_REVISION=1;
export const TECHNIQUE_HEALING={heal:.25,teamHeal:.18,fullheal:.60,rest:.65};
export const SECONDARY_EFFECT_CHANCE=.3;
export function expectedTechniqueHits(move){return move.effect==='multiHit'?3.5:move.effect==='doubleHit'?2:1;}
export function levelDamageBase(level=1){return 10+2.25*Math.max(1,Number(level)||1);}
const conditional=new Set(['weatherStrike','sunStrike','sandStrike','snowStrike','terrainStrike','electricStrike','psychicStrike','mistStrike','hexStrike','venomStrike','unburdened','revenge','partyStrike']);
const afflictions=new Set(['sleep','freeze','flinch','paralysis','confusion','infatuation','poison','burn','toxic','frostbite','curse','leechSeed','nightmare','trap','slow','disable','taunt']);
export function techniquePower(move){
 const raw=Math.max(0,Number(move.unbalancedPower??move.realTimeBasePower??move.power)||0);
 if(!raw)return 0;
 const hits=expectedTechniqueHits(move),effect=move.effect;
 // Compress the old 15–150 range. Early quick attacks retain a useful role;
 // finishers gain burst, rather than several times the opening damage.
 let total=Math.min(90,26+.44*raw*hits);
 if(effect==='sleepStrike')total*=1.25; // Requires a separate sleep setup.
 else if(conditional.has(effect))total*=.74;
 else if(/^boost|^lower/.test(effect||''))total*=.78;
 else if(effect==='drain')total*=.82;
 else if(afflictions.has(effect))total*=.88;
 else if(['breakWard','critical','sureHit'].includes(effect))total*=.94;
 else if(effect==='omniBoost')total*=.92;
 else if(['recoil','recharge','selfDebuff','twoTurn','chargeSun'].includes(effect))total*=1.06;
 if(move.target==='allOpponents')total*=.72;
 // Fractional per-hit potency avoids changing the budget when a volley is split.
 return hits===1?Math.round(Math.min(90,total)):Math.round(Math.min(90,total)/hits*100)/100;
}
export function applyTechniqueBalance(move){
 if(!move||move.balanceRevision===TECHNIQUE_BALANCE_REVISION)return move;
 move.unbalancedPower=Math.max(0,Number(move.realTimeBasePower??move.power)||0);
 move.power=techniquePower(move);move.balanceRevision=TECHNIQUE_BALANCE_REVISION;
 delete move.realTimeBasePower;delete move.realTimeProfile;
 // Authored signature recasts previously made ordinary attacks obsolete.
 // Give them the same potency/effect budget as the rest of the catalog.
 if(move.techniqueSource&&move.cooldownMs!=null){move.unbalancedCooldownMs=move.cooldownMs;delete move.cooldownMs;}
 // A damaging buff still attacks the enemy and then strengthens its user.
 if(move.power>0&&move.target==='self')move.target='opponent';
 return move;
}
export function balancedTechnique(move){return move?.balanceRevision===TECHNIQUE_BALANCE_REVISION?move:applyTechniqueBalance({...move});}
export function secondaryEffectWork(effect){
 if(/^boost|^lower/.test(effect||''))return 65; // guaranteed one-stage change
 if(conditional.has(effect))return 25;
 if(effect==='drain')return 35;
 if(effect==='critical')return 18;if(effect==='sureHit')return 12;
 if(effect==='breakWard'||effect==='priority')return 25;
 if(effect==='omniBoost')return 30;
 if(afflictions.has(effect))return ['sleep','freeze','paralysis'].includes(effect)?45:25;
 return 0;
}

// Retain sub-HP work between pulses: neither zero-effect poison nor one free HP
// per pulse at level 1. The remainder is saved with the individual.
export function accumulateTechniqueFraction(ind,key,amount){
 const fractions=ind.techniqueFractions??={};
 const total=Math.max(0,Number(amount)||0)+(fractions[key]||0),whole=Math.floor(total+1e-9);
 fractions[key]=Math.max(0,total-whole);return whole;
}
