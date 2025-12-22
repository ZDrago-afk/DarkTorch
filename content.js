let overlay = null;
let enabled = false;

function createOverlay() {
  overlay = document.createElement("div");
  overlay.id = "darktorch-overlay";
  document.body.appendChild(overlay);

  document.addEventListener("mousemove", moveLight);
}

function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
    document.removeEventListener("mousemove", moveLight);
  }
}

function moveLight(e) {
  if (!overlay) return;

  const x = e.clientX;
  const y = e.clientY;

  overlay.style.background = `
    radial-gradient(
      circle 120px at ${x}px ${y}px,
      transparent 0%,
      rgba(0, 0, 0, 0.95) 100%
    )
  `;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.toggle) {
    enabled = !enabled;

    if (enabled) {
      createOverlay();
    } else {
      removeOverlay();
    }
  }
});
