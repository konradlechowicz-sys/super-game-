# Void Blaster 2.0: nowy arsenał (plan na później)

Zaakceptowany przez Konrada jako plan (2026-10-28). **Etap 1 zrobiony (build 110, 2026-10-29):** 3 bronie z ewolucjami,
3 perki i ich mechaniki (`js/arsenal.js`: krytyki, podpalenie, płonący grunt, czarne dziury, wiązki, tarcza), na neonowych
efektach. **Etap 2 zrobiony (build 111):** 6 kombosów, 3 zestawy perków, 3 super kombosy (złota ramka na karcie,
osobna sekcja w Codexie, przyciski w panelu testera). Zostaje: grafiki ikon i efektów od ChatGPT. Rozwija treści „1.4”, które idą do 2.0
(`CLAUDE.md`, Roadmap): bronie Railgun, Flamethrower, Singularity Cannon i nazwy kombosów z `art/2.0/CHATGPT-BRIEF.md`.
Nowe w tym planie: 3 perki, działanie wszystkich elementów i pary.

Zasady jak dziś: kombo broni i zestaw perków działają, gdy obie części mają poziom 3 (`COMBO_LEVEL`, `js/combos.js`);
ewolucja = broń na poziomie 5 + konkretny perk (`evo.with`, `js/weapons.js`). Nowe: super kombo = 3 bronie na
poziomie 5 albo po ewolucji (złota ramka).

## 3 nowe bronie

| Broń | Jak działa | Ewolucja |
|---|---|---|
| **Railgun** | Co ok. 2 s ładuje się i strzela prostą wiązką przez całą linię wrogów: sam wybiera linię, na której trafi najwięcej (build 112; wcześniej strzelał w kierunku lotu i nie trafiał w goniący rój). Wysokie obrażenia, wolna. | **Gauss Lance** = Railgun LV5 + **Targeting Matrix**: dwie równoległe wiązki, wybuch na końcu linii; krytyki przebijają tarcze elit. |
| **Flamethrower** | Krótki stożek ognia przed statkiem; trafieni płoną 3 s. Na tłum z bliska, słaby na dystans. | **Inferno** = Flamethrower LV5 + **Thermal Core**: szerszy niebieski płomień, płonące plamy na ziemi. |
| **Singularity Cannon** | Co ok. 4 s wolna ciemna kula; po 1 s staje i na 2 s zmienia się w małą czarną dziurę, która wciąga i rani. | **Event Horizon** = Singularity LV5 + **Tractor Beam**: duże czarne dziury, które na koniec zapadają się w wybuch. |

## 3 nowe perki (maks. poziom 5)

| Perk | Efekt na poziom | Rola |
|---|---|---|
| **Targeting Matrix** | +6% szansy na trafienie krytyczne (×2 obrażeń) | ewolucja Railguna; zestaw Salvage Core |
| **Thermal Core** | +8% szansy, że dowolne trafienie podpali wroga; ogień +20% obrażeń | ewolucja Flamethrowera; zestaw Scorched Trail |
| **Phase Shield** | tarcza pochłania 25 obrażeń (+10 na poziom) i odnawia się po 2,5 s bez trafień (zmiana po testach Konrada, build 112; wcześniej blokowała jedno trafienie co 16 s) | perk obronny (gra zrobiła się trudniejsza); zestaw Bastion Field |

## Kombosy broni (obie na LV3)

| Kombo | Para | Efekt |
|---|---|---|
| **Ion Rail** | Railgun + Arc Coil | każdy wróg przebity wiązką wypuszcza błyskawicę do sąsiada |
| **Shrapnel Rail** | Railgun + Scatter Gun | koniec wiązki rozpryskuje się w wachlarz śrutu |
| **Napalm Mines** | Flamethrower + Proximity Mines | wybuch miny zostawia płonącą plamę |
| **Fire Blades** | Flamethrower + Orbit Blades | ostrza podpalają wrogów, których tną |
| **Gravity Barrage** | Singularity + Seeker Missiles | rakiety skręcają do czarnych dziur; wrogowie w dziurze dostają od nich +50% |
| **Collapse** | Singularity + Nova Pulse | fala Nova od razu zapada czarne dziury w wybuch |

## Zestawy perków (oba na LV3)

| Zestaw | Para | Efekt |
|---|---|---|
| **Scorched Trail** | Thermal Core + Thrusters | w ruchu zostawiasz za sobą płonący ślad |
| **Bastion Field** | Phase Shield + Armor Plating | gdy tarcza pęka, fala odrzuca wrogów, a tarcza odnawia się o 30% szybciej |
| **Salvage Core** | Targeting Matrix + Tractor Beam | zabójstwo trafieniem krytycznym zostawia dodatkowy kryształ XP |

## Super kombosy (3 bronie na LV5 albo po ewolucji, złota ramka)

| Super kombo | Trójka | Efekt |
|---|---|---|
| **Thunderstorm** | Railgun + Arc Coil + Proximity Mines | co 6 s burza: błyskawice w 8 wrogów na ekranie, każde trafienie zostawia minę |
| **Supernova Core** | Nova Pulse + Singularity + Flamethrower | co 4. fala Nova to supernowa: wciąga wrogów do środka i zostawia pierścień ognia |
| **Phoenix Rail** | Railgun + Flamethrower + Pulse Blaster | wiązki zostawiają linię ognia; raz na przelot śmiertelne trafienie zamienia się w ognisty wybuch wokół statku i 30% kadłuba |

## Uwagi do wdrożenia

- Razem: 3 bronie, 3 perki, 3 ewolucje, 6 kombosów, 3 zestawy, 3 super kombosy. Codex wypełni się sam (te same dane).
- Każdy nowy perk jest kluczem do ewolucji albo zestawu; Tractor Beam dostaje drugą ewolucję. Stare kombosy i zestawy
  zostają bez zmian.
- Nowe mechaniki w kodzie: trafienia krytyczne, podpalenie (obrażenia w czasie), tarcza gracza, czarne dziury jako
  pociski, super kombosy (3 części), płonące plamy na ziemi.
- Grafika od ChatGPT: ikony 3 broni, 3 perków, 6 kombosów, 3 zestawów i 3 super kombosów oraz efekty (C5 ogień,
  C6 czarna dziura, C7 wiązki w `CHATGPT-BRIEF.md`; ikony nowych perków trzeba tam dopisać). Można zacząć na obecnych
  neonowych efektach i podmienić grafiki, gdy przyjdą.
- Balans: liczby powyżej są punktem wyjścia; sprawdzić symulacją jak bossów i sektory.
