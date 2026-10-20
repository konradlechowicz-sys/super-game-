# Void Blaster: historia zmian

Najnowsze na górze. Każdy build ma swoją sekcję. Wydanie w App Store ma pełne podsumowanie wszystkich buildów od
poprzedniego wydania. `npm run review` pokazuje zmiany sprawdzanej wersji, a `npm run release` zmiany, które
wejdą do wydania.

Oznaczenia: **[Nowe]** nowa zawartość, **[Zmiana]** inne działanie czegoś, co już było, **[Balans]** trudność
i nagrody, **[Poprawka]** naprawiony błąd, **[App Store]** materiały do sklepu, **[Narzędzia]** skrypty
i wersja TEST (gracze tego nie widzą).

## Następne wydanie

<!-- Podsumowanie zmian od v1.0.0; uzupełnia Claude przy każdym buildzie. -->

- Historia zmian: każdy build ma opis, a review i release go pokazują.
- Zamknięta luka w wersji przeglądarkowej: parametry testowe nie odblokowują już pełnej gry na publicznej stronie, a zapisy odblokowane wcześniej wracają do wersji próbnej.
- Zwrot pieniędzy za pełną wersję zabiera też statki z pełnej wersji.

### What's New (App Store)

- 

## Build 24 · 2026-10-20
- [Poprawka] Wersja w przeglądarce na GitHub Pages cofa do wersji próbnej zapis, który wcześniej odblokowano parametrami testowymi albo panelem 🛠 (pełna gra, Phantom, Titan, złota skórka). Monety i przejścia sektorów zostają, światy 2–4 są znowu zablokowane.
- [Zmiana] Zwrot pieniędzy za „Full Game” w App Store zabiera też statki Phantom i Titan (wcześniej zostawały); wybrany statek wraca do Strikera.
- [Poprawka] Strona w przeglądarce najpierw pobiera najnowsze pliki z sieci, a pamięć podręczną używa tylko bez internetu: nowa wersja działa od razu po wejściu, bez czyszczenia pamięci przeglądarki.

## Build 23 · 2026-10-20
- [Poprawka] Wersja w przeglądarce na GitHub Pages ignoruje parametry testowe (`?dev`, `&full`, `?test`): nie da się już za darmo odblokować pełnej gry dopisując je do adresu. Działają tylko lokalnie (localhost, sieć domowa, plik z dysku) i w wersji TEST. Gra w App Store nie była tym dotknięta.

## Build 22 · 2026-10-20
- [Narzędzia] Historia zmian w `CHANGELOG.md`: `npm run bump` dodaje sekcję dla nowego buildu, Claude opisuje w niej zmiany.
- [Narzędzia] `npm run review` pokazuje, co się zmieniło w każdej wersji do sprawdzenia (w porównaniu z zaakceptowaną).
- [Narzędzia] `npm run release` pokazuje przy każdym zaakceptowanym buildzie jego zmiany, przed wydaniem wypisuje wszystkie zmiany od poprzedniego wydania, a w wydaniu zapisuje pełne podsumowanie (tag i `CHANGELOG.md`) oraz tekst „What's New” do App Store Connect.

## v1.0.0 · build 21 · 2026-10-19 · App Store

Pierwsze wydanie. Neonowy kosmiczny survivor na iPhone'a, cała gra w jednym zakupie.

- **4 światy, 24 sektory:** Neon Nebula, Crystal Belt, Solar Forge i Void Core; każdy ma własnych wrogów, zagrożenia (asteroidy, ostrzał moździerzy, rozbłyski, studnie grawitacyjne) i bossa: Hive Mother, Crystal Serpent, Forge Titan i Void Heart.
- **Statki i rozwój:** Striker, Phantom i Titan; broń i ulepszenia wybierane przy awansie, ewolucje broni, skrzynie od elit; stałe ulepszenia w sklepie za monety; codzienna nagroda; trzy gwiazdki za sektor.
- **Sterowanie:** joystick, joystick pływający albo przeciąganie palcem.
- **Samouczek:** podpowiedzi przy pierwszym ruchu, kryształach, elicie, skrzyni, bonusach i bossie, ze spowolnieniem czasu; można je pominąć i włączyć ponownie w Ustawieniach.
- **Model sprzedaży:** świat 1 z bossem za darmo; jeden zakup „Full Game” (USD 3.99) odblokowuje światy 2–4, Phantoma i Titana, wszystkie poziomy ulepszeń, 1000 monet i złotą skórkę Strikera. Bez reklam i subskrypcji. Przywracanie zakupu.
- **Zapis:** postęp zapisany na urządzeniu, z kopią natywną na wypadek wyczyszczenia danych WebView.

### What's New (App Store)

First release.

## Build 21 · 2026-10-19
- [App Store] Zrzuty ekranu we wszystkich obecnych rozmiarach iPhone'a.

## Build 20 · 2026-10-19
- [Narzędzia] Projekt Xcode podpisywany zespołem Apple Developer Konrada (6V97J7SV57).

## Build 19 · 2026-10-19
- [App Store] Grafiki do mediów społecznościowych: zdjęcie profilowe, baner i miniatura YouTube, pionowa okładka.

## Build 18 · 2026-10-19
- [Narzędzia] review i release odrzucają (po potwierdzeniu) zmiany, które Xcode sam zapisuje w `ios/`.

## Build 17 · 2026-10-19
- [Narzędzia] Plik testowy StoreKit w formacie Xcode i wspólny schemat, który go wybiera: zakup działa w symulatorze.

## Build 16 · 2026-10-19
- [Narzędzia] Linia TEST: panel testera 🛠 jako wariant tego samego kodu (przeglądarka, symulator, telefon).

## Build 15 · 2026-10-19
- [Narzędzia] Numery buildów nigdy się nie powtarzają (liczone też na innych gałęziach).

## Build 14 · 2026-10-19
- [Narzędzia] Build testowy z menu BOSS TEST dla światów 2–4. Zostaje tylko na gałęzi `test/build-14-boss-test`, do gry nie wszedł.

## Build 13 · 2026-10-18
- [Zmiana] Mniejsze dymki samouczka w menu.

## Build 12 · 2026-10-18
- [Nowe] Samouczek: podpowiedzi w grze ze spowolnieniem czasu, podpowiedzi na kartach, wskazówki na mapie i w menu.

## Build 11 · 2026-10-18
- [Nowe] Darmowa wersja próbna i jednorazowy zakup „Full Game” (StoreKit 2).

## Build 10 · 2026-10-18
- [Zmiana] Sklep pokazuje działanie ulepszenia teraz i po zakupie.

## Build 9 · 2026-10-18
- [Poprawka] Karty awansu reagują na pierwsze dotknięcie na iPhonie.

## Build 8 · 2026-10-18
- [Narzędzia] review buduje i uruchamia wersję jej własnymi skryptami.

## Build 7 · 2026-10-18
- [Narzędzia] Symulator uruchamiany przez xcodebuild i simctl.

## Build 6 · 2026-10-18
- [Narzędzia] Podpowiedź, jak naprawić brakujący symulator iOS (xcode-select).

## Build 5 · 2026-10-18
- [Narzędzia] review i release nie blokują się na plikach podręcznych Xcode.

## Build 4 · 2026-10-18
- [Narzędzia] `npm run release`: oznaczanie zaakceptowanych buildów do App Store.

## Build 3 · 2026-10-18
- [Narzędzia] `npm run review`: sprawdzanie wersji z chmury w symulatorze, akceptacja lub odrzucenie.

## Build 2 · 2026-10-18
- [Zmiana] Numer wersji w górnym pasku ekranu startowego.
- [Narzędzia] `npm run sim`: budowanie i uruchamianie w symulatorze iOS.

## Build 1 · 2026-10-18
- [Zmiana] Numer wersji i buildu na ekranie startowym.
- [Narzędzia] Wcześniej, bez numerów buildów: prototyp gry, sterowanie, światy 2–4, projekt iOS, materiały do App Store.
