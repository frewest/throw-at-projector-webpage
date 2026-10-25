# throw-at-projector-webpage

Cast-receivern för [throw-at-projector](https://github.com/frewest/throw-at-projector):
levande, realtidsgenererade figurer på vit bakgrund, ritade med HTML5 canvas.
Lägen: **Myror**, **Stitch** (Stitch, Angel, Reuben, Lilo, Jumba och
Pleakley som springer omkring, hoppar och jagar varandra), **Jordbruk**
(traktorer med redskap och skördetröskor som kör i raka rader och lämnar
spår, och en balgrip som hämtar rundbalarna) och **Kids** (Ida, Althea, Vienna och
Nils som streckgubbar som hittar på bus med varandra, och ibland äter glass,
badar, äter hamburgare, springer i strumporna eller sover över tillsammans).
Sidan körs på Chromecasten som Custom Web Receiver och hostas med GitHub Pages.

**Adress:** <https://frewest.github.io/throw-at-projector-webpage/>
(testa med `?debug=1` för fps-räknare)

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Fullskärmscanvas |
| `engine.js` | Motorn: loop, storlek, inställningar, lägesbyte |
| `ants.js` | Läget Myror |
| `stitch.js` | Läget Stitch |
| `farm.js` | Läget Jordbruk |
| `kids.js` | Läget Kids |
| `cast.js` | Laddar Cast Receiver SDK på Chromecast och tar emot kommandon |

## GitHub Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions.**
Workflowen `.github/workflows/pages.yml` publicerar sedan sidan vid varje push.

## Testa lokalt

```sh
python3 -m http.server 8000
# öppna http://localhost:8000/?mode=stitch&count=12&debug=1
```

| Parameter | Standard | Beskrivning |
|---|---|---|
| `mode`  | ants | `ants`, `stitch`, `farm` eller `kids` |
| `count` | 300 / 10 / 6 / 4 | Antal myror (0–2000) / figurer (0–60) / fordon (0–30) / barn (1–4) |
| `speed` | 1   | Hastighetsfaktor (myror 0.05–5, övriga 0.2–3) |
| `size`  | 1   | Storleksfaktor (myror 0.3–4, Stitch 0.4–2.5, jordbruk 0.5–2.5, kids 0.4–2.5) |
| `debug` | 0   | `1` = visa fps |
| `res`   | 1   | Andel av full upplösning, t.ex. `0.75` |
| `bus`   | –   | Kids: välj ett bus som görs om och om igen, t.ex. `balloon`, `boo`, `fart`, eller en gemensam stund som `pool` (se överst i `kids.js`) |

Tangentbord: ↑/↓ antal, →/← hastighet, `+`/`-` storlek, `d` fps,
`m` nästa läge, `1`–`9` välj läge. På mobil: dubbeltryck visar fps,
trippeltryck byter läge.

## Lägga till ett läge

Skapa en js-fil som anropar `Projector.register({...})` (se kommentaren
överst i `engine.js`), lägg till den i `index.html` och i
`.github/workflows/pages.yml`, och lägg till en rad i `GameMode.kt` i appen.

## Protokoll

Namespace `urn:x-cast:com.throwatprojector.ants`, JSON:

```json
{"mode":"stitch","count":10,"speed":1.2,"size":1,"debug":false}
```

Utan `mode` gäller värdena det aktiva läget; `ants` är alias för `count`.
