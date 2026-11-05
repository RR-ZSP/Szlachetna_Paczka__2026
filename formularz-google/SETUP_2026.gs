/**
 * SZLACHETNA PACZKA 2026 — JEDNORAZOWA KONFIGURACJA ORGANIZATORA
 * Ten plik URUCHAMIA TYLKO KOORDYNATOR, w edytorze script.google.com.
 * Nie wdrażamy go jako Web App i NIE publikujemy adresu /exec.
 *
 * Uwaga: uruchom funkcję przygotujFormularz2026 TYLKO RAZ.
 * Tworzy nowy Formularz Google i łączy go z istniejącym arkuszem odpowiedzi.
 */
const SP26_SHEET_ID='1tbldLo8NEEHzH4QTYkj3GyklFPAvA4VFWiQ1M2EJoNc';
const SP26_RESPONSE_TAB='Odpowiedzi 2026';
function przygotujFormularz2026(){
 const book=SpreadsheetApp.openById(SP26_SHEET_ID);
 const settings=book.getSheetByName('Ustawienia');
 if(!settings)throw Error('Nie ma zakładki Ustawienia.');
 if(String(settings.getRange('B6').getValue()).trim())
   throw Error('Formularz został już skonfigurowany. Nie uruchamiaj ponownie, bo powstaną duplikaty.');
 settings.getRange('B2').setValue('NIE'); // bezpieczne zamknięcie
 settings.getRange('B5').setValue('NIE');
 const before=new Set(book.getSheets().map(s=>s.getSheetId()));
 const form=FormApp.create('Szlachetna Paczka 2026 — Rezerwacja produktów',true);
 form.setDescription('Deklaracja darczyńcy ZSP Mikołów. Zgłoszenie nie gwarantuje przydziału każdego produktu: pierwszeństwo ma wcześniejsza odpowiedź. Przed przesłaniem zapoznaj się z informacją o danych osobowych na stronie organizatora.');
 form.setCollectEmail(false);
 form.setLimitOneResponsePerUser(false);
 form.setAllowResponseEdits(false);
 form.setShowLinkToRespondAgain(true);
 form.setPublishingSummary(false);
 form.setConfirmationMessage('Dziękujemy za deklarację! Zgłoszenie zostało przyjęte do rozpatrzenia, ale nie jest jeszcze potwierdzeniem przydziału. Wróć na stronę Szlachetnej Paczki i odśwież status. Pierwszeństwo ma wcześniej otrzymana deklaracja.');
 const name=form.addTextItem().setTitle('Darczyńca').setHelpText('Imię i nazwisko lub oznaczenie darczyńcy').setRequired(true);
 const group=form.addTextItem().setTitle('Klasa lub grupa').setHelpText('Np. 3B albo Sowy').setRequired(true);
 form.addTextItem().setTitle('Telefon (opcjonalnie)').setRequired(false);
 const products=form.addTextItem().setTitle('ID produktów').setHelpText('Lista wybranych produktów ze strony GitHub, nie zmieniaj bez potrzeby.').setRequired(true);
 const code=form.addTextItem().setTitle('Kod zgłoszenia').setHelpText('Kod identyfikacyjny ze strony — zachowaj go do sprawdzenia wyniku.').setRequired(true);
 // Wstępne wypełnienie przygotowuje od razu poprawne identyfikatory entry.
 const prefill=form.createResponse()
  .withItemResponse(products.createResponse('SP-999'))
  .withItemResponse(code.createResponse('SP26-CODE-TEST-12345678'))
  .toPrefilledUrl();
 form.setDestination(FormApp.DestinationType.SPREADSHEET,book.getId());
 SpreadsheetApp.flush();
 Utilities.sleep(1500);
 let tab=book.getSheets().find(s=>!before.has(s.getSheetId()));
 if(tab){
  if(book.getSheetByName(SP26_RESPONSE_TAB))
    throw Error('W docelowym arkuszu jest już zakładka "'+SP26_RESPONSE_TAB+'". Zmień jej nazwę ręcznie i uruchom funkcję naprawNazweArkusza.');
  tab.setName(SP26_RESPONSE_TAB);
 }else{
  Logger.log('Google tworzy kartę odpowiedzi z opóźnieniem. Po chwili ręcznie zmień jej nazwę na '+SP26_RESPONSE_TAB);
 }
 form.setAcceptingResponses(false);
 settings.getRange('B4').setValue(SP26_RESPONSE_TAB);
 settings.getRange('B6').setValue(form.getEditUrl());
 settings.getRange('B7').setValue(form.getPublishedUrl());
 settings.getRange('B8').setValue(prefill);
 SpreadsheetApp.flush();
 Logger.log('FORMULARZ — EDYCJA: '+form.getEditUrl());
 Logger.log('FORMULARZ — DLA RODZICÓW: '+form.getPublishedUrl());
 Logger.log('LINK WSTĘPNIE WYPEŁNIONY: '+prefill);
 Logger.log('GOTOWE — ale formularz jest ZAMKNIĘTY. Najpierw sprawdź nazwę karty odpowiedzi, połączenie IMPORTRANGE, politykę prywatności, a potem uruchom funkcję otworzFormularz2026.');
}
function otworzFormularz2026(){
 const book=SpreadsheetApp.openById(SP26_SHEET_ID),settings=book.getSheetByName('Ustawienia');
 const edit=String(settings.getRange('B6').getValue()).trim();
 if(!edit)throw Error('Najpierw uruchom przygotujFormularz2026.');
 const rows=book.getSheetByName(SP26_RESPONSE_TAB);
 if(!rows)throw Error('Zakładka "'+SP26_RESPONSE_TAB+'" nie istnieje. Sprawdź, czy formularz ją utworzył i popraw nazwę.');
 if(String(settings.getRange('B3').getValue()).toUpperCase()!=='ARCHIWUM 2025'){
  Logger.log('Uwaga: sprawdź ręcznie, czy lista produktów jest aktualna.');
 }
 const header=rows.getRange(1,1,1,6).getDisplayValues()[0];
 if(!header[0]||!header[4]||!header[5])throw Error('Zakładka odpowiedzi nie ma 6 wymaganych kolumn. Sprawdź kolejność pytań.');
 const form=FormApp.openByUrl(edit);
 if(form.supportsAdvancedResponderPermissions() && !form.isPublished()){
  form.setPublished(true);
 }
 form.setAcceptingResponses(true);
 if(!form.isAcceptingResponses())throw Error('Google Forms nadal nie przyjmuje odpowiedzi. Sprawdź opcję Opublikuj i Odpowiedzi.');
 Logger.log('Formularz opublikowany: '+(form.supportsAdvancedResponderPermissions()?form.isPublished():'tryb bez publikacji'));
 Logger.log('Przyjmowanie odpowiedzi: '+form.isAcceptingResponses());
 settings.getRange('B5').setValue('TAK');
 settings.getRange('B2').setValue('TAK');
 Logger.log('FORMULARZ OTWARTY — wykonaj test na zwykłej karcie telefonu i przetestuj konflikty rezerwacji.');
}
function zamknijFormularz2026(){
 const book=SpreadsheetApp.openById(SP26_SHEET_ID),settings=book.getSheetByName('Ustawienia');
 settings.getRange('B2').setValue('NIE');settings.getRange('B5').setValue('NIE');
 const edit=String(settings.getRange('B6').getValue()).trim();
 if(edit)FormApp.openByUrl(edit).setAcceptingResponses(false);
 Logger.log('Zamknięto formularz i przycisk zgłoszeń.');
}
