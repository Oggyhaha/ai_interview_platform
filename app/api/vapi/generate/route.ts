import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();
  
  let args = body;
  let currentToolCallId = body.toolCallId;

  // Handle Vapi webhook nested structure
  if (body.message && body.message.type === 'tool-calls') {
    const toolCall = body.message.toolWithToolCallList?.[0]?.toolCall;
    if (toolCall) {
      args = toolCall.function.arguments;
      currentToolCallId = toolCall.id;
    }
  }

  const { type, role, level, techstack, amount, userid } = args;

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: JSON.parse(questions),
      userId: userid,
      finalized: true,
      coverImage: getInterviewCover(role || userid || "default"),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({
      results: [
        {
          toolCallId: currentToolCallId ?? "missing-toolCallId",
          result: { success: true },
        },
      ],
    });
  } catch (error: any) {
    console.error("Error:", error);
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