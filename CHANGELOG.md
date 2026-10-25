# Void Blaster: historia zmian

Najnowsze na górze. Każdy build ma swoją sekcję. Wydanie w App Store ma pełne podsumowanie wszystkich buildów od
poprzedniego wydania. `npm run review` pokazuje zmiany sprawdzanej wersji, a `npm run release` zmiany, które
wejdą do wydania.

Oznaczenia: **[Nowe]** nowa zawartość, **[Zmiana]** inne działanie czegoś, co już było, **[Balans]** trudność
i nagrody, **[Poprawka]** naprawiony błąd, **[App Store]** materiały do sklepu, **[Narzędzia]** skrypty
i wersja TEST (gracze tego nie widzą).

## Następne wydanie

<!-- Podsumowanie zmian od v1.2.0; uzupełnia Claude przy każdym buildzie. -->

- Tryb Endless w każdym świecie: po pokonaniu Void Heart (pełna wersja) gra trwa do zniszczenia statku, wynik to liczba zabitych wrogów. Co minutę fala, co 2,5 minuty elita, co 5 minut boss świata, wrogowie stale mocniejsi. Monety z przelotu plus 40 za każdą minutę, rekord każdego świata zapisany.
- Rankingi Game Center: osobny ranking Endless dla każdego świata.

### What's New (App Store)

- Endless mode: beat the Void Heart to open Endless in every world. The swarm never stops: a wave every minute, an elite every 2.5 minutes and the world's boss every 5 minutes, and enemies keep getting tougher. Your score is your kill count.
- Game Center leaderboards: one Endless leaderboard per world. How long can you last?
- Coins from every Endless run, plus a bonus for each minute survived.

## Build 62 · 2026-10-25
- [Nowe] Tryb Endless (pełna wersja, otwiera się po pokonaniu Void Heart): karta „∞ ENDLESS” pod sektorami każdego świata, z rekordem. Przelot trwa do zniszczenia statku, a wynik to liczba zabitych wrogów. Wrogowie świata (jak w jego 5. sektorze), wytrzymałość i obrażenia rosną przez pierwsze 6 minut i dalej. Co minutę fala (pierścień, natarcie albo zagrożenie świata: asteroidy, ostrzał, rozbłyski, studnie grawitacyjne), co 2,5 minuty elita z cechą (po 10 minutach z dwiema), co 5 minut boss świata, za każdym razem o połowę wytrzymalszy; po jego zniszczeniu gra toczy się dalej. Licznik czasu liczy w górę.
- [Nowe] Ekran wyników Endless: wynik, „NEW BEST”, czas, liczba bossów, monety z przelotu i premia 40 monet za każdą minutę. Rekord każdego świata zapisany (`save.endless`).
- [Nowe] Rankingi Game Center (iOS): wynik Endless trafia do rankingu świata; przycisk rankingu w odprawie i na ekranie wyników. Logowanie do Game Center dopiero po odblokowaniu Endless. Na stronie w przeglądarce i na Androidzie rankingów nie ma (przyciski ukryte). Rankingi trzeba założyć w App Store Connect: instrukcja w `appstore/GAME-CENTER.md`.
- [Zmiana] Na koniec gry (po Void Heart) wyniki mówią, że Endless jest otwarty w każdym świecie.
- [Narzędzia] Panel 🛠 w Endless: „BOSS NOW” przywołuje bossa, „SKIP 30 S” przesuwa czas, „END RUN” kończy przelot z wynikiem.
- [Narzędzia] Projekt iOS: nowy plik `GameCenterPlugin.swift` i uprawnienie Game Center (`App.entitlements`). Plan 1.3: najpierw iOS (Endless + Game Center), potem Android.

## Build 61 · 2026-10-25
- [Narzędzia] `art/2.0/audio/SUNO-PROMPTS.md`: katalog promptów do Suno dla całej muzyki 2.0. Każdy z 10 światów ma własny temat (utwór sektora i utwór bossa robiony funkcją Cover z sektora), do tego menu i hangar, mapa podróży, tryb Endless, intro, zakończenie i porażka. Zawiera zasady (płatny plan, WAV, nazwy plików, pętle) i tabelę postępu. Dokument koncepcji 2.0 uzupełniony o muzykę.

## Build 60 · 2026-10-25
- [Narzędzia] Zwiastun 2.0 ma 15 sekund i muzykę z Suno (`art/2.0/audio/`), a cięcia leżą na taktach utworu (142 BPM): Ziemia na mrocznym wstępie, start Strikera w ostatnim takcie przed wejściem bitu, walka od wejścia bitu, combo na pierwszą miarę taktu, boss, a plansza tytułowa na końcowym uderzeniu utworu. Z efektów zostały tylko subtelne strzały pod muzyką (decyzja Konrada); pełny zestaw efektów można włączyć opcją. Czasy ujęć są w jednym miejscu (`teaser/timeline.js`), a fragment muzyki wycina `npm run teaser`.

## Build 59 · 2026-10-25
- [Narzędzia] Zwiastun 2.0: efekty dźwiękowe zaprojektowane od nowa, każdy z kilku warstw (uderzenie, przesterowane „ciało”, niski bas, ogon w pogłosie, iskry, odłamki, stereo). Lasery z modulacją FM (jonowe z trzaskiem), wybuchy z odłamkami (duże wrogowie mocniej), trzaskające pioruny, cyfrowe przejmowanie satelitów, robotyczny szept Kolektywu, klakson alarmu, zapłon i ryk silników, dopalacz przy starcie, wyrzutnie dronów Harvestera, metaliczne trafienia w bossa, fala uderzeniowa combo, filmowe uderzenia na cięciach. Muzyka i efekty są teraz osobnymi ścieżkami (muzyka czeka na Suno); nagranie zostawia obraz bez dźwięku i obie ścieżki, więc muzykę można podłożyć bez ponownego nagrywania.

## Build 58 · 2026-10-25
- [Narzędzia] Nowe grafiki 2.0 od ChatGPT w `art/2.0/`: podłoga świata 1 (A1; z podglądu 2×2 wycięty kafel bez szwów), boss Harvester (A6: cały, kadłub, arkusz i 16 wyciętych części), emblemat logo (E3). Zwiastun używa ich zamiast zastępstw: prawdziwy Harvester z pulsującym rdzeniem, silnikami i wyrzutniami, z których wypadają drony, emblemat na planszy tytułowej i nowa podłoga w walce. Gra bez zmian.

## Build 57 · 2026-10-25
- [Narzędzia] Zwiastun 2.0 dostał dźwięk: muzykę i efekty syntezowane w Web Audio, jak w grze (bez plików i licencji), zgrane co do klatki z animacją. Ciemny dron i szept Kolektywu nad Ziemią, alarm, silniki i start w hangarze, rytm 141 BPM w walce z uderzeniem na combo, „braam”, syrena i ładowanie rdzenia przy bossie, wielkie uderzenie i jasny akord na tytule. Strzały, wybuchy, pioruny i przejęcia satelitów brzmią dokładnie wtedy, gdy dzieją się na ekranie. MP4 ma dźwięk AAC wyrównany do -14 LUFS (standard serwisów społecznościowych); strona zwiastuna gra z dźwiękiem po dotknięciu.

## Build 56 · 2026-10-25
- [Narzędzia] Zwiastun 2.0 (10 s, pionowy 1080×1920) zrobiony w silniku PixiJS z grafik `art/2.0/teaser/` (zadania T1–T4 od ChatGPT): Kolektyw przejmuje orbitę Ziemi, start Strikera z hangaru, walka z combo ION BOLTS, nadlatujący boss (na razie sylwetka elitarnego drona, dopóki nie ma Harvestera), plansza tytułowa. `npm run teaser` buduje stronę, `npm run teaser:video` nagrywa MP4. Gra bez zmian.

## Build 55 · 2026-10-25
- [Narzędzia] Instrukcja dla ChatGPT (`art/2.0/CHATGPT-BRIEF.md`): fabuła 2.0 (Void Collective, podróż od orbity Ziemi do serca wroga), 10 światów w kolejności podróży z mechaniką, kolorami, proporcją techniki i organiki, 6 wrogami i bossem każdy; boss świata 1 to Harvester; mapa podróży zamiast mapy galaktyki. CLAUDE.md i README grafik uzupełnione.

## Build 54 · 2026-10-25
- [Narzędzia] `art/2.0/CHATGPT-BRIEF.md`: kompletna instrukcja dla ChatGPT do grafiki wersji 2.0 (blok stylu, zasady, 10 światów z wrogami i bossami, 11 broni z ewolucjami, combo, interfejs, efekty jako paski klatek, materiały do sklepów; zadania A–G w kolejności produkcji).

## Build 53 · 2026-10-24
- [Narzędzia] CHANGELOG.md: sekcja wydania v1.2.0 (build 52) skopiowana z gałęzi release, „Następne wydanie” wyczyszczone. CLAUDE.md: 1.2.0 wydane, 2.0 dopiero po 1.3, w 2.0 10 światów po 6 sektorów.

## v1.2.0 · build 52 · 2026-10-24 · App Store

- Combo broni: 6 par broni, które na poziomie 3+ dają dodatkowy efekt; karty podpowiadają pasujące bronie.
- Zestawy perków: 5 par perków z dodatkowym efektem (Overdrive, Ram Plating, Singularity, Hit & Run, Last Stand).
- Nowe ewolucje: Flak Cannon, Supernova, Drone Squadron, Gravity Mines; każda z 8 broni może teraz ewoluować.
- Księga ulepszeń CODEX (33 wpisy, nieodkryte pod „???”), aktywne combo w HUD i w pauzie.
- Trudniej: wrogowie zadają więcej obrażeń (szczególnie w światach 2–4 i pod koniec sektora), elity i bossowie są wytrzymalsi.

### What's New (App Store)

- Weapon combos: pair the right weapons and level both to 3 to unlock a bonus effect, like mines that fire chain lightning or missiles that burst into pellets. Level-up cards tell you which weapons pair up.
- Perk sets: Overdrive, Ram Plating, Singularity, Hit & Run and Last Stand reward the right pair of perks.
- Four new weapon evolutions: Flak Cannon, Supernova, Drone Squadron and Gravity Mines. Every weapon can now evolve.
- The new Codex collects every weapon, evolution, combo and perk set you discover. Undiscovered entries stay hidden behind "???".
- Tougher enemies: they hit harder, especially in worlds 2-4 and late in each sector, and elites and bosses take more punishment.

### Wszystkie zmiany (buildy 42–52)

**Nowe**
- Combo broni: gdy dwie pasujące bronie mają poziom 3+, włącza się dodatkowy efekt do końca przelotu (napis „COMBO!”, błysk i dźwięk). Sześć combo: **Storm Mines** (Arc Coil + Proximity Mines: wybuch miny wypuszcza łańcuch piorunów), **Cluster Missiles** (Seeker Missiles + Scatter Gun: wybuch rakiety rozrzuca 6 odłamków), **Blade Nova** (Orbit Blades + Nova Pulse: impuls wyrzuca ostrza na orbitę większą o 60%, na 1,2 s, z +50% obrażeń), **Twin Link** (Wingman Drone + Pulse Blaster: drony strzelają razem z każdą salwą blastera, połową jej siły), **Ion Bolts** (Pulse Blaster + Arc Coil: trafienie przeskakuje iskrą na sąsiedniego wroga, połową obrażeń), **Minelayer** (Seeker Missiles + Proximity Mines: wybuch rakiety zostawia minę w 35% przypadków). (build 44)
- Karta broni podpowiada combo, gdy masz już pasującą broń („⚡ Combo with Arc Coil at LV 3”), a karta, która je włącza, świeci na turkusowo („Unlocks combo: Storm Mines”). Takie karty pojawiają się trochę częściej. (build 44)
- Zestawy perków: gdy dwa pasujące perki mają poziom 3+, włącza się dodatkowy efekt do końca przelotu (napis „PERK SET!”). Pięć zestawów: **Overdrive** (Power Core + Overclock: co 12 s przez 4 s bronie strzelają o 50% szybciej, napis „OVERDRIVE”), **Ram Plating** (Armor Plating + Thrusters: tłum zadaje 30% mniej, a dotykający wrogowie są odrzucani), **Singularity** (Tractor Beam + Amplifier: co 25 s wszystkie kryształy XP lecą do statku), **Hit & Run** (Thrusters + Overclock: +15% obrażeń w ruchu), **Last Stand** (Power Core + Armor Plating: +25% obrażeń poniżej 50% kadłuba). (build 47)
- Karta perka podpowiada zestaw, gdy masz już pasujący perk („⚡ Set with Power Core at LV 3”), a karta, która go włącza, świeci na turkusowo; takie karty pojawiają się trochę częściej. (build 47)
- Ewolucje dla czterech kolejnych broni (teraz wszystkie 8 broni ma ewolucję; broń na poziomie 5 + perk): **Flak Cannon** (Scatter Gun + Armor Plating: 9 złotych śrutów, każdy wybucha przy trafieniu i rani wrogów obok), **Supernova** (Nova Pulse + Amplifier: ogromna fala co 2 s, spowalnia trafionych wrogów o połowę na 2 s; bossów nie), **Drone Squadron** (Wingman Drone + Overclock: 5 dronów, szybszy ogień, pociski przebijają jednego wroga), **Gravity Mines** (Proximity Mines + Tractor Beam: fioletowe miny przyciągają wrogów z okolicy, zanim wybuchną; bossów nie). (build 48)
- Księga ulepszeń „CODEX” (przycisk w menu głównym i w hangarze): 33 wpisy w pięciu działach: bronie (8), ewolucje (8), combo broni (6), perki (6), zestawy perków (5). Odkryte wpisy mają ikonę, opis i przepis (np. „Arc Coil + Proximity Mines (both LV 3)”), a nieodkryte są pod „???” z jedną podpowiedzią (np. „Evolves from Pulse Blaster”). Licznik odkryć ogólny i w każdym dziale. (build 49)
- Wpis odkrywa się, gdy pierwszy raz zdobędziesz go w dowolnym przelocie; ekran wyników pokazuje „NEW IN CODEX: …”. Odkrycia zostają po „Reset progress”. (build 49)
- Aktywne combo i zestawy perków widać pod licznikiem czasu w HUD (zestaw świeci, gdy jego efekt właśnie działa, np. Overdrive, Last Stand, Hit & Run w ruchu), a pauza i ekran awansu pokazują je z opisem efektu. (build 49)
- Samouczek: podpowiedź przy pierwszej karcie z combo i dymek „YOUR CODEX” w menu po kilku odkryciach. (build 49)

**Zmiana**
- Przycisk „DAILY REWARD” w menu skrócony do „DAILY” (obok nowego przycisku „CODEX”). (build 49)

**Balans**
- Mocniejsze trzy najsłabsze combo: Storm Mines (piorun z pełną siłą Arc Coil i 4 przeskokami zamiast 70% i 3), Cluster Missiles (8 odłamków zamiast 6), Minelayer (mina przy co drugim wybuchu rakiety zamiast co trzecim). Pomiar na stałym celu (25 wrogów wokół statku, 45 s): każde combo daje teraz +10% do +32% obrażeń pary broni (poziom 3: Storm Mines +18%, Cluster +26%, Blade Nova +11%, Twin Link +32%, Ion Bolts +24%, Minelayer +22%). (build 46)
- Pomiar na stałym celu (25 wrogów wokół statku, 45 s; obrażenia na sekundę na poziomie 5 → po ewolucji): Flak Cannon 134 → 805, Supernova 348 → 555 + spowolnienie, Drone Squadron 84 → 559, Gravity Mines 1760 → 2531. Dla porównania stare ewolucje: Photon Storm 231 → 1148, Swarm Barrage 898 → 1446, Plasma Halo 783 → 1684, Tempest 149 → 849. (build 48)
- Wrogowie mocniejsi, bo combo i nowe ewolucje wzmacniają statek. Każde trafienie w statek (kontakt, pociski, ostrzał, rozbłyski, bossowie) zadaje więcej i rośnie pod koniec sektora: świat 1 ×1,2 (do ×1,44), świat 2 ×1,4 (do ×1,82), świat 3 ×1,6 (do ×2,16), świat 4 ×1,8 (do ×2,52). (build 50)
- HP wrogów: świat 2 +15%, świat 3 +20%, świat 4 +25% (świat 1 bez zmian). Elity dodatkowo: świat 1 +15%, 2 +30%, 3 +35%, 4 +40%. Bossowie: +10% / +20% / +25% / +30%. Ustawienia w `WORLD_TUNING` w `js/data.js`. (build 50)
- Pomiar autopilotem (wszystkie 24 sektory po 2 razy; ulepszenia 3 w świecie 1, 6 w światach 2–4): w światach 2–4 kadłub tracony w sektorze wzrósł z 0–15% do zwykle 20–60%, bot wygrywa 26 z 36 przejść (było 32 z 36); najtrudniejsze: 2-6 (boss), 3-4 (Bulwark + Berserker), 3-2 (Bulwark + Shielded). Świat 1 nadal łagodny (bot traci 0–4%). (build 50)

**Narzędzia**
- `npm run release`: ponowne wydanie buildu, który już był wydany (np. wersja, która nie trafiła do sklepu), liczy zmiany od wydania sprzed tego buildu i dopisuje „Ten sam build N co vX.Y.Z”; wcześniej lista „Wszystkie zmiany” wychodziła pusta. (build 42)
- CHANGELOG.md: dodane sekcje v1.1.1 (build 41, pełne podsumowanie buildów 30–40) i v1.1.0 (build 40, nie wydane); „Następne wydanie” wyczyszczone. (build 42)
- Projekt Androida (`android/`, Capacitor 8): ta sama gra, tylko w pionie, ikonka i ekran startowy jak na iPhonie. `npm run android` buduje i kopiuje grę do projektu, `npm run android:open` dodatkowo otwiera Android Studio. Na razie bez zakupów (Android działa jak darmowa wersja), bez wersji TEST i bez podpisu do Google Play. (build 43)
- `npm run bump` ustawia też numer wersji Androida (versionCode = numer buildu, versionName = wersja). (build 43)
- Panel 🛠: przyciski „Give a combo” (obie bronie od razu na poziomie 3). (build 44)
- Android: wersja TEST jako osobna aplikacja „VB Test” (z panelem 🛠 i własnym zapisem), obok zwykłej gry. `npm run android:test` buduje ją, instaluje i uruchamia na włączonym emulatorze albo podłączonym telefonie; `npm run android:play` robi to samo ze zwykłą grą. Wcześniej `npm run android:open` zawsze budował zwykłą wersję, nawet po wybraniu TEST w `npm run review` (który dotyczy iPhone'a). (build 45)
- Panel 🛠: przyciski „Give a perk set” (oba perki od razu na poziomie 3). (build 47)
- Panel 🛠: przyciski „Give an evolution” (broń od razu na poziomie 5 i po ewolucji). (build 48)
- Folder `art/2.0/` z pierwszymi grafikami do wersji 2.0 (ChatGPT według promptów Claude'a): Striker (koncepty, wybrany wariant 4, arkusze części i części wycięte do animacji), 6 wrogów świata 1 i elita, koncept świata „technologiczna ruina”, próbny kadr i animacja statku. Gra ich jeszcze nie używa. (build 51)
- CLAUDE.md: plan wersji (1.2.0, 1.3 z Androidem, rankingami i trybem nieskończonym, 2.0 na PixiJS). (build 51)
- Prototyp wersji 2.0 na PixiJS (`proto2/`, `npm run proto2` → `dist/void-blaster-2-proto.html`): jedna arena „technologiczna ruina”, Striker złożony z części (płomienie silników, przechył w zakrętach, odrzut działek), wrogowie świata 1 z poświatą, pociski, pioruny, wybuchy, licznik FPS i przyciski do testu wydajności (więcej wrogów, elita, poświata wł./wył.). Gra 1.x się nie zmienia. (build 52)

## Build 52 · 2026-10-24
- [Narzędzia] Prototyp wersji 2.0 na PixiJS (`proto2/`, `npm run proto2` → `dist/void-blaster-2-proto.html`): jedna arena „technologiczna ruina”, Striker złożony z części (płomienie silników, przechył w zakrętach, odrzut działek), wrogowie świata 1 z poświatą, pociski, pioruny, wybuchy, licznik FPS i przyciski do testu wydajności (więcej wrogów, elita, poświata wł./wył.). Gra 1.x się nie zmienia.

## Build 51 · 2026-10-24
- [Narzędzia] Folder `art/2.0/` z pierwszymi grafikami do wersji 2.0 (ChatGPT według promptów Claude'a): Striker (koncepty, wybrany wariant 4, arkusze części i części wycięte do animacji), 6 wrogów świata 1 i elita, koncept świata „technologiczna ruina”, próbny kadr i animacja statku. Gra ich jeszcze nie używa.
- [Narzędzia] CLAUDE.md: plan wersji (1.2.0, 1.3 z Androidem, rankingami i trybem nieskończonym, 2.0 na PixiJS).

## Build 50 · 2026-10-24
- [Balans] Wrogowie mocniejsi, bo combo i nowe ewolucje wzmacniają statek. Każde trafienie w statek (kontakt, pociski, ostrzał, rozbłyski, bossowie) zadaje więcej i rośnie pod koniec sektora: świat 1 ×1,2 (do ×1,44), świat 2 ×1,4 (do ×1,82), świat 3 ×1,6 (do ×2,16), świat 4 ×1,8 (do ×2,52).
- [Balans] HP wrogów: świat 2 +15%, świat 3 +20%, świat 4 +25% (świat 1 bez zmian). Elity dodatkowo: świat 1 +15%, 2 +30%, 3 +35%, 4 +40%. Bossowie: +10% / +20% / +25% / +30%. Ustawienia w `WORLD_TUNING` w `js/data.js`.
- [Balans] Pomiar autopilotem (wszystkie 24 sektory po 2 razy; ulepszenia 3 w świecie 1, 6 w światach 2–4): w światach 2–4 kadłub tracony w sektorze wzrósł z 0–15% do zwykle 20–60%, bot wygrywa 26 z 36 przejść (było 32 z 36); najtrudniejsze: 2-6 (boss), 3-4 (Bulwark + Berserker), 3-2 (Bulwark + Shielded). Świat 1 nadal łagodny (bot traci 0–4%).

## Build 49 · 2026-10-24
- [Nowe] Księga ulepszeń „CODEX” (przycisk w menu głównym i w hangarze): 33 wpisy w pięciu działach: bronie (8), ewolucje (8), combo broni (6), perki (6), zestawy perków (5). Odkryte wpisy mają ikonę, opis i przepis (np. „Arc Coil + Proximity Mines (both LV 3)”), a nieodkryte są pod „???” z jedną podpowiedzią (np. „Evolves from Pulse Blaster”). Licznik odkryć ogólny i w każdym dziale.
- [Nowe] Wpis odkrywa się, gdy pierwszy raz zdobędziesz go w dowolnym przelocie; ekran wyników pokazuje „NEW IN CODEX: …”. Odkrycia zostają po „Reset progress”.
- [Nowe] Aktywne combo i zestawy perków widać pod licznikiem czasu w HUD (zestaw świeci, gdy jego efekt właśnie działa, np. Overdrive, Last Stand, Hit & Run w ruchu), a pauza i ekran awansu pokazują je z opisem efektu.
- [Nowe] Samouczek: podpowiedź przy pierwszej karcie z combo i dymek „YOUR CODEX” w menu po kilku odkryciach.
- [Zmiana] Przycisk „DAILY REWARD” w menu skrócony do „DAILY” (obok nowego przycisku „CODEX”).

## Build 48 · 2026-10-24
- [Nowe] Ewolucje dla czterech kolejnych broni (teraz wszystkie 8 broni ma ewolucję; broń na poziomie 5 + perk): **Flak Cannon** (Scatter Gun + Armor Plating: 9 złotych śrutów, każdy wybucha przy trafieniu i rani wrogów obok), **Supernova** (Nova Pulse + Amplifier: ogromna fala co 2 s, spowalnia trafionych wrogów o połowę na 2 s; bossów nie), **Drone Squadron** (Wingman Drone + Overclock: 5 dronów, szybszy ogień, pociski przebijają jednego wroga), **Gravity Mines** (Proximity Mines + Tractor Beam: fioletowe miny przyciągają wrogów z okolicy, zanim wybuchną; bossów nie).
- [Balans] Pomiar na stałym celu (25 wrogów wokół statku, 45 s; obrażenia na sekundę na poziomie 5 → po ewolucji): Flak Cannon 134 → 805, Supernova 348 → 555 + spowolnienie, Drone Squadron 84 → 559, Gravity Mines 1760 → 2531. Dla porównania stare ewolucje: Photon Storm 231 → 1148, Swarm Barrage 898 → 1446, Plasma Halo 783 → 1684, Tempest 149 → 849.
- [Narzędzia] Panel 🛠: przyciski „Give an evolution” (broń od razu na poziomie 5 i po ewolucji).

## Build 47 · 2026-10-24
- [Nowe] Zestawy perków: gdy dwa pasujące perki mają poziom 3+, włącza się dodatkowy efekt do końca przelotu (napis „PERK SET!”). Pięć zestawów: **Overdrive** (Power Core + Overclock: co 12 s przez 4 s bronie strzelają o 50% szybciej, napis „OVERDRIVE”), **Ram Plating** (Armor Plating + Thrusters: tłum zadaje 30% mniej, a dotykający wrogowie są odrzucani), **Singularity** (Tractor Beam + Amplifier: co 25 s wszystkie kryształy XP lecą do statku), **Hit & Run** (Thrusters + Overclock: +15% obrażeń w ruchu), **Last Stand** (Power Core + Armor Plating: +25% obrażeń poniżej 50% kadłuba).
- [Nowe] Karta perka podpowiada zestaw, gdy masz już pasujący perk („⚡ Set with Power Core at LV 3”), a karta, która go włącza, świeci na turkusowo; takie karty pojawiają się trochę częściej.
- [Narzędzia] Panel 🛠: przyciski „Give a perk set” (oba perki od razu na poziomie 3).

## Build 46 · 2026-10-24
- [Balans] Mocniejsze trzy najsłabsze combo: Storm Mines (piorun z pełną siłą Arc Coil i 4 przeskokami zamiast 70% i 3), Cluster Missiles (8 odłamków zamiast 6), Minelayer (mina przy co drugim wybuchu rakiety zamiast co trzecim). Pomiar na stałym celu (25 wrogów wokół statku, 45 s): każde combo daje teraz +10% do +32% obrażeń pary broni (poziom 3: Storm Mines +18%, Cluster +26%, Blade Nova +11%, Twin Link +32%, Ion Bolts +24%, Minelayer +22%).

## Build 45 · 2026-10-23
- [Narzędzia] Android: wersja TEST jako osobna aplikacja „VB Test” (z panelem 🛠 i własnym zapisem), obok zwykłej gry. `npm run android:test` buduje ją, instaluje i uruchamia na włączonym emulatorze albo podłączonym telefonie; `npm run android:play` robi to samo ze zwykłą grą. Wcześniej `npm run android:open` zawsze budował zwykłą wersję, nawet po wybraniu TEST w `npm run review` (który dotyczy iPhone'a).

## Build 44 · 2026-10-23
- [Nowe] Combo broni: gdy dwie pasujące bronie mają poziom 3+, włącza się dodatkowy efekt do końca przelotu (napis „COMBO!”, błysk i dźwięk). Sześć combo: **Storm Mines** (Arc Coil + Proximity Mines: wybuch miny wypuszcza łańcuch piorunów), **Cluster Missiles** (Seeker Missiles + Scatter Gun: wybuch rakiety rozrzuca 6 odłamków), **Blade Nova** (Orbit Blades + Nova Pulse: impuls wyrzuca ostrza na orbitę większą o 60%, na 1,2 s, z +50% obrażeń), **Twin Link** (Wingman Drone + Pulse Blaster: drony strzelają razem z każdą salwą blastera, połową jej siły), **Ion Bolts** (Pulse Blaster + Arc Coil: trafienie przeskakuje iskrą na sąsiedniego wroga, połową obrażeń), **Minelayer** (Seeker Missiles + Proximity Mines: wybuch rakiety zostawia minę w 35% przypadków).
- [Nowe] Karta broni podpowiada combo, gdy masz już pasującą broń („⚡ Combo with Arc Coil at LV 3”), a karta, która je włącza, świeci na turkusowo („Unlocks combo: Storm Mines”). Takie karty pojawiają się trochę częściej.
- [Narzędzia] Panel 🛠: przyciski „Give a combo” (obie bronie od razu na poziomie 3).

## Build 43 · 2026-10-22
- [Narzędzia] Projekt Androida (`android/`, Capacitor 8): ta sama gra, tylko w pionie, ikonka i ekran startowy jak na iPhonie. `npm run android` buduje i kopiuje grę do projektu, `npm run android:open` dodatkowo otwiera Android Studio. Na razie bez zakupów (Android działa jak darmowa wersja), bez wersji TEST i bez podpisu do Google Play.
- [Narzędzia] `npm run bump` ustawia też numer wersji Androida (versionCode = numer buildu, versionName = wersja).

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
