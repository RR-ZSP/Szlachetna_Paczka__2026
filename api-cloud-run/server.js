'use strict';
/* Public API running on Cloud Run, not Apps Script. Uses workload identity. */
const http=require('node:http');
const {google}=require('googleapis');
const spreadsheetId=process.env.SHEET_ID||'1tbldLo8NEEHzH4QTYkj3GyklFPAvA4VFWiQ1M2EJoNc';
const origin=process.env.ALLOWED_ORIGIN||'https://rr-zsp.github.io';
const prefix='/Szlachetna_Paczka__2026/';
const auth=new google.auth.GoogleAuth({scopes:['https://www.googleapis.com/auth/spreadsheets']});
const api=google.sheets({version:'v4',auth});
let queue=Promise.resolve();
function exclusive(fn){const run=queue.then(fn);queue=run.catch(()=>{});return run;}
const text=v=>String(v??'').trim();
const safe=(v,n)=>{const s=text(v).slice(0,n);return /^[=+\-@\t\r]/.test(s)?"'"+s:s;};
const validId=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const names={products:'Produkty',settings:'Ustawienia',registrations:'Zgłoszenia',lines:'Deklaracje produktów',results:'Wyniki API'};
async function read(tab,range){const r=await api.spreadsheets.values.get({spreadsheetId,range:"'"+tab+"'!"+range});return r.data.values||[];}
async function isOpen(){const v=await read(names.settings,'B2');return text(v[0]?.[0]).toUpperCase()==='TAK';}
async function publicProducts(){
 const rows=(await read(names.products,'A2:K120')).filter(r=>text(r[0])&&text(r[5]).toUpperCase()==='TAK');
 const products=rows.map(r=>({id:text(r[0]),category:text(r[1]),name:text(r[2]),description:text(r[3]),
 important:text(r[4]).toUpperCase()==='KLUCZOWE',taken:text(r[6]).toUpperCase()!=='WOLNY',
 state:text(r[10]).toUpperCase()==='TAK'?'delivered':text(r[6]).toUpperCase()==='WOLNY'?'free':'reserved'}));
 const taken=products.filter(p=>p.taken).length;
 return {ok:true,open:true,products,stats:{total:products.length,taken,available:products.length-taken}};
}
async function findResult(id){
 const rows=await read(names.results,'A2:C1500');
 for(let i=rows.length-1;i>=0;i--)if(text(rows[i][0])===id)return {ok:true,status:text(rows[i][1]),message:text(rows[i][2])};
 return {ok:true,status:'PENDING'};
}
async function append(range,values){return api.spreadsheets.values.append({spreadsheetId,range,valueInputOption:'RAW',insertDataOption:'INSERT_ROWS',requestBody:{values}});}
function response(res,status,data,req){
 const allowedOrigin=req.headers.origin===origin?origin:null;
 if(allowedOrigin)res.setHeader('Access-Control-Allow-Origin',allowedOrigin);
 res.setHeader('Vary','Origin');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});
 res.end(JSON.stringify(data));
}
async function reserve(data){
 const id=text(data.requestId).toLowerCase(),name=text(data.name),group=text(data.group),phone=text(data.phone);
 const ids=Array.isArray(data.ids)?data.ids.map(text):[];
 if(!validId.test(id)||name.length<2||name.length>100||!group||group.length>60||phone.length>30||
    !/^[+0-9 ()-]*$/.test(phone)||ids.length<1||ids.length>12||new Set(ids).size!==ids.length||
    ids.some(x=>!/^SP-[0-9]{3}$/.test(x)))return {ok:false,error:'Niepoprawne dane deklaracji.',status:'REJECTED'};
 const known=await findResult(id);if(known.status!=='PENDING')return known;
 if(!(await isOpen()))return {ok:false,status:'REJECTED',error:'Zapisy są zamknięte.'};
 const products=await read(names.products,'A2:K120');
 const selected=ids.map(pid=>{const i=products.findIndex(row=>text(row[0])===pid);return i<0?null:{row:i+2,values:products[i]};});
 if(selected.some(x=>!x||text(x.values[5]).toUpperCase()!=='TAK'||text(x.values[6]).toUpperCase()!=='WOLNY'))
  return {ok:false,status:'REJECTED',error:'Jeden z produktów jest już zarezerwowany. Odśwież listę.'};
 const now=new Date().toISOString(),donor=safe(name,100),contact=safe(phone,30),className=safe(group,60);
 // Serial processing requires a single Cloud Run instance and concurrency=1.
 // One atomic Google Sheets batch creates all associated rows and marks selected products.
 const metadata=await api.spreadsheets.get({spreadsheetId,fields:'sheets(properties(sheetId,title))'});
 const tabId=metadata.data.sheets.find(x=>x.properties.title===names.products)?.properties.sheetId;
 if(tabId==null)throw Error('Missing Produkty tab');
 const requests=selected.map(x=>({updateCells:{
  range:{sheetId:tabId,startRowIndex:x.row-1,endRowIndex:x.row,startColumnIndex:6,endColumnIndex:10},
  rows:[{values:[
   {userEnteredValue:{stringValue:'ZAREZERWOWANY'}},{userEnteredValue:{stringValue:donor}},
   {userEnteredValue:{stringValue:className}},{userEnteredValue:{stringValue:now}}
  ]}],fields:'userEnteredValue'
 }}));
 // Reserve first; reconciliation is required if a later logging write fails.
 await api.spreadsheets.batchUpdate({spreadsheetId,requestBody:{requests}});
 try{
  await append("'"+names.registrations+"'!A:H",[[id,now,donor,contact,className,ids.length,selected.map(x=>text(x.values[2])).join(' | '),'ZAREZERWOWANY']]);
  await append("'"+names.lines+"'!A:H",selected.map(x=>[id,now,x.values[0],x.values[2],donor,contact,className,'ZAREZERWOWANY']));
  await append("'"+names.results+"'!A:D",[[id,'CONFIRMED','Deklaracja zapisana.',now]]);
  return {ok:true,status:'CONFIRMED',message:'Deklaracja zapisana.'};
 }catch(e){
  console.error('Reservation partially saved, manual reconciliation needed',id,e);
  try{await append("'"+names.results+"'!A:D",[[id,'ERROR','Sprawdź zgłoszenie z koordynatorem.',now]]);}catch(ignore){}
  return {ok:false,status:'ERROR',error:'Nie można potwierdzić zapisu. Skontaktuj się z koordynatorem z numerem: '+id};
 }
}
const server=http.createServer(async(req,res)=>{
 if(req.method==='OPTIONS'){
  if(req.headers.origin!==origin)return response(res,403,{ok:false},req);
  res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.writeHead(204);return res.end();
 }
 if(req.headers.origin&&req.headers.origin!==origin)return response(res,403,{ok:false,error:'Niedozwolona domena.'},req);
 try{
  const u=new URL(req.url,'https://example.invalid');
  if(u.pathname==='/health')return response(res,200,{ok:true},req);
  if(u.pathname==='/api/items'&&req.method==='GET'){
   if(!(await isOpen()))return response(res,200,{ok:true,open:false,products:[],stats:{total:0,taken:0,available:0}},req);
   return response(res,200,await publicProducts(),req);
  }
  if(u.pathname==='/api/result'&&req.method==='GET'){
   const id=text(u.searchParams.get('requestId'));if(!validId.test(id))return response(res,400,{ok:false,error:'Nieprawidłowy identyfikator.'},req);
   return response(res,200,await findResult(id),req);
  }
  if(u.pathname==='/api/reserve'&&req.method==='POST'){
   if(req.headers.origin!==origin)return response(res,403,{ok:false,error:'Niedozwolone żądanie.'},req);
   let raw='';for await(const part of req){raw+=part;if(raw.length>10000)return response(res,413,{ok:false,error:'Za duże zgłoszenie.'},req);}
   let data;try{data=JSON.parse(raw);}catch(e){return response(res,400,{ok:false,error:'Błędny format zgłoszenia.'},req);}
   const result=await exclusive(()=>reserve(data));
   return response(res,result.ok?200:409,result,req);
  }
  return response(res,404,{ok:false,error:'Nie znaleziono.'},req);
 }catch(err){console.error(err);return response(res,503,{ok:false,error:'Błąd serwera. Spróbuj później.'},req);}
});
server.listen(Number(process.env.PORT||8080),'0.0.0.0');
