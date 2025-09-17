"use client";
import ConfettiBurst from "@/components/ConfettiBurst";
import CircleMeter from "@/components/CircleMeter";
import Link from "next/link";
import Image from "next/image";

type StrengthOrGrowth = { title: string; bullets: string[] };

type Props = {
  rounds: number;
  avgScore: number;              // 0..100
  levelLabel: string;            // e.g., "Level 1 • Explorer"
  streak?: number;               // e.g., 3
  strengths: StrengthOrGrowth;
  growth: StrengthOrGrowth;
  bestQuestion?: string;
};

export default function SessionComplete({
  rounds = 5,
  avgScore = 62,
  levelLabel = "Level 1 • Explorer",
  streak = 3,
  strengths = { title: "Strengths", bullets: ["Curious follow-ups", "Stayed on topic"] },
  growth = { title: "Areas for growth", bullets: ["Tighten clarity", "Ask for specifics"] },
  bestQuestion = "What would success look like from your perspective next week?"
}: Partial<Props>) {

  return (
    <main className="min-h-screen bg-fog text-coal">
      <ConfettiBurst />

      {/* Top banner */}
      <section className="bg-teal">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Image src="/brand/roga-logo.svg" alt="Roga" width={32} height={32} className="h-8 w-8" />
            <h1 className="font-bold text-xl">Session Complete</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/game/sessions" className="rounded-2xl border border-white/40 px-4 py-2 hover:bg-white/10 transition-colors">
              New Session
            </Link>
            <Link href="/" className="rounded-2xl border border-white/40 px-4 py-2 hover:bg-white/10 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Hero summary */}
      <section className="max-w-4xl mx-auto px-6 pt-8 text-center">
        <h2 className="font-serif text-3xl md:text-4xl text-coal">You did it! 🚀</h2>
        <p className="text-coal/80 mt-2">
          Completed {rounds} rounds. Your Question Intelligence leveled up.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6">
          <CircleMeter value={avgScore} label="Score" />
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-card">
              <span className="text-violet font-semibold">{levelLabel}</span>
              {typeof streak === "number" && (
                <span className="text-coral">🔥 {streak}-day streak</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Strengths & Growth cards */}
      <section className="max-w-5xl mx-auto px-6 mt-8 grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-card p-6 border-l-4 border-teal">
          <div className="flex items-center gap-2 mb-2">
            <Image src="/icons/check-circle.svg" alt="" width={20} height={20} className="w-5 h-5" />
            <h3 className="font-display font-bold">Strengths</h3>
          </div>
          <ul className="list-disc ml-5 text-coal/85">
            {strengths.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 border-l-4 border-coral">
          <div className="flex items-center gap-2 mb-2">
            <Image src="/icons/leaf.svg" alt="" width={20} height={20} className="w-5 h-5" />
            <h3 className="font-display font-bold">Areas for Growth</h3>
          </div>
          <ul className="list-disc ml-5 text-coal/85">
            {growth.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Best question highlight */}
      {bestQuestion && (
        <section className="max-w-5xl mx-auto px-6 mt-6">
          <div className="bg-white rounded-2xl shadow-card p-6 border border-black/10">
            <div className="flex items-center gap-2 mb-2">
              <Image src="/icons/star.svg" alt="" width={20} height={20} className="w-5 h-5" />
              <h3 className="font-display font-bold">Best Question of the Session</h3>
            </div>
            <blockquote className="italic text-coal/90">"{bestQuestion}"</blockquote>
          </div>
        </section>
      )}

      {/* CTAs */}
      <section className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap gap-4 justify-center">
        <Link href="/game" className="rounded-2xl bg-teal px-6 py-3 font-semibold text-white hover:bg-violet transition-colors">
          Try Another Challenge
        </Link>
        <Link href="/streaks" className="rounded-2xl bg-white px-6 py-3 font-semibold text-coal border border-black/10 hover:bg-fog transition-colors">
          Explore Streaks & Badges
        </Link>
        <Link href="/" className="rounded-2xl text-coal/70 hover:underline px-3 py-3">
          Back to Home
        </Link>
      </section>

      {/* footer */}
      <footer className="bg-fog border-t border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-coal/70">
          <p>MVP • v0</p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}