(() => {
  'use strict';
  if (window.parent === window) {
    document.body.classList.remove('ai-entrance-pending');
    return;
  }
  const origin = window.location.origin;
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let entranceTimer;
  const announce = () => window.parent.postMessage({
    type: 'artifacts:state',
    state: body.dataset.flowState,
    chatWidth: document.querySelector('.app').style.getPropertyValue('--chat-width')
  }, origin);
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== origin || event.data?.type !== 'artifacts:visibility') return;
    const active = Boolean(event.data.active);
    if (active === visible) return;
    visible = active;
    clearTimeout(entranceTimer);
    body.classList.remove('ai-entering');
    body.classList.toggle('ai-entrance-pending', !active);
    if (active && body.dataset.flowState === 'idle' && !reduced.matches) {
      body.classList.add('ai-entering');
      // Includes the gallery's delay and full settling time.
      entranceTimer = setTimeout(() => body.classList.remove('ai-entering'), 1400);
    }
    if (!active) {
      window.ArtifactsPrecise?.setEnabled(false);
      document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
    }
  });
  new MutationObserver(announce).observe(body, { attributes: true, attributeFilter: ['data-flow-state'] });
  new ResizeObserver(announce).observe(document.querySelector('.home-panel'));
  window.parent.postMessage({ type: 'artifacts:ready' }, origin);
  announce();
})();
