// hero.js — home agent owns this file.
// Homepage hero widget (#hero-trace): a quiet terminal trace that
// types each command char-by-char, prints its output, holds, fades,
// and cycles. index.html already renders the finished transcript as
// static HTML — this script only animates over it. It never runs
// under prefers-reduced-motion, and it stops permanently once the
// tab goes hidden (leaving the completed transcript in place).

(() => {
  const root = document.getElementById("hero-trace");
  if (!root) return;
  const body = root.querySelector(".trace-body");
  if (!body) return;

  // Bail before touching anything — static HTML is the final state.
  if (document.hidden) return;
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) return;

  // Keep in sync with the static markup in layouts/index.html.
  const SCRIPT = [
    { cmd: "wuu build main.wuu --self-host", glyph: "✓", rest: " self-hosted · wuu 0.2.0 · 0.41s" },
    { cmd: "llmux serve --config llmux.yaml", glyph: "→", rest: " gpt-5 · us-east · 200 · 34ms" },
    { cmd: "git push origin main", glyph: "✓", rest: " main · github · done" },
  ];

  const TYPE_MIN = 24;   // ms per char, fastest
  const TYPE_MAX = 52;   // ms per char, slowest (jittered for realism)
  const PAUSE_CMD = 240; // pause after a command, before its output
  const PAUSE_OUT = 460; // pause after output, before the next command
  const HOLD = 3400;     // hold on the finished transcript
  const FADE = 420;      // fade-out before restarting (matches --dur-slow)
  const START = 800;     // delay before the first pass

  let timer = 0;
  let stopped = false;

  const later = (fn, ms) => {
    timer = setTimeout(fn, ms);
  };

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function glyphEl(step) {
    const ok = step.glyph === "✓";
    return el("span", "trace-glyph" + (ok ? " is-ok" : ""), step.glyph);
  }

  function entryEl(step, cmdText, withOut) {
    const entry = el("div", "trace-entry");
    const cmd = el("p", "trace-cmd");
    cmd.appendChild(el("span", "trace-prompt", "$"));
    cmd.appendChild(document.createTextNode(" "));
    cmd.appendChild(el("span", "trace-text", cmdText));
    entry.appendChild(cmd);
    if (withOut) {
      const out = el("p", "trace-out");
      out.appendChild(glyphEl(step));
      out.appendChild(document.createTextNode(step.rest));
      entry.appendChild(out);
    }
    return entry;
  }

  function idleEl(caret) {
    const p = el("p", "trace-idle");
    p.appendChild(el("span", "trace-prompt", "$"));
    p.appendChild(document.createTextNode(" "));
    p.appendChild(caret || el("span", "trace-caret"));
    return p;
  }

  // Rebuilds the finished transcript — identical to the static markup.
  function renderFinal() {
    body.classList.remove("is-fading");
    body.innerHTML = "";
    for (const step of SCRIPT) {
      body.appendChild(entryEl(step, step.cmd, true));
    }
    body.appendChild(idleEl());
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    root.classList.remove("is-live");
    renderFinal();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  if (mq.addEventListener) {
    mq.addEventListener("change", (e) => {
      if (e.matches) stop();
    });
  }

  const caret = el("span", "trace-caret");

  function cycle() {
    if (stopped) return;
    body.classList.remove("is-fading");
    body.innerHTML = "";
    let i = 0;

    function typeInto(node, s, done) {
      let n = 0;
      (function tick() {
        if (stopped) return;
        node.textContent = s.slice(0, ++n);
        if (n < s.length) {
          later(tick, TYPE_MIN + Math.random() * (TYPE_MAX - TYPE_MIN));
        } else {
          later(done, PAUSE_CMD);
        }
      })();
    }

    function next() {
      if (stopped) return;
      if (i >= SCRIPT.length) {
        // finished transcript: park the caret on a fresh prompt, hold, fade
        body.appendChild(idleEl(caret));
        later(() => {
          if (stopped) return;
          body.classList.add("is-fading");
          later(cycle, FADE);
        }, HOLD);
        return;
      }
      const step = SCRIPT[i++];
      const entry = entryEl(step, "", false);
      const text = entry.querySelector(".trace-text");
      entry.querySelector(".trace-cmd").appendChild(caret);
      body.appendChild(entry);
      typeInto(text, step.cmd, () => {
        if (stopped) return;
        caret.remove();
        const out = el("p", "trace-out");
        out.appendChild(glyphEl(step));
        out.appendChild(document.createTextNode(step.rest));
        entry.appendChild(out);
        later(next, PAUSE_OUT);
      });
    }

    next();
  }

  root.classList.add("is-live");
  later(cycle, START);
})();
