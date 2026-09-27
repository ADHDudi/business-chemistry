# Directory Index

## Files

- **[deploy.sh](./deploy.sh)** - Firebase deployment shell script
- **[firebase.json](./firebase.json)** - Firebase hosting and functions configuration
- **[geminiService.ts](./geminiService.ts)** - Server-side Gemini API integration test
- **[metadata.json](./metadata.json)** - Project description and general metadata
- **[package.json](./package.json)** - Workspace dependencies and run scripts
- **[README.md](./README.md)** - Project overview and documentation
- **[simulate_session.js](./simulate_session.js)** - Script to simulate partner test scenarios
- **[e2e/run.js](./e2e/run.js)** - End-to-end Puppeteer test suite (`npm run test:e2e`)
- **[test_genai.ts](./test_genai.ts)** - Node script returning Gemini AI prompts
- **[test_module.js](./test_module.js)** - Testing script for module interactions
- **[tsconfig.json](./tsconfig.json)** - TypeScript compiler configuration
- **[types.ts](./types.ts)** - Global project type definitions
- **[vite.config.ts](./vite.config.ts)** - Vite React app build configuration

## Subdirectories

### components/

- **[ReportView.tsx](./components/ReportView.tsx)** - Alternative or deprecated Report View UI

### functions/

- **[index.js](./functions/index.js)** - Firebase cloud functions generating insights
- **[package.json](./functions/package.json)** - Firebase functions runtime dependencies

### src/

- **[App.tsx](./src/App.tsx)** - Main React application routing and state
- **[constants.tsx](./src/constants.tsx)** - Config, icons, and persona data constants
- **[firebaseConfig.ts](./src/firebaseConfig.ts)** - Web client Firebase initialization settings
- **[geminiService.ts](./src/geminiService.ts)** - Client-side Gemini AI integration module
- **[index.css](./src/index.css)** - Global styles and Tailwind configuration
- **[index.tsx](./src/index.tsx)** - React application point of entry
- **[types.ts](./src/types.ts)** - Frontend specific TypeScript definitions

### src/components/

- **[ComparisonView.tsx](./src/components/ComparisonView.tsx)** - UI displaying partner compatibility insights
- **[LiveProgressBar.tsx](./src/components/LiveProgressBar.tsx)** - Questionnaire completion continuous progress indicator
- **[ReportView.tsx](./src/components/ReportView.tsx)** - Primary dashboard for viewing individual results
- **[SessionLobby.tsx](./src/components/SessionLobby.tsx)** - Waitroom UI before partner connection completes
- **[SessionWizard.tsx](./src/components/SessionWizard.tsx)** - Step-by-step survey questions form

### src/hooks/

- **[useSession.ts](./src/hooks/useSession.ts)** - Hook for managing active shared session

### src/services/

- **[sessionService.ts](./src/services/sessionService.ts)** - Utilities managing Firestore sessions backend
