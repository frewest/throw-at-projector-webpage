# throw-at-projector-webpage

Cast-receivern för [throw-at-projector](https://github.com/frewest/throw-at-projector):
levande, realtidsgenererade myror på vit bakgrund, ritade med HTML5 canvas.
Sidan körs på Chromecasten som Custom Web Receiver och hostas med GitHub Pages.

**Adress:** <https://frewest.github.io/throw-at-projector-webpage/>
(testa med `?debug=1` för fps-räknare)

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Fullskärmscanvas |
| `ants.js` | Myranimationen |
| `cast.js` | Laddar Cast Receiver SDK på Chromecast och tar emot kommandon |

## GitHub Pages

**Settings → Pages → Source: Deploy from a branch → Branch: `main`, `/ (root)` → Save.**

## Testa lokalt

```sh
python3 -m http.server 8000
# öppna http://localhost:8000/?ants=300&debug=1
```

| Parameter | Standard | Beskrivning |
|---|---|---|
| `ants`  | 300 | Antal myror (0–2000) |
| `speed` | 1   | Hastighetsfaktor (0.05–5) |
| `size`  | 1   | Storleksfaktor (0.3–4) |
| `debug` | 0   | `1` = visa fps |
| `res`   | 1   | Andel av full upplösning, t.ex. `0.75` |

Tangentbord: ↑/↓ antal, →/← hastighet, `+`/`-` storlek, `d` fps.

## Protokoll

Namespace `urn:x-cast:com.throwatprojector.ants`, JSON:

```json
{"ants":300,"speed":1.2,"size":1,"debug":false}
```
