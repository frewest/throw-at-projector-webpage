/*
 * Läge "Stitch" – Stitch och hans vänner springer omkring på skärmen.
 *
 * Figurerna ritas från sidan med canvas-vektorgrafik och förrenderas en gång
 * per storlek till en sprite per figur (8 springfaser + en stående bild i ett
 * 3x3-rutnät, så att ingen canvas blir större än vad Chromecastens GPU klarar).
 * Varje figur kostar sedan ett drawImage-anrop plus en skugga.
 *
 * Beteenden: springa omkring, stanna och vila, hoppa, jaga varandra (Stitch
 * oftast) och ibland säga något i en pratbubbla.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- konstanter
  var MAX = 60;
  var FRAMES = 8;              // springfaser; ruta FRAMES = stående
  var COLS = 3;                // rutnät i spriten
  var BASE_H = 110;            // Stitchs höjd i px vid size=1 och 1080 px kortsida
  var BASE_SPEED = 170;        // px/s vid speed=1
  var GRAVITY = 2600;          // px/s² vid scale=1
  var TWO_PI = Math.PI * 2;
  var OUTLINE = '#1c2140';
  var OL = 0.014;              // konturbredd i figurhöjder

  var RUN = 0, PAUSE = 1, CHASE = 2, FLEE = 3;

  // ---------------------------------------------------------------- värld
  var W = 1920, H = 1080, scale = 1;
  var settings = null;

  // ---------------------------------------------------------------- figurdata
  var kind = new Uint8Array(MAX);
  var px = new Float32Array(MAX);      // markposition; y är också djup
  var py = new Float32Array(MAX);
  var pz = new Float32Array(MAX);      // höjd över marken (hopp)
  var vz = new Float32Array(MAX);
  var dir = new Float32Array(MAX);     // färdriktning (radianer)
  var turn = new Float32Array(MAX);
  var goal = new Float32Array(MAX);
  var spd = new Float32Array(MAX);
  var phase = new Float32Array(MAX);
  var face = new Int8Array(MAX);       // 1 = höger, -1 = vänster
  var state = new Uint8Array(MAX);
  var stateT = new Float32Array(MAX);
  var other = new Int16Array(MAX);     // jagad/jagare
  var bubbleT = new Float32Array(MAX);
  var bubble = new Array(MAX);
  var order = new Int16Array(MAX);     // ritordning, sorterad på y
  var count = 0;

  // ---------------------------------------------------------------- ritverktyg
  // Alla figurer ritas i enheter av sin egen höjd: fötterna i origo, nosen
  // åt +x och huvudet mot -y.
  function ell(g, x, y, rx, ry, fill, rot) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, rot || 0, 0, TWO_PI);
    g.fillStyle = fill;
    g.fill();
    g.stroke();
  }

  function dot(g, x, y, rx, ry, fill) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, TWO_PI);
    g.fillStyle = fill;
    g.fill();
  }

  // Tjock lem med kontur: polyline [x0,y0,x1,y1,...].
  function limb(g, pts, w, color) {
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.strokeStyle = OUTLINE;
    g.lineWidth = w + OL * 2;
    g.stroke();
    g.strokeStyle = color;
    g.lineWidth = w;
    g.stroke();
    g.strokeStyle = OUTLINE;
    g.lineWidth = OL;
  }

  // Benställning för fas t (0..1, eller < 0 = stående). off = fasförskjutning.
  function pose(t, off) {
    if (t < 0) return { a: off ? -0.07 : 0.07, k: 0.05 };
    var p = (t + off) * TWO_PI;
    return { a: Math.sin(p) * 0.75, k: 0.2 + 0.9 * Math.max(0, Math.cos(p)) };
  }

  // Ben från höft (hx, hy): lår l1, smalben l2. Returnerar fotens läge.
  function leg(g, hx, hy, l1, l2, ps, w, color) {
    var kx = hx + Math.sin(ps.a) * l1, ky = hy + Math.cos(ps.a) * l1;
    var fa = ps.a - ps.k;
    var fx = kx + Math.sin(fa) * l2, fy = ky + Math.cos(fa) * l2;
    limb(g, [hx, hy, kx, ky, fx, fy], w, color);
    return [fx, fy];
  }

  // Arm från axel (sx, sy), svänger i motfas mot benen.
  function arm(g, sx, sy, l1, l2, t, off, w, color) {
    var a = t < 0 ? 0.15 : -Math.sin((t + off) * TWO_PI) * 0.9;
    var ex = sx + Math.sin(a) * l1, ey = sy + Math.cos(a) * l1;
    var b = a + 0.9;
    var hx = ex + Math.sin(b) * l2, hy = ey + Math.cos(b) * l2;
    limb(g, [sx, sy, ex, ey, hx, hy], w, color);
    return [hx, hy];
  }

  function bobOf(t) { return t < 0 ? 0 : -Math.abs(Math.sin(t * TWO_PI)) * 0.035; }

  // ---------------------------------------------------------------- figurer
  // Stitch, Angel och Reuben delar kroppsbyggnad (experiment från Jumbas labb).
  function drawExperiment(g, t, P) {
    var bob = bobOf(t);
    var flap = t < 0 ? 0 : Math.sin(t * TWO_PI) * 0.03;

    g.save();
    g.translate(0, bob);

    // bortre öra
    if (P.ears === 'stitch') stitchEar(g, 0.07, -0.03, flap, P.dark, P.earDark);
    else if (P.ears === 'angel') angelEar(g, 0.06, -0.02, P.dark, P.earDark);
    g.restore();

    // bortre ben och arm
    leg(g, -0.04, -0.2 + bob, 0.1, 0.1, pose(t, 0.5), 0.09, P.dark);
    g.save();
    g.translate(0, bob);
    arm(g, 0.0, -0.41, 0.1, 0.09, t, 0.5, 0.07, P.dark);

    // svans, kropp, mage
    ell(g, -0.21, -0.27, 0.05, 0.035, P.body, -0.4);
    ell(g, -0.03, -0.3, 0.19, 0.17, P.body);
    dot(g, 0.06, -0.29, 0.1, 0.13, P.belly);
    g.restore();

    // närmre ben med fot
    var f = leg(g, 0.03, -0.2 + bob, 0.1, 0.1, pose(t, 0), 0.095, P.body);
    ell(g, f[0] + 0.03, f[1] - 0.01, 0.06, 0.03, P.body);

    g.save();
    g.translate(0, bob);

    // antenner bakom huvudet (Angel)
    if (P.antennae) {
      g.lineCap = 'round';
      for (var k = 0; k < 2; k++) {
        var ox = k * 0.06, oy = k * 0.02;
        g.beginPath();
        g.moveTo(0.0 + ox, -0.86 + oy);
        g.quadraticCurveTo(-0.15 + ox, -1.06 + oy, -0.36 + ox, -0.98 + oy - flap);
        g.quadraticCurveTo(-0.46 + ox, -0.9 + oy, -0.38 + ox, -0.84 + oy);
        g.strokeStyle = OUTLINE;
        g.lineWidth = 0.035 + OL * 2;
        g.stroke();
        g.strokeStyle = k ? P.body : P.dark;
        g.lineWidth = 0.035;
        g.stroke();
      }
      g.strokeStyle = OUTLINE;
      g.lineWidth = OL;
    }

    // huvud
    ell(g, 0.06, -0.66, 0.3, 0.25, P.body);
    dot(g, 0.21, -0.57, 0.15, 0.09, P.muzzle);
    if (P.patch) dot(g, -0.01, -0.83, 0.12, 0.05, P.dark);

    // tofs (Reuben)
    if (P.tuft) {
      g.lineCap = 'round';
      g.lineWidth = 0.025;
      g.strokeStyle = P.dark;
      for (k = 0; k < 3; k++) {
        g.beginPath();
        g.moveTo(0.0 + k * 0.05, -0.9);
        g.quadraticCurveTo(0.02 + k * 0.05, -1.0, -0.04 + k * 0.05, -1.03);
        g.stroke();
      }
      g.strokeStyle = OUTLINE;
      g.lineWidth = OL;
    }

    // närmre öra
    if (P.ears === 'stitch') stitchEar(g, 0, 0, flap, P.body, P.earInner);
    else if (P.ears === 'angel') angelEar(g, 0, 0, P.body, P.earInner);
    else if (P.ears === 'round') {
      ell(g, -0.13, -0.84, 0.08, 0.07, P.body, -0.5);
      dot(g, -0.13, -0.84, 0.045, 0.035, P.earInner);
    }

    // ögon: det bortre syns lite mindre
    ell(g, 0.31, -0.7, 0.055, 0.085, '#0b0d1a');
    ell(g, 0.17, -0.71, 0.075, 0.1, '#0b0d1a');
    dot(g, 0.19, -0.75, 0.025, 0.03, '#fff');
    dot(g, 0.32, -0.74, 0.018, 0.022, '#fff');
    if (P.lashes) {
      g.lineWidth = 0.014;
      g.beginPath();
      g.moveTo(0.12, -0.8); g.lineTo(0.09, -0.85);
      g.moveTo(0.16, -0.815); g.lineTo(0.15, -0.87);
      g.moveTo(0.2, -0.81); g.lineTo(0.21, -0.86);
      g.stroke();
      g.lineWidth = OL;
    }

    // nos och mun
    ell(g, 0.35, -0.62, 0.075, 0.055, P.nose);
    dot(g, 0.37, -0.645, 0.02, 0.014, 'rgba(255,255,255,0.6)');
    g.beginPath();
    g.moveTo(0.12, -0.53);
    g.quadraticCurveTo(0.24, -0.46, 0.34, -0.55);
    g.lineWidth = 0.016;
    g.stroke();
    g.lineWidth = OL;

    // närmre arm, med smörgås (Reuben)
    var h = arm(g, 0.06, -0.41, 0.1, 0.09, t, 0, 0.075, P.body);
    if (P.sandwich) {
      g.save();
      g.translate(h[0] + 0.03, h[1] - 0.02);
      g.rotate(-0.2);
      ell(g, 0, 0.03, 0.09, 0.03, '#e9c27a');
      dot(g, 0, 0.0, 0.095, 0.018, '#67b83a');
      dot(g, 0, -0.016, 0.085, 0.014, '#e0473a');
      ell(g, 0, -0.04, 0.09, 0.035, '#f0cf8c');
      g.restore();
    }
    ell(g, h[0], h[1], 0.035, 0.03, P.body);
    g.restore();
  }

  // Stitchs stora bakåtstrukna öron, med ett hack i kanten.
  function stitchEar(g, ox, oy, flap, fill, inner) {
    g.beginPath();
    g.moveTo(-0.02 + ox, -0.86 + oy);
    g.quadraticCurveTo(-0.25 + ox, -1.0 + oy, -0.52 + ox, -0.98 + oy + flap);
    g.lineTo(-0.4 + ox, -0.9 + oy + flap * 0.6);
    g.lineTo(-0.44 + ox, -0.86 + oy + flap * 0.5);
    g.quadraticCurveTo(-0.3 + ox, -0.72 + oy, -0.16 + ox, -0.66 + oy);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(-0.06 + ox, -0.84 + oy);
    g.quadraticCurveTo(-0.24 + ox, -0.93 + oy, -0.42 + ox, -0.93 + oy + flap);
    g.quadraticCurveTo(-0.28 + ox, -0.78 + oy, -0.15 + ox, -0.72 + oy);
    g.closePath();
    g.fillStyle = inner;
    g.fill();
  }

  // Angels kortare, hängande öron.
  function angelEar(g, ox, oy, fill, inner) {
    g.beginPath();
    g.moveTo(-0.04 + ox, -0.86 + oy);
    g.quadraticCurveTo(-0.3 + ox, -0.86 + oy, -0.36 + ox, -0.66 + oy);
    g.quadraticCurveTo(-0.24 + ox, -0.66 + oy, -0.14 + ox, -0.7 + oy);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.stroke();
    dot(g, -0.18 + ox, -0.75 + oy, 0.09, 0.04, inner);
  }

  var STITCH = {
    body: '#4a78d4', dark: '#30539f', belly: '#a9cff6', muzzle: '#86aeea',
    earInner: '#f2a2bf', earDark: '#c37d98', nose: '#1d2a5c',
    ears: 'stitch', patch: true
  };
  var ANGEL = {
    body: '#f08dbb', dark: '#c9628f', belly: '#fbd3e5', muzzle: '#f6b3d2',
    earInner: '#b8457a', earDark: '#943863', nose: '#7a1f4d',
    ears: 'angel', antennae: true, lashes: true
  };
  var REUBEN = {
    body: '#f2c442', dark: '#c48f1d', belly: '#fbe7a6', muzzle: '#f7d77a',
    earInner: '#e59a7a', nose: '#7a4a1c',
    ears: 'round', tuft: true, sandwich: true
  };

  function drawLilo(g, t) {
    var bob = bobOf(t);
    var wave = t < 0 ? 0 : Math.sin(t * TWO_PI * 2) * 0.02;
    var SKIN = '#8f5c3e', SKIN_D = '#6c412a', HAIR = '#15111a', DRESS = '#d42f2b';

    g.save();
    g.translate(0, bob);
    // håret fladdrar bakåt
    g.beginPath();
    g.moveTo(0.1, -0.97);
    g.quadraticCurveTo(-0.16, -1.02, -0.3, -0.86 + wave);
    g.quadraticCurveTo(-0.34, -0.72, -0.28, -0.6 - wave);
    g.quadraticCurveTo(-0.16, -0.62, -0.06, -0.7);
    g.closePath();
    g.fillStyle = HAIR;
    g.fill();
    g.stroke();
    g.restore();

    leg(g, -0.02, -0.42 + bob, 0.21, 0.2, pose(t, 0.5), 0.055, SKIN_D);
    g.save();
    g.translate(0, bob);
    arm(g, -0.01, -0.68, 0.14, 0.13, t, 0.5, 0.045, SKIN_D);
    g.restore();

    var f = leg(g, 0.03, -0.42 + bob, 0.21, 0.2, pose(t, 0), 0.058, SKIN);
    ell(g, f[0] + 0.025, f[1] - 0.008, 0.04, 0.018, SKIN);

    g.save();
    g.translate(0, bob);
    // muumuu
    g.beginPath();
    g.moveTo(-0.07, -0.73);
    g.lineTo(0.08, -0.73);
    g.quadraticCurveTo(0.13, -0.55, 0.17, -0.36);
    g.lineTo(-0.17, -0.36);
    g.quadraticCurveTo(-0.11, -0.55, -0.07, -0.73);
    g.closePath();
    g.fillStyle = DRESS;
    g.fill();
    g.stroke();
    var leaves = [[-0.04, -0.62, 0.6], [0.07, -0.52, -0.5], [-0.1, -0.44, -0.3], [0.03, -0.41, 0.9], [0.1, -0.63, 0.2]];
    for (var i = 0; i < leaves.length; i++) {
      dot(g, leaves[i][0], leaves[i][1], 0.03, 0.012, '#fff8f0');
      g.save();
      g.translate(leaves[i][0], leaves[i][1]);
      g.rotate(leaves[i][2] + 1.2);
      dot(g, 0, 0, 0.025, 0.01, '#fff8f0');
      g.restore();
    }

    // huvud
    ell(g, 0.01, -0.75, 0.035, 0.03, SKIN);   // hals
    ell(g, 0.04, -0.85, 0.12, 0.12, SKIN);
    // lugg
    g.beginPath();
    g.ellipse(0.02, -0.87, 0.135, 0.105, 0, Math.PI * 1.02, Math.PI * 1.98);
    g.quadraticCurveTo(0.08, -0.86, 0.02, -0.89);
    g.quadraticCurveTo(-0.04, -0.82, -0.11, -0.84);
    g.closePath();
    g.fillStyle = HAIR;
    g.fill();
    g.stroke();
    dot(g, 0.11, -0.85, 0.017, 0.025, '#0b0d1a');
    dot(g, 0.115, -0.857, 0.006, 0.008, '#fff');
    dot(g, 0.08, -0.8, 0.025, 0.014, 'rgba(230,110,100,0.5)');
    g.beginPath();
    g.moveTo(0.09, -0.77);
    g.quadraticCurveTo(0.13, -0.745, 0.155, -0.78);
    g.lineWidth = 0.01;
    g.stroke();
    g.lineWidth = OL;
    // blomma i håret
    dot(g, -0.04, -0.95, 0.03, 0.03, '#f6e04a');
    dot(g, -0.04, -0.95, 0.012, 0.012, '#e8731e');

    var h = arm(g, 0.04, -0.68, 0.14, 0.13, t, 0, 0.048, SKIN);
    ell(g, h[0], h[1], 0.025, 0.022, SKIN);
    g.restore();
  }

  function drawJumba(g, t) {
    var bob = bobOf(t) * 0.7;
    var BODY = '#7e56a9', DARK = '#5b3a80', SHIRT = '#d27b3a', PANTS = '#5d5d6c';

    leg(g, -0.08, -0.2 + bob, 0.1, 0.1, pose(t, 0.5), 0.11, PANTS);
    g.save();
    g.translate(0, bob);
    arm(g, 0.0, -0.4, 0.12, 0.11, t, 0.5, 0.09, DARK);
    g.restore();

    var f = leg(g, 0.06, -0.2 + bob, 0.1, 0.1, pose(t, 0), 0.115, PANTS);
    ell(g, f[0] + 0.04, f[1] - 0.015, 0.075, 0.035, DARK);

    g.save();
    g.translate(0, bob);
    // kropp och huvud är ett: ett stort päron
    g.beginPath();
    g.ellipse(0, -0.52, 0.33, 0.37, 0, 0, TWO_PI);
    g.fillStyle = BODY;
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = SHIRT;
    g.fillRect(-0.4, -0.42, 0.8, 0.5);
    g.fillStyle = PANTS;
    g.fillRect(-0.4, -0.22, 0.8, 0.2);
    g.restore();
    g.stroke();
    g.beginPath();
    g.moveTo(-0.32, -0.42);
    g.lineTo(0.32, -0.42);
    g.stroke();

    // fyra ögon: två stora och två små ovanför
    var eyes = [[0.2, -0.68, 0.055], [0.3, -0.66, 0.045], [0.16, -0.8, 0.028], [0.25, -0.79, 0.025]];
    for (var i = 0; i < eyes.length; i++) {
      var e = eyes[i];
      ell(g, e[0], e[1], e[2], e[2] * 1.1, '#fffbe8');
      dot(g, e[0] + e[2] * 0.35, e[1], e[2] * 0.5, e[2] * 0.55, '#0b0d1a');
    }
    // breda läppar
    g.beginPath();
    g.moveTo(0.1, -0.56);
    g.quadraticCurveTo(0.22, -0.5, 0.32, -0.57);
    g.quadraticCurveTo(0.24, -0.46, 0.12, -0.5);
    g.closePath();
    g.fillStyle = '#4a2b62';
    g.fill();
    g.stroke();
    dot(g, 0.22, -0.505, 0.06, 0.012, '#c86b8c');

    var h = arm(g, 0.08, -0.38, 0.12, 0.11, t, 0, 0.095, BODY);
    ell(g, h[0], h[1], 0.05, 0.045, BODY);
    g.restore();
  }

  function drawPleakley(g, t) {
    var bob = bobOf(t);
    var BODY = '#9dcc52', DARK = '#6f9a2f';

    // tre ben i olika takt; det bakersta längst bort
    leg(g, -0.06, -0.28 + bob, 0.15, 0.13, pose(t, 2 / 3), 0.035, DARK);
    leg(g, 0.0, -0.28 + bob, 0.15, 0.13, pose(t, 1 / 3), 0.035, DARK);
    g.save();
    g.translate(0, bob);
    arm(g, 0.0, -0.55, 0.12, 0.11, t, 0.5, 0.03, DARK);
    ell(g, 0.0, -0.44, 0.12, 0.19, BODY);
    g.restore();
    var f = leg(g, 0.05, -0.28 + bob, 0.15, 0.13, pose(t, 0), 0.037, BODY);
    ell(g, f[0] + 0.025, f[1] - 0.006, 0.035, 0.014, BODY);

    g.save();
    g.translate(0, bob);
    // hals, huvud och antenn
    limb(g, [0.02, -0.58, 0.05, -0.66], 0.06, BODY);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0.02, -0.86);
    g.quadraticCurveTo(-0.02, -0.95, -0.05, -0.99);
    g.lineWidth = 0.014;
    g.stroke();
    g.lineWidth = OL;
    ell(g, -0.05, -1.0, 0.022, 0.022, '#e3f07a');
    ell(g, 0.05, -0.75, 0.1, 0.12, BODY);
    // ett enda stort öga
    ell(g, 0.08, -0.78, 0.07, 0.075, '#fffbe8');
    dot(g, 0.11, -0.78, 0.036, 0.042, '#3e7a2a');
    dot(g, 0.115, -0.78, 0.02, 0.024, '#0b0d1a');
    dot(g, 0.12, -0.795, 0.008, 0.009, '#fff');
    // nervöst leende
    g.beginPath();
    g.moveTo(0.06, -0.68);
    g.quadraticCurveTo(0.11, -0.65, 0.15, -0.69);
    g.lineWidth = 0.01;
    g.stroke();
    g.lineWidth = OL;

    var h = arm(g, 0.05, -0.55, 0.12, 0.11, t, 0, 0.032, BODY);
    ell(g, h[0], h[1], 0.02, 0.018, BODY);
    g.restore();
  }

  // h: höjd relativt Stitch; speed: relativ fart; stride: steglängd i höjder.
  var CHARS = [
    { name: 'Stitch', h: 1.0, weight: 5, speed: 1.15, stride: 0.55, chase: 0.05, hop: 0.18,
      draw: function (g, t) { drawExperiment(g, t, STITCH); },
      says: ['Ohana!', 'Aloha!', 'Meega nala kweesta!', 'Ih!', 'Hihihi!'] },
    { name: 'Angel', h: 1.0, weight: 2, speed: 1.0, stride: 0.55, chase: 0.015, hop: 0.1,
      draw: function (g, t) { drawExperiment(g, t, ANGEL); },
      says: ['Boochiboo!', 'Ih!', '♥'] },
    { name: 'Reuben', h: 0.95, weight: 1, speed: 0.85, stride: 0.5, chase: 0.005, hop: 0.05,
      draw: function (g, t) { drawExperiment(g, t, REUBEN); },
      says: ['Smörgås?', 'Mums!'] },
    { name: 'Lilo', h: 1.5, weight: 3, speed: 1.0, stride: 0.45, chase: 0.02, hop: 0.08,
      draw: drawLilo,
      says: ['Stitch!', 'Ohana!', 'Aloha!'] },
    { name: 'Jumba', h: 1.9, weight: 1, speed: 0.75, stride: 0.35, chase: 0.02, hop: 0.03,
      draw: drawJumba,
      says: ['Experiment 626!', 'Hrmpf!'] },
    { name: 'Pleakley', h: 1.75, weight: 1, speed: 0.9, stride: 0.45, chase: 0.004, hop: 0.06,
      draw: drawPleakley,
      says: ['Oj oj oj!', 'Myggor!', 'Jumba!'] }
  ];
  var WEIGHT_SUM = 0;
  for (var ci = 0; ci < CHARS.length; ci++) WEIGHT_SUM += CHARS[ci].weight;

  // sprite per figur: {img, cw, ch, ax, ay, L}
  var sprites = [];

  function buildSprites() {
    sprites = [];
    for (var c = 0; c < CHARS.length; c++) {
      var L = BASE_H * CHARS[c].h * scale * settings.size;
      var cw = Math.ceil(L * 1.5), ch = Math.ceil(L * 1.3);
      var ax = cw / 2, ay = Math.round(L * 1.18);
      var rows = Math.ceil((FRAMES + 1) / COLS);
      var img = document.createElement('canvas');
      img.width = cw * COLS;
      img.height = ch * rows;
      var g = img.getContext('2d');
      for (var f = 0; f <= FRAMES; f++) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.translate((f % COLS) * cw + ax, ((f / COLS) | 0) * ch + ay);
        g.scale(L, L);
        g.lineJoin = 'round';
        g.lineCap = 'round';
        g.strokeStyle = OUTLINE;
        g.lineWidth = OL;
        CHARS[c].draw(g, f === FRAMES ? -1 : f / FRAMES);
      }
      sprites.push({ img: img, cw: cw, ch: ch, ax: ax, ay: ay, L: L });
    }
  }

  // ---------------------------------------------------------------- hjälp
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  function pickKind() {
    var r = Math.random() * WEIGHT_SUM;
    for (var c = 0; c < CHARS.length; c++) {
      r -= CHARS[c].weight;
      if (r < 0) return c;
    }
    return 0;
  }

  function wrapAngle(a) {
    if (a > Math.PI) a -= TWO_PI; else if (a < -Math.PI) a += TWO_PI;
    return a;
  }

  // Mest i sidled: rakt upp och ner ser konstigt ut för figurer från sidan.
  function sideways(right) {
    return (right ? 0 : Math.PI) + rand(-0.5, 0.5);
  }

  function yMin(i) { return Math.min(H * 0.6, sprites[kind[i]].L * 1.05 + 10 * scale); }
  function yMax() { return H - 6 * scale; }

  function initFigure(i, x, y, right) {
    kind[i] = pickKind();
    px[i] = x;
    py[i] = Math.max(yMin(i), Math.min(yMax(), y));
    pz[i] = 0;
    vz[i] = 0;
    dir[i] = goal[i] = sideways(right);
    turn[i] = 0;
    spd[i] = rand(0.8, 1.2);
    phase[i] = Math.random();
    face[i] = right ? 1 : -1;
    state[i] = RUN;
    stateT[i] = 0;
    other[i] = -1;
    bubbleT[i] = 0;
  }

  // Ny figur springer in från vänster eller höger kant.
  function spawnAtEdge(i) {
    var right = Math.random() < 0.5;
    initFigure(i, 0, rand(0, H), right);
    var half = sprites[kind[i]].cw / 2;
    px[i] = right ? -half : W + half;
  }

  function setCount(n) {
    n = Math.max(0, Math.min(MAX, n | 0));
    for (var i = count; i < n; i++) spawnAtEdge(i);
    count = n;
  }

  function scatter() {
    for (var i = 0; i < count; i++) {
      initFigure(i, rand(0, W), rand(0, H), Math.random() < 0.5);
    }
  }

  function say(i) {
    var lines = CHARS[kind[i]].says;
    bubble[i] = lines[(Math.random() * lines.length) | 0];
    bubbleT[i] = 1.6;
  }

  function hop(i, strength) {
    if (pz[i] > 0) return;
    vz[i] = Math.sqrt(2 * GRAVITY * scale * sprites[kind[i]].L * strength);
  }

  function endChase(i) {
    state[i] = RUN;
    other[i] = -1;
    goal[i] = sideways(Math.cos(dir[i]) >= 0);
  }

  // Jakten pågår bara så länge båda fortfarande pekar på varandra.
  function paired(i) {
    var j = other[i];
    return j >= 0 && j < count && other[j] === i &&
      (state[j] === CHASE || state[j] === FLEE);
  }

  function startChase(i) {
    var j = (Math.random() * count) | 0;
    if (j === i || state[j] !== RUN || px[j] < 0 || px[j] > W) return;
    state[i] = CHASE;
    stateT[i] = rand(3, 6);
    other[i] = j;
    state[j] = FLEE;
    stateT[j] = stateT[i] + 1;
    other[j] = i;
    if (Math.random() < 0.5) say(i);
  }

  // ---------------------------------------------------------------- uppdatering
  function update(dt) {
    var v0 = BASE_SPEED * scale * settings.speed * Math.sqrt(settings.size);
    var g = GRAVITY * scale;

    for (var i = 0; i < count; i++) {
      var ch = CHARS[kind[i]];
      var L = sprites[kind[i]].L;

      if (bubbleT[i] > 0) bubbleT[i] -= dt;
      if (pz[i] > 0 || vz[i] > 0) {
        vz[i] -= g * dt;
        pz[i] += vz[i] * dt;
        if (pz[i] <= 0) { pz[i] = 0; vz[i] = 0; }
      }

      stateT[i] -= dt;
      var st = state[i];
      var boost = 1;
      if (st === PAUSE) {
        if (stateT[i] <= 0) state[i] = RUN;
        continue;
      } else if (st === CHASE || st === FLEE) {
        var j = other[i];
        if (stateT[i] <= 0 || !paired(i)) {
          endChase(i);
        } else {
          var dx = px[j] - px[i], dy = py[j] - py[i];
          if (st === CHASE) {
            goal[i] = Math.atan2(dy, dx);
            boost = 1.6;
            if (dx * dx + dy * dy < L * L * 0.25) {
              // fångad! båda hoppar till och jagaren vilar en stund
              hop(i, 0.5);
              hop(j, 0.7);
              say(Math.random() < 0.5 ? i : j);
              state[j] = RUN;
              other[j] = -1;
              goal[j] = sideways(dx > 0);
              state[i] = PAUSE;
              stateT[i] = rand(0.8, 1.6);
              other[i] = -1;
              continue;
            }
          } else {
            goal[i] = Math.atan2(-dy, -dx);
            boost = 1.45;
          }
        }
      } else {
        if (Math.random() < 0.05 * dt) { state[i] = PAUSE; stateT[i] = rand(0.6, 2.2); continue; }
        if (Math.random() < ch.hop * dt) hop(i, rand(0.25, 0.6));
        if (Math.random() < ch.chase * dt) startChase(i);
        if (Math.random() < 0.025 * dt) say(i);
      }

      // Slumpvandring med dragning mot målriktningen.
      var t = turn[i] + (Math.random() - 0.5) * 16 * dt;
      t *= 1 - 2.5 * dt;
      if (t > 2) t = 2; else if (t < -2) t = -2;
      turn[i] = t;
      var a = dir[i];
      var pull = state[i] === RUN ? 0.6 : 3;
      a = wrapAngle(a + (t + wrapAngle(goal[i] - a) * pull) * dt);
      dir[i] = a;

      var step = v0 * ch.speed * spd[i] * boost * dt;
      var c = Math.cos(a);
      px[i] += c * step;
      py[i] += Math.sin(a) * step;
      if (c > 0.15) face[i] = 1; else if (c < -0.15) face[i] = -1;

      // Studsa mot över- och underkanten.
      var lo = yMin(i), hi = yMax();
      if (py[i] < lo || py[i] > hi) {
        py[i] = py[i] < lo ? lo : hi;
        dir[i] = -a;
        goal[i] = -goal[i];
        turn[i] = 0;
      }

      if (pz[i] === 0) {
        var ph = phase[i] + step / (L * ch.stride);
        phase[i] = ph - (ph | 0);
      }

      // Utanför sidokanten: figuren har sprungit iväg, en ny kommer in.
      var half = sprites[kind[i]].cw / 2;
      if (px[i] < -half * 1.1 || px[i] > W + half * 1.1) {
        if (state[i] !== RUN && other[i] >= 0 && other[i] < count) endChase(other[i]);
        spawnAtEdge(i);
      }
    }
  }

  // ---------------------------------------------------------------- ritning
  function sortByDepth() {
    for (var i = 0; i < count; i++) order[i] = i;
    for (i = 1; i < count; i++) {
      var k = order[i], y = py[k], j = i - 1;
      while (j >= 0 && py[order[j]] > y) { order[j + 1] = order[j]; j--; }
      order[j + 1] = k;
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBubble(ctx, i, sp) {
    var fs = Math.max(12, Math.round(30 * scale * Math.sqrt(settings.size)));
    ctx.font = 'bold ' + fs + 'px "Comic Sans MS", "Chalkboard SE", sans-serif';
    var text = bubble[i];
    var tw = ctx.measureText(text).width;
    var pad = fs * 0.5;
    var bw = tw + pad * 2, bh = fs * 1.6;
    var x = px[i] - bw / 2 + face[i] * sp.L * 0.15;
    var y = py[i] - pz[i] - sp.L * 1.1 - bh;
    if (x < 4) x = 4; else if (x + bw > W - 4) x = W - 4 - bw;
    if (y < 4) y = 4;
    ctx.globalAlpha = Math.min(1, bubbleT[i] * 3);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.5, 2.5 * scale);
    roundRect(ctx, x, y, bw, bh, bh * 0.4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = OUTLINE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + bw / 2, y + bh / 2);
    ctx.globalAlpha = 1;
  }

  function draw(ctx) {
    sortByDepth();
    ctx.imageSmoothingEnabled = true;

    // skuggor först, så att ingen figur hamnar under en annans skugga
    ctx.fillStyle = 'rgba(20, 30, 60, 0.14)';
    ctx.beginPath();
    for (var n = 0; n < count; n++) {
      var i = order[n], sp = sprites[kind[i]];
      var k = 1 / (1 + pz[i] / sp.L);
      var rx = sp.L * 0.28 * k, ry = sp.L * 0.07 * k;
      ctx.moveTo(px[i] + rx, py[i]);
      ctx.ellipse(px[i], py[i], rx, ry, 0, 0, TWO_PI);
    }
    ctx.fill();

    for (n = 0; n < count; n++) {
      i = order[n];
      sp = sprites[kind[i]];
      var f = (state[i] === PAUSE && pz[i] === 0) ? FRAMES : (phase[i] * FRAMES) | 0;
      var sx = (f % COLS) * sp.cw, sy = ((f / COLS) | 0) * sp.ch;
      var y = py[i] - pz[i] - sp.ay;
      if (face[i] > 0) {
        ctx.drawImage(sp.img, sx, sy, sp.cw, sp.ch, px[i] - sp.ax, y, sp.cw, sp.ch);
      } else {
        ctx.setTransform(-1, 0, 0, 1, px[i], 0);
        ctx.drawImage(sp.img, sx, sy, sp.cw, sp.ch, -sp.ax, y, sp.cw, sp.ch);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }

    for (n = 0; n < count; n++) {
      i = order[n];
      if (bubbleT[i] > 0) drawBubble(ctx, i, sprites[kind[i]]);
    }
  }

  // ---------------------------------------------------------------- motor
  function layout(world, s) {
    W = world.W;
    H = world.H;
    scale = world.scale;
    settings = s;
    buildSprites();
    for (var i = 0; i < count; i++) {
      py[i] = Math.max(yMin(i), Math.min(yMax(), py[i]));
      if (px[i] > W + sprites[kind[i]].cw) spawnAtEdge(i);
    }
  }

  window.Projector.register({
    id: 'stitch',
    label: 'Stitch',
    unit: 'figurer',
    background: '#fff',
    defaults: { count: 10, speed: 1, size: 1 },
    limits: { count: [0, MAX], speed: [0.2, 3], size: [0.4, 2.5] },
    layout: layout,
    setCount: setCount,
    scatter: scatter,
    update: update,
    draw: draw,
    release: function () { sprites = []; }
  });
})();
