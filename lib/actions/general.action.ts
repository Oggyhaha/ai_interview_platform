"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

// Models to try in order if previous one is overloaded
const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",   // primary — fastest + cheapest
  "gemini-2.5-flash",        // fallback 1
  "gemini-1.5-flash",        // fallback 2
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

// Tries to generate feedback using a cascade of models with retries
async function generateFeedbackWithFallback(prompt: string, system: string) {
  for (const modelId of FALLBACK_MODELS) {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[createFeedback] Trying model: ${modelId}, attempt: ${attempt + 1}`);
        const result = await generateObject({
          model: google(modelId),
          schema: feedbackSchema,
          prompt,
          system,
        });
        console.log(`[createFeedback] Success with model: ${modelId}`);
        return result;
      } catch (error: any) {
        console.error(`[createFeedback] Model ${modelId} attempt ${attempt + 1} failed:`, error?.message);
        if (isOverloadError(error) && attempt < maxRetries) {
          // Exponential backoff: 2s, 4s
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
  throw new Error("All AI models are currently overloaded. Please try again in a minute.");
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
  const doc = await db.collection("interviews").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Interview;
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
  const { userId, limit = 6 } = params; // limit to 6 for home page performance

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
    // Strip heavy questions array — not needed on home page cards
    questions: undefined,
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
    .limit(10) // cap at 10 for home page
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    questions: undefined, // strip heavy array from list view
  })) as Interview[];
}