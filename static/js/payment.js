const gameSelect = document.querySelector("#payment-game");
const paymentStatus = document.querySelector("#payment-status");
const checkoutLinks = document.querySelectorAll("[data-payment-game]");

function showCheckout() {
  for (const link of checkoutLinks) {
    link.hidden = link.dataset.paymentGame !== gameSelect.value;
  }

  const hasCheckout = [...checkoutLinks].some((link) => !link.hidden);
  paymentStatus.textContent = gameSelect.value && !hasCheckout
    ? "Online payment is coming soon for this game."
    : "";
}

gameSelect.addEventListener("change", showCheckout);
showCheckout();
