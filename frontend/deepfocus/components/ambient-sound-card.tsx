"use client";

import { Check, Volume2 } from "lucide-react";
import { useState } from "react";
import { AMBIENT_SOUNDS } from "../data";

export function AmbientSoundCard() {
  const [selected, setSelected] = useState("rain");
  const [volume, setVolume] = useState(65);

  return (
    <div className="dash-glass-card rounded-2xl p-5">
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Ambient Sound</h3>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {AMBIENT_SOUNDS.map((sound) => {
          const active = selected === sound.id;
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => setSelected(sound.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3 text-left transition-all ${
                active
                  ? "border-[#8B5CF6]/50 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                  : "border-white/[0.08] hover:border-[#8B5CF6]/25"
              }`}
            >
              <div
                className={`mb-2 h-12 rounded-lg bg-gradient-to-br ${sound.gradient} opacity-90`}
              />
              <span className="text-xs font-medium text-[#E2E8F0]">{sound.label}</span>
              {active ? (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6] text-white">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Volume2 className="h-4 w-4 shrink-0 text-[#6B7A90]" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="focus-volume-slider h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
