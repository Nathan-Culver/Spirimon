const allowed={
 'github.com':['/Nathan-Culver/Spirimon'],
 'nathan-culver.github.io':['/Spirimon/'],
 'nodejs.org':['/en/download'],
 'developers.cloudflare.com':['/tunnel/','/cloudflare-one/'],
 'developers.openai.com':['/api/'],
 'platform.openai.com':['/api-keys','/settings/']
};
function safeExternalURL(value){
 try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443')return null;return allowed[url.hostname]?.some(prefix=>url.pathname===prefix||url.pathname.startsWith(prefix.endsWith('/')?prefix:prefix+'/'))?url.href:null;}catch{return null;}
}
module.exports={safeExternalURL};
