import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

type VapiToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string | Record<string, any>;
  };
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Expecting Vapi "tool-calls" webhook payload
    const toolCall: VapiToolCall | undefined = payload?.message?.toolCallList?.[0];

    // If someone hits this endpoint manually (browser/postman) you’ll get this helpful error
    if (!toolCall?.id) {
      return Response.json(
        {
          error: "Invalid Vapi tool-calls payload",
          expected: {
            message: { type: "tool-calls", toolCallList: [{ id: "...", function: { arguments: "{...}" } }] },
          },
          received: payload,
        },
        { status: 400 }
      );
    }

    const toolCallId = toolCall.id;

    // Parse arguments (Vapi usually sends them as a JSON string)
    let args: any = toolCall.function?.arguments ?? {};
    if (typeof args === "string") {
      try {
        args = JSON.parse(args);
      } catch (e: any) {
        return Response.json(
          {
            results: [
              {
                toolCallId,
                result: { success: false, message: "Tool arguments were not valid JSON." },
              },
            ],
          },
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
        {
          results: [
            {
              toolCallId,
              result: {
                success: false,
                message: `Missing required fields: ${missing.join(", ")}`,
              },
            },
          ],
        },
        { status: 200 }
      );
    }

    // Strongly force JSON-only output for reliable JSON.parse
    const prompt = `Return ONLY valid JSON. No markdown. No extra text.
Output must be a JSON array of strings.

Prepare questions for a job interview.
Role: ${role}
Experience level: ${level}
Tech stack: ${techstack}
Focus: ${type}
Number of questions: ${amount}

Do not use special characters like slash or asterisk.`;

    const { text: questionsRaw } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    let questions: string[];
    try {
      questions = JSON.parse(questionsRaw);
      if (!Array.isArray(questions)) throw new Error("Questions output is not an array");
      // ensure strings
      questions = questions.map((q) => String(q));
    } catch (e: any) {
      // If Gemini output isn't valid JSON, return a failure to Vapi (so it can retry)
      return Response.json(
        {
          results: [
            {
              toolCallId,
              result: {
                success: false,
                message: "Model did not return valid JSON array of questions.",
                raw: questionsRaw,
              },
            },
          ],
        },
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

    // ✅ Correct Vapi tool response format
    return Response.json(
      {
        results: [
          {
            toolCallId,
            result: {
              success: true,
              interviewId: docRef.id,
            },
          },
        ],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in /api/vapi/generate:", error);

    // If we don't have a toolCallId due to early failure, return 500
    return Response.json(
      {
        error: error?.message ?? "Unknown error",
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}