#!/usr/bin/env python3
"""
Comprehensive test script for Enhanced Daily Challenge Coaching v3
Tests the new 6-part framework with detailed skill feedback and stricter scoring.
"""

import json
import requests
import sys
from typing import Dict, Any

# Configuration
API_BASE_URL = "https://roga-api.fly.dev"  # or "http://localhost:8000" for local testing
TEST_SCENARIO = "Your teacher explains a project, but you're still not sure what to do. The teacher is about to move on to the next part of class. What question could you ask to make the directions clearer before it's too late?"

# Test cases covering different skill levels
TEST_CASES = [
    {
        "name": "Vague Question (Should Score ≤2)",
        "question": "Wait, what?",
        "expected_overall": 2,
        "expected_issues": ["too_vague", "closed_question"],
        "expected_skill": "clarifying"
    },
    {
        "name": "Better Clarifying Question",
        "question": "Which step in the project should we complete first?",
        "expected_overall": 4,
        "expected_issues": [],
        "expected_skill": "clarifying"
    },
    {
        "name": "Probing Question",
        "question": "Why is this project important for our learning goals?",
        "expected_overall": 4,
        "expected_issues": [],
        "expected_skill": "probing"
    },
    {
        "name": "Closed Question (Should Score ≤2)",
        "question": "Is this due tomorrow?",
        "expected_overall": 2,
        "expected_issues": ["closed_question"],
        "expected_skill": "closed_question"
    }
]

def test_v3_classification(scenario: str, question: str) -> Dict[str, Any]:
    """Test the enhanced classification endpoint"""
    url = f"{API_BASE_URL}/classify"
    payload = {
        "scenario_text": scenario,
        "user_question": question
    }

    print(f"Testing V3 classification: {url}")
    print(f"Question: '{question}'")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"Classification Result: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Error: {response.text}")
            return {}

    except Exception as e:
        print(f"Request failed: {e}")
        return {}

def test_v3_coaching(scenario: str, question: str, classification: Dict[str, Any]) -> Dict[str, Any]:
    """Test the enhanced v3 coaching endpoint"""
    url = f"{API_BASE_URL}/coach/v3"
    payload = {
        "scenario_text": scenario,
        "user_question": question,
        "classification": classification
    }

    print(f"\\nTesting V3 coaching: {url}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"V3 Coaching Result: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Error: {response.text}")
            return {}

    except Exception as e:
        print(f"Request failed: {e}")
        return {}

def test_v3_full_pipeline(scenario: str, question: str) -> Dict[str, Any]:
    """Test the complete v3 pipeline"""
    url = f"{API_BASE_URL}/daily-challenge-feedback/v3"
    payload = {
        "scenario_text": scenario,
        "user_question": question
    }

    print(f"\\nTesting V3 full pipeline: {url}")

    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"V3 Full Pipeline Result: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Error: {response.text}")
            return {}

    except Exception as e:
        print(f"Request failed: {e}")
        return {}

def validate_v3_requirements(test_case: Dict, classification: Dict[str, Any], coaching: Dict[str, Any]):
    """Validate V3 enhanced requirements"""
    print(f"\\n" + "="*70)
    print(f"V3 VALIDATION: {test_case['name']}")
    print("="*70)

    validation_results = []

    if classification:
        issues = classification.get("issues", [])
        scores = classification.get("scores", {})
        overall = scores.get("overall", 0)

        # V3 Requirement: Stricter scoring enforcement
        if test_case["expected_overall"] <= 2:
            if overall <= 2:
                validation_results.append(f"✅ Strict scoring: Overall score {overall}/5 properly capped (≤2)")
            else:
                validation_results.append(f"❌ Strict scoring failed: Overall score {overall}/5 should be ≤2")

        # Check for expected issues
        for expected_issue in test_case["expected_issues"]:
            if expected_issue in issues:
                validation_results.append(f"✅ Classification correctly identified '{expected_issue}'")
            else:
                validation_results.append(f"❌ Classification missed '{expected_issue}' issue")

        # Check skill detection
        detected_skills = classification.get("detected_skills", [])
        if detected_skills and test_case["expected_skill"] in detected_skills[0].lower():
            validation_results.append(f"✅ Correctly detected '{test_case['expected_skill']}' skill")
        else:
            validation_results.append(f"❌ Expected '{test_case['expected_skill']}' skill, got {detected_skills}")

    if coaching:
        # V3 Requirement: Enhanced 6-part framework validation
        required_fields = [
            "qi_score", "skill_feedback", "skill_detected",
            "strengths", "improvement_area", "coaching_nugget",
            "example_upgrades", "progress_note"
        ]

        for field in required_fields:
            if field in coaching:
                validation_results.append(f"✅ Enhanced framework: '{field}' field present")
            else:
                validation_results.append(f"❌ Enhanced framework: Missing '{field}' field")

        # V3 Requirement: Detailed skill feedback
        skill_feedback = coaching.get("skill_feedback", {})
        if skill_feedback:
            for skill in ["clarity", "depth", "relevance", "empathy"]:
                if skill in skill_feedback and len(skill_feedback[skill]) > 20:
                    validation_results.append(f"✅ Detailed {skill} feedback provided")
                else:
                    validation_results.append(f"❌ {skill} feedback missing or too brief")

        # V3 Requirement: skill_detected format with quality rating
        skill_detected = coaching.get("skill_detected", "")
        if "(" in skill_detected and ")" in skill_detected:
            validation_results.append("✅ skill_detected follows enhanced format with quality rating")
        else:
            validation_results.append("❌ skill_detected should include quality rating in parentheses")

        # V3 Requirement: Enhanced example upgrades
        examples = coaching.get("example_upgrades", [])
        if len(examples) >= 2:
            validation_results.append(f"✅ Provided {len(examples)} example upgrades (≥2 required)")

            # Check if examples are questions
            question_count = sum(1 for ex in examples if ex.strip().endswith("?"))
            if question_count >= 2:
                validation_results.append(f"✅ {question_count} examples are properly formatted as questions")
            else:
                validation_results.append(f"❌ Examples should be phrased as questions")
        else:
            validation_results.append("❌ Should provide at least 2 example upgrades")

        # V3 Requirement: progress_note with gamification
        progress_note = coaching.get("progress_note", "")
        if progress_note and any(char in progress_note for char in ["🌟", "🎯", "🚀", "Level", "→"]):
            validation_results.append("✅ Progress note includes gamified elements")
        else:
            validation_results.append("❌ Progress note should include gamified/motivational elements")

        # V3 Requirement: Enhanced word count constraint
        all_feedback_text = f"{coaching.get('strengths', '')} {coaching.get('improvement_area', '')} {coaching.get('coaching_nugget', '')}"
        word_count = len(all_feedback_text.split())
        if word_count <= 120:
            validation_results.append(f"✅ Word count {word_count} within enhanced limit (≤120)")
        else:
            validation_results.append(f"❌ Word count {word_count} exceeds enhanced limit (≤120)")

    for result in validation_results:
        print(result)

    # Summary
    passed = sum(1 for r in validation_results if r.startswith("✅"))
    total = len(validation_results)
    print(f"\\nV3 Enhanced Validation Summary: {passed}/{total} checks passed")

    return passed == total

def main():
    print("Enhanced Daily Challenge Coaching v3 - Comprehensive Test Suite")
    print("=" * 80)
    print(f"Testing with scenario: {TEST_SCENARIO}")
    print("=" * 80)

    all_tests_passed = True

    for test_case in TEST_CASES:
        print(f"\\n🧪 TESTING: {test_case['name']}")
        print("-" * 50)

        # Test individual endpoints
        classification = test_v3_classification(TEST_SCENARIO, test_case["question"])

        if classification:
            coaching = test_v3_coaching(TEST_SCENARIO, test_case["question"], classification)
        else:
            coaching = {}

        # Test full v3 pipeline
        full_result = test_v3_full_pipeline(TEST_SCENARIO, test_case["question"])

        # Validate requirements
        if classification and coaching:
            test_passed = validate_v3_requirements(test_case, classification, coaching)
            if not test_passed:
                all_tests_passed = False
        else:
            print(f"❌ {test_case['name']}: API endpoints not accessible")
            all_tests_passed = False

        print("\\n" + "="*50)

    # Final summary
    print(f"\\n{'🎉 ALL V3 ENHANCED TESTS PASSED!' if all_tests_passed else '⚠️  SOME V3 TESTS FAILED'}")

    if all_tests_passed:
        print("\\n✨ Enhanced Daily Challenge Coaching v3 is working correctly!")
        print("Features validated:")
        print("✅ 6-part coaching framework with detailed skill feedback")
        print("✅ Stricter scoring rules with proper caps")
        print("✅ Enhanced skill-specific explanations")
        print("✅ Quality ratings and gamified progress notes")
        print("✅ Comprehensive example upgrades")

    return 0 if all_tests_passed else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)