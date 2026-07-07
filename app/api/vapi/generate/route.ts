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
    // Strip markdown code fences if the model wraps the JSON
    const cleaned = raw.replace(/```(?:json)?\n?/gi, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fallback: extract quoted strings
    const matches = raw.match(/"([^"]+)"/g);
    if (matches) return matches.map((m) => m.replace(/^"|"$/g, ""));
  }
  return [raw]; // last resort: return raw as single question
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("[/api/vapi/generate] Raw body:", JSON.stringify(body, null, 2));

  // -------------------------------------------------------
  // Extract args + toolCallId from all known Vapi formats
  // -------------------------------------------------------
  let args: any = null;
  let currentToolCallId: string | undefined;

  // Format 1: Vapi server-tool webhook — body.message.type === "tool-calls"
  if (body?.message?.type === "tool-calls") {
    // toolWithToolCallList (older format)
    const toolCall1 = body.message.toolWithToolCallList?.[0]?.toolCall;
    // toolCallList (newer format)
    const toolCall2 = body.message.toolCallList?.[0];

    const toolCall = toolCall1 || toolCall2;
    if (toolCall) {
      args =
        typeof toolCall.function?.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function?.arguments;
      currentToolCallId = toolCall.id;
    }
  }

  // Format 2: Direct POST (HTTPie testing / manual calls)
  if (!args) {
    args = body;
    currentToolCallId = body.toolCallId;
  }

  console.log("[/api/vapi/generate] Extracted args:", args);
  console.log("[/api/vapi/generate] toolCallId:", currentToolCallId);

  const { type, role, level, techstack, amount, userid } = args ?? {};

  // Validate required fields
  if (!role || !type || !level || !techstack || !amount || !userid) {
    console.error("[/api/vapi/generate] Missing required fields:", {
      role, type, level, techstack, amount, userid,
    });
    return Response.json({
      results: [
        {
          toolCallId: currentToolCallId ?? "missing-toolCallId",
          result: {
            success: false,
            error: `Missing required fields: ${[
              !role && "role",
              !type && "type",
              !level && "level",
              !techstack && "techstack",
              !amount && "amount",
              !userid && "userid",
            ]
              .filter(Boolean)
              .join(", ")}`,
          },
        },
      ],
    });
  }

  try {
    console.log("[/api/vapi/generate] Generating questions for role:", role);

    const { text: rawQuestions } = await generateText({
      model: google("gemini-2.5-flash"),
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

    console.log("[/api/vapi/generate] Raw questions text:", rawQuestions);

    const parsedQuestions = parseQuestions(rawQuestions);
    const parsedTechstack = parseTechstack(techstack);

    console.log("[/api/vapi/generate] Parsed questions count:", parsedQuestions.length);

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

    console.log("[/api/vapi/generate] Saving interview to Firestore for userId:", userid);

    const docRef = await db.collection("interviews").add(interview);

    console.log("[/api/vapi/generate] Interview saved! Doc ID:", docRef.id);

    return Response.json({
      results: [
        {
          toolCallId: currentToolCallId ?? "missing-toolCallId",
          result: { success: true, interviewId: docRef.id },
        },
      ],
    });
  } catch (error: any) {
    console.error("[/api/vapi/generate] Error:", error);
    return Response.json({
      results: [
        {
          toolCallId: currentToolCallId ?? "missing-toolCallId",
          result: { success: false, error: error?.message ?? String(error) },
        },
      ],
    });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}