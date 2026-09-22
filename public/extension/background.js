/**
 * OpenSimplify Extension Service Worker (Manifest V3)
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[OpenSimplify] Chrome Extension Installed Successfully');

  // Create context menu items for quick right-click actions
  try {
    chrome.contextMenus.create({
      id: 'os-autofill-page',
      title: '⚡ Autofill Job Application with OpenSimplify',
      contexts: ['page', 'editable']
    });

    chrome.contextMenus.create({
      id: 'os-open-copilot',
      title: '🤖 Toggle OpenSimplify In-Tab Copilot',
      contexts: ['page', 'editable']
    });
  } catch (e) {
    // Context menu creation may fail in unsupported contexts
  }
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'os-autofill-page') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const btn = document.getElementById('os-btn-autofill');
        if (btn) btn.click();
      }
    });
  } else if (info.menuItemId === 'os-open-copilot') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const drawer = document.getElementById('opensimplify-drawer');
        if (drawer) drawer.classList.toggle('os-open');
      }
    });
  }
});

// Relay messages between popup, content script, and web app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_STATUS') {
    chrome.storage.local.get(['open_simplify_profile', 'open_simplify_llm_config'], (data) => {
      sendResponse({ status: 'ok', data });
    });
    return true; // Keep message channel open for async response
  }
});
