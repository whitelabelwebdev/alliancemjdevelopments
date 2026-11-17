(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shadow on scroll */
  var hdr = document.querySelector('.hdr');
  var onScroll = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var burger = document.querySelector('.burger');
  var mnav = document.getElementById('mnav');
  var setMenu = function (open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.hidden = !open;
  };
  burger.addEventListener('click', function () { setMenu(mnav.hidden); });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a:not([data-nolink])')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mnav.hidden) setMenu(false); });

  /* Menu items mirror the live site but are not linked yet */
  document.querySelectorAll('[data-nolink]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* Reveal on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Hero stat count up */
  document.querySelectorAll('[data-count]').forEach(function (el, i) {
    var end = +el.getAttribute('data-count');
    if (reduce) return;
    el.textContent = '0';
    setTimeout(function () {
      var t0 = performance.now();
      (function tick(now) {
        var p = Math.min((now - t0) / 1600, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, 1000 + i * 120);
  });

  /* Featured carousel: buttons, keyboard and progress bar */
  var track = document.querySelector('[data-track]');
  if (track) {
    var prev = document.querySelector('[data-prev]');
    var next = document.querySelector('[data-next]');
    var bar = document.querySelector('[data-track-bar]');
    var step = function () { var s = track.querySelector('.slide'); return s ? s.getBoundingClientRect().width + 22 : 400; };
    var update = function () {
      var max = track.scrollWidth - track.clientWidth;
      var p = max > 0 ? track.scrollLeft / max : 0;
      var w = Math.max(.15, track.clientWidth / track.scrollWidth);
      if (bar) { bar.style.width = (w * 100) + '%'; bar.style.transform = 'translateX(' + (p * (1 / w - 1) * 100) + '%)'; }
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft > max - 4;
    };
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
    window.addEventListener('resize', update);
    update();
  }

  /* Project browser: location tabs plus live preview card */
  var items = Array.prototype.slice.call(document.querySelectorAll('.pb-item'));
  var tabs = document.querySelectorAll('.tab');
  var countEl = document.querySelector('[data-pb-count]');
  var preview = document.querySelector('.pb-preview');
  var pv = {
    img: document.querySelector('[data-pv-img]'), tag: document.querySelector('[data-pv-tag]'),
    name: document.querySelector('[data-pv-name]'), addr: document.querySelector('[data-pv-addr]'), town: document.querySelector('[data-pv-town]')
  };
  var swapTimer = null;
  function select(item) {
    if (!item || item.classList.contains('is-on') && pv.name.textContent === item.querySelector('.pb-name').textContent) return;
    items.forEach(function (x) { x.classList.toggle('is-on', x === item); });
    pv.name.textContent = item.querySelector('.pb-name').textContent;
    pv.addr.textContent = item.getAttribute('data-addr');
    pv.town.textContent = item.getAttribute('data-town');
    pv.tag.className = 'tag ' + item.getAttribute('data-pill');
    pv.tag.textContent = item.getAttribute('data-status');
    var src = item.getAttribute('data-img');
    pv.img.classList.add('is-swap');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () { pv.img.src = src; pv.img.onload = function () { pv.img.classList.remove('is-swap'); }; if (pv.img.complete) pv.img.classList.remove('is-swap'); }, 180);
  }
  var previewShown = function () { return preview && getComputedStyle(preview).display !== 'none'; };
  items.forEach(function (it) {
    var btn = it.querySelector('button');
    btn.addEventListener('mouseenter', function () { if (previewShown()) select(it); });
    btn.addEventListener('focus', function () { if (previewShown()) select(it); });
    btn.addEventListener('click', function () {
      if (previewShown()) { select(it); }
      else { document.getElementById('contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    });
  });
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var loc = t.getAttribute('data-loc'), n = 0, firstShown = null;
      tabs.forEach(function (x) { var on = x === t; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', String(on)); });
      items.forEach(function (it) {
        var show = loc === 'all' || it.getAttribute('data-loc') === loc;
        it.classList.toggle('is-hidden', !show);
        it.classList.remove('is-new');
        if (show) { n++; if (!firstShown) firstShown = it; void it.offsetWidth; it.classList.add('is-new'); }
      });
      if (countEl) countEl.textContent = n;
      if (firstShown) select(firstShown);
    });
  });

  /* CTA banner parallax */
  var ctaImg = document.querySelector('.cta-bg img');
  if (ctaImg && !reduce) {
    var cta = document.querySelector('.cta');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var r = cta.getBoundingClientRect();
        var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
        if (p > -0.1 && p < 1.1) ctaImg.style.transform = 'translateY(' + (-p * 16) + '%)';
        ticking = false;
      });
    }, { passive: true });
  }

  /* Contact form: validate, then open the visitor's email app */
  var form = document.querySelector('.form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.f-note');
      var name = form.elements.name, email = form.elements.email, ok = true;
      [name, email].forEach(function (f) { f.closest('.f').classList.remove('has-error'); });
      if (!name.value.trim()) { name.closest('.f').classList.add('has-error'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { email.closest('.f').classList.add('has-error'); ok = false; }
      if (!ok) { note.textContent = 'Please add your name and a valid email address.'; return; }
      var body = 'Name: ' + name.value + '\nPhone: ' + form.elements.phone.value + '\nEmail: ' + email.value +
        '\nInterested in: ' + form.elements.interest.value + '\n\n' + form.elements.message.value;
      window.location.href = 'mailto:office@alliancemjdevelopments.com?subject=' +
        encodeURIComponent('Website inquiry: ' + form.elements.interest.value) + '&body=' + encodeURIComponent(body);
      note.textContent = 'Thanks. Your email app should open with your message ready to send.';
    });
  }

  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
