"use client";

import React from "react";
import { SkillRadar } from "@/types";
import { Award, Zap, Activity } from "lucide-react";

export default function SkillRadarChart({
  radar,
  readinessScore = 85,
}: {
  radar?: SkillRadar;
  readinessScore?: number;
}) {
  const skills = [
    { label: "Technical", value: radar?.technical || 82, angle: 0 },
    { label: "Problem Solving", value: radar?.problemSolving || 85, angle: 72 },
    { label: "Communication", value: radar?.communication || 78, angle: 144 },
    { label: "Architecture", value: radar?.architecture || 80, angle: 216 },
    { label: "System Design", value: radar?.systemDesign || 75, angle: 288 },
  ];

  const center = 120;
  const radius = 80;

  // Calculate polygon points for values
  const points = skills
    .map((skill) => {
      const rad = (skill.angle - 90) * (Math.PI / 180);
      const r = (skill.value / 100) * radius;
      const x = center + r * Math.cos(rad);
      const y = center + r * Math.sin(rad);
      return `${x},${y}`;
    })
    .join(" ");

  // Grid level polygons (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0].map((level) => {
    return skills
      .map((skill) => {
        const rad = (skill.angle - 90) * (Math.PI / 180);
        const r = radius * level;
        const x = center + r * Math.cos(rad);
        const y = center + r * Math.sin(rad);
        return `${x},${y}`;
      })
      .join(" ");
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-stone-100 shadow-sm w-full">
      {/* SVG Skill Radar Chart */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-[#89023E]" />
          <h3 className="font-bold text-stone-900 text-lg">Skill Radar Index</h3>
        </div>

        <div className="relative w-60 h-60 flex items-center justify-center">
          <svg width="240" height="240" className="overflow-visible">
            {/* Grid concentric polygons */}
            {gridLevels.map((gridPoints, idx) => (
              <polygon
                key={idx}
                points={gridPoints}
                fill="none"
                stroke="#E7E5E4"
                strokeWidth="1"
                strokeDasharray={idx === 4 ? "none" : "2,2"}
              />
            ))}

            {/* Axes lines */}
            {skills.map((skill, idx) => {
              const rad = (skill.angle - 90) * (Math.PI / 180);
              const x2 = center + radius * Math.cos(rad);
              const y2 = center + radius * Math.sin(rad);
              return (
                <line
                  key={idx}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#E7E5E4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Skill Data Polygon */}
            <polygon
              points={points}
              fill="rgba(137, 2, 62, 0.25)"
              stroke="#89023E"
              strokeWidth="2.5"
              className="transition-all duration-700 ease-out"
            />

            {/* Points on polygon */}
            {skills.map((skill, idx) => {
              const rad = (skill.angle - 90) * (Math.PI / 180);
              const r = (skill.value / 100) * radius;
              const x = center + r * Math.cos(rad);
              const y = center + r * Math.sin(rad);
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#89023E"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Skills breakdown list & Readiness Score Badge */}
      <div className="flex flex-col gap-6 flex-1 w-full">
        {/* Placement Readiness Badge */}
        <div className="p-5 bg-gradient-to-r from-[#89023E] to-[#C70039] text-white rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-200 block mb-0.5">
              Placement Readiness Score
            </span>
            <h4 className="text-2xl font-black">{readinessScore}% Ready</h4>
            <p className="text-xs text-rose-100 mt-1">
              {readinessScore >= 80
                ? "Highly Qualified for Senior Software Engineering Roles!"
                : "Good progress! Practice a few more sessions to boost your score."}
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <Award className="w-8 h-8 text-amber-300 animate-bounce" />
          </div>
        </div>

        {/* Skill Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skills.map((skill) => (
            <div key={skill.label} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-700">{skill.label}</span>
                <span className="font-extrabold text-[#89023E]">{skill.value}/100</span>
              </div>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#89023E] h-full rounded-full transition-all duration-500"
                  style={{ width: `${skill.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
