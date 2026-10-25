/*
 * Läge "Kids" – streckgubbar som hittar på bus.
 *
 * Fyra barn, lika långa som sin ålder:
 *   Ida (6)    – långt ljust hår med bena åt sidan, glugg mellan tänderna,
 *                ljus t-shirt, leopardkjol, rosa ryggsäck och rosa skor
 *   Althea (5) – rosa keps med Stitch, ljust hår, rosa tröja, jeans, vita sockor
 *   Vienna (7) – långt ljust hår med mittbena, ljusrosa klänning, barfota
 *   Nils (3)   – kort ljust hår, utstående öron, grå tröja, beige byxor, barfota
 * Figurerna är ett skelett med leder som ritas direkt varje bild, så att
 * samma figur kan gå, smyga, hjula, ramla, sitta och sova.
 *
 * Bus på egen hand: tittut, räcka ut tungan, blåsa ballong som smäller,
 * såpbubblor, hjula, snurra tills man blir yr, knacka på skärmen, dansa
 * (kompisar i närheten hänger på), konfetti, vinka och lägga bananskal
 * (den som kliver på det halkar).
 * Bus på en kompis: smyga fram och säga BU, kittla, vattenpistol,
 * bockhopp, pruttkudde och rita mustasch eller glasögon på den som sover.
 * Dessutom: prutta (de andra håller för näsan), nysa, plastspindel,
 * vattenballong och kull. Favoriter: Nils kör sin trampbil (en röd traktor)
 * och leker på magen med bondgårdsfordon; Althea leker med slime och klär ut
 * sig (prinsessa, superhjälte, älva eller pirat); Vienna gillar disco.
 * Gemensamt ibland: alla äter glass på en bänk (någon tappar glassen),
 * badar i en pool, äter hamburgare på en filt (ketchup och en rap), springer
 * ute i bara strumporna, leker kurragömma, tittar på iPaden, cyklar på rad
 * (Nils i traktorn), och Ida och Vienna sover över (kuddkrig först).
 *
 * Vinklar: 0 = rakt ner, positivt = framåt (åt det håll figuren tittar),
 * PI = rakt upp. Allt i figurhöjder med höften i origo.
 * ?bus=namn gör att just det buset väljs om och om igen, för test. Namn:
 * tittut, tongue, balloon, bubbles, cartwheel, spin, knock, dance, confetti,
 * wave, banana, boo, tickle, squirt, leapfrog, cushion, mustache, sleep,
 * fart, sneeze, spider, waterballoon, tag, pedalcar och farmtoys (Nils),
 * slime och dressup (Althea), disco (Vienna) – eller en gemensam stund:
 * icecream, pool, burger, sleepover, socks, hide, ipad, bike.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- konstanter
  var MAX = 4;
  var BASE_H = 250;            // figurens höjd i px vid size=1 och 1080 px kortsida
  var WALK = 1.25;             // gånghastighet i figurhöjder per sekund
  var TWO_PI = Math.PI * 2;
  var INK = '#26232b';
  var LW = 0.032;              // linjebredd i figurhöjder
  var R = 0.155;               // huvudets radie
  var TORSO = 0.27, SH = 0.22; // hals och axlar ovanför höften
  var THIGH = 0.22, SHIN = 0.21, UPPER = 0.16, FORE = 0.15;
  var FONT = '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif';

  // h = längd relativt Ida (ungefär 96, 110, 117 och 123 cm vid 3, 5, 6 och 7 år).
  var LOOKS = [
    { name: 'Ida', age: 6, h: 1, style: 'long', part: 0.22,
      hair: '#dcb66c', hairDark: '#b38a43', skin: '#f6d3bd', gap: true,
      shirt: '#f3ecd8', sleeves: 'short', bottom: 'leopard', shoes: '#f5a8c5', pack: '#ef8db4',
      bus: 0.12, sleep: 0.004 },
    { name: 'Althea', age: 5, h: 0.94, style: 'cap',
      hair: '#e3c27e', hairDark: '#b8964f', skin: '#f6d5c3', cap: '#f5a9c2', capDark: '#e07a9c',
      shirt: '#f7c8d3', sleeves: 'long', bottom: 'jeans', cloth: '#50709f', shoes: '#fbfbfb',
      bus: 0.1, sleep: 0.008, fav: ['slime', 'dressup'] },
    { name: 'Vienna', age: 7, h: 1.05, style: 'long', part: 0, longer: true, earring: true,
      hair: '#e6c77f', hairDark: '#bf9c52', skin: '#f4d0b8',
      shirt: '#f8dcdc', bottom: 'dress', cloth: '#f8dcdc', print: '#6f9ad6', barefoot: true,
      bus: 0.1, sleep: 0.006, fav: ['disco'] },
    { name: 'Nils', age: 3, h: 0.82, style: 'short', ears: true,
      hair: '#d9ba7c', hairDark: '#ab8a4c', skin: '#f6cfb8',
      shirt: '#c9cbcf', sleeves: 'long', bottom: 'pants', cloth: '#c9a46e', barefoot: true,
      bus: 0.09, sleep: 0.018, fav: ['pedalcar', 'pedalcar', 'farmtoys'] }
  ];

  // fläckar på leopardkjolen: x, y, radie
  var SPOTS = [[-0.05, 0.01, 0.018], [0.03, 0.0, 0.016], [-0.08, 0.07, 0.02], [0.0, 0.06, 0.019],
    [0.08, 0.07, 0.018], [-0.04, 0.115, 0.017], [0.05, 0.12, 0.02], [-0.11, 0.125, 0.014],
    [0.11, 0.125, 0.014]];

  LOOKS[1].bare = Object.assign({}, LOOKS[1], { style: 'long', part: 0.1 });

  // tryck på Viennas klänning
  var PRINT = [[-0.06, 0.03], [0.05, 0.06], [-0.1, 0.12], [0.02, 0.15], [0.12, 0.16], [-0.04, 0.2],
    [0.08, 0.22]];

  var BALLOONS = ['#ff4d6d', '#4dabf7', '#ffd43b', '#69db7c', '#b197fc', '#ff922b'];
  var CONFETTI = ['#ff4d6d', '#4dabf7', '#ffd43b', '#69db7c', '#b197fc', '#ff922b', '#f783ac'];
  var LAUGHS = ['Hahaha!', 'Hihihi!', 'Lurad!', 'Haha, vad kul!'];

  var SOLO = ['tittut', 'tongue', 'balloon', 'bubbles', 'cartwheel', 'spin', 'knock',
    'dance', 'confetti', 'wave', 'banana', 'fart', 'fart', 'sneeze'];
  var DUO = ['boo', 'tickle', 'squirt', 'leapfrog', 'cushion', 'spider', 'waterballoon', 'tag'];
  var FLAVORS = ['#f7a1c4', '#fff4d6', '#8b5a3c', '#b8f0d0'];

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
      i: i, look: LOOKS[i % LOOKS.length], alive: true,
      x: 0, y: 0, z: 0, vz: 0, face: 1, L: baseL, spd: rand(0.85, 1.15), phase: 0,
      gx: 0, gy: 0, a: 'walk', t: 0, dur: 0, k1: 0, k2: 0, k3: 0, emit: 0, ang: 0,
      target: null, by: null, next: null, last: null, prop: null, cool: rand(1, 4),
      costume: null, costumeT: 0, vehicle: null, wheel: 0, slimeHair: 0, slimeCol: '#7ee081', toyCol: '#2f9e44',
      ev: null, other: null, inWater: false, bag: null, sockT: 0, dirt: 0, ketchup: 0, scoop: 1,
      bites: 0, flavor: FLAVORS[i % FLAVORS.length], vx: 0,
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
    for (var n = 0; n < 6; n++) {
      f.gx = clamp(f.x + rand(-0.45, 0.45) * W, xMin, xMax);
      f.gy = rand(yTop, yBot);
      if (!blocked(f.gx, f.gy)) break;
    }
  }

  function place(f) {
    f.x = rand(xMin, xMax);
    f.y = rand(yTop, yBot);
    f.L = depthL(f.y) * f.look.h;
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
    } else if ((!forced || forced === 'mustache') && Math.random() < f.look.sleep * dt) {
      f.cool = rand(4, 9);
      setAct(f, 'sleep');
    }
  }

  function prank(f, want) {
    var victims = [], sleepers = [], i, g, name;
    for (i = 0; i < count; i++) {
      g = figs[i];
      if (g === f || g.by) continue;
      if (g.a === 'walk' || g.a === 'idle') victims.push(g);
      else if (g.a === 'sleep' && g.t > 1.2 && g.t < g.dur - 3 && !g.beard) sleepers.push(g);
    }
    g = null;
    var fav = f.look.fav || [];
    if (want) name = want;
    else if (forced && ACT[forced]) name = forced;
    else if (fav.length && Math.random() < 0.4) name = pick(fav);
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
    } else if (SOLO.indexOf(name) < 0 && fav.indexOf(name) < 0 && !want) {
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
      say(g, f.beardKind ? pick(['Haha, glasögon!', 'Snygga glasögon, ' + f.look.name + '!'])
        : pick(['Haha, mustasch!', f.look.name + ' har mustasch!', 'Hihi, du har mustasch!']), 2);
    }
  }

  // ---------------------------------------------------------------- poser
  function resetPose(p) {
    p.lean = 0; p.tilt = 0; p.rot = 0; p.sx = 1;
    p.af1 = 0.18; p.af2 = 0.3; p.ab1 = -0.12; p.ab2 = 0.3;
    p.lf1 = 0.06; p.lf2 = -0.04; p.lb1 = -0.06; p.lb2 = -0.04;
    p.hf = null; p.hb = null; p.ff = null; p.fb = null; p.front = false; p.fingers = false;
    p.expr = 'grin'; p.item = null; p.ir = 0; p.free = 0;
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
      var away = a.next === 'boo' || a.next === 'squirt' || a.next === 'waterballoon';
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
          case 'spider': gx = g.x + side * 0.6 * g.L; break;
          case 'waterballoon': gx = g.x + side * 2.2 * g.L; break;
          case 'tag': gx = g.x + side * 0.3 * g.L; break;
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
    start: function (f) {
      say(f, pick(['Hej!', 'Hej hej!', 'Titta här!', 'Jag heter ' + f.look.name + '!',
        'Jag är ' + f.look.age + ' år!']));
    },
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
      if (f.t > 1.0 && !f.k2) {
        f.k2 = 1;
        say(f, pick(['Hihi, lurad!', 'Hahaha!', g ? 'Där fick du, ' + g.look.name + '!' : 'Där fick du!']));
      }
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
        say(f, pick(['Du skrämde mig!', 'Vad läskigt!', 'Igen!', f.by ? 'Lurade du mig, ' + f.by.look.name + '?' : 'Igen!']));
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
      say(f, pick(['Kittel kittel!', 'Killekill!', 'Kittelmonstret!', g ? 'Killekill, ' + g.look.name + '!' : 'Killekill!']));
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
    start: function (f) {
      var n = f.target ? f.target.look.name : 'du';
      say(f, pick(['Sätt dig, ' + n + '!', 'Vill du sitta, ' + n + '?', 'Varsågod, en kudde!']), 1.4);
    },
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

  // ---- mer bus

  ACT.fart = {
    dur: 3,
    update: function (f) {
      if (f.t > 0.5 && !f.k1) {
        f.k1 = 1;
        pop(pick(['PRUTT!', 'PRRRT!', 'PUFF!']), f.x - f.face * f.L * 0.25, f.y - f.L * 0.45, f.L * 0.22, '#a9e34b');
        for (var i = 0; i < 6; i++) {
          emit('cloud', f.x - f.face * f.L * rand(0.1, 0.35), f.y - f.L * rand(0.3, 0.5),
            -f.face * rand(10, 50) * scale, -rand(10, 30) * scale, rand(1.2, 1.8), f.L * rand(0.05, 0.09), '');
        }
        for (i = 0; i < count; i++) {
          var g = figs[i];
          if (g !== f && free(g) && Math.abs(g.x - f.x) < 3 * f.L && Math.abs(g.y - f.y) < 1.5 * f.L) {
            g.face = f.x > g.x ? 1 : -1;
            setAct(g, 'stink');
          }
        }
      }
      if (f.t > 1.1 && !f.k2) { f.k2 = 1; say(f, pick(['Hoppsan!', 'Det var inte jag!', 'Ursäkta!', 'Oj, en prutt!'])); }
    },
    pose: function (f, p) {
      if (f.t < 0.5) {
        p.lean = 0.3 * f.t / 0.5;
        p.lb1 = -0.35;
        p.expr = 'sneaky';
      } else {
        p.expr = f.t < 1.1 ? 'o' : 'laugh';
        if (f.t > 1.1) laughPose(f, p);
      }
    }
  };

  // Håller för näsan och viftar bort lukten.
  ACT.stink = {
    dur: 2.4,
    start: function (f) {
      say(f, pick(['Iiih, vem var det?', 'Fy, vad det luktar!', 'Bläää!', 'Hahaha!', 'Det luktar prutt!']));
    },
    pose: function (f, p) {
      p.hf = ['h', 0.25, 0.2];
      p.front = true;
      p.ab1 = -2.2 + 0.5 * Math.sin(f.t * 14); p.ab2 = -0.4;
      p.lean = -0.12;
      p.expr = 'wet';
    }
  };

  ACT.sneeze = {
    dur: 2.8,
    start: function (f) { say(f, 'Aaa... aaa...', 1.3); },
    update: function (f) {
      if (f.t > 1.3 && !f.k1) {
        f.k1 = 1;
        pop('ATJOO!', f.hx + f.face * f.L * 0.35, f.hy, f.L * 0.22, '#74c0fc');
        for (var i = 0; i < 8; i++) {
          emit('drop', f.hx + f.face * f.hr, f.hy + f.hr * 0.4, f.face * rand(150, 320) * scale,
            rand(-120, 20) * scale, rand(0.25, 0.45), f.L * 0.008, '#a5d8ff');
        }
        hop(f, 0.25);
        var list = [];
        for (i = 0; i < count; i++) if (figs[i] !== f && free(figs[i])) list.push(figs[i]);
        var g = nearest(f, list);
        if (g) say(g, 'Prosit!', 1.6);
      }
      if (f.t > 2.0 && !f.k2) { f.k2 = 1; say(f, pick(['Tack!', 'Hihi, förlåt!'])); }
    },
    pose: function (f, p) {
      if (f.t < 1.3) {
        var u = f.t / 1.3;
        p.lean = -0.25 * u;
        p.tilt = -0.3 * u;
        p.expr = 'o';
      } else if (f.t < 1.7) {
        p.lean = 0.45;
        p.tilt = 0.3;
        p.expr = 'sleep';
      }
    }
  };

  ACT.spider = {
    dur: 3,
    update: function (f) {
      var g = f.target;
      if (f.t > 0.6 && !f.k1) {
        f.k1 = 1;
        if (!ok(g, f)) return finish(f);
        props.push({ type: 'spider', x: lerp(f.x, g.x, 0.55), y: g.y + 1, t: 0, life: 4, L: g.L });
      }
      if (f.t > 1.0 && !f.k2) {
        f.k2 = 1;
        if (ok(g, f)) { setAct(g, 'scared'); say(g, pick(['En spindel!', 'Iiih, en spindel!', 'Aaah!'])); }
      }
      if (f.t > 1.8 && !f.k3) { f.k3 = 1; say(f, pick(['Det är bara en plastspindel!', 'Hihi, den är inte på riktigt!'])); }
    },
    pose: function (f, p) {
      if (f.t < 0.8) {
        var u = Math.sin(Math.min(1, f.t / 0.8) * Math.PI);
        p.lean = 0.8 * u;
        p.lf1 = 0.4 * u; p.lf2 = -0.7 * u - 0.04;
        p.af1 = lerp(0.3, 1.0, u); p.af2 = 0.1;
        p.expr = 'sneaky';
      } else {
        laughPose(f, p);
      }
    }
  };

  ACT.waterballoon = {
    dur: 2.6,
    start: function (f) { f.col = pick(['#4dabf7', '#74c0fc', '#69db7c']); say(f, pick(['Vattenballong!', 'Fånga!']), 1.2); },
    update: function (f) {
      var g = f.target;
      if (f.t > 0.55 && !f.k1) {
        f.k1 = 1;
        if (!ok(g, f)) return finish(f);
        var x0 = f.wh[0], y0 = f.wh[1], T = 0.6, tx = g.hx, ty = g.hy;
        parts.push({ type: 'wb', x: x0, y: y0, vx: (tx - x0) / T, vy: (ty - y0) / T - 0.5 * DROP_G * scale * 0.6 * T,
          t: 0, life: T, s: f.L * 0.05, col: f.col, r: 0, w: 0 });
      }
      if (f.t > 1.15 && !f.k2) {
        f.k2 = 1;
        if (ok(g, f) && g.a === 'wait') { pop('SPLASH!', g.hx, g.hy - g.L * 0.2, g.L * 0.2, '#74c0fc'); setAct(g, 'wet'); }
      }
      if (f.t > 1.4 && !f.k3) { f.k3 = 1; say(f, pick(LAUGHS)); }
    },
    pose: function (f, p) {
      if (f.t < 0.55) {
        p.af1 = lerp(0.2, -2.4, f.t / 0.55); p.af2 = -0.3;
        p.lean = -0.15;
        p.item = 'wb';
        p.expr = 'sneaky';
      } else if (f.t < 0.9) {
        p.af1 = 1.6; p.af2 = 0; p.lean = 0.2;
      } else {
        laughPose(f, p);
      }
    }
  };

  // Kull: den som blir kullad jagar tillbaka.
  ACT.tag = {
    dur: 0.5,
    start: function (f) {
      var g = f.target;
      if (!ok(g, f)) return finish(f);
      say(f, pick(['Kull! Du är den!', 'Kull!', 'Ta mig om du kan!']), 1.6);
      g.other = f;
      setAct(g, 'chase');
    },
    end: function (f) { setAct(f, 'flee'); },
    pose: function (f, p) { p.af1 = 1.5; p.af2 = 0; p.expr = 'laugh'; }
  };

  ACT.flee = {
    dur: 4,
    update: function (f, dt) {
      var g = f.target;
      if (!g || !g.alive || g.a !== 'chase') return finish(f);
      var dx = f.x - g.x, dy = f.y - g.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var gx = clamp(f.x + dx / d * f.L, xMin, xMax), gy = clamp(f.y + dy / d * f.L, yTop, yBot);
      if (gx === xMin || gx === xMax) gy = clamp(f.y + (dy >= 0 ? 1 : -1) * f.L, yTop, yBot);
      moveTo(f, gx, gy, WALK * baseL * 1.7 * f.look.h, dt);
    },
    end: finish,
    pose: function (f, p) { walkPose(p, f.phase, 1.35); p.lean = 0.2; p.expr = 'laugh'; }
  };

  ACT.chase = {
    dur: 4.5,
    start: function (f) { say(f, 'Ett, två, tre...', 1.2); },
    update: function (f, dt) {
      var g = f.other;
      if (!g || !g.alive) return finish(f);
      if (f.t < 1.2) return;
      if (!f.k1) { f.k1 = 1; say(f, pick(['Jag ska ta dig!', 'Nu kommer jag!']), 1.4); }
      if (moveTo(f, g.x, g.y, WALK * baseL * 1.6 * f.look.h, dt) ||
          Math.abs(g.x - f.x) < 0.3 * f.L && Math.abs(g.y - f.y) < 0.2 * f.L) {
        if (g.a === 'flee') finish(g);
        if (free(g)) setAct(g, 'laugh');
        setAct(f, 'laugh');
        say(f, 'Kull tillbaka!', 1.6);
      }
    },
    end: function (f) { say(f, pick(['Puh, du är för snabb!', 'Jag orkar inte mer!'])); finish(f); },
    pose: function (f, p) {
      if (f.t < 1.2) { p.hf = ['h', 0.4, -0.05]; p.hb = ['h', -0.4, -0.05]; p.front = true; return; }
      walkPose(p, f.phase, 1.35); p.lean = 0.25; p.af1 = 1.4; p.af2 = 0; p.expr = 'grin';
    }
  };

  // ---------------------------------------------------------------- gemensamma stunder
  // Ibland gör barnen något tillsammans: äter glass på en bänk, badar i en
  // pool, äter hamburgare på en filt, springer ute i strumporna, eller så
  // sover Ida och Vienna över. Barnen går först till sina platser (gather),
  // sedan börjar själva stunden (main) och till sist bleknar sakerna bort.
  var event = null;
  var eventCool = rand(15, 25);
  var EVENTS = ['icecream', 'pool', 'burger', 'sleepover', 'socks', 'hide', 'ipad', 'bike'];

  function byName(n) {
    for (var i = 0; i < count; i++) if (figs[i].look.name === n) return figs[i];
    return null;
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0, t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Ligger punkten i poolen?
  function blocked(x, y) {
    var e = event;
    return e && e.type === 'pool' && x > e.x0 - baseL * 0.3 && x < e.x1 + baseL * 0.3 &&
      y > e.y0 - baseL * 0.1 && y < e.y1 + baseL * 0.15;
  }

  function startEvent(type) {
    var m = [], i;
    if (type === 'sleepover') {
      var a = byName('Ida'), b = byName('Vienna');
      if (!a || !b || !free(a) || !free(b)) return false;
      m = [a, b];
    } else {
      for (i = 0; i < count; i++) if (free(figs[i])) m.push(figs[i]);
      if (m.length < 2) return false;
      shuffle(m);
      if (type === 'socks') m.length = 2 + ((Math.random() * (m.length - 1)) | 0);
    }
    var e = { type: type, t: 0, t0: 0, main: false, ending: false, fade: 1, members: m, spots: [], k: 0 };
    EV[type].setup(e);
    event = e;
    for (i = 0; i < m.length; i++) {
      m[i].ev = e;
      m[i].spot = i;
      if (e.spots.length) setAct(m[i], 'gather');
    }
    if (!e.spots.length) beginMain(e);
    return true;
  }

  function mainAct(f, e) {
    var a = EV[e.type].act;
    return typeof a === 'function' ? a(f, e) : a;
  }

  function beginMain(e) {
    var D = EV[e.type];
    e.main = true;
    e.t0 = e.t;
    for (var i = 0; i < e.members.length; i++) {
      var f = e.members[i];
      if (f.a === 'evwait' || !e.spots.length) setAct(f, mainAct(f, e));
    }
    if (D.start) D.start(e);
  }

  function endEvent(e) {
    e.ending = true;
    e.fade = 1;
    var D = EV[e.type];
    for (var i = 0; i < e.members.length; i++) {
      var f = e.members[i];
      if (!f.alive || f.ev !== e) continue;
      f.ev = null;
      if (D.leave) D.leave(f, e); else setAct(f, 'walk');
    }
    eventCool = forced && EV[forced] ? 2 : rand(30, 50);
  }

  function updateEvent(dt) {
    var e = event, i;
    if (!e) {
      eventCool -= dt;
      if (eventCool <= 0) {
        eventCool = rand(8, 15);
        if (forced && EV[forced]) startEvent(forced);
        else if (!forced) startEvent(pick(EVENTS));
      }
      return;
    }
    e.t += dt;
    if (e.ending) {
      e.fade -= dt * 1.5;
      if (e.fade <= 0) event = null;
      return;
    }
    var alive = 0, arrived = true;
    for (i = 0; i < e.members.length; i++) {
      var f = e.members[i];
      if (!f.alive || f.ev !== e) continue;
      alive++;
      if (f.a === 'gather') arrived = false;
    }
    if (alive < (e.type === 'sleepover' ? 2 : 1)) return endEvent(e);
    if (!e.main) {
      if (arrived || e.t > 9) beginMain(e);
      return;
    }
    var D = EV[e.type];
    if (D.update) D.update(e, dt, e.t - e.t0);
    if (event === e && !e.ending && e.t - e.t0 > e.dur) endEvent(e);
  }

  // Medlemmar som fortfarande är med i stunden.
  function members(e) {
    var out = [];
    for (var i = 0; i < e.members.length; i++) {
      var f = e.members[i];
      if (f.alive && f.ev === e) out.push(f);
    }
    return out;
  }

  function sayOne(e, lines, d) {
    var m = members(e);
    if (m.length) say(pick(m), pick(lines), d);
  }

  ACT.gather = {
    dur: 9,
    update: function (f, dt) {
      var e = f.ev;
      if (!e || e !== event || e.ending) return setAct(f, 'walk');
      var s = e.spots[f.spot];
      if (moveTo(f, s[0], s[1], WALK * baseL * f.spd * 1.2, dt)) ACT.gather.end(f);
    },
    end: function (f) {
      var e = f.ev;
      if (!e || e !== event || e.ending) return setAct(f, 'walk');
      var s = e.spots[f.spot];
      f.x = s[0]; f.y = s[1]; f.face = s[2];
      setAct(f, e.main ? mainAct(f, e) : 'evwait');
    },
    pose: function (f, p) { walkPose(p, f.phase, 1.1); }
  };

  ACT.evwait = {
    dur: 1e9,
    update: function (f) { if (!f.ev || f.ev !== event || event.ending) setAct(f, 'walk'); },
    pose: idlePose
  };

  // Sitter på en bänk med benen dinglande (de minsta når inte ner).
  function benchPose(f, p, e) {
    p.free = e.benchH / f.L;
    p.lf1 = 1.45; p.lf2 = -1.35 + 0.25 * Math.sin(clock * 3 + f.i);
    p.lb1 = 1.35; p.lb2 = -1.3 + 0.25 * Math.sin(clock * 3 + f.i + 2);
    p.hb = ['b', 0.02, 0.02];
  }

  // Sitter på marken med benen framåt.
  function sitPose(p) {
    p.lf1 = 1.5; p.lf2 = -0.15; p.lb1 = 1.4; p.lb2 = -0.25;
  }

  ACT.icecream = {
    dur: 1e9,
    start: function (f) { f.scoop = 1; f.dropped = 0; },
    update: function (f, dt) {
      if (!f.ev || f.ev !== event || event.ending) return setAct(f, 'walk');
      if (!f.dropped) f.scoop = Math.max(0.35, f.scoop - dt * 0.05);
    },
    pose: function (f, p) {
      benchPose(f, p, f.ev || { benchH: 0.22 * f.L });
      var c = (clock * 0.45 + f.i * 0.3) % 1;
      if (!f.dropped && c < 0.35) {
        p.hf = ['h', 0.25, 1.3];
        p.expr = 'tongue';
      } else {
        p.hf = ['b', 0.14, -0.14];
        p.expr = f.dropped === 1 ? 'scared' : 'grin';
      }
      p.item = f.dropped ? null : 'cone';
    }
  };

  ACT.burger = {
    dur: 1e9,
    start: function (f) { f.bites = 0; },
    update: function (f, dt) {
      if (!f.ev || f.ev !== event || event.ending) return setAct(f, 'walk');
      var c = (clock * 0.6 + f.i * 0.37) % 1;
      if (c < f.k1) f.bites = Math.min(5, f.bites + 1);
      f.k1 = c;
    },
    pose: function (f, p) {
      sitPose(p);
      p.lean = 0.1;
      var c = (clock * 0.6 + f.i * 0.37) % 1;
      if (c < 0.3) {
        p.hf = ['h', 0.7, 0.8]; p.hb = ['h', 0.5, 0.95];
        p.expr = 'blow';
      } else {
        p.hf = ['b', 0.2, -0.12]; p.hb = ['b', 0.17, -0.1];
        p.expr = 'grin';
      }
      p.item = 'burger';
    }
  };

  ACT.dive = {
    dur: 1.0,
    ownZ: true,
    start: function (f) {
      var e = f.ev;
      f.sx0 = f.x; f.sy0 = f.y;
      f.ex = rand(e.x0 + baseL * 0.5, e.x1 - baseL * 0.5);
      f.ey = rand(e.y0 + baseL * 0.75, e.y1 - baseL * 0.08);
      f.face = f.ex > f.x ? 1 : -1;
      if (Math.random() < 0.5) say(f, pick(['Plask!', 'Jag hoppar!', 'Kanonkula!']), 1.2);
    },
    update: function (f) {
      var u = Math.min(1, f.t / 0.8);
      f.x = lerp(f.sx0, f.ex, u);
      f.y = lerp(f.sy0, f.ey, u);
      f.z = Math.sin(u * Math.PI) * 0.45 * f.L;
      if (u >= 1 && !f.k1) {
        f.k1 = 1;
        f.z = 0;
        f.inWater = true;
        splash(f.x, f.y - f.L * 0.36, f.L * 0.12, 18);
        emit('ripple', f.x, f.y - f.L * 0.36, 0, 0, 0.7, f.L * 0.08, 'rgba(255, 255, 255,');
        setAct(f, 'swim');
      }
    },
    pose: function (f, p) {
      armsUp(p);
      p.af1 = 2.9; p.ab1 = -2.9;
      p.lf1 = 0.9; p.lf2 = -1.6; p.lb1 = 0.8; p.lb2 = -1.5;
      p.expr = 'laugh';
    }
  };

  ACT.swim = {
    dur: 1e9,
    ownZ: true,
    start: function (f) { f.gx = f.x; f.gy = f.y; },
    update: function (f, dt) {
      var e = f.ev;
      if (!e || e !== event || e.ending) { f.inWater = false; return setAct(f, 'walk'); }
      f.z = (Math.sin(clock * 2.5 + f.i) * 0.02 - 0.02) * f.L;
      if (moveTo(f, f.gx, f.gy, WALK * baseL * 0.35, dt)) {
        f.gx = rand(e.x0 + baseL * 0.4, e.x1 - baseL * 0.4);
        f.gy = rand(e.y0 + baseL * 0.75, e.y1 - baseL * 0.08);
      }
      if (Math.random() < 0.6 * dt) splash(f.x + f.face * f.L * 0.2, f.y - f.L * 0.36, f.L * 0.06, 5);
    },
    pose: function (f, p) {
      var a = clock * 3.5 + f.i;
      p.af1 = 1.6 + Math.sin(a) * 1.1; p.af2 = 0.3;
      p.ab1 = 1.6 + Math.sin(a + Math.PI) * 1.1; p.ab2 = 0.3;
      p.lf1 = 0.5; p.lb1 = -0.5;
      p.free = 0.43;
      p.expr = (a % 4) < 2 ? 'laugh' : 'grin';
    }
  };

  // Klättrar upp ur poolen, blöt.
  ACT.climbout = {
    dur: 5,
    start: function (f) {
      var e = event;
      f.inWater = false;
      f.wetT = 6;
      hop(f, 0.5);
      if (e) {
        f.gx = f.x - e.x0 < e.x1 - f.x ? e.x0 - baseL * 0.5 : e.x1 + baseL * 0.5;
        f.gy = f.y;
      } else {
        f.gx = f.x; f.gy = f.y;
      }
      f.gx = clamp(f.gx, xMin, xMax);
    },
    update: function (f, dt) { if (moveTo(f, f.gx, f.gy, WALK * baseL * 1.1, dt)) finish(f); },
    pose: function (f, p) { walkPose(p, f.phase, 1); }
  };

  ACT.pillowfight = {
    dur: 1e9,
    update: function (f) {
      if (!f.ev || f.ev !== event || event.ending) return setAct(f, 'walk');
      var s = Math.sin(clock * 6 + f.i * 1.7);
      if (s < -0.95 && f.k1 > -0.95) {
        for (var i = 0; i < 3; i++) {
          emit('feather', f.wh[0] + f.face * f.L * 0.1, f.wh[1], rand(-60, 60) * scale, -rand(20, 90) * scale,
            rand(1.5, 2.5), f.L * 0.02, '#fff');
        }
      }
      f.k1 = s;
    },
    pose: function (f, p) {
      var s = Math.sin(clock * 6 + f.i * 1.7);
      p.af1 = 1.5 + 1.2 * s; p.af2 = 0.4;
      p.lean = -0.1 * s;
      p.item = 'pillow';
      p.expr = 'laugh';
    }
  };

  ACT.tobed = {
    dur: 4,
    update: function (f, dt) {
      if (!f.ev || f.ev !== event || event.ending) return setAct(f, 'walk');
      var s = f.ev.beds[f.spot];
      if (moveTo(f, s[0], s[1], WALK * baseL, dt)) ACT.tobed.end(f);
    },
    end: function (f) {
      if (!f.ev || f.ev !== event || event.ending) return setAct(f, 'walk');
      var s = f.ev.beds[f.spot];
      f.x = s[0]; f.y = s[1]; f.face = 1;
      f.bag = f.look.name === 'Ida' ? '#f28cb1' : '#b197fc';
      setAct(f, 'inbag');
    },
    pose: function (f, p) { walkPose(p, f.phase, 1); }
  };

  ACT.inbag = {
    dur: 1e9,
    update: function (f, dt) {
      var e = f.ev;
      if (!e || e !== event || e.ending) { f.bag = null; return setAct(f, 'walk'); }
      f.emit -= dt;
      if (e.asleep && f.emit <= 0) {
        f.emit = 1.3;
        emit('z', f.hx, f.hy - f.hr * 1.2, 18 * scale, -30 * scale, 2.2, f.L * 0.09, INK);
      }
    },
    pose: function (f, p) {
      var u = ease(f.t / 0.8);
      p.rot = -Math.PI / 2 * u;
      p.lf1 = 0.03; p.lf2 = 0; p.lb1 = -0.02; p.lb2 = 0;
      p.af1 = 0.08; p.ab1 = -0.05; p.af2 = p.ab2 = 0.1;
      p.expr = f.ev && f.ev.asleep ? 'sleep' : 'laugh';
    }
  };

  ACT.sockrun = {
    dur: 1e9,
    start: newGoal,
    update: function (f, dt) {
      if (!f.ev || f.ev !== event || event.ending) return setAct(f, 'walk');
      var ph = f.phase;
      if (moveTo(f, f.gx, f.gy, WALK * baseL * 2.0 * f.look.h, dt)) newGoal(f);
      f.dirt = Math.min(1, f.dirt + dt / 14);
      if (f.dirt > 0.35 && (ph < 0.5) !== (f.phase < 0.5)) {
        props.push({ type: 'print', x: f.x, y: f.y + 1, t: 0, life: 2.5, L: f.L, a: f.dirt });
      }
      if (Math.random() < 0.18 * dt) setAct(f, 'skid');
    },
    pose: function (f, p) { walkPose(p, f.phase, 1.35); p.lean = 0.18; p.expr = 'laugh'; }
  };

  // Glider på strumporna.
  ACT.skid = {
    dur: 1.1,
    start: function (f) { f.vx = f.face * WALK * baseL * 2.2; say(f, pick(['Wiii!', 'Jag glider!', 'Halt!']), 1.2); },
    update: function (f, dt) {
      f.x = clamp(f.x + f.vx * dt, xMin, xMax);
      f.vx *= 1 - 2.2 * dt;
    },
    end: function (f) { setAct(f, f.ev && f.ev === event && !event.ending ? 'sockrun' : 'walk'); },
    pose: function (f, p) {
      p.lf1 = 0.6; p.lf2 = 0; p.lb1 = -0.5; p.lb2 = 0;
      p.af1 = 1.6; p.af2 = 0; p.ab1 = -1.6; p.ab2 = 0;
      p.lean = -0.1;
      p.expr = 'laugh';
    }
  };

  var EV = {};

  EV.icecream = {
    act: 'icecream',
    setup: function (e) {
      var n = e.members.length, gap = baseL * 0.62, y = rand(lerp(yTop, yBot, 0.35), lerp(yTop, yBot, 0.85));
      var x = clamp(rand(xMin, xMax), xMin + gap * n / 2 + baseL * 0.4, xMax - gap * n / 2 - baseL * 0.4);
      e.dur = 13;
      e.x0 = x - gap * n / 2 - baseL * 0.15;
      e.x1 = x + gap * n / 2 + baseL * 0.15;
      e.y = y;
      e.benchH = depthL(y) * 1.05 * 0.235;
      for (var i = 0; i < n; i++) {
        var sx = x - gap * (n - 1) / 2 + gap * i;
        e.spots.push([sx, y, sx < x ? 1 : -1]);
      }
    },
    start: function (e) { sayOne(e, ['Glass!', 'Nu äter vi glass!', 'Jag vill ha jordgubbsglass!']); },
    update: function (e, dt, t) {
      var m = members(e);
      if (Math.random() < 0.3 * dt) sayOne(e, ['Mmm!', 'Smaskens!', 'Glass är godast!', 'Mums!', 'Jag vill ha mer!']);
      if (t > 5 && !e.k && m.length > 1) {
        e.k = 1;
        var f = byName('Nils');
        if (!f || f.ev !== e || Math.random() < 0.4) f = pick(m);
        f.dropped = 1;
        emit('shred', f.wh[0], f.wh[1] - f.L * 0.05, 0, 0, 0.35, f.L * 0.03, f.flavor);
        props.push({ type: 'splat', x: f.x + f.face * f.L * 0.15, y: e.y + 2, t: 0, life: 9, L: f.L, col: f.flavor });
        say(f, pick(['Nej! Glassen!', 'Min glass ramlade!', 'Oj, glassen!']), 2);
        e.drop = f;
      }
      if (e.k === 1 && t > 7) {
        e.k = 2;
        var others = m.filter(function (g) { return g !== e.drop; });
        if (others.length) say(pick(others), 'Du kan få smaka på min, ' + e.drop.look.name + '!', 2.4);
        e.drop.dropped = 2;
      }
      if (e.k === 2 && t > 9.5) { e.k = 3; say(e.drop, 'Tack!', 1.5); }
    },
    draw: function (ctx, e, a) {
      // bänk
      var L = depthL(e.y), top = e.y - e.benchH, th = L * 0.05;
      ctx.globalAlpha = a;
      ctx.lineWidth = Math.max(1, L * 0.012);
      ctx.strokeStyle = INK;
      ctx.fillStyle = '#c9a77a';
      ctx.fillRect(e.x0, top, e.x1 - e.x0, e.y - L * 0.03 - top);
      ctx.strokeRect(e.x0, top, e.x1 - e.x0, e.y - L * 0.03 - top);
      ctx.fillStyle = '#ddc39c';
      ctx.fillRect(e.x0 - L * 0.03, top - th, e.x1 - e.x0 + L * 0.06, th);
      ctx.strokeRect(e.x0 - L * 0.03, top - th, e.x1 - e.x0 + L * 0.06, th);
      ctx.beginPath();
      for (var y = top + (e.y - top) / 3; y < e.y - L * 0.04; y += (e.y - top) / 3) {
        ctx.moveTo(e.x0, y);
        ctx.lineTo(e.x1, y);
      }
      ctx.strokeStyle = 'rgba(38, 35, 43, 0.35)';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  EV.burger = {
    act: 'burger',
    setup: function (e) {
      var n = e.members.length, y = rand(lerp(yTop, yBot, 0.3), lerp(yTop, yBot, 0.8));
      var x = clamp(rand(xMin, xMax), xMin + baseL * 1.4, xMax - baseL * 1.4);
      e.dur = 13;
      e.x = x; e.y = y;
      e.rx = baseL * (0.75 + 0.12 * n);
      e.ry = baseL * 0.32;
      for (var i = 0; i < n; i++) {
        var side = i % 2 ? 1 : -1, row = (i / 2) | 0;
        e.spots.push([x + side * baseL * (0.62 + 0.12 * row), y - baseL * 0.18 + row * baseL * 0.32, -side]);
      }
    },
    start: function (e) { sayOne(e, ['Hamburgare!', 'Jag är så hungrig!', 'Nu blir det mat!']); },
    update: function (e, dt, t) {
      var m = members(e);
      if (Math.random() < 0.3 * dt) sayOne(e, ['Mums!', 'Smaskigt!', 'Mer ketchup!', 'Hamburgare är bäst!', 'Mmm!']);
      if (t > 4 && !e.k) {
        e.k = 1;
        var f = byName('Nils');
        if (!f || f.ev !== e) f = pick(m);
        f.ketchup = 25;
        var others = m.filter(function (g) { return g !== f; });
        if (others.length) say(pick(others), 'Du har ketchup på munnen, ' + f.look.name + '!', 2.4);
      }
      if (t > 10 && e.k === 1) {
        e.k = 2;
        var b = pick(m);
        pop('BÖÖÖRP!', b.hx, b.hy - b.L * 0.25, b.L * 0.22, '#ffd43b');
        e.burper = b;
      }
      if (t > 10.8 && e.k === 2) {
        e.k = 3;
        for (var i = 0; i < m.length; i++) say(m[i], m[i] === e.burper ? 'Förlåt!' : pick(['Hahaha!', 'Säg förlåt!', 'Hihi!']), 1.8);
      }
    },
    draw: function (ctx, e, a) {
      // rutig picknickfilt
      var L = depthL(e.y);
      ctx.globalAlpha = a;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, TWO_PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = 'rgba(230, 60, 60, 0.75)';
      var c = L * 0.12;
      for (var x = e.x - e.rx; x < e.x + e.rx; x += c * 2) ctx.fillRect(x, e.y - e.ry, c, e.ry * 2);
      ctx.fillStyle = 'rgba(230, 60, 60, 0.45)';
      for (var y = e.y - e.ry; y < e.y + e.ry; y += c * 1.2) ctx.fillRect(e.x - e.rx, y, e.rx * 2, c * 0.6);
      ctx.restore();
      ctx.lineWidth = Math.max(1, L * 0.012);
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, TWO_PI);
      ctx.stroke();
      // ketchupflaska
      ctx.fillStyle = '#e03131';
      roundRect(ctx, e.x - L * 0.03, e.y - L * 0.16, L * 0.06, L * 0.14, L * 0.02);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  EV.pool = {
    act: 'dive',
    setup: function (e) {
      var w = Math.min(W * 0.6, baseL * 5.5), h = Math.min((yBot - yTop) * 0.8, baseL * 2);
      var cx = clamp(rand(xMin, xMax), xMin + w / 2 + baseL * 0.7, xMax - w / 2 - baseL * 0.7);
      var cy = clamp(lerp(yTop, yBot, rand(0.4, 0.6)), yTop + h / 2 + baseL * 0.1, yBot - h / 2 - baseL * 0.15);
      e.dur = 15;
      e.x0 = cx - w / 2; e.x1 = cx + w / 2;
      e.y0 = cy - h / 2; e.y1 = cy + h / 2;
      // var och en går till den kortsida som är närmast
      var nl = 0, nr = 0;
      for (var i = 0; i < e.members.length; i++) {
        var left = e.members[i].x < cx, n = left ? nl++ : nr++;
        e.spots.push([left ? e.x0 - baseL * 0.35 : e.x1 + baseL * 0.35,
          lerp(e.y0 + baseL * 0.8, e.y1, n * 0.45 + 0.1), left ? 1 : -1]);
      }
    },
    start: function (e) {
      sayOne(e, ['Vi badar!', 'Hoppa i!', 'Pool!']);
      // de som går omkring flyttar ur vägen
      for (var i = 0; i < count; i++) {
        var f = figs[i];
        if (free(f) && (blocked(f.x, f.y) || blocked(f.gx, f.gy))) { setAct(f, 'walk'); newGoal(f); }
      }
    },
    update: function (e, dt) {
      if (Math.random() < 0.35 * dt) sayOne(e, ['Vattnet är varmt!', 'Kolla, jag kan simma!', 'Plask plask!', 'Kom i!', 'Vi är fiskar!']);
      // stänka på en kompis
      if (Math.random() < 0.25 * dt) {
        var m = members(e).filter(function (g) { return g.a === 'swim'; });
        if (m.length > 1) {
          var a = pick(m), b = nearest(a, m.filter(function (g) { return g !== a; }));
          a.face = b.x > a.x ? 1 : -1;
          for (var i = 0; i < 10; i++) {
            var T = 0.45, x0 = a.x + a.face * a.L * 0.15, y0 = a.y - a.L * 0.36;
            emit('drop', x0, y0, (b.hx - x0) / T + rand(-40, 40) * scale,
              (b.hy - y0) / T - 0.5 * DROP_G * scale * T + rand(-60, 60) * scale, T, a.L * 0.016, '#74c0fc');
          }
          say(a, pick(['Plask!', 'Ta det här!']), 1.2);
          say(b, pick(['Hihi, sluta!', 'Iiih!', 'Plask tillbaka!']), 1.4);
        }
      }
    },
    leave: function (f) { setAct(f, f.inWater ? 'climbout' : 'walk'); },
    draw: function (ctx, e, a) {
      var L = baseL, b = L * 0.12;
      ctx.globalAlpha = a;
      ctx.lineWidth = Math.max(1, L * 0.012);
      ctx.strokeStyle = INK;
      roundRect(ctx, e.x0 - b, e.y0 - b * 0.6, e.x1 - e.x0 + b * 2, e.y1 - e.y0 + b * 1.2, b * 0.6);
      ctx.fillStyle = '#ddc39c';
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0, b * 0.3);
      ctx.fillStyle = '#7fd3f2';
      ctx.fill();
      ctx.stroke();
      // vågor
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = Math.max(1, L * 0.01);
      ctx.beginPath();
      for (var y = e.y0 + L * 0.12; y < e.y1; y += L * 0.18) {
        for (var x = e.x0 - L * 0.2 + ((clock * 20 * scale + y) % (L * 0.4)); x < e.x1; x += L * 0.4) {
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + L * 0.05, y - L * 0.03, x + L * 0.1, y);
          ctx.quadraticCurveTo(x + L * 0.15, y + L * 0.03, x + L * 0.2, y);
        }
      }
      ctx.stroke();
      ctx.restore();
      // badring som flyter
      ctx.lineWidth = L * 0.04;
      ctx.strokeStyle = '#ff8fab';
      ctx.beginPath();
      ctx.ellipse(e.x1 - L * 0.4, e.y0 + L * 0.35 + Math.sin(clock * 2) * L * 0.02, L * 0.16, L * 0.05, 0, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  EV.sleepover = {
    act: 'pillowfight',
    setup: function (e) {
      var x = clamp(rand(xMin, xMax), xMin + baseL * 1.2, xMax - baseL * 1.2);
      var y = rand(lerp(yTop, yBot, 0.35), lerp(yTop, yBot, 0.75));
      e.dur = 20;
      e.x = x; e.y = y;
      e.spots = [[x - baseL * 0.32, y + baseL * 0.1, 1], [x + baseL * 0.32, y + baseL * 0.1, -1]];
      e.beds = [[x + baseL * 0.15, y, 1], [x + baseL * 0.25, y + baseL * 0.3, 1]];
      e.members.sort(function (a, b) { return a.look.name === 'Ida' ? -1 : 1; });
    },
    start: function (e) { say(e.members[0], 'Kuddkrig!', 1.6); },
    update: function (e, dt, t) {
      var ida = e.members[0], vienna = e.members[1], i;
      if (e.k === 0 && t > 1.5) { e.k = 1; say(vienna, pick(['Hihi, ta den här!', 'Pang!']), 1.4); }
      if (e.k === 1 && t > 5) {
        e.k = 2;
        say(ida, 'Nu måste vi sova!', 1.6);
        for (i = 0; i < 2; i++) if (e.members[i].a === 'pillowfight') setAct(e.members[i], 'tobed');
      }
      if (e.k === 2 && t > 7.5) { e.k = 3; say(ida, 'Godnatt, Vienna!', 1.8); }
      if (e.k === 3 && t > 9) { e.k = 4; say(vienna, 'Godnatt, Ida!', 1.8); }
      if (e.k === 4 && t > 10.5) { e.k = 5; say(ida, 'Hihihi...', 1.4); }
      if (e.k === 5 && t > 11.8) { e.k = 6; say(vienna, 'Shhh! Sov nu!', 1.6); e.asleep = true; }
      if (e.k === 6 && t > 18.3) {
        e.k = 7;
        e.asleep = false;
        say(ida, 'God morgon!', 1.6);
        say(vienna, 'Vad roligt att sova över!', 1.8);
      }
    },
    leave: function (f) { f.bag = null; setAct(f, 'walk'); },
    draw: function (ctx, e, a) {
      // madrass, kuddar och en måne med stjärnor när de sover
      var L = depthL(e.y), i;
      ctx.globalAlpha = a;
      ctx.lineWidth = Math.max(1, L * 0.012);
      ctx.strokeStyle = INK;
      roundRect(ctx, e.x - L * 0.5, e.y - L * 0.12, L * 1.3, L * 0.55, L * 0.08);
      ctx.fillStyle = '#e7f0fb';
      ctx.fill();
      ctx.stroke();
      if (e.k >= 2) {
        for (i = 0; i < 2; i++) {
          var b = e.beds[i];
          roundRect(ctx, b[0] - L * 0.62, b[1] - L * 0.13, L * 0.24, L * 0.12, L * 0.05);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.stroke();
        }
      }
      if (e.k >= 3 && e.k < 7) {
        var mx = e.x + L * 0.2, my = e.y - L * 1.1;
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = '#ffe066';
        ctx.beginPath();
        ctx.arc(mx, my, L * 0.12, 0, TWO_PI);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(mx + L * 0.06, my - L * 0.04, L * 0.11, 0, TWO_PI);
        ctx.fill();
        ctx.fillStyle = '#ffe066';
        ctx.strokeStyle = INK;
        for (i = 0; i < 4; i++) {
          var tw = 0.75 + 0.25 * Math.sin(clock * 3 + i * 2);
          star(ctx, e.x - L * 0.5 + i * L * 0.4, my + (i % 2 ? L * 0.15 : -L * 0.05), L * 0.04 * tw);
        }
      }
      ctx.globalAlpha = 1;
    }
  };

  // ---- kurragömma
  // En räknar vid trädet (boet), de andra gömmer sig bakom buskar och
  // kartonger. Den som letar går till gömställena ett i taget; ibland smiter
  // någon tillbaka till boet: "Ett, två, tre för mig!"
  var COUNT = ['Ett...', 'Två...', 'Tre...', 'Fyra...', 'Fem...', 'Sex...', 'Sju...', 'Åtta...', 'Nio...', 'Tio!'];

  function hideEv(f) { return f.ev && f.ev === event && !event.ending ? f.ev : null; }

  function homeSpot(e) {
    var k = e.home++;
    return [clamp(e.base[0] - e.dir * baseL * (0.7 + 0.45 * k), xMin, xMax), e.base[1] + (k % 2) * baseL * 0.15];
  }

  ACT.seekcount = {
    dur: 6,
    start: function (f) { f.face = hideEv(f) ? hideEv(f).dir : f.face; },
    update: function (f) {
      var n = Math.floor(f.t / 0.5);
      if (n < COUNT.length && n >= f.k1) { f.k1 = n + 1; say(f, COUNT[n], 0.6); }
      if (f.t > 5.2 && !f.k2) { f.k2 = 1; say(f, 'Nu kommer jag!', 1.4); }
    },
    end: function (f) { setAct(f, hideEv(f) ? 'seek' : 'walk'); },
    pose: function (f, p) {
      if (f.t < 5.2) {
        p.hf = ['h', 0.4, -0.05]; p.hb = ['h', -0.4, -0.05]; p.front = true;
        p.lean = 0.2;
        p.expr = 'smile';
      } else {
        p.af1 = 2.4; p.ab1 = -2.4;
      }
    }
  };

  ACT.hiderun = {
    dur: 8,
    start: function (f) {
      if (Math.random() < 0.5) say(f, pick(['Spring!', 'Hihi, göm dig!', 'Jag vet ett bra ställe!']), 1.2);
    },
    update: function (f, dt) {
      var e = hideEv(f);
      if (!e) return setAct(f, 'walk');
      var pl = f.place;
      if (moveTo(f, pl.x, pl.y - baseL * 0.04, WALK * baseL * 1.7 * f.look.h, dt)) ACT.hiderun.end(f);
    },
    end: function (f) {
      if (!hideEv(f)) return setAct(f, 'walk');
      f.x = f.place.x; f.y = f.place.y - baseL * 0.04;
      setAct(f, 'hidden');
      f.emit = rand(2, 4);
    },
    pose: function (f, p) { walkPose(p, f.phase, 1.35); p.lean = 0.2; p.expr = 'laugh'; }
  };

  ACT.hidden = {
    dur: 1e9,
    update: function (f, dt) {
      if (!hideEv(f)) return setAct(f, 'walk');
      // tittar fram ibland (Nils oftast)
      f.emit -= dt;
      if (f.k2 > 0) f.k2 -= dt;
      if (f.emit <= 0) {
        f.emit = f.look.name === 'Nils' ? rand(2, 3.5) : rand(4, 7);
        f.k2 = 0.8;
        if (Math.random() < 0.4) say(f, pick(['Hihi...', 'Shhh!', 'Hi hi hi']), 0.9);
      }
    },
    pose: function (f, p) {
      if (f.k2 > 0) {
        p.lf1 = 0.45; p.lf2 = -0.9; p.lb1 = 0.35; p.lb2 = -0.8;
        p.lean = 0.1;
        p.expr = 'laugh';
      } else {
        p.lf1 = 0.95; p.lf2 = -1.9; p.lb1 = 0.8; p.lb2 = -1.75;
        p.lean = 0.55; p.tilt = -0.3;
        p.hf = ['b', 0.2, 0.1]; p.hb = ['b', 0.16, 0.12];
        p.expr = 'sneaky';
      }
    }
  };

  ACT.seek = {
    dur: 1e9,
    update: function (f, dt) {
      var e = hideEv(f), i, pl = null, bd = 1e18;
      if (!e) return setAct(f, 'walk');
      if (f.k2 > 0) { f.k2 -= dt; return; }        // står still och tittar
      if (!f.place || f.place.checked) {
        for (i = 0; i < e.places.length; i++) {
          var q = e.places[i], d = (q.x - f.x) * (q.x - f.x) + (q.y - f.y) * (q.y - f.y);
          if (!q.checked && d < bd) { bd = d; pl = q; }
        }
        f.place = pl;
        if (!pl) {
          // alla gömställen är kollade: tillbaka till boet
          if (moveTo(f, e.base[0], e.base[1], WALK * baseL * 1.1, dt) && !e.done) {
            e.done = true;
            say(f, e.free ? 'Nästa gång tar jag er!' : 'Alla hittade!', 2);
          }
          return;
        }
        if (Math.random() < 0.4) say(f, pick(['Var är ni?', 'Jag kommer!', 'Hmm...']), 1.2);
      }
      pl = f.place;
      var side = f.x < pl.x ? -1 : 1;
      if (moveTo(f, clamp(pl.x + side * baseL * 0.6, xMin, xMax), pl.y + 2, WALK * baseL * 1.05, dt)) {
        pl.checked = true;
        f.face = -side;
        f.k2 = 0.9;
        var h = pl.who;
        if (h && h.a === 'hidden' && hideEv(h)) {
          pop('Hittad!', pl.x, pl.y - baseL * 0.9, baseL * 0.2, '#69db7c');
          say(f, 'Hittade dig, ' + h.look.name + '!', 1.6);
          setAct(h, 'found');
        } else {
          say(f, pick(['Inte här...', 'Ingen här!', 'Hmm, tomt.']), 1.2);
        }
      }
    },
    pose: function (f, p) {
      if (f.k2 > 0) { p.tilt = Math.sin(clock * 4) * 0.25; p.expr = 'o'; return; }
      walkPose(p, f.phase, 1);
      p.tilt = Math.sin(clock * 3) * 0.2;
      p.expr = 'sneaky';
    }
  };

  ACT.found = {
    dur: 1e9,
    start: function (f) {
      hop(f, 0.6);
      say(f, pick(['Åh nej!', 'Du hittade mig!', 'Hihi, här var jag!']), 1.6);
    },
    update: function (f, dt) {
      var e = hideEv(f);
      if (!e) return setAct(f, 'walk');
      if (f.t < 1) return;
      if (!f.home) f.home = homeSpot(e);
      if (moveTo(f, f.home[0], f.home[1], WALK * baseL * 1.1, dt)) setAct(f, 'athome');
    },
    pose: function (f, p) {
      if (f.t < 1) { armsUp(p); p.expr = 'laugh'; } else walkPose(p, f.phase, 1);
    }
  };

  ACT.runhome = {
    dur: 1e9,
    start: function (f) { say(f, pick(['Nu springer jag!', 'Hihi!']), 1); },
    update: function (f, dt) {
      var e = hideEv(f);
      if (!e) return setAct(f, 'walk');
      if (!f.home) f.home = homeSpot(e);
      if (moveTo(f, f.home[0], f.home[1], WALK * baseL * 1.9 * f.look.h, dt)) {
        e.free = true;
        f.place.checked = true;
        pop('Ett, två, tre för mig!', f.x, f.y - f.L * 1.3, baseL * 0.16, '#ffd43b');
        setAct(f, 'athome');
      }
    },
    pose: function (f, p) { walkPose(p, f.phase, 1.4); p.lean = 0.22; p.expr = 'laugh'; }
  };

  ACT.athome = {
    dur: 1e9,
    update: function (f) { if (!hideEv(f)) setAct(f, 'walk'); },
    pose: function (f, p) {
      idlePose(f, p);
      if (Math.sin(clock * 2 + f.i * 2) > 0.85) { armsUp(p); p.expr = 'laugh'; }
    }
  };

  EV.hide = {
    act: function (f, e) {
      if (f === e.seeker) return 'seekcount';
      f.home = null;
      return 'hiderun';
    },
    setup: function (e) {
      var m = e.members, i, k, x, y;
      e.seeker = m[0];
      e.dir = Math.random() < 0.5 ? 1 : -1;
      e.base = [clamp(m[0].x, xMin + baseL * 2, xMax - baseL * 2), clamp(m[0].y, yTop + baseL * 0.3, yBot)];
      e.tree = [e.base[0] + e.dir * baseL * 0.28, e.base[1] - 3];
      e.home = 0;
      e.dur = 70;
      e.places = [];
      // gömställen långt från boet och från varandra (ett extra som är tomt)
      for (i = 0; i < m.length; i++) {
        for (k = 0; k < 40; k++) {
          x = rand(xMin + baseL * 0.5, xMax - baseL * 0.5);
          y = rand(lerp(yTop, yBot, 0.25), yBot - baseL * 0.05);
          var ok2 = Math.abs(x - e.base[0]) > baseL * 1.8;
          for (var j = 0; j < e.places.length && ok2; j++) {
            if (Math.abs(x - e.places[j].x) < baseL * 1.3 && Math.abs(y - e.places[j].y) < baseL * 0.6) ok2 = false;
          }
          if (ok2) break;
        }
        e.places.push({ x: x, y: y, kind: i % 2 ? 'box' : 'bush', who: null, checked: false });
      }
      shuffle(e.places);
      for (i = 1; i < m.length; i++) { e.places[i - 1].who = m[i]; m[i].place = e.places[i - 1]; }
      m[0].place = null;
    },
    start: function (e) {
      say(e.seeker, 'Kurragömma! Jag räknar!', 1.4);
    },
    update: function (e, dt) {
      var s = e.seeker;
      if (e.done && s.k2 <= 0) return endEvent(e);
      if (!s.alive || s.ev !== e) return endEvent(e);
      // någon smiter hem när den som letar är långt bort
      if (s.a === 'seek' && Math.abs(s.x - e.base[0]) > baseL * 3 && Math.random() < 0.07 * dt) {
        var m = members(e).filter(function (f) { return f.a === 'hidden'; });
        if (m.length) setAct(pick(m), 'runhome');
      }
    },
    draw: function (ctx, e, a) {
      // trädet vid boet
      var L = depthL(e.base[1]), x = e.tree[0], y = e.tree[1];
      ctx.globalAlpha = a;
      ctx.lineWidth = Math.max(1, L * 0.012);
      ctx.strokeStyle = INK;
      ctx.fillStyle = '#8d6340';
      ctx.fillRect(x - L * 0.07, y - L * 1.1, L * 0.14, L * 1.1);
      ctx.strokeRect(x - L * 0.07, y - L * 1.1, L * 0.14, L * 1.1);
      ctx.fillStyle = '#5fae4a';
      var blobs = [[0, -1.45, 0.42], [-0.32, -1.2, 0.3], [0.32, -1.2, 0.3], [0, -1.12, 0.3]];
      for (var i = 0; i < blobs.length; i++) {
        ctx.beginPath();
        ctx.arc(x + blobs[i][0] * L, y + blobs[i][1] * L, blobs[i][2] * L, 0, TWO_PI);
        ctx.fill();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    drawFront: function (ctx, e, a) {
      ctx.globalAlpha = a;
      ctx.strokeStyle = INK;
      for (var i = 0; i < e.places.length; i++) {
        var pl = e.places[i], L = depthL(pl.y), x = pl.x, y = pl.y + L * 0.03;
        ctx.lineWidth = Math.max(1, L * 0.012);
        if (pl.kind === 'bush') {
          L *= 1.3;
          ctx.fillStyle = '#69b34c';
          var b = [[-0.3, -0.25, 0.25], [0.3, -0.25, 0.25], [0, -0.42, 0.3], [-0.12, -0.2, 0.25], [0.15, -0.18, 0.25]];
          ctx.beginPath();
          for (var k = 0; k < b.length; k++) {
            ctx.moveTo(x + b[k][0] * L + b[k][2] * L, y + b[k][1] * L);
            ctx.arc(x + b[k][0] * L, y + b[k][1] * L, b[k][2] * L, 0, TWO_PI);
          }
          ctx.fill();
          ctx.stroke();
          ctx.fill();
          ctx.fillStyle = '#e03131';
          for (k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.arc(x + (k - 1.5) * L * 0.17, y - L * (0.3 + 0.12 * (k % 2)), L * 0.025, 0, TWO_PI);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = '#c8995e';
          ctx.fillRect(x - L * 0.42, y - L * 0.68, L * 0.84, L * 0.68);
          ctx.strokeRect(x - L * 0.42, y - L * 0.68, L * 0.84, L * 0.68);
          ctx.beginPath();
          ctx.moveTo(x - L * 0.42, y - L * 0.68);
          ctx.lineTo(x - L * 0.58, y - L * 0.82);
          ctx.moveTo(x + L * 0.42, y - L * 0.68);
          ctx.lineTo(x + L * 0.58, y - L * 0.82);
          ctx.moveTo(x, y - L * 0.68);
          ctx.lineTo(x, y - L * 0.38);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
  };

  // ---- favoritlekar
  // Nils kör sin trampbil (en röd traktor) och leker på magen med sina
  // bondgårdsfordon; Althea leker med slime och klär ut sig.

  ACT.pedalcar = {
    dur: [12, 16],
    start: function (f) {
      f.vehicle = 'tractor';
      f.gx = f.x; f.gy = f.y;
      say(f, pick(['Brum brum! Jag kör traktor!', 'Nu kör jag min traktor!']), 2);
    },
    update: function (f, dt) {
      var x = f.x, y = f.y;
      if (moveTo(f, f.gx, f.gy, WALK * baseL * 1.3, dt)) newGoal(f);
      var d = Math.sqrt((f.x - x) * (f.x - x) + (f.y - y) * (f.y - y));
      f.wheel += d / (0.13 * f.L);
      if (Math.random() < 0.15 * dt) say(f, pick(['Brum brum!', 'Tut tut!', 'Akta er, här kommer jag!', 'Jag är bonde!']), 1.4);
      if (Math.random() < 0.06 * dt) pop('TUT TUT!', f.x + f.face * f.L * 0.4, f.y - f.L * 0.7, f.L * 0.16, '#ff6b6b');
    },
    end: function (f) {
      f.vehicle = null;
      props.push({ type: 'tractor', x: f.x, y: f.y, t: 0, life: 6, L: f.L, face: f.face, wheel: f.wheel });
      say(f, pick(['Nu parkerar jag!', 'Traktorn ska vila.']), 1.6);
      finish(f);
    },
    pose: function (f, p) {
      var a = f.wheel * 0.5;
      p.free = 0.2;
      p.lean = 0.1;
      p.lf1 = 1.25 + 0.25 * Math.sin(a); p.lf2 = -1.2 - 0.35 * Math.sin(a);
      p.lb1 = 1.25 - 0.25 * Math.sin(a); p.lb2 = -1.2 + 0.35 * Math.sin(a);
      p.hf = ['b', 0.15, -0.14]; p.hb = ['b', 0.13, -0.13];
      p.expr = 'laugh';
    }
  };

  ACT.farmtoys = {
    dur: [12, 16],
    start: function (f) {
      f.toyCol = pick(['#2f9e44', '#e03131']);
      props.push({ type: 'barn', x: clamp(f.x + f.face * f.L * 1.5, xMin, xMax), y: f.y + 2, t: 0, life: f.dur + 1, L: f.L });
      say(f, pick(['Jag leker med traktorerna!', 'Nu ska vi köra till ladan!']), 2);
    },
    update: function (f, dt) {
      if (f.t > 1 && f.t < f.dur - 1 && Math.random() < 0.25 * dt) {
        say(f, pick(['Brrrm!', 'Muuu!', 'Traktorn kör till ladan!', 'Nu skördar vi!', 'Tuut!']), 1.4);
      }
    },
    pose: function (f, p) {
      var t = f.t, end = f.dur - 0.9;
      var u = t < 0.9 ? ease(t / 0.9) : t < end ? 1 : 1 - ease((t - end) / 0.9);
      // på magen, uppstödd på armbågarna, sparkar med benen
      p.rot = Math.PI / 2 * u;
      p.lean = -0.6 * u;
      p.tilt = (-Math.PI / 2 + 0.6) * u;
      p.lf1 = 0.05; p.lb1 = -0.03;
      p.lf2 = (-1.3 - 0.5 * Math.sin(clock * 4)) * u;
      p.lb2 = (-1.1 - 0.5 * Math.sin(clock * 4 + Math.PI)) * u;
      if (u > 0.6) {
        p.hf = ['b', 0.04, -0.5 - 0.12 * Math.sin(clock * 3)];
        p.hb = ['b', 0.05, -0.38];
      }
      p.expr = u > 0.6 ? (Math.sin(clock * 2) > 0 ? 'laugh' : 'grin') : 'grin';
    }
  };

  var SLIMES = ['#7ee081', '#ff8fd8', '#b197fc', '#66d9e8'];
  ACT.slime = {
    dur: [9, 12],
    start: function (f) {
      f.slimeCol = pick(SLIMES);
      say(f, pick(['Slime!', 'Kolla min slime!', 'Jag gör slime!']), 1.6);
    },
    update: function (f) {
      if (f.t > 3 && !f.k1) { f.k1 = 1; say(f, pick(['Den är så kladdig!', 'Kolla vad lång den blir!', 'Den glittrar!']), 1.8); }
      if (f.t > 6.5 && !f.k2) {
        f.k2 = 1;
        if (Math.random() < 0.45) {
          f.slimeHair = 18;
          pop('SPLOTT!', f.hx, f.hy - f.hr * 1.5, f.L * 0.16, f.slimeCol);
          say(f, pick(['Oj! Slime i håret!', 'Neeej, den fastnade i håret!']), 2);
        }
      }
    },
    pose: function (f, p) {
      sitPose(p);
      p.lean = 0.15;
      var s = Math.sin(f.t * 2.2);
      p.hf = ['b', 0.32 + 0.1 * s, -0.12 - 0.05 * s];
      p.hb = ['b', 0.12, -0.08];
      p.item = f.k2 && f.slimeHair > 0 && f.t < 8 ? null : 'slime';
      p.expr = s > 0.3 ? 'laugh' : 'grin';
      if (f.slimeHair > 0 && f.t < 8.5) { p.hf = ['h', 0.6, -1.2]; p.expr = 'scared'; }
    }
  };

  var COSTUMES = {
    princess: { hat: true, lines: ['Jag är en prinsessa!', 'Kolla min klänning!', 'Buga för prinsessan!'] },
    hero: { hat: false, lines: ['Jag är en superhjälte!', 'Jag kan flyga!', 'Supersnabb!'] },
    fairy: { hat: false, lines: ['Jag är en älva!', 'Pling! Nu trollar jag!', 'Älvstoft!'] },
    pirate: { hat: true, lines: ['Arrr! Jag är en pirat!', 'Var är skatten?', 'Arrr!'] }
  };

  ACT.dressup = {
    dur: 3.2,
    start: function (f) {
      f.chest = { type: 'chest', x: clamp(f.x + f.face * f.L * 0.38, xMin, xMax), y: f.y + 2, t: 0, life: 5, L: f.L };
      props.push(f.chest);
      say(f, pick(['Utklädningslådan!', 'Vad ska jag klä ut mig till?']), 1.4);
    },
    update: function (f) {
      if (f.t < 1.4 && Math.random() < 0.25) {
        emit('shred', f.chest.x, f.chest.y - f.L * 0.2, rand(-1, 1) * 200 * scale, -rand(250, 450) * scale,
          rand(0.6, 1), f.L * 0.03, pick(CONFETTI));
      }
      if (f.t > 1.5 && !f.k1) {
        f.k1 = 1;
        var keys = Object.keys(COSTUMES);
        f.costume = pick(keys.filter(function (c) { return c !== f.costume; }));
        f.costumeT = 25;
        pop('POFF!', f.x, f.y - f.L * 0.6, f.L * 0.22, '#e599f7');
        for (var i = 0; i < 8; i++) {
          emit('cloud', f.x + rand(-0.3, 0.3) * f.L, f.y - f.L * rand(0.1, 0.8), rand(-30, 30) * scale, -rand(10, 40) * scale,
            rand(0.6, 1), f.L * rand(0.08, 0.14), '');
        }
        say(f, COSTUMES[f.costume].lines[0], 2);
      }
      if (f.t > 2.6 && !f.k2) {
        f.k2 = 1;
        var list = [];
        for (i = 0; i < count; i++) if (figs[i] !== f && free(figs[i])) list.push(figs[i]);
        var g = nearest(f, list);
        if (g) say(g, pick(['Vad fin du är, ' + f.look.name + '!', 'Coolt!', 'Wow!']), 1.8);
      }
    },
    pose: function (f, p) {
      if (f.t < 1.5) {
        p.lean = 0.85;
        p.lf1 = 0.3; p.lf2 = -0.5;
        p.af1 = 0.9 + 0.3 * Math.sin(f.t * 14); p.ab1 = 0.7 + 0.3 * Math.sin(f.t * 12 + 1);
        p.expr = 'sneaky';
      } else {
        armsUp(p);
        p.expr = 'laugh';
      }
    }
  };

  // ---- iPad
  // Alla sätter sig och tittar på iPaden; på skärmen hoppar en blå figur.
  EV.ipad = {
    act: 'ipad',
    setup: function (e) {
      var n = e.members.length;
      e.dir = Math.random() < 0.5 ? 1 : -1;
      e.y = rand(lerp(yTop, yBot, 0.35), lerp(yTop, yBot, 0.8));
      e.x = e.dir > 0 ? clamp(rand(xMin, xMax), xMin + baseL * (1 + 0.45 * n), xMax - baseL * 0.4)
        : clamp(rand(xMin, xMax), xMin + baseL * 0.4, xMax - baseL * (1 + 0.45 * n));
      e.dur = 14;
      for (var i = 0; i < n; i++) {
        e.spots.push([e.x - e.dir * baseL * (0.55 + 0.42 * i), e.y + (i % 2 ? 0.14 : -0.06) * baseL, e.dir]);
      }
    },
    start: function (e) { sayOne(e, ['iPad!', 'Vi tittar på iPaden!', 'Sätt på Stitch!']); },
    update: function (e, dt) {
      if (Math.random() < 0.35 * dt) {
        sayOne(e, ['Kolla!', 'Haha, titta!', 'Min tur!', 'Stitch!', 'Spela igen!', 'Jag vill välja!', 'Shhh, jag tittar!']);
      }
    },
    draw: function (ctx, e, a) {
      var L = depthL(e.y), w = L * 0.42, h = L * 0.3, x = e.x - w / 2, y = e.y - h - L * 0.06;
      ctx.globalAlpha = a;
      ctx.lineWidth = Math.max(1, L * 0.012);
      ctx.strokeStyle = INK;
      // stöd
      ctx.beginPath();
      ctx.moveTo(e.x - e.dir * w * 0.15, e.y);
      ctx.lineTo(e.x, y + h);
      ctx.stroke();
      // skärmens sken
      ctx.fillStyle = 'rgba(120, 190, 255, 0.18)';
      ctx.beginPath();
      ctx.ellipse(e.x - e.dir * w * 0.6, y + h * 0.5, w * 1.1, h * 1.1, 0, 0, TWO_PI);
      ctx.fill();
      roundRect(ctx, x, y, w, h, L * 0.03);
      ctx.fillStyle = '#2b2b33';
      ctx.fill();
      ctx.stroke();
      var m = L * 0.02;
      ctx.fillStyle = '#9bd4ff';
      ctx.fillRect(x + m, y + m, w - 2 * m, h - 2 * m);
      // tecknad film: en blå figur som hoppar
      var bx = x + w / 2 + Math.sin(clock * 1.7) * w * 0.25, by = y + h * 0.62 - Math.abs(Math.sin(clock * 4)) * h * 0.25;
      ctx.fillStyle = '#7ec97a';
      ctx.fillRect(x + m, y + h * 0.75, w - 2 * m, h * 0.25 - m);
      ctx.fillStyle = '#4c7fe0';
      ctx.beginPath();
      ctx.arc(bx, by, h * 0.13, 0, TWO_PI);
      ctx.ellipse(bx - h * 0.13, by - h * 0.1, h * 0.05, h * 0.11, -0.6, 0, TWO_PI);
      ctx.ellipse(bx + h * 0.13, by - h * 0.1, h * 0.05, h * 0.11, 0.6, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(bx - h * 0.04, by - h * 0.02, h * 0.025, 0, TWO_PI);
      ctx.arc(bx + h * 0.04, by - h * 0.02, h * 0.025, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  ACT.ipad = {
    dur: 1e9,
    update: function (f) { if (!f.ev || f.ev !== event || event.ending) setAct(f, 'walk'); },
    pose: function (f, p) {
      sitPose(p);
      p.lean = 0.12;
      p.hf = ['b', 0.2, -0.05]; p.hb = ['b', 0.17, -0.04];
      var c = Math.sin(clock * 0.9 + f.i * 1.7);
      p.expr = c > 0.5 ? 'laugh' : c > -0.4 ? 'grin' : 'o';
      if (Math.sin(clock * 0.5 + f.i * 2.3) > 0.93) { p.hf = ['b', 0.5, -0.1]; }  // pekar på skärmen
    }
  };

  // ---- ritning: fordon, utklädnad, leksaker
  function drawTractor(g, wheel, front) {
    g.lineWidth = 0.012;
    g.strokeStyle = INK;
    if (!front) {
      // stort bakhjul med skärm
      g.beginPath();
      g.arc(-0.05, 0.07, 0.13, 0, TWO_PI);
      g.fillStyle = '#2b2b33';
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(-0.05, 0.07, 0.065, 0, TWO_PI);
      g.fillStyle = '#ffd43b';
      g.fill();
      g.stroke();
      g.beginPath();
      for (var k = 0; k < 3; k++) {
        var a = wheel + k * Math.PI / 3;
        g.moveTo(-0.05 - Math.cos(a) * 0.065, 0.07 - Math.sin(a) * 0.065);
        g.lineTo(-0.05 + Math.cos(a) * 0.065, 0.07 + Math.sin(a) * 0.065);
      }
      g.stroke();
      g.beginPath();
      g.arc(-0.05, 0.07, 0.16, Math.PI * 1.05, Math.PI * 1.75);
      g.lineWidth = 0.035;
      g.strokeStyle = INK;
      g.stroke();
      g.lineWidth = 0.022;
      g.strokeStyle = '#e03131';
      g.stroke();
      g.lineWidth = 0.012;
      g.strokeStyle = INK;
      return;
    }
    // motorhuv, avgasrör, ratt och framhjul
    roundRect(g, 0.04, -0.05, 0.44, 0.16, 0.04);
    g.fillStyle = '#e03131';
    g.fill();
    g.stroke();
    g.fillStyle = '#fff';
    g.fillRect(0.42, -0.02, 0.04, 0.08);
    g.beginPath();
    g.moveTo(0.36, -0.05);
    g.lineTo(0.36, -0.15);
    g.lineWidth = 0.025;
    g.stroke();
    g.beginPath();
    g.moveTo(0.18, -0.05);
    g.lineTo(0.13, -0.14);
    g.lineWidth = 0.016;
    g.stroke();
    g.beginPath();
    g.ellipse(0.13, -0.145, 0.045, 0.014, -0.3, 0, TWO_PI);
    g.fillStyle = INK;
    g.fill();
    g.lineWidth = 0.012;
    g.beginPath();
    g.arc(0.38, 0.13, 0.07, 0, TWO_PI);
    g.fillStyle = '#2b2b33';
    g.fill();
    g.stroke();
    g.beginPath();
    g.arc(0.38, 0.13, 0.03, 0, TWO_PI);
    g.fillStyle = '#ffd43b';
    g.fill();
  }

  function costumeBack(g, f) {
    var p = f.p;
    g.save();
    g.rotate(p.lean);
    g.lineWidth = 0.012;
    g.strokeStyle = INK;
    if (f.costume === 'hero') {
      var fl = Math.sin(clock * 8 + f.i) * 0.03 + (f.a === 'walk' ? 0.08 : 0);
      g.beginPath();
      g.moveTo(-0.02, -0.23);
      g.lineTo(0.03, -0.23);
      g.quadraticCurveTo(-0.02, 0.0, -0.12 - fl, 0.16);
      g.lineTo(-0.26 - fl * 2, 0.12);
      g.quadraticCurveTo(-0.12, -0.05, -0.02, -0.23);
      g.fillStyle = '#e03131';
      g.fill();
      g.stroke();
    } else if (f.costume === 'fairy') {
      var w = 0.8 + 0.2 * Math.sin(clock * 14);
      g.fillStyle = 'rgba(165, 216, 255, 0.75)';
      g.beginPath();
      g.ellipse(-0.17, -0.3, 0.17 * w, 0.09, -0.7, 0, TWO_PI);
      g.fill();
      g.stroke();
      g.beginPath();
      g.ellipse(-0.14, -0.12, 0.12 * w, 0.065, 0.6, 0, TWO_PI);
      g.fill();
      g.stroke();
    }
    g.restore();
  }

  // Huvudbonader och mask ritas i huvudradier efter håret.
  function costumeHead(g, f) {
    var c = f.costume;
    g.lineWidth = 0.1;
    g.strokeStyle = INK;
    if (c === 'princess') {
      g.beginPath();
      g.moveTo(-0.55, -0.85);
      g.lineTo(-0.6, -1.35);
      g.lineTo(-0.3, -1.08);
      g.lineTo(0, -1.45);
      g.lineTo(0.3, -1.08);
      g.lineTo(0.6, -1.35);
      g.lineTo(0.55, -0.85);
      g.closePath();
      g.fillStyle = '#ffd43b';
      g.fill();
      g.stroke();
      g.fillStyle = '#e64980';
      g.beginPath();
      g.arc(0, -1.05, 0.09, 0, TWO_PI);
      g.fill();
    } else if (c === 'pirate') {
      g.beginPath();
      g.moveTo(-1.35, -0.7);
      g.quadraticCurveTo(0, -0.5, 1.35, -0.7);
      g.quadraticCurveTo(1.0, -1.1, 0.6, -0.95);
      g.quadraticCurveTo(0, -1.7, -0.6, -0.95);
      g.quadraticCurveTo(-1.0, -1.1, -1.35, -0.7);
      g.fillStyle = '#25262b';
      g.fill();
      g.stroke();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(0, -0.95, 0.13, 0, TWO_PI);
      g.fill();
      // ögonlapp
      g.beginPath();
      g.moveTo(-0.95, -0.45);
      g.lineTo(0.95, 0.05);
      g.lineWidth = 0.05;
      g.stroke();
      g.beginPath();
      g.ellipse(0.36, -0.08, 0.2, 0.18, 0, 0, TWO_PI);
      g.fillStyle = '#25262b';
      g.fill();
    } else if (c === 'hero') {
      // mask med ögonhål
      roundRect(g, -0.75, -0.3, 1.5, 0.38, 0.15);
      g.fillStyle = '#e03131';
      g.fill();
      for (var s = -1; s <= 1; s += 2) {
        g.beginPath();
        g.ellipse(s * 0.36, -0.1, 0.15, 0.11, 0, 0, TWO_PI);
        g.fillStyle = '#fff';
        g.fill();
        g.beginPath();
        g.arc(s * 0.36, -0.09, 0.07, 0, TWO_PI);
        g.fillStyle = INK;
        g.fill();
      }
    } else if (c === 'fairy') {
      var cols = ['#ff8fab', '#ffd43b', '#b197fc', '#ff8fab', '#ffd43b'];
      for (var i = 0; i < 5; i++) {
        g.beginPath();
        g.arc(-0.7 + i * 0.35, -0.92 - Math.sin(i / 4 * Math.PI) * 0.18, 0.15, 0, TWO_PI);
        g.fillStyle = cols[i];
        g.fill();
      }
    }
    if (f.slimeHair > 0) {
      g.beginPath();
      g.ellipse(0.45, -0.95, 0.35, 0.22, 0.3, 0, TWO_PI);
      g.moveTo(0.6, -0.8);
      g.ellipse(0.6, -0.65, 0.07, 0.18, 0, 0, TWO_PI);
      g.fillStyle = f.slimeCol;
      g.fill();
    }
  }

  function drawGown(g) {
    skirtPath(g, 0.42, 0.21);
    g.fillStyle = '#ff9ad5';
    g.fill();
    g.stroke();
    g.fillStyle = '#fff';
    for (var i = 0; i < 6; i++) {
      g.beginPath();
      g.arc(-0.12 + i * 0.05, 0.12 + (i % 2) * 0.12 + i * 0.03, 0.01, 0, TWO_PI);
      g.fill();
    }
  }

  // Leksakstraktorn i Nils hand och en släpvagn bakom, ritade upprätt i världen.
  function drawToy(ctx, f) {
    var x = f.wh[0], y = f.y - f.L * 0.01, s = f.L * 0.09, d = f.face;
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.strokeStyle = INK;
    // släp
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(x - d * s * 1.6 - s * 0.5, y - s * 0.6, s, s * 0.35);
    ctx.strokeRect(x - d * s * 1.6 - s * 0.5, y - s * 0.6, s, s * 0.35);
    ctx.beginPath();
    ctx.moveTo(x - d * s * 0.6, y - s * 0.3);
    ctx.lineTo(x - d * s * 1.1, y - s * 0.35);
    ctx.stroke();
    ctx.fillStyle = f.toyCol;
    ctx.fillRect(x - s * 0.6, y - s * 0.75, s * 1.2, s * 0.45);
    ctx.strokeRect(x - s * 0.6, y - s * 0.75, s * 1.2, s * 0.45);
    ctx.fillRect(x - d * s * 0.5 - s * 0.15, y - s * 1.15, s * 0.45, s * 0.42);
    ctx.strokeRect(x - d * s * 0.5 - s * 0.15, y - s * 1.15, s * 0.45, s * 0.42);
    ctx.fillStyle = '#2b2b33';
    ctx.beginPath();
    ctx.arc(x - d * s * 0.35, y - s * 0.28, s * 0.28, 0, TWO_PI);
    ctx.arc(x + d * s * 0.42, y - s * 0.17, s * 0.17, 0, TWO_PI);
    ctx.arc(x - d * s * 1.4, y - s * 0.18, s * 0.17, 0, TWO_PI);
    ctx.fill();
  }

  function drawBarn(ctx, x, y, L) {
    var w = L * 0.36, h = L * 0.26;
    ctx.lineWidth = Math.max(1, L * 0.01);
    ctx.strokeStyle = INK;
    ctx.fillStyle = '#c92a2a';
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.strokeRect(x - w / 2, y - h, w, h);
    ctx.beginPath();
    ctx.moveTo(x - w * 0.6, y - h);
    ctx.lineTo(x, y - h * 1.7);
    ctx.lineTo(x + w * 0.6, y - h);
    ctx.closePath();
    ctx.fillStyle = '#495057';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - w * 0.15, y - h * 0.6, w * 0.3, h * 0.6);
    ctx.strokeRect(x - w * 0.15, y - h * 0.6, w * 0.3, h * 0.6);
    ctx.beginPath();
    ctx.moveTo(x - w * 0.15, y - h * 0.6);
    ctx.lineTo(x + w * 0.15, y);
    ctx.moveTo(x + w * 0.15, y - h * 0.6);
    ctx.lineTo(x - w * 0.15, y);
    ctx.stroke();
  }

  function drawChest(ctx, x, y, L) {
    var w = L * 0.42, h = L * 0.24;
    ctx.lineWidth = Math.max(1, L * 0.012);
    ctx.strokeStyle = INK;
    ctx.fillStyle = '#9c36b5';
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.strokeRect(x - w / 2, y - h, w, h);
    // öppet lock
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h);
    ctx.lineTo(x - w * 0.4, y - h * 1.9);
    ctx.lineTo(x + w * 0.6, y - h * 1.9);
    ctx.lineTo(x + w / 2, y - h);
    ctx.fillStyle = '#be4bdb';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.arc(x, y - h * 0.55, L * 0.025, 0, TWO_PI);
    ctx.fill();
  }

  // ---- cykeltur
  // Alla cyklar på rad efter den som leder; Nils kör sin trampbilstraktor.
  var BIKES = { Ida: '#f06595', Althea: '#9775fa', Vienna: '#22b8cf' };

  EV.bike = {
    act: 'bike',
    setup: function (e) {
      e.dur = 16;
      for (var i = 0; i < e.members.length; i++) {
        var f = e.members[i];
        f.vehicle = f.look.name === 'Nils' ? 'tractor' : 'bike';
        f.leader = i ? e.members[i - 1] : null;
      }
    },
    start: function (e) {
      say(e.members[0], pick(['Nu cyklar vi!', 'Följ mig!', 'Cykeltur!']), 1.8);
      for (var i = 1; i < e.members.length; i++) say(e.members[i], pick(['Jaaa!', 'Vänta på mig!', 'Kom igen!']), 1.6);
    },
    update: function (e, dt) {
      if (Math.random() < 0.3 * dt) sayOne(e, ['Pling pling!', 'Vänta på mig!', 'Snabbare!', 'Vad kul!', 'Vi är ett cykelgäng!']);
      if (Math.random() < 0.12 * dt) {
        var m = members(e), f = pick(m);
        if (f) pop(f.vehicle === 'tractor' ? 'TUT TUT!' : 'PLING!', f.x + f.face * f.L * 0.4, f.y - f.L * 0.9, f.L * 0.15, '#ffd43b');
      }
    },
    leave: function (f) {
      f.vehicle = null;
      f.leader = null;
      setAct(f, 'walk');
      if (Math.random() < 0.5) say(f, pick(['Vad kul att cykla!', 'Puh, nu är jag trött!']), 1.8);
    },
    draw: function () {}
  };

  ACT.bike = {
    dur: 1e9,
    start: function (f) { f.gx = f.x; f.gy = f.y; },
    update: function (f, dt) {
      if (!f.ev || f.ev !== event || event.ending) { f.vehicle = null; return setAct(f, 'walk'); }
      var x = f.x, y = f.y, v = WALK * baseL * 1.5, l = f.leader;
      while (l && (!l.alive || l.ev !== f.ev)) l = l.leader;
      if (l) {
        // följ den framför, en bit bakom
        var tx = clamp(l.x - l.face * baseL * 0.95, xMin, xMax), ty = l.y;
        var dx = tx - f.x, dy = ty - f.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d > baseL * 0.08) moveTo(f, tx, ty, v * clamp(d / baseL, 0.6, 1.6), dt);
        else f.face = l.face;
      } else if (moveTo(f, f.gx, f.gy, v, dt)) {
        f.gx = clamp(f.x + (Math.random() < 0.5 ? -1 : 1) * rand(0.3, 0.6) * W, xMin, xMax);
        f.gy = rand(yTop, yBot);
      }
      var d2 = Math.sqrt((f.x - x) * (f.x - x) + (f.y - y) * (f.y - y));
      f.wheel += d2 / (0.12 * f.L);
    },
    pose: function (f, p) {
      if (f.vehicle === 'tractor') return ACT.pedalcar.pose(f, p);
      var a = f.wheel * 0.6;
      p.free = 0.34;
      p.lean = 0.25;
      p.ff = ['b', 0.05 + Math.cos(a) * 0.055, 0.2 + Math.sin(a) * 0.055];
      p.fb = ['b', 0.05 - Math.cos(a) * 0.055, 0.2 - Math.sin(a) * 0.055];
      p.hf = ['b', 0.22, -0.1]; p.hb = ['b', 0.2, -0.09];
      p.expr = 'laugh';
    }
  };

  function drawBike(g, f, front) {
    if (front) return;
    var col = BIKES[f.look.name] || '#4dabf7', w = f.wheel, k, a;
    g.lineWidth = 0.014;
    g.strokeStyle = INK;
    for (var n = 0; n < 2; n++) {
      var cx = n ? 0.27 : -0.19, cy = 0.22;
      g.beginPath();
      g.arc(cx, cy, 0.115, 0, TWO_PI);
      g.lineWidth = 0.025;
      g.stroke();
      g.lineWidth = 0.006;
      g.beginPath();
      for (k = 0; k < 4; k++) {
        a = w + k * Math.PI / 4;
        g.moveTo(cx - Math.cos(a) * 0.11, cy - Math.sin(a) * 0.11);
        g.lineTo(cx + Math.cos(a) * 0.11, cy + Math.sin(a) * 0.11);
      }
      g.stroke();
    }
    // ram, sadel, styre och vevpartiet
    g.lineWidth = 0.022;
    g.strokeStyle = col;
    g.beginPath();
    g.moveTo(-0.19, 0.22);
    g.lineTo(0.05, 0.2);
    g.lineTo(0.22, -0.02);
    g.lineTo(-0.02, 0.02);
    g.lineTo(-0.19, 0.22);
    g.moveTo(-0.02, 0.02);
    g.lineTo(0.05, 0.2);
    g.moveTo(0.22, -0.02);
    g.lineTo(0.27, 0.22);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = 0.016;
    g.beginPath();
    g.moveTo(0.22, -0.02);
    g.lineTo(0.2, -0.1);
    g.lineTo(0.25, -0.11);
    g.stroke();
    g.beginPath();
    g.ellipse(-0.03, 0.0, 0.055, 0.016, 0, 0, TWO_PI);
    g.fillStyle = INK;
    g.fill();
    a = w * 0.6;
    g.beginPath();
    g.moveTo(0.05 + Math.cos(a) * 0.055, 0.2 + Math.sin(a) * 0.055);
    g.lineTo(0.05 - Math.cos(a) * 0.055, 0.2 - Math.sin(a) * 0.055);
    g.lineWidth = 0.012;
    g.stroke();
    // korg med blomma framtill
    if (f.look.name !== 'Vienna') {
      g.fillStyle = '#e8c48a';
      g.fillRect(0.24, -0.08, 0.08, 0.06);
      g.lineWidth = 0.008;
      g.strokeRect(0.24, -0.08, 0.08, 0.06);
    }
  }

  // ---- disco (Vienna)
  var DISCO = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#da77f2', '#ff922b'];
  ACT.disco = {
    dur: [10, 13],
    start: function (f) {
      f.disco = { type: 'disco', x: f.x, y: f.y, t: 0, life: f.dur + 0.5, L: f.L };
      props.push(f.disco);
      say(f, pick(['Disco!', 'Nu blir det disco!', 'Musik!']), 1.6);
      f.emit = 0;
    },
    update: function (f, dt) {
      var b = f.t * 2.2;
      f.z = Math.abs(Math.sin(b * Math.PI)) * 0.04 * f.L;
      var nb = (b / 2) | 0;
      if (nb !== f.k2) { f.k2 = nb; f.face = -f.face; }
      f.emit -= dt;
      if (f.emit <= 0) {
        f.emit = 0.45;
        emit('note', f.hx + rand(-1, 1) * f.L * 0.3, f.hy - f.L * 0.15, rand(-25, 25) * scale, -70 * scale, 1.6,
          f.L * 0.1, pick(DISCO));
      }
      if (f.t > 1.5 && !f.k1) {
        f.k1 = 1;
        say(f, pick(['Dansa med mig!', 'Alla dansar!', 'Disco disco!']), 1.8);
        for (var i = 0; i < count; i++) {
          var g = figs[i];
          if (g !== f && free(g) && Math.abs(g.x - f.x) < 4 * f.L && Math.random() < 0.7) {
            setAct(g, 'dance');
            g.k3 = 1;
            g.dur = f.dur - f.t;
          }
        }
      }
      if (Math.random() < 0.15 * dt) say(f, pick(['Jag älskar disco!', 'Kolla mina moves!', 'Wooo!']), 1.4);
    },
    ownZ: true,
    end: function (f) { f.z = 0; finish(f); },
    pose: function (f, p) {
      var b = f.t * 2.2, up = (b | 0) % 2 === 0;
      // discopekning: ena armen snett upp, den andra mot höften
      if (up) { p.af1 = 1.9; p.af2 = 0.6; p.hb = ['b', -0.07, -0.04]; }
      else { p.af1 = 0.5; p.af2 = 0; p.ab1 = -0.5; p.ab2 = 0.3; }
      p.lean = 0.12 * Math.sin(b * Math.PI);
      p.lf1 = 0.25; p.lf2 = -0.3 - 0.2 * Math.abs(Math.sin(b * Math.PI)); p.lb1 = -0.15; p.lb2 = -0.2;
      p.expr = up ? 'laugh' : 'grin';
    }
  };

  // Discokula i en lina från taket och färgade ljusfläckar på golvet.
  function drawDisco(ctx, pr) {
    var L = pr.L, a = Math.min(1, pr.t * 2, (pr.life - pr.t) * 2), i;
    var bx = pr.x, by = Math.max(L * 0.3, pr.y - L * 1.55);
    ctx.globalAlpha = a * 0.35;
    for (i = 0; i < 7; i++) {
      var ang = clock * 1.5 + i * TWO_PI / 7;
      ctx.fillStyle = DISCO[i % DISCO.length];
      ctx.beginPath();
      ctx.ellipse(pr.x + Math.cos(ang) * L * 0.9, pr.y + Math.sin(ang) * L * 0.18, L * 0.16, L * 0.05, 0, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = a;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, L * 0.01);
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx, by - L * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx, by, L * 0.12, 0, TWO_PI);
    ctx.fillStyle = '#ced4da';
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (i = 0; i < 12; i++) {
      ctx.fillStyle = (i + ((clock * 6) | 0)) % 3 ? '#e9ecef' : '#fff';
      ctx.fillRect(bx - L * 0.12 + (i % 4) * L * 0.06, by - L * 0.12 + ((i / 4) | 0) * L * 0.08, L * 0.055, L * 0.07);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(bx, by, L * 0.12, 0, TWO_PI);
    ctx.stroke();
    // ljusstrålar
    ctx.globalAlpha = a * 0.5;
    ctx.lineWidth = Math.max(1, L * 0.008);
    for (i = 0; i < 6; i++) {
      var r = clock * 2 + i;
      ctx.strokeStyle = DISCO[i];
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(r) * L * 0.5, by + Math.abs(Math.sin(r)) * L * 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  EV.socks = {
    act: 'sockrun',
    setup: function (e) {
      e.dur = 14;
      for (var i = 0; i < e.members.length; i++) { e.members[i].sockT = 1; e.members[i].dirt = 0; }
    },
    start: function (e) {
      say(e.members[0], 'Vi springer ut i bara strumporna!', 2.2);
      for (var i = 1; i < e.members.length; i++) say(e.members[i], pick(['Jaaa!', 'Kom igen!', 'Wiii!']), 1.6);
    },
    update: function (e, dt, t) {
      if (t > 7 && !e.k) { e.k = 1; sayOne(e, ['Strumporna blir smutsiga!', 'Hihi, det är blött i gräset!']); }
    },
    leave: function (f, e) {
      f.sockT = 0;
      setAct(f, 'walk');
      if (f === e.members[0]) say(f, pick(['Oj, vad smutsiga strumporna blev!', 'Hoppsan, bruna strumpor!']), 2.2);
    },
    draw: function () {}
  };

  // ---------------------------------------------------------------- hjälp för ritning och stänk
  function mix(a, b, u) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var r = Math.round(lerp(x >> 16, y >> 16, u)), g = Math.round(lerp((x >> 8) & 255, (y >> 8) & 255, u));
    var bl = Math.round(lerp(x & 255, y & 255, u));
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function splash(x, y, s, n) {
    for (var i = 0; i < n; i++) {
      emit('drop', x + rand(-1, 1) * s, y, rand(-1, 1) * 160 * scale, -rand(150, 420) * scale,
        rand(0.3, 0.6), Math.max(1.5, s * 0.12), '#74c0fc');
    }
  }

  function drawWaterline(ctx, f, wl) {
    ctx.lineWidth = Math.max(1, f.L * 0.012);
    if (f.look.name === 'Nils') {
      // Nils har badring
      ctx.lineWidth = f.L * 0.06;
      ctx.strokeStyle = '#ffa94d';
      ctx.beginPath();
      ctx.ellipse(f.x, wl, f.L * 0.17, f.L * 0.05, 0, 0, TWO_PI);
      ctx.stroke();
      ctx.lineWidth = Math.max(1, f.L * 0.012);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.ellipse(f.x, wl, f.L * 0.2, f.L * 0.035, 0, 0, TWO_PI);
    ctx.stroke();
  }

  function drawSpider(ctx, x, y, s) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, s * 0.15);
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var w = Math.sin(clock * 12 + i) * 0.2;
      for (var k = -1; k <= 1; k += 2) {
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + k * s * 0.9, y - s * (0.5 - i * 0.25 + w), x + k * s * 1.3, y + s * (0.2 + i * 0.15));
      }
    }
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.55, s * 0.45, 0, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - s * 0.18, y - s * 0.15, s * 0.12, 0, TWO_PI);
    ctx.arc(x + s * 0.18, y - s * 0.15, s * 0.12, 0, TWO_PI);
    ctx.fill();
  }

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
    if (p.ff) reach(j.lf, 0, 0, p.ff[1], p.ff[2], THIGH, SHIN, 1);
    else chain(j.lf, 0, 0, p.lf1, p.lf2, THIGH, SHIN);
    if (p.fb) reach(j.lb, 0, 0, p.fb[1], p.fb[2], THIGH, SHIN, 1);
    else chain(j.lb, 0, 0, p.lb1, p.lb2, THIGH, SHIN);
    arm(j, j.af, p.hf, p.af1, p.af2);
    arm(j, j.ab, p.hb, p.ab1, p.ab2);

    // Ställ figuren på marken: lägsta punkten (fötter, knän, händer, höft)
    // efter rotationen hamnar på y = 0. Liggande räknar även huvudet.
    var c = Math.cos(p.rot), s = Math.sin(p.rot), k = p.sx * s, m = 0;
    m = Math.max(m, j.lf[0] * k + j.lf[1] * c, j.lf[2] * k + j.lf[3] * c + 0.015);
    m = Math.max(m, j.lb[0] * k + j.lb[1] * c, j.lb[2] * k + j.lb[3] * c + 0.015);
    m = Math.max(m, j.af[2] * k + j.af[3] * c, j.ab[2] * k + j.ab[3] * c);
    if (Math.abs(s) > 0.5) m = Math.max(m, j.hx * k + j.hy * c + R * 0.9);
    f.gOff = p.free ? -p.free : -m;

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
    f.L = depthL(f.y) * f.look.h;
    f.t += dt;
    if (f.textT > 0) f.textT -= dt;
    if (f.starsT > 0) f.starsT -= dt;
    if (f.beard > 0) f.beard -= dt;
    if (f.ketchup > 0) f.ketchup -= dt;
    if (f.slimeHair > 0) f.slimeHair -= dt;
    if (f.costumeT > 0) {
      f.costumeT -= dt;
      if (f.costumeT <= 0) f.costume = null;
      else if (f.a === 'walk' && Math.random() < 0.04 * dt) say(f, pick(COSTUMES[f.costume].lines), 1.8);
    }
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
        if (q.type === 'wb') splash(q.x, q.y, q.s * 1.2, 16);
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
        case 'feather':
          q.vy += g * 0.15 * dt;
          q.vy *= 1 - 2 * dt;
          q.x += (q.vx + Math.sin(q.t * 5 + q.r) * 50 * scale) * dt;
          q.vx *= 1 - 2 * dt;
          q.y += q.vy * dt;
          q.r += q.w * 0.3 * dt;
          break;
        case 'wb':
          q.vy += DROP_G * scale * 0.6 * dt;
          q.x += q.vx * dt;
          q.y += q.vy * dt;
          q.r += 8 * dt;
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
    updateEvent(dt);
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

  // Sko, bar fot eller (i strumplöpningen) strumpa som blir smutsigare.
  function shoe(g, o, f) {
    var k = f.look, sock = f.sockT > 0;
    if (sock) cloth(g, [o[2], o[3] - 0.005, lerp(o[2], o[0], 0.25), lerp(o[3], o[1], 0.25)], 0.03, mix('#ffffff', '#8a6a48', f.dirt));
    g.beginPath();
    if (k.barefoot && !sock) g.ellipse(o[2] + 0.02, o[3] - 0.006, 0.038, 0.017, 0, 0, TWO_PI);
    else g.ellipse(o[2] + 0.025, o[3] - 0.004, 0.05, 0.024, 0, 0, TWO_PI);
    g.fillStyle = sock ? mix('#ffffff', '#8a6a48', f.dirt) : k.barefoot ? k.skin : k.shoes;
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

  // Tjock tygbit med kontur längs en polyline [x0, y0, x1, y1, ...].
  function cloth(g, pts, w, col) {
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.strokeStyle = INK;
    g.lineWidth = w + 0.024;
    g.stroke();
    g.strokeStyle = col;
    g.lineWidth = w;
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = LW;
  }

  function skirtPath(g, len, flare) {
    g.beginPath();
    g.moveTo(-0.07, -0.025);
    g.lineTo(0.07, -0.025);
    g.lineTo(flare, len);
    g.quadraticCurveTo(0, len + 0.025, -flare, len);
    g.closePath();
  }

  // Ben med (lång)byxor: tyget går nästan ner till foten.
  function leg(g, f, o) {
    var k = f.look;
    stroke3(g, 0, 0, o[0], o[1], o[2], o[3]);
    if (k.bottom === 'jeans' || k.bottom === 'pants') {
      cloth(g, [0, -0.01, o[0], o[1], lerp(o[0], o[2], 0.82), lerp(o[1], o[3], 0.82)], 0.06, k.cloth);
    }
    shoe(g, o, f);
  }

  // Arm med ärm: kort ärm en bit ner på överarmen, lång ärm nästan till handen.
  function arm2(g, f, o) {
    var j = f.j, k = f.look;
    stroke3(g, j.sx, j.sy, o[0], o[1], o[2], o[3]);
    if (k.sleeves === 'long') {
      cloth(g, [j.sx, j.sy, o[0], o[1], lerp(o[0], o[2], 0.75), lerp(o[1], o[3], 0.75)], 0.05, k.shirt);
    } else if (k.sleeves === 'short') {
      cloth(g, [j.sx, j.sy, lerp(j.sx, o[0], 0.45), lerp(j.sy, o[1], 0.45)], 0.055, k.shirt);
    }
  }

  function lowerClothes(g, f) {
    var k = f.look, i, s;
    g.lineWidth = 0.012;
    if (f.costume === 'princess') {
      drawGown(g);
    } else if (k.bottom === 'leopard') {
      skirtPath(g, 0.14, 0.125);
      g.fillStyle = '#ecdcc6';
      g.fill();
      g.save();
      g.clip();
      for (i = 0; i < SPOTS.length; i++) {
        s = SPOTS[i];
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
      skirtPath(g, 0.14, 0.125);
      g.stroke();
    } else if (k.bottom === 'dress') {
      skirtPath(g, 0.22, 0.15);
      g.fillStyle = k.cloth;
      g.fill();
      g.fillStyle = k.print;
      for (i = 0; i < PRINT.length; i++) {
        g.beginPath();
        g.arc(PRINT[i][0], PRINT[i][1], 0.012, 0, TWO_PI);
        g.fill();
      }
      skirtPath(g, 0.22, 0.15);
      g.stroke();
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
      case 'cone':
        // strut med en kula som blir mindre
        g.beginPath();
        g.moveTo(hx - 0.03, hy - 0.02);
        g.lineTo(hx + 0.03, hy - 0.02);
        g.lineTo(hx, hy + 0.08);
        g.closePath();
        g.fillStyle = '#e0a458';
        g.fill();
        g.stroke();
        g.beginPath();
        g.arc(hx, hy - 0.035, 0.04 * f.scoop, 0, TWO_PI);
        g.fillStyle = f.flavor;
        g.fill();
        g.stroke();
        break;
      case 'burger': {
        var k = 1 - f.bites * 0.13, bw = 0.06 * k, bx = hx + 0.02;
        var layers = [['#d9a05b', 0.018], ['#5b8c32', 0.008], ['#7a4524', 0.02], ['#ffd43b', 0.008], ['#e9b26b', 0.025]];
        var y = hy + 0.025;
        for (var i = 0; i < layers.length; i++) {
          var h = layers[i][1];
          roundRect(g, bx - bw, y - h, bw * 2, h, Math.min(h / 2, i === 4 ? h : 0.004));
          g.fillStyle = layers[i][0];
          g.fill();
          g.stroke();
          y -= h;
        }
        break;
      }
      case 'pillow':
        g.save();
        g.translate(hx, hy);
        g.rotate(0.4);
        roundRect(g, -0.02, -0.11, 0.09, 0.13, 0.03);
        g.fillStyle = '#fff';
        g.fill();
        g.stroke();
        g.restore();
        break;
      case 'wb':
        g.beginPath();
        g.ellipse(hx, hy - 0.03, 0.045, 0.04, 0, 0, TWO_PI);
        g.fillStyle = f.col;
        g.fill();
        g.stroke();
        break;
      case 'slime': {
        var bx = j.ab[2], by = j.ab[3], sag = 0.04 + 0.5 * Math.abs(hx - bx) * 0.3;
        g.beginPath();
        g.moveTo(bx, by);
        g.quadraticCurveTo((bx + hx) / 2, (by + hy) / 2 + sag, hx, hy);
        g.lineWidth = 0.05;
        g.strokeStyle = f.slimeCol;
        g.stroke();
        g.beginPath();
        g.arc(bx, by, 0.035, 0, TWO_PI);
        g.arc(hx, hy, 0.03, 0, TWO_PI);
        g.fillStyle = f.slimeCol;
        g.fill();
        g.fillStyle = '#fff';
        for (var q = 1; q < 4; q++) {
          g.beginPath();
          g.arc(lerp(bx, hx, q / 4), lerp(by, hy, q / 4) + sag * 0.5, 0.006, 0, TWO_PI);
          g.fill();
        }
        g.strokeStyle = INK;
        break;
      }
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

    if (f.costume) costumeBack(g, f);
    if (f.vehicle && (f.a === 'pedalcar' || f.a === 'bike' || f.a === 'steer')) {
      if (f.vehicle === 'bike') drawBike(g, f, false); else drawTractor(g, f.wheel, false);
    }
    if (!p.front) arm2(g, f, j.ab);
    leg(g, f, j.lb);

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

    leg(g, f, j.lf);
    lowerClothes(g, f);

    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(j.nx, j.ny);
    g.stroke();
    if (k.shirt) cloth(g, [0, -0.01, j.nx * 0.86, j.ny * 0.86], 0.075, k.shirt);
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
      arm2(g, f, j.af);
      if (p.fingers) { fingers(g, j.af); fingers(g, j.ab); }
    }

    g.save();
    g.translate(j.hx, j.hy);
    g.rotate(j.ht);
    g.scale(R, R);
    drawHead(g, f, p.expr);
    g.restore();

    if (p.front) {
      arm2(g, f, j.ab);
      arm2(g, f, j.af);
      hand(g, j.ab, k.skin);
      hand(g, j.af, k.skin);
    }
    if (p.item) drawItem(g, f);
    if (f.vehicle === 'tractor' && (f.a === 'pedalcar' || f.a === 'bike' || f.a === 'steer')) drawTractor(g, f.wheel, true);
    if (f.bag) {
      // sovsäck över kroppen, huvudet sticker upp
      g.lineWidth = 0.012;
      roundRect(g, -0.12, -0.24, 0.24, 0.7, 0.09);
      g.fillStyle = f.bag;
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(-0.12, -0.13);
      g.quadraticCurveTo(0, -0.1, 0.12, -0.13);
      g.stroke();
      g.save();
      g.translate(j.hx, j.hy);
      g.rotate(j.ht);
      g.scale(R, R);
      drawHead(g, f, p.expr);
      g.restore();
    }
    g.restore();
  }

  // ---------------------------------------------------------------- ritning: huvud
  // Huvudet ritas i huvudradier: mitten i origo, ansiktet mot betraktaren.
  function drawHead(g, f, ex) {
    var k = f.costume && COSTUMES[f.costume].hat && f.look.style === 'cap' ? f.look.bare : f.look;
    g.strokeStyle = INK;
    g.lineWidth = 0.15;
    hairBack(g, k);
    if (k.ears) {
      for (var s = -1; s <= 1; s += 2) {
        g.beginPath();
        g.ellipse(s * 1.0, 0.05, 0.22, 0.28, 0, 0, TWO_PI);
        g.fillStyle = k.skin;
        g.fill();
        g.stroke();
      }
    }

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
    if (f.ketchup > 0) {
      g.fillStyle = '#d63031';
      g.beginPath();
      g.ellipse(0.42, 0.5, 0.13, 0.07, 0.4, 0, TWO_PI);
      g.fill();
      g.beginPath();
      g.ellipse(-0.3, 0.68, 0.08, 0.05, 0, 0, TWO_PI);
      g.fill();
    }
    g.lineWidth = 0.15;
    hairFront(g, k);
    if (f.costume || f.slimeHair > 0) costumeHead(g, f);
    if (k.earring) {
      g.beginPath();
      g.arc(0.9, 0.42, 0.07, 0, TWO_PI);
      g.fillStyle = '#ffd43b';
      g.fill();
    }
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

  function hairLen(k) { return k.longer ? 1.55 : k.style === 'cap' ? 1.2 : 1.32; }

  function hairBack(g, k) {
    if (k.style !== 'long' && k.style !== 'cap') return;
    var n = hairLen(k);
    g.fillStyle = k.hair;
    g.beginPath();
    g.arc(0, -0.06, 1.12, Math.PI, TWO_PI);
    g.lineTo(1.16, n);
    g.quadraticCurveTo(0, n + 0.18, -1.16, n);
    g.closePath();
    g.fill();
    g.stroke();
  }

  // Raka slingor längs ansiktet ner över axlarna.
  function sideStrands(g, k, top) {
    var n = hairLen(k), s;
    for (s = -1; s <= 1; s += 2) {
      g.beginPath();
      g.moveTo(s * 0.9, top);
      g.quadraticCurveTo(s * 1.12, 0.3, s * 1.05, n - 0.02);
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
    for (s = -1; s <= 1; s += 2) {
      g.moveTo(s * 1.02, 0.1);
      g.quadraticCurveTo(s * 1.08, 0.7, s * 1.02, n - 0.07);
    }
    g.stroke();
  }

  function hairFront(g, k) {
    var s, b = k.part;
    g.fillStyle = k.hair;
    g.strokeStyle = INK;
    switch (k.style) {
      case 'long':
        // lugg som delas vid benan (b = benans läge i sidled)
        g.beginPath();
        g.moveTo(-1.09, -0.2);
        g.arc(0, -0.06, 1.1, Math.PI + 0.13, TWO_PI - 0.13);
        g.quadraticCurveTo(b + 0.6, -0.74, b, -0.68);
        g.quadraticCurveTo(b - 0.55, -0.76, -1.09, -0.2);
        g.closePath();
        g.fill();
        g.stroke();
        sideStrands(g, k, -0.5);
        g.beginPath();
        g.moveTo(b, -0.7);
        g.quadraticCurveTo(b * 0.9, -0.95, b * 0.4, -1.13);
        g.moveTo(b + 0.3, -0.76);
        g.quadraticCurveTo(b + 0.65, -0.65, 0.97, -0.3);
        g.moveTo(b - 0.35, -0.78);
        g.quadraticCurveTo(-0.7, -0.76, -0.97, -0.35);
        g.stroke();
        break;
      case 'short':
        g.beginPath();
        g.moveTo(-1.04, -0.3);
        g.arc(0, -0.05, 1.07, Math.PI + 0.24, TWO_PI - 0.24);
        g.lineTo(0.75, -0.5);
        g.lineTo(0.5, -0.64);
        g.lineTo(0.25, -0.5);
        g.lineTo(0, -0.64);
        g.lineTo(-0.25, -0.5);
        g.lineTo(-0.5, -0.64);
        g.lineTo(-0.75, -0.5);
        g.closePath();
        g.fill();
        g.stroke();
        break;
      case 'cap':
        // keps med Stitch-tryck och ljust hår som hänger ut under
        sideStrands(g, k, -0.25);
        g.strokeStyle = INK;
        g.lineWidth = 0.15;
        g.beginPath();
        g.arc(0, -0.2, 1.05, Math.PI, TWO_PI);
        g.closePath();
        g.fillStyle = k.cap;
        g.fill();
        g.stroke();
        g.beginPath();
        g.ellipse(0.7, -0.22, 0.75, 0.14, 0, 0, TWO_PI);
        g.fillStyle = k.capDark;
        g.fill();
        g.stroke();
        g.lineWidth = 0.06;
        for (s = -1; s <= 1; s += 2) {
          g.beginPath();
          g.ellipse(s * 0.32, -0.95, 0.12, 0.26, s * 0.5, 0, TWO_PI);
          g.fillStyle = '#7ea6dc';
          g.fill();
          g.stroke();
        }
        g.beginPath();
        g.ellipse(0, -0.68, 0.27, 0.24, 0, 0, TWO_PI);
        g.fill();
        g.stroke();
        g.beginPath();
        g.arc(-0.1, -0.72, 0.05, 0, TWO_PI);
        g.arc(0.1, -0.72, 0.05, 0, TWO_PI);
        g.fillStyle = INK;
        g.fill();
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
      } else if (pr.type === 'print') {
        ctx.globalAlpha *= pr.a * 0.6;
        ctx.fillStyle = '#7a5a3a';
        ctx.beginPath();
        ctx.ellipse(pr.x, pr.y, pr.L * 0.035, pr.L * 0.012, 0, 0, TWO_PI);
        ctx.fill();
      } else if (pr.type === 'splat') {
        ctx.fillStyle = pr.col;
        ctx.beginPath();
        ctx.ellipse(pr.x, pr.y, pr.L * 0.06, pr.L * 0.02, 0, 0, TWO_PI);
        ctx.fill();
      } else if (pr.type === 'disco') {
        drawDisco(ctx, pr);
      } else if (pr.type === 'barn') {
        drawBarn(ctx, pr.x, pr.y, pr.L);
      } else if (pr.type === 'chest') {
        drawChest(ctx, pr.x, pr.y, pr.L);
      } else if (pr.type === 'tractor') {
        ctx.save();
        ctx.translate(pr.x, pr.y - pr.L * 0.2);
        ctx.scale(pr.face * pr.L, pr.L);
        drawTractor(ctx, pr.wheel, false);
        drawTractor(ctx, pr.wheel, true);
        ctx.restore();
      } else if (pr.type === 'spider') {
        drawSpider(ctx, pr.x, pr.y - pr.L * 0.03, pr.L * 0.05);
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
      if (f.inWater) continue;
      var k = 1 / (1 + f.z / f.L), lie = Math.abs(Math.sin(f.p.rot));
      var rx = f.L * (0.17 + 0.3 * lie) * k, ry = f.L * 0.04 * k;
      var cx = f.x + f.face * Math.sin(f.p.rot) * f.L * 0.2;
      ctx.moveTo(cx + rx, f.y);
      ctx.ellipse(cx, f.y, rx, ry, 0, 0, TWO_PI);
    }
    ctx.fill();

    if (event) EV[event.type].draw(ctx, event, Math.min(event.fade, event.t * 2));
    drawProps(ctx);
    for (i = 0; i < count; i++) {
      f = sorted[i];
      if (!f.inWater) {
        drawFig(ctx, f);
        if (f.a === 'farmtoys' && f.p.hf) drawToy(ctx, f);
        continue;
      }
      // badande: bara det som är ovanför vattenytan syns
      var wl = f.y - f.L * 0.36;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, wl);
      ctx.clip();
      drawFig(ctx, f);
      ctx.restore();
      drawWaterline(ctx, f, wl);
    }
    if (event && EV[event.type].drawFront) EV[event.type].drawFront(ctx, event, Math.min(event.fade, event.t * 2));
    drawParts(ctx);
    for (i = 0; i < count; i++) if (sorted[i].starsT > 0) drawStars(ctx, sorted[i]);
    for (i = 0; i < count; i++) if (sorted[i].a === 'steer') drawSteerMark(ctx, sorted[i]);
    drawBubbles(ctx);
    drawPops(ctx);
  }

  // ---------------------------------------------------------------- styrning från appen
  // {"cmd": {"event": "pool"}}                – starta en gemensam stund nu
  // {"cmd": {"do": "balloon", "kid": "Ida"}}  – barnet (eller ett slumpat) gör ett bus
  // {"cmd": {"steer": [x, y], "kid": "Nils"}} – styr barnet, x och y i -1..1
  // {"cmd": {"jump": true, "kid": "Nils"}}    – hoppa
  // {"cmd": {"release": "Nils"}}              – barnet får göra som det vill igen
  var DOABLE = SOLO.concat(DUO, ['sleep', 'mustache', 'pedalcar', 'farmtoys', 'slime', 'dressup', 'disco']);

  // Avbryt allt barnet håller på med.
  function reset(f) {
    release(f);
    f.by = null;
    f.ev = null;
    f.inWater = false; f.bag = null; f.sockT = 0; f.vehicle = null; f.leader = null;
    f.z = 0; f.vz = 0;
    setAct(f, 'walk');
  }

  function command(c) {
    if (!c || typeof c !== 'object') return;
    var f = c.kid != null ? byName(String(c.kid)) : null, i, g;
    if (c.event && EV[c.event]) {
      if (event && !event.ending) endEvent(event);
      event = null;
      for (i = 0; i < count; i++) reset(figs[i]);
      startEvent(String(c.event));
      eventCool = rand(30, 50);
    }
    if (c.do && DOABLE.indexOf(c.do) >= 0) {
      if (!f) f = figs[(Math.random() * count) | 0];
      if (!f) return;
      reset(f);
      var others = figs.slice(0, count).filter(function (o) { return o !== f; });
      if (DUO.indexOf(c.do) >= 0 && !others.some(free) && others.length) reset(nearest(f, others));
      if (c.do === 'mustache' && others.length) {
        g = nearest(f, others);
        reset(g);
        setAct(g, 'sleep');
        g.t = 1.5;
      }
      prank(f, c.do);
    }
    if (c.steer && f) {
      if (f.a !== 'steer') {
        if (f.a === 'pedalcar') { f.ev = null; release(f); } else reset(f);
        var car = f.vehicle;
        setAct(f, 'steer');
        f.vehicle = car;
      }
      f.cx = clamp(+c.steer[0] || 0, -1, 1);
      f.cy = clamp(+c.steer[1] || 0, -1, 1);
      f.ctrlT = 0;
    }
    if (c.jump && f) {
      if (f.z <= 0) hop(f, 0.7);
      if (f.a === 'steer') f.ctrlT = 0;
    }
    if (c.release != null) {
      g = byName(String(c.release));
      if (g && g.a === 'steer') { g.vehicle = null; setAct(g, 'walk'); }
    }
  }

  ACT.steer = {
    dur: 1e9,
    start: function (f) { f.cx = f.cy = 0; f.ctrlT = 0; f.moving = false; },
    update: function (f, dt) {
      f.ctrlT += dt;
      if (f.ctrlT > 10) { f.vehicle = null; return setAct(f, 'walk'); }
      var x = f.cx, y = f.cy, m = Math.sqrt(x * x + y * y);
      f.moving = m > 0.15;
      if (!f.moving) return;
      var v = WALK * baseL * (f.vehicle ? 1.6 : 1.5) * Math.min(1, m), ox = f.x, oy = f.y;
      f.x = clamp(f.x + x / m * v * dt, xMin, xMax);
      f.y = clamp(f.y + y / m * v * dt * 0.7, yTop, yBot);
      if (Math.abs(x) > 0.1) f.face = x > 0 ? 1 : -1;
      var d = Math.sqrt((f.x - ox) * (f.x - ox) + (f.y - oy) * (f.y - oy));
      f.phase = (f.phase + d / (f.L * 0.9)) % 1;
      f.wheel += d / (0.13 * f.L);
      if (!f.vehicle) checkPeel(f);
    },
    pose: function (f, p) {
      if (f.vehicle === 'tractor') return ACT.pedalcar.pose(f, p);
      if (f.moving) walkPose(p, f.phase, 1.2); else idlePose(f, p);
    }
  };

  // En liten pil ovanför den som styrs.
  function drawSteerMark(ctx, f) {
    var x = f.hx, y = f.hy - f.hr * 1.6 - Math.abs(Math.sin(clock * 4)) * f.L * 0.03, s = f.L * 0.05;
    ctx.fillStyle = '#ffd43b';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, f.L * 0.008);
    ctx.beginPath();
    ctx.moveTo(x - s, y - s);
    ctx.lineTo(x + s, y - s);
    ctx.lineTo(x, y + s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
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
    event = null;
    for (var i = 0; i < count; i++) {
      var f = figs[i];
      release(f);
      f.by = null;
      f.ev = null; f.inWater = false; f.bag = null; f.sockT = 0; f.vehicle = null;
      place(f);
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
    release: function () { figs = []; count = 0; parts = []; pops = []; props = []; event = null; },
    command: command
  });
})();
