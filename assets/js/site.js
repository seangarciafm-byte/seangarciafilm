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

// Contact form: send in the background and show the result inline.
(function () {
  var form = document.querySelector('.contact-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');
  form.elements.t.value = Date.now();

  function show(message, ok) {
    status.textContent = message;
    status.className = 'form-status ' + (ok ? 'is-ok' : 'is-error');
  }

  // Result after a no-JavaScript submit redirects back here.
  var result = new URLSearchParams(location.search).get('status');
  if (result === 'sent') show('Thanks! Your message has been sent.', true);
  if (result === 'error') show('Sorry, something went wrong. Please try again.', false);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var invalid = [];
    ['name', 'email', 'message'].forEach(function (id) {
      var field = form.elements[id];
      var bad = !field.value.trim() || (id === 'email' && !field.checkValidity());
      field.closest('.field').classList.toggle('has-error', bad);
      if (bad) invalid.push(field);
    });
    if (invalid.length) {
      show('Please fill in your name, a valid email address and a message.', false);
      invalid[0].focus();
      return;
    }
    button.disabled = true;
    button.textContent = 'Sending…';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        show(data.message, data.ok);
        if (data.ok) form.reset();
      })
      .catch(function () {
        show('Sorry, something went wrong. Please try again in a moment.', false);
      })
      .then(function () {
        button.disabled = false;
        button.textContent = 'Send message';
        form.elements.t.value = Date.now() - 5000;
      });
  });
})();
