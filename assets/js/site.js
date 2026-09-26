(function () {
  var body = document.body;

  // Footer year stays current.
  var year = document.querySelector('.year');
  if (year) year.textContent = new Date().getFullYear();

  // Header: hairline once scrolled; tucks away when scrolling down, returns when scrolling up.
  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    body.classList.toggle('is-scrolled', y > 8);
    body.classList.toggle('header-hidden', y > 240 && y > lastY);
    lastY = y;
  }, { passive: true });

  // Fade things up as they scroll into view.
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Work filters.
  var chips = document.querySelectorAll('.chip');
  var cards = document.querySelectorAll('.card');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      var n = 0;
      cards.forEach(function (card) {
        var show = filter === 'all' || card.getAttribute('data-category') === filter;
        card.classList.toggle('is-hidden', !show);
        card.classList.remove('is-entering');
        if (show) {
          card.classList.add('is-in');
          card.style.setProperty('--n', n++);
          void card.offsetWidth; // restart the entrance animation
          card.classList.add('is-entering');
        }
      });
    });
  });
})();
