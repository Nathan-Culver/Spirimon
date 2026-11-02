// Dependency-free PNG codec for the companion. Browser workflows use Canvas.
import {inflateSync,deflateSync} from 'node:zlib';
const signature=Buffer.from('89504e470d0a1a0a','hex');
function crc(buffer){let c=0xffffffff;for(const byte of buffer){c^=byte;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return (c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([name,data])),data.length+8);return out;}
export function encodePNG({width,height,data}){const head=Buffer.alloc(13);head.writeUInt32BE(width);head.writeUInt32BE(height,4);head[8]=8;head[9]=6;const raw=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)Buffer.from(data.buffer,data.byteOffset+y*width*4,width*4).copy(raw,y*(width*4+1)+1);return Buffer.concat([signature,chunk('IHDR',head),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
export function decodePNG(input){
 const b=Buffer.isBuffer(input)?input:Buffer.from(input.replace(/^data:image\/png;base64,/,''),'base64');if(b.length>20e6||!b.subarray(0,8).equals(signature))throw Error('Invalid PNG image.');
 let width,height,depth,type,interlace,pal,alpha;const blocks=[];
 for(let p=8;p+12<=b.length;){const len=b.readUInt32BE(p),kind=b.toString('ascii',p+4,p+8),data=b.subarray(p+8,p+8+len);if(p+12+len>b.length||crc(b.subarray(p+4,p+8+len))!==b.readUInt32BE(p+8+len))throw Error('Corrupt PNG image.');if(kind==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];type=data[9];interlace=data[12];}else if(kind==='IDAT')blocks.push(data);else if(kind==='PLTE')pal=data;else if(kind==='tRNS')alpha=data;p+=len+12;}
 const channels={0:1,2:3,3:1,4:2,6:4}[type];if(!channels||depth!==8||interlace||width<16||height<16||width>2048||height>2048)throw Error('PNG must be a non-interlaced 8-bit image between 16 and 2048 pixels.');
 const stride=width*channels,raw=inflateSync(Buffer.concat(blocks),{maxOutputLength:(stride+1)*height}),decoded=Buffer.alloc(stride*height),data=new Uint8ClampedArray(width*height*4);if(raw.length!==(stride+1)*height)throw Error('Invalid PNG pixel data.');
 const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];if(filter>4)throw Error('Unsupported PNG filter.');for(let x=0;x<stride;x++){const left=x>=channels?decoded[y*stride+x-channels]:0,up=y?decoded[(y-1)*stride+x]:0,ul=y&&x>=channels?decoded[(y-1)*stride+x-channels]:0;decoded[y*stride+x]=(raw[y*(stride+1)+1+x]+[0,left,up,Math.floor((left+up)/2),paeth(left,up,ul)][filter])&255;}}
 for(let n=0;n<width*height;n++){const p=n*channels,o=n*4;if(type===3){const k=decoded[p]*3;if(!pal||k+2>=pal.length)throw Error('Invalid PNG palette.');data.set([pal[k],pal[k+1],pal[k+2],alpha?.[decoded[p]]??255],o);}else if(type===0||type===4)data.set([decoded[p],decoded[p],decoded[p],type===4?decoded[p+1]:255],o);else data.set([decoded[p],decoded[p+1],decoded[p+2],type===6?decoded[p+3]:255],o);}
 return {width,height,data};
}
