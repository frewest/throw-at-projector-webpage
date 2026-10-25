/*
 * throw-at-projector – realtidsgenererade myror på vit bakgrund.
 *
 * All myrdata ligger i förallokerade typade arrayer (struct-of-arrays) och
 * huvudloopen allokerar ingenting. Myrorna ritas från en förrenderad
 * sprite-atlas (rotationer x benfaser) så att varje myra kostar ett enda
 * drawImage-anrop, vilket håller Chromecastens svaga GPU nöjd.
 *
 * Publikt API: window.Ants.apply({ants, speed, size, debug})
 *              window.Ants.getState()
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- konstanter
  var MAX_ANTS = 2000;
  var ROTATIONS = 64;          // förrenderade riktningar
  var FRAMES = 6;              // benfaser per gångcykel
  var BASE_LENGTH = 18;        // myrlängd i px vid size=1 och 1080 px kortsida
  var BASE_SPEED = 70;         // px/s vid speed=1 och 1080 px kortsida
  var MAX_W = 1920, MAX_H = 1080;
  var TWO_PI = Math.PI * 2;

  var LIMITS = {
    ants: [0, MAX_ANTS],
    speed: [0.05, 5],
    size: [0.3, 4]
  };

  // ---------------------------------------------------------------- inställningar
  var settings = {
    ants: 300,
    speed: 1,
    size: 1,
    debug: false     // fps-räknare
  };

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
  var canvas, ctx;
  var W = MAX_W, H = MAX_H;   // canvasens pixelstorlek (= världens koordinater)
  var scale = 1;              // världsskala relativt 1080 px kortsida
  var antLen = BASE_LENGTH;   // aktuell myrlängd i px
  var margin = 20;            // hur långt utanför kanten en myra får gå

  // sprite-atlas
  var atlas = null, cell = 32, half = 16;

  var urlRes = 0;  // valfri upplösningsskala via ?res= (0..1)

  // ---------------------------------------------------------------- hjälp
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  function parseBool(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    v = String(v).toLowerCase();
    return v === '1' || v === 'true' || v === 'on' || v === 'yes' || v === '';
  }

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
    n = clamp(n | 0, 0, MAX_ANTS);
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

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

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

  // ---------------------------------------------------------------- fps / hud
  var hud = null, fpsFrames = 0, fpsTime = 0, fps = 0;

  function updateHud(dt) {
    fpsFrames++;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
      fps = fpsFrames / fpsTime;
      fpsFrames = 0;
      fpsTime = 0;
      if (hud) {
        hud.textContent = fps.toFixed(0) + ' fps · ' + count + ' myror · ' +
          W + 'x' + H + ' · speed ' + settings.speed.toFixed(2) +
          ' · size ' + settings.size.toFixed(2);
      }
    }
  }

  // ---------------------------------------------------------------- loop
  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    if (dt > 0.1) dt = 0.1;  // efter flikbyte o.d.

    update(dt);
    draw();
    if (settings.debug) updateHud(dt);
  }

  // ---------------------------------------------------------------- storlek
  function resize() {
    var cw = window.innerWidth || MAX_W;
    var ch = window.innerHeight || MAX_H;
    // Rendera så skarpt som möjligt men aldrig mer än 1920x1080 (eller
    // 1080x1920 i stående läge). ?res=0.75 ger 75 % av det.
    var long = Math.max(cw, ch), short = Math.min(cw, ch);
    var k = Math.min(MAX_W / long, MAX_H / short);
    if (urlRes > 0) k *= urlRes;
    var nw = Math.max(1, Math.round(cw * k));
    var nh = Math.max(1, Math.round(ch * k));
    var changed = nw !== W || nh !== H;
    W = nw;
    H = nh;
    canvas.width = W;
    canvas.height = H;
    scale = Math.min(W, H) / 1080;
    rebuild();
    return changed;
  }

  function rebuild() {
    antLen = BASE_LENGTH * settings.size * scale;
    margin = antLen;
    buildAtlas();
  }

  // ---------------------------------------------------------------- API
  function apply(cfg) {
    if (!cfg || typeof cfg !== 'object') return getState();
    var rebuildNeeded = false;
    if (cfg.speed != null && isFinite(+cfg.speed)) {
      settings.speed = clamp(+cfg.speed, LIMITS.speed[0], LIMITS.speed[1]);
    }
    if (cfg.size != null && isFinite(+cfg.size)) {
      var s = clamp(+cfg.size, LIMITS.size[0], LIMITS.size[1]);
      if (s !== settings.size) { settings.size = s; rebuildNeeded = true; }
    }
    if (cfg.debug != null) {
      settings.debug = parseBool(cfg.debug);
      if (hud) hud.style.display = settings.debug ? 'block' : 'none';
    }
    if (rebuildNeeded && canvas) rebuild();
    if (cfg.ants != null && isFinite(+cfg.ants)) {
      settings.ants = clamp(Math.round(+cfg.ants), LIMITS.ants[0], LIMITS.ants[1]);
      setCount(settings.ants);
    }
    return getState();
  }

  function getState() {
    return {
      ants: settings.ants,
      speed: settings.speed,
      size: settings.size,
      debug: settings.debug
    };
  }

  function readUrl() {
    var q = new URLSearchParams(location.search);
    var cfg = {};
    ['ants', 'speed', 'size', 'debug'].forEach(function (k) {
      if (q.has(k)) cfg[k] = q.get(k);
    });
    if (q.has('fps')) cfg.debug = q.get('fps');
    if (q.has('res')) urlRes = clamp(+q.get('res') || 0, 0, 1);
    return cfg;
  }

  // Tangentbord för test i webbläsaren.
  function onKey(e) {
    switch (e.key) {
      case 'ArrowUp': apply({ ants: settings.ants + 50 }); break;
      case 'ArrowDown': apply({ ants: settings.ants - 50 }); break;
      case 'ArrowRight': apply({ speed: settings.speed * 1.15 }); break;
      case 'ArrowLeft': apply({ speed: settings.speed / 1.15 }); break;
      case '+': apply({ size: settings.size * 1.1 }); break;
      case '-': apply({ size: settings.size / 1.1 }); break;
      case 'd': apply({ debug: !settings.debug }); break;
      default: return;
    }
    if (settings.debug) fpsTime = 1;  // uppdatera hud direkt
  }

  function start() {
    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d', { alpha: false });
    hud = document.getElementById('hud');

    var cfg = readUrl();
    var initialAnts = cfg.ants != null ? cfg.ants : settings.ants;
    delete cfg.ants;
    apply(cfg);
    resize();
    apply({ ants: initialAnts });
    scatter();  // börja med myror utspridda över hela ytan

    window.addEventListener('resize', function () {
      if (resize()) {
        // håll kvar myrorna inom den nya ytan
        for (var i = 0; i < count; i++) {
          if (px[i] > W + margin || py[i] > H + margin) spawnAtEdge(i);
        }
      }
    });
    window.addEventListener('keydown', onKey);
    // Dubbeltryck på mobil visar/döljer fps.
    var lastTap = 0;
    canvas.addEventListener('touchend', function () {
      var t = Date.now();
      if (t - lastTap < 350) apply({ debug: !settings.debug });
      lastTap = t;
    });

    requestAnimationFrame(frame);
  }

  window.Ants = { apply: apply, getState: getState, start: start, LIMITS: LIMITS };
})();
