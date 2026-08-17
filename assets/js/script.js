(function(){
  "use strict";
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============ Nav: scroll state + mobile toggle ============ */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function onScroll(){
    if(window.scrollY > 40){ nav.classList.add('scrolled'); }
    else{ nav.classList.remove('scrolled'); }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if(navToggle){
    navToggle.addEventListener('click', function(){
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ============ Reveal on scroll ============ */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && !prefersReducedMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ============ Stat count-up ============ */
  var statNums = document.querySelectorAll('.stat-num');
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = (String(target).split('.')[1] || '').length;
    if(prefersReducedMotion){
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }
    var duration = 1400;
    var startTime = null;
    function step(ts){
      if(!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;
      el.textContent = prefix + current.toFixed(decimals) + suffix;
      if(progress < 1){ requestAnimationFrame(step); }
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var statIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          animateCount(entry.target);
          statIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statNums.forEach(function(el){ statIo.observe(el); });
  } else {
    statNums.forEach(animateCount);
  }

  /* ============ Bar charts ============ */
  function renderBarChart(containerId, data, opts){
    var container = document.getElementById(containerId);
    if(!container) return;
    opts = opts || {};
    var max = opts.max || Math.max.apply(null, data.map(function(d){ return d.value; }));
    var rows = data.map(function(d, idx){
      return (
        '<div class="bar-row">' +
          '<span class="bar-row-label">' + d.label + '</span>' +
          '<div class="bar-track">' +
            (opts.marker ? '<div class="price-marker' + (idx === 0 ? ' price-marker-labeled' : '') + '" style="left:' + (opts.marker / max * 100) + '%"></div>' : '') +
            '<div class="bar-fill" data-width="' + (d.value / max * 100) + '"></div>' +
          '</div>' +
          '<span class="bar-value">' + d.display + '</span>' +
        '</div>'
      );
    }).join('');
    container.innerHTML = rows;

    var fills = container.querySelectorAll('.bar-fill');
    if('IntersectionObserver' in window){
      var barIo = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            var fill = entry.target;
            var w = fill.getAttribute('data-width');
            requestAnimationFrame(function(){ fill.style.width = w + '%'; });
            barIo.unobserve(fill);
          }
        });
      }, { threshold: 0.3 });
      fills.forEach(function(f){ barIo.observe(f); });
    } else {
      fills.forEach(function(f){ f.style.width = f.getAttribute('data-width') + '%'; });
    }
  }

  renderBarChart('chartComparables', [
    { label: 'Av. Palmira (mixto)', value: 5500, display: '$5,500/m²' },
    { label: 'Esquina, col. Palmira', value: 6500, display: '$6,500/m²' },
    { label: 'Privada s/avenida', value: 9000, display: '$9,000/m²' },
    { label: 'Padel Palmira (rango)', value: 8000, display: '~$8,000/m²' }
  ]);

  renderBarChart('chartValuacion', [
    { label: 'Conservador', value: 33.7, display: '$33.7M' },
    { label: 'Base / Realista', value: 39.7, display: '$39.7M' },
    { label: 'Optimista', value: 47.5, display: '$47.5M' }
  ], { max: 47.5, marker: 33 });

  /* ============ Before/after compare sliders ============ */
  var sliders = document.querySelectorAll('[data-slider]');
  sliders.forEach(function(wrap){
    var frame = wrap.querySelector('.compare-slider-frame');
    var overlay = wrap.querySelector('.compare-overlay');
    var handle = wrap.querySelector('.compare-handle');
    var range = wrap.querySelector('.compare-range');

    function setFrameWidthVar(){
      var w = frame.getBoundingClientRect().width;
      frame.style.setProperty('--frame-w', w + 'px');
    }
    function update(val){
      overlay.style.width = val + '%';
      handle.style.left = val + '%';
    }
    setFrameWidthVar();
    update(range.value);

    range.addEventListener('input', function(){ update(range.value); });
    window.addEventListener('resize', setFrameWidthVar, { passive: true });
  });

  /* ============ Download gate (2-digit code) ============ */
  (function initGate() {
    const CODE = '58';
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_MS = 12 * 60 * 60 * 1000; // 12 hours
    const UNLOCK_MS = 15 * 60 * 1000;       // 15 minutes
    const LS_ATTEMPTS = 'pp_gate_attempts';
    const LS_LOCKOUT = 'pp_gate_lockout_until';
    const LS_UNLOCKED = 'pp_gate_unlocked_until';

    const overlay = document.getElementById('gateOverlay');
    if (!overlay) return; // gate not present on this page
    const modal = overlay.querySelector('.gate-modal');
    const closeBtn = document.getElementById('gateClose');
    const digit0 = document.getElementById('gateDigit0');
    const digit1 = document.getElementById('gateDigit1');
    const submitBtn = document.getElementById('gateSubmit');
    const msgEl = document.getElementById('gateMsg');
    const subEl = document.getElementById('gateSub');
    const unlockedMsgEl = document.getElementById('gateUnlockedMsg');
    const gatedLinks = document.querySelectorAll('[data-gated]');

    let pendingLink = null;

    function getNum(key) { return parseInt(localStorage.getItem(key) || '0', 10); }
    function setNum(key, val) { localStorage.setItem(key, String(val)); }

    function formatRemaining(ms) {
      const totalMin = Math.max(1, Math.ceil(ms / 60000));
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      if (h > 0) return `${h} hora${h === 1 ? '' : 's'}${m > 0 ? ` y ${m} min` : ''}`;
      return `${m} minuto${m === 1 ? '' : 's'}`;
    }

    function triggerDownload(link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.setAttribute('download', '');
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    function openModal() {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }
    function closeModal() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      pendingLink = null;
    }

    function showLockedState(remainingMs) {
      modal.classList.add('locked');
      subEl.textContent = '';
      msgEl.classList.add('is-locked');
      msgEl.textContent = `Demasiados intentos. Vuelve a intentarlo en ${formatRemaining(remainingMs)}.`;
      unlockedMsgEl.textContent = '';
    }

    function showEntryState() {
      modal.classList.remove('locked');
      msgEl.classList.remove('is-locked');
      subEl.textContent = 'Ingresa el código de 2 dígitos para descargar.';
      msgEl.textContent = '';
      unlockedMsgEl.textContent = '';
      digit0.value = '';
      digit1.value = '';
      digit0.classList.remove('filled');
      digit1.classList.remove('filled');
      setTimeout(() => digit0.focus(), 50);
    }

    gatedLinks.forEach((link) => {
      if (link.hasAttribute('data-preview-disabled')) return; // not bundled in this preview build
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const now = Date.now();
        const lockoutUntil = getNum(LS_LOCKOUT);
        const unlockedUntil = getNum(LS_UNLOCKED);

        if (now < unlockedUntil) {
          // Already unlocked within the 15-minute window — download immediately.
          triggerDownload(link);
          return;
        }
        pendingLink = link;
        if (now < lockoutUntil) {
          openModal();
          showLockedState(lockoutUntil - now);
        } else {
          openModal();
          showEntryState();
        }
      });
    });

    // Digit input behavior: numeric only, auto-advance, backspace goes back, Enter submits.
    [digit0, digit1].forEach((el, idx) => {
      el.addEventListener('input', () => {
        el.value = el.value.replace(/[^0-9]/g, '').slice(0, 1);
        el.classList.toggle('filled', el.value.length === 1);
        if (el.value.length === 1 && idx === 0) digit1.focus();
        if (el.value.length === 1 && idx === 1 && digit0.value.length === 1) trySubmit();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && el.value === '' && idx === 1) digit0.focus();
        if (e.key === 'Enter') trySubmit();
      });
    });

    function trySubmit() {
      if (modal.classList.contains('locked')) return;
      const entered = digit0.value + digit1.value;
      if (entered.length < 2) {
        msgEl.classList.remove('is-locked');
        msgEl.textContent = 'Ingresa los 2 dígitos.';
        return;
      }
      const now = Date.now();
      if (entered === CODE) {
        setNum(LS_ATTEMPTS, 0);
        setNum(LS_UNLOCKED, now + UNLOCK_MS);
        msgEl.classList.remove('is-locked');
        msgEl.textContent = '';
        unlockedMsgEl.textContent = 'Correcto — descargas desbloqueadas por 15 minutos.';
        const link = pendingLink;
        setTimeout(() => {
          closeModal();
          if (link) triggerDownload(link);
        }, 700);
      } else {
        const attempts = getNum(LS_ATTEMPTS) + 1;
        setNum(LS_ATTEMPTS, attempts);
        if (attempts >= MAX_ATTEMPTS) {
          const lockoutUntil = now + LOCKOUT_MS;
          setNum(LS_LOCKOUT, lockoutUntil);
          setNum(LS_ATTEMPTS, 0);
          showLockedState(LOCKOUT_MS);
        } else {
          const left = MAX_ATTEMPTS - attempts;
          msgEl.classList.remove('is-locked');
          msgEl.textContent = `Código incorrecto — te queda${left === 1 ? '' : 'n'} ${left} intento${left === 1 ? '' : 's'}.`;
          digit0.value = '';
          digit1.value = '';
          digit0.classList.remove('filled');
          digit1.classList.remove('filled');
          digit0.focus();
        }
      }
    }

    submitBtn.addEventListener('click', trySubmit);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });
  })();

  /* ============ App demo (phone mockup tabs) ============ */
  (function initAppDemo(){
    const outerTabs = document.querySelectorAll('.app-tab-btn');
    const innerTabs = document.querySelectorAll('.au-nav-btn');
    const screens = document.querySelectorAll('.au-screen');
    if (!screens.length) return;

    function showScreen(name){
      screens.forEach((s) => s.classList.toggle('active', s.getAttribute('data-screen') === name));
      outerTabs.forEach((b) => {
        const active = b.getAttribute('data-screen') === name;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      innerTabs.forEach((b) => b.classList.toggle('active', b.getAttribute('data-screen') === name));
    }
    outerTabs.forEach((b) => b.addEventListener('click', () => showScreen(b.getAttribute('data-screen'))));
    innerTabs.forEach((b) => b.addEventListener('click', () => showScreen(b.getAttribute('data-screen'))));

    // Gentle auto-advance so the demo feels alive even before anyone taps it;
    // stops permanently once the visitor interacts, so it never fights them.
    const order = ['inicio', 'torneos', 'puntos'];
    let idx = 0;
    let auto = setInterval(() => {
      idx = (idx + 1) % order.length;
      showScreen(order[idx]);
    }, 3600);
    function stopAuto(){ clearInterval(auto); }
    [...outerTabs, ...innerTabs].forEach((b) => b.addEventListener('click', stopAuto, { once: true }));
  })();

})();
