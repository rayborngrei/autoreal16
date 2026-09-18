/* Заявки. Точка интеграции: sendLead() — сюда CRM / Метрика / Telegram. */
(function () {
  'use strict';

  function digits(s) { return String(s || '').replace(/\D/g, ''); }

  function sendLead(data) {
    // TODO: интеграция с CRM. Сейчас только цель Метрики + консоль.
    if (typeof window.ym === 'function' && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', 'LEAD');
    if (window.console) console.log('[lead]', data);
    return Promise.resolve({ ok: true });
  }
  window.sendLead = sendLead;

  function initForm(form) {
    var okBox = form.querySelector('.form-ok');
    var errBox = form.querySelector('.form-err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errBox) errBox.classList.remove('is-on');

      var phone = form.querySelector('[name="phone"]');
      if (phone && digits(phone.value).length < 10) {
        if (errBox) { errBox.textContent = 'Укажите корректный номер телефона'; errBox.classList.add('is-on'); }
        phone.focus();
        return;
      }
      var data = {
        form: form.getAttribute('data-form') || 'unknown',
        page: location.pathname
      };
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && el.type !== 'submit') data[el.name] = el.value;
      });

      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.txt = btn.textContent; btn.textContent = 'Отправляем…'; }

      sendLead(data).then(function () {
        form.reset();
        if (okBox) okBox.classList.add('is-on');
        if (btn) { btn.textContent = 'Заявка отправлена'; }
      }).catch(function () {
        if (errBox) { errBox.textContent = 'Не удалось отправить. Позвоните нам: ' + (window.SITE_PHONE || ''); errBox.classList.add('is-on'); }
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.txt || 'Отправить'; }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('form[data-form]'), initForm);
  });
})();
