(() => {
  'use strict';

  const tooltip = document.getElementById('tooltip');
  let tooltipOwner = null;
  let tooltipTimer;
  const projectsSection = document.querySelector('.projects');
  const projectsToggle = projectsSection.querySelector('.section-toggle');
  const emptyProjectRow = projectsSection.querySelector('[data-empty-project]');
  const headerProjectAdd = projectsSection.querySelector('[data-add-project="header"]');
  const metricsProject = document.getElementById('metrics-project');
  const metricsToggle = metricsProject.querySelector('[data-project-toggle]');
  const architectureProject = document.getElementById('architecture-project');
  let createdProjects = 0;

  function setExpanded(control, expanded) {
    const content = document.getElementById(control.getAttribute('aria-controls'));
    control.setAttribute('aria-expanded', String(expanded));
    content.hidden = !expanded;

    if (control.matches('.section-toggle')) {
      control.closest('[data-collapsible]').classList.toggle('is-collapsed', !expanded);
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
      setExpanded(metricsToggle, true);
      headerProjectAdd.hidden = false;
    } else {
      architectureProject.hidden = false;
    }

    createdProjects += 1;
    setExpanded(projectsToggle, true);
    if (createdProjects === 1) metricsToggle.focus({ preventScroll: true });
  }

  function hideTooltip() {
    clearTimeout(tooltipTimer);
    tooltip.hidden = true;
    tooltipOwner?.removeAttribute('aria-describedby');
    tooltipOwner = null;
  }

  function showTooltip(control) {
    hideTooltip();
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

    if (control.dataset.tooltipPlacement === 'right') {
      left = anchor.right + 4;
      top = anchor.top + (anchor.height - tip.height) / 2;
      if (left + tip.width > window.innerWidth - margin) {
        left = anchor.left - tip.width - 4;
      }
    } else if (top + tip.height > window.innerHeight - margin) {
      top = anchor.top - tip.height - gap;
    }

    tooltip.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - tip.width - margin))}px`;
    tooltip.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - tip.height - margin))}px`;
  }

  document.querySelectorAll('[data-tooltip]').forEach((control) => {
    control.addEventListener('pointerenter', () => {
      hideTooltip();
      tooltipTimer = setTimeout(() => showTooltip(control), 300);
    });
    control.addEventListener('pointerleave', () => {
      clearTimeout(tooltipTimer);
      if (document.activeElement !== control) hideTooltip();
    });
    control.addEventListener('focus', () => showTooltip(control));
    control.addEventListener('blur', hideTooltip);
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href="#"]');
    if (!link) return;
    event.preventDefault();
    hideTooltip();

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
