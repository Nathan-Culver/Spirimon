export const DIFFICULTIES={
 normal:{name:'Normal',player:{health:1,damage:1},enemy:{health:1,damage:1},shrines:'classic'},
 hard:{name:'Hard',player:{health:.5,damage:1.25},enemy:{health:.5,damage:1.25},shrines:'sparse'},
 easy:{name:'Easy',player:{health:2,damage:1.25},enemy:{health:.5,damage:.75},shrines:'one'}
};
let worldDifficulty='normal';
export const difficultyKey=value=>Object.hasOwn(DIFFICULTIES,value)?value:'normal';
export function setWorldDifficulty(value){worldDifficulty=difficultyKey(value);return worldDifficulty;}
export const currentDifficulty=()=>worldDifficulty;
export function difficultyFactor(unit,kind){return DIFFICULTIES[difficultyKey(unit?.difficulty)][unit?.difficultySide==='player'?'player':'enemy'][kind]||1;}
export function bindDifficulty(unit,mode,side){unit.difficulty=difficultyKey(mode);unit.difficultySide=side==='player'?'player':'enemy';return unit;}
export function difficultyDescription(mode){const p=DIFFICULTIES[difficultyKey(mode)],f=n=>n+'×';return p.name+': your Spirimon '+f(p.player.health)+' Health / '+f(p.player.damage)+' damage; enemy Spirimon '+f(p.enemy.health)+' Health / '+f(p.enemy.damage)+' damage. '+({classic:'Classic Shrine density (two per town, two or three per route).',sparse:'Sparse Shrines, at most one per town or route.',one:'One Shrine per town or route, at most one across a city.'})[p.shrines];}
