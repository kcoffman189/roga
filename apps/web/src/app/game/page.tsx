"use client";

import { useState } from "react";
import scenarios from "@/data/scenarios.json";

export default function GamePage() {
  // Pick 5 random scenarios for the day
  const dailyScenarios = scenarios
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);

  const [index, setIndex] = useState(0);
  const [userQuestion, setUserQuestion] = useState("");
  const [feedback, setFeedback] = useState("");

  const scenario = dailyScenarios[index];

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_question: userQuestion }),
      });
      const data = await response.json();
      setFeedback(data.answer);
    } catch (err) {
      setFeedback("Error: Could not fetch feedback.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quick Challenge</h1>
      <p className="mb-4">{scenario.prompt}</p>

      <textarea
        value={userQuestion}
        onChange={(e) => setUserQuestion(e.target.value)}
        placeholder="Type your question here..."
        className="w-full p-2 border rounded mb-4"
      />

      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Submit
        </button>
        <button
          onClick={() => {
            setUserQuestion("");
            setFeedback("");
            setIndex((index + 1) % dailyScenarios.length);
          }}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Next Scenario
        </button>
      </div>

      {feedback && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <strong>Feedback:</strong>
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
}
