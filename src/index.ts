#!/usr/bin/env node
/**
 * Standalone Design Style MCP Server
 *
 * Provides style intelligence for Lane's ACT subagents when generating
 * campaign media via fal.ai. Pure filesystem reads + deterministic scoring.
 *
 * Tools:
 *   - recommend_style: Deterministic style recommendation based on brand context
 *   - get_style: Retrieve structured style tokens for a given design style slug
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import logger from "./lib/logger.js";
import { getSessionTrace, flushLangfuse, shutdownLangfuse } from "./lib/langfuse.js";
import { textResult, errorResult } from "./response.js";
import {
  recommendStyle,
  getStyleTokens,
  DESIGN_STYLE_SLUGS,
} from "./styles.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const server = new McpServer({
  name: "design-style-mcp-server",
  version,
});

function extractErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function styleDataUnavailableError(msg: string) {
  return errorResult(
    "STYLE_DATA_UNAVAILABLE",
    `Style data files could not be loaded: ${msg}`,
    {
      action:
        "ABORT: The design-style MCP server cannot read its data files. Check that DESIGN_STYLES_PATH is set correctly or that bundled design-styles/ exists. Do not retry — this requires operator intervention.",
    },
  );
}

// --- Tool 1: recommend_style ---

server.registerTool(
  "recommend_style",
  {
    description:
      "Recommend a design style based on brand context, campaign objective, and target demographic. Returns a top match with reasoning and alternatives. No AI inference — uses deterministic scoring against style characteristics.",
    inputSchema: {
      brand: z
        .string()
        .optional()
        .describe(
          "Brand description or keywords (e.g., 'luxury wellness spa targeting affluent women')",
        ),
      objective: z
        .string()
        .describe(
          "Campaign objective (e.g., 'product_launch', 'brand_awareness', 'lead_generation', 'engagement')",
        ),
      demographic: z
        .string()
        .describe(
          "Target demographic (e.g., 'tech_savvy', 'gen_z', 'executives', 'families')",
        ),
      season: z
        .string()
        .optional()
        .describe("Season for seasonal relevance (e.g., 'spring', 'summer')"),
    },
  },
  async (args) => {
    const trace = getSessionTrace("design-style-mcp-server");
    const span = trace?.span({ name: "tool:recommend_style", input: args });
    logger.error(
      `[recommend_style] → objective=${args.objective} demographic=${args.demographic} brand=${args.brand ?? "(none)"} season=${args.season ?? "(none)"}`,
    );
    try {
      const result = await recommendStyle(args);
      logger.error(
        `[recommend_style] ← ${result.style} (${result.isDefault ? "default fallback" : "matched"}) + ${result.alternatives.length} alternatives`,
      );
      span?.update({ output: result });
      return textResult(result);
    } catch (e) {
      const msg = extractErrorMessage(e);
      logger.error(`[recommend_style] Error: ${msg}`);
      span?.update({ output: { error: msg }, level: "ERROR" });

      if (msg.includes("descriptions.txt")) return styleDataUnavailableError(msg);

      return errorResult("RECOMMENDATION_FAILED", msg, {
        action:
          "RETRY_ONCE: Unexpected error during scoring. Retry this call once. If it fails again, fall back to using style slug 'professional' with get_style.",
      });
    } finally {
      span?.end();
    }
  },
);

// --- Tool 2: get_style ---

server.registerTool(
  "get_style",
  {
    description: `Retrieve structured design style tokens for AI content generation. Returns name, description, color palette, typography, mood, visual directives, and negative prompt sections extracted from the style's prompt file. Valid slugs: ${DESIGN_STYLE_SLUGS.join(", ")}`,
    inputSchema: {
      style: z
        .string()
        .describe(
          `Design style slug (e.g., 'professional', 'saas', 'neo-brutalism'). Must be one of the valid slugs.`,
        ),
    },
  },
  async (args) => {
    const trace = getSessionTrace("design-style-mcp-server");
    const span = trace?.span({ name: "tool:get_style", input: args });
    logger.error(`[get_style] → slug=${args.style}`);
    try {
      const tokens = await getStyleTokens(args.style);
      if (!tokens) {
        logger.error(`[get_style] ← invalid slug: ${args.style}`);
        span?.update({ output: { error: "invalid slug" }, level: "WARNING" });
        return errorResult(
          "INVALID_STYLE_SLUG",
          `'${args.style}' is not a recognized design style slug.`,
          {
            validSlugs: DESIGN_STYLE_SLUGS,
            action: `FIX_INPUT: Use one of the valid slugs listed in validSlugs. If you got this slug from recommend_style, call recommend_style again to get a valid recommendation.`,
          },
        );
      }
      logger.error(
        `[get_style] ← ${tokens.name} (colors=${tokens.colors ? "yes" : "no"} mood=${tokens.mood ? "yes" : "no"} typography=${tokens.typography ? "yes" : "no"})`,
      );
      span?.update({ output: tokens });
      return textResult(tokens);
    } catch (e) {
      const msg = extractErrorMessage(e);
      logger.error(`[get_style] Error: ${msg}`);

      if (msg.includes("descriptions.txt")) return styleDataUnavailableError(msg);

      if (msg.includes("Failed to read prompt")) {
        return errorResult("PROMPT_FILE_MISSING", msg, {
          slug: args.style,
          action: `FALLBACK: The prompt file for '${args.style}' could not be read. The style exists but its prompt data is unavailable. Use the style name and description for generation, or try a different style from recommend_style alternatives.`,
        });
      }

      span?.update({ output: { error: msg }, level: "ERROR" });
      return errorResult("STYLE_RETRIEVAL_FAILED", msg, {
        action:
          "RETRY_ONCE: Unexpected error during style retrieval. Retry this call once. If it fails again, call recommend_style to get an alternative style slug.",
      });
    } finally {
      span?.end();
    }
  },
);

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.error("Design Style MCP Server running on stdio");
}

main().catch(async (e) => {
  logger.error({ err: e }, "Fatal");
  await flushLangfuse();
  await shutdownLangfuse();
  process.exit(1);
});
