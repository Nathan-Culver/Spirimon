import {BATTLE_BACK_FRAMES} from './battle-back-frames.mjs';
import {ROSTER} from './roster.mjs';
const v6="aurelattice bronzewade jarjell resonara silkclasp wickerstride fumepitcher jianglume embermoth kelpveil obsidhorn quillclaw runemoth xyloveil berylhorn eldermoth kestrelveil lichenwing opalhorn quartzclaw rimemoth zirconveil basilgore fableroot harborgaze lotusgore mistralwisp onyxflare petalroot quasarshard talonplume xanthjaw brackengaze coralfang gossamerwisp isletflare kryptonshard miragefang oraclekin pewtergore ripplejaw truffleroot".split(' '),v5="dewveil tempestrill vitrilisk strangleweld hollowbloom thornglen umberbloom vesperspire ashenling indigospire junipermaw verdantbloom wraithspire jasperplume hearthjaw zodiacplume".split(' ');
export const BATTLE_BACK_ART=Object.freeze(Object.fromEntries(ROSTER.map(({id})=>[id,'./assets/battle-back/'+id+'.webp'])));
export function rearReferenceAtlas(id){
 const suffix=v6.includes(id)?'-v6':v5.includes(id)?'-v5':['jarjell','torrentreed','cinerwraith','glasswhorl'].includes(id)?'':['kilnwarden','lacquertor'].includes(id)?'-v3':'-v4';
 return './assets/roster/'+id+suffix+'.webp';
}
export function battleBackSource(species,form=0){
 if(!species)return null;
 const single=species.battleBackSprites?.[form];
 if(single)return {source:single,atlas:false,form:0};
 const id=String(species.id||'').replace(/^roster-/,'');
 const index=Math.max(0,Math.min(2,Math.trunc(Number(form)||0)));
 if(!species.battleBackAtlas&&species.atlas!==rearReferenceAtlas(id)){
  const row=ROSTER.find(r=>r.id===id);
  if(species.atlas!==row?.atlas||!Array.isArray(row?.updatedForms))return null;
  // The approved PDF supplies front views only. Use those exact illustrations
  // for changed forms instead of showing a rear from a rejected body design.
  if(row.updatedForms?.includes(index+1))return {source:row.atlas,atlas:true,form:index,frame:[index*256,0,256,256]};
 }
 const source=species.battleBackAtlas||BATTLE_BACK_ART[id];
 if(!source)return null;
 const frame=species.battleBackFrames?.[index]||(source===BATTLE_BACK_ART[id]?BATTLE_BACK_FRAMES[id]?.[index]:null);
 return {source,atlas:true,form:index,...(frame?{frame}:{} )};
}
