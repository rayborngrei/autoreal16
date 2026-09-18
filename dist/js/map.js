/* Яндекс.Карта — грузим iframe только по клику (экономия трафика). */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var box = document.querySelector('[data-map]');
    if (!box) return;
    var src = box.getAttribute('data-map');
    var btn = box.querySelector('.map-box__load') || box;

    function load() {
      if (box.dataset.loaded) return;
      box.dataset.loaded = '1';
      var f = document.createElement('iframe');
      f.src = src;
      f.title = 'Автореал16 на карте';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(f);
    }

    btn.addEventListener('click', load);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { load(); io.disconnect(); } });
      }, { rootMargin: '400px' });
      io.observe(box);
    }
  });
})();
