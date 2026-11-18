(() => {
  const content = document.getElementById("main");
  const dialog = document.querySelector(".image-viewer");
  const preview = dialog.querySelector(".image-viewer-content");
  const original = dialog.querySelector(".image-viewer-original");

  for (const image of content.querySelectorAll(".prose img")) {
    const media = image.closest("picture") || image;
    if (media.closest("a, button") || !image.getAttribute("src")) continue;

    const link = document.createElement("a");
    const description = image.alt.trim();
    link.className = "image-preview";
    link.href = image.src;
    link.dataset.imagePreview = "";
    link.setAttribute(
      "aria-label",
      description ? `View full-size image: ${description}` : "View full-size image",
    );
    media.before(link);
    link.append(media);
  }

  if (typeof dialog.showModal !== "function") return;

  content.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[data-image-preview]");
    if (!link) return;

    event.preventDefault();
    const image = new Image();
    image.alt = link.querySelector("img").alt;
    image.src = link.href;
    preview.replaceChildren(image);
    original.href = link.href;
    link.focus({ preventScroll: true });
    dialog.showModal();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target === preview) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (!dialog.open) preview.replaceChildren();
  });
})();
