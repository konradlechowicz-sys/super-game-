# Jak testować Void Blastera (ściągawka dla Konrada)

Każdy build da się uruchomić w **3 miejscach** i w **2 wariantach**:

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

## Ważne

- **TEST to osobna aplikacja „VB Test”** z własnym zapisem. Możesz w niej psuć, co chcesz: Twój prawdziwy postęp zostaje nietknięty.
- ⚠️ **`npm run phone` (zwykła gra na telefonie) zastępuje grę z App Store**, bo to ta sama aplikacja. Zapis zostaje. Do wersji ze sklepu wrócisz, instalując ją ponownie z App Store. Skrypt zawsze pyta o zgodę. Na telefonie zwykle wystarcza `phone:test`.
- **▶ w Xcode zawsze oznacza zwykłą grę.** Xcode sam nie buduje gry, tylko pakuje to, co przygotowały skrypty. Po każdym teście TEST skrypt przywraca w projekcie zwykłą grę, żeby ▶ i Archive nigdy nie wysłały wersji TEST. Jeśli chcesz klikać ▶ sam: `npm run xcode` (zbuduje zwykłą grę i otworzy Xcode).
- **Przeglądarka:**
  - podglądy w Claude zawsze pokazują najnowszy build ode mnie;
  - `npm run web` / `web:test` budują i otwierają w przeglądarce na Macu to, co masz w folderze projektu;
  - zwykła wersja w przeglądarce to darmowy trial.
- **Wydanie do App Store:** tylko `npm run release`. Z tymi testami nie ma nic wspólnego.

## Android (w wersji 2.0)

`npm run android:play` (zwykła gra) i `npm run android:test` (TEST) instalują grę na emulatorze albo telefonie z Androidem.
