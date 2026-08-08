import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InteractiveInterviewGrid from "@/components/InteractiveInterviewGrid";
import JobDescriptionParser from "@/components/JobDescriptionParser";
import RAGKnowledgeBankSelector from "@/components/RAGKnowledgeBankSelector";
import { getInterviewCover } from "@/lib/utils";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getFeedbackByInterviewId,
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

// Helper to format date
function formatDate(dateStr?: string | null): string {
  const date = new Date(dateStr || "2024-01-01");
  if (isNaN(date.getTime())) return "Jan 1, 2024";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function Home() {
  const user = await getCurrentUser();

  const [rawUserInterviews, rawAllInterviews] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id! }),
  ]);

  // Format user's past interviews with feedback data
  const userInterviews = await Promise.all(
    (rawUserInterviews || []).map(async (interview) => {
      const feedback =
        user?.id && interview.id
          ? await getFeedbackByInterviewId({ interviewId: interview.id, userId: user.id })
          : null;

      return {
        id: interview.id,
        role: interview.role,
        type: /mix/gi.test(interview.type) ? "Mixed" : interview.type,
        techstack: interview.techstack || [],
        formattedDate: formatDate(feedback?.createdAt || interview.createdAt),
        scoreDisplay: feedback?.totalScore ? `${feedback.totalScore}/100` : "---/100",
        finalAssessment: feedback?.finalAssessment,
        coverImage: getInterviewCover(interview.id || interview.role),
        feedbackLink: feedback ? `/interview/${interview.id}/feedback` : `/interview/${interview.id}`,
        buttonText: feedback ? "Check Feedback" : "View Interview",
      };
    })
  );

  // Format available tracks
  const availableInterviews = (rawAllInterviews || []).map((interview) => ({
    id: interview.id,
    role: interview.role,
    type: /mix/gi.test(interview.type) ? "Mixed" : interview.type,
    techstack: interview.techstack || [],
    formattedDate: formatDate(interview.createdAt),
    scoreDisplay: "Practice Track",
    finalAssessment: "Practice session prepared by community engineers.",
    coverImage: getInterviewCover(interview.id || interview.role),
    feedbackLink: `/interview/${interview.id}`,
    buttonText: "Start Track",
  }));

  return (
    <div className="flex flex-col gap-10">
      {/* Hero CTA 3D Glassmorphic Card */}
      <section className="card-cta shadow-[0_20px_50px_rgba(137,2,62,0.12)]">
        <div className="flex flex-col gap-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#89023E]/10 text-[#89023E] rounded-full w-fit text-xs font-bold border border-[#89023E]/20">
            <span>✨</span> 3D Voice Interview Assistant
          </div>

          <h2 className="text-4xl font-extrabold text-stone-900 leading-tight">
            Get Interview-Ready with AI Voice Practice
          </h2>

          <p className="text-stone-600 text-base leading-relaxed">
            Experience real-time verbal technical interviews, Instant 3D feedback, and senior-level model answers.
          </p>

          <Button asChild className="btn-primary max-sm:w-full text-base py-6 shadow-xl shadow-[#89023E]/30">
            <Link href="/interview">Start New Voice Interview</Link>
          </Button>
        </div>

        <div className="relative w-80 h-80 max-sm:hidden animate-float">
          <Image
            src="/robot.png"
            alt="robo-dude"
            fill
            className="object-contain drop-shadow-[0_20px_35px_rgba(137,2,62,0.25)]"
            priority
          />
        </div>
      </section>

      {/* 1-Click Job Description / Resume Parser AI Component */}
      <JobDescriptionParser userId={user?.id} />

      {/* RAG Vector Knowledge Base (Corporate Question Banks) */}
      <RAGKnowledgeBankSelector userId={user?.id} />

      {/* 3D Block Container 1: Saved Generated Interviews */}
      <section className="card-3d-block flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Your Generated Interviews</h2>
            <p className="text-xs text-stone-500 mt-1">Review saved sessions and previous evaluation feedback</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-[#89023E]/10 text-[#89023E] rounded-full">
            {userInterviews.length} Sessions
          </span>
        </div>

        <InteractiveInterviewGrid
          interviews={userInterviews}
          emptyMessage="You haven't taken any mock interviews yet. Click 'Start New Voice Interview' above to generate one!"
        />
      </section>

      {/* 3D Block Container 2: Available Practice Tracks */}
      <section className="card-3d-block flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Available Practice Tracks</h2>
            <p className="text-xs text-stone-500 mt-1">Explore pre-configured tech stack interview sessions</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-stone-100 text-stone-700 rounded-full">
            {availableInterviews.length} Available
          </span>
        </div>

        <InteractiveInterviewGrid
          interviews={availableInterviews}
          emptyMessage="There are currently no community tracks available."
        />
      </section>
    </div>
  );
}

export default Home;