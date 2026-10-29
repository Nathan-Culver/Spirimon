// Visual selection only: terrain collision and saved coordinates remain in engine.mjs.
export const TERRAIN_SIZE=64;
export function groundCell(biome){return biome==='ash'?12:biome==='highland'?13:biome==='fen'?11:0;}
export function terrainCell(type,biome,seed,town=false){if(type==='path')return town?7:4+seed%2;if(type==='stairs')return 15;if(type==='water')return 8;if(type==='cliff')return 14;if(type==='flower'&&biome!=='ash')return 2;if(type==='forest'||type==='tree')return biome==='ash'?12:3;if(type==='grass'&&biome!=='ash'&&biome!=='fen')return 1;if(type==='guild'||type==='house')return 6;return groundCell(biome);}
export function connectedEdges(type,neighbors){const family=t=>type==='path'||type==='stairs'?['path','stairs'].includes(t):t===type;return neighbors.reduce((mask,t,n)=>mask|(family(t)?1<<n:0),0);}
