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

  /* Project list: location tabs (same groups as the live site) */
  var tabs = document.querySelectorAll('.tab');
  var rows = document.querySelectorAll('.row');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var loc = t.getAttribute('data-loc');
      tabs.forEach(function (x) { var on = x === t; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', String(on)); });
      rows.forEach(function (r) {
        var show = loc === 'all' || r.getAttribute('data-loc') === loc;
        r.classList.toggle('is-hidden', !show);
        r.classList.remove('is-new');
        if (show) { void r.offsetWidth; r.classList.add('is-new'); }
      });
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
