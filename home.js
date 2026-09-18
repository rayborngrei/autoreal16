/* Главная: фильтр по марке, «в избранное», стрелки у FAQ.
   Все три — прогрессивные улучшения: без JS страница работает целиком. */
document.addEventListener('DOMContentLoaded', function () {

  /* --- фильтр «Авто в наличии» по марке ------------------------------- */
  var chipBox = document.querySelector('.chips');
  var grid = document.querySelector('[data-cars]');
  var empty = document.querySelector('[data-cars-empty]');

  if (chipBox && grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-card]'));

    function apply(make) {
      var shown = 0;
      cards.forEach(function (card) {
        var ok = !make || card.getAttribute('data-make') === make;
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    }

    chipBox.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      Array.prototype.forEach.call(chipBox.querySelectorAll('.chip'), function (b) {
        var on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      apply(btn.getAttribute('data-make-filter') || '');
    });
  }

  /* --- избранное ------------------------------------------------------- */
  /* Список живёт в localStorage: бэкенда нет, а терять выбор клиента жалко. */
  var FAV_KEY = 'ar16-fav';
  function favs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveFavs(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
  }

  var saved = favs();
  Array.prototype.forEach.call(document.querySelectorAll('.card[data-card]'), function (card) {
    var btn = card.querySelector('.card__fav');
    var link = card.querySelector('.card__t a');
    if (!btn || !link) return;

    var slug = link.getAttribute('href');
    if (saved.indexOf(slug) !== -1) btn.setAttribute('aria-pressed', 'true');

    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var list = favs();
      var i = list.indexOf(slug);
      if (on && i === -1) list.push(slug);
      if (!on && i !== -1) list.splice(i, 1);
      saveFavs(list);
      btn.setAttribute('aria-label', on ? 'Убрать из избранного' : 'Добавить в избранное');
    });
  });

  /* --- стрелки у иллюстрации FAQ --------------------------------------- */
  var faq = document.querySelector('.faq');
  var prev = document.querySelector('[data-faq-prev]');
  var next = document.querySelector('[data-faq-next]');

  if (faq && prev && next) {
    var items = Array.prototype.slice.call(faq.querySelectorAll('details'));

    function openAt(i) {
      items.forEach(function (d, n) { d.open = n === i; });
      items[i].scrollIntoView({ block: 'nearest' });
      items[i].querySelector('summary').focus({ preventScroll: true });
    }
    prev.addEventListener('click', function () {
      var i = items.findIndex(function (d) { return d.open; });
      openAt(i <= 0 ? items.length - 1 : i - 1);
    });
    next.addEventListener('click', function () {
      var i = items.findIndex(function (d) { return d.open; });
      openAt(i === -1 || i === items.length - 1 ? 0 : i + 1);
    });
  }
});
