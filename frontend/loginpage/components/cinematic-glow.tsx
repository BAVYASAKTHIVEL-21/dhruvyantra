"use client";

/** Soft atmospheric glow behind the study illustration */
export function CinematicGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_85%_at_38%_72%,rgba(17,24,39,0.45),transparent_70%)]" />

      <div className="absolute bottom-[4%] left-[4%] h-[min(82%,560px)] w-[min(78%,520px)] rounded-full bg-[#8B5CF6]/24 blur-[100px] lg:blur-[130px]" />
      <div className="absolute left-[20%] top-[14%] h-56 w-56 rounded-full bg-[#38BDF8]/16 blur-[95px] lg:h-64 lg:w-64 lg:blur-[110px]" />
      <div className="absolute bottom-[18%] left-[14%] h-48 w-60 rounded-full bg-[#F59E0B]/22 blur-[85px] lg:h-56 lg:w-72 lg:blur-[100px]" />
      <div className="absolute bottom-[10%] left-[8%] h-80 w-[28rem] rounded-full bg-[#A855F7]/12 blur-[85px] lg:blur-[100px]" />

      <div className="absolute bottom-[12%] right-0 h-96 w-72 rounded-full bg-[#0B1020]/35 blur-[100px]" />
    </div>
  );
}
