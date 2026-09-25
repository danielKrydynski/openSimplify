# OpenSimplify

An open-source job application assistant: keep your profile in one vault, tailor your résumé with AI, track every application, and autofill job forms in the browser with a companion Chrome extension.

## Features

- **Profile Vault** — store your work history, education, skills, and links once; reuse everywhere
- **AI Résumé Tailoring** — generate job-specific résumé bullet points and summaries from your master profile
- **Application Tracker** — log applications with company, role, stage, and next actions
- **Browser Autofill** — Chrome extension fills application forms from your vault (content script + popup)
- **Multi-provider LLM support** — Gemini, OpenRouter, Anthropic, OpenAI, or local Ollama
- **Backend settings UI** — switch providers and models without touching config files

## Architecture

```
┌──────────────┐      ┌──────────────────┐      ┌─────────────┐
│  React 19 UI │─────▶│ Express API      │─────▶│ LLM provider│
│  (Vite)      │      │ (server.ts)      │      │ (your pick) │
└──────────────┘      └──────────────────┘      └─────────────┘
        ▲
        │  autofill bridge
┌──────────────┐
│ Chrome ext.  │
│ (public/ext) │
└──────────────┘
```

- `src/` — React frontend (views per feature: AutoFill, ProfileVault, ResumeTailor, Tracker, …)
- `src/services/` — `llmService` (provider abstraction), `extensionService`, `storageService`
- `server.ts` — Express API server that fronts the LLM providers
- `public/extension/` — unpacked Chrome extension (manifest v3)

## Quickstart

Prerequisites: Node.js LTS.

```bash
git clone https://github.com/danielKrydynski/openSimplify.git
cd openSimplify
npm install --legacy-peer-deps
cp .env.example .env
npm run dev
```

Open http://localhost:34567. On first run, add at least one LLM API key to `.env`
(Gemini, OpenRouter, Anthropic, or OpenAI) — or run [Ollama](https://ollama.com)
locally for a key-free setup.

### Chrome extension

1. Open `chrome://extensions`, enable **Developer mode**
2. **Load unpacked** → select the `public/extension` folder
3. Use the popup to autofill forms from your profile vault

## Configuration

| Variable             | Purpose                                  |
|----------------------|------------------------------------------|
| `GEMINI_API_KEY`     | Google Gemini models                     |
| `OPENROUTER_API_KEY` | OpenRouter (multi-model fallback)        |
| `ANTHROPIC_API_KEY`  | Anthropic Claude models                  |
| `OPENAI_API_KEY`     | OpenAI models                            |
| `APP_URL`            | Public URL of the app (OAuth callbacks)  |

Only the providers you configure are used. Keys stay in your local `.env` —
never commit the real file (it's gitignored).

## Scripts

| Command          | What it does                              |
|------------------|-------------------------------------------|
| `npm run dev`    | Start API server + Vite dev server (tsx)  |
| `npm run build`  | Production build to `dist/`               |
| `npm start`      | Run the production build                  |
| `npm run lint`   | Type-check with `tsc --noEmit`            |

## Roadmap

- [ ] One-click tailored résumé export (PDF/DOCX)
- [ ] Interview prep from job descriptions
- [ ] Firefox extension support
- [ ] Encrypted cloud sync for the profile vault

## Contributing

Issues and pull requests are welcome. Keep the framing/tailoring logic honest:
this tool rephrases your real experience — it never invents it.
