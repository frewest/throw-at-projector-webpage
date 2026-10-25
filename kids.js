/*
 * Läge "Kids" – streckgubbar som hittar på bus.
 *
 * Huvudpersonen (figur 0) har långt ljust hår, glugg mellan tänderna,
 * leopardkjol, rosa ryggsäck och rosa skor. Kompisarna har andra frisyrer
 * och färger. Figurerna är ett skelett med leder som ritas direkt varje
 * bild, så att samma figur kan gå, smyga, hjula, ramla, sitta och sova.
 *
 * Bus på egen hand: tittut, räcka ut tungan, blåsa ballong som smäller,
 * såpbubblor, hjula, snurra tills man blir yr, knacka på skärmen, dansa
 * (kompisar i närheten hänger på), konfetti, vinka och lägga bananskal
 * (den som kliver på det halkar).
 * Bus på en kompis: smyga fram och säga BU, kittla, vattenpistol,
 * bockhopp, pruttkudde och rita mustasch eller glasögon på den som sover.
 *
 * Vinklar: 0 = rakt ner, positivt = framåt (åt det håll figuren tittar),
 * PI = rakt upp. Allt i figurhöjder med höften i origo.
 * ?bus=namn gör att just det buset väljs om och om igen, för test. Namn:
 * tittut, tongue, balloon, bubbles, cartwheel, spin, knock, dance, confetti,
 * wave, banana, boo, tickle, squirt, leapfrog, cushion, mustache, sleep.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- konstanter
  var MAX = 12;
  var BASE_H = 250;            // figurens höjd i px vid size=1 och 1080 px kortsida
  var WALK = 1.25;             // gånghastighet i figurhöjder per sekund
  var TWO_PI = Math.PI * 2;
  var INK = '#26232b';
  var LW = 0.032;              // linjebredd i figurhöjder
  var R = 0.155;               // huvudets radie
  var TORSO = 0.27, SH = 0.22; // hals och axlar ovanför höften
  var THIGH = 0.22, SHIN = 0.21, UPPER = 0.16, FORE = 0.15;
  var FONT = '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif';

  var LOOKS = [
    { style: 'long', hair: '#dcb66c', hairDark: '#b38a43', skin: '#f6d3bd',
      bottom: 'leopard', shoes: '#f5a8c5', pack: '#ef8db4', gap: true, bus: 0.16 },
    { style: 'short', hair: '#6b4425', hairDark: '#4a2e18', skin: '#f1c7a5',
      bottom: 'shorts', cloth: '#3d6fd1', shoes: '#2e3a8c', bus: 0.07 },
    { style: 'pigtails', hair: '#2b211c', hairDark: '#000', skin: '#c68e62', tie: '#ff5f8f',
      bottom: 'skirt', cloth: '#9b59d0', shoes: '#f2c230', bus: 0.07 },
    { style: 'curly', hair: '#c4532a', hairDark: '#8e3518', skin: '#f3d0b5',
      bottom: 'shorts', cloth: '#3aa55a', shoes: '#e8562f', bus: 0.07 },
    { style: 'cap', hair: '#3b2a20', hairDark: '#000', skin: '#8d5a3b', cap: '#e23d3d',
      bottom: 'shorts', cloth: '#f0a020', shoes: '#444', bus: 0.07 },
    { style: 'spiky', hair: '#e8c35a', hairDark: '#b8912a', skin: '#f1c7a5',
      bottom: 'shorts', cloth: '#e04a8a', shoes: '#2aa3c9', bus: 0.07 }
  ];

  // fläckar på leopardkjolen: x, y, radie
  var SPOTS = [[-0.05, 0.01, 0.018], [0.03, 0.0, 0.016], [-0.08, 0.07, 0.02], [0.0, 0.06, 0.019],
    [0.08, 0.07, 0.018], [-0.04, 0.115, 0.017], [0.05, 0.12, 0.02], [-0.11, 0.125, 0.014],
    [0.11, 0.125, 0.014]];

  var BALLOONS = ['#ff4d6d', '#4dabf7', '#ffd43b', '#69db7c', '#b197fc', '#ff922b'];
  var CONFETTI = ['#ff4d6d', '#4dabf7', '#ffd43b', '#69db7c', '#b197fc', '#ff922b', '#f783ac'];
  var LAUGHS = ['Hahaha!', 'Hihihi!', 'Lurad!', 'Haha, vad kul!'];

  var SOLO = ['tittut', 'tongue', 'balloon', 'bubbles', 'cartwheel', 'spin', 'knock',
    'dance', 'confetti', 'wave', 'banana'];
  var DUO = ['boo', 'tickle', 'squirt', 'leapfrog', 'cushion'];

  // ---------------------------------------------------------------- värld
  var W = 1920, H = 1080, scale = 1;
  var settings = null;
  var baseL = BASE_H, xMin = 0, xMax = W, yTop = 0, yBot = H;
  var clock = 0;
  var forced = new URLSearchParams(location.search).get('bus');

  var figs = [], count = 0, sorted = [];
  var parts = [];              // partiklar: bubblor, konfetti, droppar ...
  var pops = [];               // serietidningsord: PANG!, BU! ...
  var props = [];              // saker på marken: bananskal, pruttkuddar

  // ---------------------------------------------------------------- hjälp
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }

  function say(f, text, d) { f.text = text; f.textT = d || 2.2; }

  function pop(text, x, y, size, col) {
    pops.push({ text: text, x: x, y: y, s: size, col: col, t: 0, life: 1.1, r: rand(-0.15, 0.1) });
  }

  function emit(type, x, y, vx, vy, life, size, col) {
    if (parts.length > 800) return;
    parts.push({ type: type, x: x, y: y, vx: vx, vy: vy, t: 0, life: life, s: size, col: col,
      r: Math.random() * TWO_PI, w: rand(-9, 9) });
  }

  function hop(f, s) { f.vz = f.L * Math.sqrt(7 * s); }

  // ---------------------------------------------------------------- figurer
  function makeFig(i) {
    return {
      i: i, look: LOOKS[i === 0 ? 0 : 1 + (i - 1) % (LOOKS.length - 1)], alive: true,
      x: 0, y: 0, z: 0, vz: 0, face: 1, L: baseL, spd: rand(0.85, 1.15), phase: 0,
      gx: 0, gy: 0, a: 'walk', t: 0, dur: 0, k1: 0, k2: 0, k3: 0, emit: 0, ang: 0,
      target: null, by: null, next: null, last: null, prop: null, cool: rand(1, 4),
      text: '', textT: 0, starsT: 0, wetT: 0, beard: 0, beardKind: 0, col: '#fff',
      sx0: 0, ex: 0, p: {},
      j: { lf: [0, 0, 0, 0], lb: [0, 0, 0, 0], af: [0, 0, 0, 0], ab: [0, 0, 0, 0] },
      gOff: -0.43, hx: 0, hy: 0, hr: 1, wh: [0, 0], wi: [0, 0], tmp: [0, 0]
    };
  }

  function depthL(y) {
    return baseL * (0.82 + 0.18 * clamp((y - yTop) / ((yBot - yTop) || 1), 0, 1));
  }

  function newGoal(f) {
    f.gx = clamp(f.x + rand(-0.45, 0.45) * W, xMin, xMax);
    f.gy = rand(yTop, yBot);
  }

  function place(f) {
    f.x = rand(xMin, xMax);
    f.y = rand(yTop, yBot);
    f.L = depthL(f.y);
    f.face = Math.random() < 0.5 ? 1 : -1;
    setAct(f, 'walk');
  }

  function setAct(f, name) {
    var A = ACT[name];
    f.a = name;
    f.t = 0;
    f.k1 = f.k2 = f.k3 = 0;
    f.emit = 0;
    f.dur = typeof A.dur === 'number' ? A.dur : rand(A.dur[0], A.dur[1]);
    if (A.start) A.start(f);
  }

  // Släpp kompisen man busade med.
  function release(f) {
    var g = f.target;
    if (g && g.by === f) {
      g.by = null;
      if (g.a === 'wait') setAct(g, 'walk');
    }
    f.target = null;
  }

  function finish(f) { release(f); setAct(f, 'walk'); }

  function ok(g, f) { return g && g.alive && g.by === f; }

  function free(g) { return g.alive && !g.by && (g.a === 'walk' || g.a === 'idle'); }

  function nearest(f, list) {
    var best = null, bd = 1e18;
    for (var i = 0; i < list.length; i++) {
      var dx = list[i].x - f.x, dy = list[i].y - f.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = list[i]; }
    }
    return best;
  }

  function moveTo(f, gx, gy, v, dt) {
    var dx = gx - f.x, dy = gy - f.y, d = Math.sqrt(dx * dx + dy * dy), s = v * dt;
    if (dx > 2 || dx < -2) f.face = dx > 0 ? 1 : -1;
    if (d <= s) {
      f.x = gx; f.y = gy;
      f.phase = (f.phase + d / (f.L * 0.9)) % 1;
      return true;
    }
    f.x += dx / d * s;
    f.y += dy / d * s;
    f.phase = (f.phase + s / (f.L * 0.9)) % 1;
    return false;
  }

  // ---------------------------------------------------------------- bus väljs
  function think(f, dt) {
    f.cool -= dt;
    if (f.cool > 0) return;
    if (Math.random() < (forced ? 2 : f.look.bus) * dt) {
      f.cool = forced ? rand(1, 2) : rand(4, 9);
      prank(f);
    } else if ((!forced || forced === 'mustache') && Math.random() < (f.i ? 0.012 : 0.004) * dt) {
      f.cool = rand(4, 9);
      setAct(f, 'sleep');
    }
  }

  function prank(f) {
    var victims = [], sleepers = [], i, g, name;
    for (i = 0; i < count; i++) {
      g = figs[i];
      if (g === f || g.by) continue;
      if (g.a === 'walk' || g.a === 'idle') victims.push(g);
      else if (g.a === 'sleep' && g.t > 1.2 && g.t < g.dur - 3 && !g.beard) sleepers.push(g);
    }
    g = null;
    if (forced && ACT[forced]) name = forced;
    else if (sleepers.length && Math.random() < 0.7) name = 'mustache';
    else {
      for (i = 0; i < 3; i++) {
        name = victims.length && Math.random() < 0.5 ? pick(DUO) : pick(SOLO);
        if (name !== f.last) break;
      }
    }
    if (name === 'sleep') return setAct(f, 'sleep');
    if (name === 'mustache') {
      if (!sleepers.length) return;
      g = nearest(f, sleepers);
    } else if (DUO.indexOf(name) >= 0) {
      if (!victims.length) return;
      g = nearest(f, victims);
      setAct(g, 'wait');
    } else if (SOLO.indexOf(name) < 0) {
      return;
    }
    f.last = name;
    if (g) {
      f.next = name;
      f.target = g;
      g.by = f;
      return setAct(f, 'goto');
    }
    if (name === 'knock') {
      // gå fram till "glaset" först
      f.next = 'knock';
      f.gx = f.x;
      f.gy = yBot;
      return setAct(f, 'goto');
    }
    setAct(f, name);
  }

  // Den närmaste som går omkring styrs rakt över bananskalet.
  function lure(f, x, y) {
    var list = [];
    for (var i = 0; i < count; i++) if (figs[i] !== f && free(figs[i])) list.push(figs[i]);
    var g = nearest(f, list);
    if (!g) return;
    setAct(g, 'walk');
    g.gx = clamp(x + (x - g.x) * 0.5, xMin, xMax);
    g.gy = clamp(y + (y - g.y) * 0.5, yTop, yBot);
  }

  function checkPeel(f) {
    for (var i = 0; i < props.length; i++) {
      var pr = props[i];
      if (pr.type !== 'peel' || (pr.owner === f && pr.t < 3)) continue;
      if (Math.abs(f.x - pr.x) < 0.12 * f.L && Math.abs(f.y - pr.y) < 0.06 * f.L) {
        props.splice(i, 1);
        emit('peel', pr.x, pr.y - 2, f.face * rand(150, 260) * scale, -rand(350, 500) * scale,
          1.2, f.L * 0.09, '');
        setAct(f, 'slip');
        var o = pr.owner;
        if (o && o !== f && free(o)) setAct(o, 'laugh');
        return true;
      }
    }
    return false;
  }

  // Alla i närheten skrattar åt mustaschen.
  function mock(f) {
    for (var i = 0; i < count; i++) {
      var g = figs[i];
      if (g === f || !free(g) || Math.abs(g.x - f.x) > 4 * f.L) continue;
      setAct(g, 'laugh');
      say(g, f.beardKind ? pick(['Haha, glasögon!', 'Snygga glasögon!'])
        : pick(['Haha, mustasch!', 'Snygg mustasch!', 'Hihi, du har mustasch!']), 2);
    }
  }

  // ---------------------------------------------------------------- poser
  function resetPose(p) {
    p.lean = 0; p.tilt = 0; p.rot = 0; p.sx = 1;
    p.af1 = 0.18; p.af2 = 0.3; p.ab1 = -0.12; p.ab2 = 0.3;
    p.lf1 = 0.06; p.lf2 = -0.04; p.lb1 = -0.06; p.lb2 = -0.04;
    p.hf = null; p.hb = null; p.front = false; p.fingers = false;
    p.expr = 'grin'; p.item = null; p.ir = 0;
  }

  function walkPose(p, ph, amp) {
    var s = Math.sin(ph * TWO_PI), c = Math.cos(ph * TWO_PI);
    p.lf1 = 0.5 * amp * s; p.lf2 = -(0.15 + 0.9 * Math.max(0, c)) * amp;
    p.lb1 = -0.5 * amp * s; p.lb2 = -(0.15 + 0.9 * Math.max(0, -c)) * amp;
    p.af1 = -0.55 * amp * s + 0.05; p.af2 = 0.45;
    p.ab1 = 0.55 * amp * s - 0.05; p.ab2 = 0.45;
  }

  function idlePose(f, p) {
    p.tilt = Math.sin(clock * 1.7 + f.i) * 0.12;
  }

  function laughPose(f, p) {
    p.lean = 0.3 + 0.08 * Math.sin(f.t * 22);
    p.tilt = -0.2;
    p.hf = ['b', 0.08, -0.12];
    p.hb = ['b', -0.02, -0.1];
    p.expr = 'laugh';
  }

  function armsUp(p) {
    p.af1 = 2.7; p.af2 = 0.1; p.ab1 = -2.7; p.ab2 = -0.1;
  }

  // ---------------------------------------------------------------- handlingar
  // Varje handling: dur (sekunder eller [min, max]), start(f), update(f, dt),
  // end(f) (annars tillbaka till att gå), pose(f, p), ownZ (sköter höjden själv).
  var ACT = {};

  ACT.walk = {
    dur: 1e9,
    start: newGoal,
    update: function (f, dt) {
      if (moveTo(f, f.gx, f.gy, WALK * baseL * f.spd, dt)) {
        if (Math.random() < 0.4) return setAct(f, 'idle');
        newGoal(f);
      }
      if (!checkPeel(f)) think(f, dt);
    },
    pose: function (f, p) { walkPose(p, f.phase, 1); }
  };

  ACT.idle = {
    dur: [1, 3],
    update: think,
    pose: idlePose
  };

  // Kompisen står still och väntar (utan att veta om det) på buset.
  ACT.wait = {
    dur: 12,
    update: function (f) {
      var a = f.by;
      if (!a || !a.alive || a.target !== f) { f.by = null; return setAct(f, 'walk'); }
      var away = a.next === 'boo' || a.next === 'squirt';
      if (Math.abs(a.x - f.x) > 4) f.face = (a.x > f.x) !== away ? 1 : -1;
    },
    end: function (f) { f.by = null; setAct(f, 'walk'); },
    pose: idlePose
  };

  ACT.goto = {
    dur: 9,
    update: function (f, dt) {
      var g = f.target, gx, gy, side;
      if (f.next === 'knock') {
        gx = f.gx; gy = f.gy;
      } else {
        if (!ok(g, f)) return finish(f);
        side = f.x < g.x ? -1 : 1;
        switch (f.next) {
          case 'boo': side = -g.face; gx = g.x + side * 0.32 * g.L; break;
          case 'tickle': gx = g.x + side * 0.3 * g.L; break;
          case 'squirt': gx = g.x + side * 2.0 * g.L; break;
          case 'leapfrog': gx = g.x + side * 1.4 * g.L; break;
          case 'cushion': gx = g.x + side * 0.6 * g.L; break;
          default: side = f.x < g.hx ? -1 : 1; gx = g.hx + side * 0.3 * g.L;
        }
        if (gx < xMin || gx > xMax) gx = 2 * g.x - gx;
        gx = clamp(gx, xMin, xMax);
        gy = clamp(g.y + 2, yTop, yBot);
      }
      var sneak = f.next === 'boo' || f.next === 'mustache';
      if (moveTo(f, gx, gy, WALK * baseL * f.spd * (sneak ? 0.55 : 1.15), dt)) {
        if (g) f.face = (f.next === 'mustache' ? g.hx : g.x) > f.x ? 1 : -1;
        setAct(f, f.next);
      }
    },
    end: finish,
    pose: function (f, p) {
      if (f.next === 'boo' || f.next === 'mustache') {
        walkPose(p, f.phase, 0.6);
        p.lean = 0.25;
        p.af1 = 1.2; p.af2 = 1.4; p.ab1 = 0.9; p.ab2 = 1.5;
        p.expr = 'sneaky';
      } else {
        walkPose(p, f.phase, 1.1);
      }
    }
  };

  // ---- bus på egen hand

  ACT.tittut = {
    dur: 2.8,
    update: function (f) {
      if (f.t > 1.5 && !f.k1) { f.k1 = 1; say(f, 'Tittut!'); hop(f, 0.35); }
    },
    pose: function (f, p) {
      if (f.t < 1.5) {
        p.hf = ['h', 0.4, -0.05];
        p.hb = ['h', -0.4, -0.05];
        p.front = true;
        p.tilt = Math.sin(f.t * 5) * 0.08;
        p.expr = 'smile';
      } else {
        p.af1 = 2.3; p.af2 = 0.3; p.ab1 = -2.3; p.ab2 = -0.3;
        p.lf1 = 0.25; p.lb1 = -0.25;
      }
    }
  };

  ACT.tongue = {
    dur: 2.4,
    start: function (f) { say(f, pick(['Bläää!', 'Nä-nä-nä-nä-näää!', 'Blä-blä!'])); },
    pose: function (f, p) {
      p.hf = ['h', 1.3, 0];
      p.hb = ['h', -1.3, 0];
      p.fingers = true;
      p.tilt = Math.sin(f.t * 9) * 0.18;
      p.expr = 'tongue';
    }
  };

  function balloonSize(t) {
    // blåser i omgångar: ballongen växer bara medan man blåser
    var b = t * 1.6, n = Math.floor(b);
    var infl = n * 0.65 + Math.min(b - n, 0.65);
    return 0.025 + 0.24 * Math.pow(Math.min(1, infl / 3.5), 1.2);
  }

  ACT.balloon = {
    dur: 4.6,
    start: function (f) { f.col = pick(BALLOONS); },
    update: function (f) {
      if (f.t > 3.3 && !f.k1) {
        f.k1 = 1;
        var x = f.wi[0], y = f.wi[1], s = f.L * 0.25;
        pop('PANG!', x, y - s * 0.4, f.L * 0.3, '#ffd43b');
        for (var i = 0; i < 14; i++) {
          emit('shred', x, y, rand(-1, 1) * 400 * scale, rand(-1, 0.4) * 400 * scale, rand(0.8, 1.4),
            f.L * 0.03, f.col);
        }
        hop(f, 0.6);
        say(f, pick(['Hoppsan!', 'Oj!', 'Den small!']));
      }
    },
    pose: function (f, p) {
      if (f.t < 3.3) {
        var b = (f.t * 1.6) % 1;
        p.hf = ['h', 1.05, 0.55];
        p.hb = ['b', -0.07, -0.05];
        p.lean = -0.08 * f.t / 3.3;
        p.expr = b < 0.65 ? 'blow' : 'grin';
        p.item = 'balloon';
        p.ir = balloonSize(f.t);
      } else {
        armsUp(p);
        p.lf1 = 0.3; p.lb1 = -0.3;
        p.expr = f.t < 3.9 ? 'scared' : 'laugh';
      }
    }
  };

  ACT.bubbles = {
    dur: 4.5,
    start: function (f) {
      if (Math.random() < 0.6) say(f, pick(['Såpbubblor!', 'Fånga dem!', 'Bubblor!']));
    },
    update: function (f, dt) {
      f.emit -= dt;
      if (f.t > 0.4 && f.p.expr === 'blow' && f.emit <= 0) {
        f.emit = 0.13;
        emit('bubble', f.wi[0], f.wi[1], f.face * rand(40, 140) * scale, rand(-60, -10) * scale,
          rand(2.2, 4.2), f.L * rand(0.025, 0.06), '');
      }
    },
    pose: function (f, p) {
      p.hf = ['h', 1.5, 0.95];
      p.hb = ['b', -0.07, -0.05];
      p.item = 'wand';
      p.expr = (f.t * 1.2) % 1 < 0.6 ? 'blow' : 'grin';
    }
  };

  ACT.cartwheel = {
    dur: 2.0,
    start: function (f) {
      var to = f.x + f.face * 1.6 * f.L;
      if (to > xMax || to < xMin) f.face = -f.face;
    },
    update: function (f, dt) {
      if (f.t < 1.2) f.x = clamp(f.x + f.face * 1.4 * f.L / 1.2 * dt, xMin, xMax);
      else if (!f.k1) { f.k1 = 1; say(f, pick(['Tadaa!', 'Kolla!', 'Hjula!'])); }
    },
    pose: function (f, p) {
      var u = f.t / 1.2;
      p.af1 = Math.PI - 0.35; p.ab1 = -(Math.PI - 0.35); p.af2 = p.ab2 = 0;
      if (u < 1) {
        p.rot = ease(u) * TWO_PI;
        p.lf1 = 0.55; p.lf2 = 0; p.lb1 = -0.55; p.lb2 = 0;
        p.expr = 'laugh';
      }
    }
  };

  ACT.spin = {
    dur: 4.6,
    start: function (f) { f.ang = 0; say(f, 'Wiiii!', 1.6); },
    update: function (f, dt) {
      if (f.t < 2) {
        f.ang += (6 + 10 * f.t) * dt;
      } else {
        if (!f.k1) { f.k1 = 1; f.starsT = 2.6; say(f, pick(['Snurrigt!', 'Allt snurrar!', 'Oj oj oj...'])); }
        f.x = clamp(f.x + Math.sin(f.t * 5) * 0.4 * f.L * dt, xMin, xMax);
      }
    },
    pose: function (f, p) {
      if (f.t < 2) {
        var c = Math.cos(f.ang);
        p.sx = Math.abs(c) < 0.08 ? (c < 0 ? -0.08 : 0.08) : c;
        p.af1 = 1.5; p.af2 = 0; p.ab1 = -1.5; p.ab2 = 0;
        p.expr = 'laugh';
      } else {
        var s = Math.sin(f.t * 5);
        p.lean = s * 0.22;
        p.tilt = Math.sin(f.t * 4 + 1) * 0.3;
        p.lf1 = 0.25 * s; p.lb1 = -0.2 + 0.2 * Math.sin(f.t * 5 + 1);
        p.af1 = 1.3 + 0.4 * Math.sin(f.t * 6); p.ab1 = -1.3 - 0.4 * Math.sin(f.t * 6 + 1);
        p.expr = 'dizzy';
      }
    }
  };

  // Knackar på insidan av "glaset" (projektorduken).
  var KNOCKS = [0.3, 0.52, 0.74, 1.4, 1.62, 1.84];
  ACT.knock = {
    dur: 4.2,
    update: function (f) {
      if (f.k2 < KNOCKS.length && f.t >= KNOCKS[f.k2]) {
        emit('ripple', f.wh[0], f.wh[1], 0, 0, 0.5, f.L * 0.04, 'rgba(90, 150, 220,');
        if (f.k2 === 0) pop('Knack knack!', f.wh[0], f.wh[1] - f.L * 0.3, f.L * 0.16, '#74c0fc');
        f.k2++;
      }
      if (f.t > 2.2 && !f.k1) {
        f.k1 = 1;
        say(f, pick(['Hallå därute!', 'Släpp ut mig!', 'Ser ni mig?', 'Är det någon där?']), 2);
      }
    },
    pose: function (f, p) {
      if (f.t < 2.2) {
        var d = 1;
        for (var i = 0; i < KNOCKS.length; i++) d = Math.min(d, Math.abs(f.t - KNOCKS[i]) / 0.11);
        p.hf = ['h', 1.6, 0.5 - 0.6 * Math.min(1, d)];
        p.tilt = 0.1;
        p.expr = 'o';
      } else {
        p.af1 = 2.6; p.af2 = 0.45 * Math.sin(f.t * 11);
        p.expr = 'grin';
      }
    }
  };

  ACT.dance = {
    dur: 5,
    ownZ: true,
    update: function (f, dt) {
      var b = f.t * 2.2;
      f.z = Math.abs(Math.sin(b * Math.PI)) * 0.06 * f.L;
      var nb = (b / 2) | 0;
      if (nb !== f.k2) { f.k2 = nb; f.face = -f.face; }
      f.emit -= dt;
      if (f.emit <= 0) {
        f.emit = 0.55;
        emit('note', f.hx + rand(-1, 1) * f.L * 0.2, f.hy - f.L * 0.15, rand(-25, 25) * scale,
          -70 * scale, 1.6, f.L * 0.1, pick(CONFETTI));
      }
      if (!f.k1 && !f.k3 && f.t > 0.4) {
        f.k1 = 1;
        say(f, pick(['Dansa med mig!', 'Disco!', 'Dansfest!']));
        for (var i = 0; i < count; i++) {
          var g = figs[i];
          if (g !== f && free(g) && Math.abs(g.x - f.x) < 3.5 * f.L && Math.random() < 0.6) {
            setAct(g, 'dance');
            g.k3 = 1;
          }
        }
      }
    },
    pose: function (f, p) {
      var b = f.t * 2.2, u = 0.5 + 0.5 * Math.sin(b * Math.PI);
      p.af1 = lerp(0.4, 2.8, u); p.af2 = 0.3;
      p.ab1 = -lerp(0.4, 2.8, 1 - u); p.ab2 = -0.3;
      p.lean = 0.12 * Math.sin(b * Math.PI);
      p.lf1 = 0.2 + 0.15 * Math.sin(b * TWO_PI); p.lf2 = -0.3;
      p.lb1 = -0.2 + 0.15 * Math.sin(b * TWO_PI); p.lb2 = -0.3;
      p.expr = (b | 0) % 2 ? 'laugh' : 'grin';
    }
  };

  ACT.confetti = {
    dur: 2.4,
    update: function (f) {
      if (f.t > 0.5 && !f.k1) {
        f.k1 = 1;
        hop(f, 0.7);
        say(f, pick(['Tadaa!', 'Hurra!', 'Fest!', 'Överraskning!']));
        for (var i = 0; i < 50; i++) {
          emit('confetti', f.wh[0], f.wh[1], rand(-1, 1) * 280 * scale, rand(-750, -300) * scale,
            rand(2.5, 4), f.L * rand(0.016, 0.026), pick(CONFETTI));
        }
      }
    },
    pose: function (f, p) {
      if (f.t < 0.5) {
        p.lean = 0.35;
        p.lf1 = 0.95; p.lf2 = -1.8; p.lb1 = 0.75; p.lb2 = -1.6;
        p.af1 = -0.4; p.ab1 = -0.6;
        p.expr = 'sneaky';
      } else {
        armsUp(p);
        p.expr = 'laugh';
      }
    }
  };

  ACT.wave = {
    dur: 2.4,
    start: function (f) { say(f, pick(['Hej!', 'Hej hej!', 'Hallå!', 'Titta här!', 'Hej på er!'])); },
    pose: function (f, p) {
      p.af1 = 2.6; p.af2 = 0.45 * Math.sin(f.t * 11);
      p.tilt = 0.1;
    }
  };

  ACT.banana = {
    dur: 1.8,
    update: function (f) {
      if (f.t > 0.6 && !f.k1) {
        f.k1 = 1;
        var x = clamp(f.x + f.face * 0.3 * f.L, xMin, xMax), y = f.y + 1;
        props.push({ type: 'peel', x: x, y: y, t: 0, life: 20, owner: f, rot: rand(-0.5, 0.5), L: f.L });
        say(f, pick(['Hihi...', 'Ett bananskal!', 'Akta er!']));
        lure(f, x, y);
      }
    },
    pose: function (f, p) {
      var u = f.t < 0.6 ? ease(f.t / 0.6) : f.t < 1.1 ? 1 : 1 - ease((f.t - 1.1) / 0.5);
      p.lean = 0.9 * u;
      p.lf1 = 0.3 * u; p.lf2 = -0.5 * u - 0.04;
      p.af1 = lerp(0.18, 0.9, u); p.af2 = 0.1;
      p.item = f.t < 0.6 ? 'peel' : null;
      p.expr = 'sneaky';
    }
  };

  // ---- bus på en kompis

  ACT.boo = {
    dur: 2.6,
    update: function (f) {
      var g = f.target;
      if (f.t > 0.35 && !f.k1) {
        f.k1 = 1;
        pop('BU!', f.hx + f.face * f.L * 0.2, f.hy - f.L * 0.2, f.L * 0.32, '#ff6b6b');
        if (ok(g, f)) { g.face = f.x > g.x ? 1 : -1; setAct(g, 'scared'); }
      }
      if (f.t > 1.0 && !f.k2) { f.k2 = 1; say(f, pick(['Hihi, lurad!', 'Hahaha!', 'Där fick du!'])); }
    },
    pose: function (f, p) {
      if (f.t < 0.35) {
        var u = f.t / 0.35;
        p.af1 = lerp(0.2, 2.6, u); p.ab1 = lerp(-0.1, 2.2, u); p.af2 = p.ab2 = 0.6;
        p.lean = -0.1 * u;
        p.expr = 'sneaky';
      } else if (f.t < 1.0) {
        p.af1 = 2.3; p.af2 = 0.9; p.ab1 = 2.0; p.ab2 = 0.9;
        p.lean = 0.2;
        p.fingers = true;
        p.expr = 'grin';
      } else {
        laughPose(f, p);
      }
    }
  };

  ACT.scared = {
    dur: 1.8,
    start: function (f) { hop(f, 0.8); say(f, pick(['Aaah!', 'Iiiih!', 'Hjälp!', 'Oj!']), 1.4); },
    end: function (f) {
      if (Math.random() < 0.6) {
        setAct(f, 'laugh');
        say(f, pick(['Du skrämde mig!', 'Vad läskigt!', 'Igen!']));
      } else {
        finish(f);
      }
    },
    pose: function (f, p) {
      armsUp(p);
      p.lf1 = 0.35; p.lb1 = -0.35;
      p.expr = f.t < 1 ? 'scared' : 'grin';
    }
  };

  ACT.laugh = {
    dur: 1.8,
    start: function (f) { say(f, pick(LAUGHS), 1.6); },
    pose: laughPose
  };

  ACT.tickle = {
    dur: 3,
    start: function (f) {
      var g = f.target;
      if (ok(g, f)) { setAct(g, 'giggle'); g.dur = 3.1; }
      say(f, pick(['Kittel kittel!', 'Killekill!', 'Kittelmonstret!']));
    },
    pose: function (f, p) {
      var w = Math.sin(f.t * 26) * 0.04;
      p.lean = 0.25;
      p.hf = ['b', 0.3 + w, -0.28];
      p.hb = ['b', 0.27 - w, -0.22];
      p.fingers = true;
      p.expr = 'laugh';
    }
  };

  ACT.giggle = {
    dur: 3,
    ownZ: true,
    update: function (f) {
      f.z = Math.abs(Math.sin(f.t * 13)) * 0.03 * f.L;
      if (f.t > 0.2 && !f.k1) {
        f.k1 = 1;
        say(f, pick(['Hihihi! Sluta!', 'Hahaha! Det kittlas!', 'Nej nej, hihi!']), 2.6);
      }
    },
    pose: function (f, p) {
      p.lean = Math.sin(f.t * 9) * 0.25 - 0.05;
      p.tilt = Math.sin(f.t * 7) * 0.2;
      p.hf = ['b', 0.05, -0.14];
      p.hb = ['b', -0.05, -0.14];
      p.lf1 = 0.15; p.lb1 = -0.15;
      p.expr = 'laugh';
    }
  };

  var DROP_G = 1400;
  ACT.squirt = {
    dur: 2.8,
    start: function (f) { say(f, pick(['Vattenkrig!', 'Sprut sprut!', 'Akta, vatten!']), 1.4); },
    update: function (f, dt) {
      var g = f.target;
      if (f.t > 0.35 && f.t < 1.5 && ok(g, f)) {
        f.emit -= dt;
        if (f.emit <= 0) {
          f.emit = 0.035;
          var x0 = f.wi[0], y0 = f.wi[1], T = 0.4;
          var tx = g.hx + rand(-0.5, 0.5) * g.hr, ty = g.hy + rand(-0.6, 0.9) * g.hr;
          emit('drop', x0, y0, (tx - x0) / T, (ty - y0) / T - 0.5 * DROP_G * scale * T, T,
            f.L * 0.022, '#4dabf7');
        }
      }
      if (f.t > 0.8 && !f.k1) { f.k1 = 1; if (ok(g, f) && g.a === 'wait') setAct(g, 'wet'); }
      if (f.t > 1.6 && !f.k2) { f.k2 = 1; say(f, pick(LAUGHS)); }
    },
    pose: function (f, p) {
      p.item = 'pistol';
      if (f.t < 1.6) {
        p.af1 = 1.5; p.af2 = 0.05; p.ab1 = 1.3; p.ab2 = 0.25;
      } else {
        laughPose(f, p);
      }
    }
  };

  ACT.wet = {
    dur: 2.6,
    start: function (f) {
      f.wetT = 7;
      say(f, pick(['Iiih! Blöt!', 'Kallt!', 'Hallå där!', 'Jag är dyblöt!']));
    },
    pose: function (f, p) {
      var s = f.t < 1.4 ? Math.sin(f.t * 38) : 0;
      p.lean = 0.12 * s;
      p.tilt = -0.25 * s;
      p.af1 = 1.4 + 0.3 * s; p.ab1 = -1.4 + 0.3 * s; p.af2 = 0.3; p.ab2 = -0.3;
      p.expr = 'wet';
    }
  };

  ACT.leapfrog = {
    dur: 1.9,
    ownZ: true,
    start: function (f) {
      var g = f.target;
      if (!ok(g, f)) return finish(f);
      var side = f.x < g.x ? -1 : 1;
      f.face = -side;
      f.sx0 = f.x;
      f.ex = clamp(g.x - side * 1.1 * g.L, xMin, xMax);
      setAct(g, 'duck');
      g.face = f.face;
      say(f, 'Bockhopp!', 1.4);
    },
    update: function (f, dt) {
      var u = Math.min(1, f.t / 1.3), q = (u - 0.4) / 0.45;
      f.x = lerp(f.sx0, f.ex, u);
      f.z = q > 0 && q < 1 ? Math.sin(q * Math.PI) * 0.62 * f.L : 0;
      if (q <= 0) f.phase = (f.phase + dt * 2.6) % 1;
      if (u >= 1 && !f.k1) { f.k1 = 1; say(f, pick(['Hopp!', 'Tadaa!', 'Över!'])); }
    },
    end: function (f) { f.z = 0; finish(f); },
    pose: function (f, p) {
      var u = Math.min(1, f.t / 1.3), q = (u - 0.4) / 0.45;
      if (u >= 1) {
        armsUp(p);
      } else if (q > 0 && q < 1) {
        p.lf1 = 1.35; p.lf2 = 0; p.lb1 = -1.1; p.lb2 = 0;
        if (q < 0.5) { p.af1 = 0.5; p.af2 = 0; p.ab1 = 0.4; p.ab2 = 0; } else armsUp(p);
        p.expr = 'laugh';
      } else {
        walkPose(p, f.phase, 1.2);
        p.lean = 0.15;
      }
    }
  };

  ACT.duck = {
    dur: 2,
    end: function (f) { if (Math.random() < 0.5) setAct(f, 'laugh'); else finish(f); },
    pose: function (f, p) {
      p.lean = 1.15; p.tilt = -0.6;
      p.lf1 = 0.55; p.lf2 = -0.9; p.lb1 = 0.4; p.lb2 = -0.8;
      p.hf = ['b', 0.14, 0.17];
      p.hb = ['b', 0.11, 0.17];
    }
  };

  ACT.cushion = {
    dur: 3.4,
    start: function (f) { say(f, pick(['Sätt dig, du!', 'Vill du sitta?', 'Varsågod, en kudde!']), 1.4); },
    update: function (f) {
      var g = f.target;
      if (f.t > 0.7 && !f.k1) {
        f.k1 = 1;
        if (!ok(g, f)) return finish(f);
        var pr = { type: 'cushion', x: g.x - g.face * 0.03 * g.L, y: g.y + 0.5, t: 0, life: 4,
          L: g.L, squash: 0 };
        props.push(pr);
        setAct(g, 'sitdown');
        g.prop = pr;
      }
      if (f.t > 1.5 && !f.k2) { f.k2 = 1; say(f, pick(LAUGHS)); }
    },
    pose: function (f, p) {
      if (f.t < 0.8) {
        var u = Math.sin(Math.min(1, f.t / 0.8) * Math.PI);
        p.lean = 0.8 * u;
        p.lf1 = 0.4 * u; p.lf2 = -0.7 * u - 0.04;
        p.af1 = lerp(0.3, 1.0, u); p.af2 = 0.1;
        p.item = f.t < 0.7 ? 'cushion' : null;
        p.expr = 'sneaky';
      } else if (f.t > 1.4) {
        laughPose(f, p);
      } else {
        p.expr = 'sneaky';
      }
    }
  };

  ACT.sitdown = {
    dur: 3.2,
    update: function (f) {
      if (f.t > 0.6 && !f.k1) {
        f.k1 = 1;
        if (f.prop) f.prop.squash = 1;
        pop('PRRRT!', f.x - f.face * f.L * 0.2, f.y - f.L * 0.35, f.L * 0.24, '#ffa94d');
        for (var i = 0; i < 7; i++) {
          emit('cloud', f.x - f.face * f.L * rand(0.05, 0.3), f.y - f.L * rand(0, 0.12),
            -f.face * rand(10, 50) * scale, -rand(10, 35) * scale, rand(1.2, 1.8), f.L * rand(0.05, 0.09), '');
        }
      }
      if (f.t > 1.0 && !f.k2) {
        f.k2 = 1;
        say(f, pick(['Det var inte jag!', 'Hihi, oj!', 'Vem la den där?', 'En pruttkudde!']));
      }
    },
    end: function (f) { if (f.prop) f.prop.life = 0; f.prop = null; finish(f); },
    pose: function (f, p) {
      var u = f.t < 0.6 ? ease(f.t / 0.6) : f.t < 2.4 ? 1 : 1 - ease((f.t - 2.4) / 0.8);
      p.lf1 = lerp(0.06, 1.5, u); p.lf2 = lerp(-0.04, -0.15, u);
      p.lb1 = lerp(-0.06, 1.4, u); p.lb2 = lerp(-0.04, -0.25, u);
      p.lean = -0.1 * u;
      p.af1 = lerp(0.18, -0.4, u); p.ab1 = lerp(-0.12, -0.6, u);
      p.expr = f.t < 0.6 ? 'grin' : f.t < 1.0 ? 'o' : 'laugh';
    }
  };

  ACT.slip = {
    dur: 2.8,
    start: function (f) { hop(f, 0.3); },
    update: function (f) {
      if (f.t > 0.42 && !f.k1) {
        f.k1 = 1;
        f.starsT = 1.6;
        pop('DUNS!', f.x, f.y - f.L * 0.3, f.L * 0.2, '#ffd43b');
        say(f, pick(['Oj då!', 'Hoppsan!', 'Aj, min rumpa!', 'Vem la den där?']));
      }
    },
    pose: function (f, p) {
      var t = f.t, u;
      if (t < 0.4) {
        u = ease(t / 0.4);
        p.rot = -1.1 * u;
        p.lf1 = lerp(0.06, 1.9, u); p.lb1 = lerp(-0.06, 1.5, u); p.lf2 = p.lb2 = 0;
        p.af1 = 2.5; p.ab1 = 2.0;
        p.expr = 'scared';
      } else {
        u = t < 2 ? 1 : 1 - ease((t - 2) / 0.8);
        p.rot = -0.2 * u;
        p.lean = -0.1 * u;
        p.lf1 = lerp(0.06, 1.45, u); p.lf2 = lerp(-0.04, -0.15, u);
        p.lb1 = lerp(-0.06, 1.35, u); p.lb2 = lerp(-0.04, -0.25, u);
        p.af1 = lerp(0.18, -0.5, u); p.ab1 = lerp(-0.12, -0.7, u); p.af2 = p.ab2 = 0.2;
        p.expr = t < 2 ? 'dizzy' : 'grin';
      }
    }
  };

  ACT.sleep = {
    dur: [9, 14],
    update: function (f, dt) {
      f.emit -= dt;
      if (f.t > 1 && f.t < f.dur - 1 && f.emit <= 0) {
        f.emit = 1.1;
        emit('z', f.hx, f.hy - f.hr * 1.2, 18 * scale, -30 * scale, 2.2, f.L * 0.09, INK);
      }
      if (f.t > f.dur - 1 && !f.k1) {
        f.k1 = 1;
        if (f.beard > 0) {
          say(f, pick(['Vad är det som är så roligt?', 'Varför skrattar alla?', 'Hm? Vad då?']), 2.8);
          mock(f);
        } else {
          say(f, pick(['Gääääsp!', 'God morgon!', 'Jag drömde om glass!']));
        }
      }
    },
    pose: function (f, p) {
      var t = f.t, end = f.dur - 1;
      var u = t < 0.8 ? ease(t / 0.8) : t < end ? 1 : 1 - ease((t - end) / 0.9);
      p.rot = -Math.PI / 2 * u;
      p.lf1 = lerp(0.06, 0.03, u); p.lf2 = lerp(-0.04, 0, u);
      p.lb1 = lerp(-0.06, -0.02, u); p.lb2 = lerp(-0.04, 0, u);
      p.af1 = lerp(0.18, 0.08, u); p.ab1 = lerp(-0.12, -0.05, u);
      p.af2 = p.ab2 = 0.1;
      p.expr = u > 0.5 ? 'sleep' : 'grin';
      if (t > end && u < 0.6) { armsUp(p); p.expr = 'o'; }
    }
  };

  ACT.mustache = {
    dur: 3.4,
    start: function (f) { say(f, 'Shhh!', 1.4); },
    update: function (f) {
      var g = f.target;
      if (f.t > 2.0 && !f.k1) {
        f.k1 = 1;
        if (ok(g, f) && g.a === 'sleep') {
          g.beard = 40;
          g.beardKind = Math.random() < 0.6 ? 0 : 1;
          g.dur = Math.min(g.dur, g.t + 2.5);
        }
        release(f);
      }
      if (f.t > 2.2 && !f.k2) { f.k2 = 1; say(f, pick(['Hihi!', 'Snyggt!', 'Hihihi...'])); }
    },
    pose: function (f, p) {
      p.item = 'marker';
      if (f.t < 2.0) {
        p.lean = 0.85;
        p.lf1 = 0.35; p.lf2 = -0.7; p.lb1 = 0.1; p.lb2 = -0.4;
        p.af1 = 0.75 + 0.1 * Math.sin(f.t * 28); p.af2 = 0.2 + 0.15 * Math.sin(f.t * 21);
        p.ab1 = -0.2;
        p.expr = 'sneaky';
      } else {
        laughPose(f, p);
      }
    }
  };

  // ---------------------------------------------------------------- skelett
  function chain(o, x, y, a1, a2, l1, l2) {
    o[0] = x + Math.sin(a1) * l1;
    o[1] = y + Math.cos(a1) * l1;
    o[2] = o[0] + Math.sin(a1 + a2) * l2;
    o[3] = o[1] + Math.cos(a1 + a2) * l2;
  }

  // Tvåledad arm som sträcker sig mot (tx, ty); bend väljer åt vilket håll armbågen pekar.
  function reach(o, x, y, tx, ty, l1, l2, bend) {
    var dx = tx - x, dy = ty - y, d = Math.sqrt(dx * dx + dy * dy);
    var dc = clamp(d, Math.abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4);
    var al = Math.acos(clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1));
    var a1 = Math.atan2(dx, dy) + bend * al;
    o[0] = x + Math.sin(a1) * l1;
    o[1] = y + Math.cos(a1) * l1;
    var ex = tx - o[0], ey = ty - o[1], e = Math.sqrt(ex * ex + ey * ey) || 1;
    o[2] = o[0] + ex / e * l2;
    o[3] = o[1] + ey / e * l2;
  }

  // Mål för en hand: ['h', x, y] i huvudradier från huvudets mitt, ['b', x, y] från höften.
  function arm(j, o, tgt, a1, a2) {
    if (!tgt) return chain(o, j.sx, j.sy, a1, a2, UPPER, FORE);
    var x = tgt[1], y = tgt[2];
    if (tgt[0] === 'h') {
      var c = Math.cos(j.ht), s = Math.sin(j.ht), u = x * R, v = y * R;
      x = j.hx + u * c - v * s;
      y = j.hy + u * s + v * c;
    }
    reach(o, j.sx, j.sy, x, y, UPPER, FORE, x >= j.sx ? -1 : 1);
  }

  function toWorld(f, u, v, out) {
    var p = f.p, c = Math.cos(p.rot), s = Math.sin(p.rot);
    u *= p.sx;
    out[0] = f.x + f.face * (u * c - v * s) * f.L;
    out[1] = f.y - f.z + (u * s + v * c + f.gOff) * f.L;
    return out;
  }

  function rig(f) {
    var p = f.p, j = f.j;
    var sl = Math.sin(p.lean), cl = Math.cos(p.lean);
    j.nx = sl * TORSO; j.ny = -cl * TORSO;
    j.sx = sl * SH; j.sy = -cl * SH;
    j.ht = p.lean + p.tilt;
    j.hx = j.nx + Math.sin(j.ht) * R * 1.05;
    j.hy = j.ny - Math.cos(j.ht) * R * 1.05;
    chain(j.lf, 0, 0, p.lf1, p.lf2, THIGH, SHIN);
    chain(j.lb, 0, 0, p.lb1, p.lb2, THIGH, SHIN);
    arm(j, j.af, p.hf, p.af1, p.af2);
    arm(j, j.ab, p.hb, p.ab1, p.ab2);

    // Ställ figuren på marken: lägsta punkten (fötter, knän, händer, höft)
    // efter rotationen hamnar på y = 0. Liggande räknar även huvudet.
    var c = Math.cos(p.rot), s = Math.sin(p.rot), k = p.sx * s, m = 0;
    m = Math.max(m, j.lf[0] * k + j.lf[1] * c, j.lf[2] * k + j.lf[3] * c + 0.015);
    m = Math.max(m, j.lb[0] * k + j.lb[1] * c, j.lb[2] * k + j.lb[3] * c + 0.015);
    m = Math.max(m, j.af[2] * k + j.af[3] * c, j.ab[2] * k + j.ab[3] * c);
    if (Math.abs(s) > 0.5) m = Math.max(m, j.hx * k + j.hy * c + R * 0.9);
    f.gOff = -m;

    var w = toWorld(f, j.hx, j.hy, f.tmp);
    f.hx = w[0]; f.hy = w[1]; f.hr = R * f.L;
    toWorld(f, j.af[2], j.af[3], f.wh);

    // fästpunkt för det figuren håller i
    var ix = j.af[2], iy = j.af[3];
    if (p.item === 'balloon') {
      var ch = Math.cos(j.ht), sh = Math.sin(j.ht);
      j.mx = j.hx - 0.5 * R * sh;
      j.my = j.hy + 0.5 * R * ch;
      ix = j.mx + p.ir * 0.95;
      iy = j.my - p.ir * 0.15;
    } else if (p.item === 'wand') {
      iy -= 0.075;
    } else if (p.item === 'pistol') {
      ix += 0.11; iy -= 0.03;
    }
    j.ix = ix; j.iy = iy;
    toWorld(f, ix, iy, f.wi);
  }

  // ---------------------------------------------------------------- uppdatering
  function updateFig(f, dt) {
    var A = ACT[f.a], name = f.a;
    f.L = depthL(f.y);
    f.t += dt;
    if (f.textT > 0) f.textT -= dt;
    if (f.starsT > 0) f.starsT -= dt;
    if (f.beard > 0) f.beard -= dt;
    if (f.wetT > 0) {
      f.wetT -= dt;
      if (Math.random() < 5 * dt) {
        emit('drop', f.hx + rand(-1, 1) * f.hr, f.hy + f.hr * 0.6, 0, 40 * scale, 0.5, f.L * 0.011, '#74c0fc');
      }
    }

    if (A.update) A.update(f, dt);
    if (f.a === name && f.t >= f.dur) (A.end || finish)(f);

    A = ACT[f.a];
    if (!A.ownZ && (f.z > 0 || f.vz > 0)) {
      f.vz -= 7 * f.L * dt;
      f.z += f.vz * dt;
      if (f.z <= 0) { f.z = 0; f.vz = 0; }
    }

    resetPose(f.p);
    A.pose(f, f.p);
    rig(f);
  }

  function updateParts(dt) {
    var g = 900 * scale;
    for (var i = parts.length - 1; i >= 0; i--) {
      var q = parts[i];
      q.t += dt;
      if (q.t >= q.life) {
        if (q.type === 'bubble') emit('ripple', q.x, q.y, 0, 0, 0.25, q.s, 'rgba(120, 180, 235,');
        parts[i] = parts[parts.length - 1];
        parts.pop();
        continue;
      }
      switch (q.type) {
        case 'bubble':
          q.vy -= 12 * scale * dt;
          q.vx *= 1 - 0.6 * dt;
          q.vy *= 1 - 0.4 * dt;
          q.x += (q.vx + Math.sin(q.t * 3 + q.r) * 20 * scale) * dt;
          q.y += q.vy * dt;
          break;
        case 'confetti':
          q.vy += g * dt;
          q.vx *= 1 - 1.5 * dt;
          q.vy *= 1 - 2.5 * dt;
          q.x += (q.vx + Math.sin(q.t * 6 + q.r) * 40 * scale) * dt;
          q.y += q.vy * dt;
          q.r += q.w * dt;
          break;
        case 'shred':
        case 'peel':
          q.vy += g * dt;
          q.vx *= 1 - 1.2 * dt;
          q.x += q.vx * dt;
          q.y += q.vy * dt;
          q.r += q.w * dt;
          break;
        case 'drop':
          q.vy += DROP_G * scale * dt;
          q.x += q.vx * dt;
          q.y += q.vy * dt;
          break;
        case 'note':
          q.x += (q.vx + Math.sin(q.t * 4 + q.r) * 30 * scale) * dt;
          q.y += q.vy * dt;
          break;
        default:
          q.x += q.vx * dt;
          q.y += q.vy * dt;
      }
    }
    for (i = pops.length - 1; i >= 0; i--) {
      pops[i].t += dt;
      if (pops[i].t >= pops[i].life) pops.splice(i, 1);
    }
    for (i = props.length - 1; i >= 0; i--) {
      props[i].t += dt;
      if (props[i].t >= props[i].life) props.splice(i, 1);
    }
  }

  function update(dt) {
    dt *= settings.speed;
    clock += dt;
    for (var i = 0; i < count; i++) updateFig(figs[i], dt);
    updateParts(dt);
  }

  // ---------------------------------------------------------------- ritning: figur
  function stroke3(g, x0, y0, x1, y1, x2, y2) {
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  }

  function shoe(g, o, col) {
    g.beginPath();
    g.ellipse(o[2] + 0.025, o[3] - 0.004, 0.05, 0.024, 0, 0, TWO_PI);
    g.fillStyle = col;
    g.fill();
    g.lineWidth = 0.012;
    g.stroke();
    g.lineWidth = LW;
  }

  function hand(g, o, skin) {
    g.beginPath();
    g.arc(o[2], o[3], 0.032, 0, TWO_PI);
    g.fillStyle = skin;
    g.fill();
    g.lineWidth = 0.012;
    g.stroke();
    g.lineWidth = LW;
  }

  // Spretande, viftande fingrar i handens riktning.
  function fingers(g, o) {
    var a = Math.atan2(o[2] - o[0], o[3] - o[1]);
    g.lineWidth = 0.014;
    g.beginPath();
    for (var k = -1; k <= 1; k++) {
      var b = a + k * 0.55 + Math.sin(clock * 22 + k) * 0.25;
      g.moveTo(o[2], o[3]);
      g.lineTo(o[2] + Math.sin(b) * 0.04, o[3] + Math.cos(b) * 0.04);
    }
    g.stroke();
    g.lineWidth = LW;
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function lowerClothes(g, f) {
    var k = f.look, j = f.j;
    g.lineWidth = 0.012;
    if (k.bottom === 'leopard' || k.bottom === 'skirt') {
      g.beginPath();
      g.moveTo(-0.07, -0.025);
      g.lineTo(0.07, -0.025);
      g.lineTo(0.125, 0.14);
      g.quadraticCurveTo(0, 0.165, -0.125, 0.14);
      g.closePath();
      g.fillStyle = k.bottom === 'leopard' ? '#ecdcc6' : k.cloth;
      g.fill();
      if (k.bottom === 'leopard') {
        g.save();
        g.clip();
        for (var i = 0; i < SPOTS.length; i++) {
          var s = SPOTS[i];
          g.beginPath();
          g.ellipse(s[0], s[1], s[2] * 1.2, s[2], 0.3, 0, TWO_PI);
          g.fillStyle = '#4b3427';
          g.fill();
          g.beginPath();
          g.ellipse(s[0], s[1], s[2] * 0.6, s[2] * 0.5, 0.3, 0, TWO_PI);
          g.fillStyle = '#b58a5e';
          g.fill();
        }
        g.restore();
        g.beginPath();
        g.moveTo(-0.07, -0.025);
        g.lineTo(0.07, -0.025);
        g.lineTo(0.125, 0.14);
        g.quadraticCurveTo(0, 0.165, -0.125, 0.14);
        g.closePath();
      }
      g.stroke();
    } else {
      // shorts: korta tjocka stumpar längs låren
      for (var n = 0; n < 2; n++) {
        var o = n ? j.lf : j.lb;
        var ex = o[0] * 0.5, ey = o[1] * 0.5;
        g.beginPath();
        g.moveTo(0, -0.01);
        g.lineTo(ex, ey);
        g.strokeStyle = INK;
        g.lineWidth = 0.085;
        g.stroke();
        g.strokeStyle = k.cloth;
        g.lineWidth = 0.065;
        g.stroke();
      }
      g.strokeStyle = INK;
    }
    g.lineWidth = LW;
  }

  function drawItem(g, f) {
    var p = f.p, j = f.j, hx = j.af[2], hy = j.af[3];
    g.lineWidth = 0.012;
    switch (p.item) {
      case 'balloon': {
        var r = p.ir;
        g.beginPath();
        g.ellipse(j.ix, j.iy, r * 1.05, r * 0.95, -0.15, 0, TWO_PI);
        g.fillStyle = f.col;
        g.fill();
        g.stroke();
        g.beginPath();
        g.ellipse(j.ix + r * 0.3, j.iy - r * 0.45, r * 0.22, r * 0.12, -0.5, 0, TWO_PI);
        g.fillStyle = 'rgba(255,255,255,0.6)';
        g.fill();
        break;
      }
      case 'wand':
        g.beginPath();
        g.moveTo(hx, hy + 0.01);
        g.lineTo(j.ix, j.iy + 0.03);
        g.strokeStyle = '#c2255c';
        g.lineWidth = 0.014;
        g.stroke();
        g.beginPath();
        g.arc(j.ix, j.iy, 0.03, 0, TWO_PI);
        g.fillStyle = 'rgba(180, 220, 255, 0.35)';
        g.fill();
        g.stroke();
        g.strokeStyle = INK;
        break;
      case 'pistol':
        roundRect(g, hx - 0.025, hy - 0.05, 0.13, 0.04, 0.015);
        g.fillStyle = '#40c057';
        g.fill();
        g.stroke();
        g.beginPath();
        g.arc(hx + 0.035, hy - 0.065, 0.025, 0, TWO_PI);
        g.fillStyle = '#ffd43b';
        g.fill();
        g.stroke();
        roundRect(g, hx - 0.015, hy - 0.015, 0.028, 0.05, 0.01);
        g.fillStyle = '#fd7e14';
        g.fill();
        g.stroke();
        break;
      case 'marker':
        g.beginPath();
        g.moveTo(hx - 0.01, hy - 0.03);
        g.lineTo(hx + 0.03, hy + 0.06);
        g.lineWidth = 0.022;
        g.stroke();
        break;
      case 'peel':
        drawPeel(g, hx + 0.02, hy, 0.06, 0, 1);
        break;
      case 'cushion':
        g.beginPath();
        g.ellipse(hx + 0.06, hy, 0.09, 0.04, 0, 0, TWO_PI);
        g.fillStyle = '#ff8fab';
        g.fill();
        g.stroke();
        break;
    }
    g.lineWidth = LW;
  }

  function drawFig(g, f) {
    var p = f.p, j = f.j, k = f.look;
    g.save();
    g.translate(f.x, f.y - f.z);
    g.scale(f.face * f.L, f.L);
    g.translate(0, f.gOff);
    g.rotate(p.rot);
    if (p.sx !== 1) g.scale(p.sx, 1);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = INK;
    g.lineWidth = LW;

    if (!p.front) stroke3(g, j.sx, j.sy, j.ab[0], j.ab[1], j.ab[2], j.ab[3]);
    stroke3(g, 0, 0, j.lb[0], j.lb[1], j.lb[2], j.lb[3]);
    shoe(g, j.lb, k.shoes);

    if (k.pack) {
      g.save();
      g.rotate(p.lean);
      g.lineWidth = 0.012;
      roundRect(g, -0.12, -0.25, 0.09, 0.15, 0.03);
      g.fillStyle = k.pack;
      g.fill();
      g.stroke();
      roundRect(g, -0.112, -0.16, 0.06, 0.05, 0.015);
      g.fillStyle = '#f7b5cf';
      g.fill();
      g.stroke();
      g.restore();
      g.lineWidth = LW;
    }

    stroke3(g, 0, 0, j.lf[0], j.lf[1], j.lf[2], j.lf[3]);
    shoe(g, j.lf, k.shoes);
    lowerClothes(g, f);

    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(j.nx, j.ny);
    g.stroke();
    if (k.pack) {
      // axelremmen
      g.save();
      g.rotate(p.lean);
      g.beginPath();
      g.moveTo(-0.035, -0.23);
      g.quadraticCurveTo(0.03, -0.2, 0.012, -0.12);
      g.strokeStyle = k.pack;
      g.lineWidth = 0.016;
      g.stroke();
      g.restore();
      g.strokeStyle = INK;
      g.lineWidth = LW;
    }
    if (!p.front) {
      stroke3(g, j.sx, j.sy, j.af[0], j.af[1], j.af[2], j.af[3]);
      if (p.fingers) { fingers(g, j.af); fingers(g, j.ab); }
    }

    g.save();
    g.translate(j.hx, j.hy);
    g.rotate(j.ht);
    g.scale(R, R);
    drawHead(g, f, p.expr);
    g.restore();

    if (p.front) {
      stroke3(g, j.sx, j.sy, j.ab[0], j.ab[1], j.ab[2], j.ab[3]);
      stroke3(g, j.sx, j.sy, j.af[0], j.af[1], j.af[2], j.af[3]);
      hand(g, j.ab, k.skin);
      hand(g, j.af, k.skin);
    }
    if (p.item) drawItem(g, f);
    g.restore();
  }

  // ---------------------------------------------------------------- ritning: huvud
  // Huvudet ritas i huvudradier: mitten i origo, ansiktet mot betraktaren.
  function drawHead(g, f, ex) {
    var k = f.look;
    g.strokeStyle = INK;
    g.lineWidth = 0.15;
    hairBack(g, k);

    g.beginPath();
    g.arc(0, 0, 1, 0, TWO_PI);
    g.fillStyle = k.skin;
    g.fill();
    g.stroke();

    var big = ex === 'blow';
    g.fillStyle = big ? 'rgba(240, 100, 110, 0.45)' : 'rgba(240, 110, 120, 0.32)';
    g.beginPath();
    g.arc(-0.56, 0.3, big ? 0.28 : 0.18, 0, TWO_PI);
    g.fill();
    g.beginPath();
    g.arc(0.58, 0.3, big ? 0.28 : 0.18, 0, TWO_PI);
    g.fill();

    eyes(g, k, ex);

    g.lineWidth = 0.1;
    g.beginPath();
    g.arc(0.03, 0.1, 0.09, -0.4, 1.7);
    g.stroke();

    mouth(g, k, ex);
    if (f.beard > 0 && f.beardKind === 0) mustache(g);
    g.lineWidth = 0.15;
    hairFront(g, k);
    if (f.beard > 0 && f.beardKind === 1) glasses(g);
  }

  function eyes(g, k, ex) {
    g.lineWidth = 0.11;
    for (var i = -1; i <= 1; i += 2) {
      var x = i * 0.36;
      g.beginPath();
      if (ex === 'laugh') {
        g.arc(x, 0.02, 0.13, Math.PI * 1.1, Math.PI * 1.9);
        g.stroke();
      } else if (ex === 'sleep') {
        g.arc(x, -0.12, 0.13, 0.15 * Math.PI, 0.85 * Math.PI);
        g.stroke();
      } else if (ex === 'dizzy') {
        for (var a = 0; a < 11; a += 0.5) {
          var r = 0.018 * a;
          var px = x + Math.cos(a + clock * 8 * i) * r, py = -0.08 + Math.sin(a + clock * 8 * i) * r;
          if (a === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.lineWidth = 0.07;
        g.stroke();
        g.lineWidth = 0.11;
      } else if (ex === 'wet') {
        g.moveTo(x - i * 0.12, -0.2);
        g.lineTo(x + i * 0.08, -0.09);
        g.lineTo(x - i * 0.12, 0.02);
        g.stroke();
      } else if (ex === 'scared' || ex === 'o') {
        g.arc(x, -0.1, ex === 'scared' ? 0.2 : 0.16, 0, TWO_PI);
        g.fillStyle = '#fff';
        g.fill();
        g.lineWidth = 0.07;
        g.stroke();
        g.lineWidth = 0.11;
        g.beginPath();
        g.arc(x + 0.02, -0.07, 0.075, 0, TWO_PI);
        g.fillStyle = INK;
        g.fill();
      } else {
        g.ellipse(x, -0.08, 0.11, 0.15, 0, 0, TWO_PI);
        g.fillStyle = INK;
        g.fill();
        g.beginPath();
        g.arc(x + 0.035, -0.13, 0.045, 0, TWO_PI);
        g.fillStyle = '#fff';
        g.fill();
        if (ex === 'sneaky') {
          // halvstängda ögonlock
          g.beginPath();
          g.rect(x - 0.17, -0.3, 0.34, 0.2);
          g.fillStyle = k.skin;
          g.fill();
          g.beginPath();
          g.moveTo(x - 0.15, -0.1);
          g.lineTo(x + 0.15, -0.1);
          g.lineWidth = 0.08;
          g.stroke();
          g.lineWidth = 0.11;
        }
      }
      if (ex === 'scared') {
        g.beginPath();
        g.moveTo(x - 0.15, -0.42);
        g.quadraticCurveTo(x, -0.52, x + 0.15, -0.44);
        g.lineWidth = 0.08;
        g.stroke();
        g.lineWidth = 0.11;
      }
    }
  }

  function mouthPath(g, w, d) {
    g.beginPath();
    g.moveTo(-w, 0.3);
    g.quadraticCurveTo(0, 0.36, w, 0.3);
    g.quadraticCurveTo(w * 0.75, 0.3 + d, 0, 0.3 + d);
    g.quadraticCurveTo(-w * 0.75, 0.3 + d, -w, 0.3);
    g.closePath();
  }

  // Öppen mun med tänder – och glugg om figuren har en.
  function openMouth(g, k, w, d) {
    mouthPath(g, w, d);
    g.fillStyle = '#7d2433';
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = '#fff';
    g.fillRect(-w, 0.2, 2 * w, 0.25);
    if (k.gap) {
      g.fillStyle = '#7d2433';
      g.fillRect(0.06, 0.3, 0.12, 0.16);
    }
    g.beginPath();
    g.ellipse(0, 0.3 + d, w * 0.55, d * 0.4, 0, 0, TWO_PI);
    g.fillStyle = '#e8707f';
    g.fill();
    g.restore();
    mouthPath(g, w, d);
    g.lineWidth = 0.1;
    g.stroke();
  }

  function mouth(g, k, ex) {
    g.lineWidth = 0.1;
    g.fillStyle = '#7d2433';
    switch (ex) {
      case 'laugh':
        openMouth(g, k, 0.5, 0.52);
        break;
      case 'tongue':
        openMouth(g, k, 0.4, 0.32);
        g.beginPath();
        g.ellipse(0.02, 0.72, 0.17, 0.24, 0, 0, TWO_PI);
        g.fillStyle = '#ef6f86';
        g.fill();
        g.stroke();
        g.beginPath();
        g.moveTo(0.02, 0.6);
        g.lineTo(0.02, 0.8);
        g.lineWidth = 0.05;
        g.stroke();
        break;
      case 'scared':
        g.beginPath();
        g.ellipse(0, 0.52, 0.17, 0.24, 0, 0, TWO_PI);
        g.fill();
        g.stroke();
        break;
      case 'o':
      case 'blow':
        g.beginPath();
        g.ellipse(0.03, 0.5, ex === 'o' ? 0.11 : 0.09, ex === 'o' ? 0.14 : 0.09, 0, 0, TWO_PI);
        g.fill();
        g.stroke();
        break;
      case 'sleep':
        g.beginPath();
        g.ellipse(0, 0.5, 0.07, 0.05, 0, 0, TWO_PI);
        g.fill();
        break;
      case 'smile':
        g.beginPath();
        g.arc(0, 0.12, 0.42, 0.2 * Math.PI, 0.8 * Math.PI);
        g.stroke();
        break;
      case 'sneaky':
        g.beginPath();
        g.moveTo(-0.32, 0.42);
        g.quadraticCurveTo(0.1, 0.62, 0.42, 0.3);
        g.stroke();
        break;
      case 'wet':
      case 'dizzy':
        g.beginPath();
        g.moveTo(-0.35, 0.5);
        for (var i = 1; i <= 4; i++) {
          g.quadraticCurveTo(-0.35 + (i - 0.5) * 0.175, i % 2 ? 0.38 : 0.62, -0.35 + i * 0.175, 0.5);
        }
        g.stroke();
        break;
      default:
        openMouth(g, k, 0.42, 0.42);
    }
  }

  function mustache(g) {
    g.beginPath();
    g.moveTo(0, 0.24);
    g.bezierCurveTo(0.25, 0.1, 0.5, 0.28, 0.66, 0.08);
    g.bezierCurveTo(0.66, 0.4, 0.25, 0.44, 0, 0.33);
    g.bezierCurveTo(-0.25, 0.44, -0.66, 0.4, -0.66, 0.08);
    g.bezierCurveTo(-0.5, 0.28, -0.25, 0.1, 0, 0.24);
    g.fillStyle = INK;
    g.fill();
  }

  function glasses(g) {
    g.lineWidth = 0.09;
    g.beginPath();
    g.arc(-0.36, -0.08, 0.24, 0, TWO_PI);
    g.moveTo(0.6, -0.08);
    g.arc(0.36, -0.08, 0.24, 0, TWO_PI);
    g.moveTo(-0.12, -0.12);
    g.quadraticCurveTo(0, -0.2, 0.12, -0.12);
    g.moveTo(-0.6, -0.12);
    g.lineTo(-0.95, -0.2);
    g.moveTo(0.6, -0.12);
    g.lineTo(0.95, -0.2);
    g.stroke();
  }

  function hairBack(g, k) {
    g.fillStyle = k.hair;
    var s;
    switch (k.style) {
      case 'long':
        g.beginPath();
        g.arc(0, -0.06, 1.12, Math.PI, TWO_PI);
        g.lineTo(1.16, 1.32);
        g.quadraticCurveTo(0, 1.5, -1.16, 1.32);
        g.closePath();
        g.fill();
        g.stroke();
        break;
      case 'pigtails':
        for (s = -1; s <= 1; s += 2) {
          g.beginPath();
          g.ellipse(s * 1.22, 0.3, 0.3, 0.5, -s * 0.35, 0, TWO_PI);
          g.fillStyle = k.hair;
          g.fill();
          g.stroke();
          g.beginPath();
          g.arc(s * 1.0, -0.12, 0.14, 0, TWO_PI);
          g.fillStyle = k.tie;
          g.fill();
          g.stroke();
        }
        break;
      case 'curly':
        for (var a = 0.85 * Math.PI; a <= 2.16 * Math.PI; a += 0.16 * Math.PI) {
          g.beginPath();
          g.arc(Math.cos(a) * 1.0, Math.sin(a) * 1.0 - 0.05, 0.36, 0, TWO_PI);
          g.fill();
          g.stroke();
        }
        break;
    }
  }

  function hairFront(g, k) {
    var s;
    g.fillStyle = k.hair;
    g.strokeStyle = INK;
    switch (k.style) {
      case 'long':
        // lugg med bena och raka slingor ner över axlarna
        g.beginPath();
        g.moveTo(-1.09, -0.2);
        g.arc(0, -0.06, 1.1, Math.PI + 0.13, TWO_PI - 0.13);
        g.quadraticCurveTo(0.8, -0.72, 0.22, -0.68);
        g.quadraticCurveTo(-0.3, -0.78, -1.09, -0.2);
        g.closePath();
        g.fill();
        g.stroke();
        for (s = -1; s <= 1; s += 2) {
          g.beginPath();
          g.moveTo(s * 0.9, -0.5);
          g.quadraticCurveTo(s * 1.12, 0.3, s * 1.05, 1.3);
          g.lineWidth = 0.44;
          g.strokeStyle = INK;
          g.stroke();
          g.lineWidth = 0.3;
          g.strokeStyle = k.hair;
          g.stroke();
        }
        g.strokeStyle = k.hairDark;
        g.lineWidth = 0.06;
        g.beginPath();
        g.moveTo(0.22, -0.7);
        g.quadraticCurveTo(0.2, -0.95, 0.08, -1.12);
        g.moveTo(0.5, -0.76);
        g.quadraticCurveTo(0.85, -0.62, 0.97, -0.3);
        g.moveTo(-0.15, -0.8);
        g.quadraticCurveTo(-0.7, -0.78, -0.97, -0.35);
        for (s = -1; s <= 1; s += 2) {
          g.moveTo(s * 1.02, 0.1);
          g.quadraticCurveTo(s * 1.08, 0.7, s * 1.02, 1.25);
        }
        g.stroke();
        break;
      case 'short':
        g.beginPath();
        g.moveTo(-1.04, -0.3);
        g.arc(0, -0.05, 1.07, Math.PI + 0.24, TWO_PI - 0.24);
        g.lineTo(0.75, -0.5);
        g.lineTo(0.5, -0.64);
        g.lineTo(0.25, -0.48);
        g.lineTo(0, -0.64);
        g.lineTo(-0.25, -0.48);
        g.lineTo(-0.5, -0.64);
        g.lineTo(-0.75, -0.5);
        g.closePath();
        g.fill();
        g.stroke();
        break;
      case 'pigtails':
        g.beginPath();
        g.moveTo(-1.05, -0.25);
        g.arc(0, -0.05, 1.07, Math.PI + 0.19, TWO_PI - 0.19);
        g.quadraticCurveTo(0.5, -0.55, 0, -0.74);
        g.quadraticCurveTo(-0.5, -0.55, -1.05, -0.25);
        g.closePath();
        g.fill();
        g.stroke();
        break;
      case 'curly':
        for (s = -0.6; s <= 0.61; s += 0.3) {
          g.beginPath();
          g.arc(s, -0.8 + 0.12 * Math.abs(s), 0.22, 0, TWO_PI);
          g.fill();
          g.stroke();
        }
        break;
      case 'spiky':
        g.beginPath();
        g.moveTo(-1.0, -0.3);
        g.lineTo(-0.85, -1.3);
        g.lineTo(-0.55, -0.85);
        g.lineTo(-0.3, -1.45);
        g.lineTo(0, -0.9);
        g.lineTo(0.3, -1.45);
        g.lineTo(0.55, -0.85);
        g.lineTo(0.85, -1.3);
        g.lineTo(1.0, -0.3);
        g.quadraticCurveTo(0, -0.8, -1.0, -0.3);
        g.closePath();
        g.fill();
        g.stroke();
        break;
      case 'cap':
        for (s = -1; s <= 1; s += 2) {
          g.beginPath();
          g.arc(s * 0.92, -0.1, 0.2, 0, TWO_PI);
          g.fill();
        }
        g.beginPath();
        g.arc(0, -0.2, 1.05, Math.PI, TWO_PI);
        g.closePath();
        g.fillStyle = k.cap;
        g.fill();
        g.stroke();
        g.beginPath();
        g.ellipse(0.75, -0.22, 0.7, 0.13, 0, 0, TWO_PI);
        g.fill();
        g.stroke();
        g.beginPath();
        g.arc(0, -1.22, 0.1, 0, TWO_PI);
        g.fill();
        g.stroke();
        break;
    }
    g.lineWidth = 0.15;
    g.strokeStyle = INK;
  }

  // ---------------------------------------------------------------- ritning: resten
  function drawPeel(g, x, y, s, rot, flat) {
    g.save();
    g.translate(x, y);
    g.scale(1, flat);
    g.rotate(rot);
    var lw = g.lineWidth;
    g.lineWidth = s * 0.12;
    g.strokeStyle = INK;
    for (var i = 0; i < 3; i++) {
      var a = -Math.PI / 2 + (i - 1) * 1.15;
      g.beginPath();
      g.ellipse(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.62, s * 0.22, a, 0, TWO_PI);
      g.fillStyle = '#ffd43b';
      g.fill();
      g.stroke();
    }
    g.beginPath();
    g.ellipse(0, s * 0.1, s * 0.3, s * 0.25, 0, 0, TWO_PI);
    g.fillStyle = '#f5c518';
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(0, s * 0.3);
    g.lineTo(0, s * 0.55);
    g.strokeStyle = '#6b4a1d';
    g.lineWidth = s * 0.18;
    g.stroke();
    g.lineWidth = lw;
    g.restore();
  }

  function drawProps(ctx) {
    ctx.strokeStyle = INK;
    for (var i = 0; i < props.length; i++) {
      var pr = props[i];
      ctx.globalAlpha = Math.min(1, (pr.life - pr.t) * 2);
      if (pr.type === 'peel') {
        drawPeel(ctx, pr.x, pr.y - pr.L * 0.01, pr.L * 0.1, pr.rot, 0.55);
      } else {
        var rx = pr.L * (pr.squash ? 0.15 : 0.13), ry = pr.L * (pr.squash ? 0.025 : 0.045);
        ctx.lineWidth = Math.max(1, pr.L * 0.012);
        ctx.beginPath();
        ctx.ellipse(pr.x, pr.y - ry, rx, ry, 0, 0, TWO_PI);
        ctx.fillStyle = '#ff8fab';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(pr.x + rx * 1.05, pr.y - ry, rx * 0.15, ry * 0.5, 0, 0, TWO_PI);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function star(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r;
      if (i) ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
      else ctx.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawStars(ctx, f) {
    ctx.globalAlpha = Math.min(1, f.starsT * 2);
    ctx.fillStyle = '#ffd43b';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, f.L * 0.008);
    for (var k = 0; k < 3; k++) {
      var a = clock * 4 + k * TWO_PI / 3;
      star(ctx, f.hx + Math.cos(a) * f.hr * 1.4, f.hy - f.hr * 1.2 + Math.sin(a) * f.hr * 0.35, f.hr * 0.3);
    }
    ctx.globalAlpha = 1;
  }

  function drawNote(ctx, x, y, s) {
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.32, s * 0.24, -0.4, 0, TWO_PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.28, y - s * 0.05);
    ctx.lineTo(x + s * 0.28, y - s);
    ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.7, x + s * 0.7, y - s * 0.55);
    ctx.lineWidth = s * 0.12;
    ctx.stroke();
  }

  function drawParts(ctx) {
    for (var i = 0; i < parts.length; i++) {
      var q = parts[i], left = q.life - q.t, a = Math.min(1, left * 4);
      ctx.globalAlpha = a;
      switch (q.type) {
        case 'bubble':
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.s, 0, TWO_PI);
          ctx.fillStyle = 'rgba(190, 225, 255, 0.25)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(90, 150, 220, 0.9)';
          ctx.lineWidth = Math.max(1, q.s * 0.08);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.s * 0.7, -2.4, -1.6);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.stroke();
          break;
        case 'confetti':
        case 'shred':
          ctx.save();
          ctx.translate(q.x, q.y);
          ctx.rotate(q.r);
          ctx.scale(q.type === 'confetti' ? Math.cos(q.t * 9 + q.r) : 1, 1);
          ctx.fillStyle = q.col;
          ctx.fillRect(-q.s, -q.s * 0.5, q.s * 2, q.s);
          ctx.restore();
          break;
        case 'drop':
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.s, 0, TWO_PI);
          ctx.fillStyle = q.col;
          ctx.fill();
          break;
        case 'ripple':
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.s * (1 + 3 * q.t / q.life), 0, TWO_PI);
          ctx.strokeStyle = q.col + (1 - q.t / q.life).toFixed(2) + ')';
          ctx.lineWidth = Math.max(1, q.s * 0.25);
          ctx.globalAlpha = 1;
          ctx.stroke();
          break;
        case 'note':
          ctx.fillStyle = ctx.strokeStyle = q.col;
          drawNote(ctx, q.x, q.y, q.s);
          break;
        case 'z':
          ctx.font = 'bold ' + Math.round(q.s * (0.7 + 0.6 * q.t / q.life)) + 'px ' + FONT;
          ctx.fillStyle = INK;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Z', q.x, q.y);
          break;
        case 'cloud':
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.s * (1 + q.t), 0, TWO_PI);
          ctx.fillStyle = 'rgba(170, 200, 130, ' + (0.5 * (1 - q.t / q.life)).toFixed(2) + ')';
          ctx.globalAlpha = 1;
          ctx.fill();
          break;
        case 'peel':
          ctx.lineWidth = Math.max(1, q.s * 0.12);
          drawPeel(ctx, q.x, q.y, q.s, q.r, 1);
          break;
      }
    }
    ctx.globalAlpha = 1;
  }

  // Pratbubblorna läggs ut nerifrån och upp; en bubbla som skulle täcka en
  // annan flyttas upp ovanför den.
  var placed = [];
  function drawBubbles(ctx) {
    var fs = Math.max(14, Math.round(baseL * 0.13));
    var pad = fs * 0.5, bh = fs * 1.6, gap = fs * 0.2;
    ctx.font = 'bold ' + fs + 'px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(1.5, 2.5 * scale);
    placed.length = 0;
    for (var n = count - 1; n >= 0; n--) {
      var f = sorted[n];
      if (f.textT <= 0) continue;
      var bw = ctx.measureText(f.text).width + pad * 2;
      var cx = f.hx, x = clamp(cx - bw / 2, 4, W - 4 - bw), y = f.hy - f.hr * 1.5 - bh;
      for (var tries = 0, moved = true; moved && tries < 12; tries++) {
        moved = false;
        for (var i = 0; i < placed.length; i++) {
          var b = placed[i];
          if (x < b.x + b.w && x + bw > b.x && y < b.y + bh + gap && y + bh + gap > b.y) {
            y = b.y - bh - gap;
            moved = true;
          }
        }
      }
      y = Math.max(4, y);
      placed.push({ x: x, y: y, w: bw });

      ctx.globalAlpha = Math.min(1, f.textT * 3);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = INK;
      roundRect(ctx, x, y, bw, bh, bh * 0.4);
      ctx.fill();
      ctx.stroke();
      // pil mot huvudet
      var tx = clamp(cx, x + bh * 0.5, x + bw - bh * 0.5), ty = Math.min(f.hy - f.hr * 1.1, y + bh + fs * 0.45);
      ctx.beginPath();
      ctx.moveTo(tx - fs * 0.3, y + bh - 1);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx + fs * 0.3, y + bh - 1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx - fs * 0.3, y + bh);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx + fs * 0.3, y + bh);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.fillText(f.text, x + bw / 2, y + bh / 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawPops(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (var i = 0; i < pops.length; i++) {
      var q = pops[i], k = Math.min(1, q.t / 0.12) * (1 + 0.15 * Math.max(0, 1 - q.t / 0.3));
      ctx.save();
      ctx.globalAlpha = Math.min(1, (q.life - q.t) * 4);
      ctx.translate(q.x, Math.max(q.s * 0.6, q.y - q.t * q.s * 0.3));
      ctx.rotate(q.r);
      ctx.scale(k, k);
      ctx.font = '900 ' + Math.round(q.s) + 'px Impact, "Arial Black", ' + FONT;
      ctx.lineWidth = q.s * 0.16;
      ctx.strokeStyle = INK;
      ctx.strokeText(q.text, 0, 0);
      ctx.fillStyle = q.col;
      ctx.fillText(q.text, 0, 0);
      ctx.restore();
    }
  }

  function draw(ctx) {
    var i, f;
    sorted.length = count;
    for (i = 0; i < count; i++) sorted[i] = figs[i];
    sorted.sort(function (a, b) { return a.y - b.y; });

    // skuggor
    ctx.fillStyle = 'rgba(30, 30, 50, 0.13)';
    ctx.beginPath();
    for (i = 0; i < count; i++) {
      f = sorted[i];
      var k = 1 / (1 + f.z / f.L), lie = Math.abs(Math.sin(f.p.rot));
      var rx = f.L * (0.17 + 0.3 * lie) * k, ry = f.L * 0.04 * k;
      var cx = f.x + f.face * Math.sin(f.p.rot) * f.L * 0.2;
      ctx.moveTo(cx + rx, f.y);
      ctx.ellipse(cx, f.y, rx, ry, 0, 0, TWO_PI);
    }
    ctx.fill();

    drawProps(ctx);
    for (i = 0; i < count; i++) drawFig(ctx, sorted[i]);
    drawParts(ctx);
    for (i = 0; i < count; i++) if (sorted[i].starsT > 0) drawStars(ctx, sorted[i]);
    drawBubbles(ctx);
    drawPops(ctx);
  }

  // ---------------------------------------------------------------- motor
  function setCount(n) {
    n = clamp(n | 0, 0, MAX);
    var i;
    for (i = n; i < count; i++) { figs[i].alive = false; release(figs[i]); }
    for (i = count; i < n; i++) { figs[i] = makeFig(i); place(figs[i]); }
    count = n;
  }

  function scatter() {
    for (var i = 0; i < count; i++) {
      release(figs[i]);
      figs[i].by = null;
      place(figs[i]);
    }
  }

  function layout(world, s) {
    W = world.W;
    H = world.H;
    scale = world.scale;
    settings = s;
    baseL = BASE_H * scale * s.size;
    xMin = baseL * 0.4;
    xMax = Math.max(xMin, W - baseL * 0.4);
    yTop = Math.min(H * 0.75, baseL * 1.15 + 50 * scale);
    yBot = Math.max(yTop, H - 12 * scale);
    for (var i = 0; i < count; i++) {
      var f = figs[i];
      f.x = clamp(f.x, xMin, xMax);
      f.y = clamp(f.y, yTop, yBot);
      f.gx = clamp(f.gx, xMin, xMax);
      f.gy = clamp(f.gy, yTop, yBot);
    }
  }

  window.Projector.register({
    id: 'kids',
    label: 'Kids',
    unit: 'barn',
    background: '#fff',
    defaults: { count: 4, speed: 1, size: 1 },
    limits: { count: [1, MAX], speed: [0.2, 3], size: [0.4, 2.5] },
    layout: layout,
    setCount: setCount,
    scatter: scatter,
    update: update,
    draw: draw,
    release: function () { figs = []; count = 0; parts = []; pops = []; props = []; }
  });
})();
