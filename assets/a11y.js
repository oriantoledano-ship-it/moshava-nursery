/* ==========================================================================
   משתלת המושבה - accessibility widget.
   Loaded in <head> so saved preferences hit <html> before first paint.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'moshava-a11y';
  var root = document.documentElement;
  var prefs = {};

  try { prefs = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { prefs = {}; }

  if (!prefs.motion && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    prefs.motion = 'off';
  }

  function defVal(k) {
    if (k === 'motion') return 'on';
    if (k === 'contrast') return 'normal';
    if (k === 'text') return 'normal';
    return 'off';
  }

  function apply(s) {
    s.contrast === 'high' ? root.setAttribute('data-contrast', 'high') : root.removeAttribute('data-contrast');
    s.text === 'large' ? root.setAttribute('data-text', 'large') : root.removeAttribute('data-text');
    s.links === 'on' ? root.setAttribute('data-links', 'on') : root.removeAttribute('data-links');
    s.motion === 'off' ? root.setAttribute('data-motion', 'off') : root.removeAttribute('data-motion');

    var chips = document.querySelectorAll('.a11y-chip');
    for (var i = 0; i < chips.length; i++) {
      var c = chips[i];
      var on = (s[c.getAttribute('data-key')] || defVal(c.getAttribute('data-key'))) === c.getAttribute('data-val');
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  apply(prefs); // paint-blocking: attributes set before content renders

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  function init() {
    var btn = document.querySelector('.a11y-btn');
    var panel = document.getElementById('a11yPanel');

    apply(prefs);

    function close() {
      if (!panel) return;
      panel.classList.remove('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
    }

    if (btn && panel) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = panel.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      });
      document.addEventListener('click', function (e) {
        if (!panel.contains(e.target) && !btn.contains(e.target)) close();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('is-open')) { close(); btn.focus(); }
      });
    }

    var chips = document.querySelectorAll('.a11y-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function () {
        prefs[this.getAttribute('data-key')] = this.getAttribute('data-val');
        save();
        apply(prefs);
        // some of the site's own scripts read the DOM once at boot
        if (this.getAttribute('data-key') === 'motion') location.reload();
      });
    }

    var reset = document.querySelector('.a11y-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        prefs = {};
        save();
        apply(prefs);
        location.reload();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
