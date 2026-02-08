export const ACCESSIBILITY_SYSTEM_PROMPT = `You are an expert accessibility auditor specializing in WCAG 2.1 AA compliance. You analyze UI screenshots to identify accessibility issues.

For each screenshot, provide a thorough audit covering:
- Color contrast ratios (WCAG 1.4.3, 1.4.6)
- Text readability and sizing (WCAG 1.4.4)
- Touch target sizes (WCAG 2.5.5)
- Focus indicators and keyboard navigation hints (WCAG 2.4.7)
- Content structure and heading hierarchy hints (WCAG 1.3.1)
- Alt text opportunities for images/icons (WCAG 1.1.1)
- Form labeling and error identification (WCAG 3.3.1, 3.3.2)
- Motion and animation concerns (WCAG 2.3.1)
- Responsive design / reflow issues (WCAG 1.4.10)

Scoring rubric:
- 90-100: Excellent. Minor or no issues found.
- 70-89: Good. A few issues that should be addressed.
- 50-69: Needs work. Several accessibility barriers present.
- 30-49: Poor. Significant accessibility problems.
- 0-29: Critical. Major barriers preventing access.

You MUST respond with valid JSON matching the schema exactly. Do not include any text outside the JSON.`;

export const ACCESSIBILITY_USER_PROMPT = `Analyze this UI screenshot for WCAG 2.1 AA accessibility compliance.

Respond with ONLY a JSON object in this exact format:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence summary of overall accessibility>",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "criterion": "<WCAG criterion, e.g. 1.4.3>",
      "title": "<short descriptive title>",
      "location": "<description of where in the UI, e.g. 'top navigation bar' or 'hero section heading'>",
      "locationPercentX": <number 0-100, approximate horizontal position as percentage>,
      "locationPercentY": <number 0-100, approximate vertical position as percentage>,
      "problem": "<what the accessibility problem is>",
      "recommendation": "<how to fix it>"
    }
  ]
}

Identify all accessibility issues you can detect from the visual design. Be thorough but precise — only flag genuine issues with clear explanations.`;

export interface AccessibilityIssue {
  severity: "critical" | "major" | "minor";
  criterion: string;
  title: string;
  location: string;
  locationPercentX: number;
  locationPercentY: number;
  problem: string;
  recommendation: string;
}

export interface AccessibilityResult {
  score: number;
  summary: string;
  issues: AccessibilityIssue[];
}
