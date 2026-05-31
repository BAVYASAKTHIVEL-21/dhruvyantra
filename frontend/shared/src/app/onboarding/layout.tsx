import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Journey | DhruvYantra",
  description: "Personalize your AI-powered study preparation experience.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
