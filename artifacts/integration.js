(() => {
  'use strict';
  if (window.parent === window) {
    document.body.classList.remove('ai-entrance-pending');
    return;
  }
  const origin = window.location.origin;
  const body = document.body;
  const panel = document.querySelector('.home-panel');
  const prompt = document.getElementById('prompt');
  const composer = document.getElementById('composer');
  let visible = false;
  let externalInput = false;
  body.classList.add('ai-shared-composer');
  composer.inert = true;
  // Archived layouts run independently of the shared composer in the AI shell.
  const legacyChoice = document.querySelector('.version-choice input[value="v1"]')?.closest('label');
  const legacyLink = document.createElement('a');
  legacyLink.className = 'version-choice';
  legacyLink.target = '_blank';
  legacyLink.rel = 'noopener';
  legacyLink.innerHTML = '<span>Версия 1<small>Открыть сохранённую версию в новой вкладке</small></span>';
  legacyChoice?.replaceWith(legacyLink);
  const post = (data) => window.parent.postMessage(data, origin);
  const syncShellWidth = () => body.style.setProperty('--integrated-shell-width', `${Math.max(0, window.parent.innerWidth - 60)}px`);
  syncShellWidth();
  window.addEventListener('resize', syncShellWidth);
  window.addEventListener('scroll', () => { if (window.innerWidth <= 800) post({ type: 'artifacts:scroll', y: window.scrollY }); }, { passive: true });
  function announce() {
    const workspaceOpen = ['revealing', 'workspace'].includes(body.dataset.flowState);
    legacyLink.href = new URL(`v1/${workspaceOpen ? 'workspace.html' : 'index.html'}`, window.location.href).href;
    post({ type: 'artifacts:state', state: body.dataset.flowState, chatWidth: document.querySelector('.app').style.getPropertyValue('--chat-width') });
    post({
      type: 'artifacts:composer-state',
      readOnly: prompt.readOnly || composer.querySelector('.send').disabled,
      model: document.getElementById('model-name').textContent,
      provider: document.querySelector('[data-provider][aria-pressed="true"]')?.dataset.provider,
      activeChatHeight: getComputedStyle(panel).getPropertyValue('--active-chats-height').trim(),
      dialogOpen: Boolean(document.querySelector('dialog[open]'))
    });
  }
  const publishDraft = (focus = false, reset = false) => queueMicrotask(() => {
    post({ type: 'artifacts:draft', value: prompt.value, focus, reset });
    announce();
  });
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== origin) return;
    const data = event.data;
    if (data?.type === 'artifacts:visibility') {
      const active = Boolean(data.active);
      if (active === visible) return;
      visible = active;
      body.classList.toggle('ai-entrance-pending', !active);
      if (!active) {
        if (window.innerWidth <= 800) window.scrollTo({ top: 0, behavior: 'instant' });
        window.ArtifactsPrecise?.setEnabled(false);
        document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
      }
      announce();
    }
    if (data?.type !== 'artifacts:composer') return;
    if (data.action === 'input' && typeof data.value === 'string') {
      externalInput = true;
      prompt.value = data.value.slice(0, 4000);
      prompt.dispatchEvent(new Event('input', { bubbles: true }));
      externalInput = false;
    }
    if (data.action === 'submit' && !prompt.readOnly && typeof data.value === 'string') {
      prompt.value = data.value.slice(0, 4000);
      composer.requestSubmit();
      publishDraft(false, true);
    }
    if (data.action === 'model') [...document.querySelectorAll('[data-model]')].find((button) => button.dataset.model === data.value)?.click();
    if (data.action === 'provider') [...document.querySelectorAll('[data-provider]')].find((button) => button.dataset.provider === data.value)?.click();
    if (data.action === 'home') document.querySelector(body.dataset.flowState === 'idle' ? '#home' : '.flow-project').click();
    if (data.action === 'settings') document.getElementById('settings').click();
    if (data.action !== 'input') announce();
  });
  prompt.addEventListener('input', () => { if (!externalInput) publishDraft(); });
  document.getElementById('preview-action').addEventListener('click', () => {
    if (window.innerWidth <= 800) window.scrollTo({ top: 0, behavior: 'instant' });
    publishDraft(true);
  });
  document.getElementById('home').addEventListener('click', () => publishDraft(false, true));
  document.addEventListener('artifacts:reset-composer', () => publishDraft(false, true));
  new MutationObserver(announce).observe(body, {
    attributes: true, subtree: true,
    attributeFilter: ['data-flow-state', 'data-active-chats-state', 'readonly', 'disabled', 'aria-pressed', 'open']
  });
  new ResizeObserver(announce).observe(panel);
  post({ type: 'artifacts:ready' });
  announce();
})();
