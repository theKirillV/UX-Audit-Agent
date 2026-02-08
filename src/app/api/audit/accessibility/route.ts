import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ACCESSIBILITY_SYSTEM_PROMPT,
  ACCESSIBILITY_USER_PROMPT,
  type AccessibilityResult,
} from "@/lib/prompts/accessibility";

const anthropic = new Anthropic();

function mediaType(url: string): "image/png" | "image/jpeg" | "image/webp" {
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function toImageBlock(url: string): Promise<Anthropic.Messages.ImageBlockParam> {
  // Local file (starts with /)
  if (url.startsWith("/")) {
    const filePath = path.join(process.cwd(), "public", url);
    const buffer = await readFile(filePath);
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType(url),
        data: buffer.toString("base64"),
      },
    };
  }

  // Remote URL
  return {
    type: "image",
    source: { type: "url", url },
  };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, imageUrls } = (await request.json()) as {
    projectId: string;
    imageUrls: string[];
  };

  if (!projectId || !imageUrls?.length) {
    return NextResponse.json(
      { error: "projectId and imageUrls are required" },
      { status: 400 }
    );
  }

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Create audit record
  const audit = await db.audit.create({
    data: {
      type: "accessibility",
      status: "processing",
      inputImages: imageUrls,
      projectId,
    },
  });

  try {
    const imageBlocks = await Promise.all(imageUrls.map(toImageBlock));

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: ACCESSIBILITY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: ACCESSIBILITY_USER_PROMPT },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Strip markdown code fences if present
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const result: AccessibilityResult = JSON.parse(jsonText);

    // Update audit with results
    await db.audit.update({
      where: { id: audit.id },
      data: {
        status: "complete",
        resultJson: JSON.parse(JSON.stringify(result)),
        score: result.score,
      },
    });

    return NextResponse.json({ auditId: audit.id, result });
  } catch (error) {
    await db.audit.update({
      where: { id: audit.id },
      data: { status: "error" },
    });

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Accessibility audit failed:", errMsg, error);
    return NextResponse.json(
      { error: `Audit failed: ${errMsg}` },
      { status: 500 }
    );
  }
}
