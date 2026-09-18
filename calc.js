/* Калькулятор стоимости пригона из Китая.
   ВНИМАНИЕ: ставки в RATES — ориентиры, подтвердить с заказчиком перед публикацией.
   Округлённая модель для физлица (ввоз для личного пользования). */
(function () {
  'use strict';

  var RATES = {
    duty: 0.15,          // таможенная пошлина, % от инвойса
    comm: 0.05,          // комиссия компании, %
    commMin: 120000,     // минимум комиссии, ₽
    broker: 35000,       // брокер + СВХ + оформление, ₽
    feeTiers: [          // таможенный сбор по инвойсу, ₽
      [200000, 1067], [450000, 2134], [1200000, 4269], [2700000, 7500],
      [4200000, 10000], [5500000, 12000], [7000000, 15000], [Infinity, 20000]
    ],
    utilNew: 3400,       // утильсбор, авто до 3 лет, ₽
    utilOld: 5200,       // утильсбор, авто старше 3 лет, ₽
    ways: {
      rail: { name: 'Ж/д + автовоз', cost: 210000, days: '21–28 дней' },
      auto: { name: 'Автовоз', cost: 260000, days: '16–22 дня' },
      sea: { name: 'Морской контейнер', cost: 340000, days: '35–50 дней' }
    }
  };

  // ru-RU сам ставит неразрывный пробел между разрядами — не заменяем его обычным
  function money(n) { return Math.round(n).toLocaleString('ru-RU') + '\u00A0₽'; }
  function num(el, def) { var v = parseInt(String((el && el.value) || '').replace(/\D/g, ''), 10); return isNaN(v) ? def : v; }

  function calcTotal(invoice, engine, year, way) {
    var P = Math.max(0, invoice || 0);
    var w = RATES.ways[way] || RATES.ways.rail;
    var duty = Math.round(P * RATES.duty);
    var fee = RATES.feeTiers.reduce(function (acc, t) { return P <= t[0] && acc === 0 ? t[1] : acc; }, 0);
    var age = new Date().getFullYear() - (year || new Date().getFullYear());
    var util = age <= 3 ? RATES.utilNew : RATES.utilOld;
    var comm = Math.max(RATES.commMin, Math.round(P * RATES.comm));
    var rows = [
      ['Стоимость авто по инвойсу', P],
      ['Доставка ' + w.name.toLowerCase(), w.cost],
      ['Таможенная пошлина (' + (RATES.duty * 100) + '%)', duty],
      ['Таможенный сбор', fee],
      ['Утилизационный сбор', util],
      ['Брокер, СВХ, оформление', RATES.broker],
      ['Комиссия компании', comm]
    ];
    var total = rows.reduce(function (s, r) { return s + r[1]; }, 0);
    return { rows: rows, total: total, days: w.days, engine: engine, age: age };
  }
  window.calcTotal = calcTotal;

  function q(s) { return document.querySelector(s); }

  function render() {
    var box = q('[data-calc]');
    if (!box) return;
    var invoice = num(q('#c-price'), 3000000);
    var engine = num(q('#c-engine'), 1998);
    var year = num(q('#c-year'), new Date().getFullYear());
    var way = (q('#c-way') || {}).value || 'rail';
    var r = calcTotal(invoice, engine, year, way);

    var tbody = q('#calc-rows');
    if (tbody) {
      tbody.innerHTML = r.rows.map(function (row) {
        return '<div class="calc__row"><span>' + row[0] + '</span><b>' + money(row[1]) + '</b></div>';
      }).join('') + '<div class="calc__row calc__row--sum"><span>Итого «под ключ»</span><b>' + money(r.total) + '</b></div>';
    }
    var tot = q('#c-total');
    if (tot) tot.innerHTML = money(r.total).replace('\u00A0₽', '<i>\u00A0₽</i>');
    var days = q('#c-days');
    if (days) days.textContent = r.days;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!q('[data-calc]')) return;
    ['#c-price', '#c-engine', '#c-year', '#c-way'].forEach(function (sel) {
      var el = q(sel);
      if (!el) return;
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    render();
  });
})();
