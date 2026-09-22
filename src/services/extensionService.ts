import JSZip from 'jszip';
import { UserProfile, LLMConfig } from '../types';

export class ExtensionService {
  /**
   * Generates and downloads the complete Chrome Extension package as a .zip file
   * with the user's profile and LLM config pre-baked in!
   */
  public static async generateExtensionZip(profile: UserProfile, llmConfig: LLMConfig): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder('opensimplify-extension') || zip;

    // Load static files from public/extension
    const fileList = [
      'manifest.json',
      'background.js',
      'content.js',
      'content.css',
      'popup.html',
      'popup.js',
      'popup.css',
      'icon16.png',
      'icon48.png',
      'icon128.png',
      'README.md'
    ];

    for (const filename of fileList) {
      try {
        const res = await fetch(`/extension/${filename}`);
        if (res.ok) {
          if (filename.endsWith('.png')) {
            const buffer = await res.arrayBuffer();
            folder.file(filename, buffer);
          } else {
            const text = await res.text();
            folder.file(filename, text);
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch /extension/${filename}`, err);
      }
    }

    // Inject active profile and config pre-configured
    const activeConfig = {
      open_simplify_profile: {
        fullName: profile.fullName,
        firstName: profile.fullName.split(' ')[0] || '',
        lastName: profile.fullName.split(' ').slice(1).join(' ') || '',
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        portfolioUrl: profile.portfolioUrl,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        company: profile.experiences?.[0]?.company || '',
        role: profile.experiences?.[0]?.role || profile.headline || '',
        school: profile.education?.[0]?.school || '',
        degree: profile.education?.[0]?.degree || '',
        major: profile.education?.[0]?.fieldOfStudy || '',
        gpa: profile.education?.[0]?.gpa || '',
        gradYear: profile.education?.[0]?.graduationYear || '',
        authorizedUS: profile.authorization?.authorizedInUS ?? true,
        requireSponsorship: profile.authorization?.requiresSponsorshipNow ?? false,
        veteran: profile.demographics?.veteranStatus || 'I am not a protected veteran',
        disability: profile.demographics?.disabilityStatus || 'No, I do not have a disability'
      },
      open_simplify_llm_config: {
        backend: llmConfig.backend,
        endpointUrl: llmConfig.endpointUrl,
        model: llmConfig.model
      },
      exportedAt: new Date().toISOString()
    };

    folder.file('initial-config.json', JSON.stringify(activeConfig, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    return content;
  }

  /**
   * Broadcasts sync event to any open tabs with the content script active
   */
  public static syncToActiveTabs(profile: UserProfile, llmConfig: LLMConfig) {
    const payload = {
      type: 'OPENSIMPLIFY_SYNC_VAULT',
      profile: {
        fullName: profile.fullName,
        firstName: profile.fullName.split(' ')[0] || '',
        lastName: profile.fullName.split(' ').slice(1).join(' ') || '',
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        portfolioUrl: profile.portfolioUrl,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        company: profile.experiences?.[0]?.company || '',
        role: profile.experiences?.[0]?.role || profile.headline || '',
        school: profile.education?.[0]?.school || '',
        degree: profile.education?.[0]?.degree || '',
        major: profile.education?.[0]?.fieldOfStudy || '',
        gpa: profile.education?.[0]?.gpa || '',
        gradYear: profile.education?.[0]?.graduationYear || '',
        authorizedUS: profile.authorization?.authorizedInUS ?? true,
        requireSponsorship: profile.authorization?.requiresSponsorshipNow ?? false
      },
      llmConfig: {
        backend: llmConfig.backend,
        endpointUrl: llmConfig.endpointUrl,
        model: llmConfig.model
      }
    };

    window.postMessage(payload, '*');
  }

  /**
   * Generates a zero-install JavaScript bookmarklet code string
   */
  public static getBookmarkletCode(): string {
    return `javascript:(function(){if(window.__opensimplify_injected){var d=document.getElementById('opensimplify-drawer');if(d){d.classList.toggle('os-open');return;}}var s=document.createElement('script');s.src='${window.location.origin}/extension/content.js';var c=document.createElement('link');c.rel='stylesheet';c.href='${window.location.origin}/extension/content.css';document.head.appendChild(c);document.body.appendChild(s);})();`;
  }
}
