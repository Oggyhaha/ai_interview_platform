import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body not JSON" }, { status: 400 });
  }

  const toolCall = payload?.message?.toolCallList?.[0];
  const toolCallId = toolCall?.id;

  if (!toolCallId) {
    return Response.json(
      { error: "Missing toolCallId", received: payload },
      { status: 400 }
    );
  }

  // Parse args from Vapi tool call
  let args: any = toolCall?.function?.arguments ?? {};
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      return Response.json(
        { results: [{ toolCallId, result: { success: false, message: "Invalid JSON arguments" } }] },
        { status: 200 }
      );
    }
  }

  const { type, role, level, techstack, amount, userid } = args;

  // Validate required fields
  const missing = ["type", "role", "level", "techstack", "amount", "userid"].filter(
    (k) => args?.[k] === undefined || args?.[k] === null || args?.[k] === ""
  );
  if (missing.length) {
    return Response.json(
      { results: [{ toolCallId, result: { success: false, message: `Missing: ${missing.join(", ")}` } }] },
      { status: 200 }
    );
  }

  try {
    const { text: questionsText } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Return ONLY valid JSON. No markdown. No extra text.
Output must be a JSON array of strings.

Prepare questions for a job interview.
Role: ${role}
Experience level: ${level}
Tech stack: ${techstack}
Focus: ${type}
Number of questions: ${amount}`,
    });

    let questions: string[];
    try {
      questions = JSON.parse(questionsText);
      if (!Array.isArray(questions)) throw new Error("Questions is not an array");
    } catch {
      return Response.json(
        { results: [{ toolCallId, result: { success: false, message: "Model returned invalid JSON", raw: questionsText } }] },
        { status: 200 }
      );
    }

    const interview = {
      role,
      type,
      level,
      techstack: String(techstack)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interview);

    // ✅ Correct Vapi tool response
    return Response.json(
      { results: [{ toolCallId, result: { success: true, interviewId: docRef.id } }] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error:", error);

    // ✅ Even on error, still respond with results[] so Vapi doesn't show "No result returned"
    return Response.json(
      {
        results: [
          {
            toolCallId,
            result: {
              success: false,
              message: error?.message ?? "Unknown error",
            },
          },
        ],
      },
      { status: 200 }
    );
  }
}