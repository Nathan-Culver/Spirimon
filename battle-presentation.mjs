// All offsets are derived from the home position, so motion never accumulates.
export function techniqueMotion(move,side,age,size=200){
 if(age<0||age>=600)return {x:0,y:0};
 const damaging=Number(move?.power)>0||['damage','drain','recoil','fixed'].includes(move?.effect);
 const direction=(side==='a'?1:-1)*(damaging?1:-1),distance=Math.min(38,size*.14);
 const travel=age<160?age/160:age<410?1:Math.max(0,1-(age-410)/190);
 const shake=age>=160&&age<410?Math.sin((age-160)*.095)*Math.min(5,size*.02):0;
 return {x:direction*distance*travel+shake,y:-direction*distance*.3*travel};
}
export function encounterMusic({battle=false,cave=false,interior=false,night=false,tile='path',offering=false}={}){
 return offering?'offering':battle||!interior&&(cave||night||tile==='grass'||tile==='water')?'battle':'map';
}
