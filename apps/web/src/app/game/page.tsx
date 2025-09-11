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
      <div className="flex gap-8" style={{marginLeft: '65px'}}>
        {/* Left Column - Scenario Card */}
        <div>
          <Card className="p-6" style={{width: '600px'}}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Image src="/brand/school_icon.svg" alt="Class Instructions" width={24} height={24} />
              <h2 className="font-display font-bold text-xl">Class Instructions</h2>
            </div>
            <p className="font-sans text-coal/80">
              Your teacher explains a project, but you&apos;re still not sure what to do. The
              teacher is about to move on to the next part of class. What question could
              you ask to make the directions clearer before it&apos;s too late?
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

        {/* Right Column - Feedback Section */}
        <div style={{width: '500px'}}>
          {showFeedback && (
            <Card className="p-6">
              <h3 className="font-bold text-violet mb-4 text-center">Your Feedback</h3>
              
              {/* Score */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-teal mb-2">85</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>

              {/* Feedback Text */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Feedback:</h4>
                <p className="text-coal/80 text-sm leading-relaxed">
                  Great start! Your question shows good awareness of the situation. Try making it more specific to get clearer directions from your teacher.
                </p>
              </div>

              {/* Skills Breakdown */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Skills Assessment:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Clarity</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-teal"></div>
                      <div className="w-3 h-3 rounded-full bg-teal"></div>
                      <div className="w-3 h-3 rounded-full bg-teal"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Relevance</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-violet"></div>
                      <div className="w-3 h-3 rounded-full bg-violet"></div>
                      <div className="w-3 h-3 rounded-full bg-violet"></div>
                      <div className="w-3 h-3 rounded-full bg-violet"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Empathy</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-coral"></div>
                      <div className="w-3 h-3 rounded-full bg-coral"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Tip */}
              <div className="bg-fog rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>💡</span> Pro Tip:
                </h5>
                <p className="text-xs text-coal/70">
                  Try asking "What specific steps should I focus on first?" to get more actionable guidance.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-fog border-t border-black/5 mt-16">
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
