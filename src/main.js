const categoryLinks = document.querySelectorAll('.category-nav a');

if (categoryLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting);
    if (!visible.length) return;
    const id = visible[0].target.id;
    categoryLinks.forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-100px 0px -50% 0px' });
  document.querySelectorAll('.menu-category').forEach((section) => observer.observe(section));
}
