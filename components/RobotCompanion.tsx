"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function FlyingRobotCursor() {
  const robotRef = useRef<HTMLDivElement>(null);
  
  // Target mouse coordinates
  const mousePos = useRef({ x: -100, y: -100 });
  // Current interpolated robot coordinates
  const robotPos = useRef({ x: -100, y: -100 });
  // Velocity for dynamic flying tilt & rotation
  const vel = useRef({ x: 0, y: 0 });

  const [isHoveringClickable, setIsHoveringClickable] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [hoverMessage, setHoverMessage] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run on desktop/devices with mouse pointer
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      
      // Target offset slightly to the top-right of cursor so cursor remains visible
      mousePos.current = { x: e.clientX + 20, y: e.clientY - 24 };

      // Check if mouse is hovering over an interview card/container or button
      const target = e.target as HTMLElement | null;
      const card = target?.closest(".card-interview") || target?.closest(".card-border");
      const button = target?.closest("button") || target?.closest("a") || target?.closest("[role='button']");

      if (card) {
        setIsHoveringClickable(true);
        setIsHoveringCard(true);
        setHoverMessage("Ok, let's click here so that your interview starts very soon!");
      } else if (button) {
        setIsHoveringClickable(true);
        setIsHoveringCard(false);
        setHoverMessage("Click to launch!");
      } else {
        setIsHoveringClickable(false);
        setIsHoveringCard(false);
        setHoverMessage(null);
      }
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);

    // 60FPS Smooth Flight Animation Loop (Linear Interpolation / Lerp)
    let animationFrameId: number;

    const animateFlight = () => {
      // Lerp factor (0.12 for smooth floating inertia)
      const ease = 0.12;

      const dx = mousePos.current.x - robotPos.current.x;
      const dy = mousePos.current.y - robotPos.current.y;

      // Update velocity
      vel.current.x = dx * ease;
      vel.current.y = dy * ease;

      // Update position
      robotPos.current.x += vel.current.x;
      robotPos.current.y += vel.current.y;

      if (robotRef.current) {
        // Calculate tilt angles based on flight velocity
        const tiltX = Math.max(-25, Math.min(25, -vel.current.y * 1.5));
        const tiltY = Math.max(-30, Math.min(30, vel.current.x * 2.2));
        const rotationZ = Math.max(-20, Math.min(20, vel.current.x * 1.2));

        const scale = isMouseDown ? 0.85 : isHoveringClickable ? 1.25 : 1.0;

        robotRef.current.style.transform = `
          translate3d(${robotPos.current.x}px, ${robotPos.current.y}px, 0px)
          perspective(600px)
          rotateX(${tiltX}deg)
          rotateY(${tiltY}deg)
          rotateZ(${rotationZ}deg)
          scale(${scale})
        `;
      }

      animationFrameId = requestAnimationFrame(animateFlight);
    };

    animateFlight();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, isHoveringClickable, isMouseDown]);

  if (!isVisible) return null;

  return (
    <div
      ref={robotRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform transition-scale duration-150 ease-out"
      style={{
        transformOrigin: "center center",
      }}
    >
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
        {/* Floating Speech Bubble Message when hovering cards/buttons */}
        {hoverMessage && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-stone-200 shadow-xl text-[11px] font-bold text-[#89023E] animate-fadeIn flex items-center gap-1.5 z-10">
            <span className="w-2 h-2 rounded-full bg-[#89023E] animate-ping" />
            <span>{hoverMessage}</span>
            {/* Bubble Tail */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white transform rotate-45 border-r border-b border-stone-200" />
          </div>
        )}

        {/* Flying Thruster Trail / Glow */}
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full blur-md transition-all duration-300 ${
            isHoveringClickable
              ? "bg-[#89023E] scale-150 opacity-90 animate-pulse"
              : "bg-rose-400/60 scale-100 opacity-60"
          }`}
        />

        {/* Thruster Sparkle Effects when hovering interactive elements */}
        {isHoveringClickable && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-1.5 h-3 bg-amber-400 rounded-full animate-ping" />
            <span className="w-2 h-4 bg-[#89023E] rounded-full animate-bounce" />
            <span className="w-1.5 h-3 bg-amber-400 rounded-full animate-ping" />
          </div>
        )}

        {/* 3D Robot Avatar Flying Graphic */}
        <Image
          src="/robot.png"
          alt="Flying Cursor Robot"
          width={64}
          height={64}
          className={`w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(137,2,62,0.4)] transition-all duration-200 ${
            isHoveringClickable ? "brightness-110 drop-shadow-[0_0_20px_rgba(137,2,62,0.8)]" : ""
          }`}
          priority
        />
      </div>
    </div>
  );
}
