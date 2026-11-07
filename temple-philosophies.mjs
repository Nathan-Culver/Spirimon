import {guardPosition} from './npc-dialogue.mjs';
import {spiritualHash} from './spiritual-core.mjs';
export const TEMPLE_PHILOSOPHIES=['Attrition','Counterplay','Tempo','Resilience','Control','Transformation','Synergy','Prediction'];
export const PHILOSOPHY_RULES={
 Attrition:{puzzle:'Close three miasma vents; exposed channels drain Stamina and Willpower.',combat:'Defenders favor lingering afflictions, draining attacks and recovery. Their Sealer sustains Willpower and healing.',effects:['poison','toxic','burn','leechSeed','curse','drain','regenerate'],specialty:'Guardian'},
 Counterplay:{puzzle:'Read each projected attack and activate its opposing mirror.',combat:'Defenders react with counters, wards and interruption. Their Sealer favors wards, Reprise and mental relief.',effects:['counter','mirrorCoat','ward','protect','disable','flinch'],specialty:'Mystic'},
 Tempo:{puzzle:'Activate three beat seals in order within 60 active seconds; a timeout resets the sequence.',combat:'Defenders favor Agile, priority, Speed control and short casts. Their Sealer favors Quickening and Reprise.',effects:['priority','boostSpeed','slow','paralysis'],specialty:'Sprinter'},
 Resilience:{puzzle:'Brace three supports to stabilize their marked tremor zones.',combat:'Defenders favor protective screens, regeneration and healing. Their Sealer prioritizes healing and protection.',effects:['heal','regenerate','ward','reflect','lightscreen','teamWard'],specialty:'Guardian'},
 Control:{puzzle:'Use the switches to match the inscribed lamp pattern to open the exit seal and shortcuts.',combat:'Defenders favor binding, silencing, disabling and removing advantages. Their Sealer favors Reprise and Quickening.',effects:['trap','taunt','disable','sleep','haze','lowerSpeed'],specialty:'Mystic'},
 Transformation:{puzzle:'Turn the form regulator and bind each seal in its matching phase.',combat:'Defenders begin in Form I and transform at 75% and 35% Health, retaining percentages and Techniques. Their Sealer favors Resonance and healing.',effects:['boostMight','boostPower','omniBoost','swapStats','invertStats'],specialty:'Striker'},
 Synergy:{puzzle:'Link all three pairs of resonance wells. Each pair requires visiting both physical wells.',combat:'Defenders favor team wards, team healing and coordinated support. Their Sealer favors Soulbridge and cooperation, with emergency healing first.',effects:['teamHeal','teamWard','partyCleanse','reflect','lightscreen','partyStrike'],specialty:'Guardian'},
 Prediction:{puzzle:'Observe the repeating five-symbol pattern and activate its predicted answer; solve three patterns.',combat:'Defenders favor precise attacks and punish already exposed targets. Their Sealer favors Sanctuary and Resonance.',effects:['sureHit','focus','critical','delayedStrike','revenge'],specialty:'Mystic'}
};
export const PHILOSOPHY_SUPPORT={
 Attrition:['willpower','heal','guard','cleanse','empower','shield','revive'],
 Counterplay:['shield','cooldown','calm','guard','cleanse','heal','revive'],
 Tempo:['haste','cooldown','empower','heal','willpower','shield','revive'],
 Resilience:['heal','shield','guard','cleanse','calm','willpower','revive'],
 Control:['cooldown','haste','guard','empower','cleanse','heal','revive'],
 Transformation:['empower','heal','guard','haste','cleanse','shield','revive'],
 Synergy:['link','shield','heal','guard','calm','empower','revive'],
 Prediction:['immunity','empower','haste','calm','heal','shield','revive']
};
const POSITIONS=[[4,5],[12,5],[20,13]],SYMBOLS=['Root','Moon','Star'],COUNTERS=['Wave','Root','Stone'],ATTACKS=['Flame','Wave','Wind'];
const plan=room=>TEMPLE_PHILOSOPHIES.includes(room.philosophy)?room.philosophy:'Attrition';
const key=room=>room.id+'|'+room.level;
export function trialState(save,room){
 save.dungeonState??={};const s=save.dungeonState[key(room)]??={};
 if(s.trialRevision!==2){Object.assign(s,{trialRevision:2,observed:false,progress:0,completed:[],pairs:[],mask:0,phase:0,mistakes:0,deadline:0,solved:false,victory:false});}
 if(plan(room)==='Tempo'&&!s.solved&&s.deadline&&(save.sealer?.clockMs||0)>=s.deadline){s.progress=0;s.deadline=0;s.timeouts=(s.timeouts||0)+1;}
 return s;
}
function seed(room){return spiritualHash(room.templeSeed||room.id,room.level,plan(room));}
const layouts=new Map();
export function trialLayout(room){
 const cacheKey=[room.id,room.level,room.philosophy,room.templeSeed].join('|');if(layouts.has(cacheKey))return layouts.get(cacheKey);
 const remember=layout=>{if(layouts.size>=96)layouts.delete(layouts.keys().next().value);layouts.set(cacheKey,layout);return layout;};
 const width=25,height=19,grid=Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>!x||!y||x===width-1||y===height-1?'wall':'floor'));
 for(const x of [8,16])for(let y=2;y<17;y++)if(![5,13].includes(y))grid[y][x]='wall';
 grid[1][1]='up';grid[17][23]='down';
 const map={width,height,grid,exits:[{x:1,y:1,kind:'up'},{x:23,y:17,kind:'down'}]},features=[];
 if(room.level>=3){features.push({id:'temple-opponent',kind:room.level===5?'temple-master':'temple-guard',name:room.level===5?'Temple Master':plan(room)+' disciple',x:21,y:13});return remember({map,features,objects:[],secret:null});}
 features.push({id:'temple-inscription',kind:'temple-inscription',name:plan(room)+' trial inscription',x:3,y:3},{id:'temple-reset',kind:'temple-reset',name:'Trial reset counterweight',x:2,y:2});
 const p=plan(room),kind={Attrition:'vent',Counterplay:'mirror',Tempo:'beat',Resilience:'brace',Control:'switch',Transformation:'form',Synergy:'chord',Prediction:'answer'}[p];
 POSITIONS.forEach(([x,y],order)=>features.push({id:'temple-node-'+order,kind:'temple-'+kind,name:p==='Counterplay'?COUNTERS[order]+' mirror':p==='Transformation'?'Form '+(order+1)+' seal':p==='Attrition'?'Miasma vent '+(order+1):p==='Resilience'?'Support brace '+(order+1):SYMBOLS[order]+' '+kind,x,y,order}));
 if(p==='Transformation')features.push({id:'temple-phase',kind:'temple-phase',name:'Form regulator',x:11,y:14});
 if(p==='Attrition'||p==='Resilience')[[6,5],[14,5],[18,13]].forEach(([x,y],order)=>features.push({id:'temple-hazard-'+order,kind:'temple-hazard',name:p==='Attrition'?'Miasma channel':'Tremor zone',x,y,order}));
 return remember({map,features,objects:[{id:'trial-push',kind:'push',x:6,y:8},{id:'trial-cleave',kind:'cleave',x:14,y:8},{id:'trial-crush',kind:'crush',x:19,y:11}],secret:null});
}
export function trialMap(save,room,base=trialLayout(room).map){
 if(room.level>=3)return base;const s=trialState(save,room),p=plan(room);if(!['Control','Transformation'].includes(p))return base;
 const grid=base.grid.map(row=>[...row]);
 if(p==='Control'){if(!(s.mask&1))grid[5][8]='wall';if(!(s.mask&2))grid[13][16]='wall';}
 else{if(s.phase===0)grid[5][8]='wall';if(s.phase===1)grid[13][16]='wall';if(s.phase===2)grid[13][8]='wall';}
 return {...base,grid};
}
function order(room){const offset=seed(room)%3;return [offset,(offset+1)%3,(offset+2)%3];}
export function trialClue(save,room){
 const s=trialState(save,room),p=plan(room),o=order(room);
 if(p==='Counterplay')return 'Projection '+(s.progress+1)+'/3: '+ATTACKS[o[s.progress%3]]+'. Oppositions: Flame → Wave, Wave → Root, Wind → Stone.';
 if(p==='Tempo')return 'Beat order: '+o.map(n=>SYMBOLS[n]).join(' → ')+'. Sixty active seconds from the first seal.';
 if(p==='Control'){const target=[1,2,7][seed(room)%3];return 'Target lamps Root / Moon / Star: '+[1,2,4].map(bit=>target&bit?'ON':'OFF').join(' / ')+'. Root flips Root+Moon; Moon flips Moon+Star; Star flips Star.';}
 if(p==='Transformation')return 'Bind Form I in phase 1, Form II in phase 2, and Form III in phase 3. The regulator cycles phases.';
 if(p==='Synergy')return 'Link Root–Moon, Moon–Star, and Star–Root. Visit one well, then the other. No specific team or field capability is required.';
 if(p==='Prediction'){const shift=(seed(room)+s.progress)%3,pattern=[0,1,2,0,1].map(n=>SYMBOLS[(shift+n)%3]);return 'Pattern '+(s.progress+1)+'/3: '+pattern.join(' → ')+' → ?';}
 return PHILOSOPHY_RULES[p].puzzle;
}
export function trialObjective(save,room){
 const s=trialState(save,room);if(room.level>=3)return s.victory?'Defender overcome. Reach the stairs.':'Approach the '+(room.level===5?'Master':'disciple')+' and interact to battle. '+PHILOSOPHY_RULES[plan(room)].combat;
 if(s.solved)return 'Trial complete. The stair seal is open.';
 if(!s.observed)return 'Read the physical '+plan(room)+' inscription. '+PHILOSOPHY_RULES[plan(room)].puzzle;
 const p=plan(room);if(p==='Synergy')return 'Linked resonance pairs: '+s.pairs.length+'/3.';
 if(p==='Transformation')return 'Regulator phase '+(s.phase+1)+' · Bound forms '+s.completed.length+'/3.';
 if(p==='Control')return 'Current lamps: '+[1,2,4].map(bit=>s.mask&bit?'ON':'OFF').join(' / ')+'. '+trialClue(save,room);
 if(p==='Tempo')return (s.timeouts&&!s.progress?'Beat window expired. Restart at the first seal. ':'')+'Beats '+s.progress+'/3'+(s.deadline?' · '+Math.max(0,Math.ceil((s.deadline-(save.sealer?.clockMs||0))/1000))+'s remaining':'')+'. '+trialClue(save,room);
 return (['Attrition','Resilience'].includes(p)?s.completed.length:s.progress)+'/3 · '+trialClue(save,room);
}
function nearby(room,f){return Math.abs(room.x-f.x)+Math.abs(room.y-f.y)<=1;}
export function interactTrial(save,room,feature){
 const actual=guardPosition(save,room,trialLayout(room).features.find(f=>f.id===feature?.id));if(save.cave?.id!==room.id||save.cave.level!==room.level||!actual||!nearby(save.cave,actual))return {ok:false,message:'Approach the trial mechanism before interacting.'};
 const s=trialState(save,room),p=plan(room),n=actual.order;
 if(actual.kind==='temple-inscription'){s.observed=true;return {ok:true,message:trialClue(save,room)};}
 if(actual.kind==='temple-reset'){if(!s.solved)Object.assign(s,{progress:0,completed:[],pairs:[],mask:0,phase:0,linkStart:null,deadline:0});return {ok:true,message:s.solved?'The completed trial remains open.':'The mechanisms reset. '+trialClue(save,room)};}
 if(actual.kind==='temple-guard'||actual.kind==='temple-master')return {ok:true,battle:!s.victory,message:s.victory?'This defender has already been overcome.':'The defender accepts your challenge.'};
 if(actual.kind==='temple-hazard')return {ok:true,message:s.completed.includes(n)?'This channel is safe.':PHILOSOPHY_RULES[p].puzzle};
 if(s.solved)return {ok:true,message:'The trial is complete.'};if(!s.observed)return {ok:false,message:'Read the inscription before operating the trial.'};
 if(actual.kind==='temple-phase'){s.phase=(s.phase+1)%3;return {ok:true,message:'The physical channels shift to phase '+(s.phase+1)+'.'};}
 let correct=true;
 if(['Attrition','Resilience'].includes(p)){if(!s.completed.includes(n))s.completed.push(n);s.solved=s.completed.length===3;}
 if(p==='Counterplay'||p==='Tempo'){
  const now=save.sealer?.clockMs||0;if(p==='Tempo'&&s.deadline&&now>s.deadline){s.progress=0;s.deadline=0;}
  correct=n===order(room)[s.progress];if(correct){if(p==='Tempo'&&!s.progress)s.deadline=now+60000;s.progress++;s.solved=s.progress===3;}else{s.progress=0;s.deadline=0;}
 }
 if(p==='Control'){s.mask^=[3,6,4][n];s.solved=s.mask===[1,2,7][seed(room)%3];}
 if(p==='Transformation'){correct=n===s.phase;if(correct&&!s.completed.includes(n))s.completed.push(n);s.solved=s.completed.length===3;}
 if(p==='Synergy'){if(s.linkStart==null)s.linkStart=n;else if(s.linkStart!==n){const pair=[s.linkStart,n].sort().join('-');if(!s.pairs.includes(pair))s.pairs.push(pair);s.linkStart=null;}s.solved=s.pairs.length===3;}
 if(p==='Prediction'){correct=n===(seed(room)+s.progress+2)%3;if(correct){s.progress++;s.solved=s.progress===3;}}
 if(!correct)s.mistakes=Math.min(3,s.mistakes+1);
 return {ok:true,message:(s.solved?'The '+p+' trial opens its stair seal.':correct?trialObjective(save,room):'The mechanism rejects that response. Misreads strengthen later defenders by up to two levels. '+trialClue(save,room))};
}
export function trialStep(save,room,lead,maxHp){
 if(room.level>=3)return null;const s=trialState(save,room),hazard=trialLayout(room).features.find(f=>f.kind==='temple-hazard'&&f.x===room.x&&f.y===room.y);if(!hazard||s.completed.includes(hazard.order)||!lead||lead.hp<=0)return null;
 if(plan(room)==='Attrition'){lead.pp=Math.max(0,(lead.pp||0)-1);lead.willpower=Math.max(0,(lead.willpower||0)-1);return 'Miasma drains 1 Stamina and 1 Willpower. Close the physical vent or take another path.';}
 if(plan(room)==='Resilience'){const loss=Math.min(lead.hp-1,Math.max(1,Math.floor(maxHp*.05)));lead.hp-=Math.max(0,loss);return 'An unbraced tremor costs '+Math.max(0,loss)+' Health. Brace its support or use the safe route.';}return null;
}
export function canAdvanceTrial(save,room){const s=trialState(save,room);return room.level<3?s.solved:s.victory;}
export function recordTrialVictory(save,kind,id){const room=save.cave;if(!room?.temple)return;const valid=kind==='clan'&&id===room.temple&&room.level===5||kind==='temple-trainer'&&id===room.temple+'|'+room.level&&[3,4].includes(room.level);if(valid)trialState(save,room).victory=true;}
export function trialMistakes(save,room){let total=0;for(let level=0;level<3;level++)total+=trialState(save,{...room,level}).mistakes;return Math.min(2,total);}
export function trialSprite(feature,state){
 if(feature.kind==='temple-inscription')return 'tablet';if(feature.kind==='temple-reset')return 'lever-up';if(feature.kind==='temple-phase')return 'rune-violet';if(feature.kind==='temple-hazard')return state.completed.includes(feature.order)?'rubble':'torch';
 return state.completed.includes(feature.order)||state.mask&(1<<feature.order)?'rune-blue':['rune-amber','rune-blue','rune-violet'][feature.order||0];
}
export function philosophyMoveWeight(philosophy,move,{actor={},target={},style='normal',allies=[],targetMaxHp=0}={}){
 const p=PHILOSOPHY_RULES[philosophy];if(!p)return 0;let weight=p.effects.includes(move.effect)?20:0;
 if(philosophy==='Tempo'){if(style==='agile')weight+=9;if((move.power||0)>85)weight-=8;}
 if(philosophy==='Counterplay'&&target.lastMove&&['counter','mirrorCoat','ward','protect'].includes(move.effect))weight+=12;
 if(philosophy==='Synergy'&&allies.filter(u=>u.hp>0).length>=2&&['teamHeal','teamWard','partyStrike','partyCleanse'].includes(move.effect))weight+=20;
 if(philosophy==='Prediction'&&(target.status||targetMaxHp>0&&target.hp<targetMaxHp*.5)&&['sureHit','critical','delayedStrike'].includes(move.effect))weight+=10;
 if(philosophy==='Transformation'&&actor.form>0&&style==='strong')weight+=8;
 return weight;
}
export function transformTempleCombatant(u,sp,stats,normalizeResources){
 if(u.battlePhilosophy!=='Transformation'||u.hp<=0)return false;const before=stats(u,sp),ratio=u.hp/before.hp,next=ratio<=.35?2:ratio<=.75?1:0;if(next<=u.form)return false;
 const pools={pp:before.pp?(u.pp||0)/before.pp:0,willpower:before.willpower?(u.willpower||0)/before.willpower:0};u.form=u.appearance=next;const after=stats(u,sp);u.hp=Math.max(1,Math.round(after.hp*ratio));u.pp=Math.floor(after.pp*pools.pp);u.willpower=Math.floor(after.willpower*pools.willpower);u.resourceCaps={pp:after.pp,willpower:after.willpower};normalizeResources(u,sp);return true;
}
