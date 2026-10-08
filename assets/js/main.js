/* ============================================================
   VAR — Portfolio interactions
   Vanilla JS · progressive enhancement · no dependencies
   ============================================================ */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ----------------------------------------------------------
     1. Theme toggle — system default ⇄ explicit override
     ---------------------------------------------------------- */
  const schemeMeta = doc.querySelector('meta[name="color-scheme"]');
  const themeToggle = doc.getElementById('theme-toggle');
  const STORAGE_KEY = 'color-scheme';

  const systemScheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const renderedScheme = () =>
    localStorage.getItem(STORAGE_KEY) || systemScheme();

  const syncToggleUI = () => {
    const target = renderedScheme() === 'dark' ? 'light' : 'dark';
    themeToggle.setAttribute(
      'aria-label',
      target === 'dark' ? 'Switch to dark theme' : 'Switch to light theme'
    );
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = renderedScheme();
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        if (next === systemScheme()) {
          localStorage.removeItem(STORAGE_KEY); // undo the override → follow system again
          schemeMeta.content = 'light dark';
        } else {
          localStorage.setItem(STORAGE_KEY, next);
          schemeMeta.content = next;
        }
      } catch (e) {
        // Storage blocked: still reflect the choice for this session.
        schemeMeta.content = next;
      }
      syncToggleUI();
    });

    // Keep tabs in sync when the override changes elsewhere.
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        schemeMeta.content = event.newValue || 'light dark';
        syncToggleUI();
      }
    });

    syncToggleUI();
  }

  /* ----------------------------------------------------------
     2. Mobile navigation
     ---------------------------------------------------------- */
  const navToggle = doc.getElementById('nav-toggle');
  const nav = doc.getElementById('primary-nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
      }
    });

    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ----------------------------------------------------------
     3. Header state + scroll progress
     ---------------------------------------------------------- */
  const header = doc.getElementById('site-header');
  const progress = doc.getElementById('scroll-progress');
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);

      const max = root.scrollHeight - window.innerHeight;
      progress.style.width = max > 0 ? `${(y / max) * 100}%` : '0%';

      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------
     4. Reveal on scroll
     ---------------------------------------------------------- */
  const revealEls = doc.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${(i % 4) * 70}ms`);
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ----------------------------------------------------------
     5. Active nav link via scroll spy
     ---------------------------------------------------------- */
  const navLinks = doc.querySelectorAll('.nav__link');
  const sections = ['skills', 'projects', 'about', 'contact']
    .map((id) => doc.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          navLinks.forEach((link) => {
            link.classList.toggle(
              'is-active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((section) => spy.observe(section));
  }

  /* ----------------------------------------------------------
     6. Copy email to clipboard
     ---------------------------------------------------------- */
  const copyBtn = doc.getElementById('copy-email');
  const copyLabel = doc.getElementById('copy-email-label');
  const copyStatus = doc.getElementById('copy-email-status');

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email;
      const iconCopy = copyBtn.querySelector('[data-icon-copy]');
      const iconDone = copyBtn.querySelector('[data-icon-done]');

      try {
        await navigator.clipboard.writeText(email);
      } catch (e) {
        // Fallback for non-secure contexts
        const ta = doc.createElement('textarea');
        ta.value = email;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        doc.execCommand('copy');
        ta.remove();
      }

      iconCopy.hidden = true;
      iconDone.hidden = false;
      copyLabel.textContent = 'Copied!';
      copyStatus.textContent = `Email address ${email} copied to clipboard.`;

      window.setTimeout(() => {
        iconCopy.hidden = false;
        iconDone.hidden = true;
        copyLabel.textContent = 'Copy email';
      }, 2000);
    });
  }

  /* ----------------------------------------------------------
     7. Footer year
     ---------------------------------------------------------- */
  const yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
