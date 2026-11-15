(() => {
  if (!document.querySelector(".heading-link") || !navigator.clipboard?.writeText) return;

  const status = document.createElement("span");
  status.className = "heading-link-status";
  status.setAttribute("role", "status");
  document.body.append(status);

  let copiedLink;
  let reset;

  document.addEventListener("click", async (event) => {
    const link = event.target.closest("a.heading-link");
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    try {
      await navigator.clipboard.writeText(link.href);
    } catch {
      window.location.hash = link.hash;
      return;
    }

    clearTimeout(reset);
    copiedLink?.removeAttribute("data-copied");
    copiedLink = link;
    link.setAttribute("data-copied", "");
    status.textContent = "Heading link copied.";
    reset = setTimeout(() => {
      link.removeAttribute("data-copied");
      status.textContent = "";
    }, 1800);
  });
})();
