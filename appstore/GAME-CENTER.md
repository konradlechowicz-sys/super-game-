# Game Center: rankingi trybu Endless (wersja 1.3)

Gra wysyła wynik (liczbę zabitych wrogów) po każdym przelocie w trybie Endless do rankingu świata, w którym grano.
Rankingi trzeba raz założyć w App Store Connect. Bez tego gra działa normalnie, tylko wyniki nigdzie nie trafiają.

## Krok 1: Game Center w aplikacji
1. App Store Connect → Apps → **Void Blaster: Neon Survivor** → zakładka **Services** (Usługi) → **Game Center**.
2. Jeśli Game Center nie jest włączone dla aplikacji, włącz je.

## Krok 2: cztery rankingi (Leaderboards)
Dla każdego świata kliknij **+** przy Leaderboards i wybierz **Classic Leaderboard**:

| Reference Name | Leaderboard ID | Nazwa widoczna dla graczy (English) |
| --- | --- | --- |
| Endless – Neon Nebula | `com.konradlechowicz.voidblaster.endless.w1` | Endless: Neon Nebula |
| Endless – Crystal Belt | `com.konradlechowicz.voidblaster.endless.w2` | Endless: Crystal Belt |
| Endless – Solar Forge | `com.konradlechowicz.voidblaster.endless.w3` | Endless: Solar Forge |
| Endless – Void Core | `com.konradlechowicz.voidblaster.endless.w4` | Endless: Void Core |

Ustawienia każdego rankingu:
- **Score Format Type:** Integer
- **Submission Type:** Best Score
- **Sort Order:** High to Low
- **Score Range:** puste (bez limitu)
- **Localization:** English, nazwa z tabeli powyżej, format wyniku: Integer, sufiks liczby pojedynczej „ kill”, mnogiej „ kills”
  (pole „Score Format Suffix”), obrazek 512×512 opcjonalny.

Leaderboard ID musi być dokładnie taki jak w tabeli (gra używa tych identyfikatorów, `js/leaderboard.js`).

## Krok 3: dołącz rankingi do wersji 1.3
Na stronie wersji 1.3 (App Store → wersja) w sekcji **Game Center** zaznacz Game Center i dodaj cztery rankingi.
Bez tego Apple nie pokaże ich graczom po wydaniu.

## Testowanie
- W TestFlight i w wersji z Xcode na telefonie rankingi działają w trybie „sandbox”: wyniki widzą tylko testerzy.
- Aplikacja TEST („VB Test”, osobny identyfikator) nie ma rankingów w App Store Connect, więc w niej przycisk
  rankingu pokazuje pusty ekran Game Center. To normalne.
- W Xcode w zakładce Signing & Capabilities powinno być widać **Game Center** (dodane w projekcie, plik `App.entitlements`).

## Wersja 2.0: dziesięć światów (do zrobienia przed premierą 2.0)
W 2.0 tryb Endless ma ranking dla każdego z 10 światów (otwiera się po pokonaniu Void Heart w świecie 10). Rankingi
`w1`-`w4` zostają (te same identyfikatory), ale zmieniają się nazwy światów, więc przy 2.0 trzeba im zmienić nazwę
widoczną dla graczy i dodać rankingi `w5`-`w10`, z tymi samymi ustawieniami co wyżej:

| Reference Name | Leaderboard ID | Nazwa widoczna dla graczy (English) |
| --- | --- | --- |
| Endless – Orbital Ruins | `com.konradlechowicz.voidblaster.endless.w1` | Endless: Orbital Ruins |
| Endless – Siege of Earth | `com.konradlechowicz.voidblaster.endless.w2` | Endless: Siege of Earth |
| Endless – Lunar Bridgehead | `com.konradlechowicz.voidblaster.endless.w3` | Endless: Lunar Bridgehead |
| Endless – Red Conversion | `com.konradlechowicz.voidblaster.endless.w4` | Endless: Red Conversion |
| Endless – Foundry Belt | `com.konradlechowicz.voidblaster.endless.w5` | Endless: Foundry Belt |
| Endless – Storm Relay | `com.konradlechowicz.voidblaster.endless.w6` | Endless: Storm Relay |
| Endless – Abyss of Europa | `com.konradlechowicz.voidblaster.endless.w7` | Endless: Abyss of Europa |
| Endless – The Rift Gate | `com.konradlechowicz.voidblaster.endless.w8` | Endless: The Rift Gate |
| Endless – Brood World | `com.konradlechowicz.voidblaster.endless.w9` | Endless: Brood World |
| Endless – The Nexus | `com.konradlechowicz.voidblaster.endless.w10` | Endless: The Nexus |

Uwaga: w 2.0 postęp zaczyna się od nowa, a stare wyniki w rankingach `w1`-`w4` pochodzą z innych światów 1.x. Jeśli mają
zniknąć, prościej założyć dla 2.0 nowe identyfikatory (wtedy zmienić `leaderboardId` w `js/leaderboard.js`); decyzja Konrada.
