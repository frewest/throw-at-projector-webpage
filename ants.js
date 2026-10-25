/*
 * Läge "Myror" – realtidsgenererade myror på vit bakgrund.
 *
 * All myrdata ligger i förallokerade typade arrayer (struct-of-arrays) och
 * huvudloopen allokerar ingenting. Myrorna ritas från en förrenderad
 * sprite-atlas (rotationer x benfaser) så att varje myra kostar ett enda
 * drawImage-anrop, vilket håller Chromecastens svaga GPU nöjd.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- konstanter
  var MAX_ANTS = 2000;
  var ROTATIONS = 64;          // förrenderade riktningar
  var FRAMES = 6;              // benfaser per gångcykel
  var BASE_LENGTH = 18;        // myrlängd i px vid size=1 och 1080 px kortsida
  var BASE_SPEED = 70;         // px/s vid speed=1 och 1080 px kortsida
  var TWO_PI = Math.PI * 2;

  // ---------------------------------------------------------------- myrdata
  var px = new Float32Array(MAX_ANTS);     // position
  var py = new Float32Array(MAX_ANTS);
  var dir = new Float32Array(MAX_ANTS);    // riktning (radianer)
  var turn = new Float32Array(MAX_ANTS);   // vinkelhastighet (rad/s)
  var goal = new Float32Array(MAX_ANTS);   // ungefärlig färdriktning över skärmen
  var spd = new Float32Array(MAX_ANTS);    // individuell hastighetsfaktor
  var phase = new Float32Array(MAX_ANTS);  // gångcykel 0..1
  var pause = new Float32Array(MAX_ANTS);  // sekunder kvar av stillastående
  var count = 0;

  // ---------------------------------------------------------------- värld
  var W = 1920, H = 1080;     // canvasens pixelstorlek (= världens koordinater)
  var scale = 1;              // världsskala relativt 1080 px kortsida
  var settings = null;        // {count, speed, size} från motorn
  var antLen = BASE_LENGTH;   // aktuell myrlängd i px
  var margin = 20;            // hur långt utanför kanten en myra får gå

  // sprite-atlas
  var atlas = null, cell = 32, half = 16;

  // ---------------------------------------------------------------- hjälp
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  // ---------------------------------------------------------------- sprites
  // Ritar en myra uppifrån med nosen åt +x, centrerad i origo.
  // t = gångfas 0..1. Tripodgång: fram+bak på ena sidan går i takt med
  // mittbenet på andra sidan.
  function drawAntShape(g, L, t) {
    var s = Math.sin(t * TWO_PI);
    var lw = Math.max(0.6, L * 0.045);

    g.strokeStyle = '#111';
    g.fillStyle = '#111';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = lw;

    // Ben: [fäste x, knä-x, knä-y, fot-x, fot-y] i enheter av L (höger sida,
    // y > 0; vänster sida speglas).
    var legs = [
      [0.10, 0.22, 0.20, 0.36, 0.34],   // framben
      [0.03, 0.02, 0.26, 0.00, 0.42],   // mittben
      [-0.04, -0.16, 0.22, -0.34, 0.38] // bakben
    ];
    var swing = 0.11;
    for (var side = -1; side <= 1; side += 2) {
      for (var i = 0; i < 3; i++) {
        var leg = legs[i];
        // grupp A: fram/bak höger + mitt vänster; grupp B: resten
        var groupA = (i !== 1) === (side === 1);
        var off = (groupA ? s : -s) * swing;
        g.beginPath();
        g.moveTo(leg[0] * L, 0);
        g.lineTo((leg[1] + off * 0.5) * L, side * leg[2] * L);
        g.lineTo((leg[3] + off) * L, side * leg[4] * L);
        g.stroke();
      }
    }

    // Antenner
    g.lineWidth = lw * 0.8;
    var a = Math.sin(t * TWO_PI * 2) * 0.03;
    for (side = -1; side <= 1; side += 2) {
      g.beginPath();
      g.moveTo(0.36 * L, side * 0.03 * L);
      g.lineTo(0.46 * L, side * (0.10 + a) * L);
      g.lineTo(0.56 * L, side * (0.16 - a) * L);
      g.stroke();
    }

    // Kropp: bakkropp (gaster), midja, mellankropp (thorax), huvud
    g.beginPath();
    g.ellipse(-0.25 * L, 0, 0.22 * L, 0.15 * L, 0, 0, TWO_PI);
    g.fill();
    g.beginPath();
    g.ellipse(-0.05 * L, 0, 0.05 * L, 0.04 * L, 0, 0, TWO_PI);
    g.fill();
    g.beginPath();
    g.ellipse(0.07 * L, 0, 0.12 * L, 0.06 * L, 0, 0, TWO_PI);
    g.fill();
    g.beginPath();
    g.ellipse(0.29 * L, 0, 0.09 * L, 0.08 * L, 0, 0, TWO_PI);
    g.fill();
  }

  function buildAtlas() {
    cell = Math.ceil(antLen * 1.25) + 4;
    half = cell / 2;
    var c = document.createElement('canvas');
    c.width = cell * FRAMES;
    c.height = cell * ROTATIONS;
    var g = c.getContext('2d');
    for (var r = 0; r < ROTATIONS; r++) {
      var ang = r / ROTATIONS * TWO_PI;
      for (var f = 0; f < FRAMES; f++) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.translate(f * cell + half, r * cell + half);
        g.rotate(ang);
        drawAntShape(g, antLen, f / FRAMES);
      }
    }
    atlas = c;
  }

  // ---------------------------------------------------------------- myror
  function initAnt(i, x, y, a) {
    px[i] = x;
    py[i] = y;
    dir[i] = a;
    goal[i] = a;
    turn[i] = 0;
    spd[i] = rand(0.7, 1.3);
    phase[i] = Math.random();
    pause[i] = 0;
  }

  // Ny myra in från en kant, på väg in över skärmen.
  function spawnAtEdge(i) {
    var m = margin * 0.9;
    var perim = 2 * (W + H);
    var p = Math.random() * perim;
    var x, y, base;
    if (p < W) { x = p; y = -m; base = Math.PI / 2; }
    else if (p < W + H) { x = W + m; y = p - W; base = Math.PI; }
    else if (p < 2 * W + H) { x = p - W - H; y = H + m; base = -Math.PI / 2; }
    else { x = -m; y = p - 2 * W - H; base = 0; }
    initAnt(i, x, y, base + rand(-1.1, 1.1));
  }

  function setCount(n) {
    n = Math.max(0, Math.min(MAX_ANTS, n | 0));
    for (var i = count; i < n; i++) spawnAtEdge(i);
    count = n;
  }

  function scatter() {
    for (var i = 0; i < count; i++) {
      initAnt(i, Math.random() * W, Math.random() * H, Math.random() * TWO_PI);
    }
  }

  function update(dt) {
    var v0 = BASE_SPEED * scale * settings.speed;
    var stride = antLen * 0.55;  // sträcka per gångcykel

    for (var i = 0; i < count; i++) {
      // Korta pauser gör rörelsen mer myrlik.
      if (pause[i] > 0) {
        pause[i] -= dt;
        continue;
      }
      if (Math.random() < 0.04 * dt) pause[i] = rand(0.2, 1.2);

      // Random walk: brus på vinkelhastigheten, med dämpning.
      var t = turn[i] + (Math.random() - 0.5) * 30 * dt;
      t *= 1 - 2.5 * dt;
      if (t > 4) t = 4; else if (t < -4) t = -4;
      turn[i] = t;

      // Svag dragning mot färdriktningen, så att myrorna passerar över
      // skärmen i stället för att vandra runt på samma ställe.
      var a = dir[i];
      var dg = goal[i] - a;
      if (dg > Math.PI) dg -= TWO_PI; else if (dg < -Math.PI) dg += TWO_PI;
      a += (t + dg * 0.3) * dt;
      if (a > Math.PI) a -= TWO_PI; else if (a < -Math.PI) a += TWO_PI;
      dir[i] = a;

      var step = v0 * spd[i] * dt;
      var nx = px[i] + Math.cos(a) * step;
      var ny = py[i] + Math.sin(a) * step;
      px[i] = nx;
      py[i] = ny;

      var ph = phase[i] + step / stride;
      phase[i] = ph - (ph | 0);

      // Utanför kanten: myran har passerat, en ny kommer in någon annanstans.
      if (nx < -margin || ny < -margin || nx > W + margin || ny > H + margin) {
        spawnAtEdge(i);
      }
    }
  }

  function draw(ctx) {
    ctx.imageSmoothingEnabled = true;
    var rotK = ROTATIONS / TWO_PI;
    for (var i = 0; i < count; i++) {
      var r = Math.round(dir[i] * rotK) % ROTATIONS;
      if (r < 0) r += ROTATIONS;
      var f = (phase[i] * FRAMES) | 0;
      ctx.drawImage(atlas, f * cell, r * cell, cell, cell,
        px[i] - half, py[i] - half, cell, cell);
    }
  }

  // ---------------------------------------------------------------- motor
  function layout(world, s) {
    var resized = world.W !== W || world.H !== H;
    W = world.W;
    H = world.H;
    scale = world.scale;
    settings = s;
    antLen = BASE_LENGTH * settings.size * scale;
    margin = antLen;
    buildAtlas();
    if (resized) {
      // håll kvar myrorna inom den nya ytan
      for (var i = 0; i < count; i++) {
        if (px[i] > W + margin || py[i] > H + margin) spawnAtEdge(i);
      }
    }
  }

  window.Projector.register({
    id: 'ants',
    label: 'Myror',
    unit: 'myror',
    background: '#fff',
    defaults: { count: 300, speed: 1, size: 1 },
    limits: { count: [0, MAX_ANTS], speed: [0.05, 5], size: [0.3, 4] },
    layout: layout,
    setCount: setCount,
    scatter: scatter,
    update: update,
    draw: draw,
    release: function () { atlas = null; }
  });
})();
