"use client";
import ConfettiBurst from "@/components/ConfettiBurst";
import Link from "next/link";

type StrengthOrGrowth = { title: string; bullets: string[] };

type Props = {
  avgScore: number;              // 0..100
  levelLabel: string;            // e.g., "Level 1 • Explorer"
  streak?: number;               // e.g., 3
  strengths: StrengthOrGrowth;
  growth: StrengthOrGrowth;
  bestQuestion?: string;
};

export default function SessionComplete({
  avgScore = 62,
  levelLabel = "Level 1 • Explorer",
  streak = 3,
  strengths = { title: "Strengths", bullets: ["Curious follow-ups", "Stayed on topic"] },
  growth = { title: "Areas for growth", bullets: ["Tighten clarity", "Ask for specifics"] },
  bestQuestion = "What would success look like from your perspective next week?"
}: Partial<Props>) {

  return (
    <main className="min-h-screen bg-teal text-white">
      <ConfettiBurst />

      {/* Mobile-optimized header with logo and confetti stars */}
      <section className="bg-teal relative px-4 py-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Decorative stars/confetti */}
          <div className="absolute top-4 left-8 text-yellow-400 text-lg">✨</div>
          <div className="absolute top-8 right-12 text-yellow-400 text-sm">⭐</div>
          <div className="absolute top-12 left-16 text-yellow-400 text-xs">✨</div>
          <div className="absolute top-6 right-20 text-yellow-400 text-lg">⭐</div>
          <div className="absolute top-16 left-24 text-yellow-400 text-sm">✨</div>
          <div className="absolute top-20 right-8 text-yellow-400 text-xs">⭐</div>
        </div>

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-teal font-bold text-sm">?</div>
            <span className="font-serif text-lg">roga</span>
          </div>

          <h1 className="font-serif text-2xl mb-2">You did it!</h1>
          <p className="text-white/90 text-sm">
            Your Question Intelligence<br />just leveled up.
          </p>

          {/* Score and streak info */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 relative">
                <svg viewBox="0 0 40 40" className="w-12 h-12 transform -rotate-90">
                  <circle cx="20" cy="20" r="16" stroke="#ffffff40" strokeWidth="3" fill="none" />
                  <circle
                    cx="20" cy="20" r="16"
                    stroke="#22c55e"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${(avgScore/100) * 100.53} 100.53`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{avgScore}%</span>
                </div>
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold">{levelLabel}</div>
              </div>
            </div>

            {typeof streak === "number" && (
              <div className="bg-white/20 rounded-full px-3 py-1">
                <span className="text-xs font-semibold">🔥 {streak}-day streak!</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Compact content section with white background */}
      <section className="bg-white text-coal px-4 py-6 mx-4 mt-6 rounded-t-3xl">
        {/* Strengths & Growth cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <h3 className="font-semibold text-sm text-green-800">Strengths</h3>
            </div>
            <div className="text-xs text-green-700 space-y-1">
              {strengths.bullets.map((b, i) => (
                <div key={i}>• {b}</div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <h3 className="font-semibold text-sm text-red-800">Growth Areas</h3>
            </div>
            <div className="text-xs text-red-700 space-y-1">
              {growth.bullets.map((b, i) => (
                <div key={i}>• {b}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Best question highlight */}
        {bestQuestion && (
          <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">⭐</span>
              </div>
              <h3 className="font-semibold text-sm text-purple-800">Best Question of the Session</h3>
            </div>
            <blockquote className="text-xs text-purple-700 italic">&ldquo;{bestQuestion}&rdquo;</blockquote>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Link href="/game" className="block w-full bg-teal text-white text-center py-3 rounded-xl font-semibold text-sm hover:bg-teal/90 transition-colors">
            Try Another Challenge
          </Link>
          <Link href="/streaks" className="block w-full bg-gray-100 text-coal text-center py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
            View Streaks & Badges
          </Link>
        </div>

        {/* Keep your streak alive text */}
        <p className="text-center text-xs text-gray-600 mt-4">Keep your streak alive!</p>
      </section>
    </main>
  );
}