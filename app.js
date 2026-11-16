(() => {
  'use strict';

  const tooltip = document.getElementById('tooltip');
  let tooltipOwner = null;
  let tooltipTimer;
  const app = document.querySelector('.app');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const searchButton = document.querySelector('.search-button');
  const sidebarLists = document.querySelector('.sidebar-lists');
  const compactLists = document.querySelector('.compact-lists');
  const compactProjects = document.querySelector('.compact-projects');
  const brand = document.querySelector('.brand');
  const narrowScreen = window.matchMedia('(max-width: 800px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const projectsSection = document.querySelector('.projects');
  const projectsToggle = projectsSection.querySelector('.section-toggle');
  const emptyProjectRow = projectsSection.querySelector('[data-empty-project]');
  const headerProjectAdd = projectsSection.querySelector('[data-add-project="header"]');
  const metricsProject = document.getElementById('metrics-project');
  const metricsToggle = metricsProject.querySelector('[data-project-toggle]');
  const architectureProject = document.getElementById('architecture-project');
  let createdProjects = 0;
  const workspace = document.querySelector('.workspace');
  const artifactsPortal = document.querySelector('.artifacts-portal');
  const artifactsFrame = artifactsPortal.querySelector('iframe');
  const artifactsNavigation = document.querySelector('.navigation [data-open-artifacts]');
  const chatNavigation = document.querySelector('.navigation [data-open-ai]');
  let artifactsOpen = false;
  let sidebarBeforeArtifacts = narrowScreen.matches;

  function notifyArtifacts() {
    artifactsFrame.contentWindow?.postMessage({ type: 'artifacts:visibility', active: artifactsOpen }, window.location.origin);
  }

  function setArtifactsOpen(open) {
    if (artifactsOpen === open) return;
    hideTooltip();
    if (open) {
      sidebarBeforeArtifacts = app.classList.contains('is-sidebar-collapsed');
      setSidebarCollapsed(true);
      if (workspace.contains(document.activeElement)) artifactsNavigation.focus({ preventScroll: true });
    }
    artifactsOpen = open;
    app.classList.toggle('is-artifacts-open', open);
    workspace.inert = open;
    workspace.setAttribute('aria-hidden', String(open));
    artifactsPortal.inert = !open;
    artifactsPortal.setAttribute('aria-hidden', String(!open));
    artifactsFrame.tabIndex = open ? 0 : -1;
    sidebarToggle.inert = open;
    sidebarToggle.setAttribute('aria-hidden', String(open));
    document.querySelectorAll('.navigation .nav-item').forEach((item) => item.removeAttribute('aria-current'));
    (open ? artifactsNavigation : chatNavigation).closest('.nav-item').setAttribute('aria-current', 'page');
    if (!open) setSidebarCollapsed(narrowScreen.matches || sidebarBeforeArtifacts);
    hideTooltip();
    notifyArtifacts();
  }

  artifactsFrame.addEventListener('load', notifyArtifacts);
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== artifactsFrame.contentWindow) return;
    if (event.data?.type === 'artifacts:ready') notifyArtifacts();
    if (event.data?.type === 'artifacts:state' && typeof event.data.state === 'string') {
      app.dataset.artifactsState = event.data.state;
      if (/^\d+px$/.test(event.data.chatWidth || '')) app.style.setProperty('--artifact-chat-width', event.data.chatWidth);
    }
  });


  function setSidebarCollapsed(collapsed) {
    hideTooltip();
    // Preserve the separate project/chat disclosures while hiding their controls.
    const disappearingContent = collapsed ? sidebarLists : compactLists;
    if (disappearingContent.contains(document.activeElement) || (collapsed && brand.contains(document.activeElement))) {
      sidebarToggle.focus({ preventScroll: true });
      hideTooltip();
    }
    app.classList.toggle('is-sidebar-collapsed', collapsed);
    sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
    const label = collapsed ? 'Развернуть панель' : 'Свернуть панель';
    sidebarToggle.setAttribute('aria-label', label);
    sidebarToggle.dataset.tooltip = label;
    searchButton.dataset.tooltipPlacement = collapsed ? 'right' : 'bottom';
    sidebarLists.inert = collapsed;
    sidebarLists.setAttribute('aria-hidden', String(collapsed));
    brand.inert = collapsed;
    compactLists.inert = !collapsed;
    compactLists.setAttribute('aria-hidden', String(!collapsed));
  }

  function setExpanded(control, expanded) {
    const content = document.getElementById(control.getAttribute('aria-controls'));
    control.setAttribute('aria-expanded', String(expanded));

    if (control.matches('.section-toggle')) {
      if (!expanded && content.contains(document.activeElement)) control.focus({ preventScroll: true });
      content.inert = !expanded;
      content.setAttribute('aria-hidden', String(!expanded));
      control.closest('[data-collapsible]').classList.toggle('is-collapsed', !expanded);
    } else {
      content.hidden = !expanded;
    }
    if (control.matches('[data-project-toggle]')) {
      control.querySelector('[data-folder-open]').hidden = !expanded;
      control.querySelector('[data-folder-closed]').hidden = expanded;
    }
  }

  function addProject() {
    if (createdProjects >= 2) return;

    if (createdProjects === 0) {
      emptyProjectRow.hidden = true;
      metricsProject.hidden = false;
      setExpanded(metricsToggle, false);
      headerProjectAdd.hidden = false;
    } else {
      architectureProject.hidden = false;
    }

    createdProjects += 1;
    compactProjects.hidden = false;
    setExpanded(projectsToggle, true);
    if (createdProjects === 1) metricsToggle.focus({ preventScroll: true });
  }

  function hideTooltip() {
    clearTimeout(tooltipTimer);
    tooltip.hidden = true;
    tooltip.classList.remove('is-visible');
    tooltipOwner?.removeAttribute('aria-describedby');
    tooltipOwner = null;
  }

  function showTooltip(control) {
    hideTooltip();
    if (control.hasAttribute('data-tooltip-collapsed') && !app.classList.contains('is-sidebar-collapsed')) return;
    tooltipOwner = control;
    tooltip.textContent = control.dataset.tooltip;
    tooltip.hidden = false;
    control.setAttribute('aria-describedby', tooltip.id);

    const anchor = control.getBoundingClientRect();
    const tip = tooltip.getBoundingClientRect();
    const margin = 8;
    const gap = 6;
    let left = anchor.left + (anchor.width - tip.width) / 2;
    let top = anchor.bottom + gap;
    let placement = 'bottom';

    if (control.dataset.tooltipPlacement === 'right') {
      placement = 'right';
      left = anchor.right + 4;
      top = anchor.top + (anchor.height - tip.height) / 2;
      if (left + tip.width > window.innerWidth - margin) {
        left = anchor.left - tip.width - 4;
        placement = 'left';
      }
    } else if (top + tip.height > window.innerHeight - margin) {
      top = anchor.top - tip.height - gap;
      placement = 'top';
    }

    tooltip.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - tip.width - margin))}px`;
    tooltip.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - tip.height - margin))}px`;
    // The measurement above resets the previous animation before a new tooltip enters.
    tooltip.dataset.placement = placement;
    tooltip.classList.add('is-visible');
  }

  document.querySelectorAll('[data-tooltip]').forEach((control) => {
    control.addEventListener('pointerenter', () => {
      hideTooltip();
      tooltipTimer = setTimeout(() => showTooltip(control), 200);
    });
    control.addEventListener('pointerleave', () => {
      clearTimeout(tooltipTimer);
      if (document.activeElement !== control) hideTooltip();
    });
    control.addEventListener('focus', () => showTooltip(control));
    control.addEventListener('blur', hideTooltip);
  });

  document.querySelectorAll('[data-animated-icon]').forEach((control) => {
    const icon = control.querySelector('.nav-icon');
    const playIcon = () => {
      if (!reducedMotion.matches) control.classList.add('is-icon-animating');
    };
    control.addEventListener('pointerenter', playIcon);
    control.addEventListener('focus', () => {
      if (control.matches(':focus-visible')) playIcon();
    });
    // Let the short gesture finish after pointerleave; returning mid-gesture won't restart it.
    control.addEventListener('animationend', (event) => {
      if (event.target === icon) control.classList.remove('is-icon-animating');
    });
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      document.querySelectorAll('.is-icon-animating').forEach((control) => control.classList.remove('is-icon-animating'));
    }
  });

  sidebarToggle.addEventListener('click', () => {
    setSidebarCollapsed(!app.classList.contains('is-sidebar-collapsed'));
  });
  narrowScreen.addEventListener('change', (event) => {
    if (!artifactsOpen) setSidebarCollapsed(event.matches);
  });
  setSidebarCollapsed(narrowScreen.matches);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href="#"]');
    if (!link) return;
    event.preventDefault();
    hideTooltip();
    if (event.detail > 0 && link.matches('.section-head .row-action')) link.blur();

    if (link.matches('[data-open-artifacts]')) {
      setArtifactsOpen(true);
      return;
    }
    if (link.matches('[data-open-ai]')) {
      setArtifactsOpen(false);
      return;
    }


    if (link.matches('[data-add-project]')) {
      addProject();
      return;
    }
    if (link.matches('.section-toggle, [data-project-toggle]')) {
      setExpanded(link, link.getAttribute('aria-expanded') !== 'true');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideTooltip();
    if (event.key === ' ' && event.target.matches('.section-toggle, [data-project-toggle], [data-add-project]')) {
      event.preventDefault();
      event.target.click();
    }
  });

  window.addEventListener('resize', hideTooltip);
  document.addEventListener('scroll', hideTooltip, true);
})();
