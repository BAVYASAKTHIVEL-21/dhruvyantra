/** DhruvYantra logo — star mark + premium wordmark */
function LogoMark({ size = "md" }: { size?: "md" | "lg" | "xl" }) {
  const iconClass =
    size === "xl" ? "h-[26px] w-[26px]" : size === "lg" ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]";

  return (
    <svg
      viewBox="0 0 24 24"
      className={iconClass}
      fill="none"
      aria-hidden
    >
      <path
        d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
        fill="url(#logoStarGrad)"
      />
      <defs>
        <linearGradient id="logoStarGrad" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BrandWordmark({
  compact = false,
  large = false,
  sidebar = false,
  className = "",
}: {
  compact?: boolean;
  large?: boolean;
  sidebar?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`font-heading font-bold tracking-tight leading-none ${
        sidebar
          ? "text-[1.05rem] lg:text-[1.125rem]"
          : compact
            ? "text-[1.65rem] md:text-3xl"
            : large
              ? "text-4xl md:text-[2.75rem] lg:text-5xl"
              : "text-3xl md:text-4xl"
      } ${className}`}
    >
      <span className="text-[#F8FAFC]">Dhruv</span>
      <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
        Yantra
      </span>
    </span>
  );
}

export function DhruvYantraLogo({
  compact = false,
  large = false,
  sidebar = false,
  wordmarkClassName,
}: {
  compact?: boolean;
  large?: boolean;
  sidebar?: boolean;
  wordmarkClassName?: string;
}) {
  const iconSize = sidebar
    ? "h-9 w-9"
    : compact
      ? "h-11 w-11"
      : large
        ? "h-14 w-14 md:h-16 md:w-16"
        : "h-12 w-12 md:h-[52px] md:w-[52px]";
  const iconRounded = sidebar || compact ? "rounded-xl" : "rounded-2xl";
  const gap = sidebar
    ? "gap-2.5"
    : compact
      ? "gap-3"
      : large
        ? "gap-4 md:gap-5"
        : "gap-3.5 md:gap-4";
  const markSize = sidebar || compact ? "md" : large ? "xl" : "lg";

  return (
    <div
      className={`flex min-w-0 max-w-full items-center ${gap} ${sidebar ? "overflow-hidden" : ""}`}
    >
      {/* Icon with subtle purple glow */}
      <div className="relative shrink-0">
        <div
          className={`pointer-events-none absolute inset-0 ${iconRounded} bg-[#8B5CF6]/35 blur-xl`}
          aria-hidden
        />
        <div
          className={`relative flex ${iconSize} items-center justify-center ${iconRounded} bg-gradient-to-br from-[#8B5CF6] to-[#38BDF8] shadow-lg shadow-purple-500/25 ring-1 ring-white/10`}
        >
          <LogoMark size={markSize} />
        </div>
      </div>

      <div className="min-w-0 flex-1 flex-col gap-0.5 overflow-hidden md:gap-1">
        <BrandWordmark
          compact={compact}
          large={large}
          sidebar={sidebar}
          className={wordmarkClassName ?? ""}
        />
        {!compact && (
          <p
            className={`truncate font-normal uppercase text-white/50 ${
              sidebar
                ? "text-[9px] tracking-[0.12em] lg:text-[10px] lg:tracking-[0.14em]"
                : large
                  ? "text-xs md:text-[13px] tracking-[0.3em]"
                  : "text-xs tracking-[0.3em]"
            }`}
          >
            YOUR AI STUDY PARTNER
          </p>
        )}
      </div>
    </div>
  );
}
