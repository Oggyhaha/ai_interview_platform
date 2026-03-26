import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Vapi sends: { message: { type: "tool-calls", toolCallList: [...] } }
    const toolCall = payload?.message?.toolCallList?.[0];

    if (!toolCall) {
      return Response.json(
        { error: "Missing toolCallList in request payload" },
        { status: 400 }
      );
    }

    // toolCallId is REQUIRED in the response
    const toolCallId = toolCall.id || toolCall.toolCallId;

    const args =
      toolCall.function?.arguments ??
      toolCall.arguments ??
      toolCall.function?.parameters ??
      {};

    // Sometimes arguments come as a JSON string
    const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;

    const { type, role, level, techstack, amount, userid } = parsedArgs;

    // Validate required fields
    const missing = ["type", "role", "level", "techstack", "amount", "userid"].filter(
      (k) => parsedArgs?.[k] === undefined || parsedArgs?.[k] === null || parsedArgs?.[k] === ""
    );

    if (missing.length) {
      return Response.json(
        {
          results: [
            {
              toolCallId,
              result: { success: false, message: `Missing fields: ${missing.join(", ")}` },
            },
          ],
        },
        { status: 200 }
      );
    }

    const prompt = `Return ONLY valid JSON. No markdown. No extra text.
Output must be a JSON array of strings.
Prepare questions for a job interview.
The job role is ${role}.
The job experience level is ${level}.
The tech stack used in the job is: ${techstack}.
The focus between behavioural and technical questions should lean towards: ${type}.
The amount of questions required is: ${amount}.
Do not use slash or asterisk or other special characters.`;

    const { text: questionsRaw } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    let questions: string[];
    try {
      questions = JSON.parse(questionsRaw);
      if (!Array.isArray(questions)) throw new Error("Questions output is not an array");
    } catch {
      // fallback: still save something rather than failing silently
      questions = questionsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
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

    // ✅ Vapi-expected response shape
    return Response.json(
      {
        results: [
          {
            toolCallId,
            result: { success: true, interviewId: docRef.id },
          },
        ],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in /api/vapi/generate:", error);

    // If we can't read toolCallId, still return a 500
    return Response.json(
      { error: error?.message ?? "Unknown error", stack: error?.stack },
      { status: 500 }
    );
  }
}