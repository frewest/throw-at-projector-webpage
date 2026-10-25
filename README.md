# throw-at-projector-webpage

Cast-receivern för [throw-at-projector](https://github.com/frewest/throw-at-projector):
levande, realtidsgenererade figurer på vit bakgrund, ritade med HTML5 canvas.
Två lägen: **Myror** och **Stitch** (Stitch, Angel, Reuben, Lilo, Jumba och
Pleakley som springer omkring, hoppar och jagar varandra).
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
| `mode`  | ants | `ants` eller `stitch` |
| `count` | 300 / 10 | Antal myror (0–2000) / figurer (0–60) |
| `speed` | 1   | Hastighetsfaktor (myror 0.05–5, Stitch 0.2–3) |
| `size`  | 1   | Storleksfaktor (myror 0.3–4, Stitch 0.4–2.5) |
| `debug` | 0   | `1` = visa fps |
| `res`   | 1   | Andel av full upplösning, t.ex. `0.75` |

Tangentbord: ↑/↓ antal, →/← hastighet, `+`/`-` storlek, `d` fps,
`m` nästa läge, `1`/`2` välj läge. På mobil: dubbeltryck visar fps,
trippeltryck byter läge.

## Protokoll

Namespace `urn:x-cast:com.throwatprojector.ants`, JSON:

```json
{"mode":"stitch","count":10,"speed":1.2,"size":1,"debug":false}
```

Utan `mode` gäller värdena det aktiva läget; `ants` är alias för `count`.
