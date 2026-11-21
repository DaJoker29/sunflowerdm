(() => {
  const status = document.querySelector(".brand-copy-status");
  if (!status) return;

  document.querySelectorAll("[data-copy-color]").forEach((button) => {
    let reset;

    button.addEventListener("click", async () => {
      const value = button.dataset.copyColor;
      try {
        await navigator.clipboard.writeText(value);
        clearTimeout(reset);
        button.setAttribute("data-copied", "");
        status.textContent = `${value} copied to clipboard.`;
        reset = setTimeout(() => {
          button.removeAttribute("data-copied");
        }, 1800);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(button.querySelector("code"));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = `Copy ${value} using your browser's Copy command.`;
      }
    });
  });
})();
