/**
 * Design Style data loading, extraction, and recommendation engine.
 *
 * Pure filesystem reads + deterministic scoring. No AI inference.
 */

import fs from "node:fs/promises";
import path from "node:path";

// --- Slugs & Validation ---

export const DESIGN_STYLE_SLUGS = [
  "academia",
  "art-deco",
  "bauhaus",
  "bold-typography",
  "botanical",
  "claymorphism",
  "cyberpunk",
  "enterprise",
  "flat-design",
  "industrial",
  "kinetic",
  "luxury",
  "material",
  "maximalism",
  "minimal-dark",
  "modern-dark",
  "monochrome",
  "neo-brutalism",
  "neumorphism",
  "newsprint",
  "organic",
  "playful-geometric",
  "professional",
  "retro",
  "saas",
  "sketch",
  "swiss-minimalist",
  "terminal",
  "vaporwave",
  "web3",
] as const;

export type DesignStyleSlug = (typeof DESIGN_STYLE_SLUGS)[number];

export function isValidDesignStyleSlug(slug: string): slug is DesignStyleSlug {
  return DESIGN_STYLE_SLUGS.includes(slug as DesignStyleSlug);
}

// --- Style Characteristics ---

export const STYLE_CHARACTERISTICS: Partial<
  Record<
    DesignStyleSlug,
    {
      objectives: string[];
      demographics: string[];
      industries: string[];
      moods: string[];
      seasons?: string[];
    }
  >
> = {
  professional: {
    objectives: ["brand_awareness", "thought_leadership", "trust_building"],
    demographics: ["executives", "b2b", "professionals", "35-55"],
    industries: ["consulting", "finance", "legal", "enterprise"],
    moods: ["trustworthy", "sophisticated", "authoritative"],
  },
  saas: {
    objectives: ["product_launch", "lead_generation", "conversion"],
    demographics: ["tech_savvy", "startups", "developers", "25-45"],
    industries: ["technology", "saas", "startup", "software"],
    moods: ["innovative", "clean", "modern", "confident"],
  },
  "neo-brutalism": {
    objectives: ["brand_awareness", "engagement", "viral_content"],
    demographics: ["gen_z", "millennials", "creatives", "18-35"],
    industries: ["creative", "fashion", "music", "entertainment", "streetwear", "athletic"],
    moods: ["bold", "rebellious", "energetic", "playful"],
  },
  luxury: {
    objectives: ["brand_awareness", "premium_positioning", "exclusivity"],
    demographics: ["affluent", "professionals", "35-65"],
    industries: ["luxury", "fashion", "jewelry", "real_estate"],
    moods: ["elegant", "exclusive", "sophisticated", "timeless"],
  },
  botanical: {
    objectives: ["wellness", "sustainability", "lifestyle"],
    demographics: ["health_conscious", "eco_friendly", "women", "25-55"],
    industries: ["wellness", "beauty", "organic", "sustainable"],
    moods: ["natural", "calm", "nurturing", "authentic"],
    seasons: ["spring", "summer"],
  },
  cyberpunk: {
    objectives: ["product_launch", "engagement", "tech_innovation"],
    demographics: ["gamers", "tech_enthusiasts", "gen_z", "18-35"],
    industries: ["gaming", "tech", "crypto", "ai"],
    moods: ["futuristic", "edgy", "bold", "technological"],
  },
  "minimal-dark": {
    objectives: [
      "premium_positioning",
      "product_launch",
      "product_showcase",
      "conversion",
    ],
    demographics: ["design_conscious", "tech_savvy", "25-45"],
    industries: ["tech", "design", "premium_products", "apps", "consumer_electronics"],
    moods: ["premium", "sleek", "modern", "focused", "minimal"],
  },
  vaporwave: {
    objectives: ["brand_awareness", "nostalgia_marketing", "engagement"],
    demographics: ["millennials", "gen_z", "creatives", "18-40"],
    industries: ["music", "entertainment", "fashion", "art"],
    moods: ["nostalgic", "dreamy", "playful", "retro"],
    seasons: ["summer"],
  },
  enterprise: {
    objectives: ["b2b_marketing", "lead_generation", "credibility"],
    demographics: ["decision_makers", "enterprise", "b2b", "35-55"],
    industries: ["enterprise", "b2b", "consulting", "technology"],
    moods: ["professional", "reliable", "trustworthy", "competent"],
  },
  "playful-geometric": {
    objectives: ["engagement", "brand_awareness", "community_building"],
    demographics: [
      "families",
      "millennials",
      "creative_professionals",
      "25-45",
    ],
    industries: ["education", "kids", "creative", "startups"],
    moods: ["fun", "optimistic", "friendly", "energetic"],
  },
  monochrome: {
    objectives: ["brand_awareness", "premium_positioning", "editorial"],
    demographics: ["design_conscious", "professionals", "creatives", "25-55"],
    industries: ["fashion", "architecture", "photography", "art"],
    moods: ["sophisticated", "dramatic", "artistic", "bold"],
  },
  "swiss-minimalist": {
    objectives: ["clarity", "information", "credibility"],
    demographics: ["professionals", "educated", "international", "30-55"],
    industries: ["finance", "consulting", "technology", "design"],
    moods: ["precise", "clean", "trustworthy", "rational"],
  },
  organic: {
    objectives: ["wellness", "sustainability", "trust_building", "lifestyle"],
    demographics: ["health_conscious", "parents", "families", "women", "25-45"],
    industries: [
      "baby_care",
      "childcare",
      "parenting",
      "organic",
      "natural",
      "health",
      "wellness",
    ],
    moods: ["nurturing", "gentle", "safe", "natural", "caring", "soft"],
  },
  retro: {
    objectives: [
      "brand_awareness",
      "nostalgia_marketing",
      "community_building",
    ],
    demographics: ["millennials", "foodies", "families", "general", "25-50"],
    industries: [
      "food",
      "beverage",
      "restaurant",
      "cafe",
      "hospitality",
      "bakery",
      "diner",
      "vintage",
      "consumer_goods",
    ],
    moods: [
      "nostalgic",
      "warm",
      "friendly",
      "authentic",
      "charming",
      "cozy",
      "classic",
    ],
    seasons: ["winter", "fall"],
  },
  claymorphism: {
    objectives: ["engagement", "product_launch", "brand_awareness"],
    demographics: ["gen_z", "millennials", "families", "parents", "18-40"],
    industries: [
      "apps",
      "kids",
      "education",
      "toys",
      "baby",
      "family",
      "playful",
    ],
    moods: ["friendly", "approachable", "soft", "modern", "playful", "gentle"],
  },
  neumorphism: {
    objectives: ["product_showcase", "premium_positioning", "conversion"],
    demographics: ["tech_savvy", "design_conscious", "millennials", "25-45"],
    industries: ["apps", "fintech", "health_tech", "smart_devices", "IoT"],
    moods: ["modern", "soft", "premium", "subtle", "sophisticated"],
  },
  "art-deco": {
    objectives: ["premium_positioning", "brand_awareness", "exclusivity"],
    demographics: ["affluent", "sophisticated", "35-65"],
    industries: [
      "hospitality",
      "hotel",
      "restaurant",
      "luxury",
      "cocktail",
      "bar",
    ],
    moods: ["glamorous", "elegant", "sophisticated", "opulent", "classic"],
  },
  "flat-design": {
    objectives: ["clarity", "engagement", "conversion"],
    demographics: ["general", "all_ages", "families", "mainstream"],
    industries: ["consumer", "retail", "service", "food_delivery", "logistics"],
    moods: ["clean", "simple", "accessible", "modern", "friendly"],
  },
  academia: {
    objectives: ["thought_leadership", "credibility", "trust_building"],
    demographics: ["academics", "professionals", "educated", "35-65"],
    industries: ["education", "research", "publishing", "university", "legal"],
    moods: ["scholarly", "prestigious", "timeless", "dignified", "intellectual"],
  },
  bauhaus: {
    objectives: ["brand_awareness", "engagement", "premium_positioning"],
    demographics: ["design_conscious", "creatives", "architects", "25-55"],
    industries: ["architecture", "design", "art", "gallery", "museum"],
    moods: ["constructivist", "geometric", "modernist", "bold", "architectural"],
  },
  "bold-typography": {
    objectives: ["brand_awareness", "engagement", "viral_content"],
    demographics: ["creatives", "millennials", "design_conscious", "25-45"],
    industries: ["creative", "media", "publishing", "advertising", "branding"],
    moods: ["bold", "dramatic", "confident", "impactful", "editorial"],
  },
  industrial: {
    objectives: ["product_showcase", "trust_building", "credibility", "brand_awareness"],
    demographics: ["professionals", "engineers", "b2b", "mainstream", "35-55"],
    industries: ["manufacturing", "engineering", "hardware", "automotive", "tools", "trucks"],
    moods: ["rugged", "precise", "reliable", "mechanical", "functional", "powerful"],
  },
  kinetic: {
    objectives: ["engagement", "viral_content", "brand_awareness"],
    demographics: ["gen_z", "millennials", "creatives", "18-35"],
    industries: ["music", "events", "entertainment", "festival", "sports", "athletic", "fitness"],
    moods: ["energetic", "dynamic", "bold", "urgent", "rebellious"],
  },
  material: {
    objectives: ["product_launch", "engagement", "conversion"],
    demographics: ["general", "all_ages", "mainstream", "families"],
    industries: ["apps", "consumer", "technology", "mobile", "productivity"],
    moods: ["friendly", "approachable", "colorful", "modern", "personal"],
  },
  maximalism: {
    objectives: ["engagement", "viral_content", "brand_awareness"],
    demographics: ["gen_z", "millennials", "creatives", "18-30"],
    industries: ["fashion", "entertainment", "music", "pop_culture", "social_media"],
    moods: ["euphoric", "playful", "overwhelming", "vibrant", "chaotic"],
  },
  "modern-dark": {
    objectives: [
      "product_launch",
      "product_showcase",
      "premium_positioning",
      "conversion",
    ],
    demographics: ["developers", "tech_savvy", "design_conscious", "25-45"],
    industries: ["developer_tools", "saas", "fintech", "ai", "devops"],
    moods: ["premium", "cinematic", "sophisticated", "technical", "sleek"],
  },
  newsprint: {
    objectives: ["editorial", "thought_leadership", "information"],
    demographics: ["professionals", "educated", "readers", "35-65"],
    industries: ["media", "journalism", "publishing", "news", "editorial"],
    moods: ["authoritative", "structured", "classic", "clear", "serious"],
  },
  sketch: {
    objectives: ["engagement", "brand_awareness", "community_building"],
    demographics: ["creatives", "families", "students", "18-40"],
    industries: ["education", "creative", "startup", "handmade", "craft"],
    moods: ["handmade", "approachable", "playful", "warm", "human"],
  },
  terminal: {
    objectives: ["product_launch", "credibility", "tech_innovation"],
    demographics: ["developers", "hackers", "tech_enthusiasts", "18-45"],
    industries: ["developer_tools", "cybersecurity", "devops", "cloud", "open_source"],
    moods: ["technical", "raw", "functional", "hacker", "retro"],
  },
  web3: {
    objectives: ["product_launch", "tech_innovation", "exclusivity"],
    demographics: ["crypto", "tech_enthusiasts", "investors", "25-45"],
    industries: ["crypto", "defi", "blockchain", "fintech", "nft"],
    moods: ["futuristic", "luminous", "precise", "premium", "trustworthy"],
  },
};

// Verify all slugs have characteristics at startup (development guard)
const missingChars = DESIGN_STYLE_SLUGS.filter(
  (s) => !STYLE_CHARACTERISTICS[s],
);
if (missingChars.length > 0) {
  console.error(
    `[design-style-mcp] BUG: ${missingChars.length} styles missing STYLE_CHARACTERISTICS: ${missingChars.join(", ")}`,
  );
}

// --- Data Loading ---

// Env var override → bundled copy next to this package (works in containers)
const DESIGN_STYLES_PATH =
  process.env.DESIGN_STYLES_PATH ||
  path.resolve(import.meta.dirname, "..", "design-styles");

interface StyleDescription {
  name: string;
  description: string;
  sourceUrl: string;
}

const promptCache = new Map<string, string>();

// Promise-based cache to prevent concurrent first-load races
let descriptionsPromise: Promise<Map<string, StyleDescription>> | null = null;

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function _loadDescriptions(): Promise<Map<string, StyleDescription>> {
  const filePath = path.join(DESIGN_STYLES_PATH, "descriptions.txt");
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n").filter((line: string) => line.trim());
  const styleMap = new Map<string, StyleDescription>();

  for (const line of lines) {
    const match = line.match(/^(.+?)\s*-\s*(.+?)\s*-\s*(https?:\/\/.+)$/);
    if (!match) {
      console.error(`[loadDescriptions] Skipping unparseable line: "${line}"`);
      continue;
    }

    const [, name, description, sourceUrl] = match;
    const slug = nameToSlug(name.trim());

    if (!isValidDesignStyleSlug(slug)) {
      console.error(
        `[loadDescriptions] Unrecognised slug derived from name "${name.trim()}": "${slug}"`,
      );
      continue;
    }

    styleMap.set(slug, {
      name: name.trim(),
      description: description.trim(),
      sourceUrl: sourceUrl.trim(),
    });
  }

  if (styleMap.size === 0) {
    throw new Error(
      `descriptions.txt at ${filePath} parsed 0 styles — file may be empty or malformed`,
    );
  }

  return styleMap;
}

export function loadDescriptions(): Promise<Map<string, StyleDescription>> {
  if (!descriptionsPromise) {
    descriptionsPromise = _loadDescriptions().catch((err) => {
      descriptionsPromise = null; // Allow retry on next call
      throw err;
    });
  }
  return descriptionsPromise;
}

export async function loadPrompt(slug: string): Promise<string | null> {
  if (!isValidDesignStyleSlug(slug)) return null;
  if (promptCache.has(slug)) return promptCache.get(slug)!;

  const filePath = path.join(DESIGN_STYLES_PATH, "prompts", `${slug}.txt`);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    promptCache.set(slug, content);
    return content;
  } catch (error: unknown) {
    const code =
      error instanceof Error && "code" in error
        ? (error as NodeJS.ErrnoException).code
        : undefined;
    if (code === "ENOENT") {
      console.error(`[loadPrompt] Prompt file not found: ${filePath}`);
      return null;
    }
    throw new Error(
      `Failed to read prompt for "${slug}" at ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// --- Section Extraction ---

const SECTION_MAX_CHARS = 1500;
const DIRECTIVES_MAX_CHARS = 2000;

const SECTION_KEYWORDS: Record<string, string[]> = {
  colors: ["Color", "Palette", "Token"],
  typography: ["Typography", "Font", "Typeface", "Serif", "Signature"],
  mood: ["Vibe", "Mood", "Emotional", "Aesthetic", "Visual Vibe"],
  negativePrompt: ["NOT", "Avoid", "Never"],
};

const VISUAL_DIRECTIVE_SECTIONS = [
  "Design Philosophy",
  "Color System",
  "Typography",
  "Visual Vibe",
  "The Bold Factor",
];

function headerMatches(headerText: string, keywords: string[]): boolean {
  const h = headerText.toLowerCase();
  return keywords.some((kw) => {
    const k = kw.toLowerCase();
    return h.includes(k) || k.includes(h);
  });
}

/**
 * Extract the first section whose header matches any keyword.
 * Captures content until the next header at the same or shallower level.
 */
export function extractSection(
  lines: string[],
  keywords: string[],
): string | null {
  const collected: string[] = [];
  let capturing = false;
  let captureLevel = 0;

  for (const line of lines) {
    const headerMatch = line.match(/^(#{2,4})\s*(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      if (capturing && level <= captureLevel) break;
      if (!capturing && headerMatches(headerMatch[2].trim(), keywords)) {
        capturing = true;
        captureLevel = level;
        continue;
      }
    } else if (capturing && line.trim()) {
      collected.push(line);
    }
  }

  if (collected.length === 0) return null;
  return collected.join("\n").slice(0, SECTION_MAX_CHARS);
}

/**
 * Extract inline bold patterns. Matches two forms:
 *   1. **Vibe**: content...      (bold label with colon)
 *   2. The vibe is **content**.   (prose with bold value)
 * Fallback for when content lives inline rather than under its own header.
 */
export function extractInlinePattern(
  lines: string[],
  keywords: string[],
): string | null {
  const kwLower = keywords.map((kw) => kw.toLowerCase());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Form 1: **Vibe**: Sophisticated, Timeless...
    const boldLabel = line.match(/\*\*([^*]+)\*\*\s*[:：]\s*(.*)/);
    if (boldLabel && kwLower.some((kw) => boldLabel[1].toLowerCase().includes(kw))) {
      const rest = boldLabel[2].trim();
      if (rest) return rest.slice(0, SECTION_MAX_CHARS);
      // Content on following lines — collect until blank line or next bold label/header
      const collected: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j];
        if (next.match(/^#{2,4}\s/) || next.match(/^\*\*[^*]+\*\*\s*[:：]/)) break;
        if (next.trim()) collected.push(next);
        else if (collected.length > 0) break;
      }
      if (collected.length > 0) return collected.join("\n").slice(0, SECTION_MAX_CHARS);
    }

    // Form 2: The vibe is **Secure, Technical, and Valuable**.
    const proseVibe = line.match(
      /(?:the\s+)?(?:vibe|mood|aesthetic|emotional\s+intent)\s+is\s+\*\*([^*]+)\*\*/i,
    );
    if (proseVibe) {
      return proseVibe[1].trim().replace(/\.\s*$/, "").slice(0, SECTION_MAX_CHARS);
    }
  }

  return null;
}

/**
 * Extract visual directive sections (multi-section, doesn't break on non-match).
 */
export function extractVisualDirectives(lines: string[]): string {
  const extracted: string[] = [];
  let inRelevantSection = false;

  for (const line of lines) {
    const sectionMatch = line.match(/^#{2,4}\s*(.+)/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim();
      inRelevantSection = headerMatches(sectionName, VISUAL_DIRECTIVE_SECTIONS);
      if (inRelevantSection) {
        extracted.push(`\n**${sectionName}**`);
      }
    } else if (inRelevantSection && line.trim()) {
      extracted.push(line);
    }
  }

  if (extracted.length > 0) {
    return extracted.join("\n").slice(0, DIRECTIVES_MAX_CHARS);
  }

  console.error(
    `[extractVisualDirectives] No matching sections found. Expected: ${VISUAL_DIRECTIVE_SECTIONS.join(", ")}`,
  );
  return "";
}

// --- Fuzzy matching helper ---

function fuzzyMatch(candidates: string[], input: string): boolean {
  const inputLower = input.toLowerCase();
  return candidates.some((c) => {
    const cLower = c.toLowerCase();
    return cLower.includes(inputLower) || inputLower.includes(cLower);
  });
}

// --- get_style ---

export interface StyleTokens {
  name: string;
  description: string;
  colors: string | null;
  mood: string | null;
  promptAdditions: string;
  negativePrompt: string | null;
  typography: string | null;
  reference: string | null;
}

export async function getStyleTokens(
  slug: string,
): Promise<StyleTokens | null> {
  if (!isValidDesignStyleSlug(slug)) return null;

  const [descriptions, prompt] = await Promise.all([
    loadDescriptions(),
    loadPrompt(slug),
  ]);

  const meta = descriptions.get(slug);
  const name = meta?.name || slugToName(slug);
  const description = meta?.description || "";
  const reference = meta?.sourceUrl ?? null;

  if (!prompt) {
    throw new Error(
      `Failed to read prompt for "${slug}": prompt file not found. Style metadata is available but prompt tokens cannot be extracted.`,
    );
  }

  const lines = prompt.split("\n");

  return {
    name,
    description,
    colors: extractSection(lines, SECTION_KEYWORDS.colors),
    mood: extractSection(lines, SECTION_KEYWORDS.mood)
      ?? extractInlinePattern(lines, [...SECTION_KEYWORDS.mood, "Intent"]),
    promptAdditions: extractVisualDirectives(lines),
    negativePrompt: extractSection(lines, SECTION_KEYWORDS.negativePrompt),
    typography: extractSection(lines, SECTION_KEYWORDS.typography),
    reference,
  };
}

// --- recommend_style ---

export interface StyleRecommendation {
  style: string;
  isDefault?: boolean;
  reasoning: string;
  alternatives: Array<{ style: string; note: string }>;
}

export async function recommendStyle(input: {
  brand?: string;
  objective: string;
  demographic: string;
  season?: string;
}): Promise<StyleRecommendation> {
  const descriptions = await loadDescriptions();

  const scored: Array<{
    slug: string;
    score: number;
    reasons: string[];
  }> = [];

  for (const slug of DESIGN_STYLE_SLUGS) {
    const chars = STYLE_CHARACTERISTICS[slug];
    if (!chars) continue;

    let score = 0;
    const reasons: string[] = [];

    if (input.objective && fuzzyMatch(chars.objectives, input.objective)) {
      score += 30;
      reasons.push(`Matches objective: ${input.objective}`);
    }

    if (
      input.demographic &&
      fuzzyMatch(chars.demographics, input.demographic)
    ) {
      score += 25;
      reasons.push(`Appeals to: ${input.demographic}`);
    }

    if (input.brand) {
      const brandLower = input.brand.toLowerCase();
      if (chars.moods.some((m) => brandLower.includes(m.toLowerCase()))) {
        score += 15;
        reasons.push("Brand aligns with style mood");
      }
      if (
        chars.industries.some((i) =>
          brandLower.includes(i.toLowerCase().replace(/_/g, " ")),
        )
      ) {
        score += 20;
        reasons.push("Brand matches industry");
      }
    }

    if (input.season && chars.seasons) {
      if (
        chars.seasons.some(
          (s) => s.toLowerCase() === input.season!.toLowerCase(),
        )
      ) {
        score += 5;
        reasons.push(`Seasonal fit: ${input.season}`);
      }
    }

    if (score > 0) {
      scored.push({ slug, score, reasons });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      style: "professional",
      isDefault: true,
      reasoning:
        "No strong matches found for the given criteria. Defaulting to professional — a versatile, broadly applicable style. Consider providing more specific brand keywords or objective.",
      alternatives: [
        { style: "saas", note: "Good default for tech/startup brands" },
        {
          style: "flat-design",
          note: "Clean and accessible for general audiences",
        },
      ],
    };
  }

  const top = scored[0];
  const topMeta = descriptions.get(top.slug);

  return {
    style: top.slug,
    reasoning: `${topMeta?.name || top.slug} (score: ${top.score}). ${top.reasons.join(". ")}.`,
    alternatives: scored.slice(1, 4).map((alt) => {
      const altMeta = descriptions.get(alt.slug);
      return {
        style: alt.slug,
        note: `${altMeta?.name || alt.slug} (score: ${alt.score}) — ${alt.reasons[0] || "partial match"}`,
      };
    }),
  };
}
