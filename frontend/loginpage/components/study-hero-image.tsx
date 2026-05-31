"use client";

import Image from "next/image";

/** Primary visual — /study-girl.png (full-bleed cinematic wallpaper) */
export function StudyHeroImage() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {/* Background image — fills entire left half */}
      <div className="absolute inset-0">
        <Image
          src="/study-girl.png"
          alt="Student studying at night — focused preparation"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 62vw"
          className="object-cover object-[22%_100%] sm:object-[20%_100%] lg:object-[18%_100%] xl:object-[16%_100%]"
          quality={92}
        />
      </div>

      {/* Dark overlay — subtle, keeps figure visible */}
      <div className="absolute inset-0 bg-[#0B1020]/[0.12]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_85%_at_35%_70%,transparent_40%,rgba(11,16,32,0.28)_100%)]" />

      {/* Atmospheric depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_20%_65%,rgba(139,92,246,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_18%,rgba(56,189,248,0.1),transparent_55%)]" />

      {/* Moonlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_52%_20%,rgba(147,197,253,0.13),transparent_50%)]" />

      {/* Warm desk lamp */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_68%,rgba(245,158,11,0.22),transparent_52%)]" />

      {/* Ambient purple */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_60%,rgba(139,92,246,0.1),transparent_46%)]" />

      {/* Gradient fades — seamless edges */}
      <div className="absolute inset-y-0 right-0 w-[min(48%,340px)] bg-gradient-to-l from-[#111827] via-[#0B1020]/60 to-transparent lg:w-[min(42%,400px)]" />
      <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-[#111827] via-[#0B1020]/40 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-[#0B1020]/55 via-[#0B1020]/15 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-[#0B1020]/40 to-transparent" />

      {/* Right seam into login panel */}
      <div
        className="study-hero-edge-blur absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0B1020]/80 to-transparent lg:w-40"
        aria-hidden
      />

      {/* Bottom-right corner soften */}
      <div className="absolute bottom-0 right-0 h-[45%] w-[40%] bg-[radial-gradient(ellipse_at_100%_100%,#111827_0%,rgba(11,16,32,0.4)_40%,transparent_70%)]" />
    </div>
  );
}
