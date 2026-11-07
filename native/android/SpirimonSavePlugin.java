package com.spirimon.game;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

@CapacitorPlugin(name="SpirimonSave")
public class SpirimonSavePlugin extends Plugin {
 private static final int LIMIT=150*1024*1024;
 private final Object writeLock=new Object();
 private SharedPreferences prefs(){return getContext().getSharedPreferences("spirimon-device-save",0);}
 private Uri tree(){String value=prefs().getString("tree",null);return value==null?null:Uri.parse(value);}
 private Uri root() throws Exception {Uri tree=tree();if(tree==null)throw new Exception("Choose a save folder first.");return DocumentsContract.buildDocumentUriUsingTree(tree,DocumentsContract.getTreeDocumentId(tree));}
 private Uri find(String name) throws Exception {
  Uri tree=tree();if(tree==null)return null;
  Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(tree,DocumentsContract.getTreeDocumentId(tree));
  try(Cursor cursor=getContext().getContentResolver().query(children,new String[]{DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME},null,null,null)){
   if(cursor!=null)while(cursor.moveToNext())if(name.equals(cursor.getString(1)))return DocumentsContract.buildDocumentUriUsingTree(tree,cursor.getString(0));
  }
  return null;
 }
 private String readText(Uri file) throws Exception {
  try(InputStream input=getContext().getContentResolver().openInputStream(file);ByteArrayOutputStream output=new ByteArrayOutputStream()){
   if(input==null)throw new Exception("Cannot read the selected save.");byte[] buffer=new byte[8192];int count;
   while((count=input.read(buffer))!=-1){if(output.size()+count>LIMIT)throw new Exception("Save file is too large.");output.write(buffer,0,count);}
   return new String(output.toByteArray(),StandardCharsets.UTF_8);
  }
 }
 private Uri getFile(String name) throws Exception {Uri existing=find(name);if(existing!=null)return existing;Uri created=DocumentsContract.createDocument(getContext().getContentResolver(),root(),"application/json",name);if(created==null)throw new Exception("Cannot create the save file.");return created;}
 private void writeText(Uri file,String text) throws Exception {try(OutputStream output=getContext().getContentResolver().openOutputStream(file,"wt")){if(output==null)throw new Exception("Cannot write the selected save.");output.write(text.getBytes(StandardCharsets.UTF_8));output.flush();}}
 @PluginMethod public void status(PluginCall call){JSObject result=new JSObject();result.put("linked",tree()!=null);call.resolve(result);}
 @PluginMethod public void choose(PluginCall call){
  Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION|Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);startActivityForResult(call,intent,"folderChosen");
 }
 @ActivityCallback private void folderChosen(PluginCall call,ActivityResult activityResult){
  if(call==null)return;Intent data=activityResult.getData();
  if(activityResult.getResultCode()!=Activity.RESULT_OK||data==null||data.getData()==null){JSObject result=new JSObject();result.put("cancelled",true);call.resolve(result);return;}
  try{Uri uri=data.getData();int flags=data.getFlags()&(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);getContext().getContentResolver().takePersistableUriPermission(uri,flags);prefs().edit().putString("tree",uri.toString()).apply();JSObject result=new JSObject();result.put("linked",true);call.resolve(result);}
  catch(Exception error){call.reject("Cannot retain permission for this save folder.",error);}
 }
 @PluginMethod public void read(PluginCall call){
  try{Uri file=find(Boolean.TRUE.equals(call.getBoolean("backup",false))?"spirimon-save.previous.json":"spirimon-save.json");JSObject result=new JSObject();result.put("exists",file!=null);if(file!=null)result.put("text",readText(file));call.resolve(result);}
  catch(Exception error){call.reject("Cannot read the device save. Reconnect its folder.",error);}
 }
 @PluginMethod public void write(PluginCall call){
  String text=call.getString("text");
  try{
   if(text==null||text.getBytes(StandardCharsets.UTF_8).length>LIMIT)throw new Exception("Invalid save payload.");JSONObject payload=new JSONObject(text);if(!"spirimon-backup".equals(payload.optString("format"))||payload.optInt("version")!=1||!payload.has("save"))throw new Exception("Invalid save payload.");
   synchronized(writeLock){
    Uri pending=getFile("spirimon-save.pending.json");writeText(pending,text);Uri current=find("spirimon-save.json");
    if(current!=null){String old=readText(current);boolean valid=false;try{valid="spirimon-backup".equals(new JSONObject(old).optString("format"));}catch(Exception ignored){}
     if(valid)writeText(getFile("spirimon-save.previous.json"),old);
     if(!DocumentsContract.deleteDocument(getContext().getContentResolver(),current))throw new Exception("The previous save could not be replaced.");
    }
    if(DocumentsContract.renameDocument(getContext().getContentResolver(),pending,"spirimon-save.json")==null)throw new Exception("Save could not be committed; its previous copy remains available.");
   }
   JSObject result=new JSObject();result.put("saved",true);call.resolve(result);
  }catch(Exception error){call.reject("Device save failed. The previous copy was preserved.",error);}
 }
}
