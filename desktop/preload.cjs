const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('spirimonDeviceSave',{
 status:()=>ipcRenderer.invoke('spirimon-save:status'),
 choose:()=>ipcRenderer.invoke('spirimon-save:choose'),
 read:options=>ipcRenderer.invoke('spirimon-save:read',{backup:options?.backup===true}),
 write:options=>ipcRenderer.invoke('spirimon-save:write',{text:options?.text})
});
