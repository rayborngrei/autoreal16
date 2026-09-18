/* Шапка: бургер-меню. */
document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.burger');
  var panel = document.querySelector('.mnav');
  if (!burger || !panel) return;

  function setOpen(open) {
    panel.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', function () {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1100) setOpen(false);
  });
});
