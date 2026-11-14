# Potwierdzenia e-mail — Szlachetna Paczka 2026

## Stan wdrożenia

- [x] Kod w `formularz-google/EMAIL_2026.gs` jest zapisany w GitHub.
- [x] W prywatnym arkuszu istnieje zakładka `Historia e-maili`.
- [x] Strona GitHub wyświetla informację o potwierdzeniu e-mail.
- [ ] **Do wykonania przez właściciela Gmail:** uruchomienie `instalujPotwierdzenia2026` na koncie `zspwmikolowie@gmail.com`.
- [ ] **Do sprawdzenia:** nowe pole w Formularzu Google i testowa wiadomość.

## Dlaczego potrzebne jest uruchomienie przez organizatora?

Google Apps Script działa z autoryzacją rzeczywistego konta Google. Dostępne połączenie z Arkuszami Google nie ma możliwości wykonania skryptu w Twoim imieniu ani edytowania pytań Google Forms. Dlatego wyzwalacz i uprawnienie do wysyłania poczty trzeba zatwierdzić raz z konta **zspwmikolowie@gmail.com**.

### 1. Otwórz konto Gmail organizatora

W zwykłej przeglądarce wybierz dokładnie konto `zspwmikolowie@gmail.com`. Nie musisz wylogowywać pozostałych kont — ważne, żeby edytor Apps Script był otwarty pod właściwą tożsamością.

Upewnij się, że to konto ma uprawnienie **Edytor** do formularza:
https://docs.google.com/forms/d/1JjIUL6w0DPr_AF15jo78ncbhwxG77tPVrvzW1Rqodto/edit

oraz arkusza:
https://docs.google.com/spreadsheets/d/1tbldLo8NEEHzH4QTYkj3GyklFPAvA4VFWiQ1M2EJoNc/edit

Jeżeli ich nie ma, właściciel musi udostępnić te dwa pliki kontu organizatora. Nie udostępniaj arkusza prywatnego anonimowym użytkownikom.

### 2. Jednorazowo zainstaluj automatyzację

1. Otwórz https://script.google.com/home/projects/create pod adresem `zspwmikolowie@gmail.com`.
2. Nazwij projekt `Szlachetna Paczka 2026 — e-mail`.
3. Otwórz plik `formularz-google/EMAIL_2026.gs` w tym repozytorium.
4. Skopiuj **cały plik** do edytora Apps Script, zastępując początkowy przykładowy kod.
5. Zapisz projekt (Ctrl+S).
6. U góry, na liście funkcji, wybierz `instalujPotwierdzenia2026`.
7. Kliknij `Uruchom`. Zatwierdź wymagane uprawnienia do Form, Sheets i wysyłki e-mail.
8. W sekcji `Dziennik wykonania` sprawdź, czy nie ma błędu i pojawia się komunikat `OK`.

**Nie klikaj `Wdróż`. Nie twórz aplikacji internetowej.** Ten skrypt nie używa URL `/exec`.

Instalacja (bez ponownego tworzenia formularza) **automatycznie**:
- doda obowiązkowe pytanie `Adres e-mail do potwierdzenia` z walidacją adresu,
- utworzy tylko jeden wyzwalacz `Po przesłaniu formularza` dla arkusza,
- będzie wysyłać z konta `zspwmikolowie@gmail.com` (jako `Rada Rodziców przy ZSP Mikołów`),
- zapisze każdą próbę w `Historia e-maili`.

### 3. Test pełnego przepływu

1. Otwórz https://rr-zsp.github.io/Szlachetna_Paczka__2026/ w zwykłej karcie Chrome.
2. Wybierz **wolny, testowy** produkt i przejdź do Google Forms.
3. Powinno pojawić się nowe obowiązkowe pole e-mail. Podaj swój adres testowy.
4. Wpisz dane testowe i wyślij formularz.
5. Po krótkiej chwili sprawdź skrzynkę adresata (także Spam/Oferty) — od `zspwmikolowie@gmail.com`.
6. Sprawdź `Historia e-maili` w prywatnym arkuszu. Status oczekiwany `WYSŁANO`.
7. Otwórz `Kontrola Forms`: kod zgłoszenia powinien przydzielać produkt temu zgłoszeniu.
8. Usuń testowy identyfikator produktu z jego komórki w `Odpowiedzi 2026` — dzięki temu będzie znów wolny. Nie usuwaj innych deklaracji.

Możesz uruchomić funkcję `sprawdzPotwierdzenia2026` w Apps Script, aby bez wysyłania sprawdzić nadawcę, pytanie, wyzwalacz i dzienny limit.

### 4. Co w przypadku problemu?

- **Nie ma pola e-mail:** sprawdź, czy uruchomiono `instalujPotwierdzenia2026`, a nie `potwierdzRezerwacjeMailem2026` (ta druga funkcja nie jest przeznaczona do ręcznego uruchamiania).
- **Błąd uprawnień:** konto `zspwmikolowie@gmail.com` musi mieć edycję formularza oraz arkusza.
- **Brak wiadomości:** sprawdź zakładkę `Historia e-maili` i `Wykonania` w Apps Script. Wpis `BŁĄD` wymaga analizy; nie uruchamiaj ręcznie wysyłki dla tego samego zgłoszenia bez kontroli.
- **Nadawca jest inny:** skrypt zainstalowano na złym koncie; ponownie zaloguj się jako organizator.
- **Codzienny limit wysyłek:** MailApp ma limity; przy ich przekroczeniu wysyłka może nie dojść. Limit pokazuje `sprawdzPotwierdzenia2026`.
- **Wiele pól e-mail:** funkcja instalacyjna używa już istniejącego pola o dokładnej nazwie, nie dodaje duplikatu.

### Zasady rezerwacji

Potwierdzenie rozróżnia: **produkty wybrane**, **produkty przydzielone** i **produkty nieprzydzielone**. Przydział opiera się na pierwszym zgłoszeniu danego ID w zakładce `Odpowiedzi 2026` i na statusie produktu. Wysyłka nie oznacza dostarczenia rzeczy do szkoły.

**Uwaga:** jeśli administrator później anuluje wcześniejsze zgłoszenie, może zmienić się aktualny przydział. Automatyczny e-mail dokumentuje wynik z chwili zgłoszenia i nie aktualizuje się sam po zmianach.

### Prywatność

Adres e-mail jest daną osobową i będzie przetwarzany przez Google Forms, prywatny arkusz i konto Gmail organizatora. Nie jest publikowany na stronie ani w publicznym arkuszu. Przed pełnym uruchomieniem uzupełnij informację RODO na stronie — w tym cel wysyłania potwierdzeń, podstawę przetwarzania, administratora danych, kontakt i okres retencji.
