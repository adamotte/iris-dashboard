/* iris-cron — registers the Cron page exported by the main iris bundle. */
(function () {
  "use strict";
  var NAME = "iris-cron", tries = 0;
  (function reg() {
    var P = window.__IRIS_PAGES__;
    if (P && P[NAME] && window.__HERMES_PLUGINS__) {
      window.__HERMES_PLUGINS__.register(NAME, P[NAME]);
    } else if (++tries < 45) {
      setTimeout(reg, 40);
    }
  })();
})();
