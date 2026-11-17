(function () {
  'use strict';

  var body = document.body;
  var header = document.querySelector('.site-header');

  /* Header state on scroll */
  function onScroll() {
    header.classList.toggle('is-solid', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
  }
  toggle.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* Reveal on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Hero headline: split into words for a staggered rise */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var h1 = document.querySelector('[data-split]');
  if (h1 && !reduce) {
    var wi = 0;
    var wrapWords = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.textContent = part.replace(/\u00a0/g, ' ');
            inner.style.setProperty('--wi', wi++);
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { wrapWords(n); }
      });
    };
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    wrapWords(h1);
    Array.prototype.forEach.call(h1.children, function (c) { c.setAttribute('aria-hidden', 'true'); });
  }

  /* Count up in the hero stats, after the headline lands */
  document.querySelectorAll('[data-count]').forEach(function (el, i) {
    var end = +el.getAttribute('data-count');
    if (reduce) { el.textContent = end; return; }
    el.textContent = '0';
    setTimeout(function () {
      var start = performance.now(), dur = 1800;
      (function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }, 1350 + i * 140);
  });

  /* Gentle parallax on the hero image */
  var heroImg = document.querySelector('.hero-media img');
  if (heroImg && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        heroImg.style.translate = '0 ' + (y * 0.25) + 'px';
        ticking = false;
      });
    }, { passive: true });
  }

  /* Portfolio: filter chips, counts and show more */
  var grid = document.querySelector('.pgrid');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.pcard'));
  var chips = document.querySelectorAll('.chip');
  var shownEl = document.querySelector('[data-shown]');
  var moreBtn = document.querySelector('[data-more]');
  var LIMIT = Infinity; /* all projects are shown, as on the live site */
  function applyFilter(key) {
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === key;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    var n = 0;
    cards.forEach(function (card) {
      var match = key === 'all' || card.getAttribute('data-type').split(' ').indexOf(key) > -1;
      card.classList.toggle('is-hidden', !match);
      card.classList.remove('is-new');
      if (match) { n++; card.classList.toggle('is-extra', n > LIMIT); void card.offsetWidth; card.classList.add('is-new'); }
      else { card.classList.remove('is-extra'); }
    });
    if (shownEl) shownEl.textContent = n;
    var collapsed = false;
    if (moreBtn) moreBtn.parentNode.hidden = !(n > LIMIT && collapsed);
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { applyFilter(c.getAttribute('data-filter')); }); });
  if (moreBtn) moreBtn.addEventListener('click', function () {
    grid.classList.remove('is-collapsed');
    moreBtn.setAttribute('aria-expanded', 'true');
    moreBtn.parentNode.hidden = true;
  });
  document.querySelectorAll('[data-filter-link]').forEach(function (a) {
    a.addEventListener('click', function () {
      var key = a.getAttribute('data-filter-link');
      if (document.querySelector('.chip[data-filter="' + key + '"]')) { applyFilter(key); return; }
      /* retail and multi have no chip: filter cards directly */
      chips.forEach(function (c) { c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false'); });
      grid.classList.remove('is-collapsed');
      if (moreBtn) moreBtn.parentNode.hidden = true;
      var n = 0;
      cards.forEach(function (card) { var m = card.getAttribute('data-type').split(' ').indexOf(key) > -1; card.classList.toggle('is-hidden', !m); if (m) n++; });
      if (shownEl) shownEl.textContent = n;
    });
  });
  if (grid) applyFilter('all');

  /* How we work: expanding panels that rotate on their own */
  var apWrap = document.querySelector('[data-ap-wrap]');
  if (apWrap) {
    var panels = Array.prototype.slice.call(apWrap.querySelectorAll('.ap-panel'));
    var DUR = 5000, cur = 0, timer = null, inView = false, hovering = false;
    var desktopAP = window.matchMedia('(min-width: 981px)'); /* auto-rotate only on desktop; tap to open on phones */
    apWrap.style.setProperty('--ap-dur', DUR + 'ms');
    var show = function (i) {
      cur = i;
      panels.forEach(function (p, k) {
        var on = k === i;
        p.classList.toggle('is-on', on);
        p.setAttribute('aria-expanded', String(on));
        var bar = p.querySelector('.ap-timer i');
        if (on && bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      schedule();
    };
    var schedule = function () {
      clearTimeout(timer);
      if (reduce || !inView || hovering || !desktopAP.matches) return;
      timer = setTimeout(function () { show((cur + 1) % panels.length); }, DUR);
    };
    panels.forEach(function (p, k) {
      p.addEventListener('click', function () { if (k !== cur) show(k); });
      p.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches && k !== cur) show(k); });
      p.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(k); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); panels[(k + 1) % panels.length].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); panels[(k - 1 + panels.length) % panels.length].focus(); }
      });
    });
    apWrap.addEventListener('mouseenter', function () { hovering = true; apWrap.classList.add('is-paused'); clearTimeout(timer); });
    apWrap.addEventListener('mouseleave', function () { hovering = false; apWrap.classList.remove('is-paused'); show(cur); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) show(cur); else clearTimeout(timer); }, { threshold: 0.35 }).observe(apWrap);
    }
  }

  /* Gallery marquee: duplicate items for a seamless loop */
  var track = document.querySelector('[data-marquee]');
  if (track) {
    Array.prototype.slice.call(track.children).forEach(function (f) {
      var c = f.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelector('img').alt = '';
      track.appendChild(c);
    });
  }

  /* Menu items mirror the live site but are not linked yet */
  document.querySelectorAll('[data-nolink]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* Contact form: validate, then open the visitor's email app */
  var form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.form-note');
      var name = form.elements.name, email = form.elements.email;
      var ok = true;
      [name, email].forEach(function (f) { f.closest('.field').classList.remove('has-error'); });
      if (!name.value.trim()) { name.closest('.field').classList.add('has-error'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { email.closest('.field').classList.add('has-error'); ok = false; }
      if (!ok) { note.textContent = 'Please add your name and a valid email address.'; return; }
      var bodyText = 'Name: ' + name.value + '\nPhone: ' + form.elements.phone.value + '\nEmail: ' + email.value +
        '\nInterested in: ' + form.elements.interest.value + '\n\n' + form.elements.message.value;
      window.location.href = 'mailto:office@alliancemjdevelopments.com?subject=' +
        encodeURIComponent('Website inquiry: ' + form.elements.interest.value) + '&body=' + encodeURIComponent(bodyText);
      note.textContent = 'Thanks. Your email app should open with your message ready to send.';
    });
  }

  /* Footer year */
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
