import {readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),java=path.join(root,'android/app/src/main/java/com/spirimon/game');
await copyFile(path.join(root,'native/android/SpirimonSavePlugin.java'),path.join(java,'SpirimonSavePlugin.java'));
await writeFile(path.join(java,'MainActivity.java'),`package com.spirimon.game;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle savedInstanceState){registerPlugin(SpirimonSavePlugin.class);super.onCreate(savedInstanceState);}
}
`);
await copyFile(path.join(root,'node_modules/@capacitor/core/dist/capacitor.js'),path.join(root,'_site/native-capacitor.js'));
let html=await readFile(path.join(root,'_site/index.html'),'utf8');
html=html.replace('<!-- SPIRIMON_GAME -->','');
html=html.replace('<script>window.__spirimonPackaged=true;',`<script src="./native-capacitor.js"></script><script>window.spirimonDeviceSave=capacitorExports.registerPlugin('SpirimonSave');</script><script>window.__spirimonPackaged=true;`);
if(!html.includes("registerPlugin('SpirimonSave')"))throw Error('Android save bridge could not be installed.');
await writeFile(path.join(root,'_site/index.html'),html);
