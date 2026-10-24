const categoryLinks = [...document.querySelectorAll('.category-nav a')];
const sections = [...document.querySelectorAll('.menu-category')];
const photoLinks = document.querySelectorAll('.menu-photo-trigger');

if (photoLinks.length && typeof HTMLDialogElement !== 'undefined') {
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-dialog';
  dialog.setAttribute('aria-labelledby', 'photo-title');
  dialog.innerHTML = '<button class="photo-close" type="button" aria-label="Zavřít fotografii" autofocus><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button><img class="photo-full" alt=""><div class="photo-caption"><div class="photo-caption-line"><h2 id="photo-title"></h2><span class="photo-price"></span></div><p class="photo-notice"></p></div>';
  document.body.append(dialog);
  let opener;

  photoLinks.forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      const item = link.closest('.menu-item');
      const image = dialog.querySelector('.photo-full');
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      dialog.querySelector('#photo-title').textContent = item.querySelector('.menu-item-name').textContent;
      dialog.querySelector('.photo-price').textContent = item.querySelector('.menu-item-price')?.textContent || '';
      dialog.querySelector('.photo-notice').textContent = item.querySelector('.menu-image-label')?.textContent || '';
      dialog.showModal();
      document.documentElement.classList.add('photo-open');
    });
  });
  dialog.querySelector('.photo-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      dialog.querySelector('.photo-close').focus();
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('photo-open');
    opener?.focus({ preventScroll: true });
  });
}
let requestedId = '';
let activeId = '';

function activateCategory(id) {
  activeId = id;
  categoryLinks.forEach((link) => {
    if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function requestCategory(id) {
  if (!sections.some((section) => section.id === id)) return;
  requestedId = id;
  activateCategory(id);
}

categoryLinks.forEach((link) => {
  link.addEventListener('click', () => requestCategory(link.hash.slice(1)));
});
window.addEventListener('hashchange', () => requestCategory(location.hash.slice(1)));
requestCategory(location.hash.slice(1));

if (categoryLinks.length && 'IntersectionObserver' in window) {
  const visibleSections = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleSections.add(entry.target.id);
      else visibleSections.delete(entry.target.id);
    });
    if (requestedId || visibleSections.has(activeId)) return;
    const next = sections.find((section) => visibleSections.has(section.id));
    if (next) activateCategory(next.id);
  }, { rootMargin: '-100px 0px -50% 0px' });
  sections.forEach((section) => observer.observe(section));

  const releaseSelection = () => { requestedId = ''; };
  window.addEventListener('wheel', releaseSelection, { passive: true });
  window.addEventListener('touchstart', releaseSelection, { passive: true });
  window.addEventListener('pointerdown', releaseSelection, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) releaseSelection();
  });
}
