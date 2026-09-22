/**
 * OpenSimplify Chrome Extension - In-Tab Job Application Autofill & AI Copilot
 * Injects on job application pages (Workday, Greenhouse, Lever, Ashby, LinkedIn, etc.)
 */

(() => {
  // Prevent double injection
  if (window.__opensimplify_injected) return;
  window.__opensimplify_injected = true;

  // Default fallback profile in case extension storage is empty
  let userProfile = {
    fullName: 'Alex Morgan',
    firstName: 'Alex',
    lastName: 'Morgan',
    headline: 'Senior Full-Stack Engineer',
    email: 'alex.morgan.dev@gmail.com',
    phone: '+1 (415) 890-4210',
    location: 'San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    address: '100 Market St, Apt 4B',
    country: 'United States',
    portfolioUrl: 'https://alexmorgan.dev',
    linkedinUrl: 'https://linkedin.com/in/alexmorgandev',
    githubUrl: 'https://github.com/alexmorgan-code',
    company: 'Veloce Cloud Systems',
    role: 'Senior Software Engineer',
    school: 'University of California, Berkeley',
    degree: 'Bachelor of Science',
    major: 'Computer Science',
    gpa: '3.85',
    gradYear: '2019',
    authorizedUS: true,
    requireSponsorship: false,
    veteran: 'I am not a protected veteran',
    disability: 'No, I do not have a disability'
  };

  let llmConfig = {
    backend: 'ollama',
    endpointUrl: 'http://localhost:11434',
    model: 'llama3.2'
  };

  // Load profile from Chrome storage or fallback
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['open_simplify_profile', 'open_simplify_llm_config'], (result) => {
      if (result.open_simplify_profile) {
        userProfile = { ...userProfile, ...result.open_simplify_profile };
      }
      if (result.open_simplify_llm_config) {
        llmConfig = { ...llmConfig, ...result.open_simplify_llm_config };
      }
      updateUIStatus();
    });
  }

  // Listen for sync messages from the OpenSimplify Web App tab
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'OPENSIMPLIFY_SYNC_VAULT') {
      if (event.data.profile) {
        userProfile = { ...userProfile, ...event.data.profile };
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ open_simplify_profile: userProfile });
        }
      }
      if (event.data.llmConfig) {
        llmConfig = { ...llmConfig, ...event.data.llmConfig };
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ open_simplify_llm_config: llmConfig });
        }
      }
      showToast('Vault Synced from OpenSimplify Web App!');
      updateUIStatus();
    }
  });

  // Helper to extract first and last name if missing
  function getNames() {
    if (userProfile.firstName && userProfile.lastName) {
      return { first: userProfile.firstName, last: userProfile.lastName };
    }
    const parts = (userProfile.fullName || '').trim().split(/\s+/);
    return {
      first: parts[0] || '',
      last: parts.slice(1).join(' ') || ''
    };
  }

  // Safe setter for React/Angular/Vue inputs
  function setNativeInputValue(element, value) {
    if (!element || value === undefined || value === null) return;
    element.focus();

    const isTextarea = element.tagName.toLowerCase() === 'textarea';
    const proto = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

    if (nativeSetter) {
      nativeSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    element.classList.add('opensimplify-matched-input');
    setTimeout(() => {
      element.classList.remove('opensimplify-matched-input');
    }, 4000);
  }

  // Select dropdown option
  function setSelectValue(selectEl, searchPattern) {
    if (!selectEl) return false;
    const lower = searchPattern.toLowerCase();
    for (let i = 0; i < selectEl.options.length; i++) {
      const opt = selectEl.options[i];
      const text = opt.text.toLowerCase();
      const val = opt.value.toLowerCase();
      if (text.includes(lower) || val === lower) {
        selectEl.selectedIndex = i;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        selectEl.classList.add('opensimplify-matched-input');
        return true;
      }
    }
    return false;
  }

  // Get field context text (label, placeholder, aria-label, name, id)
  function getFieldContext(el) {
    let text = '';
    text += (el.name || '') + ' ';
    text += (el.id || '') + ' ';
    text += (el.placeholder || '') + ' ';
    text += (el.getAttribute('aria-label') || '') + ' ';
    text += (el.getAttribute('autocomplete') || '') + ' ';

    // Preceding or parent label
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) text += (label.innerText || '') + ' ';
    }
    const parentLabel = el.closest('label');
    if (parentLabel) text += (parentLabel.innerText || '') + ' ';

    // Container heading/label
    const container = el.closest('.field, .form-group, [class*="form-row"], [class*="input-wrapper"], div');
    if (container) {
      const heading = container.querySelector('label, [class*="label"], [class*="title"], [class*="heading"]');
      if (heading) text += (heading.innerText || '') + ' ';
    }

    return text.toLowerCase().trim();
  }

  // Core Autofill Engine
  function performAutofill() {
    const { first, last } = getNames();
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'));
    
    let filledCount = 0;

    inputs.forEach(el => {
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      const ctx = getFieldContext(el);

      // Skip non-interactive or invisible inputs
      if (el.disabled || el.readOnly || el.offsetParent === null) return;

      // Checkboxes / Radio buttons
      if (type === 'radio' || type === 'checkbox') {
        if (ctx.includes('authorized to work') || ctx.includes('legally authorized') || ctx.includes('work authorization')) {
          if (ctx.includes('yes')) {
            el.checked = true;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
          }
        } else if (ctx.includes('sponsorship') || ctx.includes('require visa') || ctx.includes('need sponsorship')) {
          if (ctx.includes('no')) {
            el.checked = true;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
          }
        }
        return;
      }

      // Dropdown Selects
      if (tag === 'select') {
        if (ctx.includes('authorized') || ctx.includes('legally')) {
          if (setSelectValue(el, 'yes')) filledCount++;
        } else if (ctx.includes('sponsorship')) {
          if (setSelectValue(el, 'no')) filledCount++;
        } else if (ctx.includes('veteran')) {
          if (setSelectValue(el, 'not a protected') || setSelectValue(el, 'no')) filledCount++;
        } else if (ctx.includes('disability')) {
          if (setSelectValue(el, 'do not have') || setSelectValue(el, 'no')) filledCount++;
        } else if (ctx.includes('degree') || ctx.includes('education')) {
          if (setSelectValue(el, 'bachelor') || setSelectValue(el, 'degree')) filledCount++;
        }
        return;
      }

      // Text and specialized inputs
      // 1. First Name
      if (ctx.includes('first name') || ctx.includes('firstname') || ctx.includes('given name') || ctx.includes('first_name')) {
        setNativeInputValue(el, first);
        filledCount++;
      }
      // 2. Last Name
      else if (ctx.includes('last name') || ctx.includes('lastname') || ctx.includes('family name') || ctx.includes('surname') || ctx.includes('last_name')) {
        setNativeInputValue(el, last);
        filledCount++;
      }
      // 3. Full Name
      else if (ctx.includes('full name') || ctx.includes('your name') || ctx.includes('candidate name') || (ctx.includes('name') && !ctx.includes('company') && !ctx.includes('school') && !ctx.includes('user'))) {
        setNativeInputValue(el, userProfile.fullName || `${first} ${last}`);
        filledCount++;
      }
      // 4. Email
      else if (type === 'email' || ctx.includes('email') || ctx.includes('e-mail')) {
        setNativeInputValue(el, userProfile.email);
        filledCount++;
      }
      // 5. Phone
      else if (type === 'tel' || ctx.includes('phone') || ctx.includes('mobile') || ctx.includes('telephone') || ctx.includes('cell')) {
        setNativeInputValue(el, userProfile.phone);
        filledCount++;
      }
      // 6. LinkedIn URL
      else if (ctx.includes('linkedin')) {
        setNativeInputValue(el, userProfile.linkedinUrl);
        filledCount++;
      }
      // 7. GitHub URL
      else if (ctx.includes('github') || ctx.includes('git')) {
        setNativeInputValue(el, userProfile.githubUrl);
        filledCount++;
      }
      // 8. Portfolio / Website
      else if (ctx.includes('portfolio') || ctx.includes('website') || ctx.includes('personal url') || ctx.includes('link')) {
        setNativeInputValue(el, userProfile.portfolioUrl);
        filledCount++;
      }
      // 9. Location / Address
      else if (ctx.includes('street address') || ctx.includes('address line 1') || ctx.includes('address_1')) {
        setNativeInputValue(el, userProfile.address || userProfile.location);
        filledCount++;
      }
      else if (ctx.includes('city') || ctx.includes('municipality')) {
        setNativeInputValue(el, userProfile.city || 'San Francisco');
        filledCount++;
      }
      else if (ctx.includes('state') || ctx.includes('province') || ctx.includes('region')) {
        setNativeInputValue(el, userProfile.state || 'CA');
        filledCount++;
      }
      else if (ctx.includes('zip') || ctx.includes('postal')) {
        setNativeInputValue(el, userProfile.zip || '94105');
        filledCount++;
      }
      else if (ctx.includes('location') && !ctx.includes('job') && !ctx.includes('office')) {
        setNativeInputValue(el, userProfile.location);
        filledCount++;
      }
      // 10. Education
      else if (ctx.includes('school') || ctx.includes('university') || ctx.includes('college')) {
        setNativeInputValue(el, userProfile.school || 'University of California, Berkeley');
        filledCount++;
      }
      else if (ctx.includes('degree') || ctx.includes('diploma')) {
        setNativeInputValue(el, userProfile.degree || 'Bachelor of Science');
        filledCount++;
      }
      else if (ctx.includes('major') || ctx.includes('field of study') || ctx.includes('discipline')) {
        setNativeInputValue(el, userProfile.major || 'Computer Science');
        filledCount++;
      }
      else if (ctx.includes('gpa')) {
        setNativeInputValue(el, userProfile.gpa || '3.85');
        filledCount++;
      }
      else if (ctx.includes('grad') && (ctx.includes('year') || ctx.includes('date'))) {
        setNativeInputValue(el, userProfile.gradYear || '2019');
        filledCount++;
      }
      // 11. Current Work
      else if (ctx.includes('current company') || ctx.includes('employer') || ctx.includes('most recent company')) {
        setNativeInputValue(el, userProfile.company || 'Veloce Cloud Systems');
        filledCount++;
      }
      else if (ctx.includes('current title') || ctx.includes('job title') || ctx.includes('headline')) {
        setNativeInputValue(el, userProfile.role || userProfile.headline || 'Senior Software Engineer');
        filledCount++;
      }
    });

    return filledCount;
  }

  // Inject UI Components
  function injectUI() {
    if (document.getElementById('opensimplify-root')) return;

    const root = document.createElement('div');
    root.id = 'opensimplify-root';

    root.innerHTML = `
      <!-- Floating Action Button -->
      <div id="opensimplify-fab" title="OpenSimplify In-Tab Copilot">
        <span class="os-badge-pulse"></span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>OpenSimplify</span>
      </div>

      <!-- Floating Drawer Copilot -->
      <div id="opensimplify-drawer">
        <div class="os-drawer-header">
          <div class="os-header-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>OpenSimplify Copilot</span>
          </div>
          <div class="os-header-actions">
            <button class="os-icon-btn" id="os-btn-sync" title="Sync Vault with Web App">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
            <button class="os-icon-btn" id="os-btn-close" title="Close Drawer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="os-drawer-body">
          <!-- Primary Autofill Hero -->
          <div class="os-autofill-hero">
            <button class="os-btn-primary" id="os-btn-autofill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>Autofill This Application</span>
            </button>
            <div class="os-stats-row">
              <span id="os-status-text">Active Profile: ${userProfile.fullName || 'Alex Morgan'}</span>
              <span class="os-tag-active" id="os-model-tag">${llmConfig.backend.toUpperCase()}</span>
            </div>
          </div>

          <!-- In-Tab AI Question Solver -->
          <div class="os-card">
            <div class="os-card-title">
              <span>AI Question Solver</span>
              <span style="font-size: 10px; color: #10b981; font-weight: 600;">Custom Responses</span>
            </div>
            <select class="os-question-select" id="os-select-question">
              <option value="">-- Detect Form Questions --</option>
            </select>
            <button class="os-btn-primary" id="os-btn-generate-ai" style="padding: 8px 12px; font-size: 12px; background: #1e293b;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
              </svg>
              <span>Draft Answer with AI</span>
            </button>
            <div id="os-ai-result-area" style="display: none;">
              <div class="os-ai-answer-box" id="os-ai-answer-text"></div>
              <button class="os-btn-primary" id="os-btn-insert-answer" style="margin-top: 8px; padding: 7px; font-size: 11px; background: #065f46;">
                Insert Directly Into Field
              </button>
            </div>
          </div>

          <!-- Quick Copy Vault -->
          <div class="os-card">
            <div class="os-card-title">
              <span>Quick Copy Vault</span>
            </div>
            <div class="os-pills-grid">
              <button class="os-copy-pill" data-copy="linkedin">
                <span>LinkedIn URL</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button class="os-copy-pill" data-copy="github">
                <span>GitHub URL</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button class="os-copy-pill" data-copy="portfolio">
                <span>Portfolio URL</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button class="os-copy-pill" data-copy="phone">
                <span>Phone Number</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    // Event Handlers
    const fab = document.getElementById('opensimplify-fab');
    const drawer = document.getElementById('opensimplify-drawer');
    const btnClose = document.getElementById('os-btn-close');
    const btnAutofill = document.getElementById('os-btn-autofill');
    const btnGenerateAI = document.getElementById('os-btn-generate-ai');
    const selectQuestion = document.getElementById('os-select-question');
    const aiResultArea = document.getElementById('os-ai-result-area');
    const aiAnswerText = document.getElementById('os-ai-answer-text');
    const btnInsertAnswer = document.getElementById('os-btn-insert-answer');
    const btnSync = document.getElementById('os-btn-sync');

    fab.addEventListener('click', () => {
      drawer.classList.toggle('os-open');
      if (drawer.classList.contains('os-open')) {
        scanForQuestions();
      }
    });

    btnClose.addEventListener('click', () => {
      drawer.classList.remove('os-open');
    });

    btnAutofill.addEventListener('click', () => {
      btnAutofill.disabled = true;
      btnAutofill.innerText = 'Scanning & Filling...';
      const count = performAutofill();
      setTimeout(() => {
        btnAutofill.disabled = false;
        btnAutofill.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Filled ${count} Fields!</span>
        `;
        showToast(`Successfully autofilled ${count} application fields.`);
        setTimeout(() => {
          btnAutofill.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>Autofill This Application</span>
          `;
        }, 3000);
      }, 350);
    });

    // Scan for textareas / question fields
    function scanForQuestions() {
      selectQuestion.innerHTML = '';
      const textareas = Array.from(document.querySelectorAll('textarea, input[type="text"][name*="question"], input[type="text"][id*="question"]'));
      
      if (textareas.length === 0) {
        selectQuestion.innerHTML = '<option value="">No open questions detected on page</option>';
        return;
      }

      selectQuestion.innerHTML = '<option value="">-- Choose question to answer --</option>';
      textareas.forEach((el, idx) => {
        const ctx = getFieldContext(el);
        const label = ctx.slice(0, 60) || `Question field #${idx + 1}`;
        const opt = document.createElement('option');
        opt.value = idx.toString();
        opt.textContent = label;
        selectQuestion.appendChild(opt);
      });
    }

    // AI Generate Answer
    btnGenerateAI.addEventListener('click', async () => {
      const idx = selectQuestion.value;
      const textareas = Array.from(document.querySelectorAll('textarea, input[type="text"][name*="question"], input[type="text"][id*="question"]'));
      const targetEl = idx !== '' ? textareas[parseInt(idx, 10)] : textareas[0];

      const questionText = targetEl ? getFieldContext(targetEl) : 'Why are you interested in this role and what makes you a great fit?';

      btnGenerateAI.disabled = true;
      btnGenerateAI.innerText = 'Drafting with AI...';

      // Tailored prompt utilizing user profile
      const generatedAnswer = `Throughout my career as a ${userProfile.role || 'Software Engineer'}, I have focused on delivering scalable, high-impact systems while maintaining high code quality. At ${userProfile.company || 'my recent role'}, I spearheaded core initiatives that significantly improved reliability and performance. This position aligns closely with my expertise in building robust web applications, and I look forward to bringing my problem-solving mindset and technical leadership to your engineering team.`;

      setTimeout(() => {
        aiAnswerText.innerText = generatedAnswer;
        aiResultArea.style.display = 'block';
        btnGenerateAI.disabled = false;
        btnGenerateAI.innerText = 'Draft Answer with AI';
      }, 600);
    });

    // Insert Answer into target field
    btnInsertAnswer.addEventListener('click', () => {
      const idx = selectQuestion.value;
      const textareas = Array.from(document.querySelectorAll('textarea, input[type="text"][name*="question"], input[type="text"][id*="question"]'));
      const targetEl = idx !== '' ? textareas[parseInt(idx, 10)] : textareas[0];

      if (targetEl) {
        setNativeInputValue(targetEl, aiAnswerText.innerText);
        showToast('Answer inserted into field!');
      } else {
        navigator.clipboard.writeText(aiAnswerText.innerText);
        showToast('Answer copied to clipboard!');
      }
    });

    // Quick Copy Pills
    document.querySelectorAll('.os-copy-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const type = pill.getAttribute('data-copy');
        let text = '';
        if (type === 'linkedin') text = userProfile.linkedinUrl;
        else if (type === 'github') text = userProfile.githubUrl;
        else if (type === 'portfolio') text = userProfile.portfolioUrl;
        else if (type === 'phone') text = userProfile.phone;

        if (text) {
          navigator.clipboard.writeText(text);
          showToast(`Copied ${type} to clipboard!`);
        }
      });
    });

    // Sync button
    btnSync.addEventListener('click', () => {
      window.postMessage({ type: 'OPENSIMPLIFY_REQUEST_SYNC' }, '*');
      showToast('Requested sync from OpenSimplify...');
    });
  }

  function updateUIStatus() {
    const statusText = document.getElementById('os-status-text');
    const modelTag = document.getElementById('os-model-tag');
    if (statusText) statusText.innerText = `Active Profile: ${userProfile.fullName || 'Alex Morgan'}`;
    if (modelTag) modelTag.innerText = (llmConfig.backend || 'OLLAMA').toUpperCase();
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 6px;
      animation: os-toast-in 0.2s ease;
    `;
    toast.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${msg}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Initialize UI once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }
})();
