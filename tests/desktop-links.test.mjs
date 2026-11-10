import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{safeExternalURL}=require('../desktop/external-links.cjs');
test('home-server setup links open only approved HTTPS documentation and project downloads',()=>{
 for(const url of ['https://nathan-culver.github.io/Spirimon/Spirimon.html','https://github.com/Nathan-Culver/Spirimon/archive/refs/heads/main.zip','https://nodejs.org/en/download','https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/','https://developers.openai.com/api/docs/quickstart'])assert.equal(safeExternalURL(url),url);
 for(const url of ['file:///etc/passwd','javascript:alert(1)','https://nodejs.org.attacker.example/en/download','https://user:secret@nodejs.org/en/download','https://github.com/attacker/project','https://nodejs.org:444/en/download','http://nodejs.org/en/download'])assert.equal(safeExternalURL(url),null);
});
