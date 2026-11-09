/* ============================================================
   ESP HOSTING — interactions
   ============================================================ */

(() => {
  'use strict';

  const plans = {
    kitsune: {
      name: 'Kitsune',
      kanji: '狐',
      price: 12900,
      short: '4 ядра · 16 ГБ · 2×512 ГБ NVMe'
    },
    tengu: {
      name: 'Tengu',
      kanji: '天狗',
      price: 24900,
      short: '8 ядер · 32 ГБ · 2×1 ТБ NVMe'
    },
    ryujin: {
      name: 'Ryujin',
      kanji: '龍神',
      price: 49900,
      short: '16 ядер · 64 ГБ · 4×2 ТБ NVMe'
    }
  };

  const fmt = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /* ----------------------------------------------------------
     Header
     ---------------------------------------------------------- */
  const header = $('#header');
  const navToggle = $('#navToggle');
  const nav = $('#nav');

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 14);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  navToggle.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });

  $$('a', nav).forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('menu-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Открыть меню');
    });
  });

  /* ----------------------------------------------------------
     Petals
     ---------------------------------------------------------- */
  const petalsHost = $('#petals');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (petalsHost && !reducedMotion) {
    const COUNT = 22;
    for (let i = 0; i < COUNT; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.setProperty('--size', `${7 + Math.random() * 9}px`);
      petal.style.setProperty('--dur', `${10 + Math.random() * 10}s`);
      petal.style.setProperty('--delay', `${-Math.random() * 20}s`);
      petal.style.setProperty('--drift', `${Math.random() * 240 - 120}px`);
      petal.style.setProperty('--op', `${0.3 + Math.random() * 0.45}`);
      petalsHost.appendChild(petal);
    }
  }

  /* ----------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------- */
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('in'));
  }

  /* ----------------------------------------------------------
     Server selection
     ---------------------------------------------------------- */
  const cards = $$('.server-card');
  const selectionBar = $('#selectionBar');
  const barPlanName = $('#barPlanName');
  const barSpecs = $('#barSpecs');
  const barPrice = $('#barPrice');
  const barPay = $('#barPay');
  let selectedPlan = null;

  function selectPlan(id) {
    const plan = plans[id];
    if (!plan) return;

    selectedPlan = id;

    cards.forEach((card) => {
      const isSelected = card.dataset.plan === id;
      card.classList.toggle('is-selected', isSelected);

      const button = $('[data-select]', card);
      if (!button) return;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));

      const label = $('.btn-label', button);
      if (label) label.textContent = isSelected ? 'Выбрано' : 'Выбрать';
    });

    barPlanName.textContent = `${plan.name} · ${plan.kanji}`;
    barSpecs.textContent = plan.short;
    barPrice.textContent = fmt(plan.price);

    document.body.classList.add('bar-open');
    selectionBar.classList.add('is-visible');
  }

  cards.forEach((card) => {
    card.addEventListener('click', () => selectPlan(card.dataset.plan));
  });

  /* ----------------------------------------------------------
     Modal
     ---------------------------------------------------------- */
  const modal = $('#paymentModal');
  const panel = $('.modal-panel', modal);
  const formStep = $('[data-step="form"]', modal);
  const successStep = $('[data-step="success"]', modal);
  const form = $('#paymentForm');
  const methodTabs = $$('.pay-method', modal);
  const methodPanels = $$('[data-method-panel]', modal);

  const orderKanji = $('#orderKanji');
  const orderName = $('#orderName');
  const orderSpecs = $('#orderSpecs');
  const orderPrice = $('#orderPrice');
  const successPlan = $('#successPlan');
  const orderNo = $('#orderNo');
  const payLabel = $('#payLabel');

  let lastFocused = null;
  let lockedScrollY = 0;

  function syncOrder() {
    if (!selectedPlan) return;
    const plan = plans[selectedPlan];
    orderKanji.textContent = plan.kanji;
    orderName.textContent = plan.name;
    orderSpecs.textContent = plan.short;
    orderPrice.textContent = fmt(plan.price);
    payLabel.textContent = `Оплатить ${fmt(plan.price)}`;
    successPlan.textContent = plan.name;
  }

  function resetModal() {
    formStep.hidden = false;
    successStep.hidden = true;
    form.reset();
    clearErrors();
    $$('.btn', modal).forEach((button) => {
      button.classList.remove('is-loading');
      button.disabled = false;
    });
    setMethod('card');
    panel.scrollTop = 0;
  }

  function openModal() {
    if (!selectedPlan) return;
    lastFocused = document.activeElement;
    lockedScrollY = window.scrollY;
    syncOrder();
    resetModal();
    document.body.style.top = `-${lockedScrollY}px`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    window.setTimeout(() => {
      const closeButton = $('.modal-close', modal);
      if (closeButton) closeButton.focus({ preventScroll: true });
    }, 380);
  }

  function closeModal() {
    window.clearTimeout(paymentTimer);
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, lockedScrollY);
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
  }

  barPay.addEventListener('click', openModal);

  $$('[data-close]', modal).forEach((element) => {
    element.addEventListener('click', closeModal);
  });

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = $$('button, input, [href], [tabindex]:not([tabindex="-1"])', panel)
      .filter((element) => !element.disabled && element.offsetParent !== null);

    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ----------------------------------------------------------
     Payment methods
     ---------------------------------------------------------- */
  function setMethod(method) {
    methodTabs.forEach((tab) => {
      const active = tab.dataset.method === method;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    methodPanels.forEach((methodPanel) => {
      methodPanel.hidden = methodPanel.dataset.methodPanel !== method;
    });
  }

  methodTabs.forEach((tab) => {
    tab.addEventListener('click', () => setMethod(tab.dataset.method));
  });

  /* ----------------------------------------------------------
     Card formatting + validation
     ---------------------------------------------------------- */
  const cardNumber = $('#cardNumber');
  const cardExp = $('#cardExp');
  const cardCvc = $('#cardCvc');
  const cardName = $('#cardName');
  const formError = $('#formError');
  const cardSubmit = $('#cardSubmit');

  cardNumber.addEventListener('input', () => {
    const digits = cardNumber.value.replace(/\D/g, '').slice(0, 16);
    cardNumber.value = digits.replace(/(.{4})/g, '$1 ').trim();
    clearError(cardNumber);
  });

  cardExp.addEventListener('input', () => {
    const digits = cardExp.value.replace(/\D/g, '').slice(0, 4);
    cardExp.value = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
    clearError(cardExp);
  });

  cardCvc.addEventListener('input', () => {
    cardCvc.value = cardCvc.value.replace(/\D/g, '').slice(0, 4);
    clearError(cardCvc);
  });

  cardName.addEventListener('input', () => clearError(cardName));

  function clearError(input) {
    input.classList.remove('invalid');
    formError.textContent = '';
  }

  function clearErrors() {
    $$('input', form).forEach((input) => input.classList.remove('invalid'));
    formError.textContent = '';
  }

  function validateCard() {
    const digits = cardNumber.value.replace(/\D/g, '');
    const expDigits = cardExp.value.replace(/\D/g, '');
    const month = Number(expDigits.slice(0, 2));
    const invalidInputs = [];

    if (digits.length !== 16) invalidInputs.push(cardNumber);
    if (expDigits.length !== 4 || month < 1 || month > 12) invalidInputs.push(cardExp);
    if (cardCvc.value.length < 3) invalidInputs.push(cardCvc);
    if (cardName.value.trim().length < 2) invalidInputs.push(cardName);

    $$('input', form).forEach((input) => input.classList.remove('invalid'));

    if (invalidInputs.length > 0) {
      invalidInputs.forEach((input) => input.classList.add('invalid'));
      formError.textContent = 'Проверьте выделенные поля — в демо подойдут любые корректные данные.';
      return false;
    }

    formError.textContent = '';
    return true;
  }

  /* ----------------------------------------------------------
     Fake payment
     ---------------------------------------------------------- */
  let paymentTimer = null;

  function processPayment(button) {
    if (!selectedPlan || !button) return;

    button.classList.add('is-loading');
    button.disabled = true;

    window.clearTimeout(paymentTimer);
    paymentTimer = window.setTimeout(() => {
      button.classList.remove('is-loading');
      button.disabled = false;

      formStep.hidden = true;
      successStep.hidden = false;
      panel.scrollTop = 0;

      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      orderNo.textContent = `Заказ № ESP-${year}-${random}`;
    }, 1600);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateCard()) return;
    processPayment(cardSubmit);
  });

  $$('.pay-now', modal).forEach((button) => {
    button.addEventListener('click', () => processPayment(button));
  });

  /* ----------------------------------------------------------
     Crypto selection
     ---------------------------------------------------------- */
  const walletAddress = $('#walletAddress');
  const wallets = {
    BTC: 'bc1q-esp-hosting-0x71f2',
    ETH: '0xESP71F2A9C4D08B3E5',
    USDT: 'TESP71f2a9c4d08b3e5f6'
  };

  $$('.crypto-item', modal).forEach((item) => {
    item.addEventListener('click', () => {
      $$('.crypto-item', modal).forEach((coin) => {
        const active = coin === item;
        coin.classList.toggle('is-active', active);
        coin.setAttribute('aria-checked', String(active));
      });
      walletAddress.textContent = wallets[item.dataset.coin] || wallets.BTC;
    });
  });

  /* ----------------------------------------------------------
     Decorative QR
     ---------------------------------------------------------- */
  function drawQR(host) {
    if (!host) return;

    const size = 25;
    const cell = 5.2;
    const pad = 2;
    const total = (size + pad * 2) * cell;

    let seed = 7;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    const inFinder = (x, y) => (
      (x < 7 && y < 7) ||
      (x >= size - 7 && y < 7) ||
      (x < 7 && y >= size - 7)
    );

    let rects = '';

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (inFinder(x, y)) continue;
        if (random() > 0.56) {
          rects += `<rect x="${(x + pad) * cell}" y="${(y + pad) * cell}" width="${cell}" height="${cell}"/>`;
        }
      }
    }

    const finder = (fx, fy) => {
      const x = (fx + pad) * cell;
      const y = (fy + pad) * cell;
      return `<rect x="${x}" y="${y}" width="${cell * 7}" height="${cell * 7}"/>` +
        `<rect x="${x + cell}" y="${y + cell}" width="${cell * 5}" height="${cell * 5}" fill="#fdfaf4"/>` +
        `<rect x="${x + cell * 2}" y="${y + cell * 2}" width="${cell * 3}" height="${cell * 3}"/>`;
    };

    host.innerHTML = `
      <svg viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg" fill="#161310">
        ${rects}
        ${finder(0, 0)}
        ${finder(size - 7, 0)}
        ${finder(0, size - 7)}
      </svg>`;
  }

  drawQR($('#qr'));

  /* ----------------------------------------------------------
     Footer year (keeps the demo future-proof)
     ---------------------------------------------------------- */
  const copyright = $('.footer-bottom > span');
  if (copyright) {
    copyright.textContent = `© 2012–${new Date().getFullYear()} ESP Hosting`;
  }
})();
