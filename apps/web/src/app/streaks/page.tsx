"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Very light client-side streak demo.
 * - Stores last play date & current streak in localStorage.
 * - Call `incrementStreak()` from game flow later to bump streak.
 */
function getTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function StreaksPage() {
  const [streak, setStreak] = useState<number>(0);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [badge, setBadge] = useState<string>("—");

  useEffect(() => {
    // load from localStorage
    const s = Number(localStorage.getItem("roga_streak") || 0);
    const lp = localStorage.getItem("roga_last_played");
    setStreak(s);
    setLastPlayed(lp);
    setBadge(s >= 7 ? "🔥 7-day Flame" : s >= 3 ? "⭐ 3-day Spark" : "—");
  }, []);

  // For demo: simulate a “played today” to increment streak locally
  function incrementStreak() {
    const today = getTodayKey();
    const lp = localStorage.getItem("roga_last_played");
    let s = Number(localStorage.getItem("roga_streak") || 0);

    // if already played today, do nothing
    if (lp === today) return;

    // if last play was yesterday → increment; else → reset to 1
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);

    if (lp === yKey) s = s + 1;
    else s = 1;

    localStorage.setItem("roga_streak", String(s));
    localStorage.setItem("roga_last_played", today);
    setStreak(s);
    setLastPlayed(today);
    setBadge(s >= 7 ? "🔥 7-day Flame" : s >= 3 ? "⭐ 3-day Spark" : "—");
  }

  function resetStreak() {
    localStorage.removeItem("roga_streak");
    localStorage.removeItem("roga_last_played");
    setStreak(0);
    setLastPlayed(null);
    setBadge("—");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-3xl font-bold">Streaks & Badges</h1>

        <div className="border rounded-md p-4 bg-neutral-50">
          <p className="text-lg">
            <span className="font-semibold">Current streak:</span> {streak} day{streak === 1 ? "" : "s"}
          </p>
          <p className="text-neutral-600">
            <span className="font-semibold">Last played:</span>{" "}
            {lastPlayed ? lastPlayed : "—"}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Badge:</span> {badge}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="rounded-md px-4 py-2 bg-blue-600 text-white"
            onClick={incrementStreak}
          >
            Simulate “Played Today”
          </button>
          <button className="rounded-md px-4 py-2 border" onClick={resetStreak}>
            Reset
          </button>
        </div>

        <Link href="/" className="text-sm text-blue-700 underline">
           ← Back to Home
        </Link>

 
        <p className="text-xs text-neutral-400">Local-only demo • no account required</p>
      </div>
    </main>
  );
}
