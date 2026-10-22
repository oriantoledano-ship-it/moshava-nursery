(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || root.getAttribute('data-motion') === 'off';
  var base = root.getAttribute('data-base') || '';

  /* where the page opens: a refresh starts at the top, a link to a section lands there once,
     and the back button returns to the last position */
  var navType = (function () {
    var n = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (n) return n.type;
    return performance.navigation && performance.navigation.type === 1 ? 'reload' : 'navigate';
  })();
  var posKey = 'moshava-y:' + location.pathname, touched = false;
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (ev) { addEventListener(ev, function () { touched = true; }, { passive: true, once: true }); });
  addEventListener('pagehide', function () { try { sessionStorage.setItem(posKey, String(Math.round(scrollY))); } catch (e) {} });
  function initPosition() {
    var t = navType !== 'reload' && location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (location.hash) try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    if (t) { setTimeout(function () { t.scrollIntoView(); }, 60); return; }
    var y = 0;
    if (navType === 'back_forward') { try { y = parseInt(sessionStorage.getItem(posKey), 10) || 0; } catch (e) {} }
    window.scrollTo(0, y);
    if (document.readyState !== 'complete') addEventListener('load', function () { if (!touched) window.scrollTo(0, y); }, { once: true });
  }

  /* header + drawer */
  function initHeader() {
    var hdr = $('#hdr'), burger = $('.burger'), drawer = $('#drawer');
    if (!hdr) return;
    function onScroll() { hdr.classList.toggle('is-stuck', scrollY > 8); }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (!burger || !drawer) return;
    function setOpen(open) {
      hdr.classList.toggle('is-open', open);
      drawer.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
      drawer.setAttribute('aria-hidden', !open);
      root.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { setOpen(!drawer.classList.contains('is-open')); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) { setOpen(false); burger.focus(); } });
    addEventListener('resize', function () { if (innerWidth > 900 && drawer.classList.contains('is-open')) setOpen(false); });
  }

  /* in-page links scroll without leaving a #hash in the address */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      var el = id === 'top' ? document.body : document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      setTimeout(function () {
        if (el === document.body) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      }, 10);
    });
  }

  /* scroll reveals */
  function initReveal() {
    var els = $$('.rv');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.transitionDelay = (n++ % 4) * 80 + 'ms';
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* plant-name ticker: one set is measured before it is doubled, so the loop distance is exact */
  function initMarquee() {
    var track = $('.marq-track');
    if (!track) return;
    if (reduce) { track.style.animation = 'none'; return; }
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var dist = track.scrollWidth + gap;
    track.innerHTML += track.innerHTML;
    track.style.setProperty('--marq-dist', dist + 'px');
  }

  /* the reel starts downloading a screen before it arrives, and plays only while it is on screen */
  function initReel() {
    var v = $('video[data-reel]');
    if (!v) return;
    if (reduce || !('IntersectionObserver' in window)) return;
    var primed = false;
    new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting || primed) return;
      primed = true;
      v.preload = 'auto';
      v.load();
    }, { rootMargin: '900px 0px' }).observe(v);
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    }, { threshold: 0.15 }).observe(v);
  }

  /* map: inserted only once the visitor pauses near it, so scrolling past never stutters */
  function initMap() {
    var box = $('.map[data-map]');
    if (!box) return;
    var done = false, near = false, idle = null;
    function load() {
      if (done) return; done = true;
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-map');
      f.title = 'מפת הגעה למשתלת המושבה גן יבנה';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(f);
    }
    function onScroll() {
      if (done || !near) return;
      clearTimeout(idle);
      idle = setTimeout(load, 160);
    }
    if (!('IntersectionObserver' in window)) return load();
    new IntersectionObserver(function (en) { near = en[0].isIntersecting; if (near) onScroll(); else clearTimeout(idle); }, { rootMargin: '350px 0px' }).observe(box);
    addEventListener('scroll', onScroll, { passive: true });
  }

  /* hours: mark today and say whether it's open right now (Israel time) */
  function initHours() {
    var rows = $$('.hours tr[data-days]'), badge = $('[data-open]');
    var parts;
    try {
      parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    } catch (e) { return; }
    var get = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? p.value : ''; };
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    var mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
    var spans = { 0: [510, 990], 1: [510, 990], 2: [510, 990], 3: [510, 990], 4: [510, 990], 5: [510, 870] };
    rows.forEach(function (r) { if (r.getAttribute('data-days').split(',').indexOf(String(day)) > -1) r.classList.add('is-today'); });
    if (!badge || day < 0) return;
    var s = spans[day], open = s && mins >= s[0] && mins < s[1];
    var next;
    if (open) next = 'פתוחים עכשיו · עד ' + (day === 5 ? '14:30' : '16:30');
    else if (s && mins < s[0]) next = 'סגור עכשיו · נפתחים היום ב-8:30';
    else if (day === 5 || day === 6) next = 'סגור עכשיו · נפתחים ביום ראשון ב-8:30';
    else next = 'סגור עכשיו · נפתחים מחר ב-8:30';
    badge.textContent = next;
    badge.classList.toggle('is-open', !!open);
    badge.hidden = false;
  }

  /* plant finder */
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="#FFC233"/></svg>';
  var DROP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4.5 5 7.4 5 10a5 5 0 0 1-10 0c0-2.6 2-5.5 5-10z" fill="#3FA9E0"/></svg>';
  var PLANTS = [
    { id: 'portulaca', name: 'פורטולקה', alt: 'פורטולקה פורחת בוורוד וכתום', place: ['sun'], care: 1, light: 3, water: 1, tip: 'אוהבת שמש מלאה וחום, ומסתפקת במעט מים. פורחת בצבעים עזים לאורך כל הקיץ.' },
    { id: 'lavender', name: 'לבנדר', alt: 'לבנדר פורח בסגול', place: ['sun', 'gift'], care: 1, light: 3, water: 1, tip: 'ריחני ועמיד. שמש מלאה, אדמה מנוקזת, ועדיף לחסוך במים מאשר להגזים.' },
    { id: 'bunny', name: 'קקטוס אוזני ארנב', alt: 'קקטוס אוזני ארנב בעציץ', place: ['sun', 'bright'], care: 1, light: 3, water: 1, tip: 'נראה רך וחמוד, אבל עדיף לא ללטף. שמש, והשקיה רק כשהאדמה יבשה לגמרי.' },
    { id: 'pentas', name: 'פנטס', alt: 'פנטס פורח באשכולות ורודים', place: ['sun'], care: 2, light: 3, water: 2, tip: 'אשכולות של פרחי כוכב שמושכים פרפרים. השקיה סדירה וגיזום של פרחים שנבלו.' },
    { id: 'celosia', name: 'צלוזיה', alt: 'צלוזיה אדומה וכתומה', place: ['sun'], care: 2, light: 3, water: 2, tip: 'פרחים בצורת להבה באדום, כתום וצהוב. שמש, והשקיה כשהאדמה מתייבשת מלמעלה.' },
    { id: 'dianthus', name: 'ציפורן', alt: 'ציפורנים ורודות ולבנות', place: ['sun', 'gift'], care: 2, light: 3, water: 2, tip: 'פרח עונתי חמוד לעציץ ולערוגה. אוהב שמש ומזג אוויר נעים, ופורח שוב אחרי גיזום.' },
    { id: 'hoya', name: 'הויה', alt: 'הויה עם עלים מנוקדים', place: ['bright', 'gift'], care: 1, light: 2, water: 1, tip: 'עלים בשרניים שסולחים על שכחה. באור טוב היא מפתיעה באשכולות פרחים ריחניים.' },
    { id: 'tradescantia', name: 'טרדסקנציה', alt: 'טרדסקנציה עם פסים ורודים וירוקים', place: ['bright'], care: 1, light: 2, water: 2, tip: 'פסים ורודים וירוקים שמכניסים צבע לחדר. גדלה מהר ולא מבקשת הרבה.' },
    { id: 'sansevieria', name: 'סנסיווריה (לשון חמותך)', alt: 'סנסיווריה בעציצים', place: ['shade', 'bright'], care: 1, light: 1, water: 1, tip: 'כמעט בלתי ניתנת להריגה. מסתדרת גם באור חלש, והשקיה פעם בשבועיים-שלושה מספיקה.' },
    { id: 'staghorn', name: 'קרן אייל', alt: 'צמח קרן אייל תלוי', place: ['shade', 'bright'], care: 2, light: 2, water: 2, tip: 'צמח תלוי עם עלים בצורת קרניים. אור מסונן, ריסוס מים, והשקיה כשהמצע מתייבש.' },
    { id: 'cyclamen', name: 'רקפת', alt: 'רקפת פורחת בוורוד עז', place: ['gift', 'bright'], care: 2, light: 2, water: 2, tip: 'פורחת בחורף בוורוד, אדום ולבן. אוהבת מקום קריר ומואר, והשקיה מהצלחת מלמטה.' },
    { id: 'poinsettia', name: 'בת שבע', alt: 'בת שבע אדומה', place: ['gift', 'bright'], care: 2, light: 2, water: 2, tip: 'האדומה של החורף. אור טוב, בלי משבי קור, והשקיה כשהאדמה מתייבשת מלמעלה.' },
    { id: 'calathea', name: 'קלתיאה', alt: 'קלתיאה עם עלים מצוירים', place: ['bright'], care: 3, light: 2, water: 3, tip: 'עלים מצוירים שנפתחים ונסגרים לפי האור. אוהבת לחות, אור לא ישיר ואדמה לחה במידה.' },
    { id: 'fern', name: 'שרך בוסטון', alt: 'שרך בוסטון ירוק בעציץ', place: ['shade'], care: 3, light: 1, water: 3, tip: 'ירוק, רך ומלא. אוהב לחות ואור מסונן, ולא אוהב שהאדמה מתייבשת לגמרי.' }
  ];
  function dots(n, icon) {
    var s = '';
    for (var i = 1; i <= 3; i++) s += i <= n ? icon : icon.replace('<svg', '<svg class="off"');
    return s;
  }
  function card(p) {
    var src = base + 'assets/img/p-' + p.id;
    return '<li class="pl"><div class="pl-img"><img src="' + src + '-480.webp" width="480" height="600" alt="' + p.alt + '" loading="lazy" decoding="async"></div>' +
      '<div class="pl-body"><h3>' + p.name + '</h3>' +
      '<div class="meters"><span class="meter"><b>אור</b><i>' + dots(p.light, SUN) + '</i></span><span class="meter"><b>השקיה</b><i>' + dots(p.water, DROP) + '</i></span></div>' +
      '<p>' + p.tip + '</p></div></li>';
  }
  function initFinder() {
    var form = $('#finderForm'), list = $('#finderList');
    if (!form || !list) return;
    function pick() {
      var place = (form.querySelector('input[name="place"]:checked') || {}).value || 'sun';
      var care = parseInt((form.querySelector('input[name="care"]:checked') || {}).value || '1', 10);
      return PLANTS
        .map(function (p, i) { return { p: p, i: i }; })
        .filter(function (x) { return x.p.place.indexOf(place) > -1; })
        .sort(function (a, b) { return (Math.abs(a.p.care - care) - Math.abs(b.p.care - care)) || (a.i - b.i); })
        .slice(0, 3)
        .map(function (x) { return x.p; });
    }
    function render(animate) {
      var html = pick().map(card).join('');
      if (!animate || reduce) { list.innerHTML = html; return; }
      list.classList.add('is-swap');
      setTimeout(function () { list.innerHTML = html; list.classList.remove('is-swap'); }, 220);
    }
    form.addEventListener('change', function () { render(true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    render(false);
  }

  /* bottom action bar appears after the hero */
  function initMcta() {
    var hero = $('.hero') || $('.page-top'), on = false;
    if (!hero || !$('.mcta')) return;
    function onScroll() {
      var show = scrollY > hero.offsetHeight * 0.7;
      if (show !== on) { on = show; document.body.classList.toggle('mcta-on', on); }
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function boot() {
    $$('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
    initPosition();
    initHeader();
    initAnchors();
    initReveal();
    initMarquee();
    initReel();
    initMap();
    initHours();
    initFinder();
    initMcta();
    root.setAttribute('data-ready', '');
    var hero = $('.hero');
    if (hero) setTimeout(function () { hero.classList.add('is-live'); }, 60);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
