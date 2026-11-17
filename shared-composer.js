(() => {
  'use strict';
  const app = document.querySelector('.app');
  const workspace = document.querySelector('.workspace');
  const intro = document.querySelector('.chat-intro');
  const destinations = document.querySelector('.destinations');
  const heading = document.querySelector('.artifact-heading');
  const topbar = document.querySelector('.artifact-topbar');
  const providers = document.querySelector('.artifact-providers');
  const form = document.getElementById('shared-composer-form');
  const prompt = document.getElementById('shared-prompt');
  const send = document.getElementById('shared-send');
  const picker = document.getElementById('shared-model-picker');
  const modelToggle = document.getElementById('shared-model-toggle');
  const modelMenu = document.getElementById('shared-model-menu');
  const frame = document.querySelector('.artifacts-portal iframe');
  const fileInput = document.getElementById('shared-file-input');
  const attachments = document.getElementById('shared-attachments');
  let mode = false;
  let previousSidebarCollapsed = false;
  let sourceReadOnly = false;
  let files = [];
  let voice;
  app.dataset.artifactsState ||= 'idle';
  const post = (action, extra = {}) => frame.contentWindow?.postMessage({ type: 'artifacts:composer', action, ...extra }, window.location.origin);
  const closeModels = () => {
    modelMenu.hidden = true;
    modelToggle.setAttribute('aria-expanded', 'false');
  };
  function layout() {
    const collapsed = mode ? previousSidebarCollapsed : app.classList.contains('is-sidebar-collapsed');
    const side = collapsed ? 60 : 260;
    const style = getComputedStyle(workspace);
    const width = Math.max(0, Math.min(680, window.innerWidth - side - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)));
    intro.style.width = `${width}px`;
    const gap = window.matchMedia('(max-width: 550px)').matches ? 32 : 58;
    workspace.style.setProperty('--composer-top', `${parseFloat(style.paddingTop) + intro.getBoundingClientRect().height + gap}px`);
  }
  function updateMode() {
    const idle = app.dataset.artifactsState === 'idle';
    document.querySelector('.chat-model-label').setAttribute('aria-hidden', String(mode));
    document.querySelector('.artifact-model-label').setAttribute('aria-hidden', String(!mode));
    intro.inert = mode;
    intro.setAttribute('aria-hidden', String(mode));
    destinations.inert = mode;
    destinations.setAttribute('aria-hidden', String(mode));
    heading.inert = !mode || !idle;
    heading.setAttribute('aria-hidden', String(!mode || !idle));
    providers.inert = !mode || !idle;
    providers.setAttribute('aria-hidden', String(!mode || !idle));
    topbar.inert = !mode;
    topbar.setAttribute('aria-hidden', String(!mode));
    prompt.readOnly = mode && sourceReadOnly;
    document.getElementById('shared-inline-settings').inert = mode;
    send.disabled = mode && sourceReadOnly;
    prompt.setAttribute('aria-label', mode ? 'Опишите идею приложения' : 'Сообщение');
    for (const option of modelMenu.querySelectorAll('[data-shared-model]')) {
      option.hidden = mode === (option.dataset.sharedModel === 'Alice AI LLM');
    }
  }
  function renderAttachments() {
    attachments.hidden = !files.length;
    attachments.replaceChildren(...files.map((file, index) => {
      const chip = document.createElement('span');
      chip.className = 'shared-attachment';
      const label = document.createElement('span');
      label.textContent = file.name;
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = '×';
      remove.setAttribute('aria-label', `Убрать файл ${file.name}`);
      remove.addEventListener('click', () => { files.splice(index, 1); renderAttachments(); });
      chip.append(label, remove); return chip;
    }));
  }
  prompt.addEventListener('input', () => post('input', { value: prompt.value }));
  prompt.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault(); form.requestSubmit();
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (mode && !sourceReadOnly && prompt.value.trim()) post('submit', { value: prompt.value });
  });
  modelToggle.addEventListener('click', () => {
    modelMenu.hidden = !modelMenu.hidden;
    modelToggle.setAttribute('aria-expanded', String(!modelMenu.hidden));
    if (!modelMenu.hidden) modelMenu.querySelector('button:not([hidden])')?.focus();
  });
  modelMenu.addEventListener('click', (event) => {
    const option = event.target.closest('[data-shared-model]');
    if (!option) return;
    if (mode) post('model', { value: option.dataset.sharedModel });
    closeModels(); modelToggle.focus();
  });
  providers.addEventListener('click', (event) => {
    const button = event.target.closest('[data-shared-provider]');
    if (button) post('provider', { value: button.dataset.sharedProvider });
  });
  document.addEventListener('click', (event) => { if (!picker.contains(event.target)) closeModels(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModels();
    if (event.key === 'ArrowDown' && !modelMenu.hidden && picker.contains(event.target)) {
      event.preventDefault();
      const options = [...modelMenu.querySelectorAll('button:not([hidden])')];
      options[(options.indexOf(document.activeElement) + 1) % options.length]?.focus();
    }
  });
  document.querySelector('.artifact-back').addEventListener('click', () => post('home'));
  document.querySelector('.artifact-brand').addEventListener('click', () => post('home'));
  document.querySelector('.artifact-settings').addEventListener('click', () => post('settings'));
  document.getElementById('shared-attach').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { files.push(...fileInput.files); fileInput.value = ''; renderAttachments(); });
  document.getElementById('shared-microphone').addEventListener('click', () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    if (voice) { voice.stop(); return; }
    voice = new Recognition(); voice.lang = 'ru-RU'; voice.interimResults = false;
    const button = document.getElementById('shared-microphone');
    voice.onresult = (event) => { prompt.value = [prompt.value, event.results[0][0].transcript].filter(Boolean).join(' '); post('input', { value: prompt.value }); };
    voice.onend = () => { voice = null; button.removeAttribute('aria-pressed'); };
    voice.onerror = () => { voice = null; button.removeAttribute('aria-pressed'); };
    try { voice.start(); button.setAttribute('aria-pressed', 'true'); } catch { voice = null; }
  });
  window.SharedComposer = {
    layout,
    setMode(active, sidebarCollapsed) {
      mode = active;
      previousSidebarCollapsed = sidebarCollapsed;
      app.style.setProperty('--artifact-scroll-y', '0px');
      closeModels(); updateMode(); layout();
    },
    sync() { post('input', { value: prompt.value }); post('sync'); },
    receive(data) {
      if (data.type === 'artifacts:composer-state') {
        sourceReadOnly = Boolean(data.readOnly);
        if (typeof data.model === 'string') document.getElementById('shared-model-name').textContent = data.model;
        for (const button of providers.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.sharedProvider === data.provider));
        if (/^\d+(\.\d+)?px$/.test(data.activeChatHeight || '')) app.style.setProperty('--active-chat-height', data.activeChatHeight);
        app.classList.toggle('is-artifacts-dialog-open', mode && Boolean(data.dialogOpen));
        updateMode();
      }
      if (data.type === 'artifacts:draft' && mode && typeof data.value === 'string') {
        prompt.value = data.value;
        if (data.reset) { files = []; renderAttachments(); }
        if (data.focus) prompt.focus({ preventScroll: true });
      }
      if (data.type === 'artifacts:scroll' && Number.isFinite(data.y)) app.style.setProperty('--artifact-scroll-y', `${Math.max(0, data.y)}px`);
      if (data.type === 'artifacts:state') updateMode();
    }
  };
  window.addEventListener('resize', layout);
  new ResizeObserver(layout).observe(intro);
  document.fonts.ready.then(layout);
  layout(); updateMode();
  requestAnimationFrame(() => requestAnimationFrame(() => app.classList.add('is-composer-ready')));
})();
