// app/daily-challenge/page.tsx
"use client";

import { useState } from "react";
import BrandMark from "@/components/ui/BrandMark";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import Image from "next/image";

interface Scenario {
  id: number;
  title: string;
  text: string;
  icon: string;
}

interface FeedbackData {
  score: number;
  rubric: {
    key: string;
    label: string;
    status: 'good' | 'warn' | 'bad';
    note: string;
  }[];
  proTip?: string;
  suggestedUpgrade?: string;
  badge?: {
    name: string;
    label: string;
  };
}

interface CoachingFeedbackData {
  schema: string;
  scenario_id?: number;
  user_question: string;
  character_reply?: string;
  coach_feedback: {
    score_1to5: number;
    qi_skills: string[];
    why_it_works: string;
    improvement: string;
    pro_tip: string;
    example_upgrade: string;
  };
  meta: {
    brand_check: boolean;
    length_ok: boolean;
    banned_content: string[];
    hash: string;
  };
}

const scenarios: Scenario[] = [
  {
    id: 1,
    title: "Class Instructions",
    text: "Your teacher explains a project, but you're still not sure what to do. The teacher is about to move on to the next part of class. What question could you ask to make the directions clearer before it's too late?",
    icon: "/brand/school_icon.svg"
  },
  {
    id: 2,
    title: "Team Meeting",
    text: "Your manager mentions a new initiative in passing during a busy team meeting. You think it might affect your current project, but you're not certain. What question could you ask to understand the impact?",
    icon: "/brand/team_icon_icon.svg"
  },
  {
    id: 3,
    title: "Customer Feedback",
    text: "A customer says your product 'doesn't feel right' but won't elaborate further. You need to understand their concern to improve the experience. What question could help you dig deeper?",
    icon: "/brand/customer_feedback_icon.svg"
  },
  {
    id: 4,
    title: "Project Deadline",
    text: "Your team lead says the deadline is 'tight but doable' for an important project. You want to understand what resources or support might be needed. What question would help clarify the situation?",
    icon: "/brand/project_deadline_icon.svg"
  },
  {
    id: 5,
    title: "Career Discussion",
    text: "During your performance review, your supervisor mentions 'growth opportunities' but doesn't specify what they mean. You want to understand your next steps. What question could help clarify your path forward?",
    icon: "/brand/career_growth_icon.svg"
  }
];

export default function DailyChallengePage() {
  const [question, setQuestion] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [coachingFeedback, setCoachingFeedback] = useState<CoachingFeedbackData | null>(null);
  const [useCoachingMode, setUseCoachingMode] = useState(true); // Toggle between old/new feedback
  const [isLoading, setIsLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<Scenario>(() => {
    // Start with a random scenario
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  });

  const onSubmit = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      const endpoint = useCoachingMode ? '/api/coach' : '/api/ask';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          scenarioId: currentScenario.id,
          scenarioTitle: currentScenario.title,
          scenarioText: currentScenario.text
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (useCoachingMode) {
          setCoachingFeedback(data);
          setFeedback(null);
        } else {
          setFeedback({
            score: data.score,
            rubric: data.rubric,
            proTip: data.proTip,
            suggestedUpgrade: data.suggestedUpgrade,
            badge: data.badge
          });
          setCoachingFeedback(null);
        }
        setShowFeedback(true);
      } else {
        console.error('Failed to get feedback');
        // Show hardcoded coaching feedback as fallback
        if (useCoachingMode) {
          setCoachingFeedback({
            schema: "roga.feedback.v1",
            scenario_id: currentScenario.id,
            user_question: question,
            coach_feedback: {
              score_1to5: 4,
              qi_skills: ["clarifying"],
              why_it_works: "Shows good questioning instinct",
              improvement: "Add more specific context",
              pro_tip: "Try the clarifying technique for better results",
              example_upgrade: "What specific deliverable do we need to complete first?"
            },
            meta: {
              brand_check: true,
              length_ok: true,
              banned_content: [],
              hash: "fallback123"
            }
          });
          setFeedback(null);
        } else {
          setFeedback({
            score: 85,
            rubric: [
              { key: 'clarity', label: 'Clarity', status: 'good', note: 'Specific and scoped.' },
              { key: 'depth', label: 'Depth', status: 'warn', note: 'Could probe deeper.' },
              { key: 'insight', label: 'Insight', status: 'good', note: 'Shows good perspective.' },
              { key: 'openness', label: 'Openness', status: 'good', note: 'Invites more info.' }
            ],
            proTip: 'Try being more specific to get clearer directions from your teacher.'
          });
          setCoachingFeedback(null);
        }
        setShowFeedback(true);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      // Show hardcoded feedback as fallback
      if (useCoachingMode) {
        setCoachingFeedback({
          schema: "roga.feedback.v1", 
          scenario_id: currentScenario.id,
          user_question: question,
          coach_feedback: {
            score_1to5: 4,
            qi_skills: ["clarifying"],
            why_it_works: "Shows good questioning instinct",
            improvement: "Add more specific context", 
            pro_tip: "Try the clarifying technique for better results",
            example_upgrade: "What specific deliverable do we need to complete first?"
          },
          meta: {
            brand_check: true,
            length_ok: true,
            banned_content: [],
            hash: "fallback123"
          }
        });
        setFeedback(null);
      } else {
        setFeedback({
          score: 85,
          rubric: [
            { key: 'clarity', label: 'Clarity', status: 'good', note: 'Specific and scoped.' },
            { key: 'depth', label: 'Depth', status: 'warn', note: 'Could probe deeper.' },
            { key: 'insight', label: 'Insight', status: 'good', note: 'Shows good perspective.' },
            { key: 'openness', label: 'Openness', status: 'good', note: 'Invites more info.' }
          ],
          proTip: 'Try being more specific to get clearer directions from your teacher.'
        });
        setCoachingFeedback(null);
      }
      setShowFeedback(true);
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = () => {
    setQuestion("");
    setShowFeedback(false);
    setFeedback(null);
    setCoachingFeedback(null);
  };

  const onNewScenario = () => {
    // Select a random scenario that's different from the current one
    const availableScenarios = scenarios.filter(s => s.id !== currentScenario.id);
    const randomScenario = availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
    
    setCurrentScenario(randomScenario);
    setQuestion("");
    setShowFeedback(false);
    setFeedback(null);
    setCoachingFeedback(null);
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
      <div className="flex justify-between" style={{marginLeft: '65px', marginRight: '65px'}}>
        {/* Left Column - Scenario Card */}
        <div>
          <Card className="p-6" style={{width: '600px'}}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Image src={currentScenario.icon} alt={currentScenario.title} width={24} height={24} />
              <h2 className="font-display font-bold text-xl">{currentScenario.title}</h2>
            </div>
            <p className="font-sans text-coal/80">
              {currentScenario.text}
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

            {/* Mode Toggle */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setUseCoachingMode(!useCoachingMode)}
                className="text-sm px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                {useCoachingMode ? "Using New Coaching Mode ⚡" : "Using Legacy Mode 📊"}
              </button>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap justify-center" style={{gap: '20px'}}>
              <Button
                onClick={onSubmit}
                disabled={isLoading || !question.trim()}
                className="text-lg px-8 py-4 border-0"
              >
                {isLoading ? "Getting Feedback..." : "Submit Question"}
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
        <div>
          {showFeedback && (
            <Card className="p-6" style={{width: '600px'}}>
              <h3 className="font-bold text-violet mb-4 text-center">Your Feedback</h3>
              
              {/* Coaching Mode Feedback */}
              {coachingFeedback && (
                <>
                  {/* Score */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-teal mb-2">{coachingFeedback.coach_feedback.score_1to5}/5</div>
                    <div className="text-sm text-gray-600">Question Intelligence Score</div>
                  </div>

                  {/* QI Skills */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">QI Skills Used:</h4>
                    <div className="flex flex-wrap gap-2">
                      {coachingFeedback.coach_feedback.qi_skills.map((skill, index) => (
                        <span key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                          {skill.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Why It Works */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-green-700">✓ Why It Works:</h4>
                    <p className="text-coal/80 text-sm leading-relaxed bg-green-50 p-3 rounded">
                      {coachingFeedback.coach_feedback.why_it_works}
                    </p>
                  </div>

                  {/* Improvement */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-orange-700">→ Improvement:</h4>
                    <p className="text-coal/80 text-sm leading-relaxed bg-orange-50 p-3 rounded">
                      {coachingFeedback.coach_feedback.improvement}
                    </p>
                  </div>

                  {/* Pro Tip */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-blue-700">💡 Pro Tip:</h4>
                    <p className="text-coal/80 text-sm leading-relaxed bg-blue-50 p-3 rounded">
                      {coachingFeedback.coach_feedback.pro_tip}
                    </p>
                  </div>

                  {/* Example Upgrade */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-purple-700">⚡ Example Upgrade:</h4>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm text-purple-800 italic">
                        "{coachingFeedback.coach_feedback.example_upgrade}"
                      </p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="mt-6 text-center">
                    <div className="text-xs text-gray-500">
                      Quality: {coachingFeedback.meta.brand_check ? '✓ Brand' : '✗ Brand'} • 
                      {coachingFeedback.meta.length_ok ? ' ✓ Length' : ' ✗ Length'} • 
                      Hash: {coachingFeedback.meta.hash}
                    </div>
                  </div>
                </>
              )}

              {/* Legacy Mode Feedback */}
              {feedback && (
                <>
                  {/* Score */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-teal mb-2">{feedback.score || 0}</div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>

                  {/* Feedback Text */}
                  {feedback.suggestedUpgrade && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Suggested Improvement:</h4>
                      <p className="text-coal/80 text-sm leading-relaxed">
                        {feedback.suggestedUpgrade}
                      </p>
                    </div>
                  )}

                  {/* Skills Breakdown */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Skills Assessment:</h4>
                    <div className="space-y-3">
                      {feedback.rubric.map((item) => {
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'good': return 'bg-teal';
                            case 'warn': return 'bg-yellow-500';
                            case 'bad': return 'bg-red-500';
                            default: return 'bg-gray-200';
                          }
                        };
                        
                        const getStatusDots = (status: string) => {
                          const filled = status === 'good' ? 4 : status === 'warn' ? 2 : 1;
                          return Array.from({ length: 4 }, (_, i) => (
                            <div 
                              key={i} 
                              className={`w-3 h-3 rounded-full ${i < filled ? getStatusColor(status) : 'bg-gray-200'}`}
                            ></div>
                          ));
                        };

                        return (
                          <div key={item.key}>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{item.label}</span>
                              <div className="flex gap-1">
                                {getStatusDots(item.status)}
                              </div>
                            </div>
                            <p className="text-xs text-coal/70 mt-1">{item.note}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pro Tip */}
                  {feedback.proTip && (
                    <div className="bg-fog rounded-lg p-4">
                      <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <span>💡</span> Pro Tip:
                      </h5>
                      <p className="text-xs text-coal/70">
                        {feedback.proTip}
                      </p>
                    </div>
                  )}
                  
                  {/* Badge */}
                  {feedback.badge && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-violet/10 text-violet px-4 py-2 rounded-full text-sm font-medium">
                        🏆 {feedback.badge.name}: {feedback.badge.label}
                      </div>
                    </div>
                  )}
                </>
              )}
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
