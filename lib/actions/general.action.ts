"use server";

import { db } from "@/firebase/admin";

// Groq models to try in order of capability & availability
const FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "mixtral-8x7b-32768",
];

// Returns true if the error is a transient overload/rate-limit that warrants a retry
function isOverloadError(error: any): boolean {
  const msg = (error?.message || String(error)).toLowerCase();
  return (
    msg.includes("overloaded") ||
    msg.includes("high demand") ||
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("try again later") ||
    msg.includes("resource exhausted")
  );
}

// Sleep helper
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Tries to generate feedback using a cascade of Groq models with retries via direct fetch
async function generateFeedbackWithFallback(prompt: string, system: string) {
  let lastError: any = null;

  for (const modelId of FALLBACK_MODELS) {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[createFeedback] Trying Groq model (direct fetch): ${modelId}, attempt: ${attempt + 1}`);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.QROQ_AI_API_KEY}`,
          },
          body: JSON.stringify({
            model: modelId,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `${system}\nYou MUST return a JSON object with the following schema:
{
  "totalScore": number (0-100),
  "categoryScores": [
    {
      "name": "Communication Skills" | "Technical Knowledge" | "Problem Solving" | "Cultural Fit" | "Confidence and Clarity",
      "score": number (0-100),
      "comment": "string explanation"
    }
  ], // Array of exactly 5 category scores
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "finalAssessment": "detailed string paragraph summarizing performance"
}`
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error("Empty response content from Groq");
        }

        console.log(`[createFeedback] Raw content received:`, content);
        const parsed = JSON.parse(content);

        // Basic validation of fields
        if (typeof parsed.totalScore !== "number" || !Array.isArray(parsed.categoryScores)) {
          throw new Error("Parsed JSON does not match required schema fields");
        }

        console.log(`[createFeedback] Success with Groq model: ${modelId}`);
        return { object: parsed };
      } catch (error: any) {
        lastError = error;
        console.error(`[createFeedback] Groq Model ${modelId} attempt ${attempt + 1} failed:`, error);
        
        if (isOverloadError(error) && attempt < maxRetries) {
          const wait = 2000 * Math.pow(2, attempt);
          console.log(`[createFeedback] Overloaded, waiting ${wait}ms before retry...`);
          await sleep(wait);
          continue; // retry same model
        }
        // Not an overload error, or exhausted retries → try next model
        break;
      }
    }
  }
  throw new Error(`Groq AI feedback generation failed. Last error: ${lastError?.message || String(lastError)}`);
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    if (!transcript || transcript.length === 0) {
      return { success: false, error: "Transcript is empty. Did the conversation start?" };
    }

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const prompt = `
You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.

Transcript:
${formattedTranscript}

Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
- **Communication Skills**: Clarity, articulation, structured responses.
- **Technical Knowledge**: Understanding of key concepts for the role.
- **Problem-Solving**: Ability to analyze problems and propose solutions.
- **Cultural & Role Fit**: Alignment with company values and job role.
- **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
    `;

    const system =
      "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories";

    const { object } = await generateFeedbackWithFallback(prompt, system);

    const feedback = {
      interviewId,
      userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;
    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error: any) {
    console.error("[createFeedback] Fatal error:", error);
    return { success: false, error: error?.message || String(error) };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db
  .collection("interviews")
  .doc(id)
  .get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  if (!interviewId || !userId) return null;

  const feedback = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (feedback.empty) return null;

  const feedbackDoc = feedback.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  let query = db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .limit(limit);

  if (userId) {
    query = query.where("userId", "!=", userId);
  }

  const interviews = await query.get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  if (!userId) return [];

  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}