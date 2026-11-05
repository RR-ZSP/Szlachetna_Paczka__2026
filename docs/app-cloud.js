'use strict';
const $ = id => document.getElementById(id);
const API = String(window.SZLACHETNA_PACZKA_API_URL || '').trim().replace(/\\/$/,'');
const state = {items:[], selected:new Set(), open:false, busy:false};
function element(tag, cls, value) {
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(value!==undefined)e.textContent=value;
  return e;
}
function showError(message) {
  const banner=$('global-notice');
  banner.textContent=message;
  banner.className='notice error';
}
async function jsonp(action,requestId){
 if(!API.startsWith('https://')||!API.endsWith('.run.app'))throw Error('Trwa konfiguracja nowego serwera API.');
 const path=action==='items'?'/api/items':'/api/result?requestId='+encodeURIComponent(requestId||'');
 const res=await fetch(API+path,{cache:'no-store',mode:'cors'});
 if(!res.ok)throw Error('Serwer zwrócił kod '+res.status);
 return await res.json();
}
function info(text){
 const e=element('div','empty');
 e.append(element('h3','',text));
 $('grid').replaceChildren(e);
}
function updateCart(){
 const n=state.selected.size;
 $('basket-title').textContent=n?'Wybrano '+n+' produktów':'Twój koszyk dobra jest pusty';
 $('basket-sub').textContent=n?'Potwierdź wybór, aby zarezerwować.':'Wybierz przynajmniej jeden produkt';
 $('checkout').disabled=!n||state.busy||!state.open;
}
function render(){
 const q=$('search').value.toLowerCase().trim(),category=$('category').value,filter=$('status').value;
 const list=state.items.filter(p=>(!q||(p.name+' '+p.description).toLowerCase().includes(q))&&(!category||p.category===category)&&(filter==='all'||(filter==='free'?!p.taken:p.taken)));
 $('count').textContent=list.length+' produktów';
 $('grid').replaceChildren();
 if(!state.open){info('Zapisy są jeszcze zamknięte.');return;}
 if(!list.length){info('Brak pasujących produktów.');return;}
 for(const p of list){
  const selected=state.selected.has(p.id);
  const card=element('article','product'+(p.taken?' taken':'')+(selected?' selected':''));
  card.append(element('div','category-label',p.category),element('h3','',p.name),element('p','',p.description||''));
  const foot=element('div','foot');
  foot.append(element('span','tag'+(p.taken?' taken':''),p.taken?'Zarezerwowany':'Dostępny'));
  const btn=element('button','pick',p.taken?'Już wybrany':selected?'✓ Wybrano':'+ Wybieram');
  btn.disabled=p.taken||state.busy;
  btn.onclick=()=>{
   if(selected)state.selected.delete(p.id);
   else if(state.selected.size>=12)return alert('Można wybrać maksymalnie 12 produktów.');
   else state.selected.add(p.id);
   render();updateCart();
  };
  foot.append(btn);card.append(foot);$('grid').append(card);
 }
}
async function load(){
 $('refresh').disabled=true;
 try{
  const d=await jsonp('items');
  if(!d||!d.ok)throw Error(d&&d.error||'Błąd danych.');
  state.open=!!d.open;state.items=d.products||[];
  const free=new Set(state.items.filter(x=>!x.taken).map(x=>x.id));
  state.selected=new Set([...state.selected].filter(x=>free.has(x)));
  const st=d.stats||{total:0,taken:0,available:0};
  $('total').textContent=st.total;$('taken').textContent=st.taken;$('available').textContent=st.available;
  const pct=st.total?Math.round(st.taken/st.total*100):0;
  $('progress-fill').style.width=pct+'%';
  $('progress-caption').textContent=state.open?pct+'% wspólnie zrealizowanych':'Lista w przygotowaniu';
  const old=$('category').value;
  const cats=[...new Set(state.items.map(x=>x.category))].sort();
  $('category').replaceChildren(new Option('Wszystkie kategorie',''),...cats.map(x=>new Option(x,x)));
  $('category').value=cats.includes(old)?old:'';
  const notice=$('global-notice');notice.className='notice hidden';
  if(!state.open){notice.className='notice';notice.textContent='Przygotowujemy aktualną listę potrzeb na 2026 rok.';}
  render();
 }catch(e){
  state.open=false;state.items=[];showError(e.message);
  $('progress-caption').textContent='Błąd połączenia';
  info('Nie udało się wczytać produktów.');
 }finally{$('refresh').disabled=false;updateCart();}
}
function closeDialog(){if(!state.busy)$('backdrop').classList.add('hidden');}
function checkout(){
 if(!state.selected.size||!state.open)return;
 const pane=$('dialog-content');pane.replaceChildren();
 const title=element('h2','','Potwierdź wybór prezentów');title.id='dialog-title';pane.append(title);
 const summary=element('div','summary');
 state.items.filter(x=>state.selected.has(x.id)).forEach(x=>summary.append(element('div','',x.name)));
 pane.append(summary);
 const form=element('form','form-fields');
 for(const [id,label,type,required] of [['donor','Imię i nazwisko darczyńcy','text',true],['group','Klasa lub grupa','text',true],['phone','Telefon (opcjonalnie)','tel',false]]){
  const l=element('label','',label),inp=element('input');
  inp.id='f-'+id;inp.type=type;inp.required=required;inp.maxLength=100;l.append(inp);form.append(l);
 }
 const err=element('p','error-message');form.append(err);
 const send=element('button','primary','Potwierdzam rezerwację');send.type='submit';form.append(send);
 form.onsubmit=async e=>{
  e.preventDefault();if(state.busy)return;
  state.busy=true;send.disabled=true;send.textContent='Zapisujemy…';
  const id=crypto.randomUUID();
  const payload={requestId:id,name:$('f-donor').value.trim(),group:$('f-group').value.trim(),phone:$('f-phone').value.trim(),ids:[...state.selected]};
  try{
   const resp=await fetch(API+'/api/reserve',{
     method:'POST',mode:'cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
   });
   const result=await resp.json();
   if(result.status!=='CONFIRMED')throw Error(result.message||'Brak potwierdzenia. Nie wysyłaj ponownie bez kontaktu z koordynatorem. Numer: '+id);
   state.selected.clear();pane.replaceChildren(element('h2','','Dziękujemy!'),element('p','','Zapisano rezerwację. Kod: '+id));
   const done=element('button','primary','Wróć');done.onclick=closeDialog;pane.append(done);
  }catch(ex){err.textContent=ex.message;}
  finally{state.busy=false;send.disabled=false;send.textContent='Potwierdzam rezerwację';await load();}
 };
 pane.append(form);$('backdrop').classList.remove('hidden');
}
$('search').addEventListener('input',render);
$('category').addEventListener('change',render);
$('status').addEventListener('change',render);
$('refresh').addEventListener('click',load);
$('checkout').addEventListener('click',checkout);
$('close').addEventListener('click',closeDialog);
$('backdrop').addEventListener('click',e=>{if(e.target===$('backdrop'))closeDialog();});
load();
