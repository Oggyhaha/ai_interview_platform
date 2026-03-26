// app/api/vapi/generate/route.ts

export const runtime = "nodejs"; // important: ensures Firebase Admin works later (not Edge)

export async function POST(request: Request) {
  // 1) Try to parse JSON body
  let payload: any;
  try {
    payload = await request.json();
  } catch (err: any) {
    console.error("VAPI: request body was not JSON:", err?.message);
    return Response.json(
      {
        results: [
          {
            toolCallId: "unknown",
            result: { ok: false, reason: "request body not JSON" },
          },
        ],
      },
      { status: 200 }
    );
  }

  // 2) Log what Vapi actually sent (check Vercel logs)
  console.log("VAPI RAW PAYLOAD:", JSON.stringify(payload));

  // 3) Extract tool call in a tolerant way
  const toolCall =
    payload?.message?.toolCallList?.[0] ??
    payload?.toolCallList?.[0] ??
    null;

  const toolCallId = toolCall?.id ?? toolCall?.toolCallId ?? "missing-tool-call-id";

  // 4) Return the exact shape Vapi expects
  const responseBody = {
    results: [
      {
        toolCallId,
        result: { ok: true },
      },
    ],
  };

  console.log("VAPI RESPONSE:", JSON.stringify(responseBody));

  return Response.json(responseBody, { status: 200 });
}

export async function GET() {
  return Response.json({ ok: true, route: "/api/vapi/generate" }, { status: 200 });
}