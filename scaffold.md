# Next.js App Scaffold

A reusable Next.js starter template using [shadcn/ui](https://github.com/shadcn) components with Tailwind CSS. Designed for both local development and Vercel deployment, with a clear separation of concerns for UI components, charting, business logic, static data, and comprehensive testing. Optional modules cover authentication and database integration, and there’s guidance on monorepo vs. standalone repos for a Python WebSocket backend. Includes a `.gitignore` and LLM prompt/instructions template.

---

## 🗂️ Directory Structure

```plaintext
my-app/
├── app/ or src/app/           # App Router routes & layouts
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
├── components/
│   ├── ui/                    # Custom shadcn/ui extensions
│   ├── charts/                # Reusable charting components
│   └── ...
├── lib/                       # Business logic, API clients, utilities
├── data/                      # Static JSON/Markdown assets
├── tests/
│   ├── unit/                  # Jest + React Testing Library
│   └── e2e/                   # Playwright end-to-end tests
├── scripts/                   # Automation/helper scripts
├── public/                    # Static assets (images, fonts)
├── styles/                    # Global styles & Tailwind config
├── .github/
│   └── workflows/             # CI/CD (GitHub Actions)
├── docs/
│   └── LLM-Instructions.md    # Prompts & guidelines for LLM-driven tasks
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── .gitignore
