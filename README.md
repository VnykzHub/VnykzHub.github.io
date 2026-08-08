# vnykzhub.com

Personal site and technical writing platform. Built with Next.js 15, deployed on Vercel.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 3 + CSS custom properties (light/dark themes)
- **Animation:** Framer Motion + Three.js (React Three Fiber)
- **Content:** Markdown → TypeScript generator pipeline, rendered with KaTeX + Prism

## Atlas Series

Long-form technical writing with animated canvas diagrams.

- **[LLM Atlas](https://vnykzhub.com/blog/llm-atlas)** — 14 parts on language model architecture, 2017–2026
- **[AI Engineering Atlas](https://vnykzhub.com/blog/ai-engineering-atlas)** — 11 parts on RAG, agents, MCP, vector databases, production systems

## Development

```bash
npm install
npm run dev        # Start dev server
npm run build      # Production build
npm run typecheck  # TypeScript check
```

Content generators run automatically before `npm run build`:
```bash
npm run gen:atlas       # LLM Atlas
npm run gen:ai-atlas    # AI Engineering Atlas
```

## Deployment

Deployed on [Vercel](https://vercel.com). Push to `main` triggers automatic deployment.

Custom domain: `vnykzhub.com`
