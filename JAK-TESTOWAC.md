# Jak testować Void Blastera (ściągawka dla Konrada)

Każdy build da się uruchomić w **3 miejscach** i w **2 wariantach** (na Windowsie: przeglądarka i Android, zob. niżej):

| | **zwykła gra** (to, co dostaje gracz) | **TEST** (panel testera 🛠: god mode, odblokuj wszystko, boss, FPS, 2.0…) |
|---|---|---|
| **przeglądarka** | podgląd „Void Blaster” w Claude albo `npm run web` | podgląd „Void Blaster TEST” w Claude albo `npm run web:test` |
| **symulator iOS** | `npm run sim` | `npm run sim:test` |
| **Twój iPhone** | `npm run phone` ⚠️ | `npm run phone:test` |

Nie pamiętasz komend? Wpisz **`npm start`**. Zapyta: *gdzie?* (p / s / i) i *która wersja?* (Enter / t).

Przed uruchomieniem zawsze wypisuje ramkę, żebyś wiedział, co testujesz:

```
────────────────────────────────────────────────────
  Void Blaster · build 68 (2026-10-27)
  Kod:     kandydat z chmury, jeszcze nie zaakceptowany (gałąź claude/...)
  Gdzie:   symulator iOS
  Wariant: TEST — panel testera 🛠, osobna aplikacja „VB Test”
────────────────────────────────────────────────────
```

## Który build się uruchamia?

**Komendy z tabeli uruchamiają to, co masz teraz w folderze projektu.** Ramka pokazuje, co to jest:
- *zaakceptowana wersja (main)*: to, co przyjąłeś.
- *kandydat z chmury*: nowa propozycja ode mnie, jeszcze nieprzyjęta.

**Nowe buildy ode mnie testujesz przez `npm run review`.** Review:
1. pokazuje listę nowych buildów;
2. pyta o miejsce: symulator albo iPhone;
3. pyta o wariant: zwykła gra albo TEST;
4. uruchamia wybrany build;
5. pyta o decyzję: **[a]** akceptuj, **[o]** odrzuć, **[p]** później.

Po decyzji wracasz do zaakceptowanej wersji (main).

## Dwie linie: 1.x i 2.0

| Linia | Co to jest | Do czego |
|---|---|---|
| **`main`** | Void Blaster 1.x, gotowy do wydania | tylko poprawki błędów; z niej robisz `npm run release` |
| **`v2`** | zaakceptowane buildy wersji 2.0 | cała nowa praca; nigdy nie idzie prosto do App Store |

`npm run review` pokazuje nowe buildy w dwóch grupach: **„Void Blaster 1.x → main”** i **„Wersja 2.0 → v2”**.
Akceptujesz jak zwykle **[a]**, a skrypt sam wie, do której linii trafi build. Po wszystkim folder projektu wraca
na `main`, więc Xcode i `npm run release` zawsze mają 1.x. Na premierę 2.0 linia `v2` zostanie scalona do `main`.

## Ważne

- **TEST to osobna aplikacja „VB Test”** z własnym zapisem. Możesz w niej psuć, co chcesz: Twój prawdziwy postęp zostaje nietknięty.
- ⚠️ **`npm run phone` (zwykła gra na telefonie) zastępuje grę z App Store**, bo to ta sama aplikacja. Zapis zostaje. Do wersji ze sklepu wrócisz, instalując ją ponownie z App Store. Skrypt zawsze pyta o zgodę. Na telefonie zwykle wystarcza `phone:test`.
- **▶ w Xcode zawsze oznacza zwykłą grę.** Xcode sam nie buduje gry, tylko pakuje to, co przygotowały skrypty. Po każdym teście TEST skrypt przywraca w projekcie zwykłą grę, żeby ▶ i Archive nigdy nie wysłały wersji TEST. Jeśli chcesz klikać ▶ sam: `npm run xcode` (zbuduje zwykłą grę i otworzy Xcode).
- **Przeglądarka:**
  - podglądy w Claude zawsze pokazują najnowszy build ode mnie;
  - `npm run web` / `web:test` budują i otwierają w przeglądarce (na Macu albo na Windowsie) to, co masz w folderze projektu;
  - zwykła wersja w przeglądarce to darmowy trial.
- **Wydanie do App Store:** tylko `npm run release`. Z tymi testami nie ma nic wspólnego.

## Android (w wersji 2.0)

`npm run android:play` (zwykła gra) i `npm run android:test` (TEST) instalują grę na emulatorze albo telefonie z Androidem.
W `npm start` to opcja **[a]**. Działa na Macu i na Windowsie, jeśli jest zainstalowane Android Studio.

## Na Windowsie (komputer stacjonarny)

Na Windowsie nie ma Xcode, więc **symulatora iOS i iPhone'a tu nie uruchomisz**, a wydania do App Store robisz tylko
na Macu. Wszystko inne działa tak samo:

| Co | Komenda |
|---|---|
| menu (pyta: przeglądarka albo Android, zwykła albo TEST) | `npm start` |
| gra w przeglądarce | `npm run web` / `npm run web:test` |
| przegląd i akceptacja nowych buildów ode mnie | `npm run review` (uruchamia build w przeglądarce albo na Androidzie) |
| Android | `npm run android:play` / `npm run android:test`, Android Studio: `npm run android:open` |

**Przygotowanie (raz):**
1. Zainstaluj **Git for Windows** (https://git-scm.com/download/win), opcje domyślne.
2. Zainstaluj **Node.js LTS** (https://nodejs.org), opcje domyślne.
3. Otwórz **Terminal** (PowerShell) i wpisz po kolei:
   ```
   cd $HOME\Documents
   git clone https://github.com/konradlechowicz-sys/super-game-.git
   cd super-game-
   npm install
   git config --global user.name "Konrad Lechowicz"
   git config --global user.email "twój e-mail z GitHuba"
   ```
   Przy pierwszym `git clone` albo pierwszej akceptacji w `npm run review` otworzy się okno logowania do GitHuba.
   Zaloguj się, a Windows zapamięta dostęp.
4. Jeśli PowerShell pisze *„running scripts is disabled on this system”*, wpisz raz:
   `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` i potwierdź **T** (albo **Y**).
5. (Opcjonalnie, dla Androida) zainstaluj **Android Studio** i otwórz je raz, żeby pobrało SDK.

**Na co dzień:** otwórz Terminal, `cd $HOME\Documents\super-game-`, potem `npm run review` albo `npm start`.

**Jeden projekt na dwóch komputerach:** wspólnym miejscem jest GitHub. To, co zaakceptujesz na Windowsie, trafia do
`main` na GitHubie, a `npm run review` na Macu pobierze to sam. Nie zmieniaj ręcznie plików gry na żadnym z komputerów,
wtedy nic się nie pogryzie.
