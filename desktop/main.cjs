const {app,BrowserWindow}=require('electron');const path=require('node:path');
app.whenReady().then(()=>{const win=new BrowserWindow({width:1280,height:800,minWidth:640,minHeight:480,backgroundColor:'#102320',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});win.loadFile(path.join(__dirname,'game','Spirimon.html'));win.webContents.setWindowOpenHandler(()=>({action:'deny'}));app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)app.quit();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
