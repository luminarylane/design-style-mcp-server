# Design Style MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that provides design style intelligence for AI content generation. Ships with 30 curated design styles — each with color palettes, typography, mood tokens, visual directives, and negative prompts ready for image/video generation pipelines.

No AI inference — pure deterministic scoring against style characteristics.

## Features

### Tools

| Tool              | Description                                                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recommend_style` | Deterministic style recommendation based on brand context, campaign objective, target demographic, and season. Returns a top match with scoring reasoning and ranked alternatives. |
| `get_style`       | Retrieve structured design tokens for a given style slug: name, description, color palette, typography, mood, visual directives, and negative prompt sections.                     |

### Included Styles (30)

academia, art-deco, bauhaus, bold-typography, botanical, claymorphism, cyberpunk, enterprise, flat-design, industrial, kinetic, luxury, material, maximalism, minimal-dark, modern-dark, monochrome, neo-brutalism, neumorphism, newsprint, organic, playful-geometric, professional, retro, saas, sketch, swiss-minimalist, terminal, vaporwave, web3

Each style includes a full prompt file with design philosophy, color system, typography rules, visual directives, and negative prompts — sourced from [designprompts.dev](https://www.designprompts.dev/).

## Quick Start

### Prerequisites

- Node.js 18+

### Install

```bash
git clone https://github.com/luminarylane/design-style-mcp-server.git
cd design-style-mcp-server
npm install
npm run build
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "design-style": {
      "command": "node",
      "args": ["/path/to/design-style-mcp-server/dist/index.js"]
    }
  }
}
```

## How It Works

### `recommend_style`

Given a brand description, campaign objective, target demographic, and optional season, the server scores all 30 styles against their characteristics (objectives, demographics, industries, moods, seasonal fit) and returns the top match with alternatives.

```
Input:  { objective: "product_launch", demographic: "gen_z", brand: "streetwear" }
Output: { style: "neo-brutalism", reasoning: "...", alternatives: [...] }
```

### `get_style`

Given a style slug, returns structured tokens extracted from the style's prompt file:

```
Input:  { style: "cyberpunk" }
Output: { name, description, colors, typography, mood, promptAdditions, negativePrompt, reference }
```

## Configuration

| Env Var              | Default                                 | Description                                       |
| -------------------- | --------------------------------------- | ------------------------------------------------- |
| `DESIGN_STYLES_PATH` | `./design-styles` (relative to package) | Override path to the design-styles data directory |

## Architecture

- **Transport**: stdio (standard MCP protocol)
- **Data**: 30 style prompt files + descriptions index (plain text, bundled)
- **Scoring**: Deterministic fuzzy matching — no AI inference, no network calls
- **Caching**: Prompt files are cached in-memory after first read
- **Dependencies**: Only `@modelcontextprotocol/sdk` and `zod`

## Development

```bash
# Development server (auto-reload)
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build
```

## Adding a New Style

1. Add the slug to `DESIGN_STYLE_SLUGS` in `src/styles.ts`
2. Add characteristics (objectives, demographics, industries, moods) to `STYLE_CHARACTERISTICS`
3. Add a description line to `design-styles/descriptions.txt`
4. Create a prompt file at `design-styles/prompts/{slug}.txt`

## License

[MIT](LICENSE)
