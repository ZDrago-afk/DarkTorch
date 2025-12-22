// State
let overlay = null;
let isEnabled = false;
let radius = 120;
let darkness = 95;

// Load saved settings
chrome.storage.sync.get({
  enabled: false,
  radius: 120,
  darkness: 95
}, (settings) => {
  console.log('DarkTorch: Loaded settings', settings);
  isEnabled = settings.enabled;
  radius = settings.radius;
  darkness = settings.darkness;
  
  if (isEnabled) {
    createOverlay();
  }
});

// Create overlay
function createOverlay() {
  if (overlay) return;
  
  overlay = document.createElement('div');
  overlay.id = 'darktorch-overlay';
  
  // Style the overlay
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '2147483647',
    transition: 'background 0.1s linear'
  });
  
  document.body.appendChild(overlay);
  updateOverlay();
  
  // Add mouse move listener
  document.addEventListener('mousemove', moveLight);
  
  console.log('DarkTorch: Overlay created');
}

// Remove overlay
function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
    document.removeEventListener('mousemove', moveLight);
    console.log('DarkTorch: Overlay removed');
  }
}

// Update overlay appearance
function updateOverlay() {
  if (!overlay || !isEnabled) return;
  
  const opacity = darkness / 100;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  overlay.style.background = `
    radial-gradient(
      circle ${radius}px at ${centerX}px ${centerY}px,
      transparent 0%,
      rgba(0, 0, 0, ${opacity}) 100%
    )
  `;
}

// Move light with cursor
function moveLight(e) {
  if (!overlay || !isEnabled) return;
  
  const opacity = darkness / 100;
  const x = e.clientX;
  const y = e.clientY;
  
  overlay.style.background = `
    radial-gradient(
      circle ${radius}px at ${x}px ${y}px,
      transparent 0%,
      rgba(0, 0, 0, ${opacity}) 100%
    )
  `;
}

// Handle resize
window.addEventListener('resize', () => {
  if (overlay && isEnabled) {
    updateOverlay();
  }
});

// Message listener - SIMPLIFIED
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('DarkTorch: Received message', message);
  
  switch (message.action) {
    case 'enable':
      isEnabled = true;
      radius = message.settings.radius;
      darkness = message.settings.darkness;
      createOverlay();
      sendResponse({ success: true });
      break;
      
    case 'disable':
      isEnabled = false;
      removeOverlay();
      sendResponse({ success: true });
      break;
      
    case 'updateSettings':
      radius = message.settings.radius;
      darkness = message.settings.darkness;
      
      if (overlay && isEnabled) {
        updateOverlay();
      }
      
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep message channel open
});
