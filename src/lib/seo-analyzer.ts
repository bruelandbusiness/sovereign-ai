export interface SeoAnalysis {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  checks: SeoCheck[];
  suggestions: string[];
}

export interface SeoCheck {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
}

interface SeoInput {
  title: string;
  description: string;
  body: string;
  targetKeyword?: string;
  url: string;
  hasCanonical: boolean;
  hasOgImage: boolean;
  hasJsonLd: boolean;
  internalLinks: number;
  externalLinks: number;
  headingStructure: string[]; // ["h1", "h2", "h2", "h3", ...]
  wordCount: number;
  images: { alt: string; src: string }[];
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function checkTitleLength(title: string): SeoCheck {
  const len = title.length;
  const maxScore = 10;
  let score: number;
  let detail: string;

  if (len >= 50 && len <= 60) {
    score = maxScore;
    detail = `Title length is ${len} characters (ideal range: 50-60).`;
  } else if (len >= 40 && len <= 70) {
    score = Math.round(maxScore * 0.7);
    detail = `Title length is ${len} characters (acceptable, but 50-60 is ideal).`;
  } else if (len > 0 && len < 40) {
    score = Math.round(maxScore * 0.4);
    detail = `Title is too short at ${len} characters. Aim for 50-60 characters.`;
  } else if (len > 70) {
    score = Math.round(maxScore * 0.3);
    detail = `Title is too long at ${len} characters and may be truncated in SERPs. Aim for 50-60 characters.`;
  } else {
    score = 0;
    detail = "Title is missing.";
  }

  return { name: "Title Length", passed: score >= maxScore * 0.7, score, maxScore, detail };
}

function checkDescriptionLength(description: string): SeoCheck {
  const len = description.length;
  const maxScore = 10;
  let score: number;
  let detail: string;

  if (len >= 150 && len <= 160) {
    score = maxScore;
    detail = `Meta description length is ${len} characters (ideal range: 150-160).`;
  } else if (len >= 120 && len <= 170) {
    score = Math.round(maxScore * 0.7);
    detail = `Meta description length is ${len} characters (acceptable, but 150-160 is ideal).`;
  } else if (len > 0 && len < 120) {
    score = Math.round(maxScore * 0.4);
    detail = `Meta description is too short at ${len} characters. Aim for 150-160 characters.`;
  } else if (len > 170) {
    score = Math.round(maxScore * 0.3);
    detail = `Meta description is too long at ${len} characters and may be truncated. Aim for 150-160 characters.`;
  } else {
    score = 0;
    detail = "Meta description is missing.";
  }

  return { name: "Description Length", passed: score >= maxScore * 0.7, score, maxScore, detail };
}

function checkWordCount(wordCount: number): SeoCheck {
  const maxScore = 10;
  let score: number;
  let detail: string;

  if (wordCount >= 1500) {
    score = maxScore;
    detail = `Word count is ${wordCount} (excellent depth for SEO).`;
  } else if (wordCount >= 800) {
    score = Math.round(maxScore * 0.8);
    detail = `Word count is ${wordCount} (good, but 1500+ words tend to rank better).`;
  } else if (wordCount >= 300) {
    score = Math.round(maxScore * 0.5);
    detail = `Word count is ${wordCount}. Blog posts should be at least 800 words for SEO value.`;
  } else {
    score = Math.round(maxScore * 0.2);
    detail = `Word count is only ${wordCount}. Content is too thin for meaningful search ranking.`;
  }

  return { name: "Word Count", passed: wordCount >= 800, score, maxScore, detail };
}

function checkKeywordUsage(content: SeoInput): SeoCheck {
  const maxScore = 15;
  const keyword = content.targetKeyword;

  if (!keyword) {
    return {
      name: "Keyword Usage",
      passed: false,
      score: 0,
      maxScore,
      detail: "No target keyword specified. Provide a target keyword for keyword analysis.",
    };
  }

  const kw = keyword.toLowerCase();
  const titleHasKeyword = content.title.toLowerCase().includes(kw);
  const descHasKeyword = content.description.toLowerCase().includes(kw);
  const firstParagraph = content.body.slice(0, 500).toLowerCase();
  const bodyHasKeywordEarly = firstParagraph.includes(kw);

  let score = 0;
  const parts: string[] = [];

  if (titleHasKeyword) {
    score += 5;
    parts.push("title");
  }
  if (descHasKeyword) {
    score += 5;
    parts.push("meta description");
  }
  if (bodyHasKeywordEarly) {
    score += 5;
    parts.push("first paragraph");
  }

  const present = parts.length > 0 ? `Found in: ${parts.join(", ")}.` : "";
  const missing: string[] = [];
  if (!titleHasKeyword) missing.push("title");
  if (!descHasKeyword) missing.push("meta description");
  if (!bodyHasKeywordEarly) missing.push("first paragraph");
  const absent = missing.length > 0 ? ` Missing from: ${missing.join(", ")}.` : "";

  return {
    name: "Keyword Usage",
    passed: score >= 10,
    score,
    maxScore,
    detail: `Target keyword "${keyword}". ${present}${absent}`.trim(),
  };
}

function checkHeadingStructure(headings: string[]): SeoCheck {
  const maxScore = 10;
  let score = maxScore;
  const issues: string[] = [];

  const h1Count = headings.filter((h) => h === "h1").length;
  if (h1Count === 0) {
    score -= 5;
    issues.push("No H1 tag found.");
  } else if (h1Count > 1) {
    score -= 3;
    issues.push(`Found ${h1Count} H1 tags; there should be exactly one.`);
  }

  // Check for proper nesting (no skipping levels, e.g. h1 -> h3 without h2)
  for (let i = 1; i < headings.length; i++) {
    const prevLevel = parseInt(headings[i - 1].replace("h", ""), 10);
    const currLevel = parseInt(headings[i].replace("h", ""), 10);
    if (currLevel > prevLevel + 1) {
      score -= 2;
      issues.push(`Heading level skipped: ${headings[i - 1].toUpperCase()} followed by ${headings[i].toUpperCase()}.`);
      break; // Only penalize once for nesting issues
    }
  }

  if (headings.length < 3) {
    score -= 2;
    issues.push("Very few headings. Use more subheadings to structure your content.");
  }

  score = Math.max(0, score);
  const detail =
    issues.length > 0
      ? issues.join(" ")
      : "Heading structure is well-organized with a single H1 and proper nesting.";

  return { name: "Heading Structure", passed: score >= maxScore * 0.7, score, maxScore, detail };
}

function checkImageAltText(images: { alt: string; src: string }[]): SeoCheck {
  const maxScore = 8;

  if (images.length === 0) {
    return {
      name: "Image Alt Text",
      passed: false,
      score: Math.round(maxScore * 0.3),
      maxScore,
      detail: "No images found. Consider adding relevant images to enhance content.",
    };
  }

  const missingAlt = images.filter((img) => !img.alt || img.alt.trim().length === 0);
  const ratio = (images.length - missingAlt.length) / images.length;
  const score = Math.round(maxScore * ratio);

  let detail: string;
  if (missingAlt.length === 0) {
    detail = `All ${images.length} image(s) have alt text.`;
  } else {
    detail = `${missingAlt.length} of ${images.length} image(s) missing alt text: ${missingAlt
      .map((img) => img.src)
      .slice(0, 3)
      .join(", ")}${missingAlt.length > 3 ? "..." : ""}.`;
  }

  return { name: "Image Alt Text", passed: missingAlt.length === 0, score, maxScore, detail };
}

function checkInternalLinks(count: number): SeoCheck {
  const maxScore = 7;
  let score: number;
  let detail: string;

  if (count >= 3) {
    score = maxScore;
    detail = `${count} internal link(s) found (good for site structure and crawlability).`;
  } else if (count >= 2) {
    score = Math.round(maxScore * 0.8);
    detail = `${count} internal link(s) found. Consider adding more to strengthen site structure.`;
  } else if (count === 1) {
    score = Math.round(maxScore * 0.5);
    detail = "Only 1 internal link found. Aim for at least 2-3 internal links.";
  } else {
    score = 0;
    detail = "No internal links found. Add internal links to improve crawlability and user navigation.";
  }

  return { name: "Internal Links", passed: count >= 2, score, maxScore, detail };
}

function checkExternalLinks(count: number): SeoCheck {
  const maxScore = 5;
  let score: number;
  let detail: string;

  if (count >= 2) {
    score = maxScore;
    detail = `${count} external link(s) found (establishes topical authority).`;
  } else if (count === 1) {
    score = Math.round(maxScore * 0.8);
    detail = "1 external link found. Consider adding another authoritative reference.";
  } else {
    score = 0;
    detail = "No external links found. Link to authoritative sources to build trust and topical relevance.";
  }

  return { name: "External Links", passed: count >= 1, score, maxScore, detail };
}

function checkCanonical(hasCanonical: boolean): SeoCheck {
  const maxScore = 5;
  return {
    name: "Canonical URL",
    passed: hasCanonical,
    score: hasCanonical ? maxScore : 0,
    maxScore,
    detail: hasCanonical
      ? "Canonical URL is set, preventing duplicate content issues."
      : "No canonical URL found. Set a canonical tag to avoid duplicate content issues.",
  };
}

function checkOgImage(hasOgImage: boolean): SeoCheck {
  const maxScore = 5;
  return {
    name: "Open Graph Image",
    passed: hasOgImage,
    score: hasOgImage ? maxScore : 0,
    maxScore,
    detail: hasOgImage
      ? "Open Graph image is set for social sharing."
      : "No Open Graph image found. Add an og:image for better social media previews.",
  };
}

function checkJsonLd(hasJsonLd: boolean): SeoCheck {
  const maxScore = 8;
  return {
    name: "JSON-LD Structured Data",
    passed: hasJsonLd,
    score: hasJsonLd ? maxScore : 0,
    maxScore,
    detail: hasJsonLd
      ? "JSON-LD structured data is present, enabling rich search results."
      : "No JSON-LD structured data found. Add schema markup to qualify for rich snippets.",
  };
}

function checkUrlSeoFriendly(url: string): SeoCheck {
  const maxScore = 7;
  const issues: string[] = [];

  try {
    const parsed = new URL(url, "https://placeholder.com");
    const path = parsed.pathname;

    if (path !== path.toLowerCase()) {
      issues.push("URL contains uppercase characters.");
    }
    if (/_/.test(path)) {
      issues.push("URL uses underscores; prefer hyphens.");
    }
    if (/[^a-z0-9\-/.]/.test(path.toLowerCase())) {
      issues.push("URL contains special characters.");
    }
    if (path.length > 75) {
      issues.push("URL path is very long; consider shortening.");
    }
    if (/\/\//.test(path.slice(1))) {
      issues.push("URL contains consecutive slashes.");
    }
  } catch {
    issues.push("URL could not be parsed.");
  }

  const deductions = Math.min(maxScore, issues.length * 2);
  const score = Math.max(0, maxScore - deductions);
  const detail =
    issues.length > 0
      ? `URL issues: ${issues.join(" ")}`
      : "URL is SEO-friendly (lowercase, hyphenated, no special characters).";

  return { name: "SEO-Friendly URL", passed: issues.length === 0, score, maxScore, detail };
}

export function analyzeSeo(content: SeoInput): SeoAnalysis {
  const checks: SeoCheck[] = [
    checkTitleLength(content.title),
    checkDescriptionLength(content.description),
    checkWordCount(content.wordCount),
    checkKeywordUsage(content),
    checkHeadingStructure(content.headingStructure),
    checkImageAltText(content.images),
    checkInternalLinks(content.internalLinks),
    checkExternalLinks(content.externalLinks),
    checkCanonical(content.hasCanonical),
    checkOgImage(content.hasOgImage),
    checkJsonLd(content.hasJsonLd),
    checkUrlSeoFriendly(content.url),
  ];

  const totalMaxScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const score = Math.round((totalScore / totalMaxScore) * 100);
  const grade = scoreToGrade(score);

  const suggestions: string[] = checks
    .filter((c) => !c.passed)
    .map((c) => {
      switch (c.name) {
        case "Title Length":
          return "Adjust your title to be between 50-60 characters for optimal SERP display.";
        case "Description Length":
          return "Write a meta description of 150-160 characters that includes your target keyword and a compelling call to action.";
        case "Word Count":
          return "Expand your content to at least 800 words. Long-form content (1500+) tends to rank higher for competitive terms.";
        case "Keyword Usage":
          return "Include your target keyword in the title, meta description, and within the first 150 words of your content.";
        case "Heading Structure":
          return "Use a single H1 tag and organize subheadings (H2, H3) in a logical hierarchy without skipping levels.";
        case "Image Alt Text":
          return "Add descriptive alt text to all images. Include the target keyword naturally where relevant.";
        case "Internal Links":
          return "Add at least 2-3 internal links to related pages on your site to improve crawlability and distribute page authority.";
        case "External Links":
          return "Link to at least one authoritative external source to demonstrate topical expertise and build trust.";
        case "Canonical URL":
          return "Set a canonical URL to prevent duplicate content issues and consolidate ranking signals.";
        case "Open Graph Image":
          return "Add an og:image meta tag with a compelling 1200x630px image for social media sharing.";
        case "JSON-LD Structured Data":
          return "Add JSON-LD structured data (e.g., Article, BlogPosting) to enable rich snippets in search results.";
        case "SEO-Friendly URL":
          return "Use lowercase letters, hyphens instead of underscores, and avoid special characters in your URL.";
        default:
          return c.detail;
      }
    });

  return { score, grade, checks, suggestions };
}
