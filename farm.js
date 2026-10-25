/*
 * Läge "Jordbruk" – traktorer och andra jordbruksfordon kör över fältet.
 *
 * Fordonen ses uppifrån och kör omkring på fältet i slumpvisa svängar. En
 * stund håller de sig kvar på fältet, sedan kör de iväg och ett nytt fordon
 * kommer in från en kant. Redskapen lämnar spår på ett eget spår-lager som
 * bleknar bort efter en stund: harvad jord, plogfåror, sådda rader, stubb,
 * klippt gräs, gödselkorn och rundbalar.
 *
 * Fordonen förrenderas en gång per storlek och färg och roteras vid ritning,
 * så varje fordon kostar ett drawImage-anrop.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- konstanter
  var MAX = 30;
  var MAXP = 1500;             // partiklar: rök, gödselkorn, agnar, dimma
  var MAXB = 80;               // rundbalar på fältet
  var BASE_L = 72;             // traktorlängd i px vid size=1 och 1080 px kortsida
  var BASE_SPEED = 90;         // px/s vid speed=1
  var BALE_LIFE = 30;          // sekunder innan en bal bleknat bort
  var FADE_EVERY = 0.25;       // sekunder mellan varje blekning av spåren
  var FADE_ALPHA = 0.03;       // ger spår som är borta efter ca 20-30 s
  var TWO_PI = Math.PI * 2;
  var OUTLINE = '#25272d';
  var OL = 0.012;              // konturbredd i traktorlängder

  var SMOKE = 0, GRAIN = 1, MIST = 2;

  // ---------------------------------------------------------------- värld
  var W = 1920, H = 1080, scale = 1, L = BASE_L;
  var settings = null;
  var trail = null, tctx = null, fadeT = 0;

  // ---------------------------------------------------------------- fordonsdata
  var type = new Uint8Array(MAX);
  var pal = new Uint8Array(MAX);
  var px = new Float32Array(MAX);
  var py = new Float32Array(MAX);
  var head = new Float32Array(MAX);    // aktuell riktning
  var curve = new Float32Array(MAX);   // aktuell krökning (1/px, + = höger)
  var curveGoal = new Float32Array(MAX); // krökningen fordonet styr mot
  var curveT = new Float32Array(MAX);  // tid till nästa rattutslag
  var stay = new Float32Array(MAX);    // tid kvar innan fordonet får köra iväg
  var spd = new Float32Array(MAX);     // individuell fartfaktor
  var cur = new Float32Array(MAX);     // aktuell fart i px/s (accelererar)
  var wait = new Float32Array(MAX);    // hur länge fordonet stått och väntat
  var patience = new Float32Array(MAX); // hur länge det väntar innan det kör (slump)
  var blocker = new Int8Array(MAX);    // fordonet som står i vägen, eller -1
  var ghost = new Float32Array(MAX);   // tid kvar då det kör igenom andra
  var dist = new Float32Array(MAX);    // sträcka sedan förra balen
  var puff = new Float32Array(MAX);    // tid till nästa rökpuff
  var anim = new Float32Array(MAX);    // animationsfas (skördetröskans haspel)
  var count = 0;

  // partiklar (packade: levande ligger först)
  var ptx = new Float32Array(MAXP), pty = new Float32Array(MAXP);
  var pvx = new Float32Array(MAXP), pvy = new Float32Array(MAXP);
  var plife = new Float32Array(MAXP), pmax = new Float32Array(MAXP);
  var psize = new Float32Array(MAXP);
  var pkind = new Uint8Array(MAXP), pcol = new Uint8Array(MAXP);
  var pcount = 0;
  var PCOLORS = ['#8d8f94', '#b7a9ae', '#d4bd78', '#8cc8e6'];

  // rundbalar
  var bx = new Float32Array(MAXB), by = new Float32Array(MAXB), bage = new Float32Array(MAXB);
  var bcount = 0, bnext = 0;
  var baleSprite = null;

  // ---------------------------------------------------------------- ritverktyg
  // Fordonen ritas uppifrån i enheter av traktorns längd: mitten i origo,
  // fronten åt +x och höger sida åt +y.
  function rr(g, x0, y0, x1, y1, r, fill, noStroke) {
    r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
    g.beginPath();
    g.moveTo(x0 + r, y0);
    g.arcTo(x1, y0, x1, y1, r);
    g.arcTo(x1, y1, x0, y1, r);
    g.arcTo(x0, y1, x0, y0, r);
    g.arcTo(x0, y0, x1, y0, r);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    if (!noStroke) g.stroke();
  }

  function circ(g, x, y, r, fill, noStroke) {
    g.beginPath();
    g.arc(x, y, r, 0, TWO_PI);
    g.fillStyle = fill;
    g.fill();
    if (!noStroke) g.stroke();
  }

  function line(g, x0, y0, x1, y1, w, color) {
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.strokeStyle = color;
    g.lineWidth = w;
    g.stroke();
    g.strokeStyle = OUTLINE;
    g.lineWidth = OL;
  }

  // Däck uppifrån med mönster (chevroner) i färdriktningen.
  function wheel(g, cx, cy, len, wid) {
    rr(g, cx - len / 2, cy - wid / 2, cx + len / 2, cy + wid / 2, wid * 0.3, '#2b2b2f');
    g.strokeStyle = '#55555c';
    g.lineWidth = 0.014;
    for (var x = cx - len / 2 + 0.03; x < cx + len / 2 - 0.02; x += 0.05) {
      g.beginPath();
      g.moveTo(x, cy - wid / 2 + 0.015);
      g.lineTo(x + 0.025, cy);
      g.lineTo(x, cy + wid / 2 - 0.015);
      g.stroke();
    }
    g.strokeStyle = OUTLINE;
    g.lineWidth = OL;
  }

  function drawbar(g, x0, x1) {
    rr(g, x0, -0.03, x1, 0.03, 0.01, '#5a5b60');
  }

  // ---------------------------------------------------------------- traktor
  function tractor(g, P) {
    wheel(g, -0.2, -0.27, 0.4, 0.15);
    wheel(g, -0.2, 0.27, 0.4, 0.15);
    wheel(g, 0.32, -0.19, 0.24, 0.1);
    wheel(g, 0.32, 0.19, 0.24, 0.1);
    drawbar(g, -0.58, -0.36);
    // skärmar över bakhjulen
    rr(g, -0.4, -0.36, -0.0, -0.2, 0.05, P.body);
    rr(g, -0.4, 0.2, -0.0, 0.36, 0.05, P.body);
    // motorhuv med grill
    rr(g, -0.05, -0.11, 0.56, 0.11, 0.06, P.body);
    rr(g, 0.5, -0.09, 0.575, 0.09, 0.03, P.dark);
    line(g, 0.06, 0, 0.46, 0, 0.018, P.dark);
    circ(g, 0.12, -0.065, 0.026, '#333');
    // hytt: glas runt om, tak och varningsljus
    rr(g, -0.37, -0.2, 0.05, 0.2, 0.05, '#a3d3ea');
    rr(g, -0.34, -0.17, 0.02, 0.17, 0.04, P.roof);
    circ(g, -0.29, 0, 0.03, '#ff9f1a');
  }

  // ---------------------------------------------------------------- redskap
  function trailer(g) {
    drawbar(g, -0.74, -0.5);
    wheel(g, -1.3, -0.36, 0.2, 0.08);
    wheel(g, -1.3, 0.36, 0.2, 0.08);
    wheel(g, -1.06, -0.36, 0.2, 0.08);
    wheel(g, -1.06, 0.36, 0.2, 0.08);
    rr(g, -1.62, -0.33, -0.7, 0.33, 0.04, '#a8322b');
    rr(g, -1.57, -0.28, -0.75, 0.28, 0.05, '#e2bd52');
    g.beginPath();
    g.ellipse(-1.16, 0, 0.3, 0.16, 0, 0, TWO_PI);
    g.fillStyle = '#efd27a';
    g.fill();
    for (var k = 0; k < 14; k++) {
      circ(g, -1.52 + (k * 0.37 % 0.74), -0.22 + (k * 0.29 % 0.44), 0.012, '#c9a03c', true);
    }
  }

  function harrow(g) {
    drawbar(g, -0.72, -0.5);
    rr(g, -0.78, -0.62, -0.7, 0.62, 0.02, '#e0661f');
    rr(g, -0.96, -0.62, -0.88, 0.62, 0.02, '#e0661f');
    rr(g, -0.96, -0.62, -0.7, -0.56, 0.02, '#e0661f');
    rr(g, -0.96, 0.56, -0.7, 0.62, 0.02, '#e0661f');
    for (var y = -0.55; y <= 0.56; y += 0.1) {
      g.beginPath();
      g.ellipse(-0.74, y, 0.022, 0.05, 0.4, 0, TWO_PI);
      g.fillStyle = '#a9adb3';
      g.fill();
      g.stroke();
      g.beginPath();
      g.ellipse(-0.92, y + 0.05, 0.022, 0.05, -0.4, 0, TWO_PI);
      g.fill();
      g.stroke();
    }
    // vält längst bak
    rr(g, -1.04, -0.6, -0.98, 0.6, 0.02, '#77787d');
  }

  function plough(g) {
    drawbar(g, -0.66, -0.5);
    g.lineCap = 'round';
    line(g, -0.6, 0, -1.22, 0.62, 0.08, OUTLINE);
    line(g, -0.6, 0, -1.22, 0.62, 0.055, '#c62f2a');
    for (var k = 0; k < 4; k++) {
      g.save();
      g.translate(-0.72 - 0.15 * k, 0.12 + 0.15 * k);
      g.rotate(0.75);
      rr(g, -0.09, -0.035, 0.07, 0.05, 0.025, '#c62f2a');
      rr(g, 0.04, -0.03, 0.11, 0.045, 0.012, '#d4d7dc');
      g.restore();
    }
    wheel(g, -1.2, 0.68, 0.18, 0.07);
  }

  function spreader(g) {
    rr(g, -0.58, -0.06, -0.48, 0.06, 0.01, '#5a5b60');
    circ(g, -0.94, -0.13, 0.075, '#b0b4ba');
    circ(g, -0.94, 0.13, 0.075, '#b0b4ba');
    line(g, -1.0, -0.13, -0.88, -0.13, 0.014, '#6c7076');
    line(g, -0.94, -0.19, -0.94, -0.07, 0.014, '#6c7076');
    line(g, -1.0, 0.13, -0.88, 0.13, 0.014, '#6c7076');
    line(g, -0.94, 0.07, -0.94, 0.19, 0.014, '#6c7076');
    rr(g, -0.9, -0.3, -0.52, 0.3, 0.05, '#e8641e');
    rr(g, -0.86, -0.26, -0.56, 0.26, 0.03, '#efe7ea');
    for (var k = 0; k < 18; k++) {
      circ(g, -0.84 + (k * 0.13 % 0.26), -0.23 + (k * 0.17 % 0.46), 0.012, '#c4b5bb', true);
    }
    line(g, -0.71, -0.26, -0.71, 0.26, 0.01, '#9a9aa0');
    line(g, -0.86, 0, -0.56, 0, 0.01, '#9a9aa0');
  }

  function baler(g) {
    drawbar(g, -0.8, -0.5);
    wheel(g, -1.12, -0.38, 0.22, 0.08);
    wheel(g, -1.12, 0.38, 0.22, 0.08);
    rr(g, -0.88, -0.41, -0.78, 0.41, 0.03, '#f0c419');
    for (var y = -0.37; y <= 0.38; y += 0.06) line(g, -0.88, y, -0.84, y, 0.01, '#8a7310');
    rr(g, -1.52, -0.31, -0.84, 0.31, 0.12, '#2f8f3a');
    rr(g, -1.4, -0.2, -0.92, 0.2, 0.06, '#3fa84b', true);
    line(g, -1.5, -0.12, -0.9, -0.12, 0.03, '#f4f4f4');
    line(g, -1.5, 0.12, -0.9, 0.12, 0.03, '#f4f4f4');
  }

  function drill(g) {
    rr(g, -0.64, -0.06, -0.5, 0.06, 0.01, '#5a5b60');
    for (var y = -0.6; y <= 0.61; y += 0.12) circ(g, -1.0, y, 0.022, '#5f6066');
    rr(g, -0.96, -0.64, -0.62, 0.64, 0.05, '#2462b0');
    rr(g, -0.91, -0.59, -0.67, 0.59, 0.03, '#3b7fd0');
    line(g, -0.79, -0.59, -0.79, 0.59, 0.012, '#1d4f8f');
  }

  function sprayer(g) {
    rr(g, -0.58, -0.06, -0.48, 0.06, 0.01, '#5a5b60');
    rr(g, -1.03, -1.42, -0.97, 1.42, 0.02, '#f1c232');
    for (var y = -1.35; y <= 1.36; y += 0.15) circ(g, -1.0, y, 0.014, '#333', true);
    line(g, -0.6, -0.2, -0.99, -0.9, 0.02, '#c9a023');
    line(g, -0.6, 0.2, -0.99, 0.9, 0.02, '#c9a023');
    rr(g, -0.98, -0.27, -0.52, 0.27, 0.06, '#f1c232');
    rr(g, -0.95, -0.24, -0.55, 0.24, 0.1, '#f6f6f2');
    circ(g, -0.75, 0, 0.05, '#dcdcd6');
  }

  function mower(g) {
    line(g, -0.25, 0.25, -0.27, 0.55, 0.05, '#5a5b60');
    rr(g, -0.42, 0.5, -0.12, 1.16, 0.06, '#c62f2a');
    for (var y = 0.58; y < 1.1; y += 0.13) circ(g, -0.27, y, 0.045, '#d9dbe0');
    rr(g, -0.36, 0.53, -0.18, 1.13, 0.03, 'rgba(0,0,0,0.12)', true);
  }

  function combine(g, P, t) {
    wheel(g, 0.15, -0.43, 0.44, 0.18);
    wheel(g, 0.15, 0.43, 0.44, 0.18);
    wheel(g, -0.75, -0.32, 0.24, 0.1);
    wheel(g, -0.75, 0.32, 0.24, 0.1);
    rr(g, -1.06, -0.3, -0.97, 0.3, 0.02, '#55565b');
    rr(g, -1.0, -0.36, 0.35, 0.36, 0.08, P.body);
    rr(g, -0.95, -0.26, -0.72, 0.26, 0.03, P.dark);
    for (var x = -0.92; x < -0.74; x += 0.04) line(g, x, -0.22, x, 0.22, 0.012, '#1f1f22');
    rr(g, -0.5, -0.3, 0.12, 0.3, 0.05, P.dark);
    rr(g, -0.46, -0.26, 0.08, 0.26, 0.04, '#e3c45a');
    g.beginPath();
    g.ellipse(-0.19, 0, 0.18, 0.13, 0, 0, TWO_PI);
    g.fillStyle = '#efd47c';
    g.fill();
    // tömningsröret, infällt längs vänster sida
    rr(g, -0.9, -0.47, 0.05, -0.4, 0.03, '#8b8f94');
    // inmatning, hytt och skärbord
    rr(g, 0.3, -0.17, 0.72, 0.17, 0.03, P.dark);
    rr(g, 0.17, -0.21, 0.5, 0.21, 0.05, '#a3d3ea');
    rr(g, 0.2, -0.18, 0.47, 0.18, 0.04, P.roof);
    circ(g, 0.25, -0.13, 0.025, '#ff9f1a');
    rr(g, 0.68, -0.99, 0.92, 0.99, 0.03, P.header);
    line(g, 0.93, -0.97, 0.93, 0.97, 0.025, '#4a4b50');
    rr(g, 0.86, -1.01, 1.0, -0.94, 0.03, P.dark);
    rr(g, 0.86, 0.94, 1.0, 1.01, 0.03, P.dark);
    // haspel: latorna vandrar bakåt när t ökar
    for (var k = 0; k < 5; k++) {
      var f = (k / 5 + t) % 1;
      line(g, 0.9 - f * 0.2, -0.93, 0.9 - f * 0.2, 0.93, 0.022, P.reel);
    }
    rr(g, 0.7, -0.03, 0.9, 0.03, 0.01, '#4a4b50');
    rr(g, 0.7, -0.93, 0.9, -0.88, 0.01, '#4a4b50');
    rr(g, 0.7, 0.88, 0.9, 0.93, 0.01, '#4a4b50');
  }

  // ---------------------------------------------------------------- spår
  // Ritas i redskapets koordinater: x i [-len, 0] bakåt, y i sidled.
  function band(g, len, hw, color) {
    g.fillStyle = color;
    g.fillRect(-len - 0.01, -hw, len + 0.02, hw * 2);
  }

  function stripes(g, len, hw, color, spacing, w) {
    g.fillStyle = color;
    for (var y = -hw + spacing / 2; y < hw; y += spacing) {
      g.fillRect(-len - 0.01, y - w / 2, len + 0.02, w);
    }
  }

  function soil(g, len, hw) { band(g, len, hw, '#c2a382'); stripes(g, len, hw, '#a9896a', 0.1, 0.025); }
  function furrows(g, len, hw) { band(g, len, hw, '#8f6f4f'); stripes(g, len, hw, '#6c5037', 0.15, 0.05); }
  function seeded(g, len, hw) { band(g, len, hw, '#c6a780'); stripes(g, len, hw, '#6aa84f', 0.12, 0.022); }
  function sprayed(g, len, hw) { band(g, len, hw, '#d9eef5'); }
  function stubble(g, len, hw) { band(g, len, hw, '#eedfae'); stripes(g, len, hw, '#d8c07a', 0.06, 0.012); }
  function pickedUp(g, len, hw) { band(g, len, hw, '#dcebb4'); stripes(g, len, hw, '#c3d991', 0.08, 0.015); }
  function grass(g, len, hw) {
    band(g, len, hw, '#c8e09a');
    g.fillStyle = '#86b155';
    g.fillRect(-len - 0.01, -0.09, len + 0.02, 0.18);
  }
  function track(g, len, hw) { band(g, len, hw * 0.6, '#f0ece4'); }

  // ---------------------------------------------------------------- fordonstyper
  var TRACTOR_PALS = [
    { body: '#3a7f2c', dark: '#255a1c', roof: '#f2f2ee' },
    { body: '#c9252c', dark: '#8f161c', roof: '#ececec' },
    { body: '#1f5fa8', dark: '#143f72', roof: '#f0f3f7' },
    { body: '#e86a1c', dark: '#a8470f', roof: '#f4f4f0' }
  ];
  var COMBINE_PALS = [
    { body: '#3a7f2c', dark: '#255a1c', roof: '#f2f2ee', header: '#3a7f2c', reel: '#f2c200' },
    { body: '#b5c42a', dark: '#7f8a17', roof: '#f4f4f0', header: '#c9cdd2', reel: '#d42a2a' },
    { body: '#c0262c', dark: '#861a1e', roof: '#f0f0f0', header: '#c0262c', reel: '#e9e9e9' }
  ];
  var TRACTOR_TRACKS = [[-0.2, -0.27, 0.07], [-0.2, 0.27, 0.07]];

  function withTractor(tool) {
    return function (g, P) { if (tool) tool(g); tractor(g, P); };
  }

  // front/back/half: utbredning i traktorlängder. body: halva bredden som
  // räknas vid köer. trail: spår {x, y, w, stamp}. bales: släpper rundbalar.
  // emit: partiklar ('grain', 'mist', 'chaff').
  var TYPES = [
    { name: 'Traktor', front: 0.58, back: 0.6, half: 0.37, body: 0.37, speed: 1.3, weight: 2,
      draw: withTractor(null) },
    { name: 'Traktor med vagn', front: 0.58, back: 1.63, half: 0.4, body: 0.4, speed: 1.1, weight: 2,
      draw: withTractor(trailer) },
    { name: 'Harv', front: 0.58, back: 1.05, half: 0.63, body: 0.45, speed: 1.0, weight: 2,
      draw: withTractor(harrow), trail: { x: -1.04, y: 0, w: 1.24, stamp: soil } },
    { name: 'Plog', front: 0.58, back: 1.3, half: 0.75, body: 0.4, speed: 0.85, weight: 2,
      draw: withTractor(plough), trail: { x: -1.2, y: 0.32, w: 0.76, stamp: furrows } },
    { name: 'Gödselspridare', front: 0.58, back: 1.02, half: 0.37, body: 0.37, speed: 1.15, weight: 2,
      draw: withTractor(spreader), emit: 'grain' },
    { name: 'Rundbalspress', front: 0.58, back: 1.53, half: 0.42, body: 0.42, speed: 0.95, weight: 2,
      draw: withTractor(baler), trail: { x: -0.86, y: 0, w: 0.8, stamp: pickedUp }, bales: true },
    { name: 'Såmaskin', front: 0.58, back: 1.02, half: 0.65, body: 0.45, speed: 1.0, weight: 2,
      draw: withTractor(drill), trail: { x: -1.02, y: 0, w: 1.26, stamp: seeded } },
    { name: 'Lantbruksspruta', front: 0.58, back: 1.04, half: 1.43, body: 0.4, speed: 1.15, weight: 1,
      draw: withTractor(sprayer), trail: { x: -1.0, y: 0, w: 2.84, stamp: sprayed }, emit: 'mist' },
    { name: 'Slåttermaskin', front: 0.58, back: 0.6, half: 1.18, body: 0.4, speed: 1.1, weight: 1,
      draw: withTractor(mower), trail: { x: -0.27, y: 0.83, w: 0.66, stamp: grass } },
    { name: 'Skördetröska', front: 1.02, back: 1.08, half: 1.02, body: 1.0, speed: 0.65, weight: 2,
      draw: combine, pals: COMBINE_PALS, frames: 4,
      trail: { x: -1.06, y: 0, w: 2.0, stamp: stubble }, emit: 'chaff',
      tracks: [[0.15, -0.43, 0.09], [0.15, 0.43, 0.09], [-0.75, -0.32, 0.05], [-0.75, 0.32, 0.05]],
      exhaust: [-0.62, 0.22] }
  ];
  var WEIGHT_SUM = 0;
  for (var ti = 0; ti < TYPES.length; ti++) {
    var T0 = TYPES[ti];
    WEIGHT_SUM += T0.weight;
    T0.pals = T0.pals || TRACTOR_PALS;
    T0.frames = T0.frames || 1;
    T0.tracks = T0.tracks || TRACTOR_TRACKS;
    T0.exhaust = T0.exhaust || [0.12, -0.065];
    // minsta svängradie, i traktorlängder
    T0.radius = Math.max(0.6, T0.trail ? T0.trail.w / 2 : 0.6);
  }

  // sprites[type][pal] = {img, cw, ch, ax, ay}
  var sprites = [];

  function buildSprites() {
    sprites = [];
    for (var t = 0; t < TYPES.length; t++) {
      var T = TYPES[t];
      var cw = Math.ceil((T.front + T.back + 0.1) * L), ch = Math.ceil((T.half * 2 + 0.1) * L);
      var ax = (T.back + 0.05) * L, ay = ch / 2;
      var list = [];
      for (var p = 0; p < T.pals.length; p++) {
        var img = document.createElement('canvas');
        img.width = cw * T.frames;
        img.height = ch;
        var g = img.getContext('2d');
        for (var f = 0; f < T.frames; f++) {
          g.setTransform(L, 0, 0, L, f * cw + ax, ay);
          g.lineJoin = 'round';
          g.lineCap = 'round';
          g.strokeStyle = OUTLINE;
          g.lineWidth = OL;
          T.draw(g, T.pals[p], f / T.frames / 5);
        }
        list.push({ img: img, cw: cw, ch: ch, ax: ax, ay: ay });
      }
      sprites.push(list);
    }

    var r = Math.ceil(0.25 * L);
    baleSprite = document.createElement('canvas');
    baleSprite.width = baleSprite.height = r * 2 + 4;
    var b = baleSprite.getContext('2d');
    b.setTransform(L, 0, 0, L, r + 2, r + 2);
    b.strokeStyle = OUTLINE;
    b.lineWidth = OL;
    circ(b, 0.025, 0.025, 0.21, 'rgba(0,0,0,0.15)', true);
    circ(b, 0, 0, 0.21, '#e2c165');
    b.strokeStyle = '#b8954a';
    b.lineWidth = 0.014;
    for (var k = 1; k <= 3; k++) {
      b.beginPath();
      b.arc(0, 0, 0.05 * k, k, k + 4.5);
      b.stroke();
    }
  }

  // ---------------------------------------------------------------- hjälp
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  function pickType() {
    var r = Math.random() * WEIGHT_SUM;
    for (var t = 0; t < TYPES.length; t++) {
      r -= TYPES[t].weight;
      if (r < 0) return t;
    }
    return 0;
  }

  function wrapAngle(a) {
    if (a > Math.PI) a -= TWO_PI; else if (a < -Math.PI) a += TWO_PI;
    return a;
  }

  function initVehicle(i) {
    type[i] = pickType();
    pal[i] = (Math.random() * TYPES[type[i]].pals.length) | 0;
    spd[i] = rand(0.85, 1.15);
    curve[i] = curveGoal[i] = 0;
    curveT[i] = rand(1, 3);
    stay[i] = rand(20, 60);
    wait[i] = 0;
    patience[i] = rand(1, 5);
    blocker[i] = -1;
    ghost[i] = 0;
    dist[i] = rand(0, 2) * L;
    puff[i] = Math.random() * 0.3;
    anim[i] = Math.random();
  }

  // Nytt fordon kör in från en kant, där det är som glesast.
  function spawnAtEdge(i) {
    initVehicle(i);
    var T = TYPES[type[i]];
    var out = (T.front + 0.05) * L;
    var best = -1;
    for (var k = 0; k < 8; k++) {
      var p = Math.random() * 2 * (W + H), x, y, h;
      if (p < W) { x = p; y = -out; h = Math.PI / 2; }
      else if (p < W + H) { x = W + out; y = p - W; h = Math.PI; }
      else if (p < 2 * W + H) { x = p - W - H; y = H + out; h = -Math.PI / 2; }
      else { x = -out; y = p - 2 * W - H; h = 0; }
      var d = Infinity;
      for (var j = 0; j < count; j++) {
        if (j !== i) d = Math.min(d, Math.abs(px[j] - x) + Math.abs(py[j] - y));
      }
      if (d > best) { best = d; px[i] = x; py[i] = y; head[i] = h; }
    }
    head[i] = wrapAngle(head[i] + rand(-0.6, 0.6));
    cur[i] = BASE_SPEED * scale * settings.speed * T.speed * spd[i];
  }

  function setCount(n) {
    n = Math.max(0, Math.min(MAX, n | 0));
    for (var i = count; i < n; i++) spawnAtEdge(i);
    count = n;
  }

  function scatter() {
    for (var i = 0; i < count; i++) {
      spawnAtEdge(i);
      px[i] = rand(0.1, 0.9) * W;
      py[i] = rand(0.1, 0.9) * H;
      head[i] = rand(-Math.PI, Math.PI);
    }
  }

  function emit(kind, col, x, y, vx, vy, life, size) {
    if (pcount >= MAXP) return;
    var p = pcount++;
    ptx[p] = x; pty[p] = y; pvx[p] = vx; pvy[p] = vy;
    plife[p] = 0; pmax[p] = life; psize[p] = size;
    pkind[p] = kind; pcol[p] = col;
  }

  function dropBale(x, y) {
    bx[bnext] = x;
    by[bnext] = y;
    bage[bnext] = 0;
    bnext = (bnext + 1) % MAXB;
    if (bcount < MAXB) bcount++;
  }

  // Vem står i vägen framför fordonet? -1 om ingen.
  function blocked(i) {
    var T = TYPES[type[i]];
    var c = Math.cos(head[i]), s = Math.sin(head[i]);
    for (var j = 0; j < count; j++) {
      if (j === i) continue;
      var U = TYPES[type[j]];
      var dx = px[j] - px[i], dy = py[j] - py[i];
      var along = dx * c + dy * s;
      if (along <= 0) continue;
      var lat = Math.abs(dy * c - dx * s);
      if (along < (T.front + U.back + 0.25) * L && lat < (T.body + U.body) * L) return j;
    }
    return -1;
  }

  // ---------------------------------------------------------------- uppdatering
  function stamp(i, lx, ly, len, w, fn) {
    var c = Math.cos(head[i]), s = Math.sin(head[i]);
    tctx.setTransform(c * L, s * L, -s * L, c * L,
      px[i] + (lx * c - ly * s) * L, py[i] + (lx * s + ly * c) * L);
    fn(tctx, len, w / 2);
  }

  function world(i, lx, ly, out) {
    var c = Math.cos(head[i]), s = Math.sin(head[i]);
    out[0] = px[i] + (lx * c - ly * s) * L;
    out[1] = py[i] + (lx * s + ly * c) * L;
  }
  var tmp = [0, 0];

  function update(dt) {
    var v0 = BASE_SPEED * scale * settings.speed * Math.sqrt(settings.size);

    for (var i = 0; i < count; i++) {
      var T = TYPES[type[i]];
      var v = v0 * T.speed * spd[i];

      // Köa bakom den som står i vägen. Varje fordon har sitt eget, slumpade
      // tålamod: den vars tålamod tar slut först kör, och de som väntar på
      // just det fordonet börjar om sin väntan, så att de släpper fram det.
      if (ghost[i] > 0) ghost[i] -= dt;
      blocker[i] = ghost[i] > 0 ? -1 : blocked(i);
      if (blocker[i] >= 0) {
        wait[i] += dt;
        if (wait[i] > patience[i]) {
          ghost[i] = 4;
          wait[i] = 0;
          patience[i] = rand(1, 5);
          blocker[i] = -1;
          for (var q = 0; q < count; q++) {
            if (blocker[q] === i) { wait[q] = 0; patience[q] = rand(1, 5); }
          }
        }
        cur[i] = Math.max(0, cur[i] - v * 3 * dt);
      } else {
        wait[i] = 0;
        cur[i] = Math.min(v, cur[i] + v * 1.5 * dt);
      }
      var step = cur[i] * dt;

      // Slumpvisa rattutslag: ibland rakt fram, ibland en mjuk sväng.
      var rmin = T.radius * L;
      curveT[i] -= dt;
      if (curveT[i] <= 0) {
        curveGoal[i] = Math.random() < 0.5 ? 0
          : (Math.random() < 0.5 ? -1 : 1) * rand(0.1, 0.6) / rmin;
        curveT[i] = curveGoal[i] ? rand(1, 3) : rand(2, 6);
      }
      // Så länge fordonet ska stanna kvar styr det tillbaka in mot fältet
      // när det närmar sig kanten; sedan får det köra iväg.
      stay[i] -= dt;
      var m = (T.front + 2 * T.radius) * L;
      if (stay[i] > 0 && (px[i] < m || px[i] > W - m || py[i] < m || py[i] > H - m)) {
        var d = wrapAngle(Math.atan2(H / 2 - py[i], W / 2 - px[i]) - head[i]);
        if (Math.abs(d) > 0.5) curveGoal[i] = (d > 0 ? 1 : -1) / rmin;
      } else if (stay[i] <= 0) {
        // helt utanför bild: kört iväg, ett nytt fordon kommer in
        var gone = (T.front + T.back + 0.2) * L;
        if (px[i] < -gone || px[i] > W + gone || py[i] < -gone || py[i] > H + gone) {
          spawnAtEdge(i);
          continue;
        }
      }
      curve[i] += (curveGoal[i] - curve[i]) * Math.min(1, 2 * dt);
      head[i] = wrapAngle(head[i] + curve[i] * step);

      var c = Math.cos(head[i]), s = Math.sin(head[i]);
      px[i] += c * step;
      py[i] += s * step;

      // spår: hjulspår först, redskapet ovanpå
      // ytterkanten i en sväng rör sig längre än mitten
      var len = step / L * (1 + Math.abs(curve[i]) * T.half * L) + 0.002;
      if (step > 0) {
        for (var k = 0; k < T.tracks.length; k++) {
          var tr = T.tracks[k];
          stamp(i, tr[0], tr[1], len, tr[2] * 2, track);
        }
        if (T.trail) stamp(i, T.trail.x, T.trail.y, len, T.trail.w, T.trail.stamp);
        if (T.frames > 1) anim[i] = (anim[i] + step / L * 0.8) % 1;
      }

      // rundbalar
      if (T.bales) {
        dist[i] += step;
        if (dist[i] > 3.2 * L) {
          dist[i] = 0;
          world(i, -1.72, 0, tmp);
          dropBale(tmp[0], tmp[1]);
        }
      }

      // partiklar
      var moving = cur[i] > v * 0.3;
      if (T.emit === 'grain' && moving) {
        var n = (140 * dt + Math.random()) | 0;
        for (k = 0; k < n; k++) {
          var side = k & 1 ? 1 : -1;
          world(i, -0.95, 0.13 * side, tmp);
          var a = head[i] + Math.PI - side * rand(0.05, 1.6);
          var life = rand(0.3, 0.55), d = rand(0.15, 1.35) * L;
          emit(GRAIN, 1, tmp[0], tmp[1], Math.cos(a) * d / life, Math.sin(a) * d / life, life, 0.035 * L);
        }
      } else if (T.emit === 'chaff' && moving) {
        n = (60 * dt + Math.random()) | 0;
        for (k = 0; k < n; k++) {
          world(i, -1.08, rand(-0.3, 0.3), tmp);
          a = head[i] + Math.PI + rand(-0.6, 0.6);
          life = rand(0.3, 0.5); d = rand(0.2, 0.8) * L;
          emit(GRAIN, 2, tmp[0], tmp[1], Math.cos(a) * d / life, Math.sin(a) * d / life, life, 0.03 * L);
        }
      } else if (T.emit === 'mist' && moving) {
        n = (90 * dt + Math.random()) | 0;
        for (k = 0; k < n; k++) {
          world(i, -1.02, rand(-1.4, 1.4), tmp);
          emit(MIST, 3, tmp[0], tmp[1], -c * 0.3 * L + rand(-8, 8) * scale,
            -s * 0.3 * L + rand(-8, 8) * scale, rand(0.3, 0.6), 0.05 * L);
        }
      }
      puff[i] -= dt;
      if (puff[i] <= 0) {
        puff[i] = rand(0.2, 0.4);
        world(i, T.exhaust[0], T.exhaust[1], tmp);
        emit(SMOKE, 0, tmp[0], tmp[1], rand(4, 12) * scale, rand(-14, -6) * scale, rand(1.0, 1.6), 0.05 * L);
      }
    }

    updateParticles(dt);
    for (var b = 0; b < bcount; b++) bage[b] += dt;

    fadeT += dt;
    if (fadeT >= FADE_EVERY) {
      fadeT = 0;
      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.globalAlpha = FADE_ALPHA;
      tctx.fillStyle = '#fff';
      tctx.fillRect(0, 0, W, H);
      tctx.globalAlpha = 1;
      // Att blanda in vitt räcker inte hela vägen: med 8 bitar per färg
      // fastnar svaga spår strax under vitt. Lägg därför också till ett
      // litet konstant tillskott, så att allt till slut blir helt vitt.
      tctx.globalCompositeOperation = 'lighter';
      tctx.fillStyle = 'rgb(1,1,1)';
      tctx.fillRect(0, 0, W, H);
      tctx.globalCompositeOperation = 'source-over';
    }
  }

  function updateParticles(dt) {
    var p = 0;
    while (p < pcount) {
      plife[p] += dt;
      if (plife[p] >= pmax[p]) {
        // gödselkorn och agnar landar och blir kvar på spår-lagret
        if (pkind[p] === GRAIN) {
          tctx.setTransform(1, 0, 0, 1, 0, 0);
          tctx.fillStyle = PCOLORS[pcol[p]];
          var sz = psize[p];
          tctx.fillRect(ptx[p] - sz / 2, pty[p] - sz / 2, sz, sz);
        }
        var q = --pcount;
        ptx[p] = ptx[q]; pty[p] = pty[q]; pvx[p] = pvx[q]; pvy[p] = pvy[q];
        plife[p] = plife[q]; pmax[p] = pmax[q]; psize[p] = psize[q];
        pkind[p] = pkind[q]; pcol[p] = pcol[q];
        continue;
      }
      ptx[p] += pvx[p] * dt;
      pty[p] += pvy[p] * dt;
      p++;
    }
  }

  // ---------------------------------------------------------------- ritning
  function draw(ctx) {
    ctx.drawImage(trail, 0, 0);

    var bs = baleSprite.width / 2;
    for (var b = 0; b < bcount; b++) {
      var left = BALE_LIFE - bage[b];
      if (left <= 0) continue;
      ctx.globalAlpha = left < 8 ? left / 8 : 1;
      ctx.drawImage(baleSprite, bx[b] - bs, by[b] - bs);
    }
    ctx.globalAlpha = 1;

    for (var i = 0; i < count; i++) {
      var T = TYPES[type[i]];
      var sp = sprites[type[i]][pal[i]];
      var f = T.frames > 1 ? (anim[i] * T.frames) | 0 : 0;
      var c = Math.cos(head[i]), s = Math.sin(head[i]);
      ctx.setTransform(c, s, -s, c, px[i], py[i]);
      ctx.drawImage(sp.img, f * sp.cw, 0, sp.cw, sp.ch, -sp.ax, -sp.ay, sp.cw, sp.ch);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    for (var p = 0; p < pcount; p++) {
      var k = pkind[p], sz = psize[p];
      if (k === SMOKE) {
        var u = plife[p] / pmax[p];
        ctx.globalAlpha = 0.35 * (1 - u);
        ctx.fillStyle = PCOLORS[0];
        ctx.beginPath();
        ctx.arc(ptx[p], pty[p], sz * (1 + u * 2.5), 0, TWO_PI);
        ctx.fill();
      } else {
        ctx.globalAlpha = k === MIST ? 0.5 * (1 - plife[p] / pmax[p]) : 1;
        ctx.fillStyle = PCOLORS[pcol[p]];
        ctx.fillRect(ptx[p] - sz / 2, pty[p] - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- motor
  function layout(world, s) {
    var resized = world.W !== W || world.H !== H || !trail;
    W = world.W;
    H = world.H;
    scale = world.scale;
    settings = s;
    L = BASE_L * scale * settings.size;
    buildSprites();
    if (resized) {
      trail = document.createElement('canvas');
      trail.width = W;
      trail.height = H;
      tctx = trail.getContext('2d', { alpha: false });
      tctx.fillStyle = '#fff';
      tctx.fillRect(0, 0, W, H);
      bcount = 0;
      pcount = 0;
      for (var i = 0; i < count; i++) {
        if (px[i] > W + 3 * L || py[i] > H + 3 * L) spawnAtEdge(i);
      }
    }
  }

  window.Projector.register({
    id: 'farm',
    label: 'Jordbruk',
    unit: 'fordon',
    background: '#fff',
    defaults: { count: 6, speed: 1, size: 1 },
    limits: { count: [0, MAX], speed: [0.2, 3], size: [0.5, 2.5] },
    layout: layout,
    setCount: setCount,
    scatter: scatter,
    update: update,
    draw: draw,
    release: function () {
      sprites = [];
      trail = tctx = baleSprite = null;
      pcount = bcount = 0;
    }
  });
})();
