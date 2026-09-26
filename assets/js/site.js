// Mobile menu toggle (the only script on the site).
(function () {
  var btn = document.querySelector('.menu-toggle');
  if (!btn) return;
  var label = btn.querySelector('.visually-hidden');
  function set(open) {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Close Menu' : 'Open Menu';
  }
  btn.addEventListener('click', function () {
    set(!document.body.classList.contains('menu-open'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') set(false);
  });
})();

// Keep the footer copyright year current.
(function () {
  var y = document.querySelector('.footer .year');
  if (y) y.textContent = new Date().getFullYear();
})();

// Header shadow after scrolling, and fade-in of tiles, videos and text as they enter the screen.
(function () {
  var root = document.documentElement;
  var onScroll = function () { document.body.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!('IntersectionObserver' in window)) return;
  root.classList.add('js');
  var items = document.querySelectorAll('.grid-item, .fe-block, .item-pagination');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el, i) {
    el.classList.add('reveal');
    // Stagger tiles in each grid row of three
    if (el.classList.contains('grid-item')) el.style.setProperty('--d', (i % 3) * 0.08 + 's');
    io.observe(el);
  });
})();
