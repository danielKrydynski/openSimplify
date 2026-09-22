/**
 * OpenSimplify Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const profileNameEl = document.getElementById('popup-profile-name');
  const profileEmailEl = document.getElementById('popup-profile-email');
  const backendNameEl = document.getElementById('popup-backend-name');
  const btnAutofill = document.getElementById('btn-popup-autofill');
  const btnToggleInpage = document.getElementById('btn-toggle-inpage');
  const btnOpenApp = document.getElementById('btn-open-app');

  // Load stored profile and LLM config
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['open_simplify_profile', 'open_simplify_llm_config'], (res) => {
      if (res.open_simplify_profile) {
        profileNameEl.innerText = res.open_simplify_profile.fullName || 'Alex Morgan';
        profileEmailEl.innerText = res.open_simplify_profile.email || 'alex.morgan.dev@gmail.com';
      }
      if (res.open_simplify_llm_config) {
        backendNameEl.innerText = `${res.open_simplify_llm_config.backend.toUpperCase()} (${res.open_simplify_llm_config.model})`;
      }
    });
  }

  // Autofill Active Tab
  btnAutofill.addEventListener('click', async () => {
    btnAutofill.innerText = 'Autofilling Page...';
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const btn = document.getElementById('os-btn-autofill');
          if (btn) {
            btn.click();
            return 'injected_clicked';
          }
          return 'not_found';
        }
      }, (results) => {
        btnAutofill.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Done!</span>
        `;
        setTimeout(() => window.close(), 1000);
      });
    }
  });

  // Toggle in-page drawer
  btnToggleInpage.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const drawer = document.getElementById('opensimplify-drawer');
          if (drawer) drawer.classList.toggle('os-open');
        }
      });
      window.close();
    }
  });

  // Open Full Applet Dashboard
  btnOpenApp.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
});
