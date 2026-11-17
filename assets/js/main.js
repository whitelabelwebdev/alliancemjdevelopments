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

  /* Count up in the hero ledger */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = +el.getAttribute('data-count');
    var start = performance.now();
    var dur = 1400;
    el.textContent = '0';
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  });

  /* Development tabs */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.dev-tab'));
  function activateTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activateTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (dir) { e.preventDefault(); activateTab(tabs[(i + dir + tabs.length) % tabs.length], true); }
    });
  });
  document.querySelectorAll('[data-tab-link]').forEach(function (a) {
    a.addEventListener('click', function () {
      var t = document.getElementById(a.getAttribute('data-tab-link'));
      if (t) activateTab(t);
    });
  });

  /* Portfolio filter */
  var chips = document.querySelectorAll('.chip');
  var rows = document.querySelectorAll('.index-list li');
  function applyFilter(key) {
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === key;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    rows.forEach(function (r) {
      var types = r.getAttribute('data-type').split(' ');
      r.classList.toggle('is-hidden', !(key === 'all' || types.indexOf(key) > -1));
    });
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () { applyFilter(c.getAttribute('data-filter')); });
  });
  document.querySelectorAll('[data-filter-link]').forEach(function (a) {
    a.addEventListener('click', function () {
      var key = a.getAttribute('data-filter-link');
      var known = document.querySelector('.chip[data-filter="' + key + '"]');
      if (known) { applyFilter(key); return; }
      /* retail and multi have no chip: show all, then filter rows directly */
      applyFilter('all');
      chips.forEach(function (c) { c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false'); });
      rows.forEach(function (r) { r.classList.toggle('is-hidden', r.getAttribute('data-type').split(' ').indexOf(key) < 0); });
    });
  });

  /* Hover image preview on the project index */
  var preview = document.querySelector('.index-preview');
  var previewImg = preview && preview.querySelector('img');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (preview && finePointer) {
    var x = 0, y = 0, cx = 0, cy = 0, raf = null;
    function loop() {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      preview.style.transform = 'translate3d(' + (cx + 40) + 'px,' + (cy - 110) + 'px,0) scale(' + (preview.classList.contains('is-on') ? 1 : .85) + ')';
      raf = requestAnimationFrame(loop);
    }
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () {
        previewImg.src = 'assets/images/projects/' + r.getAttribute('data-img') + '/thumb.jpg';
        previewImg.alt = '';
        preview.classList.add('is-on');
        if (!raf) loop();
      });
      r.addEventListener('mouseleave', function () { preview.classList.remove('is-on'); });
    });
    document.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; }, { passive: true });
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

  /* Active nav link */
  var navLinks = document.querySelectorAll('.main-nav a');
  var sections = Array.prototype.map.call(navLinks, function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) nio.observe(s); });
  }

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
