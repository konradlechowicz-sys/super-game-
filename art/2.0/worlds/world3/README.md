# W3 - Lunar Bridgehead

Kompletny zatwierdzony zestaw Void Blaster 2.0, 28.10.2026.
Wybrane warianty: P1 B, P3 B, P4 B, P5 B, P6 B, P7 B, P8 B.
Każdy etap miał dwa kompletne warianty i wybór Konrada przed następnym etapem.
P2 nie jest wymagane przez biblię: grunt Księżyca wypełnia ekran.

## Zawartość

- graphics/: 73 grafiki (tu jako bezstratne WebP; oryginały PNG w paczce od Konrada), arkusze i osobne elementy.
- prompts/: 9 dokładnych promptów użytych do wybranych grafik. P7 i P8 mają po dwa prompty.
- metadata/: wymiary, skala, składanie części i raport kontroli.
- SELECTIONS.json: wybory i zapisane odpowiedzi Konrada.
- FILE-INVENTORY.json: spis plików z wymiarami i sumami; CHECKSUMS.sha256 obejmuje wszystkie pliki poza samym plikiem sum.

## Etapy

| Etap | Grafiki |
|---|---|
| P1 | Koncept 941×1672 |
| P3 | Powtarzalny regolit 1024×1024 |
| P4 | Powtarzalny pył i drobne błyski 1024×1024, na czerni, do mieszania addytywnego |
| P5 | Arkusz 2048×2048 i 14 rekwizytów, w tym moździerz i pompa całe/zniszczone |
| P6 | Arkusz, 4 pasy 1024×160 / 160×1024 i 4 narożniki 256×256 |
| P7 | 2 arkusze, 6 wrogów, elita 1,6× i 24 szczątki; 31 osobnych PNG |
| P8 | Moon Spire 1024×1024, arkusz 3072×3072 i 11 osobnych części |

## Użycie

Arkusze i wycinki obiektów mają płaskie tło RGB #05010f zgodnie z biblią; nie są przezroczystymi PNG. Ich osobne pliki mają margines 12 px. P4 ma czarne tło i służy do blendowania addytywnego. P3 i P4 powtarzają się w obu osiach; pasy P6 wzdłuż długości. Pionowe pasy P6 zawierają po dwa moduły 512 px, aby zachować proporcje skał.

P5: duże obiekty 300–600 px, średnie 200–320 px, małe 60–120 px. Pary całe/zniszczone zachowują wspólną skalę.

P7: kolejność jednostek i rzędów szczątków: probe swarm unit, conduit crawler, lunar hopper, mortar node, crater turret, regolith golem. Proporcje 22/32/34/44/48/64; największy 300 px, elita 240 px. Szczątki są rzeczywistymi fragmentami kadłubów w niezmienionej skali. Pozycje w metadanych pozwalają je ponownie złożyć na PNG jednostki.

P8: korona z podłożem krateru, rdzeń działa, cztery korzenie, cztery słabe punkty i błysk wystrzału. Dziesięć statycznych części odtwarza bossa; błysk jest dodatkowym efektem nakładanym na środek działa. Skala wszystkich elementów na arkuszu wynosi 1:1, dokładna kopia złożonego bossa jest w prawym dolnym rogu. Pozycje pełnych wycinków PNG (z marginesem) są w metadata/P8-assembly.json; przy składaniu usuń tło #05010f lub użyj go jako klucza.

Grafiki powstały wbudowanym imagegen. Za zgodą Konrada wykonano lokalne skalowanie, wycinanie, układanie arkuszy i dopasowanie szwów. Oryginały, niewybrane warianty i pomocnicze RGBA pozostają w projekcie W3/variants/ i W3/selected/. ZIP zawiera zatwierdzone pliki RGB.

Kierunek artystyczny: Art Bible, strony 10, 18, 24–25, zatwierdzony koncept W3 P1 B i wybrane referencje W3. Cały zestaw jest przeznaczony do widoku z góry.
