# Void Blaster 2.0 - W5: Foundry Belt

Kompletny zestaw grafik według Art Bible (strony 12, 18, 28-29), oparty na zatwierdzonym przez Konrada koncepcie P1 B. Agresywne kanciaste maszyny, ciężka stal, skała, pomarańcz pieców i magentowe rdzenie. Grafiki i edycje wykonano wbudowanym image_gen; oryginały i warianty pozostają w katalogu źródłowym projektu.

## Zawartość: 74 produkcyjne PNG (tu jako bezstratne WebP; obrazy QA z paczki pominięte, zostały raporty JSON w qa/)

- P1: zatwierdzony koncept 941 x 1672.
- P2: ciemny kosmos z dalekimi planetoidami-fabrykami, kafel 2048 x 2048.
- P3: podłoże 1024 x 1024 z trzema szczelinami do L0, wersje RGBA i na czerni. Przezroczyste szczeliny zajmują około 12,1% powierzchni (biblia: około 15%).
- P4: iskry, popiół i delikatny dym na czerni, 1024 x 1024.
- P5: arkusz i 13 osobnych elementów, w tym trzy różne planetoidy i dwie pary całe/zniszczone.
- P6: arkusz i osiem części: cztery pasy 1024 x 160 lub 160 x 1024 oraz cztery narożniki 256 x 256.
- P7: dwa arkusze, sześciu wrogów, elita forge drone 1,6x i 24 szczątki (po cztery na typ).
- P8: Foundry Mother 1024 x 1024, arkusz i 11 części: kadłub, cztery ramiona, dwie zatoki oraz cztery moduły słabych punktów. Kompletny boss w prawym dolnym rogu arkusza ma dokładnie taką samą wielkość i rendering jak osobny plik.

## Import i skala

Obiekty i arkusze mają płaskie tło #05010f zgodnie z biblią. Usuwanie tego tła jest częścią importu do gry. P3-rgba ma prawdziwą przezroczystość tylko w szczelinach i należy go rysować nad P2 (paralaksa P2 około 0,2). P3 bez końcówki rgba ma czarne wnętrza szczelin i może służyć jako źródło do własnego kluczowania. P4 dodawaj addytywnie. Nie importuj plików z qa/ jako assetów gry.

Największy wróg ma 300 px zawartości. Rozmiary pozostałych to 160, 170, 240, 280 i 200 px według proporcji z biblii; elita forge drone ma 256 px. Wycinki mają dodatkowo margines 12 px z każdej strony. Rekwizyty duże mają 300 px, planetoidy 170 px, małe elementy 100 px; pary zniszczenia używają tego samego współczynnika skali. Szczegóły wycinków, rozmiary zawartości, skale i pozycje w arkuszach są w graphics/asset-inventory.json.

graphics/W5-P8-attachment-guide.json podaje orientacyjne położenia mocowań w obrazie bossa 1024 x 1024. Części są osobnymi renderami tego samego projektu, dopasowanymi do skali produkcyjnej. Nie tworzą automatycznego riggu odtwarzającego obraz piksel w piksel. Zatoki zawierają elementy struktury montażowej; piece są także obecne w kadłubie bazowym. Przy animacji ukrywaj odpowiednio zasłaniane elementy kadłuba.

## Przygotowanie techniczne i kontrola

Oryginalne generacje zachowano. Rozmiary docelowe uzyskano przez przygotowanie techniczne: wycinki, atlasowanie, skalowanie, jednolite tła i dopasowanie łączeń. P2 2048 x 2048 powstał ze 1024-pikselowego okresowego wycinka generacji 1254 x 1254; rozmiar wyjściowy nie oznacza dodatkowej natywnej szczegółowości. Przezroczystość szczelin wygenerowano narzędziem image_gen; prawie nieprzezroczyste fragmenty solidnego gruntu unormowano do pełnego alpha. Podłoże ograniczono do 30% luminancji. Przeciwległe krawędzie kafli są zgodne; pasy i narożniki mają zgodne profile połączeń.

prompts/ zawiera 11 dokładnych promptów finalnych/edycyjnych, prompts/bible/ osiem pełnych bazowych promptów STYLE + WORLD + TASK. qa/ zawiera podglądy powtórzeń, przesunięć, kompozycji warstw, ramy i wszystkich wycinków oraz raport automatyczny i zapis przeglądu wizualnego. SHA256SUMS.txt obejmuje wszystkie pozostałe pliki paczki. Archiwum po zapisie sprawdzane jest przez CRC, porównanie sum, kompletność oraz pełny odczyt każdego PNG.

Ruch taśmociągów, spawanie, pulsowanie pieców, dryf osłon, eksplozje i wypuszczanie wrogów przez bossa realizuje kod gry.
