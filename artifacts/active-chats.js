'use strict';
(() => {
  const panel = document.querySelector('.home-panel');
  const dock = panel?.querySelector('.flow-composer-dock');
  if (!dock) return;

  // Deliberately fixed demo data: these statuses do not follow the real flow.
  const examples = [
    { title: 'Создать прототип переводчика', status: 'active' },
    { title: 'Дашборд метрики', status: 'generating' },
    { title: 'Прототип переводчика', status: 'ready' }
  ];
  const chats = Array.from({ length: 12 }, (_, index) => ({
    ...examples[index % examples.length], id: `demo-chat-${index + 1}`
  }));
  const statusLabels = { active: 'активный чат', generating: 'идёт генерация', ready: 'генерация завершена' };
  const root = document.createElement('section');
  root.className = 'active-chats';
  root.dataset.state = 'preview';
  root.setAttribute('aria-label', 'Активные чаты');
  root.hidden = true;
  root.innerHTML = `
    <div class="active-chats-list-region">
      <nav class="active-chats-list" id="active-chats-list" aria-label="12 активных чатов"></nav>
    </div>
    <div class="active-chats-fade active-chats-fade-top" aria-hidden="true"></div>
    <div class="active-chats-fade active-chats-fade-bottom" aria-hidden="true"></div>
    <button class="active-chats-collapse" type="button" aria-label="Свернуть активные чаты" aria-expanded="true" aria-controls="active-chats-list" title="Свернуть">
      <img src="assets/chat-chevron.svg" alt="">
    </button>
    <button class="active-chats-open" type="button" aria-expanded="false" aria-controls="active-chats-list">
      <span>Активные чаты</span><img src="assets/chat-chevron.svg" alt="">
    </button>`;
  dock.append(root);
  const region = root.querySelector('.active-chats-list-region');
  const list = root.querySelector('.active-chats-list');
  const collapse = root.querySelector('.active-chats-collapse');
  const open = root.querySelector('.active-chats-open');
  const announcement = document.querySelector('#flow-announcement');

  for (const chat of chats) {
    const link = document.createElement('a');
    link.className = 'active-chat-link';
    link.href = `#${chat.id}`;
    link.dataset.chatId = chat.id;
    link.setAttribute('aria-label', `${chat.title} — ${statusLabels[chat.status]}`);
    link.title = `${chat.title} — ${statusLabels[chat.status]}`;
    const text = document.createElement('span');
    text.className = 'active-chat-title';
    text.textContent = chat.title;
    link.append(text);
    if (chat.status !== 'active') {
      const marker = document.createElement('img');
      marker.className = `active-chat-status is-${chat.status}`;
      marker.src = `assets/chat-${chat.status}.svg`;
      marker.alt = '';
      link.append(marker);
    }
    // Keep navigation demonstrative without changing the prototype's generation.
    link.addEventListener('click', event => {
      event.preventDefault();
      list.querySelector('[aria-current]')?.removeAttribute('aria-current');
      link.setAttribute('aria-current', 'page');
      if (announcement) announcement.textContent = `Выбран чат «${chat.title}». ${statusLabels[chat.status]}.`;
      document.dispatchEvent(new CustomEvent('artifacts:chat-select', { detail: { ...chat } }));
    });
    list.append(link);
  }

  function updateFades() {
    const expanded = root.dataset.state === 'expanded';
    const collapsed = root.dataset.state === 'collapsed';
    const top = expanded ? Math.max(0, list.scrollTop) : 0;
    const remaining = Math.max(0, list.scrollHeight - list.clientHeight - top);
    // Fade in over the first 24 px, and fade out as the opposite edge arrives.
    const opacity = distance => distance <= 1 ? 0 : Math.min(distance / 24, 1);
    root.style.setProperty('--chat-fade-top', String(expanded ? opacity(top) : 0));
    root.style.setProperty('--chat-fade-bottom', String(collapsed ? 0 : opacity(remaining)));
  }

  list.addEventListener('scroll', updateFades, { passive: true });
  new ResizeObserver(updateFades).observe(list);

  function setState(state) {
    root.dataset.state = state;
    panel.dataset.activeChatsState = state;
    const collapsed = state === 'collapsed';
    region.inert = collapsed;
    collapse.hidden = collapsed;
    open.hidden = !collapsed;
    for (const [index, link] of [...list.children].entries()) {
      link.tabIndex = collapsed || (state === 'preview' && index > 2) ? -1 : 0;
    }
    if (state === 'preview') list.scrollTop = 0;
    updateFades();
  }

  // Only the list starts hover expansion. The entire right rail is a button.
  region.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch' && root.dataset.state !== 'collapsed') setState('expanded');
  });
  root.addEventListener('pointerleave', () => {
    if (root.dataset.state !== 'collapsed') setState('preview');
  });
  list.addEventListener('focusin', () => setState('expanded'));
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget) && !root.matches(':hover') && root.dataset.state !== 'collapsed') setState('preview');
  });
  collapse.addEventListener('click', () => {
    setState('collapsed');
    open.focus({ preventScroll: true });
  });
  open.addEventListener('click', () => {
    setState('expanded');
    collapse.focus({ preventScroll: true });
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && root.dataset.state !== 'collapsed') {
      event.preventDefault();
      setState('collapsed');
      open.focus({ preventScroll: true });
    }
  });
  // A tap on the list opens it on touch screens before choosing a chat.
  region.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && root.dataset.state === 'preview') {
      event.preventDefault();
      setState('expanded');
    }
  });

  function syncFlow() {
    const visible = ['conversation', 'revealing', 'workspace'].includes(document.body.dataset.flowState);
    root.hidden = !visible;
    if (!visible) setState('preview');
  }
  new MutationObserver(syncFlow).observe(document.body, { attributes: true, attributeFilter: ['data-flow-state'] });
  setState('preview');
  syncFlow();
})();
