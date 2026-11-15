const sidebar = document.querySelector(".site-sidebar");
const submenus = [...document.querySelectorAll(".sidebar-submenu")];
const storageKey = "sunflowerdm.sidebar.open";
const scrollKey = "sunflowerdm.sidebar.scroll";

function restoreSidebar() {
  let saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(storageKey));
  } catch {
    // The current branch can still open when storage is unavailable.
  }

  if (Array.isArray(saved)) {
    const openSections = new Set(saved);
    for (const submenu of submenus) {
      submenu.open = openSections.has(submenu.dataset.sidebarSection);
    }
  }

  // Open the current branch last so it wins over any saved sibling.
  for (const submenu of submenus) {
    if (submenu.hasAttribute("data-sidebar-current-branch")) {
      submenu.open = true;
    }
  }
}

function restoreSidebarScroll() {
  if (sidebar.scrollHeight <= sidebar.clientHeight) return;

  try {
    const scrollTop = Number(sessionStorage.getItem(scrollKey));
    if (Number.isFinite(scrollTop)) sidebar.scrollTop = scrollTop;
  } catch {
    // The active page can still be revealed when storage is unavailable.
  }

  const currentLink = sidebar.querySelector('a[aria-current="page"]:not(.sidebar-current-preview a)');
  if (!currentLink) return;

  const viewport = sidebar.getBoundingClientRect();
  const link = currentLink.getBoundingClientRect();
  if (link.top < viewport.top) {
    sidebar.scrollTop += link.top - viewport.top;
  } else if (link.bottom > viewport.bottom) {
    sidebar.scrollTop += link.bottom - viewport.bottom;
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
restoreSidebarScroll();
window.addEventListener("pagehide", () => {
  saveSidebar();
  if (getComputedStyle(sidebar).overflowY === "visible") return;
  try {
    sessionStorage.setItem(scrollKey, String(sidebar.scrollTop));
  } catch {
    // The sidebar remains usable when storage is unavailable.
  }
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    restoreSidebar();
    restoreSidebarScroll();
  }
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

const siteContent = document.querySelector(".site-content");
const sidebarLinks = [...sidebar.querySelectorAll(".site-navigation a[href]")];
const pagePath = (link) => link.pathname.replace(/\/+$/, "");
let highlightedLink;

function highlightSidebarLink(link) {
  highlightedLink?.classList.remove("sidebar-link-match");
  highlightedLink = undefined;
  if (!link || link.origin !== window.location.origin || link.getAttribute("href").startsWith("#")) return;

  const destination = pagePath(link);
  highlightedLink = sidebarLinks.find((candidate) =>
    candidate.origin === link.origin && pagePath(candidate) === destination &&
    !candidate.closest("details:not([open])") && candidate.getClientRects().length &&
    getComputedStyle(candidate).visibility === "visible"
  );
  highlightedLink?.classList.add("sidebar-link-match");
}

siteContent.addEventListener("pointerover", (event) => {
  if (event.pointerType !== "touch") highlightSidebarLink(event.target.closest("a[href]"));
});

siteContent.addEventListener("pointerout", (event) => {
  const link = event.target.closest("a[href]");
  if (event.pointerType === "touch" || !link || link.contains(event.relatedTarget)) return;
  highlightSidebarLink(siteContent.querySelector("a:focus-visible"));
});

siteContent.addEventListener("focusin", (event) => {
  highlightSidebarLink(event.target.closest("a[href]:focus-visible"));
});

siteContent.addEventListener("focusout", () => highlightSidebarLink(null));
