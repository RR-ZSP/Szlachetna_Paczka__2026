# Szlachetna Paczka 2026 — ZSP Mikołów

## Aktualny wariant: GitHub Pages + Google Forms + Google Sheets

**Nie używamy już publicznego Apps Script jako API. Nie potrzeba Firebase ani Cloud Run.**

- Strona dla rodziców: https://rr-zsp.github.io/Szlachetna_Paczka__2026/
- Prywatny arkusz organizatora: https://docs.google.com/spreadsheets/d/1tbldLo8NEEHzH4QTYkj3GyklFPAvA4VFWiQ1M2EJoNc/edit
- Osobny arkusz publiczny: https://docs.google.com/spreadsheets/d/1NSI2Mgqx6vguM5qpJ-NU1Bz9nkPHWtwbRxmUH7nSF8k/edit

### Aby uruchomić

1. Otwórz [instrukcję wdrożenia](URUCHOMIENIE_GOOGLE_FORMS.md).
2. Uruchom jednorazowo plik `formularz-google/SETUP_2026.gs` **jako organizator** w edytorze Google Apps Script. Nie publikuj go jako aplikacji WWW.
3. W publicznym arkuszu zezwól `IMPORTRANGE` na odczyt wyłącznie zakładki `Katalog WWW`.
4. Udostępnij do odczytu **tylko** osobny arkusz publiczny.
5. Zweryfikuj produkty i politykę prywatności; potem uruchom `otworzFormularz2026`.
6. Przetestuj przydział i konflikt dwóch deklaracji.

### Status bezpieczeństwa

**Formularz i przycisk rezerwacji pozostają wyłączone do zakończenia konfiguracji.**
Nie publikuj prywatnego arkusza ani danych darczyńców.

### Jak działa przydział

Każda pozycja trafia do pierwszego zgłoszenia, którego wiersz zawiera jej ID. Google Forms może przyjąć dwa sprzeczne zgłoszenia; wygrywa **pierwsza odpowiedź**, a późniejsza nie otrzymuje tego produktu. To nie jest transakcyjny backend czasu rzeczywistego. Rezerwacja kilku produktów może być częściowa.

### Archiwalne pliki

`apps-script/Code.gs` i `api-cloud-run/` pochodzą z wcześniejszych, niedziałających lub nieuruchomionych koncepcji. Nie używaj ich do aktualnego wdrożenia. Aktywna strona to `docs/index.html` z `app-forms-catalog.js` i `app-forms-reserve.js`.
