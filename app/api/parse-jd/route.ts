import { db } from "@/firebase/admin";
import { getInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobDescription, userId, n8nWebhookUrl } = body;

    if (!jobDescription || !userId) {
      return Response.json({ error: "Missing jobDescription or userId" }, { status: 400 });
    }

    // Default to provided n8n webhook URL or env var or direct fallback
    const targetUrl = n8nWebhookUrl || process.env.N8N_PARSER_WEBHOOK_URL;

    let parsedData: any = null;

    if (targetUrl) {
      console.log("[/api/parse-jd] Forwarding to n8n Webhook:", targetUrl);
      const n8nResponse = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, userId }),
      });

      if (n8nResponse.ok) {
        const raw = await n8nResponse.json();
        console.log("[/api/parse-jd] n8n response received:", raw);
        // Extract content if wrapped inside choices/message (Groq) or direct JSON
        parsedData = raw.output || raw.message?.content || raw.choices?.[0]?.message?.content || raw;
        if (typeof parsedData === "string") {
          try {
            parsedData = JSON.parse(parsedData);
          } catch {
            // fallback
          }
        }
      }
    }

    // Direct fallback if n8n is not URL-configured yet
    if (!parsedData || !parsedData.role) {
      console.log("[/api/parse-jd] Calling Groq directly (fallback)...");
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.QROQ_AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Analyze the provided Job Description and return ONLY a JSON object:
{
  "role": string (e.g. "Senior React Developer"),
  "level": "Junior" | "Mid" | "Senior",
  "type": "Technical" | "Behavioral" | "Mixed",
  "techstack": [string],
  "questions": [string] (array of 5 realistic interview questions for this JD)
}`
            },
            { role: "user", content: `Job Description:\n${jobDescription}` }
          ]
        })
      });

      const groqData = await groqResponse.json();
      const rawContent = groqData.choices?.[0]?.message?.content;
      if (rawContent) {
        parsedData = JSON.parse(rawContent);
      }
    }

    const { role = "Software Engineer", level = "Mid", type = "Mixed", techstack = ["General"], questions = [] } = parsedData || {};

    const interview = {
      role,
      level,
      type,
      techstack: Array.isArray(techstack) ? techstack : [techstack],
      questions: Array.isArray(questions) && questions.length > 0 ? questions : [
        `Can you describe your experience relevant to ${role}?`,
        `How do you approach learning and integrating new tech stack items like ${Array.isArray(techstack) ? techstack.join(", ") : techstack}?`,
        `Describe a challenging project you built and how you solved critical technical hurdles.`
      ],
      userId,
      finalized: true,
      coverImage: getInterviewCover(role),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interview);

    return Response.json({ success: true, interviewId: docRef.id });
  } catch (error: any) {
    console.error("[/api/parse-jd] Error:", error);
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
