# SOP Trainer 🚀

An AI-powered application that transforms Standard Operating Procedures (SOPs) into interactive, structured training modules.

## Features
- **Redesigned UI**: Minimalist, dark aesthetic inspired by modern SaaS designs.
- **Smart Analysis**: Powered by Groq (LLaMA 3.3 70B) for instant SOP extraction.
- **Interactive Quiz**: Real-time evaluation of employees.
- **Decision Scenarios**: Practical situational training based on SOP rules.
- **Multiple Exports**:
  - **SlideDev Markdown**: Export as a ready-to-run presentation.
  - **PDF Manual**: High-contrast PDF reports for printing.
- **Mobile Friendly**: Built as a PWA, ready for mobile installation.

## Getting Started

### Prerequisites
- Node.js 18+
- Groq Cloud API Key

### Installation
1. Clone the repository.
2. `npm install`
3. Create a `.env.local` file:
   ```env
   GROQ_API_KEY=gsk_your_key_here
   ```
4. `npm run dev`

## Deployment (Vercel)
When deploying to Vercel, navigate to **Settings > Environment Variables** and add:
- `GROQ_API_KEY`: Your actual Groq key.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS / shadcn/ui
- **PDF Core**: pdfkit
- **Presentation**: SlideDev
- **AI Backend**: Groq SDK (LLaMA 3.3)

---
*Created with focus on privacy and security. No API keys are included in this codebase.*
