// interactions.js — Progressive enhancement for external links inside markdown content.
(() => {
  "use strict";

  document
    .querySelectorAll(
      ".prose a[href], .lede a[href], .sec-text a[href], .entry-desc a[href], .entry-name a[href]"
    )
    .forEach((a) => {
      if (!a.hostname || a.hostname === location.hostname) return;
      a.target = "_blank";
      a.rel = "noopener";
    });
})();
