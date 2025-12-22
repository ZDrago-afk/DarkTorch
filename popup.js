document.getElementById("toggle").addEventListener("click", async () => {
  const toggleBtn = document.getElementById("toggle");
  
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ 
      active: true, 
      currentWindow: true 
    });
    
    // Check if we have permission to inject script
    if (!tab.url.startsWith('http')) {
      alert('DarkTorch only works on web pages (http/https)');
      return;
    }
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { toggle: true });
    
    if (response && response.success) {
      toggleBtn.textContent = response.enabled ? 'ON' : 'OFF';
      toggleBtn.style.background = response.enabled ? '#4CAF50' : 'orange';
    } else {
      // If content script hasn't loaded yet, try to execute it
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // Try sending message again
      const retryResponse = await chrome.tabs.sendMessage(tab.id, { toggle: true });
      toggleBtn.textContent = retryResponse.enabled ? 'ON' : 'OFF';
      toggleBtn.style.background = retryResponse.enabled ? '#4CAF50' : 'orange';
    }
    
  } catch (error) {
    console.error("DarkTorch Error:", error);
    alert('DarkTorch failed to activate. Try refreshing the page and clicking again.');
  }
});