# W8: The Rift Gate — komplet grafik

73 produkcyjnych PNG według biblii i zatwierdzonego konceptu P1.
Generator: wbudowany image_gen. Oryginalne generacje i warianty zachowano w projekcie,
w W8/variants/. Dokładne prompty źródłowe, doprecyzowania i poprawki są w prompts/.

## Zawartość i import

- graphics/: obrazy P1-P8, arkusze i oddzielne elementy. P1 jest referencją, nie kaflem.
- P2: tło dalekie. 2048x2048, pojedynczy obraz bez kafelkowania.
- P3: sześć odłamków z pustymi wnętrzami 200-600 px; obrazy do wnętrz dodaje gra.
- Jasne cienkie krawędzie odłamków należą do wyglądu Wrót.
- P4: kafel 1024x1024 na czerni #000000, do blendowania addytywnego.
- P5: 10 rekwizytów; pary całe/zniszczone mają wspólny współczynnik skali.
- P6: góra/dół 1024x160, lewy/prawy 160x1024, narożniki 256x256. Zgodne połączenia.
- P7: sześciu wrogów i arkusz, elita 1,6x ze złotym pierścieniem i 24 szczątki, po 4 na typ.
  Rozmiary produkcyjne zachowują proporcje z biblii, największy zwykły wróg ma 300 px zawartości.
  Skalowanie do rozmiarów ekranowych opisuje DELIVERY-REQUIREMENTS.json.
- P8: boss 1024x1024 i części. 
  Pełny boss w prawym dolnym rogu arkusza to identyczny plik i skala jak osobny boss.
- Obiekty/arkusze mają płaskie tło #05010f zgodnie ze szczegółowymi promptami biblii;
  usuwać je podczas importu. Wyjątek: półprzezroczysty lód W7 i nakładki P4.
  Indywidualne wycinki mają 12 px marginesu. Dane wycinków i skali: manifest.json.

## Przygotowanie techniczne i ograniczenia

Kafle przygotowano minimalnym cięciem w nakładających się fragmentach istniejącej generacji,
bez domalowywania treści. Zapisane przeciwległe krawędzie kafli i końce pasów są identyczne.
P2 osiąga rozmiar docelowy przez techniczne skalowanie oryginału generatora; manifest podaje
natywne rozmiary. Nie jest to obietnica natywnej generacji 2048 px.
Części bossów są spójnymi modułami o skalibrowanej wielkości, ale nie pikselowym riggiem:
pivoty, mocowania i animację trzeba ustawić w silniku. Nie integrowano grafik w grze.

## Kontrola i rozpakowanie

qa/: audyt techniczny, przegląd wzrokowy, podglądy wycinków, powtórzeń, warstw i ramy.
SHA256SUMS.txt: sumy wszystkich pozostałych plików. Wszystkie części ZIP rozpakować do
tego samego katalogu. Każda część ma mniej niż 30 000 000 bajtów; pliki nie powtarzają się
między częściami tego świata. Paczka jest ukończona dopiero po wypakowaniu wszystkich części.
Kontrola po zapisie obejmuje CRC, SHA256, pełny odczyt PNG i kompletny spis plików.
Raport final-archive-verification.json jest zapisany osobno w W8/qa/, bo raport z sumą
archiwum nie może być częścią tego samego archiwum.


_W repozytorium grafiki są bezstratnymi WebP (oryginały PNG w paczce od Konrada); obrazy QA pominięte, raporty JSON w qa/._
