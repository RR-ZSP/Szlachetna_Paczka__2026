/**
 * Szlachetna Paczka 2026 — publiczne API Google Sheets.
 * Frontend: GitHub Pages. Backend: samodzielny projekt Google Apps Script.
 * GET JSONP: wyłącznie publiczne produkty i status bez danych darczyńców.
 * POST text/plain: deklaracje, bez CORS preflight. Potwierdzenie przez GET JSONP.
 * WAŻNE: przed publikacją ustaw Ustawienia!B2 = TAK, po weryfikacji listy 2026.
 */
const SHEET_ID = '1tbldLo8NEEHzH4QTYkj3GyklFPAvA4VFWiQ1M2EJoNc';
const SHEETS = {products:'Produkty', settings:'Ustawienia', requests:'Zgłoszenia', lines:'Deklaracje produktów', outcomes:'Wyniki API'};
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function db_(){return SpreadsheetApp.openById(SHEET_ID);}
function tab_(db,name){const tab=db.getSheetByName(name);if(!tab)throw Error('Brakuje arkusza: '+name);return tab;}
function isOpen_(db){return String(tab_(db,SHEETS.settings).getRange('B2').getDisplayValue()).trim().toUpperCase()==='TAK';}
function clean_(value,max){return String(value==null?'':value).trim().slice(0,max);}
function sheetText_(value,max){const s=clean_(value,max);return /^[=+\-@\t\r]/.test(s)?"'"+s:s;}
function getRows_(sh,width){const last=sh.getLastRow();return last<2?[]:sh.getRange(2,1,last-1,width).getValues();}
function output_(data,callback){
  // Callback z krótkiego, ścisłego alfabetu — bez wstrzykiwania kodu.
  if(!/^__sp26_[A-Za-z0-9_]{8,60}$/.test(callback||''))return ContentService.createTextOutput('Niepoprawny callback').setMimeType(ContentService.MimeType.TEXT);
  return ContentService.createTextOutput(callback+'('+JSON.stringify(data)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function products_(db){
 const rows=getRows_(tab_(db,SHEETS.products),11);
 return rows.filter(r=>String(r[5]).trim().toUpperCase()==='TAK' && clean_(r[0],30)).map(r=>{
  const status=String(r[6]).trim().toUpperCase();
  return {id:clean_(r[0],30),category:clean_(r[1],90),name:clean_(r[2],180),
    description:clean_(r[3],700),important:String(r[4]).toUpperCase()==='KLUCZOWE',
    taken:status!=='WOLNY',state:String(r[10]).toUpperCase()==='TAK'?'delivered':status==='WOLNY'?'free':'reserved'};
 });
}
function status_(db,id){
 if(!UUID_RX.test(id||''))return {ok:false,error:'Nieprawidłowy identyfikator zgłoszenia.'};
 const rows=getRows_(tab_(db,SHEETS.outcomes),4);
 for(let i=rows.length-1;i>=0;i--)if(rows[i][0]===id)return {ok:true,status:rows[i][1],message:rows[i][2]||''};
 return {ok:true,status:'PENDING'};
}
function doGet(e){
 const p=e&&e.parameter||{};
 try{
  const db=db_(),open=isOpen_(db);
  if(p.action==='result')return output_(status_(db,String(p.requestId||'')),p.callback);
  if(p.action!=='items')return output_({ok:false,error:'Nieznana operacja.'},p.callback);
  if(!open)return output_({ok:true,open:false,products:[],stats:{total:0,taken:0,available:0}},p.callback);
  const products=products_(db),taken=products.filter(p=>p.taken).length;
  return output_({ok:true,open:true,products:products,stats:{total:products.length,taken:taken,available:products.length-taken}},p.callback);
 }catch(err){console.error(err);return output_({ok:false,error:'Nie udało się pobrać danych. Spróbuj ponownie.'},p.callback);}
}
function outcome_(db,id,status,message){
 tab_(db,SHEETS.outcomes).appendRow([id,status,message,new Date()]);
 SpreadsheetApp.flush();
}
function doPost(e){
 let id='';
 try{
  if(!e||!e.postData||e.postData.contents.length>20000)throw Error('Nieprawidłowe zgłoszenie.');
  const payload=JSON.parse(e.postData.contents);
  id=clean_(payload.requestId,60).toLowerCase();
  if(!UUID_RX.test(id))throw Error('Niepoprawny kod rezerwacji.');
  // publiczny formularz — wymagany losowy identyfikator, bez uprawnień administratora
  const lock=LockService.getScriptLock();lock.waitLock(25000);
  try{
   const db=db_(),existing=status_(db,id);
   if(existing.ok&&existing.status!=='PENDING')return ContentService.createTextOutput('OK');
   if(!isOpen_(db)){outcome_(db,id,'REJECTED','Zapisy są chwilowo zamknięte.');return ContentService.createTextOutput('CLOSED');}
   const name=clean_(payload.name,100),group=clean_(payload.group,60),phone=clean_(payload.phone,30);
   const ids=Array.isArray(payload.ids)?payload.ids:[];
   const unique=[...new Set(ids.map(v=>clean_(v,30)))];
   const validation=!(payload.website||'')&&name.length>=2&&group.length>=1&&
     unique.length>=1&&unique.length<=12&&unique.length===ids.length&&
     /^[0-9+()\s-]{0,30}$/.test(phone);
   if(!validation){outcome_(db,id,'REJECTED','Sprawdź imię, grupę, telefon i wybrane produkty.');return ContentService.createTextOutput('INVALID');}
   const productsTab=tab_(db,SHEETS.products),rows=getRows_(productsTab,11),index={};
   rows.forEach((r,i)=>{if(r[0])index[String(r[0]).trim()]={row:i+2,value:r};});
   const selected=unique.map(pid=>index[pid]);
   if(selected.some(x=>!x||String(x.value[5]).trim().toUpperCase()!=='TAK'||String(x.value[6]).trim().toUpperCase()!=='WOLNY')){
     outcome_(db,id,'REJECTED','Jeden z prezentów został już wybrany. Odśwież listę i spróbuj ponownie.');
     return ContentService.createTextOutput('TAKEN');
   }
   const now=new Date();
   // Najpierw rezerwujemy pozycje w sekcji krytycznej z LockService.
   selected.forEach(x=>productsTab.getRange(x.row,7,1,4).setValues([['ZAREZERWOWANY',sheetText_(name,100),sheetText_(group,60),now]]));
   SpreadsheetApp.flush();
   const titles=selected.map(x=>String(x.value[2]));
   tab_(db,SHEETS.requests).appendRow([id,now,sheetText_(name,100),sheetText_(phone,30),sheetText_(group,60),unique.length,titles.join(' | '),'ZAREZERWOWANY']);
   const lines=tab_(db,SHEETS.lines);
   lines.getRange(lines.getLastRow()+1,1,unique.length,8).setValues(selected.map(x=>[id,now,x.value[0],x.value[2],sheetText_(name,100),sheetText_(phone,30),sheetText_(group,60),'ZAREZERWOWANY']));
   outcome_(db,id,'CONFIRMED','Deklaracja została zapisana. Dziękujemy!');
   return ContentService.createTextOutput('OK');
  }finally{lock.releaseLock();}
 }catch(err){
  console.error(err);
  // Gdy wystąpił częściowy błąd zapisu, wymagana weryfikacja przez koordynatora.
  if(UUID_RX.test(id))try{
    const db=db_(),current=status_(db,id);
    if(current.status==='PENDING')outcome_(db,id,'ERROR','Nie można potwierdzić zapisu. Skontaktuj się z koordynatorem, podając kod zgłoszenia.');
  }catch(ignored){console.error(ignored);}
  return ContentService.createTextOutput('ERROR');
 }
}
