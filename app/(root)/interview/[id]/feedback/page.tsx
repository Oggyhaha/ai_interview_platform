import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

// Locale-safe date formatter (no dayjs)
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: "UTC",
  });
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? "#523249" : pct >= 40 ? "#a0527e" : "#e0c0d4";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[#f7e2f0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm font-bold text-[#523249] w-12 text-right">{pct}/100</span>
    </div>
  );
}

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;

  // Fetch user + interview + feedback in parallel for speed
  const [user, interview] = await Promise.all([
    getCurrentUser(),
    getInterviewById(id),
  ]);

  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  const score = feedback?.totalScore ?? 0;
  const scoreColor = score >= 70 ? "#523249" : score >= 40 ? "#a0527e" : "#cc6eae";

  return (
    <section className="section-feedback">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold text-[#2d1a27]">
          <span className="capitalize">{interview.role}</span> Interview — Feedback
        </h1>
        <p className="text-[#9c6680]">Here's a detailed breakdown of your performance</p>
      </div>

      {/* Score + Date row */}
      <div className="flex flex-row flex-wrap justify-center gap-6">
        <div className="flex flex-row gap-2 items-center bg-[#fdf4f9] border border-[#f0dcea] px-5 py-2.5 rounded-full">
          <Image src="/star.svg" width={20} height={20} alt="score" />
          <p className="font-semibold text-[#2d1a27]">
            Overall Score:{" "}
            <span className="font-bold" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="text-[#9c6680] font-normal">/100</span>
          </p>
        </div>
        <div className="flex flex-row gap-2 items-center bg-[#fdf4f9] border border-[#f0dcea] px-5 py-2.5 rounded-full">
          <Image src="/calendar.svg" width={20} height={20} alt="date" />
          <p className="text-[#6b3f58]">{formatDate(feedback?.createdAt)}</p>
        </div>
      </div>

      <hr className="border-[#f0dcea]" />

      {/* Final Assessment */}
      <div className="bg-[#fdf4f9] border border-[#f0dcea] rounded-2xl p-6">
        <h3 className="text-[#523249] mb-3 text-lg">Overall Assessment</h3>
        <p className="text-[#3b2235] leading-relaxed">{feedback?.finalAssessment ?? "No assessment available."}</p>
      </div>

      {/* Category Breakdown */}
      <div className="flex flex-col gap-5">
        <h2 className="text-[#2d1a27]">Interview Breakdown</h2>
        <div className="grid gap-4">
          {feedback?.categoryScores?.map((category, index) => (
            <div
              key={index}
              className="bg-white border border-[#f0dcea] rounded-2xl p-5
                         shadow-[0_2px_12px_rgba(82,50,73,0.07)]
                         hover:shadow-[0_4px_20px_rgba(82,50,73,0.12)]
                         transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-[#2d1a27]">
                  {index + 1}. {category.name}
                </p>
              </div>
              <ScoreBar score={category.score} />
              <p className="text-[#6b3f58] mt-3 text-sm leading-relaxed">{category.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="flex flex-col gap-3 bg-white border border-[#f0dcea] rounded-2xl p-6 shadow-[0_2px_12px_rgba(82,50,73,0.06)]">
        <h3 className="text-[#523249]">✦ Strengths</h3>
        <ul className="space-y-2">
          {feedback?.strengths?.map((strength, index) => (
            <li key={index} className="flex items-start gap-2 text-[#3b2235]">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#523249] flex-shrink-0" />
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="flex flex-col gap-3 bg-white border border-[#f0dcea] rounded-2xl p-6 shadow-[0_2px_12px_rgba(82,50,73,0.06)]">
        <h3 className="text-[#a0527e]">Areas for Improvement</h3>
        <ul className="space-y-2">
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index} className="flex items-start gap-2 text-[#3b2235]">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#cc6eae] flex-shrink-0" />
              {area}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="buttons">
        <Button asChild className="btn-secondary flex-1">
          <Link href="/">Back to Dashboard</Link>
        </Button>
        <Button asChild className="btn-primary flex-1">
          <Link href={`/interview/${id}`}>Retake Interview</Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;