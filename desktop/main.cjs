const {app,BrowserWindow,dialog,ipcMain,shell}=require('electron');const path=require('node:path');const {pathToFileURL}=require('node:url');const {createSaveStore}=require('./save-store.cjs');const {safeExternalURL}=require('./external-links.cjs');
app.whenReady().then(()=>{
 const index=path.join(__dirname,'game','index.html'),store=createSaveStore(path.join(app.getPath('userData'),'device-save.json'));
 const win=new BrowserWindow({width:1280,height:800,minWidth:640,minHeight:480,backgroundColor:'#102320',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
 for(const method of ['status','read','write','choose'])ipcMain.handle('spirimon-save:'+method,async(event,options)=>{
  if(event.sender!==win.webContents||event.senderFrame.url.split(/[?#]/)[0]!==pathToFileURL(index).href)throw Error('Untrusted save request.');
  if(method==='choose'){const result=await dialog.showOpenDialog(win,{title:'Choose your Spirimon save folder',properties:['openDirectory','createDirectory']});return result.canceled?{cancelled:true}:store.choose(result.filePaths[0]);}
  return store[method](options);
 });
 win.loadFile(index);const openHelp=value=>{const url=safeExternalURL(value);if(url)void shell.openExternal(url).catch(()=>{});};
 win.webContents.setWindowOpenHandler(({url})=>{openHelp(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(url.split(/[?#]/)[0]!==pathToFileURL(index).href){event.preventDefault();openHelp(url);}});app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)app.quit();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
