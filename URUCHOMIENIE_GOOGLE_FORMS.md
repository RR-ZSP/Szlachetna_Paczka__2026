# SZLACHETNA PACZKA 2026 — URUCHOMIENIE (GITHUB PAGES + GOOGLE FORMS + SHEETS)

**Bez Google Cloud, Firebase, Cloudflare, publicznego Apps Script, kart płatniczych i kont GitHub dla rodziców.**

## Co już jest gotowe

- Strona GitHub Pages: https://rr-zsp.github.io/Szlachetna_Paczka__2026/
- Prywatny arkusz administratora: https://docs.google.com/spreadsheets/d/1tbldLo8NEEHzH4QTYkj3GyklFPAvA4VFWiQ1M2EJoNc/edit
- Osobny arkusz publiczny: https://docs.google.com/spreadsheets/d/1NSI2Mgqx6vguM5qpJ-NU1Bz9nkPHWtwbRxmUH7nSF8k/edit
- Zakładki prywatnego arkusza: `Katalog WWW`, `Kontrola Forms`, `Ustawienia`.
- GitHub czyta wyłącznie osobny arkusz publiczny.
- Rezerwacje rozstrzygają formuły: pierwszy formularz zawierający dany ID produktu wygrywa; zgłoszenia późniejsze nie otrzymują produktu.
- Pojedyncza deklaracja może wygrać tylko część wybranych produktów.
- W bazie są także archiwalne pozycje i dawne testy; lista **MUSI być zweryfikowana przed uruchomieniem**.

## Krok 1: Jednorazowo utwórz formularz

Nie da się utworzyć Formularza Google przez dostępne w tym czacie uprawnienia Google Drive. Zamiast ręcznie budować pytania, skopiuj gotowy kreator:

1. Otwórz https://script.google.com/home/projects/create zalogowany jako właściciel docelowego arkusza.
2. Usuń przykładową funkcję i wklej **całą zawartość** pliku `formularz-google/SETUP_2026.gs` z tego repozytorium.
3. Zapisz projekt pod nazwą „Szlachetna Paczka 2026 — konfiguracja”.
4. Z listy funkcji u góry wybierz `przygotujFormularz2026`, kliknij **Uruchom**, autoryzuj dostęp do Formularzy i Arkuszy.
5. Uruchom kreator TYLKO RAZ — zabezpieczenie sprawdza `Ustawienia!B6`.
6. Formularz zostanie utworzony z pytaniami w kolejności:
   - **Darczyńca** (wymagane),
   - **Klasa lub grupa** (wymagane),
   - **Telefon (opcjonalnie)**,
   - **ID produktów** (wymagane),
   - **Kod zgłoszenia** (wymagane).
7. Formularz będzie powiązany z obecnym arkuszem. Kreator powinien nazwać kartę odpowiedzi `Odpowiedzi 2026`.
8. Adresy formularza i wstępnie wypełnionego formularza zapiszą się automatycznie w `Ustawienia!B6:B8`.

**To nie jest aplikacja internetowa Apps Script.** Nie wybieraj `Wdróż`. Skrypt jest jednorazowym narzędziem organizatora; rodzice nigdy go nie otwierają. Jeśli po wykonaniu kreatora karta odpowiedzi ma inną nazwę, zmień ją ręcznie na `Odpowiedzi 2026`.

## Krok 2: Podłącz bezpieczny publiczny katalog

1. Otwórz https://docs.google.com/spreadsheets/d/1NSI2Mgqx6vguM5qpJ-NU1Bz9nkPHWtwbRxmUH7nSF8k/edit.
2. W `Dane publiczne!A1` znajduje się formuła `IMPORTRANGE`. Pierwszy raz pojawi się `#REF!`.
3. Kliknij tę komórkę i **Zezwól na dostęp**. To jednorazowa autoryzacja między arkuszami.
4. Poczekaj, aż zobaczysz tabelę z nagłówkami `ID, Kategoria, Produkt, Opis, Priorytet, Status...`.
5. Kliknij **Udostępnij → Dostęp ogólny → Każdy, kto ma link → Wyświetlający**. Nie udostępniaj tego arkusza do edycji.
6. Upewnij się, że w PUBLICZNYM arkuszu widnieją tylko ID, nazwy produktów, statusy, anonimowe końcówki kodów i publiczny adres formularza. **Bez nazwisk i numerów telefonów.**
7. **Nie zmieniaj udostępniania prywatnego arkusza.**

Ważne: publiczny katalog jest osobnym plikiem. Nie ustawiaj dostępu „Każdy, kto ma link” na prywatnym arkuszu danych darczyńców!

## Krok 3: Sprawdź ustawienia ankiety

1. W `Ustawienia!B6` masz link edycji formularza. Otwórz go.
2. W Google Forms sprawdź, czy nie włączono „Ogranicz do jednej odpowiedzi”.
3. Sprawdź, czy nie ma wymuszonego logowania albo dostępu tylko do domeny szkoły.
4. Formularz powinien jeszcze **nie przyjmować odpowiedzi**.
5. Otwórz `Ustawienia!B8`: ma być link prefill z wartościami `SP-999` i `SP26-CODE-TEST-12345678`. Ten link jest automatycznie udostępniany stronie przez PUBLICZNY katalog.
6. Sprawdź, czy `Katalog WWW` w głównym arkuszu nie zawiera błędów formuł.

## Krok 4: Otwórz deklaracje

1. Zweryfikuj aktualną listę produktów na rok 2026. W źródle są pozycje archiwalne z 2025 roku.
2. W arkuszu uzupełnij zgodną z RODO informację o przetwarzaniu danych. W repozytorium `docs/privacy.html` jest obecnie tylko szkicem — wymaga administratora danych, celu, podstawy, okresu przechowywania i kontaktu.
3. W edytorze skryptu, z którego utworzono formularz, uruchom funkcję `otworzFormularz2026`.
4. Ustawi ona `Ustawienia!B2 = TAK` i `Ustawienia!B5 = TAK` oraz zacznie przyjmować odpowiedzi.
5. Otwórz stronę: https://rr-zsp.github.io/Szlachetna_Paczka__2026/ . W razie potrzeby odśwież Ctrl+F5.

## Krok 5: Test w dwóch przeglądarkach

1. W zwykłym Chrome, będąc zalogowanym do Google, otwórz GitHub Pages.
2. Wybierz dostępny produkt, kliknij **Przejdź do formularza**, sprawdź ID i kod, wpisz darczyńcę testowego i wyślij formularz.
3. Sprawdź, czy powstał nowy wiersz w prywatnej zakładce `Odpowiedzi 2026`.
4. W `Kontrola Forms` zobacz wiersz danego ID: kod i pierwszy darczyńca. W `Katalog WWW` status zmieni się z `WOLNY` na `ZAREZERWOWANY`.
5. W publicznym arkuszu status powinien się zaktualizować. Na GitHubie naciśnij **Odśwież**.
6. W drugiej przeglądarce wyślij zgłoszenie na ten sam produkt: weryfikacja powinna wskazać pierwszego darczyńcę jako zwycięzcę i drugi kod jako bez przydziału.
7. Powtórz test na telefonie bez trybu incognito.
8. Po testach usuń wyłącznie utworzone zgłoszenia testowe z zakładki `Odpowiedzi 2026`, zachowując nagłówki i pozostałe zakładki. Nie usuwaj rzeczywistych deklaracji.

## Co robić, gdy coś nie działa

- **Na stronie „Publiczny arkusz jest niedostępny”** — sprawdź dostęp „Każdy z linkiem → Wyświetlający” w publicznym arkuszu.
- **Na stronie „Zezwól na dostęp”** — otwórz komórkę `Dane publiczne!A1` i zatwierdź `IMPORTRANGE`.
- **Lista działa, przycisk wysyłki jest szary** — sprawdź, czy formularz utworzono, czy `Katalog WWW!J2` ma link i czy `Ustawienia!B2` oraz `B5` to `TAK`.
- **Nie ma zakładki odpowiedzi** — sprawdź formularz → Odpowiedzi → Połącz z arkuszem, wskaż istniejący plik i nazwij nową zakładkę `Odpowiedzi 2026`.
- **Konto Google rodzica** — rodzic otwiera zwykły `docs.google.com/forms`, nie adres `script.google.com`. Formularz należy sprawdzić w zalogowanym Chrome i na telefonie.
- **Awaria / pilne zamknięcie** — uruchom `zamknijFormularz2026`.

## Ograniczenie, którego nie ukrywamy

Zgłoszenia w Google Forms są automatycznie zapisywane, a statusy liczone w Sheets według kolejności wierszy. Jednak Google Forms może przyjąć dwie sprzeczne deklaracje, **zanim rodzice zobaczą wynik przydziału**. To NIE jest transakcyjna natychmiastowa blokada na etapie klikania. Ostateczny przydział ustala Google Sheets, a rodzic sprawdza go po wysłaniu.

Formularz nie daje atomowego „wszystkie produkty albo żaden”. Każda pozycja może zostać przydzielona osobno. Nie należy zapewniać rodziców o potwierdzeniu zakupu, zanim status kodu wskaże przydział.
