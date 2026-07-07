import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getInterviewCover } from "@/lib/utils";

// Safely parse techstack whether it arrives as a string or array from Vapi
function parseTechstack(techstack: string | string[]): string[] {
  if (Array.isArray(techstack)) return techstack;
  return techstack.split(",").map((t) => t.trim()).filter(Boolean);
}

// Safely parse questions JSON — strips markdown fences if present
function parseQuestions(raw: string): string[] {
  try {
    const cleaned = raw.replace(/```(?:json)?\n?/gi, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    const matches = raw.match(/"([^"]+)"/g);
    if (matches) return matches.map((m) => m.replace(/^"|"$/g, ""));
  }
  return [raw];
}

// ─── Extract args + toolCallId from ALL known Vapi body shapes ────────────────
function extractFromBody(body: any): { args: any; toolCallId: string } {
  let args: any = null;
  let toolCallId = "missing-id";

  console.log("[vapi/generate] Body keys:", Object.keys(body || {}));
  console.log("[vapi/generate] body.message?.type:", body?.message?.type);

  // ── Shape 1: Vapi server webhook — message.type === "tool-calls" ──────────
  if (body?.message?.type === "tool-calls") {
    // Newer: toolCallList[]
    const tc1 = body.message.toolCallList?.[0];
    // Older: toolWithToolCallList[]
    const tc2 = body.message.toolWithToolCallList?.[0]?.toolCall;

    const tc = tc1 || tc2;
    if (tc) {
      toolCallId = tc.id || toolCallId;
      args =
        typeof tc.function?.arguments === "string"
          ? JSON.parse(tc.function.arguments)
          : tc.function?.arguments ?? tc.arguments ?? null;
      console.log("[vapi/generate] Shape 1 (tool-calls) args:", args, "tcId:", toolCallId);
      return { args, toolCallId };
    }
  }

  // ── Shape 2: Vapi inline function tool call (no message wrapper) ──────────
  // Body is directly: { id, type, function: { name, arguments } }
  if (body?.function?.name === "generate_interview") {
    toolCallId = body.id || toolCallId;
    args =
      typeof body.function.arguments === "string"
        ? JSON.parse(body.function.arguments)
        : body.function.arguments;
    console.log("[vapi/generate] Shape 2 (inline function) args:", args, "tcId:", toolCallId);
    return { args, toolCallId };
  }

  // ── Shape 3: Flat direct POST (testing / manual) ──────────────────────────
  // Body is: { role, type, level, techstack, amount, userid }
  if (body?.role && body?.userid) {
    args = body;
    toolCallId = body.toolCallId || toolCallId;
    console.log("[vapi/generate] Shape 3 (flat direct) args:", args);
    return { args, toolCallId };
  }

  // ── Shape 4: Nested under results / data (some Vapi versions) ─────────────
  const nested = body?.data || body?.payload || body?.toolCall;
  if (nested) {
    args =
      typeof nested.function?.arguments === "string"
        ? JSON.parse(nested.function.arguments)
        : nested.function?.arguments ?? nested;
    toolCallId = nested.id || toolCallId;
    console.log("[vapi/generate] Shape 4 (nested) args:", args);
    return { args, toolCallId };
  }

  console.warn("[vapi/generate] Could not extract args — full body:", JSON.stringify(body, null, 2));
  return { args: body, toolCallId };
}
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("[vapi/generate] ── INCOMING REQUEST ──────────────────────");
  console.log("[vapi/generate] Full body:", JSON.stringify(body, null, 2));

  const { args, toolCallId } = extractFromBody(body);

  console.log("[vapi/generate] Final args:", JSON.stringify(args));
  console.log("[vapi/generate] toolCallId:", toolCallId);

  const { type, role, level, techstack, amount, userid } = args ?? {};

  // ── Validate ──────────────────────────────────────────────────────────────
  const missing = [
    !role && "role",
    !type && "type",
    !level && "level",
    !techstack && "techstack",
    !amount && "amount",
    !userid && "userid",
  ].filter(Boolean);

  if (missing.length > 0) {
    console.error("[vapi/generate] Missing fields:", missing);
    return Response.json({
      results: [
        {
          toolCallId,
          result: {
            success: false,
            error: `Missing required fields: ${missing.join(", ")}`,
          },
        },
      ],
    });
  }

  // ── Generate questions ────────────────────────────────────────────────────
  try {
    console.log("[vapi/generate] Generating questions for:", { role, type, level, techstack, amount, userid });

    const { text: rawQuestions } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt: `Prepare questions for a job interview.
The job role is ${role}.
The job experience level is ${level}.
The tech stack used in the job is: ${Array.isArray(techstack) ? techstack.join(", ") : techstack}.
The focus between behavioural and technical questions should lean towards: ${type}.
The amount of questions required is: ${amount}.
Please return ONLY a valid JSON array of question strings, no markdown, no extra text.
Format: ["Question 1", "Question 2", "Question 3"]
The questions will be read by a voice assistant so avoid special characters like / * [ ] that break TTS.`,
    });

    console.log("[vapi/generate] Raw questions:", rawQuestions);

    const parsedQuestions = parseQuestions(rawQuestions);
    const parsedTechstack = parseTechstack(techstack);

    console.log("[vapi/generate] Parsed question count:", parsedQuestions.length);

    const interview = {
      role,
      type,
      level,
      techstack: parsedTechstack,
      questions: parsedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getInterviewCover(role || userid || "default"),
      createdAt: new Date().toISOString(),
    };

    console.log("[vapi/generate] Saving to Firestore, userId:", userid);

    const docRef = await db.collection("interviews").add(interview);

    console.log("[vapi/generate] ✓ Saved! interviewId:", docRef.id);

    return Response.json({
      results: [
        {
          toolCallId,
          result: { success: true, interviewId: docRef.id },
        },
      ],
    });
  } catch (error: any) {
    console.error("[vapi/generate] ✗ Error:", error?.message, error);
    return Response.json({
      results: [
        {
          toolCallId,
          result: {
            success: false,
            error: error?.message ?? String(error),
          },
        },
      ],
    });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "PrepYou generate endpoint is live." }, { status: 200 });
}