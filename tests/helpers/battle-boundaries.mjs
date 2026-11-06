import {createBattleSession} from '../../battle-session.mjs';
import {createBattleView} from '../../battle-view.mjs';

// Exercise the real modules while small application callbacks remain in the VM.
export function installBattleBoundaries(h){
 const call=name=>(...args)=>h[name](...args);
 h.battleSession=createBattleSession({getBattle:()=>h.battle,getState:()=>h.s,party:call('party'),spOf:call('spOf'),persistentEnemySealer:call('persistentEnemySealer')});
 h.battleView=createBattleView({getBattle:()=>h.battle,getState:()=>h.s,getMode:()=>h.battleMode||'main',realTimeContext:call('realTimeContext'),spOf:call('spOf'),battleMoves:call('battleMoves'),sealButtonHTML:()=>h.sealButtonHTML?.()||'',xpHTML:u=>h.xpHTML?.(u)||'',party:call('party'),activeBattleAlly:call('activeBattleAlly'),esc:h.esc||String,action:h.action||((name,label)=>'<button data-action="'+name+'">'+label+'</button>')});
 return h;
}
