/* Google Forms: rodzic zatwierdza w oficjalnym formularzu Google. */
function prefillSelected(ids,code){
 const template=String(store.formUrl||cfg.FORM_PREFILL_URL||'').trim();
 const url=new URL(template);
 if(url.hostname!=='docs.google.com'||!url.pathname.includes('/forms/')||!url.pathname.endsWith('/viewform'))
  throw Error('Podaj pełny link do wstępnie wypełnionego Formularza Google.');
 let changedProduct=false,changedCode=false;
 for(const [key,value] of [...url.searchParams]){
  if(!key.startsWith('entry.'))continue;
  if(value===cfg.PRODUCT_PLACEHOLDER){
    url.searchParams.set(key,ids.join(', '));changedProduct=true;
  }else if(value===cfg.CODE_PLACEHOLDER){
    url.searchParams.set(key,code);changedCode=true;
  }
 }
 if(!changedProduct||!changedCode)throw Error('W linku formularza brakuje pól testowych SP-999 i SP26-CODE-TEST-12345678.');
 return url.href;
}
function lastAttempt(){
 try{return JSON.parse(localStorage.getItem('sp26_last_attempt')||'null');}catch(e){return null;}
}
function saveAttempt(data){
 try{localStorage.setItem('sp26_last_attempt',JSON.stringify(data));}catch(e){}
}
function renderLastAttempt(){
 let n=$('attempt-status');
 if(!n){n=node('section','notice','');n.id='attempt-status';$('prezenty').insertBefore(n,$('prezenty').querySelector('.filters'));}
 const a=lastAttempt();
 if(!a||!Array.isArray(a.ids)||!a.code){n.className='hidden';return;}
 n.className='notice';
 n.replaceChildren();
 const heading=node('strong','', 'Status ostatniej deklaracji');
 const detail=node('div','', 'Kod: '+a.code+' · kliknij „Odśwież”, aby sprawdzić przydział.');
 n.append(heading,detail);
 const lines=node('div','','');
 lines.style.marginTop='8px';
 let won=0,lost=0,pending=0;
 for(const id of a.ids){
  const product=store.items.find(p=>p.id===id);
  const label=product?.name||id;
  let s='Oczekuje na pojawienie się zgłoszenia w arkuszu';
  if(product?.taken){
   if((product.ownerCodeEnd||'').toLowerCase()===a.code.slice(-8).toLowerCase()){s='Przydzielono Tobie';won++;}
   else{s='Przydzielono wcześniejszej deklaracji';lost++;}
  }else pending++;
  lines.append(node('div','', '• '+label+' — '+s));
 }
 n.append(lines);
 const summary=node('p','', won===a.ids.length?
   'Wszystkie wybrane pozycje zostały przypisane do Twojego kodu. Dziękujemy!':
   lost>0?'Nie wszystkie produkty zostały Ci przydzielone. Wybierz inne dostępne produkty.':
   'Ostateczny wynik pojawi się po wysłaniu Formularza Google i aktualizacji arkusza. Samo otwarcie formularza nie rezerwuje produktów.');
 summary.style.marginBottom='0';n.append(summary);
}
function showCheckout(){
 if(!store.open||!store.ready||!store.selected.size)return;
 const ids=[...store.selected],code='SP26-'+crypto.randomUUID();
 const pane=$('dialog-content');pane.replaceChildren();
 const header=node('h2','','Wspólnie podarujmy radość');
 header.id='dialog-title';
 pane.append(header,node('p','','Wybrane prezenty:'));
 const sum=node('div','summary');
 store.items.filter(p=>store.selected.has(p.id)).forEach((p,i)=>sum.append(node('div','',(i+1)+'. '+p.name)));
 pane.append(sum);
 const p=node('p','','Za chwilę otworzy się Formularz Google. Wpisz swoje dane, sprawdź listę i kliknij „Prześlij”. Dopiero wtedy zgłoszenie trafi do arkusza. Przydział odbywa się według kolejności odpowiedzi.');
 pane.append(p);
 let link;
 try{link=prefillSelected(ids,code);}
 catch(e){pane.append(node('p','error-message',e.message));$('backdrop').classList.remove('hidden');return;}
 const actions=node('div','dialog-actions');
 const cancel=node('button','outline','Wróć');cancel.type='button';cancel.onclick=hideCheckout;
 const next=node('a','primary','Otwórz Google Forms →');next.href=link;next.target='_blank';next.rel='noopener noreferrer';
 next.style.display='inline-block';next.style.textDecoration='none';next.style.textAlign='center';
 next.onclick=()=>{
  saveAttempt({code,ids,when:new Date().toISOString()});
  renderLastAttempt();
  pane.append(node('p','','Otwórz formularz, a po wysłaniu wróć na tę stronę i odśwież listę, aby zobaczyć wynik.'));
 };
 actions.append(cancel,next);pane.append(actions);
 $('backdrop').classList.remove('hidden');
}
function hideCheckout(){$('backdrop').classList.add('hidden');}
$('checkout').onclick=showCheckout;
$('close').onclick=hideCheckout;
$('backdrop').onclick=e=>{if(e.target===$('backdrop'))hideCheckout();};
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideCheckout();});
renderLastAttempt();
