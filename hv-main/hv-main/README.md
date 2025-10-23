
  # Animated Hero Section Design

  This is a Vite + React (TypeScript) project containing the animated hero UI and a demo event platform scaffold (routing, contexts, components). The original design reference is available at https://www.figma.com/design/v1svOn6cqCt3OxGgYx8hze/Animated-Hero-Section-Design.

  ## Prerequisites
  - Node.js 18+ (recommended 20 LTS)
  - npm 9+

  ## Install
  ```bash
  npm i
  ```

  ## Develop
  ```bash
  npm run dev
  ```
  The dev server runs on http://localhost:3000 and opens automatically.

  ## Build
  ```bash
  npm run build
  npm run preview
  ```

  ## Notes
  - This repo includes a basic auth and theme context, router setup, and several demo pages/components.
  - Supabase client calls are mocked via `src/utils/supabaseApi.ts` for local/demo flows. If you intend to connect to a real Supabase project, wire credentials and replace mocked methods accordingly.
  