export const TOWN_LAYOUT=[
{kind:'hall',name:'Sealer Hall',x:19,y:11,w:5,h:4,dx:3},
{kind:'inn',name:'Lantern Inn',x:28,y:12,w:4,h:3,dx:2},
{kind:'home',name:'Village House',x:29,y:22,w:4,h:3,dx:2},
{kind:'forge',name:'Ember Forge',x:12,y:21,w:4,h:4,dx:2},
{kind:'herbalist',name:'Willow Herbalist',x:14,y:5,w:4,h:4,dx:2},
{kind:'archive',name:'Jade Scroll Archive',x:32,y:5,w:5,h:4,dx:3}
];
export const TOWN_FEATURES=[
{x:11,y:23,cell:3,w:1,h:1},{x:18,y:22,cell:4,w:1,h:1},{x:26,y:15,cell:5,w:1,h:1},
{x:33,y:27,cell:6,w:2,h:1},{x:35,y:27,cell:6,w:2,h:1},{x:37,y:27,cell:6,w:2,h:1},
{x:16,y:28,cell:7,w:2,h:1},{x:18,y:28,cell:7,w:2,h:1},{x:20,y:28,cell:7,w:2,h:1},
{x:35,y:20,cell:8,w:3,h:2}
];
export function townPath(x,y){return x===16&&y>=9&&y<=18||x===35&&y>=9&&y<=18||x===14&&y>=25&&y<=27||y===27&&x>=14&&x<=25;}
