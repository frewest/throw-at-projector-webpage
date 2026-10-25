/*
 * Cast-koppling. På en Chromecast laddas CAF Receiver SDK och sidan lyssnar
 * på ett eget namespace efter JSON-kommandon. I en vanlig webbläsare startar
 * animationen direkt utan SDK.
 *
 * Kommandon (JSON):
 *   {"mode":"stitch","count":10,"speed":1.2,"size":1,"debug":false}
 *   {"type":"getState"}   -> svarar avsändaren med aktuellt tillstånd
 * mode är "ants" eller "stitch"; utan mode gäller värdena det aktiva läget.
 * Varje inställningskommando besvaras också med det nya tillståndet.
 */
(function () {
  'use strict';

  var NAMESPACE = 'urn:x-cast:com.throwatprojector.ants';
  var SDK_URL = 'https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js';

  var params = new URLSearchParams(location.search);
  var onCast = /CrKey/.test(navigator.userAgent) || params.get('cast') === '1';

  window.Projector.start();
  if (!onCast) return;

  var script = document.createElement('script');
  script.src = SDK_URL;
  script.onload = startReceiver;
  script.onerror = function () { console.error('Kunde inte ladda Cast Receiver SDK'); };
  document.head.appendChild(script);

  function startReceiver() {
    var framework = cast.framework;
    var context = framework.CastReceiverContext.getInstance();

    context.addCustomMessageListener(NAMESPACE, function (event) {
      var data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return; }
      }
      var state = (data && data.type === 'getState')
        ? window.Projector.getState()
        : window.Projector.apply(data);
      try {
        context.sendCustomMessage(NAMESPACE, event.senderId, state);
      } catch (e) {
        console.warn('Kunde inte svara avsändaren', e);
      }
    });

    var options = new framework.CastReceiverOptions();
    options.disableIdleTimeout = true;   // ingen media spelas, stäng inte appen
    options.skipPlayersLoad = true;      // vi använder inte mediaspelaren
    options.customNamespaces = {};
    options.customNamespaces[NAMESPACE] = framework.system.MessageType.JSON;
    context.start(options);
  }
})();
