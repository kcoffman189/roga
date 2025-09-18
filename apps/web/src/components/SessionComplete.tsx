"use client";
import BrandMark from "@/components/ui/BrandMark";
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
    <main className="min-h-screen bg-white">
      {/* Header section matching home page style - 1/3 screen height */}
      <section className="min-h-[33vh] relative px-6 py-6" style={{backgroundColor: '#20B2AA'}}>
        {/* Static confetti decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Yellow confetti pieces */}
          <div className="absolute top-12 left-16 w-2 h-2 bg-yellow-400 rounded-full"></div>
          <div className="absolute top-16 right-20 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
          <div className="absolute top-8 left-32 w-1 h-1 bg-yellow-400 rounded-full"></div>
          <div className="absolute top-20 right-12 w-2 h-2 bg-yellow-400 rounded-full"></div>
          <div className="absolute top-6 left-48 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
          <div className="absolute top-14 right-32 w-1 h-1 bg-yellow-400 rounded-full"></div>

          {/* Teal confetti pieces */}
          <div className="absolute top-10 left-24 w-1.5 h-1.5 bg-teal-300 rounded-full"></div>
          <div className="absolute top-18 right-16 w-1 h-1 bg-teal-300 rounded-full"></div>
          <div className="absolute top-4 left-40 w-2 h-2 bg-teal-300 rounded-full"></div>
          <div className="absolute top-22 right-28 w-1.5 h-1.5 bg-teal-300 rounded-full"></div>

          {/* Pink/coral confetti pieces */}
          <div className="absolute top-14 left-20 w-1 h-1 bg-pink-400 rounded-full"></div>
          <div className="absolute top-8 right-24 w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
          <div className="absolute top-20 left-36 w-2 h-2 bg-pink-400 rounded-full"></div>
          <div className="absolute top-12 right-8 w-1 h-1 bg-pink-400 rounded-full"></div>
        </div>

        {/* Logo positioned like home page */}
        <div className="absolute top-8 flex items-center gap-4" style={{left: '86px'}}>
          <BrandMark size={50} />
          <span className="text-white" style={{fontFamily: 'Georgia, serif', fontSize: '3rem', color: 'white'}}>roga</span>
        </div>

        {/* Centered hero content */}
        <div className="flex flex-col items-center justify-center min-h-[25vh] text-center space-y-4 max-w-4xl mx-auto">
          <h1 className="text-white text-4xl md:text-5xl leading-tight" style={{fontFamily: 'Georgia, serif', color: 'white'}}>
            You did it!
          </h1>
          <p className="text-white text-lg md:text-xl max-w-2xl mx-auto" style={{fontFamily: 'Georgia, serif', color: 'white'}}>
            Your Question Intelligence just leveled up.
          </p>

          {/* Score and streak info */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 relative">
                <svg viewBox="0 0 40 40" className="w-16 h-16 transform -rotate-90">
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
                  <span className="text-sm font-bold text-white">{avgScore}%</span>
                </div>
              </div>
              <div className="text-left text-white">
                <div className="font-semibold text-lg" style={{fontFamily: 'Georgia, serif'}}>{levelLabel}</div>
              </div>
            </div>

            {typeof streak === "number" && (
              <div className="bg-white/20 rounded-full px-4 py-2">
                <span className="text-sm font-semibold text-white" style={{fontFamily: 'Georgia, serif'}}>🔥 {streak}-day streak!</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="bg-white text-coal px-6 py-8 max-w-4xl mx-auto">
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