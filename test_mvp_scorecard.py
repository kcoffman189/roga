#!/usr/bin/env python3
"""
Test script for MVP ScoreCard Implementation
Tests the new 5-part feedback structure as specified in the MVP Development Brief.
"""

import json
import requests
import sys
from typing import Dict, Any

# Configuration
API_BASE_URL = "https://roga-api.fly.dev"  # or "http://localhost:8000" for local testing
TEST_SCENARIOS = [
    {
        "title": "Class Instructions",
        "text": "Your teacher explains a project, but you're still not sure what to do. The teacher is about to move on to the next part of class. What question could you ask to make the directions clearer before it's too late?",
        "questions": [
            "Wait, what?",
            "What exactly do you want us to include in the project?",
            "Can you clarify what the final deliverable should look like?",
            "I'm confused about the timeline - when is each part due?"
        ]
    },
    {
        "title": "Team Meeting",
        "text": "Your manager mentions a new initiative in passing during a busy team meeting. You think it might affect your current project, but you're not certain. What question could you ask to understand the impact?",
        "questions": [
            "How does this affect my current work?",
            "What specific changes should I expect to my project timeline?",
            "Who should I coordinate with on this new initiative?",
            "What's the priority level compared to my existing tasks?"
        ]
    }
]

def test_mvp_scorecard(scenario_title: str, scenario_text: str, question: str) -> Dict[str, Any]:
    """Test the new MVP ScoreCard endpoint"""
    url = f"{API_BASE_URL}/coach/mvp"
    payload = {
        "user_question": question,
        "scenario_title": scenario_title,
        "scenario_text": scenario_text
    }

    print(f"\n{'='*60}")
    print(f"Testing MVP ScoreCard endpoint: {url}")
    print(f"Scenario: {scenario_title}")
    print(f"Question: '{question}'")
    print(f"{'='*60}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("\n📊 MVP SCORECARD RESULT:")
            print("─" * 40)

            feedback = result.get("feedback", {})

            # Overall Score
            score = feedback.get("score", 0)
            print(f"Overall Score: {score}/100")

            # Rubric Breakdown
            rubric = feedback.get("rubric", {})
            print(f"📋 Rubric Breakdown:")
            print(f"  • Clarity: {rubric.get('clarity', 0)}/100")
            print(f"  • Depth: {rubric.get('depth', 0)}/100")
            print(f"  • Curiosity: {rubric.get('curiosity', 0)}/100")
            print(f"  • Relevance: {rubric.get('relevance', 0)}/100")
            print(f"  • Empathy: {rubric.get('empathy', 0)}/100")

            # 5-Part Feedback Structure
            print(f"\n✨ Positive Reinforcement:")
            print(f"   {feedback.get('positive_reinforcement', 'N/A')}")

            print(f"\n🎯 Dimension Focus:")
            print(f"   {feedback.get('dimension_focus', 'N/A')}")

            print(f"\n💡 Pro Tip:")
            print(f"   {feedback.get('pro_tip', 'N/A')}")

            print(f"\n⚡ Suggested Upgrade:")
            print(f"   \"{feedback.get('suggested_upgrade', 'N/A')}\"")

            # Meta information
            meta = result.get("meta", {})
            print(f"\n📄 Meta Info:")
            print(f"   Schema: {result.get('schema', 'N/A')}")
            print(f"   Brand Check: {'✓' if meta.get('brand_check') else '✗'}")
            print(f"   Length OK: {'✓' if meta.get('length_ok') else '✗'}")
            print(f"   Hash: {meta.get('hash', 'N/A')}")

            # Validation checks
            print(f"\n🔍 Validation Checks:")
            checks_passed = 0
            total_checks = 7

            # Check required fields
            if feedback.get('positive_reinforcement'):
                print("   ✓ Positive reinforcement present")
                checks_passed += 1
            else:
                print("   ✗ Positive reinforcement missing")

            if feedback.get('dimension_focus'):
                print("   ✓ Dimension focus present")
                checks_passed += 1
            else:
                print("   ✗ Dimension focus missing")

            if feedback.get('pro_tip'):
                print("   ✓ Pro tip present")
                checks_passed += 1
            else:
                print("   ✗ Pro tip missing")

            if feedback.get('suggested_upgrade'):
                print("   ✓ Suggested upgrade present")
                checks_passed += 1
            else:
                print("   ✗ Suggested upgrade missing")

            if isinstance(score, int) and 0 <= score <= 100:
                print("   ✓ Valid score (0-100)")
                checks_passed += 1
            else:
                print("   ✗ Invalid score")

            if rubric and all(isinstance(rubric.get(k), int) and 0 <= rubric.get(k) <= 100
                            for k in ['clarity', 'depth', 'curiosity', 'relevance', 'empathy']):
                print("   ✓ Valid rubric scores")
                checks_passed += 1
            else:
                print("   ✗ Invalid rubric scores")

            # Check for contextualization (user's words referenced)
            user_words_referenced = any(word.lower() in feedback.get('positive_reinforcement', '').lower()
                                      for word in question.split())
            if user_words_referenced:
                print("   ✓ User's words referenced in feedback")
                checks_passed += 1
            else:
                print("   ✗ User's words not clearly referenced")

            print(f"\n📈 Validation Score: {checks_passed}/{total_checks} checks passed")

            return result
        else:
            print(f"❌ Error: {response.text}")
            return {}

    except Exception as e:
        print(f"❌ Request failed: {e}")
        return {}

def run_comprehensive_test():
    """Run comprehensive test of MVP ScoreCard functionality"""
    print("🎯 MVP SCORECARD COMPREHENSIVE TEST")
    print("Testing new 5-part feedback structure implementation")

    all_results = []

    for scenario in TEST_SCENARIOS:
        for question in scenario["questions"]:
            result = test_mvp_scorecard(
                scenario["title"],
                scenario["text"],
                question
            )
            if result:
                all_results.append({
                    "scenario": scenario["title"],
                    "question": question,
                    "result": result
                })

    print(f"\n{'='*60}")
    print(f"📊 SUMMARY: Tested {len(all_results)} questions across {len(TEST_SCENARIOS)} scenarios")

    if all_results:
        avg_score = sum(r["result"]["feedback"]["score"] for r in all_results) / len(all_results)
        print(f"📈 Average Score: {avg_score:.1f}/100")

        # Check if all responses have the 5-part structure
        complete_responses = sum(1 for r in all_results
                               if all(r["result"]["feedback"].get(field) for field in
                                    ["positive_reinforcement", "dimension_focus", "pro_tip", "suggested_upgrade"]))

        print(f"✅ Complete 5-part responses: {complete_responses}/{len(all_results)}")

        if complete_responses == len(all_results):
            print("🎉 SUCCESS: All responses contain the complete 5-part structure!")
        else:
            print("⚠️  WARNING: Some responses missing parts of the 5-part structure")

    print("="*60)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "single":
        # Single test
        test_mvp_scorecard(
            "Class Instructions",
            "Your teacher explains a project, but you're still not sure what to do. The teacher is about to move on to the next part of class. What question could you ask to make the directions clearer before it's too late?",
            "What exactly do you want us to include in the project?"
        )
    else:
        # Comprehensive test
        run_comprehensive_test()