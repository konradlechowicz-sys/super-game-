# Void Blaster 2.0 — grafiki COMMON

Komplet plików dla zadań IC1–IC6, EL1, FX1–FX9, PU1, SH4, UI3–UI5 i ST1–ST3. Pominięto zadania oznaczone jako ukończone oraz wymagające decyzji. Każdy folder zadania ma katalog `selected` z wybranymi plikami PNG i `prompts` z tekstem promptu z księgi promptów. Arkusze zbiorcze oraz pojedyncze elementy są opisane nazwami zawierającymi kod zadania. Plik `manifest.json` zawiera listę obrazów, wymiary i sumy SHA-256.

Paczki są dzielone według zadań; należy rozpakować wszystkie do jednego katalogu. Lokalne foldery `variants` i `qa` zachowują dodatkowe warianty i podglądy robocze poza paczkami.

## Informacje do integracji

- Efekty FX mają czarne tło zgodnie z promptami; przewidziano ich nakładanie addytywne. Arkusze animacji są poziome, z klatkami w kolejności od lewej do prawej; liczba klatek jest w nazwie pliku.
- Oddzielne nakładki i odznaki EL1 mają przezroczystość. Ikony, pickupy i elementy statku mają ciemne tło zgodnie z promptami, nie kanał przezroczystości.
- Części SH4 zostały wygenerowane osobno: do złożenia w grze mogą wymagać dopasowania położenia, skali i punktów mocowania do istniejącego modelu.
- UI3 i ST3 zostały przeskalowane do docelowych wymiarów; ST2 zostało przycięte do proporcji 1024×500.
- Grafiki i klatki sprawdzono wizualnie oraz zweryfikowano odczyt PNG i wymiary. Nie były jeszcze uruchamiane w grze; płynność pętli i dopasowanie elementów trzeba sprawdzić podczas integracji.
