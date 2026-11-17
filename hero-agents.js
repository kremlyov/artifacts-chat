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
  let engageTimer;
  let tiltFrame;
  let mediaEpoch = 0;
  const visible = () => !document.hidden && !app.classList.contains('is-artifacts-open');
  const resetTilt = () => { cancelAnimationFrame(tiltFrame); tilt.style.setProperty('--agents-rotate-x', '0deg'); tilt.style.setProperty('--agents-rotate-y', '0deg'); };
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
  function scheduleEngage() {
    if (reduced.matches || !engage.getAttribute('src')) return;
    const epoch = mediaEpoch;
    // Let the 720 ms capsule reveal settle before the people start moving.
    engageTimer = setTimeout(() => {
      if (epoch !== mediaEpoch || !open || !visible() || reduced.matches) return;
      engage.currentTime = 0;
      engage.playbackRate = .85;
      showFrame(engage, 'has-engage-frame', epoch);
      engage.play().catch(() => {
        if (epoch === mediaEpoch) hero.classList.remove('has-engage-frame');
      });
    }, 800);
  }
  function setOpen(active) {
    if (active && !visible()) return;
    clearTimeout(leaveTimer);
    if (open === active) return;
    open = active;
    ++mediaEpoch;
    clearTimeout(idleTimer);
    clearTimeout(engageTimer);
    idle.pause();
    engage.pause();
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
    if (active) scheduleEngage();
    else {
      resetTilt();
      // Fade out the held frame; reset only when the next reveal has settled.
      hero.classList.remove('has-engage-frame');
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
      tilt.style.setProperty('--agents-rotate-x', `${-y * 9}deg`);
      tilt.style.setProperty('--agents-rotate-y', `${x * 12}deg`);
    });
  });
  trigger.addEventListener('focus', () => { if (trigger.matches(':focus-visible')) setOpen(true); });
  trigger.addEventListener('blur', () => setOpen(false));
  trigger.addEventListener('click', (event) => { if (!finePointer.matches) setOpen(!open); else if (event.detail === 0) setOpen(true); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  document.addEventListener('pointerdown', (event) => { if (!trigger.contains(event.target)) setOpen(false); });
  idle.addEventListener('ended', scheduleIdle);
  idle.addEventListener('error', () => clearTimeout(idleTimer));
  engage.addEventListener('error', () => { clearTimeout(engageTimer); hero.classList.remove('has-engage-frame'); });
  const syncVisibility = () => {
    if (!visible() || reduced.matches) {
      setOpen(false); clearTimeout(idleTimer); clearTimeout(engageTimer); idle.pause(); engage.pause();
    } else scheduleIdle();
  };
  new MutationObserver(syncVisibility).observe(app, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', syncVisibility);
  reduced.addEventListener('change', syncVisibility);
  window.addEventListener('resize', () => { setOpen(false); resetTilt(); });
  scheduleIdle();
})();
