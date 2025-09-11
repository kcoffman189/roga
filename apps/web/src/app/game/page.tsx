// app/daily-challenge/page.tsx
"use client";

import { useState } from "react";
import BrandMark from "@/components/ui/BrandMark";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import Image from "next/image";

export default function DailyChallengePage() {
  const [question, setQuestion] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  // mock handler — wire to your API later
  const onSubmit = async () => {
    if (!question.trim()) return;
    // TODO: call your evaluation endpoint
    setShowFeedback(true);
  };

  const onReset = () => {
    setQuestion("");
    setShowFeedback(false);
  };

  const onNewScenario = () => {
    // TODO: fetch new scenario from backend
    setQuestion("");
    setShowFeedback(false);
  };

  return (
    <main className="min-h-screen bg-fog text-coal">
      {/* HEADER */}
      <header className="w-full relative" style={{backgroundColor: '#20B2AA'}}>
        <div className="absolute top-20 flex items-center justify-between w-full" style={{left: '86px', right: '86px', width: 'calc(100% - 172px)'}}>
          <div className="flex items-center gap-4">
            <BrandMark size={80} />
            <span className="text-white" style={{fontFamily: 'Georgia, serif', fontSize: '6rem', color: 'white'}}>roga</span>
          </div>
          <Link href="/">
            <Button 
              variant="ghost" 
              className="text-lg px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-teal-600"
            >
              ← Back to Home
            </Button>
          </Link>
        </div>
        <div className="h-160" style={{height: '135px'}}></div>
      </header>

      {/* TITLE */}
      <div className="text-center" style={{marginTop: '50px', marginBottom: '40px'}}>
        <h1 className="text-4xl font-bold" style={{fontFamily: 'Georgia, serif', color: '#1D1B20'}}>Daily Challenge</h1>
      </div>

      {/* CONTENT */}
      <div className="flex justify-start">
        <div className="w-1/3 flex justify-center">
          {/* Scenario Card */}
          <Card className="p-6" style={{width: '600px'}}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image src="/brand/school_icon.svg" alt="Class Instructions" width={24} height={24} />
            <h2 className="font-display font-bold text-xl">Class Instructions</h2>
          </div>
          <p className="font-sans text-coal/80">
            Your teacher explains a project, but you’re still not sure what to do. The
            teacher is about to move on to the next part of class. What question could
            you ask to make the directions clearer before it’s too late?
          </p>

          {/* Input */}
          <label htmlFor="userQuestion" className="sr-only">
            Type your question
          </label>
          <textarea
            id="userQuestion"
            placeholder="Type your question…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-6 w-full min-h-[140px] rounded-xl border border-coal/20 bg-fog p-4 text-coal placeholder:text-coal/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(123,97,255,0.35)]"
          />

          {/* Actions */}
          <div className="mt-6 flex flex-wrap justify-center" style={{gap: '20px'}}>
            <Button
              onClick={onSubmit}
              className="text-lg px-8 py-4 border-0"
            >
              Submit Question
            </Button>
            <Button
              onClick={onReset}
              variant="ghost"
              className="text-lg px-8 py-4 bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Reset
            </Button>
            <Button
              onClick={onNewScenario}
              variant="ghost"
              className="text-lg px-8 py-4 bg-transparent border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white"
            >
              New Scenario
            </Button>
          </div>
        </Card>
        </div>
      </div>

        {/* Feedback Card (shown after submit) */}
        {showFeedback && (
          <section className="mt-6 bg-white rounded-2xl shadow-card p-6">
            <h3 className="font-bold text-violet mb-2">Your Feedback</h3>
            <p className="text-coal/80">
              Great start! Try making your question a bit clearer and more specific to the
              instructions. (This is placeholder text — replace with real feedback from
              your API.)
            </p>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex items-center rounded-full bg-teal text-white text-xs font-semibold px-3 py-1">
                Clarity
              </span>
              <span className="inline-flex items-center rounded-full bg-violet text-white text-xs font-semibold px-3 py-1">
                Relevance
              </span>
              <span className="inline-flex items-center rounded-full bg-coral text-white text-xs font-semibold px-3 py-1">
                Empathy
              </span>
            </div>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <footer className="bg-fog border-t border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-coal/70">
          <p>MVP • v0 • powered by gpt-4o-mini</p>
          <nav className="flex gap-4">
            <a href="/privacy" className="hover:underline">
              Privacy
            </a>
            <a href="/terms" className="hover:underline">
              Terms
            </a>
            <a href="/contact" className="hover:underline">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
