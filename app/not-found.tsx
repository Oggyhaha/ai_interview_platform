"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Menu, X, Sparkles } from "lucide-react";

export default function NotFound() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scaleY, setScaleY] = useState(1);
  const textRef = useRef<HTMLDivElement>(null);

  // Dynamic vertical scaling calculation for background 404 text
  useEffect(() => {
    const calculateScale = () => {
      if (textRef.current) {
        const height = textRef.current.offsetHeight;
        if (height > 0) {
          const calculatedScale = (window.innerHeight / height) * 1.4;
          setScaleY(calculatedScale);
        }
      }
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isMenuOpen]);

  const navLinks = [
    { label: "About Us", href: "/" },
    { label: "Programs", href: "/" },
    { label: "Reviews", href: "/" },
    { label: "FAQ", href: "/" },
    { label: "Contacts", href: "/" },
  ];

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col relative bg-gradient-to-b from-[#89023E] via-[#A80D4F] to-[#6B0030] font-sans">
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND "404" TEXT & OVAL EFFECT                           */}
      {/* ------------------------------------------------------------- */}
      <div
        className="absolute inset-0 pointer-events-none opacity-80 z-0 flex items-center justify-center overflow-hidden"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 95%)",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 95%)",
        }}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Centered 404 Text */}
          <div
            ref={textRef}
            className="text-white font-black leading-none tracking-tighter whitespace-nowrap select-none"
            style={{
              fontSize: "clamp(200px, 48vw, 800px)",
              transform: `scale(1.15, ${scaleY * 1.4})`,
              transformOrigin: "center center",
            }}
          >
            404
          </div>

          {/* Centered White Oval Overlay */}
          <div
            className="absolute rounded-full bg-white/20 backdrop-blur-3xl h-[22vh] sm:h-[26vh] md:h-[50vh] w-[clamp(120px,20vw,400px)]"
            style={{
              transform: `scaleY(${scaleY})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* NAVIGATION BAR                                                */}
      {/* ------------------------------------------------------------- */}
      <nav className="relative z-20 flex flex-row items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="grid grid-cols-2 gap-0.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full transition-transform group-hover:scale-110" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full transition-transform group-hover:scale-110" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full transition-transform group-hover:scale-110" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full transition-transform group-hover:scale-110" />
          </div>
          <span className="text-white font-bold text-lg sm:text-xl ml-1 tracking-tight">
            PrepYou
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-1.5 text-sm font-medium rounded-full bg-white text-[#89023E] hover:opacity-90 hover:scale-105 transition-all shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-white bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 transition-all flex items-center gap-2 shadow-md active:scale-95"
        >
          <Menu className="w-4 h-4 text-white" />
          <span className="text-sm font-medium hidden sm:inline">Menu</span>
        </button>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE MENU OVERLAY                                           */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setIsMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Sliding Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-full sm:w-[380px] bg-gradient-to-br from-[#89023E] to-[#C70039] p-6 flex flex-col justify-between transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5">
                <span className="w-2.5 h-2.5 bg-white rounded-full" />
                <span className="w-2.5 h-2.5 bg-white rounded-full" />
                <span className="w-2.5 h-2.5 bg-white rounded-full" />
                <span className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>
              <span className="text-white font-bold text-lg ml-1">PrepYou</span>
            </div>

            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col gap-3 my-auto">
            {navLinks.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  transitionDelay: isMenuOpen ? `${150 + i * 60}ms` : "0ms",
                }}
                className={`px-6 py-4 text-lg font-semibold text-white rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300 transform ${
                  isMenuOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div
            style={{
              transitionDelay: isMenuOpen ? "450ms" : "0ms",
            }}
            className={`transition-all duration-300 transform ${
              isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="w-full py-4 rounded-full bg-white font-semibold text-base text-[#89023E] hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CENTER 3D HERO ANIMATION / VIDEO                              */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 -mt-[6vh] sm:-mt-[10px]">
        <div className="relative w-[120vw] h-[75vh] sm:w-[70vw] sm:h-[70vh] md:w-[55vw] md:h-[68vh] flex items-center justify-center">
          {/* Glowing Aura Behind Robot */}
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />

          {/* 3D Robot Graphic */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 animate-float">
            <Image
              src="/robot.png"
              alt="404 AI Companion"
              fill
              className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
              priority
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM CONTENT                                                */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-30 mt-auto pb-8 sm:pb-14 flex flex-col items-center text-center px-4">
        <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-5 tracking-tight drop-shadow-md">
          Oops, page lost in space!
        </h1>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold text-sm sm:text-base bg-[#89023E] hover:bg-[#A30046] border border-white/30 hover:scale-105 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all shadow-xl active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
