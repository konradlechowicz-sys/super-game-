# W2 — Siege of Earth

Kompletny zatwierdzony zestaw grafik Void Blaster 2.0, przygotowany 28.10.2026.

Wybrane warianty: P1 A, P2 B, P3 A, P4 A, P5 A, P6 B, P7 A, P8 B.
Każdy etap powstał w dwóch wariantach, a Konrad wybrał wariant przed następnym etapem.

## Zawartość

- graphics/: 67 grafik PNG — wybrane arkusze oraz osobne elementy.
- prompts/: 9 dokładnych promptów użytych do wybranych grafik (P7 ma osobne prompty dla jednostek i elity).
- metadata/: spisy elementów, skala, pozycje części i raport sprawdzenia.
- SELECTIONS.json: wybory dla wszystkich ośmiu etapów.
- FILE-INVENTORY.json i CHECKSUMS.sha256: wymiary, rozmiary plików i sumy kontrolne.

## Etapy

| Etap | Wybrane pliki |
|---|---|
| P1 | Koncept areny 941×1672 |
| P2 | Powtarzalna nocna Ziemia 2048×2048, bez chmur |
| P3 | Powtarzalny kafel chmur 1024×1024 |
| P4 | Powtarzalna nakładka chmur, iskier i deszczu 1024×1024 |
| P5 | Arkusz 10 rekwizytów i 10 osobnych PNG, w tym pary całe/zniszczone |
| P6 | Arkusz, 4 pasy długości 1024 px i grubości 160 px, 4 narożniki 256×256 |
| P7 | 6 wrogów, elita 1,6×, 24 szczątki; 2 arkusze i 31 osobnych PNG |
| P8 | Boss 1024×1024, arkusz części 3072×3072 i 8 osobnych części |

## Użycie plików

Widok dokładnie z góry. Arkusze i wycinki obiektów mają tło RGB #05010f zgodnie z biblią; nie są przezroczystymi PNG. P3 i P4 mają czarne prześwity. P4 służy do mieszania addytywnego. P2, P3 i P4 powtarzają się we wszystkich czterech kierunkach; pasy P6 powtarzają się wzdłuż długości.

P7 zachowuje proporcje 30/34/44/30/44/64; największy wróg ma 300 px. Elita ma 226 px (1,6× po zaokrągleniu). Każdy rząd szczątków odpowiada kolejno jednostce z arkusza: interceptor, lander pod, gunship, sky mine, bomber, siege walker. Szczątki wycięto z faktycznych kadłubów i zachowano ich skalę.

P8: kadłub, dwa oddzielne pierścienie dział, cztery moduły słabych punktów i płomień silnika. Wszystkie części są w skali 1:1 względem bossa. Jego dokładna złożona kopia jest w prawym dolnym rogu arkusza części. Pozycje do ponownego złożenia są w metadata/P8-assembly.json. Osobne wycinki mają margines 12 px.

Grafiki stworzono wbudowanym imagegen. Za zgodą Konrada wykonano lokalne skalowanie, wycinanie i dopasowanie szwów; zachowano oryginały. P2 zapisano w docelowych 2048×2048 po przeskalowaniu oryginału 1254×1254. Pozostałe arkusze części złożono lokalnie z dokładnych wycinków, bez zmiany ich wzajemnej skali.

Źródło kierunku artystycznego: Void-Blaster-2.0-Art-Bible.pdf, strony 9, 18, 22–23, oraz zatwierdzony koncept W2 P1 A. Niewybrane warianty i oryginały pozostają w katalogu projektu W2/variants/; ten ZIP zawiera zatwierdzony zestaw.

## W repozytorium

Oryginały PNG z paczki są tu zapisane jako bezstratne WebP (te same nazwy, rozszerzenie `.webp`), żeby repozytorium
było lżejsze; ścieżki `.png` w `metadata/` odpowiadają plikom `.webp`. Teksturom do gry nadaje kształt
`proto2/make-world2.py` (wynik w `proto2/assets/w2-*`, `enemy-*`, `glow-*`).
