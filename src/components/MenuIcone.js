export function menu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');
  const icon = hamburgerBtn?.querySelector('.hamburger-menu-icon');

  if (!hamburgerBtn || !navLinks || !navOverlay || !icon) return;

  function openMenu() {
    navLinks.classList.add('active');
    navOverlay.classList.add('active');
    hamburgerBtn.classList.add('active');
    icon.classList.remove('fa-bars');
    icon.classList.add('fa-xmark');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
    icon.classList.remove('fa-xmark');
    icon.classList.add('fa-bars');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    const isOpen = navLinks.classList.contains('active');
    isOpen ? closeMenu() : openMenu();
  }

  hamburgerBtn.addEventListener('click', toggleMenu);
  navOverlay.addEventListener('click', closeMenu);
  document.addEventListener('forja:close-menu', closeMenu);

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  const mobileQuery = window.matchMedia('(max-width: 900px)');

  mobileQuery.addEventListener('change', (e) => {
    if (!e.matches) closeMenu();
  });

  // --- Dropdown "Olá, Fábio" ---
  // Clique funciona em QUALQUER largura de tela (não só mobile).
  // O hover para desktop (acima de 600px) é feito só via CSS (@media min-width: 601px),
  // então aqui só precisamos cuidar do clique.
  const userMenu = document.getElementById('userMenu');
  const userDropdown = document.getElementById('userDropdown');
  const userDropdownWrapper = userMenu?.closest('.dropdownSuspenso');

  if (userMenu && userDropdown && userDropdownWrapper) {
    let isPinned = false;
    let closeTimer;

    function syncUserDropdown() {
      userDropdownWrapper.classList.toggle('is-pinned', isPinned);
      userDropdown.classList.toggle(
        'show',
        isPinned || userDropdownWrapper.classList.contains('is-hovered')
      );
    }

    userDropdownWrapper.addEventListener('mouseenter', () => {
      window.clearTimeout(closeTimer);
      userDropdownWrapper.classList.add('is-hovered');
      syncUserDropdown();
    });

    userDropdownWrapper.addEventListener('mouseleave', () => {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        userDropdownWrapper.classList.remove('is-hovered');
        syncUserDropdown();
      }, 180);
    });

    userMenu.addEventListener('click', (e) => {
      e.preventDefault();
      window.clearTimeout(closeTimer);
      isPinned = !isPinned;
      syncUserDropdown();
    });

    // Fecha o dropdown ao clicar fora dele (útil principalmente no mobile,
    // já que no desktop o hover cuida de abrir/fechar naturalmente)
    document.addEventListener('click', (e) => {
      const clickedInsideDropdown = userMenu.contains(e.target) 
      || userDropdown.contains(e.target);
      if (!clickedInsideDropdown) {
        window.clearTimeout(closeTimer);
        isPinned = false;
        userDropdownWrapper.classList.remove('is-hovered');
        syncUserDropdown();
      }
    });
  }
}
