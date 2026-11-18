const sidebar = document.querySelector(".site-sidebar");
const sidebarNav = sidebar.querySelector(".site-navigation");
const submenus = [...document.querySelectorAll(".sidebar-submenu")];
const storageKey = "sunflowerdm.sidebar.open";
const scrollKey = "sunflowerdm.sidebar.scroll";
const mobileScrollKey = "sunflowerdm.sidebar.scroll.mobile";

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

function sidebarScrollport() {
  return getComputedStyle(sidebar).overflowY === "visible" ? sidebarNav : sidebar;
}

function restoreSidebarScroll() {
  const scrollport = sidebarScrollport();
  if (scrollport.scrollHeight <= scrollport.clientHeight) return;
  const key = scrollport === sidebar ? scrollKey : mobileScrollKey;

  try {
    const scrollTop = Number(sessionStorage.getItem(key));
    if (Number.isFinite(scrollTop)) scrollport.scrollTop = scrollTop;
  } catch {
    // The active page can still be revealed when storage is unavailable.
  }

  const currentLink = sidebar.querySelector("a[aria-current]:not(.sidebar-current-preview a)");
  if (!currentLink) return;

  const viewport = scrollport.getBoundingClientRect();
  const link = currentLink.getBoundingClientRect();
  if (link.top < viewport.top) {
    scrollport.scrollTop += link.top - viewport.top;
  } else if (link.bottom > viewport.bottom) {
    scrollport.scrollTop += link.bottom - viewport.bottom;
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
const pageTopLink = sidebar.querySelector("[data-sidebar-page-top]");
if (pageTopLink) {
  const headings = [...pageTopLink.closest("details").querySelectorAll("[data-sidebar-heading]")];
  const selectHeading = () => {
    const current = headings.find((link) => link.hash === window.location.hash);
    for (const link of headings) {
      if (link === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    if (current) pageTopLink.removeAttribute("aria-current");
    else pageTopLink.setAttribute("aria-current", "page");
  };
  selectHeading();
  window.addEventListener("hashchange", selectHeading);
  window.addEventListener("pageshow", selectHeading);
}
restoreSidebarScroll();
window.addEventListener("pagehide", () => {
  saveSidebar();
  const scrollport = sidebarScrollport();
  const key = scrollport === sidebar ? scrollKey : mobileScrollKey;
  try {
    sessionStorage.setItem(key, String(scrollport.scrollTop));
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
    candidate.origin === link.origin && pagePath(candidate) === destination && candidate.hash === link.hash &&
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
