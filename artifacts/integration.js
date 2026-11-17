(() => {
  'use strict';
  if (window.parent === window) {
    document.body.classList.remove('ai-entrance-pending');
    return;
  }
  const origin = window.location.origin;
  const body = document.body;
  let visible = false;
  // The menu changes the iframe width; keep the white panel's target width fixed.
  const syncShellWidth = () => body.style.setProperty('--integrated-shell-width', `${Math.max(0, window.parent.innerWidth - 60)}px`);
  syncShellWidth();
  window.addEventListener('resize', syncShellWidth);
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
    // CSS transitions can reverse from their current position on a quick switch.
    body.classList.toggle('ai-entrance-pending', !active);
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
