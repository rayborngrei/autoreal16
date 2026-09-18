/* Галерея карточки авто: превью + лайтбокс. */
(function () {
  'use strict';

  function initGallery() {
    var main = document.querySelector('#g-main');
    var thumbs = document.querySelectorAll('[data-thumb]');
    if (!main || !thumbs.length) return;

    Array.prototype.forEach.call(thumbs, function (btn) {
      btn.addEventListener('click', function () {
        main.src = btn.dataset.full;
        main.alt = btn.dataset.alt || '';
        Array.prototype.forEach.call(thumbs, function (b) { b.removeAttribute('aria-current'); });
        btn.setAttribute('aria-current', 'true');
      });
    });

    main.addEventListener('click', function () { openLightbox(main.src, main.alt); });
  }

  function openLightbox(src, alt) {
    var lb = document.querySelector('.lb');
    if (!lb) return;
    var img = lb.querySelector('img');
    img.src = src;
    img.alt = alt || '';
    lb.classList.add('is-on');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb__x').focus();

    function close() {
      lb.classList.remove('is-on');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    lb.querySelector('.lb__x').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', onKey);
  }

  document.addEventListener('DOMContentLoaded', initGallery);
})();
