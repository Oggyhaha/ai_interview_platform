import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");
 
  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <p>{feedback?.finalAssessment}</p>

      {/* Category Scores Breakdown */}
      <div className="flex flex-col gap-4 bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-stone-100 shadow-sm">
        <h2 className="text-2xl font-bold text-stone-900">Performance Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {feedback?.categoryScores?.map((category, index) => (
            <div key={index} className="flex flex-col gap-2 p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-800">{category.name}</span>
                <span className="font-extrabold text-[#89023E]">{category.score}/100</span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#89023E] to-[#C70039] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, category.score))}%` }}
                />
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{category.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-stone-100 shadow-sm">
          <h3 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
            <span>✨</span> Key Strengths
          </h3>
          <ul className="flex flex-col gap-2">
            {feedback?.strengths?.map((strength, index) => (
              <li key={index} className="text-sm text-stone-700 list-none flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span> {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-stone-100 shadow-sm">
          <h3 className="text-xl font-bold text-rose-700 flex items-center gap-2">
            <span>🎯</span> Areas for Growth
          </h3>
          <ul className="flex flex-col gap-2">
            {feedback?.areasForImprovement?.map((area, index) => (
              <li key={index} className="text-sm text-stone-700 list-none flex items-start gap-2">
                <span className="text-rose-500 font-bold">↳</span> {area}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question-by-Question Model Answer Breakdown */}
      {feedback?.questionEvaluations && feedback.questionEvaluations.length > 0 && (
        <div className="flex flex-col gap-6 bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-stone-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Question Analysis & Model Answers</h2>
            <p className="text-xs text-stone-500 mt-1">Review ideal senior-level answers alongside your responses to improve your score on your next attempt.</p>
          </div>

          <div className="flex flex-col gap-6">
            {feedback.questionEvaluations.map((item, index) => (
              <div key={index} className="p-6 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-bold text-stone-900 text-base leading-snug">
                    <span className="text-[#89023E] mr-2">Q{index + 1}.</span> {item.question}
                  </h4>
                  <span className="shrink-0 text-xs font-bold px-3 py-1 bg-[#89023E]/10 text-[#89023E] rounded-full">
                    {item.score}/100
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-white rounded-xl border border-stone-200/60">
                    <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block mb-1">Your Response Summary</span>
                    <p className="text-stone-700 leading-relaxed">{item.candidateAnswer || "No direct answer recorded."}</p>
                  </div>

                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block mb-1">⭐ Ideal Model Answer</span>
                    <p className="text-emerald-950 font-medium leading-relaxed">{item.modelAnswer}</p>
                  </div>
                </div>

                {item.suggestion && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
                    <span className="font-bold">💡 Tip:</span> {item.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="buttons mt-4">
        <Button asChild className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            Back to Dashboard
          </Link>
        </Button>

        <Button asChild className="btn-primary flex-1">
          <Link href={`/interview/${id}`} className="flex w-full justify-center">
            Retake Interview
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;