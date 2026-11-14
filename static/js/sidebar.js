const submenus = [...document.querySelectorAll(".sidebar-submenu")];
const storageKey = "sunflowerdm.sidebar.open";

function restoreSidebar() {
  let saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(storageKey));
  } catch {
    return;
  }
  if (!Array.isArray(saved)) return;

  const openSections = new Set(saved);
  for (const submenu of submenus) {
    submenu.open = openSections.has(submenu.dataset.sidebarSection);
  }
}

function saveSidebar() {
  const openSections = submenus
    .filter((submenu) => submenu.open)
    .map((submenu) => submenu.dataset.sidebarSection);

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(openSections));
  } catch {
    // The menu remains usable when browser storage is unavailable.
  }
}

restoreSidebar();
window.addEventListener("pagehide", saveSidebar);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) restoreSidebar();
});

for (const submenu of submenus) {
  const toggle = submenu.querySelector("summary");
  submenu.addEventListener("toggle", saveSidebar);

  submenu.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && submenu.open) {
      event.stopPropagation();
      submenu.open = false;
      toggle.focus();
    }
  });
}
