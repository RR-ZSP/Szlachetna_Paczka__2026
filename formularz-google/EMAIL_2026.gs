/**
 * SZLACHETNA PACZKA 2026 — AUTOMATYCZNE E-MAILE
 *
 * Instalacja: zaloguj się na zspwmikolowie@gmail.com, otwórz Apps Script,
 * wklej ten plik i uruchom TYLKO RAZ: instalujPotwierdzenia2026.
 *
 * Skrypt nie jest Web App. Nie publikuj żadnego URL /exec.
 * Wyzwalacz "Po przesłaniu formularza" jest przypięty do Arkusza Google,
 * wykonuje się jako konto, które go zainstalowało.
 */
const SP26_MAIL_CONFIG = Object.freeze({
  SPREADSHEET_ID: '1tbldLo8NEEHzH4QTYkj3GyklFPAvA4VFWiQ1M2EJoNc',
  SENDER: 'zspwmikolowie@gmail.com',
  RESPONSES_TAB: 'Odpowiedzi 2026',
  PRODUCTS_TAB: 'Produkty',
  SETTINGS_TAB: 'Ustawienia',
  AUDIT_TAB: 'Historia e-maili',
  EMAIL_QUESTION: 'Adres e-mail do potwierdzenia',
  HANDLER: 'potwierdzRezerwacjeMailem2026'
});

function sp26_aktywneKonto_() {
  const email = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  if (email !== SP26_MAIL_CONFIG.SENDER) {
    throw new Error(
      'Skrypt trzeba uruchomić i autoryzować jako '+SP26_MAIL_CONFIG.SENDER+
      '. Aktywne konto: '+(email || '(nie można ustalić)')+
      '. Inaczej wiadomości wysyłałoby inne konto.'
    );
  }
}

/** Tę funkcję uruchamia organizator JEDNORAZOWO. */
function instalujPotwierdzenia2026() {
  sp26_aktywneKonto_();
  const book = SpreadsheetApp.openById(SP26_MAIL_CONFIG.SPREADSHEET_ID);
  const responses = book.getSheetByName(SP26_MAIL_CONFIG.RESPONSES_TAB);
  const settings = book.getSheetByName(SP26_MAIL_CONFIG.SETTINGS_TAB);
  if (!responses || !settings) throw new Error('Brakuje zakładki Odpowiedzi 2026 lub Ustawienia.');
  const formUrl = String(settings.getRange('B6').getDisplayValue()).trim();
  if (!formUrl) throw new Error('Ustawienia!B6 nie zawiera adresu edycji Google Forms.');

  const form = FormApp.openByUrl(formUrl);
  const matches = form.getItems(FormApp.ItemType.TEXT)
    .map(item => item.asTextItem())
    .filter(item => item.getTitle() === SP26_MAIL_CONFIG.EMAIL_QUESTION);
  if (matches.length > 1) throw new Error('W formularzu jest kilka takich samych pytań e-mail.');
  const field = matches.length ? matches[0] : form.addTextItem();
  field.setTitle(SP26_MAIL_CONFIG.EMAIL_QUESTION);
  field.setHelpText('Otrzymasz na ten adres potwierdzenie przydzielonych produktów i kod zgłoszenia.');
  field.setRequired(true);
  field.setValidation(FormApp.createTextValidation()
    .requireTextIsEmail()
    .setHelpText('Wpisz poprawny adres e-mail (np. anna@example.com).')
    .build());

  // Nie włączamy wymuszonego logowania ani pobierania adresu konta Google.
  form.setCollectEmail(false);
  const triggers = ScriptApp.getProjectTriggers().filter(t =>
    t.getHandlerFunction() === SP26_MAIL_CONFIG.HANDLER);
  if (triggers.length > 1) throw new Error('W projekcie istnieją duplikaty wyzwalacza. Usuń je.');
  if (!triggers.length) {
    ScriptApp.newTrigger(SP26_MAIL_CONFIG.HANDLER)
      .forSpreadsheet(book).onFormSubmit().create();
  }
  sp26_arkuszLogow_(book);
  Logger.log('OK: dodano lub sprawdzono obowiązkowe pytanie o e-mail.');
  Logger.log('OK: wyzwalacz jest aktywny i wysyła jako: '+SP26_MAIL_CONFIG.SENDER);
  Logger.log('Pozostały dzienny limit odbiorców: '+MailApp.getRemainingDailyQuota());
  Logger.log('Test: wyślij NOWĄ odpowiedź w Formularzu Google ze swoim adresem e-mail.');
}

function sp26_arkuszLogow_(book) {
  let sheet = book.getSheetByName(SP26_MAIL_CONFIG.AUDIT_TAB);
  if (!sheet) {
    sheet = book.insertSheet(SP26_MAIL_CONFIG.AUDIT_TAB);
    sheet.appendRow([
      'Czas zgłoszenia','Kod zgłoszenia','Adres odbiorcy','Status',
      'Wiersz odpowiedzi','Przydzielone ID','Nieprzydzielone ID','Wysłano / Błąd'
    ]);
  }
  return sheet;
}

function sp26_numeryProduktow_(value) {
  return [...new Set(String(value || '')
    .toUpperCase().split(/[,;\n]+/).map(x => x.trim())
    .filter(x => /^SP-\d{3}$/.test(x)))];
}
function sp26_kolumna_(headers, label) {
  const index = headers.indexOf(label);
  if (index === -1) throw new Error('Brakuje kolumny "'+label+'" w odpowiedziach.');
  return index;
}
function sp26_htmlEscape_(v) {
  return String(v || '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function sp26_wiersze_(records) {
  return records.length ? records.map(x => '• '+x.name+' ('+x.id+')').join('\n') : 'Brak';
}
function sp26_htmlLista_(records) {
  return records.length
    ? '<ul>'+records.map(x => '<li>'+sp26_htmlEscape_(x.name)+
      ' <small>('+sp26_htmlEscape_(x.id)+')</small></li>').join('')+'</ul>'
    : '<p>Brak</p>';
}

/**
 * Instalowany wyzwalacz arkusza po wysłaniu Google Forms.
 * e.range wskazuje wiersz dodany przez formularz, nie ręczną edycję.
 */
function potwierdzRezerwacjeMailem2026(e) {
  if (!e || !e.range) {
    throw new Error('Nie uruchamiaj ręcznie. Ta funkcja działa po przesłaniu Google Forms.');
  }
  if (e.range.getSheet().getName() !== SP26_MAIL_CONFIG.RESPONSES_TAB) return;
  sp26_aktywneKonto_();
  const rowNo = e.range.getRow();
  if (rowNo < 2) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const book = SpreadsheetApp.openById(SP26_MAIL_CONFIG.SPREADSHEET_ID);
    const responses = book.getSheetByName(SP26_MAIL_CONFIG.RESPONSES_TAB);
    const lastColumn = responses.getLastColumn();
    const headers = responses.getRange(1,1,1,lastColumn).getDisplayValues()[0].map(x => String(x).trim());
    const record = responses.getRange(rowNo,1,1,lastColumn).getDisplayValues()[0];
    const code = String(record[sp26_kolumna_(headers,'Kod zgłoszenia')] || '').trim();
    const address = String(record[sp26_kolumna_(headers,SP26_MAIL_CONFIG.EMAIL_QUESTION)] || '').trim();
    const donor = String(record[sp26_kolumna_(headers,'Darczyńca')] || '').trim().replace(/[\r\n]/g,' ');
    const selected = sp26_numeryProduktow_(record[sp26_kolumna_(headers,'ID produktów')]);
    if (!/^SP26-[\w-]{12,80}$/i.test(code))
      throw new Error('Nieprawidłowy kod zgłoszenia w wierszu '+rowNo+'.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length>254)
      throw new Error('Nieprawidłowy adres e-mail w wierszu '+rowNo+'.');
    if (!selected.length) throw new Error('Brak ID produktów w wierszu '+rowNo+'.');

    const audit = sp26_arkuszLogow_(book);
    if (audit.getLastRow() > 1) {
      const codes = audit.getRange(2,2,audit.getLastRow()-1,1).getDisplayValues().flat();
      if (codes.includes(code)) {
        Logger.log('Kod '+code+' jest już w historii wysyłki. Pomijam duplikat.');
        return;
      }
    }

    const productsSheet = book.getSheetByName(SP26_MAIL_CONFIG.PRODUCTS_TAB);
    const productRows = productsSheet.getLastRow() > 1 ?
      productsSheet.getRange(2,1,productsSheet.getLastRow()-1,11).getDisplayValues() : [];
    const products = new Map(productRows
      .filter(p => p[0]).map(p => [String(p[0]).trim(),p]));

    // IDENTYCZNE pierwszeństwo jak w formule Katalog WWW:
    // liczy się pierwszy wiersz odpowiedzi, który zawiera dany ID.
    // Zgłoszenia starsze od bieżącego nie muszą mieć podanego adresu e-mail.
    const earlier = new Set();
    if (rowNo > 2) {
      const idCol = sp26_kolumna_(headers,'ID produktów')+1;
      const previous = responses.getRange(2,idCol,rowNo-2,1).getDisplayValues();
      previous.forEach(r => sp26_numeryProduktow_(r[0]).forEach(id => earlier.add(id)));
    }
    const assigned=[],notAssigned=[];
    for (const id of selected) {
      const item = products.get(id);
      const name = item ? String(item[2]) : 'Nieznany produkt';
      const entry = {id,name};
      const isActive = item && String(item[5]).trim().toUpperCase() === 'TAK';
      const isFree = item && String(item[6]).trim().toUpperCase() === 'WOLNY';
      const isNotDelivered = item && String(item[10]).trim().toUpperCase() !== 'TAK';
      if (isActive && isFree && isNotDelivered && !earlier.has(id)) assigned.push(entry);
      else notAssigned.push(entry);
    }

    const subject='Szlachetna Paczka 2026 — potwierdzenie zgłoszenia';
    const plain=[
      'Dzień dobry'+(donor?', '+donor:'')+'!',
      '',
      'Dziękujemy za udział w Szlachetnej Paczce organizowanej przez RR przy ZSP Mikołów.',
      'Kod Twojego zgłoszenia: '+code,
      '',
      'PRZYDZIELONE TOBIE PRODUKTY:',
      sp26_wiersze_(assigned),
      '',
      'PRODUKTY NIEPRZYDZIELONE:',
      sp26_wiersze_(notAssigned),
      '',
      'Przydzielone produkty są zarezerwowane dla Ciebie do dostarczenia.',
      'To nie jest potwierdzenie fizycznego otrzymania rzeczy przez szkołę.',
      'Jeżeli ktoś wcześniej zgłosił ten sam produkt, pierwszeństwo ma wcześniejsza deklaracja.',
      'Aktualny stan sprawdzisz na: https://rr-zsp.github.io/Szlachetna_Paczka__2026/',
      '',
      'Dziękujemy!',
      'Rada Rodziców przy ZSP Mikołów'
    ].join('\n');
    const html=[
      '<div style="font-family:Arial,sans-serif;max-width:620px;line-height:1.6;color:#234235">',
      '<h2 style="color:#174b38">Szlachetna Paczka 2026 🎁</h2>',
      '<p>Dzień dobry'+(donor?', '+sp26_htmlEscape_(donor):'')+'!</p>',
      '<p>Dziękujemy za udział w akcji <b>RR przy ZSP Mikołów</b>.</p>',
      '<p>Kod zgłoszenia: <b>'+sp26_htmlEscape_(code)+'</b></p>',
      '<h3 style="color:#1f714d">✓ Produkty przydzielone Tobie</h3>',
      sp26_htmlLista_(assigned),
      '<h3 style="color:#9b5e34">Produkty nieprzydzielone</h3>',
      sp26_htmlLista_(notAssigned),
      '<p><b>Przydział nie jest równoznaczny z dostarczeniem produktów do szkoły.</b></p>',
      '<p>W przypadku wcześniejszej deklaracji innego darczyńcy produkt pozostaje przy tej osobie.</p>',
      '<p><a href="https://rr-zsp.github.io/Szlachetna_Paczka__2026/">Sprawdź aktualną listę prezentów</a></p>',
      '<p>Dziękujemy!<br>Rada Rodziców przy ZSP Mikołów</p></div>'
    ].join('');

    // Log PRZED wysyłką ogranicza ryzyko ponowienia przy równoległych wyzwalaczach.
    // Stan "W TRAKCIE" wymaga kontroli administratora w razie awarii.
    audit.appendRow([
      new Date(), code, address, 'W TRAKCIE', rowNo,
      assigned.map(x=>x.id).join(', '),notAssigned.map(x=>x.id).join(', '),''
    ]);
    SpreadsheetApp.flush();
    const auditRow=audit.getLastRow();
    try {
      MailApp.sendEmail({
        to:address,
        subject,
        body:plain,
        htmlBody:html,
        name:'Rada Rodziców przy ZSP Mikołów'
      });
      audit.getRange(auditRow,4).setValue('WYSŁANO');
      audit.getRange(auditRow,8).setValue(new Date());
      Logger.log('WYSŁANO potwierdzenie do '+address+'; kod '+code);
    } catch (mailError) {
      audit.getRange(auditRow,4).setValue('BŁĄD');
      audit.getRange(auditRow,8).setValue(String(mailError));
      throw mailError;
    }
  } finally {
    lock.releaseLock();
  }
}

/** Bez wysyłania. Kontrola nadawcy, kolumn, pytania i wyzwalacza. */
function sprawdzPotwierdzenia2026() {
  sp26_aktywneKonto_();
  const book=SpreadsheetApp.openById(SP26_MAIL_CONFIG.SPREADSHEET_ID);
  const settings=book.getSheetByName(SP26_MAIL_CONFIG.SETTINGS_TAB);
  const form=FormApp.openByUrl(String(settings.getRange('B6').getDisplayValue()).trim());
  const emailItems=form.getItems(FormApp.ItemType.TEXT)
    .filter(x=>x.getTitle()===SP26_MAIL_CONFIG.EMAIL_QUESTION);
  const sheet=book.getSheetByName(SP26_MAIL_CONFIG.RESPONSES_TAB);
  const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
  const triggers=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===SP26_MAIL_CONFIG.HANDLER);
  Logger.log('Konto nadawcy: '+Session.getEffectiveUser().getEmail());
  Logger.log('Pytania o e-mail: '+emailItems.length+' (oczekiwane 1)');
  Logger.log('Wyzwalacze: '+triggers.length+' (oczekiwane 1)');
  Logger.log('Kolumna e-mail: '+headers.indexOf(SP26_MAIL_CONFIG.EMAIL_QUESTION)+' (jeśli -1, wyślij testową odpowiedź)');
  Logger.log('Pozostały limit odbiorców e-mail: '+MailApp.getRemainingDailyQuota());
  return emailItems.length===1&&triggers.length===1;
}