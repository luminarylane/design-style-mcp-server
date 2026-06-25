# Contributing to Design Style MCP Server

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+
- Git

### Installation

```bash
git clone https://github.com/luminarylane/design-style-mcp-server.git
cd design-style-mcp-server
npm install
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-description
```

### 2. Make Changes

Follow the existing code style and conventions.

### 3. Build & Test

```bash
npm run build
npx tsc --noEmit
```

### 4. Push and Create PR

```bash
git push origin your-branch-name
gh pr create --title "Description" --body "Details..."
```

## Adding a New Design Style

1. Add the slug to `DESIGN_STYLE_SLUGS` in `src/styles.ts`
2. Add characteristics to `STYLE_CHARACTERISTICS` (objectives, demographics, industries, moods, optional seasons)
3. Add a one-line description to `design-styles/descriptions.txt` in the format: `Name - Description - https://source.url`
4. Create a prompt file at `design-styles/prompts/{slug}.txt` with sections for Design Philosophy, Color System, Typography, Visual Vibe, and what to avoid

## Code Style

- TypeScript strict mode
- No external SDK dependencies for the Graph API — minimal dependency footprint
- `console.error` for logging (stdio is reserved for MCP protocol)

## Project Structure

```
design-style-mcp-server/
├── design-styles/
│   ├── descriptions.txt          # Style index (name, description, source URL)
│   └── prompts/                  # One .txt file per style
│       ├── professional.txt
│       ├── cyberpunk.txt
│       └── ...
├── src/
│   ├── index.ts                  # MCP server + tool registration
│   ├── styles.ts                 # Style loading, extraction, recommendation
│   └── response.ts              # MCP response helpers
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
