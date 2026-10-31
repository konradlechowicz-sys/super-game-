<!--
Dla Konrada: katalog promptów do Suno dla całej muzyki wersji 2.0. Każdy utwór ma trzy pola do wklejenia
(Style of Music, Exclude Styles, Lyrics). Zasady pracy są w części 1, a tabela postępu na końcu.
Gotowe utwory odsyłaj Claude'owi: on je tnie, zapętla, zgrywa z obrazem i wpisuje do tabeli.
-->

# Void Blaster 2.0: katalog promptów do Suno

Muzyka 2.0: **każdy świat ma własny temat muzyczny** (decyzja Konrada), a całość spina temat główny
`void-blaster-theme-suno.mp3` (już zrobiony, w tym folderze). Prompty są po angielsku, bo Suno najlepiej rozumie
angielski; instrukcje są po polsku.

---

## Część 1: zasady dla każdego utworu

1. **Tryb Custom**, włączony **Instrumental**, najnowszy dostępny model.
2. **Płatny plan (Pro albo Premier) w chwili generowania.** Tylko wtedy wolno użyć utworu komercyjnie (w grze
   i w promocji). Utwory z darmowego planu nie stają się komercyjne po wykupieniu subskrypcji.
3. Wklej trzy pola z promptu: **Style of Music**, **Exclude Styles** i **Lyrics** (w Lyrics są tylko znaczniki
   budowy utworu; przy Instrumental Suno ich nie śpiewa).
4. Wygeneruj **4–6 wersji**, wybierz najlepszą (albo dwie) i pobierz jako **WAV** (MP3, jeśli WAV niedostępny).
   Całe utwory, bez przycinania: Claude sam tnie i zapętla.
5. **Nazwy plików:** `w01-orbital-ruins-sector.wav`, `w01-orbital-ruins-boss.wav`, `menu-hangar.wav`,
   `film-ending.wav` itd. (jak w tabeli w części 5). Jeśli wysyłasz kilka wersji, dopisz `-a`, `-b`, a faworyta
   oznacz `-faworyt`.
6. **Nie wpisuj nazw artystów ani tytułów cudzych utworów** (Suno je odrzuca, a gra musi być oryginalna).
7. **Temat bossa robimy z tematu sektora tego świata** funkcją Suno **Cover** (albo Remix, zależnie od wersji
   Suno): otwórz wybrany utwór sektora, wybierz Cover i wklej prompt bossa. Melodia świata zostaje, a styl staje
   się cięższy. Dzięki temu boss brzmi jak „ten sam świat, tylko groźniej”.

### Czego potrzebuje gra
- **Utwór sektora** gra w pętli przez cały sektor (6 minut z OVERLOAD). Suno robi utwory 2–4 minutowe; Claude
  wycina z nich pętlę 60–90 s na granicach taktów, bez słyszalnego szwu. Dlatego prompt prosi o **równe tempo
  i stałą energię**, bez długich wyciszeń.
- **Minuta OVERLOAD** używa najmocniejszego fragmentu utworu sektora (refren / drop) albo początku utworu bossa.
- **Utwór bossa** gra w pętli w czasie walki z bossem.
- **Filmy** (intro, przejścia, zakończenie, porażka): przejścia między światami Claude tnie z utworu sektora
  następnego świata (10 s), więc nie wymagają osobnych promptów. Osobne prompty mają tylko intro, zakończenie
  i porażka.

### Wspólny blok stylu (jest już w każdym prompcie)
Wszystkie utwory łączy: kinowe sci-fi, syntezatory z prawdziwym brzmieniem orkiestrowym, ciężka perkusja,
ciemny nastrój z nutą bohaterstwa. Im głębiej w podróż, tym mniej czystej elektroniki i więcej „organicznych”
brzmień (oddechy, chóry, plemienne bębny, tekstury biologiczne), tak jak w grafice: technika przechodzi w organikę.

---

## Część 2: utwory ogólne

### M1 Menu i hangar (`menu-hangar`)
Spokojna, klimatyczna wersja tematu głównego. Zrób ją funkcją **Cover** z `void-blaster-theme-suno.mp3`.
```
Style of Music:
ambient cinematic sci-fi, calm version of an epic space theme, 90 BPM, soft analog synth pads, slow pulsing arpeggio, distant choir, gentle sub bass, hopeful but tense, spacious reverb, video game menu music, instrumental, loopable, steady
```
```
Exclude Styles:
vocals, singing, heavy drums, dubstep, lo-fi, acoustic guitar
```
```
Lyrics:
[Intro: soft pads, distant stars]
[Main Theme: slow arpeggio, warm pads, gentle melody]
[Variation: choir swells, subtle percussion]
[Main Theme: calm, steady]
[Outro: pads hold]
```

### M2 Mapa podróży (`journey-map`)
```
Style of Music:
cinematic space exploration theme, 100 BPM, wide string ensemble, warm analog synths, soft timpani, sense of a long journey, heroic and melancholic, sci-fi adventure, instrumental, steady
```
```
Exclude Styles:
vocals, singing, dubstep, lo-fi, acoustic guitar, happy pop
```
```
Lyrics:
[Intro: lonely synth melody over strings]
[Theme: strings and synths together, slow build]
[Swell: timpani, horns, hopeful]
[Theme: calm, steady]
[End]
```

### M3 Tryb Endless (`endless`)
```
Style of Music:
relentless dark synthwave action, 150 BPM, driving four-on-the-floor drums, aggressive bass, glitchy cyberpunk textures, rising tension that never resolves, endless battle, video game combat music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals, singing, rap, lo-fi, acoustic guitar, slow ballad
```
```
Lyrics:
[Intro: short riser]
[Loop A: full drums, driving bass, heroic lead]
[Loop B: glitch breaks, heavier bass]
[Loop A: full energy]
[Loop B: full energy]
[End]
```

---

## Część 3: tematy światów (sektor + boss)

Każdy świat: najpierw **sektor**, potem **boss** jako Cover wybranego sektora.

### Wspólne DNA (światy 1–4, wersja 2 po zwiastunie)
Temat główny ze zwiastuna (`void-blaster-theme-suno.mp3`) spodobał się Konradowi, więc światy 1–4 mają **ten sam rdzeń
stylu** co on, a różnią się tempem, tonacją, instrumentem prowadzącym i jedną charakterystyczną teksturą:

```
dark cinematic sci-fi, hybrid orchestral synthwave, deep sub bass, pulsing analog arpeggios, massive brass braams, heavy cinematic drums, ethereal choir pads, glitchy cyberpunk textures, epic video game soundtrack, instrumental
```

Ten rdzeń jest już wpisany na początku każdego promptu poniżej, więc wklejasz prompty bez zmian.

| Świat | Tempo, tonacja | Prowadzi | Tekstura świata | Nastrój |
| --- | --- | --- | --- | --- |
| 1 Orbital Ruins | 140 BPM, D minor (jak temat główny) | samotny syntezator | metaliczne stuki, szum radia | zimno, pustka po bitwie |
| 2 Siege of Earth | 146 BPM, C minor | bohaterska sekcja dęta | taiko, werble, grzmoty | desperacka obrona domu |
| 3 Lunar Bridgehead | 128 BPM, rytm o połowę wolniejszy, F minor | chór bez słów | dalekie dudnienie, przestrzeń | ogrom, napięcie, cisza |
| 4 Red Conversion | 136 BPM, E phrygian | szklane dzwonki | wiatr i piasek, pierwsze „oddechy” | coś obcego zaczyna rosnąć |

Wskazówka: jeśli któraś wersja sektora brzmi zbyt podobnie do tematu głównego, zostaw ją na menu; do świata wybierz tę,
która ma najwyraźniej słyszalną teksturę z tabeli.

### W1 Orbital Ruins: ruiny ziemskiej obrony na orbicie (100% maszyny)
Sektor (`w01-orbital-ruins-sector`):
```
Style of Music:
dark cinematic sci-fi, hybrid orchestral synthwave, deep sub bass, pulsing analog arpeggios, massive brass braams, heavy cinematic drums, ethereal choir pads, glitchy cyberpunk textures, epic video game soundtrack, instrumental, 140 BPM, D minor, cold and lonely, lead: a lonely analog synth melody, metallic percussion like debris hitting a hull, distant radio static and broken transmissions, steady energy, loopable
```
```
Exclude Styles:
vocals, singing, rap, lo-fi, acoustic guitar, happy pop, dubstep wobble
```
```
Lyrics:
[Intro: radio static, metallic clicks, cold pads]
[Groove: steady drums, pulsing arpeggio, sub bass]
[Theme: lonely synth lead melody]
[Build: braams, rising arpeggio]
[Theme: full drums, choir pads, steady]
[Groove: glitch textures, steady]
[End]
```
Boss (`w01-orbital-ruins-boss`, Cover sektora):
```
Style of Music:
dark cinematic sci-fi, hybrid orchestral synthwave, deep distorted sub bass, massive brass braams, pounding metallic war drums, alarm-like synth stabs, glitchy cyberpunk textures, epic video game boss music, instrumental, 148 BPM, D minor, mechanical menace, the sector melody played by heavy brass, steady energy, loopable
```
```
Exclude Styles:
vocals, singing, rap, lo-fi, acoustic guitar, calm ambient, happy pop
```
```
Lyrics:
[Intro: alarm stabs, huge braam]
[Battle: pounding drums, distorted bass, theme on brass]
[Breakdown: half-time stomp, braams]
[Battle: full energy]
[End]
```

### W2 Siege of Earth: walka nad Ziemią nocą, burze (100% maszyny)
Sektor (`w02-siege-of-earth-sector`):
```
Style of Music:
dark cinematic sci-fi, hybrid orchestral synthwave, deep sub bass, pulsing analog arpeggios, massive brass braams, heavy cinematic drums, ethereal choir pads, glitchy cyberpunk textures, epic video game soundtrack, instrumental, 146 BPM, C minor, desperate heroic defense, lead: heroic brass melody, driving taiko and snare ostinato, fast string ostinato, thunder and storm textures, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, happy pop, dubstep wobble
```
```
Lyrics:
[Intro: distant thunder, low strings, pulse]
[March: taiko and snare, string ostinato, arpeggio]
[Theme: heroic brass melody]
[Build: storm rising, braams]
[Theme: full orchestra and synths, steady]
[March: thunder hits, steady]
[End]
```
Boss (`w02-siege-of-earth-boss`, Cover sektora):
```
Style of Music:
dark cinematic sci-fi, hybrid orchestral synthwave, colossal war drums, choir shouts without words, massive brass braams, relentless string ostinato, distorted synth bass, thunder impacts, epic video game boss music, instrumental, 152 BPM, C minor, siege of a flying fortress, the sector melody in full orchestra, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, calm ambient, happy pop
```
```
Lyrics:
[Intro: thunder, braams]
[Battle: war drums, choir shouts, brass theme]
[Breakdown: half-time, low brass, thunder]
[Battle: full energy]
[End]
```

### W3 Lunar Bridgehead: Księżyc jako baza wroga (90/10)
Sektor (`w03-lunar-bridgehead-sector`):
```
Style of Music:
dark cinematic sci-fi, hybrid orchestral synthwave, deep sub bass, pulsing analog arpeggios, massive brass braams, heavy cinematic drums, ethereal choir pads, glitchy cyberpunk textures, epic video game soundtrack, instrumental, 128 BPM half-time feel, F minor, vast and tense, lead: a wordless female choir over slow floating arpeggios, distant booming impacts like mortars on the Moon, wide empty space and silence between hits, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, happy pop, dubstep wobble
```
```
Lyrics:
[Intro: empty space, low hum, distant impact]
[Pulse: half-time drums, sub bass, floating arpeggio]
[Theme: wordless choir melody]
[Build: braams, booming impacts]
[Theme: full drums, choir and synths, steady]
[Pulse: space and silence, steady]
[End]
```
Boss (`w03-lunar-bridgehead-boss`, Cover sektora):
```
Style of Music:
dark cinematic sci-fi, hybrid orchestral synthwave, huge booming drums, deep brass, charging laser synths, sub bass drops, choir, massive brass braams, epic video game boss music, instrumental, 136 BPM, F minor, a cannon tower rising from a crater, cold and massive, the choir melody turned menacing, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, calm ambient, happy pop
```
```
Lyrics:
[Intro: charging synth, booming hit]
[Battle: huge drums, deep brass, choir theme]
[Breakdown: sub drops, laser synths]
[Battle: full energy]
[End]
```

### W4 Red Conversion: Mars w trakcie przepisywania, kryształy (80/20)
Sektor (`w04-red-conversion-sector`):
```
Style of Music:
dark cinematic sci-fi, hybrid orchestral synthwave, deep sub bass, pulsing analog arpeggios, massive brass braams, heavy cinematic drums, ethereal choir pads, glitchy cyberpunk textures, epic video game soundtrack, instrumental, 136 BPM, E phrygian, alien and haunting, lead: glassy crystal bell arpeggios, dusty low drums, warm distorted bass, desert wind and sand textures, subtle organic breathing sounds, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, happy pop, dubstep wobble
```
```
Lyrics:
[Intro: desert wind, glass chimes, breathing]
[Groove: dusty drums, crystal arpeggios, sub bass]
[Theme: haunting crystal bell melody]
[Build: braams, sand storm rising]
[Theme: full drums, choir and synths, steady]
[Groove: crystal and breath textures, steady]
[End]
```
Boss (`w04-red-conversion-boss`, Cover sektora):
```
Style of Music:
dark cinematic sci-fi, hybrid orchestral synthwave, shattering glass percussion, heavy war drums, distorted sub bass, dark choir, massive brass braams, epic video game boss music, instrumental, 142 BPM, E phrygian, a walking crystal colossus, phrygian menace, the crystal melody played by low brass and choir, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, calm ambient, happy pop
```
```
Lyrics:
[Intro: cracking crystal, braam]
[Battle: heavy drums, glass hits, choir]
[Breakdown: slow stomp, low brass]
[Battle: full energy]
[End]
```

### W5 Foundry Belt: pas planetoid zamieniony w fabryki (80/20)
Sektor (`w05-foundry-belt-sector`):
```
Style of Music:
industrial factory groove, 136 BPM, E minor, hammering metal percussion, conveyor belt rhythms, pistons and steam textures, gritty synth bass, robotic arpeggios, relentless machine production line, dark sci-fi video game music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals, singing, rap, lo-fi, acoustic guitar, happy pop
```
```
Lyrics:
[Intro: machines starting up, steam]
[Groove: hammering percussion, gritty bass]
[Theme: robotic arpeggio melody]
[Groove: pistons, steady]
[Theme: full energy, steady]
[End]
```
Boss (`w05-foundry-belt-boss`, Cover sektora):
```
Style of Music:
industrial metal boss battle, 144 BPM, distorted synth bass like heavy machinery, pounding anvil percussion, sirens, brass braams, overwhelming factory power, dark sci-fi boss music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals, singing, screaming, rap, lo-fi, acoustic guitar, calm ambient
```
```
Lyrics:
[Intro: siren, machine roar]
[Battle: anvil drums, distorted bass, theme]
[Breakdown: heavy press stomps]
[Battle: full energy]
[End]
```

### W6 Storm Relay: Jowisz, nadajnik Kolektywu, wiatr (70/30)
Sektor (`w06-storm-relay-sector`):
```
Style of Music:
electric storm drum and bass, 170 BPM, G minor, fast breakbeats, crackling electric synths, deep rolling bass, wind and thunder textures, signal glitches, high tension, sci-fi video game music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals, singing, rap, lo-fi, acoustic guitar, happy pop
```
```
Lyrics:
[Intro: wind, distant thunder, radio glitch]
[Rush: fast breakbeats, rolling bass]
[Theme: electric synth melody]
[Rush: thunder hits, steady]
[Theme: full energy, steady]
[End]
```
Boss (`w06-storm-relay-boss`, Cover sektora):
```
Style of Music:
furious lightning storm boss battle, 174 BPM, heavy drum and bass, distorted reese bass, thunder impacts, electric choir stabs, brass braams, chaotic energy, dark sci-fi boss music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, calm ambient
```
```
Lyrics:
[Intro: lightning strike]
[Battle: heavy breakbeats, reese bass, choir stabs]
[Breakdown: half-time thunder]
[Battle: full energy]
[End]
```

### W7 Abyss of Europa: życie spod lodu, przepisane (50/50)
Sektor (`w07-abyss-of-europa-sector`):
```
Style of Music:
deep underwater sci-fi, 110 BPM half-time, B minor, muffled heavy drums, whale-like synth calls, cold ice cracking textures, slow deep bass, eerie choir, organic breathing sounds, mysterious and alien, video game music, instrumental, steady, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, happy pop
```
```
Lyrics:
[Intro: ice cracking, deep water]
[Pulse: muffled drums, deep bass]
[Theme: whale-like synth melody, eerie choir]
[Pulse: breathing textures, steady]
[Theme: fuller, steady]
[End]
```
Boss (`w07-abyss-of-europa-boss`, Cover sektora):
```
Style of Music:
monstrous deep sea leviathan battle, 120 BPM, crushing slow drums, huge low brass, distorted sub bass, monster roars as sound design, dark choir, terrifying and organic, dark sci-fi boss music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, screaming, rap, lo-fi, acoustic guitar, calm ambient
```
```
Lyrics:
[Intro: deep rumble, roar]
[Battle: crushing drums, low brass theme, choir]
[Breakdown: sub bass, silence and roar]
[Battle: full energy]
[End]
```

### W8 The Rift Gate: wrota poza Układ Słoneczny (50/50)
Sektor (`w08-rift-gate-sector`):
```
Style of Music:
psychedelic warped sci-fi, 125 BPM, A minor, reversed sounds, time-stretched pads, shifting rhythms, portal whooshes, otherworldly synth lead, unstable reality, mysterious tension, video game music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals, singing, rap, lo-fi, acoustic guitar, happy pop
```
```
Lyrics:
[Intro: reversed swells, portal hum]
[Groove: shifting drums, warped bass]
[Theme: otherworldly lead melody]
[Groove: time-stretched textures, steady]
[Theme: full energy, steady]
[End]
```
Boss (`w08-rift-gate-boss`, Cover sektora):
```
Style of Music:
cosmic gatekeeper battle, 140 BPM, massive orchestral hits, warped distorted synths, reversed choir, heavy drums, portal sound effects, overwhelming and strange, epic sci-fi boss music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, calm ambient
```
```
Lyrics:
[Intro: portal opens, orchestral hit]
[Battle: heavy drums, warped synths, reversed choir]
[Breakdown: time slows, braams]
[Battle: full energy]
[End]
```

### W9 Brood World: wylęgarnia Kolektywu (30/70)
Sektor (`w09-brood-world-sector`):
```
Style of Music:
dark organic tribal sci-fi, 138 BPM, C sharp minor, primal tribal drums, wet biological textures, heartbeat pulse, eerie female choir without words, distorted bass, alien hive atmosphere, unsettling, video game music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, happy pop
```
```
Lyrics:
[Intro: heartbeat, hive sounds]
[Ritual: tribal drums, distorted bass]
[Theme: eerie wordless choir melody]
[Ritual: biological textures, steady]
[Theme: full energy, steady]
[End]
```
Boss (`w09-brood-world-boss`, Cover sektora):
```
Style of Music:
horrifying hive queen battle, 146 BPM, frantic tribal war drums, monstrous low brass, screeching strings, dark choir, distorted bass, organic horror, dark sci-fi boss music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, screaming, rap, lo-fi, acoustic guitar, calm ambient
```
```
Lyrics:
[Intro: heartbeat stops, screech]
[Battle: frantic drums, low brass, choir]
[Breakdown: slow heavy heartbeat]
[Battle: full energy]
[End]
```

### W10 The Nexus: serce Kolektywu (pełna fuzja)
Sektor (`w10-nexus-sector`), najlepiej jako **Cover tematu głównego**, żeby wróciła jego melodia:
```
Style of Music:
epic final world, 150 BPM, D minor, full orchestra and choir fused with heavy synths, machine and organic textures together, massive drums, the main theme returning, overwhelming scale, cinematic sci-fi video game music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, happy pop
```
```
Lyrics:
[Intro: all worlds echo, choir]
[Assault: massive drums, orchestra and synths]
[Theme: main theme melody, full power]
[Assault: machine and organic textures, steady]
[Theme: full energy, steady]
[End]
```
Boss (`w10-nexus-boss`, Cover sektora): finałowa walka z Void Heart.
```
Style of Music:
ultimate final boss battle, 156 BPM, full choir chanting without words, giant orchestra, distorted synth bass, war drums, heartbeat pulse, apocalyptic and heroic, the main theme in its darkest form, epic sci-fi final boss music, instrumental, steady energy, loopable
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, acoustic guitar, calm ambient
```
```
Lyrics:
[Intro: heartbeat, choir rises]
[Battle: giant orchestra, war drums, choir]
[Breakdown: heartbeat alone, then braams]
[Battle: main theme, full power]
[End]
```

---

## Część 4: filmy

### F1 Intro, 15 s (`film-intro`)
Najprościej: wycinek z tematu głównego (jak w zwiastunie), bez osobnego utworu. Jeśli chcesz osobny:
```
Style of Music:
cinematic sci-fi trailer opening, dark ambient drone, distant digital whispers, slow rising tension, a single massive hit, then a heroic synth motif, instrumental
```
```
Exclude Styles:
vocals, singing, rap, lo-fi, acoustic guitar
```
```
Lyrics:
[Intro: dark drone, whispers]
[Rise: tension builds]
[Hit]
[Motif: heroic synth, short]
[End]
```

### F2 Zakończenie, 20 s (`film-ending`), jako **Cover tematu głównego**
```
Style of Music:
triumphant emotional finale, 100 BPM, D major, soaring strings, warm choir, heroic brass, gentle synth arpeggios, victory and relief, hope returning to Earth, cinematic ending music, instrumental
```
```
Exclude Styles:
vocals with lyrics, rap, lo-fi, dubstep, dark horror
```
```
Lyrics:
[Intro: silence, a single piano note]
[Rise: strings and choir]
[Triumph: full orchestra, main theme in major]
[Outro: soft pads fade]
[End]
```

### F3 Porażka, 2 s (`film-defeat`)
Suno nie zrobi utworu 2-sekundowego, więc generujemy krótki utwór i Claude wycina z niego akcent.
```
Style of Music:
short dark sci-fi failure sting, descending synth, low brass hit, distorted fade, ominous whisper texture, instrumental
```
```
Exclude Styles:
vocals, singing, rap, happy
```
```
Lyrics:
[Hit: low brass, descending synth]
[Fade: distortion, whisper]
[End]
```

---

## Część 5: tabela postępu

| Plik | Utwór | Status |
| --- | --- | --- |
| `void-blaster-theme-suno.mp3` | temat główny | gotowy, użyty w zwiastunie |
| `menu-hangar` | M1 menu i hangar | niepotrzebny: menu gra temat główny na stałe (decyzja Konrada, 2026-10-27) |
| `journey-map` | M2 mapa podróży | do zrobienia |
| `endless` | M3 tryb Endless | do zrobienia |
| `w01-orbital-ruins-sector` / `-boss` | W1 | gotowe (2026-10-27), w grze: pętle w `proto2/make-music.py` |
| `w02-siege-of-earth-sector` / `-boss` | W2 | gotowe (2026-10-28), w grze (`game2`, `boss2`): pętle w `proto2/make-music.py` |
| `w03-lunar-bridgehead-sector` / `-boss` | W3 | gotowe (2026-10-29), w grze (`game3`, `boss3`): pętle w `proto2/make-music.py` |
| `w04-red-conversion-sector` / `-boss` | W4 | gotowe (2026-10-29), w grze (`game4`, `boss4`): pętle w `proto2/make-music.py` |
| `w05-foundry-belt-sector` / `-boss` | W5 | gotowe (2026-10-29), w grze (`game5`, `boss5`): pętle w `proto2/make-music.py` |
| `w06-storm-relay-sector` / `-boss` | W6 | gotowe (2026-10-31), w grze (`game6`, `boss6`): pętle w `proto2/make-music.py` |
| `w07-abyss-of-europa-sector` / `-boss` | W7 | do zrobienia |
| `w08-rift-gate-sector` / `-boss` | W8 | do zrobienia |
| `w09-brood-world-sector` / `-boss` | W9 | do zrobienia |
| `w10-nexus-sector` / `-boss` | W10 | do zrobienia |
| `film-intro` | F1 intro (opcjonalnie) | do zrobienia |
| `film-ending` | F2 zakończenie | do zrobienia |
| `film-defeat` | F3 porażka | do zrobienia |

Razem 27 utworów: temat główny i 26 nowych (w tym opcjonalne intro). Kolejność: najpierw W1 (jest potrzebny do pionowego wycinka świata 1),
potem M1, F3, dalej świat po świecie razem z grafiką.
