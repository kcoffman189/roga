// apps/web/src/app/game/sessions/page.tsx
"use client";

import { useState } from "react";
import BrandMark from "@/components/ui/BrandMark";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import sessionsData from "@/data/sessions.json";

type PersonaType = "generic_philosopher" | "business_coach" | "teacher_mentor";

type SessionScenario = {
  id: string;
  title: string;
  scene: string;
  persona: string;
  rounds: number;
  context: "business" | "academic" | "personal";
  tags: string[];
};

type RubricItem = {
  key: "clarity" | "depth" | "insight" | "openness";
  label: string;
  status: "good" | "warn" | "bad";
  note: string;
};

type Feedback = {
  score: number;
  rubric: RubricItem[];
  proTip?: string;
  suggestedUpgrade?: string;
  badge?: { name: string; label?: string };
  
  // V2 Enhanced Fields
  contextSpecificTip?: string;
  likelyResponse?: string;
  nextQuestionSuggestions?: string[];
  empathyScore?: number;
};

type Turn = {
  round: number;
  question: string;
  characterReply: string;
  feedback: Feedback;
};

type Session = {
  id: string;
  persona: PersonaType;
  topic: string;
  difficulty: string;
  roundsPlanned: number;
};

type GameState = 'scenario-selection' | 'playing' | 'completed';

const SCENARIOS: SessionScenario[] = sessionsData as SessionScenario[];

export default function RogaSessionsPage() {
  const [gameState, setGameState] = useState<GameState>('scenario-selection');
  const [session, setSession] = useState<Session | null>(null);
  const [currentScenario, setCurrentScenario] = useState<SessionScenario | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{summary: string, bestQuestion: string, badges: string[]} | null>(null);

  const startSession = async (scenario: SessionScenario) => {
    setIsLoading(true);
    try {
      console.log('Starting session with scenario:', scenario);
      
      const requestBody = {
        persona: scenario.persona,
        topic: scenario.scene,
        difficulty: "intermediate",
        roundsPlanned: scenario.rounds
      };
      console.log('Session request body:', requestBody);

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Session API response:', {
        status: res.status,
        statusText: res.statusText
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Session API error:', errorText);
        throw new Error(`Failed to create session: ${res.status} - ${errorText}`);
      }
      
      let sessionData: Session;
      try {
        const responseText = await res.text();
        console.log('Session response text:', responseText);
        sessionData = JSON.parse(responseText) as Session;
        console.log('Parsed session data:', sessionData);
      } catch (parseError) {
        console.error('Session JSON parse error:', parseError);
        throw new Error(`Failed to parse session response: ${parseError}`);
      }

      setSession(sessionData);
      setCurrentScenario(scenario);
      setGameState('playing');
      console.log('Session started successfully');
    } catch (error) {
      console.error('Failed to start session:', error);
      alert(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const submitTurn = async () => {
    console.log('submitTurn function called!');
    console.log('Current state:', {
      questionLength: question.length,
      questionTrimmed: question.trim(),
      hasSession: !!session,
      isLoading,
      currentRound
    });

    if (!question.trim() || !session) {
      console.error('Cannot submit turn:', { question: question.trim(), session: !!session });
      return;
    }
    
    console.log('Submitting turn:', {
      sessionId: session.id,
      round: currentRound,
      questionLength: question.length,
      context: currentScenario?.context
    });
    
    console.log('Setting isLoading to true...');
    setIsLoading(true);

    try {
      // Build prior summary from recent turns
      const priorSummary = turns.slice(-2)
        .map(t => `r${t.round}: "${t.question}" -> "${t.characterReply.substring(0, 50)}..."`)
        .join(" | ");

      console.log('Making API request with body:', {
        round: currentRound,
        question,
        priorSummary,
        context: currentScenario?.context || "business"
      });

      const res = await fetch(`/api/sessions/${session.id}/turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round: currentRound,
          question,
          priorSummary,
          context: currentScenario?.context || "business",
          // Include session context for recovery
          persona: session.persona,
          topic: currentScenario?.scene || session.topic
        })
      });

      console.log('API response received:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error response text:', errorText);
        throw new Error(`API responded with status: ${res.status} - ${errorText}`);
      }

      let turnData: Turn;
      try {
        const responseText = await res.text();
        console.log('Raw response text:', responseText);
        turnData = JSON.parse(responseText) as Turn;
        console.log('Parsed turn data:', turnData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response was not valid JSON');
        throw new Error(`Failed to parse response as JSON: ${parseError}`);
      }

      // Validate the turn data structure
      if (!turnData || typeof turnData !== 'object') {
        console.error('Invalid turn data structure:', turnData);
        throw new Error('Received invalid turn data from API');
      }

      setTurns(prev => {
        // Ensure the user's question is preserved in the turn data
        const turnWithQuestion = {
          ...turnData,
          question: question
        };
        console.log('Turn added:', {round: turnWithQuestion.round, hasReply: !!turnWithQuestion.characterReply});
        return [...prev, turnWithQuestion];
      });
      setQuestion("");

      if (currentRound >= 5) {
        // After round 5, show the feedback but don't auto-complete session
        // User can manually end session or we can add a "Complete Session" button
        setCurrentRound(prev => prev + 1); // This will hide the input form
      } else {
        setCurrentRound(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to submit turn:', error);
      console.error('Error details:', {
        sessionId: session?.id,
        currentRound,
        question,
        context: currentScenario?.context,
        error: error instanceof Error ? error.message : error
      });

      // Check if it's a session not found error (404)
      if (error instanceof Error && error.message.includes('404')) {
        // Session was lost, offer to restart
        const restart = confirm('Your session was lost (possibly due to a server restart). Would you like to start a new session?');
        if (restart) {
          resetSession();
          return;
        }
      }

      // Show user-friendly error
      alert(`Error submitting question: ${error instanceof Error ? error.message : 'Unknown error'}. You may need to start a new session.`);
    } finally {
      setIsLoading(false);
    }
  };

  const completeSession = async () => {
    if (!session) return;

    try {
      const res = await fetch(`/api/sessions/${session.id}/complete`, {
        method: 'POST'
      });

      const summary = await res.json();

      // Calculate overall session feedback similar to individual rounds
      const avgScore = Math.round(turns.reduce((sum, turn) => sum + (turn.feedback?.score || 0), 0) / Math.max(turns.length, 1));

      // Create comprehensive session feedback
      const enhancedSummary = {
        ...summary,
        overallScore: avgScore,
        totalRounds: turns.length,
        sessionFeedback: {
          strengths: "You demonstrated consistent engagement and thoughtful questioning throughout the session.",
          improvement: "Continue practicing to develop even deeper inquiry skills and follow-up techniques.",
          overallNote: `Completed ${turns.length} rounds with an average score of ${avgScore}/100. Your questioning skills are developing well.`
        }
      };

      setSessionSummary(enhancedSummary);
      setGameState('completed');
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const resetSession = () => {
    setGameState('scenario-selection');
    setSession(null);
    setCurrentScenario(null);
    setCurrentRound(1);
    setQuestion("");
    setTurns([]);
    setSessionSummary(null);
  };

  if (gameState === 'scenario-selection') {
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
          <h1 className="text-4xl font-bold" style={{fontFamily: 'Georgia, serif', color: '#1D1B20'}}>Roga Sessions</h1>
          <p className="text-lg text-coal/70 mt-2">Choose your conversation scenario for a 5-round dialogue</p>
        </div>

        {/* SCENARIO SELECTION */}
        <div className="max-w-4xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SCENARIOS.map((scenario) => (
              <div key={scenario.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => startSession(scenario)}>
                <Card className="p-6">
                  <h2 className="font-display font-bold text-xl mb-4">{scenario.title}</h2>
                  <Button 
                    className="mt-4 text-sm px-6 py-2 border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? "Starting..." : "Start Session"}
                  </Button>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (gameState === 'completed' && sessionSummary) {
    return (
      <main className="min-h-screen bg-fog text-coal">
        {/* HEADER */}
        <header className="w-full relative" style={{backgroundColor: '#20B2AA'}}>
          <div className="absolute top-20 flex items-center justify-between w-full" style={{left: '86px', right: '86px', width: 'calc(100% - 172px)'}}>
            <div className="flex items-center gap-4">
              <BrandMark size={80} />
              <span className="text-white" style={{fontFamily: 'Georgia, serif', fontSize: '6rem', color: 'white'}}>roga</span>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={completeSession}
                variant="ghost"
                className="text-lg px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-teal-600"
              >
                End Session
              </Button>
              <Button
                onClick={resetSession}
                variant="ghost"
                className="text-lg px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-teal-600"
              >
                ← New Session
              </Button>
            </div>
          </div>
          <div className="h-160" style={{height: '135px'}}></div>
        </header>

        <div className="max-w-4xl mx-auto px-8 mt-12">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4" style={{fontFamily: 'Georgia, serif'}}>Session Complete! 🎉</h2>
              <p className="text-lg text-gray-600">{sessionSummary.sessionFeedback?.overallNote}</p>
            </div>

            {/* Overall Session Feedback - Same style as round feedback */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Overall Session Performance</h3>
                <span className="text-3xl font-bold text-teal">{sessionSummary.overallScore || 0}/100</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">Strengths:</h4>
                  <p className="text-sm text-gray-700">{sessionSummary.sessionFeedback?.strengths}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">Areas for Growth:</h4>
                  <p className="text-sm text-gray-700">{sessionSummary.sessionFeedback?.improvement}</p>
                </div>
              </div>
            </div>

            {/* Best Question Section */}
            <div className="mb-8">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-amber-800">🌟 Your Best Question:</h3>
                <p className="italic text-gray-800">&ldquo;{sessionSummary.bestQuestion}&rdquo;</p>
              </div>
            </div>

            {/* Badges Section */}
            {sessionSummary.badges && sessionSummary.badges.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold mb-3 text-center">Badges Earned:</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {sessionSummary.badges.map((badge, index) => (
                    <span key={index} className="bg-violet/10 text-violet px-4 py-2 rounded-full text-sm font-medium">
                      🏆 {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Button onClick={resetSession} className="text-lg px-8 py-4 border-0">
                Start New Session
              </Button>
              <Link href="/">
                <Button
                  variant="ghost"
                  className="text-lg px-8 py-4 bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // Playing state - chat interface
  return (
    <main className="min-h-screen bg-fog text-coal">
      {/* HEADER */}
      <header className="w-full relative" style={{backgroundColor: '#20B2AA'}}>
        <div className="absolute top-20 flex items-center justify-between w-full" style={{left: '86px', right: '86px', width: 'calc(100% - 172px)'}}>
          <div className="flex items-center gap-4">
            <BrandMark size={80} />
            <span className="text-white" style={{fontFamily: 'Georgia, serif', fontSize: '6rem', color: 'white'}}>roga</span>
          </div>
          <Button 
            onClick={resetSession}
            variant="ghost" 
            className="text-lg px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-teal-600"
          >
            ← New Session
          </Button>
        </div>
        <div className="h-160" style={{height: '135px'}}></div>
      </header>

      {/* PROGRESS */}
      <div className="text-center" style={{marginTop: '50px', marginBottom: '20px'}}>
        <h1 className="text-3xl font-bold mb-2" style={{fontFamily: 'Georgia, serif', color: '#1D1B20'}}>
          {currentScenario?.title}
        </h1>
        <p className="text-base text-coal/70 mb-4" style={{marginTop: '-3px'}}>
          This is a chance to practice asking deeper, more strategic questions over several rounds.
        </p>
        <div className="text-lg text-coal/70">
          Round {currentRound} of {session?.roundsPlanned || 5}
        </div>
        <div className="flex justify-center mt-4">
          <div className="flex gap-2">
            {Array.from({length: session?.roundsPlanned || 5}).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < currentRound - 1 ? 'bg-teal' :
                  index === currentRound - 1 ? 'bg-teal/50' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="max-w-4xl mx-auto px-8">
        <div className="space-y-6">
          {/* Previous turns */}
          {turns.map((turn, index) => (
            <Card key={index} className="p-6">
              <div className="space-y-4">
                {/* User question */}
                <div className="mb-4">
                  <div className="border-2 border-teal-500 rounded-lg p-4 bg-teal-50">
                    <div className="text-xs text-teal-700 mb-2 font-semibold">You asked:</div>
                    <div className="text-gray-800">{turn.question}</div>
                  </div>
                </div>

                {/* Character reply */}
                <div className="mb-4">
                  <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                    <div className="text-xs text-blue-700 mb-2 font-semibold">
                      {session?.persona === "teacher_mentor" ? "Mentor's response:" :
                       session?.persona === "business_coach" ? "Coach's response:" :
                       `${currentScenario?.title}:`}
                    </div>
                    <div className="text-gray-800">
                      {turn.characterReply && turn.characterReply.trim()
                        ? turn.characterReply
                        : `[Round ${turn.round}] That's a thoughtful question that touches on some important considerations. In my experience, the most successful professionals are those who actively seek clarity and take ownership of their development. I've found that the best outcomes often come from combining strategic thinking with practical action steps.`}
                    </div>
                  </div>
                </div>

                {/* Feedback section */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Round {turn.round} Feedback</h3>
                    <span className="text-2xl font-bold text-teal">{turn.feedback.score}</span>
                  </div>

                  {turn.feedback.suggestedUpgrade && (
                    <div className="mb-3">
                      <h4 className="font-semibold mb-1 text-green-700">Suggested Upgrade:</h4>
                      <p className="text-sm text-gray-700">{turn.feedback.suggestedUpgrade}</p>
                    </div>
                  )}

                  {turn.feedback.proTip && (
                    <div className="mb-3">
                      <h4 className="font-semibold mb-1 text-blue-700">Pro Tip:</h4>
                      <p className="text-sm text-gray-700">{turn.feedback.proTip}</p>
                    </div>
                  )}

                  {/* V2 Enhanced Fields */}
                  {turn.feedback.contextSpecificTip && (
                    <div className="mb-3">
                      <h4 className="font-semibold mb-1 text-purple-700">Context Tip:</h4>
                      <p className="text-sm text-gray-700">{turn.feedback.contextSpecificTip}</p>
                    </div>
                  )}

                  {turn.feedback.likelyResponse && (
                    <div className="mb-3">
                      <h4 className="font-semibold mb-1 text-orange-700">Likely Response:</h4>
                      <p className="text-sm text-gray-700 italic">{turn.feedback.likelyResponse}</p>
                    </div>
                  )}

                  {turn.feedback.nextQuestionSuggestions && turn.feedback.nextQuestionSuggestions.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-semibold mb-1 text-indigo-700">Follow-ups you could try:</h4>
                      <ul className="list-disc pl-6 text-sm text-gray-700">
                        {turn.feedback.nextQuestionSuggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {typeof turn.feedback.empathyScore === "number" && (
                    <div className="mb-3">
                      <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">
                        💝 Empathy Score: {turn.feedback.empathyScore}/25
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {turn.feedback.rubric.map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'good' ? 'bg-green-500' :
                          item.status === 'warn' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-medium">{item.label}:</span>
                        <span className="text-gray-600">{item.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {/* Current question input */}
          {currentRound <= (session?.roundsPlanned || 5) && (
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Round {currentRound}</h3>
              
              {/* Scenario Description */}
              {currentRound === 1 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border" style={{marginTop: '-5px', marginBottom: '1rem'}}>
                  <h4 className="font-semibold mb-2 text-gray-700" style={{marginTop: '-2px'}}>Your Scenario:</h4>
                  <p className="text-gray-700 text-sm leading-relaxed" style={{marginTop: '-17px'}}>
                    {currentScenario?.scene?.split('. This is a chance to practice asking deeper, more strategic questions over several rounds.')[0]}.
                  </p>
                </div>
              )}
              
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={currentRound === 1 ? "Start with your opening question..." : "Ask a follow-up question based on the conversation..."}
                className="w-full min-h-[120px] rounded-xl border border-coal/20 bg-white p-4 text-coal placeholder:text-coal/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(123,97,255,0.35)]"
                disabled={isLoading}
              />
              
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={(e) => {
                    console.log('Button clicked!', e);
                    console.log('Button disabled?', isLoading || !question.trim());
                    console.log('About to call submitTurn...');
                    
                    try {
                      submitTurn().catch(error => {
                        console.error('Uncaught error in submitTurn:', error);
                        alert(`Uncaught error: ${error}`);
                      });
                    } catch (syncError) {
                      console.error('Synchronous error calling submitTurn:', syncError);
                      alert(`Sync error: ${syncError}`);
                    }
                  }}
                  disabled={isLoading || !question.trim()}
                  className="text-lg px-8 py-4 border-0"
                >
                  {isLoading ? "Processing..." : "Submit Question"}
                </Button>
              </div>
            </Card>
          )}

          {/* Session Completion Message */}
          {currentRound > (session?.roundsPlanned || 5) && (
            <Card className="p-6 text-center">
              <h3 className="font-bold text-xl mb-4">Session Complete!</h3>
              <p className="text-gray-600 mb-6">
                You've completed all {session?.roundsPlanned || 5} rounds. Review your conversation above and click below to see your overall performance.
              </p>
              <Button
                onClick={completeSession}
                className="text-lg px-8 py-4 border-0"
              >
                View Session Summary
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-fog border-t border-black/5 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-coal/70">
          <p>Roga Sessions • v1 • powered by gpt-4o-mini</p>
          <nav className="flex gap-4">
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}