// Default settings
const defaultSettings = {
  enabled: false,
  radius: 120,
  darkness: 95
};

// DOM Elements
const toggleBtn = document.getElementById('toggle');
const radiusSlider = document.getElementById('radius');
const darknessSlider = document.getElementById('darkness');
const radiusValue = document.getElementById('radius-value');
const darknessValue = document.getElementById('darkness-value');
const resetBtn = document.getElementById('reset');
const statusEl = document.getElementById('status');

// Current settings
let currentSettings = { ...defaultSettings };

// Load saved settings
async function loadSettings() {
  const result = await chrome.storage.sync.get(defaultSettings);
  currentSettings = result;
  
  // Update UI
  radiusSlider.value = currentSettings.radius;
  darknessSlider.value = currentSettings.darkness;
  radiusValue.textContent = `${currentSettings.radius}px`;
  darknessValue.textContent = `${currentSettings.darkness}%`;
  
  // Update toggle button
  updateToggleButton();
  
  return currentSettings;
}

// Update toggle button appearance
function updateToggleButton() {
  toggleBtn.textContent = currentSettings.enabled ? 'Turn Off' : 'Turn On';
  toggleBtn.classList.toggle('enabled', currentSettings.enabled);
}

// Save settings to storage
async function saveSettings() {
  await chrome.storage.sync.set(currentSettings);
}

// Send message to content script
async function sendMessageToActiveTab(message) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.url?.startsWith('http')) {
      return { success: false, error: 'Not a web page' };
    }
    
    try {
      const response = await chrome.tabs.sendMessage(tab.id, message);
      return response;
    } catch (error) {
      // If content script not loaded, inject it
      if (error.message.includes('receiving end') || error.message.includes('Could not establish connection')) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Wait for script to load
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Try again
        const response = await chrome.tabs.sendMessage(tab.id, message);
        return response;
      }
      throw error;
    }
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: error.message };
  }
}

// Toggle DarkTorch
async function toggleDarkTorch() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.url?.startsWith('http')) {
      showStatus('Only works on web pages', true);
      return;
    }
    
    // Toggle the enabled state
    const newEnabledState = !currentSettings.enabled;
    
    // Prepare message
    const message = {
      action: newEnabledState ? 'enable' : 'disable',
      settings: {
        ...currentSettings,
        enabled: newEnabledState
      }
    };
    
    // Send message to content script
    const result = await sendMessageToActiveTab(message);
    
    if (result && result.success) {
      // Update local state
      currentSettings.enabled = newEnabledState;
      await saveSettings();
      updateToggleButton();
      
      showStatus(newEnabledState ? 'DarkTorch ON' : 'DarkTorch OFF');
    } else {
      showStatus('Failed to toggle. Refresh page.', true);
    }
    
  } catch (error) {
    console.error('Toggle error:', error);
    showStatus('Error. Try refreshing page.', true);
  }
}

// Update settings
async function updateSettings() {
  const result = await sendMessageToActiveTab({
    action: 'updateSettings',
    settings: currentSettings
  });
  
  if (result && result.success) {
    showStatus('Settings updated');
  }
}

// Show status message
function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff6b6b' : '#4CAF50';
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.style.color = '';
  }, 2000);
}

// Initialize
loadSettings();

// Event Listeners
radiusSlider.addEventListener('input', () => {
  currentSettings.radius = parseInt(radiusSlider.value);
  radiusValue.textContent = `${currentSettings.radius}px`;
});

radiusSlider.addEventListener('change', async () => {
  currentSettings.radius = parseInt(radiusSlider.value);
  await saveSettings();
  
  if (currentSettings.enabled) {
    await updateSettings();
  }
});

darknessSlider.addEventListener('input', () => {
  currentSettings.darkness = parseInt(darknessSlider.value);
  darknessValue.textContent = `${currentSettings.darkness}%`;
});

darknessSlider.addEventListener('change', async () => {
  currentSettings.darkness = parseInt(darknessSlider.value);
  await saveSettings();
  
  if (currentSettings.enabled) {
    await updateSettings();
  }
});

toggleBtn.addEventListener('click', toggleDarkTorch);

resetBtn.addEventListener('click', async () => {
  currentSettings = { ...defaultSettings };
  
  // Update UI
  radiusSlider.value = currentSettings.radius;
  darknessSlider.value = currentSettings.darkness;
  radiusValue.textContent = `${currentSettings.radius}px`;
  darknessValue.textContent = `${currentSettings.darkness}%`;
  updateToggleButton();
  
  // Save
  await saveSettings();
  
  // Update active tab
  if (currentSettings.enabled) {
    await sendMessageToActiveTab({
      action: 'enable',
      settings: currentSettings
    });
  } else {
    await sendMessageToActiveTab({
      action: 'disable',
      settings: currentSettings
    });
  }
  
  showStatus('Settings reset');
});
