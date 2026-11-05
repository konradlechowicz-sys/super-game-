# Google Play: od konta do zamkniętych testów i premiery (Void Blaster 2.0)

Kolejność kroków, z których każdy robisz raz. Gra jest gotowa po stronie kodu (od buildu 144):
- zakup pełnej gry: Google Play Billing (`StorePlugin.java`),
- rankingi Endless: Google Play Games (`PlayGamesPlugin.java`),
- przycisk „wstecz”,
- podpisany pakiet: `npm run android:bundle`.

Nazwy menu w Play Console mogą się nieco różnić; w razie wątpliwości podeślij zrzut ekranu.

## 1. Konto dewelopera (raz, kilka dni na weryfikację)
1. https://play.google.com/console → załóż konto **osobiste** (Personal) na swoje konto Google; opłata jednorazowa 25 USD.
2. Weryfikacja tożsamości (dowód osobisty) i numeru telefonu; Google weryfikuje do kilku dni.
3. Konto osobiste założone po listopadzie 2023 r. musi przed publikacją przeprowadzić **zamknięte testy: co najmniej
   12 testerów przez 14 dni bez przerwy**. Dopiero potem odblokowuje się dostęp do produkcji.
4. **Profil płatności** (Ustawienia → Profil płatności) z kontem bankowym i danymi podatkowymi; bez niego nie da się
   założyć płatnego produktu.

## 2. Aplikacja
1. **Utwórz aplikację:** nazwa `Void Blaster`, język domyślny English (US), typ **Gra**, **Bezpłatna** (pełna gra to zakup
   w aplikacji), zaznacz oświadczenia.
2. Identyfikator pakietu ustala pierwszy przesłany plik: `com.konradlechowicz.voidblaster` (z `npm run android:bundle`).

## 3. Pierwszy pakiet
1. Na Macu lub Windowsie, na gałęzi `v2`: `npm run android:bundle`.
   - Za pierwszym razem zapyta o **hasło klucza** i utworzy `android/void-blaster-upload.jks` + `android/keystore.properties`.
   - **Zrób kopię zapasową obu plików i hasła** (np. w menedżerze haseł). Są poza gitem.
   - Wynik: `dist/void-blaster-build-N.aab`.
2. Play Console → **Testowanie → Testy zamknięte → Utwórz ścieżkę** (lub użyj „Alpha”) → **Utwórz nową wersję** →
   prześlij `.aab`. Przy pierwszym przesłaniu zgódź się na **Podpisywanie aplikacji przez Google Play** (Google trzyma
   klucz aplikacji, Twój plik `.jks` to tylko klucz do wysyłania).
3. Nazwa wersji i opis zmian: np. „2.0 closed test, build N”.

## 4. Produkt „Full Game” (zakup w aplikacji)
Dostępne dopiero, gdy w Play Console jest przesłany pakiet z biblioteką Billing (krok 3) i jest profil płatności.
1. **Zarabianie → Produkty → Produkty w aplikacji → Utwórz produkt**.
2. **Identyfikator produktu:** `com.konradlechowicz.voidblaster.fullgame` (dokładnie tak jak w App Store, gra go używa).
3. Nazwa: `Full Game`; opis (English): `Unlock all 10 worlds, the Phantom and Titan, every upgrade level, the Gold Striker
   skin and 1,000 coins.`
4. **Cena:** ok. 4,99 USD (Twoja decyzja dla 2.0); Google przeliczy na inne waluty.
5. **Aktywuj** produkt.
6. Testowanie zakupu bez płacenia: **Ustawienia → Testowanie licencji** → dodaj swój adres Gmail (i testerów).
   Testerzy licencji płacą „kartą testową”, nic nie jest pobierane.

## 5. Zamknięte testy: 12 testerów przez 14 dni
1. **Testy zamknięte → Testerzy:** utwórz listę e-maili (konta Google) albo grupę Google; potrzeba **co najmniej 12 osób**,
   które zaakceptują zaproszenie i zostaną w teście 14 dni (mogą grać choć raz dziennie, ważne, by nie zrezygnowały).
2. Skopiuj **link do dołączenia** i wyślij testerom; każdy otwiera link na telefonie z Androidem, akceptuje i instaluje
   grę z Google Play.
3. Licznik 14 dni rusza, gdy jest 12 zaakceptowanych testerów. Nowe wersje (`npm run android:bundle` po każdym buildzie)
   wgrywasz do tej samej ścieżki; testerzy dostają aktualizację automatycznie.
4. Po 14 dniach: **Panel → Wnioskuj o dostęp do produkcji** (krótka ankieta o testach).

## 6. Treść sklepu i wymagane formularze (w trakcie testów)
- **Strona sklepu (Główna strona sklepu):** krótki opis (80 znaków), pełny opis, ikona 512×512, grafika promocyjna
  1024×500 (`appstore/2.0/google-play-feature-1024x500.png`), co najmniej 2 zrzuty ekranu telefonu (pionowe), filmik
  YouTube opcjonalnie (np. VB-01 z `appstore/2.0/video`). Teksty: `appstore/GOOGLE-PLAY-LISTING.md`.
- **Polityka prywatności:** https://konradlechowicz-sys.github.io/super-game-/site/privacy.html (ta sama co w App Store).
- **Bezpieczeństwo danych:** gra nie zbiera danych osobowych; zapis jest na telefonie. Zakupy obsługuje Google Play, a
  rankingi Google Play Games (to usługi Google, zaznacz zgodnie z ankietą, jeśli pyta o dane konta gracza).
- **Ocena treści (IARC):** ankieta; przemoc fantastyczna wobec robotów/obcych, bez krwi, bez czatu, zakupy w aplikacji
  → zwykle PEGI 7 / Everyone 10+.
- **Grupa docelowa:** 13+ (nie projektuj dla dzieci, unikasz dodatkowych wymagań programu Families).
- **Reklamy:** brak. **Dostęp do aplikacji:** wszystko dostępne bez logowania.

## 7. Rankingi Endless w Google Play Games (opcjonalnie, można po premierze)
1. **Play Games Services → Konfiguracja → Utwórz projekt Play Games** (powiązany z aplikacją). Dodaj dane uwierzytelniające
   Androida (Google podpowie odcisk SHA-1 klucza z „Podpisywania aplikacji”).
2. **Tablice wyników:** 10 sztuk, po jednej na świat: `Endless: Orbital Ruins`, `Endless: Siege of Earth`,
   `Endless: Lunar Bridgehead`, `Endless: Red Conversion`, `Endless: Foundry Belt`, `Endless: Storm Relay`,
   `Endless: Abyss of Europa`, `Endless: The Rift Gate`, `Endless: Brood World`, `Endless: The Nexus`;
   format liczbowy, kolejność: wyższy wynik lepszy.
3. Prześlij mi: **identyfikator projektu** (liczba, z Konfiguracji) i **10 identyfikatorów tablic** (np. `CgkI…`). Wpiszę je
   do gry (`res/values/strings.xml` i `js/leaderboard.js`); do tego czasu na Androidzie nie ma przycisku rankingu.
4. Opublikuj zmiany w Play Games Services (osobny przycisk „Opublikuj” w tej sekcji).

## 8. Premiera
Gdy produkcja jest odblokowana: **Produkcja → Utwórz wersję** z tym samym pakietem co iOS (ten sam build), kraje: wszystkie,
data: ta sama co premiera na iPhone (decyzja z 2026-10-26: iOS i Android tego samego dnia).
