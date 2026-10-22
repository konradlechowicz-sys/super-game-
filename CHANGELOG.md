# Void Blaster: historia zmian

Najnowsze na górze. Każdy build ma swoją sekcję. Wydanie w App Store ma pełne podsumowanie wszystkich buildów od
poprzedniego wydania. `npm run review` pokazuje zmiany sprawdzanej wersji, a `npm run release` zmiany, które
wejdą do wydania.

Oznaczenia: **[Nowe]** nowa zawartość, **[Zmiana]** inne działanie czegoś, co już było, **[Balans]** trudność
i nagrody, **[Poprawka]** naprawiony błąd, **[App Store]** materiały do sklepu, **[Narzędzia]** skrypty
i wersja TEST (gracze tego nie widzą).

## Następne wydanie

<!-- Podsumowanie zmian od v1.1.1; uzupełnia Claude przy każdym buildzie. -->

### What's New (App Store)

- 

## Build 42 · 2026-10-22
- [Narzędzia] `npm run release`: ponowne wydanie buildu, który już był wydany (np. wersja, która nie trafiła do sklepu), liczy zmiany od wydania sprzed tego buildu i dopisuje „Ten sam build N co vX.Y.Z”; wcześniej lista „Wszystkie zmiany” wychodziła pusta.
- [Narzędzia] CHANGELOG.md: dodane sekcje v1.1.1 (build 41, pełne podsumowanie buildów 30–40) i v1.1.0 (build 40, nie wydane); „Następne wydanie” wyczyszczone.

## v1.1.1 · build 41 · 2026-10-22 · App Store

_Ten sam build 40 co v1.1.0, wydany ponownie jako v1.1.1._

- Opis w App Store: poprawiona nazwa broni Arc Coil.
- Elity z cechami: Swift, Bulwark, Berserker, Commander, Shielded, z własnymi atakami (szarża, uderzenie, posiłki, tarcze dla innych); wytrzymalsze w miarę trwania sektora; bogatsze nagrody; strzałka do elity poza ekranem.
- Arena 1,5× większa: więcej miejsca do manewrowania.
- Balans po testach autopilotem: słabsze elity na bazie ciężkich wrogów, łagodniejsze Bulwark i Shielded.
- Tłum boli: krótsza nietykalność po dotknięciu wroga i ścisk (+30% za każdego kolejnego wroga); statki +10 kadłuba.
- Gwiazdki: 3. gwiazdka za zniszczenie wszystkich elit (i bossa), cel zabójstw +20% w światach 2–4 (niższy w sektorach z ciężkimi wrogami), 50 monet za nową gwiazdkę, 300 za komplet w świecie; ekran wyników z postępem celów.

### What's New (App Store)

- Elite enemies now come with traits and attacks of their own: Swift charges, Berserkers slam the ground, Commanders call reinforcements, Shielded elites shield their allies, Bulwarks block your path. Beat them for richer rewards.
- An arrow at the screen edge points to elites out of sight.
- A 1.5x larger arena gives you more room to manoeuvre.
- Flying through a swarm now hurts: the more enemies touch your ship, the harder it hits. All ships get +10 hull.
- New third star: destroy every elite in the sector (and the boss). New stars pay 50 coins each, and collecting all 18 stars in a world earns a 300-coin bonus. Worlds 2-4 have higher kill goals.
- The results screen shows your progress on every goal, so you can see which star you missed.

### Wszystkie zmiany (buildy 30–40)

**Nowe**
- Elity z cechami (stałe dla każdego sektora; od 1-3 jedna cecha, w światach 3–4 dwie): **Swift** (szybka, co 4 s szarża po ostrzeżeniu linią), **Bulwark** (większa i twardsza, nie da się przez nią przelecieć, aura 120 px spowalnia statek o 35%), **Berserker** (×2,5 obrażeń, mocniejsze pociski, szał przy połowie HP), **Commander** (przychodzi z eskortą 6 wrogów, wrogowie w aurze 220 px +30% prędkości i +20% obrażeń), **Shielded** (tarcza = połowa HP, odnawia się po 3 s bez trafień). (build 33)
- Elita z cechą ma kolorową obwódkę i nazwę cechy nad paskiem HP; komunikat np. „SWIFT ELITE”, „COMMANDER SHIELDED ELITE”. (build 33)
- Samouczek: podpowiedź przy pierwszym spotkaniu każdej cechy. (build 33)
- Strzałka na krawędzi ekranu wskazuje elitę poza kadrem, w kolorze jej cechy (zwykła elita: złota). (build 34)
- Berserker w szale co 4 s uderza w ziemię: czerwony okrąg ostrzeżenia, po 0,75 s wybuch wokół niego. (build 35)
- Commander co 10 s wzywa 4 posiłki (napis „REINFORCEMENTS”), maksymalnie 12 żywych naraz. (build 35)
- Shielded co 5 s osłania wrogów w promieniu 180 px tarczą o sile 30% ich HP (fioletowy pierścień). (build 35)
- Przy ścisku 4+ wrogów: mocny czerwony błysk krawędzi ekranu i napis „CRUSHED ×N”. (build 37)
- Ekran wyników pokazuje postęp każdego celu („Kills 182 / 220”, „Elites 1 / 2”, czas przetrwania), a nieosiągnięty cel jest podświetlony na czerwono; także po przegranej. Nowe gwiazdki mają znaczek NEW, a premia za gwiazdki podaje, ile jest nowych. (build 38)

**Zmiana**
- Swift szarżuje co 2,5 s (było 4 s), czterokrotnie szybciej (było trzy). (build 35)
- Aura Bulwark: 160 px (było 120), spowalnia o 50% (było 35%). (build 35)
- Arena jest 1,5× większa w obu kierunkach (na typowym iPhonie ok. 1350×1950 zamiast 900×1300): więcej miejsca na manewry i ucieczkę od tłumu, rzadziej przyciśnięcie do ściany. Kamera bez zmian. (build 36)
- Trzecia gwiazdka: zniszcz wszystkie elity sektora (w sektorach z bossem: elity i bossa) zamiast „skończ z 50% kadłuba”. Odprawa sektora pokazuje nowy cel, np. „Destroy all 2 elites”, „Destroy 1 elite and the boss”. Zdobyte już gwiazdki zostają. (build 38)

**Balans**
- Elita z cechą zostawia skrzynię z dwiema nagrodami i więcej monet (20 przy jednej cesze, 28 przy dwóch; zwykła elita 12). (build 33)
- Elity z cechami są wytrzymalsze: HP ×10 na starcie sektora, rośnie do ×14 pod jego koniec (wcześniej stałe ×7); Bulwark dodatkowo +40%. (build 35)
- Tłum boli: po dotknięciu wroga nietykalność trwa 0,3 s (było 0,6 s; po pociskach i zagrożeniach bez zmian), a każdy kolejny wróg dotykający statku w tej samej chwili dodaje +30% obrażeń (maks. ×2,5). Pomiar: 3 s w tłumie 5 dronów kosztuje 176 kadłuba (było 40), przy 1 dronie 80 (było 40). (build 37)
- Statki mają +10 kadłuba: Striker 110, Phantom 80, Titan 160. (build 37)
- Cel zabójstw w światach 2–4 jest o 20% wyższy (np. 2-1: 1080 zamiast 900); świat 1 bez zmian. (build 38)
- Nagroda za gwiazdki: 50 monet za każdą nową gwiazdkę (było 15), 15 za gwiazdkę zdobytą ponownie; jednorazowo 300 monet za komplet 18 gwiazdek w świecie. (build 38)
- Elity na bazie ciężkich wrogów (Tank, Golem i podobne) mają HP ×8 na starcie sektora do ×11 pod koniec (było ×10 do ×14): autopilot nie był w stanie zabić Bulwarka w 1-4 i 2-4, a Swift+Shielded w 3-6 dożywał walki z bossem. (build 39)
- Bulwark: +20% HP (było +40%). Shielded: tarcza 35% HP (było 50%), odnawia się po 4 s bez trafień (było 3 s) i wolniej (10%/s zamiast 15%/s). (build 39)
- Niższe cele zabójstw tam, gdzie +20% było poza zasięgiem (sektory pełne ciężkich wrogów): 2-2 950, 2-4 510, 2-6 680, 3-1 1090, 3-2 640, 3-3 1180, 3-4 700, 3-5 1290, 3-6 680. Pozostałe sektory światów 2–4 zostają z +20%. (build 39)
- Po drugim pomiarze autopilotem: niższe cele zabójstw w 2-6 (600), 3-2 (530), 3-4 (640) i 3-6 (450). Walka z bossem w 3-6 skróciła się z 6–8 do 2–3 min, więc pada w niej mniej wrogów. (build 40)

**Poprawka**
- Commander nie ucieka już poza ekran: strzelający dowódcy (prism, eye) wracają w stronę statku, gdy odlecą dalej niż 190 px, zamiast trzymać się na dystans jak zwykłe strzelające elity. (build 34)
- Elity-wieżyczki (np. Commander w 3-3 i 3-5) pojawiają się w zasięgu wzroku, 150 px od statku, zamiast 190–280 px. (build 34)
- Komunikaty cech elit („ENRAGED”, „REINFORCEMENTS”, „SHIELD DOWN”) i „CRUSHED” widać także przy wyłączonych liczbach obrażeń. (build 37)

**App Store**
- Opis w sklepie (`appstore/LISTING.md`) używa nazwy broni z gry: „arc coil” zamiast „arc lightning”. Gra bez zmian; w App Store Connect trzeba poprawić opis ręcznie przy najbliższej wersji. (build 30)

**Narzędzia**
- Sekcja wydania v1.0.1 przeniesiona z gałęzi `release` do historii zmian, „Następne wydanie” zaczyna się od v1.0.1. (build 30)
- Buildy po wydaniu noszą numer najnowszej wydanej wersji: od tego buildu 1.0.1 (wcześniej zostawało 1.0.0, bo wydanie zmienia tylko gałąź `release`). `npm run bump` bierze go z najwyższego tagu `vX.Y.Z`; w Ustawieniach gry widać „v1.0.1 (build 31, …)”. (build 31)
- `npm run bump` aktualizuje też numer wersji w `package-lock.json`, więc `npm install` nie zostawia już „niezapisanej zmiany”, która zatrzymywała `review` i `release`. (build 32)
- `review` i `release` same odrzucają zmianę w `package-lock.json`, jeśli to tylko numer wersji (np. na starszej gałęzi `release`); inne zmiany dalej zatrzymują skrypt. (build 32)
- Panel 🛠: „Spawn elite with a trait” z wyborem cechy. (build 33)
- Panel 🛠: przycisk „WIN · 3 STARS” (wygrana ze spełnionymi wszystkimi celami). (build 38)

## v1.1.0 · build 40 · 2026-10-22 · nie wydane

_Oznaczone tagiem v1.1.0, ale przez pomyłkę nie trafiło do App Store; ten sam build 40 wyszedł jako v1.1.1 (build 41)._

## Build 40 · 2026-10-22
- [Balans] Po drugim pomiarze autopilotem: niższe cele zabójstw w 2-6 (600), 3-2 (530), 3-4 (640) i 3-6 (450). Walka z bossem w 3-6 skróciła się z 6–8 do 2–3 min, więc pada w niej mniej wrogów.

## Build 39 · 2026-10-22
- [Balans] Elity na bazie ciężkich wrogów (Tank, Golem i podobne) mają HP ×8 na starcie sektora do ×11 pod koniec (było ×10 do ×14): autopilot nie był w stanie zabić Bulwarka w 1-4 i 2-4, a Swift+Shielded w 3-6 dożywał walki z bossem.
- [Balans] Bulwark: +20% HP (było +40%). Shielded: tarcza 35% HP (było 50%), odnawia się po 4 s bez trafień (było 3 s) i wolniej (10%/s zamiast 15%/s).
- [Balans] Niższe cele zabójstw tam, gdzie +20% było poza zasięgiem (sektory pełne ciężkich wrogów): 2-2 950, 2-4 510, 2-6 680, 3-1 1090, 3-2 640, 3-3 1180, 3-4 700, 3-5 1290, 3-6 680. Pozostałe sektory światów 2–4 zostają z +20%.

## Build 38 · 2026-10-22
- [Zmiana] Trzecia gwiazdka: zniszcz wszystkie elity sektora (w sektorach z bossem: elity i bossa) zamiast „skończ z 50% kadłuba”. Odprawa sektora pokazuje nowy cel, np. „Destroy all 2 elites”, „Destroy 1 elite and the boss”. Zdobyte już gwiazdki zostają.
- [Balans] Cel zabójstw w światach 2–4 jest o 20% wyższy (np. 2-1: 1080 zamiast 900); świat 1 bez zmian.
- [Balans] Nagroda za gwiazdki: 50 monet za każdą nową gwiazdkę (było 15), 15 za gwiazdkę zdobytą ponownie; jednorazowo 300 monet za komplet 18 gwiazdek w świecie.
- [Nowe] Ekran wyników pokazuje postęp każdego celu („Kills 182 / 220”, „Elites 1 / 2”, czas przetrwania), a nieosiągnięty cel jest podświetlony na czerwono; także po przegranej. Nowe gwiazdki mają znaczek NEW, a premia za gwiazdki podaje, ile jest nowych.
- [Narzędzia] Panel 🛠: przycisk „WIN · 3 STARS” (wygrana ze spełnionymi wszystkimi celami).

## Build 37 · 2026-10-22
- [Balans] Tłum boli: po dotknięciu wroga nietykalność trwa 0,3 s (było 0,6 s; po pociskach i zagrożeniach bez zmian), a każdy kolejny wróg dotykający statku w tej samej chwili dodaje +30% obrażeń (maks. ×2,5). Pomiar: 3 s w tłumie 5 dronów kosztuje 176 kadłuba (było 40), przy 1 dronie 80 (było 40).
- [Nowe] Przy ścisku 4+ wrogów: mocny czerwony błysk krawędzi ekranu i napis „CRUSHED ×N”.
- [Balans] Statki mają +10 kadłuba: Striker 110, Phantom 80, Titan 160.
- [Poprawka] Komunikaty cech elit („ENRAGED”, „REINFORCEMENTS”, „SHIELD DOWN”) i „CRUSHED” widać także przy wyłączonych liczbach obrażeń.

## Build 36 · 2026-10-22
- [Zmiana] Arena jest 1,5× większa w obu kierunkach (na typowym iPhonie ok. 1350×1950 zamiast 900×1300): więcej miejsca na manewry i ucieczkę od tłumu, rzadziej przyciśnięcie do ściany. Kamera bez zmian.

## Build 35 · 2026-10-22
- [Balans] Elity z cechami są wytrzymalsze: HP ×10 na starcie sektora, rośnie do ×14 pod jego koniec (wcześniej stałe ×7); Bulwark dodatkowo +40%.
- [Zmiana] Swift szarżuje co 2,5 s (było 4 s), czterokrotnie szybciej (było trzy).
- [Nowe] Berserker w szale co 4 s uderza w ziemię: czerwony okrąg ostrzeżenia, po 0,75 s wybuch wokół niego.
- [Nowe] Commander co 10 s wzywa 4 posiłki (napis „REINFORCEMENTS”), maksymalnie 12 żywych naraz.
- [Nowe] Shielded co 5 s osłania wrogów w promieniu 180 px tarczą o sile 30% ich HP (fioletowy pierścień).
- [Zmiana] Aura Bulwark: 160 px (było 120), spowalnia o 50% (było 35%).

## Build 34 · 2026-10-22
- [Poprawka] Commander nie ucieka już poza ekran: strzelający dowódcy (prism, eye) wracają w stronę statku, gdy odlecą dalej niż 190 px, zamiast trzymać się na dystans jak zwykłe strzelające elity.
- [Poprawka] Elity-wieżyczki (np. Commander w 3-3 i 3-5) pojawiają się w zasięgu wzroku, 150 px od statku, zamiast 190–280 px.
- [Nowe] Strzałka na krawędzi ekranu wskazuje elitę poza kadrem, w kolorze jej cechy (zwykła elita: złota).

## Build 33 · 2026-10-22
- [Nowe] Elity z cechami (stałe dla każdego sektora; od 1-3 jedna cecha, w światach 3–4 dwie): **Swift** (szybka, co 4 s szarża po ostrzeżeniu linią), **Bulwark** (większa i twardsza, nie da się przez nią przelecieć, aura 120 px spowalnia statek o 35%), **Berserker** (×2,5 obrażeń, mocniejsze pociski, szał przy połowie HP), **Commander** (przychodzi z eskortą 6 wrogów, wrogowie w aurze 220 px +30% prędkości i +20% obrażeń), **Shielded** (tarcza = połowa HP, odnawia się po 3 s bez trafień).
- [Nowe] Elita z cechą ma kolorową obwódkę i nazwę cechy nad paskiem HP; komunikat np. „SWIFT ELITE”, „COMMANDER SHIELDED ELITE”.
- [Balans] Elita z cechą zostawia skrzynię z dwiema nagrodami i więcej monet (20 przy jednej cesze, 28 przy dwóch; zwykła elita 12).
- [Nowe] Samouczek: podpowiedź przy pierwszym spotkaniu każdej cechy.
- [Narzędzia] Panel 🛠: „Spawn elite with a trait” z wyborem cechy.

## Build 32 · 2026-10-20
- [Narzędzia] `npm run bump` aktualizuje też numer wersji w `package-lock.json`, więc `npm install` nie zostawia już „niezapisanej zmiany”, która zatrzymywała `review` i `release`.
- [Narzędzia] `review` i `release` same odrzucają zmianę w `package-lock.json`, jeśli to tylko numer wersji (np. na starszej gałęzi `release`); inne zmiany dalej zatrzymują skrypt.

## Build 31 · 2026-10-20
- [Narzędzia] Buildy po wydaniu noszą numer najnowszej wydanej wersji: od tego buildu 1.0.1 (wcześniej zostawało 1.0.0, bo wydanie zmienia tylko gałąź `release`). `npm run bump` bierze go z najwyższego tagu `vX.Y.Z`; w Ustawieniach gry widać „v1.0.1 (build 31, …)”.

## Build 30 · 2026-10-20
- [App Store] Opis w sklepie (`appstore/LISTING.md`) używa nazwy broni z gry: „arc coil” zamiast „arc lightning”. Gra bez zmian; w App Store Connect trzeba poprawić opis ręcznie przy najbliższej wersji.
- [Narzędzia] Sekcja wydania v1.0.1 przeniesiona z gałęzi `release` do historii zmian, „Następne wydanie” zaczyna się od v1.0.1.

## v1.0.1 · build 29 · 2026-10-20 · App Store

- Historia zmian: każdy build ma opis, a review i release go pokazują.
- Zamknięta luka w wersji przeglądarkowej: parametry testowe nie odblokowują już pełnej gry na publicznej stronie, a zapisy odblokowane wcześniej wracają do wersji próbnej.
- Zwrot pieniędzy za pełną wersję zabiera też statki z pełnej wersji.
- Reset postępu nie zabiera już kupionej pełnej wersji i nie daje drugi raz bonusu 1000 monet.

### What's New (App Store)

- Fixed: resetting your progress no longer locks the full game you bought.

### Wszystkie zmiany (buildy 22–29)

**Zmiana**
- Zwrot pieniędzy za „Full Game” w App Store zabiera też statki Phantom i Titan (wcześniej zostawały); wybrany statek wraca do Strikera. (build 24)

**Poprawka**
- Wersja w przeglądarce na GitHub Pages ignoruje parametry testowe (`?dev`, `&full`, `?test`): nie da się już za darmo odblokować pełnej gry dopisując je do adresu. Działają tylko lokalnie (localhost, sieć domowa, plik z dysku) i w wersji TEST. Gra w App Store nie była tym dotknięta. (build 23)
- Wersja w przeglądarce na GitHub Pages cofa do wersji próbnej zapis, który wcześniej odblokowano parametrami testowymi albo panelem 🛠 (pełna gra, Phantom, Titan, złota skórka). Monety i przejścia sektorów zostają, światy 2–4 są znowu zablokowane. (build 24)
- Strona w przeglądarce najpierw pobiera najnowsze pliki z sieci, a pamięć podręczną używa tylko bez internetu: nowa wersja działa od razu po wejściu, bez czyszczenia pamięci przeglądarki. (build 24)
- „Reset progress” w Ustawieniach kasuje tylko postęp: kupiona pełna wersja zostaje odblokowana (światy 2–4, Phantom, Titan, złota skórka, wszystkie poziomy ulepszeń). Wcześniej po resecie wracała oferta zakupu aż do ponownego uruchomienia gry. (build 29)
- Reset nie daje już ponownie bonusu 1000 monet za zakup (wcześniej po restarcie gry bonus wypłacał się drugi raz). (build 29)
- Reset zapisuje się od razu, także w kopii zapasowej na telefonie: wyłączenie gry tuż po resecie nie przywraca starego postępu. (build 29)

**App Store**
- Nazwa w App Store: „Void Blaster: Neon Survivor” (sama „Void Blaster” była zajęta), podtytuł „Blast the Neon Swarm”. Pod ikoną na iPhonie, w logo i w grze zostaje „Void Blaster”. Zmiana tylko w tekstach sklepu (`appstore/LISTING.md`), gra bez zmian. (build 25)

**Narzędzia**
- Historia zmian w `CHANGELOG.md`: `npm run bump` dodaje sekcję dla nowego buildu, Claude opisuje w niej zmiany. (build 22)
- `npm run review` pokazuje, co się zmieniło w każdej wersji do sprawdzenia (w porównaniu z zaakceptowaną). (build 22)
- `npm run release` pokazuje przy każdym zaakceptowanym buildzie jego zmiany, przed wydaniem wypisuje wszystkie zmiany od poprzedniego wydania, a w wydaniu zapisuje pełne podsumowanie (tag i `CHANGELOG.md`) oraz tekst „What's New” do App Store Connect. (build 22)
- Wspólna tablica przekazań między Claude a Codexem: `AI-HANDOFF.md` (zasady i bieżące przekazanie), `AGENTS.md` (instrukcje dla Codexa), odnośnik w `CLAUDE.md`. Przygotował Codex, scalone za zgodą Konrada; gra bez zmian. (build 26)
- Test komunikacji z Codexem: wpis w `AI-HANDOFF.md` z prośbą o potwierdzenie. Gra bez zmian. (build 27)
- Wiadomości między Claude a Codexem (commity zmieniające tylko `AI-HANDOFF.md`) nie podbijają już numeru buildu ani nie trafiają do historii zmian. Zasada zapisana w `CLAUDE.md` i `AI-HANDOFF.md`. (build 28)

## Build 29 · 2026-10-20
- [Poprawka] „Reset progress” w Ustawieniach kasuje tylko postęp: kupiona pełna wersja zostaje odblokowana (światy 2–4, Phantom, Titan, złota skórka, wszystkie poziomy ulepszeń). Wcześniej po resecie wracała oferta zakupu aż do ponownego uruchomienia gry.
- [Poprawka] Reset nie daje już ponownie bonusu 1000 monet za zakup (wcześniej po restarcie gry bonus wypłacał się drugi raz).
- [Poprawka] Reset zapisuje się od razu, także w kopii zapasowej na telefonie: wyłączenie gry tuż po resecie nie przywraca starego postępu.

## Build 28 · 2026-10-20
- [Narzędzia] Wiadomości między Claude a Codexem (commity zmieniające tylko `AI-HANDOFF.md`) nie podbijają już numeru buildu ani nie trafiają do historii zmian. Zasada zapisana w `CLAUDE.md` i `AI-HANDOFF.md`.

## Build 27 · 2026-10-20
- [Narzędzia] Test komunikacji z Codexem: wpis w `AI-HANDOFF.md` z prośbą o potwierdzenie. Gra bez zmian.

## Build 26 · 2026-10-20
- [Narzędzia] Wspólna tablica przekazań między Claude a Codexem: `AI-HANDOFF.md` (zasady i bieżące przekazanie), `AGENTS.md` (instrukcje dla Codexa), odnośnik w `CLAUDE.md`. Przygotował Codex, scalone za zgodą Konrada; gra bez zmian.

## Build 25 · 2026-10-20
- [App Store] Nazwa w App Store: „Void Blaster: Neon Survivor” (sama „Void Blaster” była zajęta), podtytuł „Blast the Neon Swarm”. Pod ikoną na iPhonie, w logo i w grze zostaje „Void Blaster”. Zmiana tylko w tekstach sklepu (`appstore/LISTING.md`), gra bez zmian.

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
