"use client";

import { useMemo } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

const particlesInit = async (engine: Engine) => {
  await loadSlim(engine);
};

const particleOptions: ISourceOptions = {
  fullScreen: false,
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    number: { value: 38, density: { enable: true } },
    color: { value: ["#8B5CF6", "#38BDF8", "#F8FAFC", "#F59E0B"] },
    shape: { type: "circle" },
    opacity: {
      value: { min: 0.12, max: 0.5 },
      animation: { enable: true, speed: 0.5, sync: false },
    },
    size: { value: { min: 0.4, max: 2 } },
    move: {
      enable: true,
      speed: 0.3,
      direction: "none",
      random: true,
      outModes: { default: "out" },
    },
    links: {
      enable: true,
      distance: 90,
      color: "#8B5CF6",
      opacity: 0.08,
      width: 0.4,
    },
  },
  interactivity: {
    detectsOn: "canvas",
    events: {
      onHover: { enable: true, mode: "grab" },
      resize: { enable: true },
    },
    modes: {
      grab: { distance: 100, links: { opacity: 0.18 } },
    },
  },
  detectRetina: true,
};

function CosmicParticlesCanvas() {
  const options = useMemo(() => particleOptions, []);

  return (
    <Particles
      id="cosmic-particles"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      options={options}
    />
  );
}

export function CosmicParticles() {
  return (
    <ParticlesProvider init={particlesInit}>
      <CosmicParticlesCanvas />
    </ParticlesProvider>
  );
}
