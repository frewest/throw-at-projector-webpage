/*
 * throw-at-projector – gemensam motor för alla lägen (spel).
 *
 * Motorn äger canvasen, huvudloopen, storleksanpassningen, fps-räknaren,
 * tangentbordet och inställningarna. Varje läge registrerar sig med
 * Projector.register({...}) och sköter bara sina egna figurer.
 *
 * Ett läge har:
 *   id, label, unit           – namn, t.ex. 'ants', 'Myror', 'myror'
 *   background                – bakgrundsfärg
 *   defaults {count,speed,size}
 *   limits   {count,speed,size}: [min, max]
 *   layout(world, settings)   – (om)bygg sprites; world = {W, H, scale}
 *   setCount(n), scatter(), update(dt), draw(ctx)
 *   release()                 – valfri, släpp minne när läget lämnas
 *   command(cmd)              – valfri, tar emot {"cmd": ...} från appen
 *
 * Publikt API: window.Projector.apply({mode, count, speed, size, debug, cmd})
 *              window.Projector.getState()
 * "ants" accepteras som alias för "count" (äldre versioner av appen).
 * Ett läge som inte är laddat hämtas från <mode>.js; när det är klart
 * anropas Projector.onState(state), som cast.js skickar vidare till appen.
 */
(function () {
  'use strict';

  var MAX_W = 1920, MAX_H = 1080;

  var modes = {}, order = [];
  var perMode = {};          // id -> {count, speed, size}
  var mode = null;           // aktivt läge
  var loading = {};          // lägen som håller på att hämtas
  var pendingMode = null;    // valt innan start()
  var debug = false;

  var canvas = null, ctx = null, hud = null;
  var world = { W: MAX_W, H: MAX_H, scale: 1 };
  var urlRes = 0;            // valfri upplösningsskala via ?res= (0..1)

  // ---------------------------------------------------------------- hjälp
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function parseBool(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    v = String(v).toLowerCase();
    return v === '1' || v === 'true' || v === 'on' || v === 'yes' || v === '';
  }

  // ---------------------------------------------------------------- lägen
  function register(m) {
    modes[m.id] = m;
    order.push(m.id);
    perMode[m.id] = { count: m.defaults.count, speed: m.defaults.speed, size: m.defaults.size };
  }

  function activate(id) {
    if (!modes[id] || (mode && mode.id === id)) return;
    if (!canvas) { pendingMode = id; return; }
    if (mode && mode.release) mode.release();
    mode = modes[id];
    var s = perMode[id];
    document.body.style.background = mode.background;
    mode.layout(world, s);
    mode.setCount(s.count);
    mode.scatter();
  }

  // ---------------------------------------------------------------- fps / hud
  var fpsFrames = 0, fpsTime = 0, fps = 0;

  function updateHud(dt) {
    fpsFrames++;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
      fps = fpsFrames / fpsTime;
      fpsFrames = 0;
      fpsTime = 0;
      if (hud && mode) {
        var s = perMode[mode.id];
        hud.textContent = fps.toFixed(0) + ' fps · ' + mode.label + ' · ' +
          s.count + ' ' + mode.unit + ' · ' + world.W + 'x' + world.H +
          ' · speed ' + s.speed.toFixed(2) + ' · size ' + s.size.toFixed(2);
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

    if (mode) {
      mode.update(dt);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = mode.background;
      ctx.fillRect(0, 0, world.W, world.H);
      mode.draw(ctx);
    }
    if (debug) updateHud(dt);
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
    world.W = Math.max(1, Math.round(cw * k));
    world.H = Math.max(1, Math.round(ch * k));
    world.scale = Math.min(world.W, world.H) / 1080;
    canvas.width = world.W;
    canvas.height = world.H;
    if (mode) mode.layout(world, perMode[mode.id]);
  }

  // ---------------------------------------------------------------- API
  // Hämta ett läge som inte fanns när sidan laddades (t.ex. om Chromecasten
  // har en äldre index.html sparad) och använd inställningarna när det är klart.
  function loadMode(id, cfg) {
    if (loading[id] || !/^[a-z0-9-]+$/.test(id)) return;
    loading[id] = true;
    var script = document.createElement('script');
    script.src = id + '.js?t=' + Date.now();
    script.onload = script.onerror = function () {
      loading[id] = false;
      if (!modes[id]) { console.warn('Okänt läge: ' + id); return; }
      var state = apply(cfg);
      if (window.Projector.onState) window.Projector.onState(state);
    };
    document.head.appendChild(script);
  }

  function apply(cfg) {
    if (!cfg || typeof cfg !== 'object') return getState();
    if (cfg.mode != null) {
      var want = String(cfg.mode);
      if (!modes[want]) {
        // övriga värden hör till det nya läget och används när det laddats
        loadMode(want, cfg);
        return getState();
      }
      activate(want);
    }

    var id = mode ? mode.id : (pendingMode || order[0]);
    var m = modes[id], s = perMode[id], lim = m.limits;
    var relayout = false;

    if (cfg.speed != null && isFinite(+cfg.speed)) {
      s.speed = clamp(+cfg.speed, lim.speed[0], lim.speed[1]);
    }
    if (cfg.size != null && isFinite(+cfg.size)) {
      var size = clamp(+cfg.size, lim.size[0], lim.size[1]);
      if (size !== s.size) { s.size = size; relayout = true; }
    }
    if (cfg.debug != null) {
      debug = parseBool(cfg.debug);
      if (hud) hud.style.display = debug ? 'block' : 'none';
    }
    if (relayout && mode === m) m.layout(world, s);
    // kommandon till det aktiva läget, t.ex. styrning från appen
    if (cfg.cmd != null && mode === m && m.command) m.command(cfg.cmd);

    var n = cfg.count != null ? cfg.count : cfg.ants;
    if (n != null && isFinite(+n)) {
      s.count = clamp(Math.round(+n), lim.count[0], lim.count[1]);
      if (mode === m) m.setCount(s.count);
    }
    return getState();
  }

  function getState() {
    var id = mode ? mode.id : (pendingMode || order[0]);
    var s = perMode[id];
    return {
      mode: id,
      count: s.count,
      speed: s.speed,
      size: s.size,
      debug: debug,
      modes: order.map(function (k) {
        var m = modes[k];
        return { id: k, label: m.label, defaults: m.defaults, limits: m.limits };
      })
    };
  }

  function readUrl() {
    var q = new URLSearchParams(location.search);
    var cfg = {};
    ['mode', 'count', 'ants', 'speed', 'size', 'debug'].forEach(function (k) {
      if (q.has(k)) cfg[k] = q.get(k);
    });
    if (q.has('fps')) cfg.debug = q.get('fps');
    if (q.has('res')) urlRes = clamp(+q.get('res') || 0, 0, 1);
    return cfg;
  }

  function cycleMode(step) {
    var i = mode ? order.indexOf(mode.id) : 0;
    apply({ mode: order[(i + step + order.length) % order.length] });
  }

  // Tangentbord för test i webbläsaren.
  function onKey(e) {
    if (!mode) return;
    var s = perMode[mode.id];
    var step = Math.max(1, Math.round((mode.limits.count[1] - mode.limits.count[0]) / 40));
    switch (e.key) {
      case 'ArrowUp': apply({ count: s.count + step }); break;
      case 'ArrowDown': apply({ count: s.count - step }); break;
      case 'ArrowRight': apply({ speed: s.speed * 1.15 }); break;
      case 'ArrowLeft': apply({ speed: s.speed / 1.15 }); break;
      case '+': apply({ size: s.size * 1.1 }); break;
      case '-': apply({ size: s.size / 1.1 }); break;
      case 'd': apply({ debug: !debug }); break;
      case 'm': cycleMode(1); break;
      default:
        var k = parseInt(e.key, 10);
        if (k >= 1 && k <= order.length) { apply({ mode: order[k - 1] }); break; }
        return;
    }
    if (debug) fpsTime = 1;  // uppdatera hud direkt
  }

  function start() {
    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d', { alpha: false });
    hud = document.getElementById('hud');

    var cfg = readUrl();
    resize();
    activate(pendingMode && modes[pendingMode] ? pendingMode : order[0]);
    apply(cfg);

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKey);
    // Dubbeltryck på mobil visar/döljer fps, trippeltryck byter läge.
    var taps = 0, lastTap = 0, tapTimer = 0;
    canvas.addEventListener('touchend', function () {
      var t = Date.now();
      taps = t - lastTap < 350 ? taps + 1 : 1;
      lastTap = t;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function () {
        if (taps === 2) apply({ debug: !debug });
        else if (taps >= 3) cycleMode(1);
        taps = 0;
      }, 360);
    });

    requestAnimationFrame(frame);
  }

  window.Projector = {
    register: register,
    apply: apply,
    getState: getState,
    start: start,
    onState: null
  };
})();
