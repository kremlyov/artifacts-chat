(() => {
  'use strict';
  const app = document.querySelector('.app');
  const hero = document.querySelector('.agents-hero');
  const trigger = hero.querySelector('.agents-trigger');
  const surface = hero.querySelector('.agents-surface');
  const tilt = hero.querySelector('.agents-tilt');
  const dialogues = hero.querySelector('.agents-dialogues');
  const idle = hero.querySelector('.agents-idle');
  const engage = hero.querySelector('.agents-engage');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let open = false;
  let idleTimer;
  let leaveTimer;
  let tiltFrame;
  let reverseFrame;
  let mediaEpoch = 0;
  const visible = () => !document.hidden && !app.classList.contains('is-artifacts-open');
  const resetTilt = () => { tilt.style.setProperty('--agents-rotate-x', '0deg'); tilt.style.setProperty('--agents-rotate-y', '0deg'); };
  function scheduleIdle() {
    clearTimeout(idleTimer);
    if (open || reduced.matches || !visible() || !idle.getAttribute('src')) return;
    idleTimer = setTimeout(playIdle, 4000 + Math.random() * 5000);
  }
  function showFrame(video, className, epoch) {
    const show = () => { if (epoch === mediaEpoch && visible()) hero.classList.add(className); };
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(show);
    else video.addEventListener('timeupdate', show, { once: true });
  }
  function playIdle() {
    if (open || reduced.matches || !visible()) return;
    const epoch = ++mediaEpoch;
    idle.currentTime = 0;
    showFrame(idle, 'has-idle-frame', epoch);
    idle.play().catch(scheduleIdle);
  }
  function reverseEngage() {
    cancelAnimationFrame(reverseFrame);
    engage.pause();
    if (reduced.matches || !Number.isFinite(engage.duration) || engage.currentTime <= 0) return;
    let previous;
    const step = (now) => {
      if (open || !visible()) return;
      if (previous !== undefined && !engage.seeking) engage.currentTime = Math.max(0, engage.currentTime - Math.min((now - previous) / 1000, .06) * 1.5);
      previous = now;
      if (engage.currentTime > 0) reverseFrame = requestAnimationFrame(step);
      else hero.classList.remove('has-engage-frame');
    };
    reverseFrame = requestAnimationFrame(step);
  }
  function setOpen(active) {
    if (active && !visible()) return;
    clearTimeout(leaveTimer);
    if (open === active) return;
    open = active;
    ++mediaEpoch;
    clearTimeout(idleTimer);
    idle.pause();
    cancelAnimationFrame(reverseFrame);
    if (active) {
      const rect = trigger.getBoundingClientRect();
      const bounds = document.querySelector('.workspace').getBoundingClientRect();
      const width = parseFloat(getComputedStyle(hero).getPropertyValue('--agents-expanded-width'));
      const left = rect.left + rect.width / 2 - width / 2;
      const clampedLeft = Math.max(bounds.left + 12, Math.min(left, bounds.right - width - 12));
      hero.style.setProperty('--agents-shift-x', `${clampedLeft - left}px`);
    }
    hero.classList.toggle('is-agents-open', active);
    trigger.setAttribute('aria-expanded', String(active));
    dialogues.setAttribute('aria-hidden', String(!active));
    if (active && !reduced.matches && engage.getAttribute('src')) {
      const epoch = mediaEpoch;
      if (engage.ended) engage.currentTime = 0;
      showFrame(engage, 'has-engage-frame', epoch);
      engage.play().catch(() => {});
    } else if (!active) {
      resetTilt();
      reverseEngage();
      scheduleIdle();
    }
  }
  trigger.addEventListener('pointerenter', () => { if (finePointer.matches) setOpen(true); });
  trigger.addEventListener('pointerleave', () => { if (finePointer.matches) leaveTimer = setTimeout(() => setOpen(false), 120); });
  trigger.addEventListener('pointermove', (event) => {
    if (!open || reduced.matches || !finePointer.matches) return;
    cancelAnimationFrame(tiltFrame);
    tiltFrame = requestAnimationFrame(() => {
      const rect = surface.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      tilt.style.setProperty('--agents-rotate-x', `${-y * 7}deg`);
      tilt.style.setProperty('--agents-rotate-y', `${x * 9}deg`);
    });
  });
  trigger.addEventListener('focus', () => { if (trigger.matches(':focus-visible')) setOpen(true); });
  trigger.addEventListener('blur', () => setOpen(false));
  trigger.addEventListener('click', (event) => { if (!finePointer.matches) setOpen(!open); else if (event.detail === 0) setOpen(true); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  document.addEventListener('pointerdown', (event) => { if (!trigger.contains(event.target)) setOpen(false); });
  idle.addEventListener('ended', scheduleIdle);
  idle.addEventListener('error', () => clearTimeout(idleTimer));
  const syncVisibility = () => {
    if (!visible() || reduced.matches) {
      setOpen(false); clearTimeout(idleTimer); idle.pause(); engage.pause(); cancelAnimationFrame(reverseFrame);
    } else scheduleIdle();
  };
  new MutationObserver(syncVisibility).observe(app, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', syncVisibility);
  reduced.addEventListener('change', syncVisibility);
  window.addEventListener('resize', () => { setOpen(false); resetTilt(); });
  scheduleIdle();
})();
