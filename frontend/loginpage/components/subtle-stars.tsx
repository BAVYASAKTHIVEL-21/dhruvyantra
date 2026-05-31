"use client";

/** Calm star field + faint floating dots */
export function SubtleStars() {
  const stars = [
    [8, 12], [22, 8], [45, 15], [68, 6], [85, 18], [15, 35], [55, 28], [78, 42],
    [32, 55], [92, 62], [12, 72], [48, 68], [72, 78], [38, 22], [88, 32],
    [5, 48], [62, 12], [28, 88], [95, 38],
  ];

  const dots = [
    [18, 25], [42, 40], [70, 55], [35, 70], [58, 18], [82, 48],
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {stars.map(([left, top], i) => (
        <div
          key={`s-${i}`}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: i % 4 === 0 ? 2 : 1,
            height: i % 4 === 0 ? 2 : 1,
            animationDelay: `${i * 0.4}s`,
            opacity: 0.28,
          }}
        />
      ))}
      {dots.map(([left, top], i) => (
        <div
          key={`d-${i}`}
          className="absolute rounded-full bg-[#A78BFA] animate-float"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: 3,
            height: 3,
            opacity: 0.12,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${6 + i}s`,
          }}
        />
      ))}
    </div>
  );
}
