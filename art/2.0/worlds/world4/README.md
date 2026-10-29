# Void Blaster 2.0 - W4: Red Conversion

Kompletny zestaw W4 według Art Bible (strony 11, 18, 26-27), z agresywnymi kryształowymi sylwetkami i ciężką techniką. Konrad wybrał P1 A: promienisty węzeł i kopuły. Wszystkie kolejne generacje korzystały z tego konceptu.

## Zawartość produkcyjna: 70 PNG (tu jako bezstratne WebP; obrazy QA z paczki pominięte, zostały raporty JSON w qa/)

- P1: zatwierdzony koncept 941 x 1672.
- P3a/P3b: dwa zgodne kafle gruntu 1024 x 1024, pył i konwersja kryształowa. Odsłonięte wydmy i kamienie mają identyczne pozycje; sieć pokrywa około 73% drugiego kafla.
- P4: miękka, rzadka nakładka czerwonego pyłu 1024 x 1024 na czerni.
- P5: arkusz oraz 10 osobnych rekwizytów, w tym dwie pary całe/rozbite.
- P6: arkusz oraz 4 pasy 1024 x 160 lub 160 x 1024 i 4 narożniki 256 x 256.
- P7: dwa arkusze oraz 6 wrogów, elita shard drone 1,6x i 24 osobne szczątki (po 4 dla każdego wroga).
- P8: Red Colossus 1024 x 1024, arkusz części i 11 osobnych części: kadłub, 4 nogi, 2 działa i 4 słabe punkty. Kompletny boss znajduje się również w prawym dolnym rogu arkusza części, w tej samej skali produkcyjnej.

P2 nie jest potrzebne: Mars jest światem z podłożem.

## Użycie

Wszystkie obiekty i arkusze mają płaskie tło #05010f zgodnie z promptami biblii. P4 ma czarne tło #000000 do addytywnego mieszania. Kafle gruntu można przenikać; ich jasność podłoża jest ograniczona do 30% luminancji. Nakładka pyłu ma miękko wygaszone brzegi, więc powtarza się bez twardych łączeń. Ruch, burze i wzrost sieci animuje kod gry.

Największy wróg ma 300 px; pozostałe zachowują proporcje 24:32:36:40:50:66. Wycinki mają dodatkowy margines 12 px z każdej strony. Rozmiary samej zawartości, skale i pozycje w arkuszach są w graphics/asset-inventory.json. Pary zniszczenia zachowują identyczny współczynnik skali.

graphics/W4-P8-attachment-guide.json podaje orientacyjne środki mocowań w układzie obrazu bossa 1024 x 1024. Części to osobne renderingi tego samego projektu, dopasowane skalą; plik nie jest automatycznym riggiem odtwarzającym obraz piksel w piksel.

## Prompty i kontrola

prompts/ zawiera 10 dokładnych promptów użytych do finalnych obrazów, a prompts/bible/ osiem pełnych bazowych promptów z biblii. Każdy użyty prompt zachowuje dosłowne bloki STYLE + WORLD + TASK, z dopiskami wykonawczymi na końcu. Grafiki powstały we wbudowanym image_gen. Oryginały, warianty A/B konceptu i odrzucona pierwsza konwersja pozostają w D:/void blaster art/W4/variants/.

qa/ zawiera podglądy powtórzeń, przesuniętych kafli, przejścia gruntu, nakładki na podłożu, ramy i wszystkich wycinków oraz raporty kontroli. Obrazy QA z podpisami nie są grafikami gry. Sprawdzono kompletność niezależnie od listy plików, rozmiary, proporcje, marginesy, powtarzalność, osiem połączeń narożników i zgodność bloków promptów. SHA256SUMS.txt obejmuje wszystkie pozostałe pliki paczki. ZIP jest sprawdzany po zapisie przez CRC, sumy oraz pełny odczyt każdego PNG.
