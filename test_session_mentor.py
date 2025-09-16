#!/usr/bin/env python3
"""
Test script for Roga Sessions Coaching Update - Question-free mentor responses
Tests that mentor responses never contain questions and are ≤4 sentences
"""

import requests
import json
import re
import time

# Configuration
API_BASE_URL = "https://roga-api.fly.dev"
TEST_QUESTIONS = [
    "What skills should I focus on developing this year?",
    "How do I know if I'm asking good questions?",
    "What's the biggest mistake people make in conversations?",
    "Can you help me understand what I should prioritize?",
    "I'm confused about my career direction"
]

# Question detection regex (same as in backend)
QUESTION_REGEX = re.compile(
    r"(\?|(?:^|\b)(who|what|when|where|why|how|which|could|would|should|did|do|does|are|is|can)\b.*[.?!]$)",
    re.IGNORECASE | re.MULTILINE
)

def contains_question(text: str) -> bool:
    """Check if text contains questions"""
    return bool(QUESTION_REGEX.search(text))

def count_sentences(text: str) -> int:
    """Count sentences in text"""
    sentences = re.split(r'[.!?]+', text.strip())
    return len([s for s in sentences if s.strip()])

def test_session_creation():
    """Test creating a session"""
    print("Testing session creation...")

    payload = {
        "persona": "teacher_mentor",
        "topic": "Career development conversation",
        "difficulty": "intermediate",
        "roundsPlanned": 3
    }

    response = requests.post(f"{API_BASE_URL}/sessions", json=payload)
    print(f"Session creation status: {response.status_code}")

    if response.status_code == 200:
        session_data = response.json()
        session_id = session_data["id"]
        print(f"Created session: {session_id}")
        return session_id
    else:
        print(f"Failed to create session: {response.text}")
        return None

def test_mentor_responses(session_id: str):
    """Test mentor responses for question-free output"""
    print(f"\nTesting mentor responses for session: {session_id}")
    results = []

    for round_num, question in enumerate(TEST_QUESTIONS[:3], 1):  # Test 3 rounds
        print(f"\nRound {round_num}: Testing question: '{question}'")

        payload = {
            "round": round_num,
            "question": question,
            "priorSummary": f"Round {round_num-1} completed" if round_num > 1 else "",
            "context": "business"
        }

        start_time = time.time()
        response = requests.post(f"{API_BASE_URL}/sessions/{session_id}/turns", json=payload)
        latency = int((time.time() - start_time) * 1000)

        if response.status_code == 200:
            data = response.json()
            mentor_reply = data["characterReply"]

            # Test criteria
            has_questions = contains_question(mentor_reply)
            sentence_count = count_sentences(mentor_reply)

            result = {
                "round": round_num,
                "question": question,
                "mentor_reply": mentor_reply,
                "has_questions": has_questions,
                "sentence_count": sentence_count,
                "latency_ms": latency,
                "passed": not has_questions and sentence_count <= 4
            }

            results.append(result)

            # Print result
            status = "✅ PASS" if result["passed"] else "❌ FAIL"
            print(f"{status} - Round {round_num}")
            print(f"  Mentor reply: {mentor_reply}")
            print(f"  Questions detected: {has_questions}")
            print(f"  Sentence count: {sentence_count}/4")
            print(f"  Latency: {latency}ms")

            if has_questions:
                print(f"  ⚠️  FAILED: Contains questions!")
            if sentence_count > 4:
                print(f"  ⚠️  FAILED: Too many sentences ({sentence_count} > 4)")

        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            results.append({
                "round": round_num,
                "question": question,
                "error": response.text,
                "passed": False
            })

    return results

def print_summary(results):
    """Print test summary"""
    print("\n" + "="*60)
    print("ROGA SESSIONS MENTOR TEST SUMMARY")
    print("="*60)

    total_tests = len(results)
    passed_tests = sum(1 for r in results if r.get("passed", False))

    print(f"Total tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success rate: {(passed_tests/total_tests*100):.1f}%")

    print("\nValidation Results:")

    question_free_count = sum(1 for r in results if not r.get("has_questions", True))
    print(f"✅ Question-free responses: {question_free_count}/{total_tests}")

    sentence_count_ok = sum(1 for r in results if r.get("sentence_count", 999) <= 4)
    print(f"✅ Sentence count ≤4: {sentence_count_ok}/{total_tests}")

    if results:
        avg_latency = sum(r.get("latency_ms", 0) for r in results) / len(results)
        print(f"📊 Average latency: {avg_latency:.0f}ms")

    print(f"\n{'🎉 ALL TESTS PASSED!' if passed_tests == total_tests else '⚠️  SOME TESTS FAILED'}")

    return passed_tests == total_tests

def main():
    """Run the complete test suite"""
    print("Roga Sessions Mentor Response Test Suite")
    print("="*60)
    print("Testing question-free mentor responses (≤4 sentences, no questions)")

    # Create session
    session_id = test_session_creation()
    if not session_id:
        print("❌ Cannot continue without session")
        return False

    # Test mentor responses
    results = test_mentor_responses(session_id)

    # Print summary
    success = print_summary(results)

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)