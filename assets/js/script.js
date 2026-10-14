(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  var img = document.getElementById('portraitImg');
  var fallback = 'assets/images/profile-placeholder.svg';

  if (img) {
    img.addEventListener('error', function () {
      if (img.dataset.fb) return;
      img.dataset.fb = '1';
      img.src = fallback;
    });
  }

  var wrap = document.getElementById('portrait');
  var fine = window.matchMedia('(pointer: fine)').matches;

  if (!reduce && fine && wrap) {
    var tx = 0;
    var ty = 0;
    var cx = 0;
    var cy = 0;
    var raf = null;

    function tick() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      wrap.style.setProperty('--portrait-offset-x', cx.toFixed(2) + 'px');
      wrap.style.setProperty('--portrait-offset-y', cy.toFixed(2) + 'px');
      raf = (Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02) ? requestAnimationFrame(tick) : null;
    }

    function go() {
      if (raf === null) raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 14;
      ty = (e.clientY / window.innerHeight - 0.5) * 10;
      go();
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      tx = 0;
      ty = 0;
      go();
    });
  }

  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    function applyTheme(dark) {
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
      themeBtn.textContent = dark ? '☀' : '☾';
      themeBtn.setAttribute('aria-pressed', String(dark));
      themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    themeBtn.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') !== 'dark';
      if (reduce || !document.startViewTransition) {
        applyTheme(dark);
        return;
      }

      var buttonRect = themeBtn.getBoundingClientRect();
      root.style.setProperty('--theme-origin-x', buttonRect.left + buttonRect.width / 2 + 'px');
      root.style.setProperty('--theme-origin-y', buttonRect.top + buttonRect.height / 2 + 'px');
      document.startViewTransition(function () {
        applyTheme(dark);
      });
    });
  }

  var menuBtn = document.getElementById('menuBtn');
  var menu = document.getElementById('mobileMenu');

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '✕' : '≡';
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) setMenu(false);
  });

  var pageSections = Array.from(document.querySelectorAll('main > section'));

  function scrollToPageSection(target, behavior) {
    if (!target) return;
    target.scrollIntoView({
      behavior: behavior,
      block: 'start',
      inline: 'nearest'
    });
  }

  function getCurrentPageIndex() {
    if (pageSections.length === 0) return 0;
    var viewportCenter = window.innerHeight * 0.5;
    return pageSections.reduce(function (closest, section, index) {
      var sectionCenter = section.getBoundingClientRect().top + section.getBoundingClientRect().height * 0.5;
      var distance = Math.abs(sectionCenter - viewportCenter);
      return distance < closest.distance ? { index: index, distance: distance } : closest;
    }, { index: 0, distance: Infinity }).index;
  }

  function movePage(direction) {
    if (!pageSections.length) return;
    var nextIndex = Math.max(0, Math.min(pageSections.length - 1, getCurrentPageIndex() + direction));
    scrollToPageSection(pageSections[nextIndex], reduce ? 'auto' : 'smooth');
  }

  document.querySelectorAll('[data-target]').forEach(function (button) {
    button.addEventListener('click', function () {
      var target = document.querySelector(button.getAttribute('data-target'));
      scrollToPageSection(target, reduce ? 'auto' : 'smooth');
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      scrollToPageSection(target, reduce ? 'auto' : 'smooth');
    });
  });

  var wheelLock = false;

  document.addEventListener('keydown', function (event) {
    var target = event.target;
    var isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    var inProjectGrid = target && target.closest && target.closest('.project-grid');
    var inProjectDialog = projectDialog && projectDialog.open && projectDialog.contains(target);
    var key = event.key;
    if (isTyping || inProjectGrid || inProjectDialog || ['Escape', 'Tab'].indexOf(key) !== -1) return;
    if ((key === 'PageDown' || key === 'ArrowDown') && !event.altKey && !event.ctrlKey && !event.metaKey) {
      return;
    }
    if ((key === 'PageUp' || key === 'ArrowUp') && !event.altKey && !event.ctrlKey && !event.metaKey) {
      return;
    }
  });

  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      var formData = new FormData(contactForm);
      var status = contactForm.querySelector('.form-status');
      var submitButton = contactForm.querySelector('[type="submit"]');
      var requiredFields = ['name', 'email', 'subject', 'message'];
      var valid = true;

      requiredFields.forEach(function (key) {
        var field = contactForm.querySelector('[name="' + key + '"]');
        if (!field || !field.value.trim()) {
          valid = false;
        }
      });

      var emailField = contactForm.querySelector('[name="email"]');
      if (emailField && !emailField.checkValidity()) {
        valid = false;
      }

      if (!valid) {
        if (status) status.textContent = 'Please complete all fields before sending.';
        return;
      }

      if (submitButton) submitButton.disabled = true;
      if (status) status.textContent = 'Sending your inquiry...';

      var isLocalFile = window.location.protocol === 'file:';
      if (isLocalFile) {
        var name = formData.get('name').trim();
        var email = formData.get('email').trim();
        var subject = formData.get('subject').trim();
        var message = formData.get('message').trim();
        var mailtoSubject = encodeURIComponent('Portfolio inquiry: ' + subject);
        var mailtoBody = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\n' + message);
        if (status) status.textContent = 'Your email application is opening with the inquiry.';
        window.location.href = 'mailto:rahmatsuryaputradilaga20@gmail.com?subject=' + mailtoSubject + '&body=' + mailtoBody;
        if (submitButton) submitButton.disabled = false;
        return;
      }

      try {
        var response = await fetch('https://formsubmit.co/ajax/rahmatsuryaputradilaga20@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(Object.fromEntries(formData.entries()))
        });
        var result = await response.json();

        if (!response.ok || result.success === false || result.success === 'false') {
          throw new Error('FormSubmit did not accept the inquiry.');
        }

        if (status) status.textContent = 'Your inquiry has been sent. Thank you for reaching out.';
        contactForm.reset();
      } catch (error) {
        if (status) status.textContent = 'We could not send your inquiry. Please try again or email rahmatsuryaputradilaga20@gmail.com.';
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  var sectionTitles = document.querySelectorAll('main > section h2:not(.sr-only)');

  if (reduce || !('IntersectionObserver' in window)) {
    pageSections.forEach(function (section) {
      section.classList.add('is-current');
    });
    sectionTitles.forEach(function (title) {
      title.classList.add('is-typed');
    });
  } else {
    sectionTitles.forEach(function (title) {
      var text = title.textContent.trim();
      title.setAttribute('aria-label', text);
      title.replaceChildren();

      Array.from(text).forEach(function (character, index) {
        var letter = document.createElement('span');
        letter.className = character === ' ' ? 'typing-space' : 'typing-character';
        letter.setAttribute('aria-hidden', 'true');
        if (character !== ' ') letter.style.setProperty('--character-index', index);
        letter.textContent = character;
        title.appendChild(letter);
      });
    });

    function updateSectionState() {
      var viewportHeight = window.innerHeight;

      pageSections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var active = rect.top < viewportHeight * 0.78 && rect.bottom > viewportHeight * 0.22;
        section.classList.toggle('is-current', active);
      });

      sectionTitles.forEach(function (title) {
        var rect = title.getBoundingClientRect();
        var active = rect.top < viewportHeight * 0.84 && rect.bottom > viewportHeight * 0.16;
        title.classList.toggle('is-typed', active);
      });
    }

    window.addEventListener('scroll', updateSectionState, { passive: true });
    window.addEventListener('resize', updateSectionState);
    updateSectionState();
  }

  var items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) {
      el.classList.add('in');
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 60 + 'ms';
      io.observe(el);
    });
  }

  var projectGrid = document.querySelector('.project-grid');
  var projectCards = projectGrid ? Array.from(projectGrid.querySelectorAll('.project-card')) : [];
  var projectDots = Array.from(document.querySelectorAll('.project-dot'));
  var projectCurrent = document.querySelector('.project-current');
  var projectTotal = document.querySelector('.project-total');
  var projectButtons = document.querySelectorAll('[data-project-direction]');
  var projectIndex = 0;
  var projectScrollTimer = null;

  function updateProjectSlide(index) {
    if (!projectGrid || projectCards.length === 0) return;

    projectIndex = (index + projectCards.length) % projectCards.length;
    projectCards[projectIndex].scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'start'
    });

    if (projectCurrent) projectCurrent.textContent = String(projectIndex + 1).padStart(2, '0');
    projectDots.forEach(function (dot, dotIndex) {
      var active = dotIndex === projectIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function getProjectIndexFromScroll() {
    if (!projectGrid || projectCards.length === 0) return 0;
    var left = projectGrid.scrollLeft;
    var closest = projectCards.reduce(function (best, card, index) {
      var distance = Math.abs(card.offsetLeft - left);
      return distance < best.distance ? { index: index, distance: distance } : best;
    }, { index: 0, distance: Infinity });
    return closest.index;
  }

  projectButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var direction = button.getAttribute('data-project-direction') === 'next' ? 1 : -1;
      updateProjectSlide(projectIndex + direction);
    });
  });

  projectDots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      updateProjectSlide(Number(dot.getAttribute('data-project-index')));
    });
  });

  var projectDialog = document.getElementById('projectDialog');
  var projectDialogImage = document.getElementById('projectDialogImage');
  var projectDialogTitle = document.getElementById('projectDialogTitle');
  var projectDialogDescription = document.getElementById('projectDialogDescription');
  var projectDialogEyebrow = document.getElementById('projectDialogEyebrow');
  var projectDialogMeta = document.getElementById('projectDialogMeta');
  var projectDialogLink = document.getElementById('projectDialogLink');
  var projectDialogClose = projectDialog && projectDialog.querySelector('.project-dialog-close');
  var lastProjectCard = null;

  function openProjectDialog(card) {
    if (!projectDialog || !projectDialogImage || !projectDialogTitle || !projectDialogDescription || !projectDialogEyebrow || !projectDialogMeta || !projectDialogLink) return;

    var visual = card.querySelector('.project-visual');
    var image = visual ? visual.querySelector('img') : null;
    var title = card.querySelector('h3');
    var description = card.querySelector('.project-content > p');
    var meta = card.querySelector('.project-meta');
    var link = card.querySelector('.project-link');

    if (!image || !title || !description || !meta || !link) return;

    projectDialogImage.src = image.src;
    projectDialogImage.alt = image.alt;
    projectDialogTitle.textContent = title.textContent;
    projectDialogDescription.textContent = description.textContent;
    projectDialogEyebrow.textContent = 'SELECTED PROJECT · ' + card.querySelector('.project-topline span:first-child').textContent;
    projectDialogMeta.replaceChildren();

    Array.from(meta.children).forEach(function (tag) {
      var span = document.createElement('span');
      span.textContent = tag.textContent;
      projectDialogMeta.appendChild(span);
    });

    projectDialogLink.href = link.href;
    lastProjectCard = card;
    projectDialog.showModal();
    document.body.style.overflow = 'hidden';
    projectDialogClose && projectDialogClose.focus();
  }

  function closeProjectDialog() {
    if (!projectDialog) return;
    projectDialog.close();
    document.body.style.overflow = '';
    if (lastProjectCard) lastProjectCard.querySelector('.project-visual')?.focus({ preventScroll: true });
  }

  document.querySelectorAll('.project-visual').forEach(function (visual) {
    visual.setAttribute('tabindex', '0');
    visual.setAttribute('role', 'button');
    visual.setAttribute('aria-label', 'Buka detail proyek');
    visual.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      openProjectDialog(visual.closest('.project-card'));
    });
    visual.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProjectDialog(visual.closest('.project-card'));
      }
    });
  });

  projectDialogClose && projectDialogClose.addEventListener('click', closeProjectDialog);
  projectDialog && projectDialog.addEventListener('click', function (event) {
    if (event.target === projectDialog) closeProjectDialog();
  });
  projectDialog && projectDialog.addEventListener('close', function () {
    document.body.style.overflow = '';
  });

  if (projectGrid) {
    projectGrid.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        updateProjectSlide(projectIndex + 1);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        updateProjectSlide(projectIndex - 1);
      }
    });

    projectGrid.addEventListener('scroll', function () {
      if (projectScrollTimer) window.clearTimeout(projectScrollTimer);
      projectScrollTimer = window.setTimeout(function () {
        projectIndex = getProjectIndexFromScroll();
        if (projectCurrent) projectCurrent.textContent = String(projectIndex + 1).padStart(2, '0');
        projectDots.forEach(function (dot, dotIndex) {
          var active = dotIndex === projectIndex;
          dot.classList.toggle('is-active', active);
          dot.setAttribute('aria-current', active ? 'true' : 'false');
        });
      }, 80);
    }, { passive: true });
  }

  if (projectTotal) projectTotal.textContent = String(projectCards.length).padStart(2, '0');
})();
