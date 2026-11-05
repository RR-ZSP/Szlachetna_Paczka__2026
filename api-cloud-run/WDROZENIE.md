# Wdrożenie rozwiązania bez Apps Script i bez Cloudflare

## Co zostało przygotowane

Frontend pozostaje na GitHub Pages, a backend znajduje się w `api-cloud-run/`. Backend łączy się **bezpośrednio** z istniejącym prywatnym arkuszem Google za pomocą Google Sheets API. Rodzice nie używają już adresu `script.google.com`.

**Ważne:** kod backendu jest przygotowany, ale **nie został wdrożony ani przetestowany na żywym Cloud Run**. Wdrożenie wymaga dostępu do Twojego projektu Google Cloud i skonfigurowania rozliczeń, nawet jeśli mieścisz się w bezpłatnym limicie.

## 1. Konfiguracja Google Cloud

1. Otwórz https://console.cloud.google.com/ i wybierz/utwórz projekt.
2. Włącz Google Sheets API, Cloud Run API i Cloud Build API.
3. Utwórz konto usługi, np. `szlachetna-paczka-api`, bez tworzenia klucza JSON.
4. Skopiuj adres e-mail konta usługi, kończący się na `iam.gserviceaccount.com`.
5. Otwórz arkusz https://docs.google.com/spreadsheets/d/1tbldLo8NEEHzH4QTYkj3GyklFPAvA4VFWiQ1M2EJoNc/edit i udostępnij **tylko kontu usługi** z dostępem **Edytor**. Nigdy nie ustawiaj „Każdy — edytor”.
6. Zainstaluj i zaloguj się w Google Cloud CLI: `gcloud auth login` i `gcloud config set project TWOJ_PROJECT_ID`.

## 2. Wdrożenie backendu

W terminalu przejdź do katalogu `api-cloud-run/` i wykonaj (zamień oba identyfikatory):

```bash
gcloud run deploy szlachetna-paczka-api \
  --source . \
  --region europe-central2 \
  --allow-unauthenticated \
  --service-account szlachetna-paczka-api@TWOJ_PROJECT_ID.iam.gserviceaccount.com \
  --max-instances 1 \
  --concurrency 1 \
  --set-env-vars SHEET_ID=1tbldLo8NEEHzH4QTYkj3GyklFPAvA4VFWiQ1M2EJoNc,ALLOWED_ORIGIN=https://rr-zsp.github.io
```

Uwaga: backend zapisuje rezerwacje w serii operacji Google Sheets, więc w tym wariancie wymagane jest **1 uruchomiona instancja i concurrency=1**. Nie zmieniaj tego ustawienia bez poprawy mechanizmu współbieżności. Nie jest to pełna transakcja — w razie awarii pomiędzy zapisami może wymagać ręcznego uzgodnienia. Przy starcie akcji trzeba sprawdzić również limity i ochronę przed spamem.

Po wdrożeniu otrzymasz publiczny HTTPS URL usługi, np. `https://szlachetna-paczka-api-....run.app` (to przykład, NIE gotowy adres).

## 3. Test backendu

Otwórz w przeglądarce `TWÓJ_URL/health` — oczekiwana odpowiedź to `{"ok":true}`.
Następnie `TWÓJ_URL/api/items` — gdy `Ustawienia!B2 = TAK`, odpowiedź będzie zawierała listę aktywnych produktów.

## 4. Połączenie z frontendem

W repozytorium dołączony jest alternatywny frontend `docs/app-cloud.js`. Najpierw przetestuj wdrożony backend. Następnie:
1. W `docs/config.js` ustaw `window.SZLACHETNA_PACZKA_API_URL = 'TWÓJ_URL';` (bez /exec).
2. W `docs/index.html` zmień <script src="./app.js"> na <script src="./app-cloud.js">.
3. Sprawdź odczyt produktów i testową rezerwację na normalnej karcie telefonu.

Nie publikuj danych konta usługi, prywatnych kluczy, danych darczyńców ani ID tokenów w repozytorium.

## 5. Warunki uruchomienia

- Zatwierdź aktualną listę potrzeb na 2026 rok.
- Uzupełnij politykę prywatności i administratora danych.
- Zrób test na dwóch niezależnych urządzeniach, bez incognito.
- Sprawdź, czy ponowne użycie identyfikatora nie tworzy drugiej rezerwacji.
- Zrób kopię arkusza przed rozpoczęciem prawdziwych zgłoszeń.
