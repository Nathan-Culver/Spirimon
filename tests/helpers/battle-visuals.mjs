import {battlePose,BATTLE_EFFECT_MS} from '../../battle-sprite-animation.mjs';
import {screenEffects,prepareBattleEvents} from '../../battle-effects.mjs';
// App VM fixtures exercise routing independently of browser image loading.
export const battleVisuals={battlePose,BATTLE_EFFECT_MS,screenEffects,prepareBattleEvents,reducedBattleMotion:()=>false,
 drawIllustratedEffect(){},drawEmitter:()=>0,drawBattleFlash(){}};
