'use strict';
/* GitHub Pages + public Google Sheet. No Apps Script and no secrets. */
const $=id=>document.getElementById(id);
const cfg=window.SP26||{};
const store={items:[],selected:new Set(),open:false,busy:false,ready:false,formUrl:''};
const node=(tag,klass,txt)=>{const e=document.createElement(tag);if(klass)e.className=klass;if(txt!==undefined)e.textContent=txt;return e;};
function banner(msg,err=false){const n=$('global-notice');n.textContent=msg;n.className='notice'+(err?' error':'');}
function readPublicSheet(){
 return new Promise((resolve,reject)=>{
  if(!/^[A-Za-z0-9_-]{20,}$/.test(cfg.PUBLIC_SHEET_ID||'')){reject(Error('Nie skonfigurowano publicznego arkusza.'));return;}
  const callback='SP26_GVIZ_'+Math.random().toString(36).slice(2,14);
  const s=document.createElement('script');let done=false;
  const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);s.remove();delete window[callback];error?reject(error):resolve(result);};
  window[callback]=data=>finish(null,data);
  const timer=setTimeout(()=>finish(Error('Google nie odpowiedziało w ciągu 15 sekund.')),15000);
  s.onerror=()=>finish(Error('Publiczny arkusz Google jest niedostępny. Sprawdź jego udostępnienie.'));
  const u=new URL('https://docs.google.com/spreadsheets/d/'+cfg.PUBLIC_SHEET_ID+'/gviz/tq');
  u.searchParams.set('sheet',cfg.PUBLIC_TAB||'Dane publiczne');
  u.searchParams.set('headers','1');
  u.searchParams.set('tqx','out:json;responseHandler:'+callback);
  u.searchParams.set('_',String(Date.now()));
  s.src=u.href;document.head.appendChild(s);
 });
}
function val(cell){if(!cell)return '';if(cell.v===null||cell.v===undefined)return '';return String(cell.f??cell.v);}
function parseData(payload){
 if(!payload||payload.status!=='ok'||!payload.table)throw Error('Google nie udostępniło danych. Otwórz publiczny arkusz i sprawdź dostęp.');
 const rows=payload.table.rows||[];
 const raw=rows.map(r=>(r.c||[]).map(val));
 if(raw.some(r=>(r[0]||'').startsWith('#REF')))throw Error('Arkusz publiczny wymaga kliknięcia „Zezwól na dostęp” przy IMPORTRANGE.');
 return raw.filter(r=>/^SP-[0-9]{3}$/.test(r[0]||'')).map(r=>({
  id:r[0],category:r[1]||'Inne',name:r[2]||'',description:r[3]||'',important:r[4]==='KLUCZOWE',
  state:r[5]||'WOLNY',ownerCodeEnd:r[6]||'',claimCount:Number(r[7]||0),open:r[8]==='TAK',
  formUrl:r[9]||'',taken:r[5]!=='WOLNY'
 })).filter(x=>x.name);
}
function empty(title,description){const e=node('div','empty');e.append(node('h3','',title),node('p','',description));return e;}
function categoryOptions(){
 const old=$('category').value;
 const cats=[...new Set(store.items.map(p=>p.category))].sort((a,b)=>a.localeCompare(b,'pl'));
 $('category').replaceChildren(new Option('Wszystkie kategorie',''),...cats.map(c=>new Option(c,c)));
 $('category').value=cats.includes(old)?old:'';
}
function render(){
 const query=$('search').value.toLocaleLowerCase('pl').trim(),category=$('category').value,status=$('status').value;
 const items=store.items.filter(p=>(!query||(p.name+' '+p.description).toLocaleLowerCase('pl').includes(query))&&
  (!category||p.category===category)&&(status==='all'||(status==='free'?!p.taken:p.taken)));
 $('count').textContent=items.length+' produktów';
 const grid=$('grid');grid.replaceChildren();
 if(!store.open){grid.append(empty('Przygotowujemy aktualną listę','Deklaracje są zamknięte do czasu uruchomienia formularza na rok 2026.'));return;}
 if(!items.length){grid.append(empty('Nie znaleziono produktów','Zmień wyszukiwane hasło lub filtr.'));return;}
 for(const p of items){
  const selected=store.selected.has(p.id),card=node('article','product'+(p.taken?' taken':'')+(selected?' selected':''));
  card.append(node('div','category-label',p.category),node('h3','',p.name),node('p','',p.description));
  const foot=node('div','foot');
  foot.append(node('span','tag'+(p.taken?' taken':p.important?' important':''),p.taken?
   (p.state==='DOSTARCZONO'?'Dostarczony':'Zgłoszony'):p.important?'★ Kluczowe':'Dostępny'));
  const button=node('button','pick',p.taken?'Już wybrany':selected?'✓ Wybrano':'+ Wybieram');
  button.type='button';button.disabled=p.taken||!store.open;
  button.setAttribute('aria-pressed',String(selected));
  button.onclick=()=>{if(selected)store.selected.delete(p.id);else if(store.selected.size<12)store.selected.add(p.id);else alert('Maksymalnie 12 prezentów w jednej deklaracji.');render();updateCart();};
  foot.append(button);card.append(foot);grid.append(card);
 }
}
function updateCart(){
 const count=store.selected.size;
 $('basket-title').textContent=count?'Wybrano '+count+' '+(count===1?'produkt':count<5?'produkty':'produktów'):'Twój koszyk dobra jest pusty';
 $('basket-sub').textContent=count?'Potwierdź deklarację w Formularzu Google':'Wybierz przynajmniej jeden produkt';
 $('checkout').disabled=!count||!store.open||!store.ready;
}
async function refresh(){
 $('refresh').disabled=true;
 try{
  const payload=await readPublicSheet();
  store.items=parseData(payload);
  store.open=store.items.length>0&&store.items[0].open;
  store.formUrl=store.items[0]?.formUrl||cfg.FORM_PREFILL_URL||'';
  store.ready=!!store.formUrl;
  const free=new Set(store.items.filter(x=>!x.taken).map(x=>x.id));
  store.selected=new Set([...store.selected].filter(x=>free.has(x)));
  const total=store.items.length,taken=store.items.filter(x=>x.taken).length;
  $('total').textContent=total;$('taken').textContent=taken;$('available').textContent=total-taken;
  const progress=total?Math.round(taken*100/total):0;
  $('progress-fill').style.width=progress+'%';
  $('progress-caption').textContent=taken+' z '+total+' zgłoszonych ('+progress+'%)';
  $('global-notice').className='notice hidden';
  if(!store.open)banner('Trwa przygotowanie tegorocznej listy potrzeb. Rezerwacje są chwilowo zamknięte.');
  else if(!store.ready)banner('Lista jest dostępna, ale formularz potwierdzenia jeszcze nie został podłączony.');
  categoryOptions();render();
  if(typeof window.renderLastAttempt==='function')window.renderLastAttempt();
 }catch(e){
  store.open=false;store.items=[];$('count').textContent='Brak połączenia';
  $('grid').replaceChildren(empty('Nie można wczytać listy',e.message));
  $('progress-caption').textContent='Błąd wczytywania';banner(e.message,true);
 }finally{$('refresh').disabled=false;updateCart();}
}
$('search').oninput=render;$('category').onchange=render;$('status').onchange=render;
$('refresh').onclick=refresh;
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
setInterval(()=>{if(!document.hidden)refresh();},60000);
refresh();
