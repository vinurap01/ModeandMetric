/* Mode & Metric site behaviour: mobile menu, review form, before/after comparisons, and the
   small motion system (Selected work entrance, stat count-up, How it works timeline).
   Plain JS, no dependencies. Without it the page is static and fully visible: the HTML holds
   final stat values, both comparison states are reachable, and nothing starts hidden. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var clamp = function (v, lo, hi) { return Math.min(Math.max(v, lo), hi); };

  /* ---------- Mobile menu ---------- */
  (function () {
    var nav = document.querySelector('.nav');
    var toggle = nav && nav.querySelector('.nav-toggle');
    var links = nav && nav.querySelector('.nav-links');
    if (!toggle || !links) return;
    var isOpen = function () { return nav.classList.contains('is-open'); };
    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(!isOpen()); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) { if (isOpen() && !nav.contains(e.target)) setOpen(false); });
    if (window.matchMedia) {
      var wide = window.matchMedia('(min-width: 901px)');
      var close = function (e) { if (e.matches) setOpen(false); };
      if (wide.addEventListener) wide.addEventListener('change', close); else if (wide.addListener) wide.addListener(close);
    }
  }());

  /* ---------- Review form: send in place, keep the visitor on the page ---------- */
  (function () {
    var form = document.getElementById('review-form');
    var success = document.getElementById('review-success');
    var errorEl = document.getElementById('review-error');
    var btn = document.getElementById('review-submit');
    if (!form || !success || !btn || !window.fetch) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorEl.hidden = true;
      btn.disabled = true;
      var label = btn.innerHTML;
      btn.textContent = 'Sending…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('Request failed: ' + res.status);
        var store = (form.querySelector('[name="store_url"]') || {}).value || '';
        if (store) document.getElementById('review-store').textContent = store.trim();
        form.hidden = true;
        success.hidden = false;
        success.focus();
      }).catch(function () {
        btn.disabled = false;
        btn.innerHTML = label;
        errorEl.innerHTML = 'That didn’t send. Please try again, or <a href="https://www.linkedin.com/in/v-perera/">message us on LinkedIn</a> and we’ll pick it up there.';
        errorEl.hidden = false;
      });
    });
  }());

  /* ---------- Before/after switch ----------
     Pairs show both panes side by side on wide screens; on phones (and for .compare-toggle
     at every width) the switch shows one pane at a time and CSS crossfades between them. */
  each(document.querySelectorAll('.compare'), function (block) {
    var buttons = block.querySelectorAll('.compare-switch button');
    var panes = block.querySelectorAll('.pane');
    each(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-pane');
        each(buttons, function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        each(panes, function (p) { p.classList.toggle('is-active', p.getAttribute('data-pane') === target); });
      });
    });
  });

  /* ---------- Before/after slider ----------
     --pos is how much of the "before" image shows, from the left. Mouse: press and drag
     anywhere. Touch: a horizontal drag moves the divider, a vertical one scrolls the page as
     normal (touch-action: pan-y), and a tap moves the divider to that spot. */
  var sliders = [];
  each(document.querySelectorAll('[data-ba]'), function (ba) {
    var frame = ba.querySelector('.ba-frame');
    var range = ba.querySelector('.ba-range');
    var snaps = ba.querySelectorAll('[data-ba-snap]');
    if (!frame || !range) return;
    var timer = null;

    function set(pos, duration) {
      pos = clamp(pos, 0, 100);
      clearTimeout(timer);
      if (duration && !reduceMotion) {
        ba.style.setProperty('--ba-dur', duration + 'ms');
        ba.classList.add('is-animating');
        timer = setTimeout(function () { ba.classList.remove('is-animating'); }, duration + 50);
      } else {
        ba.classList.remove('is-animating');
      }
      ba.style.setProperty('--pos', pos + '%');
      ba.style.setProperty('--p', String(pos));
      var rounded = Math.round(pos);
      range.value = rounded;
      range.setAttribute('aria-valuetext', rounded + '% before, ' + (100 - rounded) + '% after');
      each(snaps, function (s) { s.setAttribute('aria-pressed', String(+s.getAttribute('data-ba-snap') === rounded)); });
    }
    function posFrom(e) {
      var r = frame.getBoundingClientRect();
      return (e.clientX - r.left) / r.width * 100;
    }

    range.addEventListener('input', function () { set(+range.value); });
    each(snaps, function (s) {
      s.addEventListener('click', function () { set(+s.getAttribute('data-ba-snap'), 600); });
    });

    var active = null; // { id, x, y, dragging, touch }
    frame.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      active = { id: e.pointerId, x: e.clientX, y: e.clientY, dragging: false, touch: e.pointerType !== 'mouse' };
      if (!active.touch) {
        active.dragging = true;
        frame.setPointerCapture(e.pointerId);
        set(posFrom(e), 250);
        e.preventDefault();
      }
    });
    frame.addEventListener('pointermove', function (e) {
      if (!active || e.pointerId !== active.id) return;
      if (!active.dragging) {
        var dx = Math.abs(e.clientX - active.x), dy = Math.abs(e.clientY - active.y);
        if (dx > 6 && dx > dy) { active.dragging = true; frame.setPointerCapture(e.pointerId); }
        else return;
      }
      set(posFrom(e));
    });
    function end(e) {
      if (!active || e.pointerId !== active.id) return;
      var tap = active.touch && !active.dragging && e.type === 'pointerup' &&
        Math.abs(e.clientX - active.x) < 6 && Math.abs(e.clientY - active.y) < 6;
      if (tap) set(posFrom(e), 350);
      active = null;
    }
    frame.addEventListener('pointerup', end);
    frame.addEventListener('pointercancel', end);

    set(+range.value);
    // Optional entrance: start on the full "before", then sweep to the middle once seen
    if (ba.hasAttribute('data-ba-intro') && !reduceMotion) {
      set(100);
      sliders.push({ el: ba, done: false, play: function () { setTimeout(function () { set(50, 1300); }, 450); } });
    }
  });

  /* ---------- Scroll-driven: entrance, count-up, timeline ----------
     One rAF-throttled scroll check. Scroll position is read directly rather than through
     IntersectionObserver so headless QA captures behave the same as real browsers. */
  var vh = function () { return window.innerHeight || root.clientHeight; };

  // Entrance: only the Selected work plates and results use it
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion) { each(reveals, function (el) { el.classList.add('is-visible'); }); reveals = []; }

  // Count-up: numbers stay at their final values until they are about to come on screen, so a
  // capture or a visitor who never scrolls there never sees "+0%"
  var counts = [];
  if (!reduceMotion && window.requestAnimationFrame) {
    each(document.querySelectorAll('[data-count]'), function (el) {
      counts.push({ el: el, state: 'idle', target: parseFloat(el.getAttribute('data-count')), decimals: parseInt(el.getAttribute('data-decimals') || '0', 10) });
    });
  }
  function format(c, value) { c.el.textContent = '+' + value.toFixed(c.decimals) + '%'; }
  function runCount(c, delay) {
    c.state = 'running';
    var duration = 1600, t0 = null;
    function frame(now) {
      if (t0 === null) t0 = now + delay;
      var p = clamp((now - t0) / duration, 0, 1);
      format(c, c.target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame); else c.state = 'done';
    }
    requestAnimationFrame(frame);
  }

  // Timeline: fills the hairline between numerals as the reading line passes through each step
  var how = document.querySelector('.how-section');
  var steps = how ? how.querySelectorAll('.steps li') : [];
  if (steps.length && !reduceMotion) how.querySelector('.steps').classList.add('is-tracking');
  else steps = [];

  function update() {
    ticking = false;
    var h = vh();

    for (var i = reveals.length - 1; i >= 0; i--) {
      if (reveals[i].getBoundingClientRect().top < h * 0.86) { reveals[i].classList.add('is-visible'); reveals.splice(i, 1); }
    }
    for (var s = 0; s < sliders.length; s++) {
      var sl = sliders[s];
      if (!sl.done && sl.el.getBoundingClientRect().top < h * 0.7) { sl.done = true; sl.play(); }
    }
    var group = 0;
    counts.forEach(function (c) {
      if (c.state === 'done' || c.state === 'running') return;
      var top = c.el.getBoundingClientRect().top;
      if (c.state === 'idle' && top < h + 240) {
        // Lock the number's width at its final value so the row doesn't shift while digits change
        c.el.style.minWidth = c.el.getBoundingClientRect().width + 'px';
        format(c, 0);
        c.state = 'armed';
      }
      if (c.state === 'armed' && top < h * 0.85) runCount(c, 120 * group++);
    });

    if (steps.length) {
      var line = h * 0.6, active = 0;
      each(steps, function (li, idx) {
        var r = li.getBoundingClientRect();
        var n = li.querySelector('.step-num').getBoundingClientRect();
        var numMid = n.top + n.height / 2;
        var reached = numMid < line;
        li.classList.toggle('is-reached', reached);
        li.classList.toggle('is-done', idx < steps.length - 1 && r.bottom < line);
        li.style.setProperty('--fill', clamp((line - numMid) / r.height, 0, 1).toFixed(3));
        if (reached) active = idx;
      });
      each(steps, function (li, idx) { li.classList.toggle('is-active', idx === active && li.classList.contains('is-reached')); });
      how.setAttribute('data-step', String(active + 1));
    }
  }
  var ticking = false;
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  if (reveals.length || sliders.length || counts.length || steps.length) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(update);
    update();
  }
}());
