"use client";

import { useRef } from "react";
import { ParametrixLogo } from "@/components/brand/ParametrixLogo";
import { Button } from "@/components/ui/Button";
import { homepageContent } from "@/lib/content";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const playVideo = () => {
    videoRef.current?.play().catch(() => {});
  };

  const restartVideo = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = 0;
    video.play().catch(() => {});
  };

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-base">
      <video
        ref={videoRef}
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        disablePictureInPicture
        loop
        muted
        onCanPlay={playVideo}
        onEnded={restartVideo}
        onLoadedData={playVideo}
        playsInline
        poster="/images/parametrix-hero-poster-clean.jpg"
        preload="auto"
      >
        <source
          src="/videos/parametrix-hero-bg-clean-loop-1440p.mp4"
          type="video/mp4"
        />
        <source
          src="/videos/parametrix-hero-bg-clean-loop-1080p.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-base to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center">
          <ParametrixLogo size="lg" showWordmark />
        </header>

        <div className="flex flex-1 items-center py-16">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan/85">
              Fixed-period weather coverage
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.02] text-text sm:text-6xl lg:text-7xl">
              {homepageContent.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
              {homepageContent.subtext}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="/app">
                Launch App
              </Button>
              <Button href="/how-it-works" variant="secondary">
                How it works
              </Button>
            </div>
            <div className="mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
              {[
                ["Fixed premiums", "Know the cost before purchase"],
                ["Automated settlement", "Weather checks run daily"],
                ["On-chain payout verification", "Eligible payouts are recorded"],
              ].map(([value, label]) => (
                <div
                  className="border-l border-white/15 pl-4"
                  key={label}
                >
                  <p className="text-2xl font-semibold text-text">{value}</p>
                  <p className="mt-1 text-sm text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
