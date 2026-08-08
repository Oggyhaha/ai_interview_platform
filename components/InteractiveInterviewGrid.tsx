"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface InteractiveCardProps {
  id: string;
  role: string;
  type: string;
  techstack: string[];
  formattedDate: string;
  scoreDisplay: string;
  finalAssessment?: string;
  coverImage: string;
  feedbackLink: string;
  buttonText: string;
}

export default function InteractiveInterviewGrid({
  interviews,
  emptyMessage,
}: {
  interviews: InteractiveCardProps[];
  emptyMessage: string;
}) {
  const [disappearingIds, setDisappearingIds] = useState<Record<string, boolean>>({});

  const handleCardHover = (role: string) => {
    window.dispatchEvent(
      new CustomEvent("prepyou-card-hover", {
        detail: { title: `${role} Interview` },
      })
    );
  };

  const handleCardClick = (id: string, role: string) => {
    window.dispatchEvent(
      new CustomEvent("prepyou-card-click", {
        detail: {
          message: `Ok, let's click here so that your ${role} interview starts very soon!`,
        },
      })
    );

    // Trigger 3D shrink & vanish animation
    setDisappearingIds((prev) => ({ ...prev, [id]: true }));
  };

  if (!interviews || interviews.length === 0) {
    return (
      <div className="p-8 text-center text-stone-500 bg-white/50 rounded-2xl border border-stone-200/50">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="interviews-section">
      {interviews.map((item) => {
        const isVanishing = disappearingIds[item.id];

        return (
          <div
            key={item.id}
            onMouseEnter={() => handleCardHover(item.role)}
            onClick={() => handleCardClick(item.id, item.role)}
            className={`card-border w-[360px] max-sm:w-full min-h-96 transition-all duration-500 transform-gpu ${
              isVanishing ? "scale-0 rotate-12 opacity-0 -translate-y-8" : "scale-100 hover:scale-[1.02]"
            }`}
          >
            <div className="card-interview flex flex-col justify-between">
              <div>
                <div className="absolute top-4 right-4">
                  <span className="badge-text">{item.type}</span>
                </div>

                <Image
                  src={item.coverImage}
                  alt="cover image"
                  width={90}
                  height={90}
                  className="rounded-full object-cover size-[90px] border-4 border-stone-50 shadow-sm transition-transform duration-300 group-hover:scale-110"
                />

                <h3 className="mt-5 capitalize text-stone-900 font-bold">
                  {item.role} Interview
                </h3>

                <div className="flex flex-row gap-5 mt-3 text-stone-600 text-sm">
                  <div className="flex flex-row gap-2 items-center">
                    <Image src="/calendar.svg" alt="calendar" width={18} height={18} />
                    <span>{item.formattedDate}</span>
                  </div>

                  <div className="flex flex-row gap-2 items-center">
                    <Image src="/star.svg" alt="score" width={18} height={18} />
                    <span className="font-bold text-[#89023E]">{item.scoreDisplay}</span>
                  </div>
                </div>

                <p className="line-clamp-2 mt-4 text-xs text-stone-600 leading-relaxed">
                  {item.finalAssessment ||
                    "You haven't taken this interview yet. Click to start practicing!"}
                </p>
              </div>

              <div className="flex flex-row justify-between items-center mt-6">
                <div className="flex flex-row">
                  {item.techstack.slice(0, 3).map((tech, idx) => (
                    <span
                      key={tech + idx}
                      className={`text-[11px] font-semibold text-[#89023E] bg-[#89023E]/5 border border-[#89023E]/10 px-2.5 py-0.5 rounded-full ${
                        idx > 0 ? "-ml-2" : ""
                      }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <Button asChild className="btn-primary shadow-lg shadow-[#89023E]/20">
                  <Link href={item.feedbackLink}>
                    {item.buttonText}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
