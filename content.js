let overlay = null;
let enabled = false;

// Inject CSS if not already present
function injectStyles() {
  if (!document.getElementById('darktorch-styles')) {
    const style = document.createElement('style');
    style.id = 'darktorch-styles';
    style.textContent = `
      #darktorch-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 2147483647;
        background: radial-gradient(
          circle 120px at 50% 50%,
          transparent 0%,
          rgba(0, 0, 0, 0.95) 100%
        );
        transition: background 0.05s linear;
      }
    `;
    document.head.appendChild(style);
  }
}

function createOverlay() {
  injectStyles();
  
  if (overlay) return;
  
  overlay = document.createElement("div");
  overlay.id = "darktorch-overlay";
  document.body.appendChild(overlay);

  document.addEventListener("mousemove", moveLight);
  console.log("DarkTorch: Overlay created");
}

function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
    document.removeEventListener("mousemove", moveLight);
    console.log("DarkTorch: Overlay removed");
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("DarkTorch: Message received", message);
  
  if (message.toggle) {
    enabled = !enabled;

    if (enabled) {
      createOverlay();
    } else {
      removeOverlay();
    }
    
    // Send response back to popup
    sendResponse({ success: true, enabled: enabled });
  }
  return true; // Required for async response
});