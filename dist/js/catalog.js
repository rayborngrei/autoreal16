/* Фильтры и сортировка каталога. */
(function () {
  'use strict';

  var state = { make: '', body: '', gear: '', drive: '', stock: 'all', max: 0, sort: 'default' };

  function q(s) { return document.querySelector(s); }
  function num(v) { return parseInt(String(v || '').replace(/\D/g, ''), 10) || 0; }

  function readUrl() {
    var p = new URLSearchParams(location.search);
    if (p.get('make')) state.make = p.get('make');
    if (p.get('body')) state.body = p.get('body');
    if (p.get('gear')) state.gear = p.get('gear');
    if (p.get('drive')) state.drive = p.get('drive');
    if (p.get('stock')) state.stock = p.get('stock');
    if (p.get('max')) state.max = num(p.get('max'));
  }

  /* URL → состояние → DOM (а не только DOM, иначе фильтр «сбрасывается»). */
  function syncControls() {
    if (q('#f-make')) q('#f-make').value = state.make;
    if (q('#f-body')) q('#f-body').value = state.body;
    if (q('#f-gear')) q('#f-gear').value = state.gear;
    if (q('#f-drive')) q('#f-drive').value = state.drive;
    var rng = q('#f-max');
    if (rng) {
      if (state.max) rng.value = String(state.max);
      else rng.value = rng.max;
      var out = q('#f-max-out');
      if (out) out.textContent = fmt(rng.value);
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-stock]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-stock') === state.stock ? 'true' : 'false');
    });
  }

  function fmt(v) {
    var n = num(v);
    if (!n) return 'без лимита';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + '\u00A0млн\u00A0₽';
    return Math.round(n / 1000) + '\u00A0тыс\u00A0₽';
  }

  function apply() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    var shown = 0;
    cards.forEach(function (c) {
      var ok =
        (!state.make || c.dataset.make === state.make) &&
        (!state.body || c.dataset.body === state.body) &&
        (!state.gear || c.dataset.gear === state.gear) &&
        (!state.drive || c.dataset.drive === state.drive) &&
        (state.stock === 'all' || c.dataset.stock === state.stock) &&
        (!state.max || num(c.dataset.price) <= state.max);
      c.hidden = !ok;
      if (ok) shown++;
    });

    var box = q('[data-cards]');
    if (box) {
      var list = cards.slice();
      var cmp = {
        'price-asc': function (a, b) { return num(a.dataset.price) - num(b.dataset.price); },
        'price-desc': function (a, b) { return num(b.dataset.price) - num(a.dataset.price); },
        'year-desc': function (a, b) { return num(b.dataset.year) - num(a.dataset.year); }
      }[state.sort];
      if (cmp) {
        list.sort(cmp);
        list.forEach(function (c) { box.appendChild(c); });
      }
    }

    var cnt = q('#count');
    if (cnt) cnt.textContent = plural(shown);
    var empty = q('#empty');
    if (empty) empty.hidden = shown !== 0;
  }

  function plural(n) {
    var w = ['автомобиль', 'автомобиля', 'автомобилей'];
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return n + '\u00A0' + w[2];
    if (b > 1 && b < 5) return n + '\u00A0' + w[1];
    if (b === 1) return n + '\u00A0' + w[0];
    return n + '\u00A0' + w[2];
  }

  document.addEventListener('DOMContentLoaded', function () {
    var box = q('[data-cards]');
    if (!box) return;
    readUrl();
    syncControls();

    ['#f-make', '#f-body', '#f-gear', '#f-drive'].forEach(function (sel) {
      var el = q(sel);
      if (!el) return;
      el.addEventListener('change', function () {
        state[sel.slice(3)] = el.value;
        apply();
      });
    });

    var rng = q('#f-max');
    if (rng) rng.addEventListener('input', function () {
      state.max = rng.value === rng.max ? 0 : num(rng.value);
      var out = q('#f-max-out');
      if (out) out.textContent = fmt(rng.value);
      apply();
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-stock]'), function (b) {
      b.addEventListener('click', function () {
        state.stock = b.getAttribute('data-stock');
        Array.prototype.forEach.call(document.querySelectorAll('[data-stock]'), function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        apply();
      });
    });

    var sortSel = q('#f-sort');
    if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; apply(); });

    var reset = q('#f-reset');
    if (reset) reset.addEventListener('click', function () {
      state = { make: '', body: '', gear: '', drive: '', stock: 'all', max: 0, sort: 'default' };
      if (sortSel) sortSel.value = 'default';
      syncControls();
      apply();
    });

    apply();
  });
})();
